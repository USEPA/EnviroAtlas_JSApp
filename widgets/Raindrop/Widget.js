define(['dojo/_base/declare',
      'jimu/BaseWidget',
      'dojo/on',
      'dojo/_base/lang',
      'jimu/utils',
        'esri/request',
        'dojo/_base/json',
        'esri/graphic',
        'esri/symbols/SimpleLineSymbol',
        'esri/symbols/SimpleMarkerSymbol',
        'esri/Color',
        'esri/geometry/Polyline',
      'jimu/dijit/TabContainer',
    'esri/dijit/HorizontalSlider',
    'esri/dijit/ColorPicker',
    'esri/Color'],
function(declare, BaseWidget, on, lang, utils, esriRequest, dojoJson, Graphic, SimpleLineSymbol, SimpleMarkerSymbol, Color, Polyline, TabContainer, HorizontalSlider, ColorPicker, Color) {

  var curMap;
  var RaindropTool;
  var onMapClick;
  var snapD = 5;  //Snap Distances
  var maxD = 5;   //Max Distance
  var lineTh = 1; //line thickness
  var lineColorPicker;

  return declare([BaseWidget], {
    // DemoWidget code goes here

    //please note that this property is be set by the framework when widget is loaded.
    //templateString: template,

    baseClass: 'jimu-widget-demo',


    postCreate: function() {
      this.inherited(arguments);
      this._initTabContainer();

      console.log('postCreate');
    },

    startup: function() {
      this.inherited(arguments);
      //this.mapIdNode.innerHTML = 'map id:' + this.map.id;

      RaindropTool = this;
      curMap = this.map;

      //Color
      //var curColor = new Color("red");

      //lineColorPicker = new ColorPicker({
      //  color: curColor,
      //  colorsPerRow: 13,
      //  required: true,
      //  showRecentColors: false,
      //  showTransparencySlider: false
      //}, "colorPick").startup();

      //on(this.colorPick, "color-change", function (){
      //  alert(this.color);
      //
      //});

      //set up sliders
      var lineThickness = new HorizontalSlider({
        value: lineTh,
        minimum: 1,
        maximum: 5,
        labels: ["1", "2", "3", "4", "5"],
        showButtons: true,
        style: "width:300px",
        onChange: function(value){
          document.getElementById("lineThickLbl").innerHTML = value.toFixed(2);
          lineTh = value;
        }
      }, "sliderLineThick").startup();

      var maxDistance = new HorizontalSlider({
        value: maxD,
        minimum: 1,
        maximum: 5,
        labels: ["1", "2", "3", "4", "5"],
        showButtons: true,
        style: "width:300px",
        onChange: function(value){
          document.getElementById("maxDistLbl").innerHTML = value.toFixed(2);
          maxD = value;
        }
          }, "sliderMaxDist").startup();

      var snapDistance = new HorizontalSlider({
        value: snapD,
        minimum: 1,
        maximum: 5,
        labels: ["1", "2", "3", "4", "5"],
        showButtons: true,
        style: "width:300px",
        onChange: function(value){
          document.getElementById("snapDistLbl").innerHTML = value.toFixed(2);
          snapD = value;
        }
      }, "sliderSnapDist").startup();


      //Events
      on(this.run_Service, "click", function(){

      });
      onMapClick = on(this.map, "click", function(evt){

        //Get Location of Click
        var point = evt.mapPoint;
        //symbology for point
        var pointSymbol = new SimpleMarkerSymbol().setStyle(
            SimpleMarkerSymbol.STYLE_circle).setColor(
            new Color([255, 0, 0, 0.5])
        );
        //add graphic
        var graphic = new Graphic(point, pointSymbol);
        curMap.graphics.add(graphic);

        RaindropTool._run_RaindropService(point);
      });


      console.log('startup');
    },

    _run_RaindropService: function (point){

      //var service_url = 'http://ofmpub.epa.gov/waters10/PointIndexing.Service';
      alert(maxD + " " + snapD + " " + lineTh);
      //settings for indexing service
      var data = {
        "pGeometry": "POINT(" + point.getLongitude() + " " + point.getLatitude() + ")",
        "pGeometryMod": "WKT,SRSNAME=urn:ogc:def:crs:OGC::CRS84",
        "pPointIndexingMethod": "RAINDROP",
        "pPointIndexingRaindropDist": maxD, //Max Distance
        "pPointIndexingMaxDist": snapD,   //Max Snap Dist
        "pOutputPathFlag": "TRUE",
        "pReturnFlowlineGeomFlag": "FALSE",
        "optOutCS": "SRSNAME=urn:ogc:def:crs:OGC::CRS84",
        "optOutPrettyPrint": 0,
        "optClientRef": "CodePen"
      };
      //Point Indexing service
      var layerUrl = "http://ofmpub.epa.gov/waters10/PointIndexing.Service";
      var layersRequest = esriRequest({
        url: layerUrl,
        content: data,
        handleAs: "json",
        callbackParamName: "callback"
      });
      layersRequest.then(
          function(response) {

            //Line Symbology
            var lineSymbol = new SimpleLineSymbol(
                SimpleLineSymbol.STYLE_SHORTDASHDOTDOT,
                new Color([255, 0, 0]),
                lineTh
            );
            console.log("JSON: ",  dojoJson.toJson(response, true));
            //add polyline to map
            var polyline = new Polyline(response['output']['indexing_path']['coordinates']);

            var graphic = new Graphic(polyline, lineSymbol);
            curMap.graphics.add(graphic);

            console.log("Success: ", dojoJson.toJson(response['output']['indexing_path']['coordinates'], true));
          }, function(error) {
            console.log("Error: ", error.message);
          });

    },

    _initTabContainer: function () {
      var tabs = [];
      tabs.push({
        title: "About",
        content: this.tabNode1
      });
      tabs.push({
        title: "Results",
        content: this.tabNode2
      });
      tabs.push({
        title: "Settings",
        content: this.tabNode3
      });
      this.selTab = this.nls.measurelabel;
      this.tabContainer = new TabContainer({
        tabs: tabs,
        selected: this.selTab
      }, this.tabMain);

      this.tabContainer.startup();
      this.own(on(this.tabContainer, 'tabChanged', lang.hitch(this, function (title) {
        if (title !== this.nls.resultslabel) {
          this.selTab = title;
        }
        //this._resizeChart();
      })));
      utils.setVerticalCenter(this.tabContainer.domNode);
    },

    onOpen: function(){
      console.log('onOpen');
    },

    onClose: function(){

      onMapClick.remove();
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