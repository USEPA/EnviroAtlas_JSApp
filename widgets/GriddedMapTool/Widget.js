///////////////////////////////////////////////////////////////////////////
// Blue Raster WAB Gridded Map Tool
///////////////////////////////////////////////////////////////////////////
/*global define, console*/
define([
  'dojo/_base/declare',
  'jimu/BaseWidget',
  'dijit/_WidgetsInTemplateMixin',
  'dijit/_OnDijitClickMixin',
  'dojo/Evented',
  'dojo/on',
  'dojo/dom-class',
  'dojo/_base/lang',
  'dojo/_base/array',
  'jimu/utils',
  'jimu/dijit/TabContainer',
  'esri/toolbars/draw',
  'esri/graphic',
  'esri/geometry/scaleUtils',
  'esri/renderers/SimpleRenderer',
  'esri/symbols/SimpleFillSymbol',
  'esri/symbols/SimpleMarkerSymbol',
  'esri/symbols/SimpleLineSymbol',
  'esri/symbols/CartographicLineSymbol',
  'esri/Color',
  'esri/layers/GraphicsLayer',
  'esri/tasks/QueryTask',
  'esri/tasks/query',
  'esri/geometry/geometryEngine',
  'esri/layers/ArcGISImageServiceLayer',
  'esri/layers/FeatureLayer',
  'esri/layers/RasterFunction',
  'esri/layers/MosaicRule',
  'esri/layers/ImageServiceParameters',
  'esri/request',
  'esri/geometry/ScreenPoint', 
  'esri/geometry/Extent'
],
  function (declare, BaseWidget, _WidgetsInTemplateMixin, _OnDijitClickMixin, Evented,
    on, domClass, lang, arrayUtils, jimuUtils, TabContainer, Draw, Graphic, ScaleUtils, SimpleRenderer, SimpleFillSymbol, SimpleMarkerSymbol, SimpleLineSymbol, CartographicLineSymbol, Color, GraphicsLayer, QueryTask, Query, GeometryEngine, ArcGISImageServiceLayer, FeatureLayer, RasterFunction, MosaicRule, ImageServiceParameters, esriRequest, ScreenPoint, Extent) {
    return declare([BaseWidget, _WidgetsInTemplateMixin, _OnDijitClickMixin, Evented], {

      baseClass: 'widget-gridded-map',
      declaredClass: 'GriddedMapTool',
      unitDropdownSelection: null,
      pointMetric: 'kilometers',
      bufferRadius: 0.5,
      bufferGeometry: null,
      indicatorDropdownSelection: null,
      areaSelected: null,
      drawTool: null,
      drawLayer: null,
      symbol: null,
      geometry: null,
      mapClickEvent: null,
      inputTable: null,
      inputHeader1: null,
      inputHeader2: null,
      unitDropdown: null,
      indicatorDropdown: null,
      calculateButton: null,
      clearUnitButton: null,
      bufferInput: null,
      unitDetails: null,
      geometryLayer: null,
      layer: null,
      nlcdLegend: null,
      resultsLoaded: false,
      errorMessage: null,
      selectionText: null,
      indicatorUrl: null,
      nlcdYear: null,
      shapeFileLayers: [],

      postCreate: function () {
        this.inherited(arguments);
        this._initTabContainer();
      },

      _initTabContainer: function() {
        var tabs = [];
        tabs.push({
          title: this.nls.selectLabel,
          content: this.tabNode1
        });
        tabs.push({
          title: this.nls.resultsLabel,
          content: this.tabNode2
        });
        this.tabContainer = new TabContainer({
          tabs: tabs,
          selected: this.nls.selectLabel
        }, this.tabMain);
        this.tabContainer.startup();
        this.tabContainer.controlNodes[1].classList.add('esat-tab-disabled');
        this.own(on(this.tabContainer, 'tabChanged', lang.hitch(this, function (title) {
          if (this.resultsLoaded) {
            this.tabContainer.selected = this.nls.resultsLabel;
            this.tabContainer.controlNodes[1].classList.add('jimu-state-selected');
            this.tabContainer.controlNodes[1].classList.remove('esat-tab-disabled');
            if (title === this.nls.selectLabel) {
              this.tabContainer.controlNodes[1].classList.remove('jimu-state-selected');
            }
          }
          //disable results tab when no area selected or results
          if (title === this.nls.resultsLabel && (!this.areaSelected || !this.resultsLoaded)) {
            this.tabContainer.selectTab(this.tabNode1);
            this.tabContainer.selected = this.nls.selectLabel;
            this.tabContainer.controlNodes[0].classList.add('jimu-state-selected')
            this.tabContainer.controlNodes[1].classList.remove('jimu-state-selected')
          }
        })));
        jimuUtils.setVerticalCenter(this.tabContainer.domNode);
      },

      startup: function () {
        this.inherited(arguments);
        this._initDOMRefs();
        this._initListeners();
        this.clearUnitButton.innerHTML = this.nls.clear;
        this.clearIndicatorButton.innerHTML = this.nls.clear;
        this.calculateButton.innerHTML = this.nls.calculate;
      },

      onOpen: function() {
        if (!this.drawLayer) {
          this.drawLayer = new GraphicsLayer({id: 'griddedMapDrawLayer'});
        }
        if (this.geometryLayer) {
          this.geometryLayer.setVisibility(true);
        }
        this.map.addLayer(this.drawLayer);
        this.widgetClosed = false;
      },

      _initDOMRefs: function() {
        this.unitDropdown = document.getElementById('gridded-map-unit-input');
        this.indicatorDropdown = document.getElementById('gridded-map-indicator-input');
        this.indicatorDetails = document.getElementById('gridded-map-indicator-details');
        this.roadDistanceDetails = document.getElementById('gridded-map-indicator-roads');
        this.dateSelector = document.getElementById('gridded-map-date-selector');
        this.nlcdSelector = document.getElementById('gridded-map-nlcd-selector');
        this.unitDetails = document.getElementById('gridded-map-unit-details');
        this.inputTable = document.getElementById('gridded-map-input-table-wrapper');
        this.outputTable = document.getElementById('gridded-map-output-table-wrapper');
        this.inputHeader1 = document.getElementById('gridded-map-th-1');
        this.inputHeader2 = document.getElementById('gridded-map-th-2');
        this.clearUnitButton = document.getElementById('gridded-map-clear-unit-button');
        this.clearIndicatorButton = document.getElementById('gridded-map-clear-indicator-button');
        this.calculateButton = document.getElementById('gridded-map-calculate-button');
        this.bufferInput = document.getElementById('gridded-map-buffer');
        this.distanceFromInput = document.getElementById('gridded-map-distance-from');
        this.errorMessage = document.getElementById('gridded-map-error');
        this.selectionText = document.getElementById('gridded-map-selection-name');
        this.shapeFileDiv = document.getElementById('gridded-map-shape-file-wrapper');
        this.shapeFileInput = document.getElementById('gridded-map-shape-file-upload');
        this.shapeFileError = document.getElementById('gridded-map-shape-file-error');
        this.excludeInnerFeatureWrapper = document.getElementById('exlude-area-wrapper');
        this.excludeInnerFeatureCheckbox = document.getElementById('gridded-map-exlude-inner-feature');
        this.visiblelayer = document.getElementById('visible-layer');
        this.layersUsedList = document.getElementById('layers-used');
        this.resultsContainer = document.getElementById('gridded-map-results');
      },

      _initListeners: function() {
        document.addEventListener('change', e => {
          if (e.target.id === 'gridded-map-buffer') {
            return;
          }

          if (e.target.name === 'distance-from-value') {
            this.bufferRadius = e.target.valueAsNumber;
            if (this.bufferRadius == 0) {
              return;
            }
            // if (this.drawLayer.graphics.length > 0 && this.unitDropdownSelection !== 'point') {
            //   this._updatedBufferGraphic(); //if metric changes, we need to update the graphic on the map, if there is one
            // }
          }

          if (e.target.name === 'distance-from') {
            this.pointMetric = e.target.value;
            return;
          }

          if (e.target.name === 'metric') {
            this.pointMetric = e.target.value;
            if (this.drawLayer.graphics.length > 0) {
              this._updatedBufferGraphic(); //if metric changes, we need to update the graphic on the map, if there is one
            }
            return;
          }

          if (e.target.id === 'gridded-map-unit-input') {
            if (this.unitDetails.style.display = 'flex') {
              this.unitDetails.style.display = "none";
            }
  
            //deactivate the draw tool if needs be, so user can interact properly with the map
            if (this.drawTool) {
              this.drawTool.deactivate();
            }
  
            this.selectionText.innerHTML = "";
            this.errorMessage.innerHTML = "";
            this._handleUnitSelection(e.target.value);
            return;
          }

          if (e.target.id === 'gridded-map-indicator-input') {
            //this._clearUnitSelection();
            this.indicatorDropdownSelection = e.target.value;
            switch (this.indicatorDropdownSelection) {
              case 'nlcd':
              case 'nlcd-change':
              case 'impervious-floodplains': {
                this._handleNLCDSelection(this.indicatorDropdownSelection);
                break;
              }
              default:
                this._initLayers(this.indicatorDropdownSelection);
                break
            }
            return;
          }

          if (e.target.id === 'gridded-map-nlcd') {
            this.nlcdYear = e.target.value;
            this._handleNLCDSelection(this.indicatorDropdownSelection);
          }

          if (e.target.id === 'gridded-map-date-1') {
            this.nlcdChangeYear1 = e.target.value;
            this._handleNLCDSelection(this.indicatorDropdownSelection);
          }

          if (e.target.id === 'gridded-map-date-2') {
            this.nlcdChangeYear2 = e.target.value;
            this._handleNLCDSelection(this.indicatorDropdownSelection);
          }

          if (e.target.id === 'gridded-map-shape-file-upload') {
            let fileName = e.target.value.toLowerCase();
            const browser = window.navigator.userAgent;
            const isInternetExplorer = browser.indexOf("MSIE");
      
            if (isInternetExplorer) { //filename is full path in IE so extract the file name
              var arr = fileName.split("\\");
              fileName = arr[arr.length - 1];
            }
            if (fileName.indexOf(".zip") !== -1) {
              this.shapeFileError.innerHTML = "";
              this._generateFeatureCollection(fileName);
            }
            else {
              this.shapeFileError.innerHTML = "Shapefiles must be in a .zip format";
            }
          }
        })
        
        this.bufferInput.addEventListener('input', e => {
          this.bufferRadius = e.target.valueAsNumber;
          if (this.bufferRadius == 0) {
            return;
          }
          if (this.drawLayer.graphics.length > 0) {
            this._updatedBufferGraphic(); //if metric changes, we need to update the graphic on the map, if there is one
          }
        });

        this.distanceFromInput.addEventListener('blur', e => {
          this.bufferRadius = e.target.valueAsNumber;
          if (this.bufferRadius == 0) {
            return;
          }
          if (this.indicator === "population-roads") {
            if (this.bufferRadius % 30 !== 0) {
              this.bufferRadius = Math.round(this.bufferRadius/30)*30;
              this.distanceFromInput.value = this.bufferRadius;
            }
          }
          // if (this.drawLayer.graphics.length > 0) {
          //   this._updatedBufferGraphic(); //if metric changes, we need to update the graphic on the map, if there is one
          // }
        });
        

        // Run analysis and add to output area.
        this.calculateButton.addEventListener('click', async () => {
          this.resultsLoaded = false;
          let image = '<img src="./configs/loading/images/predefined_loading_1.gif"/>';
          this.calculateButton.innerHTML = image;
          this.errorMessage.innerHTML = "";   
          $('#gridded-map-output-table-wrapper').empty();
          
          let geo, line;

          switch (this.unitDropdownSelection) {
            case 'point':
              geo = this.bufferGeometry;
              break;
            case 'line':
              geo = this.bufferGeometry;
              line = Math.round(GeometryEngine.geodesicLength(this.geometry, `${this.pointMetric}`));
              break;
            case 'area':
              if (this.bufferRadius > 0) {
                geo = this.excludeInnerFeatureCheckbox.checked ? GeometryEngine.difference(this.bufferGeometry, this.geometry) : this.bufferGeometry;
              } else {
                geo = this.geometry;
              }
              break;
            default:
              geo = this.geometry;
              break;
          }

          //const area = Math.round(GeometryEngine.planarArea(geo, `square-${this.pointMetric}`));
          //const area = Math.round((GeometryEngine.planarArea(geo, `square-${this.pointMetric}`)) * 10) / 10;
          //const area = Math.round((GeometryEngine.geodesicArea(geo, `square-${this.pointMetric}`)) * 10) / 10;

          const pixel_size = this.nls[this.indicator].resolution;
          let compHistEndpoint = `${this.indicatorUrl}/computeStatisticsHistograms`;

          let compHistContent = { 
            f: 'json',
            geometryType: 'esriGeometryPolygon',
            geometry: JSON.stringify(geo),
            pixelSize: pixel_size,
            noData: 0
          }

          let query, results;
          

          switch (this.indicator) {
            case 'nlcd':
              const nlcdYearMosaicRule = {
                mosaicMethod: "esriMosaicLockRaster",
                lockRasterIds: [this.nls.nlcd.OBJECTIDS[this.nlcdYear]]
              }

              // Get NLCD results
              compHistContent.mosaicRule = JSON.stringify(nlcdYearMosaicRule);
              results = await this._computeHistograms(compHistEndpoint, compHistContent);
              if (results) {
                const totalCount = results.statistics[0].count;
                var area = totalCount * (pixel_size * pixel_size) / 1000000;
                
                const nlcdResults = {}
                results.histograms[0].counts.forEach((count, index) => {
                  if (count > 0) {
                    nlcdResults[index] = {
                      year1_area: this._calculateNLCDChangeArea(totalCount, count, area),
                      year1_perc: this.calculatePercentages(totalCount, count),
                      name: this.nls.nlcd.indices[index],
                      legend: `<div class="nlcd-index-legend" style="width:15px; height:15px; background-color: ${this.nls.nlcd.colors[index]}"></div>`
                    }
                  }
                });
                
                data = Object.entries(nlcdResults).map(( [k, v] ) => (v));
              
                var headers = [
                  { head: '', cl: 'title', d: 'legend' },
                  { head: 'Land Cover Type', cl: 'nlcd_title', d: 'name' },
                  { head: this.nlcdYear +' Area ('+this._getMetricString(this.pointMetric)+'2)', cl: '', d: 'year1_area' },
                  { head: 'Percentage', cl: '', d: 'year1_perc' }]
                table = this._renderTable(headers, data)
                  
                $('#gridded-map-output-table-wrapper').append(table);
      
                if (Object.keys(nlcdResults).length > 3) {
                  domClass.add(this.tabNode2, 'overflow');
                } else {
                  domClass.remove(this.tabNode2, 'overflow');
                }
                
              }
              
              break; 

            case 'padus':
              const padusMR = {
                mosaicMethod: "esriMosaicLockRaster",
                lockRasterIds: [this.nls.padus.lockRasterId]
              }
              compHistContent.mosaicRule = JSON.stringify(padusMR);
              inputTableData = [] 
              results = await this._computeHistograms(compHistEndpoint, compHistContent);
              if (results) {
                const totalCount = results.statistics[0].count;
                const percentagePADUS = this.calculatePercentages(totalCount, results.histograms[0].counts[255]);
                const areaOfPADUS = Number((percentagePADUS / 100) * area).toFixed(2);


        
                inputTableData.push({'attribute': 'Protected Area (km2)', 'value': areaOfPADUS});
                inputTableData.push({'attribute': 'Percent Protected Area', 'value': percentagePADUS});

                

                inputTableData.push({'attribute': 'Area', 'value': area + this._getMetricString(this.pointMetric) + '2'});
        
                var headers = [
                      { head: 'Protected Area results', cl: '', d: 'attribute' },
                      { head: ' ', cl: '', d: 'value' }]
                table = this._renderTable(headers, inputTableData)
                
                this.inputTable.append(table)


                table = this._renderTable(headers, inputTableData)

                $('#gridded-map-output-table-wrapper').append(table);

              //   resultsHTML += `
              //   <tr class="index-results">
              //     <td class="output-table-cell attr">
              //       ${'Protected Area Size'}
              //     </td>
              //     <td class="output-table-cell val">
              //       ${this.formatLargeNumber(areaOfPADUS)} km2
              //     </td>
              //   </tr>
              // `
              };
              break;
            
            case 'nlcd-change':
              const years = [this.nlcdChangeYear1, this.nlcdChangeYear2];
              const yearCounts = {};
              let totalCount;
              for (let index = 0; index < years.length; index++) {
                const year = years[index];
                const nlcdChangeMosaicRule = {
                  mosaicMethod: "esriMosaicLockRaster",
                  lockRasterIds: [this.nls.nlcd.OBJECTIDS[year]]
                }
                compHistContent.mosaicRule = JSON.stringify(nlcdChangeMosaicRule);
                results = await this._computeHistograms(compHistEndpoint, compHistContent);
                if (results && results.statistics.length > 0) {
                  totalCount = results.statistics[0].count;
                  const counts = {};
                  
                  Object.keys(this.nls.nlcd.indices).forEach(key => {
                    counts[key] = results.histograms[0].counts[key]
                  });
                  
                  yearCounts[year] = counts;
                }
              }
              var area = totalCount * (pixel_size * pixel_size) / 1000000;
              const changeResults = {};
              //Object.keys(yearCounts[years[0]]).forEach(key => {
              Object.keys(this.nls.nlcd.indices).forEach(key => {
                if (yearCounts[years[0]][key] > 0 || yearCounts[years[1]][key] > 0) {
                  const oldNumber = yearCounts[years[0]][key];
                  const oldArea = this._calculateNLCDChangeArea(totalCount, oldNumber, area);
                  const oldPercent = Number(oldNumber / totalCount * 100).toFixed(1);
                  const newNumber = yearCounts[years[1]][key]; 
                  const newArea = this._calculateNLCDChangeArea(totalCount, newNumber, area);
                  const newPercent = Number(newNumber / totalCount * 100).toFixed(1);
  
                  const percentChanged = Number((newNumber - oldNumber) / oldNumber * 100).toFixed(2);
                  const areaChange = Number(newArea - oldArea).toFixed(2);
                  
                  changeResults[key] = {
                    year1n: oldArea,
                    year2n: newArea,
                    year1p: oldPercent,
                    year2p: newPercent,
                    percentChanged: percentChanged,
                    areaChange: areaChange,
                    name: this.nls.nlcd.indices[key],
                    colors: this.nls.nlcd.colors[key],
                    legend: `<div class="nlcd-index-legend" style="width:15px; height:15px; background-color: ${this.nls.nlcd.colors[key]}"></div>`
                  };
                };
              });
              
              domClass.add(this.tabNode2, 'overflow');
              
              
              
              data = changeResults;
              data = Object.entries(data).map(( [k, v] ) => (v))
              
              // create table
              var headers = [
              { head: '', cl: 'title', d: 'legend' },
              { head: 'Land Cover Type', cl: 'nlcd_title', d: 'name' },
              { head: years[0] +' Area (km2)', cl: '', d: 'year1n' },
              { head: years[0] +' Percentage', cl: '', d: 'year1p' },
              { head: years[1] +' Area (km2)', cl: '', d: 'year2n' },
              { head: years[1] +' Percentage', cl: '', d: 'year2p' }]
              table = this._renderTable(headers, data)
                
              //Sort for cascading bar chart
              data = data.sort(function(a, b) {
                    return d3.ascending(parseFloat(a.areaChange), parseFloat(b.areaChange));
              });
              // create chart   
              chart = this._DivergingBarChart(data, {
              x: d => d.areaChange,
              y: d => d.name,
              xLabel: "&#129060; decrease - Change in area (km2) - increase &#129062;",
              marginRight: 15,
              marginLeft: 15,
              xFormat: '.2f',
              colors: d => d.colors
              });
              
              //chart.classList.add('divergingbarchart_class');
              
              // add chart then table
              $('#gridded-map-output-table-wrapper').append(chart)
              $('#gridded-map-output-table-wrapper').append(table)
              
              break;
            default:
              break;
          }

                    
          this._renderResults(results, area, line);
          
         
        });

        this.mapClickEvent = this.map.on('click', e => {
          if (!this.unitDropdownSelection || this.widgetClosed) {
            return;
          }

          let url;
          let outfields;
          
          switch (this.unitDropdownSelection) {
            case 'state':
              url = this.nls.stateLayer;
              outfields = ['STATE_NAME', 'POPULATION'];
              break;
            case 'county':
              url = this.nls.countyLayer;
              outfields = ['STATE_NAME', 'NAME'];
              break;
            case 'district':
              url = this.nls.districtLayer;
              outfields = ['DISTRICTID', 'NAME', 'PARTY', 'STATE_ABBR'];
              break;
            case 'huc-8':
              url = this.nls["huc-8Layer"];
              outfields = ['HUC8', 'HU_8_Name'];
              break;
            case 'huc-12':
              url = this.nls["huc-12Layer"];
              outfields = ['HUC_12', 'HU_12_Name'];
              break;
            default:
              break;
          }
  
          //re-activate the draw tool if needs be
          if (this.drawTool && this.drawLayer.graphics.length > 0) {
            if (this.unitDropdownSelection == 'area') {
              this.drawTool.activate(Draw['FREEHAND_POLYGON']);
            } else if (this.unitDropdownSelection == 'point' && !this.pointReSelected) {
              this.drawTool.activate(Draw['POINT']);
              this.pointReSelected = true; //have to set a flag to handle map-click firing twice
            }
          }
  
          // manually switch back to the 'selection' tab if we're in the results tab
          if (this.tabContainer.selected === this.nls.resultsLabel) {
            this.tabContainer.selectTab(this.tabNode1);
            this.tabContainer.controlNodes[0].classList.add('jimu-state-selected')
            this.tabContainer.controlNodes[1].classList.remove('jimu-state-selected')
          }

          this._resetResultsTabHTML();

          if (url) {
            const queryTask = new QueryTask(url);
            const query = new Query();
            query.geometry = e.mapPoint;
            query.outFields = outfields;
            query.returnGeometry = true;
            queryTask.execute(query).then(res => {
              if (res.features && res.features.length > 0) {
                this.geometry = res.features[0].geometry;
                this.resultsTableHeaderData = res.features[0].attributes;
                if (this.drawLayer) {
                  const symbol = new SimpleFillSymbol();
                  symbol.style = 'none';
                  this._addGraphicToMap(symbol, this.geometry);
                }
                switch (this.unitDropdownSelection) {
                  case 'state':
                    this.selectionText.innerHTML = res.features[0].attributes.STATE_NAME;
                    break;
                  case 'county':
                    this.selectionText.innerHTML = `${res.features[0].attributes.NAME}, ${res.features[0].attributes.STATE_NAME}`
                    break;
                  case 'district':
                    this.selectionText.innerHTML = `${res.features[0].attributes.STATE_ABBR}: ${res.features[0].attributes.DISTRICTID}`
                    break;
                  case 'huc-8':
                    this.selectionText.innerHTML = `${res.features[0].attributes.HUC8} (${res.features[0].attributes.HU_8_Name})`
                    break;
                  case 'huc-12':
                    this.selectionText.innerHTML = `${res.features[0].attributes.HUC_12} (${res.features[0].attributes.HU_12_Name})`
                    break;
                  default:
                    break;
                }
              }
            });
          } else if (this.unitDropdownSelection === 'file') {
            let shapeFileGeomFound = false;
            arrayUtils.forEach(this.shapeFileLayers, (layer) => {
              if (shapeFileGeomFound || !layer.visible) {
                return;
              }
              const query = new Query();
              query.geometry = layer.fullExtent;
              layer.queryFeatures(query, (result) => {
                const { features } = result;
                const intersectedFeature = features.find(feature => GeometryEngine.intersects(e.mapPoint, feature.geometry));
                if (intersectedFeature) {
                  this.geometry = intersectedFeature.geometry;
                  if (this.layer) {
                    shapeFileGeomFound = true;
                    this._clipLayer(intersectedFeature.geometry);
                    this.resultsTableHeaderData = intersectedFeature;
                  }
                }
              }, (error) => console.log(error))
            });
          };
        });

        this.clearUnitButton.addEventListener('click', () => {
          this._clearUnitSelection();
        });

        this.clearIndicatorButton.addEventListener('click', () => {
          this._clearIndicatorSelection();
        });
      },

      _calculateNLCDChangeArea: function(total, count, area) {
        return Number((this.calculatePercentages(total, count) / 100) * area).toFixed(2);
      },

      _clearUnitSelection: function() {
        if (this.drawLayer.graphics.length > 0) {
          this.drawLayer.clear();
        }

        if (this.unitDropdownSelection == 'point') {
          this.bufferInput.value = 0.5
          this.pointMetric = 'kilometers';
          this.bufferRadius = 0.5;
        }

        if (this.unitDropdownSelection == 'file') {
          this.shapeFileInput.value = null;
          this.shapeFileError.innerHTML = "";
          this.shapeFileDiv.style.display = "none";
          arrayUtils.forEach(this.shapeFileLayers, (layer) => {
            this.map.removeLayer(layer);
          });
          this.shapeFileLayers = [];
        }

        if (this.drawTool && this.unitDropdownSelection == 'area') {
          this.drawTool.activate(Draw['FREEHAND_POLYGON']);
        }

        if (this.drawTool && this.unit == 'point') {
          this.drawTool.activate(Draw['POINT']);
        }

        if (this.indicatorLayer) {
          this.indicatorLayer.setRenderingRule(null);
        }

        if (this.populationLayer) {
          this.populationLayer.setRenderingRule(null);
        }

        if (this.geometryLayer) {
          this.map.removeLayer(this.geometryLayer);
          this.geometryLayer = null;
        }
        this.unitDropdownSelection = null;
        this.unitDropdown.value = "";
        this.geometry = null;
        this._resetInputTab();
      },

      _clearIndicatorSelection: function() {
        if (this.indicatorLayer) {
          this.map.removeLayer(this.indicatorLayer);
          this.indicatorLayer = null;
        }

        if (this.populationLayer) {
          this.map.removeLayer(this.populationLayer);
          this.populationLayer = null;
        }

        if (this.geometryLayer) {
          this.map.removeLayer(this.geometryLayer);
          this.geometryLayer = null;
        }

        this.pointMetric = 'kilometers';
        this.bufferRadius = 0.5;

        this.indicatorDropdownSelection = null;
        this.indicatorDropdown.value = "";

        this.nlcdChangeYear1 = null;
        this.nlcdChangeYear2 = null;
        this.nlcdYear = null;

        this.dateSelector.style.display = "none";
        this.nlcdSelector.style.display = "none";

        this._resetInputTab();
      },

      _resetInputTab: function() {
        this.calculateButton.disabled = true;
        this.calculateButton.innerHTML = this.nls.calculate;
        this._resetResultsTabHTML();
        this.errorMessage.innerHTML = "";
        if (this.unitDropdownSelection && this.unitDropdownSelection.includes('huc') && !this.geometryLayer.isVisibleAtScale(this.map.getScale())) {
          this.selectionText.innerHTML = this.nls.hucServiceMsg;
        } else {
          this.selectionText.innerHTML = "";
        }
        this.tabContainer.controlNodes[1].classList.add('esat-tab-disabled');
        this.unitDropdown.value = "";
        this.unitDetails.style.display = "none";
        this.indicatorDetails.style.display = "none";
      },

      _generateFeatureCollection: async function(fileName) {
        var name = fileName.split(".");
        //Chrome and IE add c:\fakepath to the value - we need to remove it
        name = name[0].replace("c:\\fakepath\\", "");

        this.shapeFileError.classList.add('black-text');
        this.shapeFileError.innerHTML = '<b>Loading shapefile...</b>';

        var params = {
          'name': name,
          'targetSR': this.map.spatialReference,
          'maxRecordCount': 1000,
          'enforceInputFileSizeLimit': true,
          'enforceOutputJsonSizeLimit': true
        };

        //generalize features for display Here we generalize at 1:40,000 which is approx 10 meters
        //This should work well when using web mercator.
        var extent = ScaleUtils.getExtentForScale(this.map, 40000);
        var resolution = extent.getWidth() / this.map.width;
        params.generalize = true;
        params.maxAllowableOffset = resolution;
        params.reducePrecision = true;
        params.numberOfDigitsAfterDecimal = 0;

        var shapeFileContent = {
          'filetype': 'shapefile',
          'publishParameters': JSON.stringify(params),
          'f': 'json',
          'callback.html': 'textarea'
        };

        try {
          const uploadRequest = await esriRequest({
            url: 'https://www.arcgis.com/sharing/rest/content/features/generate',
            content: shapeFileContent,
            form: document.getElementById('gridded-map-upload-form'),
            handleAs: 'json',
          });

          const { featureCollection } = uploadRequest;

          if (featureCollection && featureCollection.layers.length > 0) {
            this._addShapefileToMap(featureCollection);
          } else {
            this.shapeFileError.classList.remove('black-text');
            this.shapeFileError.innerHTML = "Error generating layer. Please try a different shapefile."
          }
        } catch (error) {
          this.shapeFileError.classList.remove('black-text');
          this.shapeFileError.innerHTML = `${error.message}. Plaese try a different shapefile.`
        }
      },

      _addShapefileToMap: function(featureCollection) {
        let fullExtent;
        const layers = [];

        arrayUtils.forEach(featureCollection.layers, (layer) => {
          const featureLayer = new FeatureLayer(layer);
          this.shapeFileLayers.push(featureLayer);
          this._changeShapefileRenderer(featureLayer);
          fullExtent = fullExtent ?
            fullExtent.union(featureLayer.fullExtent) : featureLayer.fullExtent;
          layers.push(featureLayer);
        });
        this.map.addLayers(layers);
        this.map.setExtent(fullExtent.expand(1.25), true);
        this.shapeFileError.innerHTML = "";
        this.shapeFileError.classList.remove('black-text');
        this.shapeFileInput.value = "";
      },

      _changeShapefileRenderer: function(layer) {
        let symbol;
        switch (layer.geometryType) {
          case 'esriGeometryPolygon':
            symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_NULL,
              new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                new Color([0, 0, 0]), 1));
            break;
          default:
            break;
        }
        if (symbol) {
          layer.setRenderer(new SimpleRenderer(symbol));
        }
      },

      _getMetricString: function(metric) {
        switch(metric) {
          case 'kilometers':
            return 'km';
          case 'miles':
            return 'mi';
          default:
            return 'km';
        }
      },

      formatLargeNumber: function(number) {
        const splitNumber = String(number).split('.');
        const beforeDecimal = splitNumber[0];
        const afterDecimal = splitNumber[1];
      
        const numberString = beforeDecimal;
      
        if (number >= 1000) {
          const stringArray = [];
          for (let i = 0; i < numberString.length; i++) {
            stringArray.push(numberString[i]);
          }
          stringArray.reverse();
          const stringWithExtras = [];
      
          for (let i = 0; i < stringArray.length; i++) {
            if (i !== 0 && i % 3 === 0) {
              stringWithExtras.push(',');
            }
            stringWithExtras.push(stringArray[i]);
          }
          stringWithExtras.reverse();
      
          if (afterDecimal) {
            return stringWithExtras.join('') + '.' + afterDecimal;
          }
          return stringWithExtras.join('');
        }
      
        if (afterDecimal) {
          return numberString + '.' + afterDecimal;
        }
        return numberString;
      },

      _computeHistograms: async function(url, content) {
        if (this.errorMessage.innerHTML !== "") {
          this.errorMessage.innerHTML =  "";
          let image = '<img src="./configs/loading/images/predefined_loading_1.gif"/>';
          this.calculateButton.innerHTML = image;
        }

        const compHistRequest = esriRequest({
          url,
          handleAs: "json",
          usePost: true,
          content,
        });

        try {
          const results = await compHistRequest;

          if (this.calculateButton.disabled) {
            this.calculateButton.innerHTML = this.nls.calculate;
            return;
          }

          return results;
        } catch (err) {
          this.calculateButton.innerHTML = this.nls.calculate;
          if (err.details && err.details[0] === 'The requested image exceeds the size limit.') {
            this.errorMessage.innerHTML = this.nls.sizeError;
          } else {
            this.errorMessage.innerHTML = this.nls.genericError;
          }
        }
      },

      _renderResults: function(results, area, line) {
        
        this._renderInputTable(this.resultsTableHeaderData, area, line);
        this.calculateButton.innerHTML = this.nls.calculate;
        this.resultsLoaded = true;
        this.tabContainer.selectTab(this.tabNode2); //manually switch tabs when results are ready
        /*document.getElementById('gridded-print-button').addEventListener('click', () => {
          var divContents = this.resultsContainer.innerHTML; 
          var a = window.open('', '', 'height=500, width=500'); 
          a.document.write('<html>'); 
          a.document.write('<head>')
          a.document.write('<style media="print">.noprint, .highcharts-exporting-group {display: none !important;}</style>')
          a.document.write('</head><body>')
          a.document.write(divContents); 
          a.document.write('</body></html>'); 
          a.document.querySelector('head').insertAdjacentHTML(
            "beforeend",
            "<link rel='stylesheet' media='print' type='text/css' href='./css/style.css'"
          )
          a.document.close(); 
          a.print(); 
        })*/
      },

      calculatePercentages: function(totalCount, count) {
        //return (count/totalCount * 100).toFixed(2)
        return (count/totalCount * 100).toFixed(2);
      },
      
      
      _renderInputTable: function(results, area, line) {
        $('#gridded-map-input-table-wrapper').empty(); 
        inputTableData = [] 
        
        inputTableData.push({'attribute': 'Analysis', 'value': this.indicatorDropdown.options[this.indicatorDropdown.selectedIndex].text});
        

        inputTableData.push({'attribute': 'Source Data', 
                             'value': '<a target= _blank" style="text-decoration:none" href="' +
                                    this.nls[this.indicator].layersUsedURL + '">' +  
                                   (this.nls[this.indicator].layersUsed) + '</a>'});
 
        switch(this.unitDropdownSelection) {
          case 'district':
            inputTableData.push({'attribute': 'Geometry Type', 'value': 'Congressional District'});
            inputTableData.push({'attribute': 'District', 'value': this.nls.districtVersion + ' - ' + results.STATE_ABBR+results.DISTRICTID});
            inputTableData.push({'attribute': 'Representative', 'value': results.NAME + ' - ' +results.PARTY});
            break;
          case 'county':
            inputTableData.push({'attribute': 'Geometry Type', 'value': 'County'});
            inputTableData.push({'attribute': 'County', 'value': results.NAME + ', ' + results.STATE_NAME});
            break;
          case 'state':
            inputTableData.push({'attribute': 'Geometry Type', 'value': 'State'});
            inputTableData.push({'attribute': 'State', 'value': results.STATE_NAME});
            break;
          case 'area':
            inputTableData.push({'attribute': 'Geometry Type', 'value': 'User provided area'});
            if (this.bufferRadius > 0) {
              inputTableData.push({'attribute': 'Buffer', 'value': this.formatLargeNumber(this.bufferRadius) + this._getMetricString(this.pointMetric)});
              inputTableData.push({'attribute': 'Area inside buffer excluded', 'value': 'True' ? this.excludeInnerFeatureCheckbox.checked : 'False'});
            }
            break;
          case 'point':
            inputTableData.push({'attribute': 'Geometry Type', 'value': 'User provided point'});
            inputTableData.push({'attribute': 'Lat/Lon', 'value': this.bufferGeometry.getCentroid().getLatitude().toFixed(4) +', '+
                                                                this.bufferGeometry.getCentroid().getLongitude().toFixed(4)});
            inputTableData.push({'attribute': 'Buffer Radius', 'value': this.formatLargeNumber(this.bufferRadius) + ' ' + this._getMetricString(this.pointMetric)});
            break;
          case 'line':
            inputTableData.push({'attribute': 'Geometry Type', 'value': 'User provided line'});
            inputTableData.push({'attribute': 'Length', 'value': line + ' ' + this._getMetricString(this.pointMetric)});
            inputTableData.push({'attribute': 'Buffer', 'value': this.formatLargeNumber(this.bufferRadius) + ' ' + this._getMetricString(this.pointMetric)});
            break;
          case 'huc-8':
            inputTableData.push({'attribute': 'Geometry Type', 'value': 'HUC-8'});
            inputTableData.push({'attribute': 'HUC-8 ID', 'value': results.HUC8});
            inputTableData.push({'attribute': 'HUC-8 Name', 'value': results.HU_8_Name});
            break;
          case 'huc-12':
            inputTableData.push({'attribute': 'Geometry Type', 'value': 'HUC-12'});
            inputTableData.push({'attribute': 'HUC-12 ID', 'value': results.HUC_12});
            inputTableData.push({'attribute': 'HUC-12 Name', 'value': results.HU_12_Name});
            break;
          case 'file':
            inputTableData.push({'attribute': 'Layer Name', 'value': results._layer.name});
            break
          default:
            break;
        }
        
        const pretty_area = Math.round(area * 10) / 10;
        inputTableData.push({'attribute': 'Area', 'value': pretty_area + ' ' + this._getMetricString(this.pointMetric) + '2'});
        
        var headers = [
              { head: 'Input Paramaters', cl: '', d: 'attribute' },
              { head: ' ', cl: '', d: 'value' }]
        table = this._renderTable(headers, inputTableData)
        
        this.inputTable.append(table)
        
        },
        
      
      _renderTable: function(headers, data) {
      
        var table_wrapper = d3.create('div')
            .attr('class', 'table-wrapper');
            
      	var table = table_wrapper.append('table');
      	
          // create table header
          table.append('thead').append('tr')
              .selectAll('th')
              .data(headers).enter()
              .append('th')
              .attr('class', d => d.cl)
              .text(d => d.head);
      
          // create table body
          table.append('tbody')
              .selectAll('tr')
              .data(data).enter()
              .append('tr')
              .selectAll('td')
              .data(function(row, i) {
          			cells = []
          			for(var ii=0; ii < headers.length; ii++) {
          				cells.push(row[headers[ii].d])
          			}
          			return cells;
                      })
              .enter()
              .append('td')
              .html(function(cell) {
      			return cell
      			});
            
         return table_wrapper.node();

      },

      
      // Copyright 2021 Observable, Inc.
      // Released under the ISC license.
      // modified from: https://observablehq.com/@d3/diverging-bar-chart
      _DivergingBarChart: function(data, {
        x = d => d, // given d in data, returns the (quantitative) x-value
        y = (d, i) => i, // given d in data, returns the (ordinal) y-value
        title, // given d in data, returns the title text
        marginTop = 30, // top margin, in pixels
        marginRight = 40, // right margin, in pixels
        marginBottom = 20, // bottom margin, in pixels
        marginLeft = 40, // left margin, in pixels
        width = 500, // outer width of chart, in pixels
        height = 350, // the outer height of the chart, in pixels
        xType = d3.scaleLinear, // type of x-scale
        xDomain, // [xmin, xmax]
        xRange = [marginLeft, width - marginRight], // [left, right]
        xFormat, // a format specifier string for the x-axis
        xLabel, // a label for the x-axis
        yPadding = 0.3, // amount of y-range to reserve to separate bars
        yDomain, // an array of (ordinal) y-values
        yRange, // [top, bottom]
        colors //= d3.schemePiYG[3] // [negative, ?, positive] colors
      } = {}) {
        // Compute values.
        const X = d3.map(data, x);
        const Y = d3.map(data, y);
      
        // Compute default domains, and unique the y-domain.
        var minx = Math.min.apply(Math, X)
        var maxx = Math.max.apply(Math, X)
        if (xDomain === undefined) xDomain = [minx - ((maxx-minx)*.1), maxx + ((maxx-minx)*.1)];
        if (yDomain === undefined) yDomain = Y;
        yDomain = new d3.InternSet(yDomain);
      
        // Omit any data not present in the y-domain.
        // Lookup the x-value for a given y-value.
        const I = d3.range(X.length).filter(i => yDomain.has(Y[i]));
        const YX = d3.rollup(I, ([i]) => X[i], i => Y[i]);
      
        // Compute the default height.
        if (height === undefined) height = Math.ceil((yDomain.size + yPadding) * 25) + marginTop + marginBottom;
        if (yRange === undefined) yRange = [marginTop, height - marginBottom];
      
        // Construct scales, axes, and formats.
        const xScale = xType(xDomain, xRange);
        const yScale = d3.scaleBand(yDomain, yRange).padding(yPadding);
        const xAxis = d3.axisBottom(xScale).ticks(width / 80, xFormat);
        const yAxis = d3.axisLeft(yScale).tickSize(0).tickPadding(6);
        const format = xScale.tickFormat(100, xFormat);
      
        // Compute titles.
        if (title === undefined) {
          title = i => `${Y[i]}\n${format(X[i])}`;
        } else if (title !== null) {
          const O = d3.map(data, d => d);
          const T = title;
          title = i => T(O[i], i, data);
        }
      
        const svg = d3.create("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [0, 0, width, height])
            .attr("style", "max-width: 100%; height: auto; height: intrinsic;display: block; margin: 0 auto; border-top:1px solid dimgray;border-bottom: 1px solid dimgray; margin-bottom: 20px;");
      
        svg.append("g")
            .attr("transform", `translate(0,${height-marginBottom})`)
      	  .attr("color", "dimgray")
            .call(xAxis)
            .call(g => g.select(".domain").remove())
            .call(g => g.selectAll(".tick line").clone()
                .attr("y2", -height + marginTop + marginBottom)
                .attr("stroke-opacity", 0.1))
            .call(g => g.append("text")
                .attr("x", xScale(0))
                .attr("y", -height + marginTop + marginBottom - 10)
                .attr("fill", "dimgray")
                .attr("text-anchor", "center")
                .html(xLabel));
      
        const bar = svg.append("g")
          .selectAll("rect")
          .data(I)
          .join("rect")
            .attr("fill", i => data[i].colors)//function(d, i) {return data[i].color})//i => i.color) //i => colors[X[i] > 0 ? colors.length - 1 : 0])
            .attr("x", i => Math.min(xScale(0), xScale(X[i])))
            .attr("y", i => yScale(Y[i]))
            .attr("width", i => Math.abs(xScale(X[i]) - xScale(0)))
            .attr("height", yScale.bandwidth());
      
        if (title) bar.append("title")
            .text(title);
      
        svg.append("g")
            .attr("text-anchor", "end")
            .attr("font-family", "sans-serif")
            .attr("font-size", 10)
          .selectAll("text")
          .data(I)
          .join("text")
            .attr("text-anchor", i => X[i] < 0 ? "end" : "start")
            .attr("x", i => xScale(X[i]) + Math.sign(X[i] + 0.0000001) * 4)
            .attr("y", i => yScale(Y[i]) + yScale.bandwidth() / 2)
            .attr("dy", "0.35em")
      	  .attr('fill', 'dimgray')
            .html(i => format(X[i]) +  " km&sup2;");
      
        svg.append("g")
            .attr("transform", `translate(${xScale(0)},0)`)
            .call(yAxis)
            .call(g => g.selectAll(".tick text")
      				  .attr("fill", "dimgray")
              .filter(y => YX.get(y) < 0)
                .attr("text-anchor", "start")
                .attr("x", 6));
      
        return svg.node();
      },
      

      _handleUnitSelection: function(option) {
        //reset everything if needs be
        this.unitDropdownSelection = option;
        this.geometry = null;
        this.drawLayer.clear();
        this.calculateButton.disabled = true;
        this.selectionText.innerHTML = '';

        if (this.geometryLayer) {
          this.map.removeLayer(this.geometryLayer);
        }

        this.unitDetails.style.display = "none";
        this.excludeInnerFeatureWrapper.style.display = "none";

        if (this.drawTool) {
          this._resetDrawTool();
        }

        switch(option) {
          case 'state':
          case 'county':
          case 'district':
          case 'huc-8':
          case 'huc-12':
            const url = this.nls[`${option}Layer`];
            this.geometryLayer = new FeatureLayer(url, {
              opacity: 0.5,
              id: `${option}Layer`
            });
            if (option.includes('huc')) {
              this.geometryLayer.setMinScale(2311163);
              this.geometryLayer.on('scale-visibility-change', (e) => {
                if (this.selectionText.innerHTML === this.nls.hucServiceMsg && this.geometryLayer.isVisibleAtScale(this.map.getScale())) {
                  this.selectionText.innerHTML = "";
                } else if (this.selectionText.innerHTML === "" && !this.geometryLayer.isVisibleAtScale(this.map.getScale())) {
                  this.selectionText.innerHTML = this.nls.hucServiceMsg;
                }
              });
              if (!this.geometryLayer.isVisibleAtScale(this.map.getScale())) {
                this.selectionText.innerHTML = this.nls.hucServiceMsg;
              }
            }
            const symbol = new SimpleLineSymbol(
              SimpleLineSymbol.STYLE_SOLID,
              new Color([0,0,0]),
              1
            );
            const renderer = new SimpleRenderer(symbol);
            this.geometryLayer.setRenderer(renderer);
            this.map.addLayer(this.geometryLayer);
            break;
          case 'point':
          case 'area':
          case 'line':  {
            this.bufferRadius = option === 'area' ? 0 : 0.5;
            this.unitDetails.style.display = "flex";
            this.bufferInput.value = this.bufferRadius;
            this.bufferInput.min = this.bufferRadius;
            if (option === 'area') {
              this.excludeInnerFeatureWrapper.style.display = "flex";
            }
            this._initDrawTool(option)
            break;
          }
          case 'file': {
            this.shapeFileDiv.style.display = 'flex';
            break;
          }
          default:
            break;
        }

      },

      _handleNLCDSelection: function(indicator) {
        switch(indicator) {
          case 'impervious-floodplains':
          case 'nlcd':
            if (!this.nlcdYear) {
              document.getElementById('gridded-map-nlcd').innerHTML = Object.keys(this.nls.nlcd.OBJECTIDS).sort().reverse().map(year => `<option value="${year}">${year}</option>`)
              this.nlcdYear = Object.keys(this.nls.nlcd.OBJECTIDS).sort().reverse()[0];
            }
            this.nlcdSelector.style.display = "flex";
            this.dateSelector.style.display = "none";
            this._initLayers(indicator);
            break;
          case 'nlcd-change': {
            if (!this.nlcdChangeYear1) {
              //all but last year as selectable for date-1
              document.getElementById('gridded-map-date-1').innerHTML = Object.keys(this.nls.nlcd.OBJECTIDS).slice(0, Object.keys(this.nls.nlcd.OBJECTIDS).length-1).map(year => `<option value="${year}">${year}</option>`)
              this.nlcdChangeYear1 = Object.keys(this.nls.nlcd.OBJECTIDS)[0];
            }
            if (!this.nlcdChangeYear2) {
              document.getElementById('gridded-map-date-2').innerHTML = Object.keys(this.nls.nlcd.OBJECTIDS).map((year, index) => `<option value="${year}" ${index === Object.keys(this.nls.nlcd.OBJECTIDS).length-1 ? 'selected' : ''}>${year}</option>`)
              this.nlcdChangeYear2 = Object.keys(this.nls.nlcd.OBJECTIDS)[Object.keys(this.nls.nlcd.OBJECTIDS).length-1]
            }
            this.nlcdSelector.style.display = "none";
            this.dateSelector.style.display = "flex";
            this._initLayers(indicator, this.nlcdChangeYear1);
          }
        }
      },

      _initLayers: function(indicator) {
        const params = new ImageServiceParameters();
        params.noData = 0;

        this.visiblelayer.style.display = 'none';
        if (indicator === 'nlcd-change') {
          this.visiblelayer.style.display = 'inline';
        }

        this.indicator = indicator;

        if (this.indicatorLayer) {
          this.map.removeLayer(this.indicatorLayer);
          this.indicatorLayer = null;
          this.indicatorUrl = null;
        }

        this.indicatorDetails.style.display = "none";
        this.roadDistanceDetails.style.display = "none";

        if (indicator === 'population-padus') {
          this.indicatorDetails.style.display = "flex";
          this.bufferRadius = this.bufferInput.valueAsNumber;
          document.getElementById('indicator-distance-from-label').innerHTML = `Distance to PADUS:`;
        } else if (indicator === 'population-roads') {
          this.roadDistanceDetails.style.display = "flex";
          this.bufferRadius = this.distanceFromInput.valueAsNumber;
          document.getElementById('indicator-distance-from-label').innerHTML = `Distance to Roads (increments of 30 meters):`;
        }

        if (indicator !== 'nlcd-change') {
          this.dateSelector.style.display = "none";
        }

        if (indicator !== 'nlcd' && indicator !== 'impervious-floodplains') {
          this.nlcdSelector.style.display = "none";
        }

        let mosaicRule;
        
        if (indicator === 'nlcd') {
          this.layersUsedList.innerHTML = `<li>${this.nlcdYear} NLCD</li>`
        } else if (indicator === 'nlcd-change') {
          this.layersUsedList.innerHTML = `
            <li>${this.nlcdChangeYear1} NLCD</li>
            <li>${this.nlcdChangeYear2} NLCD</li>
          `
        } else {
          this.layersUsedList.innerHTML = `
            ${this.nls[indicator].layersUsed.map(layer => {
              return `<li>${layer}</li>`
            }).join('')}
          `
        }

        switch(indicator) {
          case 'nlcd':
          case 'impervious-floodplains':
            this.indicatorUrl = this.nls.nlcd.layer;
            mosaicRule = new MosaicRule();
            mosaicRule.method = MosaicRule.METHOD_LOCKRASTER;
            mosaicRule.lockRasterIds = [this.nls.nlcd.OBJECTIDS[this.nlcdYear]]
            break;
          case 'nlcd-change':
            this.indicatorUrl = this.nls.nlcd.layer;
            mosaicRule = new MosaicRule();
            mosaicRule.method = MosaicRule.METHOD_LOCKRASTER;
            mosaicRule.lockRasterIds = [this.nls.nlcd.OBJECTIDS[this.nlcdChangeYear1], this.nls.nlcd.OBJECTIDS[this.nlcdChangeYear2]]
            break;
          case 'population-roads':
            this.indicatorUrl = this.nls[indicator].layer;
            mosaicRule = new MosaicRule();
            mosaicRule.method = MosaicRule.METHOD_LOCKRASTER;
            mosaicRule.lockRasterIds = [this.nls[indicator].lockRasterId]
            break;
          case 'population-floodplains':
            this.indicatorUrl = this.nls[indicator].layer;
            mosaicRule = new MosaicRule();
            mosaicRule.method = MosaicRule.METHOD_LOCKRASTER;
            mosaicRule.lockRasterIds = [this.nls[indicator].lockRasterId];
            break;
          case 'population-padus':
          case 'padus':
            this.polyUrl = this.nls.padus.polys;
            this.indicatorUrl = this.nls.padus.layer;
            mosaicRule = new MosaicRule();
            mosaicRule.method = MosaicRule.METHOD_LOCKRASTER;
            mosaicRule.lockRasterIds = [this.nls.padus.lockRasterId];
          default:
            this.indicatorUrl = this.nls.padus.layer
        }

        const layerOptions = {
          opacity: 0.5,
          id: `${indicator}-layer`,
          visible: true,
          minScale: 9244649
        }

        if (indicator === 'population-padus' || this.indicator === 'padus') {
          this.padusPolyLayer = new FeatureLayer(this.polyUrl, {
            ...layerOptions,
            visible: true
          })
          this.map.addLayer(this.padusPolyLayer);
        } 
        this.indicatorLayer = new ArcGISImageServiceLayer(this.indicatorUrl, {
          imageServiceParameters: params,
          ...layerOptions
        });

        if (mosaicRule) {
          this.indicatorLayer.setMosaicRule(mosaicRule)
        }

        this.map.addLayer(this.indicatorLayer);

        // if a user has already selected an area and changes the indicator, we want to clip the layers
        if (this.geometry) {
          if (this.indicatorLayer) {
            this._clipLayerToGeometry(this.indicatorLayer, this.geometry);
          }
        }
      },

      _initDrawTool: function(type) {
        this.drawTool = new Draw(this.map);
        switch (type) {
          case 'area':
            this.symbol = new SimpleFillSymbol();
            this.symbol.style = 'none';
            this.drawTool.activate(Draw['FREEHAND_POLYGON']);
            break;
          case 'point':
            this.symbol = new SimpleMarkerSymbol();
            this.symbol.setSize(22);
            this.symbol.setStyle(SimpleMarkerSymbol.STYLE_CROSS);
            this.drawTool.activate(Draw['POINT']);
            break;
          case 'line':
            this.symbol = new CartographicLineSymbol();
            this.symbol.setWidth(1.33);
            this.symbol.setStyle(CartographicLineSymbol.STYLE_SOLID);
            this.symbol.setCap(CartographicLineSymbol.CAP_ROUND);
            this.symbol.setJoin(CartographicLineSymbol.JOIN_ROUND)
            this.drawTool.activate(Draw['FREEHAND_POLYLINE']);
            break;
          default:
            break;
        }

        this.drawTool.on("draw-complete", e => {
          this._handleDrawComplete(e);
          this.pointReSelected = false;
        });
      },

      _handleDrawComplete: function(e) {
        this.geometry = e.geometry;

        if (this.drawLayer) {
          if (this.unitDropdownSelection == 'point' || this.unitDropdownSelection == 'line') {
            this._addBufferToMap();
          } else if (this.unitDropdownSelection == 'area') {
            const minArea = Math.PI * (0.5 * 0.5);
            const maxArea = 660000;
            const actualArea = GeometryEngine.geodesicArea(this.geometry, 'square-kilometers');
            if (actualArea < minArea) {
              this.errorMessage.innerHTML = this.nls.tooSmallError;
              return;
            } else if (actualArea > maxArea) {
              this.errorMessage.innerHTML = this.nls.sizeError;
              return;
            } else {
              this.errorMessage.innerHTML = '';
            }
            this._addGraphicToMap(this.symbol, this.geometry);
            if (this.bufferRadius > 0) {
              this._addBufferToMap();
            }
          }
        }
        
        this.drawTool.deactivate(); //deactivate the drawtool so user can interact with map correctly
      },

      _addGraphicToMap: function(symbol, geometry, isBuffer = false) {
        const graphic = new Graphic(geometry, symbol);
        if (this.drawLayer.graphics.length > 0 && !isBuffer) {
          this.drawLayer.clear(); //clear graphic if needs be, so only 1 on map at a time
        }

        this.drawLayer.add(graphic);

        if (this.indicatorLayer) {
          this._clipLayerToGeometry(this.indicatorLayer, geometry);
        }

        if (this.layer) {
          this._clipLayer(geometry);
        }
      },

      _clipLayer: function(geometry) {
        const clipRF = new RasterFunction();
        clipRF.functionName = "Clip";
        clipRF.functionArguments = {
          ClippingGeometry: geometry,
          ClippingType: 1,
          Raster: "$$"
        };
        clipRF.outputPixelType = "U8"; 
        this.layer.setRenderingRule(clipRF);
        const extent = geometry.getExtent();
        this.map.setExtent(extent, true)
        this.calculateButton.disabled = false;
        this.areaSelected = true;
      },

      _clipLayerToGeometry: function(layer, geometry) {
        let renderingrule;

        const clipFunction = new RasterFunction();
        clipFunction.functionName = "Clip";
        clipFunction.outputPixelType = "U8";  
        clipFunction.functionArguments = {
          ClippingGeometry: geometry,
          ClippingType: 1,
        };

        switch(this.indicator) {
          case 'population-floodplains':
            var floodplainColormap = new RasterFunction();  
            floodplainColormap.functionName = "Colormap";    
            floodplainColormap.functionArguments = {  
              "Colormap" : [  
                [1, 29, 139, 241]
                ],  
              "Raster" : clipFunction  //apply Colormap to output raster from the clip rasterFunction
            };  
            renderingrule = floodplainColormap;
            clipFunction.functionArguments.Raster = '$$';
            break;
          // case 'population-roads':
          //   var roadsColormap = new RasterFunction();  
          //   roadsColormap.functionName = "Colormap";    
          //   roadsColormap.functionArguments = {  
          //     "Colormap" : [  
          //       [0, 0, 0, 0]
          //       ],  
          //     "Raster" : clipFunction  //apply Colormap to output raster from the clip rasterFunction
          //   };  
          //   renderingrule = roadsColormap;
          //   clipFunction.functionArguments.Raster = '$$';
          //   layer.setVisibility(true);
          //   break;
          case 'nlcd':
          case 'nlcd-change':
          case 'impervious-floodplains':
            var nlcdColormap = new RasterFunction();  
            nlcdColormap.functionName = "Colormap";    
            nlcdColormap.functionArguments = {  
              "Colormap" : [  
                [11, 70, 107, 159],
                [21, 222, 197, 197],
                [22, 217, 146, 130],
                [23, 235, 0, 0],
                [24, 171, 0, 0],
                [31, 179, 172, 159],
                [41, 104, 171, 95],
                [42, 28, 95, 44],
                [43, 181, 197, 143],
                [52, 204, 184, 121],
                [71, 223, 223, 194],
                [81, 220, 217, 57],
                [82, 171, 108, 40],
                [90, 184, 217, 235],
                [95, 128, 160, 192]
                ],  
              "Raster" : clipFunction  //apply Colormap to output raster from the clip rasterFunction
            };  
            renderingrule = nlcdColormap;
            clipFunction.functionArguments.Raster = this.nls.nlcd.OBJECTIDS[this.nlcdYear];
            break;
          case 'padus':
          case 'population-padus':
            var padusColormap = new RasterFunction();  
            padusColormap.functionName = "Colormap";    
            padusColormap.functionArguments = {  
              "Colormap" : [  
                [1, 152, 139, 236]
                ],  
              "Raster" : clipFunction  //apply Colormap to output raster from the clip rasterFunction
            };  
            renderingrule = padusColormap;
            clipFunction.functionArguments.Raster = '$$';
            break;
          default:
            renderingrule = clipFunction;
            clipFunction.functionArguments.Raster = '$$';
            break;
        }

        layer.setRenderingRule(renderingrule);
        var extent = geometry.getExtent();
        //this._customZoomExtent(extent);
        this.map.setExtent(extent, true)
        this.calculateButton.disabled = false;
        this.areaSelected = true;
      },
      
      //https://gis.stackexchange.com/questions/345474/setting-map-extent-using-offset-in-arcgis-api-for-javascript-v3-x
      _customZoomExtent: function(extent) {
        var hiddenMapPartTopLeft = this.map.toMap(new ScreenPoint(0, 0)),
          hiddenMapPartBottomRight = this.map.toMap(new ScreenPoint(450, 0));//this.map.container.offsetHeight)); // Removed
      

        var dx = new Extent({
          xmin: hiddenMapPartTopLeft.x,
          ymin: hiddenMapPartBottomRight.y,
          xmax: hiddenMapPartBottomRight.x,
          ymax: hiddenMapPartTopLeft.y,
          spatialReference: map.spatialReference
        }).getWidth();
      
        extent = extent.offset(-dx, 0); //shift to right with -dx and to left with +dx
        this.map.setExtent(extent, true)
      },

      _addBufferToMap: function() {
        //this.bufferGeometry = GeometryEngine.buffer(this.geometry, this.bufferRadius, this.pointMetric, true);
        this.bufferGeometry = GeometryEngine.geodesicBuffer(this.geometry, this.bufferRadius, this.pointMetric, true);
        let bufferPoly = new SimpleFillSymbol();
        this._addGraphicToMap(bufferPoly, this.bufferGeometry, true);
      },

      _updatedBufferGraphic: function() {
        if (this.drawLayer.graphics.length > 1) {
          let bufferedGraphic = this.drawLayer.graphics[1];
          this.drawLayer.remove(bufferedGraphic);
        }
        this._addBufferToMap();
      },

      _resetWidget: function() {
        if (this.indicatorLayer) {
          this.map.removeLayer(this.indicatorLayer);
        }
        if (this.geometryLayer) {
          this.map.removeLayer(this.geometryLayer);
        }
        if (this.drawLayer) {
          this._resetDrawTool();
          this.map.removeLayer(this.drawLayer);
        }
        if (this.shapeFileLayers) {
          arrayUtils.forEach(this.shapeFileLayers, (layer) => {
            this.map.removeLayer(layer);
          });
        }
        this._resetVariables();
        this._resetResultsTabHTML();
        this._resetDOMNodes();
      },

      _resetDrawTool: function() {
        if (this.drawTool) {
          this.drawTool.deactivate();
          this.drawTool = null;
        }
        this.drawLayer.clear();
        this.symbol = null;
      },

      _resetDOMNodes: function() {
        this.unitDropdown.value = "";
        this.indicatorDropdown.value = "";
        this.calculateButton.disabled = true;
        this.calculateButton.innerHTML = this.nls.calculate;
        this.unitDetails.style.display = "none";
        this.indicatorDetails.style.display = "none";
        this.errorMessage.innerHTML = "";
        this.selectionText.innerHTML = "";
      },

      _resetVariables: function() {
        this.drawLayer = null;
        this.geometry = null;
        this.unitDropdownSelection = null;
        this.indicatorDropdownSelection = null;
        this.pointMetric = null;
        this.bufferRadius = null;
        this.nlcdLegend = null;
        this.resultsLoaded = false;
        this.drawTool = null;
        this.mapClickEvent = null;
        this.indicatorLayer = null;
        this.geometryLayer = null;
        this.areaSelected = null;
        this.indicatorUrl = null;
        this.nlcdYear = null;
        this.nlcdChangeYear1 = null;
        this.nlcdChangeYear2 = null;
      },

      _resetResultsTabHTML: function() {
        this.inputTable.innerHTML = '';
        this.outputTable.innerHTML = '';
        this.resultsLoaded = false;
      },

      destroy: function () {
        this.inherited(arguments);
        this._resetWidget();
      },

      onClose: function() {
        if (this.geometryLayer) {
          this.geometryLayer.setVisibility(false);
        }
        if (this.drawLayer) {
          this._resetDrawTool();
          this.drawLayer.clear();
        }
        this.widgetClosed = true;
        // this._resetWidget();
      }
    });
  });
