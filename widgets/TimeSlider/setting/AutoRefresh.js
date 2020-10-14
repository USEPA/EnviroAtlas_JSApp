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
  "jimu/BaseWidgetSetting",
  "dijit/_WidgetsInTemplateMixin",
  'dojo/on',
  "dojo/text!./AutoRefresh.html",
  "esri/layers/TimeInfo",
  "jimu/dijit/CheckBox",
  "dijit/form/Select",
  "dijit/form/ValidationTextBox"
],
  function (declare, lang, BaseWidgetSetting, _WidgetsInTemplateMixin, on, template,
    esriTimeInfo, CheckBox, Select) {
    var clazz = declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
      templateString: template,
      /*
        configFromat = {
          isAutoRefresh: false,// ture/false
          interval:0,//number
          unit:""
        }
      */
      postCreate: function () {
        this._unitsOptions = [{
          "label": window.jimuNls.timeUnit.days,
          "value": esriTimeInfo.UNIT_DAYS
        }, {
          "label": window.jimuNls.timeUnit.hours,
          "value": esriTimeInfo.UNIT_HOURS
        }, {
          "label": window.jimuNls.timeUnit.minutes,
          "value": esriTimeInfo.UNIT_MINUTES
        }, {
          "label": window.jimuNls.timeUnit.seconds,
          "value": esriTimeInfo.UNIT_SECONDS
        }];

        this.autoRefresh = new CheckBox({
          label: this.nls.autoRefresh,
          checked: false
        }, this.autoRefreshCheckBox);
        this.autoRefresh.startup();
        this.own(on(this.autoRefresh, "change", lang.hitch(this, function (val) {
          if (val) {
            this._enableInputs();
          } else {
            this._disableInputs();
          }
        })));

        this.intervalUnits = new Select({
          options: this._unitsOptions,
          "disabled": true,
          "class": "interval-units"
        }, this.intervalUnits);

        this._disableInputs();

        this.inherited(arguments);
      },

      setConfig: function (config) {
        if (!config) {
          return;
        }

        this.autoRefresh.setValue(config.isAutoRefresh);
        this.intervalNumber.setValue(config.interval);
        this.intervalUnits.setValue(config.unit);
      },

      isValid: function () {

      },

      _disableInputs: function () {
        this.intervalNumber.set("disabled", true);
        this.intervalUnits.set("disabled", true);
      },
      _enableInputs: function () {
        this.intervalNumber.set("disabled", false);
        this.intervalUnits.set("disabled", false);
      },

      getConfig: function () {
        var testConfig = {
          isAutoRefresh: this.autoRefresh.getValue(),// ture/false
          interval: this.intervalNumber.getValue(),//number
          unit: this.intervalUnits.getValue()
        };
        return testConfig;
      }
    });
    return clazz;
  });