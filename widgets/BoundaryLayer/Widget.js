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


	var chkIdBoundaryDictionary = {};
	var map;
	var self;
    var showLayerListWidget = function(){
        var widgetName = 'LayerList';
        var widgets = self.appConfig.getConfigElementsByName(widgetName);
        var pm = PanelManager.getInstance();
        pm.showPanel(widgets[0]);	   	
    }; 	    
    var _onSelectAllLayers = function() {
		for (var key in chkIdBoundaryDictionary) {
		  if ((chkIdBoundaryDictionary.hasOwnProperty(key)) && (document.getElementById(key)!=null) ){
        	document.getElementById(key).checked = true;	
        	if ("createEvent" in document) {
		        var evt = document.createEvent("HTMLEvents");
		        evt.initEvent("change", false, true);
		        document.getElementById(key).dispatchEvent(evt);
		    } else {
		        document.getElementById(key).fireEvent("onchange");
		    }
		  }
		}
    };



    var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {

        //name: 'eBasemapGallery',
        baseClass: 'jimu-widget-boundarylayer',
		updateBoundaryLayers: function(){	
			var tableOfRelationship = document.getElementById("tableBoundaryLayers");
		    var tableRef = tableOfRelationship.getElementsByTagName('tbody')[0]; 
	        while (tableRef.firstChild) {
	            tableRef.removeChild(tableRef.firstChild);
	        }
	
	        var arrLayers = this.config.layers.layer;
	
	        for (index = 0, len = arrLayers.length; index < len; ++index) {
	        //for (index = 0, len = 1; index < len; ++index) {
	            layer = arrLayers[index];                          
	            var indexCheckbox = 0;
	
	            if(layer.hasOwnProperty('eaID')) {
	            	eaID = layer.eaID.toString();
	            	if (eaID.trim() != "") {
		                    	
						if ((window.allLayerNumber.indexOf(eaID)) == -1) {                        	
	                    	window.allLayerNumber.push(eaID);
	                    }
				       	var newRow   = tableRef.insertRow(tableRef.rows.length);
				       	newRow.style.height = "38px";
				       	var newCheckboxCell  = newRow.insertCell(0);
						var checkbox = document.createElement('input');
						checkbox.type = "checkbox";
				
				        chkboxId = "ck" + eaID;
						checkbox.name = chkboxId;
						checkbox.value = 1;
						checkbox.id = chkboxId;
						newCheckboxCell.style.verticalAlign = "top";//this will put checkbox on first line
				        newCheckboxCell.appendChild(checkbox);    			              
				       	chkIdBoundaryDictionary[chkboxId] = layer;
	
				       	var newTitleCell  = newRow.insertCell(1);
						var title = document.createElement('label');
						title.innerHTML = layer.name;    
						newTitleCell.appendChild(title); 			    
				    }// end of if (eaID.trim() != "")
	            }// end of if(layer.hasOwnProperty('eaID'))                	
	
	        }// end of for (index = 0, len = arrLayers.length; index < len; ++index) 
		
	    	
			for (var key in chkIdBoundaryDictionary) {
				
			  if ((chkIdBoundaryDictionary.hasOwnProperty(key)) && (document.getElementById(key)!=null) ){
			  	document.getElementById(key).addEventListener('change', function() {
			  		var lOptions ={};
			  		
					if (this.checked){
						var	layer = chkIdBoundaryDictionary[this.getAttribute("id")];
		              	bPopup = true;
		                var _popupTemplate;
		                if (layer.popup){
		                  if (layer.popup.fieldInfos) {
		                  	fieldInfos = layer.popup.fieldInfos;
		                  	if(fieldInfos[0].hasOwnProperty('fieldName')) {
		                  		if (fieldInfos[0].fieldName ==null) {
		                  			bPopup = false;
		                  		}
		                  	}
		                  	else {
		                  		bPopup = false;
		                  	}
		                  }
		                  else {
		                  	bPopup = false;
		                  }
		                  if (bPopup) {
			                  _popupTemplate = new PopupTemplate(layer.popup);
			                  lOptions.infoTemplate = _popupTemplate;                  	
		                  }
		                  else {
		                  	console.log("layer.eaID: " + + layer.eaID.toString() + " with no popup info defined");
		                  }
		
		                }
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
		                  //lLayer = new FeatureLayer(layer.url + "/" + layer.eaLyrNum.toString(), lOptions);
		                  lLayer = new ArcGISDynamicMapServiceLayer(layer.url);
		                }
		                else {
		                	lLayer = new FeatureLayer(layer.url , lOptions);
		                }
		                
					    dojo.connect(lLayer, "onError", function(error){
					       alert ("There is a problem on loading layer:"+lLayer.title);
					    });		                
	
		                if(layer.name){
		                  lLayer._titleForLegend = layer.name;
		                  lLayer.title = layer.name;
		                  lLayer.noservicename = true;
		                }
		                lLayer.on('load',function(evt){
		                  evt.layer.name = lOptions.id;
		                });                
	
		                lLayer.id = window.layerIdPrefix + this.getAttribute("id").replace("ck", "");	
		                lLayer.setVisibility(false);//turn off the layer when first added to map and let user to turn on	
	
						map.addLayer(lLayer);

						showLayerListWidget();	

				
	
					}
					else{
						lyrTobeRemoved = map.getLayer(window.layerIdPrefix + this.getAttribute("id").replace("ck", ""));
						map.removeLayer(lyrTobeRemoved);
					}				
			    });
			  }
			}  		
		},
      	startup: function() {

	        this.inherited(arguments);
	        map = this.map;
	        self = this;
	        this.updateBoundaryLayers();
	        
	        
	        /*dojo.byId("selectAllBoundary").checked = false;	        
	        document.getElementById("selectAllBoundary").onclick = function() {
				if (this.checked){
			    	_onSelectAllLayers();
				    
			    }
			};*/
    	}, 	    

    });

    return clazz;
  });
