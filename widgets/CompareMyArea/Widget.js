define([
 'dojo/_base/declare',
 'dojo/_base/window',
 'dojo/string',
 'dojo/on',
 'dojo/_base/Color',
 'dojo/dom',
 'dojo/dom-construct',  
 'dijit/registry', 
 'dojox/xml/parser',
 'jimu/BaseWidget',
 'dojo/_base/lang', 
 "esri/dijit/Search",
 "esri/tasks/query", 
 "esri/tasks/QueryTask",
 "esri/tasks/IdentifyTask",
 "esri/tasks/IdentifyParameters",
 'esri/layers/GraphicsLayer',
 "esri/symbols/SimpleFillSymbol",
 'esri/symbols/SimpleMarkerSymbol',
 'esri/symbols/SimpleLineSymbol',
 'esri/renderers/SimpleRenderer',
 'esri/toolbars/draw',
 'esri/request',
 'esri/InfoTemplate',
 'esri/geometry/Point',
 'esri/geometry/webMercatorUtils',
 'esri/graphic',
 'esri/graphicsUtils',
 './EJinfoWindow',
 './configLocal'
 ],
function(
  declare,
  win, 
  string,
  on,
  Color,
  dom,
  domConstruct,
  registry,
  parser,
  BaseWidget, 
  lang,
  Search,
  Query, 
  QueryTask,
  IdentifyTask,
  IdentifyParameters,
  GraphicsLayer,
  SimpleFillSymbol,
  SimpleMarkerSymbol,
  SimpleLineSymbol,
  SimpleRenderer,
  Draw,
  esriRequest,
  InfoTemplate,
  Point,
  webMercatorUtils,
  Graphic,
  graphicsUtils,
  EJinfoWindow,
  _config
  ) {
  //To create a widget, you need to derive from BaseWidget.
  return declare([BaseWidget], {
    // Custom widget code goes here   
    baseClass: 'jimu-widget-CompareMyArea',    
    //this property is set by the framework when widget is loaded.
     name: 'CompareMyArea',    
    // wabWidget: null,
   //methods to communication with app container:
    postCreate: function() {
      this.inherited(arguments);
      var search = new Search({
        map: this.map,
        enableHighlight: false,
        enableInfoWindow: false
     }, this.searchNode);
     search.startup();
     this.own(on(search,"select-result", lang.hitch(this, this.addGraphic)));    
     this.idtype = "watershed";
     if (this.map.getLayer("CMALayer")) {
        this.CMALayer = this.map.getLayer("CMALayer");
    } else {
        this.CMALayer = new GraphicsLayer({ id: "CMALayer" });
        this.map.addLayer(this.CMALayer);
        
    }
     
    },
   startup: function() {
     this.inherited(arguments);     
     window.cmaMapPoint = null;
     if (this.drawTool) {
        this.drawTool.deactivate();
     }
     this.drawTool = new Draw(this.map);
   },
   clickAction: function(evt) {
       
        var evtid = evt.target.id;
		console.log("evtid: " + evtid)
        //if (evtid == "map_gc")  {
            
            window.cmaMapPoint = evt.mapPoint;
        
            if (this.idtype == "watershed") {
                this.identifyLayers(evt.mapPoint);
            } else {
                this.queryLayers(evt.mapPoint);
            }
        //}
   },
   _changetype: function(e) {
    this.idtype = e.target.value;
    if (window.cmaMapPoint != null) {
        if (this.idtype == "watershed") {
            this.identifyLayers(window.cmaMapPoint);
        } else {
            this.queryLayers(window.cmaMapPoint);
        }
    }
   },
   addGraphic: function(evt) {
    
    if(evt.result){
        this.CMALayer.clear();
        var epoint = evt.result.feature.geometry;
        window.cmaMapPoint = epoint;
        //this.map.setExtent(evt.result.extent.expand(1.25), true);
        console.log("type: " + this.idtype)
        if (this.idtype == "watershed") {
            this.identifyLayers(epoint);
        } else {
            this.queryLayers(epoint);
        }
    }
   },
   identifyLayers: function(geomPoint) {
       console.log("identify");
       this._showloading();
       this.map.infoWindow.hide();
       var itype = this.idtype;
        
        this.clickpoint = geomPoint;
        var idmapurl = _config[itype].mapurl;
        var idindex = _config[itype].layers["huc12"].layerid;
        var cntyindex = _config[itype].layers["county"].layerid;
        var vscalelayers = [];
        vscalelayers.push(idindex);
        vscalelayers.push(cntyindex);
        var wobj = this;
        var identifyTask = new IdentifyTask(idmapurl);

        var identifyParams = new IdentifyParameters();
        identifyParams.tolerance = 0;
        //identifyParams.maxAllowableOffset = 100;
        identifyParams.returnGeometry = true;
        identifyParams.spatialReference = this.map.spatialReference;
        identifyParams.layerIds = vscalelayers;
        identifyParams.layerOption = esri.tasks.IdentifyParameters.LAYER_OPTION_ALL;
        identifyParams.width = this.map.width;
        identifyParams.height = this.map.height;
        identifyParams.geometry = geomPoint;
        identifyParams.mapExtent = this.map.extent;
        //idParamAry.push(identifyParams);
        identifyTask.execute(identifyParams, 
            function(results){
                if (results.length > 0) {
                    wobj.CMALayer.clear();
                    var hucfillSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                        new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASHDOT,
                        new Color([255,0,0]), 2),new Color([255,255,0,0.25]));

                    var cntyfillSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                        new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                        new Color([92,92,92]), 2),new Color([255,255,0,0]));
                        
                    var symbol = new SimpleMarkerSymbol()
                    .setStyle("square")
                    .setColor(new Color([255,0,0,0.5]));
        
                    var graphic = new Graphic(geomPoint, symbol);
                    wobj.CMALayer.add(graphic);
                    var unionExtent = null;
                    for (var j = 0; j < results.length; j++) {
                        var feat = results[j].feature;
                        var lyrName = results[j].layerName;
                        var lyrID = results[j].layerId;
                        var key = "";
                        for (var lyr in _config[itype].layers) {
                            var lid = _config[itype].layers[lyr].layerid;
                            if (lid == lyrID) key = lyr;
                        }
               
                
                
                        var idvalue = '';
                        var iname = '';
                        var idfld = _config[itype].layers[key].idfield;
                        var namefld = _config[itype].layers[key].namefield;
                        if (key == "huc12") {
                            feat.setSymbol(hucfillSymbol);
                        } else {
                            feat.setSymbol(cntyfillSymbol);
                        }
                
                        
                        wobj.CMALayer.add(feat);
                        var uExtent = feat.geometry.getExtent();
                        if (unionExtent == null) unionExtent = uExtent;
                        else unionExtent.union(uExtent);
                        
                        if (key == "huc12") {
                            if (feat.attributes[idfld]) {
                                idvalue = feat.attributes[idfld];
                                iname = feat.attributes[namefld];
                            }
                            var attr = {"idvalue": idvalue, "idtype": itype, "name": iname};
                            graphic.attributes = attr;
                            var tinfoTemplate = new esri.InfoTemplate();
                            tinfoTemplate.setTitle("Compare My Area");
                            tinfoTemplate.setContent(lang.hitch(wobj,wobj.SetDesc));
                            graphic.setInfoTemplate(tinfoTemplate);
                            wobj._showInfoWin(graphic);
                            wobj._hideloading();
                        }
                        
                    }
    
                    
                } else {
                  console.log("Did not find a feature.");
                  wobj._hideloading();
                }

            },
            function (error) {
                console.log("error occurred when identify layers: " + error);
        });
        
   },
   
   queryLayers: function(geomPoint) {
     this._showloading();
     this.map.infoWindow.hide();
     var itype = this.idtype;
     
     this.clickpoint = geomPoint;
     var idmapurl = _config[itype].mapurl;
     var idindex = _config[itype].layerindex;
     var wobj = this;
     var queryTask = new QueryTask(idmapurl + "/" + idindex);
     var query = new Query();
     query.returnGeometry = true;
     query.geometry = geomPoint;
     query.outFields = ['*'];
     queryTask.execute(query, function(results) {
         if (results.features.length>0) {
             wobj.CMALayer.clear();
            
             var fillSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
             new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASHDOT,
             new Color([255,0,0]), 2),new Color([255,255,0,0.25]));

             var symbol = new SimpleMarkerSymbol()
             .setStyle("square")
             .setColor(new Color([255,0,0,0.5]));

             var graphic = new Graphic(geomPoint, symbol);
             wobj.CMALayer.add(graphic);
             
             var idvalue = '';
             var idfld = _config[itype].idfield;
             var feat = results.features[0];
             feat.setSymbol(fillSymbol);
             wobj.CMALayer.add(feat);
             var uExtent = feat.geometry.getExtent();
             //wobj.map.setExtent(uExtent, true);
             if (feat.attributes[idfld]) {
                 idvalue = feat.attributes[idfld];
             }
             var attr = {"idvalue": idvalue, "idtype": itype, "name": ""};
             graphic.attributes = attr;
             var tinfoTemplate = new esri.InfoTemplate();
             tinfoTemplate.setTitle("Compare My Area");
             tinfoTemplate.setContent(lang.hitch(wobj,wobj.SetDesc));
             graphic.setInfoTemplate(tinfoTemplate);
             wobj._showInfoWin(graphic);
             wobj._hideloading();
         } else {
            console.log("Did not find a feature.");
            wobj._hideloading();
             
         }
     }, function(err){
         wobj._hideloading();
         console.log("error occurred: " + err);
     });    
},
   SetDesc: function (graphic) {
    if (dijit.registry.byId("infowg")) {
        dijit.registry.remove("infowg");

    }

    var infowidget = new EJinfoWindow({
        map: this.map,
        inGraphic: graphic,
        folderUrl: this.folderUrl,
        id: 'infowg'
    }, dojo.create('div'));
    infowidget.startup();

    return infowidget.domNode;
},
_showInfoWin: function (g) {
        this.map.infoWindow.clearFeatures();
        this.map.infoWindow.destroyDijits();
        this.map.infoWindow.setTitle(g.getTitle());
        this.map.infoWindow.setContent(g.getContent());
        var locpnt = this.clickpoint;
        this.map.infoWindow.show(locpnt);
    
},

   onOpen: function() {
   	this.drawTool.activate(Draw['POINT']);
   	window.toggleOnCMA = true;
    
    this.publishData({
		message : "mapClickForPopup"
	}); 
	this.mapClickEvt = on(this.map,"click", lang.hitch(this, this.clickAction)); 
    
   },
   onClose: function() {
    this.mapClickEvt.remove();
    window.toggleOnCMA = false;
    document.getElementById("butInitClickEventForPopup").click();
    this.drawTool.deactivate();
   },
     _showloading: function() {
        this.map.disableMapNavigation();
        this.map.hideZoomSlider();
        var x = this.map.width / 2;
        var y = this.map.height / 2;
        if (dom.byId("loadingdiv")) {
            var dummy = dom.byId("loadingdiv");
            dummy.style.position = "absolute";
            dummy.style.left = x + "px";
            dummy.style.top = y + "px";
            dummy.style.display = "block";
            dummy.innerHTML = "Loading...Please wait.";
        } else {              
            var dummy = domConstruct.create("div", { id: 'loadingdiv' }, win.body());               
            dummy.style.position = "absolute";
            dummy.style.left = x + "px";
            dummy.style.top = y + "px";
            dummy.style.display = "block";
            dummy.style.backgroundColor = "#dddddd";
            dummy.style.fontSize = "20px";
            dummy.style.color = "red";
            dummy.innerHTML = "Loading...Please wait.";
            dummy.style.zIndex = "1000";               
        }
    },
    _hideloading: function() {
        this.map.enableMapNavigation();
        this.map.showZoomSlider();
        if (dom.byId("loadingdiv")) {
          domConstruct.destroy("loadingdiv");                
        }
    }
    
  });
});