///////////////////////////////////////////////////////////////////////////
// Copyright © 2015 Damien Robinson - Spatial NI, Land & Property Services (N.Ireland).  
// All Rights Reserved.
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

define(['dojo/_base/declare', 
		'jimu/BaseWidget', 
		"dojo/on",
		"dojo/dom-style",
		"dojo/request/xhr",
		"dojo/dom",
		"dojo/dom-class",
		"esri/layers/ArcGISDynamicMapServiceLayer",
		"esri/layers/ArcGISTiledMapServiceLayer",
		"esri/layers/ArcGISImageServiceLayer",
		"esri/layers/WMSLayer",
		"esri/SpatialReference",
		"esri/geometry/Extent",
		"esri/request",
		"esri/IdentityManager",
		"esri/config"
		],
function(declare, 
		BaseWidget, 
		on,
		domStyle,
		 xhr,
		dom,
		 domClass,
		ArcGISDynamicMapServiceLayer,
		ArcGISTiledMapServiceLayer,
		ArcGISImageServiceLayer,
		WMSLayer,
		SpatialReference,
		Extent,
		esriRequest,
		esriId,
		esriConfig) {


  //To create a widget, you need to derive from BaseWidget.
  return declare([BaseWidget], {
    // DemoWidget code goes here 

    //please note that this property is be set by the framework when widget is loaded.
    //templateString: template,

    baseClass: 'jimu-widget-addservice',

    postCreate: function() {
      this.inherited(arguments);
      console.log('postCreate');
    },

    startup: function() {
      this.inherited(arguments);
      //this.mapIdNode.innerHTML = 'map id:' + this.map.id;

		on(dom.byId("urlText"), "keyup", function(){
			//alert(this.value);
			testURL = this.value;
				if (testURL.indexOf("https") > -1) {
					//alert("found: " + testURL);
					domClass.remove(this, "glowing-border");
					dom.byId("iMessage").innerHTML = '';

				}else if(testURL.indexOf("http") > -1){
					domClass.add(this,"glowing-border")
					dom.byId("iMessage").innerHTML = 'Please Use Secure Url (https)';
				}else{
					domClass.remove(this, "glowing-border");
					dom.byId("iMessage").innerHTML = '';
				}
		})
      console.log('startup');
    },
	
	clearTextBox: function()
	{
		// Clear the text box and message on clear click
		domStyle.set('eMailOption', 'display', 'none');
	   this.urlTextbox.value = '';
	   this.message.innerHTML = '';
	},

	  sendEmail: function(){

		  var to = "email@somewhere.com"; //Need to change deployed
		  var subject = "EnviroAtlas Add URL";
		  var text = dom.byId("emailText").value;
		  var nEmail = dom.byId("notifyEmail").value;
		  if(nEmail){
			  text = text + " Notify " + nEmail;
		  }
		  try{
			  //console.log(text);
			  //Make request back to the server to send email
			  xhr("https://machinename/send",{
				  data: {to:to,subject:subject,text:text},
				  query: {to:to,subject:subject,text:text},
				  method: "GET"
			  }).then(function(data){
				  if(data=="sent")
				  {
					  console.log("Successful: Email Sent");
				  }
				  else{
					  console.log("Error: Email Failed");
				  }
			  });
		  }
		  catch(error){
			  console.log(error);
		  }

	  },
	
	addMapService: function()
	{
	   // Global and local variables
	   // NOTE: Necessary to define "this." as global variables, as internal functions can't read "this."
	   map = this.map;
	   var mapID = map.id; 
	   serviceURL = this.urlTextbox.value;
	   //JSON URL request string (service parameters)
	   var serviceParams = serviceURL+"?f=pjson"; 
	   // 1.2 WMS URL request string (service parameters)
	   var serviceParamsWMS = serviceURL+"?request=GetCapabilities&service=WMS"; 
	   mapWKID = this.map.spatialReference.wkid;
	   dynMapServ = this.dynMapServ;
	   tileMapServ = this.tileMapServ;
	   imageServ = this.imageServ;
	   wms = this.wms;
	   wmts = this.wmts;
	   message = this.message;
	   
	   // 1.2 PARSE LIST OF CORS ENABLED SERVERS FROM CONFIG.JSON
		jsonData = this.config.cors;
		for (var i = 0; i < jsonData.length; i++) {
			esriConfig.defaults.io.corsEnabledServers.push(""+jsonData[i]+"");
		}

		//Add domain to esriConfig
		var urlDomain = extractDomain(serviceURL);
		//check for http
		if (testURL.indexOf("https") > -1) {

		}else if(testURL.indexOf("http") > -1){
			this.message.innerHTML = 'Please Use Secure Url (https)';
			return;
		}
		esriConfig.defaults.io.corsEnabledServers.push(urlDomain);

	   // Clear the message on addMapService click
	   this.message.innerHTML = "";
	   
	  	// requestSucceeded() callback function only called when the request has succeeded. Otherwise it calls requestFailed().
		function requestSucceeded(json) {
			//console.log(json);
			// 1.2 if statement to pull back the name of the service for image services and other map services
			if(imageServ.checked){
			parentLayerName = json.name;
			}
			else{
			parentLayerName = json.mapName;
			}
			//console.log(json);
			serviceWKID = json.fullExtent.spatialReference.wkid;
			singleFusedMapCache = JSON.stringify(json.singleFusedMapCache);
			xmin = json.fullExtent.xmin;
			ymin = json.fullExtent.ymin;
			xmax = json.fullExtent.xmax;
			ymax = json.fullExtent.ymax;
			capabilities = json.capabilities;
			
			// 1.1.2 Checks for allowRasterFunction. Inferring Image service type. 
			if(typeof(json.allowRasterFunction) != "undefined"){
			
			imageServiceBool = true;
			
			}
			else{
			
			imageServiceBool = false;
			
			};
			
			// WKID validation
			if (serviceWKID!=mapWKID){
			message.innerHTML = '<div style="color:orange; width: 100%;"><b>WARNING: Basemap and Service have different Spatial References</b></div>';
			}
			
			// Setting Service extent from JSON response
			serviceExtent = new Extent(xmin,ymin,xmax,ymax, new SpatialReference({ wkid:serviceWKID }));
			
			// Checking if layer has already been added 
			 for(var j = 0; j < map.layerIds.length; j++) {
				var layer = map.getLayer(map.layerIds[j]);
				
				if (layer.url == serviceURL){
				message.innerHTML = '<div style="color:red; width: 100%;"><b>ERROR: Service already added</b></div>';
				throw "ERROR: Service already added"
				
				}
			 }
			 
			//if dynMapServ radio button is checked
			if(dynMapServ.checked) {
				// 1.1.2 changed method for detecting an image service
				if(imageServiceBool == true){
				message.innerHTML = '<div style="color:red; width: 100%;"><b>ERROR: Service is an image service. Select image service</b></div>';
				throw "ERROR: Service is an image service. Select image service."
				
				}
				// If singleFusedMapCache is true, (inferring service has been cached)
				//1.1.3 added else if
				else if(singleFusedMapCache == "true"){
				message.innerHTML = '<div style="color:red; width: 100%;"><b>ERROR: Service is cached. Select tiled/cached map service</b></div>';
				throw "ERROR: Service is cached. Select tiled/cached map service."
				//1.1.3 added else
				}else{
				

				
				var dynamicMapServiceLayer = new ArcGISDynamicMapServiceLayer(serviceURL);
				dynamicMapServiceLayer.name = parentLayerName; // 1.1.1 - Sets dynamic service name
				map.addLayer(dynamicMapServiceLayer);
					// layer loaded listener 
					dynamicMapServiceLayer.on("load", function(){
						console.log("Dynamic map service Loaded successfully");
						message.innerHTML = '<div style="color:green; width: 100%;"><b>Service Loaded successfully</b></div>';
					});
				
				
				}
				

			//if tileMapServ radio button is checked
			}else if(tileMapServ.checked) {
			
				// 1.1.2 changed method for detecting an image service
				if(imageServiceBool == true){
				message.innerHTML = '<div style="color:red; width: 100%;"><b>ERROR: Service is an image service. Select image service</b></div>';
				throw "ERROR: Service is an image service. Select image service."
				
				}
				
				// If singleFusedMapCache is false, (inferring service is dynamic)
				//1.1.3 added else if
				else if(singleFusedMapCache == "false"){ 
				message.innerHTML = '<div style="color:red; width: 100%;"><b>ERROR: Service is dynamic. Select dynamic map service</b></div>';
				throw "ERROR: Service is dynamic. Select dynamic map service."
				//1.1.3 added else
				}else{ 
					
				var tiledMapServiceLayer = new ArcGISTiledMapServiceLayer(serviceURL);
				tiledMapServiceLayer.name = parentLayerName;// 1.1.1 - Sets tiled service name
				map.addLayer(tiledMapServiceLayer);
					// layer loaded listener 
					tiledMapServiceLayer.on("load", function(){
						console.log("Tiled map service Loaded successfully");
						message.innerHTML = '<div style="color:green; width: 100%;"><b>Service Loaded successfully</b></div>';
					});
				
				}
			//if imageServ radio button is checked	
			}else if(imageServ.checked) {
				// 1.1.2 changed method for detecting an image service
				if(imageServiceBool == false){
				message.innerHTML = '<div style="color:red; width: 100%;"><b>ERROR: Service is not an image service.</b></div>';
				throw "ERROR: Service is not an image service."
				
				}
				// 1.2 cached image services brought in as tiled map services to display cache
				else if(imageServiceBool == true && singleFusedMapCache == "true"){
					
				var imageServiceLayer = new ArcGISTiledMapServiceLayer(serviceURL);
				imageServiceLayer.name = parentLayerName;// 1.1.1 - Sets tiled service name
				map.addLayer(imageServiceLayer);
					// layer loaded listener 
					imageServiceLayer.on("load", function(){
						console.log("Cached image service Loaded successfully");
						message.innerHTML = '<div style="color:orange; width: 100%;"><b>Warning: Image service is cached therefore has been added as a tiled/cached map service.</b></div>';
					});
				}
				//1.2 if image service is not cached, add it as an image service
				else{
				var imageServiceLayer = new ArcGISImageServiceLayer(serviceURL);
				imageServiceLayer.name = parentLayerName; // 1.1.1 - Sets tiled service name
				map.addLayer(imageServiceLayer);
					// layer loaded listener 
					imageServiceLayer.on("load", function(){
						console.log("Image service Loaded successfully");
						message.innerHTML = '<div style="color:green; width: 100%;"><b>Service Loaded successfully</b></div>';
					});
				
				}
				
			}
		
		// Zoom to full extent of map service
		map.setExtent(serviceExtent);
			
		}
		
		// 1.2 function added to handle WMS
		function requestSucceededWMS(xml) {
			console.log(xml);
			
			// Checking if layer has already been added 
			 for(var j = 0; j < map.layerIds.length; j++) {
				var layer = map.getLayer(map.layerIds[j]);
				
				if (layer.url == serviceURL){
				message.innerHTML = '<div style="color:red; width: 100%;"><b>ERROR: Service already added</b></div>';
				throw "ERROR: Service already added"
				
				}
			 }
			 
			if(wms.checked) {
			//wms radio button is checked
				var wmsLayer = new WMSLayer(serviceURL);
				wmsLayer.setImageFormat ("png");
				map.addLayer(wmsLayer);
					wmsLayer.on("load", function(){
						console.log("WMS service Loaded successfully");
						message.innerHTML = '<div style="color:green; width: 100%;"><b>Service Loaded successfully</b></div>';
					});
			
			}
		}
		
		// requestFailed(error) callback function only called when the request has failed. Otherwise it calls requestSucceeded().
		function requestFailed(error) {
			console.log("Error: ", error.message);
			// If service is secured, then log in and re-run the esriRequest. Token should be cached in session.
			if(error.code === 499){
				var serviceRequestError = esriRequest({
				  url: serviceParams,
				  handleAs: "json"
				});

				serviceRequestError.then(requestSucceeded, requestFailed);
				}
			//Allow emailing of services that are not in config
			console.log("Service Failed to Load successfully");
			message.innerHTML = '<div style="color:green; width: 100%;"><b>Service Failed to Load</b></div>';
			dom.byId("emailText").value = "Please allow the services from " + extractDomain(serviceURL) + " to be added to the EnviroAtlas application.";
			domStyle.set('eMailOption', 'display', 'inline');
		}
		
		// 1.2 function added to handle WMS
		// requestFailedWMS(error) callback function only called when the request has failed. Otherwise it calls requestSucceededWMS().
		function requestFailedWMS(error) {
			console.log("Error: ", error.message);
			// If service is secured, then log in and re-run the esriRequest. Token should be cached in session.
			if(error.code === 499){
				var serviceRequestError = esriRequest({
				  url: serviceParamsWMS,
				  handleAs: "xml"
				});
				
				serviceRequestError.then(requestSucceededWMS, requestFailedWMS);
				}
			//Allow emailing of services that are not in config
			console.log("Service Failed to Load successfully");
			message.innerHTML = '<div style="color:green; width: 100%;"><b>Service Failed to Load</b></div>';
			dom.byId("emailText").value = "Please allow the services from " + extractDomain(serviceURL) + " to be added to the EnviroAtlas application.";
			domStyle.set('eMailOption', 'display', 'inline');
		}
		
		// 1.2 if statement added to differentiate between wms (xml dependent) and other services (json dependent) 
		if (wms.checked){	
		// Request to gather parameters from input service
		var serviceRequest = esriRequest({
		  url: serviceParamsWMS,
		  handleAs: "xml"
		});
		serviceRequest.then(requestSucceededWMS, requestFailedWMS);
		}else{
		// Request to gather parameters from input service
		var serviceRequest = esriRequest({
		  url: serviceParams,
		  handleAs: "json"
		});
		serviceRequest.then(requestSucceeded, requestFailed);
		}

		function extractDomain(url) {
			var domain;
			//find & remove protocol (http, ftp, etc.) and get domain
			if (url.indexOf("://") > -1) {
				p = url.split('/');
				domain = p[0] + '//' + p[2];  //url.split('/')[2];
			}
			else {
				domain = url.split('/')[0];
			}
			//find & remove port number
			//domain = domain.split(':')[0];

			return domain;
		}
	},
	
    onOpen: function(){
      console.log('onOpen');
    },

    onClose: function(){
		message.innerHTML = '';
		domStyle.set('eMailOption', 'display', 'none');
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
    }
  });
  

});

