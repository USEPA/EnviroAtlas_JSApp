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
  'dojo/_base/array',
  'dojo/_base/lang',
  'dojo/_base/html',
  'dojo/query',
  'dojo/on',
  'dojo/Deferred',
  './utils',
  "./MultSelector/MultSelector",
  "jimu/utils",
  'jimu/BaseWidget',
  'jimu/LayerInfos/LayerInfos',
  'dijit/_WidgetsInTemplateMixin',
  'esri/dijit/LayerSwipe',
  'dijit/form/Select',
  "./a11y/Widget"
],
  function (declare, array, lang, html, query, on, Deferred, utils, MultSelector, jimuUtils,
    BaseWidget, LayerInfos, _WidgetsInTemplateMixin, LayerSwipe, Select, a11y) {
    var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {
      baseClass: 'jimu-widget-swipe',

      swipeDijit: null,
      layerInfosObj: null,

      _loadDef: null,
      _obtainedLabelLayers: [],//label layer independent with main-label-layer
      _LAST_SELECTED: null,//the status for re-open

      getSwipeModeByConfig: function () {
        this._SWIPE_MODE = "";
        if (this.config.layerMode && this.config.layerMode === "mult") {
          this._SWIPE_MODE = "mult";

          html.addClass(this.singleLayersContainer, "hide");
          html.removeClass(this.multLayersContainer, "hide");
        } else {
          this._SWIPE_MODE = "single";

          html.removeClass(this.singleLayersContainer, "hide");
          html.addClass(this.multLayersContainer, "hide");
        }

        return this._SWIPE_MODE;
      },
      createSelector: function () {
        if (this._SWIPE_MODE === "mult") {
          //"mult"
          this.multLayersSelector = new MultSelector({
            nls: this.nls
          }, this.multSelectorContainer);
          this.multLayersSelector.startup();
          this.own(on(this.multLayersSelector, 'change', lang.hitch(this, this.onSwipeLayersChange)));
        } else {
          //"single"
          this.singleSelector = new Select({
            style: "width:100%"
          }, this.singleSelectorContainer);

          this.own(on(this.singleSelector, 'Change', lang.hitch(this, this.onSwipeLayersChange)));
          this.own(on(this.singleSelector, 'Click', lang.hitch(this, this.onSwipeLayersClick)));
          this.own(on(
            this.singleSelector.dropDown.domNode,
            'mouseenter',
            lang.hitch(this, this.onDropMouseEnter)
          ));
          this.own(on(
            this.singleSelector.dropDown.domNode,
            'mouseleave',
            lang.hitch(this, this.onDropMouseLeave)
          ));

          this.own(on(this.swipeLayersMenu, 'mouseleave', lang.hitch(this, this.onMenuMouseLeave)));
        }

        this.a11y_init();
        // this.a11y_updateFocusNodes({isFouceToFirstNode: true});
      },
      setDefaultOptions: function (layerInfos, isKeepSelection) {
        var data = [];
        if (!this.config.layerState) {
          //1 for old config:
          data = array.map(layerInfos, lang.hitch(this, function (info) {
            var mapInfo = {
              label: info.title,
              value: info.id
            };
            return mapInfo;//use all layers in layerInfo
          }));
        } else {
          //2 for new config:
          //2.1 layers in config or map
          if (utils.isTherePreconfiguredLayer(this.config/*, this._currentLayerId*/)) {
            var layerOptions = this.config.layerState;
            for (var key in layerOptions) {
              if (layerOptions.hasOwnProperty(key)) {
                var layer = layerOptions[key];
                if (true === layer.selected) {//selected in config
                  var layerInfo = this.layerInfosObj.getLayerInfoById(key);
                  if (layerInfo) {
                    if (layerInfo.isShowInMap()) {
                      var title = layerInfo.title;
                      data.push({ value: key, label: title });//add option
                    } else {
                      //invisible ignore
                    }
                  } else {
                    //be removed, ignore
                  }
                }
              }
            }
          }
          //2.2 new added layers(such as GP)
          for (var i = 0, len = layerInfos.length; i < len; i++) {
            var info = layerInfos[i];

            if (utils._isNewAddedLayer(info, this.layerInfosObj) && info.isShowInMap()) {
              var layerTitle = info.title;
              data.push({ value: info.id, label: layerTitle });//add option
            }
          }
        }

        //no-auto-selected flag, add for 7.1
        var stopAutoSelect = (true === this.config.isHidePanel);

        //set selected
        var lastSelectorValue;
        for (var ii = 0, leni = data.length; ii < leni; ii++) {
          var d = data[ii];

          if (this._LAST_SELECTED && this._LAST_SELECTED.mode === this.config.layerMode) {
            //use recorde
            for (var j = 0, lenJ = this._LAST_SELECTED.selected.length; j < lenJ; j++) {
              var old = this._LAST_SELECTED.selected[j];

              if (d.value === old) {
                d.selected = true;
                lastSelectorValue = d.value;
              }
            }
          } else {
            //all new
            if (this._isDefaultSelectedOption(d)) {
              d.selected = true;
              lastSelectorValue = d.value;
            }
          }

          //keep config-layerStatus, when layer visible changed
          if (stopAutoSelect) {
            var isNeedToSetSelected = utils.isDefaultSelectedLayerAndInShow(d,
                                        this.layerInfosObj, this.config, this._SWIPE_MODE);
            if (isNeedToSetSelected) {
              d.selected = true;
              isKeepSelection = false;//reset multLayersSelector
            }

            if (this._SWIPE_MODE !== "mult" && !isNeedToSetSelected) {
              d.selected = false;//reset singleSelector
            }
          }
        }

        if (isKeepSelection) {
          //keep single selector value
          if (this._SWIPE_MODE !== "mult") {
            lastSelectorValue = this.singleSelector.get('value');
          }
        }

        //set options
        if (this._SWIPE_MODE === "mult") {
          this.multLayersSelector.initOptions(data, isKeepSelection);
        } else {
          if (true === stopAutoSelect) {
            var defaultLayerInfo = this.layerInfosObj.getLayerInfoById(this.config.layer);
            if (defaultLayerInfo && !defaultLayerInfo.isShowInMap()) {
              this.singleSelector.set("options", [{ value: "", label: "", selected: false }]);//swipe base map, when preset layer inVisible
              this.singleSelector.reset();//must be rest for singleSelector
            } else {
              this.singleSelector.set('options', data);
              this.singleSelector.setValue(this.config.layer);//swipe the default layer
            }
          } else {
            this.singleSelector.set('options', data);
          }
        }

        this.disableSelectors();//for esc events

        //set selector vale, for no selected
        var selections = this.getSelection();
        if (true !== stopAutoSelect) {
          if (this._SWIPE_MODE === "mult") {
            //mult
            if (selections && "undefined" !== typeof selections.length && selections.length === 0) {
              var multOptions = this.multLayersSelector.getOptions();
              if (multOptions && "undefined" !== multOptions.length &&
                multOptions.length > 0 && multOptions[0].value) {
                //auto select the 1st new added layer, when no preconfig layer
                this.multLayersSelector.setValue(multOptions[0].value);
              }
            }
          } else {
            //single
            if (lastSelectorValue) {
              this.singleSelector.set('value', lastSelectorValue);
            } else if ((selections && selections.length && selections.length === 1) &&
              this.singleSelector.options && "undefined" !== this.singleSelector.options.length &&
              this.singleSelector.options.length > 0 && this.singleSelector.options[0].value) {

              this.singleSelector.set('value', this.singleSelector.options[0].value);
            }
          }
        }

        //init cache
        this._LAST_SELECTED = {
          mode: this._SWIPE_MODE,
          selected: this.getSelection()
        };

        this.enableSelectors();//for esc events

        this.toggleSelectorPopup();
      },

      _isSwipeBaseMap: function () {
        var selection = this.getSelection();
        if (selection && selection.length) {
          for (var i = 0, len = selection.length; i < len; i++) {
            var selectedLayer = selection[i];
            var lastLayerInfo = this.layerInfosObj.getLayerInfoById(selectedLayer);
            if (lastLayerInfo && lastLayerInfo.isShowInMap()) {
              return false;//selected layer is showing
            }
          }

          return true;
        } else {
          return true;//no selected
        }
      },

      _isDefaultSelectedOption: function (item) {
        var targetarray = [];

        if (this._SWIPE_MODE === "mult") {
          targetarray = this.config.defaultLayers;
        } else {
          targetarray.push(this.config.layer);
        }

        for (var i = 0, len = targetarray.length; i < len; i++) {
          var one = targetarray[i];
          if (one === item.value) {
            return true;
          }
        }
        return false;
      },

      toggleSelectorPopup: function () {
        //show / hide selector by layer number
        utils.showSelectorPopup(this.domNode);

        if (true === this.config.isHidePanel) {
          utils.hideSelectorPopup(this.domNode);
        }

        var options = this.getOptions();
        if (!options) {
          return;
        }
        if (this._SWIPE_MODE === "mult") {
          if (options.length === 0) { //hide popup when no options
            utils.hideSelectorPopup(this.domNode);
          }
        } else {
          if (options.length === 0 || options.length === 1) { //hide popup when no options & 1 optioon
            utils.hideSelectorPopup(this.domNode);
          }
        }
      },

      disableSelectors: function () {
        if (this._SWIPE_MODE === "mult") {
          this.multLayersSelector.disable();
        } else {
          this.singleSelector.set('disabled', true);//set disabled=true to escape events
        }
      },
      enableSelectors: function () {
        if (this._SWIPE_MODE === "mult") {
          this.multLayersSelector.enable();
        } else {
          this.singleSelector.set('disabled', false);
        }
      },
      getSelection: function () {
        var selection = [];
        if (this._SWIPE_MODE === "mult") {
          selection = this.multLayersSelector.getConfig();
        } else {
          selection.push(this.singleSelector.get("value"));
        }

        return selection;
      },
      isSelected: function (layer, options) {
        if (!options) {
          options = this.getSelection();
        }

        for (var i = 0, len = options.length; i < len; i++) {
          var selected = options[i];

          if (layer === selected) {
            return true;
          }
        }

        return false;
      },
      getOptions: function () {
        var options = [];
        if (this._SWIPE_MODE === "mult") {
          options = this.multLayersSelector.getOptions();
        } else {
          options = this.singleSelector.getOptions();
        }

        return options;
      },
      setSelection: function () {

      },
      onSelectorChange: function () {

      },
      _removeSingleSelectorOption: function (layer) {
        this.singleSelector.removeOption(layer);

        var options = this.singleSelector.getOptions();
        if (options.length === 0) {
          this.singleSelector.set("options", [{ value: "", label: "" }]);
          this.singleSelector.reset();
        }
      },
      ////////////////////////////////////////////////////////

      postCreate: function () {
        this.inherited(arguments);

        if (!this.config.style) {
          this.config.style = 'vertical';
        }
        if (!this.config.defaultLayers) {
          this.config.defaultLayers = [];
        }

        utils.cleanHandlerPosition();

        this.getSwipeModeByConfig();

        this.openAtStartAysn = true;
        this.createSelector();

        this.own(on(this.map, 'layer-add', lang.hitch(this, this._onMainMapBasemapChange)));

        this.a11y_initEvents();
      },

      _enableSwipe: function () {
        if (this._obtainedLabelLayers &&
          this._obtainedLabelLayers.length && this._obtainedLabelLayers.length > 0) {
          this._obtainedLabelLayers = [];
          //TODO
          // //single
          // var layerId = this.singleSelector.get('value');
          // var isBasemap = !(!!layerId);
          // //mult
          // var layerParams = this._getLayerParams(layerId, isBasemap);
          // this.swipeDijit.set('layers', layerParams);
        }

        this.swipeDijit.enable();
      },
      _disableSwipe: function () {
        if (this.swipeDijit && this.swipeDijit.disable) {
          this.swipeDijit.disable();

          array.forEach(this._obtainedLabelLayers, lang.hitch(this, function (labelLayer) {
            labelLayer.restoreLabelControl();
          }));
        }
      },

      onOpen: function () {
        if (true === this._isTestSizeFlag) {
          return;//skip first on-open(1st open called from jimu)
        }

        //re-create
        this._loadLayerInfos().then(lang.hitch(this, function () {
          var layerInfos = utils.getVisibleLayerInfos(this.layerInfosObj);

          this.setDefaultOptions(layerInfos);

          this.createSwipeDijit(/*selected*/);

          // this.a11y_updateFocusNodes({isFouceToFirstNode: true});
        }));
      },

      onClose: function () {
        if (true === this._isTestSizeFlag) {
          return;//skip first on-open(1st open from jimu)
        }

        this._LAST_SELECTED = {
          mode: this._SWIPE_MODE,
          selected: this.getSelection()
        };

        if (this._loadDef.isResolved()) {
          this._disableSwipe();
        } else if (!this._loadDef.isFulfilled()) {
          this._loadDef.cancel();
        }
      },

      createSwipeDijit: function () {
        this.destroySwipeDijit();

        var layerParams = [];

        var selectedLayers = this.getSelection();
        if (0 === selectedLayers.length) {
          layerParams = this._getLayerParams(null);//no selection
        } else {
          if (this._SWIPE_MODE === "mult") {
            for (var i = 0, len = selectedLayers.length; i < len; i++) {
              var layer = selectedLayers[i];
              layerParams = layerParams.concat(this._getLayerParams(layer));
            }
          } else {
            var selectedLayer = selectedLayers[0];
            layerParams = this._getLayerParams(selectedLayer);
          }
        }

        var options = {
          type: this.config.style || 'vertical',
          map: this.map,
          layers: layerParams,
          invertPlacement: this.config.invertPlacement
        };

        if (utils.isCacheHandlerPosition()) {
          utils.setHandlerPosition(options, this.config, this.map);
        } else {
          var middlePosition = utils.getScreenMiddle(this.map);
          options.top = middlePosition.top;
          options.left = middlePosition.left;
          //hack for spyglass mode: can't center it when set top/left
          if (this.config.style === "scope") {
            options.top -= 130;
            options.left -= 130;
          }
        }

        this.swipeDijit = new LayerSwipe(options, this.layerSwipe);
        this.swipeDijit.startup();

        this._setHandleColor();

        this._enableSwipe();

        html.place(this.swipeDijit.domNode, this.map.root, 'before');

        this._autoHideInfoWindow(layerParams);

        this.swipeDijit.on('swipe', lang.hitch(this, function (evt) {
          var swipeLayers = array.map(evt.layers, function (l) {
            return l.layer;
          });
          //API #629
          if (evt && evt.layers[0]) {
            var layerNode = utils.getLayerNode(evt.layers[0].layer);
            //console.log("top==>" + evt.layers[0].top + "__bottom==>" + evt.layers[0].bottom + "__left==>" + evt.layers[0].left + "__right==>" + evt.layers[0].right);
            if (this.config.invertPlacement) {
              var tr = utils.getLayerTransform(evt.layers[0], this.swipeDijit);
              //console.log("dx==>" + tr.dx + "__dy==>" + tr.dy);
              evt.layers[0].left = (evt.layers[0].left + tr.dx);
              evt.layers[0].top = (evt.layers[0].top + tr.dy);
            } else {
              if (layerNode && layerNode.style && this.map.navigationMode === "css-transforms") {
                evt.layers[0].right = evt.layers[0].right - evt.layers[0].left;
                evt.layers[0].left = 0;
                evt.layers[0].bottom = evt.layers[0].bottom - evt.layers[0].top;
                evt.layers[0].top = 0;
              }//else +0
            }
          }
          utils.saveHandlerPosition(evt.layers[0]);

          this._autoHideInfoWindow(swipeLayers);
        }));

        utils.hackToRefreshSwipe(this);//force refresh ui

        //set style of selector's popup
        this._initPopupStyle();
      },

      _getLayerParams: function (layerId) {
        var layerParams = [];

        var isBasemap = this._isSwipeBaseMap();
        if (isBasemap) {
          //1.can't swipe any layer, so swipe basemaps
          var basemaps = this.layerInfosObj.getBasemapLayers();
          array.forEach(basemaps, lang.hitch(this, function (basemap) {
            layerParams.push(this.map.getLayer(basemap.id));
          }));
        } else {
          //2. not basemap
          var info = this.layerInfosObj.getLayerInfoById(layerId);
          if (info && info.traversal) {
            //2.1 swipe layer that in layerInfos
            info.traversal(lang.hitch(this, function (_info) {
              var layer = this.map.getLayer(_info.id);
              if (layer) {
                layerParams.push(layer);
                this._obtainLabelControl(_info, layerParams);
              }
            }));
          } else {
            //2.2 for change map: should be empty, so should swipe basemaps
            var basemaps2 = this.layerInfosObj.getBasemapLayers();
            array.forEach(basemaps2, lang.hitch(this, function (basemap) {
              layerParams.push(this.map.getLayer(basemap.id));
            }));
          }
        }
        return layerParams;
      },

      destroySwipeDijit: function () {
        if (this.swipeDijit && this.swipeDijit.destroy) {
          try {
            this.swipeDijit.destroy();
          } catch (e) {
            console.log(e);
          }

          this.swipeDijit = null;

          this._restoreAllLabelControl();

          this.layerSwipe = html.create('div', {}, this.swipeLayersMenu, 'after');
        }
      },


      ///////////////////////////////////////////////////////
      onSwipeLayersChange: function () {
        if (!this.swipeDijit) {
          return;
        }

        if (this._SWIPE_MODE === "mult") {
          this.createSwipeDijit();
        } else {
          this.createSwipeDijit(/*layerId, isBasemap*/);

          utils.zoomToCurrentLayer(this);
        }

        this.toggleSelectorPopup();

        this.initSwipeLayersUi();
      },

      //layer visible / invisible
      onLayerInfosIsShowInMapChanged: function (/*evt*/) {
        if (!this.swipeDijit || !this.swipeDijit.enabled) {
          return;
        }

        var selectedOptions = this.getSelection();
        if (this._SWIPE_MODE !== "mult") {
          if (selectedOptions && selectedOptions[0] && "" !== selectedOptions[0]) {
            var selectedLayer = selectedOptions[0];

            var lastLayerInfo = this.layerInfosObj.getLayerInfoById(selectedLayer);
            if (lastLayerInfo && !lastLayerInfo.isShowInMap()) {
              this._removeSingleSelectorOption(selectedLayer);
            }
          }

          selectedOptions = this.getSelection();//update selection
        }

        var infos = utils.getVisibleLayerInfos(this.layerInfosObj, selectedOptions);
        this.setDefaultOptions(infos, true);//keep selection= true
        //this._setOptionsOfSwipeLayers(infos);
        //var currentLayers = this.swipeDijit.layers;
        //var basemaps = this.layerInfosObj.getBasemapLayers();
        // var swipeBasemap = array.every(basemaps, function (bm) {
        //   return array.some(currentLayers, function (cl) {
        //     return cl.id === bm.id;
        //   });
        // });
        // if (swipeBasemap && infos && infos[0] && infos[0].id) {
        //   this.singleSelector.set('value', infos[0].id);
        //   // there have a bug in Select dijit,so call this method manually
        //   this.onSwipeLayersChange();
        // }

        //delete option in singleSelector
      },
      _onMainMapBasemapChange: function (evt) {
        if (!(evt.layer && evt.layer._basemapGalleryLayerType)) {
          return;
        }

        var options = this.getOptions();
        if (options && options.length > 0) {
          return;
        } else if (this._loadDef.isResolved()) {
          var layerInfos = utils.getVisibleLayerInfos(this.layerInfosObj);
          this.setDefaultOptions(layerInfos);
          this.createSwipeDijit();
        }
      },
      //layer added / removed
      onLayerInfosChanged: function (layerInfo, changedType, layerInfoSelf) {
        /*jshint unused: false*/
        if (!this.swipeDijit || !this.swipeDijit.enabled) {
          return;
        }

        //getSelection
        var selectedOptions = this.getSelection();
        var infos = utils.getVisibleLayerInfos(this.layerInfosObj/*, this._currentLayerId*/);

        var isSelected = false;
        if (selectedOptions && selectedOptions[0]) {
          isSelected = true;
        }

        if (changedType === 'added') {
          var addLayer = layerInfoSelf.id;
          if(true !== this.config.isHidePanel){
            this._LAST_SELECTED.selected = [];//cache this layer
            this._LAST_SELECTED.selected.push(addLayer);
          }

          this.setDefaultOptions(infos, true); //keep selection= true

          if (false === isSelected && true !== this.config.isHidePanel) {
            if (this._SWIPE_MODE !== "mult") {
              this.singleSelector.set("value", addLayer);
            } else {
              this.multLayersSelector.setValue(addLayer);
            }
          }
        } else if (changedType === 'removed') {
          var deleteLayer = layerInfoSelf.id;
          var isSelectedDeleteLayer = this.isSelected(deleteLayer);

          var newInfos = utils.getVisibleLayerInfos(this.layerInfosObj);
          if (isSelectedDeleteLayer) {
            this._LAST_SELECTED = null; //clean cache, use setting config

            if (this._SWIPE_MODE !== "mult") {
              //single
              this._removeSingleSelectorOption(deleteLayer);
              this.setDefaultOptions(newInfos);
              this.createSwipeDijit();
            } else {
              //"mult"
              this.setDefaultOptions(newInfos);
            }
          } else {
            if (this._SWIPE_MODE !== "mult") {
              this._removeSingleSelectorOption(deleteLayer);//single
              this.toggleSelectorPopup();
            } else {
              this.setDefaultOptions(newInfos);//"mult"
            }
          }
        }
      },

      destroy: function () {
        this.destroySwipeDijit();
        this.inherited(arguments);
      },


      /////////////////////////////////////////////////////
      //layers
      _loadLayerInfos: function () {
        var def = new Deferred();
        this._loadDef = def;
        if (!this._loadDef.isResolved()) {
          LayerInfos.getInstance(this.map, this.map.itemInfo)
            .then(lang.hitch(this, function (layerInfosObj) {
              if (!def.isCanceled()) {
                this.layerInfosObj = layerInfosObj;
                this.own(on(layerInfosObj,
                  'layerInfosChanged',
                  lang.hitch(this, this.onLayerInfosChanged)));
                this.own(on(
                  layerInfosObj,
                  'layerInfosIsShowInMapChanged',
                  lang.hitch(this, this.onLayerInfosIsShowInMapChanged)));

                this._setHintStr();
                html.addClass(this.swipeIcon, 'swipe-icon-loaded');

                def.resolve();
              }
            }));
        } else {
          def.resolve();
        }

        return def;
      },
      _autoHideInfoWindow: function (layers) {
        var hideInfoWindow = utils.shouldHideInfoWindow(layers, this);
        if (hideInfoWindow) {
          this.map.infoWindow.hide();
        }
      },

      //swipe label layer
      _obtainLabelControl: function (info, layerParams) {
        var labelLayer = info.obtainLabelControl();
        if (labelLayer) {
          layerParams.push(labelLayer);

          this._obtainedLabelLayers.push(info);
        }
      },
      _restoreAllLabelControl: function () {
        array.forEach(this._obtainedLabelLayers, lang.hitch(this, function (labelLayer) {
          labelLayer.restoreLabelControl();
        }));
        this._obtainedLabelLayers = [];
      },

      //handle color
      _setHandleColor: function () {
        if (!this.swipeDijit || this.config.style === "scope") {
          return;
        }

        var moveable = this.swipeDijit.moveable.node;
        var container = query(".handleContainer", this.esriTimeSlider)[0];
        var handle = query(".handle", container)[0];

        if (moveable) {
          html.setStyle(moveable, "backgroundColor", utils.processColor(this.config.handleColor).toHex());
        }
        if (container) {
          html.setStyle(container, "backgroundColor", utils.processColor(this.config.handleColor).toHex());
        }
        if (handle) {
          html.setStyle(handle, "backgroundColor", utils.processColor(this.config.handleColor).toHex());
        }
      },

      //ui
      _getSelectorDom: function () {
        var dom;
        if (this._SWIPE_MODE === "mult") {
          dom = query(".dojoxCheckedMultiSelect>table", this.multLayersSelector.domNode)[0];
        } else {
          dom = this.singleSelector.domNode;
        }
        return dom;
      },
      initSwipeLayersUi: function () {
        // change the width of swipe menu to wrapping Select dijit
        var dom = this._getSelectorDom();
        var selectBox = html.getMarginBox(dom);
        // padding of swipeLayersMenu is 14, max-width of domNode is 350
        if (selectBox.w + 14 * 2 > 350) {
          html.setStyle(this.domNode, 'maxWidth', (selectBox.w + 28) + 'px');
        } else {
          html.setStyle(this.domNode, 'maxWidth', '');
        }

        //add tooltips on widget popup
        if (this._SWIPE_MODE === "mult") {
          var layerNameNodes = query(".multselector-label", dom);
          for (var i = 0, len = layerNameNodes.length; i < len; i++) {
            var node = layerNameNodes[i];
            html.attr(node, "title", node.innerText);
          }
        } else {
          var layerNameNode = query(".dijitSelectLabel.dijitValidationTextBoxLabel", dom)[0];
          html.attr(layerNameNode, "title", layerNameNode.innerText);
        }
      },
      onDropMouseEnter: function () {
        this._mouseOnDropDown = true;
      },
      onDropMouseLeave: function () {
        this._mouseOnDropDown = false;
        this.singleSelector.dropDown.onCancel();
      },
      onMenuMouseLeave: function () {
        setTimeout(lang.hitch(this, function () {
          if (!this._mouseOnDropDown) {
            this.singleSelector.dropDown.onCancel();
          }
        }), 10);
      },
      onSwipeLayersClick: function () {
        var dropDown = this.singleSelector.dropDown;
        var layerList = query(".dijitReset.dijitMenuItemLabel", dropDown.domNode);
        for (var i = 0, len = layerList.length; i < len; i++) {
          var layer = layerList[i];
          html.attr(layer, "title", layer.innerText);
        }
      },
      _initPopupStyle: function(){
        //set style of selector's popup
        if (this._SWIPE_MODE === "mult") {
          html.addClass(this.multLayersSelector.selector.dropDownMenu.domNode, "jimu-widget-swipe-popup");
        } else {
          html.addClass(this.singleSelector.dropDown.domNode, "jimu-widget-swipe-popup");
        }
      },
      _onShowDetailIconClick: function(){
        html.toggleClass(this.showDetailIcon, "fold");

        if (!html.hasClass(this.showDetailIcon, "fold")) {
          html.removeClass(this.selectorsContainer, "hide");
          html.setAttr(this.showDetailIcon, "title", this.nls.hideList);

          html.removeClass(this.domNode, "transparent");

          this.a11y_setFocusUnfold();
        } else {
          html.addClass(this.selectorsContainer, "hide");
          html.setAttr(this.showDetailIcon, "title", this.nls.showList);

          html.addClass(this.domNode, "transparent");

          this.a11y_setFocusFold();
        }

        this._setHintStr();
      },
      _setHintStr: function(){
        if (html.hasClass(this.showDetailIcon, "fold")) {
          var selectedNumber = 0;
          if (this._SWIPE_MODE === "mult") {
            selectedNumber = this.multLayersSelector.getConfig().length;
          } else {
            selectedNumber = ("" === this.singleSelector.getValue() ? 0 : 1);
          }

          this.hintNode.innerHTML = jimuUtils.sanitizeHTML(selectedNumber + " " + this.nls.nItemsSelected);
        } else {
          if (this.config.style === 'scope') {
            this.hintNode.innerHTML = this.nls.spyglassText;
          } else {
            this.hintNode.innerHTML = this.nls.swipeText;
          }
        }
      }
    });

    clazz.extend(a11y);//for a11y
    return clazz;
  });