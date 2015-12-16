/*global define, window, dojo*/
define([
 'dojo/_base/declare',
 'jimu/BaseWidget',
 'jimu/ConfigManager',
 'jimu/MapManager',
 'esri/urlUtils',
 'dojo/_base/array',
 'dojo/_base/query',
 'dojo/topic',
 'esri/layers/ArcGISDynamicMapServiceLayer',
 'esri/layers/ArcGISTiledMapServiceLayer',
 'esri/layers/FeatureLayer',
 'esri/layers/ImageParameters',
 'esri/dijit/BasemapGallery',
 'esri/dijit/BasemapLayer',
 'esri/dijit/Basemap',
 'esri/basemaps',
 'esri/dijit/PopupTemplate',
 'dojo/domReady!'
  ],
  function (
    declare,
    BaseWidget,
    ConfigManager,
    MapManager,
    urlUtils,
    array,
    query,
    topic,
    ArcGISDynamicMapServiceLayer,
    ArcGISTiledMapServiceLayer,
    FeatureLayer,
    ImageParameters,
    BasemapGallery,
    BasemapLayer,
    Basemap,
    esriBasemaps,
    PopupTemplate) {
      var layerIdPrefix = "eaLyrNum_";
        

      var _addSelectedLayers = function(layersTobeAdded, selectedLayerNum) {
            var index, len;
            for (index = 0, len = layersTobeAdded.length; index < len; ++index) {
              layer = layersTobeAdded[index];
            //for (var layer in layersTobeAdded){
              var lLayer;
              var lOptions ={};
              if(layer.hasOwnProperty('opacity')){
                lOptions.opacity = layer.opacity;
              }
              if(layer.hasOwnProperty('visible') && !layer.visible){
                lOptions.visible = false;
              }else{
                lOptions.visible = true;
              }
              if(layer.name){
                lOptions.id = layer.name;
              }
              if(layer.type.toUpperCase() === 'DYNAMIC'){
                if(layer.imageformat){
                  var ip = new ImageParameters();
                  ip.format = layer.imageformat;
                  if(layer.hasOwnProperty('imagedpi')){
                    ip.dpi = layer.imagedpi;
                  }
                  lOptions.imageParameters = ip;
                }
                lLayer = new ArcGISDynamicMapServiceLayer(layer.url, lOptions);
                if(layer.name){
                  lLayer._titleForLegend = layer.name;
                  lLayer.title = layer.name;
                  lLayer.noservicename = true; 
                }
                if (layer.popup){
                  var finalInfoTemp = {};
                  array.forEach(layer.popup.infoTemplates, function(_infoTemp){
                    var popupInfo = {};
                    popupInfo.title = _infoTemp.title;
                    alert("popupInfo.title:" + popupInfo.title);
                    if(_infoTemp.description){
                      popupInfo.description = _infoTemp.description;
                    }else{
                      popupInfo.description = null;
                    }
                    if(_infoTemp.fieldInfos){
                      popupInfo.fieldInfos = _infoTemp.fieldInfos;
                    }
                    var _popupTemplate1 = new PopupTemplate(popupInfo);
                    finalInfoTemp[_infoTemp.layerId] = {infoTemplate: _popupTemplate1};
                  });
                  lLayer.setInfoTemplates(finalInfoTemp);
                }
                if(layer.disableclientcaching){
                  lLayer.setDisableClientCaching(true);
                }
                lLayer.on('load',function(evt){
                  var removeLayers = [];
                  array.forEach(evt.layer.visibleLayers,function(layer){
                    //remove any grouplayers
                    if (evt.layer.layerInfos[layer].subLayerIds){
                      removeLayers.push(layer);
                    }else{
                      var _layerCheck = dojo.clone(layer);
                      while (evt.layer.layerInfos[_layerCheck].parentLayerId > -1){
                        if (evt.layer.visibleLayers.indexOf(evt.layer.layerInfos[_layerCheck].parentLayerId) == -1){
                          removeLayers.push(layer);
                        }
                        _layerCheck = dojo.clone(evt.layer.layerInfos[_layerCheck].parentLayerId);
                      }
                    }
                  });
                  array.forEach(removeLayers,function(layerId){
                    evt.layer.visibleLayers.splice(evt.layer.visibleLayers.indexOf(layerId), 1);
                  });
                });
                this._viewerMap.addLayer(lLayer);
                this._viewerMap.setInfoWindowOnClick(true);
              }else if (layer.type.toUpperCase() === 'FEATURE') {
                var _popupTemplate;
                if (layer.popup){
                  _popupTemplate = new PopupTemplate(layer.popup);
                  lOptions.infoTemplate = _popupTemplate;
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
                lLayer = new FeatureLayer(layer.url, lOptions);
                if(layer.name){
                  lLayer._titleForLegend = layer.name;
                  lLayer.title = layer.name;
                  lLayer.noservicename = true;
                }
                lLayer.on('load',function(evt){
                  evt.layer.name = lOptions.id;
                });
                lLayer.id = layerIdPrefix + layer.eaLyrNum;
                var bNeedToBeAdded = false;
                var stringArray = selectedLayerNum.split(",");
                	for (i in stringArray) {
						if ((stringArray[i])==(layer.eaLyrNum)) {
						    bNeedToBeAdded = true;
						    break;
						}

					}   
                if (bNeedToBeAdded) {
                	this._viewerMap.addLayer(lLayer);
                }
              }else if(layer.type.toUpperCase() === 'TILED'){
                if(layer.displayLevels){
                  lOptions.displayLevels = layer.displayLevels;
                }
                if(layer.hasOwnProperty('autorefresh')){
                  lOptions.refreshInterval = layer.autorefresh;
                }
                lLayer = new ArcGISTiledMapServiceLayer(layer.url, lOptions);
                if(layer.name){
                  lLayer._titleForLegend = layer.name;
                  lLayer.title = layer.name;
                  lLayer.noservicename = true;
                }
                if (layer.popup){
                  var finalInfoTemp2 = {};
                  array.forEach(layer.popup.infoTemplates, function(_infoTemp){
                    var popupInfo = {};
                    popupInfo.title = _infoTemp.title;
                    alert("_infoTemp.title:" + _infoTemp.title);
                    if(_infoTemp.content){
                      popupInfo.description = _infoTemp.content;
                    }else{
                      popupInfo.description = null;
                    }
                    if(_infoTemp.fieldInfos){
                      popupInfo.fieldInfos = _infoTemp.fieldInfos;
                    }
                    var _popupTemplate2 = new PopupTemplate(popupInfo);
                    finalInfoTemp2[_infoTemp.layerId] = {infoTemplate: _popupTemplate2};
                  });
                  lLayer.setInfoTemplates(finalInfoTemp2);
                }
                this._viewerMap.addLayer(lLayer);
              }else if(layer.type.toUpperCase() === 'BASEMAP'){
                var bmLayers = array.map(layer.layers.layer, function(bLayer){
                  var bmLayerObj = {url:bLayer.url, isReference: false};
                  if(bLayer.displayLevels){
                    bmLayerObj.displayLevels = bLayer.displayLevels;
                  }
                  if(layer.hasOwnProperty('opacity')){
                    bmLayerObj.opacity = bLayer.opacity;
                  }
                  return new BasemapLayer(bmLayerObj);
                });
                var _newBasemap = new Basemap({id:'defaultBasemap', title:layer.name, layers:bmLayers});
                var _basemapGallery = new BasemapGallery({
                  showArcGISBasemaps: false,
                  map: this._viewerMap
                }, '_tmpBasemapGallery');
                _basemapGallery.add(_newBasemap);
                _basemapGallery.select('defaultBasemap');
                _basemapGallery.destroy();
              }
          }
      };
      var _removeSelectedLayers = function(selectedLayerNum) {
        var bNeedToBeAdded = false;
        var stringArray = selectedLayerNum.split(",");
        
    	for (i in stringArray) {
    		lyr = this._viewerMap.getLayer(layerIdPrefix + stringArray[i]);
			if(lyr){
            	this._viewerMap.removeLayer(lyr);
          	}
        }

      };
    var clazz = declare([BaseWidget], {
	  onReceiveData: function(name, widgetId, data, historyData) {
		  if(name !== 'SimpleSearchFilter'){
		    return;
		  }
		  var stringArray = data.message.split(",");
		  if (stringArray[0] == "a") {
		  	_addSelectedLayers(this.config.layers.layer, data.message.substring(2));
		  }
		  if (stringArray[0] == "r") {
		  	_removeSelectedLayers(data.message.substring(2));
		  }
	  },
      constructor: function() {
        this._originalWebMap = null;
      },

      onClose: function(){
        if (query('.jimu-popup.widget-setting-popup', window.parent.document).length === 0){
          var _currentExtent = dojo.clone(this.map.extent);
          var _changedData = {itemId:this._originalWebMap};
          var _newBasemap = topic.subscribe("mapChanged", function(_map){
            _newBasemap.remove();
            _map.setExtent(_currentExtent);
          });
          MapManager.getInstance().onAppConfigChanged(this.appConfig,'mapChange', _changedData);
        }
      },
      /*_removeSelectedLayers: function(selectedLayerNum) {
      	alert(selectedLayerNum);
        var bNeedToBeAdded = false;
        var stringArray = selectedLayerNum.split(",");
        
    	for (i in stringArray) {
    		alert(layerIdPrefix + stringArray[i]);
    		for(var l = this.map.layerIds.length - 1; l>1; l--){
    			
	          var lyr = this._viewerMap.getLayer(this.map.layerIds[l]);
	          alert("lyr.id: " + lyr.id);
	          if(lyr.id == layerIdPrefix + stringArray[i]){
	            this._viewerMap.removeLayer(lyr);
	          }
	        }
    		//this.map.getLayer(layerIdPrefix + stringArray[i]);
			//if(lyr){
			//	alert("layer removed");
            //	this.map.removeLayer(lyr);
          	//}
        }

     },*/
      _removeAllLayersExceptBasemap: function(){
        for(var l = this.map.layerIds.length - 1; l>1; l--){
          var lyr = this.map.getLayer(this.map.layerIds[l]);
          if(lyr){
            this.map.removeLayer(lyr);
          }
        }
        var f = this.map.graphicsLayerIds.length;
        while (f--){
          var fl = this.map.getLayer(this.map.graphicsLayerIds[f]);
            if(fl.declaredClass === 'esri.layers.FeatureLayer'){
            this.map.removeLayer(fl);
          }
        }
      },

      startup: function () {
        this._originalWebMap = this.map.webMapResponse.itemInfo.item.id;
        this._removeAllLayersExceptBasemap();
        if (this.config.useProxy) {
          urlUtils.addProxyRule({
            urlPrefix: this.config.proxyPrefix,
            proxyUrl: this.config.proxyAddress
          });
        }

        //_addLayersBaseOrSelection(this.config.layers.layer);//This is removed because layers are not added on startup
        //prepare for receiving data from SimpleSearchFilter
        this.inherited(arguments);
      	this.fetchDataByName('SimpleSearchFilter');
      }
    });
    return clazz;
  });
