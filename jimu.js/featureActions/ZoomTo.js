// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See http://js.arcgis.com/3.15/esri/copyright.txt and http://www.arcgis.com/apps/webappbuilder/copyright.txt for details.
//>>built
define(["dojo/_base/declare","../BaseFeatureAction","jimu/utils"],function(b,c,d){return b(c,{name:"ZoomTo",iconClass:"icon-zoomto",isFeatureSupported:function(a){return 0<a.features.length&&a.features[0].geometry},onExecute:function(a){d.featureAction.zoomTo(this.map,a.features)}})});