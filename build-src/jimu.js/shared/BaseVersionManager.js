// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See http://js.arcgis.com/3.15/esri/copyright.txt and http://www.arcgis.com/apps/webappbuilder/copyright.txt for details.
//>>built
define(function(){return function(){this.versions=[];this.upgrade=function(b,a,c){a=this.getVersionIndex(a);c=this.getVersionIndex(c);if(a>c)throw Error("New version should higher than old version.");for(a+=1;a<=c;a++)this.versions[a].upgrader&&(b=this.versions[a].upgrader(b));return b};this.getVersionIndex=function(b){b=this.fixVersion(b);var a,c;for(c=0;c<this.versions.length;c++)this.versions[c].version===b&&(a=c);null===b&&(a=-1);void 0===a&&(a=this.versions.length-1);return a};this.fixVersion=
function(b){return b?b:null}}});