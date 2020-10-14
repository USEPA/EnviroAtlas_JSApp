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
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/Evented',
  'dijit/_WidgetBase',
  './utils'
],
  function (declare, lang, array, Evented, _WidgetBase, utils) {
    var clazz = declare([_WidgetBase, Evented], {
      nls: null,
      map: null,
      layerInfosObj: null,

      setLayerInfosObj: function (layerInfosObj) {
        this.layerInfosObj = layerInfosObj;
      },
      setTimeSlider: function (timeSlider) {
        this.timeSlider = timeSlider;
      },

      //hack layer.useMapTime
      //bacause most of layerData come form API, but mapViewer could set some config in json(eg:disable time)
      //so we mix those in layerData
      processTimeDisableLayer: function () {
        var i = 0, len, layer, layerId;
        for (i = 0, len = this.map.layerIds.length; i < len; i++) {
          layerId = this.map.layerIds[i];
          layer = this.map.getLayer(layerId);

          this._processTimeUpdate(layer);
        }

        for (i = 0, len = this.map.graphicsLayerIds.length; i < len; i++) {
          layerId = this.map.graphicsLayerIds[i];
          layer = this.map.getLayer(layerId);

          this._processTimeUpdate(layer);
        }

        //TODO config
        //utils.setLayersUseMapTimebyConfig(this.layerInfosObj, this.config);
      },
      _processTimeUpdate: function (layer) {
        // var _layerInfo = null;
        // var timeAnimation = true;
        // _layerInfo = this.layerInfosObj.getLayerInfoById(layer.id);
        // //disable time in mapViewer, when timeAnimation=false
        // timeAnimation = _layerInfo && _layerInfo.originOperLayer &&
        //   (_layerInfo.originOperLayer.timeAnimation !== false);
        // if (!timeAnimation && 'setUseMapTime' in layer) {
        //   //layer.setUseMapTime(false);
        // }
        var isEnabled = utils.isLayerEnabledTime(layer, this.layerInfosObj);
        if (layer.setUseMapTime) {
          //restore enable/disable to webmap
          if (true !== isEnabled) {
            layer.setUseMapTime(false);
          } else {
            layer.setUseMapTime(true);
          }
        }
      },

      //TODO should be delete
      processerDisableLayers: function (props) {
        if (!props || !props.disabledLayers) {
          return;
        }

        array.map(props.disabledLayers, lang.hitch(this, function (layer) {
          if (true !== layer.isTimeEnabled) {
            var layerInfo = this.layerInfosObj.getLayerInfoById(layer.layerId);
            if (layerInfo && layerInfo.layerObject && layerInfo.layerObject.setUseMapTime) {
              layerInfo.layerObject.setUseMapTime(false);
            }
          }
        }));
      },

      hasVisibleTemporalLayer: function () {
        var i = 0,
          len, layer, layerId;
        for (i = 0, len = this.map.layerIds.length; i < len; i++) {
          layerId = this.map.layerIds[i];
          layer = this.map.getLayer(layerId);

          if (this._isTimeTemporalLayer(layer, true)) {//mustVisible
            return true;
          }
        }

        for (i = 0, len = this.map.graphicsLayerIds.length; i < len; i++) {
          layerId = this.map.graphicsLayerIds[i];
          layer = this.map.getLayer(layerId);

          if (this._isTimeTemporalLayer(layer, true)) {//mustVisible
            return true;
          }
        }

        return false;
      },
      _isTimeTemporalLayer: function (layer, isMustVisible) {
        if (!layer) {
          return false;
        }

        //use useMapTime instead of timeAnimation to filter enable/disable
        var condition = (layer && layer.timeInfo && layer.useMapTime);
        //consider with visibility
        if (true === isMustVisible) {
          condition = (condition && layer.visible);
        }

        if (condition) {
          var layerType = layer.declaredClass;
          if (layerType === "esri.layers.KMLLayer") {
            var internalLayers = layer.getLayers();
            var some = array.some(internalLayers, function (kLayer) {
              if (kLayer.timeInfo && kLayer.timeInfo.timeExtent) {
                return true;
              }
              return false;
            });
            if (some) {
              return true;
            }
          } else if (layer.timeInfo && layer.timeInfo.timeExtent) {
            return true;
          }
        } else {
          return false;
        }
      },

      _getVisibleTemporalLayerNames: function () {
        var i = 0,
          len, layer, layerId;
        var ids = [];
        for (i = 0, len = this.map.layerIds.length; i < len; i++) {
          layerId = this.map.layerIds[i];
          layer = this.map.getLayer(layerId);

          if (this._isTimeTemporalLayer(layer, true)) {
            ids.push(layer.id);
          }
        }

        for (i = 0, len = this.map.graphicsLayerIds.length; i < len; i++) {
          layerId = this.map.graphicsLayerIds[i];
          layer = this.map.getLayer(layerId);

          if (this._isTimeTemporalLayer(layer, true)) {
            ids.push(layer.id);
          }
        }

        var names = array.map(ids, lang.hitch(this, function (id) {
          var info = this.layerInfosObj.getLayerInfoById(id);
          return info.title || "";
        }));

        return names;
      },

      //for layerInfo event changed
      _onLayerInfosIsShowInMapChanged: function (changedLayerInfos) {
        var timeTemporalLayerChanged = array.some(
          changedLayerInfos,
          lang.hitch(this, function (layerInfo) {
            var _layer = null;
            while (!_layer) {
              _layer = this.map.getLayer(layerInfo.id);
              layerInfo = layerInfo.parentLayerInfo;
            }

            return this.layerProcesser._isTimeTemporalLayer(_layer);
          }));

        if (timeTemporalLayerChanged) {
          this.layerProcesser._onTimeTemportalLayerChanged(this);
        }
      },
      _onLayerInfosChanged: function (layerInfo, changedType, layerInfoSelf) {
        /* jshint unused:true */
        if (changedType === 'added') {
          var _layer = this.map.getLayer(layerInfoSelf.id);
          var visibleTimeTemporalLayerChanged = this.layerProcesser._isTimeTemporalLayer(_layer, true);

          if (visibleTimeTemporalLayerChanged) {
            this.layerProcesser._onTimeTemportalLayerChanged(this);
          }
        } else if (changedType === 'removed') {
          this.layerProcesser._onTimeTemportalLayerChanged(this);
        }
      },
      _onTimeTemportalLayerChanged: function (that) {
        if (that.state !== 'closed') {
          if (that.layerProcesser.hasVisibleTemporalLayer()) {
            if (that.timeSlider) {
              that.updateLayerLabel();
            } else {
              that.showTimeSlider();
            }
          } else {
            if (that.timeSlider) {
              that.closeTimeSlider();
            }
          }
        }
      },

      hasLiveDataLayer: function () {
        var i = 0, len, layer, layerId;
        for (i = 0, len = this.map.layerIds.length; i < len; i++) {
          layerId = this.map.layerIds[i];
          layer = this.map.getLayer(layerId);

          if (utils.hasLiveData(layer)) {
            return true;
          }
        }

        for (i = 0, len = this.map.graphicsLayerIds.length; i < len; i++) {
          layerId = this.map.graphicsLayerIds[i];
          layer = this.map.getLayer(layerId);

          if (utils.hasLiveData(layer)) {
            return true;
          }
        }

        return false;
      }
    });

    return clazz;
  });