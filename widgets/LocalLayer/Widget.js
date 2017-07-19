/*global define, window, dojo*/
define([
        'dojo/_base/declare',
        'jimu/BaseWidget',
        'jimu/ConfigManager',
        'jimu/MapManager',
        'jimu/WidgetManager',
        'jimu/PanelManager',
        'esri/urlUtils',
        'dojo/_base/array',
        'dojo/_base/query',
        'dojo/topic',
        'esri/layers/ArcGISDynamicMapServiceLayer',
        'esri/layers/ArcGISTiledMapServiceLayer',
        'esri/layers/FeatureLayer',
        'esri/layers/ImageParameters',
        'esri/symbols/SimpleLineSymbol',
        'esri/symbols/SimpleFillSymbol',
        'esri/renderers/SimpleRenderer',
        'esri/graphic',
        'esri/Color',
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
        'dijit/form/ToggleButton',
        'dijit/form/Button',
        'dojo/domReady!'
    ],
    function (
        declare,
        BaseWidget,
        ConfigManager,
        MapManager,
        WidgetManager,
        PanelManager,
        urlUtils,
        array,
        dojoquery,
        topic,
        ArcGISDynamicMapServiceLayer,
        ArcGISTiledMapServiceLayer,
        FeatureLayer,
        ImageParameters,
        SimpleLineSymbol,
        SimpleFillSymbol,
        SimpleRenderer,
        graphic,
        Color,
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
        WidgetManager) {
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
    var loadBookmarkExtent = function (callback) {
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
    var loadSymbologyConfig = function (callback) {
        var xobj = new XMLHttpRequest();
        xobj.overrideMimeType("application/json");
        if (window.communitySelected != window.strAllCommunity) {
            xobj.open('GET', 'configs/CommunitySymbology/' + window.communitySelected + '_JSON_Symbol/Nulls/' + window.communitySelected + '_' + Attribute + ".json", true);
        } else {
            xobj.open('GET', 'configs/CommunitySymbology/' + 'AllCommunities' + '_JSON_Symbol/Nulls/' + 'CombComm' + '_' + Attribute + ".json", true);
        }
        xobj.onreadystatechange = function () {
            if (xobj.readyState == 4 && xobj.status == "200") {
                callback(xobj.responseText);
            }
        };
        xobj.send(null);
    };
    var sleep = function (ms) {
        var unixtime_ms = new Date().getTime();
        while (new Date().getTime() < unixtime_ms + ms) {}
    }
    var showDisplayLayerAddFailureWidget = function (layerName) {

        var widgetName = 'DisplayLayerAddFailure';
        var widgets = selfLocalLayer.appConfig.getConfigElementsByName(widgetName);
        var pm = PanelManager.getInstance();
        pm.showPanel(widgets[0]);
        selfLocalLayer.publishData({
            message: layerName
        });
    };
    var initTileLayer = function (urlTiledMapService, tiledLayerId) {
        dojo.declare("myTiledMapServiceLayer", esri.layers.TiledMapServiceLayer, {
            constructor: function () {
                this.spatialReference = new esri.SpatialReference({
                        wkid: 102100
                    });
                this.initialExtent = (this.fullExtent = new esri.geometry.Extent(-13899346.378, 2815952.218899999, -7445653.2326, 6340354.452, this.spatialReference));
                this.tileInfo = new esri.layers.TileInfo({
                        "rows": 256,
                        "cols": 256,
                        "dpi": 96,
                        "format": "PNG",
                        "compressionQuality": 0,
                        "origin": {
                            "x": -20037508.342787,
                            "y": 20037508.342787
                        },
                        "spatialReference": {
                            "wkid": 102100
                        },
                        "lods": [{
                                level: 0,
                                resolution: 156543.03392800014,
                                scale: 591657527.591555
                            }, {
                                level: 1,
                                resolution: 78271.51696399994,
                                scale: 295828763.795777
                            }, {
                                level: 2,
                                resolution: 39135.75848200009,
                                scale: 147914381.897889
                            }, {
                                level: 3,
                                resolution: 19567.87924099992,
                                scale: 73957190.948944
                            }, {
                                level: 4,
                                resolution: 9783.93962049996,
                                scale: 36978595.474472
                            }, {
                                level: 5,
                                resolution: 4891.96981024998,
                                scale: 18489297.737236
                            }, {
                                level: 6,
                                resolution: 2445.98490512499,
                                scale: 9244648.868618
                            }, {
                                level: 7,
                                resolution: 1222.992452562495,
                                scale: 4622324.434309
                            }, {
                                level: 8,
                                resolution: 611.4962262813797,
                                scale: 2311162.217155
                            }
                        ]
                    });
                this.loaded = true;
                this.onLoad(this);
                this.visible = false;
                this.id = tiledLayerId;
            },
            getTileUrl: function (level, row, col) {

                //return "http://leb.epa.gov/arcgiscache_exp/AWD_mgal/National%20Data%20-%20EnviroAtlas/_alllayers/" +
                //       "L" + dojo.string.pad(level, 2, '0') + "/" + "R" + dojo.string.pad(row.toString(16), 8, '0') + "/" + "C" + dojo.string.pad(col.toString(16), 8, '0') + "." + "png";
                return urlTiledMapService +
                "L" + dojo.string.pad(level, 2, '0') + "/" + "R" + dojo.string.pad(row.toString(16), 8, '0') + "/" + "C" + dojo.string.pad(col.toString(16), 8, '0') + "." + "png";

            }
        });
    };
    		
        
        
									
			
				
				

    //Function also used in PeopleBuiltSpaces/widget.js, ensure that edits are synchronized
	

    			  		

				
    var getTextContent = function (graphic) {
        var commName = graphic.attributes.CommST;
        currentCommunity = commName;
	        return "<b>" + window.communityDic[commName] + "</b><br /><button id = 'testButton2' dojoType='dijit.form.Button' onclick='selfLocalLayer.selectCurrentCommunity() '>Select this community</button>";
    };

    var addCommunityBoundaries = function () {
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
                infoTemplate: locationTemplate
            };
            popupsTemplate[1] = {
                infoTemplate: boundaryTemplate
            };

            var communityLocationLayer = new ArcGISDynamicMapServiceLayer(communityBoundaryLayer);
            communityLocationLayer._titleForLegend = "EnviroAtlas Community Boundaries";
            communityLocationLayer.title = "EnviroAtlas Community Boundaries";
            communityLocationLayer.noservicename = true;
            communityLocationLayer.setInfoTemplates(popupsTemplate);

            communityLocationLayer.id = window.layerIdBndrPrefix + communityBoundaryLayerID;
            window.idCommuBoundaryPoint = communityLocationLayer.id;
            chkboxId = window.chkSelectableLayer + communityBoundaryLayerID;
            if (dojo.byId(chkboxId)) {
                dojo.byId(chkboxId).checked = true;
            }
            selfLocalLayer.map.addLayer(communityLocationLayer);
        }
    }

    //Function also used in PeopleBuiltSpaces/widget.js, ensure that edits are synchronized
    var getPopups = function (layer) {
        var infoTemplateArray = {};
        if (layer.layers) {
            array.forEach(layer.layers, function (subLayer) {
                var _infoTemp = subLayer.popup;
                var popupInfo = {};
                popupInfo.title = _infoTemp.title;
                if (_infoTemp.description) {
                    popupInfo.description = _infoTemp.description;
                } else {
                    popupInfo.description = null;
                }
                if (_infoTemp.fieldInfos) {
                    popupInfo.fieldInfos = _infoTemp.fieldInfos;
                }
                var _popupTemplate = new PopupTemplate(popupInfo);
                infoTemplateArray[subLayer.id] = {
                    infoTemplate: _popupTemplate
                };
            });
        } else if (layer.popup) {
            var _popupTemplate = new PopupTemplate(layer.popup);
            infoTemplateArray[0] = {
                infoTemplate: _popupTemplate
            }
        }
        return infoTemplateArray;
    }

    var _addSelectedLayers = function (layersTobeAdded, selectedLayerNum) {
        var index,
        len;
        var selectedLayerArray = selectedLayerNum.split(",");
        for (i in selectedLayerArray) {
            for (index = 0, len = layersTobeAdded.length; index < len; ++index) {
                layer = layersTobeAdded[index];
                if (layer.hasOwnProperty('eaID') && ((selectedLayerArray[i]) == (layer.eaID.toString()))) {
                    var bNeedToBeAdded = true;
                    var lLayer;
                    var lOptions = {};
                    if (layer.hasOwnProperty('opacity')) {
                        lOptions.opacity = layer.opacity; // 1.0 has no transparency; 0.0 is 100% transparent
                    }
                    if (layer.hasOwnProperty('visible') && !layer.visible) {
                        lOptions.visible = false;
                    } else {
                        lOptions.visible = true;
                    }
                    if (layer.name) {
                        lOptions.id = layer.name;
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

                        var popupConfig = getPopups(layer);
                        lLayer.setInfoTemplates(popupConfig);

                        if (layer.disableclientcaching) {
                            lLayer.setDisableClientCaching(true);
                        }
                        if (window.hashVisibleLayersForDynamic[layer.eaID] != null) {
							lLayer.setVisibleLayers(window.hashVisibleLayersForDynamic[layer.eaID]);
                        }                        
                        lLayer.on('load', function (evt) {
                            var removeLayers = [];
                            array.forEach(evt.layer.visibleLayers, function (layer) {
                                //remove any grouplayers
                                if (evt.layer.layerInfos[layer].subLayerIds) {
                                    removeLayers.push(layer);
                                } else {
                                    var _layerCheck = dojo.clone(layer);
                                    while (evt.layer.layerInfos[_layerCheck].parentLayerId > -1) {
                                        if (evt.layer.visibleLayers.indexOf(evt.layer.layerInfos[_layerCheck].parentLayerId) == -1) {
                                            removeLayers.push(layer);
                                        }
                                        _layerCheck = dojo.clone(evt.layer.layerInfos[_layerCheck].parentLayerId);
                                    }
                                }
                            });
                            array.forEach(removeLayers, function (layerId) {
                                evt.layer.visibleLayers.splice(evt.layer.visibleLayers.indexOf(layerId), 1);
                            });
                        });
                        this._viewerMap.setInfoWindowOnClick(true);

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
                                console.log("layer.eaID: " +  + layer.eaID.toString() + " with no popup info defined");
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
                        }

                        if (bNeedToBeAdded) {
                            if (layer.tileLink == "yes") {
                                var tileLinkAdjusted = "";
                                if (layer.tileURL.slice(-1) == "/") {
                                    tileLinkAdjusted = layer.tileURL;
                                } else {
                                    tileLinkAdjusted = layer.tileURL + "/";
                                }
                                initTileLayer(tileLinkAdjusted, window.layerIdTiledPrefix + layer.eaID.toString()); //bji need to be modified to accomodate tile.
                                this._viewerMap.addLayer(new myTiledMapServiceLayer());
                                lyrTiled = this._viewerMap.getLayer(window.layerIdTiledPrefix + layer.eaID.toString()); //bji need to be modified to accomodate tile.
                                if (lyrTiled) {
                                    lyrTiled.setOpacity(layer.opacity);
                                }
                            }
                            else if (layer.eaScale == "COMMUNITY") {
                                loadSymbologyConfig(function (response) {
                                    var classBreakInfo = JSON.parse(response);
                                    var renderer = new ClassBreaksRenderer(classBreakInfo);
                                    lLayer.setRenderer(renderer);  
                                });
                            }
                        }
                    } else if (layer.type.toUpperCase() === 'TILED') {
                        if (layer.displayLevels) {
                            lOptions.displayLevels = layer.displayLevels;
                        }
                        if (layer.hasOwnProperty('autorefresh')) {
                            lOptions.refreshInterval = layer.autorefresh;
                        }
                        lLayer = new ArcGISTiledMapServiceLayer(layer.url, lOptions);

                        var popupConfig = getPopups(layer);
                        lLayer.setInfoTemplates(popupConfig);

                    }
                    //All layer types:
                    if (bNeedToBeAdded) {
                        dojo.connect(lLayer, "onError", function (error) {
                            if ((!(lLayer.title in window.faildedEALayerDictionary)) && (!(lLayer.title in window.successLayerDictionary))) {
                                window.faildedEALayerDictionary[lLayer.title] = lLayer.title;
                                showDisplayLayerAddFailureWidget(lLayer.title);
                            }
                        });

                        dojo.connect(lLayer, "onLoad", function (error) {
                            selfLocalLayer.publishData({		                            	
					            message: "AllLoaded"
					        }); 
                            if (!(lLayer.title in window.successLayerDictionary)) {
                                window.successLayerDictionary[lLayer.title] = lLayer.title;
                            }
                        });
                        
                        if (layer.name) {
                            lLayer._titleForLegend = layer.name;
                            lLayer.title = layer.name;
                            lLayer.noservicename = true;
                        }
                        lLayer.on('load', function (evt) {
                            evt.layer.name = lOptions.id;
                        });

                        lLayer.id = window.layerIdPrefix + layer.eaID.toString();                    
                        
                        this._viewerMap.addLayer(lLayer);
                        if (layer.hasOwnProperty('eaScale')) {
                            if (layer.eaScale == "COMMUNITY") {
                                lLayer.setVisibility(false); //turn off the layer when first added to map and let user to turn on
                                window.communityLayerNumber.push(layer.eaID.toString());
                                addCommunityBoundaries();
                            } else { //National
                                lLayer.setVisibility(false);
                                window.nationalLayerNumber.push(layer.eaID.toString());
                            }
                        }
                    }
                }
            }
        }
    };
    var _removeSelectedLayers = function (selectedLayerNum) {
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
    var _removeAllLayers = function () {
        for (i in window.allLayerNumber) {
            lyr = this._viewerMap.getLayer(window.layerIdPrefix + window.allLayerNumber[i]);
            if (lyr) {
                this._viewerMap.removeLayer(lyr);
            }
        }
    };
    var clazz = declare([BaseWidget], {
    	    selectCurrentCommunity: function () {

                window.communitySelected = currentCommunity;

                this.publishData({
                    message: currentCommunity
                });
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
            onReceiveData: function (name, widgetId, data, historyData) {
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
            constructor: function () {
                this._originalWebMap = null;
            },

            onClose: function () {
                if (dojoquery('.jimu-popup.widget-setting-popup', window.parent.document).length === 0) {
                    var _currentExtent = dojo.clone(this.map.extent);
                    var _changedData = {
                        itemId: this._originalWebMap
                    };
                    var _newBasemap = topic.subscribe("mapChanged", function (_map) {
                            _newBasemap.remove();
                            _map.setExtent(_currentExtent);
                        });
                    MapManager.getInstance().onAppConfigChanged(this.appConfig, 'mapChange', _changedData);
                }
            },

            _removeAllLayersExceptBasemap: function () {
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

            startup: function () {
                this._originalWebMap = this.map.webMapResponse.itemInfo.item.id;
                this._removeAllLayersExceptBasemap();
                selfLocalLayer = this;
                if (this.config.useProxy) {
                    urlUtils.addProxyRule({
                        urlPrefix: this.config.proxyPrefix,
                        proxyUrl: this.config.proxyAddress
                    });
                }

                loadBookmarkExtent(function (response) {
                    var bookmarkClassified = JSON.parse(response);

                    for (index = 0, len = bookmarkClassified.bookmarks.length; index < len; ++index) {
                        currentBookmarkClass = bookmarkClassified.bookmarks[index];
                        if (currentBookmarkClass.name == "Community") {
                            bookmarkCommunity = currentBookmarkClass.items;
                            for (indexCommunity = 0, lenCommunity = bookmarkCommunity.length; indexCommunity < lenCommunity; ++indexCommunity) {
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
                }); // end of loadBookmarkExtent(function(response)
                //prepare for receiving data from SimpleSearchFilter
                this.inherited(arguments);
                this.fetchDataByName('SimpleSearchFilter');
                this.fetchDataByName('LayerList');
		     }
        });
    return clazz;
});
