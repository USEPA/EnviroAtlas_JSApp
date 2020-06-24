// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See http://js.arcgis.com/3.15/esri/copyright.txt and http://www.arcgis.com/apps/webappbuilder/copyright.txt for details.
//>>built
define(["dojo/_base/declare","./LayerInfoForDefaultService"],function(a,b){return a(b,{constructor:function(c,a){this.isTiled=!0},_initVisible:function(){},_setTopLayerVisible:function(a){},setLayerVisiblefromTopLayer:function(){},getOpacity:function(){},setOpacity:function(a){},isShowInMap:function(){return this.originOperLayer.mapService.layerInfo.layerObject.visible}})});