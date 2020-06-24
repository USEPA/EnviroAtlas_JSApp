//>>built
require({cache:{"url:widgets/HucNavigation/setting/DefaultBufferEdit.html":'\x3cdiv style\x3d"width:100%;height:100%"\x3e\r\n  \x3cdiv class\x3d"searches-section" data-dojo-attach-point\x3d"searchesSection"\x3e\r\n    \x3cdiv class\x3d"btn-add-section" data-dojo-attach-point\x3d"btnAddBufferUnit"\x3e\r\n      \x3cspan class\x3d"btn-add-icon"\x3e\x3c/span\x3e\r\n      \x3cspan class\x3d"btn-add-label"\x3e${nls.editBufferUnit}\x3c/span\x3e\r\n    \x3c/div\x3e\r\n    \x3cdiv class\x3d"searches-table" data-dojo-attach-point\x3d"bufferUnitsTable" data-dojo-type\x3d"jimu/dijit/SimpleTable"\r\n         data-dojo-props\x3d"_rowHeight:40,autoHeight:true,selectable:true,fields:[{name:\'name\',title:\'${nls.bufferUnitTitle}\',\'class\':\'search-title\',type:\'text\',editable:false},{name:\'actions\',title:\'${nls.actions}\',\'class\':\'actions\',width:\'150px\',type:\'actions\',actions:[\'up\',\'down\']}]"\x3e\x3c/div\x3e\r\n    \x3ctable cellspacing\x3d"5"\x3e\r\n      \x3ctbody\x3e\r\n        \x3ctr\x3e\r\n          \x3ctd style\x3d"vertical-align:text-top;"\x3e${nls.defaultBufferValue}\x3c/td\x3e\r\n          \x3ctd style\x3d"vertical-align:text-top;"\x3e\r\n            \x3cinput type\x3d"text" data-dojo-attach-point\x3d"defaultBufferValue" data-dojo-type\x3d"dijit/form/NumberTextBox" data-dojo-props\x3d"required:true,intermediateChanges:true" /\x3e\r\n          \x3c/td\x3e\r\n          \x3ctd style\x3d"vertical-align:text-top;"\x3e${nls.defaultBufferWKID}\x3c/td\x3e\r\n          \x3ctd style\x3d"vertical-align:text-top;"\x3e\r\n            \x3cinput type\x3d"text" data-dojo-attach-point\x3d"defaultBufferWKID" data-dojo-type\x3d"dijit/form/TextBox" /\x3e\r\n          \x3c/td\x3e\r\n        \x3c/tr\x3e\r\n        \x3ctr\x3e\r\n          \x3ctd style\x3d"vertical-align:text-top;"\x3e${nls.maxBufferValue}\x3c/td\x3e\r\n          \x3ctd style\x3d"vertical-align:text-top;"\x3e\r\n            \x3cinput type\x3d"text" data-dojo-attach-point\x3d"maxBufferValue" data-dojo-type\x3d"dijit/form/NumberTextBox" data-dojo-props\x3d"required:false,intermediateChanges:true" /\x3e\r\n          \x3c/td\x3e\r\n        \x3c/tr\x3e\r\n        \x3ctr\x3e\r\n          \x3ctd style\x3d"vertical-align:text-top;" colspan\x3d"4"\x3e\r\n            \x3cdiv data-dojo-type\x3d"jimu/dijit/CheckBox" data-dojo-attach-point\x3d"addToLegendCbx" data-dojo-props\x3d"label:\'${nls.addbuffertolegend}\'"\x3e\x3c/div\x3e\r\n          \x3c/td\x3e\r\n        \x3c/tr\x3e\r\n        \x3ctr\x3e\r\n          \x3ctd style\x3d"vertical-align:text-top;" colspan\x3d"4"\x3e\r\n            \x3cdiv class\x3d"symbol-section" style\x3d"margin-top:18px;"\x3e\r\n              \x3cdiv style\x3d"margin-bottom:11px;"\x3e${nls.bufferSymbol}\x3c/div\x3e\r\n              \x3cdiv data-dojo-attach-point\x3d"layerSymbolPicker" data-dojo-type\x3d"jimu/dijit/SymbolPicker"\x3e\x3c/div\x3e\r\n            \x3c/div\x3e\r\n          \x3c/td\x3e\r\n        \x3c/tr\x3e\r\n      \x3c/tbody\x3e\r\n    \x3c/table\x3e\r\n  \x3c/div\x3e\r\n\x3c/div\x3e\r\n'}});
define("dojo/_base/declare dojo/_base/lang dojo/_base/array dojo/_base/html dojo/on dijit/_WidgetBase dijit/_TemplatedMixin dijit/_WidgetsInTemplateMixin jimu/BaseWidgetSetting jimu/dijit/Message esri/symbols/jsonUtils dojo/text!./DefaultBufferEdit.html ./BufferUnitEdit jimu/dijit/Popup dojo/keys dijit/form/ValidationTextBox".split(" "),function(f,b,d,g,c,r,t,h,k,l,m,n,p,q,e){return f([k,h],{baseClass:"widget-esearch-defaultbuffer-setting",templateString:n,nls:null,config:null,searchSetting:null,
_bufferDefaults:null,popupunitedit:null,popup:null,popup2:null,popupState:"",postCreate:function(){this.inherited(arguments);this.own(c(this.layerSymbolPicker,"change",b.hitch(this,this._onPolySymbolChange)));this._bindEvents();this.setConfig(this.config)},startup:function(){this.inherited(arguments)},setConfig:function(a){if(this.config=a)this._bufferDefaults=this.config.bufferDefaults,this.defaultBufferValue.set("value",this._bufferDefaults.bufferDefaultValue||2),this.maxBufferValue.set("value",
this._bufferDefaults.maxBufferValue||""),this.defaultBufferWKID.set("value",this._bufferDefaults.bufferWKID||102003),this.addToLegendCbx.setValue(this._bufferDefaults.addtolegend||!1),this._bufferDefaults.simplefillsymbol?this.layerSymbolPicker.showBySymbol(m.fromJson(this._bufferDefaults.simplefillsymbol)):this.layerSymbolPicker.showByType("fill"),this._initBufferUnitTable()},getConfig:function(){this.maxBufferValue.get("value")&&""!==this.maxBufferValue.get("value")?this._bufferDefaults.maxBufferValue=
parseFloat(this.maxBufferValue.get("value")):delete this._bufferDefaults.maxBufferValue;this._bufferDefaults.bufferDefaultValue=parseFloat(this.defaultBufferValue.get("value"));this._bufferDefaults.bufferWKID=parseInt(this.defaultBufferWKID.get("value"));this._bufferDefaults.addtolegend=this.addToLegendCbx.getValue();this._bufferDefaults.bufferUnits.bufferUnit=this._getAllBufferUnits();return this.config={bufferDefaults:this._bufferDefaults}},_onPolySymbolChange:function(a){"simplefillsymbol"==a.type&&
(this._bufferDefaults.simplefillsymbol=a.toJson())},_initBufferUnitTable:function(){this.bufferUnitsTable.clear();d.forEach(this.config&&this.config.bufferDefaults&&this.config.bufferDefaults.bufferUnits.bufferUnit,b.hitch(this,function(a){this._createBufferUnit({config:a})}))},_createBufferUnit:function(a){a.searchSetting=this;a.nls=this.nls;var b=this.bufferUnitsTable.addRow({name:a.config&&a.config.label||""});if(!b.success)return null;b.tr.bufferUnit=a.config;return b.tr},_getAllBufferUnits:function(){var a=
this.bufferUnitsTable._getNotEmptyRows();return d.map(a,b.hitch(this,function(a){return a.bufferUnit}))},_onEditOk:function(){var a=this.popupunitedit.getConfig();0>a.length?new l({message:this.nls.warning}):(this.config.bufferDefaults.bufferUnits.bufferUnit=a,this._initBufferUnitTable(),this.popup2.close(),this.popupState="")},_onEditClose:function(){this.popup2=this.popupunitedit=null},_openEdit:function(a,c){this.popupunitedit=new p({nls:this.nls,config:c||{}});this.popup2=new q({titleLabel:a,
autoHeight:!0,content:this.popupunitedit,container:"main-page",width:640,height:420,buttons:[{label:this.nls.ok,key:e.ENTER,onClick:b.hitch(this,"_onEditOk")},{label:this.nls.cancel,key:e.ESCAPE}],onClose:b.hitch(this,"_onEditClose")});g.addClass(this.popup2.domNode,"widget-setting-popup");this.popupunitedit.startup()},_bindEvents:function(){this.own(c(this.btnAddBufferUnit,"click",b.hitch(this,function(){this._openEdit(this.nls.addbufferunit,this._bufferDefaults)})));this.own(c(this.bufferUnitsTable,
"row-delete",b.hitch(this,function(a){delete a.bufferUnit})))}})});