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
define(['dojo/_base/declare',
  'jimu/utils',
  'dojo/_base/lang',
  'dojo/_base/config',
  'dojo/_base/Color',
  './_dateFormat',
  'moment/moment',
  'esri/lang',
  'esri/graphic',
  'esri/layers/GraphicsLayer',
  'esri/symbols/jsonUtils'
], function(declare, jimuUtils, lang, dojoConfig, Color, dateFormat, moment,
  esriLang, Graphic, GraphicsLayer, symbolJsonUtils) {

  return declare(null, {
    //popupInfo
    //featureLayer
    //_cachePlaces
    constructor: function(options) {
      if (options) {
        lang.mixin(this, options);
      }
      if (!this.popupInfo) {
        this.popupInfo = {};
      }
      if (!this.featureLayer) {
        this.featureLayer = {};
      }
      this._cachePlaces = {};
    },

    setLayerFeatureLayer: function(featureLayer) {
      this.featureLayer = featureLayer;
      if (this.map) {
        var _gLayerId = 'chart_highLight_GraphicLayer';
        var _gLayer = this.map.getLayer(_gLayerId);
        if (!_gLayer) {
          this.graphicLayer = new GraphicsLayer({
            id: _gLayerId
          });
          this.map.addLayer(this.graphicLayer);
        } else {
          this.graphicLayer = _gLayer;
        }
        this.graphicLayer.clear();
      }
    },

    setLayerObject: function(layerObject) {
      this.layerObject = layerObject;
    },

    setSymbolLayer: function(symbolLayer) {
      this.symbolLayer = symbolLayer;
    },

    setPopupInfo: function(popupInfo) {
      this.popupInfo = popupInfo;
    },

    setMap: function(map) {
      this.map = map;
    },

    getBestLabelDisplay: function(data, field, mode) {
      if (mode === 'feature') {
        return this.betterDataCategoryForFeatureMode(data, field);
      } else if (mode === 'category') {
        return this.betterDataCategoryForCategoryCountMode(data, field);
      } else if (mode === 'count') {
        return this.betterDataCategoryForCategoryCountMode(data, field);
      } else if (mode === 'field') {
        return this.betterDataCategoryForFieldMode(data);
      }
    },

    //Make category value's display more friendly
    betterDataCategoryForFeatureMode: function(data, field) {
      data.forEach(lang.hitch(this, function(item) {
        item.label = this.getBestDisplayValue(field, item.label);
      }));
      return data;
    },

    betterDataCategoryForFieldMode: function(data) {
      data.forEach(lang.hitch(this, function(item) {
        item.label = this.getFieldAlias(item.label);
      }));
      return data;
    },

    betterDataCategoryForCategoryCountMode: function(data, field) {
      data.forEach(lang.hitch(this, function(item) {
        if (typeof item.unit !== 'undefined') {
          item.label = this.getCategoryDisplayForDateUnit(item.label, item.unit);
        } else {
          item.label = this.getBestDisplayValue(field, item.label);
        }

      }));
      return data;
    },

    keepStatisticsDataBestDecimalPlace: function(options, data, mode) {
      if (mode === 'count') {
        return data;
      }
      var valueFields = options.valueFields;
      var operation = options.operation;
      var features = options.features;
      var hasStatisticsed = options.hasStatisticsed;
      this.cacheDecimalPlace(valueFields, features, this.popupInfo, operation, hasStatisticsed);

      if (mode === 'feature' || mode === 'category') {
        data.forEach(lang.hitch(this, function(item) {
          item.originalValues = lang.clone(item.values);
          valueFields.forEach(lang.hitch(this, function(fieldName, index) {
            var value = item.values[index];
            value = this.formatedValueDecimalplace(fieldName, value, operation, hasStatisticsed);
            item.values[index] = value;
          }));
        }));
      } else if (mode === 'field') {
        valueFields.forEach(lang.hitch(this, function(fieldName) {
          data.some(lang.hitch(this, function(item) {
            if (item.label === fieldName) {
              var value = item.values[0];
              value = this.formatedValueDecimalplace(fieldName, value, operation, hasStatisticsed);
              item.values[0] = value;
              return true;
            }
            return false;
          }));
        }));
      }

      return data;
    },

    formatedValueDecimalplace: function(fieldName, value, operation, hasStatisticsed){
      if (this.isIntegerNumberField(fieldName) && operation === 'average') {
        value = this.handleValueMaxDecimalplaces(value, 6);
      } else if(this.isFloatNumberField(fieldName)) {
        var places = this.getFieldDecimalPlaceFromCache(fieldName);
        value = this.formatValuePlaces(value, places);
        if(hasStatisticsed && !this.popupInfo) {
          value = this.handleValueMaxDecimalplaces(value, 6);
        }
      }
      return value;
    },

    isIntegerNumberField: function(fieldName) {
      if (!this.featureLayer || !this.featureLayer.fields) {
        return false;
      }
      var numberTypes = ['esriFieldTypeSmallInteger', 'esriFieldTypeInteger'];
      var isNumber = this.featureLayer.fields.some(lang.hitch(this, function(fieldInfo) {
        return fieldInfo.name === fieldName && numberTypes.indexOf(fieldInfo.type) >= 0;
      }));
      return isNumber;
    },

    formatValuePlaces: function(value, places) {
      if (typeof places !== 'number') {
        return value;
      }
      if (!value && value !== 0) {
        return value;
      }
      var str = value.toFixed(places);
      return str;
    },

    handleValueMaxDecimalplaces: function(value, maxDecimalPlaces) {
      value = Number(value);
      if (typeof value !== 'number') {
        return value;
      }
      var decimalPlace = 0;
      var splits = value.toString().split(".");

      if (splits.length === 1) {
        //value doesn't have fractional part
        decimalPlace = 0;
      } else if (splits.length === 2) {
        //value has fractional part
        decimalPlace = splits[1].length;
      }
      if (decimalPlace > 0) {
        if (decimalPlace > maxDecimalPlaces) {
          decimalPlace = maxDecimalPlaces;
        }
        var str = value.toFixed(decimalPlace);
        return parseFloat(str);
      } else {
        return value;
      }
    },

    getFieldDecimalPlaceFromCache: function(field) {
      var decimalPlace;
      if (this._cachePlaces) {
        var value = this._cachePlaces[field];
        if (typeof value === 'number') {
          decimalPlace = value;
        }
      }
      return decimalPlace;
    },

    getValueFromAttributes: function(attributes, fieldName, operation, hasStatisticsed){
      if (!attributes) {
        return;
      }
      operation = operation === 'average' ? 'avg' : operation;
      var value;
      if (!hasStatisticsed) {
        value = attributes[fieldName];
      } else {
        var key = jimuUtils.upperCaseString(fieldName + '_' + operation);
        value = attributes[key];
        if (typeof value === 'undefined') {
          key = jimuUtils.lowerCaseString(fieldName + '_' + operation);
          value = attributes[key];
        }
      }
      return value;
    },

    cacheDecimalPlace: function(fields, features, popupInfo, operation, hasStatisticsed) {
      this._cachePlaces = {}; //{fieldName: decimal place,...}
      var fieldNames = fields;
      if (!fields || !fields.length) {
        return;
      }
      var floatNumberFields = fieldNames.filter(lang.hitch(this, function(fieldName) {
        return this.isFloatNumberField(fieldName);
      }));
      //{field:values, ...} like {POP: [1,2,3],...}
      var floatNumberFieldValues = {};
      floatNumberFields.forEach(lang.hitch(this, function(fieldName) {
        floatNumberFieldValues[fieldName] = [];
      }));

      if (features && features.length > 0) {
        features.forEach(lang.hitch(this, function(feature) {
          var attributes = feature.attributes;
          if (attributes) {
            floatNumberFields.forEach(lang.hitch(this, function(fieldName) {
              var value = this.getValueFromAttributes(attributes, fieldName, operation, hasStatisticsed);
              if (typeof value === 'number') {
                floatNumberFieldValues[fieldName].push(value);
              }
            }));
          }
        }));
      }

      floatNumberFields.forEach(lang.hitch(this, function(fieldName) {
        var fieldInfo = this.getFieldInfoFromPopupInfo(popupInfo, fieldName);
        this._cachePlaces[fieldName] = 0;
        var values = floatNumberFieldValues[fieldName];
        if (values.length > 0) {
          try {
            var decimalPlace = this.getBestDecimalPlaceForArrayValues(values);
            this._cachePlaces[fieldName] = decimalPlace;
          } catch (e) {
            this._cachePlaces[fieldName] = 0;
            console.error(e);
          }
        }
        //use popup field info to override the calculated places
        if (popupInfo) {
          var places = this.getPlacesFromPopupFieldInfo(fieldInfo);
          if (places || places === 0) {
            this._cachePlaces[fieldName] = places;
          }
        }
      }));
    },

    getBestDecimalPlaceForArrayValues: function(floatValues) {
      var decimalPlace = 0;
      //{decimal:count,...} like {2:123, 3:321, ...}
      var statisticsHash = {};
      floatValues.forEach(function(value) {
        var splits = value.toString().split(".");
        var key = null;
        if (splits.length === 1) {
          //value doesn't have fractional part
          key = 0;
        } else if (splits.length === 2) {
          //value has fractional part
          key = splits[1].length;
        }
        if (key !== null) {
          if (statisticsHash[key] === undefined) {
            statisticsHash[key] = 1;
          } else {
            statisticsHash[key] += 1;
          }
        }
      });
      var maxDecimalPlaceItem = null;
      for (var key in statisticsHash) {
        key = parseInt(key, 10);
        var value = statisticsHash[key];
        if (maxDecimalPlaceItem) {
          if (value > maxDecimalPlaceItem.value) {
            maxDecimalPlaceItem = {
              key: key,
              value: value
            };
          }
        } else {
          maxDecimalPlaceItem = {
            key: key,
            value: value
          };
        }
      }
      if (maxDecimalPlaceItem) {
        decimalPlace = parseInt(maxDecimalPlaceItem.key, 10);
      }
      return decimalPlace;
    },

    getFieldInfoFromPopupInfo: function(popupInfo, fieldName) {
      var fieldInfo = null;
      if (!popupInfo || !popupInfo.fieldInfos) {
        return fieldInfo;
      }
      var fieldInfos = popupInfo.fieldInfos;
      fieldInfo = fieldInfos.filter(function(item) {
        return item.fieldName === fieldName;
      })[0];
      return fieldInfo;
    },

    getPlacesFromPopupFieldInfo: function(fieldInfo) {
      return fieldInfo && fieldInfo.format && fieldInfo.format.places;
    },

    getAliasFromPopupInfo: function(popupInfo, fieldName) {
      var label = fieldName;
      if (!popupInfo || !popupInfo.fieldInfos) {
        return label;
      }
      var fieldInfos = popupInfo.fieldInfos;
      if (fieldInfos && fieldInfos.length > 0) {
        fieldInfos.some(function(item) {
          if (item.fieldName === fieldName) {
            label = item.label;
            return true;
          }
        });
      }
      return label;
    },

    isFloatNumberField: function(fieldName) {
      if (!this.featureLayer || !this.featureLayer.fields) {
        return false;
      }
      var numberTypes = ['esriFieldTypeSingle', 'esriFieldTypeDouble'];
      var isNumber = this.featureLayer.fields.some(lang.hitch(this, function(fieldInfo) {
        return fieldInfo.name === fieldName && numberTypes.indexOf(fieldInfo.type) >= 0;
      }));
      return isNumber;
    },

    isNumberField: function(fieldName) {
      if (!this.featureLayer || !this.featureLayer.fields) {
        return false;
      }
      var numberTypes = ['esriFieldTypeSmallInteger',
        'esriFieldTypeInteger',
        'esriFieldTypeSingle',
        'esriFieldTypeDouble'
      ];
      var isNumber = this.featureLayer.fields.some(lang.hitch(this, function(fieldInfo) {
        return fieldInfo.name === fieldName && numberTypes.indexOf(fieldInfo.type) >= 0;
      }));
      return isNumber;
    },

    isDateField: function(fieldName) {
      var fieldInfo = this.getFieldInfo(fieldName);
      if (fieldInfo) {
        return fieldInfo.type === 'esriFieldTypeDate';
      }
      return false;
    },

    getFieldInfo: function(fieldName) {
      if (this.featureLayer) {
        var fieldInfos = this.featureLayer.fields;
        for (var i = 0; i < fieldInfos.length; i++) {
          if (fieldInfos[i].name === fieldName) {
            return fieldInfos[i];
          }
        }
      }
      return null;
    },

    getFieldAliasArray: function(fieldNames) {
      var results = fieldNames.map(lang.hitch(this, function(fieldName) {
        return this.getFieldAlias(fieldName);
      }));
      return results;
    },
    /* getBestDisplayValue */
    getBestDisplayValue: function(fieldName, fieldValue) {
      if (fieldValue === '_NULL&UNDEFINED_') {
        return 'null';
      }
      if (this.isDateField(fieldName)) {
        //handle date
        return this.formatedDateByPopupInfoOrLocal(fieldName, fieldValue);
      }
      var value;
      var attributes = {};
      attributes[fieldName] = fieldValue;
      var res = jimuUtils.getDisplayValueForCodedValueOrSubtype(this.layerObject ||
        this.featureLayer, fieldName, attributes);
      if (res.isCodedValueOrSubtype) {
        value = res.displayValue;
      } else {
        if (this.isNumberField(fieldName)) {
          var fieldInfo = this.getFieldInfoFromPopupInfo(this.popupInfo, fieldName);
          value = jimuUtils.localizeNumberByFieldInfo(fieldValue, fieldInfo);
        } else {
          value = fieldValue;
        }
      }
      return value;

    },

    formatedDateByPopupInfoOrLocal: function(fieldName, fieldValue, popupInfo) {
      if (!popupInfo) {
        popupInfo = this.popupInfo;
      }

      function getFormatInfo(fieldName) {
        if (popupInfo && esriLang.isDefined(popupInfo.fieldInfos)) {
          for (var i = 0, len = popupInfo.fieldInfos.length; i < len; i++) {
            var f = popupInfo.fieldInfos[i];
            if (f.fieldName === fieldName) {
              return f.format;
            }
          }
        }
        return null;
      }
      var format = getFormatInfo.call(this, fieldName);
      fieldValue = Number(fieldValue);
      return jimuUtils.fieldFormatter.getFormattedDate(fieldValue, format);
    },

    getDisplayValForNumberCodedValueSubTypes: function(fieldName, value) {
      var displayValue = this.tryLocaleNumber(value, fieldName);
      //check subtype description
      //http://services1.arcgis.com/oC086ufSSQ6Avnw2/arcgis/rest/services/Parcels/FeatureServer/0
      if (this.featureLayer && this.featureLayer.typeIdField === fieldName) {
        var types = this.featureLayer.types;
        if (types && types.length > 0) {
          var typeObjs = types.filter(lang.hitch(this, function(item) {
            return item.id === value;
          }));
          if (typeObjs.length > 0) {
            displayValue = typeObjs[0].name;
            return displayValue;
          }
        }
      }

      //check codedValue
      //http://jonq/arcgis/rest/services/BugFolder/BUG_000087622_CodedValue/FeatureServer/0
      //http://services1.arcgis.com/oC086ufSSQ6Avnw2/arcgis/rest/services/Parcels/FeatureServer/0
      var fieldInfo = this.getFieldInfo(fieldName);
      if (fieldInfo) {
        if (fieldInfo.domain) {
          var codedValues = fieldInfo.domain.codedValues;
          if (codedValues && codedValues.length > 0) {
            codedValues.some(function(item) {
              if (item.code === value) {
                displayValue = item.name;
                return true;
              } else {
                return false;
              }
            });
          }
        }
      }
      return displayValue;
    },

    tryLocaleNumber: function(value, /*optional*/ fieldName) {
      var result = value;
      if (esriLang.isDefined(value) && isFinite(value)) {
        try {
          var a;
          //if pass "abc" into localizeNumber, it will return null
          if (fieldName && this.isNumberField(fieldName)) {
            var popupFieldInfo = this.popupInfo[fieldName];
            if (popupFieldInfo && lang.exists('format.places', popupFieldInfo)) {
              a = jimuUtils.localizeNumberByFieldInfo(value, popupFieldInfo);
            } else {
              a = jimuUtils.localizeNumber(value);
            }
          } else {
            //#6117
            a = value; //jimuUtils.localizeNumber(value);
          }

          if (typeof a === "string") {
            result = a;
          }
        } catch (e) {
          console.error(e);
        }
      }
      //make sure the retun value is string
      result += "";
      return result;
    },

    getCategoryDisplayForDateUnit: function(fieldValue, dateUnit) {
      if (!dateUnit) {
        return fieldValue;
      }
      fieldValue = Number(fieldValue);
      return this._getFormatteredDate(fieldValue, dateUnit);
    },

    //return formattered date or date and time
    _getFormatteredDate: function(time, dateUnit) {
      var timePattern = this._getDateTemplate(dateUnit);
      var dateTime, date, times;
      if (['year', 'quarter', 'month', 'day'].indexOf(dateUnit) >= 0) {
        dateTime = jimuUtils.localizeDate(new Date(time), {
          selector: 'date',
          datePattern: timePattern.date
        });
      } else {
        date = jimuUtils.localizeDate(new Date(time), {
          selector: 'date',
          datePattern: timePattern.date
        });
        // times = jimuUtils.localizeDate(new Date(time),{selector:'time', datePattern : timePattern.time});
        times = moment(time).format(timePattern.time);
        dateTime = date + timePattern.connector + times;
      }
      return dateTime;
    },

    _getDateTemplate: function(dateFormatter) {
      // return {
      //    date: {
      //     short: 'MMM d, y'
      //      sNoDay:'MMM, y'
      //    },
      //    time:{
      //     short:'h:mm:ss a'
      //    },
      //    connector:' , '
      // }
      var langFormat = dateFormat[dojoConfig.locale];

      langFormat = langFormat || {};
      if (langFormat && !langFormat.date) {
        langFormat.date = {
          'short': 'short'
        };
      }

      if (langFormat && !langFormat.time) {
        langFormat.time = {
          'medium': 'HH:mm:ss a'
        };
      }

      if (langFormat && !langFormat.connector) {
        langFormat.connector = ' ';
      }

      if (langFormat && !langFormat.sNoDay) {
        langFormat.sNoDay = 'MMM, y';
      }

      var dateTemplate = {};

      if (dateFormatter === 'year') {
        dateTemplate.date = 'y';
      } else if (dateFormatter === 'quarter') {
        dateTemplate.date = 'y q';
      } else if (dateFormatter === 'month') {
        dateTemplate.date = langFormat.date.sNoDay;
      } else if (dateFormatter === 'day') {
        dateTemplate.date = langFormat.date['short'];
      } else if (dateFormatter === 'hour') {
        dateTemplate.date = langFormat.date['short'];
        dateTemplate.time = 'HH a';
        dateTemplate.connector = langFormat.connector;
      } else if (dateFormatter === 'minute') {
        dateTemplate.date = langFormat.date['short'];
        dateTemplate.time = 'HH:mm a';
        dateTemplate.connector = langFormat.connector;
      } else if (dateFormatter === 'second') {
        dateTemplate.date = langFormat.date['short'];
        dateTemplate.time = langFormat.time.medium;
        dateTemplate.connector = langFormat.connector;
      }

      return dateTemplate;
    },

    _getSymbolLayerGraphics: function(filterByExtent, useSelection) {
      if (!this.symbolLayer) {
        return null;
      }
      var isDynamicLayer = !!this.symbolLayer.refreshInterval;
      if (!isDynamicLayer && this.symbolGraphics && this.symbolGraphics.filterByExtent === false &&
        this.symbolGraphics.useSelection === false) {
        return this.symbolGraphics.graphics;
      }
      var graphics = null;
      if (this.map && this.symbolLayer) {
        graphics = jimuUtils.getClientFeaturesFromMap(this.map, this.symbolLayer, useSelection, !!filterByExtent);
      }
      this.symbolGraphics = {
        filterByExtent: filterByExtent,
        useSelection: useSelection,
        graphics: graphics
      };
      return graphics;
    },

    _isContainAttr: function(attributes, inputAttr) {
      if (typeof inputAttr !== 'object' || typeof inputAttr !== 'object') {
        return false;
      }
      var isContain = true;
      Object.keys(inputAttr).some(function(attrKey) {
        var inputAttrValue = inputAttr[attrKey];
        var attrValue = attributes[attrKey];
        if (inputAttrValue !== attrValue) {
          isContain = false;
          return true;
        }
        return false;
      });
      return isContain;
    },

    _getFeaturesByAttr: function(attributes, features) {
      if (!features) {
        return;
      }

      var feature = null;

      features.some(function(f) {
        if (this._isContainAttr(f.attributes, attributes)) {
          feature = f;
          return true;
        }
        return false;
      }.bind(this));

      return feature;
    },

    _getFeaturesByClusterfield: function(clusterField, label, filterByExtent, dateConfig) {

      var features = this._getSymbolLayerGraphics(filterByExtent);

      if (!features) {
        return;
      }
      var fs = null;

      var cluseringObj = this.clientStatisticsUtils.getCluseringObj(clusterField, features, dateConfig);
      var notNullLabelClusteringObj = cluseringObj.notNullLabel;
      var nullLabelClusteringObj = cluseringObj.nullLabel;
      var assignCluseringObj = lang.mixin(notNullLabelClusteringObj, nullLabelClusteringObj);

      var obj = assignCluseringObj[label];
      if (obj && obj.features && obj.features.length) {
        fs = obj.features;
      }
      return fs;
    },

    _getFeatureForSerieData: function(dataItem, dataOption, valueField) {
      var clusterField = dataOption.clusterField;
      var mode = dataOption.mode;
      var filterByExtent = dataOption.filterByExtent;
      var useSelection = dataOption.useSelection;
      var attributes = {};
      attributes[clusterField] = dataItem.name;
      if (mode === 'feature') {
        return this._getFeatureBySerieDataItem(dataItem, clusterField, valueField, filterByExtent, useSelection);
      } else if (mode === 'category' || mode === 'count') {
        return new Graphic(null, null, attributes);
      }
    },

    _getFeatureBySerieDataItem: function(dataItem, clusterField, valueField, filterByExtent, useSelection) {
      var attributes = {};
      attributes[clusterField] = dataItem.name;
      var value = typeof dataItem.originValue !== 'undefined' ? dataItem.originValue : dataItem.value;
      attributes[valueField] = Number(value);

      var features = this._getSymbolLayerGraphics(filterByExtent, useSelection);
      return this._getFeaturesByAttr(attributes, features);
    },

    _getFeatureBycsuDataItem: function(dataItem, clusterField, valueField, vfIndex, filterByExtent, useSelection) {
      var attributes = {};
      attributes[clusterField] = dataItem.label;
      var values = dataItem.originalValues || dataItem.values;
      var value = values && values[vfIndex];

      attributes[valueField] = Number(value);

      var features = this._getSymbolLayerGraphics(filterByExtent, useSelection);
      return this._getFeaturesByAttr(attributes, features);
    },

    /*    bind event to eCharts*/
    bindChartEvent: function(chart, options, data) {
      var filterByExtent = options.filterByExtent;
      var useSelection = options.useSelection;
      var clusterField = options.clusterField;
      var valueFields = options.valueFields;

      var dateConfig = null;
      if (options.dateConfig !== 'undefined') {
        dateConfig = options.dateConfig;
      }

      this.highLightColor = options.highLightColor || '#00ffff';
      var mode = options.mode;
      if (!this.map) {
        return;
      }
      if (data.length === 0) {
        return;
      }
      var mouseoverCallback = lang.hitch(this, function(evt) {
        if (evt.componentType !== 'series') {
          return;
        }
        var features = null;
        var symbolFeatures = this._getSymbolLayerGraphics(filterByExtent, useSelection);
        if (mode === 'field') {
          features = symbolFeatures;
        } else {
          //category: {category,valueFields,}
          //count {fieldValue:value1,count:count1}
          var dataItem = data[evt.dataIndex];
          if (dataItem) {
            if (mode === 'feature') {
              var vfIndex = evt.seriesIndex;
              var valueField = valueFields[vfIndex];
              if (!valueField) {
                return;
              }
              var feature = this._getFeatureBycsuDataItem(dataItem, clusterField, valueField, vfIndex,
                filterByExtent, useSelection);
              if (feature) {
                features = [feature];
              }
            } else {
              var label = dataItem.label;
              if (typeof label !== 'undefined') {
                features = this._getFeaturesByClusterfield(clusterField, label, filterByExtent, dateConfig);
              }
            }

          }
        }

        if (!features) {
          return;
        }

        if (evt.type === 'mouseover' && this.graphicLayer) {
          this._mouseoverFeatures = features;
          this._mouseOverChartItem(features);
        }
      });

      var mouseoutCallback = lang.hitch(this, function() {
        if (this._mouseoverFeatures && this.graphicLayer) {
          this._mouseOutChartItem(this._mouseoverFeatures);
          this._mouseoverFeatures = null;
        }
      });

      var events = [{
        name: 'mouseover',
        callback: mouseoverCallback
      }, {
        name: 'mouseout',
        callback: mouseoutCallback
      }];

      events.forEach(lang.hitch(this, function(event) {
        chart.chart.off(event.name);
        chart.chart.on(event.name, lang.hitch(this, function(evt) {
          if (evt.type === 'mouseover') {
            if (!this._hasTriggerMouseoverEvent) {
              this._hasTriggerMouseoverEvent = true;
              event.callback(evt);
            }
            setTimeout(lang.hitch(this, function() {
              this._hasTriggerMouseoverEvent = false;
            }, 500));
          } else if (evt.type === 'mouseout') {
            event.callback(evt);
          }
        }));
      }));
    },

    _createHighLightFeatures: function(features, symbol) {
      features.forEach(lang.hitch(this, function(feature) {
        var g = new Graphic(feature.geometry, symbol);
        this.graphicLayer.add(g);
      }));
    },

    _mouseOverChartItem: function(features) {
      var isVisible = this.featureLayer && this.featureLayer.getMap() && this.featureLayer.visible;
      if (!isVisible) {
        return;
      }
      var geoType = jimuUtils.getTypeByGeometryType(this.featureLayer.geometryType);
      //We need to store the original feature symbol because we will use it in mouse out event.
      features.forEach(lang.hitch(this, function(feature) {
        feature._originalSymbol = feature.symbol;
      }));

      var symbol = null;
      if (geoType === 'point') {
        symbol = this._getHighLightMarkerSymbol();
        this._createHighLightFeatures(features, symbol);
      } else if (geoType === 'polyline') {
        symbol = this._getHighLightLineSymbol(this.highLightColor);
        this._createHighLightFeatures(features, symbol);
      } else if (geoType === 'polygon') {

        var selectedFeatures = this.featureLayer.getSelectedFeatures() || [];

        features.forEach(lang.hitch(this, function(feature) {
          var isSelectedFeature = selectedFeatures.indexOf(feature) >= 0;
          var highLightSymbol = this._getHighLightFillSymbol(this.featureLayer, feature, isSelectedFeature);
          var g = new Graphic(feature.geometry, highLightSymbol);
          this.graphicLayer.add(g);
        }));
      }
    },

    _mouseOutChartItem: function() {
      if (this.graphicLayer) {
        this.graphicLayer.clear();
      }
    },

    _getHighLightMarkerSymbol: function() {
      // var sym = symbolJsonUtils.fromJson(this.config.symbol);
      // var size = Math.max(sym.size || 0, sym.width || 0, sym.height, 18);
      // size += 1;

      var size = 30;

      var symJson = {
        "color": [255, 255, 255, 0],
        "size": 18,
        "angle": 0,
        "xoffset": 0,
        "yoffset": 0,
        "type": "esriSMS",
        "style": "esriSMSSquare",
        "outline": {
          "color": [0, 0, 128, 255],
          "width": 0.75,
          "type": "esriSLS",
          "style": "esriSLSSolid"
        }
      };
      var symbol = symbolJsonUtils.fromJson(symJson);
      symbol.setSize(size);
      symbol.outline.setColor(new Color(this.highLightColor));

      return symbol;
    },

    _getHighLightLineSymbol: function( /*optional*/ highLightColor) {
      var selectedSymJson = {
        "color": [0, 255, 255, 255],
        "width": 1.5,
        "type": "esriSLS",
        "style": "esriSLSSolid"
      };
      var symbol = symbolJsonUtils.fromJson(selectedSymJson);
      symbol.setColor(new Color(highLightColor || this.highLightColor));
      return symbol;
    },

    _getDefaultHighLightFillSymbol: function() {
      var symbolJson = {
        "color": [0, 255, 255, 128],
        "outline": {
          "color": [0, 255, 255, 255],
          "width": 1.5,
          "type": "esriSLS",
          "style": "esriSLSSolid"
        },
        "type": "esriSFS",
        "style": "esriSFSSolid"
      };
      var symbol = symbolJsonUtils.fromJson(symbolJson);
      symbol.outline.setColor(new Color(this.highLightColor));
      return symbol;
    },

    _getSymbolByRenderer: function(renderer, feature) {
      var symbol = this._getDefaultHighLightFillSymbol();
      var visualVariables = renderer.visualVariables;
      var visVar = this.getVisualVariableByType('colorInfo', visualVariables);
      if (visVar) {
        var color = renderer.getColor(feature, {
          colorInfo: visVar
        });
        if (color) {
          color = lang.clone(color);
          symbol.setColor(color);
        }
      } else {
        symbol = renderer.getSymbol(feature);
      }
      return symbol;
    },

    getVisualVariableByType: function(type, visualVariables) {
      // we could also use esri.renderer.Renderer.getVisualVariablesForType for renderers
      if (visualVariables) {
        var visVars = visualVariables.filter(function(visVar) {
          return (visVar.type === type && !visVar.target);
        });
        if (visVars.length) {
          return visVars[0];
        } else {
          return null;
        }
      }
      return null;
    },

    _getHighLightFillSymbol: function(featureLayer, feature, isSelectedFeature) {
      var highLightSymbol = null;
      var currentSymbol = feature.symbol;
      var renderer = featureLayer.renderer;
      if (!currentSymbol && renderer) {
        currentSymbol = this._getSymbolByRenderer(renderer, feature);
      }
      if (currentSymbol && typeof currentSymbol.setOutline === 'function') {
        highLightSymbol = symbolJsonUtils.fromJson(currentSymbol.toJson());
        var outlineWidth = 1.5;
        if (currentSymbol.outline) {
          if (currentSymbol.outline.width > 0) {
            outlineWidth = currentSymbol.outline.width + 1;
          }
        }
        //if feature in feature selection, set red color for selected features
        //if feature is not in feature selection, set selection like symbol
        var highLightColor = isSelectedFeature ? "#ff0000" : "#00ffff";
        var outline = this._getHighLightLineSymbol(highLightColor);
        outline.setWidth(outlineWidth);
        highLightSymbol.setOutline(outline);
      } else {
        highLightSymbol = this._getDefaultHighLightFillSymbol();
      }
      return highLightSymbol;
    },

    _isNumberField: function(fieldName) {
      var numberTypes = ['esriFieldTypeSmallInteger',
        'esriFieldTypeInteger',
        'esriFieldTypeSingle',
        'esriFieldTypeDouble'
      ];
      var isNumber = this.featureLayer.fields.some(lang.hitch(this, function(fieldInfo) {
        return fieldInfo.name === fieldName && numberTypes.indexOf(fieldInfo.type) >= 0;
      }));
      return isNumber;
    },

    getFieldAlias: function(fieldName) {
      var fieldAlias;
      if (this.popupInfo) {
        fieldAlias = this.getAliasFromPopupInfo(this.popupInfo, fieldName);
      }
      if (!fieldAlias) {
        fieldAlias = fieldName;
        var fieldInfo = this.getFieldInfo(fieldName);
        if (fieldInfo && fieldInfo.alias) {
          fieldAlias = fieldInfo.alias;
        }
      }
      return fieldAlias;
    },
    //Removing duplicate elements from an object array
    _removeDuplicateElementForObjArray: function(array) {
      if (!Array.isArray(array)) {
        return array;
      }
      var n = [];
      n.push(array[0]);
      array.forEach(function(item) {
        var isInArray = n.some(function(e) {
          return jimuUtils.isEqual(e, item);
        });

        if (!isInArray) {
          n.push(item);
        }
      });

      return n;
    },
    //assignee setting color to chart series
    assigneeSettingColor: function(displayOption, series, dataOption) {
      if (!series || !series.length) {
        return series;
      }
      var seriesStyle = displayOption.seriesStyle;
      if (!seriesStyle) {
        return series;
      }

      if (seriesStyle.type === 'layerSymbol') {
        series = this._assigneeStyleLayerSymbolColor(series, dataOption);
      } else if (seriesStyle.type === 'series') {
        series = this._assigneeStyleSeriesColor(displayOption, series);
      } else if (seriesStyle.type === 'custom') {
        series = this._assigneeStyleCustomColor(displayOption, series);
      }
      return series;
    },

    _assigneeStyleCustomColor: function(displayOption, series) {
      var seriesStyle = displayOption.seriesStyle;
      if (!seriesStyle || !seriesStyle.customColor) {
        return series;
      }
      var customColor = seriesStyle.customColor;
      var categories = customColor.categories;
      var others = customColor.others;
      if ((!categories || !categories.length) &&
        (!others || !others.length)) {
        return series;
      }
      if (others && others.length) {
        this._setCustomOthersColor(others, series);
      }
      if (categories && categories.length) {
        this._setCustomCategoriesColor(categories, series);
      }
    },

    _setCustomCategoriesColor: function(categories, series) {
      series.forEach(function(serie) {
        var data = serie.data;
        if (data && data.length) {
          data.forEach(function(dataItem) {
            if (typeof dataItem.name !== 'undefined') {
              var matchColor = this._getMatchingCustomColor(dataItem.name, categories);
              this.setColorToDataItem(dataItem, matchColor);
            }
          }.bind(this));
        }
      }.bind(this));
    },

    _getMatchingCustomColor: function(name, categories) {
      var color = false;
      if (!categories || !categories.length) {
        return color;
      }
      var matchCustomItem = categories.filter(function(cc) {
        return cc.id === name;
      })[0];
      if (matchCustomItem && matchCustomItem.color) {
        color = matchCustomItem.color;
      }
      return color;
    },

    _getMatchingCustomLabel: function(name, categories) {

      var label = false;
      if (!categories || !categories.length) {
        return label;
      }
      var matchCustomItem = categories.filter(function(cc) {
        return cc.id === name;
      })[0];
      if (matchCustomItem && matchCustomItem.label) {
        label = matchCustomItem.label;
      }
      return label;
    },

    _setCustomOthersColor: function(others, series) {
      this._setOtherColorForCustomColor(others, series);
      this._setNullLabelColorForCustomColor(others, series);
    },

    _setOtherColorForCustomColor: function(others, series) {
      var otherConfig = others.filter(function(oc) {
        return oc.id === 'others';
      })[0];
      if (otherConfig && otherConfig.color) {
        this.setColorToAllSerieDataItem(series, otherConfig.color);
      }
    },

    _setNullLabelColorForCustomColor: function(others, series) {
      var nullConfig = others.filter(function(oc) {
        return oc.id === 'null';
      })[0];
      if (!nullConfig || !nullConfig.color) {
        return;
      }
      var nullColor = nullConfig.color;
      series.forEach(function(serie) {
        var data = serie.data;
        if (data && data.length) {
          data.forEach(function(dataItem) {
            if (dataItem.name && dataItem.name === '_NULL&UNDEFINED_') {
              this.setColorToDataItem(dataItem, nullColor);
            }
          }.bind(this));
        }
      }.bind(this));
    },

    _assigneeStyleSeriesColor: function(displayOption, series) {
      var seriesStyle = displayOption.seriesStyle;
      if (!seriesStyle || !seriesStyle.styles || !seriesStyle.styles[0]) {
        return series;
      }
      var mode = displayOption.mode;
      var area = displayOption.area;
      return series.map(function(serie) {
        var matchStyle = null;
        var type = serie.type;

        if (mode === 'field') {
          if (type === 'line') {
            matchStyle = seriesStyle.styles[0].style;
            serie = this._setStyleToSerie(matchStyle, serie, area);
          } else {
            var data = serie.data;
            if (data && data[0]) {
              serie.data = data.map(function(item) {
                matchStyle = this._getMatchingStyle(item.name, seriesStyle);
                return this.setStyleToSerieDataItem(matchStyle, item);
              }.bind(this));
            }
          }
        } else {
          if (type === 'column' || type === 'bar' || type === 'line') {
            if (mode === 'count') {
              matchStyle = seriesStyle.styles[0].style;
              serie = this._setStyleToSerie(matchStyle, serie, area);
            } else {
              if (typeof serie.name !== 'undefined') {
                matchStyle = this._getMatchingStyle(serie.name, seriesStyle);
                if (matchStyle) {
                  serie = this._setStyleToSerie(matchStyle, serie, area);
                }
              }
            }
          }
          //else pie color array --> _chartDijitOption._mapSettingConfigToChartOption
        }
        return serie;
      }.bind(this));
    },

    _assigneeStyleLayerSymbolColor: function(series, dataOption) {
      series.forEach(function(serie) {
        var valueField = serie.name;
        var data = serie.data;
        if (data && data.length) {
          data.forEach(function(dataItem) {
            var feature = this._getFeatureForSerieData(dataItem, dataOption, valueField);
            var features = [feature];
            var color = this._getSymbolColorForDataItem(features);
            if (color) {
              dataItem.itemStyle = {
                color: color
              };
            }
          }.bind(this));
        }
      }.bind(this));
    },

    _setStyleToSerie: function(matchStyle, serie, area) {
      if (!serie.itemStyle) {
        serie.itemStyle = {};
      }
      if (matchStyle && typeof matchStyle.color !== 'undefined') {
        if (Array.isArray(matchStyle.color)) {
          serie.itemStyle.color = matchStyle.color[0];
        } else {
          serie.itemStyle.color = matchStyle.color;
        }
      }
      if (matchStyle && typeof matchStyle.opacity !== 'undefined') {
        if (area) {
          if (!serie.areaStyle) {
            serie.areaStyle = {};
          }
          serie.areaStyle.opacity = (1 - parseFloat(matchStyle.opacity / 10));
        } else {
          serie.itemStyle.opacity = (1 - parseFloat(matchStyle.opacity / 10));
        }
      }
      return serie;
    },

    _getMatchingStyle: function(name, seriesStyle) {
      var style = null;
      var styles = seriesStyle.styles;
      if (!styles || !styles[0]) {
        return style;
      }
      if (name === '') {
        return style;
      }
      styles.forEach(function(item) {
        if (item.name === name) {
          style = item.style;
        }
      });
      return style;
    },

    _getSymbolColorForDataItem: function(features) {
      var color = false;
      if (!this.symbolLayer) {
        return color;
      }
      var renderer = this.symbolLayer.renderer;
      var feature = features && features[0];
      if (!feature) {
        return color;
      }
      color = this._getColorForFeature(renderer, feature);
      return color;
    },

    _getColorForFeature: function(renderer, feature) {
      var color = false;
      var visualVariables = renderer.visualVariables;
      var visVar = this.getVisualVariableByType('colorInfo', visualVariables);
      if (visVar) {
        var featureColor = renderer.getColor(feature, {
          colorInfo: visVar
        });
        if (featureColor) {
          color = this._convertToEchartsRbga(featureColor);
        }
      } else {
        var symbol = renderer.getSymbol(feature);
        if (symbol && typeof symbol.color !== 'undefined') {
          color = this._convertToEchartsRbga(symbol.color);
        }
      }
      return color;
    },

    _convertToEchartsRbga: function(symbolColor) {
      if (!symbolColor || typeof symbolColor.r === 'undefined') {
        return symbolColor;
      }
      symbolColor = window.JSON.parse(window.JSON.stringify(symbolColor));
      var color = 'rgba(';
      color += symbolColor.r + ',';
      color += symbolColor.g + ',';
      color += symbolColor.b + ',';
      color += symbolColor.a + ')';
      return color;
    },

    getColors: function(originColors, count) {
      var colors = [];

      if (originColors.length === 2) {
        //gradient colors
        colors = this._createGradientColors(originColors[0],
          originColors[originColors.length - 1],
          count);
      } else {
        var a = Math.ceil(count / originColors.length);
        for (var i = 0; i < a; i++) {
          colors = colors.concat(originColors);
        }
        colors = colors.slice(0, count);
      }

      return colors;
    },

    _createGradientColors: function(firstColor, lastColor, count) {
      var colors = [];
      var c1 = new Color(firstColor);
      var c2 = new Color(lastColor);
      var deltaR = (c2.r - c1.r) / count;
      var deltaG = (c2.g - c1.g) / count;
      var deltaB = (c2.b - c1.b) / count;
      var c = new Color();
      var r = 0;
      var g = 0;
      var b = 0;
      for (var i = 0; i < count; i++) {
        r = parseInt(c1.r + deltaR * i, 10);
        g = parseInt(c1.g + deltaG * i, 10);
        b = parseInt(c1.b + deltaB * i, 10);
        c.setColor([r, g, b]);
        colors.push(c.toHex());
      }
      return colors;
    },

    setStyleToSerieDataItem: function(matchStyle, item) {
      if (!item.itemStyle) {
        item.itemStyle = {};
      }
      if (matchStyle && typeof matchStyle.color !== 'undefined') {
        if (Array.isArray(matchStyle.color)) {
          item.itemStyle.color = matchStyle.color[0];
        } else {
          item.itemStyle.color = matchStyle.color;
        }
      }
      if (matchStyle && typeof matchStyle.opacity !== 'undefined') {
        item.itemStyle.opacity = (1 - parseFloat(matchStyle.opacity / 10));
      }
      return item;
    },

    setColorToSerie: function(serie, color) {
      if (!serie || typeof serie !== 'object' || Array.isArray(serie)) {
        return serie;
      }
      if (!serie.itemStyle) {
        serie.itemStyle = {};
      }
      if (color) {
        serie.itemStyle.color = color;
      }
    },

    setColorToDataItem: function(dataItem, color) {
      if (!dataItem || typeof dataItem !== 'object') {
        return dataItem;
      }
      if (!dataItem.itemStyle) {
        dataItem.itemStyle = {};
      }
      if (color) {
        dataItem.itemStyle.color = color;
      }
    },

    // set one color to all series's data item
    setColorToAllSerieDataItem: function(series, otherColor) {
      series.forEach(function(serie) {
        var data = serie.data;
        if (data && data.length) {
          data.forEach(function(dataItem) {
            this.setColorToDataItem(dataItem, otherColor);
          }.bind(this));
        }
      }.bind(this));
    },

    _updateDataItemNameForCustom: function(dataItem, nullLabel, categories) {
      var label;
      if (typeof dataItem.name !== 'undefined') {
        label = dataItem.name;
        if (dataItem.name === '_NULL&UNDEFINED_' && nullLabel) {
          label = nullLabel;
        } else {
          var originName = typeof dataItem.originName !== 'undefined' ? dataItem.originName : dataItem.name;
          var matchLabel = this._getMatchingCustomLabel(originName, categories);
          if (matchLabel) {
            label = matchLabel;
          }
        }
        dataItem.name = label;
      }
      return label;
    },

    _updateSerieDataItemName: function(dataItem, mode, clusterField) {
      var name = dataItem.name;
      var formatedName = name;

      if (dataItem.unit && name) {
        formatedName = this.getCategoryDisplayForDateUnit(name, dataItem.unit);
      } else {
        if (mode !== 'field') {
          formatedName = this.getBestDisplayValue(clusterField, name);
        } else {
          formatedName = this.getFieldAlias(name);
        }
      }

      dataItem.name = formatedName;
      dataItem.originName = name;
      return formatedName;
    },

    updateChartSeriesDisplayName: function(chartSeriesOption, displayOption, dataOption) {

      var clusterField = dataOption.clusterField;
      var mode = dataOption.mode;
      var series = chartSeriesOption.series;
      var labels = [];
      //setting label
      var seriesStyle = displayOption.seriesStyle;
      var categories, nullLabel, others, nullConfig;

      var label;
      //default
      series.forEach(function(serie, index) {
        if (serie.name) {
          serie.name = this.getFieldAlias(serie.name);
        }
        var data = serie.data;
        if (data && data.length) {
          data.forEach(function(dataItem, dataIndex) {
            label = this._updateSerieDataItemName(dataItem, mode, clusterField);
            if (index === 0) {
              labels[dataIndex] = label;
            }
          }.bind(this));
        }
      }.bind(this));

      if (seriesStyle.type === 'custom') {
        var customColor = seriesStyle.customColor;

        if (customColor && customColor.categories && customColor.categories.length) {
          categories = customColor.categories;
          others = customColor.others || [];
          nullConfig = others.filter(function(oc) {
            return oc.id === 'null';
          })[0];
          if (nullConfig && nullConfig.label) {
            nullLabel = nullConfig.label;
          }
        }

        series.forEach(function(serie, index) {
          var data = serie.data;
          if (data && data.length) {
            data.forEach(function(dataItem, dataIndex) {
              label = this._updateDataItemNameForCustom(dataItem, nullLabel, categories);
              if (index === 0) {
                labels[dataIndex] = label;
              }
            }.bind(this));
          }
        }.bind(this));
      }

      chartSeriesOption.labels = null;
      chartSeriesOption.labels = labels;
    }

  });
});