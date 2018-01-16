///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 Esri. All Rights Reserved.
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
        'dijit/_WidgetsInTemplateMixin',
        "dojo/Deferred",
        'dojo/_base/html',
        'jimu/BaseWidget',
        'dijit/Dialog',
        'jimu/WidgetManager',
        'jimu/PanelManager',
        'jimu/utils',
        'esri/dijit/Legend', 
        'esri/dijit/TimeSlider', 
        'esri/TimeExtent',
		'esri/layers/ArcGISImageServiceLayer', 		
  		'esri/layers/ImageServiceParameters', 
  		'esri/tasks/ImageServiceIdentifyParameters',  
  		'esri/layers/RasterFunction', 
  		'esri/tasks/ImageServiceIdentifyTask', 
  		'esri/tasks/ImageServiceIdentifyResult', 
  		'esri/dijit/Popup', 
  		'esri/symbols/SimpleFillSymbol', 
  		'esri/symbols/SimpleLineSymbol', 
  		'esri/Color',
  		'dojo/_base/array', 
  		'dojo/parser', 
  		'dijit/registry',        
        'esri/dijit/PopupTemplate',
        'esri/geometry/Extent',
        'dijit/layout/ContentPane',
        'dijit/TooltipDialog',
        'esri/InfoTemplate',
        'dojo/store/Memory',
        'dijit/form/FilteringSelect',
        'dijit/form/TextBox',
        'dijit/form/Button',
        'dojo/dom-construct'
    ],
    function (
        declare,
        _WidgetsInTemplateMixin,
        Deferred,
        html,
        BaseWidget,
        Dialog,
        WidgetManager,
        PanelManager,
        jimuUtils,
        Legend, 
        TimeSlider, 
        TimeExtent,
		ArcGISImageServiceLayer,
  		ImageServiceParameters, 
  		ImageServiceIdentifyParameters, 
  		RasterFunction,
  		ImageServiceIdentifyTask, 
  		ImageServiceIdentifyResult, 
  		Popup, 
  		SimpleFillSymbol, 
  		SimpleLineSymbol, 
  		Color,
  		arrayUtils, 
  		parser, 
  		registry,        
        PopupTemplate,
        Extent,
        ContentPane,
        TooltipDialog,
        InfoTemplate,
        Memory,
        FilteringSelect,
        TextBox,
        Button,
        domConstruct) {

    var arrLayers = null;
    var map = null;
    var map, identifyTask, identifyParams;
    var mapClickListener, pixelVal;

    var loading;
    var serverURL = "https://enviroatlas2.epa.gov";
    var futureScenariosAGSbaseURL = serverURL + "/arcgis/rest/services/FutureScenarios/";
    var comment = "Climate scenarios provide likely approximations of future conditions given a set of initial assumptions and model results. The future is inherently uncertain with no guarantee that these scenarios reflect what will occur at the specified future time.";
    var timeSlider, userChosenTimeStep;
    var navToolbar;
    var selfTimeSeries;

    var widthSelect = "310px";

    var updateSelectablePBSLayersArea = function () {

        if (navigator.userAgent.indexOf("Chrome") >= 0) {
            document.getElementById('tablePBSLayersArea').style.height = "calc(100% - 140px)";
        } else if (navigator.userAgent.indexOf("Firefox") >= 0) {
            document.getElementById('tablePBSLayersArea').style.height = "calc(100% - 140px)";
        } else {
            document.getElementById('tablePBSLayersArea').style.height = "calc(100% - 140px)";
        }
    };

    var climateModelsStore = new Memory({
    idProperty: "climateModelsMem",
    data: [
        {id:"Scenario I", name:"RCP2.6", value:"RCP2.6"},
        {id:"Scenario II", name:"RCP4.5", value:"RCP4.5"},
        {id:"Scenario III", name:"RCP6.0", value:"RCP6.0"},
        {id:"Scenario IV", name:"RCP8.5", value:"RCP8.5"},
        {id:"Historic Data", name:"Hist", value:"Hist"}
        
        ]
    });
    var climateVarStore = new Memory({
    idProperty: "climateMem",
    data: [
        {id:"Precipitation", name:"Precip", value:"Precip"},
        {id:"Max. Temperature", name:"TempMax", value:"TempMax"}, //comma is removed because of shut off of services
        {id:"Min. Temperature", name:"TempMin", value:"TempMin"},//This is commented out because of shut off of services
        {id:"Evapotranspiration", name:"PET", value:"PET"}  //This is commented out because of shut off of services
        //{id:"Evapotranspiration (NA)", name:"Evap", value:"Evap"}
        ]
    });

    var seasonStore = new Memory({
    idProperty: "seasonMem",
    data: [
        //{id:"Autumn", name:"Autumn", value:"Autumn"},
        {id:"Spring", name:"Spring", value:"Spring"},
        {id:"Summer", name:"Summer", value:"Summer"},
        {id:"Fall", name:"Fall", value:"Fall"},
        {id:"Winter", name:"Winter", value:"Winter"},
        {id:"Annual", name:"Annual", value:"Annual"}
        ]
    });   
    var clickFrameYear = function(){
        console.log("frmeYearinput is clicked!");
        if(dojo.byId("frameYearInput").value=='Or, select specific year to display'){
            dojo.byId("frameYearInput").value=''; 
            dojo.byId("frameYearInput").style.color='#000';
            }
    };
    var blurFrameYear = function(){
        if(dojo.byId("frameYearInput").value==''){
           dojo.byId("frameYearInput"). value='Or, select specific year to display'; 
           dojo.byId("frameYearInput").style.color='#555';
        }
    };     
    var mapLoading = function () {
        //esri.show(loading);
        
        if (timeSlider)
        {
            //layer is loading, set rate temoporarily very high (20 sec), pausing the slider
            timeSlider.setThumbMovingRate(20000);
        }
    };

    var mapFinishedLoading = function(evt) {
        map.showZoomSlider();
        if (timeSlider)
        {
            timeSlider.setThumbMovingRate(600); 
        }
    };
    var makeSliderAndLegendOneFrame = function(evt) {
        if (dojo.byId("frameOrSlide").innerHTML == 'slide') {
            return '';
        }
        
        //If this isn't the first layer the user has selected, destroy the old time slider and make a new one
        if (dijit.byId('timeSliderDijOneFrame')) {
            dijit.byId('timeSliderDijOneFrame').destroy();

        }
        if (dijit.byId('timeSliderDij')) {
            dijit.byId('timeSliderDij').destroy();

        }
                
        //reset the time slider div after destroying the actual timeslider
        var tsDiv = domConstruct.create("div", null, dojo.byId("timeSliderDivOneFrame"));        
        timeSlider = new TimeSlider({
          style: "width:100%;",
          id: "timeSliderDijOneFrame"
        }, tsDiv);
       
 		/*selfTimeSeries.frameNode = html.create('div', {}, selfTimeSeries.frameNodeContainer);
        timeSlider = new TimeSlider({
          style: "width:100%;",
          id: "timeSliderDijOneFrame"
        }, selfTimeSeries.frameNode);*/
               
        map.setTimeSlider(timeSlider);
        
        var timeExtent = new TimeExtent();
        timeExtent.startTime = new Date("1/1/" +  (dojo.byId("frameYearInput").value - 1));

        timeExtent.endTime = new Date("1/1/" +  (dojo.byId("frameYearInput").value + 1));
        userChosenTimeStep = 5;

        timeSlider.createTimeStopsByTimeInterval(timeExtent, 1, 'esriTimeUnitsYears');
        timeSlider.setTickCount(0);
        //timeSlider.setThumbMovingRate(20000);
       // timeSlider.singleThumbAsTimeInstant(true);
        timeSlider.startup();
        timeSlider.next();

        dojo.byId("titleAndSlider").style.visibility="hidden";
        dojo.byId("subTitleOneFrame").innerHTML = "Timeline: Year " + String(dojo.byId("frameYearInput").value);
        dojo.byId('titleAndSliderOneFrame').style.display = '';
        dojo.byId("titleAndSliderOneFrame").style.visibility="visible";
        dojo.byId('timeSliderWin').style.display = 'none';     
        //esri.hide(loading);   
        
        //add timeslider labels for years that end in 0
        var labels = arrayUtils.map(timeSlider.timeStops, function(timeStop, i) { 
            if (timeStop.getUTCFullYear() % 10 === 0 ) {
              return timeStop.getUTCFullYear(); 
            } else {
              return "";
            }
        }); 
        timeSlider.setLabels(labels);
        
        dojo.byId("details").innerHTML = '2006'; //hardcoded start year date
        
        timeSlider.on("time-extent-change", function(evt2) {
            var currYear = evt2.startTime.getUTCFullYear();
            dojo.byId("details").innerHTML = currYear;
        });
        

    };
    var makeSliderAndLegend = function(evt) {
        if (dojo.byId("frameOrSlide").innerHTML == 'frame') {
            return '';
        }
        //If this isn't the first layer the user has selected, destroy the old time slider and make a new one
        if (dijit.byId('timeSliderDijOneFrame')) {
            dijit.byId('timeSliderDijOneFrame').destroy();

        }        
        if (dijit.byId('timeSliderDij')) {
            dijit.byId('timeSliderDij').destroy();
        }
        
        //reset the time slider div after destroying the actual timeslider
        
                 


        var tsDiv = domConstruct.create("div", null, dojo.byId("timeSliderDiv"));
        
        timeSlider = new TimeSlider({
          style: "width:100%;",
          id: "timeSliderDij"
        }, tsDiv);
		/*selfTimeSeries.sliderNode = html.create('div', {}, selfTimeSeries.sliderNodeContainer);
        timeSlider = new TimeSlider({
          style: "width:100%;",
          id: "timeSliderDij"
        }, selfTimeSeries.sliderNode);*/
        
        map.setTimeSlider(timeSlider);
        
        var timeExtent = new TimeExtent();
        timeSlider.setThumbCount(1);
        timeExtent = evt.layers[0].layer.timeInfo.timeExtent;

        userChosenTimeStep = 5;
        var timeStepIntervals = [];
        var images = new Array();
        var model = dijit.byId("modelSelection").item.value.replace(".", "" );
        var season = dijit.byId("seasonSelection").item.value;
        var climateVar = dijit.byId("climateSelection").item.value;
        var imageCacheIndex = 0;
        var dictBBox = {};
        var dictSize = {};
        dictBBox['RCP26SpringPrecip'] = "-18252982.982271608%2C1177727.8283327678%2C-6972100.599835155%2C6793709.170499745";
        dictSize['RCP26SpringPrecip'] = "1153%2C574";
        for(i = timeExtent.startTime.getUTCFullYear(); i <= timeExtent.endTime.getUTCFullYear(); i++ )  { 
            if (i % userChosenTimeStep === 0 ) {
                if (i < timeExtent.endTime.getUTCFullYear()) {
                    timeStepIntervals.push(new Date("01/01/" + i));
                    var frameDate= new Date("01/01/" + i);
                    if( dictBBox[model + season + climateVar] !== undefined ) {
                        images[imageCacheIndex] = new Image();
                        images[imageCacheIndex].src = serverURL + "/arcgis/rest/services/FutureScenarios/" + model + season + climateVar + "/ImageServer/exportImage?f=image&time=" + frameDate.getTime() + "%2C" + frameDate.getTime() + "&bbox=" + dictBBox[model + season + climateVar] + "&imageSR=102100&bboxSR=102100&size=" + dictSize[model + season + climateVar];
                        imageCacheIndex = imageCacheIndex + 1;                        
                    } 
                }
            }  
            else if (i == timeExtent.endTime.getUTCFullYear()){
                timeStepIntervals.push(new Date("01/01/" + timeExtent.endTime.getUTCFullYear()));
                var finalDate= new Date("01/01/" + timeExtent.endTime.getUTCFullYear());
                if( dictBBox[model + season + climateVar] !== undefined ) {
                    images[imageCacheIndex] = new Image();
                    images[imageCacheIndex].src = serverURL + "/arcgis/rest/services/FutureScenarios/" + model + season + climateVar + "/ImageServer/exportImage?f=image&time=" + finalDate.getTime() + "%2C" + finalDate.getTime() + "&bbox=" + dictBBox[model + season + climateVar] + "&imageSR=102100&bboxSR=102100&size=" + dictSize[model + season + climateVar];
                }
            }           
        }; 

        timeSlider.setTimeStops(timeStepIntervals);

        timeSlider.setThumbMovingRate(20000);
        timeSlider.singleThumbAsTimeInstant(true);
        timeSlider.startup();
        dojo.byId('timeSliderWin').style.display = '';
        dojo.byId("titleAndSlider").style.visibility="visible";
        dojo.byId('timeSliderDivOneFrame').style.display = 'none';
        dojo.byId("titleAndSliderOneFrame").style.display="none";
        //esri.hide(loading);
        
        //add timeslider labels for years that end in 0
        var labels = arrayUtils.map(timeSlider.timeStops, function(timeStop, i) { 
            if (timeStop.getUTCFullYear() % 10 === 0 ) {
                if (timeStop.getUTCFullYear() < timeExtent.endTime.getUTCFullYear()) {
                    return timeStop.getUTCFullYear(); 
                }
            } else if (timeStop.getUTCFullYear() == timeExtent.endTime.getUTCFullYear() ){
                return timeStop.getUTCFullYear();
            }
            else {
                return "";
            }            
        }); 
        timeSlider.setLabels(labels);        
        dojo.byId("details").innerHTML = '2006'; //hardcoded start year date
        
        timeSlider.on("time-extent-change", function(evt2) {
            var currYear = evt2.startTime.getUTCFullYear();
            dojo.byId("details").innerHTML = currYear;
        });

    };
    var defineOneFrameService = function() {
        //esri.show(loading);        

        if (dijit.byId("seasonSelection").item != null && dijit.byId("climateSelection").item != null) {
            var startHist = 1950;
            var endHist = 2005;
            var startFuture = 2006;
            var endFuture = 2099;
            if (dijit.byId("modelSelection").item.value == "Hist") {
                dojo.byId("subTitle").innerHTML = "Timeline: Years (1950-2005)";
                dojo.byId("subTitleOneFrame").innerHTML = "Timeline: Years (1950-2005)";
                errorMessageYearInput = "Please input a year of single frame (" + String(startHist) + "-" + String(endHist) + ")";
            }
            else {
                dojo.byId("subTitle").innerHTML = "Timeline: Years (2006-2099)";
                dojo.byId("subTitleOneFrame").innerHTML = "Timeline: Years (2006-2099)";
                errorMessageYearInput = "Please input a year of single frame (" + String(startFuture) + "-" + String(endFuture) + ")";
            }
            
            var yearInput = dijit.byId("frameYearInput").value;

            if ((isNaN(yearInput))){
                alert(errorMessageYearInput);
                return;
            }
            else {
                numYearInput = parseFloat(yearInput);
                if (dijit.byId("modelSelection").item.value == "Hist") {
                    if ((numYearInput < startHist ) || (numYearInput > endHist )) {
                        alert(errorMessageYearInput);
                        return;
                    }                    
                }
                else {
                    if ((numYearInput < startFuture ) || (numYearInput > endFuture )) {
                        alert(errorMessageYearInput);
                        return;
                    }                       
                }
            }
            var model = dijit.byId("modelSelection").item.value.replace(".", "" );
            var season = dijit.byId("seasonSelection").item.value;
            var climateVar = dijit.byId("climateSelection").item.value;
            dojo.byId("frameOrSlide").innerHTML = 'frame';
            console.log("model+ season + climateVar:" + model+ season + climateVar);
            addOneFrameServiceToMap(model+ season + climateVar);
            //changeLegendImg();
            console.log("model+ season + climateVar:" + model+ season + climateVar);

        }
        else {
            alert("Choose options for Metric and Season!");
        }            

    };
    var addOneFrameServiceToMap = function(serviceParams) {
        removeFrameFromMap();
        
        //build the REST endpoint URL for the user-selected dropdown selections
        var selectedImageService = futureScenariosAGSbaseURL + serviceParams + "/ImageServer";
        console.log("Selected ImageService URL: " + selectedImageService);
        
        var params = new ImageServiceParameters();

        var imageServiceLayer = new ArcGISImageServiceLayer(selectedImageService,{imageServiceParameters: params});
        imageServiceLayer.id = "ScenarioDataLayer";
        imageServiceLayer.setOpacity(0.6);

        
        map.addLayers([imageServiceLayer]);
        
        //Turn on Identify capability after the layer is added to the map
        mapClickListener = map.on("click", executeIdentifyTask);
        
        imageServiceLayer.on("load", function(){
            var modelId = dijit.byId("modelSelection").item.id;
            var modelValue = dijit.byId("modelSelection").item.value;
	        var season = dijit.byId("seasonSelection").item.value;
	        var climateId = dijit.byId("climateSelection").item.id;
	        var climateVar = dijit.byId("climateSelection").item.value;
	        var unit = "";
            if ((climateVar == "TempMax") ||(climateVar == "TempMin")) {
            	unit = "Degrees F";                
            } else if ((climateVar == "Precip") ||(climateVar == "PET")) {
            	unit = "Inches";                
            } 	        
	        setMetadataTab(modelId + " (" + modelValue + "), " + season + " <br/>" + climateId + " (" + unit + ")<br/><hr>" + comment);
        });

    };    
	var defineService = function () {
	   //esri.show(loading);
	   if (window.timeSeriesDisclaim) {
	       if (dijit.byId("seasonSelection").item != null && dijit.byId("climateSelection").item != null ) {
	            if (dijit.byId("modelSelection").item.value == "Hist") {
	                dojo.byId("subTitle").innerHTML = "Timeline: Years (1950-2005)";
	                dojo.byId("subTitleOneFrame").innerHTML = "Timeline: Years (1950-2005)";
	            }
	            else {
	                dojo.byId("subTitle").innerHTML = "Timeline: Years (2006-2099)";
	                dojo.byId("subTitleOneFrame").innerHTML = "Timeline: Years (2006-2099)";
	            }          
	            var model = dijit.byId("modelSelection").item.value.replace(".", "" );
	            var season = dijit.byId("seasonSelection").item.value;
	            var climateVar = dijit.byId("climateSelection").item.value;
	            userChosenTimeStep = 5;
	            dojo.byId("frameOrSlide").innerHTML = 'slide';
	            addSelectedImageServiceToMap(model + season + climateVar);
	            console.log("model+ season + climateVar:" + model+ season + climateVar);
	            //changeLegendImg();
	        }
	        else {
	            alert("Choose options for Season, Metric!");
	        }
       }
       else {
			var infobox = new Dialog({
    		title: "EnviroAtlas Time Series Disclaimer",
    		style: 'width: 400px'
    		});


    		var nationalDiv = dojo.create('div', {
				'innerHTML': "The original climate projections used in these maps were developed by the NASA Ames Research Center using the NASA Earth Exchange, and are distributed as the NEX-DCP30 dataset. Climate scenarios provide likely approximations of future conditions given a set of initial assumptions. The future is inherently uncertain and the USEPA cannot guarantee that these scenarios reflect what will occur at the specified future time. <BR><BR> \
							 While every attempt has been made to provide the best information possible, no warranty, expressed or implied, is made by the USEPA regarding the accuracy of the derived projections for general or scientific purposes, nor shall the act of distribution constitute any such warranty. The USEPA shall not be held liable for improper or incorrect use of the information described and/or contained herein."
			}, infobox.containerNode);

			dojo.create('hr', {'style': 'margin-top: 10px'}, infobox.containerNode);

			var button4 = new Button({ label:"Accept"});
			button4.startup();
			button4.placeAt(infobox.containerNode);
			button4.on("click", function(event) {
			    window.timeSeriesDisclaim = true;
			    infobox.hide();
			});



			infobox.show();
       		
       }
    };
	var addSelectedImageServiceToMap = function(serviceParams) {
        removeDataFromMap();
        
        //build the REST endpoint URL for the user-selected dropdown selections
        var selectedImageService = futureScenariosAGSbaseURL + serviceParams + "/ImageServer";
        
        var params = new ImageServiceParameters();

        var imageServiceLayer = new ArcGISImageServiceLayer(selectedImageService,{imageServiceParameters: params});
        imageServiceLayer.id = "ScenarioDataLayer";
        imageServiceLayer.setOpacity(0.6);

        
        map.addLayers([imageServiceLayer]);
        
        //Turn on Identify capability after the layer is added to the map
        mapClickListener = map.on("click", executeIdentifyTask);
        
        imageServiceLayer.on("load", function(){
            var modelId = dijit.byId("modelSelection").item.id;
            var modelValue = dijit.byId("modelSelection").item.value;
	        var season = dijit.byId("seasonSelection").item.value;
	        var climateId = dijit.byId("climateSelection").item.id;
	        var climateVar = dijit.byId("climateSelection").item.value;
	        var unit = "";
            if ((climateVar == "TempMax") ||(climateVar == "TempMin")) {
            	unit = "Degrees F";                
            } else if ((climateVar == "Precip") ||(climateVar == "PET")) {
            	unit = "Inches";                
            } 	   
	        setMetadataTab(modelId + " (" + modelValue + "), " + season + " <br/>" + climateId + " (" + unit + ")<br/><hr>" + comment);          
        });

    };
    var removeFrameFromMap = function () {

        if (map.getLayer("ScenarioDataLayer")) {
            console.log(map.getLayer("ScenarioDataLayer"));
            map.removeLayer(map.getLayer("ScenarioDataLayer"));
            clearMetadataTab();
            //clearLegendTab();
        }
        
        dojo.byId("identResult").innerHTML = "";
        console.log("before hiding infoWindow");
        map.infoWindow.hide();
        if (dijit.byId('timeSliderDijOneFrame')) {
            dijit.byId('timeSliderDijOneFrame').destroy();
            console.log('destroyed time slider');
        }
        //esri.hide(loading); 
        
    };
    var removeDataFromMap = function() {
        /*var myNode = document.getElementById("table_container");
        while (myNode.firstChild) {
            myNode.removeChild(myNode.firstChild);
        }*/     
        console.log("remove data from map");
        if (map.getLayer("ScenarioDataLayer")) {
            console.log(map.getLayer("ScenarioDataLayer"));
            map.removeLayer(map.getLayer("ScenarioDataLayer"));
            clearMetadataTab();
            //clearLegendTab();
        }
        
        dojo.byId("identResult").innerHTML = "";
        map.infoWindow.hide();
        if (dijit.byId('timeSliderDij')) {
            dijit.byId('timeSliderDij').destroy();
            console.log('destroyed time slider');
        }
        if (dijit.byId('timeSliderDijOneFrame')) {
            dijit.byId('timeSliderDijOneFrame').destroy();
            console.log('destroyed time slider');
        }       
        //esri.hide(loading); 
    };    
    var clearMetadataTab = function() {
        dojo.byId("layerMetadata").innerHTML = "";
    }    
    var setMetadataTab = function(imgServiceDesc) {
        dojo.byId("layerMetadata").innerHTML = imgServiceDesc;
    }
	var executeIdentifyTask = function (event) {
        console.log("Executing Ident Task");
        var currentLayer = map.getLayer("ScenarioDataLayer");
        identifyTask = new ImageServiceIdentifyTask(currentLayer.url);
        
        identifyParams = new ImageServiceIdentifyParameters();
        identifyParams.returnGeometry = true;
        identifyParams.geometry = event.mapPoint;
        if (dojo.byId("frameOrSlide").innerHTML == 'frame') {
            var timeExtent = new TimeExtent();
            timeExtent.startTime = new Date("12/31/" +  (dojo.byId("frameYearInput").value));
            timeExtent.endTime = new Date("12/31/" +  (dojo.byId("frameYearInput").value));  
            identifyParams.timeExtent = timeExtent;          
        }
        else {
            identifyParams.timeExtent = map.timeExtent;
        }
        
        dojo.connect(map.infoWindow._hide, "onclick", function(){
        	    var climateValue = dijit.byId("climateSelection").item.value;
                if ((climateValue == "TempMax") ||(climateValue == "TempMin")) {
                	dojo.byId("identResult").innerHTML = "Degrees Fahrenheit: " + String(pixelVal);                
                } else if ((climateValue == "Precip") ||(climateValue == "PET")) {
                	dojo.byId("identResult").innerHTML = "Inches per season or year: " + String(pixelVal);                
                }               
        });        
        var deferred = identifyTask
            .execute(identifyParams)
            .addCallback(function (response) {
                                 
                pixelVal = parseFloat(response.value)/100;
                var climateValue = dijit.byId("climateSelection").item.value;
                if ((climateValue == "TempMax") ||(climateValue == "TempMin")) {
                	dojo.byId("identResult").innerHTML = "Degrees Fahrenheit: " + String(pixelVal);                
                	map.infoWindow.setTitle("Degrees Fahrenheit");                	
                } else if ((climateValue == "Precip") ||(climateValue == "PET")) {
                	dojo.byId("identResult").innerHTML = "Inches per season or year: " + String(pixelVal);                
                	map.infoWindow.setTitle("Inches per season or year");                	
                } 

                map.infoWindow.setContent(String(pixelVal));
                map.infoWindow.show(event.mapPoint);
                

                        
            });
    };
    var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {

            baseClass: 'jimu-widget-timeseries',
            startup: function () {
                this.inherited(arguments);                
                map = this.map;
                selfTimeSeries = this;
		        map.on("update-start", mapLoading);
		        map.on("update-end", mapFinishedLoading);
		        map.on("layers-add-result", makeSliderAndLegend);
		        map.on("layers-add-result", makeSliderAndLegendOneFrame);       
		        dojo.byId('titleAndSliderOneFrame').style.display = 'none';
		                	
	        	var modelfiltSelect = new FilteringSelect({
			        id: "modelSelection",
			        name: "modelSelect",
			        value: "CMIP5 RCP 8.5",
			        store: climateModelsStore,
			        searchAttr: "id",
			        //required: true,
			        placeHolder: "Select Scenario or Historical",
			        style: "width:" + widthSelect,
			        //style: "width: 100%"
			    }, "modelSelection").startup();
			    var climateFiltSelect = new FilteringSelect({
			        id: "climateSelection",
			        name: "climateSelect",
			        value: "Autumn",
			        store: climateVarStore,
			        searchAttr: "id",
			        //required: true,
			        placeHolder: "Select Variable",
			        style: "width:" + widthSelect,
			    }, "climateSelection").startup();
			    
			    var seasonFiltSelect = new FilteringSelect({
			        id: "seasonSelection",
			        name: "seasonSelect",
			        value: "Select Season",
			        store: seasonStore,
			        searchAttr: "id",
			        intermediateChanges: true,
			        //required: true,
			        placeHolder: "Select Season or Annual",
			        style: "width:" + widthSelect,
			    }, "seasonSelection").startup();	
			    var frameYear = new TextBox({
			        id: "frameYearInput",
			        name: "frameYear",
			        value: "Or, select specific year to display",
			        style: "width:" + widthSelect,
			        //required: true,
			        //placeHolder: "Year For One Frame"
			        //click: clickFrameYear,
			        //onblur: blurFrameYear
			    }, "frameYearInput").startup();   
			    var addOneFrameButton = new Button({
			        id: "loadOneFrameBtn",
			        name: "loadOneFrameButton",
			        disabled: false
			
			    }, "loadOneFrameBtn").startup();    
			    
			    var addDataButton = new Button({
			        id: "loadServiceBtn",
			        name: "loadServiceButton",
			        disabled: false
			    }, "loadServiceBtn").startup();
			    
			    var clearLayerButton = new Button({
			        id: "removeServiceBtn",
			        name: "clearLayerButton",
			        disabled: false
			    }, "removeServiceBtn").startup();  
			    //loading = dojo.byId("loadingTimeSeriesLayer");//dojo.byId("loadingOverlay");
			    //esri.hide(loading);
			    registry.byId("loadServiceBtn").on("click", defineService);		
			    registry.byId("loadOneFrameBtn").on("click", defineOneFrameService);
			    registry.byId("removeServiceBtn").on("click", removeDataFromMap);	
			    registry.byId("frameYearInput").on("click", clickFrameYear);
    			registry.byId("frameYearInput").on("blur", blurFrameYear);		
    			
				document.getElementById("modelSelectionHelp").onclick = function (e) {
					var infobox = new Dialog({
							title: "Scenario Description",
							style: 'width: 500px'
						});
					var infoDiv = dojo.create('div', {
							'innerHTML': "<font face='calibri' size='2+'>" +        	
            
				            "<b>Scenario I – RCP 2.6</b> – This scenario is characterized as having very low greenhouse gas concentration levels. It is a “peak-and-decline” scenario and assumes that greenhouse gas emissions peak between 2010 and 2020 with emissions declining substantially beyond 2020. The projected global warming increase compared to the reference period (1986-2005) is approximately 1.8 degree Fahrenheit (range of 0.54 to 3.06) by 2081-2100. Atmospheric CO2 is expected to be approximately 425 parts per million in 2100.<BR><BR>" +  
				
				            "<b>Scenario II – RCP 4.5</b> – This scenario assumes a stabilization will occur shortly after 2100, and assumes less emissions than RCP 6.0, which is also a stabilization scenario. It is characterized by a peak in emissions around 2040 and then a decline. The projected global warming increase compared to the reference period 1986-2005 is approximately 3.24 degrees Fahrenheit (range of 1.98 to 4.68) by 2081-2100. Atmospheric CO2 is expected to be approximately 600 parts per million in 2100.<BR><BR>" +
				
				            "<b>Scenario III – RCP 6.0</b> – This is a stabilization scenario in which the increase in GHG emissions stabilizes shortly after 2100 through the application of a range of technologies and strategies for reducing GHG emissions. It is characterized by a peak in emissions around 2080 and then a decline. The projected global warming increase compared to the reference period 1986-2005 is approximately 3.96 degrees Celsius (range of 2.52 to 5.58) by 2081-2100. Atmospheric CO2 is expected to be approximately 725 parts per million in 2100.<BR><BR>" +
				
				            "<b>Scenario IV – RCP 8.5</b> – This scenario is characterized by increasing GHG emissions over time, and factors in the highest GHG concentration levels of all the scenarios by 2100. The projected global warming increase compared to the reference period 1986-2005 is approximately 6.66 degrees Celsius (range of 4.68 to 8.64) by 2081-2100. Atmospheric CO2 is expected to be approximately 1225 parts per million in 2100.<BR><BR>" +
				            
				            "<b>Historical climate</b> – These data are based on PRISM historical observations and interpolation of previous climate. Data are provided for the years 1950 -2005." +
				            
				            "</font>"
						}, infobox.containerNode);
						infobox.show()
				}; //end of modelSelectionHelp click event
				
				document.getElementById("climateSelectionHelp").onclick = function (e) {
					var infobox = new Dialog({
							title: "Climate Description",
							style: 'width: 500px'
						});
					var infoDiv = dojo.create('div', {
						'innerHTML': "<font face='calibri' size='2+'>" +
				        	"Maximum Temperature – Average maximum temperature in degrees Fahrenheit for the season or annually. " + "<a href='https://enviroatlas.epa.gov/enviroatlas/DataFactSheets/pdf/Supplemental/Climate_Temp.pdf' target='_blank'>" + "Access the Fact Sheet" + "</a><br/><br/>" + 
				            "Minimum Temperature – Average minimum temperature in degrees Fahrenheit for the season or annually. " + "<a href='https://enviroatlas.epa.gov/enviroatlas/DataFactSheets/pdf/Supplemental/Climate_Temp.pdf' target='_blank'>" + "Access the Fact Sheet" + "</a><br/><br/>" + 
				            "Precipitation - Total precipitation in inches for the season or annually. " + "<a href='https://enviroatlas.epa.gov/enviroatlas/DataFactSheets/pdf/Supplemental/Climate_Precip.pdf' target='_blank'>" + "Access the Fact Sheet" + "</a><br/><br/>" + 
				            "Potential Evapotranspiration - Total potential evapotranspiration in inches for the season or annually. "  + "<a href='https://enviroatlas.epa.gov/enviroatlas/DataFactSheets/pdf/Supplemental/Climate_PET.pdf' target='_blank'>" + "Access the Fact Sheet" + "</a>" +
				            "</font>"
						}, infobox.containerNode);
						infobox.show()
				}; //end of climateSelectionHelp click event		
				
				document.getElementById("seasonSelectionHelp").onclick = function (e) {
					var infobox = new Dialog({
							title: "Season Description",
							style: 'width: 500px'
						});
					var infoDiv = dojo.create('div', {
						'innerHTML': "<font face='calibri' size='2+'>" + 
				            "Winter – December of previous year, January, February<BR><BR>" +
				            "Spring – March, April, May<BR><BR>" +
				            "Summer – June, July, August<BR><BR>" +
				            "Fall – September, October, November<BR><BR>" +
				            "Annual – January through December of the same calendar year"+
				            "</font>"
						}, infobox.containerNode);
						infobox.show()
				}; //end of seasonSelectionHelp click event		
				
				document.getElementById("frameYearInputHelp").onclick = function (e) {
					var infobox = new Dialog({
							title: "Input Year Description",
							style: 'width: 500px'
						});
					var infoDiv = dojo.create('div', {
						'innerHTML': "<font face='calibri' size='2+'>" + "One year between 2006 - 2099" + "</font>"
						}, infobox.containerNode);
						infobox.show()
				}; //end of frameYearInputHelp click event	
													    				                     
            },
	        onOpen: function () {
		    
	        },            
        });
    return clazz;
});
