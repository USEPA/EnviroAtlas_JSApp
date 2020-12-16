//>>built
define("require exports ../../../../core/screenUtils ./color ./LineTess ./MeshData ./number ./TileClipper ./Utils ./visualVariablesUtils".split(" "),function(ha,X,ba,ca,a,da,L,ea,fa,ga){function Y(x,f,g,M,y){"butt"===y?p.buttCap(x,f,g):"round"===y?p.roundCap(x,f,g,M,a.getNumberOfSlices(Math.PI),M===a.CapPosition.START?-1:1):"square"===y?p.squareCap(x,f,g,M):(p.buttCap(x,f,g),console.error("Unknown cap type!"))}function U(a,f,g,p,y,z,G,c,I,h,E,H){var q,m=0;for(q=0;q<E.vectors.count;++q){var x=E.vectors.items[q].vector[0],
B=E.vectors.items[q].vector[1],u=E.vectors.items[q].texCoords[0],t=E.vectors.items[q].texCoords[1],n=E.vectors.items[q].direction[0],r=E.vectors.items[q].direction[1],e=I+m;++m;H.push(L.i1616to32(a,f),G,p,L.i8888to32(Math.round(C*x),Math.round(C*B),Math.round(C*u),Math.round(C*t)),L.i1616to32(g,C*c),L.i1616to32(y[0],y[1]),L.i1616to32(z[0],z[1]),L.i8888to32(Math.round(C*n),Math.round(C*r),0,0));h&&H.push(h.size,h.color,h.opacity);E.vectors.items[q].base={index:e,point:[a,f]}}return m}function Z(a,
f,g){p.bridge(R,a,f);for(a=0;a<R.count;++a)f=R.items[a],g.push(f.v1.base.index,f.v2.base.index,f.v3.base.index)}Object.defineProperty(X,"__esModule",{value:!0});var p=new a.Tessellator({distanceAlongCorrection:!0}),S=new Float32Array(1),V=new Uint32Array(S.buffer),T=[a.allocExtrudeVectors(),a.allocExtrudeVectors()],aa=a.allocExtrudeVectors(),R=a.allocTriangles(20),W=a.allocTriangles(20),C=31,O=new ea.TileClipper(0,0,0,1,8);O.setExtent(512);X.createLineMeshData=function(x,f,g,M,y,z,G){var c=null!=
M?M.spriteMosaicItem:null,I=z.geometry,h=!fa.isPictureSymbol(G)&&G.color?ca.copyAndPremultiply(G.color):[255,255,255,1];M=L.numTo32(x);y=Math.round(y*ba.pt2px(0<G.width?.5*(G.width+1/y):0));G=null!=c;var E=g.vvColor||g.vvOpacity||g.vvSizeMinMaxValue||g.vvSizeScaleStops||g.vvSizeFieldStops||g.vvSizeUnitValue,H=0,q=0,m=0;E&&(m=f.vvFields,H=m.opacity?f.getValue(z,m.opacity):0,q=m.color?f.getValue(z,m.color):0,m=m.size&&!g.vvSizeScaleStops?f.getValue(z,m.size):0,g.vvSizeUnitValue&&(m=ga.getVisualVariableSizeValueRepresentationRatio(m,
f.vvRanges.size.unitValue.valueRepresentation)),(null===m||isNaN(m))&&(m=NaN),(null===q||isNaN(q))&&(q=NaN),(null===H||isNaN(H))&&(H=NaN),S[0]=m,m=V[0],S[0]=H,H=V[0],S[0]=q,q=V[0]);f=L.i8888to32(h[0],h[1],h[2],h[3]);g=[0,0];z=[0,0];if(c){var h=c.rect.x,J=c.rect.y,B=c.width,c=c.height;g[0]=h+1;g[1]=J+1;z[0]=h+1+B;z[1]=J+1+c}for(var h=I.rings||I.paths,I=[],J=h.length,B=0,u=!1;B<J;){var t=h[B],c=[];O.reset(2);var n=t[0][0],r=t[0][1];if(u)O.moveTo(n,r);else{if(-8>n||520<n||-8>r||520<r){u=!0;continue}c.push({x:n,
y:r})}for(var e=!1,N=t.length,v=1;v<N;++v)if(n+=t[v][0],r+=t[v][1],u)O.lineTo(n,r);else{if(-8>n||520<n||-8>r||520<r){e=!0;break}c.push({x:n,y:r})}if(e)u=!0;else{if(u){if(u=O.resultWithStarts())for(c=0;c<u.length;c++)I.push(u[c])}else I.push({line:c,start:0});B++;u=!1}}h=0;J=[];B=[];for(u=0;u<I.length;u++)if(t=I[u],c=t.line,r=t.start,!(2>c.length))for(var t=c.length,e=c[0],N=c[t-1],n=N.x-e.x,e=N.y-e.y,n=1E-6>n*n+e*e,K=r%65535,r=T[1],e=void 0,N=E?{size:m,color:q,opacity:H}:null,e=0;e<t;++e){var F=c[e],
v=r===T[e%2]?T[(e+1)%2]:T[e%2];if(e<t-1||!n||G){a:{var k=v,l=e,A=c,w=t,C=n,D=A[l],b=[void 0,void 0],d=[void 0,void 0];if(0<l&&l<w-1){var P=A[(l+w-1)%w],Q=A[(l+1)%w];a.normalize(b,[D.x-P.x,D.y-P.y]);a.normalize(d,[Q.x-D.x,Q.y-D.y])}else if(0===l)Q=A[(l+1)%w],(a.normalize(d,[Q.x-D.x,Q.y-D.y]),C)?(A=A[w-2],a.normalize(b,[D.x-A.x,D.y-A.y])):b=d;else{if(l!==w-1){console.error("Vertex index 'i' out of range.");break a}P=A[(l+w-1)%w];(a.normalize(b,[D.x-P.x,D.y-P.y]),C)?(A=A[1],a.normalize(d,[A.x-D.x,A.y-
D.y])):d=b}C||0!==l?C||l!==w-1?(l=a.getRads(b,d),l>Math.PI-.05?p.rectJoin(k,b,d):.1>l?.05>l?p.fastMiterJoin(k,b,d):l<a.MITER_SAFE_RADS?p.miterJoin(k,b,d):p.bevelJoin(k,b,d,a.SYSTEM_MAG_LIMIT):(w=a.getNumberOfSlices(l),2.3>l?2>w||.5>l?p.bevelJoin(k,b,d,1):p.roundJoin(k,b,d,w):p.unitRoundJoin(k,b,d,w))):Y(k,b,d,a.CapPosition.END,"round"):Y(k,b,d,a.CapPosition.START,"round")}h+=U(F.x,F.y,K,f,g,z,M,y,h,N,v,J);if(v.capCenter&&(!n||e!==t-1))for(d=B,p.pie(W,v),b=void 0,b=0;b<W.count;++b)k=W.items[b],d.push(k.v1.base.index,
k.v2.base.index,k.v3.base.index);n&&0===e&&!G&&a.copyExtrudeVectors(aa,v)}else a.copyExtrudeVectors(v,aa);if(0<e&&Z(r,v,B),e<t-1)b=c[e+1],d=[b.x-F.x,b.y-F.y],k=a.length(d),d=[d[0]/k,d[1]/k],k=K+k,65535<k?(l=(65535-K)/(k-K),K=F.x+(b.x-F.x)*l,F=F.y+(b.y-F.y)*l,b=r,p.buttCap(b,d,d),h+=U(K,F,65535,f,g,z,x,y,h,N,b,J),p.bridge(R,v,b),Z(v,b,B),p.buttCap(b,d,d),h+=U(K,F,0,f,g,z,x,y,h,N,b,J),K=k-65535):(K=k,r=v)}x=new da;return x.update({geometry:J},h,B),x}});