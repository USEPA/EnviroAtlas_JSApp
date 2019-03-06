// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See http://js.arcgis.com/3.15/esri/copyright.txt and http://www.arcgis.com/apps/webappbuilder/copyright.txt for details.
//>>built
define(["dojo/Deferred","dojo/promise/all"],function(g,h){function k(a){var b=[],c,d;for(c=0;c<a.length;c++)d=new g,d.module=a[c],b.push(d);e(b,0);return b}function e(a,b){b+1>a.length||f([a[b].module],function(){a[b].resolve();b++;e(a,b)})}var f;return{load:function(a,b,c){a=a.split(",");f=b;0===a.length?c(null):h(k(a)).then(function(){c()})}}});