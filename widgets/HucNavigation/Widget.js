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
		'dojo/request/xhr',
		'dojo/_base/lang',
		'jimu/utils',
		'esri/layers/ArcGISDynamicMapServiceLayer',
		'esri/tasks/Geoprocessor',
        "esri/tasks/IdentifyTask",
        "esri/tasks/IdentifyParameters",
        'esri/tasks/Geoprocessor',
        "esri/tasks/QueryTask",
        "esri/tasks/query",
        'esri/symbols/SimpleFillSymbol',
        'esri/symbols/SimpleLineSymbol',
        'esri/symbols/SimpleMarkerSymbol',
        'esri/Color',
        'esri/graphic',
        'dijit/form/ToggleButton',
        "esri/InfoTemplate",
        'dijit/form/HorizontalSlider',
        'jimu/dijit/TabContainer',
		"dojo/on",
		"dojo/dom-style",
		"dojo/request/xhr",
		"dojo/dom",
		"dojo/dom-class",
		"dijit/form/FilteringSelect"
		],
function(declare, 
		BaseWidget, 
		xhr,
		lang,
		utils,
		ArcGISDynamicMapServiceLayer,
		Geoprocessor,
		IdentifyTask,
		IdentifyParameters,
		Geoprocessor,
		QueryTask,
		Query,
		SimpleFillSymbol,
		SimpleLineSymbol,
		SimpleMarkerSymbol,
		Color,
		Graphic,
		ToggleButton,
		InfoTemplate,
		HorizontalSlider,
		TabContainer,
		on,
		domStyle,
		 xhr,
		dom,
		 domClass
	    ) {

    var map;
    var gpURL = "https://leb.epa.gov/arcgis/rest/services/Other/HUC12NAVModelIDs/GPServer/HUC12NAVModelIDs";
    var hucQueryURL = "https://leb.epa.gov/arcgis/rest/services/Other/HUC12NavRMS_MS/MapServer/0";
    
    var mapClickListener = null;
	var strHUCShpDownload = null;
	var downloadable = false;
    var executeSearchHUCTask = function(event) {
	    var myTextArea = document.getElementById('hucQueryStatus');
		myTextArea.value='Query Messages...';
		
		map.graphics.clear(); //clear previous results
		dojo.byId("downloadHUC").style.display = 'none';
				
		 var startPointSym =  new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 15,
	    new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
	    new Color([255,0,0]), 1),
	    new Color([0,255,0,0.25]));

		var startGraphic = new Graphic(event.mapPoint, startPointSym);
		map.graphics.add(startGraphic);    	
    	var radios = document.getElementsByName("upOrDown");
		var upOrDownSelected = "";
		for (var i = 0; i < radios.length; i++) {       
		    if (radios[i].checked) {
		        upOrDownSelected=radios[i].value;
		        break;
		    }
		}
		radios = document.getElementsByName("distOrTime");
		var distOrTimeSelected = "";
		for (var i = 0; i < radios.length; i++) {       
		    if (radios[i].checked) {
		        distOrTimeSelected=radios[i].value;
		        break;
		    }
		}

		distance = document.getElementById("distanceHUC").value;
		numberOfHUCs = document.getElementById("numberOfHUCs").value;
		downloadable = document.getElementById("chkSaveHUC").checked;
		
		var testPointUSTextInput = "{ \"features\"  : [{\"geometry\" : {\"x\" :"+ event.mapPoint.x.toString() + ", \"y\" :" + event.mapPoint.y.toString() + "}}]}";
		
		gpComputeClimateChange = new Geoprocessor(gpURL);
			
        gpComputeClimateChange.setOutSpatialReference(map.spatialReference);
        gpComputeClimateChange.setProcessSpatialReference(map.spatialReference);
        
		var gpParams = {};
		gpParams["DistOrTime"] = distOrTimeSelected;
		gpParams["UpstreamOrDownstream"] = upOrDownSelected;
		gpParams["ValStop"] = distance.toString(); 
		gpParams["CountStop"] = numberOfHUCs.toString(); 
		gpParams["TestPointUS"] = testPointUSTextInput;		
		gpParams["DEBUGMESSAGES"] = "";
		gpParams["SelectAndZip"] = downloadable;
		gpParams["env%3AoutSR"] = "";
		gpParams["env%3AprocessSR"] = "";
		gpParams["f"] = "pjson";

		gpComputeClimateChange.processSpatialReference = map.spatialReference;
		gpComputeClimateChange.outSpatialReference = map.spatialReference;

		gpComputeClimateChange.execute(gpParams, onTaskComplete, onTaskFailure);		
    };
    var removeGraphics = function(message) {
		map.graphics.clear();
   	
    };
    var onTaskFailure = function(message) {
		var myTextArea = document.getElementById('hucQueryStatus');
		myTextArea.value=message + " Please try a different starting location.";
   	
    };
    var onTaskComplete = function (results, messages){

    	var queryHUC = "HUC_12 IN (";
    	for (index = 0, len = results[1].value.length; index < len; ++index) {
    		queryHUC = queryHUC + "'" + results[1].value[index] + "',";    		
    	}
    	
    	var queryString;
    	if (results[1].value.length>=1) {
    		queryString = queryHUC.substring(0, queryHUC.length-1) +")";
    		strHUCShpDownload = results[0].value;
    		if (downloadable) {
	    		dojo.byId("downloadHUC").style.display = '';	    		
	    		document.getElementById("downloadHUC").onclick = function() {
	    			window.open(strHUCShpDownload);
				};	    			
    		}
    	}    		
    	else {
    		dojo.byId("downloadHUC").style.display = 'none';
    		queryString = "HUC_12 IN ()";

			var myTextArea = document.getElementById('hucQueryStatus');
			myTextArea.value='No HUCs could be found';			
    	}
    	
	    var qt = new QueryTask(hucQueryURL);
	    var query = new Query();
	    query.where = queryString;
	
	  	query.returnGeometry = true;
	  	qt.execute(query, showResults);
   	
    };
    var showResults = function (featureSet){
	
		var radios = document.getElementsByName("upOrDown");
		var upOrDownSelected = "";
		for (var i = 0; i < radios.length; i++) {       
		    if (radios[i].checked) {
		        upOrDownSelected=radios[i].value;
		        break;
		    }
		}
		if (upOrDownSelected == "Down")
			{
				lineColor = new Color([255,0,0,1]);
				polyColor = new Color([255,0,0,0.4]);
			}
			else 
			{
				lineColor = new Color([0,0,204,1]);
				polyColor = new Color([0,0,204,0.4]);
			}		

		var resultFeatures = featureSet.features;
	
		  //Loop through each feature returned
		for (var i=0, il=resultFeatures.length; i<il; i++) {
		    //Get the current feature from the featureSet.
		    //Feature is a graphic
		    myGraphic = resultFeatures[i];

            polySymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
    			new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
        			lineColor, 2), polyColor);

			myGraphic.symbol = polySymbol;	
			map.graphics.add(myGraphic);		    
		
		    //Add graphic to the map graphics layer.
		    map.graphics.add(myGraphic);
		    
		    var myTextArea = document.getElementById('hucQueryStatus');
			myTextArea.value='Polygons Plotted...\r\nNumber of HUCs: ' + resultFeatures.length.toString();
		}
        //select results tab
        var mainTab = dijit.byId("huctabContainer"); //Tr
        mainTab.selectTab("Results");
    };

  //To create a widget, you need to derive from BaseWidget.
  return declare([BaseWidget], {
    //please note that this property is be set by the framework when widget is loaded.
    //templateString: template,

    baseClass: 'jimu-widget-hucnavigation',

    postCreate: function() {
      this.inherited(arguments);
      this._initTabContainer();
      console.log('postCreate');
    },
    _initTabContainer: function () {
      var tabs = [];
      tabs.push({
        title: "About",
        content: this.tabNode1
      });
      tabs.push({
        title: "Results",
        content: this.tabNode2
      });
      tabs.push({
        title: "Settings",
        content: this.tabNode3
      });
      this.selTab = this.nls.measurelabel;
      this.tabContainer = new TabContainer({
        tabs: tabs,
        selected: this.selTab,
	    id: "huctabContainer"
      }, this.tabMain);
      this.tabContainer.startup();
      this.own(on(this.tabContainer, 'tabChanged', lang.hitch(this, function (title) {
        if (title !== this.nls.resultslabel) {
          this.selTab = title;
        }
        //this._resizeChart();
      })));
      utils.setVerticalCenter(this.tabContainer.domNode);
    },
    

    startup: function() {
      	this.inherited(arguments);
      	map = this.map;

		chkSearchPointToggle = document.getElementById("searchPointToggle");
		chkSearchPointToggle.checked = false;
		chkSearchPointToggle.addEventListener('click', function() {
			if(document.getElementById("searchPointToggle").checked == false){
				window.toggleOnHucNavigation = true;
				document.getElementById('butMapClickForPopup').click();
				document.getElementById("searchPointToggle").innerText = "Select Point";
				document.getElementById("searchPointToggle").checked = true;
                domClass.add(dojo.byId('searchPointToggle'), 'hucButtonSelected');
				mapClickListener = map.on("click", executeSearchHUCTask);
				map.setMapCursor("crosshair");
				//deactivate the Raindrop tool and Elevation tool
	            if (window.toggleOnRainDrop == true) {
	          	    document.getElementById('selectPoint').click();
	            }
	            if (window.toggleOnElevation == true) {
	          	    document.getElementById('butNullifyMeasureElevation').click();
	            }          
			}
			else {
				window.toggleOnHucNavigation = false;
				document.getElementById('butMapClickForPopup').click();
				document.getElementById("searchPointToggle").innerText = "Activate tool";
				document.getElementById("searchPointToggle").checked = false;
                domClass.remove(dojo.byId('searchPointToggle'), 'hucButtonSelected');
				if (mapClickListener != null) {
					mapClickListener.remove();
				}				
				map.setMapCursor("default");
			}
	    });	
	    document.getElementById("clearHUCBtn").onclick = function() {
		    removeGraphics();
		};
    },


    onOpen: function(){
      console.log('onOpen');
    },

    onClose: function(){
      console.log('onClose');
		document.getElementById("searchPointToggle").innerText = "Activate tool";
		document.getElementById("searchPointToggle").checked = false;
		if (mapClickListener != null) {
			mapClickListener.remove();
		}				
		map.setMapCursor("default");
		window.toggleOnHucNavigation = false;
        domClass.remove(dojo.byId('searchPointToggle'), 'hucButtonSelected');
		document.getElementById('butMapClickForPopup').click();		
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

  });  

});

