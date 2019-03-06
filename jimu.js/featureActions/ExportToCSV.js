// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See http://js.arcgis.com/3.15/esri/copyright.txt and http://www.arcgis.com/apps/webappbuilder/copyright.txt for details.
//>>built
define(["dojo/_base/declare","../BaseFeatureAction","../exportUtils"],function(c,d,b){return c(d,{name:"ExportToCSV",iconClass:"icon-export",isFeatureSupported:function(a){return 0<a.features.length},onExecute:function(a){a=b.createDataSource({type:b.TYPE_FEATURESET,filename:"features",data:a});a.setFormat(b.FORMAT_CSV);a.download()}})});