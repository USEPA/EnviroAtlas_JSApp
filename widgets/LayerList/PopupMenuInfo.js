///////////////////////////////////////////////////////////////////////////
// Copyright © Esri. All Rights Reserved.
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
  'dojo/_base/array',
  'dojo/_base/lang',
  'dojo/Deferred',
  'dojo/promise/all',
  'jimu/portalUrlUtils',
  'jimu/WidgetManager',
  'esri/lang',
  './NlsStrings',
   'jimu/utils',
   'jimu/PanelManager',
   'esri/graphicsUtils',
   'dijit/Dialog'
   
], function(declare, array, lang, Deferred, all,  portalUrlUtils, WidgetManager, esriLang, NlsStrings, jimuUtils, PanelManager, 
  graphicsUtils, Dialog) {
  var mapDescriptionStr = "";
  var topLayerIndex = 300;
  var layerInfoFromJson = {};
  var _layerType = null;
  var uncheckRelatedCheckbox = function (chkboxLayerId){
    	var chkSimpleSearch = document.getElementById(window.chkSelectableLayer + chkboxLayerId);
    	if((chkSimpleSearch != null) && (chkSimpleSearch.checked == true)){	
    		chkSimpleSearch.checked = false;    		
    	}
   };

   var getInfoFromJsonWithEaID = function(callback, arrXmlPath, EaID, actionType){  
        
		if (arrXmlPath.length > 0){
	        var xobj = new XMLHttpRequest();
	        xobj.overrideMimeType("application/json");   	
	        //xobj.open('GET', 'widgets/LocalLayer/config.json', true); 
	        xobj.open('GET', arrXmlPath.pop(), true); 
	
	        xobj.onreadystatechange = function () {
	              if (xobj.readyState == 4 && xobj.status == "200") {
	                // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
	                if (callback(xobj.responseText, EaID)){
	                	switch(actionType) {
	                		case "eaDescription":
		                		if ('eaDescription' in layerInfoFromJson) {
							    	var mapDescription = new Dialog({
								        title: layer.name,
								        style: "width: 300px",    
							    	});
							        mapDescription.show();
							        mapDescription.set("content", layerInfoFromJson['eaDescription']); 			
		                		}
		                		else {
		                			alert("Map description is not available for this layer");	
		                		}
		                        break;      
		                    case 'eaMetadata':
			                    if ('eaMetadata' in layerInfoFromJson) {
			                    	if (('eaScale' in layerInfoFromJson) &&  (layerInfoFromJson['eaScale'] == "NATIONAL")) {
			                        	metaDataID = window.nationalMetadataDic[layerInfoFromJson['eaMetadata']];
			                            window.open(window.matadata + "?uuid=%7B" + metaDataID + "%7D");                  		
			                    	} else {
			                    		if (window.communitySelected == window.strAllCommunity){
				                            window.open(window.communityMetadataDic[layerInfoFromJson['eaMetadata']][window.communitySelected]);                    			
			                    		} else {
				                        	metaDataID = window.communityMetadataDic[layerInfoFromJson['eaMetadata']][window.communitySelected];
				                            window.open(window.matadata + "?uuid=%7B" + metaDataID + "%7D");                 		
			                    		}
			                    	}  		     
		                    	} 
		                		else {
		                			alert("Metadata is not available for this layer");	
		                		}		
		                		break;
		                	case 'eaDfsLink':
		                		if ('eaDfsLink' in layerInfoFromJson) {
		                            window.open(window.dataFactSheet + layerInfoFromJson['eaDfsLink']);
		                		}
		                		else {
		                			alert("Data fact sheet is not available for this layer");	
		                		}		                		
		                		break;		                	                    	                        		
	                	}
	                	
	                }
	                else {
	                	switch(actionType) {
	                		case "eaDescription":
			                	if ((arrXmlPath.length == 0)&&(!('eaDescription' in layerInfoFromJson))){
					              	alert("Map description is not available for this layer");			                	
					            }	                		
	                			break;
	                		case 'eaMetadata':
			                	if ((arrXmlPath.length == 0)&&(!('eaMetadata' in layerInfoFromJson))){
					              	alert("Metadata is not available for this layer");			                	
					            }		                		
		                		break;
		                	case 'eaDfsLink':	                		
			                	if ((arrXmlPath.length == 0)&&(!('eaDescription' in layerInfoFromJson))){
					              	alert("Data fact sheet is not available for this layer");			                	
					            }			                	
		                		break;
		                }          			                		
	                	getInfoFromJsonWithEaID(getInfoWithEaID, arrXmlPath, EaID, actionType);
	                }
	              }              
	        }
	        xobj.send(null); 
		}
        
    };    
    var getInfoWithEaID = function(response, layerId_url) {
			var resultLayerInfoFromJson = {};
	        var localLayerConfig = JSON.parse(response);
	        var urlInConfig = "";
	        var resultFound = false;
	        
	        var arrLayers = localLayerConfig.layers.layer;

	        for (index = 0, len = arrLayers.length; index < len; ++index) {
	            layer = arrLayers[index];
	            if(layer.hasOwnProperty('eaID')){
	            	if (layerId_url.indexOf("http")>=0){
		            	if (_layerType != "ArcGISDynamicMapServiceLayer"){
					        if(layer.hasOwnProperty('eaLyrNum')){
					            urlInConfig = layer.url + "/" + layer.eaLyrNum.toString();
					        }            
				        } else {
				        	urlInConfig = layer.url;
				        }	      
	            	}

					if ((urlInConfig!=null) &&(urlInConfig!="")){
		            	if (urlInConfig.substr(urlInConfig.length - 1) == "/") {
		            		urlInConfig = urlInConfig.substr(0, urlInConfig.length - 2);
		            	}					
					}

	                if ((layerId_url === layer.eaID.toString()) ||(layerId_url == urlInConfig)) {
	                	resultFound = true;
	                    if(layer.hasOwnProperty('eaDescription')){
	                    	layerInfoFromJson['eaDescription'] = layer.eaDescription;
	                    }
	                    if(layer.hasOwnProperty('eaMetadata')){
	                    	layerInfoFromJson['eaMetadata'] = layer.eaMetadata;
	                    }
	                    if(layer.hasOwnProperty('eaDfsLink')){
	                    	layerInfoFromJson['eaDfsLink'] = layer.eaDfsLink;
	                    }
	                    if (layer.hasOwnProperty('eaScale')) {
	                    	layerInfoFromJson['eaScale'] = layer.eaScale;
	                    }
	                    break;                    	                    
	                }					                	                
	            }
	        }
	        return 	resultFound;

    };
    var displayInfoOnClickAction = function(layerId, clickedURL, actionType) {
    	if (actionType == "eaDescription") {
    		if (layerId=="added_ClimateChange"){
				var mapDescription = new Dialog({
			        title: "Change analysis layer",
			        style: "width: 300px",    
		    	});
		        mapDescription.show();
		        mapDescription.set("content", "This map depicts the change in the selected climate variable (max temp, min temp, precipitation, potential evapotranspiration) between two time periods based on the selected RCP scenario (2.6, 4.0, 6.5 8.5) and the selected season."); 		
    			return;
    		} else if (layerId==window.timeSeriesLayerId) {
				var mapDescription = new Dialog({
			        title: "Time series data",
			        style: "width: 300px",    
		    	});
		        mapDescription.show();
		        mapDescription.set("content", "This map depicts historical or forecasted time series data for the selected climate variable (max temp, min temp, precipitation, potential evapotranspiration) based on the selected RCP scenario (2.6, 4.0, 6.5 8.5) and the selected season."); 		
    			return;    			    			
    		}
    	}
    	else if (actionType == "eaDfsLink") {
    		if (layerId==window.timeSeriesLayerId) {
	    		var climateVar = document.getElementById("climateSelection").value;
	    		var climateVar2 = climateVar.replace("Max", "").replace("Min", "");
    			window.open(window.dataFactSheet + "Supplemental/Climate_" + climateVar2 + ".pdf");
    			return; 
    		}
    	}
    	layerInfoFromJson = {};
    	
        var eaID = layerId.replace(window.layerIdPrefix, "");
        
		//check if layer is from Featured Collection   	
		bFeaturedCollection = false;
		var eaIDFromFeaturedCollection = window.hashFeaturedCollectionToEAID[layerId]; 
		if (((eaIDFromFeaturedCollection != null) && (eaIDFromFeaturedCollection != undefined))) {
    			eaID = eaIDFromFeaturedCollection;
    			bFeaturedCollection = true;
		}
        
        var arrXmlPath = [];
        if (((layerId.indexOf(window.layerIdPrefix)) >= 0)||(bFeaturedCollection == true)) {
			arrXmlPath.push("widgets/SimpleSearchFilter/config_layer.json");
			getInfoFromJsonWithEaID(getInfoWithEaID, arrXmlPath, eaID, actionType);
        }     
        else if (eaID==window.timeSeriesLayerId) {
    		var climateVar = document.getElementById("climateSelection").value;
        	metaDataIDFromVariable = window.timeSeriesMetadata[climateVar];
        	metaDataID = window.nationalMetadataDic[metaDataIDFromVariable];
            window.open(window.matadata + "?uuid=%7B" + metaDataID + "%7D");	       	
        }   
        else {
        	arrXmlPath.push("widgets/SimpleSearchFilter/config_layer.json");  	
        	getInfoFromJsonWithEaID(getInfoWithEaID, arrXmlPath, clickedURL, actionType);
        }    	
    };

  var clazz = declare([], {

    _candidateMenuItems: null,
    //_deniedItems: null,
    _displayItems: null,
    _layerInfo: null,
    _layerType: null,
    _appConfig: null,

    constructor: function(layerInfo, displayItemInfos, layerType, layerListWidget) {
      this.nls = NlsStrings.value;
      this._layerInfo = layerInfo;
      this._layerType = layerType;
      layerInfoFromJson = {};
      this.layerListWidget = layerListWidget;
      this._initCandidateMenuItems();
      this._initDisplayItems(displayItemInfos);
    },

    _getATagLabel: function() {
      var url;
      var label;
      var itemLayerId = this._layerInfo.isItemLayer && this._layerInfo.isItemLayer();
      var layerUrl = this._layerInfo.getUrl();
      var basicItemInfo = this._layerInfo.isItemLayer();
      if (basicItemInfo) {
        url = this._getItemDetailsPageUrl(basicItemInfo) || layerUrl;
        label = this.nls.itemShowItemDetails;
      } else if (layerUrl &&
        (this._layerType === "CSVLayer" || this._layerType === "KMLLayer")) {
        url = layerUrl;
        label = this.nls.itemDownload;
      } else if (layerUrl && this._layerType === "WMSLayer") {
        url = layerUrl + (layerUrl.indexOf("?") > -1 ? "&" : "?") + "SERVICE=WMS&REQUEST=GetCapabilities";
        label = this.nls.itemDesc;
      } else if (layerUrl && this._layerType === "WFSLayer") {
        url = layerUrl + (layerUrl.indexOf("?") > -1 ? "&" : "?") + "SERVICE=WFS&REQUEST=GetCapabilities";
        label = this.nls.itemDesc;
      } else if (layerUrl) {
        url = layerUrl;
        label = this.nls.itemDesc;
      } else {
        url = '';
        label = this.nls.itemDesc;
      }
      this._ATagLabelUrl = url;
      return '<a class="menu-item-description" target="_blank" href="' +
        url + '">' + label + '</a>';
    },

    _getItemDetailsPageUrl: function(basicItemInfo) {
      var itemUrl = "";
      itemUrl = portalUrlUtils.getItemDetailsPageUrl(basicItemInfo.portalUrl, basicItemInfo.itemId);
      return itemUrl;
    },

    _initCandidateMenuItems: function() {
      //descriptionTitle: NlsStrings.value.itemDesc,
      // var layerObjectUrl = (this._layerInfo.layerObject && this._layerInfo.layerObject.url) ?
      //                       this._layerInfo.layerObject.url :
      //                       '';
      this._candidateMenuItems = [{
        key: 'separator',
        label: ''
      }, {
        key: 'empty',
        label: this.nls.empty
      }, {
        key: 'mapDescription',
        label: this.nls.itemMapDescription
      }, {
        key: 'dataFactSheet',
        label: this.nls.itemDataFactSheet
      }, {
        key: 'metadataDownload',
        label: this.nls.itemMetadataDownload
      }, {
        key: 'changeSymbology',
        label: this.nls.itemChangeSymbology
      },{
        key: 'remove',
        label: this.nls.itemRemove
      }, {
        key: 'movetotop',
        label: this.nls.itemMovetoTop
      }, {
        key: 'transparency',
        label: this.nls.itemTransparency
      }, {
        key: 'table',
        label: this.nls.itemToAttributeTable
      }, {
        key: 'controlPopup',
        label: this.nls.removePopup
      }, {
        key: 'controlLabels',
        label: this.nls.showLabels
      }, {
        key: 'url',
        label: this._getATagLabel()
      }];
    },

    _initDisplayItems: function(displayItemInfos) {
      this._displayItems = [];
      // according to candidate itmes to init displayItems
      array.forEach(displayItemInfos, function(itemInfo) {
        array.forEach(this._candidateMenuItems, function(item) {
          if (itemInfo.key === item.key) {
            this._displayItems.push(lang.clone(item));
            if (itemInfo.onClick) {
              this._displayItem.onClick = itemInfo.onClick;
            }
          }
        }, this);
      }, this);
    },

    _getSupportTableInfoForAllSublayers: function(layerInfo) {
      var defs = [];
      layerInfo.traversal(function(subLayerInfo) {
        var def = new Deferred();
        subLayerInfo.getSupportTableInfo().then(function(supportedInfo) {
          supportedInfo.layerInfo = subLayerInfo;
          def.resolve(supportedInfo);
        });
        defs.push(def);
      });
      return all(defs);
    },

    _isSupportedByAT: function(attributeTableWidget, allSupportedInfo) {
      /*jshint unused: false*/
      var isSupported = array.some(allSupportedInfo, function(supportTableInfo) {
        if(supportTableInfo.isSupportedLayer) {
          return true;
        } else {
          return false;
        }
      });
      return isSupported;
    },

    /*
    _isPopupSupported: function() {
      var def = new Deferred();
      var defs = [];
      this._layerInfo.traversal(function(layerInfo) {
        if(layerInfo.isLeaf()) {
          defs.push(layerInfo.loadInfoTemplate());
        }
      });

      all(defs).then(function(infoTemplates) {
        array.some(infoTemplates, function(infoTemplates) {
          if(infoTemplates) {
            def.resolve(true);
            return true;
          } else {
            def.resolve(false);
            return false;
          }
        });
      });
      return def;
    },
    */

    getDeniedItems: function() {
      // summary:
      //    the items that will be denied.
      // description:
      //    return Object = [{
      //   key: String, popupMenuInfo key,
      //   denyType: String, "disable" or "hidden"
      // }]
      var defRet = new Deferred();
      var dynamicDeniedItems = [];

      if (this.layerListWidget.layerListView.isFirstDisplayedLayerInfo(this._layerInfo)) {
        dynamicDeniedItems.push({
          'key': 'moveup',
          'denyType': 'disable'
        });
      }
      if (this.layerListWidget.layerListView.isLastDisplayedLayerInfo(this._layerInfo)) {
        dynamicDeniedItems.push({
          'key': 'movedown',
          'denyType': 'disable'
        });
      }

      if (!this._ATagLabelUrl) {
        dynamicDeniedItems.push({
          'key': 'url',
          'denyType': 'disable'
        });
      }

      // deny controlLabels
      if (!this._layerInfo.canShowLabel()) {
        dynamicDeniedItems.push({
          'key': 'controlLabels',
          'denyType': 'hidden'
        });
      }

      // deny setVisibilityRange
      if(this._layerInfo.originOperLayer.featureCollection) {
        dynamicDeniedItems.push({
          'key': 'setVisibilityRange',
          'denyType': 'hidden'
        });
      } else if(!this._layerInfo.isRootLayer() &&
          this._layerInfo.getRootLayerInfo().layerObject.declaredClass === "esri.layers.ArcGISTiledMapServiceLayer") {
        dynamicDeniedItems.push({
          'key': 'setVisibilityRange',
          'denyType': 'hidden'
        });
      } else if(!this._layerInfo.isRootLayer() &&
          this._layerInfo.getRootLayerInfo().layerObject.declaredClass === "esri.layers.ArcGISDynamicMapServiceLayer" &&
          !this._layerInfo.getRootLayerInfo().layerObject.supportsDynamicLayers) {
        dynamicDeniedItems.push({
          'key': 'setVisibilityRange',
          'denyType': 'disable'
        });
      } else if (this._layerInfo.isRootLayer() && (this._layerInfo.getRootLayerInfo().layerObject.declaredClass === "esri.layers.ArcGISImageServiceLayer")){
         dynamicDeniedItems.push({
          'key': 'changeSymbology',
          'denyType': 'hidden'
        });         
      }  //deny changeSymbology for ImageService
      

      //var loadInfoTemplateDef = this._layerInfo.loadInfoTemplate();
      var isPopupSupportedDef = this._layerInfo.isSupportPopupNested();
      var getSupportTableInfoDef = this._getSupportTableInfoForAllSublayers(this._layerInfo);

      all({
        //infoTemplate: loadInfoTemplateDef,
        isPopupSupported: isPopupSupportedDef,
        supportTableInfo: getSupportTableInfoDef
      }).then(lang.hitch(this, function(result) {

        // deny controlPopup
        if (!result.isPopupSupported) {
          dynamicDeniedItems.push({
            'key': 'controlPopup',
            'denyType': 'hidden'
          });
        }

        // deny table.
        var supportTableInfo = result.supportTableInfo;
        var attributeTableWidget =
              this.layerListWidget.appConfig.getConfigElementsByName("AttributeTable")[0];

        if (!attributeTableWidget || !attributeTableWidget.visible) {
          dynamicDeniedItems.push({
            'key': 'table',
            'denyType': 'hidden'
          });
        } else if (!this._isSupportedByAT(attributeTableWidget, supportTableInfo)) {
          dynamicDeniedItems.push({
            'key': 'table',
            'denyType': 'disable'
          });
          /*
          if(this._layerInfo.parentLayerInfo &&
             this._layerInfo.parentLayerInfo.isMapNotesLayerInfo()) {
            dynamicDeniedItems.push({
              'key': 'table',
              'denyType': 'hidden'
            });
          } else {
            dynamicDeniedItems.push({
              'key': 'table',
              'denyType': 'disable'
            });
          }
          */

        }
        defRet.resolve(dynamicDeniedItems);
      }), function() {
        defRet.resolve(dynamicDeniedItems);
      });

      return defRet;

    },

    getDisplayItems: function() {
      return this._displayItems;
    },

    onPopupMenuClick: function(evt) {
      var result = {
        closeMenu: true
      };
      switch (evt.itemKey) {
        case 'zoomto' /*this.nls.itemZoomTo'Zoom to'*/ :
          this._onItemZoomToClick(evt);
        case 'mapDescription':
          this._onItemMapDescriptionClick(evt);
          break;
        case 'dataFactSheet':
          this._onItemDataFactSheetClick(evt);
          break;
        case 'metadataDownload':
          this._onItemMetadataDownloadClick(evt);
          break;    
        case 'changeSymbology':
          this._onItemChangeSymbologyClick(evt);
          break;                             
        case 'remove':
          this._onItemRemoveClick(evt);
          break;                            
        case 'movetotop':
          this._onMoveToTopClick(evt);
          break;
        case 'moveup' /*this.nls.itemMoveUp'Move up'*/ :
          this._onMoveUpItemClick(evt);
          break;
        case 'movedown' /*this.nls.itemMoveDown'Move down'*/ :
          this._onMoveDownItemClick(evt);
          break;
        case 'table' /*this.nls.itemToAttributeTable'Open attribute table'*/ :
          this._onTableItemClick(evt);
          break;
        case 'transparencyChanged':
          this._onTransparencyChanged(evt);
          result.closeMenu = false;
          break;
        case 'controlPopup':
          this._onControlPopup();
          break;
        case 'controlLabels':
          this._onControlLabels();
          break;

      }
      return result;
    },

    /**********************************
     * Respond events respectively.
     *
     * event format:
      // evt = {
      //   itemKey: item key
      //   extraData: estra data,
      //   layerListWidget: layerListWidget,
      //   layerListView: layerListView
      // }, result;
     **********************************/
    _onItemZoomToClick: function(evt) {
      /*jshint unused: false*/
      this._layerInfo.zoomTo();
    },
    _onMoveToTopClick: function(evt) {
      /*jshint unused: false*/

        lyr = this._layerInfo.map.getLayer(this._layerInfo.id);
        if (window.topLayerID != "") {
        	var topLayerChkbox = document.getElementById(window.layerTitlePrefix + window.topLayerID);
        	if (topLayerChkbox != null) {
        		topLayerChkbox.style['font-weight'] = '400';
        	}     
        	if (window.topLayerID.indexOf("eaLyrDEMNum_") >= 0) {
                dynamicLayerElem = document.getElementById("map_" + window.topLayerID);
                if (dynamicLayerElem != null){
                    dynamicLayerElem.style.zIndex = "0";//with 0 z-index, the layer will be drawing at bottom
                }
            }   	
        }
        window.topLayerID = this._layerInfo.id;
        document.getElementById(window.layerTitlePrefix + this._layerInfo.id).style['font-weight'] = 'bold';
        isDynamicLayer = false;
        isTiledLayer = false;
        isImageLayer = false;
        isDemographicLayer = false;
		if(lyr){
			for (ii in window.dynamicLayerNumber) {
				eachDynamicLyrId = window.layerIdPrefix + window.dynamicLayerNumber[ii];
				if (eachDynamicLyrId == this._layerInfo.id) {
					isDynamicLayer = true;
				}
				eachDynamicLyr = this._layerInfo.map.getLayer(eachDynamicLyrId);
				if (eachDynamicLyr ){
					dynamicLayerElem = document.getElementById("map_" + eachDynamicLyrId);
					if (dynamicLayerElem != null){
						dynamicLayerElem.style.zIndex = "0";//with 0 z-index, the layer will be drawing at bottom
					}
				}
		  	}
			for (ii in window.tiledLayerNumber) {
				eachTiledLyrId = window.layerIdPrefix + window.tiledLayerNumber[ii];
				if (eachTiledLyrId == this._layerInfo.id) {
					isTiledLayer = true;
				}
				eachTiledLyr = this._layerInfo.map.getLayer(eachTiledLyrId);
				if (eachTiledLyr ){
					tiledLayerElem = document.getElementById("map_" + eachTiledLyrId);
					if (tiledLayerElem != null){
						tiledLayerElem.style.zIndex = "0";
					}
				}
		  	}
			for (ii in window.imageLayerNumber) {
				eachImageLyrId = window.layerIdPrefix + window.imageLayerNumber[ii];
				if (eachImageLyrId == this._layerInfo.id) {
					isImageLayer = true;
				}
				eachImageLyr = this._layerInfo.map.getLayer(eachImageLyrId);
				if (eachImageLyr ){
					imageLayerElem = document.getElementById("map_" + eachImageLyrId);
					if (imageLayerElem != null){
						imageLayerElem.style.zIndex = "0";
					}
				}
		  	}		  	
            if (this._layerInfo.id.indexOf("eaLyrDEMNum_") >= 0) {
                isDemographicLayer = true;
            }
			if ((isDynamicLayer == true)||(isTiledLayer == true)||(isImageLayer == true)||(isDemographicLayer == true)) {
     			document.getElementById("map_" + this._layerInfo.id).style.zIndex = "1";
	     	} 	
	     	else {
        		//this._layerInfo.map.reorderLayer(lyr,this._layerInfo.map.layerIds.length);
        		this._layerInfo.map.reorderLayer(lyr, topLayerIndex);
      	}   
      	
      	}   
        lyrTiled = this._layerInfo.map.getLayer(window.layerIdTiledPrefix + this._layerInfo.id.replace(window.layerIdPrefix, "")); //bji need to be modified to accomodate tile.
	    if(lyrTiled){
       	     //this._layerInfo.map.reorderLayer(lyrTiled,this._layerInfo.map.layerIds.length);
       	     this._layerInfo.map.reorderLayer(lyrTiled, topLayerIndex);
        } 
    },

    _isValidExtent: function(extent){
      var isValid = false;
      if(esriLang.isDefined(extent)){
        if(esriLang.isDefined(extent.xmin) && isFinite(extent.xmin) &&
           esriLang.isDefined(extent.ymin) && isFinite(extent.ymin) &&
           esriLang.isDefined(extent.xmax) && isFinite(extent.xmax) &&
           esriLang.isDefined(extent.ymax) && isFinite(extent.ymax)){
          isValid = true;
        }
      }
      return isValid;
    },

    _onMoveUpItemClick: function(evt) {
      if (!this._layerInfo.isFirst) {
        evt.layerListView.moveUpLayer(this._layerInfo);
      }
    },

    _onMoveDownItemClick: function(evt) {
      if (!this._layerInfo.isLast) {
        evt.layerListView.moveDownLayer(this._layerInfo);
      }
    },

    _onTableItemClick: function(evt) {
      this._getSupportTableInfoForAllSublayers(this._layerInfo).then(lang.hitch(this, function(allSupportTableInfo) {
        var widgetManager;
        var attributeTableWidgetEle =
                    this.layerListWidget.appConfig.getConfigElementsByName("AttributeTable")[0];
        if(this._isSupportedByAT(attributeTableWidgetEle, allSupportTableInfo)) {
          widgetManager = WidgetManager.getInstance();

          array.forEach(allSupportTableInfo, function(supportTableInfo) {
            if(supportTableInfo.isSupportedLayer) {
              widgetManager.triggerWidgetOpen(attributeTableWidgetEle.id)
              .then(lang.hitch(this, function(atWidget) {
                if (atWidget) {
                  widgetManager.activateWidget(atWidget);
                }
                evt.layerListWidget.publishData({
                  'target': 'AttributeTable',
                  'layer': supportTableInfo.layerInfo
                });
              }));
            }
          }, this);

        }
      }));
    },

    _onItemMapDescriptionClick: function(evt) {
        layerId = this._layerInfo.id;        
        var clickedURL = this._layerInfo.layerObject.url;        
        displayInfoOnClickAction(layerId, clickedURL, 'eaDescription');       

    },
    _onItemDataFactSheetClick: function(evt) {
        layerId = this._layerInfo.id;        
		if (layerId==window.addedLayerIdPrefix + "ClimateChange") {
			var layerTitle  = this._layerInfo.title;
			
			if (layerTitle.indexOf("Temp") >=0) {
				window.open(window.dataFactSheet + "Supplemental/Climate_" + "Temp" + ".pdf");
				return; 
			} else if (layerTitle.indexOf("PET") >=0) {
				window.open(window.dataFactSheet + "Supplemental/Climate_" + "PET" + ".pdf");
				return; 
			} if (layerTitle.indexOf("Precip") >=0) {
				window.open(window.dataFactSheet + "Supplemental/Climate_" + "Precip" + ".pdf");
				return; 
			} 
		}
        var clickedURL = this._layerInfo.layerObject.url;        
        displayInfoOnClickAction(layerId, clickedURL, 'eaDfsLink');
    },
    _onItemChangeSymbologyClick: function(evt) {
      layerId = this._layerInfo.id;
	  if (layerId.indexOf(window.layerIdPrefix) > -1) {			
	      lyrTiled = this._layerInfo.map.getLayer(layerId.replace(window.layerIdPrefix, window.layerIdTiledPrefix));
		  if(lyrTiled){
       		lyrTiled.setVisibility(false);
		  }	
	  }

      this.layerListWidget.publishData({
        message: layerId
      }, true);

      var widgets = this.layerListWidget.appConfig.getConfigElementsByName('DynamicSymbology');
      var pm = PanelManager.getInstance();
      if(widgets[0].visible){
        pm.closePanel(widgets[0].id + "_panel");
      }
      pm.showPanel(widgets[0]);
      //var widgetId = widgets[0].id;
      //this.layerListWidget.openWidgetById(widgetId);
      //console.log(widgets);
      console.log('Open Dynamic Symbology');
    },    
    _onItemMetadataDownloadClick: function(evt) {
        layerId = this._layerInfo.id;        
        if (layerId==window.addedLayerIdPrefix + "ClimateChange") {
			var layerTitle  = this._layerInfo.title;
			var climateVariable = "";
			
			if (layerTitle.indexOf("TempMax") >=0) {
				climateVariable = "TempMax";				 
			} else if (layerTitle.indexOf("TempMin") >=0) {
				climateVariable = "TempMin";
			} else if (layerTitle.indexOf("PET") >=0) {
				climateVariable = "PET";
			} else if (layerTitle.indexOf("Precip") >=0) {
				climateVariable = "Precip";
			}
			metaDataIDFromVariable = window.timeSeriesMetadata[climateVariable];
        	metaDataID = window.nationalMetadataDic[metaDataIDFromVariable];
            window.open(window.matadata + "?uuid=%7B" + metaDataID + "%7D"); 
            return; 
		}
        var clickedURL = this._layerInfo.layerObject.url;        
        displayInfoOnClickAction(layerId, clickedURL, 'eaMetadata');
        

    },    
    _onItemRemoveClick: function(evt) {
        layerId = this._layerInfo.id;
        
        
		lyr = this._layerInfo.map.getLayer(layerId);
		if(lyr){  		
        	this._layerInfo.map.removeLayer(lyr);
        	uncheckRelatedCheckbox(layerId.replace(window.layerIdPrefix, ""));
        	if (window.demographicLayerSetting[layerId] != undefined) {
        		window.demographicLayerSetting[layerId] = null;
        	}
        	
			var bNationalFeaturedCollection = false;
		    var eaIDinFeatureCollection = window.hashFeaturedCollectionToEAID[layerId];
		    if (((eaIDinFeatureCollection !=null) && (eaIDinFeatureCollection !=undefined))) {
		          if ((window.hashScale[eaIDinFeatureCollection]== 'NATIONAL')){
		          		bNationalFeaturedCollection = true;
		          };
		    }	  
			            	
        	currentEAID = layerId.replace(window.layerIdPrefix, "");
        	if (window.nationalLayerNumber.includes(currentEAID) || (bNationalFeaturedCollection == true)){
				jimuUtils.adjustMapExtent(this._layerInfo.map);   			                            	
            }        	
        	
			var eaID = window.hashFeaturedCollectionToEAID[layerId]; //check if this layer is Featured Collection layer
    		if (((eaID != null) && (eaID != undefined))) {
    			var indexID = window.featureLyrNumber.indexOf(eaID);
				if (indexID > -1) {
				  window.featureLyrNumber.splice(indexID, 1);
				}
    			
    			
				lyrTiled = this._layerInfo.map.getLayer( window.layerIdTiledPrefix + eaID);
				if(lyrTiled){
		       		this._layerInfo.map.removeLayer(lyrTiled);
		      	} 	    			
    		}
    		        	
      	}    
      	
		lyrTiled = this._layerInfo.map.getLayer(layerId.replace(window.layerIdPrefix, window.layerIdTiledPrefix));
		if(lyrTiled){
		    var indexID = window.featureLyrNumber.indexOf(layerId.replace(window.layerIdPrefix, "" ));
			if (indexID > -1) {
			  window.featureLyrNumber.splice(indexID, 1);
			}
       		this._layerInfo.map.removeLayer(lyrTiled);
      	} 
      	
	
    },    
    _onTransparencyChanged: function(evt) {
      this.layerListWidget._denyLayerInfosOpacityResponseOneTime = true;
      this._layerInfo.setOpacity(1 - evt.extraData.newTransValue);
      layerId = this._layerInfo.id;
	  lyrTiled = this._layerInfo.map.getLayer(layerId.replace(window.layerIdPrefix, window.layerIdTiledPrefix));
	  if(lyrTiled){
       	  lyrTiled.setOpacity(1 - evt.extraData.newTransValue);
      }        
    },

    _onControlPopup: function(evt) {
      /*jshint unused: false*/
      //if (this._layerInfo.controlPopupInfo.enablePopup) {
      if(this._layerInfo.isPopupNestedEnabled()) {
        this._layerInfo.disablePopupNested();
      } else {
        this._layerInfo.enablePopupNested();
      }
      this._layerInfo.map.infoWindow.hide();
    },

    _onControlLabels: function(evt) {
      /*jshint unused: false*/
      if(this._layerInfo.canShowLabel()) {
        if(this._layerInfo.isShowLabels()) {
          this._layerInfo.hideLabels();
        } else {
          this._layerInfo.showLabels();
        }
      }
    }
  });

  clazz.create = function(layerInfo, layerListWidget) {
    var retDef = new Deferred();
    var isRootLayer = layerInfo.isRootLayer();
    var defaultItemInfos = [{
        key: 'controlPopup'
      }, {
        key: 'separator'
      }, {
        key: 'url',
        onClick: null
      }];

    var itemInfoCategoreList = {
      'RootLayer': [{
        key: 'zoomto'
      }, {
        key: 'transparency'
      }, {
        key: 'setVisibilityRange'
      }, {
        key: 'movetotop'
      }, {
        key: 'remove'
      },{
        key: 'separator'
      },{
        key: 'mapDescription'
      },{
        key: 'dataFactSheet'
      },{
        key: 'url'
      }, {
        key: 'metadataDownload'
      } ],
      'RootLayerAndNonFeatureLayer': [
      {
        key: 'transparency'
      }, {
        key: 'movetotop'
      }, {
        key: 'remove'
      }, {
        key: 'separator'
      },  {
        key: 'mapDescription'
      }, {
        key: 'dataFactSheet'
      }, {
        key: 'url'
      }, {
        key: 'metadataDownload'
      }, {
        key: 'separator'
      }, {
        key: 'table'
      }],
      'RootLayerAndFeatureLayer': [{
        key: 'zoomto'
      }, {
        key: 'transparency'
      }, {
        key: 'setVisibilityRange'
      },  {
        key: 'movetotop'
      }, {
        key: 'changeSymbology'
      }, /*{
        key: 'controlPopup'
      },*/ {
        key: 'remove'
      }, {
        key: 'separator'
      },  {
        key: 'mapDescription'
      }, {
        key: 'dataFactSheet'
      }, {
        key: 'url'
      }, {
        key: 'metadataDownload'
      }, {
        key: 'separator'
      }, {
        key: 'controlLabels'
      }, {
        key: 'separator'
      }, {
        key: 'table'
      }],
      'FeatureLayer': [{
        key: 'setVisibilityRange'
      }, {
        key: 'separator'
      },{
        key: 'controlPopup'
      }, {
        key: 'separator'
      }, {
        key: 'table'
      }, {
        key: 'separator'
      }, {
        key: 'url'
      }],
      'SublayerOfDynamicMapserviceLayer': [{
        key: 'setVisibilityRange'
      }, {
        key: 'separator'
      }, {
        key: 'url'
      }],
      'GroupLayer': [{
        key: 'setVisibilityRange'
      }, {
        key: 'separator'
      }, {
        key: 'url'
      }],
      'Table': [{
        key: 'table'
      }, {
        key: 'separator'
      }, {
        key: 'url'
      }],
      'BasemapLayer': [{
        key: 'zoomto'
      }, {
        key: 'transparency'
      }, {
        key: 'separator'
      }, {
        key: 'url'
      }],
      'default': defaultItemInfos
    };

    layerInfo.getLayerType().then(lang.hitch(this, function(layerType) {
      var itemInfoCategory = "";
      if (layerInfo.isBasemap() && layerInfo.isRootLayer()) {
        itemInfoCategory = "BasemapLayer";
      } else if(layerInfo.isBasemap()) {
        itemInfoCategory = "default";
      } else if (isRootLayer &&
          (layerType === "FeatureLayer" ||
            layerType === "CSVLayer" ||
            layerType === "ArcGISImageServiceLayer" ||
            layerType === "StreamLayer" ||
            layerType === "ArcGISImageServiceVectorLayer")) {
        itemInfoCategory = "RootLayerAndFeatureLayer";
      } else if (isRootLayer) {
        itemInfoCategory = "RootLayer";
      } else if (layerType === "FeatureLayer" || layerType === "CSVLayer") {
        itemInfoCategory = "FeatureLayer";
      } else if (layerInfo.isLeaf() &&
                layerInfo.getRootLayerInfo() &&
                layerInfo.getRootLayerInfo().layerObject &&
                layerInfo.getRootLayerInfo().layerObject.declaredClass === "esri.layers.ArcGISDynamicMapServiceLayer") {
        itemInfoCategory = "SublayerOfDynamicMapserviceLayer";
      } else if (layerType === "GroupLayer") {
        itemInfoCategory = "GroupLayer";
      } else if (layerType === "Table") {
        itemInfoCategory = "Table";
      } else {
        //default condition
        itemInfoCategory = "default";
      }
      retDef.resolve(new clazz(layerInfo,
        itemInfoCategoreList[itemInfoCategory],
        layerType,
        layerListWidget));
    }), lang.hitch(this, function() {
      //return default popupmenu info.
      retDef.resolve(new clazz(layerInfo, [{
        key: 'empty'
      }]));
    }));
    return retDef;
  };


  return clazz;
});
