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
  'dojo/_base/array',
  'dojo/_base/lang',
  'dojo/Deferred',
  'dojo/promise/all',
  'jimu/portalUrlUtils',
  'jimu/WidgetManager',
  'jimu/PanelManager',
  'esri/lang',
  'esri/graphicsUtils',
  './NlsStrings',
  'dijit/Dialog'
], function(declare, array, lang, Deferred, all, portalUrlUtils, WidgetManager, PanelManager, esriLang,
  graphicsUtils, NlsStrings,Dialog) {
  var mapDescriptionStr = "";
  var uncheckRelatedCheckbox = function (chkboxLayerId){
    	var chkSimpleSearch = document.getElementById(window.chkSelectableLayer + chkboxLayerId);
    	if((chkSimpleSearch != null) && (chkSimpleSearch.checked == true)){	
    		chkSimpleSearch.checked = false;    		
    	}
   };
  var loadJSON = function(callback){   

        var xobj = new XMLHttpRequest();

        xobj.overrideMimeType("application/json");
        xobj.open('GET', 'widgets/LocalLayer/config.json', true); // Replace 'my_data' with the path to your file

        xobj.onreadystatechange = function () {
              if (xobj.readyState == 4 && xobj.status == "200") {
                // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
                callback(xobj.responseText);
              }
        };
        xobj.send(null);  
    };
  var loadJSONPBS = function(callback){   

        var xobj = new XMLHttpRequest();

        xobj.overrideMimeType("application/json");
        xobj.open('GET', 'widgets/PeopleAndBuildSpaces/config.json', true); // Replace 'my_data' with the path to your file

        xobj.onreadystatechange = function () {
              if (xobj.readyState == 4 && xobj.status == "200") {
                // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
                callback(xobj.responseText);
              }
        };
        xobj.send(null);  
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
      this.layerListWidget = layerListWidget;
      this._initCandidateMenuItems();
      this._initDisplayItems(displayItemInfos);
    },

    _getATagLabel: function() {
      var url;
      var label;
      var itemLayerId = this._layerInfo._isItemLayer && this._layerInfo._isItemLayer();

      if (itemLayerId) {
        url = portalUrlUtils.getItemDetailsPageUrl(
                portalUrlUtils.getStandardPortalUrl(this.layerListWidget.appConfig.portalUrl),
                itemLayerId);
        label = this.nls.itemShowItemDetails;
      } else if (this._layerInfo.layerObject &&
        this._layerInfo.layerObject.url &&
        (this._layerType === "CSVLayer" || this._layerType === "KMLLayer")) {
        url = this._layerInfo.layerObject.url;
        label = this.nls.itemDownload;
      } else if (this._layerInfo.layerObject && this._layerInfo.layerObject.url) {
        url = this._layerInfo.layerObject.url;
        label = this.nls.itemDesc;
      } else {
        url = '';
        label = this.nls.itemDesc;
      }

      return '<a class="menu-item-description" target="_blank" href="' +
        url + '">' + label + '</a>';
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
        key: 'moveup',
        label: this.nls.itemMoveUp
      }, {
        key: 'movedown',
        label: this.nls.itemMoveDown
      }, {
        key: 'table',
        label: this.nls.itemToAttributeTable
      }, {
        key: 'controlPopup',
        label: this.nls.removePopup
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

      if (this._layerInfo.isFirst) {
        dynamicDeniedItems.push({
          'key': 'moveup',
          'denyType': 'disable'
        });
      }
      if (this._layerInfo.isLast) {
        dynamicDeniedItems.push({
          'key': 'movedown',
          'denyType': 'disable'
        });
      }

      if (!this._layerInfo.layerObject || !this._layerInfo.layerObject.url) {
        dynamicDeniedItems.push({
          'key': 'url',
          'denyType': 'disable'
        });
      }

      var loadInfoTemplateDef = this._layerInfo.loadInfoTemplate();
      var getSupportTableInfoDef = this._layerInfo.getSupportTableInfo();

      all({
        infoTemplate: loadInfoTemplateDef,
        supportTableInfo: getSupportTableInfoDef
      }).then(lang.hitch(this, function(result) {

        // deny controlPopup
        if (!result.infoTemplate) {
          dynamicDeniedItems.push({
            'key': 'controlPopup',
            'denyType': 'disable'
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
        } else if (!supportTableInfo.isSupportedLayer ||
                   !supportTableInfo.isSupportQuery ||
                   supportTableInfo.otherReasonCanNotSupport) {
          dynamicDeniedItems.push({
            'key': 'table',
            'denyType': 'disable'
          });
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
    _onItemLinkClick: function(evt) {
            window.open("http://www.google.com");
    },
    _onMoveToTopClick: function(evt) {
      /*jshint unused: false*/

        lyr = this._layerInfo.map.getLayer(this._layerInfo.id);
		if(lyr){
        	this._layerInfo.map.reorderLayer(lyr,this._layerInfo.map.layerIds.length);
      	}   
      	
        lyrTiled = this._layerInfo.map.getLayer(window.layerIdTiledPrefix + this._layerInfo.id.replace(window.layerIdPrefix, "")); //bji need to be modified to accomodate tile.
	    if(lyrTiled){
       	     this._layerInfo.map.reorderLayer(lyrTiled,this._layerInfo.map.layerIds.length);
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
        evt.layerListView.moveUpLayer(this._layerInfo.id);
      }
    },

    _onMoveDownItemClick: function(evt) {
      if (!this._layerInfo.isLast) {
        evt.layerListView.moveDownLayer(this._layerInfo.id);
      }
    },
    _onTableItemClick: function(evt) {
      this._layerInfo.getSupportTableInfo().then(lang.hitch(this, function(supportTableInfo) {
        var widgetManager;
        var attributeTableWidgets;
        var attributeTableHasLoaded;
        if(supportTableInfo.isSupportedLayer &&
           supportTableInfo.isSupportQuery) {
          widgetManager = WidgetManager.getInstance();
          attributeTableWidgets = widgetManager.getWidgetsByName("AttributeTable");
          attributeTableHasLoaded = attributeTableWidgets.length > 0;
          if(attributeTableHasLoaded) {
            if(attributeTableWidgets[0].state !== 'closed') {
              // publish data
              evt.layerListWidget.publishData({
                'target': 'AttributeTable',
                'layer': this._layerInfo
              });
            } else {
              widgetManager.openWidget(attributeTableWidgets[0].id);
              evt.layerListWidget.publishData({
                'target': 'AttributeTable',
                'layer': this._layerInfo
              });
            }
          } else {
            var attributeTableWidget =
                      this.layerListWidget.appConfig.getConfigElementsByName("AttributeTable")[0];
            evt.layerListWidget.openWidgetById(attributeTableWidget.id)
            .then(lang.hitch(this, function() {
              evt.layerListWidget.publishData({
                'target': 'AttributeTable',
                'layer': this._layerInfo
              });
            }));
          }
        }
      }));
    },

    _onItemMapDescriptionClick: function(evt) {
        layerId = this._layerInfo.id;

        var clickedURL = this._layerInfo.layerObject.url;
        var bMapDescriptionAvailale = false;
        if ((layerId.indexOf(window.layerIdPrefix)) >= 0) {
	        loadJSON(function(response) {
	            var localLayerConfig = JSON.parse(response);           
	            
	            var urlInConfig = "";
	            
	            var arrLayers = localLayerConfig.layers.layer;
	            for (index = 0, len = arrLayers.length; index < len; ++index) {
	                layer = arrLayers[index];
	                if(layer.hasOwnProperty('eaID')){
				        if(layer.hasOwnProperty('eaLyrNum')){
				            urlInConfig = layer.url + "/" + layer.eaLyrNum.toString();
				        }                	
	                    if ((layerId === (window.layerIdPrefix + layer.eaID.toString()))||(clickedURL === urlInConfig)) {
	                        if(layer.hasOwnProperty('eaDescription')){
						    	var mapDescription = new Dialog({
							        title: layer.name,
							        style: "width: 300px",    
						    	});
						        mapDescription.show();
						        mapDescription.set("content", layer.eaDescription);
						        bMapDescriptionAvailale = true;
	                            break;
	                        }
	                    }
	                }
	            }
	            if (!bMapDescriptionAvailale){
	            	alert("Map description is not available for this layer");
	            }
	        });
       }
       else if ((layerId.indexOf(window.layerIdPBSPrefix)) >= 0) {
	        loadJSONPBS(function(response) {
	            var localLayerConfig = JSON.parse(response);           
	            
	            var urlInConfig = "";
	            
	            var arrLayers = localLayerConfig.layers.layer;
	            for (index = 0, len = arrLayers.length; index < len; ++index) {
	                layer = arrLayers[index];
	                if(layer.hasOwnProperty('eaID')){
				        if(layer.hasOwnProperty('eaLyrNum')){
				            urlInConfig = layer.url + "/" + layer.eaLyrNum.toString();
				        }                	
	                    if ((layerId === (window.layerIdPBSPrefix + layer.eaID.toString()))||(clickedURL === urlInConfig)) {
	                        if(layer.hasOwnProperty('eaDescription')){
						    	var mapDescription = new Dialog({
							        title: layer.name,
							        style: "width: 300px",    
						    	});
						        mapDescription.show();
						        mapDescription.set("content", layer.eaDescription);
						        bMapDescriptionAvailale = true;
	                            break;
	                        }
	                    }
	                }
	            }
	            if (!bMapDescriptionAvailale){
	            	alert("Map description is not available for this layer");
	            }
	        });
       }       
    },
    _onItemDataFactSheetClick: function(evt) {
        layerId = this._layerInfo.id;
        
        var clickedURL = this._layerInfo.layerObject.url;
        var bDataFactSheetAvailale = false;
                
        loadJSON(function(response) {
            var localLayerConfig = JSON.parse(response);
            
            var urlInConfig = "";
            
            var arrLayers = localLayerConfig.layers.layer;           
            for (index = 0, len = arrLayers.length; index < len; ++index) {
                layer = arrLayers[index];
                if(layer.hasOwnProperty('eaID')){
			        if(layer.hasOwnProperty('eaLyrNum')){
			            urlInConfig = layer.url + "/" + layer.eaLyrNum.toString();
			        }                	
                    if ((layerId === (window.layerIdPrefix + layer.eaID.toString()))||(clickedURL === urlInConfig)) {      
                        if(layer.hasOwnProperty('eaDfsLink')){
                        	if (layer.eaDfsLink.trim() != ""){
                            window.open(window.dataFactSheet + layer.eaDfsLink);
					        bDataFactSheetAvailale = true;
                            break;
                        	}
                        }
                    }
                }
            }
            if (!bDataFactSheetAvailale){
            	alert("Data fact sheet is not available for this layer");
            }

        });
    },
    _onItemChangeSymbologyClick: function(evt) {
      layerId = this._layerInfo.id;

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
        
        var clickedURL = this._layerInfo.layerObject.url;
        var bMetadataAvailale = false;
                
        loadJSON(function(response) {
            var localLayerConfig = JSON.parse(response);
            
            var urlInConfig = "";
            
            var arrLayers = localLayerConfig.layers.layer;           
            for (index = 0, len = arrLayers.length; index < len; ++index) {
                layer = arrLayers[index];
                if(layer.hasOwnProperty('eaID')){
			        if(layer.hasOwnProperty('eaLyrNum')){
			            urlInConfig = layer.url + "/" + layer.eaLyrNum.toString();
			        }                	
                    if ((layerId === (window.layerIdPrefix + layer.eaID.toString()))||(clickedURL === urlInConfig)) {                        	
                    	if(layer.hasOwnProperty('eaMetadata')){
	                    	if (layer.hasOwnProperty('eaScale') &&  (layer.eaScale == "NATIONAL")) {
	                        	metaDataID = window.nationalMetadataDic[layer.eaMetadata];
	                            window.open(window.matadata + "?uuid=%7B" + metaDataID + "%7D");
						        bMetadataAvailale = true;                    		
	                    	} else {
	                    		if (window.communitySelected == window.strAllCommunity){
		                            window.open(window.communityMetadataDic[layer.eaMetadata][window.communitySelected]);
							        bMetadataAvailale = true;		                    			
	                    		} else {
	                        	metaDataID = window.communityMetadataDic[layer.eaMetadata][window.communitySelected];
	                            window.open(window.matadata + "?uuid=%7B" + metaDataID + "%7D");
						        bMetadataAvailale = true;	                    		
	                    		}
	                    	}     		

					    }
                            
                        
                        break;
                    }
                }
            }
            if (!bMetadataAvailale){
            	alert("Matadata is not available for this layer");
            }

        });
    },    
    _onItemRemoveClick: function(evt) {
        layerId = this._layerInfo.id;
		lyr = this._layerInfo.map.getLayer(layerId);
		if(lyr){
        	this._layerInfo.map.removeLayer(lyr);
        	uncheckRelatedCheckbox(layerId.replace(window.layerIdPrefix, ""));
        	uncheckRelatedCheckbox(layerId.replace(window.layerIdBndrPrefix, ""));
        	uncheckRelatedCheckbox(layerId.replace(window.layerIdPBSPrefix, ""));
      	}          
		lyrTiled = this._layerInfo.map.getLayer(layerId.replace(window.layerIdPrefix, window.layerIdTiledPrefix));
		if(lyrTiled){
       		this._layerInfo.map.removeLayer(lyrTiled);
      	}        	
    },    
    _onTransparencyChanged: function(evt) {
      this._layerInfo.setOpacity(1 - evt.extraData.newTransValue);
      layerId = this._layerInfo.id;
	  lyrTiled = this._layerInfo.map.getLayer(layerId.replace(window.layerIdPrefix, window.layerIdTiledPrefix));
	  if(lyrTiled){
       	  lyrTiled.setOpacity(1 - evt.extraData.newTransValue);
      }  	  
    },

    _onControlPopup: function(evt) {
      /*jshint unused: false*/
      if (this._layerInfo.controlPopupInfo.enablePopup) {
        this._layerInfo.disablePopup();
      } else {
        this._layerInfo.enablePopup();
      }
      this._layerInfo.map.infoWindow.hide();
    }
  });

  clazz.create = function(layerInfo, layerListWidget) {
    var retDef = new Deferred();
    var isRootLayer = layerInfo.isRootLayer();
    var defaultItemInfos = [{
      key: 'url',
      onClick: null
    }];

    var itemInfoCategoreList = {
      'RootLayer': [
      {
        key: 'transparency'
      }, {
        key: 'remove'
      },{
        key: 'separator'
      }, {
        key: 'mapDescription'
      }, {
        key: 'url'
      }, {
        key: 'separator'
      }, {
        key: 'movetotop'
      }, {
        key: 'moveup'
      }, {
        key: 'movedown'
      } ],
      'RootLayerAndFeatureLayer': [
      {
        key: 'transparency'
      }, {
        key: 'changeSymbology'
      }, {
        key: 'controlPopup'
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
      }, {
        key: 'separator'
      }, {
        key: 'movetotop'
      }, {
        key: 'moveup'
      }, {
        key: 'movedown'
      }],
      'FeatureLayer': [{
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
      'GroupLayer': [{
        key: 'url'
      }],
      'Table': [{
        key: 'table'
      }, {
        key: 'separator'
      }, {
        key: 'url'
      }],
      'default': defaultItemInfos
    };

    layerInfo.getLayerType().then(lang.hitch(this, function(layerType) {
      var itemInfoCategory = "";
      if (isRootLayer &&
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