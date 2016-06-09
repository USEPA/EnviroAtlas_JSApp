dynamicSymbology = {};
define(['dojo/_base/declare',
      'jimu/BaseWidget',
	  'jimu/LayerInfos/LayerInfos',
      "dojo/dom",
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
      "dijit/ColorPalette",
	  "dijit/form/Select",
	  "dijit/form/NumberSpinner",
	  "dojo/parser"],
function(declare, BaseWidget, LayerInfos, dom, Map, Color, ColorInfoSlider,
	ClassedColorSlider, smartMapping, FeatureLayer, FeatureLayerStatistics,
	ClassBreaksRenderer, SimpleFillSymbol, esriStylesChoropleth, busyIndicator,
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
		
		//set number of classes
		dynamicSymbology.numberClasses = new NumberSpinner({
			value: "1",
			smallDelta: 1,
			constraints: { min:1, max:20},
			intermediateChanges:true,
			style: "width:100px; height: 20px; lineHeight: 20px"
		});
		dynamicSymbology.numberClasses.placeAt(dom.byId("numClasses"));
		dynamicSymbology.numberClasses.startup();

      // Setup color palette
      //var myPalette = new ColorPalette({
      //  value: curColor,
      //  palette: "7x10",
      //  onChange: function(val){
      //    //alert(val);
      //    curColor = new Color(val);
      //    dojo.style(dojo.byId('colorBtn'),{backgroundColor: val});
      //  }
      //}, "colorPick").startup();

      //console.log(map.graphicsLayerIds);
      //define featureLayeer and featureLayer statistics
      //This will need to be passed in from TOC
      //geoenrichedFeatureLayer = new FeatureLayer(url, {outFields: ["*"]});
      //featureLayerStatistics = new FeatureLayerStatistics({layer: geoenrichedFeatureLayer, visible: false});
      //map.addLayer(geoenrichedFeatureLayer);

      //var BusyIndicator = busyIndicator.create({target: dom.byId("esri-colorinfoslider1"), imageUrl: "./widgets/DynamicSymbology/images/busy-indicator.gif", backgroundOpacity: 0});


      //geoenrichedFeatureLayer.on("load", function (){
      //  //alert("loading");
      //  //suggest scale range
      //  //featureLayerStatistics.getSuggestedScaleRange().then(function (scaleRange){
      //  //  //console.log("suggested scale range", scaleRange);
      //  //  geoenrichedFeatureLayer.setScaleRange(scaleRange.minScale, scaleRange.maxScale);
      //  //  map.setScale(scaleRange.minScale);
      //  //});
      //  updateSmartMapping();
      //});

      //Initial startup of colorInfoSider
      // slider7 = new ClassedColorSlider({
        // colorInfo: {
          // stops:[
            // {color: new Color([92,92,92]), label: "50", value: 50},
            // {color: new Color([92,92,92]), label: "51", value: 51}
          // ]
        // }
      // }, "esri-colorinfoslider1");

      // colorInfoSlider.startup();

      //dom.byId("histClassification").onchange = function () {
        //console.log("load new Histogram");
        //dynamicSym._updateSmartMapping();
      //};

      //this._updateSmartMapping();
      //updateSmartMapping();
      
    },
	
	onReceiveData: function(name, widgetId, data, historyData) {
		console.log(data.message);
		//dom.byId('title').innerHTML = data.message;
		_layerID = data.message;
		
		
		
	},

    onOpen: function(){
      
      _busy = busyIndicator.create("esri-colorinfoslider1");
     
      console.log('onOpen');
      var dynamicSym = this;
	  
	  console.log('layer ID: ' + _layerID);
	  console.log(this.map.getBasemap());
	  _currentBaseMap = this.map.getBasemap();
	  
	  LayerInfos.getInstance(this.map, this.map.itemInfo).then(function(layerInfosObject){
			var dslayer = layerInfosObject.getLayerInfoById(_layerID);
			console.log(dslayer.title);
			dom.byId('title').innerHTML = dslayer.title;
			geoenrichedFeatureLayer = dynamicSym.map.getLayer(_layerID);
			featureLayerStatistics = new FeatureLayerStatistics({layer: geoenrichedFeatureLayer, visible: false});
			//set value of numClasses
			dynamicSymbology.numberClasses.set('value', geoenrichedFeatureLayer.renderer.infos.length);
			console.log(geoenrichedFeatureLayer.renderer);
			//set field
			_fieldName = geoenrichedFeatureLayer.renderer.attributeField;
			//set slider
			dynamicSymbology.slider = new ClassedColorSlider({
					breakInfos: geoenrichedFeatureLayer.renderer.infos,
					classificationMethod: geoenrichedFeatureLayer.renderer.classificationMethod,
					class: "sliderAreaRight"
					
			}, "esri-colorinfoslider1");
			dynamicSymbology.slider.startup();
				
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
			if(dynamicSymbology.isSmartMapping == true){
				dynamicSym._updateSmartMapping2();
			}else{
				
			}
		});
	},
	
	_updateSmartMapping2: function(){
		console.log("UpdateSmartMapping");
		
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
		  
		  
		  
          //colorInfoSlider.set("primaryHandle", sliderHandleInfo["primaryHandle"]);
          //_busy.hide();

          // slider7.on("handle-value-change", function (sliderValueChange) {
            // //console.log("handle-value-change", sliderValueChange);
			// console.log(sliderValueChange);
			// console.log(geoenrichedFeatureLayer);
			// //geoenrichedFeatureLayer.renderer.setColorInfo([sliderValueChange]);
            // geoenrichedFeatureLayer.renderer.setVisualVariables(sliderValueChange);
			
			// console.log(geoenrichedFeatureLayer.renderer);
            // geoenrichedFeatureLayer.redraw();
          // });
  

          // update the slider's zoomed state
          // dom.byId("sliderZoomButton").onchange = function () {

            // var zoomOptions,
                // bottomHandlerValue,
                // topHandlerValue,
                // zoomInViewBottomValue,
                // zoomInViewTopValue,
                // getHistogramParams;

            // // If checked
            // if (dom.byId("sliderZoomButton").checked) {
              // _busy.show();
              // // Get current handle values
              // bottomHandlerValue = colorInfoSlider.get("colorInfo").stops[0].value;
              // topHandlerValue = colorInfoSlider.get("colorInfo").stops[4].value;

              // // Calculate the minimum and maximum values of the zoomed slider
              // zoomInViewBottomValue = bottomHandlerValue - (topHandlerValue - bottomHandlerValue) / 3;
              // zoomInViewTopValue = topHandlerValue + (topHandlerValue - bottomHandlerValue) / 3;

              // // Fallback to statistics if values are out of expected range
              // if (zoomInViewBottomValue < colorRenderer.statistics.min) {
                // zoomInViewBottomValue = colorRenderer.statistics.min;
              // }
              // if (zoomInViewTopValue > colorRenderer.statistics.max) {
                // zoomInViewTopValue = colorRenderer.statistics.max;
              // }

              // // Histogram generation using new values
              // getHistogramParams = {
                // field: fieldName,
                // numBins: 10,
                // minValue: zoomInViewBottomValue,
                // maxValue: zoomInViewTopValue
              // };

              // // Use new FeatureLayer statisticsPlugin module
              // geoenrichedFeatureLayer.statisticsPlugin.getHistogram(getHistogramParams).then(function (histogram) {

                // zoomOptions = {
                  // "histogram": histogram,
                  // minSliderValue: zoomInViewBottomValue,
                  // maxSliderValue: zoomInViewTopValue
                // };

                // // Update the Slider
                // colorInfoSlider.set("zoomOptions", zoomOptions);

              // });

            // } else {
              // // Unzoom the Slider
              // colorInfoSlider.set("zoomOptions", null);
            // }
            // _busy.hide();
          // }

        }).otherwise(function (error) {
          //_busy.hide();
          console.log("An error occurred while calculating the histogram, Error: %o", error);
        });

      }).otherwise(function (error) {
        //_busy.hide();
        console.log("An error occurred while creating the color renderer, Error: %o", error);
      });
	  
	},

    onClose: function(){
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