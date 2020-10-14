///////////////////////////////////////////////////////////////////////////
// Copyright © Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////

define([
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/_base/html',
    'dojo/_base/sniff',
    'dojo/_base/config',
    'dojo/io-query',
    'dojo/query',
    'dojo/NodeList-traverse',
    'dojo/Deferred',
    'dojo/promise/all',
    'dojo/on',
    'dojo/json',
    'dojo/cookie',
    'dojo/number',
    'dojo/date/locale',
    'dojo/i18n!dojo/cldr/nls/number',
    'dojox/encoding/base64',
    'esri/lang',
    'moment/moment',
    'esri/arcgis/utils',
    'esri/dijit/PopupTemplate',
    'esri/SpatialReference',
    'esri/geometry/Extent',
    'esri/geometry/geometryEngine',
    'esri/geometry/Multipoint',
    'esri/geometry/Polyline',
    'esri/geometry/Polygon',
    'esri/geometry/webMercatorUtils',
    'esri/tasks/GeometryService',
    'esri/tasks/ProjectParameters',
    'esri/tasks/FeatureSet',
    'esri/symbols/PictureMarkerSymbol',
    'esri/urlUtils',
    'esri/request',
    'esri/tasks/query',
    'esri/tasks/QueryTask',
    'esri/graphicsUtils',
    'esri/IdentityManager',
    'esri/arcgis/OAuthInfo',
    'jimu/portalUrlUtils',
    './shared/utils',
    './accessibleUtils',
    './zoomToUtils',
    'dijit/TooltipDialog',
    'dijit/popup',
    'dijit/registry',
    'dojo/dom',
    'widgets/Demo/help/help_Welcome',
    'widgets/Demo/help/help_Elevation1',
    'widgets/Demo/help/help_Elevation2',
    'widgets/Demo/help/help_FeaturedCollections1',
    'widgets/Demo/help/help_FeaturedCollections2',
    'widgets/Demo/help/help_Demographic1',
    'widgets/Demo/help/help_Demographic2',
    'widgets/Demo/help/help_EnviroAtlasDataSearch1',
    'widgets/Demo/help/help_EnviroAtlasDataSearch2',
    'widgets/Demo/help/help_TimesSeries1',
    'widgets/Demo/help/help_TimesSeries2',
    'widgets/Demo/help/help_AddData1',
    'widgets/Demo/help/help_AddData2',
    'widgets/Demo/help/help_SelectCommunity1',
    'widgets/Demo/help/help_SelectCommunity2',
    'widgets/Demo/help/help_DrawerMapping1',
    'widgets/Demo/help/help_DrawerMapping2',
    'widgets/Demo/help/help_ECAT1',
    'widgets/Demo/help/help_ECAT2',
    'widgets/Demo/help/help_HucNavigation1',
    'widgets/Demo/help/help_HucNavigation2',
    'widgets/Demo/help/help_Raindrop1',
    'widgets/Demo/help/help_Raindrop2', 
	'widgets/Demo/help/help_AttributeTable1',
    'widgets/Demo/help/help_AttributeTable2',
    'widgets/Demo/help/help_SelectByTopic1',
    'widgets/Demo/help/help_SelectByTopic2',
    'widgets/Demo/help/help_DrawMeasure1',
    'widgets/Demo/help/help_DrawMeasure2',
    'widgets/Demo/help/help_EnhancedBookmarks1',
    'widgets/Demo/help/help_EnhancedBookmarks2',
    'widgets/Demo/help/help_DynamicSymbology1',
    'widgets/Demo/help/help_DynamicSymbology2',
    'widgets/Demo/help/help_Print1',
    'widgets/Demo/help/help_Print2',
    'widgets/Demo/help/help_LayerList1',
    'widgets/Demo/help/help_LayerList2',	
    'widgets/Demo/help/help_EndPage',    
    'libs/caja-html-sanitizer-minified'
  ],

function(lang, array, html, has, config, ioQuery, query, nlt, Deferred, all, on, json, cookie,
  dojoNumber, dateLocale, nlsBundle, base64, esriLang, moment, arcgisUtils, PopupTemplate, SpatialReference,
  Extent, geometryEngine, Multipoint, Polyline, Polygon, webMercatorUtils, GeometryService, ProjectParameters,
  FeatureSet, PictureMarkerSymbol, esriUrlUtils, esriRequest, EsriQuery, QueryTask, graphicsUtils, IdentityManager,
  OAuthInfo, portalUrlUtils, sharedUtils, accessibleUtils, zoomToUtils, TooltipDialog, popup, registry, dom, help_Welcome, help_Elevation1, help_Elevation2, help_FeaturedCollections1, help_FeaturedCollections2, help_Demographic1, help_Demographic2, help_EnviroAtlasDataSearch1, help_EnviroAtlasDataSearch2, help_TimesSeries1, help_TimesSeries2, help_AddData1, help_AddData2, help_SelectCommunity1, help_SelectCommunity2, help_DrawerMapping1, help_DrawerMapping2, help_ECAT1, help_ECAT2, help_HucNavigation1, help_HucNavigation2, help_Raindrop1, help_Raindrop2,
  help_AttributeTable1, help_AttributeTable2, help_SelectByTopic1, help_SelectByTopic2, help_DrawMeasure1, help_DrawMeasure2, help_EnhancedBookmarks1, help_EnhancedBookmarks2, help_DynamicSymbology1, help_DynamicSymbology2, help_Print1, help_Print2, help_LayerList1, help_LayerList2, help_EndPage
) {
  /* global esriConfig, dojoConfig, ActiveXObject, testLoad */
  var mo = {};

  nlt = null;

  var servicesObj = {
    geometryService: 'http://utility.arcgisonline.com/arcgis/rest/services/Geometry/GeometryServer'
  };

  lang.mixin(mo, sharedUtils);
  lang.mixin(mo, accessibleUtils);
  lang.mixin(mo, zoomToUtils);

  if (!window.atob) {
    window.atob = function(b64) {
      var bytes = base64.decode(b64);
      var str = "";
      for (var i = 0, len = bytes.length; i < len; i++) {
        str += String.fromCharCode(bytes[i]);
      }
      return str;
    };
  }
  if (!window.btob) {
    window.btob = function(str) {
      var bytes = [];
      for (var i = 0, len = str.length; i < len; i++) {
        bytes.push(String.charCodeAt(str[i]));
      }

      return base64.encode(bytes);
    };
  }

  var fileAPIJsStatus = 'unload'; // unload, loading, loaded
  function _loadFileAPIJs(prePath, cb) {
    prePath = prePath || "";
    var loaded = 0,
      completeCb = function() {
        loaded++;
        if (loaded === tests.length) {
          cb();
        }
      },
      tests = [{
        test: window.File && window.FileReader && window.FileList && window.Blob ||
          !mo.file.isEnabledFlash(),
        failure: [
          prePath + "libs/polyfills/fileAPI/FileAPI.js"
        ],
        callback: function() {
          completeCb();
        }
      }];

    for (var i = 0; i < tests.length; i++) {
      testLoad(tests[i]);
    }
  }

  function displayMoreInformation() {

	elemHelpContents2 = document.getElementsByClassName("helpContent2");
    
	if (window.displayMoreInfor=="true"){    
		
		for (ii = 0; ii< elemHelpContents2.length; ii++) {	
			elemHelpContent2 = elemHelpContents2.item(ii);	
	        if (elemHelpContent2 != null)
	        {
	            elemHelpContent2.style.display = '';
	            window.displayMoreInfor = "false";
	        }      
        }    
	} else {
		
        for (ii = 0; ii< elemHelpContents2.length; ii++) {	
        
        	elemHelpContent2 = elemHelpContents2.item(ii);	
	        if (elemHelpContent2 != null)
	        {
	            elemHelpContent2.style.display = 'None';
	            window.displayMoreInfor = "true";
	        }             	
        }	
	}
  }
  //if no beforeId, append to head tag, or insert before the id
  function loadStyleLink(id, href, beforeId) {
    var def = new Deferred(), styleNode, styleLinkNode;

    var hrefPath = require(mo.getRequireConfig()).toUrl(href);
    //the cache will use the baseUrl + module as the key
    if(require.cache['url:' + hrefPath]){
      //when load css file into index.html as <style>, we need to fix the
      //relative path used in css file
      var cssStr = require.cache['url:' + hrefPath];
      var fileName = hrefPath.split('/').pop();
      var rpath = hrefPath.substr(0, hrefPath.length - fileName.length);
      cssStr = addRelativePathInCss(cssStr, rpath);
      if (beforeId) {
        styleNode = html.create('style', {
          id: id,
          type: "text/css"
        }, html.byId(beforeId), 'before');
      } else {
        styleNode = html.create('style', {
          id: id,
          type: "text/css"
        }, document.getElementsByTagName('head')[0]);
      }

      if(styleNode.styleSheet && !styleNode.sheet){
        //for IE
        styleNode.styleSheet.cssText = cssStr;
      }else{
        styleNode.appendChild(html.toDom(cssStr));
      }
      def.resolve('load');
      return def;
    }

    if (beforeId) {
      styleLinkNode = html.create('link', {
        id: id,
        rel: "stylesheet",
        type: "text/css",
        href: hrefPath + '?wab_dv=' + window.deployVersion
      }, html.byId(beforeId), 'before');
    } else {
      styleLinkNode = html.create('link', {
        id: id,
        rel: "stylesheet",
        type: "text/css",
        href: hrefPath + '?wab_dv=' + window.deployVersion
      }, document.getElementsByTagName('head')[0]);
    }

    on(styleLinkNode, 'load', function() {
      def.resolve('load');
    });

    //for the browser which doesn't fire load event
    //safari update documents.stylesheets when style is loaded.
    var ti = setInterval(function() {
      var loadedSheet;
      if (array.some(document.styleSheets, function(styleSheet) {
        if (styleSheet.href && styleSheet.href.substr(styleSheet.href.indexOf(href),
          styleSheet.href.length) === href) {
          loadedSheet = styleSheet;
          return true;
        }
      })) {
        try{
          if (!def.isFulfilled() && (loadedSheet.cssRules && loadedSheet.cssRules.length ||
            loadedSheet.rules && loadedSheet.rules.length)) {
            def.resolve('load');
          }
          clearInterval(ti);
        }catch(err){
          //In FF, we can't access .cssRules before style sheet is loaded,
          //but FF will emit load event. So, we catch this error and do nothing,
          //just wait for FF to emit load event and go on.
        }
      }
    }, 50);
    return def;
  }


  function addRelativePathInCss(css, rpath){
    var m = css.match(/url\([^)]+\)/gi), i, m2;

    if (m === null || rpath === '') {
      return css;
    }
    for (i = 0; i < m.length; i++) {
      m2 = m[i].match(/(url\(["|']?)(.*)((?:['|"]?)\))/i);
      if(m2.length >= 4){
        var path = m2[2];
        if(/^data:image\/.*;/.test(path)){
          continue;
        }
        if(!rpath.endWith('/')){
          rpath = rpath + '/';
        }
        css = css.replace(m2[1] + path + m2[3], m2[1] + rpath + path + m2[3]);
      }
    }
    return css;
  }

  var errorCheckLists = [];
  require.on("error", function(err) {
    array.forEach(errorCheckLists, function(o) {
      if (err.info[0] && err.info[0].indexOf(o.resKey) > -1) {
        o.def.reject(err);
      }
      for (var p in err.info) {
        if (p.indexOf(o.resKey) > -1) {
          o.def.reject(err);
        }
      }
    });
  });

  mo.checkError = function(resKey, def) {
    //when resKey match a error, def will be reject
    errorCheckLists.push({
      resKey: resKey,
      def: def
    });
  };

  /**
   * Repalce the placeholders in the obj Object properties with the props Object values,
   * return the replaced object
   * The placeholder syntax is: ${prop}
   */
  mo.replacePlaceHolder = function(obj, props) {
    var str = json.stringify(obj),
      m = str.match(/\$\{(\w)+\}/g),
      i;

    if (m === null) {
      return obj;
    }
    for (i = 0; i < m.length; i++) {
      var p = m[i].match(/(\w)+/g)[0];
      if (props[p]) {
        str = str.replace(m[i], props[p]);
      }
    }
    return json.parse(str);
  };

  /***
   * change latitude/longitude to degree, minute, second
   **/
  mo.changeUnit = function(val) {
    var abs = Math.abs(val),
      text, d, m, s;
    d = Math.floor(abs);
    m = Math.floor((abs - d) * 60);
    s = (((abs - d) * 60 - m) * 60).toFixed(2);
    //00B0 id degree character
    text = d + '\u00B0' + ((m < 10) ? ('0' + m) : m) + '\'' + ((s < 10) ? ('0' + s) : s) + '"';
    return text;
  };

  /**
   * the formated format is: mm:ss.ms
   **/
  mo.formatTime = function(time) {
    var s = time / 1000,
      m = Math.floor(s / 60),
      s2 = Number(s - m * 60).toFixed(1),
      text = ((m < 10) ? '0' + m : m) + ':' + ((s2 < 10) ? '0' + s2 : s2);
    return text;
  };

  mo.parseTime = function(text) {
    var p = /(\d{2,})\:(\d{2})\.(\d{1})/,
      m, t;
    if (!p.test(text)) {
      console.log('wrong time format.');
      return -1;
    }
    m = text.match(p);
    t = (parseInt(m[1], 10) * 60 + parseInt(m[2], 10) + parseInt(m[3], 10) / 10) * 1000;
    return t;
  };

  mo.preloadImg = function(imgs, rpath) {
    var imgArray = [];
    if (typeof imgs === 'string') {
      imgArray = [imgs];
    } else {
      imgArray = imgs;
    }
    array.forEach(imgArray, function(imgUrl) {
      var img = new Image();
      if (rpath) {
        img.src = rpath + imgUrl;
      } else {
        img.src = imgUrl;
      }
    });
  };

  mo.setWABLogoDefaultAlt = function (contentDom) {
    if (!contentDom) {
      return;
    }

    var contentImgs = query('img', contentDom);
    var oldWabLogoIds = ["img_1412759111499", "img_1545621838463", "img_1560482577021"];//old logo, 7.1, 7.2
    for (var i = 0, len = contentImgs.length; i < len; i++) {
      var img = contentImgs[i];
      if ((oldWabLogoIds.indexOf(html.getAttr(img, "id")) > -1) && !html.getAttr(img, "alt")) {
        html.setAttr(img, "alt", "ArcGIS Web AppBuilder.png");//keep img's alt in English
      }
    }
  };

  var testImageDom = null;
  mo.getImagesSize = function(imageUrl){
    var def = new Deferred();

    if (!imageUrl || imageUrl.indexOf("http") !== 0) {
      def.reject();
      return def;
    }

    if(testImageDom === null){
      testImageDom = html.create('img', {
        id: '__test-image-size',
        style: {
          position: 'absolute',
          left: '-9999px',
          top: '-9999px'
        }
      }, document.body);
    }
    var testImageHandler = on(testImageDom, "load", function(){
      clearTimeout(timeoutHandler);
      timeoutHandler = null;
      testImageHandler.remove();

      var box = html.getContentBox(testImageDom);

      if ((box.w === 1 && box.h === 1) || box.w === 0 || box.h === 0) {
        def.reject();
        return;
      }

      def.resolve([box.w, box.h]);
    }, {});

    var timeoutHandler = setTimeout(function(){
      clearTimeout(timeoutHandler);
      timeoutHandler = null;
      // image URL is invalid or takes too long; don't update it
      def.reject();
    }, 5000);

    // IE&, Safari and Chrome cache the image if the user does it more than once and
    //then don't call the onLoad handler
    html.setAttr(testImageDom, 'src', imageUrl);

    return def;
  };

  /**
   * get style object from position
   * the position can contain 6 property: left, top, right, bottom, width, height
   * please refer to AbstractModule
   */
  mo.getPositionStyle = function(_position) {
    var style = {};
    if(!_position){
      return style;
    }
    var position = lang.clone(_position);
    if(window.isRTL){
      var temp;
      if(typeof position.left !== 'undefined' && typeof position.right !== 'undefined'){
        temp = position.left;
        position.left = position.right;
        position.right = temp;
      }else if(typeof position.left !== 'undefined'){
        position.right = position.left;
        delete position.left;
      }else if(typeof position.right !== 'undefined'){
        position.left = position.right;
        delete position.right;
      }

      if(typeof position.paddingLeft !== 'undefined' &&
        typeof position.paddingRight !== 'undefined'){
        temp = position.paddingLeft;
        position.paddingLeft = position.paddingRight;
        position.paddingRight = temp;
      }else if(typeof position.paddingLeft !== 'undefined'){
        position.paddingRight = position.paddingLeft;
        delete position.paddingLeft;
      }else if(typeof position.paddingRight !== 'undefined'){
        position.paddingLeft = position.paddingRight;
        delete position.paddingRight;
      }

      if(typeof position.marginLeft !== 'undefined' &&
        typeof position.marginRight !== 'undefined'){
        temp = position.marginLeft;
        position.marginLeft = position.marginRight;
        position.marginRight = temp;
      }else if(typeof position.marginLeft !== 'undefined'){
        position.marginRight = position.marginLeft;
        delete position.marginLeft;
      }else if(typeof position.marginRight !== 'undefined'){
        position.marginLeft = position.marginRight;
        delete position.marginRight;
      }
    }

    var ps = ['left', 'top', 'right', 'bottom', 'width', 'height',
      'padding', 'paddingLeft', 'paddingRight', 'paddingTop', 'paddingBottom',
      'margin', 'marginLeft', 'marginRight', 'marginTop', 'marginBottom'];
    for (var i = 0; i < ps.length; i++) {
      var p = ps[i];
      if (typeof position[p] === 'number') {
        style[p] = position[p] + 'px';
      } else if (typeof position[p] !== 'undefined') {
        style[p] = position[p];
      }else{
        if(p.substr(0, 7) === 'padding' || p.substr(0, 7) === 'margin'){
          style[p] = 0;
        }else{
          style[p] = 'auto';
        }
      }
    }

    if(typeof position.zIndex === 'undefined'){
      //set zindex=auto instead of 0, because inner dom of widget may need to overlay other widget
      //that has the same zindex.
      style.zIndex = 'auto';
    }else{
      style.zIndex = position.zIndex;
    }
    return style;
  };

  /**
   * compare two object/array recursively
   * Note: null === null, undefined === undefined
   */
  function isEqual(o1, o2) {
    var leftChain, rightChain;

    function compare2Objects(x, y) {
      var p;
      if(x === null && y === null || typeof x === 'undefined' && typeof y === 'undefined'){
        return true;
      }

      if(x === null && y !== null || y === null && x !== null ||
        typeof x === 'undefined' && typeof y !== 'undefined' ||
        typeof y === 'undefined' && typeof x !== 'undefined'){
        return false;
      }

      // remember that NaN === NaN returns false
      // and isNaN(undefined) returns true
      if (isNaN(x) && isNaN(y) && typeof x === 'number' && typeof y === 'number') {
        return true;
      }
      // Compare primitives and functions.
      // Check if both arguments link to the same object.
      // Especially useful on step when comparing prototypes
      if (x === y) {
        return true;
      }
      // Works in case when functions are created in constructor.
      // Comparing dates is a common scenario. Another built-ins?
      // We can even handle functions passed across iframes
      if ((typeof x === 'function' && typeof y === 'function') ||
        (x instanceof Date && y instanceof Date) ||
        (x instanceof RegExp && y instanceof RegExp) ||
        (x instanceof String && y instanceof String) ||
        (x instanceof Number && y instanceof Number)) {
        return x.toString() === y.toString();
      }
      // check for infinitive linking loops
      if (leftChain.indexOf(x) > -1 || rightChain.indexOf(y) > -1) {
        return false;
      }
      // Quick checking of one object beeing a subset of another.
      // todo: cache the structure of arguments[0] for performance
      if (y !== null) {
        for (p in y) {
          if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
            return false;
          } else if (typeof y[p] !== typeof x[p]) {
            return false;
          }
        }
        for (p in x) {
          if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
            return false;
          } else if (typeof y[p] !== typeof x[p]) {
            return false;
          }
          switch (typeof(x[p])) {
            case 'object':
            case 'function':
              leftChain.push(x);
              rightChain.push(y);
              if (!compare2Objects(x[p], y[p])) {
                return false;
              }
              leftChain.pop();
              rightChain.pop();
              break;
            default:
              // remember that NaN === NaN returns false
              if (isNaN(x[p]) && isNaN(y[p]) && typeof x[p] === 'number' && typeof y[p] === 'number') {
                continue;
              }
              if (x[p] !== y[p]) {
                return false;
              }
              break;
          }
        }
      }

      return true;
    }

    leftChain = []; //todo: this can be cached
    rightChain = [];
    if (!compare2Objects(o1, o2)) {
      return false;
    }
    return true;
  }

  mo.isEqual = isEqual;

  //merge the target and src object/array, return the merged object/array.
  function merge(target, src) {
    var array = Array.isArray(src);
    var dst = array && [] || {};

    if (array) {
      target = target || [];
      dst = dst.concat(target);
      src.forEach(function(e, i) {
        if (typeof target[i] === 'undefined') {
          dst[i] = e;
        } else if (typeof e === 'object') {
          dst[i] = merge(target[i], e);
        } else {
          if (target.indexOf(e) === -1) {
            dst.push(e);
          }
        }
      });
    } else {
      if (target && typeof target === 'object') {
        Object.keys(target).forEach(function(key) {
          dst[key] = target[key];
        });
      }
      Object.keys(src).forEach(function(key) {
        if (typeof src[key] !== 'object' || !src[key]) {
          dst[key] = src[key];
        } else {
          if (!target[key]) {
            dst[key] = src[key];
          } else {
            dst[key] = merge(target[key], src[key]);
          }
        }
      });
    }

    return dst;
  }

  function setVerticalCenter(contextNode) {
    function doSet() {
      var nodes = query('.jimu-vcenter-text', contextNode),
        h, ph;
      array.forEach(nodes, function(node) {
        h = html.getContentBox(node).h;
        html.setStyle(node, {
          lineHeight: h + 'px'
        });
      }, this);

      nodes = query('.jimu-vcenter', contextNode);
      array.forEach(nodes, function(node) {
        h = html.getContentBox(node).h;
        ph = html.getContentBox(query(node).parent()[0]).h;
        html.setStyle(node, {
          marginTop: (ph - h) / 2 + 'px'
        });
      }, this);
    }

    //delay sometime to let browser update dom
    setTimeout(doSet, 10);
  }

  mo.file = {
    loadFileAPI: function() {
      var def = new Deferred();
      if (fileAPIJsStatus === 'unload') {
        var prePath = !!window.isBuilder ? 'stemapp/' : "";
        window.FileAPI = {
          debug: false,
          flash: true,
          staticPath: prePath + 'libs/polyfills/fileAPI/',
          flashUrl: prePath + 'libs/polyfills/fileAPI/FileAPI.flash.swf',
          flashImageUrl: prePath + 'libs/polyfills/fileAPI/FileAPI.flash.image.swf'
        };

        _loadFileAPIJs(prePath, lang.hitch(this, function() {
          fileAPIJsStatus = 'loaded';
          def.resolve();
        }));
        fileAPIJsStatus = 'loading';
      } else if (fileAPIJsStatus === 'loaded'){
        def.resolve();
      }

      return def;
    },
    supportHTML5: function() {
      if (window.File && window.FileReader && window.FileList && window.Blob) {
        return true;
      } else {
        return false;
      }
    },
    supportFileAPI: function() {
      if (has('safari') && has('safari') < 6) {
        return false;
      }
      if (window.FileAPI && window.FileAPI.readAsDataURL) {
        return true;
      }
      return false;
    },
    isEnabledFlash: function(){
      var swf = null;
      if (document.all) {
        try{
          swf = new ActiveXObject('ShockwaveFlash.ShockwaveFlash');
        }catch(e) {
          swf = null;
        }
      } else {
        if (navigator.plugins && navigator.plugins.length > 0) {
          swf = navigator.plugins["Shockwave Flash"];
        }
      }
      return !!swf;
    },
    containSeparator: function(path) {
      if (path.indexOf("/") >= 0) {
        return true;
      } else {
        if (path.indexOf("\\") >= 0) {
          return true;
        } else {
          return false;
        }
      }
    },
    getNameFromPath: function(path) {
      var separator = "";
      if (path.indexOf("/") >= 0) {
        separator = "/";
      } else {
        separator = "\\";
      }
      var segment = path.split(separator);
      if (segment.length > 0) {
        return segment[segment.length - 1];
      } else {
        return null;
      }

    },
    getFolderFromPath: function(path) {
      return path.substr(0, path.length - mo.file.getNameFromPath(path).length);
    },
    /********
     * read file by HTML5 API.
     *
     * parameters:
     * file: the file will be read.
     * filter: file type filter, files which don't match the filter will not be read and
       return false.
     * maxSize: file size which exceeds the size will return false;
     * cb: the callback function when file is read completed, signature: (err, fileName, fileData)
     */
    readFile: function(fileEvt, filter, maxSize, cb) {
      if (this.supportHTML5()) {
        var file = fileEvt.target.files[0];
        if (!file) {
          return;
        }
        // Only process image files.
        if (!file.type.match(filter)) {
          // cb("Invalid file type.");
          cb({
            errCode: "invalidType"
          });
          return;
        }

        if (file.size >= maxSize) {
          // cb("File size cannot exceed  " + Math.floor(maxSize / 1024) + "KB.");
          cb({
            errCode: "exceed"
          });
          return;
        }

        var reader = new FileReader();
        // Closure to capture the file information.
        reader.onload = function(e) {
          cb(null, file.name, e.target.result);
        };
        // Read in the image file as a data URL.
        reader.readAsDataURL(file);
      } else if (this.supportFileAPI()) {
        var files = window.FileAPI.getFiles(fileEvt);

        // Only process image files.
        if (!files[0].type.match(filter)) {
          // cb("Invalid file type.");
          cb({
            errCode: "invalidType"
          });
          return;
        }

        if (files[0].size >= maxSize) {
          // cb("File size cannot exceed  " + Math.floor(maxSize / 1048576) + "M.");
          cb({
            errCode: "exceed"
          });
          return;
        }

        window.FileAPI.readAsDataURL(files[0], function(evt) {
          if (evt && evt.result) {
            cb(null, files[0].name, evt.result);
          } else {
            cb({
              errCode: "readError"
            });
          }
        });
      }
    }
  };

  ///////////////////widget json(in app config json) processing

  mo.getUriInfo = function getUriInfo(uri) {
    var pos, firstSeg, info = {},
      amdFolder;

    pos = uri.indexOf('/');
    firstSeg = uri.substring(0, pos);

    //config using package
    amdFolder = uri.substring(0, uri.lastIndexOf('/') + 1);
    info.folderUrl = require(mo.getRequireConfig()).toUrl(amdFolder);
    info.amdFolder = amdFolder;

    info.url = info.folderUrl;//for backward compatibility

    if(/^http(s)?:\/\//.test(uri) || /^\/\//.test(uri)){
      info.isRemote = true;
    }

    return info;
  };

  mo.widgetJson = (function(){
    var ret = {};

    ret.addManifest2WidgetJson = function(widgetJson, manifest){
      lang.mixin(widgetJson, manifest.properties);
      widgetJson.name = manifest.name;
      if(!widgetJson.label){
        widgetJson.label = manifest.label;
      }
      widgetJson.manifest = manifest;
      widgetJson.isRemote = manifest.isRemote;
      if(widgetJson.isRemote){
        widgetJson.itemId = manifest.itemId;
      }
      if(manifest.featureActions){
        widgetJson.featureActions = manifest.featureActions;
      }

      if (!widgetJson.icon) {
        widgetJson.icon = manifest.icon;
      }

      if (!widgetJson.thumbnail) {
        widgetJson.thumbnail = manifest.thumbnail;
      }

      widgetJson.folderUrl = manifest.folderUrl;
      widgetJson.amdFolder = manifest.amdFolder;
    };

    ret.removeManifestFromWidgetJson = function(widgetJson){
      //we set property to undefined, instead of delete them.
      //The reason is: configmanager can't hanle delete properties for now
      if(!widgetJson.manifest){
        return;
      }
      for(var p in widgetJson.manifest.properties){
        widgetJson[p] = undefined;
      }
      widgetJson.name = undefined;
      widgetJson.label = undefined;
      widgetJson.featureActions = undefined;
      widgetJson.manifest = undefined;
    };

    ret.getUriFromItem = function(item){
      if(!item.url){
        return null;
      }

      return ret.getFolderUrlFromItem(item) + 'Widget';
    };

    ret.getFolderUrlFromItem = function(item){
      if(!item.url){
        return null;
      }

      var url;
      if(/manifest\.json$/.test(item.url)){
        url = item.url.substring(0, item.url.length - 'manifest.json'.length);
      }else if(/\/$/.test(item.url)){
        url = item.url;
      }else{
        url = item.url + '/';
      }

      if(window.location.protocol === "https:"){
        url = url.replace(/^http:\/\//, 'https://');
      }
      return url;
    };

    return ret;
  })();


  mo.getRequireConfig = function() {
    /* global jimuConfig */
    if (jimuConfig) {
      var packages = [];
      if (jimuConfig.widgetsPackage) {
        packages = packages.concat(jimuConfig.widgetsPackage);
      }
      if (jimuConfig.themesPackage) {
        packages = packages.concat(jimuConfig.themesPackage);
      }
      if (jimuConfig.configsPackage) {
        packages = packages.concat(jimuConfig.configsPackage);
      }
      return {
        packages: packages
      };
    } else {
      return {};
    }
  };

  mo.getTypeByGeometryType = function(esriType) {
    var type = '';
    var _pointTypes = ['esriGeometryPoint', 'esriGeometryMultipoint'];
    var _lineTypes = ['esriGeometryLine', 'esriGeometryCircularArc', 'esriGeometryEllipticArc',
    'esriGeometryBezier3Curve', 'esriGeometryPath', 'esriGeometryPolyline'];
    var _polygonTypes = ['esriGeometryRing', 'esriGeometryPolygon', 'esriGeometryEnvelope'];
    if (_pointTypes.indexOf(esriType) >= 0) {
      type = 'point';
    } else if (_lineTypes.indexOf(esriType) >= 0) {
      type = 'polyline';
    } else if (_polygonTypes.indexOf(esriType) >= 0) {
      type = 'polygon';
    }
    return type;
  };

  mo.getSymbolTypeByGeometryType = function(esriType){
    var symbolType = null;
    var geoType = mo.getTypeByGeometryType(esriType);
    if(geoType === 'point'){
      symbolType = 'marker';
    }
    else if(geoType === 'polyline'){
      symbolType = 'line';
    }
    else if(geoType === 'polygon'){
      symbolType = 'fill';
    }
    return symbolType;
  };

  mo.getServices = function() {
    return servicesObj;
  };

  mo.getArcGISDefaultGeometryService = function() {
    var url = servicesObj.geometryService;
    var gs = new GeometryService(url);
    return gs;
  };

  mo.restoreToDefaultWebMapExtent = function(map, webMapResponse, geoServiceUrl) {
    var def = new Deferred();
    var isMapValid = map && map.declaredClass === 'esri.Map';
    if (!isMapValid) {
      setTimeout(function() {
        def.reject('Invalid map.');
      }, 0);
      return def;
    }
    var itemInfo = webMapResponse && webMapResponse.itemInfo;
    if (!itemInfo) {
      setTimeout(function() {
        def.reject('Invalid itemInfo');
      }, 0);
      return def;
    }

    var points = itemInfo.item && itemInfo.item.extent;

    if (!points) {
      setTimeout(function() {
        def.reject('Invalid itemInfo.item.extent');
      });
      return def;
    }

    var spatialRef = new SpatialReference({
      wkid: 4326
    });
    var extent = new Extent(points[0][0], points[0][1], points[1][0], points[1][1], spatialRef);

    var mapWkid = parseInt(map.spatialReference.wkid, 10);

    if (mapWkid === 4326) {
      return map.setExtent(extent);
    } else {
      if (map.spatialReference.isWebMercator()) {
        extent = webMercatorUtils.geographicToWebMercator(extent);
        return map.setExtent(extent);
      } else {
        var params = new ProjectParameters();
        params.geometries = [extent];
        params.outSR = map.spatialReference;

        var gs = esriConfig && esriConfig.defaults && esriConfig.defaults.geometryService;
        var existGS = gs && gs.declaredClass === "esri.tasks.GeometryService";
        if (!existGS) {
          var validGeoService = geoServiceUrl && typeof geoServiceUrl === 'string' &&
          lang.trim(geoServiceUrl);
          if (validGeoService) {
            geoServiceUrl = lang.trim(geoServiceUrl);
            gs = new GeometryService(geoServiceUrl);
          } else {
            gs = mo.getArcGISDefaultGeometryService();
          }
        }

        gs.project(params).then(function(geometries) {
          var projectedExt = geometries && geometries[0];
          if (projectedExt) {
            return map.setExtent(projectedExt);
          } else {
            def.reject('Invalid projected geometry.');
            return def;
          }
        }, function(err) {
          console.error(err);
          def.reject(err);
          return def;
        });
      }
    }

    return def;
  };
  mo.adjustMapExtent = function(map) {
	var adjustForFurtherSynchronize = 0;//0.01
	var oriExtent = map.extent;                            		
	var xmin = oriExtent.xmin+adjustForFurtherSynchronize;
    var ymin = oriExtent.ymin+adjustForFurtherSynchronize;
    var xmax = oriExtent.xmax+adjustForFurtherSynchronize;
    var ymax = oriExtent.ymax+adjustForFurtherSynchronize;
    
	nExtent = new Extent({
	    "xmin":xmin,"ymin":ymin,"xmax":xmax,"ymax":ymax,
	    "spatialReference":oriExtent.spatialReference
	});
	return map.setExtent(nExtent); 
  };
  mo.getAncestorWindow = function() {
    var w = window;
    while (w && w.parent && w !== w.parent) {
      w = w.parent;
    }
    return w;
  };

  mo.getAncestorDom = function(child, verifyFunc,
    /*HTMLElement|Number optional */ maxLoopSizeOrDom) {
    if (child && child.nodeType === 1) {
      if (verifyFunc && typeof verifyFunc === 'function') {
        var maxLoopSize = 100;
        var maxLoopDom = document.body;

        if (maxLoopSizeOrDom) {
          if (typeof maxLoopSizeOrDom === 'number') {
            //Number
            maxLoopSizeOrDom = parseInt(maxLoopSizeOrDom, 10);
            if (maxLoopSizeOrDom > 0) {
              maxLoopSize = maxLoopSizeOrDom;
            }
          } else if (maxLoopSizeOrDom.nodeType === 1) {
            //HTMLElement
            maxLoopDom = maxLoopSizeOrDom;
          }
        }

        var loop = 0;
        while (child.parentNode && loop < maxLoopSize &&
          html.isDescendant(child.parentNode, maxLoopDom)) {
          if (verifyFunc(child.parentNode)) {
            return child.parentNode;
          }
          child = child.parentNode;
          loop++;
        }
      }
    }
    return null;
  };

  mo.bindClickAndDblclickEvents = function(dom, clickCallback, dblclickCallback,
    /* optional */ _timeout) {
    var handle = null;
    var isValidDom = dom && dom.nodeType === 1;
    var isValidClick = clickCallback && typeof clickCallback === 'function';
    var isValidDblclick = dblclickCallback && typeof dblclickCallback === 'function';
    var isValid = isValidDom && isValidClick && isValidDblclick;
    if (isValid) {
      var timeout = 200;
      if (_timeout && typeof _timeout === 'number') {
        var t = parseInt(_timeout, 10);
        if (t > 0) {
          timeout = t;
        }
      }

      var clickCount = 0;
      handle = on(dom, 'click', function(evt) {
        clickCount++;
        if (clickCount === 1) {
          setTimeout(function() {
            if (clickCount === 1) {
              clickCount = 0;
              clickCallback(evt);
            }
          }, timeout);
        } else if (clickCount === 2) {
          clickCount = 0;
          dblclickCallback(evt);
        }
      });
    }
    return handle;
  };

  mo.isScrollToBottom = function(dom) {
    var box = html.getContentBox(dom);
    var a = dom.scrollTop + box.h;
    var b = dom.scrollHeight - a;
    return b < 1;
  };

  mo.getAllItemTypes = function() {
    var allTypes = [];
    //Web Content
    var maps1 = ['Web Map', 'Web Scene', 'CityEngine Web Scene'];
    var layers1 = ['Feature Service', 'Map Service', 'Image Service', 'KML', 'WMS',
    'Feature Collection', 'Feature Collection Template', 'Geodata Service', 'Globe Service'];
    var tools1 = ['Geometry Service', 'Geocoding Service', 'Network Analysis Service',
    'Geoprocessing Service'];
    var applications1 = ['Web Mapping Application', 'Mobile Application', 'Code Attachment',
    'Operations Dashboard Add In', 'Operation View'];
    var datafiles1 = ['Symbol Set', 'Color Set', 'Shapefile', 'CSV', 'Service Definition',
    'Document Link', 'Microsoft Word', 'Microsoft PowerPoint', 'Microsoft Excel', 'PDF',
    'Image', 'Visio Document'];
    //Desktop Content
    var maps2 = ['Map Document', 'Map Package', 'Tile Package', 'ArcPad Package',
    'Explorer Map', 'Globe Document', 'Scene Document', 'Published Map', 'Map Template',
    'Windows Mobile Package'];
    var layers2 = ['Layer', 'Layer Package', 'Explorer Layer'];
    var tools2 = ['Geoprocessing Package', 'Geoprocessing Sample', 'Locator Package',
    'Rule Package'];
    var applications2 = ['Workflow Manager Package', 'Desktop Application',
    'Desktop Application Template', 'Code Sample', 'Desktop Add In', 'Explorer Add In'];

    allTypes = allTypes.concat(maps1).concat(layers1).concat(tools1)
    .concat(applications1).concat(datafiles1);
    allTypes = allTypes.concat(maps2).concat(layers2).concat(tools2).concat(applications2);
    return allTypes;
  };

  mo.getItemQueryStringByTypes = function(itemTypes) {
    var queryStr = '';
    var allTypes = mo.getAllItemTypes();
    if (itemTypes && itemTypes.length > 0) {
      if (itemTypes.length > 0) {
        var validStr = '';
        array.forEach(itemTypes, function(type, index) {
          var s = ' type:"' + type + '" ';
          validStr += s;
          if (index !== itemTypes.length - 1) {
            validStr += ' OR ';
          }
        });
        queryStr = ' ( ' + validStr + ' ) ';
        var sumAllTypes = itemTypes.concat(allTypes);
        var removedTypes = array.filter(sumAllTypes, function(removedType){
          return array.every(itemTypes, function(itemType){
            return itemType.toLowerCase().indexOf(removedType.toLowerCase()) < 0;
          });
        });

        array.forEach(removedTypes, function(type) {
          var s = ' -type:"' + type + '" ';
          queryStr += s;
        });
      }
    }
    return queryStr;
  };

  mo.getItemQueryStringByTypeKeywords = function(typeKeywords){
    var queryStr = '';
    //must use double quotation marks around typeKeywords
    //typekeywords:"Web AppBuilder" or typekeywords:"Web AppBuilder,Web Map"
    if(typeKeywords && typeKeywords.length > 0){
      queryStr = ' typekeywords:"' + typeKeywords.join(',') + '" ';
    }
    return queryStr;
  };

  mo.isNotEmptyString = function(str, /* optional */ trim) {
    var b = str && typeof str === 'string';
    if (b) {
      if (trim) {
        return b && lang.trim(str);
      } else {
        return true;
      }
    } else {
      return false;
    }
  };

  mo.isNotEmptyStringArray = function(strArray, /* optional */ trim){
    for(var key = 0; key < strArray.length; key++){
      var str = strArray[key];
      var strVal = str.value ? str.value : str;
      var isNotEmpty = mo.isNotEmptyString(strVal, trim);
      if(!isNotEmpty){
        return false;
      }
    }
    return true;
  };

  mo.isValidNumber = function(num){
    return typeof num === 'number' && !isNaN(num);
  };

  mo.isValidNumberArray = function(numArray){
    for(var key = 0; key < numArray.length; key++){
      var num = numArray[key];
      num = (num.value || num.value === 0) ? num.value : num;
      var isValid = mo.isValidNumber(num);
      if(!isValid){
        return false;
      }
    }
    return true;
  };

  mo.isValidDate = function(date){
    if(date){ //null, '', undefined
      try {
        var d = mo.getDateByDateTimeStr(date); //new Date(date), IE doesn't work if date has time format
        return !isNaN(d.getTime()); // d.toString() === 'Invalid Date'
      }catch (err) {
        console.error(err);
        return false;
      }
    }else{
      return false;
    }
  };

  mo.isObject = function(o) {
    return o && typeof o === 'object';
  };

  mo.createWebMap = function(portalUrl, itemId, mapDiv, /* optional */ options) {
    //var arcgisUrlOld = arcgisUtils.arcgisUrl;
    portalUrl = portalUrlUtils.getStandardPortalUrl(portalUrl);
    var itemUrl = portalUrlUtils.getBaseItemUrl(portalUrl);
    arcgisUtils.arcgisUrl = itemUrl;
    var def = arcgisUtils.createMap(itemId, mapDiv, options);
    return def;
  };

  mo.getRandomString = function() {
    var str = Math.random().toString();
    str = str.slice(2, str.length);
    return str;
  };

  mo._getDomainsByServerName = function(serverName){
    var splits = serverName.split('.');
    var length = splits.length;
    var domains = array.map(splits, lang.hitch(this, function(v, index){
      // jshint unused:false
      var arr = splits.slice(index, length);
      var str = "";
      var lastIndex = arr.length - 1;
      array.forEach(arr, lang.hitch(this, function(s, idx){
        str += s;
        if(idx !== lastIndex){
          str += '.';
        }
      }));
      return str;
    }));
    return domains;
  };

  mo.removeCookie = function(cookieName, path){
    var domains = this._getDomainsByServerName(window.location.hostname);

    array.forEach(domains, lang.hitch(this, function(domainName){
      cookie(cookieName, null, {
        expires: -1,
        path: path
      });

      cookie(cookieName, null, {
        expires: -1,
        path: path,
        domain: domainName
      });

      cookie(cookieName, null, {
        expires: -1,
        path: path,
        domain: '.' + domainName
      });
    }));
  };

  mo.isLocaleChanged = function(oldLocale, newLocale){
    return !oldLocale.startWith(newLocale);
  };

  mo.hashToObject = function(hashStr){
    hashStr = hashStr.replace('#', '');
    var hashObj = ioQuery.queryToObject(hashStr);
    for (var p in hashObj) {
      if (hashObj.hasOwnProperty(p)) {
        try {
          hashObj[p] = json.parse(hashObj[p]);
        } catch (err) {
          continue;
        }
      }
    }
    return hashObj;
  };

  mo.reCreateObject = function(obj) {
    //summary:
    //  because of dojo's lang.isArray issue, we need re-create the array properties
    var ret;

    function copyArray(_array) {
      var retArray = [];
      _array.forEach(function(a) {
        if (Array.isArray(a)) {
          retArray.push(copyArray(a));
        } else if (typeof a === 'object') {
          retArray.push(copyObject(a));
        } else {
          retArray.push(a);
        }
      });
      return retArray;
    }

    function copyObject(_obj) {
      var ret = {};
      for (var p in _obj) {
        if (!_obj.hasOwnProperty(p)) {
          continue;
        }
        if(_obj[p] === null){
          ret[p] = null;
        }else if (Array.isArray(_obj[p])) {
          ret[p] = copyArray(_obj[p]);
        } else if (typeof _obj[p] === 'object') {
          ret[p] = copyObject(_obj[p]);
        } else {
          ret[p] = _obj[p];
        }
      }
      return ret;
    }

    if (Array.isArray(obj)) {
      ret = copyArray(obj);
    } else {
      ret = copyObject(obj);
    }
    return ret;
  };

  mo.setVerticalCenter = setVerticalCenter;
  mo.merge = merge;
  mo.loadStyleLink = loadStyleLink;

  mo.changeLocation = function(newUrl){
    // debugger;
    if (window.history.pushState) {
      window.history.pushState({path:newUrl}, '', encodeURI(newUrl));
    }/*else{
      window.location.href = newUrl;
    }*/
  };

  mo.urlToObject = function(url){
    var ih = url.indexOf('#'),
    obj = null;
    if (ih === -1){
      obj = esriUrlUtils.urlToObject(url);
      obj.hash = null;
    }else {
      var urlParts = url.split('#');
      obj = esriUrlUtils.urlToObject(urlParts[0]);
      obj.hash = urlParts[1] ?
        (urlParts[1].indexOf('=') > -1 ? ioQuery.queryToObject(urlParts[1]) : urlParts[1]): null;
    }
    return obj;
  };

  /////////////widget and theme manifest processing/////////
  mo.manifest = (function(){
    var ret = {};

    function addThemeManifestProperies(manifest) {
      manifest.panels.forEach(function(panel) {
        panel.uri = 'panels/' + panel.name + '/Panel.js';
      });

      manifest.styles.forEach(function(style) {
        style.uri = 'styles/' + style.name + '/style.css';
      });

      manifest.layouts.forEach(function(layout) {
        layout.uri = 'layouts/' + layout.name + '/config.json';
        layout.icon = 'layouts/' + layout.name + '/icon.png';
        layout.RTLIcon = 'layouts/' + layout.name + '/icon_rtl.png';
      });
    }

    function addWidgetManifestProperties(manifest) {
      //because tingo db engine doesn't support 2D, 3D property, so, change here
      if (typeof manifest['2D'] !== 'undefined') {
        manifest.support2D = manifest['2D'];
      }
      if (typeof manifest['3D'] !== 'undefined') {
        manifest.support3D = manifest['3D'];
      }

      if (typeof manifest['2D'] === 'undefined' && typeof manifest['3D'] === 'undefined') {
        manifest.support2D = true;
      }

      delete manifest['2D'];
      delete manifest['3D'];

      if (typeof manifest.properties === 'undefined') {
        manifest.properties = {};
      }

      sharedUtils.processWidgetProperties(manifest);
    }

    ret.addManifestProperies = function(manifest) {
      if(!manifest.icon){
        manifest.icon = manifest.folderUrl + 'images/icon.png?wab_dv=' + window.deployVersion;
      }

      if (!manifest.thumbnail) {
        manifest.thumbnail = manifest.folderUrl + 'images/thumbnail.png';
      }

      if(manifest.category === "theme") {
        addThemeManifestProperies(manifest);
      } else {
        addWidgetManifestProperties(manifest);
      }
    };

    ret.processManifestLabel = function(manifest, locale){
      var langCode = locale.split('-')[0];
      manifest.label = manifest.i18nLabels && (manifest.i18nLabels[locale] || manifest.i18nLabels[langCode] ||
        manifest.i18nLabels.defaultLabel) ||
        manifest.label ||
        manifest.name;
      if(manifest.layouts){
        array.forEach(manifest.layouts, function(layout){
          var key = 'i18nLabels_layout_' + layout.name;
          layout.label = manifest[key] && (manifest[key][locale] ||
            manifest[key].defaultLabel) ||
            layout.label ||
            layout.name;
        });
      }
      if(manifest.styles){
        array.forEach(manifest.styles, function(_style){
          var key = 'i18nLabels_style_' + _style.name;
          _style.label = manifest[key] && (manifest[key][locale] ||
            manifest[key].defaultLabel) ||
            _style.label ||
            _style.name;
        });
      }
    };

    ret.addI18NLabel = function(manifest){
      var def = new Deferred();
      if(manifest.i18nLabels){
        def.resolve(manifest);
        return def;
      }
      manifest.i18nLabels = {};

      if(manifest.properties && manifest.properties.hasLocale === false){
        def.resolve(manifest);
        return def;
      }

      //theme or widget label
      var nlsFile;
      if(manifest.isRemote){
        nlsFile = manifest.amdFolder + 'nls/strings.js';
      }else{
        nlsFile = manifest.amdFolder + 'nls/strings';
      }
      require(mo.getRequireConfig(), ['dojo/i18n!' + nlsFile],
      function(localeStrings){
        var localesStrings = {};
        localesStrings[dojoConfig.locale] = localeStrings;
        sharedUtils.addI18NLabelToManifest(manifest, null, localesStrings);
        def.resolve(manifest);
      });

      return def;
    };
    return ret;
  })();

  mo.isNumberField = function(fieldType){
    var numberFieldTypes = [
      'esriFieldTypeOID',
      'esriFieldTypeSmallInteger',
      'esriFieldTypeInteger',
      'esriFieldTypeSingle',
      'esriFieldTypeDouble'
    ];
    return numberFieldTypes.indexOf(fieldType) >= 0;
  };

  mo.getTime = function (date) {
    var _off = date.getTimezoneOffset();
    var _offTimes = _off < 0 ? "+" + (Math.abs(_off) / 60) : "-" + (_off / 60);
    return date.getTime() + _offTimes * 60 * 60 * 1000;
  };

  //return [{value,label}]
  mo.getUniqueValues = function(
    featureOrImageLayerUrl,
    fieldName,
    where,
    /*optional*/ _layerDefinition,
    /*optional*/ _fieldPopupInfo){ //dateField requires _fieldPopupInfo to show correct dateformat.

    function getLayerDefinitionAndFieldPopupInfo(){
      var def = new Deferred();
      var defVals = {};
      if(_layerDefinition){
        defVals.layerDefinition = _layerDefinition;
        if(_fieldPopupInfo){
          defVals.fieldPopupInfo = _fieldPopupInfo;
        }
        def.resolve(defVals);
      }else{
        def = esriRequest({
          url: featureOrImageLayerUrl,
          content: {f : 'json'},
          handleAs: 'json',
          callbackParamName: 'callback'
        }).then(function(response){
          defVals.layerDefinition = response;
          return defVals;
        },function(error) {
          console.log("Error: ", error.message);
        });
      }
      return def;
    }
    return getLayerDefinitionAndFieldPopupInfo().then(function(defVals){
      return mo._getUniqueValues(featureOrImageLayerUrl, fieldName, where, defVals.layerDefinition)
      .then(function(values){
        var layerDefinition = defVals.layerDefinition;
        var fieldPopupInfo = defVals.fieldPopupInfo;
        return mo._getValues(layerDefinition, fieldPopupInfo, fieldName, values);
      });
    });
  };

  mo._getValues = function(layerDefinition, fieldPopupInfo, fieldName, values){
    var valueLabels = [];
    var fieldInfo = mo.getFieldInfoByFieldName(layerDefinition.fields, fieldName);
    var codedValueObj = null;//{value:label}
    var isNumberField = mo.isNumberField(fieldInfo.type);
    var isDateField = fieldInfo.type === 'esriFieldTypeDate' ? true : false;
    if(fieldInfo){
      if(isNumberField){
        values = array.map(values, function(v){
          var r = parseFloat(v);
          if(isNaN(r)){
            r = null;
          }
          return r;
        });
      }else if(isDateField){
        valueLabels = array.map(values, lang.hitch(this, function(v) {
          var value = v, label = v;
          if(mo.isValidDate(v)){
            value = mo.getDateTimeStrByFieldInfo(v, fieldPopupInfo);//local date in standard date format
            // var newV = mo.getTime(new Date(v));//local date
            label = mo.localizeDateByFieldInfo(v, fieldPopupInfo); //local date in esri date format
          }
          return {
            value: value,
            label: label
          };
        }));
        return valueLabels;
      }
      //coded values
      var domainValLabels = mo.getCodedValueListForCodedValueOrSubTypes(layerDefinition, fieldName);//[{value,label}]
      if(domainValLabels !== null){
        codedValueObj = {};
        for(var key = 0; key < domainValLabels.length; key ++){
          codedValueObj[domainValLabels[key].value] = domainValLabels[key].label;
        }
      }
    }
    valueLabels = array.map(values, function(value){
      var label = null;
      if(value === null || value === undefined){
        label = '<Null>';
      }else{
        if(codedValueObj && codedValueObj.hasOwnProperty(value)){
          label = codedValueObj[value];
        }else{
          if(isNumberField){
            if(fieldPopupInfo){
              label = mo.localizeNumberByFieldInfo(value, fieldPopupInfo);
            }else{
              label = mo.localizeNumber(value);
            }
          }
          else if(isDateField){
            //display in local format
            label = mo.localizeDateByFieldInfo(new Date(value), fieldPopupInfo);
          }
          else{
            label = value;
          }
        }
      }
      return {
        value: value,
        label: label
      };
    });
    return valueLabels;
  };

  mo._getUniqueValues = function(featureOrImageLayerUrl, fieldName, where, layerDefinition){
    var def = new Deferred();
    var url = featureOrImageLayerUrl.replace(/\/*$/g, '');
    if(!where){
      where = '1=1';
    }

    //MapService and FeatureServie both support QueryTask and generateRenderer.
    //But QueryTask has the maxRecordCount limit, generateRenderer doesn't.
    //ImageServer only supports QueryTask.
    var reg = /\/ImageServer$/gi;
    var isImageService = reg.test(url);
    var isDynamicLayer = url.indexOf('MapServer/dynamicLayer') > -1;
    if(isImageService || isDynamicLayer){
      def = mo._getUniqueValuesByQueryTask(url, fieldName, where);
    }else{
      var fieldInfo = mo.getFieldInfoByFieldName(layerDefinition.fields, fieldName);
      var codedValuesOrTypesCount = mo.getCodedValuesOrTypesCount(fieldInfo, layerDefinition);
      if(codedValuesOrTypesCount > 0){
        def = mo._getUniqueValuesByQueryTask(url, fieldName, where);
      }else{
        def = mo._getUniqueValuesByGenerateRenderer(url, fieldName, where);
      }
    }

    return def;
  };

  //get codedValue or types count, return number
  mo.getCodedValuesOrTypesCount = function(fieldInfo, layerDefinition){
    if(fieldInfo){
      if(layerDefinition.typeIdField && layerDefinition.typeIdField.toUpperCase() === fieldInfo.name.toUpperCase() &&
        layerDefinition.types){
        return layerDefinition.types.length;
      }else{
        var codedValues = mo._getAllCodedValue(layerDefinition, fieldInfo);
        return codedValues ? codedValues.length : 0;
      }
    }
    return 0;
  };

  mo._getUniqueValuesByQueryTask = function(url, fieldName, where){
    var queryParams = new EsriQuery();
    queryParams.where = where;
    queryParams.returnDistinctValues = true;
    queryParams.returnGeometry = false;
    queryParams.outFields = [fieldName];
    var queryTask = new QueryTask(url);
    return queryTask.execute(queryParams).then(function(response){
      var values = [];
      if(response.features && response.features.length > 0){
        array.forEach(response.features, function(feature){
          if(feature && feature.attributes){
            values.push(feature.attributes[fieldName]);
          }
        });
      }
      return values;
    });
  };

  mo._getUniqueValuesByGenerateRenderer = function(featureLayerUrl, fieldName, where){
    var def = new Deferred();
    var segs = featureLayerUrl.split('?');
    var reqUrl;
    if(segs.length > 1){
      reqUrl = segs[0].replace(/\/*$/g, '') + "/generateRenderer?" + segs[1];
    }else{
      reqUrl = featureLayerUrl.replace(/\/*$/g, '') + "/generateRenderer";
    }

    var classificationDef = {"type":"uniqueValueDef", "uniqueValueFields":[fieldName]};
    var str = json.stringify(classificationDef);
    esriRequest({
      url: reqUrl,
      content: {
        classificationDef: str,
        f: 'json',
        where: where
      },
      handleAs: 'json',
      callbackParamName:'callback'
    }).then(lang.hitch(this, function(response){
      var values = [];
      var uniqueValueInfos = response && response.uniqueValueInfos;
      if(uniqueValueInfos && uniqueValueInfos.length > 0){
        values = array.map(uniqueValueInfos, lang.hitch(this, function(info){
          return info.value;
        }));
      }
      def.resolve(values);
    }), lang.hitch(this, function(err){
      def.reject(err);
    }));
    return def;
  };

  //Compatible with layerObject
  mo.isCodedValuesSupportFilter = function(layerDefinition, codedValueLength){
    var _layerDef = layerDefinition.currentVersion ? layerDefinition :
      layerDefinition.toJson().layerDefinition;
    var version = parseFloat(_layerDef.currentVersion);
    return codedValueLength <= parseFloat(_layerDef.maxRecordCount) && version > 10.1;
  };

  mo.combineRadioCheckBoxWithLabel = function(inputDom, labelDom){
    var isValidInput = false;
    if(inputDom && inputDom.nodeType === 1 && inputDom.tagName.toLowerCase() === 'input'){
      var inputType = inputDom.getAttribute('type') || '';
      inputType = inputType.toLowerCase();
      if(inputType === 'radio' || inputType === 'checkbox'){
        isValidInput = true;
      }
    }
    var isValidLabel = false;
    if(labelDom && labelDom.nodeType === 1 && labelDom.tagName.toLowerCase() === 'label'){
      isValidLabel = true;
    }
    if(isValidInput && isValidLabel){
      var inputId = inputDom.getAttribute('id');
      if(!inputId){
        inputId = "input_" + mo.getRandomString();
        inputDom.setAttribute('id', inputId);
      }
      labelDom.setAttribute('for', inputId);
      html.setStyle(labelDom, 'cursor', 'pointer');
    }
  };

  //return handle array, the handles can be owned by widget
  mo.groupRadios = function(radios, /*optional*/ listener){
    var handles = [];
    var name = "radiogroup_" + mo.getRandomString();
    array.forEach(radios, function(radio){
      radio.name = name;
      if(listener){
        var handle = on(radio, 'change', listener);
        handles.push(handle);
      }
    });
    return handles;
  };

  mo.convertExtentToPolygon = function(extent){
    //order: left-top right-top right-bottom left-bottom left-top
    var xLeft = extent.xmin;
    var xRight = extent.xmax;
    var yBottom = extent.ymin;
    var yTop = extent.ymax;

    var polygon = new Polygon({
      "rings": [
        [
          [xLeft, yTop],
          [xRight, yTop],
          [xRight, yBottom],
          [xLeft, yBottom],
          [xLeft, yTop]
        ]
      ],
      "spatialReference": extent.toJson()
    });
    return polygon;
  };

  //combine multiple geometries into one geometry
  mo.combineGeometries = function(geometries){
    //geometries must have same geometryType: point,multipoint,polyline,polygon,extent
    //geometries must have same spatialReference
    function combinePoints(geos){
      //geos is an array of point or multipoint
      var mpJson = {
        "points": [],//each element is [x,y]
        "spatialReference": geos[0].spatialReference.toJson()
      };
      array.forEach(geos, function(geo){
        if(geo.type === 'point'){
          mpJson.points = mpJson.points.concat([[geo.x, geo.y]]);
        }else if(geo.type === 'multipoint'){
          mpJson.points = mpJson.points.concat(geo.points);
        }
      });
      var multipoint = new Multipoint(mpJson);
      return multipoint;
    }

    function combinePolylines(geos){
      //geos is an array of polyline
      var polylineJson = {
        "paths":[],
        "spatialReference": geos[0].spatialReference.toJson()
      };
      array.forEach(geos, function(geo){
        polylineJson.paths = polylineJson.paths.concat(geo.paths);
      });
      var polyline = new Polyline(polylineJson);
      return polyline;
    }

    function combinePolygons(geos){
      //geos is an array of polygon or extent
      var polygonJson = {
        "rings": [],
        "spatialReference": geos[0].spatialReference.toJson()
      };
      array.forEach(geos, function(geo){
        if(geo.type === 'polygon'){
          polygonJson.rings = polygonJson.rings.concat(geo.rings);
        }else if(geo.type === 'extent'){
          var plg = mo.convertExtentToPolygon(geo);
          polygonJson.rings = polygonJson.rings.concat(plg.rings);
        }
      });
      var polygon = new Polygon(polygonJson);
      return polygon;
    }

    var geometry = null;
    if(geometries && geometries.length > 0){
      if(geometries.length === 1){
        geometry = geometries[0];
      }else{
        var g1 = null;
        var g2 = null;
        var geometryType = null;
        var type = null;
        for(var i = 0; i < geometries.length; i++){
          g1 = geometries[i];
          switch(g1.type){
            case 'point':
            case 'multipoint':
              type = 'point';
              break;
            case 'polyline':
              type = 'polyline';
              break;
            case 'polygon':
            case 'extent':
              type = 'polygon';
              break;
            default:
              //invalid type
              return null;
          }

          if(i === 0){
            geometryType = type;
          }else{
            if(geometryType !== type){
              return null;
            }
          }

          if(i !== geometries.length - 1){
            g2 = geometries[i + 1];
            if(!g1.spatialReference.equals(g2.spatialReference)){
              return null;
            }
          }
        }

        if(type === 'point'){
          geometry = combinePoints(geometries);
        }else if(type === 'polyline'){
          geometry = combinePolylines(geometries);
        }else if(type === 'polygon'){
          geometry = combinePolygons(geometries);
        }
      }
    }
    return geometry;
  };

  mo.combineGeometriesByGraphics = function(graphics){
    var geometry = null;
    if(graphics && graphics.length > 0){
      var geometries = array.map(graphics, function(graphic){
        return graphic.geometry;
      });
      geometry = mo.combineGeometries(geometries);
    }
    return geometry;
  };

  mo.isFeaturelayerUrlSupportQuery = function(featureLayerUrl, capabilities){
    var isSupportQuery = false;
    var isFeatureService = (/\/featureserver\//gi).test(featureLayerUrl);
    var isMapService = (/\/mapserver\//gi).test(featureLayerUrl);
    capabilities = capabilities || '';
    capabilities = capabilities.toLowerCase();
    if (isFeatureService) {
      isSupportQuery = capabilities.indexOf('query') >= 0;
    } else if (isMapService) {
      isSupportQuery = capabilities.indexOf('data') >= 0;
    }
    return isSupportQuery;
  };

  mo.isImageServiceSupportQuery = function(capabilities){
    capabilities = capabilities || '';
    return capabilities.toLowerCase().indexOf('catalog') >= 0;
  };

  mo.isStringEndWith = function(s, endS){
    return (s.lastIndexOf(endS) + endS.length === s.length);
  };

  /*
  *Optional
  *An object with the following properties:
  *pattern (String, optional):
  *override formatting pattern with this string. Default value is based on locale.
   Overriding this property will defeat localization. Literal characters in patterns
   are not supported.
  *type (String, optional):
  *choose a format type based on the locale from the following: decimal, scientific
   (not yet supported), percent, currency. decimal by default.
  *places (Number, optional):
  *fixed number of decimal places to show. This overrides any information in the provided pattern.
  *round (Number, optional):
  *5 rounds to nearest .5; 0 rounds to nearest whole (default). -1 means do not round.
  *locale (String, optional):
  *override the locale used to determine formatting rules
  *fractional (Boolean, optional):
  *If false, show no decimal places, overriding places and pattern settings.
  */
  mo._localizeNumber = function(num, options){
    var decimalStr = num.toString().split('.')[1] || "",
          decimalLen = decimalStr.length;
    var _pattern = "";
    var places = options && isFinite(options.places) && options.places;
    if (places > 0 || decimalLen > 0) {
      var patchStr = Array.prototype.join.call({
        length: places > 0 ? (places + 1) : decimalLen
      }, '0');
      _pattern = "#,###,###,##0.0" + patchStr;
    }else {
      _pattern = "#,###,###,##0";
    }
    var locale = (options && options.locale) || config.locale;
    var _options = {
      locale: locale,
      pattern: _pattern
    };
    lang.mixin(_options, options || {});

    try {
      var fn = dojoNumber.format(num, _options);
      return fn;
    } catch (err) {
      console.error(err);
      return num.toLocaleString();
    }
  };

  mo.localizeNumber = function(number, options) {
    if (!mo.isNumberOrNumberString(number)) {
      return number;
    }

    number = Number(number);

    var isNegative = false;
    if (number < 0) {
      isNegative = true;
      number = Math.abs(number);
    }

    number = mo._localizeNumber(number, options);

    //Under RTL, the browser will automatically flip the minus sign to the opposite position. 
    //In order to keep the minus sign always on the left, we need to flip it to the right
    if (isNegative) {
      number = window.isRTL ? number + '-' : '-' + number;
    }

    return number;
  };

  /*
  *Optional
  *An object with the following properties:
  *pattern (String, optional):
  *override formatting pattern with this string. Default value is based on locale.
   Overriding this property will defeat localization. Literal characters in patterns
   are not supported.
  *type (String, optional):
  *choose a format type based on the locale from the following: decimal,
   scientific (not yet supported), percent, currency. decimal by default.
  *locale (String, optional):
  *override the locale used to determine formatting rules
  *strict (Boolean, optional):
  *strict parsing, false by default. Strict parsing requires input as produced by the
   format() method. Non-strict is more permissive, e.g. flexible on white space, omitting
   thousands separators
  *fractional (Boolean|Array, optional):
  *Whether to include the fractional portion, where the number of decimal places are
   implied by pattern or explicit 'places' parameter. The value [true,false] makes the
   fractional portion optional.
  */
  mo.parseNumber = function(numStr, options){
    var _options = {
      locale: config.locale
    };
    lang.mixin(_options, options || {});
    try {
      var dn = dojoNumber.parse(numStr, _options);
      return dn;
    } catch(err) {
      console.error(err);
      return numStr;
    }
  };

  /*
  *Optional
  *An object with the following properties:
  *selector (String):
  *choice of 'time','date' (default: date and time)
  *formatLength (String):
  *choice of long, short, medium or full (plus any custom additions). Defaults to 'short'
  *datePattern (String):
  *override pattern with this string
  *timePattern (String):
  *override pattern with this string
  *am (String):
  *override strings for am in times
  *pm (String):
  *override strings for pm in times
  *locale (String):
  *override the locale used to determine formatting rules
  *fullYear (Boolean):
  *(format only) use 4 digit years whenever 2 digit years are called for
  *strict (Boolean):
  *(parse only) strict parsing, off by default
  */
  mo.localizeDate = function(d, options){
    var _options = {
      locale: config.locale,
      fullYear: true
    };
    lang.mixin(_options, options || {});

    if(config.locale === 'ar' && _options.formatLength !== 'long' && _options.formatLength !== 'full') {
      _options.formatLength = 'long';
    }

    try {
      var ld = dateLocale.format(d, _options);
      return ld;
    } catch(err) {
      console.error(err);
      if (_options.selector === 'date') {
        return d.toLocaleDateString();
      } else if (_options.selector === 'time') {
        return d.toLocaleTimeString();
      } else {
        return d.toLocaleString();
      }
    }
  };

  /*
  *n: Number
  *fieldInfo: https://developers.arcgis.com/javascript/jshelp/intro_popuptemplate.html
  */
  mo.localizeNumberByFieldInfo = function(n, fieldInfo) {
    var fn = null;
    var p = lang.exists('format.places', fieldInfo) && fieldInfo.format.places;
    fn = mo.localizeNumber(n, {
      places: p
    });

    if (lang.exists('format.digitSeparator', fieldInfo) && !fieldInfo.format.digitSeparator) {
      return fn.toString().replace(new RegExp('\\' + nlsBundle.group, "g"), "");
    } else {
      return fn;
    }
  };

  /*
  *d: an instance of date or number
    (the numeric value corresponding to the time for the specified date according to universal time)
  *fieldInfo: https://developers.arcgis.com/javascript/jshelp/intro_popuptemplate.html
  */
  mo.localizeDateByFieldInfo = function(d, fieldInfo) {
    var fd = null;
    try {
      var data = {
        date: d instanceof Date ? d.getTime() : d
      };
      var dateFormat = lang.exists('format.dateFormat', fieldInfo) ?
      fieldInfo.format.dateFormat : 'longMonthDayYear';

      var substOptions = {
        dateFormat: {
          properties: ['date'],
          formatter: 'DateFormat' + PopupTemplate.prototype._dateFormats[dateFormat]
        }
      };
      fd = esriLang.substitute(data, '${date}', substOptions);
    }catch (err) {
      console.error(err);
      fd = d;
    }

    return fd;
  };

  mo.getDatePatternsByFormat = function(dFormat){
    return PopupTemplate.prototype._dateFormatsJson[dFormat];
  };

  //show local dateTime format by fieldIndo configured
  mo.localizeDateTimeByFieldInfo = function(d, fieldInfo, enableTime, timeAccuracy) {
    var timePattern = {
      'h': 'h',
      'm': 'h:mm',
      's': 'h:mm:ss'
    };
    var timePattern24 = {
      'h': 'H',
      'm': 'H:mm',
      's': 'H:mm:ss'
    };

    var getDateFormatter = function(dFormat, timeAccuracy, addTimeSuffix){
      var _datePattern = mo.getDatePatternsByFormat(dFormat).datePattern;
      var _timePattern = timePattern[timeAccuracy];
      //add AM/PM when format is Time&12 or only hour.
      _timePattern = (addTimeSuffix || timeAccuracy === 'h') ?
       (timePattern[timeAccuracy] + ' a') : timePattern24[timeAccuracy];
      var dateFormatter = "(datePattern: '" + _datePattern + "', timePattern: '" + _timePattern +
        "', selector: 'date and time')";
      return dateFormatter;
    };

    var dateFormat, dateFormatter;
    var fd = null;
    try {
      var data = {
        date: d instanceof Date ? d.getTime() : d
      };

      if(lang.exists('format.dateFormat', fieldInfo)){
        var dFormat = fieldInfo.format.dateFormat;
        if(!enableTime){
          dateFormat = dFormat.split('ShortTime')[0].split('LongTime')[0];//exclude time
        }else if(dFormat.indexOf('Time') > 0){
          dateFormatter = getDateFormatter(dFormat, timeAccuracy, dFormat.indexOf('24') < 0);

        }else{//no time configured
          dateFormatter = getDateFormatter(dFormat, timeAccuracy);
        }
      }else{
        if(enableTime){
          dateFormatter = getDateFormatter('longMonthDayYear', timeAccuracy);
        }else{
          dateFormat = 'longMonthDayYear';
        }
      }

      dateFormatter = dateFormatter ? dateFormatter : PopupTemplate.prototype._dateFormats[dateFormat];

      var substOptions = {
        dateFormat: {
          properties: ['date'],
          formatter: 'DateFormat' + dateFormatter
        }
      };
      fd = esriLang.substitute(data, '${date}', substOptions);
    }catch (err) {
      console.error(err);
      fd = d;
    }

    return fd;
  };

  //get valide date time string to save in config
  mo.getDateTimeStr = function(d, showTime) {
    format = showTime ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD';
    var date = moment(d).format(format);
    return date;
  };

  //get a date from date time string(format needs to be valid)
  mo.getDateByDateTimeStr = function(d){
    return moment(d).toDate();//can't use new Date() for some date formats
  };

  //get date from date time string & date format
  //update to display date in the correct 'precision' when changing the configuration of date precision
  mo.getDateByDateTimeStrAndFormat = function(d, fieldInfo){
    var date = mo.getDateByDateTimeStr(d);
    if(lang.exists('format.dateFormat', fieldInfo)){
      var dFormat = fieldInfo.format.dateFormat;
      if(dFormat.indexOf('ShortTime') >= 0){
        date.setSeconds(0);
      }else if(dFormat.indexOf('Time') < 0){//day
        date.setHours(0);
        date.setMinutes(0);
        date.setSeconds(0);
      }
    }
    return date;
  };

  // get valide date time string in correct format configured to save in config. (date unique list)
  mo.getDateTimeStrByFieldInfo = function(d, fieldInfo) {
    var format = 'YYYY-MM-DD';
    if(lang.exists('format.dateFormat', fieldInfo)){
      var dFormat = fieldInfo.format.dateFormat;
      if(dFormat.indexOf('LongTime') >= 0){
        format = format + ' HH:mm:ss';
      }else if(dFormat.indexOf('ShortTime') >= 0){
        format = format + ' HH:mm';
      }
    }
    var date = moment(d).format(format);
    return date;
  };

  mo.fieldFormatter = {
    getFormattedUrl: function(str) {
      if (str && typeof str === "string") {
        var s = str.indexOf('http:');
        if (s === -1) {
          s = str.indexOf('https:');
        }
        if (s > -1) {
          if (str.indexOf('href=') === -1) {
            var e = str.indexOf(' ', s);
            if (e === -1) {
              e = str.length;
            }
            var nl = str.indexOf('\r\n', s) > -1 ? str.indexOf('\r\n', s) :
              str.indexOf('\n', s) > -1 ? str.indexOf('\n', s) : e;
            e = nl < e ? nl : e;
            var link = str.substring(s, e);
            str = str.substring(0, s) +
              '<A href="' + link + '" target="_blank">' + link + '</A>' +
              str.substring(e, str.length);
          }
        }
      }

      if(typeof str === undefined || str === null){
        return '';
      }

      return str;
    },

    getFormattedNumber: function(num, format) {
      if (typeof num === 'number') {
        var decimalStr = num.toString().split('.')[1] || "",
          decimalLen = decimalStr.length;
        num = mo.localizeNumberByFieldInfo(num, {
          format: {
            places: (format && typeof format.places === 'number') ?
              parseInt(format.places, 10) : decimalLen,
            digitSeparator: format && format.digitSeparator
          }
        });
        return '<span class="jimu-numeric-value">' + (num || "") + '</span>';
      }
      return num;
    },

    getFormattedDate: function(timeNumber, format) {
      if (typeof timeNumber === 'number' || timeNumber instanceof Date) {
        timeNumber = mo.localizeDateByFieldInfo(timeNumber, {
          'format': format
        });
      }
      return timeNumber || "";
    },

    //refer to getDisplayValueForCodedValueOrSubtype(layerDefinition, fieldName, attributes)
    getCodedValue: function(domain, v) {
      if (domain && domain.codedValues) {
        for (var i = 0, len = domain.codedValues.length; i < len; i++) {
          var cv = domain.codedValues[i];
          if (esriLang.isDefined(v) && lang.exists('code', cv) &&
            v.toString() === cv.code.toString()) {
            return cv.name;
          }
        }
        return v;
      } else {
        return v || null;
      }
    },

    getTypeName: function(value, types) {
      var len = types.length;
      for (var i = 0; i < len; i++) {
        if (value === types[i].id) {
          return types[i].name;
        }
      }
      return value;
    }
  };

  mo.addRelativePathInCss = addRelativePathInCss;

  mo.url = {
    isAbsolute: function(url){
      if(!url){
        return false;
      }
      return url.startWith('http') || url.startWith('/');
    },

    removeQueryParamFromUrl: function(url, paramName){
      var urlObject = esriUrlUtils.urlToObject(url);
      if(urlObject.query){
        delete urlObject.query[paramName];
      }
      var ret = urlObject.path;
      for(var q in urlObject.query){
        if(ret === urlObject.path){
          ret = ret + '?' + q + '=' + urlObject.query[q];
        }else{
          ret = ret + '&' + q + '=' + urlObject.query[q];
        }
      }
      return ret;
    },

    addQueryParamToUrl: function(url, paramName, paramValue){
      var urlObject = esriUrlUtils.urlToObject(url);
      if(!urlObject.query){
        urlObject.query = {};
      }
      urlObject.query[paramName] = paramValue;
      var ret = urlObject.path;
      for(var q in urlObject.query){
        if(ret === urlObject.path){
          ret = ret + '?' + q + '=' + urlObject.query[q];
        }else{
          ret = ret + '&' + q + '=' + urlObject.query[q];
        }
      }
      return ret;
    },

    compareUrl: function(url1, url2) {
      var _url1, _url2;
      _url1 = this.getUrlPath(url1);
      _url2 = this.getUrlPath(url2);

      _url1 = portalUrlUtils.removeProtocol(_url1.toString().toLowerCase()).replace(/\/+/g, '/');
      _url2 = portalUrlUtils.removeProtocol(_url2.toString().toLowerCase()).replace(/\/+/g, '/');

      return _url1 === _url2;
    },

    getUrlPath: function(url) {
      var urlObject = esriUrlUtils.urlToObject(url);
      return urlObject.path;
    }

  };
  	mo.sleep = function(ms) {
		var unixtime_ms = new Date().getTime();
		while (new Date().getTime() < unixtime_ms + ms) {
		}
	};
  	mo.checkOnCheckbox = function(chkbox) {
		chkbox.checked = true;
	    if ("createEvent" in document) {
	        var evt = document.createEvent("HTMLEvents");
	        evt.initEvent("change", false, true);
	        chkbox.dispatchEvent(evt);
	    } else {
	        chkbox.fireEvent("onchange");
	    }  
	};	
	mo.getPopups = function (layer) {
		var infoTemplateArray = {};
		if (layer.layers) {
			array.forEach(layer.layers, function (subLayer) {
				var _infoTemp = subLayer.popup;
				var popupInfo = {};
				popupInfo.title = _infoTemp.title;
				if (_infoTemp.description) {
					popupInfo.description = _infoTemp.description;
				} else {
					popupInfo.description = null;
				}
				if (_infoTemp.fieldInfos) {
					popupInfo.fieldInfos = _infoTemp.fieldInfos;
				}
				var _popupTemplate = new PopupTemplate(popupInfo);
				infoTemplateArray[subLayer.id] = {
					infoTemplate: _popupTemplate
				};
			});
		} else if (layer.popup) {
			var _popupTemplate = new PopupTemplate(layer.popup);
			infoTemplateArray[0] = {
				infoTemplate: _popupTemplate
			}
		}
		return infoTemplateArray;
	};
    mo.initTileLayer = function (urlTiledMapService, tiledLayerId) {//default is level 8
        dojo.declare("myTiledMapServiceLayer", esri.layers.TiledMapServiceLayer, {
            constructor: function () {
                this.spatialReference = new esri.SpatialReference({
                        wkid: 102100
                    });
                this.initialExtent = (this.fullExtent = new esri.geometry.Extent(-13899346.378, 2815952.218899999, -7445653.2326, 6340354.452, this.spatialReference));
                this.tileInfo = new esri.layers.TileInfo({
                        "rows": 256,
                        "cols": 256,
                        "dpi": 96,
                        "format": "PNG",
                        "compressionQuality": 0,
                        "origin": {
                            "x": -20037508.342787,
                            "y": 20037508.342787
                        },
                        "spatialReference": {
                            "wkid": 102100
                        },
                        "lods": [{
                                level: 0,
                                resolution: 156543.03392800014,
                                scale: 591657527.591555
                            }, {
                                level: 1,
                                resolution: 78271.51696399994,
                                scale: 295828763.795777
                            }, {
                                level: 2,
                                resolution: 39135.75848200009,
                                scale: 147914381.897889
                            }, {
                                level: 3,
                                resolution: 19567.87924099992,
                                scale: 73957190.948944
                            }, {
                                level: 4,
                                resolution: 9783.93962049996,
                                scale: 36978595.474472
                            }, {
                                level: 5,
                                resolution: 4891.96981024998,
                                scale: 18489297.737236
                            }, {
                                level: 6,
                                resolution: 2445.98490512499,
                                scale: 9244648.868618
                            }, {
                                level: 7,
                                resolution: 1222.992452562495,
                                scale: 4622324.434309
                            }, {
                                level: 8,
                                resolution: 611.4962262813797,
                                scale: 2311162.217155
                            }
                        ]
                    });
                this.loaded = true;
                this.onLoad(this);
                //this.visible = false;
                this.visible = true;
                this.id = tiledLayerId;
            },
            getTileUrl: function (level, row, col) {
                return urlTiledMapService +
                "L" + dojo.string.pad(level, 2, '0') + "/" + "R" + dojo.string.pad(row.toString(16), 8, '0') + "/" + "C" + dojo.string.pad(col.toString(16), 8, '0') + "." + "png";
            }
        });  
  };
    mo.initTileLayer12 = function (urlTiledMapService, tiledLayerId) {
        dojo.declare("myTiledMapServiceLayer12", esri.layers.TiledMapServiceLayer, {
            constructor: function () {
                this.spatialReference = new esri.SpatialReference({
                        wkid: 102100
                    });
                this.initialExtent = (this.fullExtent = new esri.geometry.Extent(-13899346.378, 2815952.218899999, -7445653.2326, 6340354.452, this.spatialReference));
                this.tileInfo = new esri.layers.TileInfo({
                        "rows": 256,
                        "cols": 256,
                        "dpi": 96,
                        "format": "PNG",
                        "compressionQuality": 0,
                        "origin": {
                            "x": -20037508.342787,
                            "y": 20037508.342787
                        },
                        "spatialReference": {
                            "wkid": 102100
                        },
                        "lods": [{
                                level: 0,
                                resolution: 156543.03392800014,
                                scale: 591657527.591555
                            }, {
                                level: 1,
                                resolution: 78271.51696399994,
                                scale: 295828763.795777
                            }, {
                                level: 2,
                                resolution: 39135.75848200009,
                                scale: 147914381.897889
                            }, {
                                level: 3,
                                resolution: 19567.87924099992,
                                scale: 73957190.948944
                            }, {
                                level: 4,
                                resolution: 9783.93962049996,
                                scale: 36978595.474472
                            }, {
                                level: 5,
                                resolution: 4891.96981024998,
                                scale: 18489297.737236
                            }, {
                                level: 6,
                                resolution: 2445.98490512499,
                                scale: 9244648.868618
                            }, {
                                level: 7,
                                resolution: 1222.992452562495,
                                scale: 4622324.434309
                            }, {
                                level: 8,
                                resolution: 611.4962262813797,
                                scale: 2311162.217155
                            }, {
                                level: 9,
                                resolution: 305.748113140558,
                                scale: 1155581.108577
                            }, {
                                level: 10,
                                resolution: 152.874056570411,
                                scale: 577790.554289
                            }, {
                                level: 11,
                                resolution: 76.4370282850732,
                                scale: 288895.277144
                            }, {
                                level: 12,
                                resolution: 38.2185141425366,
                                scale: 144447.638572
                            }
                        ]
                    });
                this.loaded = true;
                this.onLoad(this);
                //this.visible = false;
                this.visible = true;
                this.id = tiledLayerId;
            },
            getTileUrl: function (level, row, col) {
                return urlTiledMapService +
                "L" + dojo.string.pad(level, 2, '0') + "/" + "R" + dojo.string.pad(row.toString(16), 8, '0') + "/" + "C" + dojo.string.pad(col.toString(16), 8, '0') + "." + "png";
            }
        });  
  };
  mo.processUrlInWidgetConfig = function(url, widgetFolderUrl){
    if(!url){
      return;
    }
    if(url.startWith('data:') || url.startWith('http') || url.startWith('/')){
      return url;
    }else if(url.startWith('${appPath}')){
      return url.replace('${appPath}', window.appInfo.appPath);
    }else{
      return widgetFolderUrl + url;
    }
  };

  mo.processUrlInAppConfig = function(url){
    if(!url){
      return;
    }
    if(url.startWith('data:') || url.startWith('http') || url.startWith('/')){
      return url;
    }else{
      return window.appInfo.appPath + url;
    }
  };

  mo.getLocationUrlWithoutHashAndQueryParams = function(){
    //url:https://gallery.chn.esri.com:3344/webappbuilder/?action=setportalurl
    //result:https://gallery.chn.esri.com:3344/webappbuilder/
    var loc = window.location;
    var retUrl = loc.protocol + "//" + loc.host + loc.pathname;

    var urlObject = esriUrlUtils.urlToObject(loc.href);
    if(urlObject.query && urlObject.query.apiurl){
      retUrl = mo.url.addQueryParamToUrl(retUrl, 'apiurl', urlObject.query.apiurl);
    }

    return retUrl;
  };

  mo.getDefaultWebMapThumbnail = function(){
    return require.toUrl('jimu/images/webmap.png');
  };

  mo.invertColor = function(hexTripletColor) {
    var color = hexTripletColor;
    color = color.substring(1);           // remove #
    if (color.length === 3) {
      color = color.slice(0, 1) +
              color.slice(0, 1) +
              color.slice(1, 1) +
              color.slice(1, 1) +
              color.slice(2, 1) +
              color.slice(2, 1);
    }
    color = parseInt(color, 16);          // convert to integer
    if(color > 7829367) {
      return "#000000";
    } else {
      return "#ffffff";
    }
  };

  mo.isLightColor = function(colorHex){
    var color = colorHex;
    color = color.substring(1);           // remove #
    if (color.length === 3) {
      color = color.slice(0, 1) +
              color.slice(0, 1) +
              color.slice(1, 1) +
              color.slice(1, 1) +
              color.slice(2, 1) +
              color.slice(2, 1);
    }
    color = parseInt(color, 16);          // convert to integer
    if(color > 7829367) {
      return true;
    } else {
      return false;
    }
  };

  /*
  Mixin config2 to config1, return the mixed object, but do not modify config1.
  What to mixin:
    replace widget's position, group's panel position, map's position.
  */
  mo.mixinAppConfigPosition = function(config1, config2){
    var mixinConfig = lang.clone(config1);
    if(!config2){
      return mixinConfig;
    }
    config2 = lang.clone(config2);
    var os1 = mixinConfig.widgetOnScreen;
    var os2 = config2.widgetOnScreen;
    if(os2 && os2.widgets){
      if(Object.prototype.toString.call(os2.widgets) ===
        '[object Object]'){

        array.forEach(os1.widgets, function(widget1, i){
          var k;
          if(widget1.uri){
            k = widget1.uri;
          }else{
            k = 'ph_' + i;
          }

          if(os2.widgets[k] && os2.widgets[k].position){
            if(!os2.widgets[k].position.relativeTo){
              os2.widgets[k].position.relativeTo = 'map';
            }
            widget1.position = os2.widgets[k].position;
          }
        }, this);
      }else{
        array.forEach(os2.widgets, function(widget2, i){
          if(widget2.position && !widget2.position.relativeTo){
            widget2.position.relativeTo = 'map';
          }
          if(os1.widgets[i] && widget2.position){
            os1.widgets[i].position = widget2.position;
          }
        });
      }
    }

    if(os2 && os2.groups){
      if(Object.prototype.toString.call(os2.groups) ===
        '[object Object]'){

        array.forEach(os1.groups, function(group1, i){
          var k;
          if(group1.label){
            k = group1.label;
          }else{
            k = 'g_' + i;
          }

          if(os2.groups[k] && os2.groups[k].panel && os2.groups[k].panel.position){
            if(!os2.groups[k].panel.position.relativeTo){
              os2.groups[k].panel.position.relativeTo = 'map';
            }
            group1.panel.position = os2.groups[k].panel.position;
          }
        }, this);
      }else{
        var managerName;
        if(config1.layoutDefinition){
          managerName = config1.layoutDefinition.manager;
        }else{
          managerName = 'jimu/layoutManagers/AbsolutePositionLayoutManager';
        }

        if(managerName === 'jimu/layoutManagers/AbsolutePositionLayoutManager'){
          array.forEach(os2.groups, function(group2, i){
            if(group2.panel && group2.panel.position &&
              !group2.panel.position.relativeTo){
              group2.panel.position.relativeTo = 'map';
            }
            if(os1.groups[i] && group2.panel && group2.panel.position){
              os1.groups[i].panel.position = group2.panel.position;
            }
          });
        }else if(managerName === 'jimu/layoutManagers/GridLayoutManager'){
          os1.groups = handleGridLayoutOnScreenGroupChange(os1.groups, os2.groups.map(function(g){
            return g.id;
          }));
        }
      }
    }

    if(config2.map && config2.map.position){
      if(mixinConfig.map){
        mixinConfig.map.position = config2.map.position;
      }else{
        mixinConfig.map = {position: config2.map.position};
      }
    }

    if(config2.widgetPool && config2.widgetPool.panel){
      if(config2.widgetPool.panel.position && !config2.widgetPool.panel.position.relativeTo){
        config2.widgetPool.panel.position.relativeTo = 'map';
      }
      mixinConfig.widgetPool.panel.position = config2.widgetPool.panel.position;
    }

    //mobileLayout is used to override it's main config, so replace totally
    if(config2.mobileLayout){
      mixinConfig.mobileLayout = config2.mobileLayout;
    }
    return mixinConfig;
  };

  function handleGridLayoutOnScreenGroupChange(oldGroups, newGroupIds){
    var oldGroupIds = oldGroups.map(function(g){
      return g.id;
    });

    array.forEach(newGroupIds, function(gId){
      if(oldGroupIds.indexOf(gId) < 0){// new add group
        oldGroups.push({
          id: gId,
          widgets: []
        });
      }
    }, this);

    var removedGroups = [];
    oldGroups = array.filter(oldGroups, function(g){
      if(newGroupIds.indexOf(g.id) < 0){// group is removed
        removedGroups.push(g);
        return false;
      }else{
        return true;
      }
    }, this);

    if(oldGroups.length === 0){
      return [];
    }
    //put widgets in removed groups into the last group
    var toAddGroup = oldGroups[oldGroups.length - 1];
    array.forEach(removedGroups, function(removedGroup){
      toAddGroup.widgets = toAddGroup.widgets.concat(removedGroup.widgets);
    }, this);

    oldGroups = oldGroups.sort(function(g1, g2){
      return newGroupIds.indexOf(g1.id) - newGroupIds.indexOf(g2.id);
    });

    return oldGroups;
  }

  mo.handleGridLayoutOnScreenGroupChange = handleGridLayoutOnScreenGroupChange;

  /**********************************
   * About template
   **********************************/

  // reset some field of config by template config.
  function getOrSetConfigByTemplate(config, key, value) {
    //config: Object
    //  the destination config object
    //key: String
    //  the key value relative to the config object, like this: app_p1_p2[0], app_p1_p2[1]--
    //value: String
    // value is undefined: get the value correspond to the key and save to 'value' param.
    // value is not undefined: set the value of key.
    var keyArray = convertToKeyArray(key);

    var obj = config;
    for (var i = 1; i < keyArray.length - 1; i++) {
      obj = getSubObj(obj, keyArray[i]);
      if (!obj) {
        return;
      }
    }

    if (keyArray[keyArray.length - 1].deleteFlag) {
      if (value === true) {
        if (lang.isArray(obj[keyArray[keyArray.length - 1].key])) {
          delete obj[keyArray[keyArray.length - 1].key][keyArray[keyArray.length - 1].index];
        } else {
          delete obj[keyArray[keyArray.length - 1].key];
        }
      }
    } else {
      if (lang.isArray(obj[keyArray[keyArray.length - 1].key])) {
        if(value === undefined) {
          // get value to valueParam
          return obj[keyArray[keyArray.length - 1].key][keyArray[keyArray.length - 1].index];
        } else {
          // set value to config
          obj[keyArray[keyArray.length - 1].key][keyArray[keyArray.length - 1].index] = value;
        }
      } else {
        if(value === undefined) {
          return obj[keyArray[keyArray.length - 1].key];
        } else {
          obj[keyArray[keyArray.length - 1].key] = value;
        }
      }
    }

    function getSubObj(obj, keyInfo) {
      if (lang.isArray(obj[keyInfo.key])) {
        return obj[keyInfo.key][keyInfo.index];
      } else {
        return obj[keyInfo.key];
      }
    }

    function convertToKeyArray(str) {
      var arrayKey = [];
      str.split('_').forEach(function(str) {
        var deleteFlag = false;
        var pos;
        if (str.slice(str.length - 2) === "--") {//Builder will not export this kind of key.
          deleteFlag = true;
          str = str.slice(0, str.length - 2);
        }
        pos = str.search(/\[[0-9]+\]/);
        if (pos === -1) {
          (pos = str.length);
        }
        arrayKey.push({
          "key": str.slice(0, pos),
          "index": Number(str.slice(pos + 1, -1)),
          "deleteFlag": deleteFlag
        });
      });
      return arrayKey;
    }
  }



  // reset some field of config by template config.
  function getOrSetConfigByTemplateWithId(config, key, value) {
    //config: Object
    //  the destination config object
    //key: String
    //  the key value relative to the config object, like this: app_p1_p2[0], app_p1_p2[1]--;
    //  howover, if the key is a wiget element, the key like this: app_p1_p2[widgetId];
    //  does not set anything if the key is not valid.
    //value: String
    // value is undefined: get the value correspond to the key and return value.
    // value is not undefined: set the value of key.



    // section means widget or group
    var groupSearchStr  = "groups\\[.+\\]";
    var widgetSearchStr = "widgets\\[.+\\]";
    var sectionConfig = config;

    key = key.replace(/\//g, '_');
    var sectionKey    = key;

    // Do not merge fields that in the widget config,
    // beacuse widgetConfig has not been loaded before open
    // widget if the widget has not been edited yet.
    // Merge it when first open widget(In Widgetmanager.js).
    //
    // if(key.search("widgets\\[.+\\]_config") >= 0) {
    //   return;
    // }
    // does not neet to "return null", regarde widget_config_key as invalid key.

    // handle groups
    var groupInfo = getSectionObject(groupSearchStr);
    if (groupInfo.state === "deleted") {
      return;
    } else if (groupInfo.state === "isSection") {
      sectionConfig = groupInfo.object;
      sectionKey = groupInfo.key;
    }

    // handle widgets
    var widgetInfo = getSectionObject(widgetSearchStr);
    if (widgetInfo.state === "delete") {
      return;
    } else if (widgetInfo.state === "isSection") {
      sectionConfig = widgetInfo.object;
      sectionKey = widgetInfo.key;
    }

    return getOrSetConfigByTemplate(sectionConfig, sectionKey, value);

    function getSectionObject(sectionSearchStr) {
      var sectionRange = mo.template.getSearchRange(key, sectionSearchStr, "]");
      var sectionStr   = key.slice(sectionRange.firstPos, sectionRange.lastPos);// section[abcd]
      // It's section node.
      if (sectionRange.firstPos !== -1) {
        var sectionId = key.slice(sectionRange.firstPos + sectionStr.indexOf('[') + 1,
          sectionRange.lastPos - 1);
        var subKey   = key.slice(sectionRange.lastPos + 1);
        var sectionObject = mo.getConfigElementById(config, sectionId);
        if (sectionObject) {
          return {
            object: sectionObject,
            key:  "section_" + subKey,
            state: "isSection"
          };
        } else {
          // means the section had been deleted.
          return {
            state: "deleted"
          };
        }
      } else {
        //It is not a section node.
        return {
          state: "isNotSection"
        };
      }
    }
  }


  mo.template = {
    groupIdentification: "groups\\[.+\\]",

    widgetIdentification: "widgets\\[.+\\]",

    getSearchRange: function(srcStr, searchStr, lastString) {
      // return value:{
      //   firstPos:
      //   lastPos:
      //}
      // if firstPos === -1: does not find searchStr from srcStr
      var posResult = -1, regExp, pos1, pos2, tempStr;
      regExp = new RegExp(searchStr);
      pos1 = srcStr.search(regExp);
      if (pos1 >= 0 ) {
        tempStr = srcStr.slice(pos1, srcStr.length);
        pos2 = tempStr.indexOf(lastString);
        posResult = pos1 + pos2 + lastString.length;
      }
      return {
        firstPos: pos1,
        lastPos: posResult
      };
    },

    setConfigValue: function(config, key, value) {
      //config: Object
      //  the destination config object
      //key: String
      //  the key value relative to the config object, like this: app_p1_p2[0], app_p1_p2[1]--
      getOrSetConfigByTemplate(config, key, value);
    },

    getConfigValue: function(config, key) {
      //config: Object
      //  the destination config object
      //key: String
      //  the key value relative to the config object, like this: app_p1_p2[0], app_p1_p2[1]--
      // return value:
      //  return value of key of config.
      //  return 'undefined' if the key is invalid.
      return getOrSetConfigByTemplate(config, key);
    },

    setConfigValueWithId: function(config, key, value) {
      //config: Object
      //  the destination config object
      //key: String
      //  the key value relative to the config object, like this: app_p1_p2[0], app_p1_p2[1]--
      //  howover, if the key is a wiget element, the key like this: app_p1_p2[widgetId]
      getOrSetConfigByTemplateWithId(config, key, value);
    },

    getConfigValueWithId: function(config, key) {
      //config: Object
      //  the destination config object
      //key: String
      //  the key value relative to the config object, like this: app_p1_p2[0], app_p1_p2[1]--
      //  howover, if the key is a wiget element, the key like this: app_p1_p2[widgetId]
      // return value:
      //  return value of key of config.
      //  return 'undefined' if the key is invalid.
      return getOrSetConfigByTemplateWithId(config, key);
    },

    getKeyInfo: function(key){
      var widgetId = this.getWidgetIdByKey(key);
      if(widgetId !== null){
        return {
          type: 'widget',
          id: widgetId
        };
      }else{
        var groupId = this.getGroupIdByKey(key);
        if(groupId !== null){
          return {
            type: 'group',
            id: groupId
          };
        }else{
          return {
            type: 'unknow', //TODO
            id: null
          };
        }
      }
    },

    getWidgetIdByKey: function(key) {
      //key: String
      //  the key value relative to the config object, like this: app_p1_p2[0], app_p1_p2[1]--
      // id: if its a widget.
      // null: it is not a widget
      var widgetId;
      var widgetRange = mo.template.getSearchRange(key,
                                                   mo.template.widgetIdentification, "]");
      if(widgetRange.firstPos === -1) {
        widgetId = null;
      } else {
        // widget[widget_id]
        var widgetStr  = key.slice(widgetRange.firstPos, widgetRange.lastPos);
        widgetId = key.slice(widgetRange.firstPos + widgetStr.indexOf('[') + 1,
                                       widgetRange.lastPos - 1);
      }
      return widgetId;

    },

    getGroupIdByKey: function(key) {
      //key: String
      //  the key value relative to the config object, like this: app_p1_p2[0], app_p1_p2[1]--
      //return value:
      // id: if its a group.
      // null: it is not a group

      //TODO widget in group should be widget
      var groupId;
      var groupRange = mo.template.getSearchRange(key,
                                                   mo.template.groupIdentification, "]");
      if(groupRange.firstPos === -1) {
        groupId = null;
      } else {
        // group[group_id]
        var groupStr  = key.slice(groupRange.firstPos, groupRange.lastPos);
        groupId = key.slice(groupRange.firstPos + groupStr.indexOf('[') + 1,
                                       groupRange.lastPos - 1);
      }
      return groupId;
    },


    getConfigedWidgetsByTemplateConfig: function(templateConfig) {
      var widgetIds = [];
      var widgetConfigIdentification = mo.template.widgetIdentification + "_config";
      var widgetConfigRange;

      array.forEach(templateConfig.configurationSettings, function(category) {
        array.forEach(category.fields, function(field) {
          if(field.fieldName) {
            widgetConfigRange = mo.template.getSearchRange(field.fieldName,
                                            widgetConfigIdentification, "]");
            if(widgetConfigRange.firstPos >= 0) {
              // the widget has config property.
              pushWithoutRepeat(widgetIds, mo.template.getWidgetIdByKey(field.fieldName));
            }
          }
        }, this);
      }, this);

      return widgetIds;

      function pushWithoutRepeat(desArray, value) {
        if(desArray.indexOf(value) === -1) {
          desArray.push(value);
        }
      }
    },

    // getConfigedWidgetsByTemplateAppConfig: function(templateAppConfig) {
    //   // return value.
    //   //   widget IDs arrary that contain all widgets which have been configed.

    //   var widgetIds = [];
    //   var widgetConfigIdentification = mo.template.widgetIdentification + "_config";
    //   var widgetConfigRange;

    //   for (var key in templateAppConfig.values) {
    //     if(templateAppConfig.values.hasOwnProperty(key) &&
    //        (typeof templateAppConfig.values[key] !== 'function')) {
    //       widgetConfigRange = mo.template.getSearchRange(key,
    //                                       widgetConfigIdentification, "]");
    //       if(widgetConfigRange.firstPos >= 0) {
    //         // the widget has config property.
    //         pushWithoutRepeat(widgetIds, mo.template.getWidgetIdByKey(key));
    //       }
    //     }
    //   }

    //   return widgetIds;

    //   function pushWithoutRepeat(desArray, value) {
    //     if(desArray.indexOf(value) === -1) {
    //       desArray.push(value);
    //     }
    //   }
    // },

    mergeTemplateAppConfigToAppConfig: function(appConfig, templateAppConfig, webmapInfo){
      //webmapInfo != undefined means templateAppConfig is from AGOL,
      //use this webmap info in appConfig
      var i;
      var screenSectionConfig = appConfig.widgetOnScreen;
      var portalUrl = appConfig.portalUrl;

      //Both WAB template app and AGOL template app have webmap value
      if(templateAppConfig.values.webmap){
        //app created from mycontent has no webmap
        appConfig.map.itemId = templateAppConfig.values.webmap;
      }

      if(webmapInfo){
        // use default mapOptions of current webmap.
        if(appConfig.map.mapOptions){
          mo.deleteMapOptions(appConfig.map.mapOptions);
        }
        appConfig.map.portalUrl = portalUrl;

        if (!templateAppConfig.values.app_title) {
          templateAppConfig.values.app_title = webmapInfo.title;
        }
        if (!templateAppConfig.values.app_subtitle) {
          templateAppConfig.values.app_subtitle = webmapInfo.snippet;
        }
      }

      //merge values
      for (var key in templateAppConfig.values) {
        if (key !== "webmap") {
          mo.template.setConfigValueWithId(appConfig, key, templateAppConfig.values[key]);
        }
      }

      reorder();

      function reorder() {
        //reorderWidgets
        appConfig.widgetPool.widgets = reorderWidgets(appConfig.widgetPool.widgets);
        screenSectionConfig.widgets = reorderWidgets(screenSectionConfig.widgets);
        if (appConfig.widgetPool.groups) {
          for (i = 0; i < appConfig.widgetPool.groups.length; i++) {
            appConfig.widgetPool.groups[i].widgets =
            reorderWidgets(appConfig.widgetPool.groups[i].widgets);
          }
        }
        if (screenSectionConfig.groups) {
          for (i = 0; i < screenSectionConfig.groups.length; i++) {
            screenSectionConfig.groups[i].widgets =
            reorderWidgets(screenSectionConfig.groups[i].widgets);
          }
        }
      }

      function reorderWidgets(widgetArray) {
        var tempWidgets = [];
        array.forEach(widgetArray, function(widget) {
          if (widget) {
            tempWidgets.push(widget);
          }
        }, this);
        return tempWidgets;
      }

      return appConfig;
    }
  };

  //remove the options that are relative to map's display
  //this method should be called when map is changed.
  mo.deleteMapOptions = function(mapOptions){
    if(!mapOptions){
      return;
    }
    delete mapOptions.extent;
    delete mapOptions.lods;
    delete mapOptions.center;
    delete mapOptions.scale;
    delete mapOptions.zoom;
    delete mapOptions.maxScale;
    delete mapOptions.maxZoom;
    delete mapOptions.minScale;
    delete mapOptions.minZoom;
  };

  mo.graphicsExtent = function(graphics, /* optional */ factor){
    var ext = null;
    try {
      if(graphics.length > 0){
        //if graphics.length === 1 and the graphic is a point, it will throw an Exception here
        ext = graphicsUtils.graphicsExtent(graphics);
        if (ext) {
          if(typeof factor === "number" && factor > 0){
            ext = ext.expand(factor);
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
    return ext;
  };

  mo.sanitizeHTML = function(snippet){
    /* global html_sanitize */
    if (!snippet) {
      return snippet;
    }

    //https://code.google.com/p/google-caja/wiki/JsHtmlSanitizer
    return html_sanitize(snippet, function(url){
      return url;
    }, function(v){
      return v;
    });
  };

  mo.stripHTML = function (str){
    if (!str) {
      return str;
    }
    if (str.indexOf("<") > -1 && str.indexOf(">") > -1) {
      // this gets pretty slow if the string is long and has a < and no >
      var matchTag = /<(?:.|\s)*?>/g;
      return str.replace(matchTag, "");
    } else {
      return str;
    }
  };

  mo.encodeHTML = function (source) {
    return String(source)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  mo.removeSuffixSlashes = function(url){
    return url.replace(/\/*$/g, '');
  };

  mo.getBestDisplayAttributes = function(attributes, fieldInfos) {
    var displayAttributes = {};
    var displayValue = null;
    for (var fieldName in attributes) {
      displayValue = mo.getBestDisplayValue(fieldName, attributes, fieldInfos);
      displayAttributes[fieldName] = displayValue;
    }
    return displayAttributes;
  };

  mo.getBestDisplayValue = function(fieldName, attributes, fieldInfoOrFieldInfos) {
    var displayValue = "";
    var fieldInfo = null;
    if (lang.isArrayLike(fieldInfoOrFieldInfos)) {
      var fieldInfos = fieldInfoOrFieldInfos;
      fieldInfo = mo.getFieldInfoByFieldName(fieldInfos, fieldName);
    } else if (typeof fieldInfoOrFieldInfos === 'object') {
      if(fieldInfoOrFieldInfos.name === fieldName){
        fieldInfo = fieldInfoOrFieldInfos;
      }
    }

    if (fieldInfo) {
      displayValue = attributes[fieldName];
      if (fieldInfo.type === 'esriFieldTypeDate') {
        if (displayValue) {
          var date = new Date(parseInt(displayValue, 10));
          displayValue = mo._tryLocaleDate(date);
        }
      } else {
        if (typeof displayValue === 'number') {
          if (fieldInfo.domain && fieldInfo.domain.type === 'codedValue') {
            array.some(fieldInfo.domain.codedValues, function(codedValue) {
              if (codedValue.code === displayValue) {
                displayValue = codedValue.name;
                return true;
              }
            });
          } else {
            displayValue = mo._tryLocaleNumber(displayValue);
          }
        }
      }
    }

    if (displayValue === null || displayValue === undefined) {
      displayValue = "";
    }

    return displayValue;
  };

  //only get codedValues in field domain
  //return [{value,label}], return null means not coded value field
  mo._getCodedValues = function(fieldInfo) {
    var codedValues = null;
    var domain = fieldInfo.domain;
    if (domain && domain.type === 'codedValue') {
      if (domain.codedValues && domain.codedValues.length > 0) {
        codedValues = domain.codedValues;
        //{code,name}=>{value,label}
        //code is value and name is description
        codedValues = array.map(codedValues, lang.hitch(this, function(item) {
          return {
            value: item.code,
            label: item.name
          };
        }));
      }
    }
    return codedValues;
  };

  //get subtypes list in subtypes property
  //return [{value,label}], return null means no subtypes
  mo._getSubTypes = function(layerDefinition) {
    var subTypes = null;
    if (layerDefinition.subtypeField && layerDefinition.subtypes && layerDefinition.subtypes.length > 0) {
      //{id,name}=>{value,label}
      subTypes = array.map(layerDefinition.subtypes, lang.hitch(this, function(item) {
        return {
          value: item.id,
          label: item.name
        };
      }));
    }
    return subTypes;
  };

  //get renders list in types property
  //return [{value,label}], return null means no render types
  mo._getRenderTypes = function(layerDefinition) {
    var subTypes = null;
    if (layerDefinition.typeIdField && layerDefinition.types && layerDefinition.types.length > 0) {
      //{id,name}=>{value,label}
      subTypes = array.map(layerDefinition.types, lang.hitch(this, function(item) {
        return {
          value: item.id,
          label: item.name
        };
      }));
      //update labels by render
      // subTypes = mo._updateCodedValueListFromRender(layerDefinition, subTypes);
    }
    return subTypes;
  };

  //return [{value,label}], maybe return null
  mo._getCodedValueOrSubtypes = function(layerDefinition, fieldName, /*optional*/ typeIdFieldValue){
    //http://servicesdev1.arcgis.com/5uh3wwYLNzBuU0Eu/arcgis/rest/services/CarsandLivingThings/FeatureServer/0?f=pjson
    var fieldInfo = mo.getFieldInfoByFieldName(layerDefinition.fields, fieldName);
    var codedValues;
    //query codedvalue from types-domain
    if(typeIdFieldValue !== undefined && typeIdFieldValue !== null){ //it can be 0(number)
      codedValues = mo._getCodedValueBySubTypeId(layerDefinition, fieldName, typeIdFieldValue, /*optional*/fieldInfo);
    }else{
      codedValues = mo._getAllCodedValue(layerDefinition, fieldInfo);
    }
    return codedValues;

    /*
    //http://servicesdev1.arcgis.com/5uh3wwYLNzBuU0Eu/arcgis/rest/services/CarsandLivingThings/FeatureServer/0?f=pjson
    var fieldInfo = mo.getFieldInfoByFieldName(layerDefinition.fields, fieldName);
    //check normal coded values
    var codedValues = mo._getCodedValues(fieldInfo);//[{value,label}]

    if(!codedValues || codedValues.length === 0){
      if (layerDefinition.typeIdField) {
        var subTypes = mo._getRenderTypes(layerDefinition);//[{value,label}]

        //typeIdField maybe doesn't match the real subtype field exactly
        if (layerDefinition.typeIdField.toUpperCase() === fieldName.toUpperCase()) {
          //check subtypes
          codedValues = subTypes;
        }else{
          //check codedvalues related to subtype
          if(typeIdFieldValue !== undefined && typeIdFieldValue !== null){
            if(layerDefinition.types && layerDefinition.types.length > 0){
              array.some(layerDefinition.types, lang.hitch(this, function(item){
                if(item.name === typeIdFieldValue){
                  if(item.type === 'codedValue'){
                    codedValues = item.codedValues;
                  }
                  return true;
                }else{
                  return false;
                }
              }));
            }
          }
        }
      }
    }
    return codedValues;
    */
  };

  //return {isCodedValueOrSubtype,displayValue}
  mo._getDisplayValueForCodedValueOrSubtype = function(layerDefinition, fieldName, fieldValue,
    /*optional*/ typeIdFieldValue){
    var result = {
      isCodedValueOrSubtype: false,
      displayValue: fieldValue + ''//convert it to a string if it's a numberical value.
    };

    //[{value,label}]
    var codedValues = mo._getCodedValueOrSubtypes(layerDefinition, fieldName, typeIdFieldValue);

    if(codedValues && codedValues.length > 0){
      array.some(codedValues, lang.hitch(this, function(item){
        if(item.value === fieldValue){
          result = {
            isCodedValueOrSubtype: true,
            displayValue: item.label
          };
          return true;
        }else{
          return false;
        }
      }));
    }
    return result;
  };


  // Delete subtype related properties for 6.3 ---temp function
  // subtypeField(string fieldName), subtypes(array)
  // These two properties are used to verify if a layer has subtype field,
  // we can get subtype field name by subtypeField property, get subtype configuration by subtypes property.
  // But right now, this is not yet supported with online or enterprise hosted feature services.
  //                Only enterprise gdb based feature survices have it(10.5 added).
  // It's hard to prepare this condition to test it now, so leave it to next release.
  mo._deleteSubtypePropertiesTemp = function(layerDefinition){
    delete layerDefinition.subtypeField;
    delete layerDefinition.subtypes;
  };

  //get display label by code from a feature attributes
  //attributes is feature's attributes
  //return {isCodedValueOrSubtype,displayValue}
  mo.getDisplayValueForCodedValueOrSubtype = function(layerDefinition, fieldName, attributes){
    mo._deleteSubtypePropertiesTemp(layerDefinition);
    var fieldValue = attributes[fieldName];
    var typeIdFieldValue;
    var typeIdField = layerDefinition.typeIdField;
    if(attributes.hasOwnProperty(typeIdField)){
      typeIdFieldValue = attributes[typeIdField];
    }

    var subtypeField = layerDefinition.subtypeField;
    if(subtypeField && layerDefinition.subtypes && layerDefinition.subtypes.length > 0){
      if(attributes.hasOwnProperty(subtypeField)){
        typeIdFieldValue = attributes[subtypeField];
      }
    }

    var result = mo._getDisplayValueForCodedValueOrSubtype(layerDefinition, fieldName, fieldValue, typeIdFieldValue);
    if(layerDefinition.typeIdField === fieldName){
      var codedvalue = [{value: attributes[fieldName], label: result.displayValue}];
      result.displayValue = mo._updateCodedValueListFromRender(layerDefinition, codedvalue)[0].label;
    }
    return result;

  };

  //get fieldValue's displayValue from a codedValues array
  //return {isCodedValueOrSubtype,displayValue}
  mo._getDisplayValueFromCodedValues = function(fieldValue, codedValues){
    var result = {
      isCodedValueOrSubtype: false,
      displayValue: fieldValue + '' //convert it to a string if it's a numberical value.
    };
    if(codedValues && codedValues.length > 0){
      array.some(codedValues, lang.hitch(this, function(item){
        if(item.value === fieldValue){
          result = {
            isCodedValueOrSubtype: true,
            displayValue: item.label
          };
          return true;
        }else{
          return false;
        }
      }));
    }
    result.value = fieldValue;
    return result;
  };

  //get display label list by code from a feature attributes
  //attributesList is a array of feature's attributes
  //return [{isCodedValueOrSubtype,value,label}]
  mo.getDisplayValueForCodedValueOrSubtypeBatch = function(layerDefinition, fieldName, attributesList){
    mo._deleteSubtypePropertiesTemp(layerDefinition);
    var codedValueHash = {};
    var typeIdField = layerDefinition.typeIdField;
    var subtypeField = layerDefinition.subtypeField;
    var fieldInfo = mo.getFieldInfoByFieldName(layerDefinition.fields, fieldName);
    if(subtypeField && layerDefinition.subtypes && layerDefinition.subtypes.length > 0){
      codedValueHash.subType = mo._getSubTypes(layerDefinition);//subtype list
      typeIdField = subtypeField;
      codedValueHash.all = mo._getAllCodedValueNew(layerDefinition, fieldInfo); //all codedvalue list
    }else{
      codedValueHash.all = mo._getAllCodedValue(layerDefinition, fieldInfo); //all codedvalue list
      codedValueHash.subType = mo._getRenderTypes(layerDefinition);//subtype list
    }
    if(codedValueHash.subType && codedValueHash.subType.length > 0){
      var subTypeValues = codedValueHash.subType;
      for(var index in subTypeValues){
        var stValue = subTypeValues[index].value;
        //codedvalue list by subtypeid
        // codedValueHash[stValue] = mo._getCodedValueBySubTypeId(layerDefinition, fieldName, stValue, fieldInfo);
        var list = mo._getCodedValueBySubTypeId(layerDefinition, fieldName, stValue, fieldInfo);
        codedValueHash[stValue] = layerDefinition.typeIdField === fieldName ?
          mo._updateCodedValueListFromRender(layerDefinition, list): list;
      }
    }

    //get labels by render
    if(layerDefinition.typeIdField === fieldName){
      codedValueHash.subType = mo._updateCodedValueListFromRender(layerDefinition, codedValueHash.subType);
      codedValueHash.all = mo._updateCodedValueListFromRender(layerDefinition, codedValueHash.all);
    }

    var codedValueList = [];
    var resultList = [];
    for(var key in attributesList){
      var attrs = attributesList[key];
      var fieldValue = attrs[fieldName];
      var typeIdFieldValue;
      if(typeIdField === fieldName){
        codedValueList = codedValueHash.subType;
      }else{
        if(attrs.hasOwnProperty(typeIdField)){
          typeIdFieldValue = attrs[typeIdField];
          codedValueList = codedValueHash[typeIdFieldValue];
          if(!codedValueList){//pass a error subtype, could get null from hash.
            codedValueList = mo._getCodedValues(fieldInfo); //return field domain
            if(layerDefinition.typeIdField === fieldName){
              codedValueList = mo._updateCodedValueListFromRender(layerDefinition, codedValueList);
            }
          }
        }else{
          codedValueList = codedValueHash.all;
        }
      }

      var result = mo._getDisplayValueFromCodedValues(fieldValue, codedValueList);
      resultList.push(result);
    }
    return resultList;

    /*
    var codedValueHash = {};
    var typeIdField = layerDefinition.typeIdField;
    codedValueHash.subType = mo._getRenderTypes(layerDefinition);//subtype list
    var fieldInfo = mo.getFieldInfoByFieldName(layerDefinition.fields, fieldName);
    if(codedValueHash.subType && codedValueHash.subType.length > 0){
      var subTypeValues = codedValueHash.subType;
      for(var index in subTypeValues){
        var stValue = subTypeValues[index].value;
        //codedvalue list by subtypeid
        codedValueHash[stValue] = mo._getCodedValueBySubTypeId(layerDefinition, fieldName, stValue, fieldInfo);
      }
    }
    codedValueHash.all = mo._getAllCodedValue(layerDefinition, fieldInfo); //all codedvalue list

    var codedValueList = [];
    var resultList = [];
    for(var key in attributesList){
      var attrs = attributesList[key];
      var fieldValue = attrs[fieldName];
      var typeIdFieldValue;
      if(typeIdField === fieldName){
        codedValueList = codedValueHash.subType;
      }else{
        if(attrs.hasOwnProperty(typeIdField)){
          typeIdFieldValue = attrs[typeIdField];
          codedValueList = codedValueHash[typeIdFieldValue];
        }else{
          codedValueList = codedValueHash.all;
        }
      }

      var result = mo._getDisplayValueFromCodedValues(fieldValue, codedValueList);
      resultList.push(result);
    }
    return resultList;
    */
  };

  //three states: code is not in hash, same code and diff label, same sode and label
  mo._getUniquCodedValue = function(hash, key, value){
    if(hash[key]){
      if(value === hash[key]){
      }else{
        hash[key] = hash[key] + ', ' + value;
      }
    }else{
      hash[key] = value;
    }
    return hash;
  };

  //get all codedValues by types&field.domains
  mo._getAllCodedValue = function(layerDefinition, fieldInfo){
    // var domain = fieldInfo.domain;
    var fieldName = fieldInfo.name;
    var codedValsHash = {}; //for Removing the duplicate value by code
    var codedValues = null;
    var ifFirstInherited = true;
    //a field could has codedvalue in types even its domain in fields is null
    // if(domain && domain.type === 'codedValue'){
    //get codeValues in types
    if(layerDefinition.typeIdField && layerDefinition.types && layerDefinition.types.length > 0){
      array.map(layerDefinition.types, lang.hitch(this, function(item){
        if(item.domains && item.domains[fieldName]){
          var fieldDomainInfo = item.domains[fieldName];
          if(fieldDomainInfo.type === 'inherited'){
            if(ifFirstInherited){
              ifFirstInherited = false;
              var valsArray = mo._getCodedValues(fieldInfo);
              array.map(valsArray, lang.hitch(this, function(_item){
                // codedValsHash[_item.value] = _item.label;
                codedValsHash = mo._getUniquCodedValue(codedValsHash, _item.value, _item.label);
              }));
            }
          }else{
            if(fieldDomainInfo.codedValues && fieldDomainInfo.codedValues.length > 0){
              array.map(fieldDomainInfo.codedValues, lang.hitch(this, function(_item){
                // codedValsHash[_item.code] = _item.name;
                codedValsHash = mo._getUniquCodedValue(codedValsHash, _item.code, _item.name);
              }));
            }
          }
        }
      }));
      if(!codedValues){//types array does not has this key.(maybe it's not the subtype field)
        codedValues = mo._getCodedValues(fieldInfo);
      }
    }else{ //get codeValues in fields domain
      return this._getCodedValues(fieldInfo);
    }
    var codedValuesArray = [];
    var isNumberField = mo.isNumberField(fieldInfo.type);
    for(var key in codedValsHash){
      //var newKey = isNumberField ? parseInt(key, 10) : key;
      var newKey = isNumberField ? parseFloat(key) : key;//codedvalue could be float type
      codedValuesArray.push({
        value: newKey,
        label: codedValsHash[key]
      });
    }
    // }
    if(codedValuesArray.length > 0){
      codedValues = codedValuesArray;
    }
    return codedValues;
  };

  //get all codedValues by types&field.domains
  mo._getAllCodedValueNew = function(layerDefinition, fieldInfo){
    // var domain = fieldInfo.domain;
    var fieldName = fieldInfo.name;
    var codedValsHash = {}; //for Removing the duplicate value by code
    var codedValues = null;
    var ifFirstInherited = true;
    //a field could has codedvalue in types even its domain in fields is null
    // if(domain && domain.type === 'codedValue'){
    //get codeValues in types
    if(layerDefinition.subtypeField && layerDefinition.subtypes && layerDefinition.subtypes.length > 0){
      array.map(layerDefinition.subtypes, lang.hitch(this, function(item){
        if(item.domains && item.domains[fieldName]){
          var fieldDomainInfo = item.domains[fieldName];
          if(fieldDomainInfo.type === 'inherited'){
            if(ifFirstInherited){
              ifFirstInherited = false;
              var valsArray = mo._getCodedValues(fieldInfo);
              array.map(valsArray, lang.hitch(this, function(_item){
                // codedValsHash[_item.value] = _item.label;
                codedValsHash = mo._getUniquCodedValue(codedValsHash, _item.value, _item.label);
              }));
            }
          }else{
            if(fieldDomainInfo.codedValues && fieldDomainInfo.codedValues.length > 0){
              array.map(fieldDomainInfo.codedValues, lang.hitch(this, function(_item){
                // codedValsHash[_item.code] = _item.name;
                codedValsHash = mo._getUniquCodedValue(codedValsHash, _item.code, _item.name);
              }));
            }
          }
        }
      }));
      if(!codedValues){//types array does not has this key.(maybe it's not the subtype field)
        codedValues = mo._getCodedValues(fieldInfo);
      }
    }else{ //get codeValues in fields domain
      return this._getCodedValues(fieldInfo);
    }
    var codedValuesArray = [];
    var isNumberField = mo.isNumberField(fieldInfo.type);
    for(var key in codedValsHash){
      //var newKey = isNumberField ? parseInt(key, 10) : key;
      var newKey = isNumberField ? parseFloat(key) : key;//codedvalue could be float type
      codedValuesArray.push({
        value: newKey,
        label: codedValsHash[key]
      });
    }
    // }
    if(codedValuesArray.length > 0){
      codedValues = codedValuesArray;
    }
    return codedValues;
  };

  //get codedvalue list by sutType Id
  //return [{value,label}]
  mo._getCodedValueBySubTypeId = function(layerDefinition, fieldName, typeIdFieldValue, /*optional*/fieldInfo){
    var type = 'typeIdField', arrayType = 'types';
    if(layerDefinition.subtypeField && layerDefinition.subtypes && layerDefinition.subtypes.length > 0){
      type = 'subtypeField';
      arrayType = 'subtypes';
    }

    var codedValues = null ;
    fieldInfo = fieldInfo ? fieldInfo : mo.getFieldInfoByFieldName(layerDefinition.fields, fieldName);
    if(layerDefinition[type] && layerDefinition[arrayType] && layerDefinition[arrayType].length > 0){
      array.map(layerDefinition[arrayType], lang.hitch(this, function(item){
        if(item.id === typeIdFieldValue){
          if(fieldName === layerDefinition[type]){//subtype field---in fact: render field
            codedValues = [{
              value: item.id,
              label: item.name
            }];
            return true;
          }
          else if(item.domains && item.domains[fieldName]){//other fields
            var fieldDomainInfo = item.domains[fieldName];
            if(fieldDomainInfo.type === 'inherited'){
              codedValues = mo._getCodedValues(fieldInfo);
            }else{
              if(fieldDomainInfo.codedValues && fieldDomainInfo.codedValues.length > 0){
                codedValues = array.map(fieldDomainInfo.codedValues, lang.hitch(this, function(_item){
                  return {
                    value: _item.code,
                    label: _item.name
                  };
                }));
              }
            }
          }
          //undefined in domains, when field is subtype field or some error data like#13631.
          else if(item.domains){
            codedValues = mo._getCodedValues(fieldInfo);
          }
        }
      }));
      if(!codedValues){//types array does not has this key.(maybe it's not the subtype field)
        codedValues = mo._getCodedValues(fieldInfo);
      }
    }else{
      codedValues = mo._getCodedValues(fieldInfo); //if the field isn't in types array but has its own domain codedvalue
    }
    return codedValues;
  };

  //get codedvalue list, return all or some by subtypeId from a feature attributes
  //attributes:feature's attributes or a obj of same format(it may has a subtype field or not).
  //return [{value,label}], return null means no subtypes or no coded value field
  mo.getCodedValueListForCodedValueOrSubTypes = function(layerDefinition, fieldName, attributes){
    mo._deleteSubtypePropertiesTemp(layerDefinition);
    var codedValues = null ;
    var fieldInfo = mo.getFieldInfoByFieldName(layerDefinition.fields, fieldName);

    var typeIdFieldValue, subtypeFieldValue;
    if(attributes){
      typeIdFieldValue = attributes[layerDefinition.typeIdField]; //it can be 0(number)
      subtypeFieldValue = attributes[layerDefinition.subtypeField]; //it can be 0(number)
    }

    if(layerDefinition.subtypeField && layerDefinition.subtypes && layerDefinition.subtypes.length > 0){
      //current field is subtype field
      if(fieldName === layerDefinition.subtypeField){
        codedValues = mo._getSubTypes(layerDefinition); //get subtyps list
        if(subtypeFieldValue !== undefined){
          var _valueInfo = mo._getDisplayValueFromCodedValues(subtypeFieldValue, codedValues);
          codedValues = [{
            value:_valueInfo.value,
            label:_valueInfo.displayValue
          }];
        }
      }else{
        if(subtypeFieldValue === undefined){//return all domains from subtype list
          codedValues = mo._getAllCodedValueNew(layerDefinition, fieldInfo);
        }else{//return one domain from current subtype value
          //get codedvalues list, from layerDefinition.subtypes..domain.
          codedValues = mo._getCodedValueBySubTypeId(layerDefinition, fieldName, subtypeFieldValue, fieldInfo);
        }
      }
      //update labels from render(if render current field)
      if(fieldName === layerDefinition.typeIdField){ //update labels from render
        codedValues = mo._updateCodedValueListFromRender(layerDefinition, codedValues);
      }
      return codedValues;
    }else{ //no subtype field
      // if(layerDefinition.subtypeField === ''){ //no subtype field
      layerDefinition.subtypeField = '';
      layerDefinition.subtypes = [];
      //continue old logic.
    }

    //current fieldName is typeIdField
    if(layerDefinition.typeIdField && layerDefinition.typeIdField.toUpperCase() === fieldName.toUpperCase()){
      codedValues = mo._getRenderTypes(layerDefinition);
      if(attributes && typeIdFieldValue !== undefined && typeIdFieldValue !== null){ //attributes has subtype field, return one data
        var valueInfo = mo._getDisplayValueFromCodedValues(typeIdFieldValue, codedValues);
        codedValues = [{
          value:valueInfo.value,
          label:valueInfo.displayValue
        }];
      }
    }else{ //other fields
      if(attributes && typeIdFieldValue !== undefined && typeIdFieldValue !== null){ //attributes has subtype field, so filter it
        codedValues = mo._getCodedValueBySubTypeId(layerDefinition, fieldName, typeIdFieldValue, fieldInfo);
      }else{
        codedValues = mo._getAllCodedValue(layerDefinition, fieldInfo);
      }
    }
    if(fieldName === layerDefinition.typeIdField){ //update labels from render
      codedValues = mo._updateCodedValueListFromRender(layerDefinition, codedValues);
    }
    return codedValues;
  };

  //check if current field is subtype field, and which field is subtype field from layerDefiniton
  mo._verifyIfFieldIsSubtypeField = function(layerDefinition, fieldInfo){
    var info = {
      isSubtypeField: false, // if current field is subtype field.
      subtypeField: '' //the name of the subtype field.
    };
    //version:10.5+, it's subtype 's fieldName if layer has a subtype field, not undefined or ''
    //subtypeField is a layer property that is set to the name of the subtype field.
    //If the layer does not have subtypes, it is set to empty string ("subtypeField": "").
    if(layerDefinition.subtypeField){
      info = {
        isSubtypeField: layerDefinition.subtypeField === fieldInfo.name,
        subtypeField: layerDefinition.subtypeField
      };
      return info;
    }

    //old versions need fieldInfo to verify
    var isRenderBySubtype = false;
    var subtypeFieldTypes = [
      'esriFieldTypeSmallInteger',
      'esriFieldTypeInteger'
    ];
    //1. render by current field, it maybe the subtype field.
    //2. checkout types.domain to verify
    if(subtypeFieldTypes.indexOf(fieldInfo.type) && layerDefinition.typeIdField === fieldInfo.name &&
      (layerDefinition.types && layerDefinition.types.length > 0)){
      var domains = layerDefinition.types[0].domains;
      //when layer has error data like: domain={}, then can't tell if it's subtype field.
      if(domains[fieldInfo.name] === undefined){
        info = {
          isSubtypeField: true,
          subtypeField: fieldInfo.name
        };
      }else{ // current field is existed in domains, so it can't be subtype field
        info.isSubtypeField = false;
      }
    }
    return isRenderBySubtype;
  };

  //get renderer from layerDef.drawingInfo
  mo._getRendererFromLayerDef = function(layerDefinition){
    var render = null;
    if(layerDefinition.drawingInfo && layerDefinition.drawingInfo.renderer &&
      layerDefinition.drawingInfo.renderer.type === 'uniqueValue'){
      render = layerDefinition.drawingInfo.renderer;
    }
    return render;
  };

  //get renderer from layerObj which is configurated in webmap if it exists,
  //otherwise use drawingInfo from layerDef.
  mo._getRenderValueLabelsForUnique = function(layerDefinition){
    var valueLabels = null, uniqueValueInfos = null;
    var layerDefRender = mo._getRendererFromLayerDef(layerDefinition);
    if(layerDefRender){//layerDefinition
      valueLabels = {};
      uniqueValueInfos = layerDefRender.uniqueValueInfos;
    }else if(layerDefinition.renderer){//layerObject
      var _layerDef = layerDefinition.toJson().layerDefinition; //get serviceLayerDef from layerObj
      var _layerDefRender = mo._getRendererFromLayerDef(_layerDef);
      var renderInfo = layerDefinition.renderer.toJson();
      //only support uniqueRender and same field as layerDef
      if(renderInfo.type === 'uniqueValue' && (_layerDefRender && _layerDefRender.field1 === renderInfo.field1)){
        valueLabels = {};
        uniqueValueInfos = renderInfo.uniqueValueInfos;
      }else if(_layerDefRender){
        valueLabels = {};
        uniqueValueInfos = _layerDefRender.uniqueValueInfos;
      }
    }

    if(uniqueValueInfos){
      for(var key = 0; key < uniqueValueInfos.length; key ++){
        var info = uniqueValueInfos[key];
        valueLabels[info.value] = info.label;
      }
    }
    return valueLabels;
  };

  //update codedValues from render labels(call this function when fieldnName = typeIdField)
  mo._updateCodedValueListFromRender = function(layerDefinition, codedValues){ //[{value,label}]
    var renderCodedValues = mo._getRenderValueLabelsForUnique(layerDefinition);
    if(renderCodedValues && codedValues){
      for(var key = 0; key < codedValues.length; key ++){
        var codeValue = codedValues[key];
        if(renderCodedValues[codeValue.value]){
          codeValue.label = renderCodedValues[codeValue.value];
        }
      }
    }
    return codedValues;
  };

  //return {fieldName,label,tooltip,visible,format,stringFieldOption}
  mo.getDefaultPortalFieldInfo = function(serviceFieldInfo){
    //serviceFieldInfo: {name,alias,type,...}
    var fieldName = serviceFieldInfo.name;
    var item = {
      fieldName: fieldName,
      label: serviceFieldInfo.alias || fieldName,
      tooltip: '',
      visible: false,
      format: null,
      stringFieldOption: 'textbox'
    };

    //https://developers.arcgis.com/javascript/jsapi/field-amd.html#type
    var type = serviceFieldInfo.type;
    switch (type) {
      case 'esriFieldTypeSmallInteger':
      case 'esriFieldTypeInteger':
        item.format = {
          places: 0,
          digitSeparator: true
        };
        break;
      case 'esriFieldTypeSingle':
      case 'esriFieldTypeDouble':
        item.format = {
          places: 2,
          digitSeparator: true
        };
        break;
      case 'esriFieldTypeDate':
        item.format = {
          dateFormat: "longMonthDayYear"
        };
        break;
    }
    return item;
  };

  mo.getDefaultPopupInfo = function(object, title, fieldNames) {
    // return popupInfo with all fieldInfos if the fieldName is null;
    var popupInfo = null;
    if(object && object.fields) {
      popupInfo = {
        title: title,
        fieldInfos:[],
        description: null,
        showAttachments: true,
        mediaInfos: []
      };
      array.forEach(object.fields, function(field){
        var isValidField = false;
        if(fieldNames) {
          var isValidFieldName = array.some(fieldNames, lang.hitch(this, function(fieldName) {
            return fieldName && (field.name.toLowerCase() === fieldName.toLowerCase());
          }));
          if(isValidFieldName) {
            isValidField = true;
          }
        } else {
          isValidField = true;
        }
        if(isValidField) {
          var fieldInfo = this.getDefaultPortalFieldInfo(field);
          fieldInfo.visible = true;
          fieldInfo.isEditable = field.editable;
          popupInfo.fieldInfos.push(fieldInfo);
        }
      }, this);
    }
    return popupInfo;
  };

  mo._tryLocaleNumber = function(value) {
    var result = mo.localizeNumber(value);
    if (result === null || result === undefined) {
      result = value;
    }
    return result;
  };

  mo._tryLocaleDate = function(date) {
    var result = mo.localizeDate(date);
    if (!result) {
      result = date.toLocaleDateString();
    }
    return result;
  };

  //fieldInfos: layerDefinition.fields
  mo.getFieldInfoByFieldName = function(fieldInfos, fieldName) {
    var fieldInfo = null;
    if (fieldInfos && fieldInfos.length > 0) {
      array.some(fieldInfos, lang.hitch(this, function(item) {
        if (item.name === fieldName) {
          fieldInfo = item;
          return true;
        } else {
          return false;
        }
      }));
    }
    return fieldInfo;
  };

  //fieldInfos: popupFieldsInfo
  mo.getDateFieldFormatByFieldName = function(fieldInfos, fieldName) {
    if (fieldInfos && fieldInfos.length > 0) {
      for(var key = 0; key < fieldInfos.length; key++){
        var item = fieldInfos[key];
        if (item.fieldName === fieldName) {
          if(item.format && item.format.dateFormat){
            return item.format.dateFormat;
          }else{
            return '';
          }
        }
      }
      return '';
    }
    return '';
  };

  //layerField: https://developers.arcgis.com/web-map-specification/objects/field/
  //popupField: https://developers.arcgis.com/web-map-specification/objects/fieldInfo/
  mo.completePopupFieldFromLayerField = function(layerFields, popupFields){
    if(!popupFields){ //for#15639 api-bug, pop-up exists but no fieldInfos.
      return layerFields;
    }
    for(var layerKey in layerFields){
      var layerFieldName = layerFields[layerKey].name;
      var isExist = false;
      for(var popupKey in popupFields){
        if(popupFields[popupKey].fieldName === layerFieldName){
          isExist = true;
          break;
        }
      }
      if(!isExist){
        var _fieldInfo = mo.getPopupFieldFromLayerField(layerFields[layerKey]);
        popupFields.push(_fieldInfo);
      }
    }
    return popupFields;
  };

  mo.getPopupFieldFromLayerField = function(layerField){
    var _fieldInfo = {
      //pro publish (no edit by map viewer in some old versions)
      'fieldName': layerField.name,
      'isEditable': layerField.editable,
      'label': layerField.alias,
      'visible': layerField.visible ? layerField.visible : false,

      //other ways(include attrs above)
      //stringFieldOption is only for string field: textbox, textarea, richtext
      'stringFieldOption': layerField.type === 'esriFieldTypeString' ? 'textbox': null,
      'tooltips': '',
      'domain': layerField.domain ? layerField.domain : null
    };
    return _fieldInfo;
  };

  mo.containsNonLatinCharacter = function(string) {
    /*
    console.log(string);
    for (var k = 0; k < string.length; k++) {
      console.log(string.charCodeAt(k));
    }
    */
    for (var i = 0; i < string.length; i++) {
      if (string.charCodeAt(i) > 255) {
        return true;
      }
    }
    return false;
  };

  mo.has = function(browserName) {
    function _isIE11() {
      var iev = 0;
      var ieold = (/MSIE (\d+\.\d+);/.test(navigator.userAgent));
      var trident = !!navigator.userAgent.match(/Trident\/7.0/);
      var rv = navigator.userAgent.indexOf("rv:11.0");

      if (ieold) {
        iev = Number(RegExp.$1);
      }
      if (navigator.appVersion.indexOf("MSIE 10") !== -1) {
        iev = 10;
      }
      if (trident && rv !== -1) {
        iev = 11;
      }

      return iev === 11;
    }
    function _isEdge() {
      return navigator.userAgent.split('Edge/')[1];
    }
    var v = has(browserName);
    if (!v) {
      if (browserName.toLowerCase() === 'ie') {
        return (_isIE11() && 11) || v;
      } else if (browserName.toLowerCase() === 'edge') {
        return _isEdge() || v;
      }
    } else {
      return v;
    }
  };

  mo.detectUserAgent = function() {
    return window.userAgent;
  };
  mo.isMobileUa = function() {
    return window.isMobileUa;
  };

  mo.inMobileSize = function(){
    var layoutBox = html.getMarginBox(document.body);
    if (layoutBox.w <= window.jimuConfig.breakPoints[0] ||
      layoutBox.h <= window.jimuConfig.breakPoints[0]) {
      html.addClass(window.jimuConfig.layoutId, 'jimu-ismobile');
      return true;
    } else {
      html.removeClass(window.jimuConfig.layoutId, 'jimu-ismobile');
      return false;
    }
  };

  mo.getObjectIdField = function(layerDefinition){
    if(layerDefinition.objectIdField){
      return layerDefinition.objectIdField;
    }else{
      var fieldInfos = layerDefinition.fields;
      for(var i = 0; i < fieldInfos.length; i++){
        var fieldInfo = fieldInfos[i];
        if(fieldInfo.type === 'esriFieldTypeOID'){
          return fieldInfo.name;
        }
      }
    }
    return null;
  };

  //if browser(such as Chrome50) have window.isSecureContext, and not in https origin, return true
  //for example: if true===isNendHttpsButNot(), MyLocateButton should be disabled
  mo.isNeedHttpsButNot = function() {
    //copy from: https://devtopia.esri.com/WebGIS/arcgis-js-api/issues/6614
    var hasGeolocation = navigator.geolocation;
    var hasSecureContext = window.hasOwnProperty("isSecureContext");
    var isSecureContext = (hasSecureContext && window.isSecureContext) ||
      (!hasSecureContext && window.location.protocol === "https:");
    if (!isSecureContext || !hasGeolocation) {
      return true;
    } else {
      return false;
    }
  };

  /**
   * @param graphics Array of esri/Graphic
   * @return esri/tasks/FeatureSet
   */
  mo.toFeatureSet = function(graphics) {
    var fs = new FeatureSet();
    //if it's object, we consider it as a feature.
    if(Object.prototype.toString.call(graphics) === '[object Object]'){
      graphics = [graphics];
    }
    fs.features = graphics;

    if(graphics.length > 0){
      var g;
      // Find the first graphic whose geometry has value.
      array.some(graphics, function(graphic) {
        if(graphic.geometry) {
          g = graphic;
          return true;
        }
      });
      if(g) {
        var layer = g.getLayer(), fieldAliases = {};
        if(layer) {
          fs.displayFieldName = layer.displayField;

          array.forEach(layer.fields, lang.hitch(this, function(fieldInfo) {
            var fieldName = fieldInfo.name;
            var fieldAlias = fieldInfo.alias || fieldName;
            fieldAliases[fieldName] = fieldAlias;
          }));

          fs.fieldAliases = fieldAliases;
        }
        fs.geometryType = g.geometry.type;
        fs.spatialReference = g.geometry.spatialReference;
      }
    }
    return fs;
  };

  mo.showValidationErrorTipForFormDijit = function(_dijit){
    try{
      if (!_dijit.validate() && _dijit.domNode) {
        if (_dijit.focusNode) {
          _dijit.focusNode.focus();
          setTimeout(lang.hitch(this, function() {
            _dijit.focusNode.blur();
          }), 100);
        }
      }
    }catch(e){
      console.error(e);
    }
  };

  mo.getFeatureLayerDefinition = function(featureLayer){
    var layerDefinition = null;
    var features = featureLayer.graphics;
    featureLayer.graphics = [];
    var json = featureLayer.toJson();
    featureLayer.graphics = features;
    if(json){
      layerDefinition = json.layerDefinition;
    }
    return layerDefinition;
  };

  mo.simulateClickEvent = function(dom){
    if(has('safari')){
      //create an event
      var mouseEvent = document.createEvent("MouseEvents");
      //initialize the event
      mouseEvent.initEvent("click",/* bubble */ true, /* cancelable */ true);
      //trigger the evevnt
      dom.dispatchEvent(mouseEvent);
    }else{
      dom.click();
    }
  };

  mo.getFeatureSetByLayerAndFeatures = function(layer, features){
    var featureSet = new FeatureSet();
    featureSet.fields = lang.clone(layer.fields);
    featureSet.features = features;
    featureSet.geometryType = layer.geometryType;
    featureSet.fieldAliases = {};
    array.forEach(featureSet.fields, lang.hitch(this, function(fieldInfo) {
      var fieldName = fieldInfo.name;
      var fieldAlias = fieldInfo.alias || fieldName;
      featureSet.fieldAliases[fieldName] = fieldAlias;
    }));
    return featureSet;
  };

  mo.featureAction = (function(){
    var result = {};

    //options: {
    //   extentFactor
    // }
    result.zoomTo = function(map, arr, /*optional*/ options) {
      if(!options){
        options = {};
      }
      /*
      if(!options.hasOwnProperty('extentFactor')){
        options.extentFactor = 1.2;
      }
      */
      if (map && arr && arr.length > 0) {
        var isGeometries = array.every(arr, function(a) {
          return a && a.spatialReference && a.type;
        });
        var isGraphics = array.every(arr, function(a) {
          return a && a.geometry && a.geometry.spatialReference && a.geometry.type;
        });
        if (isGraphics || isGeometries) {
          if (isGeometries) {
            arr = array.map(arr, function(a) {
              return {
                geometry: a
              };
            });
          }

          mo.zoomToFeatureSet(map, {features: arr}, options.extentFactor);
        }
      }
    };

    result.flash = function(graphics, layer) {
      var isGraphics = array.every(graphics || [], function(g) {
        return g && g.geometry;
      });
      if (!isGraphics) {
        return;
      }

      var features = graphics;
      var first = features[0];
      var featureSymbols = array.map(features, function(f){
        return f.symbol;
      });
      var gurdSymbol = first.symbol ||
        lang.getObject('renderer.symbol', false, layer);
      var cSymbol = null;
      if (layer && layer.geometryType === 'esriGeometryPoint') {
        cSymbol = new PictureMarkerSymbol(require.toUrl('jimu') + '/images/flash.gif', 20, 20);
      } else {
        cSymbol = lang.clone(gurdSymbol);
        if (cSymbol) {
          if (cSymbol.outline) {
            cSymbol.outline.setColor("#ffc500");
          } else {
            cSymbol.setColor("#ffc500");
          }
        }
      }

      function changeSymbol(s, flash) {
        array.forEach(features, function(f, idx) {
          f.setSymbol(flash ? s : featureSymbols[idx] || gurdSymbol);
        });
      }

      function flash(cb) {
        return function() {
          setTimeout(function() {
            changeSymbol(cSymbol, true);
            if (features[0] && layer) {
              layer.redraw();
            }
            setTimeout(function() {
              changeSymbol(null, false);
              if (features[0] && layer) {
                layer.redraw();
              }
              cb();
            }, 200);
          }, 200);
        };
      }

      if (first && gurdSymbol && cSymbol && layer) {
        if (layer.geometryType === 'esriGeometryPoint') {
          changeSymbol(cSymbol, true);
          layer.redraw();
          setTimeout(function() {
            changeSymbol(null, false);
            layer.redraw();
          }, 2000);
        } else {
          flash(flash(flash(function() {})))();
        }
      }
    };

    result.panTo = function(map, graphics) {
      var isGraphics = array.every(graphics || [], function(g) {
        return g && g.geometry;
      });
      if (!isGraphics) {
        return;
      }

      var center;
      if(graphics.length > 0){
        var extent = graphicsUtils.graphicsExtent(graphics);
        center = extent.getCenter();
      }else{
        var geometry = graphics[0].geometry;
        if(geometry.type === 'polyline' || geometry.type === 'polygon'){
          center = geometry.getExtent().getCenter();
        }else if(geometry.type === 'extent'){
          center = geometry.getCenter();
        }else if(geometry.type === 'multipoint'){
          if(geometry.points.length > 1){
            center = geometry.getExtent().getCenter();
          }else{
            center = geometry.getPoint(0);
          }
        }else{
          center = geometry;
        }
      }

      map.centerAt(center);
    };

    result.showPopup = function(map, graphics) {
      var isGraphics = array.every(graphics || [], function(g) {
        return g && g.geometry;
      });
      if (!isGraphics) {
        return;
      }

      var popup = map.infoWindow;
      popup.setFeatures(graphics);
      var f = graphics[0];
      if (f.geometry.type === 'point') {
        popup.show(f.geometry, {
          closetFirst: true
        });
      } else {
        popup.show(f.geometry.getExtent().getCenter(), {
          closetFirst: true
        });
      }
    };

    return result;
  }());

  mo.isInConfigOrPreviewWindow = function(){
    var b = false;
    try{
      b = !window.isBuilder && window.parent && window.parent !== window &&
        window.parent.isBuilder;
    }catch(e){
      // console.log(e);
      b = false;
    }
    return !!b;
  };

  //for cross-origin frame
  mo.getAppHref = function(){
    var href = "";
    if (mo.isInConfigOrPreviewWindow()) {
      href = window.parent.location.href;
    } else {
      href = window.location.href;
    }
    return href;
  };

  mo.getAppIdFromUrl = function() {
    var isDeployedApp = true,
      href = mo.getAppHref();// window.top.location.href;
    if (href.indexOf("id=") !== -1 || href.indexOf("appid=") !== -1 ||
      href.indexOf("apps") !== -1) {
      isDeployedApp = false;
    }

    if (isDeployedApp === true) {
      // deployed app use pathname as key
      return href;
    } else {
      // xt or integration use id of app as key
      var urlParams = this.urlToObject(window.location.href);
      if (urlParams.query) {
        if (urlParams.query.id || urlParams.query.appid) {
          return urlParams.query.id || urlParams.query.appid;
        }
      }

      // if there is no id/appid in url
      if (window.appInfo) {
        if (window.appInfo.id) {
          //id in appInfo
          return window.appInfo.id;
        } else if (window.appInfo.appPath) {
          //parse id from appPath
          var list = window.appInfo.appPath.split("/");
          if (list.length && list.length > 2) {
            return list[list.length - 2];
          }
        } else {
          console.error("CAN NOT getAppIdFromUrl");
        }
      }
    }
  };

  mo.getEditorContentHeight = function(content, dom, domParam) {
    var def = new Deferred();
    this._content = content;
    this._dom = dom;
    this._domParam = domParam;
    var timeoutHandler = setTimeout(lang.hitch(this, function() {
      clearTimeout(timeoutHandler);
      timeoutHandler = null;

      var h = 0;
      var scrollerWidth = 20;
      var polyfill = 8;
      var contentWidth = this._domParam.contentWidth;//defaultWidth - marginLeftRight;
      try {
        var fakeContent = document.createElement('div');
        fakeContent.setAttribute('id', 'fakeContent');
        html.setStyle(fakeContent, "background-size", "contain");
        fakeContent.innerHTML = this._content;
        this._dom.appendChild(fakeContent);
        if (fakeContent) {
          //to adjust images
          var contentImgs = query('img', fakeContent);
          if (contentImgs && contentImgs.length) {
            contentImgs.style({
              maxWidth: (contentWidth - scrollerWidth) + 'px'
            });
          }

          html.setStyle(fakeContent, "position", "absolute");
          html.setStyle(fakeContent, "width", contentWidth + "px");
          html.setStyle(fakeContent, "left", "-99999px");
          html.setStyle(fakeContent, "top", "-99999px");
          html.setStyle(fakeContent, "visibility", "hidden");

          var box = html.getContentBox(fakeContent);
          if (box.h) {
            //content height
            h = box.h;
            //+ content margin top + content margin bottom + polyfill
            h += (this._domParam.contentMarginTop + this._domParam.footerHeight + polyfill);
          }
          //TODO delete
          // if (h) {
          //   this._dom.removeChild(fakeContent);
          // }
        }
      } catch (err) {
        console.error("can't getEditorContentHeight" + err);
        h = 200;
      }

      def.resolve(h);
    }), 1500);
    return def;
  };

  mo.getBase64Data = function(url) {
    var def = new Deferred();
    if (url && url.startWith('data:image')) {
      def.resolve(url);
    } else {
      try {
        esriRequest({
          url: url,
          handleAs: 'arraybuffer'
        }).then(function(response){
          var reader = new FileReader();
          reader.onloadend = function () {
            def.resolve(reader.result);
          };
          reader.onerror = function () {
            def.resolve(null);
          };
          reader.readAsDataURL(new Blob([response], {
            type: 'image/png'
          }));
        }, function(){
          def.resolve(null);
        });
      }catch(err) {
        console.warn(err);
        def.resolve(null);
      }
    }
    return def;
  };

  mo.getEditorTextColor = function(colorRecordID, forceAttr) {
    return {
      name: "dijit.editor.plugins.EditorTextColor",
      custom: {
        recordUID: mo.getColorRecordName(colorRecordID),
        forceAttr: forceAttr
      }
    };
  };
  mo.getEditorBackgroundColor = function(colorRecordID) {
    return {
      name: "dijit.editor.plugins.EditorBackgroundColor",
      custom: {
        recordUID: mo.getColorRecordName(colorRecordID)
      }
    };
  };
  mo.getColorRecordName = function(id){
    return "wab_cr_" + (id || "");
  };
  mo.b64toBlob = function(b64Data, contentType, sliceSize) {
    contentType = contentType || '';
    sliceSize = sliceSize || 512;
    var byteCharacters = window.atob(b64Data.replace(/^data:image\/(png|jpg|jpeg|gif);base64,/, ''));
    var byteArrays = [];
    for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      var slice = byteCharacters.slice(offset, offset + sliceSize);
      var byteNumbers = new Array(slice.length);
      for (var i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      var byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    var blob = new Blob(byteArrays, {
      type: contentType
    });
    return blob;
  };
  mo.subtractionArray = function(arr1, arr2) {
    //return arr1 = arr1 - arr2
    for (var i = arr1.length - 1; i >= 0; i--) {
      var a = arr1[i];
      for (var j = arr2.length - 1; j >= 0; j--) {
        var b = arr2[j];
        if (a === b) {
          arr1.splice(i, 1);
          arr2.splice(j, 1);
          break;
        }
      }
    }
    return arr1;
  };
  mo.resourcesUrlToBlob = function(resourcesUrl) {
    return esriRequest({
      url: resourcesUrl,
      handleAs: "blob"
    });
  };
  mo.processItemResourceOfAppConfig = function(appConfig, cb){
    //Traverse appConfig and get all the data that matches the cb.test,
    //along with its direct parent object, passed to the callback function(cb.func)

    //cb:{test,func}
    //args:all parameters that need to be passed to the callback function(cb.func)
    //
    //Return: if cb.func return a promise(defs.length > 0),this function will return a deferred
    //        else return {appConfig,normalReturnValues}
    var normalReturnValues = [];
    var defs = [];
    var callbackReturn;

    function _formatPendingObj(pendingObj){
      var obj = pendingObj.obj;
      var key = pendingObj.key;
      var formatObj = {
        obj:obj,
        key:key
      };
      if(typeof pendingObj.i === 'number'){
        formatObj.i = pendingObj.i;
        formatObj.value = obj[key][pendingObj.i];
      }else{
        formatObj.value = obj[key];
      }
      return formatObj;
    }

    function processObject(obj) {
      for (var key in obj) {
        if (typeof obj[key] === 'object') {
          if (Array.isArray(obj[key])) {
            processArray(obj, key);
          } else {
            processObject(obj[key]);
          }
        } else if (typeof obj[key] === 'string') {
          processString(obj, key);
        }
      }
    }

    function processString(obj, key, i){
      if(typeof i === 'number'){
        if (cb.test(obj[key][i])) {
          callbackReturn = cb.func(_formatPendingObj({
            obj: obj,
            key: key,
            i:i
          }));
          if(typeof callbackReturn.then === 'function'){
            defs.push(callbackReturn);
          }else{
            normalReturnValues.push(callbackReturn);
          }
        }
      }else{
        if (cb.test(obj[key])) {
          callbackReturn = cb.func(_formatPendingObj({
            obj: obj,
            key: key
          }));
          if(typeof callbackReturn.then === 'function'){
            defs.push(callbackReturn);
          }else{
            normalReturnValues.push(callbackReturn);
          }
        }
      }
    }

    function processArray(obj, key){
      for (var i = 0; i < obj[key].length; i++) {
        if (typeof obj[key][i] === 'string') {
          processString(obj, key, i);
        }else if (typeof obj[key][i] === 'object') {
          processObject(obj[key][i]);
        }
      }
    }

    processObject(appConfig);

    if(defs.length > 0){
      return all(defs).then(function(result){
        if(normalReturnValues.length > 0){
          result = result.concat(normalReturnValues);
        }
        return {
          appConfig: appConfig,
          result: result
        };
      });
    }else{
      return {
        appConfig: appConfig,
        result: normalReturnValues
      };
    }
  };
  mo.isEsriDomain = function(url){
    return /^https?:\/\/(?:[\w\-\_]+\.)+(?:esri|arcgis)\.com/.test(url);
  };
  mo.uniqueArray = function(array) {
    var n = [];
    for (var i = 0; i < array.length; i++) {
      if (n.indexOf(array[i]) === -1) {
        n.push(array[i]);
      }
    }
    return n;
  };

  mo.isNotEmptyObject = function(obj, includeArray) {
    if(!!includeArray){
      return mo.isObject(obj) && Object.keys(obj).length > 0 && Array.isArray(obj);
    }else{
      return mo.isObject(obj) && Object.keys(obj).length > 0;
    }
  };
  mo.getMinOfArray = function(array) {
    return Number(Math.min.apply(Math, array));
  };
  mo.getDataSchemaFromLayerDefinition = function(layerDefinition){
    var oIdField = layerDefinition.fields.filter(function(f){
      return f.type === 'esriFieldTypeOID';
    });
    if(oIdField.length > 0){
      oIdField = oIdField[0];
    }else{
      oIdField = null;
    }

    return {
      geometryType: layerDefinition.geometryType,
      fields: layerDefinition.fields,
      displayField: layerDefinition.displayField,
      objectIdField: oIdField,
      typeIdField: layerDefinition.typeIdField
    };
  };

  mo.isValidPointGeometry = function(geometry) {
    return geometry && geometry.type === 'point' && mo.isTrueOrZero(geometry.x) &&
      mo.isTrueOrZero(geometry.y);
  };

  // Incorrect function name, keep it here for back compatibility.
  mo.isVaildPointGeometry = mo.isValidPointGeometry;

  mo.isNumberOrNumberString = function(value) {
    return /^-?[1-9]\d*$/.test(value) ||
      /^-?([1-9]\d*\.\d*|0\.\d*[1-9]\d*|0?\.0+|0)$/.test(value);
  };

  //https://devtopia.esri.com/WebGIS/arcgis-webappbuilder/issues/13559#issuecomment-2117722
  mo.convertNumberToPercentage = function(number, /*optional*/ decimalDigits, digitSeparator) {
    if (!mo.isNumberOrNumberString(number)) {
      return number;
    }
    //format
    if (typeof digitSeparator === 'undefined') {
      digitSeparator = true;
    }
    if (typeof decimalDigits === 'undefined') {
      decimalDigits = 2;
    }
    var fieldInfo = {
      format: {
        places: decimalDigits,
        digitSeparator: digitSeparator
      }
    };

    var locale = config.locale;
    var percentLeft = locale === 'ar' || locale === 'tr';
    number = Number(number);
    var isNegative = false;
    if (number < 0) {
      isNegative = true;
      number = Math.abs(number);
    }
    number = number * 100;
    number = mo.localizeNumberByFieldInfo(number, fieldInfo);

    if (!percentLeft) {
      number += '%';
    } else {
      number = '%' + number;
    }

    //Under RTL, the browser will automatically flip the minus sign to the opposite position. 
    //In order to keep the minus sign always on the left, we need to flip it to the right
    if (isNegative) {
      number = window.isRTL ? number + '-' : '-' + number;
    }

    return number;
  };

  mo.getClientFeaturesFromMap = function(map, featureLayer, useSelection, filterByExtent) {
    var features = [];
    var isSelectedFeatures = false;

    if(!featureLayer){
      return;
    }

    if (useSelection) {
      if (featureLayer.getSelectedFeatures().length > 0) {
        features = featureLayer.getSelectedFeatures();
        isSelectedFeatures = true;
      } else {
        features = featureLayer.graphics;
      }
    } else {
      features = featureLayer.graphics;
    }

    if (filterByExtent) {
      features = mo.filterFeaturesByExtent(map.extent, features);
    }

    if (features && features.length > 0) {
      var objectIdField = mo.getObjectIdField(featureLayer);

      if (objectIdField) {
        var firstFeature = features[0];
        if (firstFeature && firstFeature.attributes && firstFeature.attributes.hasOwnProperty(objectIdField)) {
          features.sort(function(a, b) {
            if (!a.attributes) {
              a.attributes = {};
            }
            if (!b.attributes) {
              b.attributes = {};
            }
            var objectId1 = a.attributes[objectIdField];
            var objectId2 = b.attributes[objectIdField];
            if (objectId1 < objectId2) {
              return -1;
            } else if (objectId1 > objectId2) {
              return 1;
            } else {
              return 0;
            }
          });
        }
      }
    }

    features.isSelectedFeatures = isSelectedFeatures;

    return features;
  };

  mo.filterFeaturesByExtent = function(extent, features) {
    var extents = extent.normalize();

    features = array.filter(features, lang.hitch(this, function(feature) {
      try {
        if (feature.geometry) {
          var isPoint = feature.geometry.type === 'point' || feature.geometry === 'multipoint';

          return array.some(extents, lang.hitch(this, function(extent) {
            if (isPoint) {
              return extent.contains(feature.geometry);
            } else {
              return geometryEngine.intersects(extent, feature.geometry);
            }
          }));
        }
      } catch (e) {
        console.error(e);
      }
      return false;
    }));

    return features;
  };

  mo.upperCaseString = function(temp) {
    if (temp && typeof temp === 'string') {
      return temp.toUpperCase();
    }
    return temp;
  };

  mo.lowerCaseString = function(temp) {
    if (temp && typeof temp === 'string') {
      return temp.toLowerCase();
    }
    return temp;
  };

  mo.getSubstituteString = function(value, string){
    return esriLang.substitute({value: value}, string);
  };

  mo.getUUID = function() {
    function S4() {
      /*jslint bitwise: true*/
      return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
      /*jslint bitwise: false*/
    }
    return (S4() + S4() + "_" + S4() + "_" + S4() + "_" + S4() + "_" + S4() + S4() + S4());
  };

  mo.checkEssentialAppsLicense = function(appId, portal, isInBuilder) {
    var portalUrl = portalUrlUtils.getStandardPortalUrl(window.portalUrl);
    var sharingUrl = portalUrlUtils.getSharingUrl(portalUrl);
    var oauthappid = "arcgisWebApps";
    // register OAuthInfo with client ID 'arcgisWebApps'
    var oAuthInfo = new OAuthInfo({
      appId: "arcgisWebApps",
      portalUrl: portalUrl
    });
    IdentityManager.registerOAuthInfos([oAuthInfo]);

    //Determine if app is public or private
    if(isInBuilder) {
      return IdentityManager.checkAppAccess(sharingUrl, oauthappid);
    } else {
      return portal.getItemById(appId).then(function(appItem) {
        if(appItem.access === "public") {
          return {};
        } else {
          return IdentityManager.checkAppAccess(sharingUrl, oauthappid);
        }
      });
    }
  };

  mo.getStyleColorInTheme = function(styleName) {
    var def = new Deferred();
    var appConfig, url;
    if (window && window.isBuilder) {
      url = "./stemapp/themes/";
      appConfig = window.appConfig;//for builder
    } else {
      url = "./themes/";
      appConfig = window.getAppConfig();//for app
    }

    if (appConfig && appConfig.theme.customStyles && appConfig.theme.customStyles.mainBackgroundColor) {
      def.resolve(appConfig.theme.customStyles.mainBackgroundColor);
      return def.promise;
    }
    var t = appConfig.theme.name;
    var s = appConfig.theme.styles[0];//current theme
    if (styleName) {
      s = styleName;//specific styleName
    }
    url = url + t + "/manifest.json";
    esriRequest({
      url: url,
      handleAs: 'json'
    }).then(lang.hitch(this, function (data) {
      if (data && data.styles) {
        var styles = data.styles;
        for (var i = 0; i < styles.length; i++) {
          var st = styles[i];
          if (st.name === s) {
            def.resolve(st.styleColor);
          }
        }
      }
    }), lang.hitch(this, function(err) {
      console.error(err);
      def.reject(null);
    }));
    return def.promise;
  };

  //for 8.1 ,#16917
  // nodes : {link, logo, icon}
  mo.themesHeaderLogoA11y = function (appConfig, tabIndex, nodes) {
    if (appConfig.logoLink) {
      html.setAttr(nodes.link, 'href', appConfig.logoLink);
      html.setAttr(nodes.link, 'tabIndex', tabIndex);
      html.setAttr(nodes.link, 'target', '_blank');
      html.setAttr(nodes.logo, 'alt', appConfig.logoLink);
      html.setStyle(nodes.icon, 'cursor', 'pointer');
    } else {
      html.setAttr(nodes.link, 'href', 'javascript:void(0)');
      html.setAttr(nodes.link, 'tabIndex', -1);
      html.setAttr(nodes.link, 'target', '');
      html.removeAttr(nodes.logo, 'alt');
      html.setAttr(nodes.logo, 'role', 'presentation');
      html.setStyle(nodes.icon, 'cursor', 'default');
    }

    if (appConfig.logoAlt) {
      html.setAttr(nodes.logo, 'alt', appConfig.logoAlt);
    }
  };
        mo.startTour = function(){
          tourDialogOnScreenWidget = document.getElementById("tourDialog2");
          if (tourDialogOnScreenWidget==null){
              tourDialogOnScreenWidget = new TooltipDialog({
                id: 'tourDialog2',
                "class" : "tourDialog",
                content: ""
              });
          }
           var overlayElement = document.getElementById("overlay");
           if (overlayElement==null){
                var overlay1 = dojo.create('div', {
                  "class": "overlayOnScreenWidget",
                  "id": "overlay"
                }, dojo.byId('main-page'));
           }           
    
           var overlay2Element = document.getElementById("overlay");
           if (overlay2Element==null){
                var overlay2 = dojo.create('div', {
                  "class": "overlay2OnScreenWidget",
                  "id": "overlay2"
                }, dojo.byId('main-page'));
           }
    
            //Close the tour main widget   
            numberStops = window.helpTour.length;
            for (i=0; i<numberStops; i++) {
                var widgetName = window.helpTour[i].widgetName;
                if (widgetName!=null){
                    if (window.PanelId.toUpperCase().indexOf(widgetName.toUpperCase()) >= 0) {
                        stop = i;
                    }               
                }            
            }  
            this._nextStop(stop);           
        };
    
        mo._nextStop = function(stop){            
            
             if(tourDialogOnScreenWidget!=null){
                popup.close(tourDialogOnScreenWidget);
             }
    
             //change z-index to selected element
             for (i=0; i<numberStops; i++) {
                $('#'+window.helpTour[i].highlight).css('z-index', '');
              }
             if (window.helpTour[stop].highlight) {
                $('#'+window.helpTour[stop].highlight).css('z-index', '998');
             }    
    
             nodeToHelp = window.helpTour[stop].node;
             numberStops = window.helpTour.length;
             if ((stop != 0) && (stop != numberStops -1)){                      
                helperClass1 = window.formatters[window.helpTour[stop].helpFile+"1"];
                helperClass2 = window.formatters[window.helpTour[stop].helpFile+"2"];
                helpContent = new helperClass1();
                helpContent2 = new helperClass2();                     
             }
             else {
                 helperClass = window.formatters[window.helpTour[stop].helpFile];
                 helpContent = new helperClass();                        
             }
           
              var newDiv = document.createElement("div");
              var newlink = document.createElement('a');
              newlink.setAttribute('class', 'exit_buttonOnScreenWidget');

              newlink.innerHTML = '&#10006';
              newlink.setAttribute('title', 'close');
              newDiv.appendChild(newlink);
              helpContent.domNode.insertBefore(newDiv, helpContent.domNode.firstChild);
              
              
              var newDiv = document.createElement("div");
              newlink = document.createElement('button');

			  newlink.innerHTML = 'More information';
			  newlink.setAttribute('title', 'More information');
			  newlink.setAttribute('class', 'topicHeader');
			  newlink.setAttribute('style', 'width:100%;background-color: #9aadbb; margin-top:20px');
			  newlink.setAttribute('id', 'helpContent2TriggerButton');
			  newDiv.appendChild(newlink);
			  helpContent.domNode.appendChild(newDiv);
                
                
              if ((stop != 0) && (stop != numberStops -1)){  
                  helpContent.domNode.appendChild(helpContent2.domNode);
              }

              tourDialogOnScreenWidget.set("content", helpContent);
              var dialogHeightTotal = 770; 

              popup.open({
                    popup: tourDialogOnScreenWidget,
                    around: dom.byId(nodeToHelp),
                    orient: window.helpTour[stop].orient,
                    maxHeight: dialogHeightTotal,
                    'overflow-y':'hidden',
                    padding: {x:100, y:100}
                    }); 
                    
                    elemHelpContents1 = document.getElementsByClassName("helpContent1");
                    Content1Height = 0;
                    for (ii = 0; ii< elemHelpContents1.length; ii++)
                    {
                        if (elemHelpContents1.item(ii).clientHeight > Content1Height) {
                            Content1Height = elemHelpContents1.item(ii).clientHeight;
                        }
                    }
                    
                    elemHelpContent2Height = dialogHeightTotal-Content1Height-75;                
                    elemHelpContents2 = document.getElementsByClassName("helpContent2");
                    for (ii = 0; ii< elemHelpContents2.length; ii++) {
                        elemHelpContent2 = elemHelpContents2.item(ii);
                        
                        if (elemHelpContent2 != null)
                        {
                            
                            elemHelpContent2.style.height = elemHelpContent2Height.toString()+"px";
                        }                             
                    }
                    
                    popupContentsForScroll = document.getElementsByClassName("dijitTooltipDialogPopup");
                    for (ii = 0; ii< popupContentsForScroll.length; ii++) {
                        popupContentForScroll = popupContentsForScroll.item(ii);
                        
                        if (popupContentForScroll != null) {
                            popupContentForScroll.style.overflow='hidden';
                        }
                    }

	    		elemHelpContents2 = document.getElementsByClassName("helpContent2");
	    		for (ii = 0; ii< elemHelpContents2.length; ii++) {
		            elemHelpContent2 = elemHelpContents2.item(ii);
		
		            if (elemHelpContent2 != null)
		            {
		                elemHelpContent2.style.display = 'None';
		                window.displayMoreInfor = "true";
		            }      
	            }  
	            document.getElementById("helpContent2TriggerButton").addEventListener("click", displayMoreInformation); 
                                                    
              exitButtons = document.getElementsByClassName("exit_buttonOnScreenWidget");

              for (ii = 0; ii< exitButtons.length; ii++)
              {
                  exitButton = exitButtons.item(ii);
                  exitButton.addEventListener('click', function () {
                        mo._endTour();
                  });                   
              }
                    
          
        };
    
        
        mo._endTour = function(){
            popup.close(tourDialogOnScreenWidget);
            var pTourDialog = registry.byId('tourDialog2');
            if (pTourDialog) {               
               pTourDialog.destroyRecursive();
            }         

            dojo.destroy("overlay");
            dojo.destroy("overlay2");
            for (i=0; i<numberStops; i++) {
                $('#'+window.helpTour[i].highlight).css('z-index', '');
              }

           console.log("End the Guided Tour 2");
        };
  return mo;
});
