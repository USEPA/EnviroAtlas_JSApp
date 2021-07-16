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
  'dojo/_base/lang',
  'jimu/utils',
  'jimu/dijit/TabContainer',
  'esri/toolbars/draw',
  'esri/graphic',
  'esri/renderers/SimpleRenderer',
  'esri/renderers/ClassBreaksRenderer',
  'esri/symbols/SimpleFillSymbol',
  'esri/symbols/SimpleMarkerSymbol',
  'esri/symbols/SimpleLineSymbol',
  'esri/Color',
  'esri/layers/GraphicsLayer',
  'esri/tasks/QueryTask',
  'esri/tasks/query',
  'esri/geometry/geometryEngine',
  'esri/layers/FeatureLayer',
  'esri/tasks/Geoprocessor',
  'esri/layers/ImageParameters',
  'esri/geometry/Point',
  'esri/InfoTemplate'
],
  function (declare, BaseWidget, _WidgetsInTemplateMixin, _OnDijitClickMixin, Evented,
    on, lang, jimuUtils, TabContainer, Draw, Graphic, SimpleRenderer, ClassBreakRenderer, SimpleFillSymbol, SimpleMarkerSymbol, SimpleLineSymbol, Color, GraphicsLayer, QueryTask, Query, GeometryEngine, FeatureLayer, Geoprocessor, ImageParameters, Point, InfoTemplate) {
    return declare([BaseWidget, _WidgetsInTemplateMixin, _OnDijitClickMixin, Evented], {

      baseClass: 'widget-water-quality',
      declaredClass: 'WaterQuality',
      inputValues: {
        siteType: 'streams'
      },
      fromDate: null,
      toDate: null,
      waterToolAllLayer: null,
      timeoutTimer: null,
      bufferRadius: 5,

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
        this.tabContainer.controlNodes[1].classList.add('water-quality-tab-disabled');
        this.own(on(this.tabContainer, 'tabChanged', lang.hitch(this, function (title) {
          if (this.resultsLoaded) {
            this.tabContainer.selected = this.nls.resultsLabel;
            this.tabContainer.controlNodes[1].classList.add('jimu-state-selected');
            this.tabContainer.controlNodes[1].classList.remove('water-quality-tab-disabled');
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
        this.calculateButton.innerHTML = this.nls.calculate;
      },

      onOpen: function() {
        if (!this.drawLayer) {
          this.drawLayer = new GraphicsLayer({id: 'waterQualityDrawLayer'});
        }
        if (this.geometryLayer) {
          this.geometryLayer.setVisibility(true);
        }
        this.map.addLayer(this.drawLayer);
        this.widgetClosed = false;
      },

      _initDOMRefs: function() {
        this.unitDropdown = document.getElementById('water-quality-unit-input');
        this.sampleDropdown = document.getElementById('water-quality-sample-input');
        this.databaseDropdown = document.getElementById('water-quality-database-input');
        this.dateFromDropdown = document.getElementById('water-quality-dateFrom-input');
        this.dateToDropdown = document.getElementById('water-quality-dateTo-input');
        this.unitDetails = document.getElementById('water-quality-unit-details');
        this.calculateButton = document.getElementById('water-quality-calculate-button');
        this.selectionText = document.getElementById('water-quality-selection-name');
        this.bufferInput = document.getElementById('water-quality-buffer');
        this.resultMessage = document.getElementById('calculation-message');
        this.requestDetails = document.getElementById('request-details');
        this.resultsPage = document.getElementById('water-quality-results-page');
        this.waterToolLegend = document.getElementById('water-quality-legend-wrapper');
      },

      _initListeners: function() {
        document.getElementsByName('site').forEach(radio => {
            radio.addEventListener('change', e => {
              this.inputValues.siteType = e.target.value;
              return;
            })
        })

        document.addEventListener('change', e => {
          if (e.target.id === 'water-quality-buffer') {
            return;
          }

          if (e.target.id === 'water-quality-unit-input') {
            this._handleUnitSelection(e.target.value);
            this._validateForm();
            return;
          }

          if (e.target.id === 'water-quality-sample-input') {
            this._handleSampleSelection(e.target.value);
            this._validateForm();
            return;
          }

          if (e.target.id === 'water-quality-database-input') {
            this._handleDatabaseSelection(e.target.value);
            this._validateForm();
            return;
          }

          if (e.target.id === 'water-quality-dateTo-input') {
            this.toDate = new Date(e.target.value);
            const month = (`0${this.toDate.getMonth() + 1}`).slice(-2);
            const day = (`0${this.toDate.getDate()}`).slice(-2);
            const dateString = `${month}-${day}-${this.toDate.getFullYear()}`;
            this.inputValues.toDate = dateString;
            this._validateForm();
            return;
          }

          if (e.target.id === 'water-quality-dateFrom-input') {
            this.fromDate = new Date(e.target.value);
            const month = (`0${this.fromDate.getMonth() + 1}`).slice(-2);
            const day = (`0${this.fromDate.getDate()}`).slice(-2);
            const dateString = `${month}-${day}-${this.fromDate.getFullYear()}`;
            this.inputValues.fromDate = dateString;
            this._validateForm();
            return;
          }

          if (e.target.id === 'water-quality-checkbox-all') {
            this.waterToolAllLayer.setVisibility(e.target.checked);
          }

          if (e.target.id === 'water-quality-checkbox-median') {
            this.waterToolMedianLayer.setVisibility(e.target.checked);
          }

          if (e.target.id === 'water-quality-checkbox-quantile10') {
            this.waterToolQuantile10Layer.setVisibility(e.target.checked);
          }

          if (e.target.id === 'water-quality-checkbox-quantile90') {
            this.waterToolQuantile90Layer.setVisibility(e.target.checked);
          }
        })
        
        this.bufferInput.addEventListener('input', e => {
          this.bufferRadius = e.target.value;
          this.inputValues.miles = e.target.value;
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
          if (!this.inputValues.unitArea || this.widgetClosed) {
            return;
          }
          if (this.resultsLoaded) {
            this._clearSelection();
          }
          let url;
          let outfields;
          
          switch (this.inputValues.unitArea) {
            case 'state':
              url = this.nls.stateLayer;
              outfields = ['STATE_NAME', 'POPULATION', 'STATE_ABBR', 'STATE_FIPS'];
              break;
            case 'county':
              url = this.nls.countyLayer;
              outfields = ['STATE_NAME', 'NAME', 'CNTY_FIPS', 'STATE_FIPS'];
              break;
            case 'HUC8':
              url = this.nls.HUC8Layer;
              outfields = ['HUC8', 'NAME'];
              break;
            case 'HUC12':
              url = this.nls.HUC12Layer;
              outfields = ['HUC_12', 'HU_12_NAME'];
              break;
            default:
              break;
          }
  
          //re-activate the draw tool if needs be
          if (this.drawTool && this.drawLayer.graphics.length > 0) {
            if (!this.pointReSelected) {
              this.drawTool.activate(Draw['POINT']);
              this.pointReSelected = true; //have to set a flag to handle map-click firing twice
            }
          }
  
          // manually switch back to the 'selection' tab if we're in the results tab
          if (this.tabContainer.selected === this.nls.resultsLabel && !e.graphic) {
            this.tabContainer.selectTab(this.tabNode1);
            this.tabContainer.controlNodes[0].classList.add('jimu-state-selected')
            this.tabContainer.controlNodes[1].classList.remove('jimu-state-selected')
          }

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
                const { STATE_NAME, NAME, CNTY_FIPS, HUC8, HUC_12, HU_12_NAME } = res.features[0].attributes;
                const STATE_ABBRV = this.nls.stateHash[STATE_NAME];
                switch (this.inputValues.unitArea) {
                  case 'state':
                    this.selectionText.innerHTML = STATE_NAME;
                    this.inputValues.stateSelection = STATE_ABBRV;
                    break;
                  case 'county':
                    this.selectionText.innerHTML = `${NAME} County, ${STATE_NAME}`;
                    this.inputValues.countySelection = CNTY_FIPS;
                    this.inputValues.stateSelection = STATE_ABBRV;
                    break;
                  case 'HUC8':
                    this.selectionText.innerHTML = `${HUC8} (${NAME})`
                    this.inputValues.HUCnumber = HUC8;
                    break;
                  case 'HUC12':
                    this.selectionText.innerHTML = `${HUC_12} (${HU_12_NAME})`
                    this.inputValues.HUCnumber = HUC_12;
                    break;
                  default:
                    break;
                }
              }
            });
          } else {
            this.selectedPoint = new Point(e.mapPoint)
          }
        });
      },

      _validateForm: function() {
        if (Object.keys(this.inputValues).length === 8 && this.geometry) {
          this.calculateButton.disabled = false;
        }
      },

      _clearSelection: function() {
        if (this.drawLayer.graphics.length > 0) {
          this.drawLayer.clear();
        }

        if (this.inputValues.unitArea == 'point') {
          this.bufferInput.value = 5
          this.bufferRadius = 5;
        }

        if (this.drawTool && this.unit == 'point') {
          this.drawTool.activate(Draw['POINT']);
        }

        this.selectedPoint = null;

        this.calculateButton.disabled = true;
        this.calculateButton.innerHTML = this.nls.calculate;
        this.resultMessage.innerHTML = "";
        if (this.inputValues.unitArea.includes('HUC') && !this.geometryLayer.isVisibleAtScale(this.map.getScale())) {
          this.selectionText.innerHTML = this.nls.hucServiceMsg;
        } else {
          this.selectionText.innerHTML = "";
        }
        this.tabContainer.controlNodes[1].classList.add('water-quality-tab-disabled');
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

      _generateWQLinks: function() {
        const { 
          unitArea,
          stateSelection, 
          countySelection, 
          miles, 
          latitude, 
          longitude, 
          HUCnumber,
          siteType,
          samplingVariable,
          database,
          fromDate,
          toDate
        } = this.inputValues;
        let url = 'https://www.waterqualitydata.us/portal/#countrycode=US';

        switch (unitArea) {
          case 'state':
            url += '&statecode=US%3A' + this.nls.stateCodeHash[stateSelection];
            break;
          case 'county':
            url += '&statecode=US%3A' + this.nls.stateCodeHash[stateSelection] + "&countycode=US%3A" + this.nls.stateCodeHash[stateSelection] + "%3A" + countySelection
            break;
          case 'point':
            url += '&within=' + miles + '&lat=' + latitude + '&long=' + longitude
            break;
          case 'HUC12':
          case 'HUC8':
            url += '&huc=' + HUCnumber
            break;
          default:
            break;
        }

        switch (siteType) {
          case 'streams':
            url += '&siteType=Stream'
            break;
          case 'lakes':
            url += '&siteType=Lake%2C%20Reservoir%2C%20Impoundment'
            break;
          case 'groundwater':
            url += '&siteType=Aggregate%20groundwater%20use&siteType=Aggregate%20groundwater%20use%20&siteType=Spring&siteType=Subsurface'
            break;
          default:
            break;
        }
        
        switch (database) {
          case 'NWIS/NARS/EMAP':
            url += '&providers=BIODATA&providers=NWIS&providers=STEWARDS'
            break;
          case 'State':
            url += '&providers=STORET'
            break;
          case 'Both':
            url += '&providers=BIODATA&providers=NWIS&providers=STEWARDS&providers=STORET'
            break;
          default:
            break;
        }

        const nutrientList = ['Dissolved Phosphorus', 'Total Phosphorus', 'Dissolved Nitrogen', 'Total Nitrogen', 'Nitrate', 'Nitrite', 'Nitrate + Nitrite'];
        const physicalList = ['Conductivity', 'Discharge', 'pH', 'Sediment (tss)'];
        const inorganicMetalsList = ['Dissolved Lead', 'Total Lead', 'Dissolved Mercury', 'Total Mercury'];
        const organicMetalsList = ['Dissolved Arsenic', 'Total Arsenic'];

        if (nutrientList.includes(samplingVariable)) {
          url += '&sampleMedia=water&sampleMedia=Water&characteristicType=Nutrient'
        } else if (physicalList.includes(samplingVariable)) {
          url += '&sampleMedia=water&sampleMedia=Water&characteristicType=Physical'
        } else if (inorganicMetalsList.includes(samplingVariable)) {
          url += '&sampleMedia=water&sampleMedia=Water&characteristicType=Inorganics%2C%20Major%2C%20Metals&characteristicType=Inorganics%2C%20Minor%2C%20Metals'
        } else if (organicMetalsList.includes(samplingVariable)) {
          url += '&sampleMedia=water&sampleMedia=Water&characteristicType=Inorganics%2C%20Major%2C%20Non-metals&characteristicType=Inorganics%2C%20Minor%2C%20Non-metals'
        } else if (samplingVariable === 'Ecoli') {
          url += '&sampleMedia=water&sampleMedia=Water&characteristicType=Microbiological'
        }

        url += '&startDateLo=' + fromDate
        url += '&startDateHi=' + toDate

        return url;
      },

      _calculateResults: function() {
        this.resultsLoaded = false;
        let image = '<img src="./configs/loading/images/predefined_loading_1.gif"/>';
        this.calculateButton.innerHTML = image;
        this.resultMessage.innerHTML = "Calculating results. This may take several minutes. You can do other things in EnviroAtlas while this is running.";

        const gpService = new Geoprocessor(this.nls.gpService);

        if (this.inputValues.unitArea === 'point') {
          this.inputValues.latitude = this.selectedPoint.getLatitude();
          this.inputValues.longitude = this.selectedPoint.getLongitude();
        }

        this.timeoutTimer = new Date();

        if (this.requestDetails.style.display = "none") {
          const url = this._generateWQLinks();
          this.requestDetails.style.display = "flex";
          this.requestDetails.innerHTML = `
            <a href=${url} target="_blank">Open query in the Water Quality Portal</a>
          `;
        }

        gpService.submitJob(this.inputValues, async (jobInfo) => {
          // COMPLETION CALLBACK
          this.timeoutTimer = null;
          if (jobInfo.jobStatus === 'esriJobFailed') {
            const noDataMessage = jobInfo.hasOwnProperty('messages') && jobInfo.messages.filter(message => message.type == "esriJobMessageTypeError").find(message => message.description.includes('ERROR: '));
            this.calculateButton.innerHTML = this.nls.calculate;
            this.resultMessage.innerHTML = noDataMessage ? noDataMessage.description : this.nls.processingError;
          } else {
            this.waterToolLegend.innerHTML = "";
  
            await new Promise((resolve, reject) => {
              gpService.getResultData(jobInfo.jobId, "all", data => {
                if (this.waterToolAllLayer) {
                  this.map.removeLayer(this.waterToolAllLayer);
                }
                const sites = new Set(data.value.features.map(feature => feature.attributes.MonitoringLocationIdentifier))
                const siteCount = sites.size;
                this.waterToolAllLayer = this.generateGraphicsLayer(data, `${this.inputValues.samplingVariable} - ${this.fromDate.toDateString()} to ${this.toDate.toDateString()}`, "all");
                this.resultsString = `Your query returned ${data.value.features.length} results from ${siteCount} sites.`;
                this.map.addLayer(this.waterToolAllLayer);
                resolve()
              });
            })

            await new Promise((resolve, reject) => {
              gpService.getResultData(jobInfo.jobId, "median", data => {
                if (this.waterToolMedianLayer) {
                  this.map.removeLayer(this.waterToolMedianLayer);
                }              
                this.waterToolMedianLayer = this.generateGraphicsLayer(data, `${this.inputValues.samplingVariable} - median`, "median");
                this.waterToolMedianLayer.setVisibility(false);
                this.map.addLayer(this.waterToolMedianLayer);
                resolve();
              });
            });

            await new Promise((resolve, reject) => {
              gpService.getResultData(jobInfo.jobId, "quantile10", data => {
                if (this.waterToolQuantile10Layer) {
                  this.map.removeLayer(this.waterToolQuantile10Layer);
                }              
                this.waterToolQuantile10Layer = this.generateGraphicsLayer(data, `${this.inputValues.samplingVariable} - 10th percentile`, "quantile10");
                this.waterToolQuantile10Layer.setVisibility(false);
                this.map.addLayer(this.waterToolQuantile10Layer);
                resolve();
              });
            });

            await new Promise((resolve, reject) => {
              gpService.getResultData(jobInfo.jobId, "quantile90", data => {
                if (this.waterToolQuantile90Layer) {
                  this.map.removeLayer(this.waterToolQuantile90Layer);
                }              
                this.waterToolQuantile90Layer= this.generateGraphicsLayer(data, `${this.inputValues.samplingVariable} - 90th percentile`, "quantile90");
                this.waterToolQuantile90Layer.setVisibility(false);
                this.map.addLayer(this.waterToolQuantile90Layer);
                resolve();
              });
            });

            if (this.waterToolAllLayer) {
              this.waterToolAllLayer.setVisibility(true);
            }
            
            this.calculateButton.innerHTML = this.nls.calculate;
            this._renderResultsTab(this.resultsString);
            this.resultsLoaded = true;
            this.tabContainer.selectTab(this.tabNode2);
          }
        }, (jobInfo) => {
          // STATUS UPDATE CALLBACK
          const currentTime = new Date();
          const timeDifference = currentTime - this.timeoutTimer;
          if (timeDifference >= (10 * 60000)) { // Timeout after 10 minutes
            gpService.cancelJob(jobInfo.jobId, function (jobInfo) {
              this.resultMessage.innerHTML = "Request timed-out, please try again."
              this.calculateButton.innerHTML = this.nls.calculate;
            }, (jobInfo) => {
              this.calculateButton.innerHTML = this.nls.calculate;
              this.resultMessage.innerHTML = "Request timed-out, please try again."
            });
          }
        }, (jobInfo) => {
          const noDataMessage = jobInfo.hasOwnProperty('messages') && jobInfo.messages.filter(message => message.type == "esriJobMessageTypeError").find(message => message.description.includes('ERROR: '));
          this.calculateButton.innerHTML = this.nls.calculate;
          this.resultMessage.innerHTML = noDataMessage ? noDataMessage.description : this.nls.processingError;
        })
      },

      generateGraphicsLayer: function(data, legendString, layerType) {
        const layer = new GraphicsLayer({ visible: false, id: `water-quality-${layerType}` });
        const infoTemplate = new InfoTemplate();
        infoTemplate.setTitle(legendString)
        infoTemplate.setContent(
          "<strong>Organization Name</strong>: ${OrganizationFormalName}" +
          "<br><strong>Site Location</strong>: ${MonitoringLocationName}" +
          "<br><strong>Site Type</strong>: ${MonitoringLocationTypeName}" +
          "<br><strong>Sample</strong>: ${CharacteristicQAQC}" +
          "<br><strong>Date</strong>: ${ActivityStartDate:DateFormat}" +
          "<br><strong>Result</strong>: ${Result:NumberFormat(places:2)}" +
          "<br><strong>Sample Fraction QCQC</strong>: ${SampleFractionQAQC}" +
          "<br><strong>Units QCQC</strong>: ${UnitsQAQC}"
        )
        layer.setInfoTemplate(infoTemplate);
        const serie = new geostats(data.value.features.map(feature => Number(Number(feature.attributes.Result).toFixed(2))));
        serie.setColors(this.nls.classBreakColorsRGB);
        const breaks = serie.getClassJenks(5);

        const legend = serie.getHtmlLegend(this.nls.classBreakColorsHex, legendString);
        this._configureWQLegend(legend, layerType)

        data.value.features.forEach(feature => {
            const symbol = this.getClassBreakSymbol(feature.attributes.Result, breaks);
            symbol.setSize(8);
            feature.setSymbol(symbol);
            layer.add(feature);
        })
        return layer;
      },

      getClassBreakSymbol: function(value, breaks) {
        let colors = this.nls.classBreakColorsRGB;
        let color;

        if (value >= breaks[0] && value <= breaks[1]) {
          color = colors[0]
        } else if (value > breaks[1] && value <= breaks[2]) {
          color = colors[1]
        } else if (value > breaks[2] && value <= breaks[3]) {
          color = colors[2]
        } else if (value > breaks[3] && value <= breaks[4]) {
          color = colors[3]
        } else if (value > breaks[4] && value <= breaks[5]) {
          color = colors[4]
        } else {
          color = [0,0,0,0]
        }

        return new SimpleMarkerSymbol().setStyle(
          SimpleMarkerSymbol.STYLE_CIRCLE).setColor(
          new Color(color));
      },

      calculatePercentages: function(totalCount, count) {
        return (count/totalCount * 100).toFixed(2)
      },

      _configureWQLegend: function(legend, layerType) {
        const layerSection = `
          <div id="water-quality-legend">
            <input type="checkbox" id="water-quality-checkbox-${layerType}" name="water-quality-checkbox" value="water-quality-checkbox" ${layerType === 'all' ? 'checked' : ''}>
            ${legend}
          </div>
        `
        this.waterToolLegend.innerHTML = this.waterToolLegend.innerHTML + layerSection;
      },

      _renderResultsTab: function(resultsMessage) {
        document.getElementById("resultsText").innerHTML = resultsMessage;
        const fromDate = this.fromDate.getTime() / 1000;
        const toDate = this.toDate.getTime() / 1000;
        $('#date-slider').slider({
          range: false,
          min: fromDate,
          max: toDate,
          step: 86400,
          value: fromDate,
          slide: (event, ui ) => {
            const selectedDate = new Date(ui.value *1000);
            $("#amount").val((selectedDate.toDateString()));
            if (this.waterToolAllLayer) {
              this.waterToolAllLayer.graphics.forEach(graphic => {
                const graphicDate = new Date(graphic.attributes.ActivityStartDate);
                const datePlusOne = new Date(selectedDate)
                datePlusOne.setDate(selectedDate.getDate() + 1);
                if (graphicDate >= selectedDate && graphicDate <= datePlusOne) {
                  graphic.show();
                } else {
                  graphic.hide();
                }
              })
            }
          }
        });
        $("#amount").val(`${this.fromDate.toDateString()}`);
      },

      _handleUnitSelection: function(option) {
        this.inputValues.unitArea = option;

        if (this.unitDetails.style.display = 'flex') {
          this.unitDetails.style.display = "none";
        }
        //deactivate the draw tool if needs be, so user can interact properly with the map
        if (this.drawTool) {
          this.drawTool.deactivate();
        }

        this.selectionText.innerHTML = "";
        this.resultMessage.innerHTML = "";
        this.geometry = null;
        this.drawLayer.clear();
        this.calculateButton.disabled = true;

        if (this.geometryLayer) {
          this.map.removeLayer(this.geometryLayer);
        }

        if (option !== 'point') {
          this.unitDetails.style.display = "none";
        }

        switch(option) {
          case 'state':
          case 'county':
          case 'huc-8':
          case 'huc-12':
            let url;
            if (option === 'huc-8' || option === 'huc-12') {
              url = this.nls.hucLayer;
            } else {
              url = this.nls[`${option}Layer`];
            }
            this.geometryLayer = new FeatureLayer(url, {
              opacity: 0.5,
              id: `${option}Layer`
            });
            if (option === 'huc-8' || option === 'huc-12') {
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
          default:
            break;
        }

      },

      _handleSampleSelection: function(option) {
        this.inputValues.samplingVariable = option;

        this.selectionText.innerHTML = "";
        this.resultMessage.innerHTML = "";

        this.calculateButton.disabled = true;
      },

      _handleDatabaseSelection: function(option) {
        this.inputValues.database = option;

        this.selectionText.innerHTML = "";
        this.resultMessage.innerHTML = "";

        this.calculateButton.disabled = true;
      },

      _initDrawTool: function(type) {
        this.drawTool = new Draw(this.map);
        this.symbol = new SimpleMarkerSymbol();
        this.symbol.setSize(22);
        this.symbol.setStyle(SimpleMarkerSymbol.STYLE_CROSS);
        this.drawTool.activate(Draw['POINT']);

        this.drawTool.on("draw-complete", e => {
          this._handleDrawComplete(e);
          this.pointReSelected = false;
        });
      },

      _handleDrawComplete: function(e) {
        this.geometry = e.geometry;

        if (this.drawLayer) {
          if (this.inputValues.unitArea == 'point') {
            this._addBufferToMap();
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

        const extent = geometry.getExtent();
        this.map.setExtent(extent, true)

        this.calculateButton.disabled = false;
        this.areaSelected = true;
      },

      _addBufferToMap: function() {
        this.bufferGeometry = GeometryEngine.buffer(this.geometry, this.bufferRadius, 'miles', true);
        let bufferPoly = new SimpleFillSymbol();
        this._addGraphicToMap(bufferPoly, this.bufferGeometry);
      },

      _updatedBufferGraphic: function() {
        let bufferedGraphic = this.drawLayer.graphics.find(graphic => graphic.geometry.type === 'polygon');
        this.drawLayer.remove(bufferedGraphic);
        this._addBufferToMap();
      },

      _resetWidget: function() {
        if (this.geometryLayer) {
          this.map.removeLayer(this.geometryLayer);
        }
        if (this.drawLayer) {
          this._resetDrawTool();
          this.map.removeLayer(this.drawLayer);
        }
        this._resetVariables();
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
        this.sampleDropdown.value = "";
        this.databaseDropdown.value = "";
        this.dateFromDropdown.value = "";
        this.dateToDropdown.value = "";
        this.calculateButton.disabled = true;
        this.calculateButton.innerHTML = this.nls.calculate;
        this.unitDetails.style.display = "none";
        this.resultMessage.innerHTML = "";
        this.selectionText.innerHTML = "";
      },

      _resetVariables: function() {
        this.drawLayer = null;
        this.geometry = null;
        this.inputValues = {};
        this.bufferRadius = null;
        this.indicatorURL = null;
        this.nlcdLegend = null;
        this.resultsLoaded = false;
        this.drawTool = null;
        this.mapClickEvent = null;
        this.geometryLayer = null;
        this.areaSelected = null;
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
