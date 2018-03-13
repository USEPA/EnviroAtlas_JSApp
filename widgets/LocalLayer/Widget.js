/*global define, window, dojo*/
define([
        'dojo/_base/declare',
        'jimu/BaseWidget',
        'jimu/ConfigManager',
        'jimu/MapManager',
        'jimu/WidgetManager',
        'jimu/PanelManager',
        'jimu/utils',
        'esri/urlUtils',
	    'dojo/io-query',
	    'dojo/_base/lang',
        'dojo/_base/array',
        'dojo/_base/query',
        'dojo/topic',
	    'dojo/aspect',
	    'jimu/LayerInfos/LayerInfos',
	    'esri/geometry/webMercatorUtils',
	    'esri/tasks/PrintTask',
	    'esri/arcgis/utils',
        'esri/layers/ArcGISDynamicMapServiceLayer',
        'esri/layers/ArcGISTiledMapServiceLayer',
	    'esri/layers/ArcGISImageServiceLayer',
	    'esri/layers/WMSLayer',
	    'esri/layers/WMSLayerInfo',
        'esri/layers/FeatureLayer',
	    'esri/layers/WebTiledLayer',
        'esri/layers/ImageParameters',
            'esri/layers/ImageServiceParameters',
        'esri/symbols/SimpleLineSymbol',
        'esri/symbols/SimpleFillSymbol',
        'esri/renderers/SimpleRenderer',
        'esri/graphic',
 	    'esri/tasks/QueryTask',
        'esri/tasks/query',          
        'esri/renderers/ClassBreaksRenderer',
        'esri/geometry/Extent',
        'esri/InfoTemplate',
        'esri/dijit/BasemapGallery',
        'esri/dijit/BasemapLayer',
        'esri/dijit/Basemap',
        'esri/basemaps',
        'esri/dijit/PopupTemplate',
        'jimu/WidgetManager',
	    'esri/symbols/jsonUtils',
	    'esri/symbols/TextSymbol',
	    'esri/layers/LabelClass',  
	    'esri/Color',      
        'dojo/domReady!'
    ],
    function (
        declare,
        BaseWidget,
        ConfigManager,
        MapManager,
        WidgetManager,
        PanelManager,
        jimuUtils,
        urlUtils,
            ioQuery,
    	    lang,
        array,
    	    query,
        topic,
	    aspect,
	    LayerInfos,
	    webMercatorUtils,
	    PrintTask,
	    arcgisUtils,
        ArcGISDynamicMapServiceLayer,
        ArcGISTiledMapServiceLayer,
	    ArcGISImageServiceLayer,
	    WMSLayer,
	    WMSLayerInfo,
        FeatureLayer,
    	    WebTiledLayer,
        ImageParameters,
    	    ImageServiceParameters,
        SimpleLineSymbol,
        SimpleFillSymbol,
        SimpleRenderer,
        graphic,        
    	QueryTask,
    	query,        
        ClassBreaksRenderer,
        Extent,
        InfoTemplate,
        BasemapGallery,
        BasemapLayer,
        Basemap,
        esriBasemaps,
        PopupTemplate,
            WidgetManager,
            jsonUtils,
	    TextSymbol,
	    LabelClass,
	    Color) {
	//To do: set these community boundary layer properties from the config file.
	var communityBoundaryLayer = "https://enviroatlas.epa.gov/arcgis/rest/services/Communities/Community_Locations/MapServer";
	var communityBoundaryLayerID = "901"
	var minXCombinedExtent = 9999999999999;
	var minYCombinedExtent = 9999999999999;
	var maxXCombinedExtent = -9999999999999;
	var maxYCombinedExtent = -9999999999999;
	var spatialReference;
	var currentCommunity = "";
	var idCommuBoundaryPoly = "Boundary_Poly";
	var arrLayersToChangeSynbology = [];
	var Attribute = "";
	var loadBookmarkExtent = function(callback) {
		var xobj = new XMLHttpRequest();
		xobj.overrideMimeType("application/json");
		xobj.open('GET', 'configs/eBookmark/config_Enhanced Bookmark.json', true);
		xobj.onreadystatechange = function() {
			if (xobj.readyState == 4 && xobj.status == "200") {
				callback(xobj.responseText);
			}
		};
		xobj.send(null);
	};
	var loadSymbologyConfig = function(callback) {
		var xobj = new XMLHttpRequest();
		xobj.overrideMimeType("application/json");
		if (window.communitySelected != window.strAllCommunity) {
			xobj.open('GET', 'configs/CommunitySymbology/' + window.communitySelected + '_JSON_Symbol/Nulls/' + window.communitySelected + '_' + Attribute + ".json", true);
		} else {
			xobj.open('GET', 'configs/CommunitySymbology/' + 'AllCommunities' + '_JSON_Symbol/Nulls/' + 'CombComm' + '_' + Attribute + ".json", true);
		}
		xobj.onreadystatechange = function() {
			if (xobj.readyState == 4 && xobj.status == "200") {
				callback(xobj.responseText);
			}
		};
		xobj.send(null);
	};
	var sleep = function(ms) {
		var unixtime_ms = new Date().getTime();
		while (new Date().getTime() < unixtime_ms + ms) {
		}
	}
	var showDisplayLayerAddFailureWidget = function(layerName) {

		var widgetName = 'DisplayLayerAddFailure';
		var widgets = selfLocalLayer.appConfig.getConfigElementsByName(widgetName);
		var pm = PanelManager.getInstance();
		pm.showPanel(widgets[0]);
		selfLocalLayer.publishData({
			message : layerName
		});
	};

	//Function also used in PeopleBuiltSpaces/widget.js, ensure that edits are synchronized

	var getTextContent = function(graphic) {
		var commName = graphic.attributes.CommST;
		currentCommunity = commName;
		return "<b>" + window.communityDic[commName] + "</b><br /><button id = 'testButton2' dojoType='dijit.form.Button' onclick='selfLocalLayer.selectCurrentCommunity() '>Select this community</button>";
	};

	var addCommunityBoundaries = function() {
		var lyrBoundaryPoint = this._viewerMap.getLayer(window.idCommuBoundaryPoint);
		if (lyrBoundaryPoint == null) {
			var popupsTemplate = {}
			var locationTemplate = new InfoTemplate();
			locationTemplate.setTitle("EnviroAtlas Community Location");
			locationTemplate.setContent(getTextContent);
			var boundaryTemplate = new InfoTemplate();
			boundaryTemplate.setTitle("EnviroAtlas Community Boundary");
			boundaryTemplate.setContent(getTextContent);
			popupsTemplate[0] = {
				infoTemplate : locationTemplate
			};
			popupsTemplate[1] = {
				infoTemplate : boundaryTemplate
			};

			var communityLocationLayer = new ArcGISDynamicMapServiceLayer(communityBoundaryLayer);
			communityLocationLayer._titleForLegend = "EnviroAtlas Community Boundaries";
			communityLocationLayer.title = "EnviroAtlas Community Boundaries";
			communityLocationLayer.noservicename = true;
			communityLocationLayer.setInfoTemplates(popupsTemplate);

			communityLocationLayer.id = window.layerIdBndrPrefix + communityBoundaryLayerID;
			window.dynamicLayerNumber.push(communityBoundaryLayerID);
			window.idCommuBoundaryPoint = communityLocationLayer.id;
			chkboxId = window.chkSelectableLayer + communityBoundaryLayerID;
			if (dojo.byId(chkboxId)) {
				dojo.byId(chkboxId).checked = true;
			}
			selfLocalLayer.map.addLayer(communityLocationLayer);
		}

	}
	var _addSelectedLayers = function(layersTobeAdded, selectedLayerNum) {
		var index,
		    len;
		var selectedLayerArray = selectedLayerNum.split(",");
		for (i in selectedLayerArray) {
			for ( index = 0,
			len = layersTobeAdded.length; index < len; ++index) {
				layer = layersTobeAdded[index];
				if (layer.hasOwnProperty('eaID') && ((selectedLayerArray[i]) == (layer.eaID.toString()))) {
					var bNeedToBeAdded = true;
					var lLayer;
					var lOptions = {};
					if (layer.hasOwnProperty('opacity')) {
						lOptions.opacity = layer.opacity;
						// 1.0 has no transparency; 0.0 is 100% transparent
					}
					if (layer.hasOwnProperty('visible') && !layer.visible) {
						lOptions.visible = false;
					} else {
						lOptions.visible = true;
					}
					if (layer.name) {
						lOptions.id = layer.name;
					}
					if (layer.hasOwnProperty('hidelayers')) {
						if (layer.hidelayers) {
							lOptions.hidelayers = []
							lOptions.hidelayers = layer.hidelayers.split(',');
						}
					}
					if (layer.hasOwnProperty('minScale')) {
						lOptions.minScale = layer.minScale
					}
					if (layer.hasOwnProperty('maxScale')) {
						lOptions.maxScale = layer.maxScale
					}
					if (layer.type.toUpperCase() === 'DYNAMIC') {
						window.dynamicLayerNumber.push(layer.eaID);
						if (layer.imageformat) {
							var ip = new ImageParameters();
							ip.format = layer.imageformat;
							if (layer.hasOwnProperty('imagedpi')) {
								ip.dpi = layer.imagedpi;
							}
							lOptions.imageParameters = ip;
						}
						lLayer = new ArcGISDynamicMapServiceLayer(layer.url, lOptions);
						if (layer.hasOwnProperty('definitionQueries')) {
							var definitionQueries = JSON.parse(layer.definitionQueries)
							var layerDefinitions = []
							for (var prop in definitionQueries) {
								layerDefinitions[prop] = definitionQueries[prop];
							}
							lLayer.setLayerDefinitions(layerDefinitions);
						}
						if (layer.name) {
							lLayer._titleForLegend = layer.name;
							lLayer.title = layer.name;
							window.hashTitleToEAID[layer.name] = layer.eaID;
							lLayer.noservicename = true;
						}
						var popupConfig = jimuUtils.getPopups(layer);
						lLayer.setInfoTemplates(popupConfig);

						if (layer.hasOwnProperty('autorefresh')) {
							lLayer.refreshInterval = layer.autorefresh;

						}
						if (layer.disableclientcaching) {
							lLayer.setDisableClientCaching(true);
						}
						lLayer.on('error', function(evt) {
							console.log(evt);
						})
						lLayer.on('load', function(evt) {
							if (layer.flyPopups) {
								var _infoTemps = []
								evt.layer.layerInfos.forEach(function(layer) {
									_infoTemps.push({
										infoTemplate : new PopupTemplate({
											title : layer.name,
											fieldInfos : [{
												fieldName : "*",
												visible : true,
												label : "*"
											}]
										})
									})
								})
								evt.layer.setInfoTemplates(_infoTemps)
							}
							//set min/max scales if present
							if (lOptions.minScale) {
								evt.layer.setMinScale(lOptions.minScale)
							}
							if (lOptions.maxScale) {
								evt.layer.setMaxScale(lOptions.maxScale)
							}

							if (!lOptions.hasOwnProperty('hidelayers')) {
								lOptions.hidelayers = []
							}
							var removeLayers = []
							for (var i = 0; i < lOptions.hidelayers.length; i++) {
								lOptions.hidelayers[i] = parseInt(lOptions.hidelayers[i])
							}
							var showLayers = []
							array.forEach(evt.layer.layerInfos, function(layer) {
								showLayers.push(layer.id)
							})
							array.forEach(lOptions.hidelayers, function(id) {
								showLayers.splice(showLayers.indexOf(id), 1)
							})
							lOptions.hidelayers = showLayers
							var getArrayItemById = function(_array, _id) {
								var _matchItem;
								array.some(_array, function(_arrayItem) {
									if (_arrayItem.id == _id) {
										_matchItem = _arrayItem;
										return true;
									}
								})
								return _matchItem;
							}
							array.forEach(evt.layer.layerInfos, function(layer) {
								layer.defaultVisibility = false;
							})
							for (var i = 0; i < lOptions.hidelayers.length; i++) {
								getArrayItemById(evt.layer.layerInfos, lOptions.hidelayers[i]).defaultVisibility = true;
							}
							array.forEach(evt.layer.layerInfos, function(layer) {
								if (layer.subLayerIds) {
									if (removeLayers.indexOf(layer.id) == -1) {
										removeLayers.push(layer.id)
									};
								}
							})
							for (var i = 0; i < lOptions.hidelayers.length; i++) {
								var j = getArrayItemById(evt.layer.layerInfos, lOptions.hidelayers[i]).parentLayerId
								while (j > -1) {
									if (lOptions.hidelayers.indexOf(j) == -1) {
										if (removeLayers.indexOf(lOptions.hidelayers[i]) == -1) {
											removeLayers.push(lOptions.hidelayers[i])
										}
									}
									j = getArrayItemById(evt.layer.layerInfos, j).parentLayerId;
								}
							}
							array.forEach(removeLayers, function(layerId) {
								if (lOptions.hidelayers.indexOf(layerId) > -1) {
									lOptions.hidelayers.splice(lOptions.hidelayers.indexOf(layerId), 1)
								};
							})
							if (lOptions.hidelayers.length == 0) {
								lOptions.hidelayers.push(-1);
								lOptions.hidelayers.push(-1);
								lOptions.hidelayers.push(-1);
							}

							evt.layer.setVisibleLayers(lOptions.hidelayers);

							if (layer.hasOwnProperty('hideInLegends')) {
								var hideLegends = JSON.parse(layer.hideInLegends)
								var finalLegends = []
								for (var prop in hideLegends) {
									array.forEach(evt.layer.layerInfos, lang.hitch(this, function(layerInfo) {
										if (layerInfo.id == parseInt(prop)) {
											layerInfo.showLegend = !hideLegends[prop]
										}
									}))
								}
							}
							lLayer.layers = evt.layer.layerInfos
						});

						this._viewerMap.setInfoWindowOnClick(true);
					} else if (layer.type.toUpperCase() === 'IMAGE') {
						window.imageLayerNumber.push(layer.eaID);
						lOptions.imageServiceParameters = new ImageServiceParameters();
						var _popupTemplate;
						if (layer.popup) {
							_popupTemplate = new PopupTemplate(layer.popup);
							lOptions.infoTemplate = _popupTemplate;
						}
						lLayer = new ArcGISImageServiceLayer(layer.url, lOptions)
						if (layer.hasOwnProperty('hideInLegend')) {
							lLayer.showLegend = !layer.hideInLegend
						}
						if (layer.name) {
							lLayer._titleForLegend = layer.name;
							lLayer.title = layer.name;
							window.hashTitleToEAID[layer.name] = layer.eaID;
							lLayer.noservicename = true;
						}
						lLayer.on('load', function(evt) {
							if (lOptions.minScale) {
								evt.layer.setMinScale(lOptions.minScale)
							}
							if (lOptions.maxScale) {
								evt.layer.setMaxScale(lOptions.maxScale)
							}
							evt.layer.name = lOptions.id;
						});
						//_layersToAdd.push(lLayer);
					} else if (layer.type.toUpperCase() === 'WEBTILEDLAYER') {
						if (layer.hasOwnProperty('subdomains')) {
							lOptions.subDomains = layer.subdomains;
						}
						if (layer.hasOwnProperty('autorefresh')) {
							lOptions.refreshInterval = layer.autorefresh;
						}
						if (layer.hasOwnProperty('opacity')) {
							lOptions.opacity = layer.opacity;
						}
						lLayer = new WebTiledLayer(layer.url, lOptions)
						lLayer.on('load', function(evt) {
							if (lOptions.minScale) {
								evt.layer.setMinScale(lOptions.minScale)
							}
							if (lOptions.maxScale) {
								evt.layer.setMaxScale(lOptions.maxScale)
							}
							evt.layer.name = lOptions.id;
						});
						_layersToAdd.push(lLayer);
					} else if (layer.type.toUpperCase() === 'WEBTILEDBASEMAP') {
						lOptions.type = "WebTiledLayer"
						lOptions.url = layer.url
						if (layer.hasOwnProperty('subdomains')) {
							lOptions.subDomains = layer.subdomains;
						}
						if (layer.hasOwnProperty('autorefresh')) {
							lOptions.refreshInterval = layer.autorefresh;
						}
						if (layer.hasOwnProperty('opacity')) {
							lOptions.opacity = layer.opacity;
						}
						if (layer.hasOwnProperty('copyright')) {
							lOptions.copyright = layer.copyright;
						}
						var _newBasemap = new Basemap({
							id : 'defaultBasemap',
							title : layer.name,
							layers : [new BasemapLayer(lOptions)]
						});
						var _basemapGallery = new BasemapGallery({
							showArcGISBasemaps : false,
							map : this._viewerMap
						}, '_tmpBasemapGallery');
						_basemapGallery.add(_newBasemap);
						_basemapGallery.select('defaultBasemap');
						_basemapGallery.destroy();
					} else if (layer.type.toUpperCase() === 'FEATURE') {
						window.featureLyrNumber.push(layer.eaID);
						bPopup = true;
						var _popupTemplate;
						if (layer.popup) {
							window.hashPopup[layer.eaID] = layer.popup;
							if (layer.popup.fieldInfos) {
								fieldInfos = layer.popup.fieldInfos;
								if (fieldInfos[0].hasOwnProperty('fieldName')) {
									if (fieldInfos[0].fieldName == null) {
										bPopup = false;
									} else {
										Attribute = fieldInfos[0].fieldName;
										hashAttribute[layer.eaID.toString()] = Attribute;
									}
								} else {
									bPopup = false;
								}
							} else {
								bPopup = false;
							}
							if (bPopup) {
								_popupTemplate = new PopupTemplate(layer.popup);
								//lOptions.infoTemplate = _popupTemplate;
							} else {
								console.log("layer.eaID: " + +layer.eaID.toString() + " with no popup info defined");
							}
						}
						if (layer.hasOwnProperty('mode')) {
							var lmode;
							if (layer.mode === 'ondemand') {
								lmode = 1;
							} else if (layer.mode === 'snapshot') {
								lmode = 0;
							} else if (layer.mode === 'selection') {
								lmode = 2;
							}
							lOptions.mode = lmode;
						}
						lOptions.outFields = ['*'];
						if (layer.hasOwnProperty('autorefresh')) {
							lOptions.refreshInterval = layer.autorefresh;
						}
						if (layer.hasOwnProperty('showLabels')) {
							lOptions.showLabels = true;
						}

						if (bPopup) {
							if (layer.hasOwnProperty('eaLyrNum')) {
								lLayer = new FeatureLayer(layer.url + "/" + layer.eaLyrNum.toString(), lOptions);
								window.hashURL[layer.eaID] = layer.url + "/" + layer.eaLyrNum.toString();
							} else {
								lLayer = new FeatureLayer(layer.url, lOptions);
							}
							lLayer.minScale = 1155581.108577;
							LayerInfos.getInstanceSync()._tables.push(lLayer);
						}

						if (bNeedToBeAdded) {
							if (layer.tileLink == "yes") {
								var tileLinkAdjusted = "";
								if (layer.tileURL.slice(-1) == "/") {
									tileLinkAdjusted = layer.tileURL;
								} else {
									tileLinkAdjusted = layer.tileURL + "/";
								}
								window.hashIDtoTileURL[layer.eaID.toString()] = tileLinkAdjusted;
								jimuUtils.initTileLayer(tileLinkAdjusted, window.layerIdTiledPrefix + layer.eaID.toString());
								this._viewerMap.addLayer(new myTiledMapServiceLayer());
								lyrTiled = this._viewerMap.getLayer(window.layerIdTiledPrefix + layer.eaID.toString());
								//bji need to be modified to accomodate tile.
								if (lyrTiled) {
									lyrTiled.setOpacity(layer.opacity);
								}
							} else if (layer.eaScale == "COMMUNITY") {
								loadSymbologyConfig(function(response) {
									var classBreakInfo = JSON.parse(response);
									var renderer = new ClassBreaksRenderer(classBreakInfo);
									lLayer.setRenderer(renderer);
								});
							}
						}
					} else if (layer.type.toUpperCase() === 'TILED') {
						window.tiledLayerNumber.push(layer.eaID);
						if (layer.displayLevels) {
							lOptions.displayLevels = layer.displayLevels;
						}
						if (layer.hasOwnProperty('autorefresh')) {
							lOptions.refreshInterval = layer.autorefresh;
						}
						lLayer = new ArcGISTiledMapServiceLayer(layer.url, lOptions);

						var popupConfig = jimuUtils.getPopups(layer);
						lLayer.setInfoTemplates(popupConfig);

					}
					//All layer types:
					if (bNeedToBeAdded) {
						dojo.connect(lLayer, "onError", function(error) {
							if ((!(lLayer.title in window.faildedEALayerDictionary)) && (!(lLayer.title in window.successLayerDictionary))) {
								window.faildedEALayerDictionary[lLayer.title] = lLayer.title;
								showDisplayLayerAddFailureWidget(lLayer.title);
							}
						});

						dojo.connect(lLayer, "onLoad", function(error) {
							selfLocalLayer.publishData({
								message : "AllLoaded"
							});
							if (!(lLayer.title in window.successLayerDictionary)) {
								window.successLayerDictionary[lLayer.title] = lLayer.title;
							}
						});

						if (layer.name) {
							lLayer._titleForLegend = layer.name;
							lLayer.title = layer.name;
							window.hashTitleToEAID[layer.name] = layer.eaID;
							lLayer.noservicename = true;
						}
						lLayer.on('load', function(evt) {
							evt.layer.name = lOptions.id;
						});

						lLayer.id = window.layerIdPrefix + layer.eaID.toString();

						this._viewerMap.addLayer(lLayer);
						if (layer.hasOwnProperty('eaScale')) {
							lLayer.eaScale = layer.eaScale;
							if (layer.eaScale == "COMMUNITY") {
								lLayer.setVisibility(false);
								//turn off the layer when first added to map and let user to turn on
								window.communityLayerNumber.push(layer.eaID.toString());
								addCommunityBoundaries();
							} else {//National
								lLayer.setVisibility(false);
								window.nationalLayerNumber.push(layer.eaID.toString());
							}
						}
					}//end of if(bNeedToBeAdded)
				}
			}
		}
	};
	var _removeSelectedLayers = function(selectedLayerNum) {
		var bNeedToBeAdded = false;
		var stringArray = selectedLayerNum.split(",");

		for (i in stringArray) {
			lyr = this._viewerMap.getLayer(window.layerIdPrefix + stringArray[i]);
			if (lyr) {
				this._viewerMap.removeLayer(lyr);
			}
			lyrTiled = this._viewerMap.getLayer(window.layerIdTiledPrefix + stringArray[i]);
			if (lyrTiled) {
				this._viewerMap.removeLayer(lyrTiled);
			}
		}

	};
	//function _removeAllLayers is not called currently, may be used later
	var _removeAllLayers = function() {
		for (i in window.allLayerNumber) {
			lyr = this._viewerMap.getLayer(window.layerIdPrefix + window.allLayerNumber[i]);
			if (lyr) {
				this._viewerMap.removeLayer(lyr);
			}
		}
	};
	var clazz = declare([BaseWidget], {
		selectCurrentCommunity : function() {

			window.communitySelected = currentCommunity;

			document.getElementById('butUpdateCommunityLayers').click();

			var nExtent;
			if (window.communitySelected != window.strAllCommunity) {
				commnunityWholeName = window.communityDic[window.communitySelected];
				extentForCommunity = window.communityExtentDic[window.communityDic[window.communitySelected]];
				nExtent = Extent(extentForCommunity);

			}
			this.map.setExtent(nExtent);
			this.map.infoWindow.hide();
		},
		onReceiveData : function(name, widgetId, data, historyData) {
			if (name == 'SimpleSearchFilter') {
				var stringArray = data.message.split(",");
				if (stringArray[0] == "a") {
					_addSelectedLayers(this.config.layers.layer, data.message.substring(2));
				}
				if (stringArray[0] == "r") {
					_removeSelectedLayers(data.message.substring(2));
				}
			}
		},
		constructor : function() {
			this._originalWebMap = null;
		},

		onClose : function() {
			if (query('.jimu-popup.widget-setting-popup', window.parent.document).length === 0) {
				var _currentExtent = dojo.clone(this.map.extent);
				var _changedData = {
					itemId : this._originalWebMap
				};
				var _newBasemap = topic.subscribe("mapChanged", function(_map) {
					_newBasemap.remove();
					_map.setExtent(_currentExtent);
				});
				MapManager.getInstance().onAppConfigChanged(this.appConfig, 'mapChange', _changedData);
			}
		},

		_removeAllLayersExceptBasemap : function() {
			for (var l = this.map.layerIds.length - 1; l > 1; l--) {
				var lyr = this.map.getLayer(this.map.layerIds[l]);
				if (lyr) {
					this.map.removeLayer(lyr);
				}
			}
			var f = this.map.graphicsLayerIds.length;
			while (f--) {
				var fl = this.map.getLayer(this.map.graphicsLayerIds[f]);
				if (fl.declaredClass === 'esri.layers.FeatureLayer') {
					this.map.removeLayer(fl);
				}
			}
		},

		startup : function() {
			this._originalWebMap = this.map.webMapResponse.itemInfo.item.id;
			this._removeAllLayersExceptBasemap();			
			selfLocalLayer = this;
	        if (!LayerInfos.getInstanceSync()._tables){
	          LayerInfos.getInstanceSync()._tables = [];
	        }
	        if (this.config.review){
	          var urlParams = ioQuery.queryToObject(decodeURIComponent(dojo.doc.location.search.slice(1)));
	          if (urlParams._jsonconfig){
	            this.config = JSON.parse(urlParams._jsonconfig);
	          }
	          if (urlParams._preview){
	            var type
	            if (urlParams._preview.toUpperCase().match("MAPSERVER")){
	              type = "DYNAMIC"
	            }
	            if (urlParams._preview.toUpperCase().match("FEATURESERVER")){
	              type = "FEATURE"
	            }
	            this.config = {"layers":{"layer":[{"type":type, "name":urlParams._preview.split("/")[urlParams._preview.split("/").length-2], "url":urlParams._preview, "flyPopups": true}]}} 
	          }
	        }			
			if (this.config.useProxy) {
				urlUtils.addProxyRule({
					urlPrefix : this.config.proxyPrefix,
					proxyUrl : this.config.proxyAddress
				});
			}

			loadBookmarkExtent(function(response) {
				var bookmarkClassified = JSON.parse(response);

				for ( index = 0,
				len = bookmarkClassified.bookmarks.length; index < len; ++index) {
					currentBookmarkClass = bookmarkClassified.bookmarks[index];
					if (currentBookmarkClass.name == "Community") {
						bookmarkCommunity = currentBookmarkClass.items;
						for ( indexCommunity = 0,
						lenCommunity = bookmarkCommunity.length; indexCommunity < lenCommunity; ++indexCommunity) {
							var currentExtent = bookmarkCommunity[indexCommunity].extent;
							window.communityExtentDic[bookmarkCommunity[indexCommunity].name] = currentExtent;

							spatialReference = currentExtent.spatialReference;
							if (minXCombinedExtent > currentExtent.xmin) {
								minXCombinedExtent = currentExtent.xmin;
							}
							if (minYCombinedExtent > currentExtent.ymin) {
								minYCombinedExtent = currentExtent.ymin;
							}
							if (maxXCombinedExtent < currentExtent.xmax) {
								maxXCombinedExtent = currentExtent.xmax;
							}
							if (maxYCombinedExtent < currentExtent.ymax) {
								maxYCombinedExtent = currentExtent.ymax;
							}

						}
					}
				}
			});
			// end of loadBookmarkExtent(function(response)
			//prepare for receiving data from SimpleSearchFilter
			this.inherited(arguments);
			this.fetchDataByName('SimpleSearchFilter');
			this.fetchDataByName('LayerList');

			aspect.before(LayerInfos.prototype, "update", function() {
				//Migrate _finalLayerInfos back to the _operLayers parameter on update.
				var newOriginOperLayers = []
				array.forEach(this._finalLayerInfos, lang.hitch(this, function(layerInfo) {
					if (layerInfo.originOperLayer.layerObject instanceof ArcGISDynamicMapServiceLayer) {
						layerInfo.declaredClass = 'esri.layers.ArcGISDynamicMapServiceLayer'
						layerInfo.originOperLayer.layerType = 'ArcGISMapServiceLayer';
					}
					newOriginOperLayers.push(layerInfo.originOperLayer);
				}))
				this._operLayers = newOriginOperLayers;
				LayerInfos.getInstanceSync()._initLayerInfos();
			});
			//Note that the _bindEvent and _addTable aspects are essential to prevent redundant event binding on layer add.
			/*aspect.after(LayerInfos.prototype, "update", function() {//this could result in "Turn All Layers On" disfunction in LayerList widget, so comment it out
				array.forEach(this._finalLayerInfos, lang.hitch(this, function(layerInfo) {
					if (layerInfo.layerObject.showLegend === false) {
						layerInfo.originOperLayer.showLegend = layerInfo.layerObject.showLegend
					}
					aspect.before(layerInfo.__proto__, "_bindEvent", function() {
						if (this.layerObject) {
							if (!this.layerObject.empty) {
								this.layerObject.modified = true;
								this.layerObject.empty = true;
							}
						}
					})
					aspect.after(layerInfo.__proto__, "_bindEvent", function() {
						if (this.layerObject) {
							if (this.layerObject.modified) {
								this.layerObject.empty = false;
							}
						}
					}, true)
				}))
			});*/
			aspect.after(arcgisUtils, "getLegendLayers", lang.hitch(this, function(legendObject) {
				var returnArray = []
				array.forEach(LayerInfos.getInstanceSync()._operLayers, function(_layer) {
					var newLayer = {
						defaultSymbol : true,
						layer : _layer,
						title : _layer.title
					}
					returnArray.push(newLayer)
				})
				return returnArray;
			}))
			aspect.before(LayerInfos.prototype, "_addTable", function(changedType, evt) {
				var _foundMatch = false
				array.forEach(this._finalTableInfos, function(table) {
					if (table.id == changedType.id) {
						_foundMatch = true;
					}
				})
				if (!_foundMatch) {
					return [changedType, evt];
				} else {
					return [null, null]
				}
			}, true)
			aspect.around(LayerInfos.prototype, "_onTableChange", lang.hitch(this, function(originalFunction) {
				return lang.hitch(this, function(tableInfos, changedType) {
					if (tableInfos.length > 0) {
						return originalFunction.call(this, tableInfos, changedType);
					}
				})
			}), true)
			var dummyLayer = new WMSLayer("__ignore__")
			dummyLayer.on("error", function(evt) {
				window._viewerMap.removeLayer(evt.target)
			})
			//window._viewerMap.addLayer(dummyLayer);
			//window._viewerMap.addLayers(_layersToAdd);
			window._viewerMap.updatedLayerInfos = LayerInfos.getInstanceSync()
			LayerInfos.getInstanceSync()._initTablesInfos()
		}
	});
	return clazz;
});
