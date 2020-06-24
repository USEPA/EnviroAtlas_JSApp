//>>built
define("require exports ../core/tsSupport/declareExtendsHelper ../core/tsSupport/decorateHelper ../core/tsSupport/paramHelper ../symbols ../core/arrayUtils ../core/Error ../core/lang ../core/Logger ../core/urlUtils ../core/accessorSupport/decorators ../core/accessorSupport/ensureType ../portal/Portal ./Renderer ./support/diffUtils ./support/LegendOptions ./support/UniqueValueInfo ../support/arcadeUtils ../symbols/support/jsonUtils ../symbols/support/styleUtils ../symbols/support/typeUtils".split(" "),
function(H,I,y,e,z,t,v,A,f,B,p,c,w,u,C,D,E,q,l,g,F,h){var k=B.getLogger("esri.renderers.UniqueValueRenderer"),G=w.ensureType(q.default);return function(x){function a(b){b=x.call(this)||this;return b._valueInfoMap={},b._isDefaultSymbolDerived=!1,b.type="unique-value",b.backgroundFillSymbol=null,b.field=null,b.field2=null,b.field3=null,b.valueExpression=null,b.valueExpressionTitle=null,b.legendOptions=null,b.defaultLabel=null,b.fieldDelimiter=null,b.portal=null,b.styleOrigin=null,b.diff={uniqueValueInfos:function(b,
a){if(b||a){if(!b||!a)return{type:"complete",oldValue:b,newValue:a};for(var d=!1,m={type:"collection",added:[],removed:[],changed:[],unchanged:[]},c=0;c<a.length;c++)!function(c){var r=v.find(b,function(b){return b.value===a[c].value});r?D.diff(r,a[c])?(m.changed.push({type:"complete",oldValue:r,newValue:a[c]}),d=!0):(m.unchanged.push({oldValue:r,newValue:a[c]}),d=!0):(m.added.push(a[c]),d=!0)}(c);for(c=0;c<b.length;c++)!function(c){v.find(a,function(d){return d.value===b[c].value})||(m.removed.push(b[c]),
d=!0)}(c);return d?m:void 0}}},b._set("uniqueValueInfos",[]),b}return y(a,x),n=a,a.prototype.writeType=function(b,d,a,c){d.type="uniqueValue"},a.prototype.writeBackgroundFillSymbolWebScene=function(b,d,a,c){g.writeTarget(b,d,a,c)},a.prototype.castField=function(b){return null==b?b:"function"==typeof b?b:w.ensureString(b)},a.prototype.writeField=function(b,d,a,c){"string"==typeof b?d[a]=b:c&&c.messages?c.messages.push(new A("property:unsupported","UniqueValueRenderer.field set to a function cannot be written to JSON")):
k.error(".field: cannot write field to JSON since it's not a string value")},Object.defineProperty(a.prototype,"compiledFunc",{get:function(){return l.createFunction(this.valueExpression)},enumerable:!0,configurable:!0}),Object.defineProperty(a.prototype,"defaultSymbol",{set:function(b){this._isDefaultSymbolDerived=!1;this._set("defaultSymbol",b)},enumerable:!0,configurable:!0}),a.prototype.readDefaultSymbol=function(b,d,a){return g.read(b,d,a)},a.prototype.writeDefaultSymbolWebScene=function(b,d,
a,c){this._isDefaultSymbolDerived||g.writeTarget(b,d,a,c)},a.prototype.writeDefaultSymbol=function(b,d,a,c){this._isDefaultSymbolDerived||g.writeTarget(b,d,a,c)},a.prototype.readPortal=function(b,d,a){return a.portal||u.getDefault()},a.prototype.readStyleOrigin=function(b,d,a){if(d.styleName)return Object.freeze({styleName:d.styleName});if(d.styleUrl)return b=p.read(d.styleUrl,a),Object.freeze({styleUrl:b})},a.prototype.writeStyleOrigin=function(b,d,a,c){b.styleName?d.styleName=b.styleName:b.styleUrl&&
(d.styleUrl=p.write(b.styleUrl,c),p.isAbsolute(d.styleUrl)&&(d.styleUrl=p.normalize(d.styleUrl)))},Object.defineProperty(a.prototype,"uniqueValueInfos",{set:function(b){if(this.styleOrigin)return void k.error("#uniqueValueInfos\x3d","Cannot modify unique value infos of a UniqueValueRenderer created from a web style");this._set("uniqueValueInfos",b);this._updateValueInfoMap()},enumerable:!0,configurable:!0}),a.prototype.addUniqueValueInfo=function(b,d){if(this.styleOrigin)return void k.error("#addUniqueValueInfo()",
"Cannot modify unique value infos of a UniqueValueRenderer created from a web style");b="object"==typeof b?G(b):new q.default({value:b,symbol:d});this.uniqueValueInfos.push(b);this._valueInfoMap[b.value]=b},a.prototype.removeUniqueValueInfo=function(b){if(this.styleOrigin)return void k.error("#removeUniqueValueInfo()","Cannot modify unique value infos of a UniqueValueRenderer created from a web style");for(var d=0;d<this.uniqueValueInfos.length;d++)if(this.uniqueValueInfos[d].value===b+""){delete this._valueInfoMap[b];
this.uniqueValueInfos.splice(d,1);break}},a.prototype.getUniqueValueInfo=function(b,d){var a,c=this.field,e=b.attributes;this.valueExpression?a=l.executeFunction(this.compiledFunc,l.createExecContext(b,l.getViewInfo(d))):"function"!=typeof c&&this.field2?(b=this.field2,d=this.field3,a=[],c&&a.push(e[c]),b&&a.push(e[b]),d&&a.push(e[d]),a=a.join(this.fieldDelimiter||"")):"function"==typeof c?a=c(b):c&&(a=e[c]);return this._valueInfoMap[a+""]},a.prototype.getSymbol=function(b,a){return(b=this.getUniqueValueInfo(b,
a))&&b.symbol||this.defaultSymbol},a.prototype.getSymbols=function(){for(var b=[],a=0,c=this.uniqueValueInfos;a<c.length;a++){var e=c[a];e.symbol&&b.push(e.symbol)}return this.defaultSymbol&&b.push(this.defaultSymbol),b},a.prototype.clone=function(){var b=new n({field:this.field,field2:this.field2,field3:this.field3,defaultLabel:this.defaultLabel,defaultSymbol:f.clone(this.defaultSymbol),valueExpression:this.valueExpression,valueExpressionTitle:this.valueExpressionTitle,fieldDelimiter:this.fieldDelimiter,
visualVariables:f.clone(this.visualVariables),legendOptions:f.clone(this.legendOptions),authoringInfo:this.authoringInfo&&this.authoringInfo.clone(),backgroundFillSymbol:f.clone(this.backgroundFillSymbol)});this._isDefaultSymbolDerived&&(b._isDefaultSymbolDerived=!0);b._set("portal",this.portal);var a=f.clone(this.uniqueValueInfos);return this.styleOrigin&&(b._set("styleOrigin",Object.freeze(f.clone(this.styleOrigin))),Object.freeze(a)),b._set("uniqueValueInfos",a),b._updateValueInfoMap(),b},a.prototype.collectRequiredFields=
function(b){this.inherited(arguments);[this.field,this.field2,this.field3].forEach(function(a){a&&"string"==typeof a&&(b[a]=!0)});this.valueExpression&&l.extractFieldNames(this.valueExpression).forEach(function(a){b[a]=!0})},a.prototype.populateFromStyle=function(){var b=this;return F.fetchStyle(this.styleOrigin,{portal:this.portal}).then(function(a){var c=[];return b._valueInfoMap={},a&&a.data&&Array.isArray(a.data.items)&&a.data.items.forEach(function(d){var e=new t.WebStyleSymbol({styleUrl:a.styleUrl,
styleName:a.styleName,portal:b.portal,name:d.name});b.defaultSymbol||d.name!==a.data.defaultItem||(b.defaultSymbol=e,b._isDefaultSymbolDerived=!0);e=new q.default({value:d.name,symbol:e});c.push(e);b._valueInfoMap[d.name]=e}),b._set("uniqueValueInfos",Object.freeze(c)),!b.defaultSymbol&&b.uniqueValueInfos.length&&(b.defaultSymbol=b.uniqueValueInfos[0].symbol,b._isDefaultSymbolDerived=!0),b})},a.prototype._updateValueInfoMap=function(){var b=this;this._valueInfoMap={};this.uniqueValueInfos.forEach(function(a){return b._valueInfoMap[a.value+
""]=a})},a.fromPortalStyle=function(a,c){var b=new n(c&&c.properties);b._set("styleOrigin",Object.freeze({styleName:a}));b._set("portal",c&&c.portal||u.getDefault());c=b.populateFromStyle();return c.catch(function(b){k.error("#fromPortalStyle('"+a+"'[, ...])","Failed to create unique value renderer from style name",b)}),c},a.fromStyleUrl=function(a,c){c=new n(c&&c.properties);c._set("styleOrigin",Object.freeze({styleUrl:a}));c=c.populateFromStyle();return c.catch(function(b){k.error("#fromStyleUrl('"+
a+"'[, ...])","Failed to create unique value renderer from style URL",b)}),c},e([c.property()],a.prototype,"type",void 0),e([c.writer("type")],a.prototype,"writeType",null),e([c.property({types:{base:t.BaseSymbol,key:"type",typeMap:{"simple-fill":h.rendererTypes.typeMap["simple-fill"],"picture-fill":h.rendererTypes.typeMap["picture-fill"],"polygon-3d":h.rendererTypes.typeMap["polygon-3d"]}},json:{read:g.read,write:g.writeTarget}})],a.prototype,"backgroundFillSymbol",void 0),e([c.writer("web-scene",
"backgroundFillSymbol",{backgroundFillSymbol:{type:t.PolygonSymbol3D}})],a.prototype,"writeBackgroundFillSymbolWebScene",null),e([c.property({json:{type:String,read:{source:"field1"},write:{target:"field1"}}})],a.prototype,"field",void 0),e([c.cast("field")],a.prototype,"castField",null),e([c.writer("field")],a.prototype,"writeField",null),e([c.property({type:String,json:{write:!0}})],a.prototype,"field2",void 0),e([c.property({type:String,json:{write:!0}})],a.prototype,"field3",void 0),e([c.property({type:String,
json:{write:!0}})],a.prototype,"valueExpression",void 0),e([c.property({type:String,json:{write:!0}})],a.prototype,"valueExpressionTitle",void 0),e([c.property({dependsOn:["valueExpression"]})],a.prototype,"compiledFunc",null),e([c.property({type:E.default,json:{write:!0}})],a.prototype,"legendOptions",void 0),e([c.property({type:String,json:{write:!0}})],a.prototype,"defaultLabel",void 0),e([c.property({types:h.rendererTypes})],a.prototype,"defaultSymbol",null),e([c.reader("defaultSymbol")],a.prototype,
"readDefaultSymbol",null),e([c.writer("web-scene","defaultSymbol",{defaultSymbol:{types:h.rendererTypes3D}})],a.prototype,"writeDefaultSymbolWebScene",null),e([c.writer("defaultSymbol")],a.prototype,"writeDefaultSymbol",null),e([c.property({type:String,json:{write:!0}})],a.prototype,"fieldDelimiter",void 0),e([c.property({type:u,readOnly:!0})],a.prototype,"portal",void 0),e([c.reader("portal",["styleName"])],a.prototype,"readPortal",null),e([c.property({readOnly:!0})],a.prototype,"styleOrigin",void 0),
e([c.reader("styleOrigin",["styleName","styleUrl"])],a.prototype,"readStyleOrigin",null),e([c.writer("styleOrigin",{styleName:{type:String},styleUrl:{type:String}})],a.prototype,"writeStyleOrigin",null),e([c.property({type:[q.default],json:{write:{overridePolicy:function(){return this.styleOrigin?{enabled:!1}:{enabled:!0}}}}})],a.prototype,"uniqueValueInfos",null),e([c.property({dependsOn:["field","field2","field3","valueExpression"],readOnly:!0})],a.prototype,"requiredFields",void 0),e([z(1,c.cast(h.ensureType))],
a.prototype,"addUniqueValueInfo",null),a=n=e([c.subclass("esri.renderers.UniqueValueRenderer")],a);var n}(c.declared(C))});