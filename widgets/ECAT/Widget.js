//////////////////////////////////////////////////////////
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
///////////////////////////////////////////////////////////////////////////

define(['dojo/_base/declare', 
		'jimu/BaseWidget', 
		'esri/layers/ArcGISDynamicMapServiceLayer',
		'esri/tasks/Geoprocessor',
        "esri/tasks/IdentifyTask",
        "esri/tasks/IdentifyParameters",
        'dijit/form/HorizontalSlider',
		"dojo/on",
		"dojo/dom-style",
		"dojo/request/xhr",
		"dojo/dom",
		"dojo/dom-class",
		"dijit/form/FilteringSelect"
		],
function(declare, 
		BaseWidget, 
		ArcGISDynamicMapServiceLayer,
		Geoprocessor,
		IdentifyTask,
		IdentifyParameters,
		HorizontalSlider,
		on,
		domStyle,
		 xhr,
		dom,
		 domClass
	    ) {

    var map;
    var server = "https://enviroatlas2.epa.gov/";
    //var server = "https://leb.epa.gov/";
    
    var gpComputeClimateChange = null;
    var layerID = "ClimateChange";
    var currentJobInfo;
    var clearLayersClick = function() {
		lyr = map.getLayer(window.addedLayerIdPrefix + layerID);
		if(lyr){
        	map.removeLayer(lyr);
        	map.infoWindow.hide();
      	}             	
	};    
	var downloadCSVClick = function() {
		window.open(server + "arcgis/rest/directories/arcgisjobs/ecat/rastercalculate_fromaverage_gpserver/" + currentJobInfo.jobId + "/scratch/HUC12Statistic.csv");
	};

    var calculateChangeClick = function() {
    	var scenarioSelection = document.getElementById("scenario");
		var scenarioValue = scenarioSelection.options[scenarioSelection.selectedIndex].value;

    	var startYearBaseSelection = document.getElementById("startYearBaseline");
		var startYearBaseValue = startYearBaseSelection.options[startYearBaseSelection.selectedIndex].value;

    	var endYearBaseSelection = document.getElementById("endYearBaseline");
		var endYearBaseValue = endYearBaseSelection.options[endYearBaseSelection.selectedIndex].value;
		
    	var startYearComparisonSelection = document.getElementById("startYearComparison");
		var startYearComparisonValue = startYearComparisonSelection.options[startYearComparisonSelection.selectedIndex].value;

    	var endYearComparisonSelection = document.getElementById("endYearComparison");
		var endYearComparisonValue = endYearComparisonSelection.options[endYearComparisonSelection.selectedIndex].value;

    	var climateVariableSelection = document.getElementById("climateVariable");
		var climateVariableValue = climateVariableSelection.options[climateVariableSelection.selectedIndex].value;

    	var seasonSelection = document.getElementById("season");
		var seasonValue = seasonSelection.options[seasonSelection.selectedIndex].value;	

		var gpURL = server + "arcgis/rest/services/ECAT/RasterCalculate_fromAverage/GPServer/RasterAverage_from5Year";		
		gpComputeClimateChange = new Geoprocessor(gpURL);			    	
        gpComputeClimateChange.setOutSpatialReference(map.spatialReference);
        gpComputeClimateChange.setProcessSpatialReference(map.spatialReference);
        
		var gpParams = {};
		gpParams["futureClimateScenario"] = scenarioValue;
		gpParams["startingYearBaseline"] = startYearBaseValue;
		gpParams["endingYearBaseline"] = endYearBaseValue;
		gpParams["startingYearFuture"] = startYearComparisonValue;
		gpParams["endingYearFuture"] = endYearComparisonValue;		
		gpParams["climateVariableSelection"] = climateVariableValue;
		gpParams["seasonSelection"] = seasonValue;

		gpComputeClimateChange.processSpatialReference = map.spatialReference;
		gpComputeClimateChange.outSpatialReference = map.spatialReference;
		//gpComputeClimateChange.setUpdateDelay(7000);

		gpComputeClimateChange.submitJob(gpParams, onTaskComplete, onTaskStatus, onTaskFailure);
			 
    };
    var onTaskComplete = function(jobInfo) {
    	currentJobInfo = jobInfo;
    	gpComputeClimateChange.getResultImageLayer(jobInfo.jobId, null, null, function(layer){
			layer.setOpacity(1);
			layer.id = window.addedLayerIdPrefix + layerID;
			map.addLayer(layer);
			map.on("click", doIdentify);
			identifyTask = new IdentifyTask(layer.url);
        }); 
	};
    var doIdentify = function(event) {
            map.graphics.clear();
            var dPixelValue = 0;
            identifyParams = new IdentifyParameters();
            identifyParams.tolerance = 3;
            identifyParams.returnGeometry = true;
            identifyParams.layerOption = IdentifyParameters.LAYER_OPTION_ALL;
            identifyParams.width = map.width;
            identifyParams.height = map.height;            
            identifyParams.geometry = event.mapPoint;
            identifyParams.mapExtent = map.extent;
    		lyr = map.getLayer(window.addedLayerIdPrefix + layerID);
			if(lyr){
	            identifyTask.execute(identifyParams, function (idResults) {
			
					map.infoWindow.resize(130, 120);            
            		map.infoWindow.setTitle("Identify Results");
            		dPixelValue = parseFloat(idResults[0].feature.attributes['Pixel Value']);
            		map.infoWindow.setContent(dPixelValue.toString());

			        map.infoWindow.show(event.screenPoint, map.getInfoWindowAnchor(event.screenPoint));
	            });
            }

    };

	// Event handler for onStatusUpdate event
	var onTaskStatus = function(jobInfo) {
	    console.log("in onTaskStatus:" + jobInfo.jobStatus);
	};
	
	// Event handler for onError event
	var onTaskFailure= function(error) {
	  // Report error 
	  console.log(" geoprocessing service error:"+ error); 
	};
  //To create a widget, you need to derive from BaseWidget.
  return declare([BaseWidget], {
    //please note that this property is be set by the framework when widget is loaded.
    //templateString: template,

    baseClass: 'jimu-widget-ECAT',

    postCreate: function() {
      this.inherited(arguments);
      console.log('postCreate');
    },
    

    startup: function() {
      	this.inherited(arguments);
      	map = this.map;
      	
		var optionStartYearBaseline = null;
		var optionEndYearBaseline = null;
		var optionStartYearComparison = null;
		var optionEndYearComparison = null;
		
		var selectStartYearBaseline = document.getElementById("startYearBaseline");		
		var selectEndYearBaseline = document.getElementById("endYearBaseline");	
		var selectStartYearComparison = document.getElementById("startYearComparison");	
		var selectEndYearComparison = document.getElementById("endYearComparison");	
		
		for (index = 1950, len = 2100; index < len; ++index) {
			optionStartYearBaseline = document.createElement("option");
			optionStartYearBaseline.text = String(index);
			optionStartYearBaseline.value = String(index);
			selectStartYearBaseline.appendChild(optionStartYearBaseline);
			
			
			optionEndYearBaseline = document.createElement("option");
			optionEndYearBaseline.text = String(index);
			optionEndYearBaseline.value = String(index);			
			selectEndYearBaseline.appendChild(optionEndYearBaseline);

			optionStartYearComparison = document.createElement("option");
			optionStartYearComparison.text = String(index);
			optionStartYearComparison.value = String(index);			
			selectStartYearComparison.appendChild(optionStartYearComparison);
			
			optionEndYearComparison = document.createElement("option");
			optionEndYearComparison.text = String(index);
			optionEndYearComparison.value = String(index);			
			selectEndYearComparison.appendChild(optionEndYearComparison);
		}
		
		document.getElementById("calculateChangeBtn").onclick = function() {
		    calculateChangeClick();
		};

		document.getElementById("clearLayersBtn").onclick = function() {
		    clearLayersClick();
		};

		document.getElementById("downloadCSVBtn").onclick = function() {
		    downloadCSVClick();
		};		

        var slider = new HorizontalSlider({
            name: "slider",
            minimum: 0,
            maximum: 1,
            intermediateChanges: true,
            style: "width:300px;",
            onChange: function(value){
                lyr = map.getLayer(window.addedLayerIdPrefix + layerID);
				if(lyr){
					console.log("value:"+ value);
					lyr.setOpacity(1 - value);
				}
            }
        }, "slider");  
    },


    onOpen: function(){
      console.log('onOpen');
    },

    onClose: function(){
      console.log('onClose');
    },

    onMinimize: function(){
      console.log('onMinimize');
    },
    onMaximize: function(){
      console.log('onMaximize');
    },

    onSignIn: function(credential){
      /* jshint unused:false*/
      console.log('onSignIn');
    },

    onSignOut: function(){
      console.log('onSignOut');
    },
    OnScenarioSelectHelpClick: function(){


		//$('#tenant').tabbedDialog();


    }

  });
  

});

