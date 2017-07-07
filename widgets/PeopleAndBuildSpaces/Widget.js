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
        'jimu/BaseWidget',
        'dijit/Dialog',
        'jimu/WidgetManager',
        'jimu/PanelManager',
        'esri/layers/FeatureLayer',
        'esri/dijit/PopupTemplate',
        'esri/geometry/Extent',
        'dijit/layout/ContentPane',
        'dijit/TooltipDialog',
        'esri/InfoTemplate',
        'esri/layers/ArcGISDynamicMapServiceLayer',
        'esri/layers/ArcGISTiledMapServiceLayer'
    ],
    function (
        declare,
        _WidgetsInTemplateMixin,
        Deferred,
        BaseWidget,
        Dialog,
        WidgetManager,
        PanelManager,
        FeatureLayer,
        PopupTemplate,
        Extent,
        ContentPane,
        TooltipDialog,
        InfoTemplate,
        ArcGISDynamicMapServiceLayer,
        ArcGISTiledMapServiceLayer) {
    //To do: set these community boundary layer properties from the config file.
    var communityBoundaryLayer = "https://enviroatlas.epa.gov/arcgis/rest/services/Communities/Community_Locations/MapServer";
    var communityBoundaryLayerID = "901"
        var chkIdPBSDictionary = {};
    var arrLayers = null;
    var map = null;
    var hiderows = {};
    var hashFactsheetLinkPBS = {};
    var hashLayerNameLinkPBS = {};
    var hashDescriptionforPBS = {};

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
                return urlTiledMapService +
                "L" + dojo.string.pad(level, 2, '0') + "/" + "R" + dojo.string.pad(row.toString(16), 8, '0') + "/" + "C" + dojo.string.pad(col.toString(16), 8, '0') + "." + "png";

            }
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
                                lyr = selfPBS.map.getLayer(window.layerIdPrefix + eaID);
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
                document.getElementById(key).addEventListener('click', function () {

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

                            var popupConfig = getPopups(layer);
                            lLayer.setInfoTemplates(popupConfig);

                            if (layer.disableclientcaching) {
                                lLayer.setDisableClientCaching(true);
                            }

                            lLayer.id = window.layerIdPrefix + layer.eaID.toString();
                            map.setInfoWindowOnClick(true);

                        } else if (layer.type.toUpperCase() === 'FEATURE') {

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
                            lLayer.minScale = 1155581.108577;
                            lLayer.setVisibility(false); //turn off the layer when first added to map and let user to turn on

                            if (layer.tileLink == "yes") {
                                var tileLinkAdjusted = "";
                                if (layer.tileURL.slice(-1) == "/") {
                                    tileLinkAdjusted = layer.tileURL;
                                } else {
                                    tileLinkAdjusted = layer.tileURL + "/";
                                }
                                initTileLayer(tileLinkAdjusted, window.layerIdTiledPrefix + layer.eaID.toString()); 
                                map.addLayer(new myTiledMapServiceLayer());
                                lyrTiled = map.getLayer(window.layerIdTiledPrefix + layer.eaID.toString()); 
                                if (lyrTiled) {
                                    lyrTiled.setOpacity(layer.opacity);
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
                            if (layer.name) {
                                lLayer._titleForLegend = layer.name;
                                lLayer.title = layer.name;
                                lLayer.noservicename = true;
                            }

                            var popupConfig = getPopups(layer);
                            lLayer.setInfoTemplates(popupConfig);
                        }
                        dojo.connect(lLayer, "onError", function (error) {
                            if ((!(lLayer.title in window.faildedEALayerDictionary)) && (!(lLayer.title in window.successLayerDictionary))) {
                                window.faildedEALayerDictionary[lLayer.title] = lLayer.title;
                                showDisplayLayerAddFailureWidget(lLayer.title);
                            }
                        });

                        dojo.connect(lLayer, "onLoad", function (error) {
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
                        
                        map.addLayer(lLayer);
                        if (layer.hasOwnProperty('eaScale')) {
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
                        layerTobeRemoved = map.getLayer(window.layerIdPrefix + this.getAttribute("id").replace(window.chkSelectableLayer, ""));
                        map.removeLayer(layerTobeRemoved);
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
            startup: function () {

                this.inherited(arguments);
                map = this.map;
                arrLayers = this.config.layers.layer;
                arrLayers = arrLayers.sort(function compare(a, b) {
                        if (a.eaTopic + a.name < b.eaTopic + b.name)
                            return -1;
                        if (a.eaTopic + a.name > b.eaTopic + b.name)
                            return 1;
                        return 0;
                    })

                    selfPBS = this;

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
