//>>built
require({cache:{"widgets/DisplayLayerAddFailure/_build-generate_module":function(){define(["dojo/text!./Widget.html","dojo/text!./css/style.css","dojo/text!widgets/DisplayLayerAddFailure/config.json"],function(){})},"url:widgets/DisplayLayerAddFailure/Widget.html":'\r\n\x3cdiv style\x3d"height:100%; width:100%; overflow:hidden;" dojotype\x3d"dijit.layout.ContentPane" \x3e\r\n\t\x3cdiv id \x3d "failedLayersComment"\x3e \x3c/div\x3e\t\r\n\t\x3chr id \x3d "hrFailedEnviroAtlasLayers" style\x3d"margin: 5px 0; display:none"\x3e\r\n\t\r\n\t\x3cdiv style\x3d"font-weight: bold" id \x3d "failedEnviroAtlasLayersComment"\x3e \x3c/div\x3e\r\n    \x3ctable id\x3d"failedEALayers" class\x3d"failedLayersStyle" \x3e\r\n        \x3ctbody\x3e\r\n            \x3ctr \x3e\r\n\r\n            \x3c/tr\x3e\t\t\t\t\t    \t\r\n        \x3c/tbody\x3e\r\n    \x3c/table\x3e\r\n    \r\n    \x3chr id \x3d "hrFailedOutsideLayers" style\x3d"margin: 5px 0; display:none"\x3e\r\n\t\x3cdiv style\x3d"font-weight: bold" id \x3d "failedOutsideLayersComment"\x3e \x3c/div\x3e\r\n\r\n    \x3ctable id\x3d"failedOutLayers" class\x3d"failedLayersStyle" \x3e\r\n        \x3ctbody\x3e\r\n            \x3ctr \x3e\r\n\r\n            \x3c/tr\x3e\t\t\t\t\t    \t\r\n        \x3c/tbody\x3e\r\n    \x3c/table\x3e\r\n    \x3chr id \x3d "hrFailedLayersSendEmail" style\x3d"margin: 5px 0; display:none"\x3e\r\n\t\x3cdiv id\x3d"eMailOption" \x3e\r\n\t\t\x3c!--\x3cdiv\x3e\r\n\t\t\t\x3clabel\x3eThe service provided is not working.\x3c/b\x3e\r\n\t\t\t\tClick below to send the URL for this service to the EnviroAtlas support team for further investigation.\x3c/label\x3e\r\n\t\t\x3c/div\x3e--\x3e\r\n\r\n\t\t\x3cdiv\x3e\r\n\t\t\t\x3cbutton id\x3d"sendButton" class\x3d"jimu-btn" type\x3d"button" data-dojo-attach-event\x3d"ondijitclick:sendEmail"\x3eSend\x3c/button\x3e\r\n\t\t\t\x3clabel id\x3d"message" style\x3d"display:none"\x3eThanks for letting us know!\x3c/label\x3e\r\n\t\t\x3c/div\x3e\r\n\t\x3c/div\x3e\r\n\x3c/div\x3e',
"url:widgets/DisplayLayerAddFailure/css/style.css":" .failedLayersStyle tr:nth-child(2n) {background-color: #f9fafc;}","url:widgets/DisplayLayerAddFailure/config.json":""}});
define("dojo/_base/declare dijit/_WidgetsInTemplateMixin dojo/Deferred dojo/request/xhr jimu/BaseWidget dijit/Dialog jimu/WidgetManager jimu/PanelManager esri/layers/FeatureLayer esri/dijit/PopupTemplate esri/layers/ArcGISDynamicMapServiceLayer dijit/layout/ContentPane dijit/TooltipDialog".split(" "),function(k,l,n,p,m,q,r,t,u,v,w,x,y){var b,c,h=function(){var a=document.getElementById("failedLayersComment");c=b="";0==Object.keys(window.faildedEALayerDictionary).length&&0==Object.keys(window.faildedOutsideLayerDictionary).length?
(a.innerHTML="Data that fails to load will appear here and be documented.",a=document.getElementById("hrFailedEnviroAtlasLayers"),a.style.display="none",a=document.getElementById("hrFailedLayersSendEmail"),a.style.display="none",a=document.getElementById("hrFailedOutsideLayers"),a.style.display="none",a=document.getElementById("eMailOption"),a.style.display="none"):a.innerHTML="The following web service(s) failed to load at this time and may be unavailable for this session.";if(0<Object.keys(window.faildedEALayerDictionary).length){g();
a=document.getElementById("hrFailedEnviroAtlasLayers");a.style.display="";a=document.getElementById("hrFailedLayersSendEmail");a.style.display="";document.getElementById("failedEnviroAtlasLayersComment").innerHTML="Click below to notify the EnviroAtlas administrators of issues with these EnviroAtlas services:";a=document.getElementById("eMailOption");a.style.display="";a=document.getElementById("failedEALayers");for(a=a.getElementsByTagName("tbody")[0];a.firstChild;)a.removeChild(a.firstChild);for(var d in window.faildedEALayerDictionary){var e=
a.insertRow(a.rows.length),e=e.insertCell(0),f=document.createElement("div");f.innerHTML=d;e.appendChild(f);b=b+window.hashTitleToEAID[d]+","}b=b.substring(0,b.length-1)}if(0<Object.keys(window.faildedOutsideLayerDictionary).length){g();a=document.getElementById("hrFailedOutsideLayers");a.style.display="";document.getElementById("failedOutsideLayersComment").innerHTML="Click below to notify the EnviroAtlas administrators of issues with the following web services hosted outside of the EnviroAtlas hosting environment:";
a=document.getElementById("failedOutLayers");for(a=a.getElementsByTagName("tbody")[0];a.firstChild;)a.removeChild(a.firstChild);for(d in window.faildedOutsideLayerDictionary)e=a.insertRow(a.rows.length),e=e.insertCell(0),f=document.createElement("div"),f.innerHTML=d,e.appendChild(f),c=c+d+",,,";c=c.substring(0,c.length-3)}},g=function(){$("#sendButton").show();$("#message").hide()};return k([m,l],{baseClass:"jimu-widget-displaylayeraddfailure",sendEmail:function(){try{var a=new XMLHttpRequest;0<b.length&&
0<c.length?a.open("GET","https://v18ovhrttf760.aa.ad.epa.gov/SendEmailOfFailed_EA_OutsideLayers.py?failedEALayers\x3d"+b+"\x26failedOutsideLayers\x3d"+c,!0):0<b.length?a.open("GET","https://v18ovhrttf760.aa.ad.epa.gov/SendEmailOfFailed_EA_OutsideLayers.py?failedEALayers\x3d"+b,!0):0<c.length&&a.open("GET","https://v18ovhrttf760.aa.ad.epa.gov/SendEmailOfFailed_EA_OutsideLayers.py?failedOutsideLayers\x3d"+c,!0);a.send();$("#sendButton").hide();$("#message").show()}catch(d){console.log(d)}},onReceiveData:function(a,
b,c,f){h()},startup:function(){this.inherited(arguments);h()}})});