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
  'dojo/on',
  'dojo/_base/lang',
  'dojo/_base/html',
  'dojo/keys',
  'dojo/Deferred',
  'jimu/utils',
  './ConfigureTimeSettings',
  //'./AutoRefresh',
  'jimu/dijit/Popup',
  "jimu/dijit/CheckBox",
  "dijit/form/Select",
  "dijit/form/ValidationTextBox"
],
  function (
    declare, BaseWidgetSetting, _WidgetsInTemplateMixin,
    on, lang, html, keys, Deferred,
    jimuUtils, ConfigureTimeSettings, /*AutoRefresh, */Popup,
    CheckBox, Select/* ,ValidationTextBox*/) {
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
      baseClass: 'jimu-widget-timeslider-setting',
      configureTimeSettings: null,
      /*
        configFormat = {
          showLabels : true,//t/f
          autoPlay :true,//t/f
          loopPlay: true,//t/f
          timeFormat:"",//by selector
          customDateFormat:"",//string / "",

          isHonorWebMap: true,//false

          customLayersConfig:{},
          customTimeConfig:{}
        }
      */
      postCreate: function () {
        this._timeFormatOptions = [{
          "label": this.nls.mapDefault,
          "value": "auto"
        }, {
          "label": "July 2015",
          "value": "MMMM YYYY"
        }, {
          "label": "Jul 2015",
          "value": "MMM YYYY"
        }, {
          "label": "July 21,2015",
          "value": "MMMM D,YYYY"
        }, {
          "label": "Tue Jul 21,2015",
          "value": "ddd MMM DD,YYYY"
        }, {
          "label": "7/21/2015",
          "value": "M/DD/YYYY"
        }, {
          "label": "2015/7/21",
          "value": "YYYY/M/DD"
        }, {
          "label": "7/21/15",
          "value": "M/DD/YY"
        }, {
          "label": "2015",
          "value": "YYYY"
        }, {
          "label": "7/21/2015 8:00 am",
          "value": "M/DD/YYYY  h:mm a"
        }, {
          "label": "Tue Jul 21 8:00 am",
          "value": "ddd MMM DD  h:mm a"
        }, {
          "label": this.nls.custom,
          "value": "Custom"
        }];

        this.showLabelsBox = new CheckBox({
          label: this.nls.showLayerLabels,
          checked: false
        }, this.showLabelsBox);
        this.showLabelsBox.startup();

        this.autoPlay = new CheckBox({
          label: this.nls.autoPlay,
          checked: false
        }, this.autoPlay);
        this.autoPlay.startup();

        this.loopPlay = new CheckBox({
          label: this.nls.loopPlay,
          checked: false
        }, this.loopPlay);
        this.loopPlay.startup();

        this.timeFormat = new Select({
          options: this._timeFormatOptions
        }, this.timeFormat);

        this.inherited(arguments);
      },

      startup: function () {
        if (!this.config) {
          this.config = {};
        }

        this.customDateFormat.setAttribute("placeHolder", "YYYY-MM-dd h:m:s Z");

        this.own(on(this.timeFormat, "click", lang.hitch(this, function () {
          if ("undefined" === typeof this._firstChange) {
            this._firstChange = false;
          }
        })));
        this.own(on(this.timeFormat, 'change', lang.hitch(this, function (val) {
          if ("undefined" === typeof this._firstChange) {
            this._firstChange = false;
          } else {
            this._initOptionsUI(val);
          }
        })));

        this.own(on(this.webMapSettingRaido, 'change', lang.hitch(this, function () {
          this._updateTimeSettingBtnUI();
        })));
        this.own(on(this.configureSettingRaido, 'change', lang.hitch(this, function () {
          this._updateTimeSettingBtnUI();
        })));

        // this.autoRefresh = new AutoRefresh({
        //   nls: this.nls,
        //   map: this.map,
        //   config: this.config
        // }, this.autoRefreshContainer);

        this.setConfig(this.config);
        this.inherited(arguments);
      },

      _initOptionsUI: function (val, customDateFormatVal) {
        if (val !== "Custom") {
          html.addClass(this.customDateContainer, "hide");
          this.customDateFormat.set("value", "");
        } else {
          html.removeClass(this.customDateContainer, "hide");
          this.customDateFormat.set("value", customDateFormatVal || "");
        }

        //popup
        this.own(on(this.timeSettingBtn, 'click', lang.hitch(this, function () {
          if (!this.configureSettingRaido.checked) {
            return;
          }

          this._createTimeConfigSetting().then(lang.hitch(this, function (isDisableOk) {
            this.popup = new Popup({
              titleLabel: this.nls.timeSetting,
              autoHeight: true,
              content: this.configureTimeSettings,
              container: 'main-page',
              width: 680,
              buttons: [{
                label: window.jimuNls.common.ok,
                key: keys.ENTER,
                disable: isDisableOk,
                onClick: lang.hitch(this, '_onPopupOk')
              }, {
                label: window.jimuNls.common.cancel,
                classNames: ['jimu-btn-vacation'],
                key: keys.ESCAPE
              }],
              onClose: lang.hitch(this, '_onPopupClose')
            });
            html.addClass(this.popup.domNode, 'timeslider-widget-setting-popup');
          }));
        })));
      },

      _onPopupOk: function () {
        if (false === this.configureTimeSettings.isValid()) {
          return false;//prevent closing popup
        }
        this.config = this.configureTimeSettings.getConfig(this.config);

        this.popup.close();
        this.configureTimeSettings = null;
        this.popup = null;
      },

      _onPopupClose: function () {
        this.configureTimeSettings = null;
        this.popup = null;
      },

      setConfig: function (config) {
        this.config = config;

        if (config.showLabels) {
          this.showLabelsBox.setValue(true);
        } else {
          this.showLabelsBox.setValue(false);
        }

        if (false === config.autoPlay) {
          this.autoPlay.setValue(false);
        } else {
          this.autoPlay.setValue(true);//undefined OR true
        }

        if (false === config.loopPlay) {
          this.loopPlay.setValue(false);
        } else {
          this.loopPlay.setValue(true);//undefined OR true
        }

        if (config.timeFormat) {
          this.timeFormat.setValue(config.timeFormat);

          var customDateFormatValue;
          if (config.customDateFormat) {
            customDateFormatValue = config.customDateFormat;
          }
          this._initOptionsUI(config.timeFormat, customDateFormatValue);
        } else {
          this.timeFormat.setValue("auto");
        }

        // if (config.autoRefresh) {
        //   this.autoRefresh.setConfig(config.autoRefresh);
        // }

        if ("undefined" === typeof config.isHonorWebMap || true === config.isHonorWebMap) {
          config.isHonorWebMap = true;
          this.webMapSettingRaido.setChecked(true);
        } else {
          config.isHonorWebMap = false;
          this.configureSettingRaido.setChecked(true);
        }
        this._updateTimeSettingBtnUI();
      },

      getConfig: function () {
        if ("Custom" === this.timeFormat.getValue() && "" === this.customDateFormat.get("value")) {
          this.customDateFormat.focus();
          this.customDateFormat.set("state", "Error");
          return false;
        }

        this.config.showLabels = this.showLabelsBox.getValue();
        this.config.autoPlay = this.autoPlay.getValue();
        this.config.loopPlay = this.loopPlay.getValue();
        this.config.timeFormat = this.timeFormat.getValue();

        if (this.customDateFormat.get("value")) {
          this.config.customDateFormat = this.customDateFormat.get("value");
        } else {
          this.config.customDateFormat = "";
        }

        // if (this.autoRefresh) {
        //   this.config.autoRefresh = this.autoRefresh.getConfig();
        // }

        if (this.webMapSettingRaido.checked) {
          this.config.isHonorWebMap = true;
        } else {// this.configureSettingRaido.checked = true;
          this.config.isHonorWebMap = false;
        }

        if (!this.configureTimeSettings) {
          this._createTimeConfigSetting();
        }
        if (this.configureTimeSettings && this.configureTimeSettings.getConfig) {
          this.config = this.configureTimeSettings.getConfig(this.config);
        }

        return this.config;
      },

      _onCustomDateFormatBlur: function () {
        this.customDateFormat.value = jimuUtils.stripHTML(this.customDateFormat.value || "");
      },
      _updateTimeSettingBtnUI: function () {
        if (this.webMapSettingRaido.checked) {
          html.addClass(this.timeSettingBtn, "disabled");
        }
        if (this.configureSettingRaido.checked) {
          html.removeClass(this.timeSettingBtn, "disabled");
        }
      },
      //popup will destroy that DOM, so need to recreate
      _createTimeConfigSetting: function () {
        var def = new Deferred();
        this.configureTimeSettings = new ConfigureTimeSettings({
          nls: this.nls,
          map: this.map,
          config: this.config
        }, this.configureTimeSettingsContainer);
        this.own(on(this.configureTimeSettings, "initedLayers", lang.hitch(this, function (ops) {
          var isDisableOk = false;
          if (ops && ops.isNoLayer) {
            isDisableOk = true;
          }

          def.resolve(isDisableOk);
        })));
        this.configureTimeSettings.startup();

        return def;
      }
    });
  });