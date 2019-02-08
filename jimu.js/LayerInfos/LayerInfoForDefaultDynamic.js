// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See http://js.arcgis.com/3.15/esri/copyright.txt and http://www.arcgis.com/apps/webappbuilder/copyright.txt for details.
//>>built
define(["dojo/_base/declare","./LayerInfoForDefaultService"],function(d,e){return d(e,{constructor:function(b,a){},_initVisible:function(){var b=!1,a=this.originOperLayer.mapService;a&&a.layerInfo._subLayerVisible[a.subId]&&(b=!0);this._visible=b},_setTopLayerVisible:function(b){var a=this.originOperLayer.mapService;if(a){a.layerInfo._subLayerVisible[a.subId]=b?!0:!1;this._visible=b;var c={};this.traversal(function(a){0===a.getSubLayers().length&&(c[a.originOperLayer.mapService.subId]=a._isAllSubLayerVisibleOnPath())});
a.layerInfo._setSubLayerVisible(c)}}})});