//>>built
require({cache:{"widgets/DrawerMappingTools/_build-generate_module":function(){define(["dojo/text!./Widget.html","dojo/text!./css/style.css","dojo/i18n!./nls/strings","dojo/text!widgets/DrawerMappingTools/config.json"],function(){})},"url:widgets/DrawerMappingTools/Widget.html":'\x3cdiv\x3e\r\n\t\x3c!--\x3cdiv\x3e${nls.label1}.\x3c/div\x3e--\x3e\r\n\t\x3c!--\x3cdiv\x3e${nls.label2}.[${config.configText}]\x3c/div\x3e--\x3e\r\n  \x3cdiv data-dojo-attach-point\x3d"drawerMappingIdNode" id\x3d"drawerMappingNode"\x3e\x3c/div\x3e\r\n\t\x3c!--\x3cdiv style\x3d"left: 0px; top: 0px; right: auto; bottom: auto; width: 100%; height: 40px; padding: 0px; z-index: auto;line-height: 40px" class\x3d"jimu-widget-onscreen-icon" id\x3d"widget_Raindrop"\x3e--\x3e\r\n\t\t\x3c!--\x3cimg style\x3d"float:left" src\x3d"widgets/Raindrop/images/icon.png"\x3e\x3cspan class\x3d"droplabel" \x3eRaindrop\x3c/span\x3e--\x3e\r\n\t\x3c!--\x3c/div\x3e--\x3e\r\n\r\n\x3c/div\x3e',
"url:widgets/DrawerMappingTools/css/style.css":".jimu-widget-drawer .droplabel{color: white; float:left;}.jimu-widget-drawer .jimu-widget-onscreen-icon{border-radius: 5px;}","url:widgets/DrawerMappingTools/config.json":'{\r\n\t"configText":"Drawer",\r\n\t"includeWidgets":["eBookmark", "Print", "eDraw", "Legend"]\r\n}\r\n',"*now":function(e){e(['dojo/i18n!*preload*widgets/DrawerMappingTools/nls/Widget*["","ROOT"]'])}}});
define("dojo/_base/declare jimu/BaseWidget jimu/WidgetManager jimu/PanelManager dojo/on dojo/dom dojo/dom-construct".split(" "),function(e,g,n,h,k,f,l){return e([g],{baseClass:"jimu-widget-drawer",postCreate:function(){this.inherited(arguments);console.log("postCreate")},startup:function(){var b=this;this.inherited(arguments);var c=0;this.config.includeWidgets.forEach(function(a){var m=b.appConfig.getConfigElementsByName(a)[0].label;l.place('\x3cdiv style\x3d"left: 0px; top: '+c+'px; right: auto; bottom: auto; width: 100%; height: 40px; padding: 0px; z-index: auto;line-height: 40px" class\x3d"jimu-widget-onscreen-icon" id\x3d"widget_'+
a+'"\x3e\x3cimg style\x3d"float:left" src\x3d"widgets/'+a+'/images/icon.png"\x3e\x3cspan class\x3d"droplabel" \x3e'+m+"\x3c/span\x3e\x3c/div\x3e",f.byId("drawerMappingNode"));b._setWidgetOpenHandler(a);c+=40});console.log("startup")},_setWidgetOpenHandler:function(b){var c=this,a=f.byId("widget_"+b);k(f.byId(a),"click",function(){var a=c.appConfig.getConfigElementsByName(b),d=h.getInstance();a[0].inPanel?d.showPanel(a[0]):(a=dojo.attr(dojo.query("[data-widget-name^\x3d'"+b+"']")[0],"widgetid"),dijit.byId(a).onClick());
panelID="widgets_DrawerMapping_34_panel";d.closePanel(panelID);d.openPanel(panelID);d.closePanel(panelID)})},onOpen:function(){console.log("onOpen")},onClose:function(){console.log("onClose")},onMinimize:function(){console.log("onMinimize")},onMaximize:function(){console.log("onMaximize")},onSignIn:function(b){console.log("onSignIn")},onSignOut:function(){console.log("onSignOut")}})});