define(['dojo/_base/declare',
      'jimu/BaseWidget',
      'dojo/on',
      'dojo/_base/lang',
      'jimu/utils',
        'esri/request',
        'dojo/_base/json',
      'jimu/dijit/TabContainer'],
function(declare, BaseWidget, on, lang, utils, esriRequest, dojoJson, TabContainer) {
  //To create a widget, you need to derive from BaseWidget.
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
      this.mapIdNode.innerHTML = 'map id:' + this.map.id;

      on(this.run_Service, "click", this._run_RaindropService);

      console.log('startup');
    },

    _run_RaindropService: function (){
      alert("hello");

      var service_url = 'http://ofmpub.epa.gov/waters10/PointIndexing.Service';

      var data = {
        "pGeometry": "POINT(-77.03647613525392 38.889696702324095)",
        "pGeometryMod": "WKT,SRSNAME=urn:ogc:def:crs:OGC::CRS84",
        "pPointIndexingMethod": "RAINDROP",
        "pPointIndexingRaindropDist": 5,
        "pPointIndexingMaxDist": 2,
        "pOutputPathFlag": "TRUE",
        "pReturnFlowlineGeomFlag": "FALSE",
        "optOutCS": "SRSNAME=urn:ogc:def:crs:OGC::CRS84",
        "optOutPrettyPrint": 0,
        "optClientRef": "CodePen"
      };

      var layerUrl = "http://ofmpub.epa.gov/waters10/PointIndexing.Service";
      var layersRequest = esriRequest({
        url: layerUrl,
        content: data,
        handleAs: "json",
        callbackParamName: "callback"
      });
      layersRequest.then(
          function(response) {
            console.log("Success: ", dojoJson.toJson(response, true));
          }, function(error) {
            console.log("Error: ", error.message);
          });

    },

    _initTabContainer: function () {
      var tabs = [];
      tabs.push({
        title: "Tab1",
        content: this.tabNode1
      });
      tabs.push({
        title: "Tab2",
        content: this.tabNode2
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