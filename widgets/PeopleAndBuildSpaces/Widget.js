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
    PopupTemplate) {
		var chkIdPBSDictionary = {};
		var arrLayers = null;
		var map = null;
		var self = null;
		
		var updateSelectablePBSLayersArea = function (){

	    	if (navigator.userAgent.indexOf("Chrome")>=0) {
	    		document.getElementById('tablePBSLayersArea').style.height = "calc(100% - 140px)"; 
	    	} else if(navigator.userAgent.indexOf("Firefox")>=0) {
	    		document.getElementById('tablePBSLayersArea').style.height = "calc(100% - 140px)"; 
	    	} else {
	    		document.getElementById('tablePBSLayersArea').style.height = "calc(100% - 140px)"; 
	    	}		    					
	    };	
	   	
	   var showLayerListWidget = function(){
	        var widgetName = 'LayerList';
	        var widgets = self.appConfig.getConfigElementsByName(widgetName);
	        var pm = PanelManager.getInstance();
	        pm.showPanel(widgets[0]);	   	
	   } 	    
	    var _onSelectAllLayers = function() {
			for (var key in chkIdDemographicsDictionary) {
			  if ((chkIdDemographicsDictionary.hasOwnProperty(key)) && (document.getElementById(key)!=null) ){
	        	document.getElementById(key).checked = true;	
			  }
			}
	    };
	    var updateSelectablePBSlayers = function() {
			var tableOfRelationship = document.getElementById("tablePBSLayers");
		    var tableRef = tableOfRelationship.getElementsByTagName('tbody')[0]; 
            while (tableRef.firstChild) {
                tableRef.removeChild(tableRef.firstChild);
            }            

            var numOfSelectablePBSLayers = 0;
            var totalNumOfPBSLayers = 0;

            for (index = 0, len = arrLayers.length; index < len; ++index) {
                layer = arrLayers[index];                          
                var indexCheckbox = 0;
				if (layer.hasOwnProperty('eaTopic')) {
	                if(layer.hasOwnProperty('eaID')) {
	                	eaID = layer.eaID.toString();
	                	if (eaID.trim() != "") {
			                    	
							if ((window.allLayerNumber.indexOf(eaID)) == -1) {                        	
		                    	window.allLayerNumber.push(eaID);
		                    }
		                    var chkboxTopicId = window.chkTopicPBSPrefix + window.topicDicPBS[layer.eaTopic];
					        var checkboxTopic = document.getElementById(chkboxTopicId);		
					        totalNumOfPBSLayers = totalNumOfPBSLayers + 1;	
					        if((checkboxTopic != null) && (checkboxTopic.checked == true)){					        	
					         	numOfSelectablePBSLayers = numOfSelectablePBSLayers + 1;
						       	var newRow   = tableRef.insertRow(tableRef.rows.length);
						       	newRow.style.height = "38px";
						       	var newCheckboxCell  = newRow.insertCell(0);
								var checkbox = document.createElement('input');
								checkbox.type = "checkbox";
						
						        chkboxId = "ck" + eaID;
						        chkIdPBSDictionary[chkboxId] = layer;  						        
								checkbox.name = chkboxId;
								checkbox.value = 1;
								checkbox.id = chkboxId;
						        newCheckboxCell.appendChild(checkbox);    			              
			
						       	var newTitleCell  = newRow.insertCell(1);
								var title = document.createElement('label');
								title.innerHTML = layer.name;  
								title.title = layer.eaDescription;  
								newTitleCell.appendChild(title); 		
							}	    
					    }// end of if (eaID.trim() != "")
	                }// end of if(layer.hasOwnProperty('eaID'))           
                }// end of if (layer.hasOwnProperty('eaTopic')...     	

            }// end of for (index = 0, len = arrLayers.length; index < len; ++index) 	 
			for (var key in chkIdPBSDictionary) {
				
			  if ((chkIdPBSDictionary.hasOwnProperty(key)) && (document.getElementById(key)!=null) ){
			  	document.getElementById(key).addEventListener('click', function() {
			  		
					if (this.checked){

						var	layer = chkIdPBSDictionary[this.getAttribute("id")];
		              	
		                var _popupTemplate;	
		                var lOptions ={};
	
		                if(layer.hasOwnProperty('mode')){
		                  var lmode;
		                  if(layer.mode === 'ondemand'){
		                    lmode = 1;
		                  }else if(layer.mode === 'snapshot'){
		                    lmode = 0;
		                  }else if(layer.mode === 'selection'){
		                    lmode = 2;
		                  }
		                  lOptions.mode = lmode;
		                }
		                lOptions.outFields = ['*'];
		                if(layer.hasOwnProperty('autorefresh')){
		                  lOptions.refreshInterval = layer.autorefresh;
		                }
		                if(layer.hasOwnProperty('showLabels')){
		                  lOptions.showLabels = true;
		                }
						
						var lLayer;
	
		                if(layer.hasOwnProperty('eaLyrNum')){
		                  lLayer = new FeatureLayer(layer.url + "/" + layer.eaLyrNum.toString(), lOptions);
		                  //lLayer = new ArcGISDynamicMapServiceLayer(layer.url);
		                }
		                else {
		                	lLayer = new FeatureLayer(layer.url , lOptions);
		                }
			                
					    //dojo.connect(lLayer, "onError", function(error){
					    //   alert ("There is a problem on loading layer:"+layer.name);
					    //});		                
	
		                if(layer.name){
		                  lLayer._titleForLegend = layer.name;
		                  lLayer.title = layer.name;
		                  lLayer.noservicename = true;
		                }	      
	
		                lLayer.id = window.layerIdPBSPrefix + this.getAttribute("id").replace("ck", "");	
		                lLayer.setVisibility(false);//turn off the layer when first added to map and let user to turn on	
	
						map.addLayer(lLayer);					    					
						showLayerListWidget();
					}
					else{
						layerTobeRemoved = map.getLayer(window.layerIdPBSPrefix + this.getAttribute("id").replace("ck", ""));
						map.removeLayer(layerTobeRemoved);
					}				
			    });
			  }
			}               
			dojo.byId("numOfPBSLayers").value = " " + String(numOfSelectablePBSLayers) + " of " + String(totalNumOfPBSLayers) + " Maps"; 	
	    	updateSelectablePBSLayersArea();
	    }; 	

    var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {

        //name: 'eBasemapGallery',
        baseClass: 'jimu-widget-demographicslayer',

      startup: function() {

        this.inherited(arguments);
        map = this.map;
        arrLayers = this.config.layers.layer;
        self = this;
        
        var tableOfRelationship = document.getElementById('categoryTablePBS');
	    var tableRef = tableOfRelationship.getElementsByTagName('tbody')[0];   
		var keys = Object.keys(window.topicDicPBS);
	    for (i=0; i<keys.length; i++) {
	    	newRow = tableRef.insertRow(tableRef.rows.length);
			newRow.style.height = "20px";
	           	var newCheckboxCell  = newRow.insertCell(0);
	           	var checkbox = document.createElement('input');
				checkbox.type = "checkbox";
				
		        chkboxId = window.chkTopicPBSPrefix + window.topicDicPBS[keys[i]];
	
				checkbox.name = chkboxId;
				checkbox.value = 0;
				checkbox.id = chkboxId;
				checkbox.className ="cmn-toggle-PBS cmn-toggle-PBS-round-flat";
		        newCheckboxCell.appendChild(checkbox);    
		        var label = document.createElement('label');
		        label.setAttribute("for",chkboxId);
				label.innerHTML = "";
				newCheckboxCell.appendChild(label);
	
				checkbox.addEventListener('change', function() {
					updateSelectablePBSlayers();
			
				});
				/// add category title:
	           	var newTitleCell  = newRow.insertCell(1);
	           	newTitleCell.style.width = "100%"
	        
				var title = document.createElement('label');
				title.innerHTML = keys[i];    
				newTitleCell.appendChild(title); 
			}

    }, 	    

    });

    return clazz;
  });

