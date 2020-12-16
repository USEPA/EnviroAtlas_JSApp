//>>built
require({cache:{"url:esri/layers/vectorTiles/views/2d/engine/webgl/shaders/iconShaders.xml":'\x3c?xml version\x3d"1.0" encoding\x3d"UTF-8"?\x3e\n\x3c!--\n  Add your GLSL snippets to this file. You should start from\n  importing your old GLSL files. For instance, if you have a\n  file such as myShader.vs.glsl you should create a new \x3csnippet name\x3d"myShaderVS"\x3e\n  and then copy and paste the GLSL source as the content. You will then convert your\n  code to use the {@link esri/views/2d/engine/webgl/glShaderSnippets glShaderSnippets}\n  instance to access the GLSL code, instead of importing it directly with require("dojo/text!...").\n--\x3e\n\x3csnippets\x3e\n\n  \x3csnippet name\x3d"rgba2float"\x3e\x3c![CDATA[\n    // TODO consider moving this snippet into a util.xml file\n\n    // Factors to convert rgba back to float\n    const vec4 rgba2float_factors \x3d vec4(\n        255.0 / (256.0),\n        255.0 / (256.0 * 256.0),\n        255.0 / (256.0 * 256.0 * 256.0),\n        255.0 / (256.0 * 256.0 * 256.0 * 256.0)\n      );\n\n    float rgba2float(vec4 rgba) {\n      // Convert components from 0-\x3e1 back to 0-\x3e255 and then\n      // add the components together with their corresponding\n      // fixed point factors, i.e. (256^1, 256^2, 256^3, 256^4)\n      return dot(rgba, rgba2float_factors);\n    }\n  ]]\x3e\x3c/snippet\x3e\n\n  \x3csnippet name\x3d"iconVVUniformsVS"\x3e\n    \x3c![CDATA[\n  #if defined(VV_COLOR) || defined(VV_SIZE_MIN_MAX_VALUE) || defined(VV_SIZE_SCALE_STOPS) || defined(VV_SIZE_FIELD_STOPS) || defined(VV_SIZE_UNIT_VALUE) || defined(VV_OPACITY) || defined(VV_ROTATION)\n    attribute vec4 a_vv;\n  #endif // VV_COLOR || VV_SIZE_MIN_MAX_VALUE || VV_SIZE_SCALE_STOPS || VV_SIZE_FIELD_STOPS || VV_SIZE_UNIT_VALUE || VV_OPACITY || VV_ROTATION\n\n  #ifdef VV_COLOR\n    uniform float u_vvColorValues[8];\n    uniform vec4 u_vvColors[8];\n  #endif // VV_COLOR\n\n  #ifdef VV_SIZE_MIN_MAX_VALUE\n    uniform vec4 u_vvSizeMinMaxValue;\n  #endif // VV_SIZE_MIN_MAX_VALUE\n\n  #ifdef VV_SIZE_SCALE_STOPS\n    uniform float u_vvSizeScaleStopsValue;\n  #endif // VV_SIZE_SCALE_STOPS\n\n  #ifdef VV_SIZE_FIELD_STOPS\n    uniform float u_vvSizeFieldStopsValues[6];\n    uniform float u_vvSizeFieldStopsSizes[6];\n  #endif // VV_SIZE_FIELD_STOPS\n\n  #ifdef VV_SIZE_UNIT_VALUE\n    uniform float u_vvSizeUnitValueWorldToPixelsRatio;\n  #endif // VV_SIZE_UNIT_VALUE\n\n  #ifdef VV_OPACITY\n    uniform float u_vvOpacityValues[8];\n    uniform float u_vvOpacities[8];\n  #endif // VV_OPACITY\n\n  #ifdef VV_ROTATION\n    uniform lowp float u_vvRotationType;\n  #endif // VV_ROTATION\n\n    ]]\x3e\n  \x3c/snippet\x3e\n\n  \x3csnippet name\x3d"iconVVFunctions"\x3e\n    \x3c![CDATA[\n    bool isNan(float val) {\n      return !( val \x3c 0.0 || 0.0 \x3c val || val \x3d\x3d 0.0 );\n    }\n\n  #ifdef VV_SIZE_MIN_MAX_VALUE\n    float getVVMinMaxSize(float sizeValue, float fallback) {\n      if (isNan(sizeValue)) {\n        return fallback;\n      }\n\n      // we need to multiply by 8 in order to translate to tile coordinates\n      float interpolationRatio \x3d (sizeValue  - u_vvSizeMinMaxValue.x) / (u_vvSizeMinMaxValue.y - u_vvSizeMinMaxValue.x);\n      interpolationRatio \x3d clamp(interpolationRatio, 0.0, 1.0);\n      return u_vvSizeMinMaxValue.z + interpolationRatio * (u_vvSizeMinMaxValue.w - u_vvSizeMinMaxValue.z);\n    }\n  #endif // VV_SIZE_MIN_MAX_VALUE\n\n  #ifdef VV_SIZE_FIELD_STOPS\n    const int VV_SIZE_N \x3d 6;\n    float getVVStopsSize(float sizeValue, float fallback) {\n      if (isNan(sizeValue)) {\n        return fallback;\n      }\n\n      if (sizeValue \x3c\x3d u_vvSizeFieldStopsValues[0]) {\n        return u_vvSizeFieldStopsSizes[0];\n      }\n\n      for (int i \x3d 1; i \x3c VV_SIZE_N; ++i) {\n        if (u_vvSizeFieldStopsValues[i] \x3e\x3d sizeValue) {\n          float f \x3d (sizeValue - u_vvSizeFieldStopsValues[i-1]) / (u_vvSizeFieldStopsValues[i] - u_vvSizeFieldStopsValues[i-1]);\n          return mix(u_vvSizeFieldStopsSizes[i-1], u_vvSizeFieldStopsSizes[i], f);\n        }\n      }\n\n      return u_vvSizeFieldStopsSizes[VV_SIZE_N - 1];\n    }\n  #endif // VV_SIZE_FIELD_STOPS\n\n  #ifdef VV_SIZE_UNIT_VALUE\n    float getVVUnitValue(float sizeValue, float fallback) {\n      if (isNan(sizeValue)) {\n        return fallback;\n      }\n\n      return u_vvSizeUnitValueWorldToPixelsRatio * sizeValue;\n    }\n  #endif // VV_SIZE_UNIT_VALUE\n\n  #ifdef VV_OPACITY\n    const int VV_OPACITY_N \x3d 8;\n    float getVVOpacity(float opacityValue) {\n      if (isNan(opacityValue)) {\n        return 1.0;\n      }\n\n      if (opacityValue \x3c\x3d u_vvOpacityValues[0]) {\n        return u_vvOpacities[0];\n      }\n\n      for (int i \x3d 1; i \x3c VV_OPACITY_N; ++i) {\n        if (u_vvOpacityValues[i] \x3e\x3d opacityValue) {\n          float f \x3d (opacityValue - u_vvOpacityValues[i-1]) / (u_vvOpacityValues[i] - u_vvOpacityValues[i-1]);\n          return mix(u_vvOpacities[i-1], u_vvOpacities[i], f);\n        }\n      }\n\n      return u_vvOpacities[VV_OPACITY_N - 1];\n    }\n  #endif // VV_OPACITY\n\n  #ifdef VV_ROTATION\n    mat4 getVVRotation(float rotationValue) {\n      // YF TODO: if the symbol has rotation we need to combine the symbo\'s rotation with the VV one\n      if (isNan(rotationValue)) {\n        return mat4(1, 0, 0, 0,\n                    0, 1, 0, 0,\n                    0, 0, 1, 0,\n                    0, 0, 0, 1);\n      }\n\n      float rotation \x3d rotationValue;\n      if (u_vvRotationType \x3d\x3d 1.0) {\n        rotation \x3d 90.0 - rotation;\n      }\n\n      float angle \x3d C_DEG_TO_RAD * rotation;\n\n      float sinA \x3d sin(angle);\n      float cosA \x3d cos(angle);\n\n      return mat4(cosA, sinA, 0, 0,\n                  -sinA,  cosA, 0, 0,\n                  0,     0, 1, 0,\n                  0,     0, 0, 1);\n    }\n  #endif // VV_ROTATION\n\n  #ifdef VV_COLOR\n    const int VV_COLOR_N \x3d 8;\n\n    vec4 getVVColor(float colorValue, vec4 fallback) {\n      if (isNan(colorValue)) {\n        return fallback;\n      }\n\n      if (colorValue \x3c\x3d u_vvColorValues[0]) {\n        return u_vvColors[0];\n      }\n\n      for (int i \x3d 1; i \x3c VV_COLOR_N; ++i) {\n        if (u_vvColorValues[i] \x3e\x3d colorValue) {\n          float f \x3d (colorValue - u_vvColorValues[i-1]) / (u_vvColorValues[i] - u_vvColorValues[i-1]);\n          return mix(u_vvColors[i-1], u_vvColors[i], f);\n        }\n      }\n\n      return u_vvColors[VV_COLOR_N - 1];\n    }\n  #endif // VV_COLOR\n    ]]\x3e\n  \x3c/snippet\x3e\n\n\n  \x3csnippet name\x3d"iconVS"\x3e\n  \x3c![CDATA[\n    precision mediump float;\n\n    //const float C_256_TO_RAD \x3d 3.14159265359 / 128.0;\n    const float C_DEG_TO_RAD \x3d 3.14159265359 / 180.0;\n\n    // per quad (instance) attributes (20 bytes \x3d\x3d\x3e equivalent of 5 bytes per vertex)\n    attribute vec2 a_pos;\n    attribute vec4 a_vertexOffsetAndTex;\n    attribute vec4 a_id; // since we need to render the Id as a color we need to break it into RGBA components. so just like a color, the Id is normalized.\n    attribute vec4 a_color;\n    attribute vec4 a_outlineColor;\n    attribute vec4 a_sizeAndOutlineWidth;\n\n    // the relative transformation of a vertex given in tile coordinates to a relative normalized coordinate\n    // relative to the tile\'s upper left corner\n    // the extrusion vector.\n    uniform highp mat4 u_transformMatrix;\n    // the extrude matrix which is responsible for the \'anti-zoom\' as well as the rotation\n    uniform highp mat4 u_extrudeMatrix;\n    // u_normalized_origin is the tile\'s upper left corner given in normalized coordinates\n    uniform highp vec2 u_normalized_origin;\n\n    // the size of the mosaic given in pixels\n    uniform vec2 u_mosaicSize;\n\n    // the opacity of the layer given by the painter\n    uniform mediump float u_opacity;\n\n    // the interpolated texture coordinate value to be used by the fragment shader in order to sample the sprite texture\n    varying mediump vec2 v_tex;\n    // the calculated transparency to be applied by the fragment shader. It is incorporating both the fade as well as the\n    // opacity of the layer given by the painter\n    varying lowp float v_transparency;\n    // the of the icon given in pixels\n    varying mediump vec2 v_size;\n\n    // icon color. If is a picture-marker it is used to tint the texture color\n    varying lowp vec4 v_color;\n\n #ifdef SDF\n    varying lowp vec4 v_outlineColor;\n    varying mediump float v_outlineWidth;\n #endif // SDF\n\n #ifdef ID\n    varying highp vec4 v_id;\n #endif // ID\n\n #ifdef HEATMAP\n    attribute float a_heatmapWeight;\n    varying mediump float v_heatmapWeight;\n #endif // HEATMAP\n\n    // import the VV inputs and functions (they are #ifdefed, so if the proper #define is not set it will end-up being a no-op)\n    $iconVVUniformsVS\n    $iconVVFunctions\n\n    void main()\n    {\n      vec2 a_offset \x3d a_vertexOffsetAndTex.xy;\n      vec2 a_tex \x3d a_vertexOffsetAndTex.zw;\n      vec2 a_size \x3d a_sizeAndOutlineWidth.xy;\n\n      // default values (we need them for the variations to come)\n      float a_angle \x3d 0.0;\n      float delta_z \x3d 0.0;\n      float depth \x3d 0.0;\n      v_transparency \x3d 1.0;\n\n  #if defined(VV_SIZE_MIN_MAX_VALUE) || defined(VV_SIZE_SCALE_STOPS) || defined(VV_SIZE_FIELD_STOPS) || defined(VV_SIZE_UNIT_VALUE)\n\n  #ifdef VV_SIZE_MIN_MAX_VALUE\n      // vv size override the original symbol\'s size\n      float h \x3d getVVMinMaxSize(a_vv.x, a_size.y);\n  #endif // VV_SIZE_MIN_MAX_VALUE\n\n  #ifdef VV_SIZE_SCALE_STOPS\n      float h \x3d u_vvSizeScaleStopsValue;\n  #endif // VV_SIZE_SCALE_STOPS\n\n  #ifdef VV_SIZE_FIELD_STOPS\n      float h \x3d getVVStopsSize(a_vv.x, a_size.y);\n  #endif // VV_SIZE_FIELD_STOPS\n\n  #ifdef VV_SIZE_UNIT_VALUE\n      float h \x3d getVVUnitValue(a_vv.x, a_size.y);\n  #endif // VV_SIZE_UNIT_VALUE\n\n      // make sure to preserve the aspect ratio of the symbol\n      vec2 size \x3d vec2(h * a_size.x / a_size.y, h);\n      vec2 offset \x3d a_offset * size / a_size;\n      v_size \x3d size;\n  #else\n  #ifdef HEATMAP\n      // reconstruct the kernel size\n      a_size \x3d 9.0 * a_size + 1.0;\n  #endif // HEATMAP\n\n      vec2 offset \x3d a_offset;\n      v_size \x3d a_size;\n  #endif // defined(VV_SIZE_MIN_MAX_VALUE) || defined(VV_SIZE_SCALE_STOPS) || defined(VV_SIZE_FIELD_STOPS) || defined(VV_SIZE_UNIT_VALUE)\n\n  #ifdef SDF\n    offset *\x3d 2.0;\n  #endif // SDF\n\n  #ifdef VV_ROTATION\n      gl_Position \x3d vec4(u_normalized_origin, depth, 0.0) + u_transformMatrix * vec4(a_pos, 0.0, 1.0) + u_extrudeMatrix * getVVRotation(a_vv.w) * vec4(offset, delta_z, 0.0);\n  #else\n      gl_Position \x3d vec4(u_normalized_origin, depth, 0.0) + u_transformMatrix * vec4(a_pos, 0.0, 1.0) + u_extrudeMatrix * vec4(offset, delta_z, 0.0);\n  #endif // VV_ROTATION\n\n  #ifdef VV_OPACITY\n      v_transparency \x3d getVVOpacity(a_vv.z);\n  #else\n      v_transparency \x3d u_opacity;\n  #endif // VV_OPACITY\n\n  #ifdef VV_COLOR\n      v_color \x3d getVVColor(a_vv.y, a_color);\n  #else\n      v_color \x3d a_color;\n  #endif // VV_COLOR\n\n      // output the texture coordinates and the transparency\n      v_tex \x3d a_tex / u_mosaicSize;\n\n #ifdef SDF\n      v_outlineColor \x3d a_outlineColor;\n      v_outlineWidth \x3d a_sizeAndOutlineWidth.z;\n #endif // SDF\n\n #ifdef ID\n      v_id \x3d a_id;\n #endif // ID\n\n #ifdef HEATMAP\n    v_heatmapWeight \x3d a_heatmapWeight;\n #endif // HEATMAP\n    }\n  ]]\x3e\n  \x3c/snippet\x3e\n\n  \x3csnippet name\x3d"iconFS"\x3e\n   \x3c![CDATA[\n    precision mediump float;\n\n    uniform lowp sampler2D u_texture;\n\n    varying lowp vec2 v_tex;\n    varying lowp float v_transparency;\n    varying mediump vec2 v_size;\n    varying lowp vec4 v_color;\n\n #ifdef SDF\n    varying lowp vec4 v_outlineColor;\n    varying mediump float v_outlineWidth;\n\n    // we need the conversion function from RGBA to float\n    $rgba2float\n #endif // SDF\n\n #ifdef ID\n    varying highp vec4 v_id;\n #endif // ID\n\n #ifdef HEATMAP\n    varying mediump float v_heatmapWeight;\n #endif // HEATMAP\n\n    const float softEdgeRatio \x3d 1.0; // use blur here if needed\n\n    void main()\n    {\n #ifdef SDF\n      lowp vec4 fillPixelColor \x3d v_color;\n\n      // calculate the distance from the edge [-0.5, 0.5]\n      float d \x3d 0.5 - rgba2float(texture2D(u_texture, v_tex));\n\n      // the soft edge ratio is about 1.5 pixels allocated for the soft edge.\n      float size \x3d max(v_size.x, v_size.y);\n      float dist \x3d d * size * softEdgeRatio;\n\n      // set the fragment\'s transparency according to the distance from the edge\n      fillPixelColor *\x3d clamp(0.5 - dist, 0.0, 1.0);\n\n      // count for the outline\n      // therefore tint the entire icon area.\n      if (v_outlineWidth \x3e 0.25) {\n        lowp vec4 outlinePixelColor \x3d v_outlineColor;\n\n        // outlines can\'t be larger than the size of the symbol\n        float clampedOutlineSize \x3d min(v_outlineWidth, size);\n\n        outlinePixelColor *\x3d clamp(0.5 - abs(dist) + clampedOutlineSize * 0.5, 0.0, 1.0);\n\n        // finally combine the outline and the fill colors (outline draws on top of fill)\n        gl_FragColor \x3d v_transparency * ((1.0 - outlinePixelColor.a) * fillPixelColor + outlinePixelColor);\n      }\n      else {\n        gl_FragColor \x3d v_transparency * fillPixelColor;\n      }\n #else // not an SDF\n      lowp vec4 texColor \x3d texture2D(u_texture, v_tex);\n\n #ifdef HEATMAP\n      texColor.r *\x3d v_heatmapWeight;\n #endif // HEATMAP\n\n      gl_FragColor \x3d v_transparency * texColor;\n #endif // SDF\n\n #ifdef HIGHLIGHT\n      gl_FragColor.a \x3d step(1.0 / 255.0, gl_FragColor.a);\n #endif // HIGHLIGHT\n\n #ifdef ID\n      if (gl_FragColor.a \x3c 1.0 / 255.0) {\n        discard;\n      }\n      gl_FragColor \x3d v_id;\n #endif // ID\n    }\n   ]]\x3e\n  \x3c/snippet\x3e\n\x3c/snippets\x3e\n\n'}});
define(["require","exports","dojo/text!./iconShaders.xml","../../../../webgl/ShaderSnippets"],function(a,d,c,b){a=new b;return b.parse(c,a),a});