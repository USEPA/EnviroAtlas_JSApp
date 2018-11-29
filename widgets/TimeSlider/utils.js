///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 - 2018 Esri. All Rights Reserved.
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

define(['dojo/_base/html', 'dojo/dom-geometry', 'dojo/_base/array',
  "esri/layers/TimeInfo", 'jimu/utils', 'esri/TimeExtent', 'libs/storejs/store', 'moment/moment'],
  function (html, domGeometry, array, esriTimeInfo, jimuUtils, TimeExtent, store, moment) {

    var mo = {};

    mo.intervalUnitOptions = [{
      "label": window.jimuNls.timeUnit.years,
      "value": esriTimeInfo.UNIT_YEARS
    }, {
      "label": window.jimuNls.timeUnit.months,
      "value": esriTimeInfo.UNIT_MONTHS
    }, {
      "label": window.jimuNls.timeUnit.weeks,
      "value": esriTimeInfo.UNIT_WEEKS
    }, {
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
    }, {
      "label": window.jimuNls.timeUnit.milliSeconds,
      "value": esriTimeInfo.UNIT_MILLISECONDS
    }];

    mo.isLayerEnabledTime = function (layer, layerInfosObj, layerInfo) {
      if (!layerInfo) {
        layerInfo = layerInfosObj.getLayerInfoById(layer.id);
      }

      if (!layerInfo) {
        return;
      }
      var layerObjet = layerInfo.layerObject;
      var isTimeEnabled = layerObjet.timeInfo && layerObjet.timeInfo.timeExtent; //&& !parameterList.layer.timeInfo.hasLiveData;
      //var hasLiveData = layerObjet.timeInfo && layerObjet.timeInfo.hasLiveData;
      var usesTime = true;

      var originLayer = layerInfo.originOperLayer;
      if (originLayer.itemProperties && "undefined" !== typeof originLayer.itemProperties.timeAnimation) {
        usesTime = false;// arcgis-portal-app-master\src\js\arcgisonline\map\itemData.js Line#205
      }
      if (false === originLayer.timeAnimation) {
        usesTime = false;
      }
      if (true === originLayer.timeAnimation) {
        usesTime = true;
      }
      if ((originLayer.itemProperties && "undefined" !== typeof originLayer.itemProperties.timeAnimation) &&
        "undefined" !== typeof originLayer.timeAnimation) {
        usesTime = true;
      }

      //var hasLiveData = layerObjet.timeInfo && layerObjet.timeInfo.hasLiveData;
      // var originLayer = layerInfo.originOperLayer;
      // //1- Does the webmap contain a timeAnimation property, then do whatever it says.
      // if (originLayer.itemProperties) {
      //   usesTime = originLayer.timeAnimation;
      // } else {
      //   //2- If the webmap does not contain a timeAnimation property, check if the layer has an itemId.
      //   if ("undefined" === typeof originLayer.itemProperties) {
      //     //2.1	itemId does not exist then check hasLiveData on the service. If hasLiveData is true then do not show the time slider. Otherwise show time slider.
      //     usesTime = hasLiveData;
      //   } else {
      //     //2.2	itemId does exist then check the item /data object. If it contains a timeAnimation property for the layer do whatever it says. If it does not contain timeAnimation then check hasLiveData and follow the rule from above.
      //     if ("undefined" !== typeof originLayer.itemProperties.timeAnimation) {
      //       usesTime = originLayer.itemProperties.timeAnimation;
      //     } else {
      //       usesTime = hasLiveData;
      //     }
      //   }
      // }
      return !!(usesTime && isTimeEnabled);
    };

    mo.setLayersUseMapTimebyConfig = function (layerInfosObj, config) {
      var configLayers = config.customLayersConfig;
      var infos = layerInfosObj.getLayerInfoArray();

      for (var i = 0, len = configLayers.length; i < len; i++) {
        var configLayer = configLayers[i];

        for (var j = 0, lenJ = infos.length; j < lenJ; j++) {
          var info = infos[j];
          if (configLayer.id === info.id && info.layerObject.setUseMapTime) {

            if (true === configLayer.isTimeEnable) {
              info.layerObject.setUseMapTime(true);
            } else {
              info.layerObject.setUseMapTime(false);
            }
          }
        }
      }
    };

    mo.initPositionForTheme = {
      "DartTheme": {
        bottom: 140
      },
      'LaunchpadTheme': {
        bottom: 120
      }
    };

    mo.isRunInMobile = function () {
      return window.appInfo.isRunInMobile;
    };
    mo.isOutOfScreen = function (map, position) {
      var containerBox = domGeometry.getMarginBox(map.root);
      var mapWidth = containerBox.w;
      var mapHeight = containerBox.h;

      if (position &&
        (position.top >= mapHeight || position.left >= mapWidth)) {

        return true;
      } else {
        return false;
      }
    };
    mo.initPosition = function (map, domNode, position) {
      if (position && position.hasMoved) {
        html.setStyle(domNode, 'top', position.top + 'px');
        html.setStyle(domNode, 'left', position.left + 'px');
        return;
      }

      var appConfig = window.getAppConfig();
      var theme;
      if (appConfig && appConfig.theme && appConfig.theme.name) {
        theme = appConfig.theme.name;
      }

      var top = mo.getInitTop(map, theme);
      var left = mo.getInitLeft(map, domNode);
      position.top = top;
      position.left = left;
      html.setStyle(domNode, 'top', position.top + 'px');
      html.setStyle(domNode, 'left', position.left + 'px');
      position.hasMoved = true;
    };
    mo.getInitTop = function (map,/*domNode,*/theme) {
      var top = 0;
      var containerBox = domGeometry.getMarginBox(map.root);
      // var sliderContentBox = html.getContentBox(domNode);
      // var popupHeight = sliderContentBox.h;
      var popupHeight = 35;//height of mini mode

      var marginBottom = mo.initPositionForTheme[theme] ? mo.initPositionForTheme[theme].bottom : 60;
      top = containerBox.h - marginBottom - popupHeight;

      return top;
    };
    mo.getInitLeft = function (map, domNode/*, theme*/) {
      var left = 0;
      var containerBox = domGeometry.getMarginBox(map.root);
      var sliderContentBox = html.getContentBox(domNode);

      var middleOfScreenWidth = containerBox.w / 2;
      var middleOfPopupWidth = sliderContentBox.w / 2;
      left = middleOfScreenWidth - middleOfPopupWidth;

      return left;
    };

    mo.isValidDate = function (date) {
      return date instanceof Date && !isNaN(date.getTime());
    };
    mo.isValidDataStrByDateLocale = function(dataStr){
      if ("undefined NaN, NaN" === dataStr) {
        return false;
      }

      return true;
    };

    mo.hasLiveData = function (layer) {
      // doesn't need to consider KMLLayers
      return !!(layer && layer.useMapTime && layer.timeInfo && layer.timeInfo.hasLiveData);
    };

    mo.getCalendarTime = function (customTimeConfig, refTime) {
      var time;
      if ("time" === customTimeConfig.timeMode ||
        "min" === customTimeConfig.timeMode || "max" === customTimeConfig.timeMode) {
        //1 time mode
        time = new Date(customTimeConfig.time);
      } else if ("now" === customTimeConfig.timeMode || "today" === customTimeConfig.timeMode) {
        //2 calendar mode
        var tempTime = refTime ? new Date(refTime) : new Date();//use reference first

        if ("today" === customTimeConfig.timeMode) {
          time = new Date(tempTime.getFullYear(), tempTime.getMonth(), tempTime.getDate(), 0, 0, 0);// Date = Today Hour =0, Minute= 0, Second = 0
        } else {//"now"
          time = tempTime;
        }

        var calendar = customTimeConfig.calender;
        var unit = "";
        if (calendar && calendar.number && calendar.operator && calendar.unit) {
          var cu = calendar.unit;
          if (-1 !== cu.indexOf("esriTimeUnits")) {
            var res = cu.split("esriTimeUnits");
            if (res && res.length === 2) {
              unit = res[1];
            }
          } else {
            console.log("unsupported unit:" + calendar.unit);
            return new Date(time);
          }

          if ("+" === calendar.operator) {
            time = moment(time).add(calendar.number, unit).valueOf();
          } else if ("-" === calendar.operator) {
            time = moment(time).subtract(calendar.number, unit).valueOf();
          }
          //moment().add("-10", 'days').calendar();//"Yesterday at 5:18 PM"
          //moment().add(1, 'd').format();//"2018-05-04T17:17:07+08:00"
          //moment().add(1, 'd').valueOf();//1525425627984
        }
      }

      return new Date(time);
    };
    mo.isConfigLiveMode = function (config) {
      var startTime = false,
        endTime = false;

      var isCustomTime = (false === config.isHonorWebMap);

      if (config && config.customTimeConfig && config.customTimeConfig.startTime &&
        config.customTimeConfig.startTime.timeConfig && config.customTimeConfig.startTime.timeConfig.timeMode) {
        startTime = mo.isLiveTimeMode(config.customTimeConfig.startTime.timeConfig.timeMode);
      }
      if (config && config.customTimeConfig && config.customTimeConfig.endTime &&
        config.customTimeConfig.endTime.timeConfig && config.customTimeConfig.endTime.timeConfig.timeMode) {
        endTime = mo.isLiveTimeMode(config.customTimeConfig.endTime.timeConfig.timeMode);
      }

      return isCustomTime && (startTime || endTime);
    };
    mo.isLiveTimeMode = function (mode) {
      if (mode &&
        ("now" === mode || "today" === mode || "max" === mode || "min" === mode)) {
        return true;
      }

      return false;
    };
    mo.timeCalendarForBuilderConfig = function (config) {
      if (false === config.isHonorWebMap) {
        //custom layers & custom time
        var strtTime, endTime, interval, thumbCount;

        var refTime = new Date();
        strtTime = mo.getCalendarTime(config.customTimeConfig.startTime.timeConfig, refTime);
        endTime = mo.getCalendarTime(config.customTimeConfig.endTime.timeConfig, refTime);

        //TODO check start < endtime
        //if (strtTime === endTime) {
        //endTime = endTime.setMinutes(endTime.getMinutes() + 1);
        //endTime = endTime.setSeconds(endTime.getSeconds() + 1);
        //endTime = new Date(endTime);
        //}

        if (null !== config.customTimeConfig.interval) {
          interval = config.customTimeConfig.interval;
        } else {
          interval = null;
        }

        if (true === config.customTimeConfig.displayAllData) {
          thumbCount = 1;
        } else {
          thumbCount = 2;
        }

        return {
          startTime: strtTime,
          endTime: endTime,
          interval: interval,
          thumbCount: thumbCount
        };
      } else {
        return null;
      }
    };

    mo.getFullTimeExtent = function(timeExtents, noRound){
      var fullTimeExtent = null;
      array.forEach(timeExtents, function (te) {
        if (!te) {
          return;
        }

        if (!fullTimeExtent) {
          fullTimeExtent = new TimeExtent(new Date(te.startTime.getTime()),
            new Date(te.endTime.getTime()));
        } else {
          if (fullTimeExtent.startTime > te.startTime) {
            fullTimeExtent.startTime = new Date(te.startTime.getTime());
          }
          if (fullTimeExtent.endTime < te.endTime) {
            fullTimeExtent.endTime = new Date(te.endTime.getTime());
          }
        }
      });

      //round off seconds
      //mapViewer round the Minutes by default. but in timeCalendar setting, we don't want to round it
      var roundTime = 1;
      if (true === noRound) {
        roundTime = 0;
      }

      fullTimeExtent.startTime = new Date(fullTimeExtent.startTime.getFullYear(),
        fullTimeExtent.startTime.getMonth(), fullTimeExtent.startTime.getDate(),
        fullTimeExtent.startTime.getHours(), fullTimeExtent.startTime.getMinutes(), 0, 0);
      fullTimeExtent.endTime = new Date(fullTimeExtent.endTime.getFullYear(),
        fullTimeExtent.endTime.getMonth(), fullTimeExtent.endTime.getDate(),
        fullTimeExtent.endTime.getHours(), fullTimeExtent.endTime.getMinutes() + roundTime, 0, 0);

      return fullTimeExtent;
    };

    mo.getAutoRefreshTime = function (config) {
      var time = 0, unit = "";

      var SECONDS = 1;
      var MINUTES = SECONDS * 60;
      var HOURS = MINUTES * 60;
      var DAYS = HOURS * 24;

      if (config && config.autoRefresh && true === config.autoRefresh.isAutoRefresh &&
        config.autoRefresh.interval && config.autoRefresh.unit) {

        var cu = config.autoRefresh.unit;
        if (-1 !== cu.indexOf("esriTimeUnits")) {
          var res = cu.split("esriTimeUnits");
          if (res && res.length === 2) {
            unit = res[1];
          }
        }

        unit = unit.toUpperCase();

        if ("SECONDS" === unit) {
          time = config.autoRefresh.interval;
        } else if ("MINUTES" === unit) {
          time = config.autoRefresh.interval * MINUTES;
        } else if ("HOURS" === unit) {
          time = config.autoRefresh.interval * HOURS;
        } else if ("DAYS" === unit) {
          time = config.autoRefresh.interval * DAYS;
        }
      }

      return time * 1000;
    };

    //store
    mo.getKey = function (widgetId) {
      var prefix = "TimeSlider";
      var appId = encodeURIComponent(jimuUtils.getAppIdFromUrl());
      return prefix + "." + appId + "." + widgetId;
    };
    mo.getCacheByKeys = function (widgetId) {
      var cache = store.get(mo.getKey(widgetId));
      return cache;
    };
    mo.saveToLocalCache = function (widgetId, stops) {
      mo.removeLocalCache(widgetId);//clean
      store.set(mo.getKey(widgetId), stops);//set indexs
    };
    mo.removeLocalCache = function (widgetId) {
      var obj = mo.getCacheByKeys(widgetId);
      if (obj) {
        store.remove(mo.getKey(widgetId));
      }
    };
    return mo;
  });