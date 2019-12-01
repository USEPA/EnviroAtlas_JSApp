define(

['dojo/_base/declare',
"dojo/_base/lang",
"dojo/on",
"dojo/dom-construct",
 'dijit/_Widget',
 'dijit/_Templated',
 'dijit/_WidgetBase',
 'dijit/_TemplatedMixin',
 'dijit/_WidgetsInTemplateMixin',
 'dojo/Evented',
 "dojox/layout/FloatingPane",
 "dojo/text!./EJinfoWindow.html",
 "esri/geometry/webMercatorUtils",
 'esri/symbols/SimpleFillSymbol', 'esri/symbols/SimpleLineSymbol', 'esri/symbols/PictureFillSymbol', 'esri/symbols/SimpleMarkerSymbol',
 'esri/renderers/SimpleRenderer',
 "esri/InfoTemplate",
 'esri/graphic'
], function (
  declare,
  lang,
  on,
  domConstruct,
  _Widget,
  _Templated,
  _WidgetBase,
  _TemplatedMixin,
  _WidgetsInTemplateMixin,
  Evented,
  FloatingPane,
  dijittemplate,
  webMercatorUtils,
  SimpleFillSymbol, SimpleLineSymbol, PictureFillSymbol, SimpleMarkerSymbol,
  SimpleRenderer,
  InfoTemplate,
  Graphic
) {

    
    return declare("EJinfoWindow", [_Widget, _Templated], {
        templateString: dijittemplate,
        widgetsInTemplate: false,
        constructor: function (options, srcRefNode) {

            options = options || {};
            if (!options.map) throw new Error("no map defined in params.");

            this.map = options.map;

            this.currentGraphic = options.inGraphic;
            this.idvalue = this.currentGraphic.attributes["idvalue"];
            this.name = this.currentGraphic.attributes["name"]
            this.idtype = this.currentGraphic.attributes["idtype"];
            var sr = this.currentGraphic.geometry.spatialReference.wkid;
            var geom = this.currentGraphic.geometry;
            if (sr == 102100) {
                geom = webMercatorUtils.webMercatorToGeographic(this.currentGraphic.geometry);
            }

            this.lat = geom.y.toFixed(6);
            this.lon = geom.x.toFixed(6);

            this.folderUrl = options.folderUrl;
            // mixin constructor options 
            dojo.safeMixin(this, options);


        },

        startup: function () {

        },
        postCreate: function () {
            if (this.idtype == "tract") {
                this.tractdiv.style.display = "block";
                this.hucdiv.style.display = "none";
            } else {
                this.tractdiv.style.display = "none";
                this.hucdiv.style.display = "block";
            }
            
        },

        _deleteGraphic: function () {
            var cLayer = this.currentGraphic.getLayer();
            cLayer.clear();
            window.cmaMapPoint = null;
            this.map.infoWindow.hide();

        },

        destroy: function () {

            dojo.empty(this.domNode);
            this.inherited(arguments);
        }

    });


});


