//>>built
define(["require","exports","./number"],function(h,c,f){function g(a,b){return Array.isArray(b)?(a[0]=b[0],a[1]=b[1],a[2]=b[2],a[3]=b[3]):(a[0]=b.r,a[1]=b.g,a[2]=b.b,a[3]=b.a),a}function e(a,b,c){void 0===b&&(b=0);void 0===c&&(c=!1);var d=a[b+3];return a[b+0]*=d,a[b+1]*=d,a[b+2]*=d,c||(a[b+3]*=255),a}Object.defineProperty(c,"__esModule",{value:!0});c.white=[255,255,255,1];var d=[0,0,0,0];c.premultiplyAlpha=e;c.copyAndPremultiply=function(a){return e(g([],a))};c.premultiplyAlphaUint32=function(a){return e(g(d,
a)),f.i8888to32(d[0],d[1],d[2],d[3])};c.premultiplyAlphaRGBA=function(a){var b=a.a;return f.i8888to32(a.r*b,a.g*b,a.b*b,255*b)}});