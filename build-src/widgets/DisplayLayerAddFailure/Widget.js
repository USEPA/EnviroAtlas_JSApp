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
    "dojo/request/xhr",
    'jimu/BaseWidget',
    'dijit/Dialog',
     'jimu/WidgetManager',
     'jimu/PanelManager',     
     'esri/layers/FeatureLayer',
     'esri/dijit/PopupTemplate',
     'esri/layers/ArcGISDynamicMapServiceLayer',
    'dijit/layout/ContentPane',
    'dijit/TooltipDialog'
  ],
  function(
    declare,
    _WidgetsInTemplateMixin,
    Deferred,
    xhr,
    BaseWidget,
    Dialog,
    WidgetManager,
    PanelManager,
    FeatureLayer,
    PopupTemplate,
    ArcGISDynamicMapServiceLayer,
    ContentPane,
    TooltipDialog
    ) {

	var map;
	var self;
	var failedEAID;
   	var failedOutsideLayers;
    var updateFailedListOfLayers = function(){	
    	var comment = document.getElementById("failedLayersComment");
		failedEAID = "";
		failedOutsideLayers = "";    	
    	if ((Object.keys(window.faildedEALayerDictionary).length == 0)&&(Object.keys(window.faildedOutsideLayerDictionary).length == 0)) {  
    		comment.innerHTML = "Data that fails to load will appear here and be documented."; 
    		var hr = document.getElementById('hrFailedEnviroAtlasLayers');
			hr.style.display = 'none';	 
    		var hrEmail = document.getElementById('hrFailedLayersSendEmail');
			hrEmail.style.display = 'none';	
					 
    		hr = document.getElementById('hrFailedOutsideLayers');
			hr.style.display = 'none';			
    		var butEmail = document.getElementById('eMailOption');
			butEmail.style.display = 'none';					 		
    	} else{
    		comment.innerHTML = "The following web service(s) failed to load at this time and may be unavailable for this session.";
    	}
    	if (Object.keys(window.faildedEALayerDictionary).length > 0) {
            enableSendButton();			
    		var hr = document.getElementById('hrFailedEnviroAtlasLayers');
			hr.style.display = '';	
    		var hrEmail = document.getElementById('hrFailedLayersSendEmail');
			hrEmail.style.display = '';				
    		var commentFaileEA = document.getElementById("failedEnviroAtlasLayersComment");
    		commentFaileEA.innerHTML = "Click below to notify the EnviroAtlas administrators of issues with these EnviroAtlas services:";
    		var butEmail = document.getElementById('eMailOption');
			butEmail.style.display = '';
		    var tableOfRelationship = document.getElementById("failedEALayers");
		    var tableRef = tableOfRelationship.getElementsByTagName('tbody')[0]; 
	        while (tableRef.firstChild) {
	            tableRef.removeChild(tableRef.firstChild);
	        }	    	
			for (var key in window.faildedEALayerDictionary) {	
				var newRow   = tableRef.insertRow(tableRef.rows.length);
	           	var newTitleCell  = newRow.insertCell(0);
	        
				var newTitle  = document.createElement('div');
		        newTitle.innerHTML = key;
				newTitleCell.appendChild(newTitle); 	
				failedEAID = failedEAID  + window.hashTitleToEAID[key] + ",";					  
			}  		
			failedEAID = failedEAID.substring(0, failedEAID.length -1);
		}

		if (Object.keys(window.faildedOutsideLayerDictionary).length > 0) {
            enableSendButton();
			var hr = document.getElementById('hrFailedOutsideLayers');
			hr.style.display = '';		
    		var commentFaileOursideLayer = document.getElementById("failedOutsideLayersComment");
    		commentFaileOursideLayer.innerHTML = "Click below to notify the EnviroAtlas administrators of issues with the following web services hosted outside of the EnviroAtlas hosting environment:";

		    var tableOfRelationship = document.getElementById("failedOutLayers");
		    var tableRef = tableOfRelationship.getElementsByTagName('tbody')[0]; 
	        while (tableRef.firstChild) {
	            tableRef.removeChild(tableRef.firstChild);
	        }	    	
			for (var key in window.faildedOutsideLayerDictionary) {	
				var newRow   = tableRef.insertRow(tableRef.rows.length);
	           	var newTitleCell  = newRow.insertCell(0);
	        
				var newTitle  = document.createElement('div');
		        newTitle.innerHTML = key;
				newTitleCell.appendChild(newTitle); 							  
				failedOutsideLayers = failedOutsideLayers + key + ",,,";					  
			}  		
			failedOutsideLayers = failedOutsideLayers.substring(0, failedOutsideLayers.length -3);
		}
	};

    var disableSendButton = function(){
        //$("#sendButton").prop('disabled',true);
        $("#sendButton").hide();
        $("#message").show();
    };
    var enableSendButton = function(){
        //$("#sendButton").prop('disabled',false);
        $("#sendButton").show();
        $("#message").hide();
    };

    var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {

        //name: 'DisplayLayerAddFailure',
        baseClass: 'jimu-widget-displaylayeraddfailure',
        sendEmail: function(){


			  try{
				var xhr = new XMLHttpRequest();
				//xhr.open('GET', "https://v18ovhrttf760.aa.ad.epa.gov/SendEmailOfFailedLayers.py?failedEALayers=" + failedEAID + "&failedOutsideLayers=" + failedOutsideLayers, true);
				if ((failedEAID.length > 0) && (failedOutsideLayers.length > 0)) {
					xhr.open('GET', "https://v18ovhrttf760.aa.ad.epa.gov/SendEmailOfFailed_EA_OutsideLayers.py?failedEALayers=" + failedEAID + "&failedOutsideLayers=" + failedOutsideLayers, true);
				}
				else if (failedEAID.length > 0) {
					xhr.open('GET', "https://v18ovhrttf760.aa.ad.epa.gov/SendEmailOfFailed_EA_OutsideLayers.py?failedEALayers=" + failedEAID, true);
				} 
				else if (failedOutsideLayers.length > 0) {
					xhr.open('GET', "https://v18ovhrttf760.aa.ad.epa.gov/SendEmailOfFailed_EA_OutsideLayers.py?failedOutsideLayers=" + failedOutsideLayers, true);
				} 				
				xhr.send();
                disableSendButton();
			  }
			  catch(error){
				  console.log(error);
			  }
	
		  },
	    onReceiveData: function(name, widgetId, data, historyData) {
	  		updateFailedListOfLayers();
	    },
      	startup: function() {

	        this.inherited(arguments);
	        map = this.map;
	        self = this;
	        updateFailedListOfLayers();
    	}, 	    

    });

    return clazz;
  });
