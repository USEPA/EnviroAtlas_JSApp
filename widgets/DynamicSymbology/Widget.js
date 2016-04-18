define(['dojo/_base/declare',
      'jimu/BaseWidget',
      "dojo/dom",
      "esri/map",
      "esri/Color",
      "esri/dijit/ColorInfoSlider",
      "esri/renderers/smartMapping",
      "esri/layers/FeatureLayer",
      "esri/plugins/FeatureLayerStatistics",
      "esri/dijit/util/busyIndicator"],
function(declare, BaseWidget, dom, Map, Color, ColorInfoSlider, smartMapping, FeatureLayer, FeatureLayerStatistics, busyIndicator) {

  //To create a widget, you need to derive from BaseWidget.
  return declare([BaseWidget], {
    // DemoWidget code goes here

    //please note that this property is be set by the framework when widget is loaded.
    //templateString: template,

    baseClass: 'jimu-widget-demo',



    postCreate: function() {
      this.inherited(arguments);
      console.log('postCreate');

    },

    startup: function() {
      this.inherited(arguments);
      console.log('startup');

      //Needed variables
      map = this.map;
      var basemap = "gray";
      var theme = "high-to-low";
      var url = "https://enviroatlas.epa.gov/arcgis/rest/services/Other/CommunityBG_ES_layers/MapServer/45";
      var fieldName= "Wet_P";

      //define featureLayeer and featureLayer statistics
      //This will need to be passed in from TOC
      geoenrichedFeatureLayer = new FeatureLayer(url, {outFields: ["*"]});
      featureLayerStatistics = new FeatureLayerStatistics({layer: geoenrichedFeatureLayer, visible: false});
      map.addLayer(geoenrichedFeatureLayer);

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
      var colorInfoSlider = new ColorInfoSlider({
        colorInfo: {
          stops:[
            {color: new Color([92,92,92]), label: "50", value: 50},
            {color: new Color([92,92,92]), label: "51", value: 51}
          ]
        }
      }, "esri-colorinfoslider1");

      colorInfoSlider.startup();

      dom.byId("histClassification").onchange = function () {

      };

      updateSmartMapping();
      function updateSmartMapping() {
        //alert("smartMapping");
        //console.log("updateSmartMapping");
        //BusyIndicator.show();
        //create and apply color renderer
        smartMapping.createColorRenderer({
          layer: geoenrichedFeatureLayer,
          field: fieldName,
          basemap: basemap,
          theme: theme
        }).then(function (colorRenderer) {
          //console.log("create color renderer is generated", colorRenderer);

          if (!geoenrichedFeatureLayer.visible) {
            geoenrichedFeatureLayer.show();
          }
          geoenrichedFeatureLayer.setRenderer(colorRenderer.renderer);
          geoenrichedFeatureLayer.redraw();

          // --------------------------------------------------------------------
          // Calculate the Histogram
          // --------------------------------------------------------------------
          featureLayerStatistics.getHistogram({
            classificationMethod: dom.byId("histClassification").value,
            field: fieldName,
            numBins: 10
          }).then(function (histogram) {
            //console.log("histogram is created", histogram);
            // --------------------------------------------------------------------
            // Update the ColorInfoSlider and apply FeatureLayerStatistics histogram
            // --------------------------------------------------------------------
            var sliderHandleInfo = getSliderHandlePositions(theme);
            colorInfoSlider.set("colorInfo", colorRenderer.renderer.visualVariables[0]);
            colorInfoSlider.set("minValue", colorRenderer.statistics.min);
            colorInfoSlider.set("maxValue", colorRenderer.statistics.max);
            colorInfoSlider.set("statistics", colorRenderer.statistics);
            colorInfoSlider.set("histogram", histogram);
            colorInfoSlider.set("handles", sliderHandleInfo["handles"]);
            colorInfoSlider.set("primaryHandle", sliderHandleInfo["primaryHandle"]);
            //handle.hide();

            // --------------------------------------------------------------------
            // process slider handle changes
            // Object with keys: type, field, normalizationField, stops
            // --------------------------------------------------------------------
            colorInfoSlider.on("handle-value-change", function (sliderValueChange) {
              //console.log("handle-value-change", sliderValueChange);
              geoenrichedFeatureLayer.renderer.setVisualVariables([sliderValueChange]);
              geoenrichedFeatureLayer.redraw();
            });

            // recreate the renderer when the theme changes
            dom.byId("color-renderer-theme").onchange = function () {
              theme = this.value;
              //busyIndicator.show();
              smartMapping.createColorRenderer({
                layer: geoenrichedFeatureLayer,
                field: fieldName,
                basemap: basemap,
                theme: theme
              }).then(function (colorRenderer) {
                //busyIndicator.hide();
                //console.log("create color renderer is generated", colorRenderer);
                geoenrichedFeatureLayer.setRenderer(colorRenderer.renderer);
                geoenrichedFeatureLayer.redraw();

                var sliderHandleInfo = getSliderHandlePositions(theme);
                colorInfoSlider.set("minValue", colorRenderer.statistics.min);
                colorInfoSlider.set("maxValue", colorRenderer.statistics.max);
                colorInfoSlider.set("colorInfo", colorRenderer.renderer.visualVariables[0]);
                colorInfoSlider.set("handles", sliderHandleInfo["handles"]);
                colorInfoSlider.set("primaryHandle", sliderHandleInfo["primaryHandle"]);

              }).otherwise(function (error) {
                //busyIndicator.hide();
                colorInfoSlider.showHistogram = false;
                console.log("An error occurred while changing the theme, Error: %o", error);
              });
            };

            // update the slider's zoomed state
            dom.byId("sliderZoomButton").onchange = function () {

              var zoomOptions,
                  bottomHandlerValue,
                  topHandlerValue,
                  zoomInViewBottomValue,
                  zoomInViewTopValue,
                  getHistogramParams;

              // If checked
              if (dom.byId("sliderZoomButton").checked) {

                // Get current handle values
                bottomHandlerValue = colorInfoSlider.get("colorInfo").stops[0].value;
                topHandlerValue = colorInfoSlider.get("colorInfo").stops[4].value;

                // Calculate the minimum and maximum values of the zoomed slider
                zoomInViewBottomValue = bottomHandlerValue - (topHandlerValue - bottomHandlerValue) / 3;
                zoomInViewTopValue = topHandlerValue + (topHandlerValue - bottomHandlerValue) / 3;

                // Fallback to statistics if values are out of expected range
                if (zoomInViewBottomValue < colorRenderer.statistics.min) {
                  zoomInViewBottomValue = colorRenderer.statistics.min;
                }
                if (zoomInViewTopValue > colorRenderer.statistics.max) {
                  zoomInViewTopValue = colorRenderer.statistics.max;
                }

                // Histogram generation using new values
                getHistogramParams = {
                  field: fieldName,
                  numBins: 10,
                  minValue: zoomInViewBottomValue,
                  maxValue: zoomInViewTopValue
                };

                // Use new FeatureLayer statisticsPlugin module
                geoenrichedFeatureLayer.statisticsPlugin.getHistogram(getHistogramParams).then(function (histogram) {

                  zoomOptions = {
                    "histogram": histogram,
                    minSliderValue: zoomInViewBottomValue,
                    maxSliderValue: zoomInViewTopValue
                  };

                  // Update the Slider
                  colorInfoSlider.set("zoomOptions", zoomOptions);

                });

              } else {
                // Unzoom the Slider
                colorInfoSlider.set("zoomOptions", null);
              }
            }

          }).otherwise(function (error) {
            //busyIndicator.hide();
            console.log("An error occurred while calculating the histogram, Error: %o", error);
          });

        }).otherwise(function (error) {
          //busyIndicator.hide();
          console.log("An error occurred while creating the color renderer, Error: %o", error);
        });
      }

      //--------------------------------------------------------------------
      // Update ColorInfoSlider handle positions based upon theme chosen.
      // --------------------------------------------------------------------
      function getSliderHandlePositions(theme){
            switch (theme) {
              case "high-to-low":
                return {
                  handles: [0, 4],
                  primaryHandle: null
                };
              case "above-and-below":
                return {
                  handles: [0, 2, 4],
                  primaryHandle: 2
                };
              case "centered-on":
                return {
                  handles: [0, 2, 4],
                  primaryHandle: 2
                };
              case "extremes":
                return {
                  handles: [0, 2, 4],
                  primaryHandle: null
                };
              case "group-similar":
                return {
                  handles: [0, 1, 2, 3, 4],
                  primaryHandle: null
                };
            }
      }
    },

    _updateSmartMapping: function(){
      alert("this happened");
    },

    onOpen: function(){
      BusyIndicator = busyIndicator.create("esri-colorinfoslider1");
      BusyIndicator.show();
      console.log('onOpen');

      geoenrichedFeatureLayer.on("load", function (){
        BusyIndicator.hide();

        //alert("loading");
        //suggest scale range
        //featureLayerStatistics.getSuggestedScaleRange().then(function (scaleRange){
        //  //console.log("suggested scale range", scaleRange);
        //  geoenrichedFeatureLayer.setScaleRange(scaleRange.minScale, scaleRange.maxScale);
        //  map.setScale(scaleRange.minScale);
        //});
        //updateSmartMapping();
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