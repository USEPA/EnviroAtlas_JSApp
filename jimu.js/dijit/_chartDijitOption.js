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
  'dijit/_WidgetBase',
  'dojo/_base/lang',
  'jimu/clientStatisticsUtils',
  'jimu/_chartHelpUtils'
], function(declare, _WidgetBase, lang, clientStatisticsUtils,
  ChartHelpUtils) {

  return declare([_WidgetBase], {
    //options
    // map
    // featureLayer
    // layerObject

    //public methods
    //init
    //getClientStatisticsData
    //bindChartEvent
    //getChartOptionSeries
    //updateChartOptionDisplay

    postMixInProperties: function() {
      this.nls = window.jimuNls.statisticsChart;
    },

    constructor: function(options) {
      this.map = options.map;
      this.chartHelpUtils = new ChartHelpUtils({
        map: this.map,
        clientStatisticsUtils: clientStatisticsUtils
      });
    },

    init: function(featureLayer, symbolLayer, popupInfo, map, layerObject) {
      this.chartHelpUtils.setLayerFeatureLayer(featureLayer);
      this.chartHelpUtils.setSymbolLayer(symbolLayer);
      this.chartHelpUtils.setPopupInfo(popupInfo);
      this.chartHelpUtils.setMap(map);
      this.chartHelpUtils.setLayerObject(layerObject);
      this.featureLayer = featureLayer;
      this.layerObject = layerObject;
    },

    // return {label:'', values:[2000], unit /*optional*/}
    getClientStatisticsData: function(dataOption) {
      //init: get statistics data
      var data = clientStatisticsUtils.getClietStatisticsData(dataOption);
      //sort:
      data = clientStatisticsUtils.sortClientStatisticsData(data, dataOption, this.layerObject || this.featureLayer);
      //max number categories
      data = clientStatisticsUtils.getDataForMaxLabels(data, dataOption.maxLabels);
      //keep value best decimal places
      data = this.chartHelpUtils.keepStatisticsDataBestDecimalPlace(dataOption, data, dataOption.mode);
      return data;
    },

    bindChartEvent: function(chart, csuOptions, data) {
      this.chartHelpUtils.bindChartEvent(chart, csuOptions, data);
    },

    getChartOptionSeries: function(chartConfig, data) {
      return this._createOptionSeries(chartConfig, data);
    },

    updateChartOptionDisplay: function(chartSeriesOption, displayOption, dataOption) {
      this._assigneeSettingColorToSeries(chartSeriesOption, displayOption, dataOption);
      //update chartSeriesOption.series[i].name & series[i].data[i].name
      this.chartHelpUtils.updateChartSeriesDisplayName(chartSeriesOption, displayOption, dataOption);
      //TODO mixin series style
      return this._mapSettingConfigToChartOption(chartSeriesOption, displayOption, dataOption);
    },

    _assigneeSettingColorToSeries: function(chartSeriesOption, displayOption, dataOption) {
      if (!chartSeriesOption || !chartSeriesOption.series) {
        return chartSeriesOption;
      }

      this.chartHelpUtils.assigneeSettingColor(displayOption, chartSeriesOption.series, dataOption);
    },

    _createOptionSeries: function(chartConfig, data) {
      //data: [{label:'a',values:[10,100,2]}]

      // --type: bar line pie --
      var type = chartConfig.type;
      var mode = chartConfig.mode;

      var valueFields = chartConfig.valueFields;

      var seriesNames = [];
      if (mode === 'count') {
        seriesNames = ['']; //this.nls.count
      } else if (mode === 'field') {
        seriesNames = ['']; //this.nls.field ?
      } else {
        seriesNames = lang.clone(valueFields);
      }

      var chartOptions = null;

      chartOptions = {
        type: type,
        labels: [],
        series: []
      };

      chartOptions.series = seriesNames.map(lang.hitch(this, function(sreieName) {

        var item = {
          name: sreieName,
          type: type,
          data: []
        };
        return item;
      }));

      data.forEach(lang.hitch(this, function(item) {
        //item: {label:'a',values:[10,100,2],...}
        var label = item.label;
        chartOptions.labels.push(label);
        for (var i = 0; i < item.values.length; i++) {
          var value = item.values[i];
          var dataItem = {
            value: value,
            name: label,
            unit: item.unit
          };
          if (mode === 'feature') {
            var originValue = item.originalValues[i];
            dataItem.originValue = originValue;
          }
          chartOptions.series[i].data.push(dataItem);
        }
      }));

      return chartOptions;
    },

    //generate Chart.js's option
    _mapSettingConfigToChartOption: function(chartOptions, displayOption, dataOption) {
      var type = dataOption.type;
      var mode = dataOption.mode;

      this._settingColorArrayForPie(chartOptions, displayOption, type, mode);
      this._settingAxisDisplay(chartOptions, displayOption, type);

      chartOptions.type = type;
      chartOptions.dataZoom = ["inside", "slider"];
      if(type !== 'pie') {
        chartOptions.dataZoomOption = {
          mode: displayOption.displayRange || 'AUTO'
        };
      }
      chartOptions.confine = true;
      chartOptions.backgroundColor = displayOption.backgroundColor;

      if (displayOption.tooltip) {
        chartOptions.tooltip = lang.clone(displayOption.tooltip);
      }  else {
        var axisPointer = type !== 'pie' ? {
          type: type === 'line' ? 'cross' : 'shadow',
          snap: true
        }: {
          type: ''
        };
        var tooltip = {
          confine: true,
          trigger:  (type === 'radar' || type === 'pie') ? 'item': 'axis',
          axisPointer: axisPointer
        };
        chartOptions.tooltip = tooltip;
      }

      if (displayOption.marks && displayOption.marks.markLine) {
        chartOptions.markLine = lang.clone(displayOption.marks.markLine);
      }

      if (displayOption.marks && displayOption.marks.markArea) {
        chartOptions.markArea = lang.clone(displayOption.marks.markArea);
      }

      if (displayOption.legend) {
        chartOptions.legend = lang.clone(displayOption.legend);
      }
      if (displayOption.xAxis) {
        chartOptions.xAxis = lang.clone(displayOption.xAxis);
      }
      if (displayOption.yAxis) {
        chartOptions.yAxis = lang.clone(displayOption.yAxis);
      }
      if (displayOption.dataLabel) {
        chartOptions.dataLabel = lang.clone(displayOption.dataLabel);
      }
      if (type === 'pie') {
        chartOptions.innerRadius = displayOption.innerRadius;
      }
      chartOptions.theme = displayOption.theme || 'light';

      return chartOptions;
    },

    _settingColorArrayForPie: function(chartOptions, displayOption, type, mode) {
      if (type !== 'pie') {
        return;
      }

      //pie chart, assignee color array to series
      if (mode === 'field') {
        return;
      }
      var seriesStyle = displayOption.seriesStyle;
      if (seriesStyle && seriesStyle.styles && seriesStyle.styles[0]) {
        var matchStyle = seriesStyle.styles[0].style;
        if (matchStyle && Array.isArray(matchStyle.color)) {
          var colors = lang.clone(matchStyle.color);
          if (colors.length === 2) {
            colors = this.chartHelpUtils.getColors(lang.clone(matchStyle.color), 6);
          }
          chartOptions.color = colors;
        }
      }
    },

    _settingAxisDisplay: function(chartOptions, displayOption, type) {
      var axisTypes = ['column', 'bar', 'line'];
      if (axisTypes.indexOf(type) < 0) {
        return;
      }
      //axis cahrt, set stack and area
      if (!displayOption.stack) {
        displayOption.stack = false;
      }
      if ((type === 'column' || type === 'bar') || (type === 'line' && displayOption.area)) {
        chartOptions.stack = displayOption.stack;
      }
      //area
      if (type === 'line' && !displayOption.area) {
        displayOption.area = false;
      }

      if (type === 'line') {
        chartOptions.area = displayOption.area;
      }
      //scale
      chartOptions.scale = false;
    }

  });
});