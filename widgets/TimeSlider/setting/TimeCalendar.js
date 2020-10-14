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
  'dojo/_base/html',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  "dijit/_WidgetsInTemplateMixin",
  'dojo/on',
  "dojo/text!./TimeCalendar.html",
  "../utils",
  "dijit/form/DateTextBox",
  "dijit/form/TimeTextBox",
  "dijit/form/Select",
  "dijit/form/NumberSpinner",
  "dijit/form/ValidationTextBox",
  "jimu/dijit/CheckBox"
],
  function (Evented, declare, lang, html,
    _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,
    on, template, utils,
    DateTextBox, TimeTextBox, Select) {
    var clazz = declare([Evented, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
      templateString: template,
      /*
      configFromat = {
        timeMode:"time", //"time","now","today"
        time:"",//computer time
        calender:{
          operator:"",// + / -
          number:"",//number
          unit:""//esriTimeInfo.X
        }
      }
      */
      _KEEP_VALUE_FLAG: false,//set true, afer user change any setting

      postCreate: function () {
        this._timeModeOptions = [{
          "label": this.nls.time,
          "value": "time"
        }, {
          "label": this.nls.now,
          "value": "now"
        }, {
          "label": this.nls.today,
          "value": "today"
        }];
        var maxOptions = {
          "label": this.nls.maximum,
          "value": "max"
        };
        var minOptions = {
          "label": this.nls.minimum,
          "value": "min"
        };

        if (this.mode === "min") {
          this._timeModeOptions.push(minOptions);
        } else if (this.mode === "max") {
          this._timeModeOptions.push(maxOptions);
        }

        this._operatorOptions = [{
          "label": "+",
          "value": "+"
        }, {
          "label": "-",
          "value": "-"
        }];

        //0 mode
        this.modeOptions = new Select({
          options: this._timeModeOptions,
          "class": "calendar-inputs"
        }, this.modeSelector);
        this.own(on(this.modeOptions, "change", lang.hitch(this, function (val) {
          this.toggleTimeMode(val, false);
          if (val !== "max" || val !== "min") {
            this._setKeepValueFlag(true);
          }
        })));
        //1 time
        this.dateBox = new DateTextBox({
          "class": "calendar-inputs"
        }, this.dateBoxContainer);
        this.dateBox.startup();
        this.timeTextBox = new TimeTextBox({
          "class": "calendar-inputs time-inputs"
        }, this.timeTextBoxContainer);
        this.timeTextBox.startup();

        this._updateTimeModeValue();

        this.own(on(this.dateBox, "change", lang.hitch(this, function () {
          this._setKeepValueFlag(true);
        })));
        this.own(on(this.timeTextBox, "change", lang.hitch(this, function () {
          this._setKeepValueFlag(true);
        })));
        //2 calender
        this.operatorSelector = new Select({
          options: this._operatorOptions,
          "class": "calendar-operator"
        }, this.operatorContainer);
        this.unit = new Select({
          options: utils.intervalUnitOptions,
          "class": "calendar-inputs"
        }, this.unitContainer);

        this.own(on(this.operatorSelector, "change", lang.hitch(this, function () {
          this._setKeepValueFlag(true);
        })));
        this.own(on(this.numberSpinner, "change", lang.hitch(this, function () {
          this._setKeepValueFlag(true);
        })));
        this.own(on(this.unit, "change", lang.hitch(this, function () {
          this._setKeepValueFlag(true);
        })));
        //3 maxmin
        this.maxminDateBox = new DateTextBox({
          'readonly': 'readonly',
          "class": "calendar-inputs",
          "disabled": true
        }, this.maxminDateBoxContainer);
        this.maxminDateBox.startup();
        this.maxminTimeTextBox = new TimeTextBox({
          'readonly': 'readonly',
          "class": "calendar-inputs",
          "disabled": true
        }, this.maxminTimeTextBoxContainer);
        this.maxminTimeTextBox.startup();

        this.inherited(arguments);
      },

      startup: function () {
        if (this.mode === "min" || this.mode === "max") {
          this.toggleTimeMode(this.mode, false);//init last one
        }

        this.inherited(arguments);

        this.emit("haveloaded");//to update interval
      },

      toggleTimeMode: function (mode, isTriggerEvent) {
        html.addClass(this.calenderMode, "hide");
        html.addClass(this.timeMode, "hide");
        html.addClass(this.maxminMode, "hide");

        var _isTriggerEvent = false;
        if (isTriggerEvent === true) {
          _isTriggerEvent = true;
        }
        this.modeOptions.set("value", mode, _isTriggerEvent);

        if (mode === "time") {
          html.removeClass(this.timeMode, "hide");

          if (this._getKeepValueFlag()) {
            return;
          }
          this._updateTimeModeValue();
        } else if (mode === "max" || mode === "min") {
          html.removeClass(this.maxminMode, "hide");
          this._getMaxOrMinTime();
        } else {//"now","today"
          html.removeClass(this.calenderMode, "hide");
        }
      },

      _getMaxOrMinTime: function () {
        var timeExtent = this.parent.getLayersTimeExtent();
        if (timeExtent) {
          this.setMaxMinTime(timeExtent);
        }
      },
      setMaxMinTime: function (config) {
        var time;
        if (this.mode === "min") {
          time = config.timeExtent.startTime;
        } else if (this.mode === "max") {
          time = config.timeExtent.endTime;
        }

        this.maxminDateBox.set("value", new Date(time), false);
        this.maxminTimeTextBox.set("value", new Date(time), false);
      },
      isValid: function () {
        if (this.modeOptions.getValue() === "time") {
          return (this.dateBox.isValid() && this.timeTextBox.isValid());
        } else if (this.modeOptions.getValue() === "max" || this.modeOptions.getValue() === "min") {
          return (this.maxminDateBox.isValid() && this.maxminTimeTextBox.isValid());
        } else {
          //now today
          return (this.operatorSelector.isValid() && this.numberSpinner.isValid() && this.unit.isValid());
        }
      },
      setConfig: function (config) {
        if (this._getKeepValueFlag()) {
          // max/min mode ignore keepValueFalg
          if (config.time) {
            this.maxminDateBox.set("value", new Date(config.time), false);
            this.maxminTimeTextBox.set("value", new Date(config.time), false);
          }
          return;//read only
        }

        if (config.keepValueFlag) {
          this._KEEP_VALUE_FLAG = config.keepValueFlag;
        }

        if (config.timeMode) {
          this.toggleTimeMode(config.timeMode, false);
        }

        if (config.time) {
          this.dateBox.set("value", new Date(config.time), false);
          this.timeTextBox.set("value", new Date(config.time), false);
          //update max/min in the same time
          this.maxminDateBox.set("value", new Date(config.time), false);
          this.maxminTimeTextBox.set("value", new Date(config.time), false);
        }

        if (config.calender) {
          if ("undefined" === typeof config.calender.operator || "" === config.calender.operator) {
            config.calender.operator = "+";//default value
          }
          this.operatorSelector.set("value", config.calender.operator, false);
          this.numberSpinner.set("value", config.calender.number, false);
          this.unit.set("value", config.calender.unit, false);
        }
      },
      getConfig: function () {
        var date, time, fullDate;
        var calenderConfig = {
          operator: "",// + / -
          number: "",//number
          unit: ""//esriTimeInfo.X
        };

        if (this.modeOptions.getValue() === "time") {
          date = this.dateBox.getValue();
          time = this.timeTextBox.getValue();

          if (date && time) {
            //new Date( year, month, date, hrs, min, sec)
            fullDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(),
              time.getHours(), time.getMinutes(), time.getSeconds());
          } else {
            fullDate = null;
          }
        } else if (this.modeOptions.getValue() === "max" || this.modeOptions.getValue() === "min") {
          date = this.maxminDateBox.getValue();
          time = this.maxminTimeTextBox.getValue();

          if (date && time) {
            //new Date( year, month, date, hrs, min, sec)
            fullDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(),
              time.getHours(), time.getMinutes(), time.getSeconds());
          } else {
            fullDate = null;
          }
        } else {//now today
          //if (this.modeOptions.getValue() !== "time") {
          calenderConfig = {
            operator: this.operatorSelector.getValue(),// + / -
            number: this.numberSpinner.getValue(),//number
            unit: this.unit.getValue()//esriTimeInfo.X
          };
        }

        var config = {
          keepValueFlag: this._getKeepValueFlag(),
          timeMode: this.modeOptions.getValue(), //true or false
          time: fullDate,//computer time
          calender: calenderConfig
        };
        return config;
      },

      _updateTimeModeValue: function () {
        this.dateBox.set("value", new Date(), false);
        this.timeTextBox.set("value", new Date(), false);
      },

      //read only falg
      _setKeepValueFlag: function (flag) {
        this._KEEP_VALUE_FLAG = flag;

        this.emit("change");
      },
      _getKeepValueFlag: function () {
        return !!this._KEEP_VALUE_FLAG;
      }
    });
    return clazz;
  });