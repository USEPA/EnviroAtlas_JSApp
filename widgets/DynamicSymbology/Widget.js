dynamicSymbology = {};
currentSymbology = {};
lookforEnviroatlas = "enviroatlas";
lookforNational = "National";
lookforCommunities = "Communities";
	  var  createRadioElement = function( name, checked ) {
	      var radioInput;
	      try {
	         var radioHtml = '<input type="radio" name="' + name + '"';
	         if ( checked ) {
	            radioHtml += ' checked="checked"';
	         }
	         radioHtml += '/>';
	         radioInput = document.createElement(radioHtml);
	      } catch( err ) {
	         radioInput = document.createElement('input');
	         radioInput.setAttribute('type', 'radio');
	         radioInput.setAttribute('name', name);
	         if ( checked ) {
	            radioInput.setAttribute('checked', 'checked');
	         }
	      }
	
	      return radioInput;
	    };
define(['dojo/_base/declare',
        'jimu/BaseWidget',
        'jimu/LayerInfos/LayerInfos',
        "dojo/dom",
        "dojo/dom-construct",
        "dojo/on",
        "dojo/dom-style",
        "esri/map",
        "esri/styles/choropleth",
        "esri/Color",
        "esri/dijit/ColorInfoSlider",
        "esri/dijit/ClassedColorSlider",
        "esri/renderers/smartMapping",
        "esri/layers/FeatureLayer",
        "esri/plugins/FeatureLayerStatistics",
        "esri/renderers/ClassBreaksRenderer",
        "esri/symbols/SimpleFillSymbol",
        "esri/symbols/SimpleLineSymbol",
        "esri/symbols/SimpleMarkerSymbol",
        "esri/dijit/util/busyIndicator",
        "esri/dijit/SymbolStyler",
        "dijit/ColorPalette",
        "dijit/form/Select",
        "dijit/form/NumberSpinner",
        "dijit/form/HorizontalSlider",
        "dijit/form/HorizontalRule",
        "dijit/form/HorizontalRuleLabels",
        "dijit/TooltipDialog",
        "dijit/form/DropDownButton",
        "dijit/form/Button",
        "dijit/form/RadioButton",
        "dijit/popup",
        "dojo/parser"],
    function (declare, BaseWidget, LayerInfos, dom, domConstruct, on, domStyle, Map, esriStylesChoropleth, Color, ColorInfoSlider,
        ClassedColorSlider, smartMapping, FeatureLayer, FeatureLayerStatistics,
        ClassBreaksRenderer, SimpleFillSymbol, SimpleLineSymbol, SimpleMarkerSymbol, busyIndicator, SymbolStyler,
        ColorPalette, select, NumberSpinner, HorizontalSlider, HorizontalRule, HorizontalRuleLabels, TooltipDialog, DropDownButton,
        Button, RadioButton, popup) {

    //To create a widget, you need to derive from BaseWidget.
    return declare([BaseWidget], {
        // DemoWidget code goes here

        //please note that this property is be set by the framework when widget is loaded.
        //templateString: template,

        baseClass: 'jimu-widget-demo',
        _busyIndicator: null,
        _layerID: null,
        _fieldID: null,
        _fieldName: null,
        _ClassificationMethod: null,
        _NumberOfClasses: null,
        _currentBaseMap: null,
        _scheme: null,
        _symbol: null,
        _style: null,
        _color: null,
        _outline: null,
        _sliderValueChange: null,
        featureLayerStatistics: null,
        renderer: null,       

		
        _BusyIndicator: function () {
            return busyIndicator.create("esri-colorinfoslider1");
        },

        postCreate: function () {
            this.inherited(arguments);
            //console.log('postCreate');

        },

        startup: function () {
            this.inherited(arguments);
            _scheme = null;

            this.fetchDataByName('LayerList');

            console.log('startup');
            //Needed variables
            map = this.map;

            var curColor = new Color([92, 92, 92]);

            dynamicSymbology.isSmartMapping = true;
        },

        onReceiveData: function (name, widgetId, data, historyData) {
            console.log("onRecieveData", data.message);
            //dom.byId('title').innerHTML = data.message;
            if (name === 'LayerList') {
                _layerID = data.message;
            }
        },
		onOpen: function () {
        //startup: function () {
            selfDynamicSymbology = this;
            _busy = busyIndicator.create("esri-colorinfoslider-container");

            schemes = esriStylesChoropleth.getSchemes({
                    basemap: "hybrid",
                    geometryType: "polygon",
                    theme: "high-to-low"
                });

            //Create content for schemes dialog
            var stylerNode = domConstruct.create("div");
            var stylerButtons = domConstruct.create("div");
            var okButtonDiv = domConstruct.create("div");
            var cancelButtonDiv = domConstruct.create("div");
            var contentsNode = domConstruct.create("div");
            domConstruct.place(okButtonDiv, stylerButtons);
            domConstruct.place(cancelButtonDiv, stylerButtons);
            domConstruct.place(stylerNode, contentsNode);
            domConstruct.place(stylerButtons, contentsNode);

            styleDialog = new TooltipDialog({
                    style: "width: 300px;",
                    onOpen: selfDynamicSymbology._openSymbolStyler
                });
            styleDialog.attr('content', contentsNode);

            symbolStyler = new SymbolStyler({
                    portal: "https://epa.maps.arcgis.com"
                }, stylerNode); //this.symbolStyler
            var okButton = new Button({
                    label: "OK",
                    onClick: selfDynamicSymbology._getStyle
                }, okButtonDiv).startup();

            var cancelButton = new Button({
                    label: "Cancel",
                    onClick: function () {
                        popup.close(styleDialog);
                    }
                }, cancelButtonDiv).startup();

            displaySymbolStyler = new DropDownButton({
                    label: "Symbology",
                    dropDown: styleDialog
                });
            dom.byId("dropDownButtonContainer").appendChild(displaySymbolStyler.domNode);
            displaySymbolStyler.startup();
            symbolStyler.startup();

            console.log('onOpen');
            //Get base map
            _currentBaseMap = this.map.getBasemap();

            dynamicSymbology.isSmartMapping = true;

            LayerInfos.getInstance(this.map, this.map.itemInfo).then(function (layerInfosObject) {

                var dslayer = layerInfosObject.getLayerInfoById(_layerID);
                dom.byId('title').innerHTML = dslayer.title;
                //alert("layer type : " + dslayer.parentLayerInfo.layerObject.layerInfos.length);//dynamic layer
                //alert("layer type if Feature Layer: " + dslayer.layerObject.type);//for Feature Layer

                //Set layers

                if (dslayer.layerObject.type == "Feature Layer") { //if the layer is feature layer

	                geoenrichedFeatureLayer = selfDynamicSymbology.map.getLayer(_layerID);
	                // var str = geoenrichedFeatureLayer.url;
	                // var lookfor = "National";
	                // if(str.includes(lookfor)){
	                //      //turn off cache layer eaLyrNum  "tiledNum_119"
	                //     var res = _layerID.split("_");
	                //     var cacheLayer = dynamicSym.map.getLayer("tiledNum_" + res[1]);
	                //     cacheLayer.setVisibility(false);
	                //     geoenrichedFeatureLayer.setVisibility(true);
	                // }
					
	                var str = geoenrichedFeatureLayer.url;
		            
		            if (str.indexOf(lookforEnviroatlas) > -1 ) {
		                if (str.indexOf(lookforNational) > -1) {
		                    //add warning for national data
		                    domStyle.set(dom.byId('nationalDSWarning'), "display", "inline");
		                    geoenrichedFeatureLayer.setDefinitionExpression(geoenrichedFeatureLayer.renderer.attributeField + " >= 0" + " AND " + geoenrichedFeatureLayer.renderer.attributeField + " IS NOT Null");
		                } else  if (str.indexOf(lookforCommunities) > -1){
		                    domStyle.set(dom.byId('nationalDSWarning'), "display", "none");
		                    if (window.communitySelected != "AllCommunity") {
		                        geoenrichedFeatureLayer.setDefinitionExpression("CommST = '" + window.communitySelected + "'" + " AND " + geoenrichedFeatureLayer.renderer.attributeField + " >= 0" + " AND " + geoenrichedFeatureLayer.renderer.attributeField + " IS NOT Null");
		                    }
		                }
	                }
	
	                featureLayerStatistics = new FeatureLayerStatistics({
	                        layer: geoenrichedFeatureLayer,
	                        visible: false
	                    });
	
	                //set store original renderer
	                if (!currentSymbology[_layerID]) {
	                    currentSymbology[_layerID] = {};
	                    currentSymbology[_layerID]['origRenderer'] = geoenrichedFeatureLayer.renderer.toJson();
	                }
	
	                //set slider onClick
	                var horiSlider = domConstruct.place('<div id="transSlider"></div>', 'slider');
	                dynamicSymbology.oSlider = new HorizontalSlider({
	                        name: "transSlider",
	                        value: -Math.abs(geoenrichedFeatureLayer.opacity),
	                        minimum: -1,
	                        maximum: 0,
	                        discreteValues: 101,
	                        intermediateChanges: false,
	                        style: "width:185px; margin-left: 10px",
	                        onChange: function (value) {
	                            geoenrichedFeatureLayer.setOpacity(Math.abs(value));
	                        }
	                    }, "transSlider").startup();
	
	                //Set Fields
	                _ClassificationMethod = geoenrichedFeatureLayer.renderer.classificationMethod;
	                _fieldName = geoenrichedFeatureLayer.renderer.attributeField;
	                
	                _NumberOfClasses = geoenrichedFeatureLayer.renderer.infos.length;
	
	                //set number of classes spinner
	                var numClassesNode = domConstruct.create("div", null, dom.byId("numClasses"), "first");
	                dynamicSymbology.numberClasses = new NumberSpinner({
	                        value: geoenrichedFeatureLayer.renderer.infos.length,
	                        smallDelta: 1,
	                        constraints: {
	                            min: 1,
	                            max: 20
	                        },
	                        intermediateChanges: true,
	                        style: "width:100px; height: 20px; lineHeight: 20px"
	                    });
	                dynamicSymbology.numberClasses.placeAt(numClassesNode);
	                dynamicSymbology.numberClasses.startup();
	
	                //set initail slider
	                var sliderNode = domConstruct.create("div", null, dom.byId("esri-colorinfoslider1"), "first");
	                dynamicSymbology.slider = new ClassedColorSlider({
	                        breakInfos: geoenrichedFeatureLayer.renderer.infos,
	                        classificationMethod: geoenrichedFeatureLayer.renderer.classificationMethod
	                        //class: "sliderAreaRight"
	                    }, sliderNode);
	                dynamicSymbology.slider.startup();
	                
	                var fType = geoenrichedFeatureLayer.geometryType;
         			if (fType == "esriGeometryPoint") {
         				dom.byId("symbolSize").style.display = '';    				
         			}
         			else {
         				dom.byId("symbolSize").style.display = 'none';
         			}                            
	
	                //Classification dropdown
	                dynamicSymbology.attTemplateOptions = [{
	                        label: "equal-interval",
	                        value: "equal-interval"
	                    }, {
	                        label: "natural-breaks",
	                        value: "natural-breaks"
	                    }, {
	                        label: "quantile",
	                        value: "quantile",
	                        selected: true
	                    }, {
	                        label: "standard-deviation",
	                        value: "standard-deviation"
	                    }, {
	                        label: "manual",
	                        value: "manual"
	                    }
	                ];
	                //Set up Classification dropdown
	                dynamicSymbology.classSelect = new select({
	                        name: "Classification",
	                        title: "Classification",
	                        options: dynamicSymbology.attTemplateOptions,
	                        style: "width: 150px; height: 20px"
	                    });
	                dynamicSymbology.classSelect.placeAt(dom.byId("classification"));
	                dynamicSymbology.classSelect.startup();
	
	                //set classificatoin Method
	                dynamicSymbology.classSelect.set('value', geoenrichedFeatureLayer.renderer.classificationMethod);
	
	                //get Histogram and Stats
	                selfDynamicSymbology._getHistoAndStats(geoenrichedFeatureLayer.renderer);
	
	                //on change event for slider
	                dynamicSymbology.slider.on("change", function (sliderValueChange) {
	                	
	                	_sliderValueChange = sliderValueChange;
	                    //change classification dropdown to manual
	                    dynamicSymbology.classSelect.set('value', 'manual');
	                    dynamicSymbology.isSmartMapping = false;	
	                });
	                
	                //set apply renderer button
	                var applyNode = domConstruct.create("div", null, dom.byId("applyBtn"), "first");

                    dynamicSymbology.applyButton = new Button({
                        label: "Apply",
                        onClick: selfDynamicSymbology._onApplyBtnClick
                    });
 	                dynamicSymbology.applyButton.placeAt(applyNode);
	                dynamicSymbology.applyButton.startup();   
	
	                //set original renderer button
	                var resetNode = domConstruct.create("div", null, dom.byId("originalBtn"), "first");
	                dynamicSymbology.origRendButton = new Button({
                        label: "Reset",
                        onClick: selfDynamicSymbology._onOriginalBtnClick	                        
                    }); 
 	                dynamicSymbology.origRendButton.placeAt(resetNode);
	                dynamicSymbology.origRendButton.startup();  
	                                   
                }// end of if (dslayer.layerObject.type == "Feature Layer") {  the layer is feature layer   
                   	                              
            });
            //On Classification method change
            onClickHandle = on(dynamicSymbology.classSelect, "change", function (c) {
                    _ClassificationMethod = c;
                    if (c != "manual") {
                        dynamicSymbology.isSmartMapping = true;
                    }
                });

            //On number of classes change
            dynamicSymbology.numberClasses.on("change", function (c) {
                _NumberOfClasses = c;
                dynamicSymbology.isSmartMapping = true;
            });
        },
        _onApplyBtnClick: function () {
				
			var bSizeEnlargeByValue = false;		
			var radios = document.getElementsByName('symbolSizeUpDown');
			for (var i = 0, length = radios.length; i < length; i++)
			{
			 	if (radios[i].checked)
			 	{
				  if (radios[i].value == "up") {
				  	bSizeEnlargeByValue = true;
				  }
				  break;
			 	}
			}
            if (dynamicSymbology.isSmartMapping == true) {
                selfDynamicSymbology._updateSmartMapping2();
            } else {
				var fType = geoenrichedFeatureLayer.geometryType;
				if (fType == "esriGeometryPolygon") {
                	var symbol = new SimpleFillSymbol();
                }
                else if (fType == "esriGeometryPolyline") {
                	var symbol = new SimpleLineSymbol();
                }
                else if (fType == "esriGeometryPoint") {
                	var symbol = new SimpleMarkerSymbol();
                }
                symbol.setColor(new Color([150, 150, 150, 0.5]));
                symbol.style = _style;

                renderer = new ClassBreaksRenderer(symbol, geoenrichedFeatureLayer.renderer.attributeField);	                            	

            	var minimumSymbolSize = 4;
            	var minMin = 1000000000;
            	var maxMin = 0;
            	var index = 0;
            	var bValueGoingUp = true;
            	_sliderValueChange.forEach(function (b) {
            		if (index == 1) {
            			if (b.minValue < minMin){
            				bValueGoingUp = false;
            			}
            		}
            		if (minMin > b.minValue) {
            			minMin = b.minValue;
            		}
            		if (maxMin < b.minValue) {
            			maxMin = b.minValue;
            		}       
            		
            		index = index + 1;     		
            	});
            	var maxiSymbolSize = minimumSymbolSize + (index - 1) * 2;
            	var initialSymbolSize = null;
            	var symbolSizeStep = null;
            	if ((bValueGoingUp && bSizeEnlargeByValue) || (!bValueGoingUp && !bSizeEnlargeByValue)){
            		initialSymbolSize = minimumSymbolSize;
            		symbolSizeStep = 2;
            	} else {
            		initialSymbolSize = maxiSymbolSize;
            		symbolSizeStep = -2;            		
            	}
            	var indexSymbolSizeStep = 0;
                _sliderValueChange.forEach(function (b) {
                	if ((_style != null)&& (fType == "esriGeometryPoint")){
                		b.symbol = new SimpleMarkerSymbol();
                		b.symbol.size = initialSymbolSize + indexSymbolSizeStep * symbolSizeStep;
                		indexSymbolSizeStep = indexSymbolSizeStep + 1;
                		b.symbol.style = _style;
                		b.symbol.color = _color;
                		b.symbol.outline = _outline;
                		b.symbol.imageData = null;
                		b.symbol.url = "";
                	}
                	renderer.addBreak(b);
                });
            	renderStr = JSON.stringify(renderer.toJson());
                window.hashRenderer[_layerID.replace(window.layerIdPrefix, "")] = renderer.toJson();
                _ClassificationMethod = renderer.classificationMethod;
			
                selfDynamicSymbology._getHistoAndStats(renderer);
            }
        },
        _onOriginalBtnClick: function () {
            var res = _layerID.split("_");
            lyrTobeUpdated = selfDynamicSymbology.map.getLayer(_layerID);
            lyrTiled = selfDynamicSymbology.map.getLayer(_layerID.replace(window.layerIdPrefix, window.layerIdTiledPrefix));
            if (lyrTiled) {
                if (lyrTobeUpdated.visible == true) {
                    lyrTiled.setVisibility(true);
                    window.hashRenderer[_layerID.replace(window.layerIdPrefix, "")] = null;
                }
            }

            var str = lyrTobeUpdated.url;
            if ((str.indexOf(lookforEnviroatlas) > -1) && (str.indexOf(lookforCommunities) > -1) ) {
                //get from community
                $.getJSON('configs/CommunitySymbology/' + 'AllCommunities' + '_JSON_Symbol/Nulls/' + 'CombComm' + '_' + window.hashAttribute[res[1]] + ".json", function (data) {
                    var defaultRenderer = new ClassBreaksRenderer(data);
                    selfDynamicSymbology._resetElements(defaultRenderer);
                });                               	                            	

            } else {
                console.log("get from json");
                var defaultRenderer = new ClassBreaksRenderer(currentSymbology[_layerID]['origRenderer']);
                selfDynamicSymbology._resetElements(defaultRenderer);
            }
        },        
        _resetElements: function (defaultRenderer) {

            //set properties
            _ClassificationMethod = defaultRenderer.classificationMethod;
            _fieldName = defaultRenderer.attributeField;
            _NumberOfClasses = defaultRenderer.infos.length;

            dynamicSymbology.isSmartMapping = false;
            //set classification drop
            dynamicSymbology.classSelect.set('value', _ClassificationMethod);

            dynamicSymbology.isSmartMapping = false;
            //set num of classes spinner
            dynamicSymbology.numberClasses.set('value', _NumberOfClasses);
            //set slider properties
            dynamicSymbology.slider.set('breakInfos', defaultRenderer.infos);
            dynamicSymbology.slider.set('classificationMethod', _ClassificationMethod);

            dynamicSymbology.isSmartMapping = false;
            selfDynamicSymbology._getHistoAndStats(defaultRenderer);
        },

        _getStyle: function () {
            newStyle = symbolStyler.getStyle();
            newStyle.scheme.outline = newStyle.symbol.outline;
            _scheme = newStyle.scheme;
            _symbol = newStyle.symbol;
            _style = newStyle.symbol.style;
            _color = newStyle.symbol.color;
            _outline = newStyle.symbol.outline;
            
			var fType = geoenrichedFeatureLayer.geometryType;
			if (fType == "esriGeometryPolygon") {
            	dynamicSymbology.isSmartMapping = true;
            }
            else if (fType == "esriGeometryPolyline") {
            	dynamicSymbology.isSmartMapping = false;
            }
            else if (fType == "esriGeometryPoint") {
            	dynamicSymbology.isSmartMapping = false;
            }
        
            //
            popup.close(styleDialog);
            //selfDynamicSymbology._updateSmartMapping2();
        },
        _getColorsFromInfos: function (currentInfos) {
            var symbolColors = [];
            currentInfos.forEach(function (s) {
                symbolColors.push(s.symbol.color);
            });
            return symbolColors;
        },
        _openSymbolStyler: function () {
            var currRamp = selfDynamicSymbology._getColorsFromInfos(geoenrichedFeatureLayer.renderer.infos);

            var fType = geoenrichedFeatureLayer.geometryType;
            if (fType == "esriGeometryPolygon") {
                var dSymbol = geoenrichedFeatureLayer.renderer.infos[0].symbol;
            	schemes = esriStylesChoropleth.getSchemes({
                    basemap: "hybrid",
                    geometryType: "polygon",
                    theme: "high-to-low"
                });
                symbolStyler.edit(dSymbol, {
                    activeTab: "fill",
                    colorRamp: {
                        colors: currRamp,
                        numStops: _NumberOfClasses,
                        scheme: schemes.secondarySchemes[39]
                    },
                    externalSizing: false,
                    schemes: schemes
                });
            } else if (fType == "esriGeometryPolyline") {
                var dSymbol = geoenrichedFeatureLayer.renderer.infos[0].symbol;
            	schemes = esriStylesChoropleth.getSchemes({
                    basemap: "hybrid",
                    geometryType: "polyline",
                    theme: "high-to-low"
                });
                symbolStyler.edit(dSymbol, {
                    //activeTab: "fill",
                    colorRamp: {
                        colors: currRamp,
                        numStops: _NumberOfClasses,
                        scheme: schemes.secondarySchemes[39]
                    },
                    externalSizing: false,
                    schemes: schemes
                });
            } else if (fType == "esriGeometryPoint") {
                var dSymbol = geoenrichedFeatureLayer.renderer.infos[0].symbol;
            	schemes = esriStylesChoropleth.getSchemes({
                    basemap: "hybrid",
                    geometryType: "point",
                    theme: "high-to-low"
                });
                symbolStyler.edit(dSymbol, {
                    //activeTab: "fill",
                    colorRamp: {
                        colors: currRamp,
                        numStops: _NumberOfClasses,
                        scheme: schemes.secondarySchemes[39]
                    },
                    externalSizing: false,
                    schemes: schemes
                });
            }
        },

        _getHistoAndStats: function (gRenderer) {
            _busy.show();
            featureLayerStatistics.getHistogram({
                classificationMethod: _ClassificationMethod,
                field: _fieldName,
                numBins: _NumberOfClasses
            }).then(function (histogram) {
                featureLayerStatistics.getFieldStatistics({
                    field: _fieldName
                }).then(function (statistics) {
                    console.log("Statistics :: ", statistics);

                    dynamicSymbology.slider.set("breakInfos", gRenderer.infos);
                    dynamicSymbology.slider.set("minValue", statistics.min);
                    dynamicSymbology.slider.set("maxValue", statistics.max);
                    dynamicSymbology.slider.set("statistics", statistics);
                    dynamicSymbology.slider.set("histogram", histogram);
                });
                geoenrichedFeatureLayer.setRenderer(gRenderer);
                geoenrichedFeatureLayer.redraw();

                if (geoenrichedFeatureLayer.visible == true) {
                    geoenrichedFeatureLayer.setVisibility(false);
                    geoenrichedFeatureLayer.setVisibility(true);
                }
                _busy.hide();
            }).otherwise(function (error) {
                _busy.hide();
                console.log("An error occurred while calculating the histogram, Error: %o", error);
            });
        },

        _updateSmartMapping2: function () {

            _busy.show();
            if (dynamicSymbology.isSmartMapping == false) {
                dynamicSymbology.isSmartMapping = true;
            }

            if (_ClassificationMethod == "manual") {
                _ClassificationMethod = "equal-interval";
                dynamicSymbology.classSelect.set('value', 'equal-interval');
            }
            //create and apply color renderer
            smartMapping.createClassedColorRenderer({
                basemap: "topo",
                theme: "hybrid",
                classificationMethod: _ClassificationMethod,
                field: _fieldName,
                layer: geoenrichedFeatureLayer,
                numClasses: _NumberOfClasses,
                scheme: _scheme,
                showOthers: false
            }).then(function (smartRenderer) {

                if (!geoenrichedFeatureLayer.visible) {
                    geoenrichedFeatureLayer.show();
                }

                geoenrichedFeatureLayer.setRenderer(smartRenderer.renderer);
                window.hashRenderer[geoenrichedFeatureLayer.id.replace(window.layerIdPrefix, "")] = smartRenderer.renderer.toJson();
                geoenrichedFeatureLayer.redraw();
                console.log("apply geoenrichedFeatureLayer.renderer :: ", geoenrichedFeatureLayer.renderer);

                if (geoenrichedFeatureLayer.visible == true) {
                    geoenrichedFeatureLayer.setVisibility(false);
                    geoenrichedFeatureLayer.setVisibility(true);
                }
                featureLayerStatistics.getHistogram({
                    classificationMethod: _ClassificationMethod,
                    field: _fieldName,
                    numBins: _NumberOfClasses
                }).then(function (histogram) {

                    featureLayerStatistics.getFieldStatistics({
                        field: _fieldName
                    }).then(function (statistics) {
                        console.log(statistics);
                        dynamicSymbology.slider.set("breakInfos", smartRenderer.renderer.infos);
                        dynamicSymbology.slider.set("minValue", statistics.min);
                        dynamicSymbology.slider.set("maxValue", statistics.max);
                        dynamicSymbology.slider.set("statistics", statistics);
                        dynamicSymbology.slider.set("histogram", histogram);

                        _busy.hide();
                    });

                }).otherwise(function (error) {
                    _busy.hide();
                    console.log("An error occurred while calculating the histogram, Error: %o", error);
                });
                _busy.hide();

            }).otherwise(function (error) {
                _busy.hide();
                console.log("An error occurred while creating the color renderer, Error: %o", error);
            });

        },

        onClose: function () {
            //clean up
            domStyle.set(dom.byId('nationalDSWarning'), "display", "none");
            dijit.byId("transSlider").destroy();

            styleDialog.destroy();
            symbolStyler.destroy();
            displaySymbolStyler.destroy();
            
			
            dynamicSymbology.slider.destroy();
            dynamicSymbology.numberClasses.destroy();
            dynamicSymbology.classSelect.destroy();
            dynamicSymbology.applyButton.destroy();
            dynamicSymbology.origRendButton.destroy();
                        
            onClickHandle.remove();
            
            dynamicSymbology = {};
            
            _scheme = null;
	        _symbol = null;
	        _style = null;
	        _color = null;
	        _outline = null;
	        _symbolSizeStep = 0;
	        _symbolSizeInitial = 0;

            _scheme = null;
            dynamicSymbology.isSmartMapping = true;
            
            geoenrichedFeatureLayer.setDefinitionExpression("");
            console.log('onClose');
        },

        onMinimize: function () {
            console.log('onMinimize');
        },

        onMaximize: function () {
            console.log('onMaximize');
        },

        onSignIn: function (credential) {
            /* jshint unused:false*/
            console.log('onSignIn');
        },

        onSignOut: function () {
            console.log('onSignOut');
        }
    });
});
