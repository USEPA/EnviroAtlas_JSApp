//>>built
define("require exports dojo/has ../../core/promiseUtils ./Rect ./RectangleBinPack ../webgl/Texture".split(" "),function(F,G,x,C,D,A,E){var v;return x("stable-symbol-rendering")&&(v=new Set),function(){function l(c,e,b){this.height=this.width=0;this._dirties=[];this._glyphData=[];this._currentPage=0;this._glyphIndex={};this._textures=[];this._rangePromises=new Map;(0>=c||0>=e)&&console.error("Glyph mosaic width and height must be greater than zero!");this.width=c;this.height=e;this._glyphSource=b;
this._binPack=new A(c-4,e-4);this._glyphData.push(new Uint8Array(c*e));this._dirties.push(!0);this._textures.push(void 0)}return l.prototype.getGlyphItems=function(c,e,b){var a=this,g=[],l=this._glyphSource,n=new Set;for(c=0;c<b.length;c++)n.add(Math.floor(1/256*b[c]));var h=[];return n.forEach(function(b){if(256>=b){var d=e+b;a._rangePromises.has(d)?h.push(a._rangePromises.get(d)):(b=l.getRange(e,b).always(function(){a._rangePromises.delete(d)}),a._rangePromises.set(d,b),h.push(b))}}),C.all(h).then(function(c){(c=
a._glyphIndex[e])||(c={},a._glyphIndex[e]=c);var d;if(x("stable-symbol-rendering")){v.clear();for(var k=0;k<b.length;k++)d=b[k],v.add(d);var h=[];n.forEach(function(a){h.push(a)});h.sort();d=[];for(k=0;k<h.length;k++)for(var m=h[k],f=0;256>f;++f)d.push(256*m+f)}else d=b;k=0;for(m=d;k<m.length;k++)if(d=m[k],f=c[d])x("stable-symbol-rendering")&&!v.has(d)||(g[d]={rect:f.rect,metrics:f.metrics,page:f.page});else{var q=l.getGlyph(e,d);if(q&&q.metrics){var f=q.metrics,p=void 0;if(0===f.width)p=new D(0,
0,0,0);else{var t=f.width+6,w=f.height+6,u=t%4?4-t%4:4,r=w%4?4-w%4:4;1===u&&(u=5);1===r&&(r=5);p=a._binPack.allocate(t+u,w+r);p.isEmpty&&(a._dirties[a._currentPage]||(a._glyphData[a._currentPage]=null),a._currentPage=a._glyphData.length,a._glyphData.push(new Uint8Array(a.width*a.height)),a._dirties.push(!0),a._textures.push(void 0),a._binPack=new A(a.width-4,a.height-4),p=a._binPack.allocate(t+u,w+r));var u=a._glyphData[a._currentPage],q=q.bitmap,B=r=void 0;if(q)for(var y=0;y<w;y++)for(var r=t*y,
B=a.width*(p.y+y+1)+p.x,z=0;z<t;z++)u[B+z+1]=q[r+z]}c[d]={rect:p,metrics:f,tileIDs:null,page:a._currentPage};x("stable-symbol-rendering")&&!v.has(d)||(g[d]={rect:p,metrics:f,page:a._currentPage});a._dirties[a._currentPage]=!0}}return g})},l.prototype.removeGlyphs=function(c){for(var e in this._glyphIndex){var b=this._glyphIndex[e];if(b){var a=void 0,g;for(g in b)if(a=b[g],a.tileIDs.delete(c),0===a.tileIDs.size){for(var l=this._glyphData[a.page],n=a.rect,h=void 0,m=void 0,d=0;d<n.height;d++)for(h=
this.width*(n.y+d)+n.x,m=0;m<n.width;m++)l[h+m]=0;delete b[g];this._dirties[a.page]=!0}}}},l.prototype.bind=function(c,e,b,a){void 0===a&&(a=0);this._textures[b]||(this._textures[b]=new E(c,{pixelFormat:6406,dataType:5121,width:this.width,height:this.height},new Uint8Array(this.width*this.height)));var g=this._textures[b];g.setSamplingMode(e);this._dirties[b]&&g.setData(this._glyphData[b]);c.bindTexture(g,a);this._dirties[b]=!1},l.prototype.dispose=function(){this._binPack=null;for(var c=0,e=this._textures;c<
e.length;c++){var b=e[c];b&&b.dispose()}this._textures.length=0},l}()});