define(['dojo/_base/declare', 
    'jimu/BaseWidget',
    /*'jimu/loaderplugins/jquery-loader!widgets/DemographicLayers/jquery.min.js',*/ //SAIC note: this line needs to be commented out for EnviroAtlas since it will conflict with the existing juery.
    "dijit/_Widget",
    'dijit/_WidgetsInTemplateMixin',
  "dijit/_Templated",
  'dojo/_base/lang',
  'dojo/on',
  "esri/Color",
    'dijit/form/Slider',
    'dijit/Dialog',
  "esri/renderers/ClassBreaksRenderer",
        "esri/symbols/SimpleFillSymbol",
        "esri/symbols/SimpleMarkerSymbol",
        "esri/tasks/ClassBreaksDefinition",
        'esri/tasks/GenerateRendererTask',
        "esri/tasks/GenerateRendererParameters",
'esri/dijit/Legend',
'esri/tasks/query',
'esri/layers/ArcGISDynamicMapServiceLayer',
"esri/layers/FeatureLayer",
"esri/dijit/PopupTemplate",
"esri/InfoTemplate",
'esri/layers/ImageParameters',
'dijit/form/HorizontalSlider',

"./configLocal",
'jimu/dijit/ColorPicker'],
function(declare, 
    BaseWidget,
    //$,
    _Widget,
    _WidgetsInTemplateMixin,
    _Templated,
    lang,
    on,
    Color,
    Slider,
    Dialog,
    ClassBreaksRenderer, 
    SimpleFillSymbol, 
    SimpleMarkerSymbol,
    ClassBreaksDefinition,
    GenerateRendererTask,
    GenerateRendererParameters,
  esriLegend,
  esriquery,
  ArcGISDynamicMapServiceLayer,
  FeatureLayer,
  PopupTemplate,
  InfoTemplate,
  ImageParameters,
  HorizontalSlider,
  _config,
  ColorPicker) {
  //To create a widget, you need to derive from BaseWidget.
  return declare([BaseWidget,_WidgetsInTemplateMixin], {
    // Custom widget code goes here 
	
    baseClass: 'jimu-widget-DemographicLayers',
    
    //this property is set by the framework when widget is loaded.
     name: 'DemographicLayers',
     
     /*colorThemes:
     [{"startcolor": "#eaf0fd", "endcolor": "#03519e"},
      {"startcolor":"#ebf9e7", "endcolor": "#046e2e"},
      {"startcolor":"#f5f5f5", "endcolor": "#2a2a2a"},
      {"startcolor":"#ffeddd", "endcolor": "#a83a00"},
      {"startcolor":"#f2eef6", "endcolor": "#582890"},
      {"startcolor":"#ffe3d7", "endcolor": "#a71713"},
      {"startcolor":"#ecf7fb", "endcolor": "#006d2a"},
      {"startcolor":"#edf8fa", "endcolor": "#83067e"},
      {"startcolor":"#eef9e8", "endcolor": "#0167af"},
      {"startcolor":"#fff1d7", "endcolor": "#b80201"},
      {"startcolor":"#f0eef6", "endcolor": "#015b90"},
      {"startcolor":"#f5eff7", "endcolor": "#006dfa"},
      {"startcolor":"#f1eef7", "endcolor": "#9c0042"},
      {"startcolor":"#ffebe2", "endcolor": "#7d0078"},
      {"startcolor":"#ffffc9", "endcolor": "#016a35"},
      {"startcolor":"#ffffcb", "endcolor": "#253197"},
      {"startcolor":"#fffed1", "endcolor": "#9e3601"},
      {"startcolor":"#ffffad", "endcolor": "#c20120"},
      {"startcolor":"#a9620d", "endcolor": "#038772"},
      {"startcolor":"#d3168c", "endcolor": "#46ae1b"},
      {"startcolor":"#7c2d96", "endcolor": "#048936"},
      {"startcolor":"#eb6300", "endcolor": "#603b9b"},
      {"startcolor":"#cc0117", "endcolor": "#0471b2"},
      {"startcolor":"#ce0118", "endcolor": "#424242"},
      {"startcolor":"#db1a10", "endcolor": "#287cba"},
      {"startcolor":"#da1baf", "endcolor": "#03983e"},
      {"startcolor":"#db1a10", "endcolor": "#2483bb"}
    ],*/
colorThemes:
        [{ "startcolor": "#ffffb2", "endcolor": "#ff0000" }
        , { "startcolor": "#eaf0fd", "endcolor": "#03519e" }
        , { "startcolor": "#ffccff", "endcolor": "#660066" }
         , { "startcolor": "#D0CFEE", "endcolor": "#322C75" }
       , { "startcolor": "#fef0d9", "endcolor": "#b30000" }
       , { "startcolor": "#FFFFD1", "endcolor": "#B0B080" }
        , { "startcolor": "#f2f0f7", "endcolor": "#54278f" }
        , { "startcolor": "#eff3ff", "endcolor": "#08519c" }
        , { "startcolor": "#f7f7f7", "endcolor": "#252525" }
        , { "startcolor": "#ccffff", "endcolor": "#006666" }
        , { "startcolor": "#ffffcc", "endcolor": "#006837" }
        , { "startcolor": "#ccccff", "endcolor": "#000066" }
        ],
demographicLayerName: "",
//methods to communication with app container:

startup: function () {
    selfDemographic = this;
    this.catType = "";
    this.dfield = "";
    this._serviceWidgets = [];
    this.currentk = 0;
    this.reverseStatus = false;
    this.dtype = "ejdemog";
    this.rendertype = "polygon";
    this.inherited(arguments);

    document.getElementById('censusServiceSelectionHelp').onclick = function (e) {
        var infobox = new Dialog({
                            title: "Data Source",
                            style: 'width: 300px'
                        });

        infotext = "<h2 style='margin-top:0px'>2013-2017 ACS</h2>";
        infotext += "<p>Variables derived from a subset of 2013-2017 American Community Survey data.</p>"
        infotext += "<hr style='margin-top:10px'>";
        infotext += "<h2 style='margin-top:0px'>2010 Census</h2>";
        infotext += "<p>Variables derived from a subset of 2010 Census data.</p>";
        infotext += "<hr style='margin-top:10px'>";
        infotext += "<h2 style='margin-top:0px'>2000 Census</h2>";
        infotext += "<p>Variables derived from a subset of 2000 Census data.</p>";

        var infoDiv = dojo.create('div', {
                        'innerHTML': infotext
                        }, infobox.containerNode);
                        infobox.show()
    };

    document.getElementById('breaksSelectionHelp').onclick = function (e) {
        var infobox = new Dialog({
                            title: "Break Type",
                            style: 'width: 300px'
                        });

        infotext = "<h2 style='margin-top:0px'>Quantile</h2>";
        infotext += "<p>Each class contains an equal number of features. A quantile classification is well suited to linearly distributed data. Quantile assigns the same number of data values to each class. There are no empty classes or classes with too few or too many values.</p>";
        infotext += "<hr style='margin-top:10px'>";
        infotext += "<h2 style='margin-top:0px'>Natural Breaks</h2>";
        infotext += "<p>Natural breaks classes are based on natural groupings inherent in the data. Class breaks are identified that best group similar values and that maximize the differences between classes. </p>";
        infotext += "<hr style='margin-top:10px'>";
        infotext += "<h2 style='margin-top:0px'>Equal Interval</h2>";
        infotext += "<p>Equal interval divides the range of attribute values into equal-sized subranges This method emphasizes the amount of an attribute value relative to other values. Equal interval is best applied to familiar data ranges, such as percentages and temperature.</p>";
        infotext += "<br>"
        infotext += "<p style='font-size:9px'>Source: <a href='http://pro.arcgis.com/en/pro-app/help/mapping/layer-properties/data-classification-methods.htm' target='_blank'>ESRI</a></p>";

        var infoDiv = dojo.create('div', {
                        'innerHTML': infotext
                        }, infobox.containerNode);
                        infobox.show()
    };

    document.getElementById('mapStyleSelectionHelp').onclick = function (e) {
        var infobox = new Dialog({
                            title: "Map Style",
                            style: 'width: 300px'
                        });

        infotext = "<h2 style='margin-top:0px'>Choropleth Map</h2>";
        infotext += "<p>Choropleth maps use different colors or patterns to represent data (e.g., households below poverty) for different geographies (e.g., county, census tract). These maps are useful for identifying spatial patterns or hotspots.</p>";
        infotext += "<div><img style='height:120px; margin-top:5px' src='widgets/DemographicLayers/images/thematic.png'></div><br>";
        infotext += "<hr style='margin-top:10px'>";
        infotext += "<h2 style='margin-top:0px'>Graduated Symbol Map</h2>";
        infotext += "<p>Graduated symbol maps use variable size symbols (e.g., circles) to represent discrete changes in data. These maps are useful when added over other thematic maps or basemaps.</p>";
        infotext += "<div><img style='height:120px; margin-top:5px' src='widgets/DemographicLayers/images/graduated.png'></div><br>";
        
        var infoDiv = dojo.create('div', {
                        'innerHTML': infotext
                        }, infobox.containerNode);
                        infobox.show()
    };
  

},
postCreate: function () {
    this._zoomHandler = on(this.map, "zoom-end", lang.hitch(this,this._adjustToState));
    
    var currenttype = "ejdemog";
    this.classNumNode.value = "5";
    this.bWidthNode.value = "1";
    this.currentk = 0;
    this.createCategory(currenttype);
    this.drawPalette(this.classNumNode.value, this.currentk, this.reverseStatus);

},
_adjustToState: function () {
    var wobj = this;
    
    dojo.forEach(this._serviceWidgets, function (a) {
        var tobj = a;
        var mid = tobj.mid;
        var lid = tobj.fid;
        //var layeruniqueid = mid + lid + "_map";
        var layeruniqueid = window.layerIdDemographPrefix + mid + lid + "_map";
        if (wobj.map.getLayer(layeruniqueid)) {
            var orgactivelayer = tobj.actlayer;
            tobj.layervisible = wobj.map.getLayer(layeruniqueid).visible;
            
            var activelayer = wobj.getActiveLayer(mid, lid);
            //console.log("active layer: " + orgactivelayer + "; current layer: " + activelayer + "; " + layeruniqueid);
            if (orgactivelayer != activelayer) {
                wobj.map.getLayer(layeruniqueid).hide();
                wobj.classbreak(tobj,false);
            }
        }
    });
    
},

createCategory: function (key) {
    this.addBtn.disabled =true;
    this.catType = "";
    this.demogTypeNode.options.length = 0;
    this.demogListNode.options.length = 0;
    var wobj = this;
    wobj.dtype = key;
    var dgObj = _config.demogJSON[key];
    
          

    if (dgObj.process) {
        wobj.createCatList(key);
        wobj.setDefaultListIndex(dgObj.defaultCategoryIndex);           
        wobj.addBtn.disabled = false;
    } else {
        var lookuptableurl = dgObj.layerurl + dgObj.service + "/MapServer/" + dgObj.lookupindex;
        //alert(lookuptableurl);
        var queryTask = new esri.tasks.QueryTask(lookuptableurl);
        var query = new esriquery();

        query.returnGeometry = false;

        query.outFields = ["*"];
        var dirty = (new Date()).getTime();
        query.where = "1=1 AND " + dirty + "=" + dirty;
        if (dgObj.hasOwnProperty('CategoryExcluded')){
            categoryExcluded = dgObj.CategoryExcluded;
            for (var indexCategory = 0; indexCategory < categoryExcluded.length; indexCategory++) {
                query.where = query.where + " AND CATEGORY<>" + "'" + categoryExcluded[indexCategory] + "'";
            }                
        }
        //get features in order by cat and label
        query.orderByFields = ["CATEGORY", "DESCRIPTION"];

        var operation = queryTask.execute(query);
        operation.addCallbacks(function (featset) {
            if (featset.features.length > 0) {
                var fetcount = featset.features.length;
                var catJson = {};
                var layerJson = {};
                var tableJson = {};
                for (var m = 0; m < fetcount; m++) {
                    if (key == "acs2012") {
                        var cat = dojo.trim(featset.features[m].attributes["CATEGORY"]);
                        var colname = dojo.trim(featset.features[m].attributes["FIELD_ID"]);
                        var tablename = dojo.trim(featset.features[m].attributes["TABLE_NAME"]);
                        var tabledesc = dojo.trim(featset.features[m].attributes["TABLE_DESC"]);
                        var desc = dojo.trim(featset.features[m].attributes["DESCRIPTION"]);
                        var lindex = featset.features[m].attributes["LAYER_INDEX"];
                        var bgmin = featset.features[m].attributes["BG_MIN"];
                        var bgmax = featset.features[m].attributes["BG_MAX"];

                        layerJson[colname] = {};
                        layerJson[colname].description = desc;
                        layerJson[colname].layerindex = lindex;
                        layerJson[colname].bg_min = bgmin;
                        layerJson[colname].bg_max = bgmax;



                        if (typeof catJson[tablename] == 'undefined') {
                            catJson[tablename] = [];
                            tableJson[tablename] = tabledesc;
                        }
                        catJson[tablename].push(colname);
                    } else {
                        var cat = dojo.trim(featset.features[m].attributes["CATEGORY"]);
                        var colname = dojo.trim(featset.features[m].attributes["FIELD_NAME"]);
                        var desc = dojo.trim(featset.features[m].attributes["DESCRIPTION"]);

                        var bgmin = featset.features[m].attributes["BG_MIN"];
                        var bgmax = featset.features[m].attributes["BG_MAX"];
                        var trmin = featset.features[m].attributes["TR_MIN"];
                        var trmax = featset.features[m].attributes["TR_MAX"];
                        var cntymin = featset.features[m].attributes["CNTY_MIN"];
                        var cntymax = featset.features[m].attributes["CNTY_MAX"];
                        var stmin = featset.features[m].attributes["ST_MIN"];
                        var stmax = featset.features[m].attributes["ST_MAX"];
                        layerJson[colname] = {};
                        layerJson[colname].description = desc;
                        layerJson[colname].bg_min = bgmin;
                        layerJson[colname].bg_max = bgmax;
                        layerJson[colname].tr_min = trmin;
                        layerJson[colname].tr_max = trmax;
                        layerJson[colname].cnty_min = cntymin;
                        layerJson[colname].cnty_max = cntymax;
                        layerJson[colname].st_min = stmin;
                        layerJson[colname].st_max = stmax;

                        if (typeof featset.features[m].attributes["BLK_MIN"] != 'undefined') {
                            var blkmin = featset.features[m].attributes["BLK_MIN"];
                            var blkmax = featset.features[m].attributes["BLK_MAX"];
                            layerJson[colname].blk_min = blkmin;
                            layerJson[colname].blk_max = blkmax;
                            //alert("Block: " + blkmin + ": " + blkmax);
                        }

                        if (typeof catJson[cat] == 'undefined') {
                            catJson[cat] = [];

                        }
                        catJson[cat].push(colname);
                    }

                }

                _config.demogJSON[key].category = catJson;
                if (key == "acs2012") _config.demogJSON[key].tables = tableJson;
                _config.demogJSON[key].dynamiclayers = layerJson;
                dgObj.process = true;
                wobj.createCatList(key);
                //wobj.setDefaultListIndex(dgObj.defaultCategoryIndex); 

            }
            wobj.addBtn.disabled = false;

        }, function (error) {
            console.log(error);
        });
    }
},
setDefaultListIndex: function (defaultIndex) {
    //set default demog category to Population and update sublist, default for each group set in config object
    this.demogTypeNode.selectedIndex = defaultIndex;
    this._changeDemog();
},
createCatList: function (key) {
    //console.log("create cat list");
    this.demogTypeNode.options.length = 0;
    var n = 0;
    for (var c in _config.demogJSON[key].category) {
        //alert(c + ": " + demogJSON[key].category[c]);
        var option = new Option(c, c);
        if (c == this.catType) option.selected = true;
        this.demogTypeNode.options[n] = option;
        n = n + 1;
    }
    if (this.catType == "") this.catType = this.demogTypeNode.options[0].value;
    this.createColList(key);
},
createColList: function (key) {
    //console.log(" create col list");
    this.demogListNode.options.length = 0;
    var cat = this.catType;
    var fields = _config.demogJSON[key].category[cat];
    var m = 0;
    for (var i = 0; i < fields.length; i++) {
        var fieldname = fields[i];
        var fielddesc = _config.demogJSON[key].dynamiclayers[fieldname].description;
        var option = new Option(fielddesc, fieldname);
        if (fieldname == this.dfield) option.selected = true;
        this.demogListNode.options[m] = option;
        m = m + 1;

    }
    var fkey = this.demogListNode.value;
    this.dfield = fkey;
    var robj = _config.demogJSON[key].dynamiclayers[fkey];
    robj.method = this.classTypeNode.value;
    robj.classes = this.classNumNode.value;
    this.renderobj = robj;
    

},

_reverseColor: function () {
    if (this.reverseStatus) this.reverseStatus = false;
    else this.reverseStatus = true;
    this.drawPalette(this.classNumNode.value, this.currentk, this.reverseStatus);
},
_changeCat: function () {
    this.drawPalette(this.classNumNode.value, this.currentk, this.reverseStatus);
},
_changeService: function () {
    var theme = this.serviceNode.value;

    this.createCategory(theme);
},
_changeDemog: function () {
    //console.log("change demog");
    this.currentk = 0;
    var currentcat = this.demogTypeNode.value;
    this.catType = currentcat;
    var dmtype = this.dtype;
    this.createColList(dmtype);
},
_changeField: function () {
    this.currentk = 0;
    this.dfield = this.demogListNode.value;
    var robj = _config.demogJSON[this.dtype].dynamiclayers[this.dfield];

    robj.method = this.classTypeNode.value;
    robj.classes = this.classNumNode.value;
    this.renderobj = robj;
    
},
_changeRendertype: function(e) {
    var rtype = e.target.value;
    if (rtype == "polygon") {
        this.polyNode.style.display = "block";
        this.pointNode.style.display = "none";
        this.rendertype = rtype;
        this.colormarkertd.innerHTML = "Colors:"
    } else {
        this.polyNode.style.display = "none";
        this.pointNode.style.display = "block";
        this.rendertype = rtype;
        this.colormarkertd.innerHTML = "Marker:"
    }
},
_mapDemog: function (e) {
    this.addspining(e);
    var frm = this.renderform;
    
    var mapid = this.dtype;
    var fieldid = this.demogListNode.value;
    var dmethod = this.classTypeNode.value;
    var dclass = this.classNumNode.value;
    var robj = _config.demogJSON[this.dtype].dynamiclayers[fieldid];
    robj.rendertype = this.rendertype;
    robj.method = dmethod;
    robj.classes = dclass;
    if (this.rendertype == "polygon") {
        var fcolor = frm.startcolor.value;
        var ecolor = frm.endcolor.value;
        robj.fromcolor = fcolor;
        robj.tocolor = ecolor;
    } else {
        robj.circlecolor = this.colorpnt.getColor();
        robj.circlemins = this.minsizeNode.value;
        robj.circlemaxs = this.maxsizeNode.value;
    }
    robj.mid = mapid;
    robj.fid = fieldid;
    
    robj.linecolor = this.color1.getColor();
    robj.linewidth = parseInt(this.bWidthNode.value);
    

    robj.opcvalue = 1 - this.demogsliderNode.value;

    var svcobj = this.serviceNode;
    var svcdesc = svcobj.options[svcobj.selectedIndex ].text;
    robj.svcdesc = svcdesc;
    var fieldobj = this.demogListNode;
    var fielddesc = fieldobj.options[fieldobj.selectedIndex ].text;
    robj.fielddesc = fielddesc;
    robj.layervisible = true;
    this.classbreak(robj,true);
},
classbreak: function (renderobj) {
    var mapid = renderobj.mid;
    var fieldid = renderobj.fid;
    var activelayer = this.getActiveLayer(mapid, fieldid);
    var descstr = _config.demogJSON[mapid].baselayers[activelayer].level;
    this.levelDiv.innerHTML = descstr;
    renderobj.actlayer = activelayer;
    var renderuniquekey = fieldid + "_" + renderobj.method + "_" + renderobj.classes;
    if (_config.demogJSON[mapid].baselayers[activelayer].renderobj[renderuniquekey]) {
        this._mapRender(renderobj);
    } else {
        this._genRender(renderobj);
        //this._mapRender(renderobj);
    }

},
_getRenderer: function (currentLayer, optionsArray, renderobj){

    var fielddesc = renderobj.fielddesc;
    var svcdesc = renderobj.svcdesc;
    var opcvalue = renderobj.opcvalue;
    var mapid = renderobj.mid;
    var fieldid = renderobj.fid;
    var layervisible = renderobj.layervisible;
    //console.log(mapid + "; " + fieldid + "; " + renderobj.rendertype)
    var activelayer = this.getActiveLayer(mapid, fieldid);
    var headerfields = _config.demogJSON[mapid].baselayers[activelayer].headerfields;
    
    renderobj.actlayer = activelayer;
    
    
    var renderuniquekey = fieldid + "_" + renderobj.method + "_" + renderobj.classes;
    
    var linewidth = renderobj.linewidth;
    var linecolor = renderobj.linecolor;
    var mycolors = this.generateColors(renderobj.classes, renderobj.fromcolor, renderobj.tocolor);
    var classDef = new esri.tasks.ClassBreaksDefinition();
    classDef.classificationField = fieldid;
    classDef.classificationMethod = renderobj.method; // always natural breaks
    classDef.breakCount = renderobj.classes; // always five classes
    if (renderobj.rendertype == "polygon") {
        var colorRamp = new esri.tasks.AlgorithmicColorRamp();
        colorRamp.fromColor = new dojo.colorFromHex(renderobj.fromcolor);
        colorRamp.toColor = new dojo.colorFromHex(renderobj.tocolor);
        colorRamp.algorithm = "hsv"; // options are:  "cie-lab", "hsv", "lab-lch"
        var linesym = new esri.symbol.SimpleLineSymbol(
            esri.symbol.SimpleLineSymbol.STYLE_SOLID,
            new dojo.Color(linecolor)
            );
        if (linewidth > 0) linesym.setWidth(linewidth);
        else linesym = null;
        var bsymbol = new esri.symbol.SimpleFillSymbol(
            esri.symbol.SimpleFillSymbol.STYLE_SOLID,
        linesym,
            null
        );
        classDef.baseSymbol = bsymbol;
        classDef.colorRamp = colorRamp;
    }	
	
    var minfield = currentLayer + "_min";
    var maxfield = currentLayer + "_max";
    var layerminvalue = null;
    var layermaxvalue = null;
    if (_config.demogJSON[mapid].dynamiclayers[fieldid][minfield]) layerminvalue = _config.demogJSON[mapid].dynamiclayers[fieldid][minfield];
    if (_config.demogJSON[mapid].dynamiclayers[fieldid][maxfield]) layermaxvalue = _config.demogJSON[mapid].dynamiclayers[fieldid][maxfield];

    if ((layerminvalue == null) && (layermaxvalue == null)) {
        if (currentLayer == "blk") {
            currentLayer = "bg";
        } else if (currentLayer == "bg") {
            currentLayer = "tr";
        } else if (currentLayer == "tr") {
            currentLayer = "cnty";
        }
        var minfield = currentLayer + "_min";
        var maxfield = currentLayer + "_max";
        layerminvalue = _config.demogJSON[mapid].dynamiclayers[fieldid][minfield];
        layermaxvalue = _config.demogJSON[mapid].dynamiclayers[fieldid][maxfield];
        
    }
    //this.levelDiv.innerHTML = _config.demogJSON[mapid].baselayers[activelayer].level;
    var params = new esri.tasks.GenerateRendererParameters();
    params.classificationDefinition = classDef;
    var dataUrl = _config.demogJSON[mapid].layerurl + _config.demogJSON[mapid].service + "/MapServer";
    var alyrindex = _config.demogJSON[mapid].baselayers[currentLayer].layeridx;
    

    var generateRenderer = new esri.tasks.GenerateRendererTask(dataUrl + "/" + alyrindex);

    generateRenderer.execute(params, function (renderer) {
        renderer.infos[0].minValue = layerminvalue;
        renderer.infos[renderer.infos.length - 1].maxValue = layermaxvalue;
        for (var m = 0; m < renderer.infos.length; m++) {
            //alert(renderer.infos[m].minValue + "; " + renderer.infos[m].maxValue);
            renderer.infos[m].symbol.setColor(mycolors[m]);
            renderer.infos[m].label = Number(renderer.infos[m].minValue).toFixed(0) + " - " + Number(renderer.infos[m].maxValue).toFixed(0);
        }
        _config.demogJSON[mapid].baselayers[currentLayer].renderobj[renderuniquekey] = renderer;
        var drawingOptions = new esri.layers.LayerDrawingOptions();
        //var layeridstr = mapid + fieldid + "_map";
        var layeridstr = window.layerIdDemographPrefix+ mapid + fieldid + "_map";
        
        if (renderobj.rendertype == "polygon") {
            renderobj.renderer = renderer;
            drawingOptions.renderer = renderer;
            optionsArray[alyrindex] = drawingOptions;

            
        } else {
            var pntrenderer = new ClassBreaksRenderer();
            pntrenderer.attributeField = renderer.attributeField;

            //----------------------
            // Fill symbol
            //----------------------

            // (1) Define a FILL symbol used to draw county polygons.
            var fillSymbol = new SimpleFillSymbol();
            fillSymbol.setColor(new Color([0, 0, 0, 0]));
            fillSymbol.outline.setColor(new Color([133, 133, 133, .5]));
            fillSymbol.outline.setWidth(0);

            pntrenderer.backgroundFillSymbol = fillSymbol;
            pntrenderer.valueExpressionTitle = fielddesc;
            var pntcolor = renderobj.circlecolor;
           
            var minsize = Number(renderobj.circlemins);
            var maxsize = Number(renderobj.circlemaxs);
            var sinterval = (maxsize - minsize) / (Number(renderobj.classes)-1);
            for (var m = 0; m < renderer.infos.length; m++) {
                var markerSymbol = new SimpleMarkerSymbol();
                markerSymbol.setColor(new Color(pntcolor));
                
                markerSymbol.outline.setColor(new Color(linecolor));
                markerSymbol.outline.setWidth(linewidth);
                var s = parseInt(minsize + m*sinterval);
                //console.log("size: " + s);
                markerSymbol.setSize(s);
                pntrenderer.addBreak({
                    minValue: renderer.infos[m].minValue,
                    maxValue: renderer.infos[m].maxValue,
                    label: renderer.infos[m].label,
                    symbol: markerSymbol
                });
            
            }
            drawingOptions.renderer = pntrenderer;
            optionsArray[alyrindex] = drawingOptions;
        }
    });
        
        //end of setting optionsArray	
	
},
_genRender: function (renderobj) {
    var wobj = this;
    var fielddesc = renderobj.fielddesc;
    var svcdesc = renderobj.svcdesc;
    var opcvalue = renderobj.opcvalue;
    var mapid = renderobj.mid;
    var fieldid = renderobj.fid;
    var layervisible = renderobj.layervisible;
    //console.log(mapid + "; " + fieldid + "; " + renderobj.rendertype)
    var activelayer = this.getActiveLayer(mapid, fieldid);
    var headerfields = _config.demogJSON[mapid].baselayers[activelayer].headerfields;
    
    renderobj.actlayer = activelayer;
    
    
    var renderuniquekey = fieldid + "_" + renderobj.method + "_" + renderobj.classes;
    
    var linewidth = renderobj.linewidth;
    var linecolor = renderobj.linecolor;
    var mycolors = this.generateColors(renderobj.classes, renderobj.fromcolor, renderobj.tocolor);
    var classDef = new esri.tasks.ClassBreaksDefinition();
    classDef.classificationField = fieldid;
    classDef.classificationMethod = renderobj.method; // always natural breaks
    classDef.breakCount = renderobj.classes; // always five classes
    if (renderobj.rendertype == "polygon") {
        var colorRamp = new esri.tasks.AlgorithmicColorRamp();
        colorRamp.fromColor = new dojo.colorFromHex(renderobj.fromcolor);
        colorRamp.toColor = new dojo.colorFromHex(renderobj.tocolor);
        colorRamp.algorithm = "hsv"; // options are:  "cie-lab", "hsv", "lab-lch"
        var linesym = new esri.symbol.SimpleLineSymbol(
            esri.symbol.SimpleLineSymbol.STYLE_SOLID,
            new dojo.Color(linecolor)
            );
        if (linewidth > 0) linesym.setWidth(linewidth);
        else linesym = null;
        var bsymbol = new esri.symbol.SimpleFillSymbol(
            esri.symbol.SimpleFillSymbol.STYLE_SOLID,
        linesym,
            null
        );
        classDef.baseSymbol = bsymbol;
        classDef.colorRamp = colorRamp;
    }
    //arrayLayer = ["bg", "cnty", "st", "tr"];
	

	
	
    var minfield = activelayer + "_min";
    var maxfield = activelayer + "_max";
    var layerminvalue = null;
    var layermaxvalue = null;
    if (_config.demogJSON[mapid].dynamiclayers[fieldid][minfield]) layerminvalue = _config.demogJSON[mapid].dynamiclayers[fieldid][minfield];
    if (_config.demogJSON[mapid].dynamiclayers[fieldid][maxfield]) layermaxvalue = _config.demogJSON[mapid].dynamiclayers[fieldid][maxfield];

    if ((layerminvalue == null) && (layermaxvalue == null)) {
        if (activelayer == "blk") {
            activelayer = "bg";
        } else if (activelayer == "bg") {
            activelayer = "tr";
        } else if (activelayer == "tr") {
            activelayer = "cnty";
        }
        var minfield = activelayer + "_min";
        var maxfield = activelayer + "_max";
        layerminvalue = _config.demogJSON[mapid].dynamiclayers[fieldid][minfield];
        layermaxvalue = _config.demogJSON[mapid].dynamiclayers[fieldid][maxfield];
        renderobj.actlayer = activelayer;
    }
    //this.levelDiv.innerHTML = _config.demogJSON[mapid].baselayers[activelayer].level;
    var params = new esri.tasks.GenerateRendererParameters();
    params.classificationDefinition = classDef;
    var dataUrl = _config.demogJSON[mapid].layerurl + _config.demogJSON[mapid].service + "/MapServer";
    var optionsArray = [];          
    var blayers = _config.demogJSON[mapid].baselayers;
    for (var currentLayer in blayers) {
		wobj._getRenderer(currentLayer, optionsArray, renderobj);
    }
    

    

        
    //end of setting optionsArray
    var alyrindex = _config.demogJSON[mapid].baselayers[activelayer].layeridx;
    var layeridstr = window.layerIdDemographPrefix+ mapid + fieldid + "_map";
 	setTimeout(lang.hitch(this, function() {       
        if (wobj.map.getLayer(layeridstr)) {
            var dmlayer = wobj.map.getLayer(layeridstr);
            wobj.map.removeLayer(dmlayer);
        } else {
            wobj._serviceWidgets.push(renderobj);
        }
        var dmlayer = new ArcGISDynamicMapServiceLayer(dataUrl, {
                "id": layeridstr,
                "opacity": opcvalue,
                "visible": layervisible
            });
            
        window.demographicLayerSetting[layeridstr]={};
        //It is very important to save the infor in following order. They will be used to load value in saveSession widget in the desired order
        window.demographicLayerSetting[layeridstr]["serviceNode"] = selfDemographic.serviceNode.value; 			//It is Source such as: 2012-2016 ACS
        window.demographicLayerSetting[layeridstr]["demogTypeNode"] = selfDemographic.demogTypeNode.value;       //It is Category such as "EDUCATION"
        window.demographicLayerSetting[layeridstr]["demogListNode"] = selfDemographic.demogListNode.value;       //It is variable such as: 10th Grade    
        //radio button
        window.demographicLayerSetting[layeridstr]["rendertype"]  = selfDemographic.rendertype;  //It is polygon or point
        
        window.demographicLayerSetting[layeridstr]["classTypeNode"] = selfDemographic.classTypeNode.value;       //It is Method such as: Quantile
        window.demographicLayerSetting[layeridstr]["classNumNode"] = selfDemographic.classNumNode.value;         //It is Breaks such as: 1, 2,..., 5       
      
        //for polygon only
        if (window.demographicLayerSetting[layeridstr]["rendertype"] == "polygon") {
	        window.demographicLayerSetting[layeridstr]["currentk"] = selfDemographic.currentk; 						// It is the Color break Selection; it determines the color scheme index starting from 0; end with 11
			window.demographicLayerSetting[layeridstr]["reverseStatus"] = selfDemographic.reverseStatus;				// It is true or false;  it is called in this.drawPalette
        }
        
        //for point only
        if (window.demographicLayerSetting[layeridstr]["rendertype"] == "point") {
	        window.demographicLayerSetting[layeridstr]["colorpnt"] = selfDemographic.colorpnt.picker.value; 
	        
	        window.demographicLayerSetting[layeridstr]["minsizeNode"] = selfDemographic.minsizeNode.value;
	        window.demographicLayerSetting[layeridstr]["maxsizeNode"] = selfDemographic.maxsizeNode.value;          	
        }

        
        window.demographicLayerSetting[layeridstr]["demogsliderNode"] = selfDemographic.demogsliderNode.value;
        window.demographicLayerSetting[layeridstr]["bWidthNode"] = selfDemographic.bWidthNode.value;
        
        wobj.map.addLayer(dmlayer);
        
        dmlayer.on("update-start",lang.hitch(wobj,wobj.showloading,layeridstr));
        dmlayer.on("update-end",lang.hitch(wobj,wobj.hideloading,layeridstr));
        var infostr = "";
        for (var f in headerfields) {
            var ilabel = headerfields[f];
            infostr += ilabel + ": ${" + f +"}<br />";
            
        }
        infostr += fielddesc + ": ${" + fieldid + ": NumberFormat(places:0)}";
        var infoTemplate = new InfoTemplate(fielddesc, infostr);
        var iTemplates = {};
        iTemplates[alyrindex] = {infoTemplate: infoTemplate};

        dmlayer.setInfoTemplates(iTemplates);
        dmlayer.setVisibleLayers([alyrindex]);
        dmlayer.setLayerDrawingOptions(optionsArray);

            //var dtitle = fielddesc + " (" + svcdesc + ")";
            var dtitle = window.demographicsTitlePrefix + fielddesc + " (" + svcdesc + ")";
            //dmlayer.name = fielddesc;
            dmlayer.title = dtitle;
            this.demographicLayerName = dtitle;
            dmlayer.isDynamic = true;
            dmlayer.renderField = fieldid;
            dmlayer.layerType = mapid + "_" + alyrindex;
            dmlayer.renderIndex = alyrindex;
            
            if (renderobj.whereclause) {
                var layerdef = [];
                layerdef[alyrindex] = renderobj.whereclause;
                dmlayer.setLayerDefinitions(layerdef);
            }

     
        wobj.removespining();
    }), 6000);



},
_mapRender: function(renderobj) {
    var fielddesc = renderobj.fielddesc;
    var svcdesc = renderobj.svcdesc;
    var opcvalue = renderobj.opcvalue;
    var mapid = renderobj.mid;
    var fieldid = renderobj.fid;
    var layervisible = renderobj.layervisible;
    //console.log(mapid + "; " + fieldid + "; " + renderobj.rendertype)
    var activelayer = this.getActiveLayer(mapid, fieldid);
    var headerfields = _config.demogJSON[mapid].baselayers[activelayer].headerfields;
    renderobj.actlayer = activelayer;
    var alyrindex = null;
    var dataUrl = _config.demogJSON[mapid].layerurl + _config.demogJSON[mapid].service + "/MapServer";
    var renderuniquekey = fieldid + "_" + renderobj.method + "_" + renderobj.classes;
    var orgrender = null;
    var linewidth = renderobj.linewidth;
    var linecolor = renderobj.linecolor;
	
    var optionsArray = [];
    //var layeridstr = mapid + fieldid + "_map";
	var layeridstr = window.layerIdDemographPrefix+ mapid + fieldid + "_map"; 
	//get renderer for all layers
    var blayers = _config.demogJSON[mapid].baselayers;
    for (var currentLayer in blayers) {
		orgrender = _config.demogJSON[mapid].baselayers[currentLayer].renderobj[renderuniquekey];
		alyrindex = _config.demogJSON[mapid].baselayers[currentLayer].layeridx;
	    if (renderobj.rendertype == "polygon") {
	        var mycolors = this.generateColors(renderobj.classes, renderobj.fromcolor, renderobj.tocolor);
	        for (var m = 0; m < orgrender.infos.length; m++) {
	            //console.log(mycolors[m]);
	            orgrender.infos[m].symbol.setColor(mycolors[m]);
	            orgrender.infos[m].symbol.outline.setColor(new Color(linecolor));
	            orgrender.infos[m].symbol.outline.setWidth(linewidth);
	
	        }
	        renderobj.renderer = orgrender;
	        var drawingOptions = new esri.layers.LayerDrawingOptions();
	        drawingOptions.renderer = orgrender;	        
	        optionsArray[alyrindex] = drawingOptions;
	    } else {
	        var pntrenderer = new ClassBreaksRenderer();
	        pntrenderer.attributeField = orgrender.attributeField;
	        var fillSymbol = new SimpleFillSymbol();
	        fillSymbol.setColor(new Color([0, 0, 0, 0]));
	        fillSymbol.outline.setColor(new Color([133, 133, 133, .5]));
	        fillSymbol.outline.setWidth(0);
	
	        pntrenderer.backgroundFillSymbol = fillSymbol;
	        pntrenderer.valueExpressionTitle = fielddesc;
	        var pntcolor = renderobj.circlecolor;
	       
	        var minsize = Number(renderobj.circlemins);
	        var maxsize = Number(renderobj.circlemaxs);
	        var sinterval = (maxsize - minsize) / (Number(renderobj.classes)-1);
	        for (var m = 0; m < orgrender.infos.length; m++) {
	            var markerSymbol = new SimpleMarkerSymbol();
	            markerSymbol.setColor(new Color(pntcolor));
	            
	            markerSymbol.outline.setColor(new Color(linecolor));
	            markerSymbol.outline.setWidth(linewidth);
	            var s = parseInt(minsize + m*sinterval);
	            //console.log("size: " + s);
	            markerSymbol.setSize(s);
	            pntrenderer.addBreak({
	                minValue: orgrender.infos[m].minValue,
	                maxValue: orgrender.infos[m].maxValue,
	                label: orgrender.infos[m].label,
	                symbol: markerSymbol
	            });
	        
	        }
	        renderobj.renderer = pntrenderer;
	        var drawingOptions = new esri.layers.LayerDrawingOptions();
	        drawingOptions.renderer = pntrenderer;
	        optionsArray[alyrindex] = drawingOptions;
	    }
    }
    alyrindex = _config.demogJSON[mapid].baselayers[activelayer].layeridx;
    //end of getting renderer for all layers
    

    if (this.map.getLayer(layeridstr)) {
        var dmlayer = this.map.getLayer(layeridstr);
        this.map.removeLayer(dmlayer);
    } else {
        this._serviceWidgets.push(renderobj);
    }
    var dmlayer = new ArcGISDynamicMapServiceLayer(dataUrl, {
            "id": layeridstr,
            "opacity": opcvalue,
            "visible": layervisible
        });

    this.map.addLayer(dmlayer);
    dmlayer.on("update-start",lang.hitch(this,this.showloading,layeridstr));
    dmlayer.on("update-end",lang.hitch(this,this.hideloading,layeridstr));
    var infostr = "";
    for (var f in headerfields) {
        var ilabel = headerfields[f];
        infostr += ilabel + ": ${" + f +"}<br />";
        
    }
    infostr += fielddesc + ": ${" + fieldid + ": NumberFormat(places:0)}";
    var infoTemplate = new InfoTemplate(fielddesc, infostr);
    var iTemplates = {};
    iTemplates[alyrindex] = {infoTemplate: infoTemplate};

    dmlayer.setInfoTemplates(iTemplates)
    dmlayer.setVisibleLayers([alyrindex]);
    dmlayer.setLayerDrawingOptions(optionsArray);

        //var dtitle = fielddesc + " (" + svcdesc + ")";
        var dtitle = window.demographicsTitlePrefix + fielddesc + " (" + svcdesc + ")";
        //dmlayer.name = fielddesc;
        dmlayer.title = dtitle; 
        this.demographicLayerName = dtitle;        
        
        dmlayer.isDynamic = true;
        dmlayer.renderField = fieldid;
        dmlayer.layerType = mapid + "_" + alyrindex;
        dmlayer.renderIndex = alyrindex;
        
        if (renderobj.whereclause) {
            var layerdef = [];
            layerdef[alyrindex] = renderobj.whereclause;
            dmlayer.setLayerDefinitions(layerdef);
        }
        this.removespining();
},
showloading: function(key) {
    
    var loaddivid = "loadingdiv_" + key;
    var cx = (this.map.width / 2) - 50;
    var cy = this.map.height / 2;
    if (document.getElementById(loaddivid)) {
        document.getElementById(loaddivid).innerHTML = "Loading Demographic layer... Please wait.";
        document.getElementById(loaddivid).style.top = parseInt(cx) + "px";
        document.getElementById(loaddivid).style.left = parseInt(cy) + "px";
    } else {
        var dummy = document.createElement("div");
        dummy.id = loaddivid;
        dummy.style.position = "absolute";
        
        dummy.style.left = (cx) + "px";
        dummy.style.top = (cy) + "px";
        dummy.innerHTML = "Loading Demographic layer... Please wait.";
        dummy.style.display = "block";
        dummy.style.zIndex = "1000";
        dummy.style.backgroundColor = "#cccccc";
        dummy.style.fontSize = "14pt";
        dummy.style.color = "Red";
        document.body.appendChild(dummy);
        
    }
    //console.log("start update: " + key + "; cx: " + cx + ", cy: " + cy);
    this.map.disableMapNavigation();
    this.map.hideZoomSlider();
},
hideloading: function(key) {
    //console.log("end update: " + key);
    var loaddivid = "loadingdiv_" + key;
    if (document.getElementById(loaddivid)) {
        var dummy = document.getElementById(loaddivid);
        document.body.removeChild(dummy);
    }
    this.map.enableMapNavigation();
    this.map.showZoomSlider();
},
addspining: function(event) {
    var x;
    var y;

    if (event.x != undefined && event.y != undefined) {
        
        x = event.clientX;
        y = event.clientY;

    }
    else // Firefox method to get the position
    {
        x = event.clientX + document.body.scrollLeft +
              document.documentElement.scrollLeft;
        y = event.clientY + document.body.scrollTop +
              document.documentElement.scrollTop;
       
    }


    if (document.getElementById("spindiv")) {
        var dummy = document.getElementById("spindiv");
        dummy.style.position = "absolute";
        dummy.style.left = (x) + "px";
        dummy.style.top = (y) + "px";
        dummy.style.display = "block";
        
    } else {
        var dummy = document.createElement("div");
        dummy.id = "spindiv";
        dummy.style.position = "absolute";
        
        dummy.style.left = (x) + "px";
        dummy.style.top = (y) + "px";
        dummy.innerHTML = "<img src='" + this.folderUrl + "images/hourglas.gif' alt='loading...' />";
        dummy.style.display = "block";
        dummy.style.zIndex = "1000";
        document.body.appendChild(dummy);
    }
},
removespining: function() {
    if (document.getElementById("spindiv")) {
        var dummy = document.getElementById("spindiv");
        document.body.removeChild(dummy);
    }
},
getActiveLayer: function (mid, fldid) {
    var zlevel = this.map.getLevel();
    var actlayer = "bg";

    var blayers = _config.demogJSON[mid].baselayers;
    for (var b in blayers) {
        var minl = blayers[b].minlevel;
        var maxl = blayers[b].maxlevel;
        var lindex = blayers[b].layeridx;
        if ((zlevel < maxl) && (zlevel >= minl)) {
            actlayer = b;

        }
    }


    return actlayer;
},

ArrayContains: function (element, inArray) {
    for (var j = 0; j < inArray.length; j++) {
        if (element == inArray[j]) {
            return true;
        }
    }
    return false;
},
generateColors: function(steps, scolor, ecolor) {
    var stepFactor = 1 / (steps - 1);
        var newcolors = [];
        var c1 = new Color(scolor);
        var c2 = new Color(ecolor);
        for (i = 0; i < steps; i++) {
            var factor = stepFactor * i;
            var r = Math.round(c1.r + factor * (c2.r - c1.r));
            var g = Math.round(c1.g + factor * (c2.g - c1.g));
            var b = Math.round(c1.b + factor * (c2.b - c1.b));
            var curcolor = new Color([r,g,b]);
            //var curcolor = this.rgb2hex(r,g,b);
            newcolors.push(curcolor);
            
        }
        
        return newcolors;
},
rgb2hex: function (red, green, blue) {
    var rgb = blue | (green << 8) | (red << 16);
    return '#' + (0x1000000 + rgb).toString(16).slice(1)
},
tablePalette: function(count, scolor, ecolor) {

var pctvalue = 100 / (count + 1);
var divwidth = 32* (count + 1);
var c1 = new Color(scolor);
var c2 = new Color(ecolor);
var deltaR = Math.floor((c2.r - c1.r)/count);
var deltaG = Math.floor((c2.g - c1.g)/count);
var deltaB = Math.floor((c2.b - c1.b)/count);
var colorcol = '';
colorcol += '<table cellpadding="0" cellspacing="0" style="width: ' + divwidth + 'px; height: 12px;">';
colorcol += '<tr>';

for(var i=0;i<=count;i++){
var r = c1.r + deltaR * i;
var g = c1.g + deltaG * i;
var b = c1.b + deltaB * i;
colorcol += '<td width="' + pctvalue + '%" style="background-color: rgb(' + parseInt(r) + "," + parseInt(g) + "," + parseInt(b) + ');"></td>'
//var color = new Color([r,g,b,255]);
//console.log(color)
}

colorcol += '</tr>';
colorcol += '</table>';

return colorcol;
},
drawPalette: function(catnum, ck,reverse) {
//console.log("draw palette" + catnum);
var selectorOwner = this.selector;
var rect = selectorOwner.getBoundingClientRect();

var tp = rect.bottom;
var lt = rect.left;
// var tp = selectorOwner.offset().top + (selectorOwner.outerHeight());
// var lt = selectorOwner.offset().left;
if (document.getElementById("colorlist")) {
    document.getElementById("colorlist").innerHTML = "";
    document.getElementById("colorlist").style.top = parseInt(tp) + "px";
    document.getElementById("colorlist").style.left = parseInt(lt) + "px";
} else {
    var pandiv = dojo.create("div",
        {
            id: "colorlist",
            style:"position: absolute; z-index: 401; display: none; top: " + parseInt(tp) + "px; left: " + parseInt(lt) + "px; background-color: #cccccc;"
        });
    document.body.appendChild(pandiv);
}
    var colorstep = parseInt(catnum) - 1;
    var tbobj = dojo.create("table");

    document.getElementById("colorlist").appendChild(tbobj);


    var trobj;
for (var k = 0; k < this.colorThemes.length; k++) {
    var cobj = this.colorThemes[k];
    var scolor = cobj.startcolor;
    var ecolor = cobj.endcolor;
    if (reverse) {
        scolor = cobj.endcolor;
        ecolor = cobj.startcolor;
    }
    
    if ((k % 2) == 0) {
        trobj = dojo.create("tr");
        tbobj.appendChild(trobj);
    } 
    var str = this.tablePalette(colorstep, scolor, ecolor);
    //console.log("color str: "+str);
    var wobj = this;
    var tdobj = dojo.create("td",{
        style:"padding: 4px 10px 4px 10px;",
        value: k,
        onmouseover: function(e) {this.style.backgroundColor = '#666666';},
        onmouseout: function(e) {this.style.backgroundColor = 'transparent';},
        onclick: function(e) {wobj.changecontent(this,this.value );},
        innerHTML: str
    });
    trobj.appendChild(tdobj);
    
    if (k == ck) {
        //tdobj.style.borderColor = "cyan";
        this.selectcolor.innerHTML = str;
        this.renderform.startcolor.value = scolor;
        this.renderform.endcolor.value = ecolor;

    }
}

//console.log(document.getElementById("colorlist").innerHTML);
},
_changeSelector: function(e){
var selectorOwner = this.selectcolor;
var rect = selectorOwner.getBoundingClientRect();

var tp = rect.bottom;
var lt = rect.left;
$("#colorlist").css("top", parseInt(tp) + "px");
$("#colorlist").css("left", parseInt(lt) + "px");

$("#colorlist").slideToggle("slow");
},
changecontent: function(dobj,currentindex) {
//console.log("currentindex: " + currentindex)
var cobj = this.colorThemes[currentindex];
var scolor = cobj.startcolor;
var ecolor = cobj.endcolor;
if (this.reverseStatus) {
    scolor = cobj.endcolor;
    ecolor = cobj.startcolor;
}
var dstr = dobj.innerHTML;
this.selectcolor.innerHTML = dstr;
document.getElementById("colorlist").style.display = "none";
this.currentk = currentindex;
this.renderform.startcolor.value = scolor;
this.renderform.endcolor.value = ecolor;

},
highlight: function(dobj) {
dobj.style.backgroundColor = "cyan";
},
clearhighlight:function(dobj) {
dobj.style.backgroundColor = "transparent";
},
destroy: function () {
    //this._zoomHandler.remove();
    dojo.empty(this.domNode);
    this.inherited(arguments);
}

// onOpen: function(){
//   console.log('onOpen');
// },

// onClose: function(){
//   console.log('onClose');
// },

// onMinimize: function(){
//   console.log('onMinimize');
// },

// onMaximize: function(){
//   console.log('onMaximize');
// },

// onSignIn: function(credential){
//   /* jshint unused:false*/
//   console.log('onSignIn');
// },

// onSignOut: function(){
//   console.log('onSignOut');
// }
  
// onPositionChange: function(){
//   console.log('onPositionChange');
// },

// resize: function(){
//   console.log('resize');
// }

//methods to communication between widgets:

});
});