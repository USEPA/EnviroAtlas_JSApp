// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See http://js.arcgis.com/3.15/esri/copyright.txt and http://www.arcgis.com/apps/webappbuilder/copyright.txt for details.
//>>built
define(["dojo/_base/declare","../BaseFeatureAction","jimu/utils"],function(b,c,d){return b(c,{name:"PanTo",iconClass:"icon-panto",isFeatureSupported:function(a){return 0<a.features.length&&a.geometryType},onExecute:function(a){d.featureAction.panTo(this.map,a.features)}})});