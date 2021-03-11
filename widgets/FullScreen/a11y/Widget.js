// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See http://js.arcgis.com/3.15/esri/copyright.txt and http://www.arcgis.com/apps/webappbuilder/copyright.txt for details.
//>>built
define(["dojo/_base/lang","dojo/on","dojo/_base/html","dijit/a11yclick"],function(b,c,d,e){return{a11y_updateLabel:function(a){a&&d.setAttr(this.domNode,"aria-label",a)},a11y_initEvents:function(){this.own(c(this.domNode,e,b.hitch(this,this._onFullScreenClick)))}}});