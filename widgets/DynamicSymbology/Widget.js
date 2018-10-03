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
	    var _getRendererMinValueNormal = function (renderInfos) {
        	var minMin = 1000000000;

         	renderInfos.forEach(function (b) {
	
	    		if (minMin > b.minValue) {
	    			minMin = b.minValue;
	    		}
    		});
    		if (minMin < -100) {
    			minMin = 0;
    		}
      		return minMin;
		};	    
	    var _getRendererInfosNormalValue = function (featureLayer) {
			resultInfos = [];
			featureLayer.renderer.infos.forEach(function (info) {
				if (info.maxValue>-100) {					
					resultInfos.push(info);
				}			
        	});
        	return resultInfos;
		};
		var _getRendererInfosAbnormalValue = function (featureLayer) {
			resultInfos = [];
			featureLayer.renderer.infos.forEach(function (info) {
				if (info.minValue<=-100) {
					resultInfos.push(info);
				}			
        	});
        	return resultInfos;
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
        "esri/renderers/SimpleRenderer",
        "esri/symbols/SimpleFillSymbol",
        "esri/symbols/SimpleLineSymbol",
        "esri/symbols/SimpleMarkerSymbol",
        "esri/dijit/util/busyIndicator",
        "esri/dijit/SymbolStyler",
        "esri/request",
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
        "dijit/form/CheckBox",
        "dijit/popup",
        "dojo/parser"],
    function (declare, BaseWidget, LayerInfos, dom, domConstruct, on, domStyle, Map, esriStylesChoropleth, Color, ColorInfoSlider,
        ClassedColorSlider, smartMapping, FeatureLayer, FeatureLayerStatistics,
        ClassBreaksRenderer, SimpleRenderer, SimpleFillSymbol, SimpleLineSymbol, SimpleMarkerSymbol, busyIndicator, SymbolStyler, esriRequest,
        ColorPalette, select, NumberSpinner, HorizontalSlider, HorizontalRule, HorizontalRuleLabels, TooltipDialog, DropDownButton,
        Button, RadioButton, CheckBox, popup) {

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
        _nBreaks: null,
        _NumberOfClasses: null,
        _currentBaseMap: null,
        _scheme: null,
        _bSchemeColorsChanage: null,
        _symbol: null,
        _style: null,
        _color: null,
        _outline: null,
        _width: null,
        _sliderValueChange: null,
        _symbolPointForPolygon: null,
        _bPolygonAsPoint: null,
        _bClassificationChanged: null,
        _bSizeUpByValuePolygonAsPoint: null,
        _origSymbol: null,
        featureLayerStatistics: null,
        renderer: null,     
        minimumSymbolSize : null,
        rendererInfos_NormalValue: null,
        rendererInfos_AbnormalValue: null,

			
		
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
            _bSchemeColorsChanage = false;
            minimumSymbolSize = 6;

            this.fetchDataByName('LayerList');

            console.log('startup');
            //Needed variables
            map = this.map;

            var curColor = new Color([92, 92, 92]);

            dynamicSymbology.isSmartMapping = true;
            _NumberOfClasses = 0;
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
        	_nBreaks = 0;
        	_bPolygonAsPoint = false;
        	_bClassificationChanged = false;
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
            symbolStyler.on("click", function(evt){
		 		selfDynamicSymbology._clickSymbolStyler(evt);
			});			
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

                if ((dslayer.layerObject.type == "Feature Layer") || (dslayer.parentLayerInfo.layerObject.tileInfo != null)) { //if the layer is feature layer

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
	                /*esriRequest({
					    "url": str,
					    "content": {
					    "f": "json"
					  },
					  "callbackParamName": "callback"
					}).
					  then(function (evt) {
					    console.log(evt.drawingInfo.renderer);
					});*/
		            
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
	                    //currentSymbology[_layerID]['origRenderer'] = geoenrichedFeatureLayer.renderer.toJson();
	                    //currentSymbology[_layerID]['origRenderer'] = geoenrichedFeatureLayer.renderer;
	                }

	                _fieldName = geoenrichedFeatureLayer.renderer.attributeField;	                
	                	                
					_ClassificationMethod = geoenrichedFeatureLayer.renderer.classificationMethod;
					var breaks = geoenrichedFeatureLayer.renderer.breaks;
					
					if (breaks != undefined) {
						_nBreaks = breaks.length;
					}
					
					if ((_ClassificationMethod!=undefined) || (_nBreaks>0 )){

						_NumberOfClasses = geoenrichedFeatureLayer.renderer.infos.length;
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
		                        breakInfos: _getRendererInfosNormalValue(geoenrichedFeatureLayer),
		                        classificationMethod: geoenrichedFeatureLayer.renderer.classificationMethod
		                        //class: "sliderAreaRight"
		                    }, sliderNode);
		                dynamicSymbology.slider.startup();
		                
		                var fType = geoenrichedFeatureLayer.geometryType;
	         			if (fType == "esriGeometryPoint") {
	         				dom.byId("symbolSize").style.display = '';    
	         				dom.byId("symbolSizeLabel").style.display = '';
							dom.byId("symbolSizeSelection").style.display = '';	         								
	         			}
	         			else {
	         				dom.byId("symbolSize").style.display = 'none';
	         				dom.byId("symbolSizeLabel").style.display = 'none';
							dom.byId("symbolSizeSelection").style.display = 'none';
	         			}                    
	         			if (fType == "esriGeometryPolygon") {
							var polygonRenderSymbol = geoenrichedFeatureLayer.renderer.infos[0].symbol;  	
							if (polygonRenderSymbol.type == "simplemarkersymbol") {
								_bPolygonAsPoint = true;

								_symbolPointForPolygon = polygonRenderSymbol;
								
							}				
							var index = 0;	
							var minVale0 = geoenrichedFeatureLayer.renderer.infos[0].minValue;
							var minVale1 = geoenrichedFeatureLayer.renderer.infos[1].minValue;
							var size0 = geoenrichedFeatureLayer.renderer.infos[0].symbol.size;
							var size1 = geoenrichedFeatureLayer.renderer.infos[1].symbol.size;
							if (((minVale0 > minVale1) && (size0 > size1)) || ((minVale0 < minVale1) && (size0 < size1))){								 
								_bSizeUpByValuePolygonAsPoint = true;
							} else {
								_bSizeUpByValuePolygonAsPoint = false;
							}				
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
		                        value: "quantile"
		                        //selected: true
		                    }, {
		                        label: "standard-deviation",
		                        value: "standard-deviation"
		                    }, {
		                        label: "manual",
		                        value: "manual",
		                        selected: true
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
		                selfDynamicSymbology._getHistoAndStats(geoenrichedFeatureLayer.renderer, null);
		
		                //on change event for slider
		                dynamicSymbology.slider.on("change", function (sliderValueChange) {
		                	_sliderValueChange = sliderValueChange;
		                    //change classification dropdown to manual
		                    if (_bClassificationChanged == true) {
		                    	_bClassificationChanged = false;
		                    } else {
		                    dynamicSymbology.classSelect.set('value', 'manual');
		                    dynamicSymbology.isSmartMapping = false;	
		                    }
		                });
	                } //if (_ClassificationMethod!=undefined)

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
            if ((_ClassificationMethod!=undefined) || (_nBreaks>0)) {
            	dom.byId("classificationLabel").style.display = '';	
                dom.byId("nClassesLabel").style.display = '';	
                dom.byId("sliderLabel").style.display = '';	
                dom.byId("opaqueLabel").style.display = '';
               
            	//On Classification method change
	            onClickHandle = on(dynamicSymbology.classSelect, "change", function (c) {
	            	_bClassificationChanged = true;
	                    _ClassificationMethod = c;
	                    if (c != "manual") {
	                        dynamicSymbology.isSmartMapping = true;
	                    }
	                });
	
	            //On number of classes change
	            dynamicSymbology.numberClasses.on("change", function (c) {
	                _NumberOfClasses = c;
	                _bClassificationChanged = true;
	                dynamicSymbology.isSmartMapping = true;
	            });
            } else {
                dom.byId("classificationLabel").style.display = 'none';	
                dom.byId("nClassesLabel").style.display = 'none';	
                dom.byId("sliderLabel").style.display = 'none';	         
                dom.byId("opaqueLabel").style.display = 'none';	 
 				dom.byId("symbolSize").style.display = 'none';    
 				dom.byId("symbolSizeLabel").style.display = 'none';
				dom.byId("symbolSizeSelection").style.display = 'none';	
				
				var fType = geoenrichedFeatureLayer.geometryType;
				if ((fType == "esriGeometryPolygon") && (!_bPolygonAsPoint)) {  
		            dynamicSymbology.chkTransparentPoly = new CheckBox({
		            	    id: "chkTransparent", 
		            	    name: "chkTransparent"
		                });
		            dom.byId("dropDownButtonContainer").appendChild(dynamicSymbology.chkTransparentPoly.domNode);           
		            dynamicSymbology.chkTransparentPoly.startup();				
                    //var chkTransparen = document.getElementsByName("chkTransparent");
            		//chkTransparen[0].style.left = "400px";	
            		dom.byId("dropDownButtonContainer").appendChild(dojo.create("label", {"for" : "chkTransparent", innerHTML: " no fill", "id": "lblTransparent", "name": "lblTransparent"}));
				}
	        }
        },
        _onApplyBtnClick: function () {
            if (_ClassificationMethod == undefined) {
                _ClassificationMethod = dynamicSymbology.classSelect.value;
            }
				
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

                //symbol.style = _style;
                if (_nBreaks>0){//There is classbreaks

	                renderer = new ClassBreaksRenderer(null, geoenrichedFeatureLayer.renderer.attributeField);		
	            	
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

	                dynamicSymbology.slider.breakInfos.forEach(function (b) {

						if ((fType == "esriGeometryPolygon") && (!_bPolygonAsPoint)) {
                            if (typeof _outline != 'undefined'){
                                if (_outline != null) {
                                    b.symbol.outline = _outline;
                                }
                            }		                	
		                }
		                else if (fType == "esriGeometryPolyline") {
		                	//b.symbol = new SimpleLineSymbol();
		                	if (typeof _style != "undefined"){
                                if (_style != null) {
                                    b.symbol.style = _style;
                                }
                            }
                            if (typeof _color != 'undefined'){
                                if (_color != null) {
                                    b.symbol.color = _color;
                                }
                            }
		                }
		                else if ((fType == "esriGeometryPoint") || _bPolygonAsPoint) {
		                	b.symbol = new SimpleMarkerSymbol();
                            if (typeof _style != "undefined"){
                                if (_style != null) {
                                    b.symbol.style = _style;
                                }
                            }
                            if (typeof _color != 'undefined'){
                                if (_color != null) {
                                    b.symbol.color = _color;
                                }
                            }
                            b.symbol.size = initialSymbolSize + indexSymbolSizeStep * symbolSizeStep;	                	
		                } 
               		
                		indexSymbolSizeStep = indexSymbolSizeStep + 1;
	                	renderer.addBreak(b);
	                });
	            	renderStr = JSON.stringify(renderer.toJson());
	                window.hashRenderer[_layerID.replace(window.layerIdPrefix, "")] = renderer.toJson();
	                _ClassificationMethod = renderer.classificationMethod;
				
	                selfDynamicSymbology._getHistoAndStats(renderer, null);
            	} else {//layer will be rendered as universal size
    		   		if ((fType == "esriGeometryPolygon") && (!_bPolygonAsPoint)) {
	                	var symbol = new SimpleFillSymbol();
	                	if (dynamicSymbology.chkTransparentPoly.getValue()!=false) {
	                		symbol.style = SimpleFillSymbol.STYLE_NULL;
	                	} else {
	                		if (_style != null) {
	                			symbol.style = _style;
	                		}	                		
	                	}
	                }
	                else if (fType == "esriGeometryPolyline") {
	                	var symbol = new SimpleLineSymbol();
	                	if ((_style != null) && (_style != undefined)){
	                		symbol.style = _style;
	                	}
	                	if ((_width != null) && (_width != undefined)){
	                		symbol.width = _width;
	                	}
	                }
	                else if ((fType == "esriGeometryPoint") || _bPolygonAsPoint) {
	                	
	                	var symbol = new SimpleMarkerSymbol();
	                	if (_style != null) {
	                		symbol.style = _style;
	                	}
	                } 
					
					if (_color != null) {
						symbol.color = _color;
					}
					if (_outline != null) {
            			symbol.outline = _outline;
            		}          		
            		
            		var simpleRenderer = new SimpleRenderer(symbol);
            		geoenrichedFeatureLayer.setRenderer(simpleRenderer);
            		geoenrichedFeatureLayer.redraw();
                }
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
                    var defaultRenderer = new ClassBreaksRenderer(JSON.stringify(data));
                    //selfDynamicSymbology._resetElements(defaultRenderer);
                    selfDynamicSymbology._resetElements(defaultRenderer, JSON.stringify(data));
                });                               	                            	

            } else {
                console.log("get from json");
                var renderer;
                var selectedLayerNum = _layerID.replace(window.layerIdPrefix, "").replace(window.layerIdBndrPrefix, "").replace(window.layerIdPBSPrefix, "");
    			if (window.communitySelected != window.strAllCommunity) {        
					$.getJSON( 'configs/CommunitySymbology/' + window.communitySelected + '_JSON_Symbol/Nulls/' + window.communitySelected + '_' + window.hashAttribute[selectedLayerNum] + ".json", function( data ) {
						renderer = new ClassBreaksRenderer(data);
		                if ((_ClassificationMethod!=undefined)  || (_nBreaks>0)){
		                	//selfDynamicSymbology._resetElements(renderer);
		                	selfDynamicSymbology._resetElements(renderer, JSON.stringify(data));
		                } else {
		                	geoenrichedFeatureLayer.setRenderer(renderer);
		                	geoenrichedFeatureLayer.redraw();
		                }						
					})
				} else {
					$.getJSON( 'configs/CommunitySymbology/' + 'AllCommunities' + '_JSON_Symbol/Nulls/' + 'CombComm' + '_' + window.hashAttribute[selectedLayerNum] + ".json", function( data ) {
						renderer = new ClassBreaksRenderer(data);  
		                if ((_ClassificationMethod!=undefined)  || (_nBreaks>0)){
		                	selfDynamicSymbology._resetElements(renderer, JSON.stringify(data));
		                } else {
		                	geoenrichedFeatureLayer.setRenderer(renderer);
		                	geoenrichedFeatureLayer.redraw();
		                }								             		
					})						
				}                

                
            }
        },        
        _resetElements: function (defaultRenderer, DataJsonStr) {
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
            //selfDynamicSymbology._getHistoAndStats(defaultRenderer);
            selfDynamicSymbology._getHistoAndStats(defaultRenderer, DataJsonStr);
        },

        _clickSymbolStyler: function (evtSymbolStylerClick) {
        	_bClassificationChanged = true;
        	if (evtSymbolStylerClick.selectorTarget != undefined) {
        		if (evtSymbolStylerClick.selectorTarget.tabIndex != undefined) {
        			if (evtSymbolStylerClick.selectorTarget.tabIndex == 0) {
        				_bSchemeColorsChanage = true;
        				//_bClassificationChanged = true;
        			}         			
        		}        		
        	}
        },
        _getStyle: function () {
            newStyle = symbolStyler.getStyle();
            if (_bSchemeColorsChanage) {
            _scheme = newStyle.scheme;
            }
            _outline = newStyle.symbol.outline;
            _symbol = newStyle.symbol;
            _style = newStyle.symbol.style;
            _color = newStyle.symbol.color;
            
            _width = newStyle.symbol.width;
            symbolStyler.storeColors();
            
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
        	_bSchemeColorsChanage = false;
        		var currRamp = selfDynamicSymbology._getColorsFromInfos(geoenrichedFeatureLayer.renderer.infos);

            var fType = geoenrichedFeatureLayer.geometryType;
            if (fType == "esriGeometryPolygon") {
	    		if (!_bPolygonAsPoint) {
                	var dSymbol = new SimpleFillSymbol();
                	if (typeof _outline != 'undefined'){
                		if (_outline != null) {
                			dSymbol.outline = _outline;
                		}
                	}
                }
                else {
                	
                	var dSymbol = new SimpleMarkerSymbol();
                } 

                //var dSymbol = geoenrichedFeatureLayer.renderer.infos[0].symbol;
            	schemes = esriStylesChoropleth.getSchemes({
                    basemap: "hybrid",
                    geometryType: "polygon",
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
            } else if (fType == "esriGeometryPolyline") {
                //var dSymbol = geoenrichedFeatureLayer.renderer.infos[0].symbol;
                
            	schemes = esriStylesChoropleth.getSchemes({
                    basemap: "hybrid",
                    geometryType: "polyline",
                    theme: "high-to-low"
                });
                if ((_ClassificationMethod!=undefined)  || (_nBreaks>0)){ 
              		var dSymbol = geoenrichedFeatureLayer.renderer.infos[0].symbol;

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
                } else {
                	
                	var dSymbol = new SimpleLineSymbol();

	                symbolStyler.edit(dSymbol, {
	                    //activeTab: "fill",
	                    externalSizing: false,
	                    schemes: schemes
	                });                	
                }

            } else if (fType == "esriGeometryPoint") {
                
            	schemes = esriStylesChoropleth.getSchemes({
                    basemap: "hybrid",
                    geometryType: "point",
                    theme: "high-to-low"
                }); 
                if ((_ClassificationMethod!=undefined)  || (_nBreaks>0)){ 
              		var dSymbol = geoenrichedFeatureLayer.renderer.infos[0].symbol;
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
                } else {
                	dSymbol = new SimpleMarkerSymbol();

	                symbolStyler.edit(dSymbol, {
	                    //activeTab: "fill",
	                    colorRamp: {
	                        colors: [],
	                        scheme: schemes.secondarySchemes[39]
	                    },
	                    externalSizing: false,
	                    schemes: schemes
	                });                	
                }
            }
        },

        _getHistoAndStats: function (gRenderer, DataJsonStr) {
            _busy.show();
            console.log("gRenderer  json in the beginning of _getHistoAndStats:" +JSON.stringify(gRenderer.toJson()));
            geoenrichedFeatureLayer.setRenderer(gRenderer);
            geoenrichedFeatureLayer.redraw();

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
                    console.log("Statistics :: ", statistics);
                    
					var resultInfos = [];
					gRenderer.infos.forEach(function (info) {
						if (info.maxValue>-100) {
							if (info.minValue < -100) {
								//info.minValue = info.maxValue;
								info.minValue = 0;
							}
							resultInfos.push(info);
						}			
		        	});
		        	//dynamicSymbology.slider.set("breakInfos", gRenderer.infos);
					dynamicSymbology.slider.set("breakInfos", resultInfos);
                    dynamicSymbology.slider.set("minValue", statistics.min);
                    //dynamicSymbology.slider.set("minValue", _getRendererMinValueNormal(resultInfos));
                    dynamicSymbology.slider.set("maxValue", statistics.max);
                    dynamicSymbology.slider.set("statistics", statistics);
                    dynamicSymbology.slider.set("histogram", histogram);
                    
		        	if (DataJsonStr != null) {
		        		var jsonStr = JSON.parse(DataJsonStr);
		        		gRenderer.infos.forEach(function (info) {
		        			jsonStr.classBreakInfos.forEach(function (jsonInfo) {
		        				if (info.maxValue == jsonInfo.maxValue) {
		        					info.label = jsonInfo.label;
		        				}
		        			});
		        		});
			            console.log("gRenderer  json in the middle of _getHistoAndStats:" +JSON.stringify(gRenderer.toJson()));
			            geoenrichedFeatureLayer.setRenderer(gRenderer);
			            geoenrichedFeatureLayer.redraw(); 
		        	}                    
                });
                	
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

				if (!_bPolygonAsPoint) {
					smartRenderer.renderer.infos.forEach(function (info) {
						if (typeof _outline != 'undefined'){
                			if (_outline != null) {
								info.symbol.outline = _outline;
							}
						}
		        	});			        	
					geoenrichedFeatureLayer.setRenderer(smartRenderer.renderer);
				}
				else {
	            	var minValue0 = smartRenderer.renderer.infos[0].minValue;
					var minValue1 = smartRenderer.renderer.infos[1].minValue;
	
	            	var initialSymbolSize = null;
	            	var symbolSizeStep = null;
	            	if (((minValue0 < minValue1) && _bSizeUpByValuePolygonAsPoint) || ((minValue0 > minValue1) && !_bSizeUpByValuePolygonAsPoint)){
	            		initialSymbolSize = minimumSymbolSize;
	            		symbolSizeStep = 2;
	            	} else {
	            		initialSymbolSize = minimumSymbolSize + smartRenderer.renderer.infos.length * 2;
	            		symbolSizeStep = -2;            		
	            	}
	            	var indexSymbolSizeStep = 0;
	            	
	            	//construct a new renderer for polygon features which will be rendered as points            	
	            	var polygonAsPointRenderer = new ClassBreaksRenderer(null, smartRenderer.renderer.attributeField);
	            	
					smartRenderer.renderer.infos.forEach(function (info) {
			                var symbolSize = initialSymbolSize + indexSymbolSizeStep * symbolSizeStep;
			                
			                if (_style != null) {
			                    var style = _style;
			                } else {
			                    var style = _symbolPointForPolygon.style;
			                }
			                if (_color != null){
			                    var color = _color;
			                } else {
			                    var color = _symbolPointForPolygon.color;
			                }
			                if (_outline != null){
                                var outline = _outline;
                            } else {
                                var outline = _symbolPointForPolygon.outline;
                            }                
                            
                            newSymbol = new SimpleMarkerSymbol(style, symbolSize, outline, color);
						
	 						polygonAsPointRenderer.addBreak(info.minValue, info.maxValue, newSymbol);
	                		indexSymbolSizeStep = indexSymbolSizeStep + 1;
	            	});	            	
					geoenrichedFeatureLayer.setRenderer(polygonAsPointRenderer);
				}
              
                window.hashRenderer[geoenrichedFeatureLayer.id.replace(window.layerIdPrefix, "")] = smartRenderer.renderer.toJson();
                _origSymbol = geoenrichedFeatureLayer.renderer.infos[0].symbol;
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
    					var resultInfos = [];
						smartRenderer.renderer.infos.forEach(function (info) {
							if (info.maxValue>-100) {
								if (info.minValue < -100) {
									info.minValue = 0;
								}
								resultInfos.push(info);
							}			
			        	});
			        	
                        //dynamicSymbology.slider.set("breakInfos", smartRenderer.renderer.infos);
                        dynamicSymbology.slider.set("breakInfos", resultInfos);
                        dynamicSymbology.slider.set("minValue", _getRendererMinValueNormal(resultInfos));
                        //dynamicSymbology.slider.set("minValue", statistics.min);
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
            if ((_ClassificationMethod!=undefined) || (_nBreaks>0)) { 
	            dijit.byId("transSlider").destroy();
	            dynamicSymbology.slider.destroy();
	            dynamicSymbology.numberClasses.destroy();
	            dynamicSymbology.classSelect.destroy();
	            onClickHandle.remove();

            } else {
	            var fType = geoenrichedFeatureLayer.geometryType;
	            if ((fType == "esriGeometryPolygon") && (!_bPolygonAsPoint)) { 
	            	dynamicSymbology.chkTransparentPoly.destroy();
	            	dojo.destroy("lblTransparent");
	            }            	
            }
            
            
            dynamicSymbology.applyButton.destroy();
            dynamicSymbology.origRendButton.destroy();
            
            styleDialog.destroy();
            symbolStyler.destroy();
            displaySymbolStyler.destroy();
            
         
            dynamicSymbology = {};
            
            //_scheme = null;
            
	        //_symbol = null;
	        //_style = null;
	        //_color = null;
	        
	        //_outline = null;
	        _symbolSizeStep = 0;
	        _symbolSizeInitial = 0;
	        _nBreaks = 0;
	        //_bPolygonAsPoint = false;

            //dynamicSymbology.isSmartMapping = true;
            
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
