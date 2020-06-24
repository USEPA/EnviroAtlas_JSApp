// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See http://js.arcgis.com/3.15/esri/copyright.txt and http://www.arcgis.com/apps/webappbuilder/copyright.txt for details.
//>>built
define(["dojo/_base/declare","../BaseFeatureAction","../exportUtils"],function(c,d,b){return c(d,{name:"ExportToGeoJSON",iconClass:"icon-export",isFeatureSupported:function(a){return 0<a.features.length&&a.features[0].geometry},onExecute:function(a){a=b.createDataSource({type:b.TYPE_FEATURESET,filename:"features",data:a});a.setFormat(b.FORMAT_GEOJSON);a.download()}})});