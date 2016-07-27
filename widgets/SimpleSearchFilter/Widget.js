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
    'esri/symbols/jsonUtils',
     'jimu/WidgetManager',
     'jimu/PanelManager',
    'dijit/layout/AccordionContainer', 
    'dijit/layout/ContentPane',
    'dijit/layout/TabContainer',
    'dijit/form/TextBox',
    'dojox/grid/DataGrid',
    'dojo/data/ItemFileWriteStore',
    'dijit/form/DropDownButton',
    'dijit/TooltipDialog',
    'dijit/form/TextBox'
    
    
  ],
  function(
    declare,
    _WidgetsInTemplateMixin,
    Deferred,
    BaseWidget,
    Dialog,
    esriSymJsonUtils,
    WidgetManager,
    PanelManager) {
    	var singleLayerToBeAddedRemoved = "";
    	var communitySelected = "";
        var   layerData = {
            identifier: "eaID",  //This field needs to have unique values
            label: "name", //Name field for display. Not pertinent to a grid but may be used elsewhere.
            items: []};
    	var layerDataStore = new dojo.data.ItemFileWriteStore({ data:layerData });
    	var SelectableLayerFactory = function(data) {
		    this.eaLyrNum = data.eaLyrNum;
		    this.name = data.name;
		    this.eaDescription = data.eaDescription;		    
		    this.eaDfsLink = data.eaDfsLink;
		    this.eaCategory = data.eaCategory;
		    this.eaID = data.eaID;
		    this.eaMetadata = data.eaMetadata;
		    this.eaScale = data.eaScale;
		}
		var selectableLayerArray = [];
		
		var hashFactsheetLink = {};
		var hashLayerNameLink = {};

		var objectPropInArray = function(list, prop, val) {
		  if (list.length > 0 ) {
		    for (i in list) {
		      if (list[i][prop] === val) {
		        return true;
		      }
		    }
		  }
		  return false;  
		};

    	var dataFactSheet = "https://leb.epa.gov/projects/EnviroAtlas/currentDevelopment/";
		var chkIdDictionary = {};
		  var loadJSON = function(callback){   
	
	        var xobj = new XMLHttpRequest();
	
	        xobj.overrideMimeType("application/json");

        xobj.open('GET', 'widgets/LocalLayer/config.json', true); 

        xobj.onreadystatechange = function () {
              if (xobj.readyState == 4 && xobj.status == "200") {
	                callback(xobj.responseText);
	              }
	        };
	        xobj.send(null);  
	    };    	
		  var loadCommunityJSON = function(callback){   
	
	        var xobj = new XMLHttpRequest();
	
	        xobj.overrideMimeType("application/json");

        xobj.open('GET', 'widgets/LocalLayer/communitymetadata.json', true); 

        xobj.onreadystatechange = function () {
              if (xobj.readyState == 4 && xobj.status == "200") {
	                callback(xobj.responseText);
	              }
	        };
	        xobj.send(null);  
	    }; 	    
	    var _onSelectAllLayers = function() {
			for (var key in chkIdDictionary) {
			  if ((chkIdDictionary.hasOwnProperty(key)) && (document.getElementById(key)!=null) ){
	        	document.getElementById(key).checked = true;
	
			  }
			}
	   };
	    var	_addSelectableLayerSorted = function(items){
    	
			var tableOfRelationship = document.getElementById("tableSelectableLayers");
		    var tableRef = tableOfRelationship.getElementsByTagName('tbody')[0]; 
            while (tableRef.firstChild) {
                tableRef.removeChild(tableRef.firstChild);
            }
            var numOfSelectableLayers = 0;
            var totalNumOfLayers = 0;
            
	    	dojo.forEach(items, function(item) {
	           	totalNumOfLayers = totalNumOfLayers + 1;
	           	var currentLayerSelectable = false;
				eaLyrNum = layerDataStore.getValue( item, 'eaLyrNum');
				eaID = layerDataStore.getValue( item, 'eaID');
				layerName = layerDataStore.getValue( item, 'name');

    			eaDescription = layerDataStore.getValue( item, 'eaDescription');
    			eaDfsLink = layerDataStore.getValue( item, 'eaDfsLink');
    			eaScale = layerDataStore.getValue( item, 'eaScale');
    			eaMetadata = layerDataStore.getValue( item, 'eaMetadata');
    			bSelectByScale = false;
				switch (eaScale) {
					case "NATIONAL":
						var chkScale = document.getElementById("chkNational");
						if(chkScale.checked == true){
							bSelectByScale = true;
						}
						break;
					case "COMMUNITY":
						
						var chkScale = document.getElementById("chkCommunity");
						if(chkScale.checked == true){

							if ((communitySelected == "") || (communitySelected == window.strAllCommunity)){
								bSelectByScale = true;
							}
							else{
								//alert("eaMetadata:" + eaMetadata);
								if (eaMetadata != "") {
									
									if (window.communityMetadataDic.hasOwnProperty(eaMetadata)) {
										//alert("eaMetadata:" + eaMetadata);
										communityInfo = window.communityMetadataDic[eaMetadata];
										if (communityInfo.hasOwnProperty(communitySelected)) {
											bSelectByScale = true;
										}
									}
								}
							}
						}
						break;

				}    			
				eaCategory = layerDataStore.getValue( item, 'eaCategory');

				eachLayerCategoryList = eaCategory.split(";");
				if (bSelectByScale) {
					for (i in eachLayerCategoryList) {
						
						enumCategoryForCurrentLayer = eachLayerCategoryList[i].split("-");
						if(window.categoryDic[enumCategoryForCurrentLayer[0].trim()] != undefined){
						
							var chkCategery = document.getElementById(window.chkCategoryPrefix+window.categoryDic[enumCategoryForCurrentLayer[0].trim()]);
							if(chkCategery.checked == true){
								supplyDemandList = enumCategoryForCurrentLayer[1].trim().split(",");
								
								
								for (j in supplyDemandList) {
									
									var chkSupplyDemand = document.getElementById(supplyDemandList[j].trim().replace(" ",""));		
									if 	(chkSupplyDemand != null)	{											
										if (chkSupplyDemand.checked == true) {								
											currentLayerSelectable = true;																
										}
									}
								}
							}
						}
					}   //end of for (i in eachLayerCategoryList)		
				}// end of if (bSelectByScale)
				
				if (currentLayerSelectable) {//add the current item as selectable layers
					if ((window.allLayerNumber.indexOf(eaID)) == -1) {                        	
                    	window.allLayerNumber.push(eaID);
                    }
					numOfSelectableLayers = numOfSelectableLayers + 1;
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
			
			       	chkIdDictionary[chkboxId] = layerName;
			        var newCell  = newRow.insertCell(1);
			        newCell.style.verticalAlign = "top";//this will put layer name on first line
			        
					var newTitle  = document.createElement('div');
			        newTitle.innerHTML = layerName;
			        newTitle.title = eaDescription;
			        
					// add the category icons				
					if (!(document.getElementById("hideIcons").checked)) {
				        var photo = document.createElement("td");
						var ulElem = document.createElement("ul");
						
						ulElem.setAttribute("id", "navlistSearchfilter");					
						var liHomeElem = null;
						var aHomeElem = null;
						indexImage = 0;
						for (var key in window.categoryDic) {
				
						    liElem = document.createElement("li");
							liElem.style.left = (indexImage*20).toString() + "px";
							liElem.style.top = "-10px";
							aElem = document.createElement("a");
							aElem.title  = key;
							liElem.appendChild(aElem);
							ulElem.appendChild(liElem);							
							if (eaCategory.indexOf(key) !=-1) {
								console.log("bji new Mar 2016");
								liElem.setAttribute("id",window.categoryDic[key]);
							}
							else {
								liElem.setAttribute("id",window.categoryDic[key] + "_bw");
							}
							indexImage = indexImage + 1;
						}
				        photo.appendChild(ulElem);			        	
						newTitle.appendChild(photo);
		        	}

					// end of adding the category icons	
					newCell.appendChild(newTitle);
					
					var newButtonInfoCell  = newRow.insertCell(2);
					var buttonInfo = document.createElement('input');
					buttonInfo.type = "button";
			        var buttonInfoId = "but" + eaID;
					buttonInfo.name = buttonInfoId;
					buttonInfo.id = buttonInfoId;
					buttonInfo.value = "i";
					buttonInfo.style.height = "16px";
					buttonInfo.style.width = "16px";
					buttonInfo.style.lineHeight = "3px";//to set the text vertically center
					
					newButtonInfoCell.style.verticalAlign = "top";//this will put checkbox on first line
			        newButtonInfoCell.appendChild(buttonInfo);  
			        hashFactsheetLink[buttonInfoId] = eaDfsLink;
			        hashLayerNameLink[buttonInfoId] = layerName;
			        document.getElementById(buttonInfoId).onclick = function(e) {
				        //window.open(dataFactSheet + selectableLayerArray[i]['eaDfsLink']);//this will open the wrong link
				        if (hashFactsheetLink[this.id] == "N/A") {
			        		var dataFactNote = new Dialog({
						        title: hashLayerNameLink[this.id],
						        style: "width: 300px",    
					    	});
					        dataFactNote.show();
					        dataFactNote.set("content", "Data fact sheet link is not available!");
			
				        } else {
				        	window.open(dataFactSheet + hashFactsheetLink[this.id]);
				        }		      
				    };    	
				}//end of if (currentLayerSelectable)           
        });	
	       
 		dojo.byId("numOfLayers").value = " " + String(numOfSelectableLayers) + " of " + String(totalNumOfLayers) + " Maps";
    	dojo.byId("selectAllLayers").checked = false;
		for (var key in chkIdDictionary) {
			
		  if ((chkIdDictionary.hasOwnProperty(key)) && (document.getElementById(key)!=null) ){
		  	document.getElementById(key).addEventListener('click', function() {
		  		
				if (this.checked){
					singleLayerToBeAddedRemoved = "a" + "," + this.getAttribute("id").replace("ck", "");
					document.getElementById('butAddSingleLayer').click();
				}
				else{
					singleLayerToBeAddedRemoved = "r" + "," + this.getAttribute("id").replace("ck", "");
					document.getElementById('butAddSingleLayer').click();
				}				
		    });
		  }
		}    	
	};	   
	
	var	_updateSelectableLayer = function(){	
		layerDataStore.fetch({
			sort: {attribute: 'eaDfsLink', descending: false},
			onComplete: _addSelectableLayerSorted
		});
	};
    var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {

        //name: 'eBasemapGallery',
        baseClass: 'jimu-widget-simplesearchfilter',
		onReceiveData: function(name, widgetId, data, historyData) {
			if (name == 'SelectCommunity'){
				communitySelected = data.message;
				_updateSelectableLayer();
			}		  
		},
		
        displayCategorySelection: function() {
		
	        var tableOfRelationship = document.getElementById('categoryTable');
		    var tableRef = tableOfRelationship.getElementsByTagName('tbody')[0];    	
		    indexImage = 0;
		    for (var key in window.categoryDic) {

	    	    var newRow   = tableRef.insertRow(tableRef.rows.length);
	    	    
               	newRow.style.height = "20px";
               	var newCheckboxCell  = newRow.insertCell(0);
               	var checkbox = document.createElement('input');
				checkbox.type = "checkbox";
                chkboxId = window.chkCategoryPrefix + window.categoryDic[key];
				checkbox.name = chkboxId;
				checkbox.value = 0;
				checkbox.id = chkboxId;
				checkbox.className ="cmn-toggle cmn-toggle-round-flat";
		        newCheckboxCell.appendChild(checkbox);    
		        var label = document.createElement('label');
		        label.setAttribute("for",chkboxId);
				label.innerHTML = "";
				newCheckboxCell.appendChild(label);
				
				checkbox.addEventListener('click', function() {
					_updateSelectableLayer();
			    });
				
				/// add category images:
				var newCell  = newRow.insertCell(1);
		        newCell.style.verticalAlign = "top";//this will put layer name on first line
		        
		        var photo = document.createElement("td");
				var ulElem = document.createElement("ul");
				ulElem.setAttribute("id", "navlistSearchfilter2");
				var newTitle  = document.createElement('div');		        
				var liHomeElem = null;
				var aHomeElem = null;
				indexImage = 0;
			    liElem = document.createElement("li");
				liElem.style.left =  "3px";
				liElem.style.top = "-10px";
				aElem = document.createElement("a");
				aElem.title  = key;
				liElem.appendChild(aElem);
				ulElem.appendChild(liElem);							

				liElem.setAttribute("id",window.categoryDic[key] + "2");
			
		        photo.appendChild(ulElem);
				newTitle.appendChild(photo);
				newCell.appendChild(newTitle);
				
				/// add category title:
               	var newTitleCell  = newRow.insertCell(2);
				var title = document.createElement('label');
				title.innerHTML = key;    
				newTitleCell.appendChild(title);        

			}
			document.getElementById("Supply").onclick = function() {
			    _updateSelectableLayer();
			};
			document.getElementById("Demand").onclick = function() {
			    _updateSelectableLayer();
			};	
			document.getElementById("Driver").onclick = function() {
			    _updateSelectableLayer();
			};
			document.getElementById("SpatiallyExplicit").onclick = function() {
			    _updateSelectableLayer();
			};		
			document.getElementById("hideIcons").onclick = function() {
			    _updateSelectableLayer();
			};					
			document.getElementById("selectAllLayers").onclick = function() {
				if (this.checked){
				    _onSelectAllLayers();
				    document.getElementById('butAddAllLayers').click();
			    }
			};
			//on hide and show Benefit Categories, enlarge selectable layers
			document.getElementById("hide1").onclick = function() {
			    document.getElementById('tableSelectableLayersArea').style.height = "340px";
			    //document.getElementById('tableSelectableLayersArea').style.height = '20%';
			};	
			document.getElementById("show1").onclick = function() {
			    document.getElementById('tableSelectableLayersArea').style.height = "550px";
			    //document.getElementById('tableSelectableLayersArea').style.height = '70%';
			};					
			layersToBeAdded = "a";
	    

    	},
	displayGeographySelection: function() {
        var tableOfRelationship = document.getElementById('geographyTable');
	    var tableRef = tableOfRelationship.getElementsByTagName('tbody')[0];    	
	    indexImage = 0;
	    
		//add row of National geography
	    var newRow   = tableRef.insertRow(tableRef.rows.length);	    
       	newRow.style.height = "20px";
       	var newCheckboxCell  = newRow.insertCell(0);
       	var checkbox = document.createElement('input');
		checkbox.type = "checkbox";
        chkboxId = "chkNational";
		checkbox.name = chkboxId;
		checkbox.id = chkboxId;
		checkbox.className ="cmn-toggle cmn-toggle-round-flat";
        newCheckboxCell.appendChild(checkbox);    
        var label = document.createElement('label');
        label.setAttribute("for",chkboxId);
		label.innerHTML = "";
		newCheckboxCell.appendChild(label);
		
		checkbox.addEventListener('click', function() {
			_updateSelectableLayer();
	    });				
		/// add National title:
       	var newTitleCell  = newRow.insertCell(1);
		var title = document.createElement('label');
		title.innerHTML = "National";    
		newTitleCell.appendChild(title);        

		//add row of Community geography
	    var newRow   = tableRef.insertRow(tableRef.rows.length);	    
       	newRow.style.height = "20px";
       	var newCheckboxCell  = newRow.insertCell(0);
       	var checkbox = document.createElement('input');
		checkbox.type = "checkbox";
        chkboxId = "chkCommunity";
		checkbox.name = chkboxId;
		checkbox.checked = true;
		checkbox.id = chkboxId;
		checkbox.className ="cmn-toggle cmn-toggle-round-flat";
        newCheckboxCell.appendChild(checkbox);    
        var label = document.createElement('label');
        label.setAttribute("for",chkboxId);
		label.innerHTML = "";
		newCheckboxCell.appendChild(label);
		
		checkbox.addEventListener('click', function() {
			_updateSelectableLayer();
        	if (!this.checked){
				var btn = document.getElementById("butSelectOneCommunity"); 
				btn.disabled = true;	
        	} else {
				var btn = document.getElementById("butSelectOneCommunity"); 
				btn.disabled = false;        		
        	}		
	    });				
		/// add Community title:
       	var newTitleCell  = newRow.insertCell(1);
		var title = document.createElement('label');
		title.innerHTML = "Community";    
		newTitleCell.appendChild(title); 
		
		var newButtonInfoCell  = newRow.insertCell(2);
		var buttonInfo = document.createElement('input');
		buttonInfo.type = "button";
        var buttonInfoId = "butSelectOneCommunity";
		buttonInfo.name = buttonInfoId;
		buttonInfo.id = buttonInfoId;
		buttonInfo.value = "+/-";
		buttonInfo.style.height = "16px";
		buttonInfo.style.width = "28px";
		buttonInfo.style.lineHeight = "3px";//to set the text vertically center
		
		newButtonInfoCell.style.verticalAlign = "center";//this will put checkbox on first line
        newButtonInfoCell.appendChild(buttonInfo);  
        document.getElementById(buttonInfoId).onclick = function(e) {
        	alert("select one community");

   			document.getElementById('butOpenSelectCommunityWidget').click();
			
	    };   		  		

	},
        startup: function() {

	        this.inherited(arguments);
	      	this.fetchDataByName('SelectCommunity');
	                     
	        loadJSON(function(response) {
	            var localLayerConfig = JSON.parse(response);
	            var arrLayers = localLayerConfig.layers.layer;
	            console.log("arrLayers.length:" + arrLayers.length);
	            for (index = 0, len = arrLayers.length; index < len; ++index) {
	            //for (index = 0, len = 409; index < len; ++index) {
	            	//console.log("index:" + index);
	                layer = arrLayers[index];                          
	                var indexCheckbox = 0;

	                    if(layer.hasOwnProperty('eaID')) {
	                    	eaID = layer.eaID.toString();
	                    	if (eaID.trim() != "") {
		                    	
		                    	if(layer.hasOwnProperty('eaLyrNum')){
		                        	eaLyrNum = layer.eaLyrNum.toString();
		                        }
		                        else {
		                        	eaLyrNum = "";
		                        }
		                        
		                    	if(layer.hasOwnProperty('name') && (layer.name != null)){
		                    		//if (layer.name == null) {
		                    		//	console.log("eaID:" + eaID + " with layer name null");
		                    		//}
		                        	name = layer.name.toString();
		                        }
		                        else {
		                        	name = "";
		                        }
		                    	if(layer.hasOwnProperty('eaDescription')){
		                        	eaDescription = layer.eaDescription.toString();
		                        }
		                        else {
		                        	eaDescription = "";
		                        }
		                        if(layer.hasOwnProperty('eaDfsLink')){
		                        	eaDfsLink = layer.eaDfsLink.toString();
		                        }
		                        else {
		                        	eaDfsLink = "";
		                        }
		                        if(layer.hasOwnProperty('eaMetadata')){
		                        	eaMetadata = layer.eaMetadata.toString();
		                        }
		                        else {
		                        	eaMetadata = "";
		                        }
		                        if(layer.hasOwnProperty('eaScale')){
		                        	eaScale = layer.eaScale.toString();
		                        }
		                        else {
		                        	eaScale = "";
		                        }		                        
							    var eaCategoryWhole =  "";
							    if(layer.hasOwnProperty('eaBCSDD')){
							    	for (categoryIndex = 0, lenCategory = layer.eaBCSDD.length; categoryIndex < lenCategory; ++categoryIndex) {
							    		eaCategoryWhole = eaCategoryWhole + layer.eaBCSDD[categoryIndex] + ";";
							    	}
							    }
							    eaCategoryWhole = eaCategoryWhole.substring(0, eaCategoryWhole.length - 1);
							    //console.log("eaCategoryWhole: "+ eaCategoryWhole);
							    
							    var layerItem = {eaLyrNum: eaLyrNum, name: name, eaDescription: eaDescription, eaDfsLink: eaDfsLink, eaCategory: eaCategoryWhole, eaID: layer.eaID, eaMetadata: eaMetadata, eaScale: eaScale};
		
								layerDataStore.newItem(layerItem);
							    
						    }// end of if (eaID.trim() != "")
	                    }// end of if(layer.hasOwnProperty('eaID'))                	
	                
	            }
	        });// end of loadJSON(function(response)
	        loadCommunityJSON(function(response){
	        	var community = JSON.parse(response);

	            for (index = 0, len = community.length; index < len; ++index) {
	            	currentMetadataCommunityIndex = community[index];
	            	singleCommunityMetadataDic = {};
	            	for (var key in window.communityDic) {
	            		if(currentMetadataCommunityIndex.hasOwnProperty(key)) {
	            			singleCommunityMetadataDic[key] = currentMetadataCommunityIndex[key];
	            		}
	            	}

	            	window.communityMetadataDic[currentMetadataCommunityIndex.MetaID_Community] = singleCommunityMetadataDic;
	            }
	        }); // end of loadCommunityJSON(function(response)
			this.displayCategorySelection();			
			this.displayGeographySelection();
	    },               

	    _onSingleLayerClick: function() {
		    this.publishData({
		        message: singleLayerToBeAddedRemoved
		    });
		},
	    _onViewActiveLayersClick: function() {

			//var sideBar =  wm.getWidgetById('themes_TabTheme_widgets_SidebarController_Widget_20');
			//sideBar.selectTab(0);				

			this.openWidgetById('widgets_SelectCommunity_29');
			var wm = WidgetManager.getInstance();			
			widget = wm.getWidgetById('widgets_SelectCommunity_29');
			if (widget != undefined){
				var pm = PanelManager.getInstance();   
				pm.showPanel(widget);  
			}    
	    },	
	    _onAddLayersClick: function() {
	
	        layersToBeAdded = "a";
			for (var key in chkIdDictionary) {
			  if ((chkIdDictionary.hasOwnProperty(key)) && (document.getElementById(key)!=null) ){
			  	if (document.getElementById(key).checked) {
	            	layersToBeAdded = layersToBeAdded + "," + key.replace("ck", "");
	        	}
			  }
			}
	        this.publishData({
		        message: layersToBeAdded
		    });
		    this.i ++;
	    },
	    
	    _onRemoveLayersClick: function() {
	        layersToBeRemoved = "r";
			for (var key in chkIdDictionary) {
			  if (chkIdDictionary.hasOwnProperty(key)) {
			  	if (document.getElementById(key).checked) {
	            	layersToBeRemoved = layersToBeRemoved + "," + key.replace("ck", "") ;
	        	}
			  }
			}
	        this.publishData({
		        message: layersToBeRemoved
		    });
		    this.i ++;
	    },
    });

    return clazz;
  });
