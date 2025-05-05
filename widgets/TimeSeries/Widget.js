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
    'esri/layers/FeatureLayer',
    'esri/graphic',
    'esri/geometry/Extent',
    'esri/InfoTemplate',
    'esri/tasks/query',
    'esri/tasks/QueryTask',
    'esri/tasks/StatisticDefinition',
    'esri/symbols/SimpleLineSymbol',
    'esri/symbols/SimpleFillSymbol',
    'esri/renderers/ClassBreaksRenderer',
    'esri/tasks/AlgorithmicColorRamp',
    'esri/tasks/GenerateRendererParameters',
    'esri/tasks/GenerateRendererTask',
    'esri/layers/LayerDrawingOptions',
    'esri/symbols/SimpleFillSymbol',
    'esri/tasks/ClassBreaksDefinition',
    'esri/Color',
    'dojo/_base/declare',
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidget',
    'dijit/Dialog',
    'jimu/PanelManager',
    'esri/dijit/TimeSlider',
    'esri/TimeExtent',
    'esri/layers/ArcGISImageServiceLayer',
    'esri/layers/ImageServiceParameters',
    'esri/tasks/ImageServiceIdentifyParameters',
    'esri/tasks/ImageServiceIdentifyTask',
    'dojo/_base/array',
    'dijit/registry',
    'dijit/form/TextBox',
    'dijit/form/Button',
    'dojo/dom-construct',
    'dijit/TitlePane',
],
    function (
        FeatureLayer,
        Graphic,
        Extent,
        InfoTemplate,
        Query,
        QueryTask,
        StatisticDefinition,
        SimpleLineSymbol,
        SimpleFillSymbol,
        ClassBreaksRenderer,
        AlgorithmicColorRamp,
        GenerateRendererParameters,
        GenerateRendererTask,
        LayerDrawingOptions,
        SimpleFillSymbol,
        ClassBreaksDefinition,
        Color,
        declare,
        _WidgetsInTemplateMixin,
        BaseWidget,
        Dialog,
        PanelManager,
        TimeSlider,
        TimeExtent,
        ArcGISImageServiceLayer,
        ImageServiceParameters,
        ImageServiceIdentifyParameters,
        ImageServiceIdentifyTask,
        arrayUtils,
        registry,
        TextBox,
        Button,
        domConstruct
    ) {
        var map = null;
        var map, identifyTask, identifyParams;

        var serverURL = "https://awseastaging.epa.gov";
        var futureScenariosAGSbaseURL = serverURL + "/arcgis/rest/services/FutureScenarios/";
        var comment = "Climate scenarios provide likely approximations of future conditions given a set of initial assumptions and model results. The future is inherently uncertain with no guarantee that these scenarios reflect what will occur at the specified future time.";
        var timeSlider, userChosenTimeStep;
        var selfTimeSeries;
        var widthSelect = "310px";

        var showLayerListWidget = function () {
            var widgetName = 'LayerList';
            var widgets = selfTimeSeries.appConfig.getConfigElementsByName(widgetName);
            var pm = PanelManager.getInstance();
            pm.showPanel(widgets[0]);
        }

        var stringHasNumber = function hasNumber(myString) {
            return /\d/.test(myString);
        }

        var clickFrameYear = function () {
            console.log("frmeYearinput is clicked!");
            if (dojo.byId("frameYearInput").value == 'Or, select specific year to display') {
                dojo.byId("frameYearInput").value = '';
                dojo.byId("frameYearInput").style.color = '#000';
            }
        };

        var blurFrameYear = function () {
            if (dojo.byId("frameYearInput").value == '') {
                dojo.byId("frameYearInput").value = 'Or, select specific year to display';
                dojo.byId("frameYearInput").style.color = '#555';
            }
        };

        var mapLoading = function () {
            if (timeSlider) {
                //layer is loading, set rate temoporarily very high (20 sec), pausing the slider
                timeSlider.setThumbMovingRate(20000);
            }
        };

        var mapFinishedLoading = function (evt) {
            map.showZoomSlider();
            if (timeSlider) {
                timeSlider.setThumbMovingRate(600);
            }
        };

        var makeSliderAndLegendOneFrame = function (evt) {
            if (dojo.byId("frameOrSlide").innerHTML == 'slide') {
                return '';
            }
            //If this isn't the first layer the user has selected, destroy the old time slider and make a new one
            if (dijit.byId('timeSliderDijOneFrame')) {
                dijit.byId('timeSliderDijOneFrame').destroy();
            }
            if (dijit.byId('timeSliderDij')) {
                dijit.byId('timeSliderDij').destroy();
            }

            //reset the time slider div after destroying the actual timeslider
            var tsDiv = domConstruct.create("div", null, dojo.byId("timeSliderDivOneFrame"));
            timeSlider = new TimeSlider({
                style: "width:100%;",
                id: "timeSliderDijOneFrame"
            }, tsDiv);

            map.setTimeSlider(timeSlider);

            var timeExtent = new TimeExtent();
            timeExtent.startTime = new Date("1/1/" + (dojo.byId("frameYearInput").value - 1));
            timeExtent.endTime = new Date("1/1/" + (dojo.byId("frameYearInput").value + 1));
            userChosenTimeStep = 5;

            timeSlider.createTimeStopsByTimeInterval(timeExtent, 1, 'esriTimeUnitsYears');
            timeSlider.setTickCount(0);
            //timeSlider.setThumbMovingRate(20000);
            // timeSlider.singleThumbAsTimeInstant(true);
            timeSlider.startup();
            timeSlider.next();

            dojo.byId("titleAndSlider").style.visibility = "hidden";
            dojo.byId("subTitleOneFrame").innerHTML = "Timeline: Year " + String(dojo.byId("frameYearInput").value);
            dojo.byId('titleAndSliderOneFrame').style.display = '';
            dojo.byId("titleAndSliderOneFrame").style.visibility = "visible";
            dojo.byId('timeSliderWin').style.display = 'none';
            //esri.hide(loading);   

            //add timeslider labels for years that end in 0
            var labels = arrayUtils.map(timeSlider.timeStops, function (timeStop, i) {
                if (timeStop.getUTCFullYear() % 10 === 0) {
                    return timeStop.getUTCFullYear();
                } else {
                    return "";
                }
            });
            timeSlider.setLabels(labels);

            if (document.getElementById("modelSelection").value == "Hist") {
                dojo.byId("details").innerHTML = '1950';
            } else {
                dojo.byId("details").innerHTML = '2010';
            }
            // dojo.byId("details").innerHTML = '2010'; //hardcoded start year date

            timeSlider.on("time-extent-change", function (evt2) {
                var currYear = evt2.startTime.getUTCFullYear();
                dojo.byId("details").innerHTML = currYear;
            });
        };

        var makeSliderAndLegend = function (evt) {
            if ((evt.layers[0].error != undefined) && (evt.layers[0].error != "")) {
                window.failedDemoHucTimeseEcatRain["Time Series URL: " + futureScenariosAGSbaseURL] = evt.layers[0].error;

                var widgetName = 'DisplayLayerAddFailure';
                var widgets = selfSimpleSearchFilter.appConfig.getConfigElementsByName(widgetName);
                var pm = PanelManager.getInstance();
                pm.showPanel(widgets[0]);
                return;
            }
            //evt.layers[0].error  //"Error: Service FutureScenarios2/RCP26SpringPrecip/ImageServer not found "
            if (dojo.byId("frameOrSlide").innerHTML == 'frame') {
                return '';
            }
            //If this isn't the first layer the user has selected, destroy the old time slider and make a new one
            if (dijit.byId('timeSliderDijOneFrame')) {
                dijit.byId('timeSliderDijOneFrame').destroy();
            }
            if (dijit.byId('timeSliderDij')) {
                dijit.byId('timeSliderDij').destroy();
            }
            //reset the time slider div after destroying the actual timeslider

            var tsDiv = domConstruct.create("div", null, dojo.byId("timeSliderDiv"));

            timeSlider = new TimeSlider({
                style: "width:100%;",
                id: "timeSliderDij"
            }, tsDiv);

            map.setTimeSlider(timeSlider);

            var timeExtent = new TimeExtent();
            timeSlider.setThumbCount(1);

            timeExtent = evt.layers[0].layer.timeInfo.timeExtent;

            userChosenTimeStep = 5;
            var timeStepIntervals = [];
            var images = new Array();
            var model = document.getElementById("modelSelection").value.replace(".", "");
            var season = document.getElementById("seasonSelection").value;
            var climateVar = document.getElementById("climateSelection").value;
            var imageCacheIndex = 0;
            var dictBBox = {};
            var dictSize = {};
            dictBBox['RCP26SpringPrecip'] = "-18252982.982271608%2C1177727.8283327678%2C-6972100.599835155%2C6793709.170499745";
            dictSize['RCP26SpringPrecip'] = "1153%2C574";
            for (i = timeExtent.startTime.getUTCFullYear(); i <= timeExtent.endTime.getUTCFullYear(); i++) {
                if (i % userChosenTimeStep === 0) {
                    if (i <= timeExtent.endTime.getUTCFullYear()) {
                        timeStepIntervals.push(new Date("01/01/" + i));
                        var frameDate = new Date("01/01/" + i);
                        if (dictBBox[model + season + climateVar] !== undefined) {
                            images[imageCacheIndex] = new Image();
                            images[imageCacheIndex].src = serverURL + "/arcgis/rest/services/FutureScenarios/" + model + season + climateVar + "/ImageServer/exportImage?f=image&time=" + frameDate.getTime() + "%2C" + frameDate.getTime() + "&bbox=" + dictBBox[model + season + climateVar] + "&imageSR=102100&bboxSR=102100&size=" + dictSize[model + season + climateVar];
                            imageCacheIndex = imageCacheIndex + 1;
                        }
                    }
                } else if (i == timeExtent.endTime.getUTCFullYear()) {
                    timeStepIntervals.push(new Date("01/01/" + timeExtent.endTime.getUTCFullYear()));
                    var finalDate = new Date("01/01/" + timeExtent.endTime.getUTCFullYear());
                    if (dictBBox[model + season + climateVar] !== undefined) {
                        images[imageCacheIndex] = new Image();
                        images[imageCacheIndex].src = serverURL + "/arcgis/rest/services/FutureScenarios/" + model + season + climateVar + "/ImageServer/exportImage?f=image&time=" + finalDate.getTime() + "%2C" + finalDate.getTime() + "&bbox=" + dictBBox[model + season + climateVar] + "&imageSR=102100&bboxSR=102100&size=" + dictSize[model + season + climateVar];
                    }
                }
            };
            timeSlider.setTimeStops(timeStepIntervals);
            timeSlider.setThumbMovingRate(20000);
            timeSlider.singleThumbAsTimeInstant(true);
            timeSlider.startup();
            dojo.byId('timeSliderWin').style.display = '';
            dojo.byId("titleAndSlider").style.visibility = "visible";
            dojo.byId('timeSliderDivOneFrame').style.display = 'none';
            dojo.byId("titleAndSliderOneFrame").style.display = "none";
            //esri.hide(loading);

            //add timeslider labels for years that end in 0
            var labels = arrayUtils.map(timeSlider.timeStops, function (timeStop, i) {
                if (timeStop.getUTCFullYear() % 10 === 0) {
                    if (timeStop.getUTCFullYear() < timeExtent.endTime.getUTCFullYear()) {
                        return timeStop.getUTCFullYear();
                    }
                } else if (timeStop.getUTCFullYear() == timeExtent.endTime.getUTCFullYear()) {
                    return timeStop.getUTCFullYear();
                } else {
                    return "";
                }
            });
            timeSlider.setLabels(labels);
            if (document.getElementById("modelSelection").value == "Hist") { dojo.byId("details").innerHTML = '1950'; } else { dojo.byId("details").innerHTML = '2010'; }
            // dojo.byId("details").innerHTML = '2010'; //hardcoded start year date		

            timeSlider.on("time-extent-change", function (evt2) {
                var currYear = evt2.startTime.getUTCFullYear();
                dojo.byId("details").innerHTML = currYear;
            });

        };
        var defineOneFrameService = function () {
            //esri.show(loading);        
            if (document.getElementById("seasonSelection").value != "" && document.getElementById("climateSelection").value != "") {
                var startHist = 1950;
                var endHist = 2005;
                var startFuture = 2006;
                var endFuture = 2099;
                if (document.getElementById("modelSelection").value == "Hist") {
                    dojo.byId("subTitle").innerHTML = "Timeline: 1950 - 2005";  // 2005
                    dojo.byId("subTitleOneFrame").innerHTML = "Timeline: 1950 - 2005";  // 2005
                    errorMessageYearInput = "Please input a year of single frame (" + String(startHist) + "-" + String(endHist) + ")";
                } else {
                    dojo.byId("subTitle").innerHTML = "Timeline: 2010 - 2099";
                    dojo.byId("subTitleOneFrame").innerHTML = "Timeline: 2010 - 2099";
                    errorMessageYearInput = "Please input a year of single frame (" + String(startFuture) + "-" + String(endFuture) + ")";
                }

                var yearInput = dijit.byId("frameYearInput").value;
                console.log("yearInput", yearInput);

                if ((isNaN(yearInput))) {
                    alert(errorMessageYearInput);
                    return;
                } else {
                    numYearInput = parseFloat(yearInput);
                    if (dijit.byId("modelSelection").item.value == "Hist") {
                        if ((numYearInput < startHist) || (numYearInput > endHist)) {
                            alert(errorMessageYearInput);
                            return;
                        }
                    } else {
                        if ((numYearInput < startFuture) || (numYearInput > endFuture)) {
                            alert(errorMessageYearInput);
                            return;
                        }
                    }
                }
                var model = document.getElementById("modelSelection").value.replace(".", "");
                var season = document.getElementById("seasonSelection").value;
                var climateVar = document.getElementById("climateSelection").value;
                dojo.byId("frameOrSlide").innerHTML = 'frame';
                console.log("model+ season + climateVar:" + model + season + climateVar);
                addOneFrameServiceToMap(model + season + climateVar);
                //changeLegendImg();
            } else {
                alert("Choose options for Metric and Season!");
            }
        };

        var addOneFrameServiceToMap = function (serviceParams) {
            removeFrameFromMap();
            //build the REST endpoint URL for the user-selected dropdown selections
            var selectedImageService = futureScenariosAGSbaseURL + serviceParams + "/ImageServer";

            var params = new ImageServiceParameters();

            var imageServiceLayer = new ArcGISImageServiceLayer(selectedImageService, { imageServiceParameters: params });
            imageServiceLayer.id = window.timeSeriesLayerId;
            imageServiceLayer.setOpacity(0.6);

            map.addLayers([imageServiceLayer]);

            //Turn on Identify capability after the layer is added to the map
            mapClickListener = map.on("click", executeIdentifyTask);

            imageServiceLayer.on("load", function () {
                //var modelId = dijit.byId("modelSelection").item.id;
                var modelValue = document.getElementById("modelSelection").value;
                var season = document.getElementById("seasonSelection").value;
                //var climateId = document.getElementById("climateSelection").item.id;
                var climateVar = document.getElementById("climateSelection").value;
                var unit = "";
                if ((climateVar == "TempMax") || (climateVar == "TempMin")) {
                    unit = "Degrees F";
                } else if ((climateVar == "Precip") || (climateVar == "PET")) {
                    unit = "Inches";
                }
                //setMetadataTab(modelId + " (" + modelValue + "), " + season + " <br/>" + climateId + " (" + unit + ")<br/><hr>" + comment);
                setMetadataTab(modelValue + ", " + season + " <br/>" + climateVar + " (" + unit + ")<br/><hr>" + comment);
            });

        };

        var defineService = function () {
            //esri.show(loading);
            if (document.getElementById("seasonSelection").value != "" && document.getElementById("climateSelection").value != "") {
                if (document.getElementById("modelSelection").value == "Hist") {
                    dojo.byId("subTitle").innerHTML = "Timeline: 1950 - 2005";  //2005
                    dojo.byId("subTitleOneFrame").innerHTML = "Timeline: 1950 - 2005";  //2005
                } else {
                    dojo.byId("subTitle").innerHTML = "Timeline: 2010 - 2099";
                    dojo.byId("subTitleOneFrame").innerHTML = "Timeline: 2010 - 2099";
                }
                var model = document.getElementById("modelSelection").value.replace(".", "");
                var season = document.getElementById("seasonSelection").value;
                var climateVar = document.getElementById("climateSelection").value;
                userChosenTimeStep = 5;
                dojo.byId("frameOrSlide").innerHTML = 'slide';
                addSelectedImageServiceToMap(model + season + climateVar);
                //changeLegendImg();
            }
        };

        var addSelectedImageServiceToMap = function (serviceParams) {
            removeDataFromMap();
            //build the REST endpoint URL for the user-selected dropdown selections
            var selectedImageService = futureScenariosAGSbaseURL + serviceParams + "/ImageServer";

            var params = new ImageServiceParameters();
            var modelValue = document.getElementById("modelSelection").value;
            var season = document.getElementById("seasonSelection").value;
            //var climateId = document.getElementById("climateSelection").value;
            var climateVar = document.getElementById("climateSelection").value;
            var imageServiceLayer = new ArcGISImageServiceLayer(selectedImageService, { imageServiceParameters: params });
            imageServiceLayer.id = window.timeSeriesLayerId;
            imageServiceLayer.name = "Time Series: " + modelValue + ", " + season + ", " + climateVar;
            imageServiceLayer.title = "Time Series: " + modelValue + ", " + season + ", " + climateVar;
            imageServiceLayer.setOpacity(0.6);
            // window.climateTimeSeriesFromURL = imageServiceLayer.url

            map.addLayers([imageServiceLayer]);

            //Turn on Identify capability after the layer is added to the map
            mapClickListener = map.on("click", executeIdentifyTask);

            imageServiceLayer.on("load", function () {
                //var modelId = dijit.byId("modelSelection").item.id;
                var unit = "";
                if ((climateVar == "TempMax") || (climateVar == "TempMin")) {
                    unit = "Degrees F";
                } else if ((climateVar == "Precip") || (climateVar == "PET")) {
                    unit = "Inches";
                }
                //setMetadataTab(modelId + " (" + modelValue + "), " + season + " <br/>" + climateId + " (" + unit + ")<br/><hr>" + comment);
                setMetadataTab(modelValue + ", " + season + " <br/>" + climateVar + " (" + unit + ")<br/><hr>" + comment);
                showLayerListWidget();
            });
        };

        var removeFrameFromMap = function () {
            if (map.getLayer(window.timeSeriesLayerId)) {
                // console.log(map.getLayer(window.timeSeriesLayerId));
                map.removeLayer(map.getLayer(window.timeSeriesLayerId));
                clearMetadataTab();
                //clearLegendTab();
            }

            dojo.byId("identResult").innerHTML = "";
            console.log("before hiding infoWindow");
            map.infoWindow.hide();
            if (dijit.byId('timeSliderDijOneFrame')) {
                dijit.byId('timeSliderDijOneFrame').destroy();
                console.log('destroyed time slider');
            }
            //esri.hide(loading); 
        };

        var removeDataFromMap = function () {
            /*var myNode = document.getElementById("table_container");
            while (myNode.firstChild) {
                myNode.removeChild(myNode.firstChild);
            }*/
            // console.log("remove data from map");
            if (map.getLayer(window.timeSeriesLayerId)) {
                // console.log(map.getLayer(window.timeSeriesLayerId));
                map.removeLayer(map.getLayer(window.timeSeriesLayerId));
                clearMetadataTab();
                //clearLegendTab();
            }

            dojo.byId("identResult").innerHTML = "";
            map.infoWindow.hide();
            if (dijit.byId('timeSliderDij')) {
                dijit.byId('timeSliderDij').destroy();
                console.log('destroyed time slider');
            }
            if (dijit.byId('timeSliderDijOneFrame')) {
                dijit.byId('timeSliderDijOneFrame').destroy();
                console.log('destroyed time slider');
            }
            //esri.hide(loading); 
        };

        var clearMetadataTab = function () {
            dojo.byId("layerMetadata").innerHTML = "";
        };

        var setMetadataTab = function (imgServiceDesc) {
            dojo.byId("layerMetadata").innerHTML = imgServiceDesc;
        };

        var executeIdentifyTask = function (event) {
            //console.log("Executing Ident Task");
            var currentLayer = map.getLayer(window.timeSeriesLayerId);
            if ((currentLayer == undefined) || (currentLayer.visible == false)) {
                return;
            }

            identifyTask = new ImageServiceIdentifyTask(currentLayer.url);
            identifyParams = new ImageServiceIdentifyParameters();
            identifyParams.returnGeometry = true;
            identifyParams.geometry = event.mapPoint;

            if (dojo.byId("frameOrSlide").innerHTML == 'frame') {
                var timeExtent = new TimeExtent();
                timeExtent.startTime = new Date("12/31/" + (dojo.byId("frameYearInput").value));
                timeExtent.endTime = new Date("12/31/" + (dojo.byId("frameYearInput").value));
                identifyParams.timeExtent = timeExtent;
            } else {
                identifyParams.timeExtent = map.timeExtent;
            }

            dojo.connect(map.infoWindow._hide, "onclick", function () {
                var climateValue = document.getElementById("climateSelection").value;
                if ((climateValue == "TempMax") || (climateValue == "TempMin")) {
                    dojo.byId("identResult").innerHTML = "Degrees Fahrenheit: " + String(pixelVal);
                } else if ((climateValue == "Precip") || (climateValue == "PET")) {
                    dojo.byId("identResult").innerHTML = "Inches per season or year: " + String(pixelVal);
                }
            });

            var deferred = identifyTask
                .execute(identifyParams)
                .addCallback(function (response) {
                    //alert(response.value);
                    pixelVal = parseFloat(response.value) / 100;
                    var climateValue = document.getElementById("climateSelection").value;
                    if ((climateValue == "TempMax") || (climateValue == "TempMin")) {
                        dojo.byId("identResult").innerHTML = "Degrees Fahrenheit: " + String(pixelVal);
                        map.infoWindow.setTitle("Degrees Fahrenheit");
                    } else if ((climateValue == "Precip") || (climateValue == "PET")) {
                        dojo.byId("identResult").innerHTML = "Inches per season or year: " + String(pixelVal);
                        map.infoWindow.setTitle("Inches per season or year");
                    }
                    map.infoWindow.setContent(String(pixelVal));
                    map.infoWindow.show(event.mapPoint);
                });
        };

        var dataFromURL = () => {
            // Split the url parameter by underscores into 3 parts
            var timeseriesparam = window.climateTimeSeriesFromURL.split('_');
            selfTimeSeries.climateSelectionNode.value = timeseriesparam[2];
            selfTimeSeries.seasonSelectionNode.value = timeseriesparam[1];
            // Add a '.' between the digits in timeseriesparam[0], which is the modelSelectionNode value
            if (stringHasNumber(timeseriesparam[0])) {
                var modelSelectionStr = timeseriesparam[0];
                var modelSelectionStrResult = modelSelectionStr.slice(0, -1) + "." + modelSelectionStr.slice(-1);
                selfTimeSeries.modelSelectionNode.value = modelSelectionStrResult;
            } else {
                selfTimeSeries.modelSelectionNode.value = timeseriesparam[0];
            };
            // Click to add the data that matches the climateTimeSeries url param
            document.getElementById("loadServiceBtn").click();
        }

        // Add data if the url != null, Reject if the url is null
        var addDataFromURL = new Promise((resolve, reject) => {
            if (window.climateTimeSeriesFromURL != null) {
                resolve(console.log('Climate data to add.'))
            } else {
                reject(console.log('No climate data to add.'))
            }
        });

        return declare([BaseWidget, _WidgetsInTemplateMixin], {
            baseClass: 'jimu-widget-timeseries',
            oLayer: null,

            startup: function () {
                this.inherited(arguments);
                map = this.map;
                selfTimeSeries = this;
                map.on("update-start", mapLoading);
                map.on("update-end", mapFinishedLoading);
                map.on("layers-add-result", makeSliderAndLegend);
                map.on("layers-add-result", makeSliderAndLegendOneFrame);
                dojo.byId('titleAndSliderOneFrame').style.display = 'none';

                var frameYear = new TextBox({
                    id: "frameYearInput",
                    name: "frameYear",
                    value: "Or, select specific year to display",
                    style: "width:" + widthSelect,
                    //required: true,
                    //placeHolder: "Year For One Frame"
                    //click: clickFrameYear,
                    //onblur: blurFrameYear
                }, "frameYearInput").startup();

                uiButtons = [
                    "loadOneFrameBtn",
                    "loadServiceBtn",
                    "removeServiceBtn",
                    "loadServiceBtnOCONUS",
                ];

                uiButtons.forEach(b => {
                    new Button({
                        id: b,
                        name: b,
                        disabled: false
                    }, b).startup();
                });

                //loading = dojo.byId("loadingTimeSeriesLayer");//dojo.byId("loadingOverlay");
                //esri.hide(loading);
                registry.byId("loadOneFrameBtn").on("click", defineOneFrameService);
                registry.byId("frameYearInput").on("click", clickFrameYear);
                registry.byId("frameYearInput").on("blur", blurFrameYear);

                // Scenario dialog box
                var scenario_info = this.config.scenarios;
                document.getElementById("modelSelectionHelp").onclick = function (e) {
                    var infobox = new Dialog({
                        title: "Scenarios",
                        style: 'width: 500px'
                    });

                    scenario_text = '';
                    for (i = 0; i < scenario_info.length; i++) {
                        scenario_text += "<h2 style='margin-top:0px'>" + scenario_info[i].model + "</h2>";
                        scenario_text += "<p>" + scenario_info[i].description + "</p>";
                        if (i < scenario_info.length - 1) {
                            scenario_text += "<hr style='margin-top:10px'>";
                        };
                    };

                    var infoDiv = dojo.create('div', {
                        'innerHTML': scenario_text
                    }, infobox.containerNode);
                    infobox.show()
                };
                //end of modelSelectionHelp click event

                // Climate Variable dialog box
                var climate_info = this.config.climate_variables;
                document.getElementById("climateSelectionHelp").onclick = function (e) {
                    var infobox = new Dialog({
                        title: "Climate Variables",
                        style: 'width: 300px'
                    });

                    variable_text = '';
                    for (i = 0; i < climate_info.length; i++) {
                        variable_text += "<h2 style='margin-top:0px'>" + climate_info[i].v_name + "</h2>";
                        variable_text += "<p>" + climate_info[i].description + "</p><br>";
                        variable_text += "<a href='" + climate_info[i].factsheet + "' target='_blank' class='factsheetLink'>Fact Sheet</a>";
                        if (i < climate_info.length - 1) {
                            variable_text += "<hr style='margin-top:10px'>";
                        };
                    };

                    var infoDiv = dojo.create('div', {
                        'innerHTML': variable_text
                    }, infobox.containerNode);
                    infobox.show()
                };
                //end of climateSelectionHelp click event 

                // Season dialog box
                var season_info = this.config.seasons;
                document.getElementById("seasonSelectionHelp").onclick = function (e) {
                    var infobox = new Dialog({
                        title: "Seasons",
                        style: 'width: 300px'
                    });

                    season_text = '';

                    for (i = 0; i < season_info.length; i++) {
                        season_text += "<h2 style='margin-top:0px'>" + season_info[i].s_name + "</h2>";
                        season_text += "<p>" + season_info[i].description + "</p>";
                        if (i < season_info.length - 1) {
                            season_text += "<hr style='margin-top:10px'>";
                        };
                    };

                    var infoDiv = dojo.create('div', {
                        'innerHTML': season_text
                    }, infobox.containerNode);
                    infobox.show()
                };
                //end of seasonSelectionHelp click event

                var oconus_info = this.config.OCONUS;
                document.getElementById("domainSelectionHelpOCONUS").onclick = function (e) {
                    var infobox = new Dialog({
                        title: "Outside CONUS",
                        style: 'width: 300px'
                    });

                    oconus_text = "<p>" + oconus_info[0].text + "</p>";;

                    var infoDiv = dojo.create('div', {
                        'innerHTML': oconus_text
                    }, infobox.containerNode);
                    infobox.show()
                };
                //end of domainSelectionHelpOCONUS click event

                // OCONUS Scenario dialog box
                var oconus_scenario_info = this.config.OCONUS_scenarios;
                document.getElementById("modelSelectionHelpOCONUS").onclick = function (e) {
                    var infobox = new Dialog({
                        title: "Outside CONUS Scenarios",
                        style: 'width: 500px'
                    });

                    oconus_scenario_text = '';
                    for (i = 0; i < oconus_scenario_info.length; i++) {
                        oconus_scenario_text += "<h2 style='margin-top:0px'>" + oconus_scenario_info[i].model + "</h2>";
                        oconus_scenario_text += "<p>" + oconus_scenario_info[i].description + "</p>";
                        if (i < oconus_scenario_info.length - 1) {
                            oconus_scenario_text += "<hr style='margin-top:10px'>";
                        };
                    };

                    var infoDiv = dojo.create('div', {
                        'innerHTML': oconus_scenario_text
                    }, infobox.containerNode);
                    infobox.show()
                };
                //end of modelSelectionHelpOCONUS click event

                // OCONUS Climate Variable dialog box
                var oconus_climate_info = this.config.oconus_climate_variables;
                document.getElementById("climateSelectionHelpOCONUS").onclick = function (e) {
                    var infobox = new Dialog({
                        title: "Outside CONUS Climate Variables",
                        style: 'width: 300px'
                    });

                    oconus_variable_text = '';
                    for (i = 0; i < oconus_climate_info.length; i++) {
                        if (oconus_climate_info[i].name) {
                            oconus_variable_text += "<h2 style='margin-top:0px'>" + oconus_climate_info[i].name + "</h2>";
                        }
                        oconus_variable_text += "<p>" + oconus_climate_info[i].description + "</p>";
                        if (oconus_climate_info[i].factsheet) {
                            oconus_variable_text += "<br><a href='" + oconus_climate_info[i].factsheet + "' target='_blank' class='factsheetLink'>Fact Sheet</a>";
                        }
                        if (i < oconus_climate_info.length - 1) {
                            oconus_variable_text += "<hr style='margin-top:10px'>";
                        };
                    };

                    var infoDiv = dojo.create('div', {
                        'innerHTML': oconus_variable_text
                    }, infobox.containerNode);
                    infobox.show()
                };
                //end of climateSelectionHelpOCONUS click event 

                var season_info = this.config.seasons;
                document.getElementById("seasonSelectionHelpOCONUS").onclick = function (e) {
                    var infobox = new Dialog({
                        title: "Seasons",
                        style: 'width: 300px'
                    });

                    season_text = '';

                    for (i = 0; i < season_info.length; i++) {
                        season_text += "<h2 style='margin-top:0px'>" + season_info[i].s_name + "</h2>";
                        season_text += "<p>" + season_info[i].description + "</p>";
                        if (i < season_info.length - 1) {
                            season_text += "<hr style='margin-top:10px'>";
                        };
                    };

                    var infoDiv = dojo.create('div', {
                        'innerHTML': season_text
                    }, infobox.containerNode);
                    infobox.show()
                };
                //end of seasonSelectionHelpOCONUS click event

                // OCONUS Period dialog box
                var oconus_period_info = this.config.Period;
                document.getElementById("periodSelectionHelpOCONUS").onclick = function (e) {
                    var infobox = new Dialog({
                        title: "Outside CONUS Period",
                        style: 'width: 300px'
                    });

                    oconus_period_text = "<p>" + oconus_period_info[0].text + "</p><br>";
                    oconus_period_text += "<li>" + oconus_period_info[0].list1 + "</li>";
                    oconus_period_text += "<li>" + oconus_period_info[0].list2 + "</li>";
                    oconus_period_text += "<li>" + oconus_period_info[0].list3 + "</li>";
                    oconus_period_text += "<li>" + oconus_period_info[0].list4 + "</li>";
                    oconus_period_text += "<li>" + oconus_period_info[0].list5 + "</li>";

                    var infoDiv = dojo.create('div', {
                        'innerHTML': oconus_period_text
                    }, infobox.containerNode);
                    infobox.show()
                };
                //end of periodSelectionHelpOCONUS click event
                this._initDOMRefs();
                this._initListeners();
            },

            onOpen: () => {
                // If there's a climateTimeSeries url param in the app url, then add climate data from the url params
                addDataFromURL.then(dataFromURL)
                    .catch(e => {
                        console.log(e);
                    });
            },

            _initDOMRefs: function () {
                this.loadOCONUS = document.getElementById('loadServiceBtnOCONUS');
                this.loadCONUS = document.getElementById('loadServiceBtn');
                this.removeCONUS = document.getElementById('removeServiceBtn');
                this.frameYearInput = document.getElementById('frameYearInput');
                this.climVarOCONUS = document.getElementById('climateSelectionOCONUS');
                this.domainOCONUS = document.getElementById('domainSelectionOCONUS');
            },

            _initListeners: function () {
                this.loadCONUS.addEventListener('click', () => {
                    defineService();
                });

                this.removeCONUS.addEventListener('click', () => {
                    removeDataFromMap();
                });

                this.loadOCONUS.addEventListener('click', () => {
                    this._loadOCONUS();
                });
                
                this.domainOCONUS.addEventListener('change', () => {
                    if (this.domainOCONUS.value == 'ALASKA') {
                        this.climVarOCONUS[1].setAttribute('hidden', '');
                        this.climVarOCONUS[3].setAttribute('hidden', '')
                    } else {
                        this.climVarOCONUS[1].removeAttribute('hidden');
                        this.climVarOCONUS[3].removeAttribute('hidden');
                    }
                })
            },

            _zoomToOCONUSArea: (a) => {
                return Extent(selfTimeSeries.config.extents[0][a]);
            },

            _loadOCONUS: function () {
                // Get selections
                var domain = this.domainOCONUS.value;
                var domainText = this.domainOCONUS.options[this.domainOCONUS.selectedIndex].text;
                var scenario = dojo.byId("modelSelectionOCONUS").value;
                map.setExtent(this._zoomToOCONUSArea(domain));
                var fieldname = this._buildOconusField();
                oconusUrl = `https://services.arcgis.com/cJ9YHowT8TU7DUyn/arcgis/rest/services/NEXGDDP_${scenario}/FeatureServer/0`;
                oLayerId = "NEXGDDP" + domain + scenario + fieldname;
                this.oLayer = new FeatureLayer(oconusUrl, { visible: false, opacity: 0.6 });
                var oconusSelections = this._buildOconusId();
                this.oLayer.id = oLayerId;
                this.oLayer.name = domainText + ', ' + scenario + ', ' + oconusSelections;
                this.oLayer.title = domainText + ', ' + scenario + ', ' + oconusSelections;
                var popupTitle = scenario + ', ' + oconusSelections;
                this.oLayer.setDefinitionExpression("domain = '" + `${domain}` + "' AND " + `${fieldname}` + " IS NOT NULL");
                map.addLayer(this.oLayer);
                map.on("click", e => {
                    //TODO: remove highlights
                    map.graphics.clear();
                    this._executeQueryTask(e, oconusUrl, domain, fieldname, popupTitle);
                });
                // query outStatistics of the symbology field
                var dataMinQueryTask = new QueryTask(oconusUrl);
                var dataMinQuery = new Query();
                var statMinDef = new StatisticDefinition();
                statMinDef.statisticType = "min";
                statMinDef.onStatisticField = fieldname;
                statMinDef.outStatisticFieldName = "minValue";
                dataMinQuery.returnGeometry = false;
                dataMinQuery.where = "domain = '" + `${domain}` + "'";
                dataMinQuery.outStatistics = [statMinDef];
                dataMinQueryTask.execute(dataMinQuery).then(resultsMn => {
                    // don't want to round yet, in case the value is a fraction.
                    this.minVal = resultsMn.features[0].attributes.minValue;
                    var dataMaxQueryTask = new QueryTask(oconusUrl);
                    var dataMaxQuery = new Query();
                    var statDef = new StatisticDefinition();
                    statDef.statisticType = "max";
                    statDef.onStatisticField = fieldname;
                    statDef.outStatisticFieldName = "maxValue";
                    dataMaxQuery.returnGeometry = false;
                    dataMaxQuery.where = "domain = '" + `${domain}` + "'";
                    dataMaxQuery.outStatistics = [statDef];
                    return dataMaxQueryTask.execute(dataMaxQuery)
                }).then(resultsMx => {
                    // don't want to round yet, in case the value is a fraction.
                    this.maxVal = resultsMx.features[0].attributes.maxValue;
                }).then(() => {
                    var clim = this.climVarOCONUS.value;
                    this._classBreaks(fieldname, clim);
                });
                showLayerListWidget();
            },

            _largestAbsVal: function (num1, num2) {
                return Math.max(Math.abs(num1), Math.abs(num2))
            },

            _classBreaks: function (field, clim) {
                console.log(this.maxVal, this.minVal);
                var symbol = new SimpleFillSymbol();
                var sls = new SimpleLineSymbol(SimpleLineSymbol.STYLE_NULL);
                symbol.setColor(new Color([150, 150, 150, 0.6])).setOutline(sls);
                var renderer = new ClassBreaksRenderer(symbol, field);
                // if there are negative values, create 9 value diverging color classification 
                if (this.minVal < 0) {
                    if (clim == "PRfr" || clim == "PEfr") {
                        // compare the min and max of to domain, then whichever is largest number, the other side of break is max/min (9 total classes)
                        var largestVal = this._largestAbsVal(this.maxVal, this.minVal); // don't round fractions until the end
                        var smallestVal = (-1 * largestVal);
                        var positiveBreakDiff = (largestVal / 5);
                        var negativeBreakDiff = (largestVal / 3);
                        // negative (3 classes)
                        renderer.addBreak({
                            minValue: Number((smallestVal).toFixed(3)),
                            maxValue: Number((smallestVal + negativeBreakDiff).toFixed(3)),
                            symbol: new SimpleFillSymbol().setColor(new Color([133, 46, 4, 0.6])).setOutline(sls),
                            label: Number((smallestVal * 100).toFixed(1)) + ' - ' + Number(((smallestVal + negativeBreakDiff) * 100).toFixed(1)) + '%'
                        });
                        renderer.addBreak({
                            minValue: Number((smallestVal + negativeBreakDiff).toFixed(3)),
                            maxValue: Number((smallestVal + (2 * negativeBreakDiff)).toFixed(3)),
                            symbol: new SimpleFillSymbol().setColor(new Color([218, 92, 10, 0.6])).setOutline(sls),
                            label: Number(((smallestVal + negativeBreakDiff) * 100).toFixed(1)) + ' - ' + Number(((smallestVal + (2 * negativeBreakDiff)) * 100).toFixed(1)) + '%'
                        });
                        renderer.addBreak({
                            minValue: Number((smallestVal + (2 * negativeBreakDiff)).toFixed(3)),
                            maxValue: -0.001,
                            symbol: new SimpleFillSymbol().setColor(new Color([254, 230, 151, 0.6])).setOutline(sls),
                            label: Number(((smallestVal + (2 * negativeBreakDiff)) * 100).toFixed(1)) + ' - <' + 0 + '%'
                        });
                        // zero
                        renderer.addBreak({
                            minValue: 0,
                            maxValue: 0.001,
                            symbol: new SimpleFillSymbol().setColor(new Color([128, 128, 128, 0.6])).setOutline(sls),
                            label: '0%'
                        });
                        // positive (5 classes)
                        renderer.addBreak({
                            minValue: 0.001,
                            maxValue: Number((largestVal - (4 * positiveBreakDiff)).toFixed(3)),
                            symbol: new SimpleFillSymbol().setColor(new Color([185, 231, 248, 0.6])).setOutline(sls),
                            label: '>0 - ' + Number(((largestVal - (4 * positiveBreakDiff)) * 100).toFixed(1)) + '%'
                        });
                        renderer.addBreak({
                            minValue: Number((largestVal - (4 * positiveBreakDiff)).toFixed(3)),
                            maxValue: Number((largestVal - (3 * positiveBreakDiff)).toFixed(3)),
                            symbol: new SimpleFillSymbol().setColor(new Color([79, 280, 252, 0.6])).setOutline(sls),
                            label: Number(((largestVal - (4 * positiveBreakDiff)) * 100).toFixed(1)) + ' - ' + Number(((largestVal - (3 * positiveBreakDiff)) * 100).toFixed(1)) + '%'
                        });
                        renderer.addBreak({
                            minValue: Number((largestVal - (3 * positiveBreakDiff)).toFixed(3)),
                            maxValue: Number((largestVal - (2 * positiveBreakDiff)).toFixed(3)),
                            symbol: new SimpleFillSymbol().setColor(new Color([0, 127, 216, 0.6])).setOutline(sls),
                            label: Number(((largestVal - (3 * positiveBreakDiff)) * 100).toFixed(1)) + ' - ' + Number(((largestVal - (2 * positiveBreakDiff)) * 100).toFixed(1)) + '%'
                        });
                        renderer.addBreak({
                            minValue: Number((largestVal - (2 * positiveBreakDiff)).toFixed(3)),
                            maxValue: Number((largestVal - positiveBreakDiff).toFixed(3)),
                            symbol: new SimpleFillSymbol().setColor(new Color([0, 0, 139, 0.6])).setOutline(sls),
                            label: Number(((largestVal - (2 * positiveBreakDiff)) * 100).toFixed(1)) + ' - ' + Number(((largestVal - positiveBreakDiff) * 100).toFixed(1)) + '%'
                        });
                        renderer.addBreak({
                            minValue: Number((largestVal - positiveBreakDiff).toFixed(3)),
                            maxValue: Number(largestVal.toFixed(3)),
                            symbol: new SimpleFillSymbol().setColor(new Color([175, 21, 137, 0.6])).setOutline(sls),
                            label: Number(((largestVal - positiveBreakDiff) * 100).toFixed(1)) + ' - ' + Number((largestVal * 100).toFixed(1)) + '%'
                        });
                    }
                    if (clim == "miTF" || clim == "mxTF") {
                        // compare the min and max of to domain, then whichever is largest number, the other side of break is max/min (9 total classes)
                        var largestVal = this._largestAbsVal(Math.ceil(this.maxVal), Math.floor(this.minVal));
                        var smallestVal = (-1 * largestVal);
                        var positiveBreakDiff = (largestVal / 5);
                        var negativeBreakDiff = (largestVal / 3);
                        // negative (3 classes)
                        renderer.addBreak(Number((smallestVal).toFixed(1)), Number((smallestVal + negativeBreakDiff).toFixed(1)), new SimpleFillSymbol().setColor(new Color([61, 92, 164, 0.6])).setOutline(sls));
                        renderer.addBreak(Number((smallestVal + negativeBreakDiff).toFixed(1)), Number((smallestVal + (2 * negativeBreakDiff)).toFixed(1)), new SimpleFillSymbol().setColor(new Color([104, 159, 201, 0.6])).setOutline(sls));
                        renderer.addBreak({
                            minValue: Number((smallestVal + (2 * negativeBreakDiff)).toFixed(1)),
                            maxValue: -0.001,
                            symbol: new SimpleFillSymbol().setColor(new Color([165, 210, 229, 0.6])).setOutline(sls),
                            label: Number(((largestVal - positiveBreakDiff) * 100).toFixed(1)) + ' - <' + 0
                        });
                        // zero (1 class)
                        renderer.addBreak({
                            minValue: 0,
                            maxValue: 0.001,
                            symbol: new SimpleFillSymbol().setColor(new Color([128, 128, 128, 0.6])).setOutline(sls),
                            label: '0'
                        });
                        // positive (5 classes)
                        renderer.addBreak({
                            minValue: 0.001,
                            maxValue: Number((largestVal - (4 * positiveBreakDiff)).toFixed(1)),
                            symbol: new SimpleFillSymbol().setColor(new Color([252, 219, 143, 0.6])).setOutline(sls),
                            label: '>0 - ' + Number((largestVal - (4 * positiveBreakDiff)).toFixed(1))
                        });
                        renderer.addBreak();
                        renderer.addBreak(Number((largestVal - (4 * positiveBreakDiff)).toFixed(1)), Number((largestVal - (3 * positiveBreakDiff)).toFixed(1)), new SimpleFillSymbol().setColor(new Color([250, 157, 91, 0.6])).setOutline(sls));
                        renderer.addBreak(Number((largestVal - (3 * positiveBreakDiff)).toFixed(1)), Number((largestVal - (2 * positiveBreakDiff)).toFixed(1)), new SimpleFillSymbol().setColor(new Color([233, 92, 59, 0.6])).setOutline(sls));
                        renderer.addBreak(Number((largestVal - (2 * positiveBreakDiff)).toFixed(1)), Number((largestVal - positiveBreakDiff).toFixed(1)), new SimpleFillSymbol().setColor(new Color([206, 45, 43, 0.6])).setOutline(sls));
                        renderer.addBreak(Number((largestVal - positiveBreakDiff).toFixed(1)), Number(largestVal.toFixed(1)), new SimpleFillSymbol().setColor(new Color([165, 0, 38, 0.6])).setOutline(sls));
                    }
                    if (clim == "PRin" || clim == "PEin") {
                        // compare the min and max of to domain, then whichever is largest number, the other side of break is max/min (9 total classes)
                        var largestVal = this._largestAbsVal(Math.ceil(this.maxVal), Math.floor(this.minVal));
                        var smallestVal = (-1 * largestVal);
                        var positiveBreakDiff = (largestVal / 5);
                        var negativeBreakDiff = (largestVal / 3);
                        // negative (3 classes)
                        renderer.addBreak(Number((smallestVal).toFixed(1)), Number((smallestVal + negativeBreakDiff).toFixed(1)), new SimpleFillSymbol().setColor(new Color([133, 46, 4, 0.6])).setOutline(sls));
                        renderer.addBreak(Number((smallestVal + negativeBreakDiff).toFixed(1)), Number((smallestVal + (2 * negativeBreakDiff)).toFixed(1)), new SimpleFillSymbol().setColor(new Color([218, 92, 10, 0.6])).setOutline(sls));
                        renderer.addBreak(Number((smallestVal + (2 * negativeBreakDiff)).toFixed(1)), -0.001, new SimpleFillSymbol().setColor(new Color([254, 230, 151, 0.6])).setOutline(sls));
                        // zero (1 class)
                        renderer.addBreak({
                            minValue: 0,
                            maxValue: 0.001,
                            symbol: new SimpleFillSymbol().setColor(new Color([128, 128, 128, 0.6])).setOutline(sls),
                            label: '0%'
                        });
                        // positive (5 classes)
                        renderer.addBreak({
                            minValue: 0.001,
                            maxValue: Number((largestVal - (4 * positiveBreakDiff)).toFixed(1)),
                            symbol: new SimpleFillSymbol().setColor(new Color([185, 231, 248, 0.6])).setOutline(sls),
                            label: '>0 - ' + Number((largestVal - (4 * positiveBreakDiff)).toFixed(1))
                        });
                        renderer.addBreak(Number((largestVal - (4 * positiveBreakDiff)).toFixed(1)), Number((largestVal - (3 * positiveBreakDiff)).toFixed(1)), new SimpleFillSymbol().setColor(new Color([79, 280, 252, 0.6])).setOutline(sls));
                        renderer.addBreak(Number((largestVal - (3 * positiveBreakDiff)).toFixed(1)), Number((largestVal - (2 * positiveBreakDiff)).toFixed(1)), new SimpleFillSymbol().setColor(new Color([0, 127, 216, 0.6])).setOutline(sls));
                        renderer.addBreak(Number((largestVal - (2 * positiveBreakDiff)).toFixed(1)), Number((largestVal - positiveBreakDiff).toFixed(1)), new SimpleFillSymbol().setColor(new Color([0, 0, 139, 0.6])).setOutline(sls));
                        renderer.addBreak(Number((largestVal - positiveBreakDiff).toFixed(1)), Number(largestVal.toFixed(1)), new SimpleFillSymbol().setColor(new Color([175, 21, 137, 0.6])).setOutline(sls));
                    }
                } else { // when the max value is greater than or equal to 0
                    if (clim == "PRfr" || clim == "PEfr") {
                        // max is the largest number, the min is -1 (7 total classes)
                        var largestVal = this.maxVal; // don't round fractions until the end
                        var smallestVal = -1;
                        var positiveBreakDiff = (largestVal / 5);
                        // negative (1 class)
                        renderer.addBreak({
                            minValue: Number((smallestVal).toFixed(3)),
                            maxValue: -0.001,
                            symbol: new SimpleFillSymbol().setColor(new Color([133, 46, 4, 0.6])).setOutline(sls),
                            label: '<0%'
                        });
                        // zero (1 class)
                        renderer.addBreak({
                            minValue: 0,
                            maxValue: 0.001,
                            symbol: new SimpleFillSymbol().setColor(new Color([128, 128, 128, 0.6])).setOutline(sls),
                            label: '0%'
                        });
                        // positive (5 classes)
                        renderer.addBreak({
                            minValue: 0.001,
                            maxValue: Number((largestVal - (4 * positiveBreakDiff)).toFixed(3)),
                            symbol: new SimpleFillSymbol().setColor(new Color([185, 231, 248, 0.6])).setOutline(sls),
                            label: '>0 - ' + Number(((largestVal - (4 * positiveBreakDiff)) * 100).toFixed(1)) + '%'
                        });
                        renderer.addBreak({
                            minValue: Number((largestVal - (4 * positiveBreakDiff)).toFixed(3)),
                            maxValue: Number((largestVal - (3 * positiveBreakDiff)).toFixed(3)),
                            symbol: new SimpleFillSymbol().setColor(new Color([79, 280, 252, 0.6])).setOutline(sls),
                            label: Number(((largestVal - (4 * positiveBreakDiff)) * 100).toFixed(1)) + ' - ' + Number(((largestVal - (3 * positiveBreakDiff)) * 100).toFixed(1)) + '%'
                        });
                        renderer.addBreak({
                            minValue: Number((largestVal - (3 * positiveBreakDiff)).toFixed(3)),
                            maxValue: Number((largestVal - (2 * positiveBreakDiff)).toFixed(3)),
                            symbol: new SimpleFillSymbol().setColor(new Color([0, 127, 216, 0.6])).setOutline(sls),
                            label: Number(((largestVal - (3 * positiveBreakDiff)) * 100).toFixed(1)) + ' - ' + Number(((largestVal - (2 * positiveBreakDiff)) * 100).toFixed(1)) + '%'
                        });
                        renderer.addBreak({
                            minValue: Number((largestVal - (2 * positiveBreakDiff)).toFixed(3)),
                            maxValue: Number((largestVal - positiveBreakDiff).toFixed(3)),
                            symbol: new SimpleFillSymbol().setColor(new Color([0, 0, 139, 0.6])).setOutline(sls),
                            label: Number(((largestVal - (2 * positiveBreakDiff)) * 100).toFixed(1)) + ' - ' + Number(((largestVal - positiveBreakDiff) * 100).toFixed(1)) + '%'
                        });
                        renderer.addBreak({
                            minValue: Number((largestVal - positiveBreakDiff).toFixed(3)),
                            maxValue: Number(largestVal.toFixed(3)),
                            symbol: new SimpleFillSymbol().setColor(new Color([175, 21, 137, 0.6])).setOutline(sls),
                            label: Number(((largestVal - positiveBreakDiff) * 100).toFixed(1)) + ' - ' + Number((largestVal * 100).toFixed(1)) + '%'
                        });
                    }
                    if (clim == "miTF" || clim == "mxTF") {
                        // max is the largest number, the min is -1 (7 total classes)
                        var largestVal = Math.ceil(this.maxVal);
                        var smallestVal = -1;
                        var positiveBreakDiff = (largestVal / 5);
                        // negative (1 class)
                        renderer.addBreak({
                            minValue: Number((smallestVal).toFixed(1)),
                            maxValue: -0.001,
                            symbol: new SimpleFillSymbol().setColor(new Color([61, 92, 164, 0.6])).setOutline(sls),
                            label: '<0'
                        });
                        // zero (1 class)
                        renderer.addBreak({
                            minValue: 0,
                            maxValue: 0.001,
                            symbol: new SimpleFillSymbol().setColor(new Color([128, 128, 128, 0.6])).setOutline(sls),
                            label: '0'
                        });
                        // positive (5 classes)
                        renderer.addBreak({
                            minValue: 0.001,
                            maxValue: Number((largestVal - (4 * positiveBreakDiff)).toFixed(1)),
                            symbol: new SimpleFillSymbol().setColor(new Color([252, 219, 143, 0.6])).setOutline(sls),
                            label: '>0 - ' + Number((largestVal - (4 * positiveBreakDiff)).toFixed(1))
                        });
                        renderer.addBreak(Number((largestVal - (4 * positiveBreakDiff)).toFixed(1)), Number((largestVal - (3 * positiveBreakDiff)).toFixed(1)), new SimpleFillSymbol().setColor(new Color([250, 157, 91, 0.6])).setOutline(sls));
                        renderer.addBreak(Number((largestVal - (3 * positiveBreakDiff)).toFixed(1)), Number((largestVal - (2 * positiveBreakDiff)).toFixed(1)), new SimpleFillSymbol().setColor(new Color([233, 92, 59, 0.6])).setOutline(sls));
                        renderer.addBreak(Number((largestVal - (2 * positiveBreakDiff)).toFixed(1)), Number((largestVal - positiveBreakDiff).toFixed(1)), new SimpleFillSymbol().setColor(new Color([206, 45, 43, 0.6])).setOutline(sls));
                        renderer.addBreak(Number((largestVal - positiveBreakDiff).toFixed(1)), Number(largestVal.toFixed(1)), new SimpleFillSymbol().setColor(new Color([165, 0, 38, 0.6])).setOutline(sls));
                    }
                    if (clim == "PRin" || clim == "PEin") {
                        // max is the largest number, the min is -1 (7 total classes)
                        var largestVal = Math.ceil(this.maxVal);
                        var smallestVal = -1;
                        var positiveBreakDiff = (largestVal / 5);
                        // negative (1 class)
                        renderer.addBreak({
                            minValue: Number((smallestVal).toFixed(1)),
                            maxValue: -0.001,
                            symbol: new SimpleFillSymbol().setColor(new Color([133, 46, 4, 0.6])).setOutline(sls),
                            label: '<0'
                        });
                        // zero (1 class)
                        renderer.addBreak({
                            minValue: 0,
                            maxValue: 0.001,
                            symbol: new SimpleFillSymbol().setColor(new Color([128, 128, 128, 0.6])).setOutline(sls),
                            label: '0'
                        });
                        // positive (5 classes)
                        //TODO: greater than zero label
                        renderer.addBreak({
                            minValue: 0.001,
                            maxValue: Number((largestVal - (4 * positiveBreakDiff)).toFixed(1)),
                            symbol: new SimpleFillSymbol().setColor(new Color([185, 231, 248, 0.6])).setOutline(sls),
                            label: '>0 - ' + Number((largestVal - (4 * positiveBreakDiff)).toFixed(1))
                        });
                        renderer.addBreak(Number((largestVal - (4 * positiveBreakDiff)).toFixed(1)), Number((largestVal - (3 * positiveBreakDiff)).toFixed(1)), new SimpleFillSymbol().setColor(new Color([79, 280, 252, 0.6])).setOutline(sls));
                        renderer.addBreak(Number((largestVal - (3 * positiveBreakDiff)).toFixed(1)), Number((largestVal - (2 * positiveBreakDiff)).toFixed(1)), new SimpleFillSymbol().setColor(new Color([0, 127, 216, 0.6])).setOutline(sls));
                        renderer.addBreak(Number((largestVal - (2 * positiveBreakDiff)).toFixed(1)), Number((largestVal - positiveBreakDiff).toFixed(1)), new SimpleFillSymbol().setColor(new Color([0, 0, 139, 0.6])).setOutline(sls));
                        renderer.addBreak(Number((largestVal - positiveBreakDiff).toFixed(1)), Number(largestVal.toFixed(1)), new SimpleFillSymbol().setColor(new Color([175, 21, 137, 0.6])).setOutline(sls));
                    }
                };
                this._applyRenderer(renderer);
            },

            _applyRenderer: function (renderer) {
                var fieldname = "ME" + dojo.byId("seasonSelectionOCONUS").value + this.climVarOCONUS.value + dojo.byId("periodSelectionOCONUS").value;
                oLayerId = "NEXGDDP" + this.domainOCONUS.value + dojo.byId("modelSelectionOCONUS").value + fieldname;
                map.getLayer(oLayerId).setRenderer(renderer);
                map.getLayer(oLayerId).show();
            },

            _errorHandler: function (error) {
                console.log("error: ", JSON.stringify(error));
            },

            _executeQueryTask: function (evt, url, domain, fieldname, popupTitle) {
                var domain = domain;
                var field = fieldname;
                var minfield = "MI" + field.substring(2);
                var maxfield = "MX" + field.substring(2);
                var queryTask = new QueryTask(url);
                var query = new Query();
                query.geometry = evt.mapPoint;
                query.returnGeometry = true;
                query.where = "domain = '" + `${domain}` + "'";
                query.outFields = ["HUC_12", minfield, field, maxfield];
                if (fieldname.includes("PRfr") || fieldname.includes("PEfr")) {
                    queryTask.execute(query).then(results => {
                        if (results.features.length >= 1) {
                            map.infoWindow.resize("315px");
                            map.infoWindow.setTitle(popupTitle);
                            map.infoWindow.setContent(this._buildOconusPopupJson(results.features[0].attributes['HUC_12'],
                                Number(((results.features[0].attributes[minfield]) * 100).toFixed(1)) + '%',
                                Number(((results.features[0].attributes[field]) * 100).toFixed(1)) + '%',
                                Number(((results.features[0].attributes[maxfield]) * 100).toFixed(1)) + '%'));
                            map.infoWindow.show(evt.screenPoint);

                            var highlightSymbol = new SimpleFillSymbol(
                                SimpleFillSymbol.STYLE_SOLID,
                                new SimpleLineSymbol(
                                    SimpleLineSymbol.STYLE_SOLID,
                                    new Color([0, 255, 255]), 1
                                ),
                                new Color([125, 125, 125, 0.1])
                            );
                            var highlightGraphic = new Graphic(results.features[0].geometry, highlightSymbol);
                            map.graphics.add(highlightGraphic);
                        }
                    });
                } else {
                    queryTask.execute(query).then(results => {
                        if (results.features.length >= 1) {
                            map.infoWindow.resize("315px");
                            map.infoWindow.setTitle(popupTitle);
                            map.infoWindow.setContent(this._buildOconusPopupJson(results.features[0].attributes['HUC_12'],
                                Number((results.features[0].attributes[minfield]).toFixed(1)),
                                Number((results.features[0].attributes[field]).toFixed(1)),
                                Number((results.features[0].attributes[maxfield]).toFixed(1))));
                            map.infoWindow.show(evt.screenPoint);

                            var highlightSymbol = new SimpleFillSymbol(
                                SimpleFillSymbol.STYLE_SOLID,
                                new SimpleLineSymbol(
                                    SimpleLineSymbol.STYLE_SOLID,
                                    new Color([0, 255, 255]), 1
                                ),
                                new Color([125, 125, 125, 0.1])
                            );
                            var highlightGraphic = new Graphic(results.features[0].geometry, highlightSymbol);
                            map.graphics.add(highlightGraphic);
                        }
                    });
                }
            },

            _buildOconusPopupJson: (huc12, min, mean, max) => {
                var oTable = `<table id='Oconus'><tr id='Oconus'><td>HUC 12</td><td>${huc12}</td></tr><tr id='Oconus'><td>Ensemble Minimum of Changes</td><td>${min}</td></tr><tr id='Oconus'><td>Ensemble Median of Changes</td><td>${mean}</td></tr><tr id='Oconus'><td>Ensemble Maximum of Changes</td><td>${max}</td></tr></table>`
                return oTable
            },

            _buildOconusId: () => {
                var season = dojo.byId("seasonSelectionOCONUS");
                var clim = dojo.byId("climateSelectionOCONUS");
                var period = dojo.byId("periodSelectionOCONUS");
                return ('Median ' + season.options[season.selectedIndex].text + ' ' + clim.options[clim.selectedIndex].text + ', ' + period.options[period.selectedIndex].text)
            },

            _buildOconusField: () => {
                // Need to build the field name from selections
                return ("ME" + dojo.byId("seasonSelectionOCONUS").value + dojo.byId("climateSelectionOCONUS").value + dojo.byId("periodSelectionOCONUS").value)
            },
        });
    });
