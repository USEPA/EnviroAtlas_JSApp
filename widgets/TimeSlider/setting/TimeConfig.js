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
  'dojo/_base/html',
  "jimu/BaseWidgetSetting",
  "dijit/_WidgetsInTemplateMixin",
  'dojo/on',
  "dojo/text!./TimeConfig.html",
  "../utils",
  './TimeCalendar',
  'esri/TimeExtent',
  "jimu/dijit/CheckBox",
  "dijit/form/Select",
  "dijit/form/ValidationTextBox"
],
  function (declare, lang, html,
    BaseWidgetSetting, _WidgetsInTemplateMixin,
    on, template, utils, TimeCalendar, TimeExtent,
    CheckBox, Select) {
    var clazz = declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
      templateString: template,
      /*
        configFromat = {
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
      _KEEP_VALUE_FLAG: false,//set true, afer user change any setting

      postCreate: function () {
        this.startTimeCalendar = new TimeCalendar({
          mode: "min",
          nls: this.nls,
          map: this.map,
          config: this.config,
          parent: this
        }, this.startTimeCalendar);

        this.endTimeCalendar = new TimeCalendar({
          mode: "max",
          nls: this.nls,
          map: this.map,
          config: this.config,
          parent: this
        }, this.endTimeCalendar);

        this.own(on(this.startTimeCalendar, "haveloaded,change", lang.hitch(this, function (evt) {
          this._updateInterval(evt.type);
        })));

        this.own(on(this.endTimeCalendar, "haveloaded,change", lang.hitch(this, function (evt) {
          this._updateInterval(evt.type);
        })));

        //interval
        this.own(on(this.intervalNumber, "change", lang.hitch(this, function () {
          this._setKeepValueFlag(true);
        })));
        this.intervalUnits = new Select({
          options: utils.intervalUnitOptions,
          "class": "calendar-inputs"
        }, this.intervalUnits);
        this.own(on(this.intervalUnits, "change", lang.hitch(this, function () {
          this._setKeepValueFlag(true);
        })));

        this.displayAllTheData = new CheckBox({
          label: this.nls.displayAllData,
          checked: false
        }, this.displayAllTheData);
        this.displayAllTheData.startup();

        //init
        this.startTimeCalendar.startup();
        this.endTimeCalendar.startup();

        this.inherited(arguments);
      },

      setConfig: function (config) {
        if ("undefined" !== typeof config.keepValueFlag) {
          this._setKeepValueFlag(config.keepValueFlag);
        }

        if ("undefined" !== typeof config.startTime) {
          this.startTimeCalendar.setConfig(config.startTime.timeConfig);
        }
        if ("undefined" !== typeof config.endTime) {
          this.endTimeCalendar.setConfig(config.endTime.timeConfig);
        }

        if ("undefined" !== typeof config.interval) {
          this.intervalNumber.set("value", config.interval.number, false);
          this.intervalUnits.set("value", config.interval.units, false);
        } else {
          var refTime = new Date();
          var startTime = utils.getCalendarTime(this.startTimeCalendar.getConfig(), refTime);
          var endTime = utils.getCalendarTime(this.endTimeCalendar.getConfig(), refTime);

          this.findDefaultInterval(new TimeExtent(startTime, endTime));
        }
        if ("undefined" !== typeof config.displayAllData) {
          this.displayAllTheData.setValue(!!config.displayAllData, false);
        } else {
          this.displayAllTheData.setValue(false, false);
        }
      },
      updateConfigByLyaers: function (config) {
        if ("undefined" !== typeof config.startTime) {
          this.startTimeCalendar.setConfig(config.startTime.timeConfig);
        }
        if ("undefined" !== typeof config.endTime) {
          this.endTimeCalendar.setConfig(config.endTime.timeConfig);
        }

        this._updateInterval();
      },
      _updateInterval: function (evtType) {
        this._cleanErrorTips();

        if (evtType === "haveloaded") {
          this.intervalNumber.intermediateChanges = false;//skip bug dijit/form/NumberSpinner.set("value", XXX, false);
        }

        if (false === this.isValid()) {
          return;
        }
        if (this._getKeepValueFlag()) {
          return;
        }

        var refTime = new Date();
        var startTime = utils.getCalendarTime(this.startTimeCalendar.getConfig(), refTime);
        var endTime = utils.getCalendarTime(this.endTimeCalendar.getConfig(), refTime);

        var interval = this.findDefaultInterval(new TimeExtent(new Date(startTime), new Date(endTime)));
        this.intervalNumber.set("value", interval.interval, false);
        this.intervalUnits.set("value", interval.units, false);
      },

      isValid: function () {
        var refTime = new Date();
        var startTime = utils.getCalendarTime(this.startTimeCalendar.getConfig(), refTime);
        var endTime = utils.getCalendarTime(this.endTimeCalendar.getConfig(), refTime);

        //1 inValid time
        if (!utils.isValidDate(startTime)) {
          this.startTimeCalendar.numberSpinner.set("state", "Error");
          return false;
        }
        if (!utils.isValidDate(endTime)) {
          this.endTimeCalendar.numberSpinner.set("state", "Error");
          return false;
        }

        //2 inValid value
        if (!this.startTimeCalendar.isValid() || !this.endTimeCalendar.isValid() || !this.intervalNumber.isValid()) {
          return false;
        }

        //3 startTime should be <= endTime
        var hadError = html.hasClass(this.timeConfigContainer, "error");
        if (startTime.valueOf() > endTime.valueOf()) {
          if (!hadError) {//avoid to popup too many errors
            html.addClass(this.timeConfigContainer, "error");
          }
          return false;
        } else {
          html.removeClass(this.timeConfigContainer, "error");
          return true;
        }
      },
      _cleanErrorTips: function () {
        html.removeClass(this.timeConfigContainer, "error");
      },

      getConfig: function () {
        var testConfig = {
          keepValueFlag: this._getKeepValueFlag(),
          startTime: {
            timeConfig: this.startTimeCalendar.getConfig()
          },
          endTime: {
            timeConfig: this.endTimeCalendar.getConfig()
          },
          interval: {
            number: this.intervalNumber.getValue(),//number
            units: this.intervalUnits.getValue()//esriTimeInfo.X
          },
          displayAllData: this.displayAllTheData.getValue()//t / f
        };
        return testConfig;
      },

      getLayersTimeExtent: function () {
        var te = this.parent.getLayersTimeExtent();
        return te;
      },

      //read only falg
      _setKeepValueFlag: function (flag) {
        this._KEEP_VALUE_FLAG = flag;
      },
      _getKeepValueFlag: function () {
        return !!this._KEEP_VALUE_FLAG;
      },

      //TODO
      findDefaultInterval: function (fullTimeExtent) {
        var interval;
        var units;
        var timePerStop = (fullTimeExtent.endTime.getTime() - fullTimeExtent.startTime.getTime()) / 10;
        //var century = 1000 * 60 * 60 * 24 * 30 * 12 * 100;
        //if (timePerStop > century) {
        //  interval = Math.round(timePerStop / century);
        //  units = "esriTimeUnitsCenturies";
        //} else {
        //  var decade = 1000 * 60 * 60 * 24 * 30 * 12 * 10;
        //  if (timePerStop > decade) {
        //    interval = Math.round(timePerStop / decade);
        //    units = "esriTimeUnitsDecades";
        //  } else {
        var year = 1000 * 60 * 60 * 24 * 30 * 12;
        if (timePerStop > year) {
          interval = Math.round(timePerStop / year);
          units = "esriTimeUnitsYears";
        } else {
          var month = 1000 * 60 * 60 * 24 * 30;
          if (timePerStop > month) {
            interval = Math.round(timePerStop / month);
            units = "esriTimeUnitsMonths";
          } else {
            var week = 1000 * 60 * 60 * 24 * 7;
            if (timePerStop > week) {
              interval = Math.round(timePerStop / week);
              units = "esriTimeUnitsWeeks";
            } else {
              var day = 1000 * 60 * 60 * 24;
              if (timePerStop > day) {
                interval = Math.round(timePerStop / day);
                units = "esriTimeUnitsDays";
              } else {
                var hour = 1000 * 60 * 60;
                if (timePerStop > hour) {
                  interval = Math.round(timePerStop / hour);
                  units = "esriTimeUnitsHours";
                } else {
                  var minute = 1000 * 60;
                  if (timePerStop > minute) {
                    interval = Math.round(timePerStop / minute);
                    units = "esriTimeUnitsMinutes";
                  } else {
                    var second = 1000;
                    if (timePerStop > second) {
                      interval = Math.round(timePerStop / second);
                      units = "esriTimeUnitsSeconds";
                    } else {
                      interval = Math.round(timePerStop);
                      units = "esriTimeUnitsMilliseconds";
                    }
                  }
                }
              }
            }
          }
        }
        //  }
        //}

        return {
          interval: interval,
          units: units
        };
      }
    });
    return clazz;
  });