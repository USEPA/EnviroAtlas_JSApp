// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See http://js.arcgis.com/3.15/esri/copyright.txt and http://www.arcgis.com/apps/webappbuilder/copyright.txt for details.
//>>built
define(["dojo/_base/declare","../BaseFeatureAction","jimu/utils"],function(c,d,e){return c([d],{name:"ShowPopup",iconClass:"icon-show-popup",isFeatureSupported:function(a,b){return a&&a.features&&1===a.features.length&&b&&b.infoTemplate},onExecute:function(a){e.featureAction.showPopup(this.map,a.features)}})});