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
  'dojo/Deferred',
  'esri/tasks/query',
  'dojo/_base/array',
  'dojo/_base/lang',
  'dojo/_base/declare',
  'jimu/Query',
  'jimu/LayerStructure',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dijit/_WidgetsInTemplateMixin',
  'dojo/text!./pageControlForQuery.html',
  'jimu/filterUtils',
  'jimu/utils'
],
function(Deferred, EsriQuery, array,
  lang, declare, JimuQuery, LayerStructure, _WidgetBase,
  _TemplatedMixin, _WidgetsInTemplateMixin, template, FilterUtils, jimuUtils){

  return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
    templateString: template,

    layerUrl: null,
    fieldInfo: null,
    fieldPopupInfo: null,
    spatialReference: null,
    layerDefinition: null,
    isNumberField: false,
    showNullValues: false,

    _isUniqueValueCacheFinish: false,
    _uniqueValueCache: {},
    _uniqueValueCacheForOtherTypes: {}, //cache for searchKey & types = 2 or 3
    _codedvalueCache: [],

    cascadeFilterExprs: '1=1',

    numbericFieldLength: {
      'esriFieldTypeOID': 32,
      'esriFieldTypeSmallInteger': 16,
      'esriFieldTypeInteger': 32,
      'esriFieldTypeSingle': 128,
      'esriFieldTypeDouble': 1024
    },
    pageIndex: 1,  //current page
    pageSize: 1000, //optional, feature count per page
    postCreate: function(){
      this.inherited(arguments);
      this.spatialReference = LayerStructure.getInstance().map.spatialReference;
      this.reset();
      this.queryType = JimuQuery.getQueryType(this.layerDefinition);
      if(this.isNumberField){
        this.fieldLength = this.numbericFieldLength[this.fieldInfo.type];
      }else{
        this.filterUtils = new FilterUtils();
        this.isLayerHosted = jimuUtils.isHostedService(this.layerUrl);
      }
    },

    reset:function(){
      this.pageIndex = 1;
      this._isUniqueValueCacheFinish = false;
      this._uniqueValueCache = {};
      this._uniqueValueCacheForOtherTypes = {};
      this._codedvalueCache = [];
    },

    isKeyQueryLoader: false,
    _searchKey: function(name){
      var def = new Deferred();
      var query = new EsriQuery();
      //"%123%" works for string field and number field
      var keyWhere = '';
      if(this.isNumberField){ // CAST(objectid AS CHAR(32)) LIKE '%1%'
        keyWhere = "CAST(" + this.fieldInfo.name + " AS CHAR(" + this.fieldLength + ")) LIKE '%" + name + "%'";
      }else{
        //string field should support both upper case and lower case.
        var _prefix = (this.isLayerHosted && this.filterUtils.containsNonLatinCharacter(name)) ? 'N' : '';
        if(this.isLayerHosted){
          keyWhere = this.fieldInfo.name + " LIKE " + _prefix + "'%" + name.replace(/\'/g, "''") + "%'";
        }else{
          keyWhere = "UPPER(" + this.fieldInfo.name + ") LIKE " +
            "" + _prefix + "'%" + name.replace(/\'/g, "''").toUpperCase() + "%'";
        }
      }
      query.where = '((' + this.cascadeFilterExprs + ') AND (' + keyWhere + '))';

      query.geometry = null;
      query.outSpatialReference = this.spatialReference;
      query.outFields = [this.fieldInfo.name];
      query.returnDistinctValues = true;
      query.returnGeometry = false;
      query.orderByFields = query.outFields;//for order

      this.layerLoaderForKey = new JimuQuery({
        url: this.layerUrl,
        query: query,
        pageSize: this.pageSize
      });

      this.isKeyQueryLoader = true;
      this._uniqueValueCacheForOtherTypes = {};
      this.queryByPage(true).then(lang.hitch(this, function(valueLabels){
        def.resolve(valueLabels);
      }), lang.hitch(this, function(err){
        def.reject('reject:' + err);
      }));
      return def;
    },

    _searchKeyLocal: function(name){
      name = name.toUpperCase();
      this.isKeyQueryLoader = false;
      var valueLabels = [];
      var cacheData = this._codedvalueCache;
      var item;
      if(cacheData.length > 0){ //coded value
        for (var key1 = 0; key1 < cacheData.length; key1++){
          item = cacheData[key1];
          if(item.label && item.label.toString().toUpperCase().indexOf(name) >= 0){
            valueLabels.push(item);
          }
        }
      }else{
        cacheData = this._uniqueValueCache;
        // var enName = this.isNumberField ? name.replace(',', '.') : name;
        for (var key2 in cacheData){
          var items = cacheData[key2];
          for (var index = 0; index < items.length; index++){
            item = items[index];
            var mathStr = item.label;
            if(mathStr && mathStr.toString().toUpperCase().indexOf(name) >= 0){
              valueLabels.push(item);
            }
            //match value as well if it's a number.
            // if(this.isNumberField){
            //   var mathStrNew = item.value.toString();
            //   if(mathStrNew && mathStrNew.toString().indexOf(enName) >= 0){
            //     valueLabels.push(item);
            //   }
            // }
          }
        }
      }
      return valueLabels;
    },

    queryByPage: function(ifFristPage){
      var def = new Deferred();

      //jimuQuery will remember the totalcount after first query,
      //so need new a query to get count for new exprs
      if(this.layerLoader && (this.layerLoader.query.where !== this.cascadeFilterExprs)){
        this.layerLoader = null;
        this.isKeyQueryLoader = false;
        this.reset();//need to test
      }

      if(!this.layerLoader){
        var query = new EsriQuery();
        query.where = this.cascadeFilterExprs;
        query.geometry = null;
        // query.outSpatialReference = this.map.spatialReference;
        query.outSpatialReference = this.spatialReference;
        //outFields&returnDistinctValues can work only when returnGeometry is false
        query.outFields = [this.fieldInfo.name];
        query.returnDistinctValues = true;
        query.returnGeometry = false;
        query.orderByFields = query.outFields;//for order

        this.layerLoader = new JimuQuery({
          url: this.layerUrl,
          query: query,
          pageSize: this.pageSize
        });
      }

      if(ifFristPage){ //init pageindex
        this.pageIndex = 1;
      }

      var cacheValueLabels = [], loader;
      if(this.isKeyQueryLoader){
        if(this._uniqueValueCacheForOtherTypes[this.pageIndex]){
          cacheValueLabels = this._resolveValueLabelsFromCache(this._uniqueValueCacheForOtherTypes);
          def.resolve(cacheValueLabels);
          return def;
        }else{
          loader = this.layerLoaderForKey;
        }
      }else{
        if(this._uniqueValueCache[this.pageIndex]){
          cacheValueLabels = this._resolveValueLabelsFromCache(this._uniqueValueCache);
          def.resolve(cacheValueLabels);
          return def;
        }else{
          loader = this.layerLoader;
        }
      }

      if(this.queryType === 1){
        loader.queryByPage(this.pageIndex).then(lang.hitch(this, function(response){
          if(response){
            var features = response.features || [];

            var featuresLength = features.length; //for calc cache
            if(!this.showNullValues){ //remove null data
              features = this._getNotNullValues(features);
            }

            var valueLabels = this._getValueLabelsFromFeatures(features);

            if(!this.isKeyQueryLoader){ //only cache the data list which has no conditions
              this._uniqueValueCache[this.pageIndex - 1] = valueLabels;
              if(featuresLength < this.pageSize){
                this._uniqueValueCache[this.pageIndex] = [];
                this._isUniqueValueCacheFinish = true;
              }
            }else{
              this._uniqueValueCacheForOtherTypes[this.pageIndex - 1] = valueLabels;
              if(featuresLength < this.pageSize){
                this._uniqueValueCacheForOtherTypes[this.pageIndex] = [];
              }
            }
            if(valueLabels.length === 0){
              this.pageIndex --;
            }
            def.resolve(valueLabels);
          }else{
            def.reject("Can't get features from current layer");
          }
        }), lang.hitch(this, function(err){
          def.reject(err);
        }));
      } else{ //get all features
        loader.getAllFeatures().then(lang.hitch(this, function(response){
          if(response){
            var features = response.features || [];
            if(!this.showNullValues){
              features = this._getNotNullValues(features);
            }
            var isReturnValueLabels = features.length > 0 ? true : false;

            features = this._getDistinctValues(features);
            var valueLabels = this._getValueLabelsFromFeatures(features);
            if(this.isKeyQueryLoader){
              valueLabels = this._getAndStoreValueLabelsForOtherTypes(valueLabels,
                this._uniqueValueCacheForOtherTypes);
            }else{ //only cache the data list which has no conditions
              valueLabels = this._getAndStoreValueLabelsForOtherTypes(valueLabels,
                this._uniqueValueCache);
            }
            this._isUniqueValueCacheFinish = true;

            var reValueLabels = isReturnValueLabels ? valueLabels : [];
            def.resolve(reValueLabels);
          }else{
            def.reject("Can't get features from current layer");
          }
        }), lang.hitch(this, function(err){
          def.reject(err);
        }));
      }
      this.pageIndex ++;
      return def;
    },

    _resolveValueLabelsFromCache: function(cacheValueLabels){
      var valueLabels = cacheValueLabels[this.pageIndex];
      if(valueLabels.length !== 0){
        this.pageIndex++;
      }
      return valueLabels;
    },

    _getAndStoreValueLabelsForOtherTypes: function(valueLabels, cacheValueLabels){
      for (var key = 0; key < valueLabels.length; key = key + this.pageSize){
        cacheValueLabels[parseInt(key / this.pageSize, 10) + 1] = valueLabels.slice(key, key + this.pageSize);
      }
      for (var k in cacheValueLabels){
        var next = parseInt(k, 10) + 1;
        if(!cacheValueLabels[next]){
          cacheValueLabels[next] = [];
        }
      }
      return cacheValueLabels[1];//return the data of first page
    },

    _getDistinctValues: function(features){
      var hash = {};
      var distinctFeatures = [];
      for(var key in features){
        var feature = features[key];
        var featureVal = feature.attributes[this.fieldInfo.name];
        if(!hash[featureVal]){
          hash[featureVal] = true;//value = featureVal will cause bug, when value=0
          distinctFeatures.push(feature);
        }
      }
      return distinctFeatures;
    },

    //value could be undefined or null or '',now only delete null values
    _getNotNullValues: function(features){
      features = array.filter(features, lang.hitch(this, function(feature){
        var featureVal = feature.attributes[this.fieldInfo.name];
        return featureVal !== '<Null>' && featureVal !== null;
      }));
      return features;
    },

    //get dataList with valueLabel's format include codedvalue
    //could partially solve decimal point.#13334
    _getValueLabelsFromFeatures: function(featureList){
      var fieldName = this.fieldInfo.name;
      var values = array.map(featureList, function(feature){
        return feature.attributes[fieldName];
      });
      var valueLabels = jimuUtils._getValues(this.layerDefinition, this.fieldPopupInfo, fieldName, values);
      //for date field
      if(this.fieldInfo.type === 'esriFieldTypeDate'){
        valueLabels = this._getDistinctValueLabelsByFormat(valueLabels);
      }
      return valueLabels;
    },

    //get distinct date values by format.
    _getDistinctValueLabelsByFormat: function(valueLabels){
      var hash = {};
      var distinctValueLabels = [];
      for(var key in valueLabels){
        var value = valueLabels[key].value;
        if(!hash[value]){
          hash[value] = true;
          distinctValueLabels.push(valueLabels[key]);
        }
      }
      return distinctValueLabels;
    }

  });
});