//>>built
require({cache:{"url:widgets/AddData/search/templates/AddFromFilePane.html":'\x3cdiv class\x3d"secondary-pane add-file-pane"\x3e\r\n\r\n  \x3cdiv class\x3d"generalize-options"\x3e\r\n    \x3cdiv data-dojo-type\x3d"jimu/dijit/CheckBox"\r\n      data-dojo-attach-point\x3d"generalizeCheckBox"\r\n      data-dojo-props\x3d"checked:true"\x3e\r\n    \x3c/div\x3e\r\n  \x3c/div\x3e\r\n\r\n  \x3cdiv class\x3d"browse-or-drop"\x3e\r\n    \x3cdiv class\x3d"drop-container" data-dojo-attach-point\x3d"dropContainer"\x3e\r\n      \x3cdiv class\x3d"drop-area" data-dojo-attach-point\x3d"dropArea"\x3e\r\n        \x3cdiv class\x3d"supported-file-types" data-dojo-attach-point\x3d"supportedFileTypes"\x3e\x3c/div\x3e\r\n        \x3cdiv class\x3d"or"\x3e${i18n.addFromFile.dropOrBrowse}\x3c/div\x3e\r\n        \x3cform class\x3d"file-form" enctype\x3d"multipart/form-data" method\x3d"post"\r\n          data-dojo-attach-point\x3d"fileForm"\x3e\r\n          \x3clabel for\x3d"${id}_file" class\x3d"jimu-btn"\r\n            data-dojo-attach-point\x3d"uploadLabel"\x3e${i18n.addFromFile.browse}\x3c/label\x3e\r\n          \x3cinput id\x3d"${id}_file" name\x3d"file" type\x3d"file" style\x3d"display:none"\r\n            data-dojo-attach-point\x3d"fileNode" /\x3e\r\n        \x3c/form\x3e\r\n        \x3ca href\x3d"#" class\x3d"drop-area-hint" data-dojo-attach-point\x3d"hintButton"\x3e\r\n          \x3ci class\x3d"esri-icon-question"\x3e\x3c/i\x3e\r\n        \x3c/a\x3e\r\n        \x3cspan class\x3d"upload-arrow"\x3e\x3c/span\x3e\r\n      \x3c/div\x3e\r\n    \x3c/div\x3e\r\n  \x3c/div\x3e\r\n\t\x3cdiv data-dojo-attach-point\x3d"lNameFrame" id\x3d"lNameFrame" class\x3d"gap" style\x3d"display: none"\x3e\r\n        \x3clabel for\x3d"${id}_name"\x3e${i18n.addFromUrl.name}\x3c/label\x3e\r\n        \x3cdiv data-dojo-attach-point\x3d"customName" class\x3d"small-gap"\x3e\r\n          \x3cinput id\x3d"${id}_name" type\x3d"text" class\x3d"url-textbox jimu-input"\r\n                 data-dojo-attach-point\x3d"nameTextBox"\x3e\r\n        \x3c/div\x3e\r\n        \x3cdiv class\x3d"action-bar"\x3e\r\n          \x3ca class\x3d"jimu-btn"\r\n              href\x3d"javascript:void(0)"\r\n              data-dojo-attach-point\x3d"addButton"\r\n              data-dojo-attach-event\x3d"onClick: addClicked"\r\n              \x3e${i18n.search.item.actions.add}\r\n          \x3c/a\x3e\r\n      \x3c/div\x3e       \r\n    \x3c/div\x3e\r\n\x3c/div\x3e\r\n'}});
define("dojo/_base/declare dojo/_base/lang dojo/_base/array dojo/_base/json dojo/on dojo/Deferred dojo/dom-class dojo/dom-style dijit/Viewport dojo/sniff dijit/_WidgetBase dijit/_TemplatedMixin dijit/_WidgetsInTemplateMixin dojo/text!./templates/AddFromFilePane.html dojo/i18n!../nls/strings ./LayerLoader ./util dojo/_base/kernel esri/request esri/layers/FeatureLayer esri/layers/KMLLayer esri/geometry/scaleUtils jimu/dijit/Message jimu/dijit/CheckBox".split(" "),function(u,n,p,v,h,w,l,r,x,y,z,A,B,
C,f,t,k,D,q,E,F,G,m){return u([z,A,B],{i18n:f,templateString:C,wabWidget:null,maxRecordCount:1E3,maxRecordThreshold:1E5,fileInfo:null,SHAPETYPE_ICONS:[{type:"shapefile",url:"images/filetypes/zip.svg"},{type:"csv",url:"images/filetypes/csv.svg"},{type:"kml",url:"images/filetypes/kml.svg"},{type:"gpx",url:"images/filetypes/gpx.svg"},{type:"geojson",url:"images/filetypes/geojson.svg"}],postCreate:function(){this.inherited(arguments);this.generalizeCheckBox.setLabel(f.addFromFile.generalizeOn);this.own(x.on("resize",
this.resize()))},destroy:function(){this.inherited(arguments)},startup:function(){if(!this._started){this.wabWidget.isPortal&&(this.SHAPETYPE_ICONS=[{type:"shapefile",url:"images/filetypes/zip.svg"},{type:"csv",url:"images/filetypes/csv.svg"},{type:"kml",url:"images/filetypes/kml.svg"}]);this.inherited(arguments);var a=this,b=this.dropArea,c,d=this.wabWidget.config;if(d.addFromFile)try{c=Number(d.addFromFile.maxRecordCount),"number"!==typeof c||isNaN(c)||(c=Math.floor(c),1<=c&&c<=this.maxRecordThreshold&&
(this.maxRecordCount=c))}catch(g){console.warn("Error setting AddFromFile.maxRecordCount:"),console.warn(g)}if(f.addFromFile.types)try{for(var e in f.addFromFile.types)this._createFileTypeImage(e)}catch(g){console.warn("Error reading support file types:"),console.warn(g)}this.own(h(this.fileNode,"change",function(){if(!a._getBusy()){a._setBusy(!0);var g=a._getFileInfo();g.ok&&(r.set(a.lNameFrame,"display","block"),a.nameTextBox.value=g.baseFileName,a.fileInfo=g)}}));this.own(h(this.uploadLabel,"click",
function(g){a._getBusy()&&(g.preventDefault(),g.stopPropagation())}));this.own(h(b,"dragenter",function(g){g.preventDefault();a._getBusy()||(l.add(b,"hit"),a._setStatus(""))}));this.own(h(b,"dragleave",function(a){a.preventDefault();l.remove(b,"hit")}));this.own(h(b,"dragover",function(a){a.preventDefault()}));this.own(h(b,"drop",function(b){b.preventDefault();b.stopPropagation();a._getBusy()||(a._setBusy(!0),b=a._getFileInfo(b),b.ok&&(r.set(a.lNameFrame,"display","block"),a.nameTextBox.value=b.baseFileName,
a.fileInfo=b))}));c=this.wabWidget.domNode;this.own(h(c,"dragenter",function(a){a.preventDefault()}));this.own(h(c,"dragleave",function(a){a.preventDefault()}));this.own(h(c,"dragover",function(a){a.preventDefault()}));this.own(h(c,"drop",function(a){a.preventDefault()}));this.own(h(this.hintButton,"click",n.hitch(this,function(a){a.preventDefault();a='\x3cdiv class\x3d"intro"\x3e\x3clabel\x3e'+f.addFromFile.intro+"\x3c/label\x3e\x3cul\x3e\x3cli\x3e"+f.addFromFile.types.Shapefile+"\x3c/li\x3e\x3cli\x3e"+
f.addFromFile.types.CSV+"\x3c/li\x3e\x3cli\x3e"+f.addFromFile.types.KML+"\x3c/li\x3e\x3cli\x3e"+f.addFromFile.types.GPX+"\x3c/li\x3e\x3cli\x3e"+f.addFromFile.types.GeoJSON+'\x3c/li\x3e\x3cli\x3e\x3cspan class\x3d"note"\x3e'+f.addFromFile.maxFeaturesAllowedPattern.replace("{count}",this.maxRecordCount)+"\x3c/span\x3e\x3c/li\x3e\x3c/ul\x3e\x3c/div\x3e";this.wabWidget.isPortal&&(a='\x3cdiv class\x3d"intro"\x3e\x3clabel\x3e'+f.addFromFile.intro+"\x3c/label\x3e\x3cul\x3e\x3cli\x3e"+f.addFromFile.types.Shapefile+
"\x3c/li\x3e\x3cli\x3e"+f.addFromFile.types.CSV+"\x3c/li\x3e\x3cli\x3e"+f.addFromFile.types.KML+'\x3c/li\x3e\x3cli\x3e\x3cspan class\x3d"note"\x3e'+f.addFromFile.maxFeaturesAllowedPattern.replace("{count}",this.maxRecordCount)+"\x3c/span\x3e\x3c/li\x3e\x3c/ul\x3e\x3c/div\x3e");new m({message:a})})))}},_addFeatures:function(a,b){var c,d=[],e=a.map,g=0,h=new t;b.layers&&(g=b.layers.length);p.forEach(b.layers,function(b){b=new E(b,{id:h._generateLayerId(),outFields:["*"]});b.xtnAddData=!0;b.graphics&&
(a.numFeatures+=b.graphics.length);0===g?b.name=a.baseFileName:"string"!==typeof b.name||0===b.name.length?b.name=a.baseFileName:0!==b.name.indexOf(a.baseFileName)&&(b.name=f.addFromFile.layerNamePattern.replace("{filename}",a.baseFileName).replace("{name}",b.name));b.id=window.uploadedFeatLayerIdPrefix+b.name;window.uploadedFileColl.push(b.id);h._setFeatureLayerInfoTemplate(b,null,null);b.fullExtent&&(c=c?c.union(b.fullExtent):b.fullExtent);d.push(b)});0<d.length&&(e.addLayers(d),c&&e.setExtent(c.expand(1.25),
!0))},_analyze:function(a,b){if("csv"!==a.fileType.toLowerCase())return b=new w,b.resolve(null),b;var c=null;this.wabWidget.batchGeocoderServers&&0<this.wabWidget.batchGeocoderServers.length&&(c=this.wabWidget.batchGeocoderServers[0]);var d={enableGlobalGeocoding:!0,sourceLocale:D.locale};c&&(d.geocodeServiceUrl=c.url,c.isWorldGeocodeServer&&(d.sourceCountry="world",d.sourceCountryHint=""));c=a.sharingUrl+"/content/features/analyze";d={f:"json",filetype:a.fileType.toLowerCase(),analyzeParameters:window.JSON.stringify(d)};
b=q({url:c,content:d,form:b,handleAs:"json"});b.then(function(b){b&&b.publishParameters&&(a.publishParameters=b.publishParameters)});return b},_createFileTypeImage:function(a){var b=window.isRTL;p.some(this.SHAPETYPE_ICONS,n.hitch(this,function(c,d){if(a.toLowerCase()===c.type.toLowerCase()){var e=document.createElement("IMG");e.src=this.wabWidget.folderUrl+c.url;e.alt=a;0===d?e.className+=" "+(b?"last":"first")+"-type-icon":1===d?e.className+=" second-"+(b?"last":"first")+"-type-icon":d===this.SHAPETYPE_ICONS.length-
2?e.className+=" second-"+(b?"first":"last")+"-type-icon":d===this.SHAPETYPE_ICONS.length-1&&(e.className+=" "+(b?"first":"last")+"-type-icon");this.supportedFileTypes.appendChild(e)}}))},_execute:function(a){var b={map:this.wabWidget.map,sharingUrl:this.wabWidget.getSharingUrl(),baseFileName:a.baseFileName,fileName:a.fileName,fileType:a.fileType,generalize:!!this.generalizeCheckBox.getValue(),publishParameters:{},numFeatures:0};this._setBusy(!0);this._setStatus(f.addFromFile.addingPattern.replace("{filename}",
a.fileName));if("kml"===a.fileType.toLowerCase())return this._executeKml(a);var c=a.fileName,d=this,e=new FormData;e.append("file",a.file);d._analyze(b,e).then(function(){return d._generateFeatures(b,e)}).then(function(a){d._addFeatures(b,a.featureCollection);d._setBusy(!1);d._setStatus(f.addFromFile.featureCountPattern.replace("{filename}",c).replace("{count}",b.numFeatures))}).otherwise(function(a){d._setBusy(!1);d._setStatus(f.addFromFile.addFailedPattern.replace("{filename}",c));console.warn("Error generating features.");
console.warn(a);a&&"string"===typeof a.message&&0<a.message.length&&new m({titleLabel:f._widgetLabel,message:f.addFromFile.generalIssue+"\x3cbr\x3e\x3cbr\x3e"+a.message})})},_executeKml:function(a){var b=this,c=new FileReader,d=this.wabWidget.map,e=function(c,d){b._setBusy(!1);b._setStatus(f.addFromFile.addFailedPattern.replace("{filename}",a.fileName));console.warn(c);console.error(d);d&&"string"===typeof d.message&&0<d.message.length&&new m({titleLabel:f._widgetLabel,message:f.addFromFile.generalIssue+
"\x3cbr\x3e\x3cbr\x3e"+d.message})};c.onerror=function(a){e("FileReader::onerror",a)};c.onload=function(g){if(c.error)e("FileReader::error",c.error);else{var h=g.target.result,l=new t;g=l._generateLayerId();var k=new F("",{id:g,name:a.fileName,linkInfo:{visibility:!1}});k.visible=!0;delete k.linkInfo;k._parseKml=function(){var c=this;this._fireUpdateStart();this._io=q({url:this.serviceUrl,content:{kmlString:encodeURIComponent(h),model:"simple",folders:"",refresh:this.loaded?!0:void 0,outSR:v.toJson(this._outSR.toJson())},
callbackParamName:"callback",load:function(g){c._io=null;c._initLayer(g);l._waitForLayer(k).then(function(c){var e=0;c.name=a.fileName;c.xtnAddData=!0;p.forEach(c.getLayers(),function(a){a&&a.graphics&&0<a.graphics.length&&(e+=a.graphics.length)});var g=d.spatialReference,h=c._outSR;g&&h&&(g.equals(h)||g.isWebMercator()&&4326===h.wkid||h.isWebMercator()&&4326===g.wkid)?d.addLayer(c):new m({titleLabel:f._widgetLabel,message:f.addFromFile.kmlProjectionMismatch});b._setBusy(!1);b._setStatus(f.addFromFile.featureCountPattern.replace("{filename}",
a.fileName).replace("{count}",e))}).otherwise(function(a){e("kml-_waitForLayer.error",a)})},error:function(a){c._io=null;a=n.mixin(Error(),a);a.message="Unable to load KML: "+(a.message||"");c._fireUpdateEnd(a);c._errorHandler(a);e("Unable to load KML",a)}},{usePost:!0})};k._parseKml()}};try{c.readAsText(a.file)}catch(g){e("FileReader::readAsText",g)}},_generateFeatures:function(a,b){var c=a.sharingUrl+"/content/features/generate";a.publishParameters=a.publishParameters||{};var d=n.mixin(a.publishParameters,
{name:a.baseFileName,targetSR:a.map.spatialReference,maxRecordCount:this.maxRecordCount,enforceInputFileSizeLimit:!0,enforceOutputJsonSizeLimit:!0});if(a.generalize){var e=G.getExtentForScale(a.map,4E4).getWidth()/a.map.width;d.generalize=!0;d.maxAllowableOffset=e;for(var e=e/10,f=0;1>e;)e*=10,f++;d.reducePrecision=!0;d.numberOfDigitsAfterDecimal=f}a={f:"json",filetype:a.fileType.toLowerCase(),publishParameters:window.JSON.stringify(d)};return q({url:c,content:a,form:b,handleAs:"json"})},_getBaseFileName:function(a){y("ie")&&
(a=a.split("\\"),a=a[a.length-1]);a=a.split(".");return a=a[0].replace("c:\\fakepath\\","")},_getBusy:function(){return l.contains(this.uploadLabel,"disabled")},_getFileInfo:function(a){var b={ok:!1,file:null,fileName:null,fileType:null};if((a=a?a.dataTransfer.files:this.fileNode.files)&&1===a.length)if(b.file=a=a[0],b.fileName=a.name,k.endsWith(a.name,".zip"))b.ok=!0,b.fileType="Shapefile";else if(k.endsWith(a.name,".csv"))b.ok=!0,b.fileType="CSV";else if(k.endsWith(a.name,".kml"))b.ok=!0,b.fileType=
"KML";else if(k.endsWith(a.name,".gpx"))b.ok=!0,b.fileType="GPX";else if(k.endsWith(a.name,".geojson")||k.endsWith(a.name,".geo.json"))b.ok=!0,b.fileType="GeoJSON";b.ok&&(b.ok=p.some(this.SHAPETYPE_ICONS,function(a){return a.type.toLowerCase()===b.fileType.toLowerCase()}));if(b.ok)b.baseFileName=this._getBaseFileName(b.fileName);else{a=f.addFromFile.invalidType;"string"===typeof b.fileName&&0<b.fileName.length&&(a=f.addFromFile.invalidTypePattern.replace("{filename}",b.fileName));this._setBusy(!1);
this._setStatus(a);var c=document.createElement("div");c.appendChild(document.createTextNode(a));new m({titleLabel:f._widgetLabel,message:c})}return b},resize:function(){},_setBusy:function(a){a?(l.add(this.uploadLabel,"disabled"),l.add(this.dropArea,["hit","disabled"])):(l.remove(this.uploadLabel,"disabled"),l.remove(this.dropArea,["hit","disabled"]))},_setStatus:function(a){this.wabWidget&&this.wabWidget._setStatus(a)},addClicked:function(){this.fileInfo.baseFileName=this.nameTextBox.value;this._execute(this.fileInfo)}})});