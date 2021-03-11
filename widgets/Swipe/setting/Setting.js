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
  'jimu/BaseWidgetSetting',
  'dijit/_WidgetsInTemplateMixin',
  'dojo/_base/lang',
  'dojo/on',
  'dojo/_base/html',
  '../utils',
  './LayersSetting',
  './Placement',
  'jimu/dijit/LoadingShelter',
  'jimu/dijit/CheckBox',
  'jimu/dijit/RadioBtn',
  'dijit/form/Select',
  "jimu/dijit/ColorPickerButton"
],
  function (
    declare, BaseWidgetSetting, _WidgetsInTemplateMixin,
    lang, on, html, utils, LayersSetting, Placement,
    LoadingShelter, CheckBox) {
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
      baseClass: 'jimu-widget-swipe-setting',
      _selectedStyle: "",

      postCreate: function () {
        this.placement = new Placement({
          nls: this.nls,
          config: this.config
        }, this.placementContainer);
        this.placement.startup();

        this.own(on(this.verticalNode, 'click', lang.hitch(this, function () {
          this._selectItem('vertical');
        })));
        this.own(on(this.horizontalNode, 'click', lang.hitch(this, function () {
          this._selectItem('horizontal');
        })));
        this.own(on(this.scopeNode, 'click', lang.hitch(this, function () {
          this._selectItem('scope');
        })));

        this.shelter = new LoadingShelter({
          hidden: true
        });
        this.shelter.placeAt(this.domNode);
        this.shelter.startup();

        this.layersSetting = new LayersSetting({
          nls: this.nls,
          map: this.map,
          config: this.config
        }, this.layersSettingContainer);
        this.layersSetting.startup();

        this.own(on(this.layersSetting, 'change', lang.hitch(this, function (obj) {
          if (obj.mode) {
            if (obj.mode === "single") {
              html.removeClass(this.isZoomNodeContainer, "hide");
            } else {
              html.addClass(this.isZoomNodeContainer, "hide");
            }
          }
        })));

        this.isZoomCheckBox = new CheckBox({
          label: this.nls.isZoom,
          checked: false
        }, this.isZoomNode);

        this.isHidePanel = new CheckBox({
          label: this.nls.hidePanel,
          checked: false
        }, this.isHidePanelNode);
      },

      startup: function () {
        this.inherited(arguments);
        this.setConfig(this.config);
      },
      getConfig: function () {
        //check error
        // if(this._checkIsError()){
        //   return false;
        // }
        this.config.style = this._selectedStyle;

        this.config.isZoom = this.isZoomCheckBox.getValue();
        this.config.isHidePanel = this.isHidePanel.getValue();
        //TODO save +title
        this.config.handleColor = this.colorPicker.getColor().toHex();

        this.config = this.layersSetting.getConfig(this.config);
        //this.config.layer =
        //this.config.layerState = this._layerChooserFromMap.getState();
        this.config.invertPlacement = this.placement.getConfig();

        return this.config;
      },
      setConfig: function (config) {
        this.config = config;
        if (this.config.style) {
          this._selectItem(this.config.style);
        } else {
          this._selectItem('vertical');
        }

        this.layersSetting.setConfig(this.config);
        //this.defaultLayersSetting.setConfig(this.config.layer);
        //isZoom
        if (true === this.config.isZoom) {
          this.isZoomCheckBox.setValue(true);
        } else {
          this.isZoomCheckBox.setValue(false);
        }

        if (true === this.config.isHidePanel) {
          this.isHidePanel.setValue(true);
        } else {
          this.isHidePanel.setValue(false);
        }

        if (!this.config.handleColor) {
          this.colorPicker.setColor(utils.processColor());
        } else {
          this.colorPicker.setColor(utils.processColor(this.config.handleColor));
        }
      },

      //swipe mode
      _selectItem: function (style) {
        var _layerText = "";
        this.placement.setVH(style);

        if (style === 'scope') {
          _layerText = this.nls.spyglassText;
          html.addClass(this.handlerColorPicker, "hide");
        } else if (style === 'horizontal') {
          _layerText = this.nls.layerText;
          html.removeClass(this.handlerColorPicker, "hide");
        } else {
          _layerText = this.nls.layerText;
          html.removeClass(this.handlerColorPicker, "hide");
        }
        this.layersSetting.setLayerInfoText(_layerText);

        if(this[style] && this[style].setChecked){
          this[style].setChecked(true);
        }

        this._selectedStyle = style;
      }
    });
  });
