//>>built
require({cache:{"url:widgets/HucNavigation/setting/GraphicalEdit.html":'\x3cdiv\x3e\r\n  \x3ctable style\x3d"width:100%;border-spacing: 10px;"\x3e\r\n    \x3ctbody\x3e\r\n      \x3ctr\x3e\r\n        \x3ctd style\x3d"vertical-align:text-top;width:50%;"\x3e\r\n          \x3cdiv data-dojo-type\x3d"jimu/dijit/CheckBox" data-dojo-attach-point\x3d"showmultiCbx"\r\n               data-dojo-props\x3d"checked:true,label:\'${nls.showuseMultiGraphics}\'"\x3e\x3c/div\x3e\r\n        \x3c/td\x3e\r\n        \x3ctd style\x3d"vertical-align:text-top;width:50%;"\x3e\r\n          \x3cdiv data-dojo-type\x3d"jimu/dijit/CheckBox" data-dojo-attach-point\x3d"showtoleranceCbx"\r\n               data-dojo-props\x3d"checked:true,label:\'${nls.showaddTolerance}\'"\x3e\x3c/div\x3e\r\n        \x3c/td\x3e\r\n      \x3c/tr\x3e\r\n      \x3ctr\x3e\r\n        \x3ctd style\x3d"vertical-align:text-top;width:50%;"\x3e\r\n          \x3cdiv data-dojo-type\x3d"jimu/dijit/CheckBox" data-dojo-attach-point\x3d"showaddsqltextCbx"\r\n               data-dojo-props\x3d"checked:true,label:\'${nls.showaddsqltext}\'"\x3e\x3c/div\x3e\r\n        \x3c/td\x3e\r\n        \x3ctd style\x3d"vertical-align:text-top;width:50%;"\x3e\r\n          \x3cdiv data-dojo-type\x3d"jimu/dijit/CheckBox" data-dojo-attach-point\x3d"showbufferCbx"\r\n               data-dojo-props\x3d"checked:true,label:\'${nls.showbuffergraphic}\'"\x3e\x3c/div\x3e\r\n        \x3c/td\x3e\r\n      \x3c/tr\x3e\r\n      \x3ctr\x3e\r\n        \x3ctd style\x3d"vertical-align:text-top;width:50%;"\x3e\r\n          \x3cdiv data-dojo-type\x3d"jimu/dijit/CheckBox" data-dojo-attach-point\x3d"toleranceCbx" data-dojo-props\x3d"label:\'${nls.addTolerance}\'"\x3e\x3c/div\x3e\r\n        \x3c/td\x3e\r\n        \x3ctd style\x3d"vertical-align:text-top;width:50%;"\x3e\r\n          \x3cdiv data-dojo-type\x3d"jimu/dijit/CheckBox" data-dojo-attach-point\x3d"keepGraphicalEnabledCbx"\r\n               data-dojo-props\x3d"label:\'${nls.keepGraphicalEnabled}\'"\x3e\x3c/div\x3e\r\n        \x3c/td\x3e\r\n      \x3c/tr\x3e\r\n      \x3ctr\x3e\r\n        \x3ctd style\x3d"vertical-align:text-top;width:50%;"\x3e\r\n          \x3cdiv data-dojo-type\x3d"jimu/dijit/CheckBox" data-dojo-attach-point\x3d"bufferbydefaultCbx"\r\n               data-dojo-props\x3d"checked:false,label:\'${nls.buffergraphicbydefault}\'"\x3e\x3c/div\x3e\r\n        \x3c/td\x3e\r\n        \x3ctd style\x3d"vertical-align:text-top;width:50%;"\x3e\r\n          \x3cdiv data-dojo-type\x3d"jimu/dijit/CheckBox" data-dojo-attach-point\x3d"multiCbx" data-dojo-props\x3d"label:\'${nls.useMultiGraphics}\'"\x3e\x3c/div\x3e\r\n        \x3c/td\x3e\r\n      \x3c/tr\x3e\r\n    \x3c/tbody\x3e\r\n  \x3c/table\x3e\r\n  \x3ctable class\x3d"point-tolerance-table" style\x3d"margin:8px 0;"\x3e\r\n    \x3ctbody\x3e\r\n      \x3ctr\x3e\r\n        \x3ctd style\x3d"vertical-align:text-top;padding-right: 8px;"\x3e${nls.pointTolerance}\x3c/td\x3e\r\n        \x3ctd style\x3d"vertical-align:text-top;padding-right: 8px;"\x3e\r\n          \x3cinput type\x3d"text" data-dojo-attach-point\x3d"pointTolerance" data-dojo-type\x3d"dijit/form/NumberTextBox"\r\n            data-dojo-props\x3d"style:{width:\'150px\'},required:true,value:6,constraints:{min:0,places:0,max:30}" /\x3e\r\n        \x3c/td\x3e\r\n        \x3ctd style\x3d"vertical-align:text-top;width:50%"\x3e\r\n          \x3ctable style\x3d"width:100%"\x3e\r\n            \x3ctbody\x3e\r\n              \x3ctr\x3e\r\n                \x3cdiv\x3e\r\n                  \x3cspan\x3e${nls.defaultactivetool}: \x3c/span\x3e\r\n                  \x3cselect data-dojo-attach-point\x3d"selectDefaultTool" data-dojo-type\x3d"dijit/form/Select" data-dojo-props\x3d"style:{width:\'150px\'}"\x3e\r\n                    \x3coption value\x3d"point" selected\x3d"selected"\x3e${dnls.point}\x3c/option\x3e\r\n                    \x3coption value\x3d"line"\x3e${dnls.line}\x3c/option\x3e\r\n                    \x3coption value\x3d"polyline"\x3e${dnls.polyline}\x3c/option\x3e\r\n                    \x3coption value\x3d"freehand_polyline"\x3e${dnls.freehandPolyline}\x3c/option\x3e\r\n                    \x3coption value\x3d"extent"\x3e${dnls.extent}\x3c/option\x3e\r\n                    \x3coption value\x3d"circle"\x3e${dnls.circle}\x3c/option\x3e\r\n                    \x3coption value\x3d"ellipse"\x3e${dnls.ellipse}\x3c/option\x3e\r\n                    \x3coption value\x3d"polygon"\x3e${dnls.polygon}\x3c/option\x3e\r\n                    \x3coption value\x3d"freehand_polygon"\x3e${dnls.freehandPolygon}\x3c/option\x3e\r\n                    \x3coption value\x3d"triangle"\x3e${dnls.triangle}\x3c/option\x3e\r\n                    \x3coption value\x3d"none"\x3e${nls.none}\x3c/option\x3e\r\n                  \x3c/select\x3e\r\n                \x3c/div\x3e\r\n              \x3c/tr\x3e\r\n            \x3c/tbody\x3e\r\n          \x3c/table\x3e\r\n        \x3c/td\x3e\r\n      \x3c/tr\x3e\r\n    \x3c/tbody\x3e\r\n  \x3c/table\x3e\r\n  \x3cdiv data-dojo-attach-point\x3d"GraphicalSearchTable" data-dojo-type\x3d"jimu/dijit/SimpleTable"\r\n       data-dojo-props\x3d"fields:[\r\n                        {name:\'add\',title:this.nls.addRemove,type:\'checkbox\', width:\'200px\'},\r\n                        {name:\'label\',title:\'${nls.graphicalSearchOptions}\',type:\'text\',editable:false},\r\n                        {name:\'name\',type:\'text\',hidden:true}]"\x3e\x3c/div\x3e\r\n\x3c/div\x3e\r\n'}});
define("dojo/_base/declare dojo/_base/lang dojo/_base/array dojo/on dijit/_WidgetBase dijit/_TemplatedMixin dijit/_WidgetsInTemplateMixin jimu/BaseWidgetSetting jimu/dijit/Message dojo/text!./GraphicalEdit.html".split(" "),function(e,c,d,k,l,m,f,g,n,h){return e([g,f],{baseClass:"graphical-options-edit",templateString:h,_graphicaloption:null,config:null,dnls:null,postMixInProperties:function(){this.dnls=window.jimuNls.drawBox},postCreate:function(){this.inherited(arguments);this._setConfig(this.config)},
startup:function(){this.inherited(arguments)},_setConfig:function(a){if(this.config=a)this.multiCbx.setValue(this.config.multipartgraphicsearchchecked||!1),this.toleranceCbx.setValue(this.config.addpointtolerancechecked||!1),this.showmultiCbx.setValue(this.config.showmultigraphicsgraphicaloption),this.showtoleranceCbx.setValue(this.config.showaddtolerancegraphicaloption),this.showaddsqltextCbx.setValue(this.config.showaddsqltextgraphicaloption),this.showbufferCbx.setValue(this.config.showbuffergraphicaloption),
this.bufferbydefaultCbx.setValue(this.config.buffercheckedbydefaultgraphicaloption||!1),this.config.toleranceforpointgraphicalselection?this.pointTolerance.set("value",parseInt(this.config.toleranceforpointgraphicalselection,10)):this.pointTolerance.set("value",6),this.keepGraphicalEnabledCbx.setValue(this.config.keepgraphicalsearchenabled||!1),this._graphicaloption=[{name:"enablepointselect",label:this.dnls.point},{name:"enablelineselect",label:this.dnls.line},{name:"enablepolylineselect",label:this.dnls.polyline},
{name:"enablefreehandlineselect",label:this.dnls.freehandPolyline},{name:"enabletriangleselect",label:this.dnls.triangle},{name:"enableextentselect",label:this.dnls.extent},{name:"enablecircleselect",label:this.dnls.circle},{name:"enableellipseselect",label:this.dnls.ellipse},{name:"enablepolyselect",label:this.dnls.polygon},{name:"enablefreehandpolyselect",label:this.dnls.freehandPolygon},{name:"enableeLocateselect",label:this.nls.enableelocateselect}],this.selectDefaultTool.set("value",this.config.autoactivatedtool||
"none"),this._initGraphicalTable()},_initGraphicalTable:function(){this.GraphicalSearchTable.clear();this.GraphicalSearchTable.on("row-click",c.hitch(this,function(){this._checkSelections()}));var a=this.config;d.forEach(this._graphicaloption,c.hitch(this,function(b){b={config:b,exists:a.hasOwnProperty(b.name)};this._createGraphicalOps(b)}))},_checkSelections:function(){0===this.GraphicalSearchTable.getRowDataArrayByFieldValue("add",!0).length?this.popup.disableButton(0):this.popup.enableButton(0)},
_createGraphicalOps:function(a){a.searchSetting=this;a.nls=this.nls;a=this.GraphicalSearchTable.addRow({add:a.exists,label:a.config&&a.config.label||"",name:a.config&&a.config.name||""});return a.success?a.tr:null},getConfig:function(){var a=this.GraphicalSearchTable.getRowDataArrayByFieldValue("add",!0),b={};d.map(a,c.hitch(this,function(a){b[a.name]=!0}));b.showmultigraphicsgraphicaloption=this.showmultiCbx.getValue();b.showaddtolerancegraphicaloption=this.showtoleranceCbx.getValue();b.showaddsqltextgraphicaloption=
this.showaddsqltextCbx.getValue();b.showbuffergraphicaloption=this.showbufferCbx.getValue();b.buffercheckedbydefaultgraphicaloption=this.bufferbydefaultCbx.getValue();b.multipartgraphicsearchchecked=this.multiCbx.getValue();b.addpointtolerancechecked=this.toleranceCbx.getValue();b.toleranceforpointgraphicalselection=this.pointTolerance.get("value");b.keepgraphicalsearchenabled=this.keepGraphicalEnabledCbx.getValue();"none"!==this.selectDefaultTool.get("value")?b.autoactivatedtool=this.selectDefaultTool.get("value"):
delete b.autoactivatedtool;return b}})});