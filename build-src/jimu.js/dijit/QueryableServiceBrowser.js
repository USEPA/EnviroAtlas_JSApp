// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See http://js.arcgis.com/3.15/esri/copyright.txt and http://www.arcgis.com/apps/webappbuilder/copyright.txt for details.
//>>built
define(["dojo/_base/declare","./_BasicServiceBrowser","dojo/_base/lang","dojo/_base/array","jimu/serviceBrowserRuleUtils"],function(c,d,e,f,g){return c([d],{declaredClass:"jimu.dijit.QueryableServiceBrowser",baseClass:"jimu-queryable-service-browser",url:"",multiple:!1,postMixInProperties:function(){this.inherited(arguments);this.rule=g.getQueryableServiceBrowserRule()},getSelectedItems:function(){var b=this.inherited(arguments);return b=f.map(b,e.hitch(this,function(a){return{name:a.name,url:a.url,
definition:a.definition}}))}})});