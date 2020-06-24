//>>built
define("dojo/_base/declare dojo/_base/lang dojo/_base/html dojo/on dojo/aspect dojo/cookie dojo/sniff dojo/query ./ColorPickerEditor ./BackgroundSelector ./SizeSelector ./AlignSelector dijit/_WidgetsInTemplateMixin dijit/Editor jimu/utils jimu/BaseWidgetSetting jimu/dijit/CheckBox jimu/dijit/TabContainer jimu/dijit/LoadingShelter dojo/Deferred dojo/NodeList-manipulate jimu/dijit/RadioBtn dijit/_editor/plugins/LinkDialog dijit/_editor/plugins/ViewSource dijit/_editor/plugins/FontChoice dojox/editor/plugins/Preview dijit/_editor/plugins/TextColor dojox/editor/plugins/ToolbarLineBreak dijit/ToolbarSeparator dojox/editor/plugins/FindReplace dojox/editor/plugins/PasteFromWord dojox/editor/plugins/InsertAnchor dojox/editor/plugins/Blockquote dojox/editor/plugins/UploadImage jimu/dijit/EditorChooseImage jimu/dijit/EditorTextColor jimu/dijit/EditorBackgroundColor".split(" "),
function(l,e,d,g,m,n,p,f,h,q,r,t,u,v,c,w,k,x,y,z){return l([w,u],{baseClass:"jimu-widget-splash-setting",_defaultSize:{mode:"wh",wh:{w:600,h:264}},_defaultColor:"#485566",_defaultConfirmColor:"#ffffff",_defaultTransparency:0,postMixInProperties:function(){this.nls=e.mixin(this.nls,window.jimuNls.common)},postCreate:function(){this.shelter=new y({hidden:!0});this.shelter.placeAt(this.domNode);this.shelter.startup();this.tab=new x({tabs:[{title:this.nls.content,content:this.contentTab},{title:this.nls.appearance,
content:this.appearanceTab},{title:this.nls.options,content:this.optionsTab}],selected:this.nls.content});this.tab.placeAt(this.tabsContainer);this.tab.startup();this.own(g(this.tab,"tabChanged",e.hitch(this,function(a){a===this.nls.content&&this.resize()})));this.inherited(arguments)},initContentTab:function(){var a=document.getElementsByTagName("head")[0],b=window.apiUrl+"dojox/editor/plugins/resources/css/TextColor.css";f('link[href\x3d"'+b+'"]',a)[0]||c.loadStyleLink("editor_plugins_resources_TextColor",
b);b=window.apiUrl+"dojox/editor/plugins/resources/editorPlugins.css";f('link[href\x3d"'+b+'"]',a)[0]||c.loadStyleLink("editor_plugins_resources_editorPlugins",b);b=window.apiUrl+"dojox/editor/plugins/resources/css/PasteFromWord.css";f('link[href\x3d"'+b+'"]',a)[0]||c.loadStyleLink("editor_plugins_resources_PasteFromWord",b);this.initEditor()},initAppearanceTab:function(){this.sizeSelector=new r({nls:this.nls},this.sizeSelector);this.backgroundSelector=new q({nls:this.nls},this.backgroundSelector);
this.backgroundSelector.startup();this.alignSelector=new t({nls:this.nls},this.alignSelector);this.alignSelector.startup();this.buttonColorPicker=new h({nls:this.nls},this.buttonColorPickerEditor);this.buttonColorPicker.startup();this.confirmColorPicker=new h({nls:this.nls},this.confirmColorPickerEditor);this.confirmColorPicker.startup()},initOptionsTab:function(){this.own(g(this.requireConfirmSplash,"click",e.hitch(this,function(){this.set("requireConfirm",!0)})));this.own(g(this.noRequireConfirmSplash,
"click",e.hitch(this,function(){this.set("requireConfirm",!1)})));this.own(this.watch("requireConfirm",e.hitch(this,this._changeRequireConfirm)));this.own(m.before(this,"getConfig",e.hitch(this,this._beforeGetConfig)));this.showOption=new k({label:this.nls.optionText,checked:!1},this.showOption);this.showOption.startup();d.addClass(this.showOption.domNode,"option-text");this.confirmOption=new k({label:this.nls.confirmOption,checked:!1},this.confirmOption);this.confirmOption.startup();d.addClass(this.confirmOption.domNode,
"confirm-option")},startup:function(){this.inherited(arguments);this.shelter.show();this.config.splash||(this.config.splash={});this.initContentTab();this.initAppearanceTab();this.initOptionsTab();this.setConfig(this.config);this.resize()},initEditor:function(){this.editor=new v({plugins:["bold","italic","underline",c.getEditorTextColor("splash"),c.getEditorBackgroundColor("splash"),"|","justifyLeft","justifyCenter","justifyRight","justifyFull","|","insertOrderedList","insertUnorderedList","indent",
"outdent"],extraPlugins:["|","createLink","unlink","pastefromword","|","undo","redo","|","chooseImage","|","viewsource","toolbarlinebreak",{name:"dijit._editor.plugins.FontChoice",command:"fontName",custom:"Arial;Comic Sans MS;Courier New;Garamond;Tahoma;Times New Roman;Verdana".split(";")},"fontSize","formatBlock"],style:"font-family:Verdana;"},this.editor);d.setStyle(this.editor.domNode,{width:"100%",height:"100%"});this.editor.startup();var a=d.getMarginBox(this.instructionNode),b=d.getMarginBox(this.splashFooterNode);
d.setStyle(this.editorContainer,{top:a.h+8+"px",bottom:b.h+10+10+"px"});8!==p("ie")?this.editor.resize({w:"100%",h:"100%"}):(a=d.getMarginBox(this.editorContainer),this.editor.resize({w:a.w,h:a.h}))},setConfig:function(a){this.config=a;this._setWidthForOldVersion().then(e.hitch(this,function(){this.editor.set("value",a.splash.splashContent||this.nls.defaultContent);this.set("requireConfirm",a.splash.requireConfirm);this.showOption.setValue(a.splash.showOption);this.confirmOption.setValue(a.splash.confirmEverytime);
d.setAttr(this.confirmText,"value",c.stripHTML(a.splash.confirm.text||this.nls.defaultConfirmText));this.confirmColorPicker.setValues({color:a.splash.confirm.color||this._defaultConfirmColor,transparency:a.splash.confirm.transparency||this._defaultTransparency});this.sizeSelector.setValue(a.splash.size||this._defaultSize);"undefined"!==typeof a.splash.image&&this.imageChooser.setDefaultSelfSrc(a.splash.image);this.alignSelector.setValue(a.splash.contentVertical);this.backgroundSelector.setValues(a);
this.buttonColorPicker.setValues({color:a.splash.button.color||this._defaultColor,transparency:a.splash.button.transparency||this._defaultTransparency});d.setAttr(this.buttonText,"value",c.stripHTML(a.splash.button.text||this.nls.ok));this.shelter.hide();this.resize();setTimeout(e.hitch(this,function(){this.resize()}),200)}))},_beforeGetConfig:function(){var a=this._getCookieKey();n(a,!0,{expires:1E3,path:"/"})},_getCookieKey:function(){return"isfirst_"+encodeURIComponent(c.getAppIdFromUrl())},isValid:function(){return this.backgroundSelector.isValid()&&
this.buttonColorPicker.isValid()&&this.confirmColorPicker.isValid()},getConfig:function(){if(!this.isValid())return!1;this.config.splash.splashContent=this._getEditorValue();this.config.splash.size=this.sizeSelector.getValue();this.config.splash.requireConfirm=this.get("requireConfirm");this.config.splash.showOption=this.showOption.getValue();this.config.splash.confirmEverytime=this.confirmOption.getValue();this.get("requireConfirm")?this.config.splash.confirm.text=c.stripHTML(this.confirmText.value||
""):this.config.splash.confirm.text="";var a=this.confirmColorPicker.getValues();a&&(this.config.splash.confirm.color=a.color,this.config.splash.confirm.transparency=a.transparency);this.config.splash.background=this.backgroundSelector.getValues();this.config.splash.button={};if(a=this.buttonColorPicker.getValues())this.config.splash.button.color=a.color,this.config.splash.button.transparency=a.transparency;this.config.splash.button.text=c.stripHTML(this.buttonText.value||"");this.config.splash.contentVertical=
this.alignSelector.getValue();return this.config},_changeRequireConfirm:function(){var a=null;this.get("requireConfirm")?(a=this.requireConfirmRadio,d.setStyle(this.confirmContainer,"display","block"),d.setStyle(this.showOption.domNode,"display","none")):(a=this.noRequireRadio,d.setStyle(this.showOption.domNode,"display","block"),d.setStyle(this.confirmContainer,"display","none"));a&&a.setChecked&&a.setChecked(!0)},destroy:function(){var a=document.getElementsByTagName("head")[0];f('link[id^\x3d"editor_plugins_resources"]',
a).remove();this.inherited(arguments)},_onConfirmTextBlur:function(){this.confirmText.value=c.stripHTML(this.confirmText.value||"")},_onButtonTextBlur:function(){this.buttonText.value=c.stripHTML(this.buttonText.value||"")},_getEditorValue:function(){var a=this.editor.get("value");""===a&&(a="\x3cp\x3e\x3c/p\x3e");return a},_setWidthForOldVersion:function(){var a=new z,b=this.config.splash.size;if(!0===("wh"===b.mode&&"undefined"!==typeof b.wh&&null===b.wh.h))return c.getEditorContentHeight(this.config.splash.splashContent,
this.domNode,{contentWidth:560,contentMarginTop:20,footerHeight:98}).then(e.hitch(this,function(a){return b.wh.h=a}));a.resolve();return a},resize:function(){var a=d.getContentBox(this.editorContainer),b=f(".dijitEditorIFrameContainer",this.editorContainer)[0],c;this.editor&&this.editor.header&&(c=d.getContentBox(this.editor.header));b&&a&&c&&d.setStyle(b,"height",a.h-c.h-4+"px")}})});