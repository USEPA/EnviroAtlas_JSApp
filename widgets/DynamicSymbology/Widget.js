dynamicSymbology = {};
currentSymbology = {};
define(['dojo/_base/declare',
      'jimu/BaseWidget',
	  'jimu/LayerInfos/LayerInfos',
      "dojo/dom",
		"dojo/dom-construct",
	  "dojo/on",
      "esri/map",
      "esri/Color",
      "esri/dijit/ColorInfoSlider",
	  "esri/dijit/ClassedColorSlider",
      "esri/renderers/smartMapping",
      "esri/layers/FeatureLayer",
      "esri/plugins/FeatureLayerStatistics",
	  "esri/renderers/ClassBreaksRenderer",
	  "esri/symbols/SimpleFillSymbol",
	  "esri/styles/choropleth",
      "esri/dijit/util/busyIndicator",
	  "esri/dijit/SymbolStyler",
      "dijit/ColorPalette",
	  "dijit/form/Select",
	  "dijit/form/NumberSpinner",
      "dijit/form/HorizontalSlider",
      "dijit/form/HorizontalRule",
      "dijit/form/HorizontalRuleLabels",
	  "dojo/parser"],
function(declare, BaseWidget, LayerInfos, dom, domConstruct, on, Map, Color, ColorInfoSlider,
	ClassedColorSlider, smartMapping, FeatureLayer, FeatureLayerStatistics,
	ClassBreaksRenderer, SimpleFillSymbol, esriStylesChoropleth, busyIndicator, SymbolStyler,
	ColorPalette, select, NumberSpinner, HorizontalSlider, HorizontalRule, HorizontalRuleLabels) {

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

    _BusyIndicator: function(){
      return busyIndicator.create("esri-colorinfoslider1");
    },

    postCreate: function() {
      this.inherited(arguments);
      console.log('postCreate');

    },

    startup: function() {
	  this.inherited(arguments);
	  
	  this.fetchDataByName('LayerList');
	  
	  console.log('startup')
	  //Needed variables
	  map = this.map;

	  var curColor = new Color([92,92,92]);
	  var dynamicSym = this;

	  dynamicSymbology.isSmartMapping = true;
    },
	
	onReceiveData: function(name, widgetId, data, historyData) {
		console.log("onRecieveData", data.message);
		//dom.byId('title').innerHTML = data.message;
		_layerID = data.message;
	},

    onOpen: function(){
      _busy = busyIndicator.create("esri-colorinfoslider-container");

      console.log('onOpen');
      var dynamicSym = this;
	  //Get base map
	  _currentBaseMap = this.map.getBasemap();

		dynamicSymbology.isSmartMapping = true;
	  
	  LayerInfos.getInstance(this.map, this.map.itemInfo).then(function(layerInfosObject){

		  var dslayer = layerInfosObject.getLayerInfoById(_layerID);
		  console.log("Current Layer Name: ", dslayer.title);
		  dom.byId('title').innerHTML = dslayer.title;

		  //Set layers
		  geoenrichedFeatureLayer = dynamicSym.map.getLayer(_layerID);
		  featureLayerStatistics = new FeatureLayerStatistics({layer: geoenrichedFeatureLayer, visible: false});

		  //set store original renderer
		  if(!currentSymbology[_layerID]){
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
			  onChange: function(value){
				  geoenrichedFeatureLayer.setOpacity(Math.abs(value));
			  }
		  }, "transSlider").startup();

		  //Set Fields
		  _ClassificationMethod = geoenrichedFeatureLayer.renderer.classificationMethod;
		  _fieldName = geoenrichedFeatureLayer.renderer.attributeField;
		  _NumberOfClasses = geoenrichedFeatureLayer.renderer.infos.length;

		  //set number of classes spinner
		  var numClassesNode = domConstruct.create("div",null,dom.byId("numClasses"), "first");
		  dynamicSymbology.numberClasses = new NumberSpinner({
			  value: geoenrichedFeatureLayer.renderer.infos.length,
			  smallDelta: 1,
			  constraints: { min:1, max:20},
			  intermediateChanges:true,
			  style: "width:100px; height: 20px; lineHeight: 20px"
		  });
		  dynamicSymbology.numberClasses.placeAt(numClassesNode);
		  dynamicSymbology.numberClasses.startup();

		  //set initail slider
		  var sliderNode = domConstruct.create("div",null,dom.byId("esri-colorinfoslider1"), "first");
		  dynamicSymbology.slider = new ClassedColorSlider({
			  breakInfos: geoenrichedFeatureLayer.renderer.infos,
			  classificationMethod: geoenrichedFeatureLayer.renderer.classificationMethod,
			  //class: "sliderAreaRight"
		  }, sliderNode);
		  dynamicSymbology.slider.startup();

		  //Classification dropdown
		  dynamicSymbology.attTemplateOptions = [
			  {
				  label: "equal-interval",
				  value: "equal-interval"
			  }, {
				  label: "natural-breaks",
				  value: "natural-breaks"
			  },{
				  label: "quantile",
				  value: "quantile",
				  selected: true
			  },{
				  label: "standard-deviation",
				  value: "standard-deviation"
			  },{
				  label: "manual",
				  value: "manual"
			  }];
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
		  dynamicSym._getHistoAndStats(geoenrichedFeatureLayer.renderer);

		  //on change event for slider
			dynamicSymbology.slider.on("handle-value-change", function (sliderValueChange) {
				 var symbol = new SimpleFillSymbol();
				 symbol.setColor(new Color([150, 150, 150, 0.5]));

				 var renderer = new ClassBreaksRenderer(symbol, geoenrichedFeatureLayer.renderer.attributeField);
				sliderValueChange.forEach(function(b){
					renderer.addBreak(b);
				});
				 //change classification dropdown to manual
				 dynamicSymbology.classSelect.set('value', 'manual');

				_ClassificationMethod = renderer.classificationMethod;
				 dynamicSym._getHistoAndStats(renderer);

		   });
		  //set original renderer button
		  var origRendBtn = dom.byId('originalBtn');
		  var originalHandler = on(origRendBtn,"click", function(){

			  var defaultRenderer = new ClassBreaksRenderer(currentSymbology[_layerID]['origRenderer']);
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
			  dynamicSymbology.slider.set('breakInfos',defaultRenderer.infos);
			  dynamicSymbology.slider.set('classificationMethod',_ClassificationMethod);

			  //dynamicSymbology.isSmartMapping = false;
			  dynamicSym._getHistoAndStats(defaultRenderer);
		  });

	  });

		//On Classification method change
		onClickHandle = on(dynamicSymbology.classSelect,"change", function (c) {
			_ClassificationMethod = c;
			if(c != "manual"){
				if(dynamicSymbology.isSmartMapping == true){
					dynamicSym._updateSmartMapping2();
				}else{
					dynamicSymbology.isSmartMapping = true;
				}
			}
		});

		//On number of classes change
		dynamicSymbology.numberClasses.on("change", function (c) {
			_NumberOfClasses = c;

			if(dynamicSymbology.isSmartMapping == true){
				dynamicSym._updateSmartMapping2();
			}else{
				//dynamicSym._updateSmartMapping2();
				dynamicSymbology.isSmartMapping = true;
			}
		});
	},

	_getHistoAndStats: function(gRenderer){
		_busy.show();
		featureLayerStatistics.getHistogram({
			classificationMethod: _ClassificationMethod,
			field: _fieldName,
			numBins: _NumberOfClasses
		}).then(function (histogram) {

			featureLayerStatistics.getFieldStatistics({
				field: _fieldName
			}).then(function(statistics){
				//console.log("Statistics :: ", statistics);
				dynamicSymbology.slider.set("breakInfos", gRenderer.infos);
				dynamicSymbology.slider.set("minValue", statistics.min);
				dynamicSymbology.slider.set("maxValue", statistics.max);
				dynamicSymbology.slider.set("statistics", statistics);
				dynamicSymbology.slider.set("histogram", histogram);
			});

			geoenrichedFeatureLayer.setRenderer(gRenderer);
			geoenrichedFeatureLayer.redraw();
            
            geoenrichedFeatureLayer.setVisibility(false);
            geoenrichedFeatureLayer.setVisibility(true);

			_busy.hide();
		}).otherwise(function (error) {
			_busy.hide();
			console.log("An error occurred while calculating the histogram, Error: %o", error);
		});
	},
	
	_updateSmartMapping2: function(){
		console.log("UpdateSmartMapping");
		_busy.show();
		if(dynamicSymbology.isSmartMapping == false){
			dynamicSymbology.isSmartMapping = true;
		}
	  
	  //create and apply color renderer
      smartMapping.createClassedColorRenderer({
		basemap: "topo",
		theme: "hybrid",
		classificationMethod: _ClassificationMethod,
		field: _fieldName,
        layer: geoenrichedFeatureLayer,
        numClasses: _NumberOfClasses,
      }).then(function (smartRenderer) {
        console.log("create color renderer is generated", smartRenderer);
		
        if (!geoenrichedFeatureLayer.visible) {
          geoenrichedFeatureLayer.show();
        }
		
        geoenrichedFeatureLayer.setRenderer(smartRenderer.renderer);
        geoenrichedFeatureLayer.redraw();

        geoenrichedFeatureLayer.setVisibility(false);
        geoenrichedFeatureLayer.setVisibility(true);

		console.log("Get Histogram");
		console.log("classification: " + _ClassificationMethod);
		console.log("field: " + _fieldName);
		console.log("Num Classes: " + _NumberOfClasses);
		
        featureLayerStatistics.getHistogram({
			classificationMethod: _ClassificationMethod,
			field: _fieldName,
			numBins: _NumberOfClasses
        }).then(function (histogram) {

		  featureLayerStatistics.getFieldStatistics({
			  field: _fieldName
		  }).then(function(statistics){
				//console.log(statistics);
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

      }).otherwise(function (error) {
        _busy.hide();
        console.log("An error occurred while creating the color renderer, Error: %o", error);
      });

	},

    onClose: function(){
		//clean up
		dijit.byId("transSlider").destroy();

		dynamicSymbology.slider.destroy();
		dynamicSymbology.numberClasses.destroy();
		onClickHandle.remove();
		dynamicSymbology.classSelect.destroy();
		dynamicSymbology = {};

      	console.log('onClose');
    },

    onMinimize: function(){
      console.log('onMinimize');
    },

    onMaximize: function(){
      console.log('onMaximize');
    },

    onSignIn: function(credential){
      /* jshint unused:false*/
      console.log('onSignIn');
    },

    onSignOut: function(){
      console.log('onSignOut');
    }
  });
});