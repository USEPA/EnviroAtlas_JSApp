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
/*global console, define, dojo, FileReader */

define(['dojo/_base/declare',
        'jimu/BaseWidget',
        'dijit/_WidgetsInTemplateMixin',
        'dojo/_base/lang',
        'dojo/_base/array',
        'dojo/_base/html',
        'dojo/dom-attr',
        'dojo/query',
        'dojo/on',
        'dojo/topic',
        'dojo/string',
        'dojo/json',
        'dojo/Deferred',
        'dojo/promise/all',
        'esri/geometry/Extent',
        'esri/graphic',
        'esri/layers/GraphicsLayer',
        'esri/layers/FeatureLayer',
        'esri/layers/ImageParameters',
        'esri/layers/ArcGISDynamicMapServiceLayer',
        'esri/layers/ArcGISTiledMapServiceLayer',
        'jimu/ConfigManager',
        'jimu/MapManager',
        'jimu/dijit/Popup',
        'jimu/dijit/Message',
        'jimu/LayerInfos/LayerInfos',
        './SimpleTable',
        'dijit/form/TextBox'
       ],
    function (declare,
        BaseWidget,
        _WidgetsInTemplateMixin,
        lang,
        array,
        html,
        domAttr,
        query,
        on,
        topic,
        string,
        JSON,
        Deferred,
        all,
        Extent,
        Graphic,
        GraphicsLayer,
        FeatureLayer,
        ImageParameters,
        ArcGISDynamicMapServiceLayer,
        ArcGISTiledMapServiceLayer,
        ConfigManager,
        MapManager,
        Popup,
        Message,
        LayerInfos,
        Table,
        TextBox) {
        //To create a widget, you need to derive from BaseWidget.
        return declare([BaseWidget, _WidgetsInTemplateMixin], {
            // Custom widget code goes here

            baseClass: 'jimu-widget-savesession',

            // name of sessions string in local storage
            storageKey: "sessions",

            // the saved sessions
            sessions: [],

            postCreate: function () {
                this.inherited(arguments);

                // setup save to file
                this.saveToFileForm.action = this.config.saveToFileUrl;
                this.saveToFileName.value = this.config.defaultFileName;


                this.loadSavedSessionsFromStorage();

                this.initSavedSessionUI();

                this.initNewSessionUI();

                this.refreshLoadFileUI();

                console.log('SaveSession :: postCreate :: completed');
            },

            startup: function () {
                this.inherited(arguments);
                console.log('SaveSession :: startup');
            },

            onOpen: function () {
                console.log('SaveSession :: onOpen');
            },

            /**
             * create the table of saved sessions
             */
            initSavedSessionUI: function () {
                var tableSettings = {
                    autoHeight: true,
                    fields: [
                        {
                            "name": "name",
                            "title": "Session",
                            "type": "text",
                            "class": "session-name",
                            "unique": true,
                            "hidden": false,
                            "editable": true
                        },
                        {
                            "name": "actions",
                            "title": "Actions",
                            "type": "actions",
                            "class": "actions",
                            "actions": ['load', 'download', 'edit', 'up', 'down', 'delete']
                        }
                    ],
                    selectable: false
                };

                this.sessionTable = new Table(tableSettings);
                this.sessionTable.placeAt(this.savedSessionContainer);
                this.sessionTable.startup();

                // listend for events on session table
                this.own(on(this.sessionTable, 'row-delete', lang.hitch(this, 'onSessionTableChanged')));
                this.own(on(this.sessionTable, 'row-up', lang.hitch(this, 'onSessionTableChanged')));
                this.own(on(this.sessionTable, 'row-down', lang.hitch(this, 'onSessionTableChanged')));
                this.own(on(this.sessionTable, 'row-edit', lang.hitch(this, 'onSessionTableChanged')));
                this.own(on(this.sessionTable, 'actions-load', lang.hitch(this, 'onLoadSessionClicked')));
                this.own(on(this.sessionTable, 'row-dblclick', lang.hitch(this, 'onLoadSessionClicked')));
                this.own(on(this.sessionTable, 'actions-download', lang.hitch(this, 'onSaveItemToFileClicked')));

                this.sessionTable.addRows(this.sessions);
                console.log('SaveSession :: initSavedSessionUI :: session table created');
            },

            /**
             * reload the table with the saved sessions
             */
            refreshSavedSessionUI: function () {
                this.sessionTable.clear();
                this.sessionTable.addRows(this.sessions);
                console.log('SaveSession :: refreshSavedSessionUI :: session table refreshed');
            },

            /**
             * set up the UI for New Session
             */
            initNewSessionUI: function () {
                this.refreshNewSessionUI();
                this.own(this.sessionNameTextBox.on('change', lang.hitch(this, 'refreshNewSessionUI')));
                this.own(this.sessionNameTextBox.on('keypress', lang.hitch(this, 'onKeyPressed')));
                console.log('SaveSession :: initNewSessionUI :: end');
            },

            /**
             * enable the save file link when there are sessions
             */
            refreshLoadFileUI: function () {

                var sessionString = "",
                    hasSessions = false;

                hasSessions = this.sessions && this.sessions.length > 0;
                if (!hasSessions) {
                    domAttr.set(this.saveToFileButton, "disabled", "true");
                    html.addClass(this.saveToFileButton, "jimu-state-disabled");
                    console.log('SaveSession :: refreshLoadFileUI :: save to file button disabled');
                } else {
                    domAttr.remove(this.saveToFileButton, "disabled");
                    html.removeClass(this.saveToFileButton, "jimu-state-disabled");
                    console.log('SaveSession :: refreshLoadFileUI :: save to file button enabled');
                }

                // use a data url to save the file, if not using a server url
                // if useServerToDownloadFile, use a form post to a service instead
                if (!this.config.useServerToDownloadFile) {
                    // also set the save to link if has sessions
                    // this uses data url to prompt user to download
                    if (hasSessions) {
                        sessionString = JSON.stringify(this.sessions);
                        // must convert special chars to url encoding
                        sessionString = encodeURIComponent(sessionString);
                        domAttr.set(this.saveToFileButton, "href", "data:application/octet-stream," + sessionString);
                        domAttr.set(this.saveToFileButton, "download", this.config.fileNameForAllSessions);
                        console.log('SaveSession :: refreshLoadFileUI :: data url set on saveToFileButton');
                    }
                }
            },

            /**
             * when a key is pressed, check the session name
             * @param {Object} e event args
             */
            onKeyPressed: function (e) {

                if (e.keyCode === dojo.keys.ENTER) {
                    this.onSaveButtonClicked();
                }

                setTimeout(lang.hitch(this, 'refreshNewSessionUI'), 0);
                console.log('SaveSession :: onKeyPressed :: end');
            },

            /**
             * enable the save button when a valid entry is in textbox
             */
            refreshNewSessionUI: function () {
                var sessionName = "",
                    isValid = false;
                sessionName = this.sessionNameTextBox.get("value");

                // must have a valid session name to enable save
                isValid = this.isValidSessionName(sessionName);

                if (!isValid) {
                    domAttr.set(this.saveButton, "disabled", "true");
                    html.addClass(this.saveButton, "jimu-state-disabled");
                    console.log('SaveSession :: refreshNewSessionUI :: save button disabled');
                } else {
                    domAttr.remove(this.saveButton, "disabled");
                    html.removeClass(this.saveButton, "jimu-state-disabled");
                    console.log('SaveSession :: refreshNewSessionUI :: save button enabled');
                }

                this.inputText.innerHTML = this.getMesageForSessionName(sessionName);
                console.log('SaveSession :: refreshNewSessionUI :: end');
            },

            /**
             * checks if the given name is valid - has text and is not already taken
             * @param   {String} sessionName name for the session
             * @returns {Boolean}  true if the given session name is not already entered
             */
            isValidSessionName: function (name) {

                if (!name) {
                    return false;
                }

                // check for duplicates
                var hasSameName = array.some(this.sessions, function (session) {
                    return session.name === name;
                }, this);

                return !hasSameName;
            },

            /**
             * checks if the given name is valid - has text and is not already taken
             * @param   {String} sessionName name for the session
             * @returns {String}  true if the given session name is not already entered
             */
            getUniqueSessionName: function (name, idx) {

                idx = idx || 0; // default to 0

                idx += 1;

                var newName = name + " " + String(idx);

                if (!this.isValidSessionName(newName)) {

                    newName = this.getUniqueSessionName(name, idx);
                }

                return newName;
            },

            /**
             * returns input text for session name
             * @param   {String} sessionName name for the session
             * @returns {String}  a help message
             */
            getMesageForSessionName: function (name) {

                var text = "",
                    hasSameName = false;

                if (!name) {
                    text = "Enter the name for the session";
                }

                // check for duplicates
                hasSameName = array.some(this.sessions, function (session) {
                    return session.name === name;
                }, this);

                if (hasSameName) {
                    text = "Enter a unique name for the session";
                }

                return text;
            },

            /**
             * when the save button is clicked, add the session to local storage
             */
            onSaveButtonClicked: function () {
                console.log('SaveSession :: onSaveButtonClicked :: begin');
                var session,
                    sessionName = "";
                sessionName = this.sessionNameTextBox.get("value");

                if (!this.isValidSessionName(sessionName)) {
                    console.log('SaveSession :: onSaveButtonClicked :: invalid sesion name = ', sessionName);
                    return;
                }

                session = this.getSettingsForCurrentMap();
                session.name = sessionName;
                this.sessions.push(session);
                console.log("SaveSession :: onSaveButtonClicked :: added session = ", session);

                this.storeSessions();

                this.sessionTable.addRow(session);
                this.refreshLoadFileUI();
                this.refreshNewSessionUI();
                console.log('SaveSession :: onSaveButtonClicked :: end');
            },

            /**
             * get the sessions from the table and store them
             */
            onSessionTableChanged: function (e) {
                console.log('SaveSession :: onSessionTableChanged :: begin');

                // store changed sessions
                this.sessions = this.sessionTable.getItems();
                this.storeSessions();

                // and update ui
                this.refreshLoadFileUI();
                this.refreshNewSessionUI();

                console.log('SaveSession :: onSessionTableChanged :: session stored');
            },

            /**
             * Load the session when clicked in Table
             * @param {Object} e the event args - item = session
             */
            onLoadSessionClicked: function (e) {
                var session = e.item;
                console.log('SaveSession :: onLoadSessionClicked :: session  = ', session);
                this.loadSession(session);
            },

            /**
             * prompt to upload file
             * @param {Object} e the event args 
             */
            onLoadFromFileButtonClicked: function (e) {

                var popup = new Popup({
                    titleLabel: "Load sessions from file",
                    autoHeight: true,
                    content: "Choose the file to load: <input type='file' id='file-to-load' name='file' enctype='multipart/form-data' />",
                    container: 'main-page',
                    width: 400,
                    height: 200,
                    buttons: [{
                        label: "Ok",
                        key: dojo.keys.ENTER,
                        onClick: lang.hitch(this, function () {
                            console.log('SaveSession :: onLoadFromFile :: ok');
                            var fileInput,
                                fileName;

                            // get file from input
                            fileInput = query('#file-to-load', popup.domNode)[0];
                            fileName = fileInput.files[0];
                            popup.close();
                            this.loadSavedSessionsFromFile(fileName);
                        })

                    }, {
                        label: "Cancel",
                        key: dojo.keys.ESCAPE,
                        onClick: lang.hitch(this, function () {
                            console.log('SaveSession :: onLoadFromFile :: canceled');
                            popup.close();
                        })
                    }],
                    onClose: lang.hitch(this, function () {
                        console.log('SaveSession :: onLoadFromFile :: closed');
                    })
                });
                console.log('SaveSession :: onLoadFromFileButtonClicked :: ');
            },

            /**
             * save sessions to file
             * @param {Object} e the event args 
             */
            onSaveToFileButtonClicked: function (e) {

                if (!this.config.useServerToDownloadFile) {
                    // skipping since there is no url to submit to
                    console.log('SaveSession :: onSaveToFileButtonClicked :: saveToFileForm submit canceled.');
                    return;
                }

                var sessionString = JSON.stringify(this.sessions);

                // update form values
                this.saveToFileName.value = this.config.fileNameForAllSessions;
                this.saveToFileContent.value = sessionString;

                // trigger the post to server side
                this.saveToFileForm.submit();

                console.log('SaveSession :: onSaveToFileButtonClicked :: end');
            },

            /**
             * save the single item to file
             * @param {Object} e the event args 
             */
            onSaveItemToFileClicked: function (e) {

                var sessionString = "",
                    fileName = "",
                    sessions = [];
                return;
                fileName = string.substitute(this.config.fileNameTplForSession, e.item);

                sessions.push(e.item);
                sessionString = JSON.stringify(sessions);

                // update form values
                this.saveToFileName.value = fileName;
                this.saveToFileContent.value = sessionString;

                // trigger the post to server side
                console.log(this.saveToFileForm);
                this.saveToFileForm.submit();

                console.log('SaveSession :: onSaveItemToFileClicked :: end');
            },

            /**
             * load the session definitions from the given text file
             * @param {Object} file reference to text file to load
             */
            loadSavedSessionsFromFile: function (file) {
                console.log('SaveSession :: loadSavedSessionsFromFile :: begin for file = ', file);

                var sessionsString = "",
                    sessionsToLoad = null,
                    reader,
                    msg,
                    loadedCount = 0,
                    me = this;

                reader = new FileReader();

                // when the file is loaded
                reader.onload = function () {
                    var sessionsString = reader.result;

                    if (!sessionsString) {
                        console.warn("SaveSession :: loadSavedSessionsFromFile : no sessions to load");
                        msg = new Message({
                            message: "No sessions found in the file.",
                            type: 'message'
                        });
                        return;
                    }

                    sessionsToLoad = JSON.parse(sessionsString);
                    console.log("SaveSession :: loadSavedSessionsFromFile : sessions found ", sessionsToLoad);

                    array.forEach(sessionsToLoad, function (sessionToLoad) {
                        var isValid = me.isValidSessionName(sessionToLoad.name);
                        if (!isValid) {
                            // fix the session name
                            sessionToLoad.name = me.getUniqueSessionName(sessionToLoad.name);
                            console.log("SaveSession :: loadSavedSessionsFromFile :: session name changed to " + sessionToLoad.name);
                        }

                        // refresh tabl
                        this.sessions.push(sessionToLoad);
                        this.sessionTable.addRow(sessionToLoad);
                        loadedCount += 1;
                    }, me);

                    // do not call refresh ui since session table will trigger change event
                    me.storeSessions();
                    me.refreshLoadFileUI();

                    msg = new Message({
                        message: String(loadedCount) + " sessions loaded from the file.",
                        type: 'message'
                    });

                    console.log('SaveSession :: loadSavedSessionsFromFile :: end for file = ', file);
                };

                // starting reading, and continue when load event fired
                reader.readAsText(file);
            },

            /**
             * Apply the settings from the given session to the current map
             * @param {Object} sessionToLoad a session
             */
            loadSession: function (sessionToLoad) {

                var onMapChanged,
                    extentToLoad;

                if (sessionToLoad.webmapId && sessionToLoad.webmapId !== this.map.itemId) {
                    console.log('SaveSession :: loadSession :: changing webmap = ', sessionToLoad.webmapId);


                    onMapChanged = topic.subscribe("mapChanged", lang.hitch(this, function (newMap) {

                        console.log('SaveSession :: loadSession :: map changed from  ', this.map.itemId, ' to ', newMap.itemId);

                        // update map reference here
                        // since this.map still refers to old map?
                        // ConfigManager has not recreated widget with new map yet
                        this.map = newMap;

                        // do not listen any more
                        onMapChanged.remove();

                        // load the rest of the session
                        this.loadSession(sessionToLoad);
                    }));


                    ConfigManager.getInstance()._onMapChanged({
                        "itemId": sessionToLoad.webmapId
                    });

                    // do not continue until webmap is changed
                    return;
                }

                //  zoom the map
                if (sessionToLoad.extent) {
                    extentToLoad = new Extent(sessionToLoad.extent);
                    this.map.setExtent(extentToLoad).then(function () {
                        console.log('SaveSession :: loadSession :: new extent  = ', extentToLoad);
                    }, function () {
                        var msg = new Message({
                            message: string.substitute("An error occurred zooming to the ${name} map.", sessionToLoad),
                            type: 'error'
                        });
                    });
                }

                // load the saved graphics
                this.setGraphicsOnCurrentMap(sessionToLoad.graphics);


                // toggle layers
                if (sessionToLoad.layers) {
                    this.setLayersOnMap(sessionToLoad.layers);
                }

                console.log('SaveSession :: loadSession :: session  = ', sessionToLoad);
            },

            /**
             * apply settings to layers
             * @param {Array} array of layer settings to apply to map
             */
            setLayersOnMap: function (settings) {
                var propName = "",
                    layerSettings,
                    layer,
                    addGraphicsToLayer;

                array.forEach(settings, function (layerSettings) {
                    layer = this.map.getLayer(layerSettings.id);
                    if (!layer) {
                        console.log('SaveSession :: setLayersOnMap :: no layer found with id = ', propName);
                        layer = this.addLayerToMap(layerSettings);
                        // exit here? or re-apply settings 
                        return;
                    }

                    // set visible
                    if (layer.setVisibility) {
                        layer.setVisibility(layerSettings.isVisible);
                        console.log('SaveSession :: loadSession :: set visibility = ', layerSettings.isVisible, ' for layer : id=', layer.id);
                    }

                    if (layerSettings.visibleLayers && layer.setVisibleLayers) {
                        layer.setVisibleLayers(layerSettings.visibleLayers);
                    }

                    console.log('SaveSession :: loadSession :: setLayersOnMap completed for layer = ', layer.id);
                }, this);

                // fire refresh event 
                LayerInfos.getInstance(this.map, this.map.itemInfo).then(function (layerInfosObject) { // fire change event to trigger update
                    on.emit(layerInfosObject, "updated");
                    //layerInfosObject.onlayerInfosChanged();
                });

            },

            /**
             * create a new map layer with the given settings
             * @param {Object} layerSettings settings for the layer
             * @return {Object} layer oject
             */
            addLayerToMap: function (layerSettings) {
                console.log('SaveSession :: addLayerToMap :: adding layer = ', layerSettings);
                var layer,
                    options;
                switch (layerSettings.type) {
                case "ArcGISDynamicMapServiceLayer":
                    options = lang.clone(layerSettings.options);
                    options.imageParameters = new ImageParameters();
                    lang.mixin(options.imageParameters, layerSettings.options.imageParameters);
                    layer = new ArcGISDynamicMapServiceLayer(layerSettings.url, options);
                    console.log('SaveSession :: addLayerToMap :: created ArcGISDynamicMapServiceLayer layer = ', layer);
                    break;
                case "FeatureLayer":
                    layer = new FeatureLayer(layerSettings.url, layerSettings.options);
                    console.log('SaveSession :: addLayerToMap :: created Feature layer = ', layer);
                    break;
                case "ArcGISTiledMapServiceLayer":
                    layer = new ArcGISTiledMapServiceLayer(layerSettings.url, layerSettings.options);
                    console.log('SaveSession :: addLayerToMap :: created ArcGISTiledMapServiceLayer layer = ', layer);
                    break;
                default:
                    console.log('SaveSession :: addLayerToMap :: unsupported layer type = ', layerSettings.type);
                    break;
                }

                if (layerSettings.name) {
                    layer.name = layerSettings.name;
                }

                // The bottom most layer has an index of 0.
                this.map.addLayer(layer, layerSettings.order);
                console.log('SaveSession :: addLayerToMap :: created layer for ', layer.id, ' using settings = ', layerSettings);
                return layer;
            },

            /**
             * returns the session object for the current map
             * @returns {Object} map settings for session
             */
            getSettingsForCurrentMap: function () {

                var settings = {
                    name: "",
                    webmapId: "",
                    extent: null,
                    layers: [],
                    graphics: []
                };

                settings.extent = this.map.extent;
                settings.webmapId = this.map.itemId;

                settings.graphics = this.getGraphicsForCurrentMap();

                // have to use async to get layers
                this.getLayerSettingsForCurrentMap().then(function (layerSettings) {
                    settings.layers = layerSettings;
                    console.log('SaveSession :: getSettingsForCurrentMap :: layerSettings completed  = ', layerSettings);
                }, function (err) {
                    var msg = new Message({
                        message: string.substitute("An error getting the layers from the current map."),
                        type: 'error'
                    });
                });

                return settings;
            },

            /**
             * async return the settings for the current layers on the map
             * @returns {Array} returns an array of layers defs to save
             */
            getLayerSettingsForCurrentMap: function () {
                var def = new Deferred();
                this.getLayerObjectsFromMap().then(lang.hitch(this, function (result) {
                    console.log('SaveSession :: getLayerSettingsForCurrentMap :: layersObects  = ', result);
                    try {
                        var settings = [],
                            layerSettings,
                            maxIndex = result.layerObjects.length;
                        array.forEach(result.layerObjects, function (layer, idx) {
                            // layer settings uses layerId as property name
                            layerSettings = this.getSettingsForLayer(layer);
                            layerSettings.order = maxIndex - idx; // The bottom most layer has an index of 0. so reverse order
                            settings.push(layerSettings);
                        }, this);

                        def.resolve(settings);
                    } catch (err) {
                        console.error('SaveSession :: getLayerSettingsForCurrentMap :: error getting layersObects  = ', err);
                        def.reject(err);
                    }

                }), lang.hitch(this, function (err) {
                    console.error('SaveSession :: getLayerSettingsForCurrentMap :: error getting layersObects  = ', err);
                    def.reject(err);
                }));

                return def.promise;
            },

            /**
             * return the settings to store for the given layer
             * @param   {esri.layers.Layer}   layer the layer to get the settings for
             * @returns {Object} the settings object to store for the given layer
             */
            getSettingsForLayer: function (layer) {
                var layerSettings = {
                    id: layer.id,
                    name: layer.name,
                    type: "",
                    isVisible: layer.visible,
                    visibleLayers: layer.visibleLayers || null,
                    url: layer.url,
                    options: null
                };

                layerSettings.type = this.getLayerType(layer);

                switch (layerSettings.type) {
                case "ArcGISDynamicMapServiceLayer":
                    layerSettings.options = this.getOptionsForDynamicLayer(layer);
                    break;
                case "FeatureLayer":
                    layerSettings.options = this.getOptionsForFeatureLayer(layer);
                    console.log('SaveSession :: getSettingsForLayer :: added options for feature layer = ', layerSettings);
                    break;
                case "ArcGISTiledMapServiceLayer":
                    layerSettings.options = this.getOptionsForTiledLayer(layer);
                    console.log('SaveSession :: getSettingsForLayer :: added options for tiled layer = ', layerSettings);
                    break;

                default:
                    console.log('SaveSession :: getSettingsForLayer :: no options for layer type = ', layerSettings.type);
                    break;
                }

                console.log('SaveSession :: getSettingsForCurrentMap :: settings ', layerSettings, ' added for layer = ', layer.id);
                return layerSettings;
            },

            /**
             * return the options object to create the given layer
             * @param   {esri.layers.ArcGISDynamicMapServiceLayer}   layer the ArcGISDynamicMapServiceLayer 
             * @returns {Object} Object with properties for the ArcGISDynamicMapServiceLayer constructor
             */
            getOptionsForDynamicLayer: function (layer) {
                var ip,
                    options = {
                        id: layer.id,
                        imageParameters: null,
                        opacity: layer.opacity,
                        refreshInterval: layer.refreshInterval,
                        visible: layer.visible
                    };

                if (layer.imageFormat) {
                    ip = {
                        format: layer.imageFormat,
                        dpi: layer.dpi
                    };

                    options.imageParameters = ip;
                }

                console.log('SaveSession :: getOptionsForDynamicLayer :: options =  ', options, ' for layer = ', layer.id);
                return options;
            },

            /**
             * return the options object to create the given layer
             * @param   {esri.layers.FeatureLayer}   layer the FeatureLayer 
             * @returns {Object} Object with properties for the FeatureLayer constructor
             */
            getOptionsForFeatureLayer: function (layer) {

                var options = {
                    id: layer.id,
                    mode: FeatureLayer.MODE_ONDEMAND,
                    outFields: ["*"],
                    opacity: layer.opacity,
                    refreshInterval: layer.refreshInterval,
                    visible: layer.visible
                };

                // TODO: get mode?

                console.log('SaveSession :: getOptionsForFeatureLayer :: options =  ', options, ' for layer = ', layer.id);
                return options;
            },

            /**
             * return the options object to create the given layer
             * @param   {esri.layers.ArcGISTiledMapServiceLayer}   layer the Tiled layer 
             * @returns {Object} Object with properties for the ArcGISTiledMapServiceLayer constructor
             */
            getOptionsForTiledLayer: function (layer) {

                var options = {
                    id: layer.id,
                    opacity: layer.opacity,
                    refreshInterval: layer.refreshInterval,
                    visible: layer.visible
                };

                console.log('SaveSession :: getOptionsForTiledLayer :: options =  ', options, ' for layer = ', layer.id);
                return options;
            },

            /**
             * return all the settings for the current graphic layers
             * @returns {Array} array of settings objects for each graphic layer
             */
            getGraphicsForCurrentMap: function () {
                var settings = [],
                    graphicLayer,
                    layerSettings;

                // always add the default graphics layer
                layerSettings = this.getSettingsFromGraphicsLayer(this.map.graphics);
                settings.push(layerSettings);

                // save the graphics for other layers
                array.forEach(this.map.graphicsLayerIds, function (layerId) {
                    graphicLayer = this.map.getLayer(layerId);
                    if (graphicLayer.graphics.length > 0) {
                        // if there are graphics then save the settings
                        layerSettings = this.getSettingsFromGraphicsLayer(graphicLayer);
                        settings.push(layerSettings);
                    }
                }, this);

                console.log('SaveSession :: getGraphicsForCurrentMap :: settings added for graphics = ', settings);
                return settings;
            },

            /**
             * create settings object from the given graphics Layer
             * @param   {GraphicLayer}   graphicLayer a graphics layer
             * @returns {Object} the settings to store for the graphics layer
             */
            getSettingsFromGraphicsLayer: function (graphicLayer) {
                var settings = {
                    id: graphicLayer.id,
                    graphics: []
                };

                // set the graphics from the layer
                array.forEach(graphicLayer.graphics, function (g) {
                    settings.graphics.push(g.toJson());
                }, this);

                console.log('SaveSession :: getSettingsFromGraphicsLayer :: settings ', settings, ' added for graphicLayer = ', graphicLayer);
                return settings;
            },

            /** 
             * add the graphics defined in the settings to the current map
             * @param {Object} settings = object with property for each graphic layer
             */
            setGraphicsOnCurrentMap: function (settings) {
                var propName = "",
                    settingsForLayer,
                    graphicsLayer,
                    addGraphicsToLayer;

                // helper function to add all graphics defined in the settings to the given graphics layer
                addGraphicsToLayer = function (graphicsLayer, settingsForLayer) {
                    // add to default graphics layer
                    array.forEach(settingsForLayer.graphics, function (g) {
                        var graphic = new Graphic(g);
                        graphicsLayer.add(graphic);
                    }, this);
                };

                array.forEach(settings, function (settingsForLayer, i) {
                    if (settingsForLayer.id === "map_graphics") {
                        // already exists by default so add graphics
                        addGraphicsToLayer(this.map.graphics, settingsForLayer);
                    } else {
                        // add a new layer
                        graphicsLayer = new GraphicsLayer({
                            id: settingsForLayer.id
                        });

                        // add the graphics layer at the index - The bottom most layer has an index of 0.
                        //var idx = i - 1; // adjust to account for default map graphics at first index in settings
                        // adds the graphiclayers on top of other layers, since index not specified
                        this.map.addLayer(graphicsLayer);

                        addGraphicsToLayer(graphicsLayer, settingsForLayer);
                    }
                }, this);

                console.log("SaveSession :: setGraphicsOnCurrentMap :: graphics added to the map");
            },

            clearAllGraphicsOnMap: function () {
                // clear the default layer
                this.map.graphics.clear();

                // remove the other graphics layers 
                array.forEach(this.map.graphicsLayerIds, function (layerId) {
                    var layer = this.map.getLayer(layerId);
                    this.map.removeLayer(layer);
                }, this);
                console.log("SaveSession :: clearAllGraphicsOnMap :: graphics removed from the map");
            },

            /**
             * save the current sessions to local storage
             */
            storeSessions: function () {
                var stringToStore = JSON.stringify(this.sessions);
                localStorage.setItem(this.storageKey, stringToStore);
                console.log("SaveSession :: storeSessions :: completed");
            },

            /**
             * read the saved sessions from storage
             */
            loadSavedSessionsFromStorage: function () {
                var storedString = "",
                    storedSessions = null;

                storedString = localStorage.getItem("sessions");
                if (!storedString) {
                    console.log("SaveSession :: loadSavedSessionsFromStorage : no stored sessions to load");
                    return;
                }

                storedSessions = JSON.parse(storedString);
                console.log("SaveSession :: loadSavedSessionsFromStorage : sessions found ", storedSessions);

                // replace to current sessions
                this.sessions = storedSessions;
                console.log("SaveSession :: loadSavedSessionsFromStorage : end");
            },

            getLayerObjectsFromMap: function () {
                return LayerInfos.getInstance(this.map, this.map.itemInfo).then(function (layerInfosObject) {
                    var layerInfos = [],
                        defs = [];
                    /*
                    layerInfosObject.traversal(function (layerInfo) {
                        layerInfos.push(layerInfo);
                    });
                    */
                    layerInfos = layerInfosObject.getLayerInfoArray();

                    defs = array.map(layerInfos, function (layerInfo) {
                        return layerInfo.getLayerObject();
                    });
                    return all(defs).then(function (layerObjects) {
                        var resultArray = [];
                        array.forEach(layerObjects, function (layerObject, i) {
                            layerObject.id = layerObject.id || layerInfos[i].id;
                            resultArray.push(layerObject);
                        });
                        return {
                            layerInfosObject: layerInfosObject,
                            layerInfos: layerInfos,
                            layerObjects: resultArray
                        };
                    });
                });
            },

            /**
             * returns the last part of the declaredClass for the given layer object
             * @param   {esri.layers.Layer} layer the map layer object
             * @returns {String} the layer type
             */
            getLayerType: function (layer) {

                var layerTypeArray = [],
                    layerType = "";

                if (!layer) {
                    return "";
                }

                layerTypeArray = layer.declaredClass.split(".");
                layerType = layerTypeArray[layerTypeArray.length - 1];
                return layerType;
            }

        });
    });