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
    'esri/Color',
      "dijit/ColorPalette",
      "dijit/TooltipDialog",
    "dijit/form/DropDownButton",
        "dijit/popup",
      "dojo/dom",
    "dojo/parser"],
function(declare, BaseWidget, on, lang, utils, esriRequest, dojoJson, Graphic, SimpleLineSymbol, SimpleMarkerSymbol, Color, Polyline, TabContainer, HorizontalSlider, ColorPicker, Color, ColorPalette, TooltipDialog, DropDownButton, popup, dom) {

  var curMap;
  var RaindropTool;
  var onMapClick;
  var snapD = 5;  //Snap Distances
  var maxD = 5;   //Max Distance
  var lineTh = 1; //line thickness
  var curColor = new Color("#ff0000");


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
      var myPalette = new ColorPalette({
        value: curColor,
        palette: "7x10",
        onChange: function(val){
          //alert(val);
          curColor = new Color(val);
          dojo.style(dojo.byId('colorBtn'),{backgroundColor: val});
        }
      }, "colorPick").startup();

      //Popup
      var myTooltipDialog = new TooltipDialog({
        id: 'myTooltipDialog',
        //style: "width: 300px;",
        content: dom.byId('colorPick'),
        onMouseLeave: function(){
          popup.close(myTooltipDialog);
        }
      });

      on(dom.byId('colorBtn'), 'click', function(){
        popup.open({
          popup: myTooltipDialog,
          around: dom.byId('colorBtn')
        });
      });

      //set up sliders
      var lineThickness = new HorizontalSlider({
        value: lineTh,
        minimum: 1,
        maximum: 5,
        labels: ["1", "2", "3", "4", "5"],
        showButtons: true,
        style: "width:250px",
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
        style: "width:250px",
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
        style: "width:250px",
        onChange: function(value){
          document.getElementById("snapDistLbl").innerHTML = value.toFixed(2);
          snapD = value;
        }
      }, "sliderSnapDist").startup();


      //Events
      on(this.clear, "click", function(){
        curMap.graphics.clear();
        document.getElementById("lineID").innerHTML = '';
        document.getElementById("lineDist").innerHTML = '';
        document.getElementById("linePath").innerHTML = '';
        document.getElementById("noResults").innerHTML = '<b>Select Raindrop Point</b>';
        console.log("Raindrop Tool: Cleared Graphics");
      });

      on(this.run_Service, "click", function(){
        //toggle map onclick event
        if(typeof onMapClick != 'undefined'){

          dojo.style(dojo.byId('selectPoint'),{backgroundColor: '#485566'});
          //remove map click event
          onMapClick.remove();
          onMapClick = undefined;
        }else{
          dojo.style(dojo.byId('selectPoint'),{backgroundColor: '#596d87'});
          //add map click event
          onMapClick = on(curMap, "click", function(evt){
            //Get Location of Click
            var point = evt.mapPoint;
            //symbology for point
            var pointSymbol = new SimpleMarkerSymbol().setStyle(
                SimpleMarkerSymbol.STYLE_circle, 5).setColor(
                new Color([255, 0, 0, 0.5])
            );
            //add graphic
            var graphic = new Graphic(point, pointSymbol);
            curMap.graphics.add(graphic);

            RaindropTool._run_RaindropService(point);
          });
        }
      });



      console.log('startup');
    },

    _run_RaindropService: function (point){

      //var service_url = 'http://ofmpub.epa.gov/waters10/PointIndexing.Service';
      //alert(maxD + " " + snapD + " " + lineTh);
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
      var layerUrl = "https://ofmpub.epa.gov/waters10/PointIndexing.Service";
      var layersRequest = esriRequest({
        url: layerUrl,
        content: data,
        handleAs: "json",
        callbackParamName: "callback"
      });
      layersRequest.then(
          function(response) {
            if(response['output'] != null){
              //Line Symbology
              var lineSymbol = new SimpleLineSymbol(
                  SimpleLineSymbol.STYLE_SHORTDASHDOTDOT,
                  curColor,
                  lineTh
              );
              console.log("JSON: ",  dojoJson.toJson(response, true));
              //add polyline to map
              var polyline = new Polyline(response['output']['indexing_path']['coordinates']);

              var graphic = new Graphic(polyline, lineSymbol);
              curMap.graphics.add(graphic);

              var totDist = response['output']['total_distance'];
              var pathDist = response['output']['path_distance'];

              //add info to results
              document.getElementById("noResults").innerHTML ="";
              document.getElementById("lineID").innerHTML = '<p><b>Line ID: </b>' + response['output']['feature_id'];
              document.getElementById("lineDist").innerHTML = '<p><b>Total Distance (km): </b>' + totDist.toFixed(2);
              document.getElementById("linePath").innerHTML = '<p><b>Path Distance (km): </b>' + pathDist.toFixed(2);

              console.log("Success: Returned Raindrop Path");
              //console.log("Success: ", dojoJson.toJson(response['output']['indexing_path']['coordinates'], true));
            }else{
              document.getElementById("noResults").innerHTML = '<b>No Results Returned</b>';
              console.log("Success: ", dojoJson.toJson(response['output']['indexing_path']['coordinates'], true));
            }

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
      if(typeof onMapClick != 'undefined'){
        onMapClick.remove();
        onMapClick = undefined;
        dojo.style(dojo.byId('selectPoint'),{backgroundColor: '#485566'});
      }

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