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
    BaseWidget,
    Dialog,
    WidgetManager,
    PanelManager,
    FeatureLayer,
    PopupTemplate,
    ArcGISDynamicMapServiceLayer) {


	
	var map;
	var self;
   
    var updateFailedListOfLayers = function(){	
    	var comment = document.getElementById("failedLayersComment");
    	if (Object.keys(window.faildedLayerDictionary).length == 0) {    		
    		comment.innerHTML = "All layers added to the map so far have been successful";    		
    	} else{
    		comment.innerHTML = "The following layers could not be added to map:";
    	}
	    var tableOfRelationship = document.getElementById("failedLayers");
	    var tableRef = tableOfRelationship.getElementsByTagName('tbody')[0]; 
        while (tableRef.firstChild) {
            tableRef.removeChild(tableRef.firstChild);
        }	    	
		for (var key in window.faildedLayerDictionary) {	
			var newRow   = tableRef.insertRow(tableRef.rows.length);
           	var newTitleCell  = newRow.insertCell(0);
        
			var newTitle  = document.createElement('div');
	        newTitle.innerHTML = key;
			newTitleCell.appendChild(newTitle); 							  
		}  		
	};



    var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {

        //name: 'DisplayLayerAddFailure',
        baseClass: 'jimu-widget-displaylayeraddfailure',
        
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
