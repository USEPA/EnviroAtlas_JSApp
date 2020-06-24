//>>built
define("require exports ./DisjointTimerQuery ./Instancing ./isWebGL2Context ./VertexArrayObjects".split(" "),function(r,h,m,n,k,p){function f(a,b,f,l,c){if(l&&k.default(a))return!0;if(b[f])return!1;for(b=0;b<c.length;b++)if(a.getExtension(c[b]))return!0;return!1}Object.defineProperty(h,"__esModule",{value:!0});h.loadCapabilities=function(a,b){b=b&&b.disabledExtensions||{};var h=n.load(a,b),l=p.load(a,b),c;c=b.compressedTextureS3TC?null:(c=a.getExtension("WEBGL_compressed_texture_s3tc"))?{COMPRESSED_RGB_S3TC_DXT1:c.COMPRESSED_RGB_S3TC_DXT1_EXT,
COMPRESSED_RGBA_S3TC_DXT1:c.COMPRESSED_RGBA_S3TC_DXT1_EXT,COMPRESSED_RGBA_S3TC_DXT3:c.COMPRESSED_RGBA_S3TC_DXT3_EXT,COMPRESSED_RGBA_S3TC_DXT5:c.COMPRESSED_RGBA_S3TC_DXT5_EXT}:null;var g;g=b.textureFilterAnisotropic?null:(g=a.getExtension("EXT_texture_filter_anisotropic")||a.getExtension("MOZ_EXT_texture_filter_anisotropic")||a.getExtension("WEBKIT_EXT_texture_filter_anisotropic"))?{MAX_TEXTURE_MAX_ANISOTROPY:g.MAX_TEXTURE_MAX_ANISOTROPY_EXT,TEXTURE_MAX_ANISOTROPY:g.TEXTURE_MAX_ANISOTROPY_EXT}:null;
var q=m.load(a,b),e;if(k.default(a))e=!b.colorBufferFloat&&a.getExtension("EXT_color_buffer_float")?{R16F:a.R16F,RG16F:a.RG16F,RGBA16F:a.RGBA16F,R32F:a.R32F,RG32F:a.RG32F,RGBA32F:a.RGBA32F,R11F_G11F_B10F:a.R11F_G11F_B10F}:null;else if(a instanceof WebGLRenderingContext){e=!b.colorBufferFloat&&a.getExtension("EXT_color_buffer_half_float");var d=!b.colorBufferFloat&&a.getExtension("WEBGL_color_buffer_float");e=e||d?{RGBA16F:e?e.RGBA16F_EXT:void 0,RGBA32F:d?d.RGBA32F_EXT:void 0}:null}else e=void 0;d=
k.default(a)?{MIN:a.MIN,MAX:a.MAX}:b.blendMinMax?null:(d=a.getExtension("EXT_blend_minmax"))?{MIN:d.MIN_EXT,MAX:d.MAX_EXT}:null;return{instancing:h,vao:l,compressedTextureS3TC:c,textureFilterAnisotropic:g,disjointTimerQuery:q,colorBufferFloat:e,blendMinMax:d,depthTexture:f(a,b,"depthTexture",!0,["WEBGL_depth_texture","MOZ_WEBGL_depth_texture","WEBKIT_WEBGL_depth_texture"]),standardDerivatives:f(a,b,"standardDerivatives",!0,["OES_standard_derivatives"]),shaderTextureLOD:f(a,b,"shaderTextureLOD",!0,
["EXT_shader_texture_lod"]),textureFloatLinear:f(a,b,"textureFloatLinear",!1,["OES_texture_float_linear"]),fragDepth:f(a,b,"fragDepth",!0,["EXT_frag_depth"])}}});