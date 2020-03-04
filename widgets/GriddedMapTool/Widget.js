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
  'jimu/utils',
  'jimu/dijit/TabContainer',
  'esri/toolbars/draw',
  'esri/graphic',
  'esri/renderers/SimpleRenderer',
  'esri/symbols/SimpleFillSymbol',
  'esri/symbols/SimpleMarkerSymbol',
  'esri/symbols/SimpleLineSymbol',
  'esri/Color',
  'esri/layers/GraphicsLayer',
  'esri/tasks/QueryTask',
  'esri/tasks/query',
  'esri/geometry/geometryEngine',
  'esri/layers/ArcGISImageServiceLayer',
  'esri/layers/FeatureLayer',
  'esri/layers/RasterFunction',
  'esri/layers/ImageServiceParameters',
  'esri/request'
],
  function (declare, BaseWidget, _WidgetsInTemplateMixin, _OnDijitClickMixin, Evented,
    on, domClass, lang, jimuUtils, TabContainer, Draw, Graphic, SimpleRenderer, SimpleFillSymbol, SimpleMarkerSymbol, SimpleLineSymbol, Color, GraphicsLayer, QueryTask, Query, GeometryEngine, ArcGISImageServiceLayer, FeatureLayer, RasterFunction, ImageServiceParameters, esriRequest) {
    return declare([BaseWidget, _WidgetsInTemplateMixin, _OnDijitClickMixin, Evented], {

      baseClass: 'widget-gridded-map',
      declaredClass: 'GriddedMapTool',
      unitDropdownSelection: null,
      indicatorURL: null,
      pointMetric: 'kilometers',
      bufferRadius: 0.5,
      bufferGeometry: null,
      indicatorDropdownSelection: 'nlcd',
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
      clearButton: null,
      metricOptions: null,
      bufferInput: null,
      unitDetails: null,
      geometryLayer: null,
      layer: null,
      nlcdLegend: null,
      resultsLoaded: false,
      errorMessage: null,
      selectionText: null,

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
        this.clearButton.innerHTML = this.nls.clear;
        this.calculateButton.innerHTML = this.nls.calculate;
        //We're only initializing a layer here while NLCD is the only indicator a user can choose from
        this._initLayers(this.indicatorDropdownSelection);
      },

      onOpen: function() {
        if (!this.drawLayer) {
          this.drawLayer = new GraphicsLayer({id: 'griddedMapDrawLayer'});
        }
        //We're only initializing a layer here while NLCD is the only indicator a user can choose from
        if (!this.layer) {
          this._initLayers(this.indicatorDropdownSelection);
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
        this.unitDetails = document.getElementById('gridded-map-unit-details');
        this.inputTable = document.getElementById('gridded-map-input-table-wrapper');
        this.outputTable = document.getElementById('gridded-map-output-table-wrapper');
        this.inputHeader1 = document.getElementById('gridded-map-th-1');
        this.inputHeader2 = document.getElementById('gridded-map-th-2');
        this.clearButton = document.getElementById('gridded-map-clear-button');
        this.calculateButton = document.getElementById('gridded-map-calculate-button');
        this.metricOptions = document.getElementsByName('gridded-map-metric');
        this.bufferInput = document.getElementById('gridded-map-buffer');
        this.errorMessage = document.getElementById('gridded-map-error');
        this.selectionText = document.getElementById('gridded-map-selection-name');
      },

      _initListeners: function() {
        document.addEventListener('change', e => {
          if (e.target.id === 'gridded-map-buffer') {
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
            this.indicatorDropdownSelection = e.target.value;
            return;
          }
        })
        
        this.bufferInput.addEventListener('input', e => {
          this.bufferRadius = e.target.value;
          if (this.bufferRadius == 0) {
            return;
          }
          if (this.drawLayer.graphics.length > 0) {
            this._updatedBufferGraphic(); //if metric changes, we need to update the graphic on the map, if there is one
          }
        });

        this.calculateButton.addEventListener('click', () => {
          this._calculateResults();
        });

        this.mapClickEvent = this.map.on('click', e => {

          if (!this.unitDropdownSelection || this.widgetClosed) {
            return;
          }

          if (this.resultsLoaded) {
            this._clearSelection();
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
            case 'huc':
              url = this.nls.hucLayer;
              outfields = ['HUC_8', 'HU_8_NAME'];
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
                case 'huc':
                  this.selectionText.innerHTML = `${res.features[0].attributes.HUC_8} (${res.features[0].attributes.HU_8_NAME})`
                  break;
                default:
                  break;
              }
            });
          }
        });

        this.clearButton.addEventListener('click', () => {
          this._clearSelection();
        });

      },

      _clearSelection: function() {
        if (this.drawLayer.graphics.length > 0) {
          this.drawLayer.clear();
        }

        if (this.unitDropdownSelection == 'point') {
          this.bufferInput.value = 0.5
          this.pointMetric = 'kilometers';
          this.bufferRadius = 0.5;
        }

        if (this.drawTool && this.unitDropdownSelection == 'area') {
          this.drawTool.activate(Draw['FREEHAND_POLYGON']);
        }

        if (this.drawTool && this.unit == 'point') {
          this.drawTool.activate(Draw['POINT']);
        }

        if (this.layer) {
          this.layer.setRenderingRule(null);
        }

        this.calculateButton.disabled = true;
        this.calculateButton.innerHTML = this.nls.calculate;
        this._resetResultsTabHTML();
        this.errorMessage.innerHTML = "";
        if (this.unitDropdownSelection === 'huc' && !this.geometryLayer.isVisibleAtScale(this.map.getScale())) {
          this.selectionText.innerHTML = this.nls.hucServiceMsg;
        } else {
          this.selectionText.innerHTML = "";
        }
        this.tabContainer.controlNodes[1].classList.add('esat-tab-disabled');
      },

      _getMetricString: function(metric) {
        switch(metric) {
          case 'kilometers':
            return 'km';
          case 'miles':
            return 'm';
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

      _calculateResults: function() {
        this.resultsLoaded = false;
        let image = '<img src="./configs/loading/images/predefined_loading_1.gif"/>';
        this.calculateButton.innerHTML = image;
        this.errorMessage.innerHTML = "";

        const geo = this.unitDropdownSelection == 'point' ? this.bufferGeometry : this.geometry;
        
        const area = Math.round(GeometryEngine.planarArea(geo, `square-${this.pointMetric}`));

        const remapRF = {
          rasterFunction: 'Remap',
          rasterFunctionArguments: {
            InputRanges: [11, 13, 21, 25, 31, 32, 41, 44, 52, 53, 71, 72, 81, 83, 90, 91, 95, 96],
            OutputValues: [90, 23, 31, 42, 71, 71, 82, 90, 90], 
            AllowUnmatched: false
          }
        };

        const compHistEndpoint = `${this.indicatorURL}/computeStatisticsHistograms`;
        const compHistRequest = esriRequest({
          url: compHistEndpoint,
          handleAs: "json",
          usePost: true,
          content: { 
            f: 'json',
            noData: 0,
            geometryType: 'esriGeometryPolygon',
            geometry: JSON.stringify(geo),
            pixelSize: 30,
            renderingRule: JSON.stringify(remapRF)
          }
        });

        compHistRequest.then(res => {
          const totalCount = res.statistics[0].count;
          const counts = {};

          if (this.calculateButton.disabled) {
            this.calculateButton.innerHTML = this.nls.calculate;
            return;
          }
  
          res.histograms[0].counts.forEach((count, index) => {
            if (count > 0 && !counts.hasOwnProperty(index)) {
              counts[index] = this.calculatePercentages(totalCount, count);
            }
          });

          if (Object.keys(counts).length > 3) {
            domClass.add(this.tabNode2, 'overflow');
          } else {
            domClass.remove(this.tabNode2, 'overflow');
          }
  
          this._renderInputTable(this.resultsTableHeaderData, area);
          this._renderOutputTable(counts, area);
          this.calculateButton.innerHTML = this.nls.calculate;
          this.resultsLoaded = true;
          this.tabContainer.selectTab(this.tabNode2); //manually switch tabs when results are ready
        }, err => {
          this.calculateButton.innerHTML = this.nls.calculate;
          if (err.details && err.details[0] === 'The requested image exceeds the size limit.') {
            this.errorMessage.innerHTML = this.nls.sizeError;
          } else {
            this.errorMessage.innerHTML = this.nls.genericError;
          }
        })
      },

      calculatePercentages: function(totalCount, count) {
        return (count/totalCount * 100).toFixed(2)
      },

      _renderInputTable: function(results, area) {
        const inputTableHeaderCol1 = this.nls.inputTableHeaderCol1[this.unitDropdownSelection];
        const inputTableHeaderCol2 = this.nls.inputTableHeaderCol2[this.unitDropdownSelection];
        let inputTableBodyCol1 = '';
        let inputTableBodyCol2 = '';
        switch(this.unitDropdownSelection) {
          case 'district':
            inputTableBodyCol1 = `${results.STATE_ABBR} ${results.DISTRICTID}`;
            inputTableBodyCol2 = `${results.NAME} - ${results.PARTY}`;
            break;
          case 'county':
            inputTableBodyCol1 = results.NAME;
            inputTableBodyCol2 = results.STATE_NAME;
            break;
          case 'state':
            inputTableBodyCol1 = results.STATE_NAME;
            inputTableBodyCol2 = this.formatLargeNumber(results.POPULATION);
            break;
          case 'area':
          case 'point':
            inputTableBodyCol1 = this.nls.inputTableBodyCol1[this.unitDropdownSelection]
            inputTableBodyCol2 = this.unitDropdownSelection == 'area' ? this.formatLargeNumber(area) : `${this.formatLargeNumber(this.bufferRadius)} ${this._getMetricString(this.pointMetric)}`;
            break;
          case 'huc':
            inputTableBodyCol1 = results.HUC_8;
            inputTableBodyCol2 = results.HU_8_NAME;
          default:
            break;
        }

        this.inputTable.innerHTML =
        `
          <table id="gridded-map-input-table">
            <thead>
                <tr>
                    <th colspan="1">${inputTableHeaderCol1}</th>
                    <th colspan="1">${inputTableHeaderCol2}</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>${inputTableBodyCol1}</td>
                    <td>${inputTableBodyCol2}</td>
                </tr>
            </tbody>
          </table>
        `
      },

      _renderOutputTable: function(results, area) {
        let resultsHTML = '';

        for (let [key, value] of Object.entries(results)) {
          resultsHTML += `
            <tr class="index-results">
              <td class="output-table-cell attr">
                <p>${this.nls.nlcd[key]}</p>
                <div class="legend gradient-${key}"/>
              </td>
              <td class="output-table-cell val">
                <p>${value} %</p>
                <a href="https://www.mrlc.gov/data/legends/national-land-cover-database-2016-nlcd2016-legend" target="_blank">View Full Legend</a>
              </td>
            </tr>
          `
        };

        this.outputTable.innerHTML =
        `
          <table id="gridded-map-output-table">
            <thead>
                <tr>
                  <th colspan="1">${this.nls.attributeHeader}</th>
                  <th colspan="1">${this.nls.valueHeader}</th>
                </tr>
            </thead>
            <tbody>
              <tr>
                <td>${this.nls.areaOfSelectionHeader}:</td>
                <td>${this.formatLargeNumber(area)} ${this._getMetricString(this.pointMetric)}2</td>
              </tr>
              ${resultsHTML}
            </tbody>
          </table>
        `
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

        if (option !== 'point') {
          this.unitDetails.style.display = "none";
        }

        if (this.drawTool) {
          this._resetDrawTool();
        }

        switch(option) {
          case 'state':
          case 'county':
          case 'district':
          case 'huc':
            const url = this.nls[`${option}Layer`];
            this.geometryLayer = new FeatureLayer(url, {
              opacity: 0.5,
              id: `${option}Layer`
            });
            if (option === 'huc') {
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
          case 'point': {
            this.unitDetails.style.display = "flex";
            this._initDrawTool('point')
            break;
          }
          case 'area': {
            this._initDrawTool('area');
            break;
          }
          default:
            break;
        }

      },

      _initLayers: function(indicator) {
        switch (indicator) {
          case 'nlcd': {
            this.indicatorURL = this.nls[indicator].url;
            const params = new ImageServiceParameters();
            params.noData = 0;
            this.layer = new ArcGISImageServiceLayer(this.indicatorURL, {
              imageServiceParameters: params,
              opacity: 0.5,
              id: this.nls.nlcd.layer_id
            });
            this.map.addLayer(this.layer);
            break;
          }
          default:
            break;
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
          if (this.unitDropdownSelection == 'point') {
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
          }
        }
        
        this.drawTool.deactivate(); //deactivate the drawtool so user can interact with map correctly
      },

      _addGraphicToMap: function(symbol, geometry) {
        const graphic = new Graphic(geometry, symbol);
        if (this.drawLayer.graphics.length > 0) {
          this.drawLayer.clear(); //clear graphic if needs be, so only 1 on map at a time
        }
        this.drawLayer.add(graphic);

        if (this.layer) {
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
        }

        this.calculateButton.disabled = false;
        this.areaSelected = true;
      },

      _addBufferToMap: function() {
        this.bufferGeometry = GeometryEngine.buffer(this.geometry, this.bufferRadius, this.pointMetric, true);
        let bufferPoly = new SimpleFillSymbol();
        this._addGraphicToMap(bufferPoly, this.bufferGeometry);
      },

      _updatedBufferGraphic: function() {
        let bufferedGraphic = this.drawLayer.graphics.find(graphic => graphic.geometry.type === 'polygon');
        this.drawLayer.remove(bufferedGraphic);
        this._addBufferToMap();
      },

      _resetWidget: function() {
        if (this.layer) {
          this.map.removeLayer(this.layer);
        }
        if (this.geometryLayer) {
          this.map.removeLayer(this.geometryLayer);
        }
        if (this.drawLayer) {
          this._resetDrawTool();
          this.map.removeLayer(this.drawLayer);
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
        this.calculateButton.disabled = true;
        this.calculateButton.innerHTML = this.nls.calculate;
        this.unitDetails.style.display = "none";
        this.errorMessage.innerHTML = "";
        this.selectionText.innerHTML = "";
      },

      _resetVariables: function() {
        this.drawLayer = null;
        this.geometry = null;
        this.unitDropdownSelection = null;
        this.pointMetric = null;
        this.bufferRadius = null;
        this.indicatorURL = null;
        this.nlcdLegend = null;
        this.resultsLoaded = false;
        // Uncomment this when more than one indicator
        // this.indicatorDropdownSelection = null;
        this.drawTool = null;
        this.mapClickEvent = null;
        this.layer = null;
        this.geometryLayer = null;
        this.areaSelected = null;
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
