// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See http://js.arcgis.com/3.15/esri/copyright.txt and http://www.arcgis.com/apps/webappbuilder/copyright.txt for details.
//>>built
define(["dojo/_base/array","dojo/promise/all","dojo/Deferred"],function(c,f,g){return{getLayerInfoArray:function(b){var e=new g,d=[];b.traversal(function(a){d.push(a)});b=c.map(d,function(a){return a.getLayerType()});f(b).then(function(a){var b=[];c.forEach(a,function(a,c){"FeatureLayer"===a&&b.push(d[c])});e.resolve(b)});return e}}});