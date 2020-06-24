//>>built
define("require exports dojo/has ../../../../core/screenUtils ../../../../core/libs/earcut/earcut ../../../../core/libs/gl-matrix/mat2d ../../../../core/libs/gl-matrix/vec2 ../../../../core/libs/libtess/libtess ./color ./enums ./lineMeshUtil ./MeshData ./number ./TileClipper ./Utils ./visualVariablesUtils".split(" "),function(P,ca,Aa,Q,Ba,da,R,k,S,Ca,wb,Va,a,xb,Wa,yb){function Xa(p,q,c,d,n,k,r){d=c.slice(d,n);c=p.length/(r.length+1);k=Ba(d,k,2);n=k.length;if(0>=n)return 0;for(var m=0;m<d.length;)p.push(a.i1616to32(d[m++],
d[m++])),p.push.apply(p,r);for(p=0;p<n;)q.push(k[p++]+c,k[p++]+c,k[p++]+c)}Object.defineProperty(ca,"__esModule",{value:!0});var v,w,zb=3.14159265359/180,d=R.create(),r=da.create(),n=[],U=[],Ab=function(){function a(){this._indexCounter=this._currentVertexIndex=0;this._triangleIndices=[-1,-1,-1];this.glu=new k.GluTesselator;this.glu.gluTessCallback(k.gluEnum.GLU_TESS_BEGIN,this._begincallback.bind(this));this.glu.gluTessCallback(k.gluEnum.GLU_TESS_VERTEX_DATA,this._vertexCallback.bind(this));this.glu.gluTessCallback(k.gluEnum.GLU_TESS_END,
this._endcallback.bind(this));this.glu.gluTessCallback(k.gluEnum.GLU_TESS_COMBINE,this._combinecallback.bind(this));this.glu.gluTessCallback(k.gluEnum.GLU_TESS_ERROR,this._errorcallback.bind(this));this.glu.gluTessCallback(k.gluEnum.GLU_TESS_EDGE_FLAG,this._edgeCallback.bind(this));this.glu.gluTessProperty(k.gluEnum.GLU_TESS_WINDING_RULE,k.windingRule.GLU_TESS_WINDING_ODD)}return a.prototype.beginPolygon=function(a,c){this._triangleIndices[0]=-1;this._triangleIndices[1]=-1;this._triangleIndices[2]=
-1;this._indexCounter=this._currentVertexIndex=0;this.glu.gluTessBeginPolygon(a);this._indices=c},a.prototype.endPolygon=function(){this.glu.gluTessEndPolygon()},a.prototype.beginContour=function(){this.glu.gluTessBeginContour()},a.prototype.endContour=function(){this.glu.gluTessEndContour()},a.prototype.addVertex=function(a,c){this.glu.gluTessVertex(a,c)},a.prototype._vertexCallback=function(a,c){if(c[c.length]=a[0],c[c.length]=a[1],this._triangleIndices[this._currentVertexIndex]=-1,2<=this._currentVertexIndex){for(a=
0;3>a;a++)-1===this._triangleIndices[a]&&(this._triangleIndices[a]=this._indexCounter++),this._indices[this._indices.length]=this._triangleIndices[a];this._currentVertexIndex=0}else this._currentVertexIndex++},a.prototype._begincallback=function(a){this._triangleIndices[0]=-1;this._triangleIndices[1]=-1;this._triangleIndices[2]=-1;this._currentVertexIndex=0},a.prototype._endcallback=function(){this._currentVertexIndex=0},a.prototype._errorcallback=function(a){},a.prototype._combinecallback=function(a,
c,d){return[a[0],a[1],a[2]]},a.prototype._edgeCallback=function(a){},a}();P=Aa("esri-featurelayer-webgl");var Ya="libtess"===(P&&P.tesselator||"libtess");ca.createMesh=function(k,q,c,ea,P,ca,T,m,f,Za){switch(P){case Ca.WGLGeometryType.MARKER:var p,V,fa,ga,K,B,C,D,ha,$a=new Va,ab=0,bb=0,L=q.heatmapInfo;if(L){var cb=Math.round(q.heatmapInfo.radius);V=p=0;ga=fa=cb;K=[1,1,1,1];B=[0,0,0,0];D=C=cb;ha=0}else{var ia=ea.spriteMosaicItem;p=Math.round(ia.rect.x/4);V=Math.round(ia.rect.y/4);fa=p+Math.round(ia.rect.width/
4);ga=V+Math.round(ia.rect.height/4);var ab=Math.round(T*Q.pt2px(0|f.xoffset)),bb=Math.round(T*Q.pt2px(0|f.yoffset)),Aa=f.color?f.color:[0,0,0,0];K=Wa.isPictureSymbol(f)?[255,255,255,255]:S.copyAndPremultiply(Aa);C=Math.round(T*Q.pt2px(f.width||f.size));D=Math.round(T*Q.pt2px(f.height||f.size));f.outline?(B=null!=f.outline.color?S.copyAndPremultiply(f.outline.color):[0,0,0,0],ha=null!=f.outline.width?Math.round(Q.pt2px(f.outline.width)):0):(B=[0,0,0,0],ha=0)}da.identity(r);f.angle&&da.rotate(r,r,
zb*f.angle);da.translate(r,r,new Float32Array([-ab,-bb]));var b=[],ja=a.i8888to32(K[0],K[1],K[2],K[3]),ka=a.i8888to32(B[0],B[1],B[2],B[3]),la=a.i8888to32(C,D,ha,0),ma=a.numTo32(k),db=0,eb=0,fb=0,gb=0,W=0,X=c.vvColor||c.vvOpacity||c.vvRotation||c.vvSizeMinMaxValue||c.vvSizeScaleStops||c.vvSizeFieldStops||c.vvSizeUnitValue;if(X){var x=q.vvFields,na=x.rotation?q.getValue(m,x.rotation):0,oa=x.opacity?q.getValue(m,x.opacity):0,pa=x.color?q.getValue(m,x.color):0,M=x.size&&!c.vvSizeScaleStops?q.getValue(m,
x.size):0;c.vvSizeUnitValue&&(M=yb.getVisualVariableSizeValueRepresentationRatio(M,q.vvRanges.size.unitValue.valueRepresentation));(null===M||isNaN(M))&&(M=NaN);(null===na||isNaN(na))&&(na=NaN);(null===pa||isNaN(pa))&&(pa=NaN);(null===oa||isNaN(oa))&&(oa=NaN);db=a.toUint32(M);eb=a.toUint32(oa);fb=a.toUint32(na);gb=a.toUint32(pa)}var qa=[db,gb,eb,fb];L&&(W=a.toUint32(q.heatmapInfo.getIntensity(m)));var E,F=m.centroid||m.geometry;switch(ca){case "esriGeometryPoint":E=[[F.x,F.y]];break;case "esriGeometryMultipoint":E=
F.points;break;case "esriGeometryPolyline":E=F.paths[0];break;case "esriGeometryPolygon":E=m.centroid?[[F.x,F.y]]:F.rings[0]}for(var G,y=0,Da=0,Ea=0,H=Array(4*E.length),ra=0;ra<E.length;ra++){var hb=E[ra],ib=hb[0],jb=hb[1],sa=a.i1616to32(ib+Da,jb+Ea),Da=Da+ib,Ea=Ea+jb;d.set([-.5*C,-.5*D]);R.transformMat2d(d,d,r);b.push(sa);b.push(a.i8888to32(d[0],d[1],p,V));b.push(ma);b.push(ja);b.push(ka);b.push(la);X?b.push.apply(b,qa):L&&b.push(W);d.set([.5*C,-.5*D]);R.transformMat2d(d,d,r);b.push(sa);b.push(a.i8888to32(d[0],
d[1],fa,V));b.push(ma);b.push(ja);b.push(ka);b.push(la);X?b.push.apply(b,qa):L&&b.push(W);d.set([-.5*C,.5*D]);R.transformMat2d(d,d,r);b.push(sa);b.push(a.i8888to32(d[0],d[1],p,ga));b.push(ma);b.push(ja);b.push(ka);b.push(la);X?b.push.apply(b,qa):L&&b.push(W);d.set([.5*C,.5*D]);R.transformMat2d(d,d,r);b.push(sa);b.push(a.i8888to32(d[0],d[1],fa,ga));b.push(ma);b.push(ja);b.push(ka);b.push(la);X?b.push.apply(b,qa):L&&b.push(W);G=6*ra;H[G+0]=y+0;H[G+1]=y+1;H[G+2]=y+2;H[G+3]=y+1;H[G+4]=y+3;H[G+5]=y+2;
y+=4}return $a.update({geometry:b},y,H),$a;case Ca.WGLGeometryType.FILL:var Fa;a:{var kb,ta=null!=ea?ea.spriteMosaicItem:null,Ga=m.geometry,lb=Wa.isPictureSymbol(f);kb=lb?S.premultiplyAlphaUint32(S.white):f.color?S.premultiplyAlphaUint32(f.color):0;var Ba=c.vvColor||c.vvOpacity,mb=new Va,Ha=0,Ia=0,Ja=0,Ka=0;if(ta)var nb=ta.rect,ob=nb.x,pb=nb.y,Bb=ta.width,Cb=ta.height,Ha=ob+1,Ia=pb+1,Ja=ob+1+Bb,Ka=pb+1+Cb;var Db=lb&&f.width&&f.height?a.i8888to32(a.nextHighestPowerOfTwo(f.width),a.nextHighestPowerOfTwo(f.height),
0,0):a.i8888to32(a.nextHighestPowerOfTwo(Ja-Ha),a.nextHighestPowerOfTwo(Ka-Ia),0,0),Y=[a.numTo32(k),kb,a.i1616to32(Ha,Ia),a.i1616to32(Ja,Ka),Db];if(Ba){var ua=q.vvFields,va=ua.opacity?q.getValue(m,ua.opacity):0,wa=ua.color?q.getValue(m,ua.color):0;(Za||null===wa||isNaN(wa))&&(wa=NaN);(Za||null===va||isNaN(va))&&(va=NaN);Y.push(a.toUint32(wa),a.toUint32(va))}for(var z=!1,La=0,qb=Ga.rings;La<qb.length;La++){var e=qb[La],Z=e.length;if(!(3>Z)){var aa=e[0][0],ba=e[0][1];if(-8>aa||520<aa||-8>ba||520<ba){z=
!0;break}for(var g=1;g<Z;++g)if(aa+=e[g][0],ba+=e[g][1],-8>aa||520<aa||-8>ba||520<ba){z=!0;break}if(z)break}}var N,l,h;if(z){v||(v=new xb.TileClipper(0,0,0,1,8),v.setExtent(512));v.reset(3);for(var Ma=0,rb=Ga.rings;Ma<rb.length;Ma++)if(e=rb[Ma],Z=e.length,!(3>Z)){l=e[0][0];h=e[0][1];v.moveTo(l,h);for(g=1;g<Z;++g)l+=e[g][0],h+=e[g][1],v.lineTo(l,h);v.close()}if(N={rings:v.result(!Ya)},!N.rings||0===N.rings.length){Fa=null;break a}}else N=Ga;var t,u,I=[],xa=[];if(Ya){w||(w=new Ab);w.beginPolygon(n,
xa);for(var Na=0,sb=N.rings;Na<sb.length;Na++)if(e=sb[Na],!(3>e.length)){w.beginContour();t=u=0;z?(l=e[0].x,h=e[0].y):(Oa=e[0],l=Oa[0],h=Oa[1]);var tb=[l,h,0];w.addVertex(tb,tb);for(g=1;g<e.length-1;g++){z?(l=e[g].x,h=e[g].y):(Pa=e[g],t=Pa[0],u=Pa[1],l+=t,h+=u);var ub=[l,h,0];w.addVertex(ub,ub)}w.endContour()}w.endPolygon();for(var ya=0;ya<n.length;ya+=2)I.push(a.i1616to32(n[ya],n[ya+1])),I.push.apply(I,Y)}else{for(var J=0,A=0,Qa=void 0,Ra=void 0,Sa=0,vb=N.rings;Sa<vb.length;Sa++){var e=vb[Sa],O=
A;z?(l=e[0].x,h=e[0].y):(Ta=e[0],l=Ta[0],h=Ta[1]);n[A++]=l;n[A++]=h;var za=0;t=u=0;for(g=1;g<e.length;++g)z?(Qa=e[g].x,Ra=e[g].y,t=Qa-l,u=Ra-h,za-=t*(h+h+u),l=Qa,h=Ra):(Ua=e[g],t=Ua[0],u=Ua[1],za-=t*(h+h+u),l+=t,h+=u),n[A++]=l,n[A++]=h;0<za?(0<O-J&&(Xa(I,xa,n,J,O,U,Y),J=O),U.length=0):0>za&&0<O-J?U.push(.5*(O-J)):A=O}0<A-J&&Xa(I,xa,n,J,A,U,Y)}Fa=(n.length=U.length=0,mb.update({geometry:I},I.length/(Y.length+1),xa),mb);break a;var Oa,Pa,Ta,Ua}return Fa;case Ca.WGLGeometryType.LINE:return wb.createLineMeshData(k,
q,c,ea,T,m,f)}return null}});