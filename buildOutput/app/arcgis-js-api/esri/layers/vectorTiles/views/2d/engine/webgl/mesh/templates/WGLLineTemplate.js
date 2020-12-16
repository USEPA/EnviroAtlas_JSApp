//>>built
define("require exports ../../../../../../core/tsSupport/extendsHelper ../../../../../../core/Logger ../../color ../../definitions ../../enums ../../enums ../../LineTess ../../number ../../TileClipper ../../Utils ../../WGLDisplayRecord ./WGLMeshTemplate".split(" "),function(C,J,M,N,O,P,k,Q,c,z,R,K,S,T){Object.defineProperty(J,"__esModule",{value:!0});var H=N.getLogger("esri.views.2d.engine.webgl.WGLLineTemplate"),E=c.allocTriangles(20),I=c.allocTriangles(20),F=[c.allocExtrudeVectors(),c.allocExtrudeVectors()],
L=c.allocExtrudeVectors(),G=P.TILE_SIZE+8,l=new c.Tessellator({distanceAlongCorrection:!0}),D=new R.TileClipper(0,0,0,1,8);D.setExtent(512);C=function(C){function p(d,b,a,e,f,g,w,h,x,c,t){var m=C.call(this)||this;m.capType=g;m.joinType=w;m.fillColor=h;m.tl=x;m.br=c;m.hasPattern=t;m.geometryType=k.WGLGeometryType.LINE;return m.halfWidth=0<e?.5*(e+1/f):0,m._materialStore=d,m.vvFlags=b,m.materialId=m._materialStore.createSpriteMaterial(a,m.geometryType,b),m}return M(p,C),p.fromSimpleLine=function(d,
b,a,e,f){var g=a.color,w=K.getCapType("round"),h=K.getJoinType("round"),g=g&&"none"!==a.style&&O.premultiplyAlphaRGBA(g)||0;if("none"===a.style&&(g=0),!e)return new p(d,b,e,a.width,f,w,h,g,0,0,!1);var c=e.rect,n=c.x+1+e.width,t=c.y+1+e.height,c=z.i1616to32(c.x+1,c.y+1),n=z.i1616to32(n,t);return new p(d,b,e,a.width,f,w,h,g,c,n,!0)},p.fromPictureLineSymbol=function(d,b,a,e){return H.error("PictureLineSymbol support does not exist!"),null},p.prototype.writeMesh=function(d,b,a,e,f,g,w){if(this.vvFlags&
Q.WGLVVFlag.COLOR||0!==this.fillColor){g=this._materialStore.get(this.materialId);var h=b.indexVector;b=b.get("geometry");var c=this.halfWidth,n=new S(e,this.geometryType,this.materialId),t=this._getOffset(b,g);switch(n.vertexFrom=t,n.indexFrom=h.length,d.push(n),a){case "esriGeometryPolyline":return d=this._clipLines(f.geometry.paths),void this._write(n,h,b,t,e,c,d,g,w);case "esriGeometryPolygon":return d=this._clipLines(f.geometry.rings),void this._write(n,h,b,t,e,c,d,g,w);default:H.error("Unable to handle geometryType: "+
a)}}},p.prototype._clipLines=function(d){for(var b=[],a=!1,e=0;e<d.length;){var f=[],g=d[e];D.reset(2);var c=g[0],h=c[0],c=c[1];if(a)D.moveTo(h,c);else{if(-8>h||h>G||-8>c||c>G){a=!0;continue}f.push({x:h,y:c})}for(var l=!1,n=g.length,t=1;t<n;++t)if(h+=g[t][0],c+=g[t][1],a)D.lineTo(h,c);else{if(-8>h||h>G||-8>c||c>G){l=!0;break}f.push({x:h,y:c})}if(l)a=!0;else{if(a){if(f=D.resultWithStarts())for(a=0;a<f.length;a++)b.push(f[a])}else b.push({line:f,start:0});e++;a=!1}}return b},p.prototype._getOffset=
function(d,b){b=b.materialKeyInfo.hasVV()?11:8;return d.length/b},p.prototype._write=function(d,b,a,e,f,g,w,h,p){for(var n=0,t=0;t<w.length;t++){var m=w[t],A=m.line,B=m.start;if(!(2>A.length))for(var q=A[0],r=A[A.length-1],m=r.x-q.x,q=r.y-q.y,m=1E-6>m*m+q*q,k=B%65535,B=F[1],q=0;q<A.length;q++){var y=A[q],r=B===F[q%2]?F[(q+1)%2]:F[q%2],u=0===q,v=q===A.length-1;if(v&&m&&!this.hasPattern?c.copyExtrudeVectors(r,L):(this._computeExtrudeVectors(r,q,A,m),n+=this._writeVertices(a,f,g,y.x,y.y,r,k,n,h,p),!r.capCenter||
m&&v||this._writePieIndices(d,b,e,r),m&&u&&!this.hasPattern&&c.copyExtrudeVectors(L,r)),u||this._writeBridgeIndices(d,b,e,B,r),!v){var v=A[q+1],u=[v.x-y.x,v.y-y.y],x=c.length(u),u=[u[0]/x,u[1]/x],x=k+x;if(65535<x){var z=(65535-k)/(x-k),k=y.x+(v.x-y.x)*z,y=y.y+(v.y-y.y)*z,v=B;l.buttCap(v,u,u);n+=this._writeVertices(a,f,g,k,y,v,65535,n,h,p);l.bridge(E,r,v);this._writeBridgeIndices(d,b,e,r,v);l.buttCap(v,u,u);k=x-65535}else k=x,B=r}}}d.vertexCount=n},p.prototype._writeVertices=function(d,b,a,e,f,c,w,
h,l,p){var g=0,m=z.i1616to32(e,f),k=c.vectors;c=k.items;for(k=k.count;g<k;++g){var n=c[g].vector,q=n[0],n=n[1],r=c[g].texCoords,x=r[0],y=r[1],u=c[g].direction,r=u[0],v=u[1],u=z.i1616to32(w,31*a),q=z.i8888to32(Math.round(31*q),Math.round(31*n),Math.round(31*x),Math.round(31*y)),n=z.i8888to32(Math.round(31*r),Math.round(31*v),0,0);d.push(m);d.push(b);d.push(this.fillColor);d.push(q);d.push(u);d.push(this.tl);d.push(this.br);d.push(n);this._writeVV(d,p,l);c[g].base={index:h+g,point:[e,f]}}return g},
p.prototype._writeVV=function(d,b,a){a.materialKeyInfo.hasVV()&&(d.push(b[k.VVType.SIZE]),d.push(b[k.VVType.COLOR]),d.push(b[k.VVType.OPACITY]))},p.prototype._writeBridgeIndices=function(d,b,a,c,f){l.bridge(E,c,f);for(c=0;c<E.count;++c)f=E.items[c],b.push(a+f.v1.base.index),b.push(a+f.v2.base.index),b.push(a+f.v3.base.index),d.indexCount+=3},p.prototype._writePieIndices=function(c,b,a,e){l.pie(I,e);for(e=0;e<I.count;++e){var d=I.items[e];b.push(a+d.v1.base.index);b.push(a+d.v2.base.index);b.push(a+
d.v3.base.index);c.indexCount+=3}},p.prototype._computeExtrudeVectors=function(d,b,a,e){var f=a[b],g=[void 0,void 0],k=[void 0,void 0];if(0<b&&b<a.length-1){var h=a[(b+a.length-1)%a.length],l=a[(b+1)%a.length];c.normalize(g,[f.x-h.x,f.y-h.y]);c.normalize(k,[l.x-f.x,l.y-f.y])}else if(0===b)l=a[(b+1)%a.length],(c.normalize(k,[l.x-f.x,l.y-f.y]),e)?(h=a[a.length-2],c.normalize(g,[f.x-h.x,f.y-h.y])):g=k;else{if(b!==a.length-1)return void console.error("Vertex index 'i' out of range.");h=a[(b+a.length-
1)%a.length];(c.normalize(g,[f.x-h.x,f.y-h.y]),e)?(h=a[1],c.normalize(k,[h.x-f.x,h.y-f.y])):k=g}e||0!==b?e||b!==a.length-1?this._computeJoinExtrudeVectors(d,g,k):this._computeCapExtrudeVectors(d,g,k,c.CapPosition.END):this._computeCapExtrudeVectors(d,g,k,c.CapPosition.START)},p.prototype._computeCapExtrudeVectors=function(d,b,a,e){switch(this.capType){case k.CapType.BUTT:return void l.buttCap(d,b,a);case k.CapType.ROUND:var f=c.getNumberOfSlices(Math.PI);return void l.roundCap(d,b,a,e,f,e===c.CapPosition.START?
-1:1);case k.CapType.SQUARE:return void l.squareCap(d,b,a,e);default:return H.error("Encountered unknown cap type: "+this.capType+", defaulting to BUTT"),void l.buttCap(d,b,a)}},p.prototype._computeJoinExtrudeVectors=function(d,b,a){var e=c.getRads(b,a);if(e>Math.PI-.05)l.rectJoin(d,b,a);else if(this.joinType===k.JoinType.MITER||.1>e).05>e?l.fastMiterJoin(d,b,a):e<c.MITER_SAFE_RADS?l.miterJoin(d,b,a):l.bevelJoin(d,b,a,c.SYSTEM_MAG_LIMIT);else if(this.joinType===k.JoinType.BEVEL)l.bevelJoin(d,b,a,
1);else if(this.joinType===k.JoinType.ROUND){var f=c.getNumberOfSlices(e);2.3>e?2>f||.5>e?l.bevelJoin(d,b,a,1):l.roundJoin(d,b,a,f):l.unitRoundJoin(d,b,a,f)}},p}(T.default);J.default=C});