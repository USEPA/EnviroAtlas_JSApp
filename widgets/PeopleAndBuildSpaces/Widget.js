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
        'dijit/_WidgetsInTemplateMixin',
        "dojo/Deferred",
        'dojo/_base/array',
        'jimu/BaseWidget',
        'dijit/Dialog',
        'jimu/WidgetManager',
        'jimu/PanelManager',
        'jimu/utils',
        'esri/layers/FeatureLayer',
        'esri/dijit/PopupTemplate',
        'esri/geometry/Extent',
        'dijit/layout/ContentPane',
        'dijit/TooltipDialog',
        'esri/InfoTemplate',
        'esri/layers/ArcGISDynamicMapServiceLayer',
        'esri/layers/ArcGISTiledMapServiceLayer',
        'esri/renderers/ClassBreaksRenderer',
    ],
    function (
        declare,
        _WidgetsInTemplateMixin,
        Deferred,
        array,
        BaseWidget,
        Dialog,
        WidgetManager,
        PanelManager,
        jimuUtils,
        FeatureLayer,
        PopupTemplate,
        Extent,
        ContentPane,
        TooltipDialog,
        InfoTemplate,
        ArcGISDynamicMapServiceLayer,
        ArcGISTiledMapServiceLayer,
        ClassBreaksRenderer) {
    //To do: set these community boundary layer properties from the config file.
    var communityBoundaryLayer = "https://leb.epa.gov/arcgis/rest/services/Communities/Community_Locations/MapServer";
    var communityBoundaryLayerID = "901"
        var chkIdPBSDictionary = {};
    var arrLayers = null;
    var map = null;
    var hiderows = {};
    var hashFactsheetLinkPBS = {};
    var hashLayerNameLinkPBS = {};
    var hashDescriptionforPBS = {};
    var loadSymbologyPBSConfig = function(callback) {
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

    var updateSelectablePBSLayersArea = function () {

        if (navigator.userAgent.indexOf("Chrome") >= 0) {
            document.getElementById('tablePBSLayersArea').style.height = "calc(100% - 140px)";
        } else if (navigator.userAgent.indexOf("Firefox") >= 0) {
            document.getElementById('tablePBSLayersArea').style.height = "calc(100% - 140px)";
        } else {
            document.getElementById('tablePBSLayersArea').style.height = "calc(100% - 140px)";
        }
    };
    var getTextContent = function (graphic) {
        var commName = graphic.attributes.CommST;
        currentCommunity = commName;
        return "<b>" + window.communityDic[commName] + "</b><br /><button id = 'testButton' dojoType='dijit.form.Button' onclick='selfPBS.selectCurrentCommunity() '>Select this community</button>";
    };

    //Function also used in PeopleBuiltSpaces/widget.js, ensure that edits are synchronized
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
            selfPBS.map.addLayer(communityLocationLayer);
        }
    }

	var showDisplayLayerAddFailureWidget = function(layerName) {

		var widgetName = 'DisplayLayerAddFailure';
		var widgets = selfPBS.appConfig.getConfigElementsByName(widgetName);
		var pm = PanelManager.getInstance();
		pm.showPanel(widgets[0]);
		selfPBS.publishData({
			message : layerName
		});
	};
    
    var showLayerListWidget = function () {
        var widgetName = 'LayerList';
        var widgets = selfPBS.appConfig.getConfigElementsByName(widgetName);
        var pm = PanelManager.getInstance();
        pm.showPanel(widgets[0]);
    }
    var _onSelectAllLayers = function () {
        for (var key in chkIdDemographicsDictionary) {
            if ((chkIdDemographicsDictionary.hasOwnProperty(key)) && (document.getElementById(key) != null)) {
                document.getElementById(key).checked = true;
            }
        }
    };

    var add_bc_icons = function(layerArea, scale, type) {

        indexImage = 0;

        var BC_Div = dojo.create('div', {
            'style': 'overflow:hidden; padding-left: 16px; position: relative; top: -2px'
        }, layerArea);

        scale_img = document.createElement('div');
        scale_img.className = 'icon_style';
        //scale_img.style.marginLeft = '20px';

        if (scale == "NATIONAL") {
                scale_img.title = "National Dataset";
            } else {
                scale_img.title = "Community Dataset";
            }
        scale_img.className += " " + scale;
        BC_Div.appendChild(scale_img);

        datatype_img = document.createElement('div');
        datatype_img.style.width = '20px';
        datatype_img.style.height = '20px';
        datatype_img.style.float = 'left';
        //datatype_img.style.marginLeft = '20px';

        if (type == 'huc12') {
            datatype_img.title = "Data summarized by 12 digit HUCs";
        } else if (type == 'cbg') {
            datatype_img.title = "Data summarized by census block groups";
        } else if (type == 'ctr') {
            datatype_img.title = "Data summarized by census tract";
        } else if (type == 'grid') {
            datatype_img.title = "Non-summarized raster data";
        } else if (type == 'plp') {
            datatype_img.title = "Point, line, or polygon data"
        }

        datatype_img.setAttribute("class", type);
        BC_Div.appendChild(datatype_img);



    }

    var updateSelectablePBSlayers = function () {
        var SelectedTopics = [];
        var tableOfRelationship = document.getElementById("tablePBSLayersArea");

        dojo.destroy('tablePBSArea');
        var layerArea = dojo.create('div', {
            'id': 'tablePBSArea',
            'style': 'width: 100%'
        }, tableOfRelationship);

        var numOfSelectablePBSLayers = 0;
        var totalNumOfPBSLayers = 0;

        for (index = 0, len = arrLayers.length; index < len; ++index) {
            layer = arrLayers[index];
            var indexCheckbox = 0;
            if (layer.hasOwnProperty('eaTopic')) {
                if (layer.hasOwnProperty('eaID')) {
                    eaID = layer.eaID.toString();
                    eaTopic = layer.eaTopic;
                    window.hashTopicPBS[eaID]  = eaTopic;
                    if (eaID.trim() != "") {

                        var chkboxTopicId = window.chkTopicPBSPrefix + window.topicDicPBS[layer.eaTopic];
                        var checkboxTopic = document.getElementById(chkboxTopicId);
                        totalNumOfPBSLayers = totalNumOfPBSLayers + 1;
                        if ((checkboxTopic != null) && (checkboxTopic.checked == true)) {
                            var bLayerSelected = false;
                            if ((window.allLayerNumber.indexOf(eaID)) == -1) {                          
                                window.allLayerNumber.push(eaID);
                            }
                            else {
                                lyr = selfPBS.map.getLayer(window.layerIdPBSPrefix + eaID);
                                if(lyr){
                                    bLayerSelected = true;
                                }                       
                            }

                            numOfSelectablePBSLayers = numOfSelectablePBSLayers + 1;

                            //Add Header for each Topic in list
                            if (SelectedTopics.indexOf(eaTopic) == -1) {
                                if (!(eaTopic in hiderows)) {
                                    hiderows[eaTopic] = true;
                                }
                                
                                SelectedTopics.push(eaTopic);

                                var topicHeader = dojo.create('div', {
                                    'id': eaTopic,
                                    'class': 'topicHeader',
                                    'innerHTML': eaTopic,
                                    onclick: function(){
                                        hiderows[this.id] = !hiderows[this.id];
                                        updateSelectablePBSlayers();
                                    }
                                }, layerArea);
                            }
                            //End Header for each Topic

                            var mainDiv = dojo.create('div', {
                                'class': 'layerDiv'
                                }, layerArea);

                            if (!hiderows[eaTopic]) {
                                mainDiv.style.display = 'None';
                            }

                            var topicRow = dojo.create('div', {
                                "style" : "display:inline-block; width:100%"
                                //"style": ""
                            }, mainDiv);

                            var Checkbox_div = dojo.create('div', {
                                'class': 'checkbox_cell'
                                
                            }, topicRow);

                            var buttonInfoId = "but" + eaID;
                            chkboxId = window.chkSelectableLayer + eaID;
                            chkIdPBSDictionary[chkboxId] = layer;
                            hashFactsheetLinkPBS[buttonInfoId] = "N/A";
                            hashLayerNameLinkPBS[buttonInfoId] = layer.name;
                            hashDescriptionforPBS[buttonInfoId] = layer.eaDescription;
                            if (layer.hasOwnProperty('eaDfsLink')) {
                                hashFactsheetLinkPBS[buttonInfoId] = layer.eaDfsLink;
                            }

                            var checkbox = dojo.create('input', {
                                "type": "checkbox",
                                "name": chkboxId,
                                "value": 1,
                                "id": chkboxId,
                                "checked": bLayerSelected,
                                "style": "margin-top: 1px"
                            }, Checkbox_div);


                            var iButton = dojo.create('input', {
                                "type": "button",
                                "name": buttonInfoId,
                                "id": buttonInfoId,
                                "checked": bLayerSelected,
                                "class": "i-button",
                                "style": "float: right",
                                onclick: function(e) {

                                    var infobox = new Dialog({
                                        title: hashLayerNameLinkPBS[this.id],
                                        style: 'width: 300px'
                                    });

                                    var infoDiv = dojo.create('div', {
                                        'innerHTML': hashDescriptionforPBS[this.id] + '<br><br>'
                                    }, infobox.containerNode);

                                    var linkDiv = dojo.create('div', {
                                        }, infobox.containerNode)
                                    if (hashFactsheetLinkPBS[this.id] != "N/A") {
                                        var factsheetDiv = dojo.create('a', {
                                            'innerHTML': 'Fact Sheet',
                                            'href': window.dataFactSheet + hashFactsheetLinkPBS[this.id],
                                            'target': '_blank',
                                            'class': 'factsheetLink' 
                                        }, linkDiv);
                                    }
                                    infobox.show()
                                }
                                
                            }, topicRow);

                            
                            var topicName = dojo.create('div', {
                                "innerHTML": layer.name,
                                "style" : "font-weight: 500; display: table-cell; font-size:13px",
                                "title" : layer.eaDescription
                            }, topicRow);

                            //}; //end of inserting datafactsheet icon
                            if (!(document.getElementById("hideIconsPBS").checked)) {
                                add_bc_icons(mainDiv, layer.eaScale, layer.sourceType);
                            } 
                            
                        }
                    } // end of if (eaID.trim() != "")
                } // end of if(layer.hasOwnProperty('eaID'))
            } // end of if (layer.hasOwnProperty('eaTopic')...

        } // end of for (index = 0, len = arrLayers.length; index < len; ++index)
        for (var key in chkIdPBSDictionary) {

            if ((chkIdPBSDictionary.hasOwnProperty(key)) && (document.getElementById(key) != null)) {
                document.getElementById(key).addEventListener('change', function () {

                    if (this.checked) {

                        var layer = chkIdPBSDictionary[this.getAttribute("id")];

                        var _popupTemplate;
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
                            if (layer.name) {
                                lLayer._titleForLegend = layer.name;
                                lLayer.title = layer.name;
                                lLayer.noservicename = true;
                            }

                            var popupConfig = jimuUtils.getPopups(layer);
                            lLayer.setInfoTemplates(popupConfig);

                            if (layer.disableclientcaching) {
                                lLayer.setDisableClientCaching(true);
                            }

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
								var removeLayers = [];
								for (var i = 0; i < lOptions.hidelayers.length; i++) {
									lOptions.hidelayers[i] = parseInt(lOptions.hidelayers[i])
								}
								var showLayers = [];
								array.forEach(evt.layer.layerInfos, function(ilayer) {
									showLayers.push(ilayer.id)
								})
								array.forEach(lOptions.hidelayers, function(id) {
									showLayers.splice(showLayers.indexOf(id), 1)
								})
								lOptions.hidelayers = showLayers;
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
								array.forEach(evt.layer.layerInfos, function(ilayer) {
									ilayer.defaultVisibility = false;
								})
								for (var i = 0; i < lOptions.hidelayers.length; i++) {
									getArrayItemById(evt.layer.layerInfos, lOptions.hidelayers[i]).defaultVisibility = true;
								}
								array.forEach(evt.layer.layerInfos, function(ilayer) {
									if (ilayer.subLayerIds) {
										if (removeLayers.indexOf(ilayer.id) == -1) {
											removeLayers.push(ilayer.id)
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
                            lLayer.id = window.layerIdPBSPrefix + layer.eaID.toString();
                            map.setInfoWindowOnClick(true);

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
                            if (layer.hasOwnProperty('opacity')) {
                                lOptions.opacity = layer.opacity; // 1.0 has no transparency; 0.0 is 100% transparent
                            }
                            var lLayer;

                            if (layer.hasOwnProperty('eaLyrNum')) {
                                lLayer = new FeatureLayer(layer.url + "/" + layer.eaLyrNum.toString(), lOptions);
                                window.hashURL[layer.eaID] = layer.url + "/" + layer.eaLyrNum.toString();
                            } else {
                                lLayer = new FeatureLayer(layer.url, lOptions);
                            }

                            if (layer.name) {
                                lLayer._titleForLegend = layer.name;
                                lLayer.title = layer.name;
                                lLayer.noservicename = true;
                            }

                            lLayer.id = window.layerIdPBSPrefix + this.getAttribute("id").replace(window.chkSelectableLayer, "");
                            lLayer.setVisibility(false); //turn off the layer when first added to map and let user to turn on
							if (layer.hasOwnProperty('eaScale')) {
									if (layer.eaScale == "COMMUNITY") {
										window.communityLayerNumber.push(layer.eaID.toString());

									} else {//National
										window.nationalLayerNumber.push(layer.eaID.toString());
									}
							}
                            if (layer.tileLink == "yes") {
                                var tileLinkAdjusted = "";
                                if (layer.tileURL.slice(-1) == "/") {
                                    tileLinkAdjusted = layer.tileURL;
                                } else {
                                    tileLinkAdjusted = layer.tileURL + "/";
                                }
                                window.hashIDtoTileURL[layer.eaID.toString()] = tileLinkAdjusted;
                                window.hashIDtoCacheLevelNat[layer.eaID.toString()] = layer.cacheLevelNat;
                                switch(layer.cacheLevelNat) {
                                	case 12:
                                		//jimuUtils.initTileLayer12(tileLinkAdjusted, window.layerIdTiledPrefix + layer.eaID.toString()); //initTileLayer12 is for level 12 and temporarily commented out
                                		//map.addLayer(new myTiledMapServiceLayer12());
                                		jimuUtils.initTileLayer(tileLinkAdjusted, window.layerIdTiledPrefix + layer.eaID.toString());  //initTileLayer is for level 8, but in short term used here	
                                		map.addLayer(new myTiledMapServiceLayer());
                                		break;
    								default:
                                		jimuUtils.initTileLayer(tileLinkAdjusted, window.layerIdTiledPrefix + layer.eaID.toString()); 
                                		map.addLayer(new myTiledMapServiceLayer());    								
                                }
                                lyrTiled = map.getLayer(window.layerIdTiledPrefix + layer.eaID.toString()); 
                                if (lyrTiled) {
                                    lyrTiled.setOpacity(layer.opacity);
                                }
                            }  else if (layer.eaScale == "COMMUNITY") {
								loadSymbologyPBSConfig(function(response) {
									var classBreakInfo = JSON.parse(response);
									var renderer = new ClassBreaksRenderer(classBreakInfo);
									lLayer.setRenderer(renderer);
								});
                            }                            

                        } else if (layer.type.toUpperCase() === 'TILED') {
                            if (layer.displayLevels) {
                                lOptions.displayLevels = layer.displayLevels;
                            }
                            if (layer.hasOwnProperty('autorefresh')) {
                                lOptions.refreshInterval = layer.autorefresh;
                            }
                            lLayer = new ArcGISTiledMapServiceLayer(layer.url, lOptions);
                            if (layer.name) {
                                lLayer._titleForLegend = layer.name;
                                lLayer.title = layer.name;
                                lLayer.noservicename = true;
                            }

                            var popupConfig = jimuUtils.getPopups(layer);
                            lLayer.setInfoTemplates(popupConfig);
                        }
                        dojo.connect(lLayer, "onError", function (error) {
                            if ((!(lLayer.title in window.faildedEALayerDictionary)) && (!(lLayer.title in window.successLayerDictionary))) {
                                window.faildedEALayerDictionary[lLayer.title] = lLayer.title;
                                showDisplayLayerAddFailureWidget(lLayer.title);
                            }
                        });

                        dojo.connect(lLayer, "onLoad", function (error) {
                        	var id = lLayer.id.replace(window.layerIdPBSPrefix, "");
                        	if (id in window.hashIDtoCacheLevelNat) {
                                if (window.hashIDtoCacheLevelNat[id] == 12) {
                            		//lLayer.minScale = 72223.819286;	//72223.819286 is for level 12 and temporarily commented out
                            		lLayer.minScale = 1155581.108577;	//1155581.108577 is for level 8, but in short term used here				
                                }                        	
                       	 	}
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
                        lLayer.on('load', function (evt) {
                            evt.layer.name = lOptions.id;
                        });

                        lLayer.id = window.layerIdPBSPrefix + layer.eaID.toString();                    
                        
                        map.addLayer(lLayer);
                        if (layer.hasOwnProperty('eaScale')) {
                            lLayer.eaScale = layer.eaScale;
                            if (layer.eaScale == "COMMUNITY") {
                                lLayer.setVisibility(false); //turn off the layer when first added to map and let user to turn on
                                addCommunityBoundaries();
                            } else { //National
                                lLayer.setVisibility(false);
                                window.nationalLayerNumber.push(layer.eaID.toString());
                            }
                        }
                        showLayerListWidget();
                    } else {
                        layerTobeRemoved = map.getLayer(window.layerIdPBSPrefix + this.getAttribute("id").replace(window.chkSelectableLayer, ""));
                        map.removeLayer(layerTobeRemoved);
            			lyrTiledPBS = map.getLayer(window.layerIdTiledPrefix + this.getAttribute("id").replace(window.chkSelectableLayer, ""));
						if (lyrTiledPBS) {
							map.removeLayer(lyrTiledPBS);
						}
                    }
                });
            }
        }
        dojo.byId("numOfPBSLayers").value = " " + String(numOfSelectablePBSLayers) + " of " + String(totalNumOfPBSLayers) + " Maps";
        updateSelectablePBSLayersArea();
    };

    var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {

            //name: 'eBasemapGallery',
            baseClass: 'jimu-widget-demographicslayer',
            selectCurrentCommunity: function () {

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

            startup: function () {

                this.inherited(arguments);
                selfPBS = this;
                map = this.map;
                
                arrLayers = this.config.layers.layer;
                arrLayers = arrLayers.sort(function compare(a, b) {
                        if (a.eaTopic + a.name < b.eaTopic + b.name)
                            return -1;
                        if (a.eaTopic + a.name > b.eaTopic + b.name)
                            return 1;
                        return 0;
                    })


                var tableOfRelationship = document.getElementById('categoryTablePBS');
                var tableRef = tableOfRelationship.getElementsByTagName('tbody')[0];
                var keys = Object.keys(window.topicDicPBS).sort();
                for (i = 0; i < keys.length; i++) {
                    newRow = tableRef.insertRow(tableRef.rows.length);
                    //newRow.style.paddingBottom = "12px";
                    var newCheckboxCell = newRow.insertCell(0);
                    newCheckboxCell.style.verticalAlign = 'top';
                    var checkbox = document.createElement('input');
                    checkbox.type = "checkbox";

                    chkboxId = window.chkTopicPBSPrefix + window.topicDicPBS[keys[i]];

                    checkbox.name = chkboxId;
                    checkbox.value = 0;
                    checkbox.id = chkboxId;
                    checkbox.className = "cmn-toggle-PBS cmn-toggle-PBS-round-flat";
                    newCheckboxCell.appendChild(checkbox);
                    newCheckboxCell.style.paddingRight = "3px";
                    var label = document.createElement('label');
                    label.setAttribute("for", chkboxId);
                    label.innerHTML = "";
                    newCheckboxCell.appendChild(label);

                    checkbox.addEventListener('change', function () {
                        updateSelectablePBSlayers();

                    });
                    /// add category title:
                    var newTitleCell = newRow.insertCell(1);
                    newTitleCell.style.width = "100%";
                    newTitleCell.style.paddingBottom = "5px";

                    var title = document.createElement('label');
                    title.innerHTML = keys[i];
                    newTitleCell.appendChild(title);
                }
                document.getElementById("hideIconsPBS").onclick = function() {
                    updateSelectablePBSlayers();
                };
                updateSelectablePBSlayers();

            },

        });

    return clazz;
});
