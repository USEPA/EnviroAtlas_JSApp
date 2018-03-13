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
        'esri/arcgis/Portal',
        'esri/geometry/Extent',
        'esri/geometry/webMercatorUtils',
        'esri/arcgis/utils',
    'esri/layers/FeatureLayer',
    'esri/layers/layer',
    'esri/layers/ArcGISDynamicMapServiceLayer',
    'esri/dijit/PopupTemplate',
        'jimu/PanelManager',
        'jimu/ConfigManager',
        'jimu/MapManager',
        'jimu/tokenUtils',
        'jimu/dijit/Message',
        'jimu/dijit/Search',
        'jimu/dijit/TabContainer3',
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
        arcgisPortal,
        Extent,
        webMercatorUtils,
              arcgisUtils,
              FeatureLayer,
              layer,
              ArcGISDynamicMapServiceLayer,
              PopupTemplate,
              PanelManager,
        ConfigManager,
        MapManager,
        tokenUtils,
        Message,
        Search,
        TabContainer3,
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

                console.log('ChangeWebMap :: postCreate :: completed');
            },

            startup: function () {
            	selfAddWebMapData = this;
                this.inherited(arguments);
                console.log('ChangeWebMap :: startup');
            },

            onOpen: function () {
                w = this;
                console.log('ChangeWebMap :: onOpen');
            },

            onSignIn: function (credential) {
                this.credential = credential;
                this.currentUserId = credential.userId;

                this.searchMyContent(this.currentUserId);

                this.updateUIForSignIn();
                console.log('ChangeWebMap :: onSignIn : user signed in ', this.currentUserId);
            },

            onSignOut: function () {

                this.credential = null;
                this.currentUserId = '';
                this.updateUIForSignIn();
                this.mycontentItemTable.clear();

                console.log('ChangeWebMap :: onSignOut : user signed out ');
            },

            doSignIn: function () {
                console.log("ChangeWebMap :: doSignIn");

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
                console.log("ChangeWebMap :: doSignOut");

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

                console.log('ChangeWebMap :: updateUIForSignIn :: hasSignIn = ', hasSignIn);
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
                            console.log('ChangeWebMap :: promptUserToZoomToItem :: keep current extent');
                            dlg.close();
                        })
                    }, {
                        label: "Yes",
                        onClick: lang.hitch(this, function () {
                            dlg.close();
                            console.log('ChangeWebMap :: promptUserToZoomToItem :: zooming to new extent');
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

                console.log('ChangeWebMap :: zoomToItem :: map itemid ', this.map.itemId);
                this.map.setExtent(extentWM, true).then(
                    function () {
                        console.log('ChangeWebMap :: zoomToItem :: zoomed to ', extentGCS);
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
                    console.log('ChangeWebMap :: tabChanged to ', title);

                })));
            },

            /**
             * set the my content table with the query for the given user 
             * @param {String} userId user id
             */
            searchMyContent: function (userId) {
                console.log('ChangeWebMap :: searchMyContent :: starting for user = ', userId);
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
                console.log("ChangeWebMap :: searchPublicContent :: starting ");
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

                console.log("ChangeWebMap :: searchPublicContent :: completed ");
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


            // when a web map is selected make it active, but keep the extent
            _onItemSelected: function (item) {
            	//this.promptUserToZoomToItem(item);
            	this.zoomToItem(item);
            	showLayerListWidget();
                testmap = this.map;

                item.getItemData().then(function(response){
                    response.operationalLayers.forEach(function(l){
                        if(l.url){
                            console.log("Web Map Layers:: ",l.layerType);
                            if(l.layerType == 'ArcGISMapServiceLayer'){
                                //Get the layer
                                tempLayer = new ArcGISDynamicMapServiceLayer(l.url, {
                                    id: l.id,
                                    opacity: l.opacity,
                                });
                                //if layers have popupInfo grab them
                                if(l.layers){

                                    var infoTemps=[];
                                    l.layers.forEach(function(iL){
                                        var popupTemplate = new PopupTemplate(iL.popupInfo);
                                        var infoTemp = {
                                            infoTemplate: popupTemplate,
                                            layerUrl: null
                                        }
                                        infoTemps.push(infoTemp);
                                    });
                                    tempLayer.setInfoTemplates(infoTemps);
                                }

                            }else if(l.layerType == 'ArcGISFeatureLayer'){
                                tempLayer = new FeatureLayer(l.url, {
                                    mode: FeatureLayer.MODE_ONDEMAND,
                                    id: l.id,
                                    opacity: l.opacity,
                                    outFields: ["*"]
                                });
                                if(l.popupInfo){
                                    var popupTemplate = new PopupTemplate(l.popupInfo);
                                    tempLayer.infoTemplate = popupTemplate;
                                }                            		


                            }
                        }
                        else{
                            if(l.featureCollection){
                                console.log("Web Map Layers:: FeatureCollection");
                                l.featureCollection.layers.forEach(function(subL){
                                    tempLayer = new FeatureLayer(subL,{
                                       id: l.id
                                    });

                                    if(subL.popupInfo){
                                        var popupTemplate = new PopupTemplate(subL.popupInfo);
                                        tempLayer.infoTemplate = popupTemplate;
                                    }
                                });
                            }else{
                                console.log("Add Layer Error:: Layer of unknown type");
                                if (!(l.url in window.faildedEALayerDictionary)){
							  		window.faildedEALayerDictionary[l.url] = l.url;
							  		document.getElementById('openFailedLayer').click();
							  	}	
                            }
                        }
                        if(tempLayer){
                        	window.layerID_Portal_WebMap.push(l.id);
                            testmap.addLayer(tempLayer);
                        }

                    });
                });
                //Close the widget
                PanelManager.getInstance().closePanel(w.id + "_panel");
            }

        });
    });