//>>built
require({cache:{"url:widgets/Select/SelectableLayerItem.html":'\x3cdiv\x3e\r\n  \x3cdiv class\x3d"layer-row" data-dojo-attach-point\x3d"layerContent"\x3e\r\n    \x3cdiv class\x3d"selectable-check" title\x3d"${nls.toggleSelectability}"\r\n         data-dojo-attach-point\x3d"selectableCheckBox"\x3e\r\n    \x3c/div\x3e\r\n    \x3cdiv class\x3d"layer-name jimu-ellipsis" data-dojo-attach-point\x3d"layerNameNode"\x3e\x3c/div\x3e\r\n    \x3cdiv class\x3d"selected-num" data-dojo-attach-point\x3d"selectedCountNode"\x3e\x3c/div\x3e\r\n    \x3cdiv class\x3d"feature-action icon-more" title\x3d"${nls.showActions}"\r\n    data-dojo-attach-point\x3d"actionBtn"\x3e\x3c/div\x3e\r\n  \x3c/div\x3e\r\n\x3c/div\x3e'}});
define("dojo/_base/declare dojo/_base/html dojo/_base/lang dojo/_base/event dojo/on dojo/Evented dojo/dom-geometry jimu/utils jimu/dijit/FeatureActionPopupMenu dijit/_WidgetBase dijit/_TemplatedMixin dijit/_WidgetsInTemplateMixin dojo/text!./SelectableLayerItem.html ./ClearSelectionAction".split(" "),function(e,a,d,f,c,g,h,k,l,m,n,p,q,r){return e([m,n,p,g],{baseClass:"selectable-layer-item",templateString:q,layerName:"layer",layerVisible:!0,checked:!1,allowExport:!1,inited:!1,postCreate:function(){this.inherited(arguments);
this.popupMenu=l.getInstance()},init:function(b){this.featureLayer=b;b=this.featureLayer.getSelectedFeatures().length;this.layerName=this.layerInfo.title||"layer";this.selectedCountNode.innerHTML=b;0<b?a.removeClass(this.domNode,"no-action"):a.addClass(this.domNode,"no-action");this.own(c(this.featureLayer,"selection-complete",d.hitch(this,function(){var b=this.featureLayer.getSelectedFeatures().length;this.selectedCountNode.innerHTML=b;0===b?a.addClass(this.domNode,"no-action"):a.removeClass(this.domNode,
"no-action")})));this.own(c(this.featureLayer,"selection-clear",d.hitch(this,function(){this.selectedCountNode.innerHTML=0;a.addClass(this.domNode,"no-action")})));this.layerNameNode.innerHTML=this.layerName;this.layerNameNode.title=this.layerName;this.layerVisible||a.addClass(this.domNode,"invisible");this.checked?a.addClass(this.selectableCheckBox,"checked"):a.removeClass(this.selectableCheckBox,"checked");this.own(c(this.selectableCheckBox,"click",d.hitch(this,this._toggleChecked)));this.own(c(this.layerContent,
"click",d.hitch(this,this._toggleContent)));this.own(c(this.actionBtn,"click",d.hitch(this,this._showActions)));this.inited=!0;this.emit("inited")},isLayerVisible:function(){return this.layerVisible},isChecked:function(){return this.checked},updateLayerVisibility:function(){var b=this.layerInfo.isShowInMap()&&this.layerInfo.isInScale();b!==this.layerVisible&&((this.layerVisible=b)?a.removeClass(this.domNode,"invisible"):a.addClass(this.domNode,"invisible"),this.emit("stateChange",{visible:this.layerVisible,
layerInfo:this.layerInfo,featureLayer:this.featureLayer}))},turnOn:function(){a.addClass(this.selectableCheckBox,"checked");this.checked=!0},turnOff:function(){a.removeClass(this.selectableCheckBox,"checked");this.checked=!1},toggleChecked:function(){(this.checked=!this.checked)?a.addClass(this.selectableCheckBox,"checked"):a.removeClass(this.selectableCheckBox,"checked")},_toggleChecked:function(b){f.stop(b);a.toggleClass(this.selectableCheckBox,"checked");this.checked=a.hasClass(this.selectableCheckBox,
"checked");this.emit("stateChange",{checked:this.checked,layerInfo:this.layerInfo})},_toggleContent:function(b){f.stop(b);a.hasClass(this.domNode,"no-action")||this.emit("switchToDetails",this)},_showActions:function(b){f.stop(b);if(!a.hasClass(this.domNode,"no-action")){var c=this.featureLayer.getSelectedFeatures(),e=k.toFeatureSet(c);this.popupMenu.prepareActions(e,this.allowExport).then(d.hitch(this,function(){var a=h.position(b.target);0<c.length&&this.popupMenu.appendAction(new r({folderUrl:this.folderUrl,
data:this.featureLayer}));this.popupMenu.show(a,this.nls.actionsTitle)}))}}})});