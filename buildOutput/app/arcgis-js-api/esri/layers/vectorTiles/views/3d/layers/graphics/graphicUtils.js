//>>built
define("require exports ../../../../geometry ../../../../geometry/support/aaBoundingBox ../../../../geometry/support/aaBoundingRect ../../../../geometry/support/centroid ../../../../geometry/support/coordsUtils ../../../../geometry/support/webMercatorUtils ../../../../layers/graphics/dehydratedFeatures ../../lib/glMatrix ../../support/mathUtils".split(" "),function(B,e,q,r,x,y,t,u,m,n,z){function v(a){var b=a.paths[0];if(!b||0===b.length)return null;b=t.getPointOnPath(b,t.getPathLength(b)/2);return m.makeDehydratedPoint(b[0],
b[1],b[2],a.spatialReference)}function w(a){if(Array.isArray(a)){for(var b=0;b<a.length;b++)if(!w(a[b]))return!1;return!0}return null==a||0<=a}Object.defineProperty(e,"__esModule",{value:!0});var A=[1,1,1];e.computeCentroid=function(a){if("point"===a.type)return a;if(m.isHydratedGeometry(a))switch(a.type){case "extent":return a.center;case "polygon":return a.centroid;case "polyline":return v(a);case "mesh":return a.extent.center}else switch(a.type){case "extent":var b=z.isFinite(a.zmin);return m.makeDehydratedPoint(.5*
(a.xmax+a.xmin),.5*(a.ymax+a.ymin),b?.5*(a.zmax+a.zmin):void 0,a.spatialReference);case "polygon":return b=y.ringsCentroid(a.rings,m.hasZ(a)),m.makeDehydratedPoint(b[0],b[1],b[2],a.spatialReference);case "polyline":return v(a)}};e.convertPointSR=function(a,b){var c=a.spatialReference;c.isWebMercator&&b.isWGS84?(u.xyToLngLat(a.x,a.y,k),a.x=k[0],a.y=k[1],a.spatialReference=q.SpatialReference.WGS84):b.isWebMercator&&c.isWGS84&&(u.lngLatToXY(a.x,a.y,k),a.x=k[0],a.y=k[1],a.spatialReference=q.SpatialReference.WebMercator)};
e.enlargeExtent=function(a,b,c){if(a){b||(b=x.create());var d=.5*a.width*(c-1);c=.5*a.height*(c-1);return a.width<1E-7*a.height?d+=c/20:a.height<1E-7*a.width&&(c+=d/20),n.vec4d.set4(a.xmin-d,a.ymin-c,a.xmax+d,a.ymax+c,b),b}return null};e.updateVertexAttributeAuxpos1w=function(a,b){for(var c=0;c<a.geometries.length;++c){var d=a.geometries[c].data.vertexAttributes.auxpos1;d&&d.data[3]!==b&&(d.data[3]=b,a.geometryVertexAttrsUpdated(c))}};e.mixinColorAndOpacity=function(a,b){var c=[1,1,1,1];return null!=
a&&(c[0]=a[0],c[1]=a[1],c[2]=a[2]),null!==b&&void 0!==b?c[3]=b:null!=a&&3<a.length&&(c[3]=a[3]),c};e.overrideColor=function(a,b,c,d,f,l){void 0===l&&(l=[0,0,0,0]);for(var h=0;3>h;++h)a&&null!=a[h]?l[h]=a[h]:c&&null!=c[h]?l[h]=c[h]:l[h]=f[h];return l[3]=null!=b?b:null!=d?d:f[3],l};e.computeObjectScale=function(a,b,c,d){void 0===a&&(a=A);void 0===d&&(d=1);var f=Array(3);if(null==b||null==c)f[0]=1,f[1]=1,f[2]=1;else{for(var l=void 0,h=0,g=2;0<=g;g--){var e=a[g],k=void 0,m=null!=e,n=0===g&&!l&&!m,p=c[g];
"symbolValue"===e||n?k=0!==p?b[g]/p:1:m&&"proportional"!==e&&isFinite(e)&&(k=0!==p?e/p:1);null!=k&&(f[g]=k,l=k,h=Math.max(h,Math.abs(k)))}for(g=2;0<=g;g--)null==f[g]?f[g]=l:0===f[g]&&(f[g]=.001*h)}for(g=2;0<=g;g--)f[g]/=d;return f};e.computeSizeWithResourceSize=function(a,b){var c=b.width,d=b.depth,f=b.height;b=b.isPrimitive?10:1;if(null==c&&null==f&&null==d)return[b*a[0],b*a[1],b*a[2]];for(var e,c=[c,d,f],d=0;3>d;d++)if(f=c[d],null!=f){e=f/a[d];break}for(d=0;3>d;d++)null==c[d]&&(c[d]=a[d]*e);return c};
e.validateSymbolLayerSize=function(a){return null!=a.isPrimitive&&(a=[a.width,a.depth,a.height]),w(a)?null:"Symbol sizes may not be negative values"};e.computeObjectRotation=function(a,b,c,d){void 0===d&&(d=n.mat4d.identity());a=a||0;b=b||0;c=c||0;return 0!==a&&n.mat4d.rotateZ(d,-a/180*Math.PI,d),0!==b&&n.mat4d.rotateX(d,b/180*Math.PI,d),0!==c&&n.mat4d.rotateY(d,c/180*Math.PI,d),d};e.demResolutionForBoundingBox=function(a,b){return null!=b.minDemResolution?b.minDemResolution:r.isPoint(a)?b.minDemResolutionForPoints:
.01*r.maximumDimension(a)};var k=[0,0]});