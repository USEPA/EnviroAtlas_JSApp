//>>built
require({cache:{"url:widgets/AddData/search/templates/ResultsPane.html":'\x3cdiv class\x3d"search-results-pane" data-dojo-attach-point\x3d"containerNode"\x3e\r\n  \x3cdiv class\x3d"search-results-pane-no-match empty-data-label" data-dojo-attach-point\x3d"noMatchNode" style\x3d"display:none;"\x3e\x3c/div\x3e\r\n  \x3cdiv data-dojo-attach-point\x3d"itemsNode" class\x3d"search-results"\x3e\x3c/div\x3e\r\n\x3c/div\x3e'}});
define("dojo/_base/declare dojo/_base/array ./SearchComponent dojo/text!./templates/ResultsPane.html dojo/i18n!../nls/strings ./ItemCard ./util".split(" "),function(f,g,h,k,d,l,e){return f([h],{i18n:d,templateString:k,postCreate:function(){this.inherited(arguments)},addItem:function(a){a.placeAt(this.itemsNode);var b=window.onlineDataTobeAdded.indexOf(a.item.id),c=window.onlineDataAlreadyAdded.indexOf(a.item.id);0<=b&&0>c&&(window.onlineDataAlreadyAdded.push(a.item.id),a.addButton.click())},destroyItems:function(){this.noMatchNode.style.display=
"none";this.noMatchNode.innerHTML="";this.destroyDescendants(!1)},showNoMatch:function(){e.setNodeText(this.noMatchNode,d.search.resultsPane.noMatch);this.noMatchNode.style.display="block"},processResults:function(a){this.destroyItems();var b=a.results;if(b&&0<b.length){var c=e.findLayersAdded(this.getMap(),null).itemIds;g.forEach(a.results,function(a){this.addItem(new l({item:a,canRemove:-1!==c.indexOf(a.id),resultsPane:this}))},this)}else this.showNoMatch()}})});