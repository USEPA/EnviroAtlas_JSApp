///////////////////////////////////////////////////////////////////////////
// Blue Raster WAB Ecosystem Service Analysis Tool
///////////////////////////////////////////////////////////////////////////
/*global define, console*/
define([
  'dojo/_base/declare',
  'jimu/BaseWidget',
  'dijit/_WidgetsInTemplateMixin',
  'dijit/_OnDijitClickMixin',
  'dojo/Evented',
  'dojo/on',
  'dojo/dom',
  'dojo/_base/lang',
  'jimu/utils',
  'jimu/dijit/TabContainer',
  'dijit/TooltipDialog',
  'dijit/popup',
  'dijit/Dialog',
  'esri/graphic',
  'esri/symbols/SimpleFillSymbol',
  'esri/symbols/SimpleLineSymbol',
  'esri/Color',
  'esri/layers/GraphicsLayer',
  'esri/tasks/QueryTask',
  'esri/tasks/query',
  'esri/layers/FeatureLayer',
  'esri/dijit/Legend',
  'esri/InfoTemplate',
  'esri/tasks/Geoprocessor'
],
  function (declare, BaseWidget, _WidgetsInTemplateMixin, _OnDijitClickMixin, Evented,
    on, dom, lang, jimuUtils, TabContainer, TooltipDialogue, popup, Dialog, Graphic, SimpleFillSymbol, SimpleLineSymbol, Color, GraphicsLayer, QueryTask, Query, FeatureLayer, Legend, InfoTemplate, Geoprocessor) {
      
    return declare([BaseWidget, _WidgetsInTemplateMixin, _OnDijitClickMixin, Evented], {

      baseClass: 'widget-esa',
      declaredClass: 'EcosystemServiceAnalysis',
      totalAllowableHUCs: 6,
      selectedHUCs: [],
      radarChart: null,
      radarChartActive: false,
      pieChart: null,
      customWeightToggle: null,
      customWeightsList: null,
      freshwaterButton: null,
      terrestrialButton: null,
      hucList: null,
      selectedIndex: null,
      resetRadarButton: null,
      resetButton: null,
      mapClickEvent: null,
      weightSliders: [],
      bufferRadius: null,
      drawLayer: null,
      geometry: null,
      tooltip: null,
      tooltipID: null,
      legendDiv: null,
      legend: null,
      ecoRegionLayer: null,
      ecoServiceLayer: null,
      resultsLayer: null,
      ecoReg: null,
      hucData: [],
      customizeWarningShown: false,
      defaultSliderValues: {},      
      hucFillColors: [
        new Color([124, 181, 236, 0.5]),
        new Color([144, 237, 125, 0.5]),
        new Color([247, 163, 92, 0.5]),
        new Color([241, 92, 128, 0.5]),
        new Color([43, 144, 143, 0.5]),
        new Color([123, 92, 225, 0.5])
      ],
      hucOutlineColors: [
        new Color([124, 181, 236, 1]),
        new Color([144, 237, 125, 1]),
        new Color([247, 163, 92, 1]),
        new Color([241, 92, 128, 1]),
        new Color([43, 144, 143, 1]),
        new Color([123, 92, 225, 1])
      ],
      hucColors: [
        "#7cb5ec",
        "#90ed7d",
        "#f7a35c",
        "#f15c80",
        "#2b908f",
        "#7b5ce1",
        "#d334c3",
        "#eded36"
      ],
      colorQueue: [0,1,2,3,4,5],
      pieChartValueMap: {
        0: 0.1,
        1: 0.5,
        2: 1,
        3: 2,
        4: 4
      },
      geoprocessor: null,

      postCreate: function () {
        this.inherited(arguments);
        this._initTabContainer();
      },

      _initTabContainer: function() {
        var tabs = [];
        tabs.push({
          title: this.nls.tabOneLabel,
          content: this.tabNode1
        });
        tabs.push({
          title: this.nls.tabTwoLabel,
          content: this.tabNode2
        });
        this.selectedTab = this.nls.tabOneLabel;
        this.tabContainer = new TabContainer({
          tabs: tabs,
          selected: this.selectedTab
        }, this.tabMain);
        this.tabContainer.startup();
        this.own(on(this.tabContainer, 'tabChanged', lang.hitch(this, function (title) {
          if (this.selectedTab === this.nls.tabTwoLabel && title === this.nls.tabOneLabel) {
            this._resetRadarChart();
            this.ecoRegionLayer.setVisibility(true);
          } else if (this.selectedTab === this.nls.tabOneLabel && title === this.nls.tabTwoLabel) {
            this._resetLayers();
            if (this.ecoRegionLayer) {
              this.ecoRegionLayer.setVisibility(false);
            }
            if (this.ecoServiceLayer) {
              this.ecoServiceLayer.setVisibility(false);
            }
          }
          this.selectedTab = title;
        })));
        jimuUtils.setVerticalCenter(this.tabContainer.domNode);
      },

      startup: function () {
        this.inherited(arguments);
        this._initDOMRefs();
        this._initListeners();
        this.resetButton.innerHTML = this.nls.reset;
        this.analyzeButton.innerHTML = this.nls.calculate;
        this.resetRadarButton.innerHTML = this.nls.reset;
      },

      onOpen: function() {
        if (!this.drawLayer) {
          this.drawLayer = new GraphicsLayer({id: 'griddedMapDrawLayer'});
        }
        this.map.addLayer(this.drawLayer);
      },

      _initDOMRefs: function() {
        this.freshwaterButton = document.getElementById('freshwater-button');
        this.terrestrialButton = document.getElementById('terrestrial-button');
        this.resetButton = document.getElementById('esat-reset-button');
        this.analyzeButton = document.getElementById('esat-calculate-button');
        this.customWeightToggle = document.getElementById('esat-custom-toggle');
        this.customWeightsList = document.getElementById('esat-weighting-list');
        this.chartContainer = document.getElementById('esat-radar-chart');
        this.resetRadarButton = document.getElementById('esat-reset-radar');
        this.hucList = document.getElementById('esat-huc-list');
        this.legendDiv = document.getElementById('esat-legend');
        this.hucListError = document.getElementById('esat-error-message');
        this.pieContainer = document.getElementById('weight-dist-wrapper');
        this.weightsList = document.getElementById('esat-weighting-list');
      },

      _initListeners: function() {
        document.addEventListener('change', e => {

          if (e.target === this.customWeightToggle && this.selectedIndex) {
            this.customWeightToggle.disabled = false;
            if (e.target.checked) {
              this.weightsList.classList.remove('disabled'); 
              this.weightSliders.forEach(slider => {
                const sliderEl = document.getElementById(slider.name);
                sliderEl.disabled = false;
              });
              const content = `
                <div>
                  <p class="customize-warning-title">${this.nls.customizeWarningTitle}</p>
                  <p class="customize-warning-body">${this.nls.customizeWarningBody}</p>
                </div>
              `;
              this.alert = new Dialog({
                content,
                style: "width: 300px; height: 150px;"
              })
              if (!this.customizeWarningShown) {
                this.alert.show();
                this.customizeWarningShown = true;
              }
              this.ecoRegionLayer.setVisibility(true);
            } else {
              this.weightsList.classList.add('disabled'); 
              if (this.resultsLayer) {
                this.map.removeLayer(this.resultsLayer);
                this.resultsLayer = null;
              }
              this._disableCustomWeights();
              this.analyzeButton.disabled = true;
              this.ecoRegionLayer.setVisibility(false);
              this.ecoServiceLayer.setDefinitionExpression(null);
              this.pieContainer.innerHTML = "";
            }
            e.stopPropagation();
            return;
          }

          if (!this.weightSliders.length) {
            e.stopPropagation();
            return;
          }

          const slider = this.weightSliders.find(slider => slider.name === e.target.id);

          if (slider) {
            slider.value = e.target.value;
            e.stopPropagation();
            return;
          }   

        });

        document.addEventListener('input', e => {
          const slider = this.weightSliders.find(slider => slider.name === e.target.id);
          if (slider) {
            const valueMap = {
              0: 'Very Low (0x)',
              1: 'Low (0.5x)',
              2: 'Medium (1x)',
              3: 'High (2x)',
              4: 'Very High (4x)'
            };
            const valueEl = document.getElementById(`${slider.name.split('-')[0]}-value`);
            valueEl.classList.remove('hidden');
            valueEl.innerHTML = valueMap[e.target.value];
            this._updatePieChart();
            e.stopPropagation();
            return;
          }
        });

        document.addEventListener('click', e => {
          if (e.target.className === 'huc-button') {
            this._removeHUC(e.target.innerText);
          } else if (e.target.className === 'info-button') {
            this._openTooltip(e.target.id);
          } else {
            e.stopPropagation();
            return;
          }
        });

        this.mapClickEvent = this.map.on('click', async e => {
          if (this.selectedTab === this.nls.tabTwoLabel) {
            if (this.selectedHUCs.length < this.totalAllowableHUCs) {
              const url = 'https://enviroatlas2.epa.gov/arcgis/rest/services/test_services/allResults/MapServer/0';
              const queryTask = new QueryTask(url);
              const query = new Query();
              query.geometry = e.mapPoint;
              query.outFields = ['HUC_12', 'HU_12_NAME', 'L1G1_D_ReVA', 'L1G2_D_ReVA', 'L1G3_D_ReVA', 'L1G4_D_ReVA', 'L1G5_D_ReVA', 'L1G6_D_ReVA', 'L1G7_D_ReVA', 'L1G8_D_ReVA'];
              query.where = '1=1';
              query.returnGeometry = true;
              const res = await queryTask.execute(query);
              if (this.selectedHUCs.length > 0) {
                const storedHuc = this.selectedHUCs.find(huc => huc && huc.name === `${res.features[0].attributes["HUC_12"]} (${res.features[0].attributes["HU_12_NAME"]})`);
                if (!storedHuc) {
                  this._addHUC(res.features[0]);
                }
              } else {
                this._addHUC(res.features[0]);
              }
            } else {
              this.hucListError.innerHTML = this.nls.tooManyHucs;
            }
          } else if (this.selectedTab === this.nls.tabOneLabel) {
            if (!this.customWeightToggle.checked) {
              this._getHuc(e.mapPoint);
            } else {
              const ecoRegQuery = new Query();
              ecoRegQuery.geometry = e.mapPoint;
              ecoRegQuery.outFields = ['ecoReg'];
              ecoRegQuery.where = '1=1';
              ecoRegQuery.returnGeometry = true;
              this.ecoRegionLayer.queryFeatures(ecoRegQuery, res => {
                const result = res.features[0];
                const { ecoReg} = result.attributes;
                if (ecoReg === this.ecoReg) {
                  this._getHuc(e.mapPoint);
                  return;
                }
                this.ecoReg = ecoReg;
                const defExp = `ecoReg = '${this.ecoReg}'`;
                if (this.ecoRegionLayer.visible) {
                  this.ecoServiceLayer.setDefinitionExpression(defExp);
                  this.map.setExtent(result.geometry.getExtent(), true);
                }
                this.ecoServiceLayer.setVisibility(true);
                this.customWeightToggle.disabled = false;
                this.analyzeButton.disabled = false;
              })
            }
          }
        });

        this.freshwaterButton.addEventListener('click', () => {
          if (this.selectedIndex == "Freshwater Quality") {
            return;
          }
          if (this.weightSliders) {
            this._disableCustomWeights();
          }
          this.selectedIndex = "Freshwater Quality";
          this._renderWeightOptions();
          this.customWeightToggle.disabled = false;
          this.terrestrialButton.classList.remove('selected');
          this.freshwaterButton.classList.add('selected');
          this.weightsList.classList.add('disabled');
          this._initMapLayer(this.selectedIndex);

          if (!this.pieChart) {
            this._initPieChart();
          }
        });

        this.terrestrialButton.addEventListener('click', () => {

          // Remove the alert and early return when Terrestrial Diversity is available
          this.alert = new Dialog({
            content: "Terrestrial Diversity is currently unavailable. Please use Freshwater Water Quality.",
            style: "width: 300px; height: 150px;"
          })
          this.alert.show();
          return;

          if (this.selectedIndex == "Terrestrial Diversity") {
            return;
          }
          if (this.weightSliders) {
            this._disableCustomWeights();
          }
          this.selectedIndex = "Terrestrial Diversity";
          this._renderWeightOptions();
          this.customWeightToggle.disabled = false;
          this.freshwaterButton.classList.remove('selected');
          this.terrestrialButton.classList.add('selected');
          this.weightsList.classList.add('disabled');
          this._initMapLayer(this.selectedIndex);
        });

        this.resetButton.addEventListener('click', () => {
          if (!this.weightSliders) {
            return;
          }

          if (this.resultsLayer) {
            this.map.removeLayer(this.resultsLayer);
            this.resultsLayer = null;
            this.ecoServiceLayer.setVisibility(true);
          }

          if (this.ecoReg) {
            this.analyzeButton.disabled = false;
          }

          this.weightSliders.forEach(slider => {
            slider.value = this.nls[this.selectedIndex][slider.name.split('-')[0].split('_').join(' ')].defaultValue;
            document.getElementById(slider.name).value = slider.value;
            const valueEl = document.getElementById(`${slider.name.split('-')[0]}-value`);
            valueEl.innerHTML = "Medium (1x)";
          });

          this._updatePieChart();
        });

        this.analyzeButton.addEventListener('click', () => {
          let image = '<img src="./configs/loading/images/predefined_loading_1.gif"/>';
          this.analyzeButton.innerHTML = image;

          const params = {
            EcoRegion: this.ecoReg
          };

          if (this.weightSliders) {
            this.weightSliders.forEach(slider => {
              const valueMap = {
                0: 0,
                1: 0.5,
                2: 1,
                3: 2,
                4: 4
              }
              const label = this.nls[this.selectedIndex][slider.name.split('-')[0].split('_').join(' ')].label;
              const value = valueMap[slider.value];
              params[label] = value;
            })
          }
          this.geoprocessor = new Geoprocessor(`${this.nls.geoprocessorURL}/${this.nls.geoprocessorJob}`);
          this.geoprocessor.submitJob(params, (job) => {
            const { jobStatus, jobId, messages } = job;
            if (jobStatus === "esriJobSucceeded") {
              if (this.resultsLayer) {
                this.map.removeLayer(this.resultsLayer);
                this.resultsLayer = null;
              }
              this.resultsLayer = new FeatureLayer(`${this.nls.geoprocessorURL}/${this.nls.geoprocessorResults}/${jobId}/0`, {
                outFields: ["L3"],
                opacity: 0.5,
                id: `${this.ecoReg}-custom-weight-layer`
              });
              this.map.addLayer(this.resultsLayer);
              this.ecoServiceLayer.setVisibility(false);
              this.analyzeButton.innerHTML = this.nls.calculate;
            }
          }, (error) => {
            console.log(error);
          });
        });

        this.resetRadarButton.addEventListener('click', () => {
          this._resetRadarChart();
        });
      },

      _getHuc: function(mapPoint) {
        let title, text, feature;
        const query = new Query();
        query.geometry = mapPoint;
        query.where = '1=1';
        query.returnGeometry = true;
        if (this.resultsLayer) {
          query.outFields = ['L3'];
          this.resultsLayer.queryFeatures(query, res => {
            feature = res.features[0];
            const { L3 } = feature.attributes;
            title = "Custom Weight Distribution";
            text = `${this.selectedIndex} Custom Index - ${Number(L3).toFixed(2)}`;
            this._openPopup(title, text, feature);
          })
        } else if (this.ecoServiceLayer) {
          query.outFields = ['HUC_12', 'L3_D_ReVA'];
          this.ecoServiceLayer.queryFeatures(query, res => {
            feature = res.features[0];
            const { L3_D_ReVA, HUC_12 } = feature.attributes;
            title = `HUC12 ID: ${HUC_12}`;
            text = `${this.selectedIndex} Index - ${Number(L3_D_ReVA.toFixed(2))}`;
            this._openPopup(title, text, feature);
          })
        }
      },

      _openPopup(title, text, feature) {
        var popupTemplate = new InfoTemplate(title, text);
        feature.setInfoTemplate(popupTemplate);
        this.map.infoWindow.setFeatures([feature]);
        this.map.infoWindow.show(feature.geometry.getCentroid())
      },

      _initMapLayer: function(selectedIndex) {
        const ecoRegionUrl = this.nls.ecoRegionBoundries;
        this.ecoRegionLayer = new FeatureLayer(ecoRegionUrl, {
          opacity: 0.75,
          outFields: ["ecoReg"],
          id: `ecoRegions-layer`,
          visible: false
        });
        this.map.addLayer(this.ecoRegionLayer);

        const indexUrl = this.nls[selectedIndex].url;
        this.ecoServiceLayer = new FeatureLayer(indexUrl, {
          outFields: ["ecoReg", "L3_D_ReVA"],
          opacity: 0.5,
          id: `${selectedIndex.split(' ').join('_')}-layer`
        });
        this.map.addLayer(this.ecoServiceLayer);

        this.legend = new Legend({
          map: this.map,
          layerInfos: [{
            layer: this.ecoServiceLayer,
            title: `${this.selectedIndex} Index`
          }],
          autoUpdate: false
        }, this.legendDiv);
        this.legendDiv.style.display = 'block';
        this.legend.startup();
      },

      _renderWeightOptions: function() {
        for (const [key, data] of Object.entries(this.nls[this.selectedIndex])) {
          if (key === 'url') {
            return;
          }
          const formattedWeightTitle = key.split(' ').join('_');

          this.customWeightsList.innerHTML = this.customWeightsList.innerHTML + 
            `
            <div class="weighting-option">
              <div class="info-container">
                <div class="input-wrapper">
                  <label for="custom">${key}</label>
                </div>
                <div class="slider-info">
                  <p class="esat-slider-value" id="${formattedWeightTitle}-value">Medium (1x)</p>
                  <button id="${formattedWeightTitle}-info-button" class="info-button">
                    i
                  </button>
                </div>
              </div>
              <input type="range" id="${formattedWeightTitle}-slider" name="${formattedWeightTitle}" value=${data.defaultValue} min="0" max="4" list="customWeightValues" disabled/>
              <datalist id="customWeightValues">
                <option value="0"></option>
                <option value="1"></option>
                <option value="2"></option>
                <option value="3"></option>
                <option value="4"></option>
              </datalist>
            </div>
          `;

          this.weightSliders.push({
            value: data.defaultValue,
            name: `${formattedWeightTitle}-slider`,
          });
        }
      },

      _openTooltip: function(id) {
        if (!this.customWeightToggle.checked) {
          return;
        }
        if (this.tooltip) {
          popup.close(this.tooltip);
          this.tooltip.destroy();
          this.tooltip = null;
          // our return here acts as the 'off' switch when clicking the same info button a second time
          if (this.tooltipID === id) {
            return;
          }
        }
        const formattedID = id.split('_').join(' ').split('-')[0];
        const infoDataLink = `http://www.epa.gov/enviroatlas/enviroatlas-data`;
        this.tooltip = new TooltipDialogue({
          id: 'esat-tooltip',
          style: 'width: 300px',
          content: `<button id="esat-close-info-button">X</button><p>${this.nls[this.selectedIndex][formattedID].info} Additional information regarding these layers can be found at: <a href="${infoDataLink}" target="_default">${infoDataLink}</a></p>`
        });

        popup.open({
          popup: this.tooltip,
          around: dom.byId(id)
        })

        document.getElementById('esat-close-info-button').addEventListener('click', () => {
          this._openTooltip(id);
        });

        this.tooltipID = id;
      },

      _updateHUCList: function() {
        const image = '<img src="./images/delete-icon.svg"/>';
        this.hucList.innerHTML = "";
        this.selectedHUCs.forEach(huc => {
          if (huc) {
            this.hucList.innerHTML = this.hucList.innerHTML + `
            <button class="huc-button">
              ${huc.name}${image}
            </button>
          `
          }
        })
      },

      _addHUC: function(huc) {
        this.geometry = huc.geometry;

        const hucObj = {
          name: `${huc.attributes["HUC_12"]} (${huc.attributes["HU_12_NAME"]})`,
          attributes: huc.attributes,
          geometry: this.geometry
        };

        this.selectedHUCs.push(hucObj);
        this._updateHUCList();

        const nextColorIndex = this.colorQueue[0];
        if (this.drawLayer) {
          const symbol = new SimpleFillSymbol();
          const outline = new SimpleLineSymbol();
          outline.color = this.hucOutlineColors[nextColorIndex];
          symbol.style = 'solid';
          symbol.color = this.hucFillColors[nextColorIndex];
          symbol.outline = outline;
          this._addGraphicToMap(symbol, this.geometry);
        };
        if (!this.radarChartActive) {
          this._initRadarChart(huc);
          this.radarChartActive = true;
        } else {
          this.radarChart.addSeries({
            type: 'area',
            name: `${huc.attributes["HUC_12"]} (${huc.attributes["HU_12_NAME"]})`,
            data: this._getIndexData(huc),
            color: this.hucColors[nextColorIndex]
          })
        }
        this.colorQueue.shift();
      },

      _removeHUC: function(huc) {
        if (this.hucListError.innerHTML !== "") {
          this.hucListError.innerHTML = "";
        }
        const index = this.selectedHUCs.findIndex(selectedHuc => selectedHuc.name === huc);
        if (index > -1) {
          const hucGraphic = this.drawLayer.graphics[index];
          this.selectedHUCs.splice(index, 1);

          const indexOfColorRemoved = this.hucFillColors.findIndex(color => color === hucGraphic.symbol.color);
          let indexToInsertBefore = this.colorQueue.findIndex(i => i > indexOfColorRemoved);
          if (indexToInsertBefore === 0) {
            indexToInsertBefore++;
          }
          this.colorQueue.splice(indexToInsertBefore - 1, 0, indexOfColorRemoved);

          this.drawLayer.remove(hucGraphic);
          this._updateHUCList();
          const dataIndex = this.radarChart.series.findIndex(data => data.name === huc);
          if (dataIndex > -1) {
            this.radarChart.series[dataIndex].remove(true, true);
          }
          if (this.radarChart.series.length < 1) {
            this._resetRadarChart();
          }
        }
      },

      _initRadarChart: function(huc) {
        const stressors = ['Sediment Loads', 'Land Use', 'Nitrogen Inputs', 'Phosphorus', 'Other Chemicals'];
        this.radarChart = Highcharts.chart(this.chartContainer, {
          chart: {
            polar: true,
          },
          credits: {
            enabled: false
        },    
          pane: {
            startAngle: 0,
            endAngle: 360
          },
          xAxis: {
            categories: Object.keys(this.nls["Freshwater Quality"]), // hardcoding because we don't have a selected index yet
            tickmarkPlacement: 'on',
            lineWidth: 0,
            labels: {
              formatter: function () {
                  if (stressors.includes(this.value)) {
                    return '<span style="fill: red;">' + this.value + '</span>';
                  } else {
                    return '<span style="fill: blue;">' + this.value + '</span>';
                  }
              }
            }
          },
          yAxis: {
            gridLineInterpolation: 'polygon',
            lineWidth: 0,
            min: 0
          },
          tooltip: {
            shared: false,
            pointFormat: '<span style="color:{series.color}">{series.name}: <b>{point.y}</b><br/>'
          },
          title: {
            text: this.selectedIndex
          },
          series: [{
            type: 'area',
            name: `${huc.attributes["HUC_12"]} (${huc.attributes["HU_12_NAME"]})`,
            data: this._getIndexData(huc)
          }]
        });
        this.resetRadarButton.hidden = false;
      },

      _resetRadarChart: function() {
        this.selectedHUCs = [];
        this.radarChart = null;
        this.radarChartActive = false;
        this.chartContainer.innerHTML = "";
        this.hucList.innerHTML = "";
        this.hucListError.innerHTML = "";
        this.resetRadarButton.hidden = true;
        this.drawLayer.clear();
        this.colorQueue = [0, 1, 2, 3, 4, 5];
      },

      _getIndexData: function(huc) {
        const hucData = []
        Object.keys(this.nls["Freshwater Quality"]).forEach(value => {
          if (value !== 'url') {
            const val = huc.attributes[this.nls["Freshwater Quality"][value].label]
            hucData.push(Number(val.toFixed(2)));
          }
        });
        return hucData;
      },

      _initPieChart: function() {
        const seriesData = Object.keys(this.nls[this.selectedIndex]).map((key, index) => {
          if (key !== 'url') {
            const formattedWeightTitle = key.split(' ').join('_');
            return {
              name: key,
              y: this.pieChartValueMap[document.getElementById(`${formattedWeightTitle}-slider`).value],
              color: this.hucColors[index]
            }
          }
        });
        this.pieChart = Highcharts.chart(this.pieContainer, {
          chart: {
            plotBackgroundColor: null,
            plotBorderWidth: null,
            plotShadow: false,
            type: 'pie'
          },
          credits: {
            enabled: false
        },    
          title: {
            text: 'Weight Distribution',
            align: 'left',
            style: {
              fontSize: '12px'
            }
          },
          tooltip: {
            formatter: (a) => {
              const point = a.chart.hoverPoint;
              let value = point.y;
              if (point.y === 0.1) {
                value = 0;
              }
              return `${point.name}: ${value}x`
            }
          },
          plotOptions: {
            pie: {
              dataLabels: {
                enabled: false
              },
              showInLegend: true,
              point: {
                events: {
                  legendItemClick: function () {
                    return false;
                  }
                }
              }
            }
          },
          legend: {
            align: 'right',
            layout: 'vertical',
            verticalAlign: 'bottom',
          },
          series: [{
            name: 'Weighting',
            colorByPoint: true,
            data: seriesData,
          }]
        })
      },

      _updatePieChart: function() {
        const seriesData = Object.keys(this.nls[this.selectedIndex]).map((key, index) => {
          if (key !== 'url') {
            const formattedWeightTitle = key.split(' ').join('_');
            return {
              name: key,
              y: this.pieChartValueMap[document.getElementById(`${formattedWeightTitle}-slider`).value],
              color: this.hucColors[index]
            }
          }
        });
        this.pieChart.series[0].setData(seriesData, true, true, true);
      },

      _addGraphicToMap: function(symbol, geometry) {
        const graphic = new Graphic(geometry, symbol);
        this.drawLayer.add(graphic);
      },

      _resetWidget: function() {
        this._resetLayers();
        this.map.removeLayer(this.ecoRegionLayer);
        this.map.removeLayer(this.ecoServiceLayer);
        if (this.resultsLayer) {
          this.map.removeLayer(this.resultsLayer);
        }
        if (this.drawLayer) {
          this.map.removeLayer(this.drawLayer);
        }
        this._resetVariables();
        this._disableCustomWeights();
        this._resetDOMNodes();
        document.removeEventListener('change', () => {});
      },

      _resetLayers() {
        if (this.ecoRegionLayer) {
          this.ecoRegionLayer.setDefinitionExpression(null);
        }
        if (this.ecoServiceLayer) {
          this.ecoServiceLayer.setDefinitionExpression(null);
          this.ecoServiceLayer.setVisibility(false);
        }
        this.ecoReg = null;
      },

      _disableCustomWeights: function() {
        this.customWeightToggle.checked = false;
        this.weightSliders.forEach(slider => {
          const sliderEl = document.getElementById(slider.name);
          sliderEl.disabled = true;
        });
        this.ecoReg = null;
      },

      _resetDOMNodes: function() {
        if (this.freshwaterButton.className === 'selected') {
          this.freshwaterButton.classList.remove('selected');
        }
        if (this.terrestrialButton.className === 'selected') {
          this.terrestrialButton.classList.remove('selected');
        }
        this.hucList.innerHTML = "";
        this.hucListError.innerHTML = "";
      },

      _resetVariables: function() {
        this.drawLayer = null;
        this.geometry = null;
        this.bufferRadius = null;
        this.selectedIndex = null;
        this.mapClickEvent = null;
        this.ecoRegionLayer = null;
        this.ecoServiceLayer = null;
        this.resultsLayer = null;
        this.ecoReg = null;
        this.tooltip = null;
        this.tooltipID = null;
        this.legend = null;
        this.colorQueue = [0, 1, 2, 3, 4, 5];
        this.customizeWarningShown = false;
        this.geoprocessor = null;
      },

      destroy: function () {
        this.inherited(arguments);
        this._resetWidget();
      },

      onClose: function() {
        // this._resetWidget();
      }
    });
  });