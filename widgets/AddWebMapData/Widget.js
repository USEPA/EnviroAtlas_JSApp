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
    "esri/layers/LayerDrawingOptions",
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
              LayerDrawingOptions,
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
        var showLayerListWidget = function(){
	        var widgetName = 'LayerList';
	        var widgets = selfAddWebMapData.appConfig.getConfigElementsByName(widgetName);
	        var pm = PanelManager.getInstance();
	        pm.showPanel(widgets[0]);	   	
	    };
        return declare([BaseWidget, _WidgetsInTemplateMixin], {
            // Custom widget code goes here

            baseClass: 'jimu-widget-addwebmapdata',

            // the tabs
            tab: null,

            _itemTypes: '["Web Map"]',
            _typeKeywords: '[]',

            // set on sign in
            credential: null,

            // user id of logged in user
            currentUserId: '',

            //methods to communication with app container:

            postCreate: function () {
                this.inherited(arguments);

                this._initTabs();

                //bind events
                this.own(
                    on(this.mycontentItemTable, 'item-selected', lang.hitch(this, this._onItemSelected))
                );

                this.own(
                    on(this.publicItemTable, 'item-selected', lang.hitch(this, this._onItemSelected))
                );

                this.searchPublicContent();

                this.updateUIForSignIn();

                //console.log('ChangeWebMap :: postCreate :: completed');
            },

            startup: function () {
            	selfAddWebMapData = this;
                this.inherited(arguments);
                var itemDetails = "";
                itemDetails += "<div id='detailsLayout' data-dojo-type='dijit/layout/LayoutContainer' data-dojo-props='design:\"headline\"'>";
                itemDetails += "<div data-dojo-type='dijit/layout/ContentPane' data-dojo-props='region:\"center\"' class='detailsContainer'>";
                itemDetails += "<div class='thumbnailDiv' id='detailsThumbnailDiv'></div>";
                itemDetails += "<div id='detailsTitleDiv'></div>";
                itemDetails += "<div id='detailsOwnerDiv'></div>"; 
                itemDetails += "<div id='detailsDateDiv'></div>"; 
                itemDetails += "<div id='detailsSnippetDiv'></div>"; 
                itemDetails += "<h2>Description:</h2>";
                itemDetails += "<div id='detailsDescriptionDiv'></div>";
                itemDetails += "<h2>Layers:</h2>";
                itemDetails += "<div id='featuredLayerList'/><image alt='loading...' src='./widgets/AddWebMapData/images/loading.gif'></div>";
                itemDetails += "<div data-dojo-type='dijit/layout/ContentPane' data-dojo-props='region:\"bottom\"' class='detailsFooter'><button id='addButton' type='button' data-dojo-type='dijit/form/Button'>Add to map</button><button id='agolButton' type='button' data-dojo-type='dijit/form/Button'>View in GeoPlatform</button></div></div>";
                var detailsPane = new Dialog({
                    id: "detailsDialog",
                    style: "position: absolute; width: 350px; height: 100%; top: 44px; left: 366px; -webkit-animation: fade-in ease-in 1; -moz-animation: fade-in ease-in 1; animation: fade-in ease-in 1; -webkit-animation-fill-mode: forwards; -moz-animation-fill-mode: forwards; animation-fill-mode: forwards; -webkit-animation-duration: 0.5s; -moz-animation-duration: 0.5s; animation-duration: 0.5s;",
                    title: "Feature Collection Details",
                    content: itemDetails,
                    isLayoutContainer: true,
                    draggable: false
                });
                if (window.location.hostname == 'enviroatlas.epa.gov') {
                    // in production, hide the login option
                    //var stylesheet = window.document.styleSheets[(window.document.styleSheets.length - 1)];
                    for (var i in window.document.styleSheets){
                        if (window.document.styleSheets[i].href && (window.document.styleSheets[i].href.indexOf("widgets/AddWebMapData/css/style.css")>0)){
                            var stylesheet = window.document.styleSheets[i];
                            break;
                        }
                    }
                    if( stylesheet.addRule ){
                        stylesheet.addRule('div.jimu-widget-addwebmapdata .control-node', 'display: none;');
                        stylesheet.addRule('div.jimu-widget-addwebmapdata > div.tab-container > div.jimu-tab3 > .container-node', 'top: 5px;');
                    } else if( stylesheet.insertRule ){
                        stylesheet.insertRule('div.jimu-widget-addwebmapdata .control-node { display: none;}', stylesheet.cssRules.length);
                        stylesheet.insertRule('div.jimu-widget-addwebmapdata > div.tab-container > div.jimu-tab3 > .container-node {top: 5px;}', stylesheet.cssRules.length);
                    }
                }
                //console.log('ChangeWebMap :: startup');
            },

            onOpen: function () {
                w = this;
                //console.log('ChangeWebMap :: onOpen');
            },

            onSignIn: function (credential) {
                this.credential = credential;
                this.currentUserId = credential.userId;

                this.searchMyContent(this.currentUserId);

                this.updateUIForSignIn();
                //console.log('ChangeWebMap :: onSignIn : user signed in ', this.currentUserId);
            },

            onSignOut: function () {

                this.credential = null;
                this.currentUserId = '';
                this.updateUIForSignIn();
                this.mycontentItemTable.clear();

                //console.log('ChangeWebMap :: onSignOut : user signed out ');
            },

            doSignIn: function () {
                //console.log("ChangeWebMap :: doSignIn");

                var regOAuth = tokenUtils.registerOAuthInfo(this.config.portalUrl, "S8P0zvjK2t50sCNd");

                tokenUtils.signInPortal(this.config.portalUrl)
                    .then(function (credential) {
                        topic.publish('userSignIn', credential);
                    }, function () {
                        var msg = new Message({
                            message: "An error occurred logging in. Please try again.",
                            type: 'error'
                        });
                    });

                // will callback onSignIn when completed
            },

            doSignOut: function () {
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
            updateUIForSignIn: function () {
                var hasSignIn = !!this.currentUserId,
                    display = !hasSignIn ? "block" : "none";
                // if logged in, hide the signin button
                html.setStyle(this.signInPanel, 'display', display);

                // if logged in, hide the signout button
                display = hasSignIn ? "block" : "none";
                html.setStyle(this.signOutPanel, 'display', display);

                this.signOutMessage.innerHTML = string.substitute("You are logged in as <strong>${userid}</strong>", {
                    "userid": this.currentUserId
                });

                //console.log('ChangeWebMap :: updateUIForSignIn :: hasSignIn = ', hasSignIn);
            },

            /**
             * prompt the user to zoom to the item
             * @param {Object} item web map item from Portal
             */
            promptUserToZoomToItem: function (item) {

                // the dialog is async so processing continues before question is answered
                var dlg = new Message({
                    message: "Do you want to zoom to the new map?",
                    type: 'question',
                    buttons: [{
                        label: "No",
                        onClick: lang.hitch(this, function () {
                            //console.log('ChangeWebMap :: promptUserToZoomToItem :: keep current extent');
                            dlg.close();
                        })
                    }, {
                        label: "Yes",
                        onClick: lang.hitch(this, function () {
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
            zoomToItem: function (item) {

                var extentGCS,
                    extentWM,
                    cfg;

                // item have extent in geographic
                cfg = {
                    "xmin": item.extent[0][0],
                    "ymin": item.extent[0][1],
                    "xmax": item.extent[1][0],
                    "ymax": item.extent[1][1],
                    "spatialReference": {
                        "wkid": 4326
                    }
                };

                extentGCS = new Extent(cfg);

                // assumes map is in web mercator
                extentWM = webMercatorUtils.geographicToWebMercator(extentGCS);

                //console.log('ChangeWebMap :: zoomToItem :: map itemid ', this.map.itemId);
                this.map.setExtent(extentWM, true).then(
                    function () {
                        //console.log('ChangeWebMap :: zoomToItem :: zoomed to ', extentGCS);
                    },
                    function () {
                        console.error("ChangeWebMap :: zoomToItem :: failed");
                    }
                );

            },

            /**
             * define the tabs in the UI
             */
            _initTabs: function () {
                var tabs,
                    tabMyContent,
                    tabPublic;

                tabMyContent = {
                    title: "My Content",
                    content: this.mycontentTabNode
                };

                tabPublic = {
                    title: "Public",
                    content: this.publicTabNode
                };

                tabs = [tabPublic, tabMyContent];

                this.tab = new TabContainer3({
                    tabs: tabs
                }, this.tabNode);

                this.own(on(this.tab, "tabChanged", lang.hitch(this, function (title) {
                    //console.log('ChangeWebMap :: tabChanged to ', title);

                })));
            },

            /**
             * set the my content table with the query for the given user 
             * @param {String} userId user id
             */
            searchMyContent: function (userId) {
                //console.log('ChangeWebMap :: searchMyContent :: starting for user = ', userId);
                this.mycontentItemTable.clear();

                var query = {
                    q: "type:Web Map AND owner:" + userId,
                    start: 1,
                    num: 16,
                    f: 'json'
                };

                this.mycontentItemTable.set('portalUrl', this.config.portalUrl);
                this.mycontentItemTable.searchAllItems(query);
                this.mycontentItemTable.showAllItemsSection();
            },

            /**
             * set the query on the item table in the public tab
             */
            searchPublicContent: function () {
                //console.log("ChangeWebMap :: searchPublicContent :: starting ");
                this.publicItemTable.clear();

                var query = {
                    q: this.config.publicContent.query,
                    start: 1,
                    num: 16,
                    f: 'json'
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
            getCurrentMapOptions: function () {

                var options = null,
                    scale = 0,
                    centerPt,
                    lat = 0,
                    lon = 0;

                scale = this.map.getScale();
                centerPt = this.map.extent.getCenter();
                lat = centerPt.getLatitude();
                lon = centerPt.getLongitude();

                // check for valid values
                if (!!scale && !!lat && !!lon) {
                    options = {
                        "center": [lon, lat],
                        "scale": scale
                    };
                }

                return options;
            },


            // Ask for the user's confirmation before purging all layers from the layer list widget
            _onItemSelected: function (item) {
                //If there are more layers than just the default basemap
                if (this.map.layerIds.length > 1){
                    this.promptUserforConfirmation(item);
                    return;
                }
                this._onConfirmation(item);
            },

            /**
             * prompt the user to zoom to the item
             * @param {Object} item web map item from Portal
             */
            promptUserforConfirmation: function (item) {
                var dlg = new Message({
                    message: "This will replace all layers currently added to the map. If you wish to save your current layer selection, please use the save session widget first.",
                    type: 'question',
                    buttons: [{
                        label: "Cancel and save session",
                        onClick: lang.hitch(this, function () {
                            //console.log('ChangeWebMap :: promptUserToZoomToItem :: keep current extent');
                            dlg.close();
                            //Show Save Session Widget
                            var widgetName = 'SaveSession';
                            var pm = PanelManager.getInstance();
                            var widgets = pm.widgetManager.appConfig.getConfigElementsByName(widgetName);
                            pm.showPanel(widgets[0]);
                        })
                    }, {
                        label: "Proceed",
                        onClick: lang.hitch(this, function () {
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
            
            _onConfirmation: function (item) {
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
				    selfAddWebMapData.publishData({
				        message : "updateCommunityLayers"
				    });                	
                }
                item.getItemData().then(function(response){
                    //process operational layers in reverse order to match AGOL
                    layersReversed = response.operationalLayers.reverse();
                    layersReversed.forEach(function(l){
                        if(l.url){
                            //console.log("Web Map Layers:: ",l.layerType);
                            if(l.layerType == 'ArcGISMapServiceLayer'){
                                //Get the layer
                                tempLayer = new ArcGISDynamicMapServiceLayer(l.url, {
                                    id: l.id,
                                    opacity: l.opacity,
                                    visible: l.visibility
                                });
                                //if layers have popupInfo grab them
                                if(l.layers){
                                    var expressions = [];
                                    var dynamicLayerInfo;
                                    var dynamicLayerInfos = [];
                                    var drawingOptions;
                                    var drawingOptionsArray = [];
                                    var source;
                                    array.forEach(l.layers, function(layerInfo){
                                      if (layerInfo.layerDefinition && layerInfo.layerDefinition.definitionExpression) {
                                        expressions[layerInfo.id] = layerInfo.layerDefinition.definitionExpression;
                                      }
                                      if (layerInfo.layerDefinition && layerInfo.layerDefinition.source) {
                                        dynamicLayerInfo = null;
                                        source = layerInfo.layerDefinition.source;
                                        if (source.type === "mapLayer") {
                                          var metaLayerInfos = array.filter(response.layers, function(rlyr) {
                                            return rlyr.id === source.mapLayerId;
                                          });
                                          if (metaLayerInfos.length) {
                                            dynamicLayerInfo = lang.mixin(metaLayerInfos[0], layerInfo);
                                          }
                                        }
                                        else {
                                          dynamicLayerInfo = lang.mixin({}, layerInfo);
                                        }
                                        if (dynamicLayerInfo) {
                                          dynamicLayerInfo.source = source;
                                          delete dynamicLayerInfo.popupInfo;
                                          dynamicLayerInfo = new DynamicLayerInfo(dynamicLayerInfo);
                                          if (l.visibleLayers) {
                                            var vis = ((typeof l.visibleLayers) === "string") ?
                                              l.visibleLayers.split(",") : l.visibleLayers;
                                            if (array.indexOf(vis, layerInfo.id) > -1) {
                                              dynamicLayerInfo.defaultVisibility = true;
                                            } else {
                                              dynamicLayerInfo.defaultVisibility = false;
                                            }
                                          }
                                          dynamicLayerInfos.push(dynamicLayerInfo);
                                        }
                                      }
                                      if (layerInfo.layerDefinition && layerInfo.layerDefinition.source &&
                                          layerInfo.layerDefinition.drawingInfo) {
                                        drawingOptions = new LayerDrawingOptions(layerInfo.layerDefinition.drawingInfo);
                                        drawingOptionsArray[layerInfo.id] = drawingOptions;
                                      }
                                    });

                                    if (expressions.length > 0) {
                                      tempLayer.setLayerDefinitions(expressions);
                                    }
                                    if (dynamicLayerInfos.length > 0) {
                                      tempLayer.setDynamicLayerInfos(dynamicLayerInfos, true);
                                      if (drawingOptionsArray.length > 0) {
                                        tempLayer.setLayerDrawingOptions(drawingOptionsArray, true);
                                      }
                                    }
                                } else if (l.visibleLayers) {
                                    tempLayer.setVisibleLayers(l.visibleLayers);
                                }

                            }else if(l.layerType == 'ArcGISFeatureLayer'){
                                tempLayer = new FeatureLayer(l.url, {
                                    mode: FeatureLayer.MODE_ONDEMAND,
                                    id: l.id,
                                    opacity: l.opacity,
                                    visible: l.visibility,
                                    outFields: ["*"]
                                });
                                tempLayer = self._processLayer(tempLayer,l);
                            }else if(l.layerType == 'ArcGISTiledMapServiceLayer'){
                                tempLayer = new ArcGISTiledMapServiceLayer(l.url, {
                                    id: l.id,
                                    opacity: l.opacity,
                                    visible: l.visibility
                                });
                            }
                        }else{
                            if(l.featureCollection){
                                console.log("Web Map Layers:: FeatureCollection");
                                l.featureCollection.layers.forEach(function(subL){
                                    tempLayer = new FeatureLayer(subL,{
                                       id: l.id
                                    });
                                    tempLayer = self._processLayer(tempLayer,subL);
                                });
                            }else{
                                console.log("Add Layer Error:: Layer of unknown type");
                                if (!(l.url in window.faildedEALayerDictionary)){
							  		window.faildedEALayerDictionary[l.url] = l.url;
									selfAddWebMapData.publishData({
							        	message: "openFailedLayer"
							    	});							  		
							  	}	
                            }
                        }
                        if(tempLayer){
                            tempLayer.title = l.title;
                        	window.layerID_Portal_WebMap.push(l.id);
                            testmap.addLayer(tempLayer);
                        }
                    });
                });
                //Close the widget
                //PanelManager.getInstance().closePanel(w.id + "_panel");
            },
            
            _processLayer: function (tempLayer, l) {
                // Borrowed from AddData/search/LayerLoader.js _processFeatureLayer
                var layerDefinition, renderer= false;
                var popInfo, infoTemplate;
                  if (l.popupInfo) {
                    popInfo = l.popupInfo;
                    jsonPopInfo = djJson.parse(djJson.stringify(popInfo));
                    infoTemplate = new PopupTemplate(jsonPopInfo);
                    tempLayer.setInfoTemplate(infoTemplate);
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
                    if (layerDefinition.definitionExpression) {
                      tempLayer.setDefinitionExpression(layerDefinition.definitionExpression);
                    }
                    if (layerDefinition.displayField) {
                      tempLayer.displayField(layerDefinition.displayField);
                    }
                    if (layerDefinition.drawingInfo) {
                      if (layerDefinition.drawingInfo.renderer) {
                        jsonRenderer = djJson.parse(
                          djJson.stringify(layerDefinition.drawingInfo.renderer)
                        );
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
                    if (esriLang.isDefined(layerDefinition.minScale)) {
                      tempLayer.setMinScale(layerDefinition.minScale);
                    }
                    if (esriLang.isDefined(layerDefinition.maxScale)) {
                      tempLayer.setMaxScale(layerDefinition.maxScale);
                    }
                    if (esriLang.isDefined(layerDefinition.defaultVisibility)) {
                      if (layerDefinition.defaultVisibility === false) {
                        tempLayer.setVisibility(false); // TODO?
                      }
                    }
                  }
                 return tempLayer;
            }
        });
    });