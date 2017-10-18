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
        "esri/InfoTemplate",
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
		InfoTemplate,
		HorizontalSlider,
		on,
		domStyle,
		 xhr,
		dom,
		 domClass
	    ) {

    var map;
    var server = "https://enviroatlas2.epa.gov/";
    
    var gpComputeClimateChange = null;
    var layerID = "ClimateChange";
    var currentJobInfo;
    
	var scenarioValue = null;
	var startYearBaseValue = null;
	var endYearBaseValue = null;	
	var startYearComparisonValue = null;
	var endYearComparisonValue = null;
	var climateVariableValue = null;
	var seasonValue = null;
		    
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
    	esri.show(dom.byId("loadingWrap2"));
    	document.getElementById("ECATgpFail").style.display = 'none';
    	var scenarioSelection = document.getElementById("scenario");
		scenarioValue = scenarioSelection.options[scenarioSelection.selectedIndex].value;

    	var startYearBaseSelection = document.getElementById("startYearBaseline");
		startYearBaseValue = startYearBaseSelection.options[startYearBaseSelection.selectedIndex].value;

    	var endYearBaseSelection = document.getElementById("endYearBaseline");
		endYearBaseValue = endYearBaseSelection.options[endYearBaseSelection.selectedIndex].value;
		
    	var startYearComparisonSelection = document.getElementById("startYearComparison");
		startYearComparisonValue = startYearComparisonSelection.options[startYearComparisonSelection.selectedIndex].value;

    	var endYearComparisonSelection = document.getElementById("endYearComparison");
		endYearComparisonValue = endYearComparisonSelection.options[endYearComparisonSelection.selectedIndex].value;

    	var climateVariableSelection = document.getElementById("climateVariable");
		climateVariableValue = climateVariableSelection.options[climateVariableSelection.selectedIndex].value;

    	var seasonSelection = document.getElementById("season");
		seasonValue = seasonSelection.options[seasonSelection.selectedIndex].value;	
		
		if (parseFloat(startYearBaseValue) > parseFloat(endYearBaseValue)) {
			alert("Starting year for baseline shoud not be later than ending year for baseline.");
			esri.hide(dom.byId("loadingWrap2"));
			return;
		}
		
		if (parseFloat(startYearComparisonValue) > parseFloat(endYearComparisonValue)) {
			alert("Starting year for comparison shoud not be later than ending year for comparison.");
			esri.hide(dom.byId("loadingWrap2"));
			return;
		}
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
    	document.getElementById("ECATgpFail").style.display = "none";
    	currentJobInfo = jobInfo;
    	gpComputeClimateChange.getResultImageLayer(jobInfo.jobId, null, null, function(layer){
			layer.setOpacity(1);
			layer.id = window.addedLayerIdPrefix + layerID;
			window.layerID_Portal_WebMap.push(layer.id);
			//ECAT Scenario IV 1950/1950-2000/2000 Precip Spring
	    	var scenarioSelection = document.getElementById("scenario");
			scenarioText = scenarioSelection.options[scenarioSelection.selectedIndex].text;			
			var unit = "null";
		    if ((climateVariableValue == "TempMax") ||(climateVariableValue == "TempMin")) {
            	unit =  " (Degrees Fahrenheit)";              
            } else if ((climateVariableValue == "Precip") ||(climateVariableValue == "PET")) {
            	unit = " (Inches per season or year)";                
            }      	
			layer.name = "ECAT " + scenarioText + " " + startYearBaseValue + "/" + endYearBaseValue + "-" + startYearComparisonValue +  "/" + endYearComparisonValue + " " + climateVariableValue + " " + seasonValue + unit;
			map.addLayer(layer);
			map.on("click", doIdentify);
			identifyTask = new IdentifyTask(layer.url);
        }); 
        esri.hide(dom.byId("loadingWrap2"));
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
				if (lyr.visible) {
	            identifyTask.execute(identifyParams, function (idResults) {
		            	if (window.widthOfInfoWindow == 0 ) {
	                		window.widthOfInfoWindow = map.infoWindow.width;
	                		window.heightOfInfoWindow = map.infoWindow.height;
	                	}
			
					map.infoWindow.resize(140, 120);            
            		map.infoWindow.setTitle("Identify Results");
            		dPixelValue = parseFloat(idResults[0].feature.attributes['Pixel Value']);
            		map.infoWindow.setContent(dPixelValue.toString());

			        map.infoWindow.show(event.screenPoint, map.getInfoWindowAnchor(event.screenPoint));
	            });
	           }
            }

    };

	// Event handler for onStatusUpdate event
	var onTaskStatus = function(jobInfo) {
	    console.log("in onTaskStatus:" + jobInfo.jobStatus);
	};
	
	// Event handler for onError event
	var onTaskFailure= function(error) {
	  // Report error 
	  document.getElementById("ECATgpFail").style.display = '';
	  esri.hide(dom.byId("loadingWrap2"));
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
      	esri.hide(dom.byId("loadingWrap2"));
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

        /*var slider = new HorizontalSlider({
            name: "slider",
            minimum: 0,
            maximum: 1,
            intermediateChanges: true,
            style: "width:370px;",
            onChange: function(value){
                lyr = map.getLayer(window.addedLayerIdPrefix + layerID);
				if(lyr){
					console.log("value:"+ value);
					lyr.setOpacity(1 - value);
				}
            }
        }, "slider");  */
        document.getElementById("helpCloseButton").onclick = function() {
	        dojo.byId("divSplashScreenContent").style.display = "none";
	        dojo.byId("divSplashScreenContainer").style.display = "none";
			var modal = document.getElementById('helpModal');
			modal.style.display = "none";	        
		};
		document.getElementById("startYearBaseline").onchange = function() {			
	    	var startYearSelection = document.getElementById("startYearBaseline");
        	var endYearSelection = document.getElementById("endYearBaseline");
        	endYearSelection.value = startYearSelection.options[startYearSelection.selectedIndex].value;
		};
		document.getElementById("startYearComparison").onchange = function() {			
	    	var startYearSelection = document.getElementById("startYearComparison");
        	var endYearSelection = document.getElementById("endYearComparison");
        	endYearSelection.value = startYearSelection.options[startYearSelection.selectedIndex].value;
		};		
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

    showInformationWindow: function(){
    	var modal = document.getElementById('helpModal');
		modal.style.display = "block";
        dojo.byId("divSplashScreenContent").style.display = "block";
        dojo.byId("divSplashScreenContainer").style.display = "block";
    },
        
    OnScenarioSelectHelpClick: function(){    	
    	
    	if ( navigator.userAgent.indexOf("Firefox") >= 0 ) {
    		dojo.byId("divSplashContent").innerHTML = "<font-family= 'Source Sans Pro' font-face='sans-serif' size='2+'>" +       	
            "<b>Scenario I – RCP 2.6</b> – This scenario is characterized as having very low greenhouse gas concentration levels. It is a “peak-and-decline” scenario and assumes that greenhouse gas emissions peak between 2010 and 2020 with emissions declining substantially beyond 2020. The projected global warming increase compared to the reference period (1986-2005) is approximately 1.8 degree Fahrenheit (range of 0.54 to 3.06) by 2081-2100. Atmospheric CO2 is expected to be approximately 425 parts per million in 2100.<BR><BR>" +  
            "<b>Scenario II – RCP 4.5</b> – This scenario assumes a stabilization will occur shortly after 2100, and assumes less emissions than RCP 6.0, which is also a stabilization scenario. It is characterized by a peak in emissions around 2040 and then a decline. The projected global warming increase compared to the reference period 1986-2005 is approximately 3.24 degrees Fahrenheit (range of 1.98 to 4.68) by 2081-2100. Atmospheric CO2 is expected to be approximately 600 parts per million in 2100.<BR><BR>" +
            "<b>Scenario III – RCP 6.0</b> – This is a stabilization scenario in which the increase in GHG emissions stabilizes shortly after 2100 through the application of a range of technologies and strategies for reducing GHG emissions. It is characterized by a peak in emissions around 2080 and then a decline. The projected global warming increase compared to the reference period 1986-2005 is approximately 3.96 degrees Celsius (range of 2.52 to 5.58) by 2081-2100. Atmospheric CO2 is expected to be approximately 725 parts per million in 2100.<BR><BR>" +
            "<b>Scenario IV – RCP 8.5</b> – This scenario is characterized by increasing GHG emissions over time, and factors in the highest GHG concentration levels of all the scenarios by 2100. The projected global warming increase compared to the reference period 1986-2005 is approximately 6.66 degrees Celsius (range of 4.68 to 8.64) by 2081-2100. Atmospheric CO2 is expected to be approximately 1225 parts per million in 2100.<BR><BR>" +
            "<b>Historical climate</b> – These data are based on PRISM historical observations and interpolation of previous climate. Data are provided for the years 1950 -2005." +
            "</font>";
        	this.showInformationWindow();
    	} else if ( (navigator.userAgent.indexOf("Chrome")>=0)) {
    		window.open('widgets/ECAT/Scenario.html',"_blank","toolbar=no, location=no, titlebar=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=no,width=600, height=520,top=200,left=200");
    	} else {
    		var sFeatures="dialogHeight: " +  "560px;";
    		window.showModalDialog("widgets/ECAT/Scenario.html", "", sFeatures);
    	}    
    },
    
    OnClimateVariableHelpClick: function(){

    	if ( navigator.userAgent.indexOf("Firefox") >= 0 ) {
    		dojo.byId("divSplashContent").innerHTML = "<font-family= 'Source Sans Pro' font-face='sans-serif' size='2+'>" + 
        	"Maximum Temperature – Average maximum temperature in degrees Fahrenheit for the season or annually. " + "<a href='https://enviroatlas.epa.gov/enviroatlas/DataFactSheets/pdf/Supplemental/Climate_Temp.pdf' target='_blank'>" + "Access the Fact Sheet" + "</a><br/><br/>" + 
            "Minimum Temperature – Average minimum temperature in degrees Fahrenheit for the season or annually. " + "<a href='https://enviroatlas.epa.gov/enviroatlas/DataFactSheets/pdf/Supplemental/Climate_Temp.pdf' target='_blank'>" + "Access the Fact Sheet" + "</a><br/><br/>" + 
            "Precipitation - Total precipitation in inches for the season or annually. " + "<a href='https://enviroatlas.epa.gov/enviroatlas/DataFactSheets/pdf/Supplemental/Climate_Precip.pdf' target='_blank'>" + "Access the Fact Sheet" + "</a><br/><br/>" + 
            "Potential Evapotranspiration - Total potential evapotranspiration in inches for the season or annually. "  + "<a href='https://enviroatlas.epa.gov/enviroatlas/DataFactSheets/pdf/Supplemental/Climate_PET.pdf' target='_blank'>" + "Access the Fact Sheet" + "</a>" +
            "</font>";
        	this.showInformationWindow();
    	} else if ( (navigator.userAgent.indexOf("Chrome")>=0)) {
    		window.open('widgets/ECAT/ClimateVariable.html',"_blank","toolbar=no, location=no, titlebar=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=no,width=600, height=260,top=200,left=200");

    	} else {
    		var sFeatures="dialogHeight: " +  "250px;";
    		window.showModalDialog("widgets/ECAT/ClimateVariable.html", "", sFeatures);
    	}          	
    },
    OnSeasonSelectHelpClick: function(){

    	if ( navigator.userAgent.indexOf("Firefox") >= 0 ) {
    		dojo.byId("divSplashContent").innerHTML = "<font-family= 'Source Sans Pro' font-face='sans-serif' size='2+'>" + 
            "Winter – December of previous year, January, February<BR><BR>" +
            "Spring – March, April, May<BR><BR>" +
            "Summer – June, July, August<BR><BR>" +
            "Fall – September, October, November<BR><BR>" +
            "Annual – January through December of the same calendar year"+
            "</font>";
        	this.showInformationWindow();
    	} else if ( (navigator.userAgent.indexOf("Chrome")>=0)) {
    		window.open('widgets/ECAT/Season.html',"_blank","toolbar=no, location=no, titlebar=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=no,width=600, height=220,top=200,left=200");

    	} else {
    		var sFeatures="dialogHeight: " +  "220px;";
    		window.showModalDialog("widgets/ECAT/Season.html", "", sFeatures);
    	} 
    }    
  });  

});

