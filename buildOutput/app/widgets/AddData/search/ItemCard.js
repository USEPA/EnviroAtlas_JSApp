//>>built
require({cache:{"url:widgets/AddData/search/templates/ItemCard.html":'\x3cdiv class\x3d"item-card"\x3e\r\n  \x3cdiv class\x3d"item-card-inner"\x3e\r\n    \x3cdiv class\x3d"thumbnail" data-dojo-attach-point\x3d"thumbnailNode"\x3e\x3c/div\x3e\r\n    \x3ch3 class\x3d"title" data-dojo-attach-point\x3d"titleNode"\x3e\x3c/h3\x3e\r\n    \x3cdiv class\x3d"info" data-dojo-attach-point\x3d"typeByOwnerNode"\x3e\x3c/div\x3e\r\n    \x3cdiv class\x3d"info" data-dojo-attach-point\x3d"dateNode"\x3e\x3c/div\x3e\r\n    \x3cdiv class\x3d"action-bar"\x3e\r\n      \x3cspan class\x3d"message" data-dojo-attach-point\x3d"messageNode"\x3e\x3c/span\x3e\r\n      \x3ca href\x3d"javascript:void(0)"\r\n        data-dojo-attach-point\x3d"addButton"\r\n        data-dojo-attach-event\x3d"onClick: addClicked"\r\n        \x3e${i18n.search.item.actions.add}\r\n      \x3c/a\x3e\r\n      \x3ca href\x3d"javascript:void(0)"\r\n        data-dojo-attach-point\x3d"detailsButton"\r\n        data-dojo-attach-event\x3d"onClick: detailsClicked"\r\n        \x3e${i18n.search.item.actions.details}\r\n      \x3c/a\x3e\r\n    \x3c/div\x3e\r\n  \x3c/div\x3e\r\n\x3c/div\x3e\r\n'}});
define("dojo/_base/declare dojo/_base/array dojo/date/locale dojo/dom-class dijit/_WidgetBase dijit/_TemplatedMixin dijit/_WidgetsInTemplateMixin dojo/text!./templates/ItemCard.html dojo/i18n!../nls/strings ./util ./LayerLoader".split(" "),function(k,l,m,f,n,p,q,r,d,b,t){return k([n,p,q],{i18n:d,templateString:r,canRemove:!1,item:null,resultsPane:null,_dfd:null,postCreate:function(){this.inherited(arguments)},startup:function(){this._started||(this.inherited(arguments),this.render())},addClicked:function(){var a=
this,e=this.addButton;if(!f.contains(e,"disabled"))if(f.add(e,"disabled"),this.canRemove){var g=window.onlineDataAlreadyAdded.indexOf(a.item.id);window.onlineDataAlreadyAdded.splice(g,1);var h=this.resultsPane.getMap();b.setNodeText(a.messageNode,d.search.item.messages.removing);g=b.findLayersAdded(h,this.item.id).layers;l.forEach(g,function(a){h.removeLayer(a)});this.canRemove=!1;b.setNodeText(a.messageNode,"");b.setNodeText(this.addButton,d.search.item.actions.add);f.remove(e,"disabled")}else g=
window.onlineDataAlreadyAdded.indexOf(a.item.id),0>g&&window.onlineDataAlreadyAdded.push(a.item.id),b.setNodeText(a.messageNode,d.search.item.messages.adding),(new t).addItem(this.item,this.resultsPane.getMap()).then(function(c){c?(a.canRemove=!0,b.setNodeText(a.messageNode,""),b.setNodeText(a.addButton,d.search.item.actions.remove)):b.setNodeText(a.messageNode,d.search.item.messages.addFailed);f.remove(e,"disabled")}).otherwise(function(c){console.warn("Add layer failed.");console.warn(c);b.setNodeText(a.messageNode,
d.search.item.messages.addFailed);f.remove(e,"disabled");c&&"string"===typeof c.message&&0<c.message.length&&(console.log(""),c=a.item,c=b.checkMixedContent(c.portalUrl)+"/home/item.html?id\x3d"+encodeURIComponent(c.id),c in window.faildedOutsideLayerDictionary||(window.faildedOutsideLayerDictionary[c]=c),c=window.onlineDataAlreadyAdded.indexOf(a.item.id),window.onlineDataAlreadyAdded.splice(c,1),selfAddData.publishData({message:"openFailedLayer"}))})},detailsClicked:function(){var a=this.item,a=
b.checkMixedContent(a.portalUrl)+"/home/item.html?id\x3d"+encodeURIComponent(a.id);window.open(a)},formatDate:function(a){"number"===typeof a&&(a=new Date(a));return m.format(a,{selector:"date",datePattern:d.search.item.dateFormat})},render:function(){b.setNodeText(this.titleNode,this.item.title);b.setNodeTitle(this.titleNode,this.item.title);this._renderThumbnail();this._renderTypeOwnerDate();this.canRemove&&b.setNodeText(this.addButton,d.search.item.actions.remove)},_renderThumbnail:function(){var a=
this.thumbnailNode,e=this.item.thumbnailUrl;a.innerHTML="";var e=b.checkMixedContent(e),d=document.createElement("IMG");d.src=e||"widgets/AddData/images/placeholder_120x80.png";a.appendChild(d)},_renderTypeOwnerDate:function(){var a,e=this.item;a=d.search.item.types[e.type];if("undefined"===typeof a||null===a)a=e.type;a=d.search.item.typeByOwnerPattern.replace("{type}",a);a=a.replace("{owner}",e.owner);b.setNodeText(this.typeByOwnerNode,a)}})});