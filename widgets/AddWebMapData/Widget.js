///////////////////////////////////////////////////////////////////////////
// Copyright © 2015 Softwhere Solutions  
// All Rights Reserved.
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
/*global console, define, dojo */

define(['dojo/_base/declare',
        'jimu/BaseWidget',
        'dijit/_WidgetsInTemplateMixin',
        'dojo/_base/lang',
        'dojo/_base/array',
        'dojo/_base/html',
        'dojo/query',
        'dojo/on',
        'dojo/topic',
        'dojo/string',
        'dojo/json',
        "esri/lang",
        'esri/arcgis/Portal',
        'esri/geometry/Extent',
        'esri/geometry/webMercatorUtils',
        'esri/arcgis/utils',
    'esri/layers/FeatureLayer',
    'esri/layers/layer',
    'esri/layers/ArcGISDynamicMapServiceLayer',
    'esri/layers/ArcGISTiledMapServiceLayer',
    'esri/layers/ArcGISImageServiceLayer',
    "esri/layers/LayerDrawingOptions",
    'esri/layers/DynamicLayerInfo',
    'esri/dijit/PopupTemplate',
    "esri/renderers/jsonUtils",
        'jimu/PanelManager',
        'jimu/ConfigManager',
        'jimu/MapManager',
        'jimu/tokenUtils',
        'jimu/dijit/Message',
        'jimu/dijit/Search',
        'jimu/dijit/TabContainer3',
        'jimu/WidgetManager',
        'dijit/Dialog',
        "dijit/form/Button",
        "dijit/layout/ContentPane",
        "dijit/layout/LayoutContainer",
        './ItemTable'
       ],
    function (declare,
        BaseWidget,
        _WidgetsInTemplateMixin,
        lang,
        array,
        html,
        query,
        on,
        topic,
        string,
        djJson,
        esriLang,
        arcgisPortal,
        Extent,
        webMercatorUtils,
              arcgisUtils,
              FeatureLayer,
              layer,
              ArcGISDynamicMapServiceLayer,
              ArcGISTiledMapServiceLayer,
              ArcGISImageServiceLayer,
              LayerDrawingOptions,
              DynamicLayerInfo,
              PopupTemplate,
              jsonRendererUtils,
              PanelManager,
        ConfigManager,
        MapManager,
        tokenUtils,
        Message,
        Search,
        TabContainer3,
        WidgetManager,
        Dialog,
        Button,
        ItemTable) {
    //To create a widget, you need to derive from BaseWidget.
    selfAddWebMapData = null;
    arrlayerId = [];

    var showLayerListWidget = function() {
        var widgetName = 'LayerList';
        var widgets = selfAddWebMapData.appConfig.getConfigElementsByName(widgetName);
        var pm = PanelManager.getInstance();
        pm.showPanel(widgets[0]);
    };
    var addAddItemToMapOperational = function(layersReversed, layerId, response) {
        layersReversed.forEach(function(l) {
            if ((l.url) && (l.id == layerId)) {

                if (l.layerType == 'ArcGISTiledMapServiceLayer') {
                    tempLayer = new ArcGISTiledMapServiceLayer(l.url, {
                        id : l.id,
                        opacity : l.opacity,
                        visible : l.visibility
                    });
                    tempLayer.title = l.title;
                }else if (l.layerType == 'ArcGISImageServiceLayer') {
                    tempLayer = new ArcGISImageServiceLayer(l.url, {
                        id : l.id,
                        opacity : l.opacity,
                        visible : l.visibility
                    });
                    tempLayer.title = l.title;
                    tempLayer = selfAddWebMapData._processLayer(tempLayer, l);
                } else if (l.layerType == 'ArcGISFeatureLayer') {
                    tempLayer = new FeatureLayer(l.url, {
                        mode : FeatureLayer.MODE_ONDEMAND,
                        id : l.id,
                        opacity : l.opacity,
                        visible : l.visibility,
                        outFields : ["*"],
                    });
                    tempLayer.title = l.title;
                    tempLayer = selfAddWebMapData._processLayer(tempLayer, l);
                } else if (l.layerType == 'ArcGISMapServiceLayer') {
                    tempLayer = new ArcGISDynamicMapServiceLayer(l.url, {
                        id : l.id,
                        opacity : l.opacity,
                        visible : l.visibility,
                        "showAttribution" : false
                    });
           
                    tempLayer.title = l.title;
                    //if layers have popupInfo grab them
                    if (l.layers) {
                        var expressions = [];
                        var dynamicLayerInfo;
                        var dynamicLayerInfos = [];
                        var drawingOptions;
                        var drawingOptionsArray = [];
                        var source;
                        var _infoTemps = {};
                        var indexTemplate = 0;
                        array.forEach(l.layers, function(layerInfo) {
                            if (layerInfo.layerDefinition && layerInfo.layerDefinition.definitionExpression) {
                                expressions[layerInfo.id] = layerInfo.layerDefinition.definitionExpression;
                            }
                            //get infoTemplate
                            /*if (layerInfo.popupInfo) {
                                popInfo = layerInfo.popupInfo;
                                jsonPopInfo = djJson.parse(djJson.stringify(popInfo));
                                //infoTemplate = new PopupTemplate(jsonPopInfo);
                                //var json = {title:popInfo.title,
                                //     content:  popInfo.description.substring(1,popInfo.description.length - 1) + ":" + "$"+ popInfo.description//"State Name: ${STATE_NAME}"
                                //}
                                //infoTemplate = new PopupTemplate(json);

                                infoTemplate = new PopupTemplate({
                                    title : layerInfo.name,
                                    fieldInfos : [{
                                        fieldName : popInfo.description.substring(1, popInfo.description.length - 1),
                                        visible : true,
                                        label : "",
                                        content : "$" + popInfo.description
                                    }]
                                })
                                _infoTemps[indexTemplate] = {};
                                _infoTemps[indexTemplate]["infoTemplate"] = infoTemplate;

                                //tempLayer.setInfoTemplate(infoTemplate);
                            }*/
                            //end of getting infoTemplate
                            if (layerInfo.layerDefinition && layerInfo.layerDefinition.source) {
                                dynamicLayerInfo = null;
                                source = layerInfo.layerDefinition.source;
                                if (source.type === "mapLayer") {

                                    var metaLayerInfos = array.filter(response.operationalLayers, function(rlyr) {
                                        return rlyr.id === source.mapLayerId;
                                    });
                                    if (metaLayerInfos.length) {
                                        dynamicLayerInfo = lang.mixin(metaLayerInfos[0], layerInfo);
                                    }
                                } else {
                                    dynamicLayerInfo = lang.mixin({}, layerInfo);
                                }
                                if (dynamicLayerInfo) {
                                    dynamicLayerInfo.source = source;
                                    delete dynamicLayerInfo.popupInfo;
                                    dynamicLayerInfo = new DynamicLayerInfo(dynamicLayerInfo);
                                    if (l.visibleLayers) {
                                        var vis = (( typeof l.visibleLayers) === "string") ? l.visibleLayers.split(",") : l.visibleLayers;
                                        if (array.indexOf(vis, layerInfo.id) > -1) {
                                            dynamicLayerInfo.defaultVisibility = true;
                                        } else {
                                            dynamicLayerInfo.defaultVisibility = false;
                                        }
                                    }
                                    dynamicLayerInfos.push(dynamicLayerInfo);
                                }
                            } 
                            if (layerInfo.layerDefinition && layerInfo.layerDefinition.source && layerInfo.layerDefinition.drawingInfo) {
                                drawingOptions = new LayerDrawingOptions(layerInfo.layerDefinition.drawingInfo);
                                drawingOptionsArray[layerInfo.id] = drawingOptions;
                            }
                            indexTemplate = indexTemplate + 1;
                        });
                        tempLayer.setInfoTemplates(_infoTemps);

                        if (expressions.length > 0) {
                            tempLayer.setLayerDefinitions(expressions);
                        }
                        if (dynamicLayerInfos.length > 0) {
                            tempLayer.setDynamicLayerInfos(dynamicLayerInfos, true);
                        }
                        if (drawingOptionsArray.length > 0) {
                            tempLayer.setLayerDrawingOptions(drawingOptionsArray, true);
                        }

                    } else if (l.visibleLayers) {
                        tempLayer.setVisibleLayers(l.visibleLayers);
                    }

                }
            }

            if (tempLayer) {
                tempLayer.on('load', function(evt) {
                    var chkToBeClicked =  null;
                        
                    var i = 0;                     //  set your counter to 1
                    var maximumCount = 10;
                    
                    function lookForChkBoxLoop () {           //  create a loop function
                       setTimeout(function () {  
                            i++; 
                            chkBoxes = document.getElementsByClassName("jimu-icon-checkbox");
                            chkToBeClicked = chkBoxes.item(2);
                            if (chkToBeClicked==null) {
                                if (i < maximumCount) { // if not reach maximumCount and still not find the checkbox, call the loop function
                                    lookForChkBoxLoop(); 
                                }                                  
                            } else {
                                chkToBeClicked.click();
                                setTimeout(lang.hitch(this, function() {
                                        chkToBeClicked.click();
                                }), 300);
                            }
                       }, 200)

                    }
                    if (evt.layer.visibleLayers!=null) {
                        lookForChkBoxLoop();  
                    }                                    
                    if (arrlayerId.length > 0) {
                        setTimeout(lang.hitch(this, function() {
                            addAddItemToMapOperational(layersReversed, arrlayerId.pop(), response);
                        }), 1000);
                    }
                });
                window.layerID_Portal_WebMap.push(l.id);
                testmap.addLayer(tempLayer);
            }
        });

    };

    return declare([BaseWidget, _WidgetsInTemplateMixin], {
        // Custom widget code goes here

        baseClass : 'jimu-widget-addwebmapdata',

        // the tabs
        tab : null,

        _itemTypes : '["Web Map"]',
        _typeKeywords : '[]',

        // set on sign in
        credential : null,

        // user id of logged in user
        currentUserId : '',

        //methods to communication with app container:

        postCreate : function() {
            this.inherited(arguments);
            arrlayerId = [];

            this._initTabs();

            //bind events
            this.own(on(this.mycontentItemTable, 'item-selected', lang.hitch(this, this._onItemSelected)));

            this.own(on(this.publicItemTable, 'item-selected', lang.hitch(this, this._onItemSelected)));

            this.searchPublicContent();

            this.updateUIForSignIn();

            //console.log('ChangeWebMap :: postCreate :: completed');
        },

        startup : function() {
            selfAddWebMapData = this;
            this.inherited(arguments);

            //console.log('ChangeWebMap :: startup');
        },

        onOpen : function() {
            w = this;
        },

        onSignIn : function(credential) {
            this.credential = credential;
            this.currentUserId = credential.userId;

            this.searchMyContent(this.currentUserId);

            this.updateUIForSignIn();
            //console.log('ChangeWebMap :: onSignIn : user signed in ', this.currentUserId);
        },

        onSignOut : function() {

            this.credential = null;
            this.currentUserId = '';
            this.updateUIForSignIn();
            this.mycontentItemTable.clear();

            //console.log('ChangeWebMap :: onSignOut : user signed out ');
        },

        doSignIn : function() {
            //console.log("ChangeWebMap :: doSignIn");
            //Inherit the portalUrl and appID from the full application:
            var portalURL = this.appConfig.portalUrl;
            var appId = this.appConfig.appId;

            var regOAuth = tokenUtils.registerOAuthInfo(portalURL, appId);

            tokenUtils.signInPortal(this.config.portalUrl).then(function(credential) {
                topic.publish('userSignIn', credential);
            }, function() {
                var msg = new Message({
                    message : "An error occurred logging in. Please try again.",
                    type : 'error'
                });
            });

            // will callback onSignIn when completed
        },

        doSignOut : function() {
            //console.log("ChangeWebMap :: doSignOut");

            // fire event for main app to handle
            // this is not really required since signOutAll publishes the event
            // but makes double sure incase the credential is not found...
            topic.publish('userSignOut');

            // this should be all that is required since it deletes cached login
            // call signout will callback onSignOut when completed - unless it does not find the credential.
            tokenUtils.signOutAll();
        },

        /**
         * set the ui for sign in and out
         */
        updateUIForSignIn : function() {
            var hasSignIn = !!this.currentUserId, display = !hasSignIn ? "block" : "none";
            // if logged in, hide the signin button
            html.setStyle(this.signInPanel, 'display', display);

            // if logged in, hide the signout button
            display = hasSignIn ? "block" : "none";
            html.setStyle(this.signOutPanel, 'display', display);

            this.signOutMessage.innerHTML = string.substitute("You are logged in as <strong>${userid}</strong>", {
                "userid" : this.currentUserId
            });

            //console.log('ChangeWebMap :: updateUIForSignIn :: hasSignIn = ', hasSignIn);
        },

        /**
         * prompt the user to zoom to the item
         * @param {Object} item web map item from Portal
         */
        promptUserToZoomToItem : function(item) {

            // the dialog is async so processing continues before question is answered
            var dlg = new Message({
                message : "Do you want to zoom to the new map?",
                type : 'question',
                buttons : [{
                    label : "No",
                    onClick : lang.hitch(this, function() {
                        //console.log('ChangeWebMap :: promptUserToZoomToItem :: keep current extent');
                        dlg.close();
                    })
                }, {
                    label : "Yes",
                    onClick : lang.hitch(this, function() {
                        dlg.close();
                        //console.log('ChangeWebMap :: promptUserToZoomToItem :: zooming to new extent');
                        this.zoomToItem(item);
                    })
                }]
            });

        },

        /**
         * Zoom the map to the given web map
         * @param {Object} item web map item from Portal
         */
        zoomToItem : function(item) {

            var extentGCS, extentWM, cfg;

            // item have extent in geographic
            cfg = {
                "xmin" : item.extent[0][0],
                "ymin" : item.extent[0][1],
                "xmax" : item.extent[1][0],
                "ymax" : item.extent[1][1],
                "spatialReference" : {
                    "wkid" : 4326
                }
            };

            extentGCS = new Extent(cfg);

            // assumes map is in web mercator
            extentWM = webMercatorUtils.geographicToWebMercator(extentGCS);

            //console.log('ChangeWebMap :: zoomToItem :: map itemid ', this.map.itemId);
            this.map.setExtent(extentWM, true).then(function() {
                //console.log('ChangeWebMap :: zoomToItem :: zoomed to ', extentGCS);
            }, function() {
                console.error("ChangeWebMap :: zoomToItem :: failed");
            });

        },

        /**
         * define the tabs in the UI
         */
        _initTabs : function() {
            var tabs, tabMyContent, tabPublic;

            tabMyContent = {
                title : "My Content",
                content : this.mycontentTabNode
            };

            tabPublic = {
                title : "Public",
                content : this.publicTabNode
            };

            tabs = [tabPublic, tabMyContent];

            this.tab = new TabContainer3({
                tabs : tabs
            }, this.tabNode);

            this.own(on(this.tab, "tabChanged", lang.hitch(this, function(title) {
                //console.log('ChangeWebMap :: tabChanged to ', title);

            })));
        },

        /**
         * set the my content table with the query for the given user
         * @param {String} userId user id
         */
        searchMyContent : function(userId) {
            //console.log('ChangeWebMap :: searchMyContent :: starting for user = ', userId);
            this.mycontentItemTable.clear();

            var query = {
                q : 'type:"Web Map" AND owner:' + userId,
                start : 1,
                num : 100,
                f : 'json'
            };

            this.mycontentItemTable.set('portalUrl', this.config.portalUrl);
            this.mycontentItemTable.searchAllItems(query);
            this.mycontentItemTable.showAllItemsSection();
        },

        /**
         * set the query on the item table in the public tab
         */
        searchPublicContent : function() {
            //console.log("ChangeWebMap :: searchPublicContent :: starting ");
            this.publicItemTable.clear();

            var query = {
                q : this.config.publicContent.query,
                start : 1,
                num : 100,
                f : 'json'
            };

            this.publicItemTable.set('portalUrl', this.config.portalUrl);
            this.publicItemTable.searchAllItems(query);
            this.publicItemTable.showAllItemsSection();

            //console.log("ChangeWebMap :: searchPublicContent :: completed ");
        },

        /**
         * return the options object for the current map
         * @returns {Object} object with center in lat/lon and scale of the current map
         */
        getCurrentMapOptions : function() {

            var options = null, scale = 0, centerPt, lat = 0, lon = 0;

            scale = this.map.getScale();
            centerPt = this.map.extent.getCenter();
            lat = centerPt.getLatitude();
            lon = centerPt.getLongitude();

            // check for valid values
            if (!!scale && !!lat && !!lon) {
                options = {
                    "center" : [lon, lat],
                    "scale" : scale
                };
            }

            return options;
        },

        // Ask for the user's confirmation before purging all layers from the layer list widget
        _onItemSelected : function(item) {
            //If there are more layers than just the default basemap
            if (this.map.layerIds.length > 1) {
                this.promptUserforConfirmation(item);
                return;
            }
            this._onConfirmation(item);
        },

        /**
         * prompt the user to zoom to the item
         * @param {Object} item web map item from Portal
         */
        promptUserforConfirmation : function(item) {
            var dlg = new Message({
                message : "This will replace all layers currently added to the map. If you wish to save your current layer selection, please use the save session widget first.",
                type : 'question',
                buttons : [{
                    label : "Cancel and save session",
                    onClick : lang.hitch(this, function() {
                        //console.log('ChangeWebMap :: promptUserToZoomToItem :: keep current extent');
                        dlg.close();
                        //Show Save Session Widget
                        var widgetName = 'SaveSession';
                        var pm = PanelManager.getInstance();
                        var widgets = pm.widgetManager.appConfig.getConfigElementsByName(widgetName);
                        pm.showPanel(widgets[0]);
                    })
                }, {
                    label : "Proceed",
                    onClick : lang.hitch(this, function() {
                        dlg.close();
                        //console.log('ChangeWebMap :: promptUserToZoomToItem :: zooming to new extent');
                        var layerListWidget = WidgetManager.getInstance().getWidgetById("widgets_LayerList_Widget_17");
                        if (layerListWidget) {
                            layerListWidget._onRemoveLayersClick();
                        }
                        this._onConfirmation(item);
                    })
                }]
            });
        },

        _onConfirmation : function(item) {
            //this.promptUserToZoomToItem(item);
            var self = this;
            this.zoomToItem(item);
            showLayerListWidget();
            testmap = this.map;
            tempLayer = false;
            //use item.tags and window.communityDic to get the community info
            var bIsTaggedCommunity = false;
            for (var i in item.tags) {
                if (window.communityDic.hasOwnProperty(item.tags[i])) {
                    bIsTaggedCommunity = true;
                    window.communitySelected = item.tags[i];
                    break;
                }
            }
            if (bIsTaggedCommunity) {
            	setTimeout(function () {  
	                selfAddWebMapData.publishData({
	                    message : "updateCommunityLayers"
	                });
                }, 3000)
            }//

            //get all LayerId before adding layers

            item.getItemData().then(function(response) {
                //process operational layers in reverse order to match AGOL
                layersReversed = response.operationalLayers.reverse();
                //layersReversed = response.operationalLayers;
                //first push Dynamic layers so that it will be added at last
                layersReversed.forEach(function(l) {
                    if (l.url) {
                        if (l.id && (l.id != undefined)) {
                            if (l.layerType == 'ArcGISMapServiceLayer' || l.layerType == 'ArcGISImageServiceLayer' || l.layerType == 'ArcGISTiledMapServiceLayer'){
                                if (arrlayerId.indexOf(l.id) < 0) {
                                    arrlayerId.push(l.id);
                                }
                            }
                        }
                    }
                })
                //then push non-Dynamic layers so that it will be added before Dynamic layers
                layersReversed.forEach(function(l) {
                    if (l.url) {
                        if (l.id && (l.id != undefined)) {
                            if (l.layerType == 'ArcGISFeatureLayer'){
                                if (arrlayerId.indexOf(l.id) < 0) {
                                    arrlayerId.push(l.id);
                                }
                            }
                        }
                    }
                });
                
                addAddItemToMapOperational(layersReversed, arrlayerId.pop(), response);

            })


            setTimeout(lang.hitch(this, function() {
                item.getItemData().then(function(response) {
                    //process operational layers in reverse order to match AGOL
                    layersReversed = response.operationalLayers.reverse();
                    layersReversed.forEach(function(l) {
                        if (l.url) {

                        } else {
                            if (l.featureCollection) {
                                console.log("Web Map Layers:: FeatureCollection");
                                l.featureCollection.layers.forEach(function(subL) {
                                    tempLayer = new FeatureLayer(subL, {
                                        id : l.id
                                    });
                                    tempLayer = selfAddWebMapData._processLayer(tempLayer, subL);
                                });
                            } else {
                                console.log("Add Layer Error:: Layer of unknown type");
                                if (!(l.url in window.faildedEALayerDictionary)) {
                                    window.faildedEALayerDictionary[l.url] = l.url;
                                    selfAddWebMapData.publishData({
                                        message : "openFailedLayer"
                                    });
                                }
                            }
                        }
                        if (tempLayer) {
                            //tempLayer.title = l.title;
                            window.layerID_Portal_WebMap.push(l.id);
                            testmap.addLayer(tempLayer);
                        }
                    });
                });
            }), 4000);
            var widgetManager;
            var fcDetailsWidgetEle = selfAddWebMapData.appConfig.getConfigElementsByName("FeaturedCollectionPreview")[0];
            widgetManager = WidgetManager.getInstance();
            widgetManager.closeWidget(fcDetailsWidgetEle.id);
            document.getElementById("titleForFCWidget").style.display = "none";
            document.getElementById("closeFCWidgetArea").style.display = "none";
            window.fcDetailsOpened = false;
        },

        _processLayer : function(tempLayer, l) {
            // Borrowed from AddData/search/LayerLoader.js _processFeatureLayer
            var layerDefinition, renderer = false;
            
        	var tileURL = "";
        	var lebURL = "";
        	var eaIDinSearchFilter = "";
        	if (window.hashURLtoTile.hasOwnProperty(l.url)) {
        		tileURL = window.hashURLtoTile[l.url];
        	}
        	else { 
        		lebURL = l.url.replace("enviroatlas.epa.gov", "leb.epa.gov");
        		if(window.hashURLtoTile.hasOwnProperty(lebURL)) {
        			tileURL = window.hashURLtoTile[lebURL];                	
        		}                		
        	}


   	       for (var key in window.hashURL){//window.hashURL[layer.eaID.toString()] = eaURL; 
			  if ((window.hashURL[key]==l.url) || (window.hashURL[key]==lebURL)) {
			  	eaIDinSearchFilter = key;
			  	window.hashFeaturedCollectionToEAID[l.id] = eaIDinSearchFilter;  
			  }
			}
 
        	if (tileURL=="") {
	            var popInfo, infoTemplate;
	            if (l.popupInfo) {
	                popInfo = l.popupInfo;
	                jsonPopInfo = djJson.parse(djJson.stringify(popInfo));
	                infoTemplate = new PopupTemplate(jsonPopInfo);
	                tempLayer.setInfoTemplate(infoTemplate);
	            }
           } else {//Its url matches the EnviroAtlas layer          	
	
   	            window.featureLyrNumber.push(eaIDinSearchFilter);                              
           }
           
            if (esriLang.isDefined(l.showLabels)) {
                tempLayer.setShowLabels(l.showLabels);
            }
            if (esriLang.isDefined(l.refreshInterval)) {
                tempLayer.setRefreshInterval(l.refreshInterval);
            }
            if (esriLang.isDefined(l.showLegend)) {
                // TODO?
                console.log('');
            }
            if (esriLang.isDefined(l.timeAnimation)) {
                if (l.timeAnimation === false) {
                    // TODO?
                    console.log("");
                }
            }
            layerDefinition = l.layerDefinition;
            if (layerDefinition) {
                console.log("layerDefinition",layerDefinition)
                if (layerDefinition.definitionExpression) {
                    tempLayer.setDefinitionExpression(layerDefinition.definitionExpression);
                }
                if (layerDefinition.displayField) {
                    tempLayer.displayField(layerDefinition.displayField);
                }
                if (layerDefinition.drawingInfo) {
                    if (layerDefinition.drawingInfo.renderer) {
                        jsonRenderer = djJson.parse(djJson.stringify(layerDefinition.drawingInfo.renderer));
                        renderer = jsonRendererUtils.fromJson(jsonRenderer);
                        if (jsonRenderer.type && (jsonRenderer.type === "classBreaks")) {
                            renderer.isMaxInclusive = true;
                        }
                        tempLayer.setRenderer(renderer);
                    }
                    if (esriLang.isDefined(layerDefinition.drawingInfo.transparency)) {
                        // TODO validate before setting?
                        tempLayer.setOpacity(1 - (layerDefinition.drawingInfo.transparency / 100));
                    }
                }
                else {


                	if (tileURL!="") {

	                	lOptions = {};
                        lOptions.id = window.layerIdTiledPrefix + eaIDinSearchFilter;

                        this.map.addLayer(new ArcGISTiledMapServiceLayer(tileURL, lOptions));
                    }
                	
                }
                if (esriLang.isDefined(layerDefinition.minScale)) {
                    tempLayer.setMinScale(layerDefinition.minScale);
                }
                if (esriLang.isDefined(layerDefinition.maxScale)) {
                    tempLayer.setMaxScale(layerDefinition.maxScale);
                }
                if (esriLang.isDefined(layerDefinition.defaultVisibility)) {
                    if (layerDefinition.defaultVisibility === false) {
                        tempLayer.setVisibility(false);
                        // TODO?
                    }
                }
            }
            return tempLayer;
        }
    });
}); 