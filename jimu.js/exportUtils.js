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

/*global saveAs, saveTextAs */
define([
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/json',
  'dojo/Deferred',
  'esri/tasks/query',
  'esri/tasks/QueryTask',
  'esri/tasks/FeatureSet',
  'esri/graphic',
  'esri/SpatialReference',
  'esri/tasks/ProjectParameters',
  'esri/config',
  'esri/geometry/webMercatorUtils',
  'jimu/LayerInfos/LayerInfos',
  './utils',
  './CSVUtils',
  './GeojsonConverters',
  'libs/polyfills/FileSaver'
  ],
  function(declare, lang, array, JSON, Deferred, Query, QueryTask, FeatureSet, Graphic,
  SpatialReference, ProjectParameters, esriConfig, webMercatorUtils, LayerInfos,
  jimuUtils, CSVUtils, GeojsonConverters) {
    /* global dojo */
    var mo = {};

    /**
     * options should contain the following attributes:
     * 1. type: type of the data source, can be mo.TYPE_TABLE or mo.TYPE_FEATURESET
     * 2. filename: output file name
     * 3. url: url of the data source if it is fetched remotely
     * 4. data: data source if it is local.
     * You can choose to use url or data, but not both of them.
     */
    mo.createDataSource = function(options){
      return new DataSource(options);
    };

    mo.TYPE_TABLE = 'table';
    mo.TYPE_FEATURESET = 'FeatureSet';
    mo.FORMAT_CSV = 'CSV';
    mo.FORMAT_FEATURESET = 'FeatureSet';
    mo.FORMAT_GEOJSON = 'GeoJSON';

    var DataSource = declare(null, {
      filename: undefined,
      format: undefined,
      nls: undefined,
      data: null,
      url: null,

      constructor: function(options){
        this.nls = window.jimuNls.exportTo;
        this.data = options.data;
        this.url = options.url;
        this.filename = options.filename;
      },

      setFormat: function(value){
        this.format = value;
      },

      download: function() {
        if(this.format === mo.FORMAT_CSV){
          return this.exportCSV();
        }else if(this.format === mo.FORMAT_FEATURESET){
          return this.exportFeatureCollection();
        }else if(this.format === mo.FORMAT_GEOJSON){
          return this.exportGeoJSON();
        }
      },

      getFeatureSet: function(){
        var ret = new Deferred();

        if(this.data){
          ret.resolve(this.data);
        }else if(this.url){
          var query = new Query();
          query.returnGeometry = true;
          query.outFields = ['*'];

          this.queryTask = new QueryTask(this.url);
          this.queryTask.execute(query, lang.hitch(this, function(fs){
            ret.resolve(fs);
          }), lang.hitch(this, function(){
            ret.resolve(null);
          }));
        }else{
          ret.resolve(null);
        }

        return ret;
      },

      findPopupInfo: function(featureSet) {
        if (!featureSet || !featureSet.features || featureSet.features.length === 0) {
          return null;
        }
        var feature = featureSet.features[0];
        var layerId;
        var fields;

        if(feature._layer) {
          fields = feature._layer.fields;
          layerId = feature._layer.id;
          var layerInfos = LayerInfos.getInstanceSync();
          var layerInfo = layerInfos.getLayerInfoById(layerId);
          if (layerInfo) {
            var popupInfo = layerInfo.getPopupInfo();
            if (!popupInfo) {
              // Try another way to get popupInfo
              popupInfo = layerInfo.layerObject.infoTemplate && layerInfo.layerObject.infoTemplate.info;
            }
            return popupInfo;
          }
        }
        return null;
      },

      findLayerDefinition: function(featureSet) {
        if (!featureSet || !featureSet.features || featureSet.features.length === 0) {
          return null;
        }
        var feature = featureSet.features[0];

        if(feature._layer) {
          return {
            geometryType: featureSet.geometryType,
            fields: feature._layer.fields
          };
        }

        var fields = [];
        var attributes = feature.attributes;
        var item;
        for (item in attributes) {
          if(attributes.hasOwnProperty(item)){
            fields.push({
              name: item
            });
          }
        }
        return {
          geometryType: featureSet.geometryType,
          fields: fields
        };
      },

      formatAttributes: function(featureSet) {
        var def = new Deferred();
        var popupInfo = this.findPopupInfo(featureSet);
        var layerDefinition = this.findLayerDefinition(featureSet);
        if (popupInfo && layerDefinition) {
          var data = array.map(featureSet.features, function(feature) {
            return feature.attributes;
          });
          CSVUtils._formattedData(featureSet.features[0]._layer, {
            data: data,
            outFields: layerDefinition.fields
          }, {
            formatNumber: true,
            formatDate: true,
            formatCodedValue: true,
            popupInfo: popupInfo,
            richText: {}
          }).then(lang.hitch(this, function(result) {
            var datas = result.datas;
            var outFeatureset = new FeatureSet();
            var features = [];
            array.forEach(featureSet.features, function(feature, index) {
              var g = new Graphic(feature.toJson());
              g.attributes = datas[index];
              features.push(g);
            });
            outFeatureset.features = features;
            outFeatureset.geometryType = featureSet.geometryType;
            outFeatureset.fieldAliases = featureSet.fieldAliases;
            outFeatureset.fields = featureSet.fields;
            def.resolve(outFeatureset);
          }));
        } else {
          def.resolve(featureSet);
        }
        return def;
      },

      exportCSV: function() {
        return this.getFeatureSet().then(lang.hitch(this, function(fs){
          var popupInfo = this.findPopupInfo(fs);
          var layerDefinition = this.findLayerDefinition(fs);
          var features = fs.features;
          if (layerDefinition && layerDefinition.fields) {
            var outFields = lang.clone(layerDefinition.fields);
            this._addXYAttribute(outFields, 'x');
            this._addXYAttribute(outFields, 'y');
            layerDefinition.fields = outFields;
            features = [];
            array.forEach(fs.features, lang.hitch(this, function(feature) {
              var graphic = new Graphic(feature.toJson());
              graphic.attributes = this._getAttrsWithXY(graphic);
              features.push(graphic);
            }));
          }
          return CSVUtils.exportCSVByGraphics(
            this.filename,
            layerDefinition,
            features,
            {
              formatNumber: true,
              formatDate: true,
              formatCodedValue: true,
              popupInfo: popupInfo
            });
        }));
      },

      exportGeoJSON: function() {
        return this.getFeatureSet()
        .then(lang.hitch(this, function(fs) {
          return this.formatAttributes(fs);
        }))
        .then(lang.hitch(this, function(fs) {
          return this._projectToWGS84(fs);
        }))
        .then(lang.hitch(this, function(featureset){
          var str = '';
          if(featureset && featureset.features && featureset.features.length > 0){
            var jsonObj = {
              type: 'FeatureCollection',
              features: []
            };
            array.forEach(featureset.features, function(feature) {
              jsonObj.features.push(GeojsonConverters.arcgisToGeoJSON(feature));
            });
            str = JSON.stringify(jsonObj);
          }
          return str;
        }))
        .then(lang.hitch(this, function(str){
          download(this.filename + '.geojson', str);
        }));
      },

      exportFeatureCollection: function() {
        return this.getFeatureSet()
        .then(lang.hitch(this, function(fs) {
          return this.formatAttributes(fs);
        }))
        .then(lang.hitch(this, function(fs){
          var str = '';
          if(fs){
            var jsonObj = fs.toJson();
            if(jsonObj){
              str = JSON.stringify(jsonObj);
            }
          }
          return str;
        }))
        .then(lang.hitch(this, function(str){
          download(this.filename + '.json', str);
        }));
      },

      exportToPortal: function(format, itemName){
        /*jshint unused: false*/
      },

      _projectToWGS84: function(featureSet) {
        var ret = new Deferred();
        var sf = this._getSpatialReference(featureSet);
        if (!sf) {
          ret.resolve([]);
        } else {
          var wkid = parseInt(sf.wkid, 10);

          if (wkid === 4326) {
            ret.resolve(featureSet);
          } else if (sf.isWebMercator()) {
            var outFeatureset = new FeatureSet();
            var features = [];
            array.forEach(featureSet.features, function(feature) {
              var g = new Graphic(feature.toJson());
              g.geometry = webMercatorUtils.webMercatorToGeographic(feature.geometry);
              features.push(g);
            });
            outFeatureset.features = features;
            outFeatureset.geometryType = featureSet.geometryType;
            outFeatureset.fieldAliases = featureSet.fieldAliases;
            outFeatureset.fields = featureSet.fields;
            ret.resolve(outFeatureset);
          } else {
            var params = new ProjectParameters();
            params.geometries = array.map(featureSet.features, function(feature) {
              return feature.geometry;
            });
            params.outSR = new SpatialReference(4326);

            var gs = esriConfig && esriConfig.defaults && esriConfig.defaults.geometryService;
            var existGS = gs && gs.declaredClass === "esri.tasks.GeometryService";
            if (!existGS) {
              gs = jimuUtils.getArcGISDefaultGeometryService();
            }

            gs.project(params).then(function(geometries) {
              var outFeatureset = new FeatureSet();
              var features = [];
              array.forEach(featureSet.features, function(feature, i) {
                var g = new Graphic(feature.toJson());
                g.geometry = geometries[i];
                features.push(g);
              });
              outFeatureset.features = features;
              outFeatureset.geometryType = featureSet.geometryType;
              outFeatureset.fieldAliases = featureSet.fieldAliases;
              outFeatureset.fields = featureSet.fields;
              ret.resolve(outFeatureset);
            }, function(err) {
              console.error(err);
              ret.resolve([]);
            });
          }
        }
        return ret;
      },

      _getSpatialReference: function(featureset) {
        if (featureset.spatialReference) {
          return featureset.spatialReference;
        }
        // Get spatial refrence from graphics
        var sf;
        array.some(featureset.features, function(feature) {
          if (feature.geometry && feature.geometry.spatialReference){
            sf = feature.geometry.spatialReference;
            return true;
          }
        });
        return sf;
      },

      _getAttrsWithXY: function(graphic) {
        var geometry = graphic.geometry;
        if (geometry && geometry.type === 'point') {
          var attrs = lang.clone(graphic.attributes);
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
          return attrs;
        }

        return graphic.attributes;
      },

      _addXYAttribute: function(outFields, fieldName) {
        var name;
        var exists = array.some(outFields, function(field) {
          return field.name === fieldName;
        });
        if (exists) {
          name = '_' + fieldName;
        } else {
          name = fieldName;
        }
        outFields.push({
          name: name,
          alias: name,
          format: {
            'digitSeparator': false,
            'places': 6
          },
          show: true,
          type: "esriFieldTypeDouble"
        });
        return outFields;
      }
    });

    function download(filename, text) {
      if (dojo.isIE < 10) {
        saveTextAs(text, filename, 'utf-8');
      }else{
        var blob = new Blob([text], {type: 'text/plain;charset=utf-8'});
        // Use saveAs(blob, name, true) to turn off the auto-BOM stuff
        saveAs(blob, filename, true);
      }
    }

    return mo;
  });
