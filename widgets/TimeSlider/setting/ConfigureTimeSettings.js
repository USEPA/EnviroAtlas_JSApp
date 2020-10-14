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
  "dojo/text!./ConfigureTimeSettings.html",
  './LayersConfig',
  './TimeConfig',
  "jimu/dijit/CheckBox",
  "dijit/form/Select",
  "dijit/form/ValidationTextBox"
],
  function (Evented, declare, lang,
    _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,
    on, template, LayersConfig, TimeConfig) {
    var clazz = declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Evented], {
      templateString: template,
      /*
        timeConfigFromat = {
          startTime:{
            timeConfig: TimeCalendar.config
          },
          endTime:{
            timeConfig: TimeCalendar.config
          },
          interval:{
            number: null //number
            units:""//esriTimeInfo.X
          }
          displayAllData: false//t / f
        }
      */
      // postCreate: function () {
      //   this.inherited(arguments);
      // },

      startup: function () {
        var rawConfig = this.config;
        this.layersConfig = new LayersConfig({
          nls: this.nls,
          map: this.map,
          config: rawConfig,
          parent: this
        }, this.layersConfigContainer);
        //initTimeExtent
        this.own(on(this.layersConfig, 'change', lang.hitch(this, function (res) {
          if (null === res) {
            return;
          }
          var _config = {
            startTime: {
              timeConfig: {
                time: res.timeExtent.startTime
              }
            },
            endTime: {
              timeConfig: {
                time: res.timeExtent.endTime
              }
            }
          };

          this.timeConfig.updateConfigByLyaers(_config);
        })));

        //2
        this.own(on.once(this.layersConfig, 'initTimeExtent', lang.hitch(this, function (res) {
          this.timeConfig = new TimeConfig({
            nls: this.nls,
            map: this.map,
            config: rawConfig,
            parent: this
          }, this.timeConfigContainer);
          this.timeConfig.startup();

          if (rawConfig.customTimeConfig) {
            this.timeConfig.setConfig(rawConfig.customTimeConfig);
          }

          var noLayer = false;
          if (null === res) {
            noLayer = true;//no time layers
          }
          this.emit('initedLayers', { isNoLayer: noLayer });
        })));

        this.layersConfig.startup();
        if (rawConfig.customLayersConfig) {
          this.layersConfig.setConfig(rawConfig.customLayersConfig);
        }

        this.inherited(arguments);
      },
      // getLayersTimeExtent: function(){
      //   return this.layersConfig.getFullTimeExtent();
      // },      // createAndSetLayersConfig: function (config) {
      //   //return def;
      // },
      getLayersTimeExtent: function () {
        return this.layersConfig.getFullTimeExtent();
      },
      setConfig: function (config) {
        if (config.customTimeConfig) {
          this.timeConfig.setConfig(config.customTimeConfig);
        }
        if (config.customLayersConfig) {
          this.layersConfig.setConfig(config.customLayersConfig);
        }
      },
      getConfig: function (settingConfig) {
        settingConfig.customLayersConfig = null;
        settingConfig.customTimeConfig = null;

        var subConfig = {};
        subConfig.customLayersConfig = this.layersConfig.getConfig();
        subConfig.customTimeConfig = this.timeConfig.getConfig();

        settingConfig = lang.mixin(settingConfig, subConfig);

        if (settingConfig.customTimeConfig.startTime.timeConfig.time) {
          settingConfig.customTimeConfig.startTime.timeConfig.time =
            new Date(settingConfig.customTimeConfig.startTime.timeConfig.time).getTime();
        }
        if (settingConfig.customTimeConfig.endTime.timeConfig.time) {
          settingConfig.customTimeConfig.endTime.timeConfig.time =
            new Date(settingConfig.customTimeConfig.endTime.timeConfig.time).getTime();
        }

        return settingConfig;
      },
      isValid: function () {
        if (this.timeConfig.isValid() && this.layersConfig.isValid()) {
          return true;
        }

        return false;
      }
    });
    return clazz;
  });