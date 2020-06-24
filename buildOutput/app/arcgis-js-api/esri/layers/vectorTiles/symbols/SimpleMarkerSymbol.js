//>>built
define(["../core/declare","../core/lang","../core/screenUtils","./MarkerSymbol","./SimpleLineSymbol"],function(h,c,k,l,f){var g={style:"circle",color:[255,255,255,.25],outline:new f,size:12,angle:0,xoffset:0,yoffset:0},b=h(l,{declaredClass:"esri.symbols.SimpleMarkerSymbol",properties:{color:{json:{write:function(a,d){a&&"x"!==this.style&&"cross"!==this.style&&(d.color=a.toJSON())}}},type:"simple-marker",size:{value:12},style:{type:String,value:"circle",json:{read:function(a){return c.valueOf(this._styles,
a)},write:function(a,d){d.style=this._styles[a]}}},path:{type:String,value:null,set:function(a){this.style="path";this._set("path",a)},json:{write:!0}},outline:{type:f,json:{write:!0}}},_styles:{circle:"esriSMSCircle",square:"esriSMSSquare",cross:"esriSMSCross",x:"esriSMSX",diamond:"esriSMSDiamond",path:"esriSMSPath"},getDefaults:function(){return c.mixin(this.inherited(arguments),g)},normalizeCtorArgs:function(a,d,c,b){if(a&&"string"!=typeof a)return a;var e={};return a&&(e.style=a),null!=d&&(e.size=
k.toPt(d)),c&&(e.outline=c),b&&(e.color=b),e},clone:function(){return new b({angle:this.angle,color:c.clone(this.color),outline:this.outline&&this.outline.clone(),path:this.path,size:this.size,style:this.style,xoffset:this.xoffset,yoffset:this.yoffset})},read:function d(b,f){return this.getInherited(d,arguments).call(this,c.mixin({outline:null},b),f)}});return c.mixin(b,{STYLE_CIRCLE:"circle",STYLE_SQUARE:"square",STYLE_CROSS:"cross",STYLE_X:"x",STYLE_DIAMOND:"diamond",STYLE_PATH:"path",STYLE_TARGET:"target"}),
b.defaultProps=g,b});