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

define([
  'exports',
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/_base/html',
  "dojo/_base/kernel",
  'dojo/has',
  "dojo/number",
  'dojo/Deferred',
  'jimu/utils',
  'esri/lang',
  'esri/tasks/QueryTask',
  'esri/tasks/query',
  'esri/graphic',
  "jimu/ArcadeUtils"],
  function(exports, lang, array, html, dojo, has, number, Deferred, jimuUtils, esriLang, 
    QueryTask, Query, Graphic, ArcadeUtils) {
    /*
    ** filename String no file extension
    ** datas Object[]
    ** columns Object[]
    */
    exports.exportCSV = function(filename, datas, columns) {
      return exports._createCSVStr(datas, columns).then(function(content) {
        return exports._download(filename + '.csv', content);
      });
    };

    /*
    ** filename String no file extension
    ** layer FeatureLayer or LayerDefinition Object; if is FeatureLayer, layer.loaded must be true
    ** options Object
    ** options: {
    **   datas: Array of feature.attributes; if not null only exported this datas to CSV
    **   fromClient: if true get data from layer.graphics,
    **               if false get first `layer.maxRecordCount` data from server
    **   outFields: Array of Field; if null export all fields of layer
    **   filterExpression: set where clause from featureService
    **   formatNumber: Boolean. if true localize number type field
    **   formatDate: Boolean. if true localize date type field
    **   formatCodedValue: Boolean. if true use description instead of codedvalue
    **   popupInfo: https://developers.arcgis.com/javascript/jshelp/intro_popuptemplate.html
    ** }
    */
    exports.exportCSVFromFeatureLayer = function(filename, layer, options) {
      options = options || {};
      var exportOptions = {
        datas: options.datas,
        objectIds: options.objectIds,
        fromClient: options.fromClient,
        withGeometry: options.withGeometry,
        outFields: options.outFields,
        filterExpression : options.filterExpression,
        outSpatialReference: options.outSpatialReference,
        arcadeExpressions: options.arcadeExpressions,
        geometry: options.geometry,
        orderByFields: options.orderByFields,
        start: options.start,
        num: options.num
      };
      return exports._getExportData(layer, exportOptions).then(function(result) {
        var formattedOptions = {
          formatNumber: options.formatNumber,
          formatDate: options.formatDate,
          formatCodedValue: options.formatCodedValue,
          richText: {
            clearFormat: options.richTextFieldsToClear && !!options.richTextFieldsToClear.length,
            fieldsToClear: options.richTextFieldsToClear || []
          },
          popupInfo: options.popupInfo
        };
        return exports._formattedData(layer, result, formattedOptions)
          .then(function(formattedResult) {
            return exports.exportCSV(filename, formattedResult.datas, formattedResult.columns);
          });
      });
    };

    /*
    ** filename String no file extension
    ** definition LayerDefinition Object
    ** attributes Array of graphic.attributes
    ** options: {
    **   datas: Array of feature.attributes; if not null only exported this datas to CSV
    **   fromClient: if true get data from layer.graphics,
    **               if false get first `layer.maxRecordCount` data from server
    **   outFields: Array of Field; if null export all fields of layer
    **   filterExpression: set where clause from featureService
    **   formatNumber: Boolean. if true localize number type field
    **   formatDate: Boolean. if true localize date type field
    **   formatCodedValue: Boolean. if true use description instead of codedvalue
    **   popupInfo: https://developers.arcgis.com/javascript/jshelp/intro_popuptemplate.html
    ** }
    */
    exports.exportCSVByAttributes = function(filename, definition, attributes, options) {
      options = lang.mixin({}, options);
      options.datas = attributes;
      return exports.exportCSVFromFeatureLayer(filename, definition, options);
    };

    /*
    ** filename String no file extension
    ** definition LayerDefinition Object
    ** graphics Array of graphic
    ** options: {
    **   datas: Array of feature.attributes; if not null only exported this datas to CSV
    **   fromClient: if true get data from layer.graphics,
    **               if false get first `layer.maxRecordCount` data from server
    **   outFields: Array of Field; if null export all fields of layer
    **   filterExpression: set where clause from featureService
    **   formatNumber: Boolean. if true localize number type field
    **   formatDate: Boolean. if true localize date type field
    **   formatCodedValue: Boolean. if true use description instead of codedvalue
    **   popupInfo: https://developers.arcgis.com/javascript/jshelp/intro_popuptemplate.html
    ** }
    */
    exports.exportCSVByGraphics = function(filename, definition, graphics, options) {
      var attributes = array.map(graphics, function(graphic) {
        return graphic.attributes;
      });
      return exports.exportCSVByAttributes(filename, definition, attributes, options);
    };

    exports._createCSVStr = function(datas, columns) {
      var def = new Deferred();
      var textField = '"';
      var content = "";
      var len = 0,
        n = 0,
        separator = "",
        value = "";
      var defaultDelimiter = getDelimiter(); // either "," or ";"
      try {
        columns = array.map(columns, function(f){
          if(typeof f === 'string'){
            return {name: f};
          }else{
            return f;
          }
        });
        array.forEach(columns, function(_field) {
          var _fieldText = _field.alias || _field.name;
          // append "" to fields that include delimiter
          if(_fieldText.toString().indexOf(defaultDelimiter) > -1) {
            _fieldText = '"' + _fieldText + '"';
          }
          content = content + separator + _fieldText;
          separator = defaultDelimiter;
        });

        content = content + "\r\n";
        len = datas.length;
        n = columns.length;
        for (var i = 0; i < len; i++) {
          separator = "";
          for (var m = 0; m < n; m++) {
            var _field = columns[m];
            value = datas[i][_field.name];
            if (!value && typeof value !== "number") {
              value = "";
            }
            if(typeof value === "string") {
              var shouldAddQuotes = false;
              if(defaultDelimiter === ";") {
                shouldAddQuotes = /[";\r\n]/g.test(value);
              } else {
                shouldAddQuotes = /[",\r\n]/g.test(value);
              }
              if(shouldAddQuotes) {
                value = textField + value.replace(/(")/g, '""') + textField;
              }
            }
            content = content + separator + value;
            separator = defaultDelimiter;
          }
          content = content + "\r\n";
        }
        def.resolve(content);
      } catch (err) {
        console.error(err);
        def.resolve("");
      }

      return def;
    };

    exports._isIE11 = function() {
      return jimuUtils.has('ie') === 11;
    };

    exports._isEdge = function() {
      return jimuUtils.has('edge');
    };

    exports._getDownloadUrl = function(text) {
      var BOM = "\uFEFF";
      // Add BOM to text for open in excel correctly
      if (window.Blob && window.URL && window.URL.createObjectURL) {
        var csvData = new Blob([BOM + text], { type: 'text/csv' });
        return URL.createObjectURL(csvData);
      } else {
        return 'data:attachment/csv;charset=utf-8,' + BOM + encodeURIComponent(text);
      }
    };

    exports._download = function(filename, text) {
      var def = new Deferred();
      try {
        if (has('ie') && has('ie') < 10) {
          // has module unable identify ie11 and Edge
          var oWin = window.top.open("about:blank", "_blank");
          oWin.document.write('sep=,\r\n' + text);
          oWin.document.close();
          oWin.document.execCommand('SaveAs', true, filename);
          oWin.close();
        }else if (has("ie") === 10 || exports._isIE11() || exports._isEdge()) {
          var BOM = "\uFEFF";
          var csvData = new Blob([BOM + text], { type: 'text/csv' });
          navigator.msSaveBlob(csvData, filename);
        } else {
          var link = html.create("a", {
            href: exports._getDownloadUrl(text),
            target: '_blank',
            download: filename
          }, document.body);
          if (has('safari')) {
            // # First create an event
            var click_ev = document.createEvent("MouseEvents");
            // # initialize the event
            click_ev.initEvent("click", true /* bubble */ , true /* cancelable */ );
            // # trigger the evevnt/
            link.dispatchEvent(click_ev);
          } else {
            link.click();
          }

          html.destroy(link);
        }
        def.resolve();
      } catch(e) {
        def.reject(e);
      }
      return def;
    };

    exports._getExportData = function(layer, options) {
      var def = new Deferred();
      var _outFields = null;
      var _queryOutFields = [];
      var data = options.datas;
      var withGeometry = options.withGeometry;
      var withExpressionFields = !!options.arcadeExpressions;

      _outFields = options.outFields;
      if (!_outFields || !_outFields.length) {
        _outFields = layer.fields;
      }
      _outFields = lang.clone(_outFields);

      if (withGeometry && !(data && data.length > 0)) {// only for fromClient or server
        // data is null, we should retrieve data from server.
        // for query params, here we clone _outFields to _queryOutFields before x and y appended to _outFields,
        // or we clone all fields from layer object, if it contains arcade expressions.
        //  because the fields of service might not contain field x or field y.
        if(withExpressionFields) {
          var _outFieldsWithoutExprs = array.filter(layer.fields, function(field) {
            return field.name.indexOf('expression/') === -1;
          });
          _queryOutFields = lang.clone(_outFieldsWithoutExprs);
        } else {
          _queryOutFields = lang.clone(_outFields);
        }

        var name = "";
        if (_outFields.indexOf('x') !== -1) {
          name = '_x';
        } else {
          name = 'x';
        }
        _outFields.push({
          'name': name,
          alias: name,
          format: {
            'digitSeparator': false,
            'places': 6
          },
          show: true,
          type: "esriFieldTypeDouble"
        });
        if (_outFields.indexOf('y') !== -1) {
          name = '_y';
        } else {
          name = 'y';
        }
        _outFields.push({
          'name': name,
          alias: name,
          format: {
            'digitSeparator': false,
            'places': 6
          },
          show: true,
          type: "esriFieldTypeDouble"
        });
      }

      if (data && data.length > 0) {
        if(withExpressionFields) {
          data = exports._getAttrsWithExpressionsBatch(data, options.arcadeExpressions);
        }
        def.resolve({
          'data': data || [],
          'outFields': _outFields
        });
      } else {
        // var g = null;
        if (options.fromClient) {
          data = array.map(layer.graphics, function(graphic) {
            var attrs = withGeometry ? getAttrsWithXY(graphic) : lang.clone(graphic);
            attrs = withExpressionFields ? 
            exports._getAttrsWithExpressions(attrs, options.arcadeExpressions) : attrs;
            return attrs;
          });
          def.resolve({
            'data': data || [],
            'outFields': _outFields
          });
        } else {
          exports._getExportDataFromServer(layer, _queryOutFields, options)
            .then(function(data) {
              if(withExpressionFields) {
                data = exports._getAttrsWithExpressionsBatch(data, options.arcadeExpressions);
              }
              def.resolve({
                'data': data || [],
                'outFields': _outFields
              });
            });
        }
      }

      return def;
    };

    exports._getExportDataFromServer = function(layer, outFields, options) {
      var def = new Deferred();
      if (layer.declaredClass !== 'esri.layers.FeatureLayer') {
        def.resolve([]);
        return def;
      }
      var qt = new QueryTask(layer.url);
      var query = new Query();
      query.where = options.filterExpression ||
        (layer.getDefinitionExpression && layer.getDefinitionExpression()) || "1=1";
      var oFields = outFields;
      if (oFields.length > 0) {
        var oNames = array.map(oFields, function(field) {
          return field.name;
        });
        query.outFields = oNames;
      } else {
        query.outFields = ["*"];
      }
      query.objectIds = options.objectIds;
      query.returnGeometry = options.withGeometry;
      query.outSR = options.spatialReference;
      query.geometry = options.geometry;
      query.orderByFields = options.orderByFields;
      query.start = options.start;
      query.num = options.num;

      qt.execute(query, function(results) {
        var data = array.map(results.features, function(feature) {
          return getAttrsWithXY(feature);
        });
        def.resolve(data);
      }, function(err) {
        console.error(err);
        def.resolve([]);
      });

      return def;
    };

    exports._formattedData = function(layer, dataOptions, formattedOptions) {
      var def = new Deferred();
      var formattedDatas = [];

      var datas = dataOptions.data;
      var outFields = dataOptions.outFields;

      for (var i = 0, len = datas.length; i < len; i++) {
        var aliasData = {};
        for (var j = 0; j < outFields.length; j++) {
          var _field = outFields[j];
          aliasData[_field.name] = exports._getExportValue(
            datas[i][_field.name],
            _field,
            layer.objectIdField,
            layer.typeIdField,
            datas[i][layer.typeIdField],
            layer.types,
            formattedOptions
            );
        }
        formattedDatas.push(aliasData);
      }

      var columns = array.map(outFields, function(oField) {
        return {
          alias: oField.alias,
          name: oField.name
        }
      });

      def.resolve({
        datas: formattedDatas,
        columns: columns
      });
      return def;
    };

    exports._getExportValue = function(data, field, pk, typeIdField,
      typeData, types, formattedOptions) {
      var pInfos = formattedOptions.popupInfo;
      function getFormatInfo(fieldName) {
        if (pInfos && esriLang.isDefined(pInfos.fieldInfos)) {
          for (var i = 0, len = pInfos.fieldInfos.length; i < len; i++) {
            var f = pInfos.fieldInfos[i];
            if (f.fieldName === fieldName) {
              return f.format;
            }
          }
        }

        return null;
      }
      var fieldsToClear = formattedOptions.richText.fieldsToClear;
      function isRichTextField(fieldName) {
        for (var i = 0, len = fieldsToClear.length; i < len; i++) {
          var f = fieldsToClear[i];
          if (f.fieldName === fieldName) {
            return true;
          }
        }
        return false;
      }
      var isDomain = !!field.domain && formattedOptions.formatCodedValue;
      var isDate = field.type === "esriFieldTypeDate" && formattedOptions.formatDate;
      var isOjbectIdField = pk && (field.name === pk);
      var isTypeIdField = typeIdField && (field.name === typeIdField);
      var isRichTextField = field.type === "esriFieldTypeString" &&
                            formattedOptions.richText.clearFormat &&
                            isRichTextField(field.name);

      if (isDate) {
        return jimuUtils.fieldFormatter.getFormattedDate(data, getFormatInfo(field.name));
      }
      if (isTypeIdField) {
        return jimuUtils.fieldFormatter.getTypeName(data, types);
      }
      if (isDomain) {
        return jimuUtils.fieldFormatter.getCodedValue(field.domain, data);
      }
      if (isRichTextField) {
        if(data) {
          var d = document.createElement('span');
          d.innerHTML = data;
          return d.textContent || d.innerText || '';
        } else {
          return data;
        }
      }
      if (!isDomain && !isDate && !isOjbectIdField && !isTypeIdField && !isRichTextField) {
        var codeValue = null;
        if (pk && types && types.length > 0) {
          var typeChecks = array.filter(types, function(item) {
            // value of typeIdField has been changed above
            return item.id === typeData;
          });
          var typeCheck = typeChecks && typeChecks[0];

          if (typeCheck && typeCheck.domains &&
            typeCheck.domains[field.name] && typeCheck.domains[field.name].codedValues) {
            codeValue = jimuUtils.fieldFormatter.getCodedValue(
              typeCheck.domains[field.name],
              data
            );
          }
        }
        return codeValue !== null ? codeValue : data;
      }

      return data;
    };

    exports._getAttrsWithExpressions = function(attributes, arcadeExpressions) {
      var expressionInfos = lang.getObject('expressionInfos', false, arcadeExpressions),
          layerDefinition = lang.getObject('layerDefinition', false, arcadeExpressions),
          graphic = new Graphic(null, null, attributes);
      return ArcadeUtils.customExpr.getAttributesFromCustomArcadeExpr(
        expressionInfos, graphic, layerDefinition) || attributes;
    };

    exports._getAttrsWithExpressionsBatch = function(odata, arcadeExpressions) {
      var data = [];
      data = array.map(odata, function(attrs) {
        return exports._getAttrsWithExpressions(attrs, arcadeExpressions);
      });
      return data;
    };

    function getAttrsWithXY(graphic) {
      var attrs = lang.clone(graphic.attributes);
      var geometry = graphic.geometry;
      if (geometry && geometry.type === 'point') {
        if ('x' in attrs) {
          attrs._x = geometry.x;
        } else {
          attrs.x = geometry.x;
        }

        if ('y' in attrs) {
          attrs._y = geometry.y;
        } else {
          attrs.y = geometry.y;
        }
      }

      return attrs;
    }

    function getDelimiter() {
      var decimalNumberTester = number.format(1.1, {
        locale: dojo.locale
      });
      var sep = decimalNumberTester.substring(1,2);
      if(sep === ',') {
        return ';';
      }
      return ',';
    }

  });