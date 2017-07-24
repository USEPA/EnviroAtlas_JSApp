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
	 'dojo/_base/connect',
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
    ClassBreaksRenderer,
    connect) {
    	var singleLayerToBeAddedRemoved = "";
    	var bNoTopicSelected = false;
    	var communitySelected = "";
    	var arrLayersToChangeSynbology = [];
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
		var hashSubLayers = {};
		var hashSubTopicforI = {};
		//set popup info for each featuer layer
	    var featuresCollection = [];
	    var arrLayersForPopup = [];
	    var numDecimalDigit = 0;
	    var addSingleFeatureForPopup = function(eaID, clickEvt) {
			var selectQuery = new query();
	        selectQuery.geometry = clickEvt.mapPoint;
	        selectQuery.returnGeometry = true;
	        selectQuery.spatialRelationship = query.SPATIAL_REL_INTERSECTS;            
	        var queryTask = new QueryTask(window.hashURL[eaID]);
	        popupField = window.hashPopup[eaID].fieldInfos[0]["fieldName"];
	        popupFieldName = window.hashPopup[eaID].fieldInfos[0]["label"];
	        popupTitle = window.hashPopup[eaID].title.split(":");
	        if (window.hashPopup[eaID].fieldInfos[0].hasOwnProperty('format')) {
	        	if (window.hashPopup[eaID].fieldInfos[0].format.hasOwnProperty('places')) {
	        		numDecimalDigit = window.hashPopup[eaID].fieldInfos[0].format.places;
	        	}
	        }
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
						var content = "<b>" + popupTitle[0] + "</b>: $" + popupTitle[1].trim() + "<hr>"+"<b>" + popupFieldName + "</b>: ${" + popupField + ":selfSimpleSearchFilter.formatValue}";	
						var infoTemplate = new esri.InfoTemplate(popupFieldName, content);
					    var graphic = resultFeatures[i];
					    graphic.setSymbol(symbol);
					    graphic.setInfoTemplate(infoTemplate);
					    featuresCollection.push(graphic);
					    selfSimpleSearchFilter.map.graphics.add(graphic);
					}
					if 	(arrLayersForPopup.length > 0){
	        			addSingleFeatureForPopup(arrLayersForPopup.pop(),clickEvt);
	        		}
	        		else {
	        			if 	(featuresCollection.length > 0){
			    			selfSimpleSearchFilter.map.infoWindow.setFeatures(featuresCollection);
							selfSimpleSearchFilter.map.infoWindow.show(clickEvt.mapPoint);
						}
					}
	            }
	        }); 	
		};
		var setClickEventForPopup = function(){    		
	 			var mapClickListenerForPopup = connect.connect(selfSimpleSearchFilter.map, "onClick", function(evt) {
				//mapClickListenerForPopup = selfSimpleSearchFilter.map.on("click", function(evt) {
					if ((window.toggleOnHucNavigation == true) || (window.toggleOnRainDrop == true)|| (window.toggleOnElevation == true)) {					
						connect.disconnect(mapClickListenerForPopup);
					} 
					else {
						selfSimpleSearchFilter.map.graphics.clear();
						featuresCollection = [];
						arrLayersForPopup = [];
						//alert("window.featureLyrNumber: " + window.featureLyrNumber);
			    		for (i in window.featureLyrNumber) {  
			    			bVisibleFL = false;
			    			bVisibleTL = false;
				    		lyrFL = selfSimpleSearchFilter.map.getLayer(window.layerIdPrefix + window.featureLyrNumber[i]);		    		
				    		if (lyrFL != null) {		    			
								if (lyrFL.visible == true){
									bVisibleFL = true;
								}
							} else {
								lyrFL = selfSimpleSearchFilter.map.getLayer(window.layerIdPBSPrefix + window.featureLyrNumber[i]);	
								if (lyrFL != null) {
									if (lyrFL.visible == true){
										bVisibleFL = true;
									}
								}
							}
							lyrTL = selfSimpleSearchFilter.map.getLayer(window.layerIdTiledPrefix + window.featureLyrNumber[i]);
				    		if (lyrTL != null) {		    			
								if (lyrTL.visible == true){
									bVisibleTL = true;							
								}
							}		
							if ((bVisibleFL == true) || (lyrTL == true)) {
								arrLayersForPopup.push(window.featureLyrNumber[i]);
							}		    		
				    	}
				    	//start to popup for first layer:
				    	if 	(arrLayersForPopup.length > 0){
				    	addSingleFeatureForPopup(arrLayersForPopup.pop(),evt);         
			        	}       
			        }
				})
		};
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
		lyrTobeUpdated = selfSimpleSearchFilter.map.getLayer(window.layerIdPrefix + selectedLayerNum);	 
		if (window.communitySelected != window.strAllCommunity) {        
			$.getJSON( 'configs/CommunitySymbology/' + window.communitySelected + '_JSON_Symbol/Nulls/' + window.communitySelected + '_' + window.hashAttribute[selectedLayerNum] + ".json", function( data ) {
				var renderer = new ClassBreaksRenderer(data);
        		lyrTobeUpdated.setRenderer(renderer);	
        		lyrTobeUpdated.redraw();
        		if (lyrTobeUpdated.visible == true){
            		lyrTobeUpdated.setVisibility(false);
            		lyrTobeUpdated.setVisibility(true);						                			
        		}
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
	        var widgets = selfSimpleSearchFilter.appConfig.getConfigElementsByName(widgetName);
	        var pm = PanelManager.getInstance();
	        pm.showPanel(widgets[0]);	   	
	   }

	   var add_bc_icons = function(layerArea, scale, type) {
	   		indexImage = 0;

	   		var BC_Div = dojo.create('div', {
	   			'style': 'overflow:hidden; padding-left: 16px; position: relative; top: -2px'
			}, layerArea);
			
			for (var key in window.categoryDic) {

				bc_img = document.createElement('div');
				bc_img.style.width = '20px';
				bc_img.style.height = '20px';
				bc_img.title  = key;
				bc_img.style.float = 'left';
				bc_img.style.marginRight = '5px';

				
				// Add popup dialog box for Benefit Category 
				bc_img.onclick = function() {
				ES_title = this.title;

				var bc_description = new Dialog({
        		title: 'EnviroAtlas Benefit Categories', 
        		style: 'width: 450px',
        		onHide: function() {
        			bc_description.destroy()
        			}
        		});
        		

        		var BC_tabs = dojo.create('div', {
	        		style: 'text-align: center; padding-bottom: 15px',
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
								
			if (eaCategory.indexOf(key) !=-1) {
				bc_img.setAttribute("class",window.categoryDic[key]);
			}
			else {
				bc_img.setAttribute("class",window.categoryDic[key] + "_bw");
			}
			
			indexImage = indexImage + 1;
			BC_Div.appendChild(bc_img);
			
			
		}

		scale_img = document.createElement('div');
		scale_img.style.width = '20px';
		scale_img.style.height = '20px';
		scale_img.style.float = 'left';
		scale_img.style.marginLeft = '20px';
		scale_img.style.marginRight = '5px';

		if (scale == "NATIONAL") {
				scale_img.title = "National Dataset";
			} else {
				scale_img.title = "Community Dataset";
			}
		scale_img.setAttribute("class", scale);
		BC_Div.appendChild(scale_img);

		datatype_img = document.createElement('div');
		datatype_img.style.width = '20px';
		datatype_img.style.height = '20px';
		datatype_img.style.float = 'left';
		//datatype_img.style.marginLeft = '20px';

		if (type == 'huc12') {
			datatype_img.title = "Data summarized by 12 digit HUCs";
		} else if (type == 'cbg') {
			datatype_img.title = "Data summarized by census block groups";
		} else if (type == 'ctr') {
			datatype_img.title = "Data summarized by census tract";
		} else if (type == 'grid') {
			datatype_img.title = "Non-summarized grid data";
		} else if (type == 'plp') {
			datatype_img.title = "Point, line, or polygon data"
		}

		datatype_img.setAttribute("class", type);
		BC_Div.appendChild(datatype_img);



		//BC_Cell.appendChild(BC_Div);

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
		        } else {
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
		}); 

		var tableOfRelationship = document.getElementById("tableSelectableLayersArea");

		dojo.destroy('layerArea');

		var layerArea = dojo.create('div', {
			'id': 'layerArea',
			'style': 'width: 100%',
		}, tableOfRelationship);
		


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
			IsSubLayer = layerDataStore.getValue( item, 'IsSubLayer');
			SubLayerNames = layerDataStore.getValue( item, 'SubLayerNames');
			SubLayerIds = layerDataStore.getValue( item, 'SubLayerIds');
			sourceType = layerDataStore.getValue( item, 'sourceType');
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
						bSelectByScale = true;
						if (SubLayerIds.length == 0) {
							totalNumOfLayers = totalNumOfLayers + 1;
						}
					}
					break;
				case "COMMUNITY":
					if(chkCommunityScale){
						if (SubLayerIds.length == 0) {
							totalNumOfLayers = totalNumOfLayers + 1;
						}
						bSelectByScale = true;
						/*if ((communitySelected == "") || (communitySelected == window.strAllCommunity)){
						
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
						}*/
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
		    		lyr = selfSimpleSearchFilter.map.getLayer(window.layerIdPrefix + eaID);
					if(lyr){
			    		bLayerSelected = true;
		          	}                   	
                }

                numOfSelectableLayers++;
				//Add Header for each Topic in list
				if (SelectedTopics.indexOf(eaTopic) == -1) {
					if (!(eaTopic in hiderows)) {
						hiderows[eaTopic] = true;
					}
					
					SelectedTopics.push(eaTopic);

					var topicHeader = dojo.create('div', {
	    				'id': eaTopic,
	    				'class': 'topicHeader',
	    				'innerHTML': eaTopic,
	    				onclick: function(){
	    					hiderows[this.id] = !hiderows[this.id];
							_updateSelectableLayer();
	    				}
	    			}, layerArea);
				}
				//Finsih add header for each topic	

				var buttonInfoId = "but" + eaID;
    			hashFactsheetLink[buttonInfoId] = eaDfsLink;
	        	hashLayerNameLink[buttonInfoId] = layerName;
	        	hashDescriptionforI[buttonInfoId] = eaDescription;
	        	hashSubLayers[buttonInfoId] = SubLayerIds;
	        	hashSubTopicforI[buttonInfoId] = SubLayerNames;


				//If not a subLayer create a new Row
				
				if (!IsSubLayer) {

					var mainDiv = dojo.create('div', {
						'class': 'layerDiv'
						}, layerArea);

					if (!hiderows[eaTopic]) {
						mainDiv.style.display = 'None';
					}

					var topicRow = dojo.create('div', {
						"style" : "display:inline-block; width:100%"
						//"style": ""
	    			}, mainDiv);

	    			var Checkbox_div = dojo.create('div', {
	    				'class': 'checkbox_cell',
	    				
	    			}, topicRow);

	    			if (!SubLayerIds.length) {

		    			chkboxId = window.chkSelectableLayer + eaID;
		    			var checkbox = dojo.create('input', {
		    				"type": "checkbox",
							"name": chkboxId,
							"value": 1,
							"id": chkboxId,
							"checked": bLayerSelected,
                            "style": "margin-top: 1px"

		    			}, Checkbox_div);
		    			chkIdDictionary[chkboxId] = SubLayerNames[i] + layerName;
		    		} else {
		    			Checkbox_div.innerHTML = '_&nbsp';
		    			Checkbox_div.style.textAlign = 'right';
		    			Checkbox_div.style.color = 'gray';

		    		}


	    			var iButton = dojo.create('input', {
	    				"type": "button",
						"name": buttonInfoId,
						"id": buttonInfoId,
						"checked": bLayerSelected,
						"class": "i-button",
						"style": "float: right",
						onclick: function(e) {

							
							var infobox = new Dialog({
			        		title: hashLayerNameLink[this.id],
			        		style: 'width: 300px'
			        		});

			        		subLayers = hashSubLayers[this.id].split(';');

			        		if (subLayers != "") {
			        			for (i=0; i < subLayers.length; i++) {
			        				var subTopicHeader = dojo.create('h2', {
			        					'innerHTML': hashSubTopicforI[this.id].split(';')[i],
			        					'style': 'margin-top: 0px'
			        				}, infobox.containerNode);

			        				var infoDiv = dojo.create('div', {
			        					'innerHTML': hashDescriptionforI['but' + subLayers[i]] + '<br><br>'
			        				}, infobox.containerNode);

			        				var linkDiv = dojo.create('div', {
		        					}, infobox.containerNode);
		        					// if factsheetlink is not empty
		        					if (/\S/.test(hashFactsheetLink['but' + subLayers[i]])) {
			        					var factsheetDiv = dojo.create('a', {
				        					'innerHTML': 'Fact Sheet',
				        					'href': window.dataFactSheet + hashFactsheetLink['but' + subLayers[i]],
				        					'target': '_blank',
				        					'class': 'factsheetLink'
				        					}, linkDiv);
			        				}
			        				if (i < subLayers.length -1) {
			        					var line = dojo.create('hr', {'style': 'margin-top: 10px'}, infobox.containerNode);
			        				}

			        			}
			        		} else {
			        			var infoDiv = dojo.create('div', {
		        					'innerHTML': hashDescriptionforI[this.id] + '<br><br>'
		        				}, infobox.containerNode);

		        				var linkDiv = dojo.create('div', {
		        					}, infobox.containerNode)
		        				if (/\S/.test(hashFactsheetLink[this.id])) {
			        				var factsheetDiv = dojo.create('a', {
			        					'innerHTML': 'Fact Sheet',
			        					'href': window.dataFactSheet + hashFactsheetLink[this.id],
			        					'target': '_blank',
			        					'class': 'factsheetLink' 
			        				}, linkDiv);
			        			}
			        		}
							infobox.show()
						}
					}, topicRow);


	    			var topicName = dojo.create('div', {
	    				"innerHTML": layerName,
		        		"style" : "font-weight: 500; display: table-cell; font-size:13px",
		        		"title" :eaDescription
	    			}, topicRow);
	    			
	    		

		    		if (SubLayerIds.length) {
		    			numOfSelectableLayers--;
						SubLayerNames = SubLayerNames.split(';');
						SubLayerIds = SubLayerIds.split(';');

						var subTopicRow = dojo.create('div', {
							"style" : "display:inline-block; width:100%"
							//"style": "display:inline-block; width:100%"
		    			}, mainDiv);

		    			var Checkbox_div = dojo.create('div', {
		    				'class': 'checkbox_cell',
		    				'innerHTML': '&nbsp'
		    			}, subTopicRow);

		    			for (i=0; i< SubLayerNames.length; i++) {

							bLayerSelected = false;
							lyr = selfSimpleSearchFilter.map.getLayer(window.layerIdPrefix + SubLayerIds[i]);
							if(lyr){
					    		bLayerSelected = true;
				          	}     

				          	var Checkbox_div = dojo.create('div', {
			    				'class': 'checkbox_cell',
			    			}, subTopicRow);


		    				chkboxId = window.chkSelectableLayer + SubLayerIds[i];
		    				var checkbox = dojo.create('input', {
			    				"type": "checkbox",
								"name": chkboxId,
								"value": 1,
								"id": chkboxId,
								"checked": bLayerSelected,
								"style": "margin-top: 1px"

			    			}, Checkbox_div);

			    			var SubLayerDiv = dojo.create('div', {
		    					"innerHTML": SubLayerNames[i],
			        			"style" : "float: left; margin-right: 12px; font-style: italic",
			        			"title" :eaDescription
		    				}, subTopicRow);

		    				chkIdDictionary[chkboxId] = SubLayerNames[i] + layerName;
		    			}
					}

					if (!(document.getElementById("hideIcons").checked)) {
						add_bc_icons(mainDiv, eaScale, sourceType);
					} 
				}		
				
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
					else {
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
        	/*if (!this.checked){
				var btn = document.getElementById("butSelectOneCommunity"); 
				btn.disabled = true;	
        	} else {
				var btn = document.getElementById("butSelectOneCommunity"); 
				btn.disabled = false;        		
        	}	*/	
	    });				
		
		// add Community title:
       	var newTitleCell  = newRow.insertCell(3);
		var title = document.createElement('label');
		title.id = 'chkCommunity_label';
		title.innerHTML = "EnviroAtlas Communities";    
		newTitleCell.appendChild(title); 

		var newButtonInfoCell  = newRow.insertCell(4);
		var iButton = dojo.create('input', {
	    				"type": "button",					
						"class": "i-button",
						"style": "float: right; height:14px; width:14px; position:relative; top:-1px",
						onclick: function(e) {
							var infobox = new Dialog({
			        		title: "EnviroAtlas Spatial Extents",
			        		style: 'width: 300px'
			        		});

			        		var nationalHeader = dojo.create('h2', {
			        			'style': 'margin-top: 0px',
			        			'innerHTML': 'National'
			        		}, infobox.containerNode);

			        		var nationalDiv = dojo.create('div', {
	        					'innerHTML': "Most maps at the national extent provide wall-to-wall data \
	        								 coverage for the contiguous U.S. as well as some data for \
	        								 Alaska and Hawaii. These data include raster datasets, state \
	        								 and local polygons, and many layers derived from data with a \
	        								 resolution of 30m. Most national datasets are summarized by 12-digit \
	        								 hydrologic unit codes, or sub-watershed basins."
	        				}, infobox.containerNode);

	        				dojo.create('hr', {'style': 'margin-top: 10px'}, infobox.containerNode);

	        				var communityHeader = dojo.create('h2', {
	        					'style': 'margin-top: 0px',
			        			'innerHTML': 'EnviroAtlas Communities'
			        		}, infobox.containerNode);

	        				var CommunityDiv = dojo.create('div', {
	        					'innerHTML': "Community-level information in EnviroAtlas draws from fine scale \
	        								  land cover data, census data, and models and is only available \
	        								  for selected communities (up to 50 by 2019). There are approximately \
	        								  100 data layers per community. EnviroAtlas community data are \
	        								  consistent for each available community, and they are mostly \
	        								  summarized by census block groups. <br><br>"
	        				}, infobox.containerNode);

	        				var moreInfo = dojo.create('a', {
	        					'innerHTML': 'More info',
	        					'href': "https://www.epa.gov/enviroatlas/enviroatlas-spatial-extents",
	        					'target': '_blank',
	        					'class': 'factsheetLink'
	        					}, infobox.containerNode);


	        				var CommunityLink = dojo.create('a', {
	        					'innerHTML': 'Community Fact Sheet',
	        					'href': "https://www.epa.gov/sites/production/files/2015-07/documents/enviroatlas_community_factsheet.pdf",
	        					'target': '_blank',
	        					'class': 'factsheetLink',
	        					'style': 'margin-left: 10px'
	        					}, infobox.containerNode);



							infobox.show()
						}
					}, newButtonInfoCell);
		
		/*var newButtonInfoCell  = newRow.insertCell(4);
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
	    };   	*/	  		

	},
      startup: function() {

        this.inherited(arguments);
	    this.fetchDataByName('SelectCommunity');		 
	    this.displayCategorySelection();
		this.displayGeographySelection();
	
		selfSimpleSearchFilter = this;
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
        			selfSimpleSearchFilter.map.setExtent(nExtent);	        		
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

	                    if(layer.hasOwnProperty('IsSubLayer')){
	                        IsSubLayer = layer.IsSubLayer;
	                    }
	                    else {
	                    	IsSubLayer = "";
	                    }

	                    if(layer.hasOwnProperty('sourceType')){
	                    	sourceType = layer.sourceType;
	                    }
	                    else {
	                    	sourceType = "";
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
	                    	console.log("eaID:" + eaID + ", eaTopic: " + eaTopic);
	                    	window.hashTopic[eaID]  = eaTopic;
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

					    var SubLayerNames =  "";
					    if(layer.hasOwnProperty('SubLayerNames')){
					    	for (categoryIndex = 0, lenCategory = layer.SubLayerNames.length; categoryIndex < lenCategory; ++categoryIndex) {
					    		SubLayerNames = SubLayerNames + layer.SubLayerNames[categoryIndex] + ";";
					    	}
					    }
					    SubLayerNames = SubLayerNames.substring(0, SubLayerNames.length - 1);

					    var SubLayerIds =  "";
					    if(layer.hasOwnProperty('SubLayerIds')){
					    	for (categoryIndex = 0, lenCategory = layer.SubLayerIds.length; categoryIndex < lenCategory; ++categoryIndex) {
					    		SubLayerIds = SubLayerIds + layer.SubLayerIds[categoryIndex] + ";";
					    	}
					    }
					    SubLayerIds = SubLayerIds.substring(0, SubLayerIds.length - 1);


					    eaTagsWhole = eaTagsWhole.substring(0, eaTagsWhole.length - 1);			
					    if (eaScale	!= "") {//selectable layers should be either National or Community 
					    	//var layerItem = {eaLyrNum: eaLyrNum, name: layerName, eaDescription: eaDescription, eaDfsLink: eaDfsLink, eaCategory: eaCategoryWhole, eaID: layer.eaID.toString(), eaMetadata: eaMetadata, eaScale: eaScale, eaTags:eaTagsWhole};
					    	var layerItem = {eaLyrNum: eaLyrNum, name: layerName, IsSubLayer:IsSubLayer, SubLayerNames: SubLayerNames, SubLayerIds: SubLayerIds, eaDescription: eaDescription, eaDfsLink: eaDfsLink, eaCategory: eaCategoryWhole, eaID: layer.eaID.toString(), eaMetadata: eaMetadata, eaScale: eaScale, eaTags:eaTagsWhole, eaTopic:eaTopic, sourceType:sourceType};
							
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

			//_updateSelectableLayer();
			

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
        document.getElementById('butMapClickForPopup').click();
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
    	for (i in window.communityLayerNumber) {
    		lyr = this.map.getLayer(window.layerIdPrefix + window.communityLayerNumber[i]);
			if(lyr){				
	    		arrLayersToChangeSynbology.push(lyr.id.replace(window.layerIdPrefix, ""));
          	}          	
        } 	    

        updateSingleCommunityLayer(arrLayersToChangeSynbology.pop());
     },
     _onMapClickForPopup: function() {
		  setClickEventForPopup();   	
     },
     formatValue : function (value, key, data){
     	pow10 = Math.pow(10, numDecimalDigit);
     	return parseFloat(Math.round(value * pow10) / pow10).toFixed(numDecimalDigit);
     }

    });

    return clazz;
  });
