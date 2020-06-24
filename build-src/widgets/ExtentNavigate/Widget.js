// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See http://js.arcgis.com/3.15/esri/copyright.txt and http://www.arcgis.com/apps/webappbuilder/copyright.txt for details.
//>>built
require({cache:{"esri/toolbars/navigation":function(){define("dojo/_base/declare dojo/_base/lang dojo/_base/connect dojo/_base/Color dojo/has ../kernel ./_toolbar ../undoManager ../OperationBase ../geometry/Extent ../geometry/Rect ../symbols/SimpleLineSymbol ../symbols/SimpleFillSymbol ../graphic".split(" "),function(g,f,c,b,h,k,q,r,t,u,l,m,n,v){var e=g(q,{declaredClass:"esri.toolbars.Navigation",_eventMap:{"extent-history-change":!0},constructor:function(a){this.zoomSymbol=new n(n.STYLE_SOLID,new m(m.STYLE_SOLID,
new b([255,0,0]),2),new b([0,0,0,.25]));c.connect(a,"onUnload",this,"_cleanUp");this.map=a;this._undoManager=new r({maxOperations:-1});this._normalizeRect=f.hitch(this,this._normalizeRect);this._onMouseDownHandler=f.hitch(this,this._onMouseDownHandler);this._onMouseUpHandler=f.hitch(this,this._onMouseUpHandler);this._onMouseDragHandler=f.hitch(this,this._onMouseDragHandler);this._swipeCheck=h("esri-pointer");this._onExtentChangeHandler_connect=c.connect(a,"onExtentChange",this,"_extentChangeHandler");
this._onMapLoad_connect=c.connect(a,"onLoad",this,"_mapLoadHandler");a.loaded&&a.extent&&(this._currentExtent=a.extent)},_mapLoadHandler:function(){this._currentExtent=this.map.extent},_navType:null,_start:null,_graphic:null,_prevExtent:!1,_currentExtent:null,_preExtent:null,_cleanUp:function(a){c.disconnect(this._onExtentChangeHandler_connect);c.disconnect(this._onMapLoad_connect)},activate:function(a){var d=this.map;this._graphic||(this._deactivateMapTools(!0,!1,!1,!0),this._graphic=new v(null,
this.zoomSymbol));switch(a){case e.ZOOM_IN:case e.ZOOM_OUT:this._deactivate();this._swipeCheck?(this._onMouseDownHandler_connect=c.connect(d,"onSwipeStart",this,"_onMouseDownHandler"),this._onMouseDragHandler_connect=c.connect(d,"onSwipeMove",this,"_onMouseDragHandler"),this._onMouseUpHandler_connect=c.connect(d,"onSwipeEnd",this,"_onMouseUpHandler")):(this._onMouseDownHandler_connect=c.connect(d,"onMouseDown",this,"_onMouseDownHandler"),this._onMouseDragHandler_connect=c.connect(d,"onMouseDrag",
this,"_onMouseDragHandler"),this._onMouseUpHandler_connect=c.connect(d,"onMouseUp",this,"_onMouseUpHandler"));this._navType=a;break;case e.PAN:this._deactivate(),d.enablePan(),this._navType=a}},_extentChangeHandler:function(a){this._prevExtent||this._nextExtent?this._currentExtent=a:(this._preExtent=this._currentExtent,this._currentExtent=a,this._preExtent&&this._currentExtent&&(a=new e.MapExtent({map:this.map,preExtent:this._preExtent,currentExtent:this._currentExtent}),this._undoManager.add(a)));
this._prevExtent=this._nextExtent=!1;this.onExtentHistoryChange()},_deactivate:function(){var a=this._navType;if(a===e.PAN)this.map.disablePan();else if(a===e.ZOOM_IN||a===e.ZOOM_OUT)c.disconnect(this._onMouseDownHandler_connect),c.disconnect(this._onMouseDragHandler_connect),c.disconnect(this._onMouseUpHandler_connect)},_normalizeRect:function(a,d,b){var p=a.x;a=a.y;var c=d.x;d=d.y;return{x:Math.min(p,c),y:Math.max(a,d),width:Math.abs(p-c),height:Math.abs(a-d),spatialReference:b}},_onMouseDownHandler:function(a){this._start=
a.mapPoint},_onMouseDragHandler:function(a){var d=this._graphic,b=this.map.graphics;b.remove(d,!0);d.setGeometry(new l(this._normalizeRect(this._start,a.mapPoint,this.map.spatialReference)));b.add(d,!0)},_onMouseUpHandler:function(a){var b=this.map,c=this._normalizeRect(this._start,a.mapPoint,b.spatialReference);b.graphics.remove(this._graphic,!0);if(0!==c.width||0!==c.height)if(this._navType===e.ZOOM_IN)b.setExtent((new l(c)).getExtent());else{a=b.toScreen(c);var c=b.toScreen({x:c.x+c.width,y:c.y,
spatialReference:b.spatialReference}),f=b.extent.getWidth();a=(f*b.width/Math.abs(c.x-a.x)-f)/2;c=b.extent;b.setExtent(new u(c.xmin-a,c.ymin-a,c.xmax+a,c.ymax+a,c.spatialReference))}},deactivate:function(){this._deactivate();this._graphic&&this.map.graphics.remove(this._graphic,!0);this._navType=this._start=this._graphic=null;this._activateMapTools(!0,!1,!1,!0)},setZoomSymbol:function(a){this.zoomSymbol=a},isFirstExtent:function(){return!this._undoManager.canUndo},isLastExtent:function(){return!this._undoManager.canRedo},
zoomToFullExtent:function(){var a=this.map;a.setExtent(a.getLayer(a.layerIds[0]).initialExtent)},zoomToPrevExtent:function(){this._undoManager.canUndo&&(this._prevExtent=!0,this._undoManager.undo())},zoomToNextExtent:function(){this._undoManager.canRedo&&(this._nextExtent=!0,this._undoManager.redo())},onExtentHistoryChange:function(){}});f.mixin(e,{ZOOM_IN:"zoomin",ZOOM_OUT:"zoomout",PAN:"pan"});e.MapExtent=g(t,{declaredClass:"esri.toolbars.MapExtent",label:"extent changes",constructor:function(a){this.map=
a.map;this.preExtent=a.preExtent;this.currentExtent=a.currentExtent},performRedo:function(){this.map.setExtent(this.currentExtent)},performUndo:function(){this.map.setExtent(this.preExtent)}});h("extend-esri")&&(f.setObject("toolbars.Navigation",e,k),f.setObject("toolbars.MapExtent",e.MapExtent,k));return e})},"widgets/ExtentNavigate/_build-generate_module":function(){define(["dojo/text!./Widget.html","dojo/text!./css/style.css","dojo/i18n!./nls/strings"],function(){})},"url:widgets/ExtentNavigate/Widget.html":'\x3cdiv class\x3d"jimu-corner-all"\x3e\r\n  \x3cdiv class\x3d"operation previous" data-dojo-attach-point\x3d"btnPrevious" data-dojo-attach-event\x3d"onclick:_onBtnPreviousClicked"\x3e\x3c/div\x3e\r\n  \x3cdiv class\x3d"operation next" data-dojo-attach-point\x3d"btnNext" data-dojo-attach-event\x3d"onclick:_onBtnNextClicked"\x3e\x3c/div\x3e\r\n\x3c/div\x3e',
"url:widgets/ExtentNavigate/css/style.css":'.jimu-widget-extent-navigate{background-color: rgba(0, 0, 0, 0.4); border: 1px solid #999; cursor: pointer; font-size: 24px; line-height: 25px; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; color: #fff; text-align: center;}.jimu-widget-extent-navigate .operation{width: 30px; height: 30px; font-size: 16px; line-height: 30px;}.jimu-widget-extent-navigate .operation:hover{background-color: rgba(0,0,0,0.6);}.jimu-widget-extent-navigate .operation.jimu-state-disabled{color: rgba(255,255,255,0.3);}.jimu-widget-extent-navigate .operation.jimu-state-disabled:hover{rgba(255,255,255,0.3);}.jimu-widget-extent-navigate .previous::before{font-family: wab_2d; content: "\\ea2f";}.jimu-widget-extent-navigate .next::before{font-family: wab_2d; content: "\\ea27";}.jimu-widget-extent-navigate.vertical .previous{border-bottom: 1px solid #57585A;}.jimu-widget-extent-navigate.horizontal .previous{border-right: 1px solid #57585A;}',
"*now":function(g){g(['dojo/i18n!*preload*widgets/ExtentNavigate/nls/Widget*["ar","bs","ca","cs","da","de","en","el","es","et","fi","fr","he","hi","hr","hu","id","it","ja","ko","lt","lv","nb","nl","pl","pt-br","pt-pt","ro","ru","sl","sr","sv","th","tr","zh-cn","vi","zh-hk","zh-tw","ROOT"]'])},"*noref":1}});
define("dojo/on dojo/_base/declare dojo/_base/lang dojo/_base/html jimu/BaseWidget esri/toolbars/navigation".split(" "),function(g,f,c,b,h,k){return f([h],{name:"ExtentNavigate",navToolbar:null,baseClass:"jimu-widget-extent-navigate",_disabledClass:"jimu-state-disabled",_verticalClass:"vertical",_horizontalClass:"horizontal",_floatClass:"jimu-float-leading",_cornerTop:"jimu-corner-top",_cornerBottom:"jimu-corner-bottom",_cornerLeading:"jimu-corner-leading",_cornerTrailing:"jimu-corner-trailing",moveTopOnActive:!1,
postCreate:function(){this.inherited(arguments);this.navToolbar=new k(this.map);this.own(g(this.navToolbar,"extent-history-change",c.hitch(this,this._onExtentHistoryChange)));this.btnPrevious.title=this.nls.previousExtent;this.btnNext.title=this.nls.nextExtent;this._onExtentHistoryChange()},_onExtentHistoryChange:function(){this.navToolbar.isFirstExtent()?b.addClass(this.btnPrevious,this._disabledClass):b.removeClass(this.btnPrevious,this._disabledClass);this.navToolbar.isLastExtent()?b.addClass(this.btnNext,
this._disabledClass):b.removeClass(this.btnNext,this._disabledClass)},_onBtnPreviousClicked:function(){this.navToolbar.zoomToPrevExtent()},_onBtnNextClicked:function(){this.navToolbar.zoomToNextExtent()},setPosition:function(b){this.inherited(arguments);"number"===typeof b.height&&30>=b.height?this.setOrientation(!1):this.setOrientation(!0)},setOrientation:function(c){b.removeClass(this.domNode,this._horizontalClass);b.removeClass(this.domNode,this._verticalClass);b.removeClass(this.btnPrevious,this._floatClass);
b.removeClass(this.btnPrevious,this._cornerTop);b.removeClass(this.btnPrevious,this._cornerLeading);b.removeClass(this.btnNext,this._floatClass);b.removeClass(this.btnNext,this._cornerBottom);b.removeClass(this.btnNext,this._cornerTrailing);c?(b.addClass(this.domNode,this._verticalClass),b.addClass(this.btnPrevious,this._cornerTop),b.addClass(this.btnNext,this._cornerBottom)):(b.addClass(this.domNode,this._horizontalClass),b.addClass(this.btnPrevious,this._floatClass),b.addClass(this.btnNext,this._floatClass),
b.addClass(this.btnPrevious,this._cornerLeading),b.addClass(this.btnNext,this._cornerTrailing))}})});