dynamicSymbology = {};
define(['dojo/_base/declare',
      'jimu/BaseWidget',
	  'jimu/LayerInfos/LayerInfos',
      "dojo/dom",
		"dojo/dom-construct",
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
	  "dojo/parser"],
function(declare, BaseWidget, LayerInfos, dom, domConstruct, Map, Color, ColorInfoSlider,
	ClassedColorSlider, smartMapping, FeatureLayer, FeatureLayerStatistics,
	ClassBreaksRenderer, SimpleFillSymbol, esriStylesChoropleth, busyIndicator, SymbolStyler,
	ColorPalette, select, NumberSpinner) {

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

	  dynamicSymbology.isSmartMapping = false;

	  	//symbology slider

	  
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
		dynamicSymbology.classSelect = new select({
			name: "Classification",
			title: "Classification",
			options: dynamicSymbology.attTemplateOptions,
			//onChange: function(c){
				//_ClassificationMethod = c;
				//if(c != "manual"){
					//call smartmapping
					//alert("call smart mapping");
				//}
			//},
			style: "width: 150px; height: 20px" 
		});
		dynamicSymbology.classSelect.placeAt(dom.byId("classification"));
		dynamicSymbology.classSelect.startup();
		


    },
	
	onReceiveData: function(name, widgetId, data, historyData) {
		console.log(data.message);
		//dom.byId('title').innerHTML = data.message;
		_layerID = data.message;
	},

    onOpen: function(){

      _busy = busyIndicator.create("esri-colorinfoslider-container");

     
      console.log('onOpen');
      var dynamicSym = this;
		alert(_layerID);
	  //console.log('layer ID: ' + _layerID);
	  //console.log(this.map.getBasemap());
	  _currentBaseMap = this.map.getBasemap();
	  
	  LayerInfos.getInstance(this.map, this.map.itemInfo).then(function(layerInfosObject){

		  var dslayer = layerInfosObject.getLayerInfoById(_layerID);
		  console.log(dslayer.title);
		  dom.byId('title').innerHTML = dslayer.title;
		  //Set layers
		  geoenrichedFeatureLayer = dynamicSym.map.getLayer(_layerID);
		  featureLayerStatistics = new FeatureLayerStatistics({layer: geoenrichedFeatureLayer, visible: false});

		  //Set Fields
		  _ClassificationMethod = geoenrichedFeatureLayer.renderer.classificationMethod;
		  _fieldName = geoenrichedFeatureLayer.renderer.attributeField;

		  //first time opened create number spinner and classes slider
		  // if(dynamicSymbology.numberClasses == null || dynamicSymbology.slider == null){
			//   console.log("numberClasses is not null");
			//   //set value of numClasses
			//
		  // }else{
			//   //Set numclasses
			//   dynamicSymbology.numberClasses.set('value', geoenrichedFeatureLayer.renderer.infos.length);
			//   //set classes slider
			//   dynamicSymbology.slider.set("breakInfos", geoenrichedFeatureLayer.renderer.infos);
			//   dynamicSymbology.slider.set("classificationMethod", geoenrichedFeatureLayer.renderer.classificationMethod);
			//   dynamicSymbology.slider.set("class", "sliderAreaRight");
		  // }
		  //set number of classes spinner
		  dynamicSymbology.numberClasses = new NumberSpinner({
			  value: geoenrichedFeatureLayer.renderer.infos.length,
			  smallDelta: 1,
			  constraints: { min:1, max:20},
			  intermediateChanges:true,
			  style: "width:100px; height: 20px; lineHeight: 20px"
		  });
		  dynamicSymbology.numberClasses.placeAt(dom.byId("numClasses"));
		  dynamicSymbology.numberClasses.startup();
		  //set initail slider
		  //var sliderNode = domConstruct.create("div",null,"esri-colorinfoslider1", "first");
		  dynamicSymbology.slider = new ClassedColorSlider({
			  id: "classedSlider",
			  breakInfos: geoenrichedFeatureLayer.renderer.infos,
			  classificationMethod: geoenrichedFeatureLayer.renderer.classificationMethod,
			  class: "sliderAreaRight"
		  });
		  dynamicSymbology.slider.placeAt("esri-colorinfoslider1");
		  dynamicSymbology.slider.startup();

		  //set classificatoin Method
		  dynamicSymbology.classSelect.set('value', geoenrichedFeatureLayer.renderer.classificationMethod);
		  //dynamicSym._updateSmartMapping2();
		  //on change event for slider
			dynamicSymbology.slider.on("handle-value-change", function (sliderValueChange) {
				 //alert("slider changed");
				 var symbol = new SimpleFillSymbol();
				symbol.setColor(new Color([150, 150, 150, 0.5]));

				 var renderer = new ClassBreaksRenderer(symbol, geoenrichedFeatureLayer.renderer.attributeField);
				 renderer.addBreak(sliderValueChange[0]);
				 renderer.addBreak(sliderValueChange[1]);
				 renderer.addBreak(sliderValueChange[2]);
				 renderer.addBreak(sliderValueChange[3]);
				 renderer.addBreak(sliderValueChange[4]);

				 //change classification dropdown to manual
				 dynamicSymbology.classSelect.set('value', 'manual');

				 geoenrichedFeatureLayer.setRenderer(renderer);
				 geoenrichedFeatureLayer.redraw();
				 //console.log(renderer);
		   });
	  });
		//On Classification method change
		dynamicSymbology.classSelect.on("change", function (c) {
			_ClassificationMethod = c;
				if(c != "manual"){
					//alert(dynamicSymbology.numberClasses.value);
					//call smartmapping
					dynamicSym._updateSmartMapping2();

				}
		});
		//On number of classes change
		dynamicSymbology.numberClasses.on("change", function (c) {
			_NumberOfClasses = c;
			//alert("changing");
			if(dynamicSymbology.isSmartMapping == true){
				dynamicSym._updateSmartMapping2();
			}else{
				dynamicSym._updateSmartMapping2();
			}

		});

	},
	
	_updateSmartMapping2: function(){
		console.log("UpdateSmartMapping");
		_busy.show();
		if(dynamicSymbology.isSmartMapping == false){
			dynamicSymbology.isSmartMapping = true;
		}
      //_busy.show();
      //console.log("Create Renderer");
	  //console.log("classification: " + _ClassificationMethod);
	  //console.log("field: " + _fieldName);
	  //console.log("Num Classes: " + _NumberOfClasses);
	  //console.log("baseMap: " + _currentBaseMap);
	  
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
				console.log(statistics);
				dynamicSymbology.slider.set("breakInfos", smartRenderer.renderer.infos);
				dynamicSymbology.slider.set("minValue", statistics.min);
				dynamicSymbology.slider.set("maxValue", statistics.max);
				dynamicSymbology.slider.set("statistics", statistics);
				dynamicSymbology.slider.set("histogram", histogram);
				
				console.log(smartRenderer);
				console.log(histogram);
		  });

			_busy.hide();

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
		dynamicSymbology.slider.destroy();
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