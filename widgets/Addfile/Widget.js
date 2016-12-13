define([
        'dojo/_base/declare',
        'jimu/BaseWidget',
        'dojo/on',
        'dojo/sniff',
        'esri/request',
        'esri/geometry/scaleUtils',
        'dojo/_base/lang',
        'dojo/dom',
        'dojo/_base/array',
        'dojo/dom-style',
        'esri/layers/FeatureLayer',
        'esri/InfoTemplate',
        'esri/renderers/SimpleRenderer',
        'esri/symbols/PictureMarkerSymbol',
        'esri/symbols/SimpleFillSymbol',
        'esri/symbols/SimpleLineSymbol',
        'esri/Color',
        'dojox/data/CsvStore',
        'esri/geometry/webMercatorUtils',
        'esri/geometry/Point',
        'esri/geometry/Multipoint',
        'jimu/dijit/RadioBtn',
    ],
    function (declare,
              BaseWidget,
              on,
              sniff,
              request,
              scaleUtils,
              lang,
              dom,
              arrayUtils,
              domStyle,
              FeatureLayer,
              InfoTemplate,
              SimpleRenderer,
              PictureMarkerSymbol,
              SimpleFillSymbol,
              SimpleLineSymbol,
              Color,
              CsvStore,
              webMercatorUtils,
              Point,
              Multipoint,
              RadioBtn) {

            var latFieldStrings = ["lat", "latitude", "y", "ycenter"];
            var longFieldStrings = ["lon", "long", "longitude", "x", "xcenter"];
            var dataCSV;
            var thisWidget;


        return declare([BaseWidget], {

            baseClass: 'jimu-widget-addfile',
            portalUrl: 'http://www.arcgis.com',

             postCreate: function() {
               this.inherited(arguments);
               console.log('postCreate');
             },

            startup: function () {
                this.inherited(arguments);
                thisWidget = this;
                //this._initTabContainer();

                on(this.uploadForm, "change", lang.hitch(this, function (event) {
                    var fileName = event.target.value.toLowerCase();

                    if (sniff("ie")) { //filename is full path in IE so extract the file name
                        var arr = fileName.split("\\");
                        fileName = arr[arr.length - 1];
                    }
                    if (fileName.indexOf(".zip") !== -1) {//is file a zip - if not notify user
                        //close the .csv form incase it is visible
                        domStyle.set("fieldForm", "display", "none");
                        //Add shapefile
                        this.generateFeatureCollection(fileName);
                    }
                    else if (fileName.indexOf(".csv") !== -1) {

                        var file = event.target.files[0]; // that's right I'm only reading one file
                        this.handleCSV(file);
                        //this.populateFieldForm(file);
                    }
                    else {
                        this.uploadstatus.innerHTML = '<p style="color:red">Please add file</p>';
                    }
                }));
            },

            onOpen: function () {
                fileUpload = this;
                console.log('onOpen');
            },

            onClose: function () {
                console.log('onClose');
            },

            generateFeatureCollection: function (fileName) {
                var name = fileName.split(".");
                //Chrome and IE add c:\fakepath to the value - we need to remove it
                //See this link for more info: http://davidwalsh.name/fakepath
                name = name[0].replace("c:\\fakepath\\", "");

                this.uploadstatus.innerHTML = '<b>Loading… </b>' + name;

                //Define the input params for generate see the rest doc for details
                //http://www.arcgis.com/apidocs/rest/index.html?generate.html
                var params = {
                    'name': name,
                    'targetSR': this.map.spatialReference,
                    'maxRecordCount': 1000,
                    'enforceInputFileSizeLimit': true,
                    'enforceOutputJsonSizeLimit': true
                };

                //generalize features for display Here we generalize at 1:40,000 which is approx 10 meters
                //This should work well when using web mercator.
                var extent = scaleUtils.getExtentForScale(this.map, 40000);
                var resolution = extent.getWidth() / this.map.width;
                params.generalize = true;
                params.maxAllowableOffset = resolution;
                params.reducePrecision = true;
                params.numberOfDigitsAfterDecimal = 0;

                var myContent = {
                    'filetype': 'shapefile',
                    'publishParameters': JSON.stringify(params),
                    'f': 'json',
                    'callback.html': 'textarea'
                };

                //use the rest generate operation to generate a feature collection from the zipped shapefile
                request({
                    url: this.portalUrl + '/sharing/rest/content/features/generate',
                    content: myContent,
                    timeout: 60000,
                    form: this.uploadForm,
                    handleAs: 'json',
                    load: lang.hitch(this, function (response) {
                        if (response.error) {
                            this.errorHandler(response.error);
                            return;
                        }
                        var layerName = response.featureCollection.layers[0].layerDefinition.name;
                        this.uploadstatus.innerHTML = '<b>Loaded: </b>' + layerName;
                        this.addShapefileToMap(response.featureCollection);
                    }),
                    error: lang.hitch(this, this.errorHandler)
                });
            },

            errorHandler: function (error) {
                this.uploadstatus.innerHTML = "<p style='color:red'>" + error.message + "</p>";
            },

            addShapefileToMap: function (featureCollection) {
                //add the shapefile to the map and zoom to the feature collection extent
                //If you want to persist the feature collection when you reload browser you could store the collection in
                //local storage by serializing the layer using featureLayer.toJson()  see the 'Feature Collection in Local Storage' sample
                //for an example of how to work with local storage.
                var fullExtent;
                var layers = [];

                arrayUtils.forEach(featureCollection.layers, lang.hitch(this, function (layer) {
                    //var infoTemplate = new InfoTemplate("Details", "${*}");
                    var featureLayer = new FeatureLayer(layer, {
                        //infoTemplate: infoTemplate
                    });
                    featureLayer.id = window.addedLayerIdPrefix + featureLayer.name;
                    window.layerID_Portal_WebMap.push(featureLayer.id);

                    //associate the feature with the popup on click to enable highlight and zoom to
                    featureLayer.on('click', function (event) {
                        //dd.map.infoWindow.setFeatures([event.graphic]);
                    });
                    //change default symbol if desired. Comment this out and the layer will draw with the default symbology
                    this.changeRenderer(featureLayer);
                    fullExtent = fullExtent ?
                        fullExtent.union(featureLayer.fullExtent) : featureLayer.fullExtent;
                    layers.push(featureLayer);
                }));
                this.map.addLayers(layers);
                this.map.setExtent(fullExtent.expand(1.25), true);

                this.uploadstatus.innerHTML = "";
            },

            changeRenderer: function (layer) {
                //change the default symbol for the feature collection for polygons and points
                var symbol = null;
                switch (layer.geometryType) {
                    case 'esriGeometryPoint':
                        symbol = new PictureMarkerSymbol({
                            'angle': 0,
                            'xoffset': 0,
                            'yoffset': 0,
                            'type': 'esriPMS',
                            'url': 'http://static.arcgis.com/images/Symbols/Shapes/BluePin1LargeB.png',
                            'contentType': 'image/png',
                            'width': 20,
                            'height': 20
                        });
                        break;
                    case 'esriGeometryPolygon':
                        symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                            new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                                new Color([112, 112, 112]), 1), new Color([136, 136, 136, 0.25]));
                        break;
                }
                if (symbol) {
                    layer.setRenderer(new SimpleRenderer(symbol));
                }
            },

            //Begin processing csv data
            handleCSV: function (file) {
                //alert("CSV");
                csvFileName = file.name;
                console.log("Processing CSV: ", file, ", ", file.name, ", ", file.type, ", ", file.size);
                if (file.data) {
                    var decoded = this.bytesToString(base64.decode(file.data));
                    //this.processCSVData(decoded);
                    //fileUpload.processCSVData(decoded);
                    thisWidget.populateFieldForm(decoded);
                }
                else {
                    var reader = new FileReader();
                    reader.onload = function () {
                        console.log("Finished reading CSV data");
                        //fileUpload.processCSVData(reader.result);
                        thisWidget.populateFieldForm(reader.result);
                        //this.processCSVData(reader.result);
                    };
                    reader.readAsText(file);
                }
            },
            populateFieldForm: function(data){
                //get first line with field names
                var newLineIndex = data.indexOf("\n");
                var firstLine = lang.trim(data.substr(0, newLineIndex));
                var cFieldNames = firstLine.split(",");
                //alert(cFieldNames);
                //thisWidget.latField.innerHTML="<a>Hello</a>";

                arrayUtils.forEach(cFieldNames, function(col){
                    //option elements
                    var xOption = document.createElement("option");
                    var yOption = document.createElement("option");
                    xOption.text = col;
                    yOption.text = col;
                    thisWidget.latField.add(xOption);
                    thisWidget.longField.add(yOption);
                });

                on(this.addToMap, "click", this.processCSVData);

                dataCSV = data;

                //Display coord field dropdowns
                domStyle.set("fieldForm", "display", "inline");
            },
            //Process csv
            processCSVData: function () {
                fileUpload.uploadstatus.innerHTML = '<b>Loading… </b>' + name;
                //pass csv data
                var data = dataCSV;

                var newLineIndex = data.indexOf("\n");
                var firstLine = lang.trim(data.substr(0, newLineIndex)); //remove extra whitespace, not sure if I need to do this since I threw out space delimiters
                var separator = fileUpload.getSeparator(firstLine);
                var csvStore = new CsvStore({
                    data: data,
                    separator: separator
                });

                csvStore.fetch({
                    onComplete: function (items) {
                        var objectId = 0;
                        var featureCollection = fileUpload.generateFeatureCollectionTemplateCSV(csvStore, items);
                        var popupInfo = fileUpload.generateDefaultPopupInfo(featureCollection);
                        var infoTemplate = new InfoTemplate(fileUpload.buildInfoTemplate(popupInfo));

                        var latField = thisWidget.latField.value;
                        var longField = thisWidget.longField.value;
                       // var projection = thisWidget.projection.value;
                        //alert(thisWidget.latField.value);
                        var fieldNames = csvStore.getAttributes(items[0]);
                        //arrayUtils.forEach(fieldNames, function (fieldName) {
                        //    var matchId;
                        //    matchId = arrayUtils.indexOf(latFieldStrings,
                        //        fieldName.toLowerCase());
                        //
                        //    if (matchId !== -1) {
                        //        latField = fieldName;
                        //    }
                        //
                        //    matchId = arrayUtils.indexOf(longFieldStrings,
                        //        fieldName.toLowerCase());
                        //    if (matchId !== -1) {
                        //        longField = fieldName;
                        //    }
                        //});

                        // Add records in this CSV store as graphics
                        arrayUtils.forEach(items, function (item) {
                            var attrs = csvStore.getAttributes(item),
                                attributes = {};
                            // Read all the attributes for  this record/item
                            arrayUtils.forEach(attrs, function (attr) {
                                var value = Number(csvStore.getValue(item, attr));
                                attributes[attr] = isNaN(value) ? csvStore.getValue(item, attr) : value;
                            });

                            attributes["__OBJECTID"] = objectId;
                            objectId++;

                            var geometry;

                            var latitude = parseFloat(attributes[latField]);
                            var longitude = parseFloat(attributes[longField]);

                            if (isNaN(latitude) || isNaN(longitude)) {
                                return;
                            }
                            //Logic for allowing user selection of Projection
                            //if(projection == "Web Mercator"){
                            //    //alert("Web Mercator");
                            //    geometry = new Point(longitude, latitude);
                            //}else if(projection == "Lat/Long"){
                            //    //alert("Lat/Long");
                            //    geometry = webMercatorUtils.geographicToWebMercator(new Point(longitude, latitude));
                            //}else if(projection == "US Albers") {
                            //    //alert("US albers");
                            //    //geometry = webMercatorUtils
                            //}else{
                            //    //geometry = webMercatorUtils.geographicToWebMercator(new Point(longitude, latitude));
                            //}

                            geometry = webMercatorUtils.geographicToWebMercator(new Point(longitude, latitude));

                            var feature = {
                                "geometry": geometry.toJson(),
                                "attributes": attributes
                            };
                            featureCollection.featureSet.features.push(feature);
                        });

                        var featureLayerCSV = new FeatureLayer(featureCollection, {
                            infoTemplate: infoTemplate,
                            id: window.addedLayerIdPrefix + csvFileName,
                            name: csvFileName
                        });
                        featureLayerCSV.__popupInfo = popupInfo;
                        window.layerID_Portal_WebMap.push(window.addedLayerIdPrefix + csvFileName);
                        fileUpload.map.addLayer(featureLayerCSV);
                        fileUpload.zoomToData(featureLayerCSV);

                        fileUpload.uploadstatus.innerHTML = "";
                        domStyle.set("fieldForm", "display", "none");
                    },
                    onError: function (error) {
                        console.error("Error fetching items from CSV store: ", error);
                        fileUpload.uploadstatus.innerHTML = "<p style='color:red'>" + error.message + "</p>";
                    }
                });
            },

            getSeparator: function (string) {
                var separators = [",", "      ", ";", "|"];
                var maxSeparatorLength = 0;
                var maxSeparatorValue = "";
                arrayUtils.forEach(separators, function (separator) {
                    var length = string.split(separator).length;
                    if (length > maxSeparatorLength) {
                        maxSeparatorLength = length;
                        maxSeparatorValue = separator;
                    }
                });
                return maxSeparatorValue;
            },
            generateFeatureCollectionTemplateCSV: function(store, items){
                //create a feature collection for the input csv file
                var featureCollection = {
                    "layerDefinition": null,
                    "featureSet": {
                        "features": [],
                        "geometryType": "esriGeometryPoint"
                    }
                };
                featureCollection.layerDefinition = {
                    "geometryType": "esriGeometryPoint",
                    "objectIdField": "__OBJECTID",
                    "type": "Feature Layer",
                    "typeIdField": "",
                    "drawingInfo": {
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
                    },
                    "fields": [
                        {
                            "name": "__OBJECTID",
                            "alias": "__OBJECTID",
                            "type": "esriFieldTypeOID",
                            "editable": false,
                            "domain": null
                        }
                    ],
                    "types": [],
                    "capabilities": "Query"
                };

                var fields = store.getAttributes(items[0]);
                arrayUtils.forEach(fields, function (field) {
                    var value = store.getValue(items[0], field);
                    var parsedValue = Number(value);
                    if (isNaN(parsedValue)) { //check first value and see if it is a number
                        featureCollection.layerDefinition.fields.push({
                            "name": field,
                            "alias": field,
                            "type": "esriFieldTypeString",
                            "editable": true,
                            "domain": null
                        });
                    }
                    else {
                        featureCollection.layerDefinition.fields.push({
                            "name": field,
                            "alias": field,
                            "type": "esriFieldTypeDouble",
                            "editable": true,
                            "domain": null
                        });
                    }
                });
                return featureCollection;
            },
            generateDefaultPopupInfo: function(featureCollection){
                var fields = featureCollection.layerDefinition.fields;
                var decimal = {
                    'esriFieldTypeDouble': 1,
                    'esriFieldTypeSingle': 1
                };
                var integer = {
                    'esriFieldTypeInteger': 1,
                    'esriFieldTypeSmallInteger': 1
                };
                var dt = {
                    'esriFieldTypeDate': 1
                };
                var displayField = null;
                var fieldInfos = arrayUtils.map(fields,
                    lang.hitch(this, function (item) {
                        if (item.name.toUpperCase() === "NAME") {
                            displayField = item.name;
                        }
                        var visible = (item.type !== "esriFieldTypeOID" &&
                        item.type !== "esriFieldTypeGlobalID" &&
                        item.type !== "esriFieldTypeGeometry");
                        var format = null;
                        if (visible) {
                            var f = item.name.toLowerCase();
                            var hideFieldsStr = ",stretched value,fnode_,tnode_,lpoly_,rpoly_,poly_,subclass,subclass_,rings_ok,rings_nok,";
                            if (hideFieldsStr.indexOf("," + f + ",") > -1 ||
                                f.indexOf("area") > -1 || f.indexOf("length") > -1 ||
                                f.indexOf("shape") > -1 || f.indexOf("perimeter") > -1 ||
                                f.indexOf("objectid") > -1 || f.indexOf("_") == f.length - 1 ||
                                f.indexOf("_i") == f.length - 2) {
                                visible = false;
                            }
                            if (item.type in integer) {
                                format = {
                                    places: 0,
                                    digitSeparator: true
                                };
                            }
                            else if (item.type in decimal) {
                                format = {
                                    places: 2,
                                    digitSeparator: true
                                };
                            }
                            else if (item.type in dt) {
                                format = {
                                    dateFormat: 'shortDateShortTime'
                                };
                            }
                        }

                        return lang.mixin({}, {
                            fieldName: item.name,
                            label: item.alias,
                            isEditable: false,
                            tooltip: "",
                            visible: visible,
                            format: format,
                            stringFieldOption: 'textbox'
                        });
                    }));

                var popupInfo = {
                    title: displayField ? '{' + displayField + '}' : '',
                    fieldInfos: fieldInfos,
                    description: null,
                    showAttachments: false,
                    mediaInfos: []
                };
                return popupInfo;
            },
            buildInfoTemplate: function(popupInfo){
                var json = {
                    content: "<table>"
                };

                arrayUtils.forEach(popupInfo.fieldInfos, function (field) {
                    if (field.visible) {
                        json.content += "<tr><td valign='top'>" + field.label +
                            ": <\/td><td valign='top'>${" + field.fieldName + "}<\/td><\/tr>";
                    }
                });
                json.content += "<\/table>";
                return json;
            },
            zoomToData: function(featureLayer){
                // Zoom to the collective extent of the data
                var multipoint = new Multipoint(this.map.spatialReference);
                arrayUtils.forEach(featureLayer.graphics, function (graphic) {
                    var geometry = graphic.geometry;
                    if (geometry) {
                        multipoint.addPoint({
                            x: geometry.x,
                            y: geometry.y
                        });
                    }
                });

                if (multipoint.points.length > 0) {
                    this.map.setExtent(multipoint.getExtent().expand(1.25), true);
                }
            },

        });
    });
