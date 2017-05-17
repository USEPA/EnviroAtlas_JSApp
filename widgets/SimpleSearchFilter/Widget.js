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
     'esri/geometry/Extent',
	 'esri/symbols/SimpleLineSymbol',
	 'esri/symbols/SimpleFillSymbol',
	 'esri/renderers/SimpleRenderer',
	 'esri/tasks/QueryTask',
     'esri/tasks/query',
	 'esri/graphic',
	 'esri/Color',
	 'esri/renderers/ClassBreaksRenderer',     
    'dijit/layout/AccordionContainer', 
    'dijit/layout/ContentPane',
    'dijit/layout/TabContainer',
    'dijit/form/TextBox',
    'dojox/grid/DataGrid',
    'dojo/data/ItemFileWriteStore',
    'dijit/form/DropDownButton',
    'dijit/TooltipDialog',
    'dijit/form/TextBox',
    'dijit/TitlePane'
    
  ],
  function(
    declare,
    _WidgetsInTemplateMixin,
    Deferred,
    BaseWidget,
    Dialog,
    esriSymJsonUtils,
    WidgetManager,
    PanelManager,
    Extent,
    SimpleLineSymbol,
    SimpleFillSymbol,
    SimpleRenderer,
    QueryTask,
    query,
    graphic,
    Color,
    ClassBreaksRenderer) {
    	var singleLayerToBeAddedRemoved = "";
    	var bNoTopicSelected = false;
    	var communitySelected = "";
    	var self;
    	var arrLayersToChangeSynbology = [];
        var   layerData = {
            identifier: "eaID",  //This field needs to have unique values
            label: "name", //Name field for display. Not pertinent to a grid but may be used elsewhere.
            items: []};
    	var layerDataStore = new dojo.data.ItemFileWriteStore({ data:layerData });
    	var featuresCollection = [];
    	var arrLayersForPopup = [];
    	var addSingleFeatureForPopup = function(eaID, clickEvt) {
    		
			var selectQuery = new query();
            selectQuery.geometry = clickEvt.mapPoint;
            selectQuery.returnGeometry = true;
            selectQuery.spatialRelationship = query.SPATIAL_REL_INTERSECTS;            
            
            var queryTask = new QueryTask(window.hashURL[eaID]);
            popupField = window.hashPopup[eaID].fieldInfos[0]["fieldName"];
            popupFieldName = window.hashPopup[eaID].fieldInfos[0]["label"];
            popupTitle = window.hashPopup[eaID].title.split(":");
            selectQuery.outFields = ["*"];
            selectQuery.outFields = [popupField, popupTitle[1].trim().replace("{","").replace("}","")];
            
            queryTask.execute(selectQuery, function (features) {
            	if (window.hashPopup[eaID] != undefined) {
										
					//Performance enhancer - assign featureSet array to a single variable.
					var resultFeatures = features.features;
					var symbol = new SimpleFillSymbol(
	                  SimpleFillSymbol.STYLE_NULL, 
	                  new SimpleLineSymbol(
	                    SimpleLineSymbol.STYLE_SOLID, 
	                    new Color([0, 0, 200, 255]), 
	                    1
	                  ),
	                  new Color([215, 215, 215,255])
	                );
				
					//Loop through each feature returned
					for (var i=0, il=resultFeatures.length; i<il; i++) {
						var content = "<b>" + popupTitle[0] + "</b>: $" + popupTitle[1].trim() + "<hr>"+"<b>" + popupFieldName + "</b>: ${" + popupField + "}";			
						var infoTemplate = new esri.InfoTemplate(popupFieldName, content);
					
					    var graphic = resultFeatures[i];
					    graphic.setSymbol(symbol);
					    graphic.setInfoTemplate(infoTemplate);
					    featuresCollection.push(graphic);
					
					    self.map.graphics.add(graphic);
					}

					if 	(arrLayersForPopup.length > 0){
	        			addSingleFeatureForPopup(arrLayersForPopup.pop(),clickEvt);
	        		}
	        		else {
	        			if 	(featuresCollection.length > 0){
			    			self.map.infoWindow.setFeatures(featuresCollection);
							self.map.infoWindow.show(clickEvt.mapPoint);
						}
					}
                }
            }); 	
    	};
    	
    	var setClickEvent = function(){    		

    		intersect = self.map.on("click", function(evt) {
    			self.map.graphics.clear();
    			featuresCollection = [];
    			arrLayersForPopup = [];
	    		for (i in window.allLayerNumber) {  
	    			bVisibleFL = false;
	    			bVisibleTL = false;
	    			  		
		    		lyrFL = self.map.getLayer(window.layerIdPrefix + window.allLayerNumber[i]);		    		
		    		if (lyrFL != null) {		    			
						if (lyrFL.visible == true){
							bVisibleFL = true;
						}
					}

					lyrTL = self.map.getLayer(window.layerIdTiledPrefix + window.allLayerNumber[i]);
		    		if (lyrTL != null) {		    			
						if (lyrTL.visible == true){
							bVisibleTL = true;							
						}
					}		
					
					if ((bVisibleFL == true) || (lyrTL == true)) {
						arrLayersForPopup.push(window.allLayerNumber[i]);
					}		    		
		    	}
		    	//start to popup for first layer:
		    	addSingleFeatureForPopup(arrLayersForPopup.pop(),evt);         
    		})
    	};
    	var SelectableLayerFactory = function(data) {
		    this.eaLyrNum = data.eaLyrNum;
		    this.name = data.name;
		    this.eaDescription = data.eaDescription;		    
		    this.eaDfsLink = data.eaDfsLink;
		    this.eaCategory = data.eaCategory;
		    this.eaID = data.eaID;
		    this.eaMetadata = data.eaMetadata;
		    this.eaScale = data.eaScale;
		    this.eaTags = data.eaTags;
		    this.eaTopic = data.eaTopic
		}
		var selectableLayerArray = [];
		var dicTopicSelected = {};
		hiderows = {};
		
		var hashFactsheetLink = {};
		var hashLayerNameLink = {};
		var hashDescriptionforI = {};
		
		var hashLayerName = {};
		var hashEaDescription = {};
		var hashEaTag = {};
		var updateSelectableLayersArea = function (){
			    if (dijit.byId('selectionCriteria')._isShown()) {
			    	if (navigator.userAgent.indexOf("Chrome")>=0) {
			    		document.getElementById('tableSelectableLayersArea').style.height = "calc(100% - 515px)"; 
			    	} else if(navigator.userAgent.indexOf("Firefox")>=0) {
			    		document.getElementById('tableSelectableLayersArea').style.height = "calc(100% - 630px)"; 
			    	} else {
			    		document.getElementById('tableSelectableLayersArea').style.height = "calc(100% - 530px)"; 
			    	}
			    	
			    } else {
			    	if (navigator.userAgent.indexOf("Chrome")>=0) {
			    		document.getElementById('tableSelectableLayersArea').style.height = "calc(100% - 125px)";
			    	} else if(navigator.userAgent.indexOf("Firefox")>=0) {
			    		document.getElementById('tableSelectableLayersArea').style.height = "calc(100% - 125px)"; 
			    	} else {
			    		document.getElementById('tableSelectableLayersArea').style.height = "calc(100% - 125px)";
			    	}		    	
	
			    }		
			
		}
		
  		
		var loadBookmarkHomeExtent = function(callback){   
		
		    var xobj = new XMLHttpRequest();
		
		    xobj.overrideMimeType("application/json");
		
		    xobj.open('GET', 'configs/eBookmark/config_Enhanced Bookmark.json', true); 
		
		    xobj.onreadystatechange = function () {
		      if (xobj.readyState == 4 && xobj.status == "200") {
		            callback(xobj.responseText);
		          }
		    };
		    xobj.send(null);  
		}; 	
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
    var updateSingleCommunityLayer = function(selectedLayerNum){    	
		lyrTobeUpdated = self.map.getLayer(window.layerIdPrefix + selectedLayerNum);	 
		if (window.communitySelected != window.strAllCommunity) {        
			$.getJSON( 'configs/CommunitySymbology/' + window.communitySelected + '_JSON_Symbol/Nulls/' + window.communitySelected + '_' + window.hashAttribute[selectedLayerNum] + ".json", function( data ) {
				var renderer = new ClassBreaksRenderer(data);
        		lyrTobeUpdated.setRenderer(renderer);	
        		lyrTobeUpdated.redraw();
        		/*if (lyrTobeUpdated.visible == true){
            		lyrTobeUpdated.setVisibility(false);
            		lyrTobeUpdated.setVisibility(true);						                			
        		}*/
        		if 	(arrLayersToChangeSynbology.length > 0){
        			updateSingleCommunityLayer(arrLayersToChangeSynbology.pop());
        		}
        		
			})
		} else {
			$.getJSON( 'configs/CommunitySymbology/' + 'AllCommunities' + '_JSON_Symbol/Nulls/' + 'CombComm' + '_' + window.hashAttribute[selectedLayerNum] + ".json", function( data ) {
				var renderer = new ClassBreaksRenderer(data);
        		lyrTobeUpdated.setRenderer(renderer);	
        		lyrTobeUpdated.redraw();
        		/*if (lyrTobeUpdated.visible == true){
            		lyrTobeUpdated.setVisibility(false);
            		lyrTobeUpdated.setVisibility(true);						                			
        		}*/
        		if 	(arrLayersToChangeSynbology.length > 0){
        			updateSingleCommunityLayer(arrLayersToChangeSynbology.pop());
        		}	                		
			})						
		}
   };

		var chkIdDictionary = {};
		var nationalTopicList = [];
		var communityTopicList = [];
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
	    
		var loadNationalMetadataJSON = function(callback){   
	
	        var xobj = new XMLHttpRequest();
	
	        xobj.overrideMimeType("application/json");

	        xobj.open('GET', 'widgets/LocalLayer/nationalmetadata.json', true); 
	
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
	    var _onUnselectAllLayers = function() {
			for (var key in chkIdDictionary) {
			  if ((chkIdDictionary.hasOwnProperty(key)) && (document.getElementById(key)!=null) ){
	        	 document.getElementById(key).checked = false;	
			  }
			}
	   };	   
	   
	   var showLayerListWidget = function(){
	        var widgetName = 'LayerList';
	        var widgets = self.appConfig.getConfigElementsByName(widgetName);
	        var pm = PanelManager.getInstance();
	        pm.showPanel(widgets[0]);	   	
	   }
 	   
	    var	_addSelectableLayerSorted = function(items){	    	
		    
			updateTopicToggleButton();

			//If using search bar then search all topics
			if (document.getElementById('searchFilterText').value != ''){
				for (var key in window.topicDic) {
					dicTopicSelected[window.topicDic[key]]  = true;
					
				}
			} else {
				// take this out of else to search
				for (var key in window.topicDic) {
		        var chkboxId = window.chkTopicPrefix + window.topicDic[key];
		        var checkbox = document.getElementById(chkboxId);			
		        if(checkbox.checked == true){
			        dicTopicSelected[window.topicDic[key]]  = true;    	
		        } 
		        else {
		        	dicTopicSelected[window.topicDic[key]]  = false; 
		        }
			}
			}

    		var nSearchableColumns = document.getElementById('tableLyrNameDescrTag').getElementsByTagName('tr')[0].getElementsByTagName('th').length;
    		var eaIDFilteredList = [];
			tdIndex = 0;
			
			$("#tableLyrNameDescrTag").dataTable().$('td',{"filter":"applied"}).each( function (value, index) {
				var currentCellText = $(this).text();
				
				if (tdIndex == 0) {
					eaIDFilteredList.push(currentCellText);
				}
				tdIndex = tdIndex + 1;
				if (tdIndex == nSearchableColumns) {
					tdIndex = 0;
				}				
			} ); 

			var tableOfRelationship = document.getElementById("tableSelectableLayers");
		    var tableRef = tableOfRelationship.getElementsByTagName('tbody')[0]; 
            while (tableRef.firstChild) {
                tableRef.removeChild(tableRef.firstChild);
            }
            var numOfSelectableLayers = 0;
            var totalNumOfLayers = 0;
			var bAtLeastOneTopicSelected = true;//topicsBeingSelected();  
			SelectedTopics = [];          
	    	dojo.forEach(items, function(item) {
	           	
	           	var currentLayerSelectable = false;
				eaLyrNum = layerDataStore.getValue( item, 'eaLyrNum').toString();
				eaID = layerDataStore.getValue( item, 'eaID').toString();
				layerName = layerDataStore.getValue( item, 'name');
    			eaDescription = layerDataStore.getValue( item, 'eaDescription');
    			eaDfsLink = layerDataStore.getValue( item, 'eaDfsLink');
    			eaScale = layerDataStore.getValue( item, 'eaScale');
    			eaMetadata = layerDataStore.getValue( item, 'eaMetadata');
    			eaTopic = layerDataStore.getValue( item, 'eaTopic');
				eaCategory = layerDataStore.getValue( item, 'eaCategory');
    			bSelectByScale = false;

    			var chkNationalScale = document.getElementById("chkNational").checked;
				var chkCommunityScale = document.getElementById("chkCommunity").checked;

				// Search should use both national and community
				if (document.getElementById('searchFilterText').value != ''){
					chkNationalScale = true;
					chkCommunityScale = true;
				}

				switch (eaScale) {
					case "NATIONAL":
						
						if(chkNationalScale){
							totalNumOfLayers = totalNumOfLayers + 1;
							bSelectByScale = true;
						}
						break;
					case "COMMUNITY":
						if(chkCommunityScale){
							totalNumOfLayers = totalNumOfLayers + 1;
							if ((communitySelected == "") || (communitySelected == window.strAllCommunity)){
							bSelectByScale = true;
						}
							else{
								if (eaMetadata != "") {
									if (window.communityMetadataDic.hasOwnProperty(eaMetadata)) {
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
				

				eachLayerCategoryList = eaCategory.split(";");
				if (bSelectByScale) {
					if (dicTopicSelected[window.topicDic[eaTopic]] == true) {
						currentLayerSelectable = true;				
					}
				}// end of if (bSelectByScale)

				if ((currentLayerSelectable || (bAtLeastOneTopicSelected == false)) &&(eaIDFilteredList.indexOf(eaID) >= 0)) {//add the current item as selectable layers
					var bLayerSelected = false;
					if ((window.allLayerNumber.indexOf(eaID)) == -1) {                        	
                    	window.allLayerNumber.push(eaID);
                    }
                    else {
			    		lyr = self.map.getLayer(window.layerIdPrefix + eaID);
						if(lyr){
				    		bLayerSelected = true;
			          	}                   	
                    }
					numOfSelectableLayers = numOfSelectableLayers + 1;

					//Add Header for each Topic in list
					if (SelectedTopics.indexOf(eaTopic) == -1) {
						if (!(eaTopic in hiderows)) {
							hiderows[eaTopic] = true;
						}
						
						SelectedTopics.push(eaTopic);
						var newTopicHeader = tableRef.insertRow(tableRef.rows.length);
						newTopicHeader.id = eaTopic;
						newTopicHeader.className = 'topicHeader'

						var TopicName = newTopicHeader.insertCell(0);
						TopicName.colSpan = 3;
						TopicName.innerHTML = eaTopic;
						newTopicHeader.appendChild(TopicName);

						newTopicHeader.addEventListener('click', function() {
							hiderows[this.id] = !hiderows[this.id];
							_updateSelectableLayer();
						});
						var newTopicHeader = tableRef.insertRow(tableRef.rows.length);
						var blankspace = newTopicHeader.insertCell(0);
						blankspace.style.height = '3px';
						newTopicHeader.appendChild(blankspace);
					}
					//Finsih add header for each topic			

			       	var newRow   = tableRef.insertRow(tableRef.rows.length);
			       	newRow.className = eaTopic;
			       	if (hiderows[eaTopic] == false) {
			       		//newRow.style.color = 'red';
			       		newRow.style.display = 'none';
			       	}

			       	//newRow.style.height = "38px";
			       	var newCheckboxCell  = newRow.insertCell(0);
					var checkbox = document.createElement('input');
					checkbox.type = "checkbox";
			
			        chkboxId = window.chkSelectableLayer + eaID;
					checkbox.name = chkboxId;
					checkbox.value = 1;
					checkbox.id = chkboxId;
					checkbox.checked = bLayerSelected;
					newCheckboxCell.style.verticalAlign = "top";//this will put checkbox on first line
			        newCheckboxCell.appendChild(checkbox);    			              
			
			       	chkIdDictionary[chkboxId] = layerName;
			        var newCell  = newRow.insertCell(1);
			        newCell.style.width = "100%";
			        newCell.style.verticalAlign = "top";//this will put layer name on first line
			        newCell.style.paddingBottom = "12px"

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
							liElem.style.left = (indexImage*23).toString() + "px";
							liElem.style.top = "-12px";
							aElem = document.createElement("a");
							aElem.title  = key;
							// Add popup dialog box for Benefit Category 
							aElem.onclick = function() {
								ES_title = this.title;

								var bc_description = new Dialog({
				        		title: 'EnviroAtlas Benefit Categories', 
				        		style: 'width: 450px',
				        		onHide: function() {
				        			bc_description.destroy()
				        			}
				        		});
				        		

				        		var BC_tabs = dojo.create('div', {
					        		style: 'text-align: center',
					        	}, bc_description.containerNode);

					        	for (var key in window.categoryDic) {
					        		bc_icon_links = dojo.create('a', {
					        		"title": key,
					        		"id": window.categoryDic[key] + '_id',
					        		"class": 'bc_popup '+ window.categoryDic[key],
					        		}, BC_tabs);


					        		dojo.connect(bc_icon_links, 'onclick', function(){

					        			bc_id = this.id.split('_')[0];


					        			for (key in window.categoryDic) {
					        					$('#'+window.categoryDic[key]+'_id').removeClass('bc_popup_selected');
					        				}
					        			$('#'+this.id).addClass('bc_popup_selected');

					        			dojo.removeClass(infographic_body);
					        			dojo.addClass(infographic_body, 'bc_infographic ' + bc_id + '_infographic');

					        			dojo.removeClass(header_icon);
					        			dojo.addClass(header_icon, 'bc_popup_header_icon ' + bc_id);

					        			dojo.byId(header_text).innerHTML = this.title;
					        		});
					        	};

					        	$('#'+window.categoryDic[ES_title]+'_id').addClass('bc_popup_selected');

					        	var blankspace = dojo.create('div', {
					        		style: 'height: 15px',
					        	}, bc_description.containerNode);

					        	var bc_infographic = dojo.create('div', {
			        				'id': 'infographic_area',
			        				'style': 'background-color: #f4f4f4; width: 100%'
			        			}, bc_description.containerNode);

			        			var infographic_header = dojo.create('div', {
			        			"style": 'height: 40px',
			        			}, bc_infographic);

			        			var header_icon = dojo.create('div', {
			        				'class': 'bc_popup_header_icon ' + window.categoryDic[ES_title]
			        			}, infographic_header);

			        			var header_text = dojo.create('div', {
			        				'innerHTML': this.title,
			        				'class': 'bc_popup_header_text',
			        			}, infographic_header);

			        			var infographic_text = dojo.create('div', {
			        				'innerHTML': 'Ecosystem goods and services, often shortened to ecosystem \
			        							  services (ES), are the benefits that humans receive from nature. \
			        							  These benefits underpin almost every aspect of human well-being, \
			        							  including our food and water, security, health, and economy. \
			        							  <br><br> \
			        							  EnviroAtlas organizes our data into seven benefit categories \
			        							  <br><br>',
			        				'style': 'font-size: 11px',
			        			}, bc_infographic );

			        			var infographic_body = dojo.create('div', {
			        				"class": 'bc_infographic ' + window.categoryDic[ES_title] + '_infographic'
			        			}, bc_infographic);

				        		bc_description.show();		        		
							};
							// End add popup dialog box for Benefit Category 
							liElem.appendChild(aElem);
							ulElem.appendChild(liElem);							
							if (eaCategory.indexOf(key) !=-1) {
								liElem.setAttribute("class",window.categoryDic[key]);
							}
							else {
								liElem.setAttribute("class",window.categoryDic[key] + "_bw");
							}
						indexImage = indexImage + 1;
					}

					//Add Community/National Icon
					liElem = document.createElement("li");
					liElem.style.left = "175px";
					liElem.style.top = "-12px";
					aElem = document.createElement("a");
					// For now.  Lets adjust this in the spreadsheet
					if (eaScale == "NATIONAL") {
						aElem.title = "National Dataset";
					} else {
						aElem.title = "Community Dataset";
					}
					//aElem.title  = eaScale;
					liElem.appendChild(aElem);
					ulElem.appendChild(liElem);
					liElem.setAttribute("class", eaScale);
					// end Add Community/National Icon


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
					buttonInfo.className = 'i-button';
					
					newButtonInfoCell.style.verticalAlign = "top";//this will put checkbox on first line
			        newButtonInfoCell.appendChild(buttonInfo);  
			        hashFactsheetLink[buttonInfoId] = eaDfsLink;
			        hashLayerNameLink[buttonInfoId] = layerName;
			        document.getElementById(buttonInfoId).onclick = function(e) {
				        //window.open(window.dataFactSheet + selectableLayerArray[i]['eaDfsLink']);//this will open the wrong link
				        if (hashFactsheetLink[this.id] == "N/A") {
			        		var dataFactNote = new Dialog({
						        title: hashLayerNameLink[this.id],
						        style: "width: 300px",    
					    	});
					        dataFactNote.show();
					        dataFactNote.set("content", "Data fact sheet link is not available!");
			
				        } else {
				        	window.open(window.dataFactSheet + hashFactsheetLink[this.id]);
				        }		      
				    };    	
				}//end of if (currentLayerSelectable)
        });	
 		dojo.byId("numOfLayers").value = " " + String(numOfSelectableLayers) + " of " + String(totalNumOfLayers) + " Maps";
    	//dojo.byId("selectAllLayers").checked = false;
		for (var key in chkIdDictionary) {
			
		  if ((chkIdDictionary.hasOwnProperty(key)) && (document.getElementById(key)!=null) ){
		  	document.getElementById(key).addEventListener('click', function() {
		  		
				if (this.checked){
					showLayerListWidget();	
					singleLayerToBeAddedRemoved = "a" + "," + this.getAttribute("id").replace(window.chkSelectableLayer, "");
					document.getElementById('butAddSingleLayer').click();
				}
				else{
					singleLayerToBeAddedRemoved = "r" + "," + this.getAttribute("id").replace(window.chkSelectableLayer, "");
					document.getElementById('butAddSingleLayer').click();
				}				
		    });
		  }
		}    	
	};	   

	var updateTopicToggleButton = function() {

		var chkNationalScale = document.getElementById("chkNational");
		var chkCommunityScale = document.getElementById("chkCommunity");

		//var usingSearchBox = false;
		if (document.getElementById('searchFilterText').value != ''){
			chkNationalScale.className ="cmn-toggle cmn-toggle-round-flat-grayedout";
			document.getElementById("chkNational_label").className = 'topicTitleGray';
			
			chkCommunityScale.className ="cmn-toggle cmn-toggle-round-flat-grayedout";
			document.getElementById("chkCommunity_label").className = 'topicTitleGray';
			
			var usingSearchBox = true;
		} else {
			chkNationalScale.className ="cmn-toggle cmn-toggle-round-flat";
			document.getElementById("chkNational_label").className = 'none';
			chkCommunityScale.className ="cmn-toggle cmn-toggle-round-flat";
			document.getElementById("chkCommunity_label").className = 'none';
			var usingSearchBox = false;
		}
				
	    for (var key in window.topicDic) {
	    	var bCurrentTopicDisabled = true;
	    	
	    	
			if((chkNationalScale.checked) && (nationalTopicList.indexOf(key) >= 0)) {
				bCurrentTopicDisabled = false;
			}
			if((chkCommunityScale.checked) && (communityTopicList.indexOf(key) >= 0)) {
				bCurrentTopicDisabled = false;
			}
			
	        var chkboxId = window.chkTopicPrefix + window.topicDic[key];
	        var checkbox = document.getElementById(chkboxId);			

	        var title = document.getElementById(chkboxId + '_label');

	       if (bCurrentTopicDisabled || usingSearchBox) {
		        checkbox.className ="cmn-toggle cmn-toggle-round-flat-grayedout";	
		        checkbox.removeEventListener("click", _updateSelectableLayer);	   
		        title.className = 'topicTitleGray';    
		        checkbox.disabled = true;	
	       } else {
	       		/*if (checkbox.className == "cmn-toggle cmn-toggle-round-flat-grayedout"){
	       			checkbox.checked = false;//If the togglebutton is grayed out previously, then it should be off when it is activated
	       		}*/
		        checkbox.className ="cmn-toggle cmn-toggle-round-flat";	
		        checkbox.addEventListener("click", _updateSelectableLayer);	    
		        title.className = 'none';  
		        checkbox.disabled = false;	       	
	       }
		}
	}
	
	
	var	_updateSelectableLayer = function(){	
		
		layerDataStore.fetch({
			//Sort by alphabetically Topic, then by Name
				sort: [{attribute: 'eaTopic', descending: false},
				  		{attribute: 'name', descending: false}],
				onComplete: _addSelectableLayerSorted
				});
	};
    var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {
        baseClass: 'jimu-widget-simplesearchfilter',
		onReceiveData: function(name, widgetId, data, historyData) {
			if (name == 'SelectCommunity'){
			   var stringArray = data.message.split(",");
			   if (stringArray[0] != "u") {
				 communitySelected = data.message;
				 _updateSelectableLayer();
			   } 	
			}		  
		},

    displayCategorySelection: function() {
		
        indexImage = 0;
	    var categoCount = 1;
	    var newRow;

	    var keys = Object.keys(window.topicDic);
	    var half = Math.ceil((keys.length / 2));

	    for (i=0; i<keys.length; i++) {
	    	if (i < half) {
	    		var tableOfRelationship = document.getElementById('categoryTableL');
	    		var tableRef = tableOfRelationship.getElementsByTagName('tbody')[0];
	    	} else {
	    		var tableOfRelationship = document.getElementById('categoryTableR');
	    		var tableRef = tableOfRelationship.getElementsByTagName('tbody')[0];
	    	}

	    	newRow = tableRef.insertRow(tableRef.rows.length);
			var newCheckboxCell  = newRow.insertCell(0);
           	newCheckboxCell.style.paddingRight = "3px";

           	var checkbox = document.createElement('input');
			checkbox.type = "checkbox";
			
	        chkboxId = window.chkTopicPrefix + window.topicDic[keys[i]];

			checkbox.name = chkboxId;
			checkbox.value = 0;
			checkbox.id = chkboxId;
			checkbox.className ="cmn-toggle cmn-toggle-round-flat";
	        newCheckboxCell.appendChild(checkbox);    
	        var label = document.createElement('label');
	        label.setAttribute("for",chkboxId);
			label.innerHTML = "";
			newCheckboxCell.appendChild(label);

			//checkbox.addEventListener('click', _updateSelectableLayer);
			//checkbox.addEventListener('click', function() {
			checkbox.addEventListener('change', function() {
				//updateSearchBoxDataTable();
				_updateSelectableLayer();
				
			});
			/// add category title:
           	var newTitleCell  = newRow.insertCell(1);
           	newTitleCell.id = chkboxId + '_label';
           	newTitleCell.style.paddingBottom = "3px";
           	//newTitleCell.style.width = "40%"
        
			var title = document.createElement('label');
			title.innerHTML = keys[i];    
			//title.style.fontSize = "10px";
			newTitleCell.appendChild(title); 
	    	
	    }


        /* Commenting out Supply/demand/driver choices.
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
        */
		document.getElementById("hideIcons").onclick = function() {
		    _updateSelectableLayer();
		};					
		/*document.getElementById("selectAllLayers").onclick = function() {
			if (this.checked){
				showLayerListWidget();
		    	_onSelectAllLayers();
			    document.getElementById('butAddAllLayers').click();
		   } else {
		   		_onUnselectAllLayers();
		   		document.getElementById('butRemAllLayers').click();
		   }
		};*/
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
       	newCheckboxCell.style.paddingRight = "3px";
       	var checkbox = document.createElement('input');
		checkbox.type = "checkbox";
        chkboxId = "chkNational";
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
			//updateTopicToggleButton();
			_updateSelectableLayer();
	    });				
		/// add National title:
       	var newTitleCell  = newRow.insertCell(1);
		var title = document.createElement('label');
		title.id = 'chkNational_label';
		title.innerHTML = "National";    
		newTitleCell.appendChild(title); 
        newTitleCell.style.paddingRight = "15px";

		//add Community geography to same row
       	var newCheckboxCell  = newRow.insertCell(2);
       	newCheckboxCell.style.paddingRight = "3px";
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
			//updateTopicToggleButton();
			_updateSelectableLayer();
        	if (!this.checked){
				var btn = document.getElementById("butSelectOneCommunity"); 
				btn.disabled = true;	
        	} else {
				var btn = document.getElementById("butSelectOneCommunity"); 
				btn.disabled = false;        		
        	}		
	    });				
		
		// add Community title:
       	var newTitleCell  = newRow.insertCell(3);
		var title = document.createElement('label');
		title.id = 'chkCommunity_label';
		title.innerHTML = "EnviroAtlas Communities";    
		newTitleCell.appendChild(title); 
		
		var newButtonInfoCell  = newRow.insertCell(4);
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
   			document.getElementById('butOpenSelectCommunityWidget').click();
	    };   		  		

	},
      startup: function() {

        this.inherited(arguments);
	    this.fetchDataByName('SelectCommunity');		 
	    this.displayCategorySelection();
		this.displayGeographySelection();
	
		self = this;
		/*dojo.connect(dijit.byId("selectionCriteria"), "toggle", function (){
			updateSelectableLayersArea();
		});*/
	    loadBookmarkHomeExtent(function(response){
	    	var bookmarkClassified = JSON.parse(response);
	
	        for (index = 0, len = bookmarkClassified.bookmarks.length; index < len; ++index) {
	        	currentBookmarkClass = bookmarkClassified.bookmarks[index];
	        	if (currentBookmarkClass.name == "National") {
	        		bookmarkNational = currentBookmarkClass.items;	        		
        			var currentExtent = bookmarkNational[0].extent;
        			nExtent = Extent(currentExtent);
        			self.map.setExtent(nExtent);	        		
	        	}
	        }
	    }); 
        loadJSON(function(response) {
            var localLayerConfig = JSON.parse(response);
            var arrLayers = localLayerConfig.layers.layer;
            console.log("arrLayers.length:" + arrLayers.length);
			///search items
	        var tableOfRelationship = document.getElementById('tableLyrNameDescrTag');
		    var tableRef = tableOfRelationship.getElementsByTagName('tbody')[0];    
            for (index = 0, len = arrLayers.length; index < len; ++index) {
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
			                        
			            layerName = "";          
	                	if(layer.hasOwnProperty('name') ){	                		
		                	if ((layer.name != null)){
		                    	layerName = layer.name.toString();
	                    }
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
	                    if(layer.hasOwnProperty('eaTopic')){
	                    	eaTopic = layer.eaTopic.toString();
	                    }
	                    else {
	                    	eaTopic = "";
	                    }	                    
	                    if(layer.hasOwnProperty('eaScale')){
	                    	eaScale = layer.eaScale.toString();
	                    	if (eaScale == "NATIONAL") {
	                    		if (nationalTopicList.indexOf(eaTopic) < 0) {
	                    			nationalTopicList.push(eaTopic);
	                    		}	                    		
	                    	}
	                    	if (eaScale == "COMMUNITY") {
	                    		if (communityTopicList.indexOf(eaTopic) < 0) {
	                    			communityTopicList.push(eaTopic);
	                    		}	                    		
	                    	}	                    	
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
					    
					    var eaTagsWhole =  "";
					    if(layer.hasOwnProperty('eaTags')){
					    	for (tagsIndex = 0, lenTags = layer.eaTags.length; tagsIndex < lenTags; ++tagsIndex) {
					    		eaTagsWhole = eaTagsWhole + layer.eaTags[tagsIndex] + ";";
					    	}
					    }
					    eaTagsWhole = eaTagsWhole.substring(0, eaTagsWhole.length - 1);			
					    if (eaScale	!= "") {//selectable layers should be either National or Community 
					    	//var layerItem = {eaLyrNum: eaLyrNum, name: layerName, eaDescription: eaDescription, eaDfsLink: eaDfsLink, eaCategory: eaCategoryWhole, eaID: layer.eaID.toString(), eaMetadata: eaMetadata, eaScale: eaScale, eaTags:eaTagsWhole};
					    	var layerItem = {eaLyrNum: eaLyrNum, name: layerName, eaDescription: eaDescription, eaDfsLink: eaDfsLink, eaCategory: eaCategoryWhole, eaID: layer.eaID.toString(), eaMetadata: eaMetadata, eaScale: eaScale, eaTags:eaTagsWhole, eaTopic:eaTopic};
							
							layerDataStore.newItem(layerItem);
											
							//add to the table for use of search text		
				    	    var newRow   = tableRef.insertRow(tableRef.rows.length);
				    	    
			               	var newCell  = newRow.insertCell(0);
							newCell.appendChild(document.createTextNode(eaID));
							newRow.appendChild(newCell);
			
			               	newCell  = newRow.insertCell(1);
							newCell.appendChild(document.createTextNode(layerName));
							newRow.appendChild(newCell);			
			       
			               	newCell  = newRow.insertCell(2);
							newCell.appendChild(document.createTextNode(eaDescription));
							newRow.appendChild(newCell);
							
			               	newCell  = newRow.insertCell(3);
							newCell.appendChild(document.createTextNode(eaTagsWhole));
							newRow.appendChild(newCell);					
						}//end of if (eaScale	!= "")
					
						//end of adding of the table for use of search text
			    
				    }// end of if (eaID.trim() != "")
                }// end of if(layer.hasOwnProperty('eaID'))                	

            }// end of for (index = 0, len = arrLayers.length; index < len; ++index) 

            $('#tableLyrNameDescrTag').DataTable( {
			   language: {
			        searchPlaceholder: 'Search All Layers'			
			   },
		        "columnDefs": [
		            {
		                "targets": [ 0 ],
		                "searchable": false
		            }
		        ]
		    } );	

			$('#tableLyrNameDescrTag').on( 'draw.dt', function () {
			    _updateSelectableLayer();		    
			} );
					
			var page = document.getElementById('tableLyrNameDescrTag_paginate');
			page.style.display = 'none';	
				
			var searchBox = document.getElementById('searchFilterText');
			searchBox.style.width= "100%";	
			searchBox.style.borderColor = 'rgb(0,67,111)';
			searchBox.style.padding = '2px 2px 2px 2px';

			_updateSelectableLayer();
			setClickEvent();

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
	        		if(currentMetadataCommunityIndex.hasOwnProperty(window.strAllCommunity)) {
	        			singleCommunityMetadataDic[window.strAllCommunity] = currentMetadataCommunityIndex[window.strAllCommunity];
	        		}            		
            	}

            	window.communityMetadataDic[currentMetadataCommunityIndex.MetaID_Community] = singleCommunityMetadataDic;
            }
        }); // end of loadCommunityJSON(function(response)
        
        loadNationalMetadataJSON(function(response){
        	var national = JSON.parse(response);

            for (index = 0, len = national.length; index < len; ++index) {
            	currentMetadataNationalIndex = national[index];
				for (var key in currentMetadataNationalIndex) {
				    if (currentMetadataNationalIndex.hasOwnProperty(key)) {
				        window.nationalMetadataDic[key] = currentMetadataNationalIndex[key];
				    }
				}
            }
        }); // end of loadNationalMetadataJSON(function(response)
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
            	layersToBeAdded = layersToBeAdded + "," + key.replace(window.chkSelectableLayer, "");
        	}
		  }
		}
        this.publishData({
	        message: layersToBeAdded
	    });
	    this.i ++;
    },
    _onRemLayersClick: function() {
        layersToBeAdded = "r";
		for (var key in chkIdDictionary) {
		  if ((chkIdDictionary.hasOwnProperty(key)) && (document.getElementById(key)!=null) ){
            	layersToBeAdded = layersToBeAdded + "," + key.replace(window.chkSelectableLayer, "");
		  }
		}
        this.publishData({
	        message: layersToBeAdded
	    });
	    this.i ++;
    },    
    onOpen: function(){
  
    },	    
    _onRemoveLayersClick: function() {
        layersToBeRemoved = "r";
		for (var key in chkIdDictionary) {
		  if (chkIdDictionary.hasOwnProperty(key)) {
		  	if (document.getElementById(key).checked) {
            	layersToBeRemoved = layersToBeRemoved + "," + key.replace(window.chkSelectableLayer, "") ;
        	}
		  }
		}
        this.publishData({
	        message: layersToBeRemoved
	    });
	    this.i ++;
    },
    _onOpenFailedLayerClick: function() {
	        var widgetName = 'DisplayLayerAddFailure';
	        var widgets = this.appConfig.getConfigElementsByName(widgetName);
	        var pm = PanelManager.getInstance();
	        pm.showPanel(widgets[0]);	  
	        this.publishData({
		        message: ""
		    });
     },
     _onUpdateCommunityLayers: function() {
     	arrLayersToChangeSynbology = [];
	    var lyr;
    	for (i in window.allLayerNumber) {
    		lyr = this.map.getLayer(window.layerIdPrefix + window.allLayerNumber[i]);
			if(lyr){				
	    		arrLayersToChangeSynbology.push(lyr.id.replace(window.layerIdPrefix, ""));
          	}          	
        } 	    

        updateSingleCommunityLayer(arrLayersToChangeSynbology.pop());
     }
    });

    return clazz;
  });
