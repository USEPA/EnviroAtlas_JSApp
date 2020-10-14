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

define(['dojo/Evented',
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  "dijit/_WidgetsInTemplateMixin",
  'dojo/on',
  'dojo/_base/array',
  'dojo/_base/html',
  'jimu/LayerInfos/LayerInfos',
  "jimu/dijit/LayerChooserFromMapLite",
  'dojo/Deferred',
  "../MultSelector/MultSelector",
  "dojo/text!./LayersSetting.html",
  'jimu/dijit/LoadingShelter',
  "jimu/utils",
  "jimu/dijit/CheckBox",
  "dijit/form/Select",
  "dojox/form/CheckedMultiSelect",
  "dijit/form/ValidationTextBox"
],
  function (Evented, declare, lang,
    _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,
    on, array, html, LayerInfos, LayerChooserFromMapLite, Deferred, MultSelector,
    template, LoadingShelter, jimuUtils) {
    var clazz = declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Evented], {
      templateString: template,
      /*
        config = {
          layerMode
          layer
          defaultLayers
          layerState
        }
      */
      postCreate: function () {
        this.shelter = new LoadingShelter({
          hidden: true
        });

        //this._initMultSelectorEvent();
        this.defaultLayersSelector = new MultSelector({
          nls: this.nls
        }, this.defaultLayersSelectorContainer);
        this.defaultLayersSelector.startup();

        //update swipeLayers
        this.shelter.show();
        this._getLayerInfoObj(this.map).then(lang.hitch(this, function () {
          this._setDefaultLayerByState(this.config.layerState);
        }), function (err) {
          console.log(err);
        }).always(lang.hitch(this, function () {
          this.shelter.hide();
        }));

        this.own(on(this.singleLayerRaido, 'change', lang.hitch(this, function () {
          if (this.singleLayerRaido.checked) {
            html.addClass(this.defaultLayersContainer, "hide");
            html.removeClass(this.swipeLayersContainer, "hide");
            this.emit("change", { mode: "single" });
          }
        })));
        this.own(on(this.multipleLayerRaido, 'change', lang.hitch(this, function () {
          if (this.multipleLayerRaido.checked) {
            html.removeClass(this.defaultLayersContainer, "hide");
            html.addClass(this.swipeLayersContainer, "hide");
            this.emit("change", { mode: "mult" });
          }
        })));

        this.inherited(arguments);
      },

      startup: function () {
        this.inherited(arguments);
      },

      setConfig: function (config) {
        this.config = config;
        //swipe mode
        if (this.config.layerMode === "mult") {
          this.multipleLayerRaido.setChecked(true);
        } else {
          this.singleLayerRaido.setChecked(true);
        }

        //layers to swipe(no set method so create it in setConfig)
        if (!this._layerChooserFromMap) {
          //filter for LayerChooserFromMap
          var filter = function (layerInfo) {
            var def = new Deferred();

            var webmapLayerInfoArray = LayerInfos.getInstanceSync().getLayerInfoArrayOfWebmap();
            var isWebmapLayerInfo = array.some(webmapLayerInfoArray, function (webmapLayerInfo) {
              if (webmapLayerInfo.id === layerInfo.id) {
                return true;
              }
            }, this);

            if (!isWebmapLayerInfo) {
              def.resolve(false);
            } else if (layerInfo.isRootLayer()) {
              def.resolve(true);
            } else {
              var layerInTheMap = this.map.getLayer(layerInfo.id);
              if (layerInTheMap) {
                def.resolve(true);
              } else {
                def.resolve(false);
              }
            }
            return def;
          };

          this._layerChooserFromMap = new LayerChooserFromMapLite({
            showTables: false,
            onlyShowWebMapLayers: true,//hide layers that runtime added
            customFilter: lang.hitch(this, filter),
            layerState: this.config.layerState
          });
          this._layerChooserFromMap.placeAt(this.layersChooser);
          this._layerChooserFromMap.startup();

          //hide collapseIcon of MapServiceLayer
          array.forEach(this._layerInfosObj.getLayerInfoArray(), function (layerInfo) {
            if (layerInfo && layerInfo.layerObject && layerInfo.layerObject.declaredClass &&
              (layerInfo.layerObject.declaredClass === "esri.layers.ArcGISDynamicMapServiceLayer" ||
                layerInfo.layerObject.declaredClass === "esri.layers.ArcGISTiledMapServiceLayer" ||
                layerInfo.layerObject.declaredClass === "esri.layers.FeatureCollection")) {
              var domNodes = this._layerChooserFromMap.getLayerAssociateDomNodesById(layerInfo.id);
              if (domNodes) {
                var collapseIcon = domNodes.collapseIcon;
                html.addClass(collapseIcon, "transparent");
              }
            }
          }, this);

          this.own(on(this._layerChooserFromMap, 'tree-click', lang.hitch(this, function () {
            var layerOptions = this._layerChooserFromMap.getState();
            this._setDefaultLayerByState(layerOptions);

            if (this._isLayersChooserStateEmpty()) {//set error info, when no selected
              this.swipeLayers.set('options', [{ value: "", label: "" }]);
              this.swipeLayers.reset();

              //this.defaultLayers.setOptions([{ value: "", label: "" }]);
              this.defaultLayersSelector.reset();
            }
          })));
        }

        //default layerlayer
        var st = this._getOptionsFromState(this.config.layerState);
        if (this._isSelectedLayerInOptions(st)) {
          this.swipeLayers.set('value', this.config.layer);//select one
        } else {
          //do nothing
        }

        // this.own(on(this.defaultLayers, 'change', lang.hitch(this, function () {
        if (!this.config.defaultLayers) {
          this.config.defaultLayers = [];
        }
        this.defaultLayersSelector.setConfig(this.config.defaultLayers);
      },
      getConfig: function (settingConfig) {
        if (this.multipleLayerRaido.checked) {
          settingConfig.layerMode = "mult";
        } else {
          settingConfig.layerMode = "single";
        }

        settingConfig.layer = this.swipeLayers.get('value');
        settingConfig.defaultLayers = this.defaultLayersSelector.getConfig();
        settingConfig.layerState = this._layerChooserFromMap.getState();
        //settingConfig.

        return this.config;
      },

      setLayerInfoText: function (text) {
        this.layerTextNode.innerHTML = jimuUtils.sanitizeHTML(text);
      },

      //0. init
      _getLayerInfoObj: function (map) {
        return LayerInfos.getInstance(map, map.itemInfo)
          .then(lang.hitch(this, function (layerInfosObj) {
            this._layerInfosObj = layerInfosObj;

            var infos = this._layerInfosObj.getLayerInfoArray();
            var data = array.filter(infos, lang.hitch(this, function (info) {
              if (!this._isNewAddedLayer(info)) {
                return true;
              }
            }));
            var options = array.map(data, function (info) {
              return {
                label: info.title,
                value: info.id
              };
            });

            this.swipeLayers.set('options', options);//set all layers in options, when init

            this.defaultLayersSelector.setOptions(options);
            //this._initMultSelectorLabel();
          }));
      },

      //2.layer chooser
      _isSelectedLayerInOptions: function (layers) {
        var layerId = this.config.layer || this.swipeLayers.getValue();//""==this.config.layer, when new widget
        for (var i = 0, len = layers.length; i < len; i++) {
          var item = layers[i];
          if (item.value === layerId) {
            return true;
          }
        }
        return false;
      },
      //3.default layer
      _setDefaultLayerByState: function (state) {
        if ("undefined" === typeof state || null === state) {
          this.defaultLayersSelector.initOptions(this.swipeLayers.getOptions(), true);
          return;
        }

        //single
        var layers = this._getOptionsFromState(state, true);

        this.swipeLayers.set('options', lang.clone(layers));
        if (!this._isSelectedLayerInOptions(layers) || //change selected option
          0 === layers.length) { //no layers choose
          this.swipeLayers.reset();//reset all options
        } else {
          this.swipeLayers.setValue(this.config.layer || this.swipeLayers.getValue());//just change other options
        }

        //mult
        //this._resetDefaultLayersOptions(layers);
        this.defaultLayersSelector.initOptions(layers, true);
      },


      _getOptionsFromState: function (layerOptions, isGetSelected) {
        var layers = [];
        if (!layerOptions) {
          return layers;
        }

        for (var key in layerOptions) {
          if (layerOptions.hasOwnProperty(key)) {
            var layer = layerOptions[key];
            if (true === layer.selected) {
              var layerInfo = this._layerInfosObj.getLayerInfoById(key);
              if (layerInfo && !this._isNewAddedLayer(layerInfo)) {
                var title = layerInfo.title;
                if (title) {
                  var obj = { value: key, label: title };
                  if (isGetSelected && layer.selected) {
                    obj.selected = true;
                  }

                  layers.push(obj);
                }
              }
            }
          }
        }

        return layers;
      },
      _isNewAddedLayer: function (layerInfo) {
        var webmapLayerInfoArray = this._layerInfosObj.getLayerInfoArrayOfWebmap();
        for (var i = 0, len = webmapLayerInfoArray.length; i < len; i++) {
          var webmapLayerInfo = webmapLayerInfoArray[i];
          if (webmapLayerInfo.id === layerInfo.id) {
            return false;
          }
        }

        return true;
      },
      _isLayersChooserStateEmpty: function () {
        var layers = this._getOptionsFromState(this._layerChooserFromMap.getState());
        if (0 === layers.length) {
          return true;
        }

        return false;
      }/*,
    _setError: function(){
      //html.removeClass(this.layersChooserError,"hide");
      html.addClass(this.layersChooser, "error");
    },
    _cleanError: function(){
      //html.addClass(this.layersChooserError,"hide");
      html.removeClass(this.layersChooser, "error");
    }*/
    });
    return clazz;
  });