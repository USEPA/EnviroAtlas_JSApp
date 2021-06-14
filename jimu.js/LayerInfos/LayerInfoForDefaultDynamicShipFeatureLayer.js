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
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/Deferred',
  'esri/layers/FeatureLayer',
  'esri/tasks/query',
  './LayerInfoForDefaultDynamic'
], function(declare, lang, Deferred, FeatureLayer, Query, LayerInfoForDefaultDynamic) {
  var clazz = declare(LayerInfoForDefaultDynamic, {

    _msShipFeatureLayerId: null,
    _msOwnedFeatureLayerDef: null,
    _msOwnedLayerInfo: null,   // does not added to the layerInfos

    // operLayer = {
    //    layerObject: layer,
    //    title: layer.label || layer.title || layer.name || layer.id || " ",
    //    id: layerId || " ",
    //    subLayers: [operLayer, ... ],
    //    mapService: {layerInfo: , subId: },
    //    selfType:
    // };
    constructor: function(operLayer, map) {
      /*jshint unused: false*/
      this._msShipFeatureLayerId = operLayer.msShipFLayerId;
    },

    _initAfterRootLayerInfo: function() {
      var msShipFeatureLayer = this.map.getLayer(this._msShipFeatureLayerId);
      if(msShipFeatureLayer) {
        this._initPopupInfo(msShipFeatureLayer);
      }
    },

    _initPopupInfo: function(msShipFeatureLayer) {
      // sync infoTempalte from msShipFeatureLayer to msLayer.
      var mapServiceLayerInfo = this.originOperLayer.mapService.layerInfo;
      //var mapServiceLayer = mapServiceLayerInfo.layerObject;
      var subId = this.originOperLayer.mapService.subId;
      if(msShipFeatureLayer) {
        if(msShipFeatureLayer.infoTemplate) {
          mapServiceLayerInfo.controlPopupInfo.infoTemplates[subId] = {
            infoTemplate: msShipFeatureLayer.infoTemplate,
            layerUrl: this.getUrl()
          };
          this.enablePopup();
        } else {
          mapServiceLayerInfo.controlPopupInfo.infoTemplates[subId] = {
            infoTemplate: null,
            layerUrl: this.getUrl()
          };
          this.disablePopup();
        }
      }
    },

    _initMSOwnedFeatureLayer: function() {
      var msOwnedFeatureLayer = this.map.getLayer(this.id);
      var msShipFeatureLayer = this.map.getLayer(this._msShipFeatureLayerId);
      if(msShipFeatureLayer && !msOwnedFeatureLayer) {
        this._msOwnedFeatureLayerDef = new Deferred();
        msOwnedFeatureLayer = new FeatureLayer(msShipFeatureLayer.url, lang.mixin({}, msShipFeatureLayer));
        msOwnedFeatureLayer.id = this.id;
        msOwnedFeatureLayer.visible = this.isShowInMap();
        lang.setObject('_wabProperties.isMSOwnedFeatureLayer', true, msOwnedFeatureLayer);
        this.map.addLayer(msOwnedFeatureLayer);
        this._initMsOwnedLayerInfo(msOwnedFeatureLayer);
        var loadHandle = msOwnedFeatureLayer.on('load', lang.hitch(this, function() {
          this.layerObject = msOwnedFeatureLayer;
          this._msOwnedFeatureLayerDef.resolve(msOwnedFeatureLayer);
          if(loadHandle.remove) {
            loadHandle.remove();
          }
        }));
      }
    },

    _initMsOwnedLayerInfo: function(msOwnedFeatureLayer) {
      var operLayer = {
        layerObject: msOwnedFeatureLayer,
        title: this.title + "_owned_",
        id: msOwnedFeatureLayer.id
      };
      this._msOwnedLayerInfo = this._layerInfoFactory.create(operLayer, this.map);
    },

    _msShipIsValid: function() {
      var msShipFeatureLayer = this.map.getLayer(this._msShipFeatureLayerId);
      var msOwnedFeatureLayer = this.map.getLayer(this.id);
      return msShipFeatureLayer && msOwnedFeatureLayer;
    },

    getMSShipFeatures: function(MSLFeatures) {
      var def = new Deferred();
      var msShipFeatureLayer = this.map.getLayer(this._msShipFeatureLayerId);
      if(MSLFeatures && msShipFeatureLayer) {
        var query = new Query();
        query.objectIds = MSLFeatures.map(lang.hitch(this, function(feature) {
          return feature.attributes[msShipFeatureLayer.objectIdField];
        }));
        msShipFeatureLayer.queryFeatures(query, lang.hitch(this, function(featureSet) {
          def.resolve(featureSet.features);
        }), lang.hitch(this, function() {
          def.resolve(null);
        }));
      } else {
        def.resolve(null);
      }
      return def;
    }

    /***************************************************
     * overwrite methods
     ***************************************************/

  });
  return clazz;
});
