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
        'dojo/dom-class',
        'esri/geometry/Extent',
        'esri/graphic',
        'esri/layers/GraphicsLayer',
        'esri/layers/FeatureLayer',
        'esri/layers/ImageParameters',
        'esri/renderers/ClassBreaksRenderer',
        'esri/symbols/SimpleFillSymbol',
        'esri/symbols/SimpleLineSymbol',        
        'esri/Color',
        'esri/renderers/SimpleRenderer',
        'esri/InfoTemplate',
        'esri/layers/ArcGISDynamicMapServiceLayer',
        'esri/layers/ArcGISTiledMapServiceLayer',
        'jimu/ConfigManager',
        'jimu/MapManager',
        'jimu/WidgetManager',
        'jimu/PanelManager',
        'jimu/dijit/Popup',
        'jimu/dijit/Message',
        'jimu/LayerInfos/LayerInfos',
        'jimu/utils',
        './SimpleTable',
        'dijit/form/TextBox',
        "dijit/form/Select",
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
        domClass,
        Extent,
        Graphic,
        GraphicsLayer,
        FeatureLayer,
        ImageParameters,
        ClassBreaksRenderer,
        SimpleFillSymbol,
        SimpleLineSymbol,
        Color,
        SimpleRenderer,
        InfoTemplate,
        ArcGISDynamicMapServiceLayer,
        ArcGISTiledMapServiceLayer,
        ConfigManager,
        MapManager,
        WidgetManager,
        PanelManager,
        Popup,
        Message,
        LayerInfos,
        jimuUtils,
        Table,
        TextBox) {
      var showLayerListWidget = function(){
            var widgetName = 'LayerList';
            var widgets = selfSimpleSearchFilter.appConfig.getConfigElementsByName(widgetName);
            var pm = PanelManager.getInstance();
            pm.showPanel(widgets[0]);       
      };
    var sleep = function(ms) {
        var unixtime_ms = new Date().getTime();
        while (new Date().getTime() < unixtime_ms + ms) {
        }
    } ;

	var setDemographicLayerInfo = function(sessionToLoad) {
		settings = sessionToLoad.demographicLayerInfo;
		demogLayerInfoArray = settings.split(">>>>");
		var index1 = 0;
		var index2 = 0;
		var timeOutNextInput = 500;
		singleDemogLayerInfo = demogLayerInfoArray[index1];
		function setDemographicInputLoop() {//  create a loop function
			setTimeout(function() {

					singleDemogLayerInfoArray = singleDemogLayerInfo.split(";");
					eachInput = singleDemogLayerInfoArray[index2];

					eachInputArray = eachInput.split("::");
					switch (eachInputArray[0]) {
						case "serviceNode":
							timeOutNextInput = 2000;
							selfDemographic.serviceNode.value = eachInputArray[1];
							selfDemographic._changeService();
							break;
						case "demogTypeNode":
							timeOutNextInput = 2000;
							selfDemographic.demogTypeNode.value = eachInputArray[1];
							selfDemographic._changeDemog();
							break;
						case "demogListNode":
							timeOutNextInput = 100;
							selfDemographic.demogListNode.value = eachInputArray[1];
							break;

						case "rendertype":
							timeOutNextInput = 500;
							selfDemographic.rendertype = eachInputArray[1];
							//selfDemographic._changeRendertype();
							var rtype = selfDemographic.rendertype;
							if (rtype == "polygon") {
								selfDemographic.polyNode.style.display = "block";
								selfDemographic.pointNode.style.display = "none";
								selfDemographic.colormarkertd.innerHTML = "Colors:";
								document.getElementById("RendeAsPolygon").checked = true;
							} else {
								selfDemographic.polyNode.style.display = "none";
								selfDemographic.pointNode.style.display = "block";
								selfDemographic.colormarkertd.innerHTML = "Marker:";
								document.getElementById("RendeAsPoint").checked = true;
							}
						case "classTypeNode":
							timeOutNextInput = 100;
							selfDemographic.classTypeNode.value = eachInputArray[1];
							break;
						case "classNumNode":
							timeOutNextInput = 100;
							selfDemographic.classNumNode.value = eachInputArray[1];
							//selfDemographic._changeCat();
							break;

						//for polygon only
						case "currentk":
							timeOutNextInput = 100;
							selfDemographic.currentk = eachInputArray[1];
							break;
						case "reverseStatus":
							timeOutNextInput = 100;
							selfDemographic.reverseStatus = eachInputArray[1];
							selfDemographic.drawPalette(selfDemographic.classNumNode.value, selfDemographic.currentk, selfDemographic.reverseStatus);
							break;
						//for point only
						case "colorpnt":
							timeOutNextInput = 100;
							selfDemographic.colorpnt.setColor(new Color(eachInputArray[1]));
							break;
						case "minsizeNode":
							timeOutNextInput = 100;
							selfDemographic.minsizeNode.value = eachInputArray[1];
							break;
						case "maxsizeNode":
							timeOutNextInput = 100;
							selfDemographic.maxsizeNode.value = eachInputArray[1];
							break;
						//for both polygon and point
						case "demogsliderNode":
							timeOutNextInput = 100;
							selfDemographic.demogsliderNode.set("value", eachInputArray[1]);
							break;
						case "bWidthNode":
							timeOutNextInput = 100;
							selfDemographic.bWidthNode.value = eachInputArray[1];
							break;
					}

					index2++;
					//  increment the counter
					if (index2 < singleDemogLayerInfoArray.length - 1) {//  if the counter < number of input for single layer, call the loop function
						setDemographicInputLoop();
					} else {
						document.getElementById("mapDemogLayer").click();
						index1 = index1 + 1;
						if (index1 < demogLayerInfoArray.length) {//  start for the next layer inputs	
							singleDemogLayerInfo = demogLayerInfoArray[index1];													
							index2 = 0;
							setDemographicInputLoop();
						}					
					}

			}, timeOutNextInput);


		}
		if (demogLayerInfoArray.length > 0) {
			if (demogLayerInfoArray[0] != "") {
				setDemographicInputLoop();
			}
			
		}
		
	}; 

        //To create a widget, you need to derive from BaseWidget.
        return declare([BaseWidget, _WidgetsInTemplateMixin], {
            // Custom widget code goes here

            baseClass: 'jimu-widget-savesession',

            // name of sessions string in local storage
            storageKey: "sessions",

            // the saved sessions
            sessions: [],
            sessionLoaded: null,

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
                

                simpleSearchFilterId = 'widgets_SimpleSearchFilter_Widget_37';
								
              	var widgets = this.appConfig.getConfigElementsByName("AddData");
		        var pm = PanelManager.getInstance();		
		        pm.showPanel(widgets[0]);
		        
		        panelID = "widgets_AddData_30_panel";
		        pm.closePanel(panelID);//close the panel
		        setTimeout(function () { 

			        //selfAddDataScopeOptions.optionClicked();

	
	   				document.getElementById(simpleSearchFilterId).click();
   				}, 1800)
 	
            },
            onReceiveData: function (name, widgetId, data, historyData) {
                if ((name == 'SimpleSearchFilter') ) {
                   this.setLayersVisibilityOpacity(sessionLoaded.layers);
                }
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
                //showLayerListWidget();
                var session = e.item;
                sessionLoaded = session;
                this.loadSession(session);
                console.log('SaveSession :: onLoadSessionClicked :: session  = ', session);
                
                ii = 0;
                function AddDataLoop () {           //  create a loop function
                   setTimeout(function () {    
						itemCardItem = session.onlineDataItems[ii];
						itemCardItem_split = itemCardItem.split(":::");	
						
						for (var key in window.onlineDataScopeDic) {
							if (itemCardItem_split[2] == window.onlineDataScopeDic[key]) {
								selfAddDataScopeOptions.scopePlaceholderText.innerHTML = key;
							}
						}						
						//set the active node for ScopeOptions in AddData widget
				        array.forEach(selfAddDataScopeOptions.btnGroup.children, function(node) {
		    				if (node.getAttribute("data-option-name") == itemCardItem_split[2]) {
		    					domClass.add(node, "active");
		    				} else {
		    					domClass.remove(node, "active");
		    				}				           
				        });				        		
				        selfAddDataScopeOptions.hideDropdown();								
						// end of setting active node for ScopeOptions
						
						//input the search box in AddData widget
						selfSearchInAddData.searchTextBox.value = itemCardItem_split[1];				
						
								
						setTimeout(function () {
							selfSearchInAddData.searchButton.click();
		                	//selfAddDataScopeOptions.search(); 
	                	}, 80)
	                	setTimeout(function () {
							//selfSearchInAddData.searchButton.click();
		                	selfAddDataScopeOptions.search(); 
	                	}, 200)
                        ii++;                                            //  increment the counter
                        if (ii < session.onlineDataItems.length) {            
                            AddDataLoop();             //  ..  again which will trigger another 
                        }  
                                           //  ..  setTimeout()
                   }, 1500)
                }
                
                AddDataLoop();		


                var layerListWidget = WidgetManager.getInstance().getWidgetById("widgets_LayerList_Widget_17");
                if (layerListWidget) {
                    layerListWidget._onRemoveLayersClick();
                }
                    //document.getElementById("butRemoveAllLayers").click();
                    
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
                
                /*this.saveToFileName.value = this.config.fileNameForAllSessions;
                this.saveToFileContent.value = sessionString;
                // trigger the post to server side
                this.saveToFileForm.submit();*/
                var text2 = new Blob([sessionString], { type: 'text/csv'});
                var down2 = document.createElement("a");
                down2.download = this.config.fileNameForAllSessions;//"simple.csv";
                down2.href = window.URL.createObjectURL(text2);
                down2.addEventListener("onclick", function(){ if (navigator.msSaveOrOpenBlob) {navigator.msSaveOrOpenBlob(text2,this.config.fileNameForAllSessions); return false;}});
                document.body.appendChild(down2);
                down2.innerText="download file";               

                console.log('SaveSession :: onSaveToFileButtonClicked :: end');
            },

            /**
             * save the single item to file
             * @param {Object} e the event args 
             */
            onSaveItemToFileClicked: function (e){
                var sessionString = "",
                    fileName = "",
                    sessions = [];

                fileName = string.substitute(this.config.fileNameTplForSession, e.item);

                sessions.push(e.item);
                sessionString = JSON.stringify(sessions);

                // update form values
                this.saveToFileName.value = fileName;
                this.saveToFileContent.value = sessionString;
                
                //Innovate Add - send data to url in hidden element and trigger click event
                domAttr.set(this.saveSingleSession, "href", "data:application/octet-stream," + sessionString);
                domAttr.set(this.saveSingleSession, "download", fileName);

                this.saveSingleSession.click();

                // trigger the post to server side
                //this.saveToFileForm.submit();

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

                this.setAddedURL(sessionToLoad.addedURL);
                this.initOnlineDataItems(sessionToLoad.onlineDataItems);
                this.initLayersFields(sessionToLoad.layers);                
                this.setSelectedCommunity(sessionToLoad);                
                this.initGeometryTypeAddedFeatLyr(sessionToLoad.layers);
                this.initLayersRenderer(sessionToLoad.layers);
                this.initVisibleLayersForDynamic(sessionToLoad.layers);
                this.initInfoTemplateForUploadedFile(sessionToLoad.layers);
                this.setGraphicsOnCurrentMap(sessionToLoad.graphics);

                
                if (sessionToLoad.toggleButtonTopics) {
                	this.setToggleButtonTopics(sessionToLoad.toggleButtonTopics);
                }

                if (sessionToLoad.chkLayerInSearchFilter) {
                	this.setChkLayerInSearchFilter(sessionToLoad);
                }

                if (sessionToLoad.chkLayerInBoundary) {
                	this.setChkLayerInBoundary(sessionToLoad.chkLayerInBoundary);
                }
                console.log('SaveSession :: loadSession :: session  = ', sessionToLoad);
            },

            setAddedURL:function (settings) {

    	        urlArray = settings.split(";");
            	for (index = 0, len = urlArray.length; index < len; ++index) {
            		singleURLArray = urlArray[index].split(",");
            		urlTypeSelection = document.getElementById("urlTypeSelect");
            		if (urlTypeSelection != null) {
            			 dijit.byId("urlTypeSelect").set("value", singleURLArray[1]);
            		}            		
            		addURLText = document.getElementById("urlTextInput");
            		if (addURLText != null) {
	            		addURLText.value = singleURLArray[0];
            		}
            		
        	        addURLbutton = document.getElementById("addURLButton");
            		if (addURLbutton != null) {
			        	addURLbutton.click();
            		}
                 }            	
            },
            /**
             * apply settings to layers
             * @param {Array} array of layer settings to apply to map
             */
            setLayersVisibilityOpacity: function (settings) {

                array.forEach(settings, function (layerSettings) {
                    
                    var eaId = "";
                    if (layerSettings.id.indexOf(window.layerIdPrefix) >= 0) {
                   		eaId = layerSettings.id.replace(window.layerIdPrefix, "");                     	
                    } 
                                        
                    layer = this.map.getLayer(layerSettings.id);
                    if (layer != null) {
                        if (window.hashRenderer[eaId] != null) {
                        	var rendererJson = window.hashRenderer[eaId];
                        	var renderer = new ClassBreaksRenderer(rendererJson);
		                	layer.setRenderer(renderer);
                        }
                        layer.setVisibility(layerSettings.isVisible);
                        layer.setOpacity(layerSettings.opacity);
                        if (layerSettings.type == "ArcGISDynamicMapServiceLayer") {
                        	  visible = [];
							  for (var i=0, il=layerSettings.visibleLayers.length; i< il; i++) {
							      visible.push(layerSettings.visibleLayers[i]);

							  }
							  layer.setVisibleLayers(visible);
                        }
                        
                        layer.refresh();  
                        console.log('SaveSession :: loadSession :: set visibility = ', layerSettings.isVisible, ' for layer : id=', layer.id);

                       
                       layerTile = this.map.getLayer(window.layerIdTiledPrefix + eaId);
                       if (layerTile != null) {
                       		if (window.hashRenderer[eaId] == null) {
	                        	layerTile.setVisibility(layerSettings.isVisible);
	                       	}
	                        layerTile.setOpacity(layerSettings.opacity);
	                        layerTile.refresh();                         	
                       }
                    }
                }, this);
                // fire refresh event 
                LayerInfos.getInstance(this.map, this.map.itemInfo).then(function (layerInfosObject) { // fire change event to trigger update
                    on.emit(layerInfosObject, "updated");
                    layerInfosObject.onlayerInfosChanged();
                });
            },
            initOnlineDataItems: function (settings) {
				window.onlineDataTobeAdded = settings;
            },            
            initLayersFields: function (settings) {
                array.forEach(settings, function (layerSettings) {
  					window.hashFieldsAddedFeatureLayer[layerSettings.id] = layerSettings.fields;

                }, this);
            },
            initGeometryTypeAddedFeatLyr: function (settings) {
                array.forEach(settings, function (layerSettings) {
  					window.hashGeometryTypeAddedFeatLyr[layerSettings.id] = layerSettings.geometryType;
                }, this);
            },
            initLayersRenderer: function (settings) {
                array.forEach(settings, function (layerSettings) {
  					window.hashRenderer[layerSettings.id.replace(window.layerIdPrefix, "")] = layerSettings.renderer;

                }, this);
            },
            initVisibleLayersForDynamic: function (settings) {
                array.forEach(settings, function (layerSettings) {
  					window.hashVisibleLayersForDynamic[layerSettings.id.replace(window.layerIdPrefix, "")] = layerSettings.visibleLayers;

                }, this);
            },
            initInfoTemplateForUploadedFile: function (settings) {
                array.forEach(settings, function (layerSettings) {
  					window.hashInfoTemplate[layerSettings.id] = layerSettings.infoTemplateJson;

                }, this);
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
                    selectedCommunity: null,
                    toggleButtonTopics: [],
                    chkLayerInSearchFilter: [], 
                    toggleButtonPBSTopics: [],
                    chkLayerInBoundary: [],                   
                    graphics: [],
                    demographicLayerInfo: null,
                    addedURL: null,            
                    onlineDataItems:window.onlineDataAlreadyAdded,       
                };

                settings.extent = this.map.extent;
                settings.webmapId = this.map.itemId;
				settings.selectedCommunity = this.getSelectedCommunity();
                settings.graphics = this.getGraphicsForCurrentMap();//This will save the graphics for uploaded featurelayer only
                settings.toggleButtonTopics = this.getToggleButtonTopics();
                settings.chkLayerInSearchFilter = this.getChkLayerInSearchFilter();
                settings.demographicLayerInfo = this.getDemographicLayerInfo();
                settings.addedURL = this.getAddedURL();

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
                    opacity:layer.opacity,
                    visibleLayers: layer.visibleLayers || null,
                    url: layer.url,
                    fields: null,
                    geometryType: null,
                    options: null,
                    renderer: null,
                    infoTemplateJson: []
                };

                layerSettings.type = this.getLayerType(layer);
                layerSettings.renderer = window.hashRenderer[layer.id.replace(window.layerIdPrefix, "")];
                layerSettings.fields = this.getFieldssForFeatureLayer(layer);
                layerSettings.geometryType = this.getGeometryTypeForFeatureLayer(layer);
                layerSettings.infoTemplateJson = this.getinfoTemplateForUploadedFile(layer);
                
                console.log('SaveSession :: getSettingsForCurrentMap :: settings ', layerSettings, ' added for layer = ', layer.id);
                return layerSettings;
            },

            getFieldssForFeatureLayer: function (layer) {
            	var fields = hashFieldsAddedFeatureLayer[layer.id];
                console.log('SaveSession :: getFieldssForFeatureLayer :: fields =  ', fields, ' for layer = ', layer.id);
                return fields;
            },

            getGeometryTypeForFeatureLayer: function (layer) {
            	var geometryType = hashGeometryTypeAddedFeatLyr[layer.id];
                console.log('SaveSession :: getGeometryTypeForFeatureLayer :: geometryType =  ', geometryType, ' for layer = ', layer.id);
                return geometryType;
            },    
            getinfoTemplateForUploadedFile: function (layer) {
            	var infoTemplateJson = hashInfoTemplate[layer.id];
                console.log('SaveSession :: getinfoTemplateForUploadedFile :: infoTemplateJson =  ', infoTemplateJson, ' for layer = ', layer.id);
                return infoTemplateJson;
            },
            /**
             * return all the settings for the Community user selected
             */
            getSelectedCommunity: function () {
                var settings = null;
                settings = window.communitySelected;
                console.log('SaveSession :: getSelectedCommunity :: ' + settings);
                return settings;
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
             * return all the settings for the toggle buttons of topics
             */
            getToggleButtonTopics: function () {
				var settings = [];
		        for (i in window.allLayerNumber) {
		            lyr = this.map.getLayer(window.layerIdPrefix + window.allLayerNumber[i]);
		            if (lyr) {
		                topicWholeName = window.hashTopic[window.allLayerNumber[i]];
		                
		                topicShortName = window.topicDicESB[topicWholeName];
                		if (settings.indexOf(topicShortName) < 0) {
                			settings.push(topicShortName);
                		} 
                		
		                topicShortName = window.topicDicPBS[topicWholeName];
                		if (settings.indexOf(topicShortName) < 0) {
                			settings.push(topicShortName);
                		} 
                		
		                topicShortName = window.topicDicPSI[topicWholeName];
                		if (settings.indexOf(topicShortName) < 0) {
                			settings.push(topicShortName);
                		} 
                		
		                topicShortName = window.topicDicBNF[topicWholeName];
                		if (settings.indexOf(topicShortName) < 0) {
                			settings.push(topicShortName);
                		}                 		                		                		
		            }
		        }
		        return settings;
            },
            getChkLayerInSearchFilter: function () {
				var settings = [];
		        for (i in window.allLayerNumber) {
		            lyr = this.map.getLayer(window.layerIdPrefix + window.allLayerNumber[i]);
		            if (lyr) {
						chkBoxIndex = window.allLayerNumber[i];
                		if (settings.indexOf(chkBoxIndex) < 0) {
                			settings.push(chkBoxIndex);
                		} 
		            }
		        }
		        return settings;
            },
            getDemographicLayerInfo: function () {
            	var addedDemographic = "";
            	for (var key1 in window.demographicLayerSetting) {
				  if (window.demographicLayerSetting[key1] != null) {
				  	singleDemogInfo = window.demographicLayerSetting[key1];
				  	for (var key2 in singleDemogInfo) {
				  		addedDemographic = addedDemographic + key2 + "::" + singleDemogInfo[key2] + ";";
				  	}
				  	addedDemographic = addedDemographic + ">>>>";
				  	
				  	//addedURL = addedURL + key + "," + window.hashAddedURLToType[key] + ";";
				  }
				}
				addedDemographic = addedDemographic.substring(0, addedDemographic.length - 3);			
            	return addedDemographic;

            },
            getAddedURL: function () {
            	var addedURL = "";
            	for (var key in window.hashAddedURLToType) {
				  if (window.hashAddedURLToType.hasOwnProperty(key)) {
				  	addedURL = addedURL + key + "," + window.hashAddedURLToType[key] + ";";
				  }
				}
				addedURL = addedURL.substring(0, addedURL.length - 1);			
            	return addedURL;
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
                //symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                //    new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                //        new Color([0, 112, 0]), 1), new Color([0, 0, 136, 0.25]));
                
                // set the graphics from the layer
                if (graphicLayer.id.indexOf(window.uploadedFeatLayerIdPrefix)>-1){
	                array.forEach(graphicLayer.graphics, function (g) {
	                	//g.setSymbol(symbol);	
	                    settings.graphics.push(g.toJson());
	                }, this);
				}
                console.log('SaveSession :: getSettingsFromGraphicsLayer :: settings ', settings, ' added for graphicLayer = ', graphicLayer);
                return settings;
            },
            
            /*Load settings part*/
            setSelectedCommunity: function (settings) {
				window.communitySelected = settings.selectedCommunity;
			        this.publishData({
			        message: "updateCommunityLayers"
			    });
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
                    if(settingsForLayer.id.indexOf(window.uploadedFeatLayerIdPrefix)>-1){  	
                    	//create the layer
                    	createdFields = [];
                    	fieldsArray = window.hashFieldsAddedFeatureLayer[settingsForLayer.id].split(";");
                    	for (index = 0, len = fieldsArray.length; index < len; ++index) {
                    		var newField = {};
                    		singleFieldArray = fieldsArray[index].split(":");
                    		if ((singleFieldArray[0].toUpperCase() == "FID")) {
                    			
	                     		newField["name"] = singleFieldArray[0];
	                    		newField["alias"] = singleFieldArray[0];
	                    		newField["type"] = "esriFieldTypeOID";
	                    		createdFields.push(newField);                   			
                    		} else if (singleFieldArray[0].toUpperCase().indexOf("OBJECTID")) {
                    			
	                     		newField["name"] = singleFieldArray[0];
	                    		newField["alias"] = singleFieldArray[0];
	                    		newField["type"] = "esriFieldTypeOID";
	                    		createdFields.push(newField);                   			
                    		} else {
                    			
	                     		newField["name"] = singleFieldArray[0];
	                    		newField["alias"] = singleFieldArray[0];
	                    		newField["type"] = singleFieldArray[1];
	                    		createdFields.push(newField);                   			
                    		}                   		
                    	}
						
						//-----------------------------
			         	var jsonFS = {
				          "geometryType": hashGeometryTypeAddedFeatLyr[settingsForLayer.id],
				          "spatialReference": {
				              "wkid": this.map.spatialReference.wkid //102100 //WGS_1984_Web_Mercator_Auxiliary_Sphere
				          },
				          "fields": createdFields,
				          "features": []
				        };
				        console.log(jsonFS.features);
				        var fs = new esri.tasks.FeatureSet(jsonFS);
				        var featureCollection = {
				          layerDefinition: {
				            "geometryType": hashGeometryTypeAddedFeatLyr[settingsForLayer.id],
				            "fields": createdFields,
				          },

				          featureSet: fs
				        };
				        
				        //set drawingInfo.renderer for uploaded CSV file whose GeometryType is esriGeometryPoint and fields includes "__OBJECTID"		        
				        if ((hashGeometryTypeAddedFeatLyr[settingsForLayer.id] == "esriGeometryPoint")) {
				        	featureCollection.layerDefinition.drawingInfo ={
		                        "renderer": {
		                            "type": "simple",
		                            "symbol": {
		                                "type": "esriPMS",
		                                "url": "http://static.arcgis.com/images/Symbols/Basic/RedSphere.png",
		                                "imageData": "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",
		                                "contentType": "image/png",
		                                "width": 15,
		                                "height": 15
		                            }
		                        }
		                   };
				        } 		
 			
						
						if (window.hashInfoTemplate[settingsForLayer.id] == null) {
					        var jsonfl = new esri.layers.FeatureLayer(featureCollection, {
					          mode: esri.layers.FeatureLayer.MODE_SNAPSHOT,
					          'id': settingsForLayer.id,
					          'title': settingsForLayer.id.replace(window.uploadedFeatLayerIdPrefix, "")
					        });
				        } else {
				        	var infoTemplate = new InfoTemplate(window.hashInfoTemplate[settingsForLayer.id]);
					        var jsonfl = new esri.layers.FeatureLayer(featureCollection, {
					          mode: esri.layers.FeatureLayer.MODE_SNAPSHOT,
					          'id': settingsForLayer.id,
					          'title': settingsForLayer.id.replace(window.uploadedFeatLayerIdPrefix, ""),
					          infoTemplate: infoTemplate,					          
					        });				        	
				        }
				        
				        /*if (window.hashRenderer[settingsForLayer.id] != null) {
				        	alert("render in not null:" + window.hashRenderer[settingsForLayer.id]);
                        	var rendererJson = window.hashRenderer[settingsForLayer.id];
		                	jsonfl.setRenderer(new SimpleRenderer(rendererJson));				        	
				        }*/
				        if ((hashGeometryTypeAddedFeatLyr[settingsForLayer.id] == "esriGeometryPolygon")) {
				        	symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
	                            new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
	                            new Color([0, 0, 0]), 1), new Color([76, 129, 205, 0.75]));
                            jsonfl.setRenderer(new SimpleRenderer(symbol));

				        } else if ((hashGeometryTypeAddedFeatLyr[settingsForLayer.id] == "esriGeometryPolyline")) {
				        	symbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([165, 83, 183]), 1);
                            jsonfl.setRenderer(new SimpleRenderer(symbol));

				        }
				        addGraphicsToLayer(jsonfl, settingsForLayer);
				        this.map.addLayer(jsonfl);
	            	}
                    
                }, this);

                console.log("SaveSession :: setGraphicsOnCurrentMap :: graphics added to the map");
            },

            setToggleButtonTopics: function (settings) {
            	for (index = 0, len = settings.length; index < len; ++index) {
            		var checkbox = document.getElementById(window.chkTopicPrefix + settings[index]);
            		if (checkbox!=null)	{
                        if(checkbox.checked == true){
                            checkbox.click();                       
                        }
                        checkbox.click();     		    
            		}		

	            }
            },
            setChkLayerInSearchFilter: function (sessionToLoad) {
            	settings =  sessionToLoad.chkLayerInSearchFilter;
            	layersInfo = sessionToLoad.layers; 
 
                var i = 0;                     //  set your counter to 1
                
                function myLoop () {           //  create a loop function
                   setTimeout(function () {    //  call a 3s setTimeout when the loop is called
                        bIsDynamicLayer = false;
                        layerType = "";
                        array.forEach(layersInfo, function (layerSettings) {
                            if (layerSettings.id.indexOf(window.layerIdPrefix) >= 0) {
                                eaId = layerSettings.id.replace(window.layerIdPrefix, "");
                                if (eaId == settings[i]) {
                                    layerType = layerSettings.type;
                                }                                                   
                            }                   
                        })
                        //alert(window.chkSelectableLayer + settings[index]);
                        chkbox = document.getElementById(window.chkSelectableLayer + settings[i]);
                        
                        if (chkbox != null) {
                            console.log("check on chkbox:"+window.chkSelectableLayer + settings[i]);
                            jimuUtils.checkOnCheckbox(chkbox);
                        }
                        i++; 
                                           //  increment the counter
                        if (i < settings.length) {            //  if the counter < 10, call the loop function
                            myLoop();             //  ..  again which will trigger another 
                        }  
                        else {
                        	var checkboxClearAll = document.getElementById("chkClearAll");
                        	if (checkboxClearAll!=null) {
                        		 checkboxClearAll.click();
                			}          
							

			
			   				document.getElementById("widgets_DemographicLayers").click();      
			   				setTimeout(function () {  	
			   					setDemographicLayerInfo(sessionToLoad);
			   				 }, 500)
                        }
                                           //  ..  setTimeout()
                   }, 3000)
                }
                
                myLoop();
            	/*for (index = 0, len = settings.length; index < len; ++index) {
            		bIsDynamicLayer = false;
            		layerType = "";
	            	array.forEach(layersInfo, function (layerSettings) {
	                    if (layerSettings.id.indexOf(window.layerIdPrefix) >= 0) {
	                   		eaId = layerSettings.id.replace(window.layerIdPrefix, "");
	                   		if (eaId == settings[index]) {
	                   			layerType = layerSettings.type;
	                  		}                     		                    	
	                    }             		
	            	})
            		chkbox = document.getElementById(window.chkSelectableLayer + settings[index]);
            		
            		if (chkbox != null) {
					    jimuUtils.checkOnCheckbox(chkbox);
            		}
            	}*/
            },
            setToggleButtonPBSTopics: function (settings) {
            	for (index = 0, len = settings.length; index < len; ++index) {
            		var checkbox = document.getElementById(window.chkTopicPBSPrefix + settings[index]);			
			        if(checkbox.checked == true){
			        	checkbox.click();
			        	
	            	}
					checkbox.click();
	            }
            },            
            setChkLayerInBoundary: function (settings) {
            	for (index = 0, len = settings.length; index < len; ++index) {
            		chkbox = document.getElementById(window.chkSelectableLayer + settings[index]);
            		if (chkbox != null) {
					    jimuUtils.checkOnCheckbox(chkbox);            			
            		}
            	}
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