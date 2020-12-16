//>>built
define(["require","exports","../../../../renderers/support/utils","../graphics/graphicUtils","../../lib/glMatrix"],function(I,m,z,D,A){function k(a){return null!==a&&void 0!==a}function n(a){return"number"==typeof a}function f(a,b){a&&a.push(b);r(b)}function l(a){t&&console.warn("[FastSymbolUpdates] "+a)}function r(a){t&&console.info("[FastSymbolUpdates] "+a)}function h(a,b,c,d,g){var e=a.minSize,B=a.maxSize;if(a.expression)return f(g,"Could not convert size info: expression not supported"),!1;if(a.useSymbolValue)return a=
d.symbolSize[c],b.minSize[c]=a,b.maxSize[c]=a,b.offset[c]=b.minSize[c],b.factor[c]=0,b.type[c]=1,!0;if(k(a.field))return k(a.stops)?2===a.stops.length&&n(a.stops[0].size)&&n(a.stops[1].size)?(C(a.stops[0].size,a.stops[1].size,a.stops[0].value,a.stops[1].value,b,c),b.type[c]=1,!0):(f(g,"Could not convert size info: stops only supported with 2 elements"),!1):n(e)&&n(B)&&k(a.minDataValue)&&k(a.maxDataValue)?(C(e,B,a.minDataValue,a.maxDataValue,b,c),b.type[c]=1,!0):null!=z.meterIn[a.valueUnit]?(b.minSize[c]=
-1/0,b.maxSize[c]=1/0,b.offset[c]=0,b.factor[c]=1/z.meterIn[a.valueUnit],b.type[c]=1,!0):"unknown"===a.valueUnit?(f(g,"Could not convert size info: proportional size not supported"),!1):(f(g,"Could not convert size info: scale-dependent size not supported"),!1);if(!k(a.field)){if(a.stops&&a.stops[0]&&n(a.stops[0].size))return b.minSize[c]=a.stops[0].size,b.maxSize[c]=a.stops[0].size,b.offset[c]=b.minSize[c],b.factor[c]=0,b.type[c]=1,!0;if(n(e))return b.minSize[c]=e,b.maxSize[c]=e,b.offset[c]=e,b.factor[c]=
0,b.type[c]=1,!0}return f(g,"Could not convert size info: unsupported variant of sizeInfo"),!1}function C(a,b,c,d,g,e){d=0<Math.abs(d-c)?(b-a)/(d-c):0;g.minSize[e]=0<d?a:b;g.maxSize[e]=0<d?b:a;g.offset[e]=a-c*d;g.factor[e]=d}function E(a,b,c,d){if(a.normalizationField||a.valueRepresentation)return f(d,"Could not convert size info: unsupported property"),null;var g=a.field;if(null!=g&&"string"!=typeof g)return f(d,"Could not convert size info: field is not a string"),null;if(b.size){if(a.field)if(b.size.field){if(a.field!==
b.size.field)return f(d,"Could not convert size info: multiple fields in use"),null}else b.size.field=a.field}else b.size={field:a.field,minSize:[0,0,0],maxSize:[0,0,0],offset:[0,0,0],factor:[0,0,0],type:[0,0,0]};var e;switch(a.axis){case "width":return e=h(a,b.size,0,c,d),e?b:null;case "height":return e=h(a,b.size,2,c,d),e?b:null;case "depth":return e=h(a,b.size,1,c,d),e?b:null;case "width-and-depth":return e=h(a,b.size,0,c,d),e&&h(a,b.size,1,c,d),e?b:null;case null:case void 0:case "all":return e=
h(a,b.size,0,c,d),e=e&&h(a,b.size,1,c,d),e=e&&h(a,b.size,2,c,d),e?b:null;default:return f(d,'Could not convert size info: unknown axis "'+a.axis+'""'),null}}function F(a,b,c){for(var d=0;3>d;++d){var g=b.unitInMeters;1===a.type[d]&&(g*=b.modelSize[d],a.type[d]=2);a.minSize[d]/=g;a.maxSize[d]/=g;a.offset[d]/=g;a.factor[d]/=g}if(0!==a.type[0])b=0;else if(0!==a.type[1])b=1;else{if(0===a.type[2])return f(c,"No size axis contains a valid size or scale"),!1;b=2}for(d=0;3>d;++d)0===a.type[d]&&(a.minSize[d]=
a.minSize[b],a.maxSize[d]=a.maxSize[b],a.offset[d]=a.offset[b],a.factor[d]=a.factor[b],a.type[d]=a.type[b]);return!0}function q(a,b,c){a[4*b+0]=c.r/255;a[4*b+1]=c.g/255;a[4*b+2]=c.b/255;a[4*b+3]=c.a}function G(a,b,c){if(a.normalizationField)return f(c,"Could not convert color info: unsupported property"),null;if("string"==typeof a.field)if(a.stops){if(8<a.stops.length)return f(c,"Could not convert color info: too many color stops"),null;b.color={field:a.field,values:[0,0,0,0,0,0,0,0],colors:[0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]};a=a.stops;for(c=0;8>c;++c){var d=a[Math.min(c,a.length-1)];b.color.values[c]=d.value;q(b.color.colors,c,d.color)}}else{if(!a.colors)return f(c,"Could not convert color info: missing stops or colors"),null;if(!k(a.minDataValue)||!k(a.maxDataValue))return f(c,"Could not convert color info: missing data values"),null;if(2!==a.colors.length)return f(c,"Could not convert color info: invalid colors array"),null;b.color={field:a.field,values:[0,
0,0,0,0,0,0,0],colors:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]};b.color.values[0]=a.minDataValue;q(b.color.colors,0,a.colors[0]);b.color.values[1]=a.maxDataValue;q(b.color.colors,1,a.colors[1]);for(c=2;8>c;++c)b.color.values[c]=a.maxDataValue,q(b.color.colors,c,a.colors[1])}else{if(!(a.stops&&0<=a.stops.length||a.colors&&0<=a.colors.length))return f(c,"Could not convert color info: no field and no colors/stops"),null;a=a.stops&&0<=a.stops.length?a.stops[0].color:a.colors[0];
b.color={field:null,values:[0,0,0,0,0,0,0,0],colors:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]};for(c=0;8>c;c++)b.color.values[c]=1/0,q(b.color.colors,c,a)}return b}function u(a,b,c,d){a=2===c&&"arithmetic"===a.rotationType;b.offset[c]=a?90:0;b.factor[c]=a?-1:1;b.type[c]=1}function H(a,b,c){if("string"!=typeof a.field)return f(c,"Could not convert rotation info: field is not a string"),null;if(b.rotation){if(a.field)if(b.rotation.field){if(a.field!==b.rotation.field)return f(c,
"Could not convert rotation info: multiple fields in use"),null}else b.rotation.field=a.field}else b.rotation={field:a.field,offset:[0,0,0],factor:[1,1,1],type:[0,0,0]};switch(a.axis){case "tilt":return u(a,b.rotation,0,c),b;case "roll":return u(a,b.rotation,1,c),b;case null:case void 0:case "heading":return u(a,b.rotation,2,c),b;default:return f(c,'Could not convert rotation info: unknown axis "'+a.axis+'""'),null}}function v(a,b,c){if(!a)return null;var d=!b.supportedTypes||!!b.supportedTypes.size,
g=!b.supportedTypes||!!b.supportedTypes.color,e=!b.supportedTypes||!!b.supportedTypes.rotation;t&&(c=c||[]);return(a=a.reduce(function(a,p){if(!a)return a;if(p.valueExpression)return f(c,"Could not convert visual variables: arcade expressions not supported"),null;switch(p.type){case "size":return d?E(p,a,b,c):a;case "color":return g?G(p,a,c):a;case "rotation":return e?H(p,a,c):a;default:return f(c,"Could not convert visual variables: unsupported type "+p.type),null}},{size:null,color:null,rotation:null}))&&
a.size&&!F(a.size,b,c)?null:a}function w(a,b,c){if(!!a!=!!b)return l("State update failed ({$name} enabled/disabled)"),!1;if(a&&a.field!==b.field)return l("State update failed ({$name} field changed)"),!1;if(a&&"rotation"===c)for(c=0;3>c;c++)if(a.type[c]!==b.type[c]||a.offset[c]!==b.offset[c]||a.factor[c]!==b.factor[c])return!1;return!0}function x(a,b){var c={vvSizeEnabled:!1,vvSizeMinSize:null,vvSizeMaxSize:null,vvSizeOffset:null,vvSizeFactor:null,vvSizeValue:null,vvColorEnabled:!1,vvColorValues:null,
vvColorColors:null,vvSymbolAnchor:null,vvSymbolRotation:null},d=a&&null!=a.size;return a&&a.size?(c.vvSizeEnabled=!0,c.vvSizeMinSize=a.size.minSize,c.vvSizeMaxSize=a.size.maxSize,c.vvSizeOffset=a.size.offset,c.vvSizeFactor=a.size.factor):a&&d&&(c.vvSizeValue=b.transformation.scale),a&&d&&(c.vvSymbolAnchor=b.transformation.anchor,c.vvSymbolRotation=b.transformation.rotation),a&&a.color&&(c.vvColorEnabled=!0,c.vvColorValues=a.color.values,c.vvColorColors=a.color.colors),c}Object.defineProperty(m,"__esModule",
{value:!0});var t=!1;m.convertVisualVariables=v;m.initFastSymbolUpdatesState=function(a,b,c){return b?a?a.disableFastUpdates?(l("State not initialized, fast updates disabled (renderer.disableFastUpdates set)"),{enabled:!1}):(a=v(a.visualVariables,c))?(r("State initialized, fast updates enabled"),{enabled:!0,visualVariables:a,materialParameters:x(a,c),customTransformation:a&&null!=a.size}):(l("State not initialized, fast updates disabled (conversion failed)"),{enabled:!1}):(l("State not initialized, fast updates disabled (no renderer)"),
{enabled:!1}):(l("State not initialized, fast updates disabled (no shader support)"),{enabled:!1})};m.updateFastSymbolUpdatesState=function(a,b,c){if(!b||!a.enabled)return!1;var d=a.visualVariables;return(b=v(b.visualVariables,c))?!!(w(d.size,b.size,"size")&&w(d.color,b.color,"color")&&w(d.rotation,b.rotation,"rotation"))&&(a.visualVariables=b,a.materialParameters=x(b,c),a.customTransformation=b&&null!=b.size,r("State updated"),!0):(l("State update failed (conversion failed)"),!1)};m.getMaterialParams=
x;var y;!function(a){var b=A.mat4d,c=A.vec3,d=b.create(),g=c.create();a.evaluateModelTransform=function(a,c,f){if(!a.vvSizeEnabled)return f;if(b.set(f,d),D.computeObjectRotation(a.vvSymbolRotation[2],a.vvSymbolRotation[0],a.vvSymbolRotation[1],d),a.vvSizeEnabled){for(f=0;3>f;++f){var e=a.vvSizeOffset[f]+c[0]*a.vvSizeFactor[f],h=a.vvSizeMinSize[f],k=a.vvSizeMaxSize[f];g[f]=e<h?h:e>k?k:e}b.scale(d,g,d)}else b.scale(d,a.vvSizeValue,d);return b.translate(d,a.vvSymbolAnchor,d),d}}(y||(y={}));m.evaluateModelTransform=
y.evaluateModelTransform});