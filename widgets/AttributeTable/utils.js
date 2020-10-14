///////////////////////////////////////////////////////////////////////////
// Copyright © Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////

define(['dojo/_base/lang',
  'dojo/_base/array',
  'jimu/LayerInfos/LayerInfos',
  'dojo/Deferred',
  'dojo/promise/all',
  'exports',
  "dojo/store/Observable",
  "dojo/store/Cache",
  "dojo/store/Memory",
  "esri/lang",
  './table/FeatureLayerQueryStore',
  "jimu/ArcadeUtils",
  'jimu/utils',
  'esri/graphic',
  'dojo/i18n!./nls/strings'
], function(
  lang, array, LayerInfos, Deferred, all,
  exports, Observable, Cache, Memory, esriLang,
  FeatureLayerQueryStore, ArcadeUtils, utils, Graphic, nls
) {
  exports.readLayerInfosObj = function(map) {
    return LayerInfos.getInstance(map, map.itemInfo);
  };

  /*
  original: boolean; if true only get layerinfos from data of webmap;
  excludeMapNotes: boolean; if true exclude map notes.

  resovlue layerinfos array
   */
  exports.readLayerInfosFromMap = function(map, original, excludeMapNotes) {
    var def = new Deferred();
    LayerInfos.getInstance(map, map.itemInfo).then(lang.hitch(this, function(layerInfosObj) {
      var layerInfos = [];
      if (original) {
        layerInfosObj.traversalLayerInfosOfWebmap(function(layerInfo) {
          layerInfos.push(layerInfo);
        });
      } else {
        layerInfosObj.traversal(function(layerInfo) {
          layerInfos.push(layerInfo);
        });
      }


      if (excludeMapNotes) {
        var mapNoteIds = [];
        var mnLayerInfos = layerInfosObj.getMapNotesLayerInfoArray();
        array.forEach(mnLayerInfos, function(mnLayerInfo) {
          mapNoteIds.push(mnLayerInfo.id);
          mnLayerInfo.traversal(function(mnLayerInfo) {
            mapNoteIds.push(mnLayerInfo.id);
          });
        });
        layerInfos = array.filter(layerInfos, function(layerInfo) {
          return mapNoteIds.indexOf(layerInfo.id) === -1;
        });
      }

      var tableInfos = layerInfosObj.getTableInfoArray();
      layerInfos = layerInfos.concat(tableInfos);

      def.resolve(layerInfos);
    }), lang.hitch(this, function(err) {
      console.error(err);
      def.reject(err);
    }));

    return def.promise;
  };

  //return {selectionHandle,field0,field1,...}
  //used to create dgrid
  //
  //pInfos: PopupInfo
  exports.generateColumnsFromFields = function(gridColumns, layerInfo, fields, typeIdField, types,
    supportsOrder, supportsStatistics, layerObject) {
    function getFormatInfo(field) {
      var fieldName = field.name;
      if (pInfos && esriLang.isDefined(pInfos.fieldInfos)) {
        for (var i = 0, len = pInfos.fieldInfos.length; i < len; i++) {
          var f = pInfos.fieldInfos[i];
          if (f.fieldName === fieldName && f.format) {
            return f.format;
          }
        }
      }
      // use default format from Portal instead:
      var defaultFormatInfo = utils.getDefaultPortalFieldInfo(field);
      if(defaultFormatInfo && defaultFormatInfo.format) {
        return defaultFormatInfo.format;
      }

      return null;
    }

    function getIsHidden(techFieldName, field) {
      // Overriding order of column's "hidden" property:
      // grid's column settings --> Attribute Table's settings -->
      // Field configuration from map popup --> default field visibilities from the layer / table
      if(gridColumns && gridColumns[techFieldName]) {
        return gridColumns[techFieldName].hidden;
      } else if (field) {
        return !field.show && esriLang.isDefined(field.show);
      } else {
        return false;
      }
    }

    var pInfos = layerInfo.getPopupInfo() || 
    layerInfo.getPopupInfoFromLayerObject &&layerInfo.getPopupInfoFromLayerObject();

    var columns = {};
    columns.selectionHandle = {
      label: "",
      className: "selection-handle-column",
      hidden: false,
      unhidable: true, // if true the field never display in toogle column menu
      field: null,
      sortable: false, // prevent default behavior of dgrid
      _cache: { // control the menu item when click the column of dgrid
        sortable: false,
        statistics: false
      },
      renderCell: function(object, value, node) {
        node.setAttribute('role', 'button');
        node.setAttribute('title', nls.selectionHandleLabel);
      }

      // get: function(){}, get value for cell
      // formatter: function(){}, format value of cell
    };
    array.forEach(fields, lang.hitch(exports, function(_field, i, fields) {
      var techFieldName = "field" + i;
      var isDomain = !!_field.domain;
      var isDate = _field.type === "esriFieldTypeDate";
      var isTypeIdField = typeIdField && (_field.name === typeIdField);
      var isNumber = _field.type === "esriFieldTypeDouble" ||
        _field.type === "esriFieldTypeSingle" ||
        _field.type === "esriFieldTypeInteger" ||
        _field.type === "esriFieldTypeSmallInteger";
      var isString = _field.type === "esriFieldTypeString";
      var isArcadeExpression = _field.name.indexOf('expression/') === 0;

      columns[techFieldName] = {
        label: _field.alias || _field.name,
        className: techFieldName,
        hidden: fields.length === 1 ? false : getIsHidden(techFieldName, _field),
        unhidable: fields.length === 1 ? false : 
          !_field.show && esriLang.isDefined(_field.show) && _field._pk,
        field: _field.name,
        sortable: false,
        _cache: {
          sortable: !!supportsOrder,
          statistics: supportsStatistics && !isDomain && isNumber
        }
      };


      if (isString) {
        columns[techFieldName].formatter = lang.hitch(exports, exports.urlFormatter);
      } else if (isDate) {
        columns[techFieldName].formatter = lang.hitch(
          exports, exports.dateFormatter, getFormatInfo(_field));
      } else if (isNumber) {
        columns[techFieldName].formatter = lang.hitch(
          exports, exports.numberFormatter, getFormatInfo(_field));
      }

      // obj is feature.attributes in the store.
      if (isDomain) {
        var domainType = _field.domain && _field.domain.type;
        if(domainType === 'range') {
          // range
          columns[techFieldName].get = lang.hitch(exports, function(layerObject, field, obj) {
            return this.getRangeDomainValue(field.name, obj);
          }, layerObject, _field);
        } else {
          // coded value
          columns[techFieldName].get = lang.hitch(exports, function(layerObject, field, obj) {
            return this.getCodeValue(layerObject, field.name, obj);
          }, layerObject, _field);
        }
      } else if(isTypeIdField) {
        columns[techFieldName].get = lang.hitch(exports, function(field, types, obj) {
          return this.getTypeName(obj[field.name], types);
        }, _field, types);
      } else if(isArcadeExpression) {
        var expressionInfos = this.arcade.getExpressionInfosFromLayerInfo(layerInfo);
        var layerDefinition = utils.getFeatureLayerDefinition(layerObject);
        // expression columns are not sotable
        columns[techFieldName]._cache.sortable = false;
        columns[techFieldName].get = lang.hitch(exports, 
          function(expressionInfos, field, layerDefinition, obj) {
          var computedAttrs = this.arcade.getAttributes(obj, expressionInfos, layerDefinition);
          return computedAttrs[field.name] || '';
        }, expressionInfos, _field, layerDefinition);
      } else if (!isDomain && !isDate && !isTypeIdField && !isArcadeExpression) {
        // Not A Date, Domain or Type Field
        // Still need to check for subclass value
        columns[techFieldName].get = lang.hitch(exports,
          function(layerObject, field, typeIdField, types, obj) {
            var codeValue = null;
            if (typeIdField && types && types.length > 0) {
              var typeChecks = array.filter(types, lang.hitch(exports, function(item) {
                // value of typeIdFild has been changed above
                return item.id === obj[typeIdField];
              }));
              var typeCheck = (typeChecks && typeChecks[0]) || null;

              if (typeCheck && typeCheck.domains &&
                typeCheck.domains[field.name] && typeCheck.domains[field.name].codedValues) {
                codeValue = this.getCodeValue(
                  layerObject,
                  field.name,
                  obj
                );
              }
            }
            var _value = codeValue !== null ? codeValue : obj[field.name];
            return _value || isFinite(_value) ? _value : "";
          }, layerObject, _field, typeIdField, types);
      }
    }));

    return columns;
  };

  exports.getTypeName = function(value, types) {
    return utils.fieldFormatter.getTypeName(value, types);
  };

  exports.getCodeValue = function(layerObject, fieldName, attributes) {
    var result = utils.getDisplayValueForCodedValueOrSubtype(layerObject, fieldName, attributes);
    if (result && result.isCodedValueOrSubtype) {
      return result.displayValue || '';
    }
    return '';
  };

  exports.getRangeDomainValue = function(fieldName, attributes) {
    var result = attributes[fieldName];
    if (result) {
      return result;
    }
    return '';
  };

  exports.urlFormatter = function(str) {
    return utils.fieldFormatter.getFormattedUrl(str);
  };

  exports.dateFormatter = function(format, dateNumber) {
    return utils.fieldFormatter.getFormattedDate(dateNumber, format);
  };

  exports.numberFormatter = function(format, num) {
    return utils.fieldFormatter.getFormattedNumber(num, format);
  };

  exports.readLayerObjectsFromMap = function(map, original, excludeMapNotes) {
    var def = new Deferred(),
      defs = [];
    this.readLayerInfosFromMap(map, original, excludeMapNotes)
    .then(lang.hitch(this, function(layerInfos) {
      array.forEach(layerInfos, lang.hitch(this, function(layerInfo) {
        defs.push(layerInfo.getLayerObject());
      }));

      all(defs).then(lang.hitch(this, function(layerObjects) {
        def.resolve(layerObjects);
      }), lang.hitch(this, function(err) {
        def.reject(err);
        console.error(err);
      }));
    }), lang.hitch(this, function(err) {
      def.reject(err);
    }));

    return def.promise;
  };

  // resolve [{
  //      isSupportedLayer: true/false,
  //      isSupportQuery: true/false,
  //      layerType: layerType.
  //    }]
  exports.readSupportTableInfoFromLayerInfos = function(layerInfos) {
    var def = new Deferred();
    var defs = [];
    array.forEach(layerInfos, lang.hitch(this, function(layerInfo) {
      defs.push(layerInfo.getSupportTableInfo());
    }));

    all(defs).then(lang.hitch(this, function(tableInfos) {
      var _tInfos = lang.clone(tableInfos);
      array.forEach(_tInfos, function(tInfo, idx) {
        tInfo.id = layerInfos[idx].id;
      });
      def.resolve(_tInfos);
    }), function(err) {
      def.reject(err);
    });

    return def.promise;
  };

  // get layerInfos array which isSupportedLayer is true;
  exports.readConfigLayerInfosFromMap = function(map, original, excludeMapNotes) {
    var def = new Deferred(),
      defs = [];
    this.readLayerInfosFromMap(map, original, excludeMapNotes)
    .then(lang.hitch(this, function(layerInfos) {
      var ret = [];
      array.forEach(layerInfos, function(layerInfo) {
        defs.push(layerInfo.getSupportTableInfo());
      });

      all(defs).then(lang.hitch(this, function(tableInfos) {
        array.forEach(tableInfos, lang.hitch(this, function(tableInfo, i) {
          if (tableInfo.isSupportedLayer) {
            layerInfos[i].name = layerInfos[i].title;
            ret.push(layerInfos[i]);
          }
        }));

        def.resolve(ret);
      }), lang.hitch(this, function(err) {
        def.reject(err);
      }));
    }), lang.hitch(this, function(err) {
      def.reject(err);
    }));

    return def.promise;
  };

  exports.getConfigInfosFromLayerInfos = function(layerInfos) {
    return array.map(layerInfos, function(layerInfo) {
      return exports.getConfigInfoFromLayerInfo(layerInfo);
    });
  };
  // if config is null, use this method to get default content.
  exports.getConfigInfoFromLayerInfo = function(layerInfo) {
    var json = {};
    json.name = layerInfo.name || layerInfo.title;
    json.id = layerInfo.id;
    json.show = layerInfo.isShowInMap();
    json.layer = {
      url: layerInfo.getUrl()
    };

    var popupInfo = layerInfo.getPopupInfo();
    if (popupInfo && !popupInfo.description) {
      json.layer.fields = array.map(popupInfo.fieldInfos, function(fieldInfo) {
        return {
          name: fieldInfo.fieldName,
          alias: fieldInfo.label,
          show: fieldInfo.visible,
          format: fieldInfo.format
        };
      });

      // remove fields not exist in layerObject.fields
      var layerFields = lang.getObject('layerObject.fields', false, layerInfo);
      json.layer.fields = clipValidFields(json.layer.fields, layerFields);

      var hasVisibleFields = array.some(json.layer.fields, function(f) {
        return f.show;
      });
      if (!hasVisibleFields) {
        //If layer schema changes, the fields info in webmap may not match with the layer field info
        //and the fields array may be empty.
        if(json.layer.fields && json.layer.fields.length > 0){
          json.layer.fields[0].show = true;
        }else{
          console.warn('We do not get fields info.');
        }
      }
    }

    return json;
  };

  exports.generateCacheStore = function(_layer, recordCounts, batchCount, whereClause, extent) {
    var qtStore = new FeatureLayerQueryStore({
      layer: _layer,
      objectIds: _layer._objectIds || null,
      totalCount: recordCounts,
      batchCount: batchCount,
      where: whereClause || "1=1",
      spatialFilter: extent
    });

    var mStore = new Memory();
    return (new Cache(qtStore, mStore, {}));
  };

  exports.generateMemoryStore = function(data, idProperty) {
    return (new Observable(new Memory({
      "data": data || [],
      "idProperty": idProperty
    })));
  };

  exports.merge = function(dest, source, key, cb){
    var sourceIds = array.map(source, function(item) {
      return item[key];
    });
    for (var i = 0, len = dest.length; i < len; i++) {
      var idx = sourceIds.indexOf(dest[i][key]);
      if (idx > -1) {
        cb(dest[i], source[idx]);
      }
    }
  };

  exports.syncOrderWith = function(dest, ref, key) {
    if (!lang.isArray(ref) || !key) {
      return dest;
    }
    function getKeys(dest, k) {
      return array.map(dest, function(item) {
        return item[k];
      });
    }
    var destKeys = getKeys(dest, key);
    var order = [];
    for (var i = 0, len = ref.length; i < len; i++) {
      var idx = destKeys.indexOf(ref[i][key]);
      if (idx > -1) {
        order = order.concat(dest.splice(idx, 1));
        destKeys = getKeys(dest, key);
      }
    }
    return order.concat(dest);
  };

  exports.arcade = {};

  // get arcade expressions from single layer
  exports.arcade.getExpressionInfosFromLayer = function(map, layer) {
    var profiles = ArcadeUtils.readExprInfo.getArcadeProfilesByType(map, layer, 'infoTemplate');
    if(profiles.length > 0 && profiles[0].expressionInfos) {
      return profiles[0].expressionInfos;
    } 
    return [];
  };

  // get arcade expressions from single layerInfo
  exports.arcade.getExpressionInfosFromLayerInfo = function(layerInfo) {
    var pInfo = layerInfo && layerInfo.getPopupInfo();
    return pInfo && pInfo.expressionInfos || [];
  };

  // get attributes with expression values
  exports.arcade.getAttributes = function(attributes, expressionInfos, layerDefinition) {
    var graphic = new Graphic(attributes.geometry, null, attributes);
    return ArcadeUtils.customExpr.getAttributesFromCustomArcadeExpr(
      expressionInfos, graphic, layerDefinition) || attributes;
  };

  exports.arcade.appendArcadeExpressionsToFields = function(ofields, layerInfo) {
    if(!ofields) return;
    
    var arcadeExpressions = exports.arcade.getExpressionInfosFromLayerInfo(layerInfo);
    if(arcadeExpressions.length > 0) {
      var prefix = 'expression/';
      var re = new RegExp('^'+prefix);
      array.forEach(arcadeExpressions, function(exp) {
        // compare expressions with original fields list
        if(!array.some(ofields, function(ofield) {
          if(re.test(ofield.name)) { // field is an arcade expression
            var ofieldExprName = ofield.name.substr(prefix.length);
            return exp.name === ofieldExprName;
          }
        })) {
          // if the expression does not exist in fields,
          // add it to fields list:
          ofields.push({
            name: prefix + exp.name,
            alias: exp.title,
            show: true
          });
        }
      });
    }

    return ofields;
  };

  exports.arcade.isArcadeExpressionField = function(field) {
    return field && typeof field.name === 'string' && field.name.indexOf('expression/') === 0;
  };

  exports.arcade.parseArcadeExpressions = function(expressionInfos) {
    return ArcadeUtils.InfoTemplate._parseArcadeExpressions(expressionInfos);
  };

  // get the sort by fields
  exports.getSortbyFields = function(grid, layer) {
    var sortFields = grid && grid.get('sort') || [],
        layerOID = layer && layer.objectIdField;
    if(sortFields.length > 0) {
      sortFields = array.map(sortFields, function(field) {
        return field.attribute + ' ' + (field.descending ? 'DESC' : 'ASC');
      });
    } else {
      if(layerOID) {
        sortFields.push(layerOID  + ' ASC');
      }
    }
    return sortFields;
  };

  function clipValidFields(sFields, rFields) {
    if (!(sFields && sFields.length)) {
      return rFields || [];
    }
    if (!(rFields && rFields.length)) {
      return sFields;
    }
    var validFields = [];
    for (var i = 0, len = sFields.length; i < len; i++) {
      var sf = sFields[i];
      for (var j = 0, len2 = rFields.length; j < len2; j++) {
        var rf = rFields[j];
        if (rf.name === sf.name) {
          // update alias if needed
          if(rf.alias !== sf.alias) {
            sf.alias = rf.alias;
          }
          validFields.push(sf);
          break;
        }
      }
    }
    return validFields;
  }

});