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
  'dojo/Deferred',
  //'jimu/dijit/ColorTransparencyPicker',
  'dojo/_base/lang',
  'dojo/on',
  //'dojo/_base/html',
  //"../utils",
  //'jimu/utils',
  './BaseLayerConfig',
  'jimu/dijit/CheckBox',
  'jimu/dijit/RadioBtn'
],
  function (
    declare, BaseWidgetSetting, _WidgetsInTemplateMixin, Deferred,//ColorTransparencyPicker,
    lang, on,/* html, utils, jimuUtils,*/ BaseLayerConfig,
    CheckBox) {
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
      baseClass: 'jimu-widget-overviewmap-setting',
      //_defaultColor: "#000",
      //_defaultTransparency: 0.5,
      _selectedAttachTo: "",

      postCreate: function () {
        this.expandBox = new CheckBox({
          label: this.nls.expandText,
          checked: false
        }, this.expandBox);
        this.expandBox.startup();

        this.own(on(this.topLeftNode, 'click', lang.hitch(this, function () {
          this._selectItem('top-left');
        })));
        this.own(on(this.topRightNode, 'click', lang.hitch(this, function () {
          this._selectItem('top-right');
        })));
        this.own(on(this.bottomLeftNode, 'click', lang.hitch(this, function () {
          this._selectItem('bottom-left');
        })));
        this.own(on(this.bottomRightNode, 'click', lang.hitch(this, function () {
          this._selectItem('bottom-right');
        })));

        this.baseLayerConfig = new BaseLayerConfig({
          nls: this.nls, config: this.config, map: this.map
        }, this.baseLayerConfigContainer);
        this.baseLayerConfig.startup();
      },

      startup: function () {
        this.inherited(arguments);
        if (!this.config.overviewMap) {
          this.config.overviewMap = {};
        }

        this.setConfig(this.config);
      },

      setConfig: function (config) {
        this.config = config;
        this.expandBox.setValue(config.overviewMap.visible);
        if (this.config.overviewMap.attachTo) {
          this._selectItem(this.config.overviewMap.attachTo);
        } else {
          var _attachTo = "";
          if (this.position) {
            if (this.position.top !== undefined && this.position.left !== undefined) {
              _attachTo = !window.isRTL ? "top-left" : "top-right";
            } else if (this.position.top !== undefined && this.position.right !== undefined) {
              _attachTo = !window.isRTL ? "top-right" : "top-left";
            } else if (this.position.bottom !== undefined && this.position.left !== undefined) {
              _attachTo = !window.isRTL ? "bottom-left" : "bottom-right";
            } else if (this.position.bottom !== undefined && this.position.right !== undefined) {
              _attachTo = !window.isRTL ? "bottom-right" : "bottom-left";
            }
          } else {
            _attachTo = !window.isRTL ? "top-right" : "top-left";
          }
          this._selectItem(_attachTo);
        }

        this.baseLayerConfig.setValues(this.config);
      },
      // _setColor: function(){
      //   var color = this._defaultColor;
      //   var transparency = this._defaultTransparency;
      //   if (bg) {
      //     color = bg.color;
      //     transparency = bg.transparency;
      //   }
      //   this.backgroundColorPicker.setValues({
      //     "color": color,
      //     "transparency": transparency
      //   });
      // },
      _selectItem: function (attachTo) {
        if (this[attachTo] && this[attachTo].setChecked) {
          this[attachTo].setChecked(true);
        }

        this._selectedAttachTo = attachTo;
      },

      _getSelectedAttachTo: function () {
        return this._selectedAttachTo;
      },

      getConfig: function () {
        var def = new Deferred();
        this.baseLayerConfig.isValid().then(lang.hitch(this, function (res) {
          if (false === res) {
            def.resolve(false);//inValid
          } else {
            this.config.overviewMap.visible = this.expandBox.checked;
            this.config.overviewMap.attachTo = this._getSelectedAttachTo();

            var _hasMaximizeButton = 'maximizeButton' in this.config.overviewMap;
            this.config.overviewMap.maximizeButton = _hasMaximizeButton ? this.config.overviewMap.maximizeButton : true;

            this.config.overviewMap.baseLayer = this.baseLayerConfig.getValues(this.config);

            def.resolve(this.config);
          }
        }));

        return def;
      }
    });
  });