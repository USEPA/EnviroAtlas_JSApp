// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See http://js.arcgis.com/3.15/esri/copyright.txt and http://www.arcgis.com/apps/webappbuilder/copyright.txt for details.
//>>built
define("dijit/TooltipDialog dijit/popup dojo/_base/html dojo/on dojo/mouse dojo/query".split(" "),function(k,f,d,g,h,l){function m(b,a){b=d.create("div",{innerHTML:b,"class":"dialog-content"});var e=new k({content:b}),c;g(a,h.enter,function(){clearTimeout(c);c=-1;c=setTimeout(function(){f.open({parent:null,popup:e,around:a,position:["below"]})},200)});g(a,h.leave,function(){clearTimeout(c);c=-1;f.close(e)});return e}return{initTooltips:function(b){l("[title]",b).forEach(function(a){if(a){var b=d.getAttr(a,
"title");d.setAttr(a,"title","");m(b,a)}})}}});