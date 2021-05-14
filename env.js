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

//****************************************************************
//The main function of the env.js is to initialize apiUrl and path
//****************************************************************

/* jshint unused: false */

/********************************
Global variables:
  isXT: XT builder or not. This variable is set by builder node server.
  isBuilder: is builder or app. This flag is used to distinguish the build and app in jimu.js
  isRunInPortal: whether the app/builder is in portal or not.
  builderNls: the builder nls bundle
  portalUrl: the portal url
  configWindow: in builder only, the config app window object
  previewWindow: in builder only, the preview app window object
  setConfigViewerTopic: in builder only, used to communicate between builder and config window
  setPreviewViewerTopic: in builder only, used to communicate between builder and preview window
  appId: in builder only, the current opened app id.

  apiUrl: the URL of the ArcGIS API for JavaScript
  allCookies: all cookies
  path: the builder/app path section in window.location
  appPath: the app's path. In app, it's the same with path; In builder, it's not.
  queryObject: the query parameters
  jimuNls: the jimu nls bundle
  isRTL: the language is right to left,
  wabVersion: the wab version, like 1.1, 1.2
  productVersion: the product version, like portal10.3, online3.5, developer edition1.0

  dojoConfig: the dojo config object
  jimuConfig: defined in jimu/main

  weinreUrl: for mobile debug
  debug: boolean. If it's debug mode, the app will load weinre file

Global functions:
  loadResource: load JS or CSS
  loadResources: load array of JS or CSS
  testLoad: load JS/CSS by condition
  loadingCallback: the resources loaded callback
*******************************/
/*global testLoad, ActiveXObject */
var
  //    the URL of the ArcGIS API for JavaScript, you can change it to point to your own API.
  apiUrl = null,

  //weinreUrl: String
  //    weinre is a tool which can help debug the app on mobile devices.
  //    Please see: http://people.apache.org/~pmuellr/weinre/docs/latest/Home.html
  weinreUrl = '//launch.chn.esri.com:8081/target/target-script-min.js',

  //debug: Boolean
  //    If it's debug mode, the app will load weinre file
  debug = false,

  //deprecated, use appInfo.appPath instead
  path = null,

  isXT = false,

  allCookies,

  verboseLog = true,

  //This version number will be appended to URL to avoid cache.
  //The reason we do not use wabVersion is to avoid force user to change wabVersion when they are customizing app.
  deployVersion = '2.17';

// console.time('before map');

/////Builder server will remove this line's comment, so set isXT flag to true

//isXT = true;

/////////////////////////////////////


/////Build scripts will uncomment this line to disable verboseLog.

//verboseLog = false;

/////////////////////////////////////

(function(global){
  //init API URL
  var queryObject = getQueryObject();
  var apiVersion = '3.33';

  ////////uncomment the following line when downloading the app

  apiUrl = 'https://js.arcgis.com/3.33';

  //////////////////////////////////////////////////////////////
  allCookies = getAllCookies();

  if (queryObject.apiurl) {
    if(!checkApiUrl(queryObject.apiurl)){
      console.error('?apiurl must point to an ULR that is in the app or in esri.com/arcgis.com domain.');
      return;
    }
    apiUrl = queryObject.apiurl;
  }
  window.appInfo = {isRunInPortal: !isXT};
  if (!apiUrl) {
    if (isXT) {
      apiUrl = 'https://js.arcgis.com/' + apiVersion;
    } else {
      var portalUrl = getPortalUrlFromLocation();
      if (portalUrl.indexOf('arcgis.com') > -1) {
        if(portalUrl.indexOf('devext.arcgis.com') > -1){
          apiUrl = '//jsdev.arcgis.com/' + apiVersion;
        }else if(portalUrl.indexOf('qa.arcgis.com') > -1){
          apiUrl = '//jsqa.arcgis.com/' + apiVersion;
        }else{
          apiUrl = '//js.arcgis.com/' + apiVersion;
        }

        // apiUrl = 'https://js.arcgis.com/' + apiVersion;
      } else {
        apiUrl = portalUrl + 'jsapi/jsapi/';
      }
    }
  }

  if (apiUrl.substr(apiUrl.length - 1, apiUrl.length) !== '/') {
    apiUrl = apiUrl + '/';
  }

  path = getPath();

  function getAllCookies(){
    var strAllCookie = document.cookie;
    var cookies = {};
    if (strAllCookie) {
      var strCookies = strAllCookie.split(';');
      for(var i = 0; i < strCookies.length; i++){
        var splits = strCookies[i].split('=');
        if(splits && splits.length > 1){
          cookies[splits[0].replace(/^\s+|\s+$/gm, '')] = splits[1];
        }
      }
    }
    return cookies;
  }

  function checkApiUrl(url){
    if(/^\/\//.test(url) || /^https?:\/\//.test(url)){
      return /(?:[\w\-\_]+\.)+(?:esri|arcgis)\.com/.test(url); //api url must be in esri.com or arcgis.com
    }else{
      return true;
    }
  }

  function getPortalUrlFromLocation(){
    var portalUrl = getPortalServerFromLocation() +  getDeployContextFromLocation();
    return portalUrl;
  }

  function getPortalServerFromLocation(){
    var server = window.location.protocol + '//' + window.location.host;
    return server;
  }

  function getDeployContextFromLocation (){
    var keyIndex = window.location.href.indexOf("/home/");
    if(keyIndex < 0){
      keyIndex = window.location.href.indexOf("/apps/");
    }
    var context = window.location.href.substring(window.location.href.indexOf(
      window.location.host) + window.location.host.length + 1, keyIndex);
    if (context !== "/") {
      context = "/" + context + "/";
    }
    return context;
  }

  function getPath() {
    var fullPath, path;

    fullPath = window.location.pathname;
    if (fullPath === '/' || fullPath.substr(fullPath.length - 1) === '/') {
      path = fullPath;
    }else{
      var sections = fullPath.split('/');
      var lastSection = sections.pop();
      if (/\.html$/.test(lastSection) || /\.aspx$/.test(lastSection) ||
         /\.jsp$/.test(lastSection) || /\.php$/.test(lastSection)) {
        //index.html may be renamed to index.jsp, etc.
        path = sections.join('/') + '/';
      } else {
        return false;
      }
    }
    return path;
  }

  function getQueryObject(){
    var query = window.location.search;
    if (query.indexOf('?') > -1) {
      query = query.substr(1);
    }
    var pairs = query.split('&');
    var queryObject = {};
    for(var i = 0; i < pairs.length; i++){
      var splits = decodeURIComponent(pairs[i]).split('=');
      queryObject[splits[0]] = splits[1];
    }
    return queryObject;
  }
  function _loadPolyfills(prePath, cb) {
    prePath = prePath || "";
    var ap = Array.prototype,
      fp = Function.prototype,
      sp = String.prototype,
      loaded = 0,
      completeCb = function() {
        loaded++;
        if (loaded === tests.length) {
          cb();
        }
      },
      tests = [{
        test: window.console,
        failure: prePath + "libs/polyfills/console.js",
        callback: completeCb
      }, {
        test: ap.indexOf && ap.lastIndexOf && ap.forEach && ap.every && ap.some &&
          ap.filter && ap.map && ap.reduce && ap.reduceRight,
        failure: prePath + "libs/polyfills/array.generics.js",
        callback: completeCb
      }, {
        test: fp.bind,
        failure: prePath + "libs/polyfills/bind.js",
        callback: completeCb
      }, {
        test: Date.now,
        failure: prePath + "libs/polyfills/now.js",
        callback: completeCb
      }, {
        test: sp.trim,
        failure: prePath + "libs/polyfills/trim.js",
        callback: completeCb
      }, {
        test: window.Blob,
        failure: prePath + "libs/polyfills/Blob.js",
        callback: completeCb
      }, {
        test: window.ArrayBuffer,
        failure: prePath + "libs/polyfills/typedarray.js",
        callback: completeCb
      }, {
        test: Object.assign,
        failure: prePath + "libs/polyfills/assign.js",
        callback: completeCb
      }, {
        test: Array.prototype.includes,
        failure: prePath + "libs/polyfills/array.includes.js",
        callback: completeCb
      }, {
        test: String.prototype.includes,
        failure: prePath + "libs/polyfills/string.includes.js",
        callback: completeCb
      }];

    for(var i = 0; i < tests.length; i++){
      testLoad(tests[i]);
    }
  }

  function localeIsSame(locale1, locale2){
    return locale1.split('-')[0] === locale2.split('-')[0];
  }

  function _setRTL(locale){
    var rtlLocales = ["ar", "he"];
    var dirNode = document.getElementsByTagName("html")[0];
    var isRTLLocale = false;
    for (var i = 0; i < rtlLocales.length; i++) {
      if (localeIsSame(rtlLocales[i], locale)) {
        isRTLLocale = true;
      }
    }

    dirNode.setAttribute("lang", locale);
    if (isRTLLocale) {
      dirNode.setAttribute("dir", "rtl");
      dirNode.className += " esriRtl jimu-rtl";
      dirNode.className += " " + locale + " " +
        (locale.indexOf("-") !== -1 ? locale.split("-")[0] : "");
    }else {
      dirNode.setAttribute("dir", "ltr");
      dirNode.className += " esriLtr jimu-ltr";
      dirNode.className += " " + locale + " " +
        (locale.indexOf("-") !== -1 ? locale.split("-")[0] : "");
    }

    window.isRTL = isRTLLocale;
  }

  global._loadPolyfills = _loadPolyfills;
  global.queryObject = queryObject;
  global._setRTL = _setRTL;

  global.avoidRequireCache = function(require){
    var dojoInject = require.injectUrl;
    require.injectUrl = function(url, callback, owner){
      url = appendDeployVersion(url);
      dojoInject(url, callback, owner);
    };
  };

  global.avoidRequestCache = function (aspect, requestUtil){
    aspect.after(requestUtil, 'parseArgs', function(args){
      args.url = appendDeployVersion(args.url);
      return args;
    });
  };

  function appendDeployVersion(url){
    if(/^http(s)?:\/\//.test(url) || /^\/proxy\.js/.test(url) || /^\/\//.test(url)){
      return url;
    }
    if(url.indexOf('?') > -1){
      url = url + '&wab_dv=' + deployVersion;
    }else{
      url = url + '?wab_dv=' + deployVersion;
    }
    return url;
  }

  var _detectUserAgent = function() {
    var os = {}, browser = {},
      ua = navigator.userAgent, platform = navigator.platform,
      webkit = ua.match(/Web[kK]it[\/]{0,1}([\d.]+)/),
      android = ua.match(/(Android);?[\s\/]+([\d.]+)?/),
      osx = !!ua.match(/\(Macintosh\; Intel /),
      ipad = ua.match(/(iPad).*OS\s([\d_]+)/),
      ipod = ua.match(/(iPod)(.*OS\s([\d_]+))?/),
      iphone = !ipad && ua.match(/(iPhone\sOS)\s([\d_]+)/),
      webos = ua.match(/(webOS|hpwOS)[\s\/]([\d.]+)/),
      win = /Win\d{2}|Windows/.test(platform),
      wp = ua.match(/Windows Phone ([\d.]+)/),
      touchpad = webos && ua.match(/TouchPad/),
      kindle = ua.match(/Kindle\/([\d.]+)/),
      silk = ua.match(/Silk\/([\d._]+)/),
      blackberry = ua.match(/(BlackBerry).*Version\/([\d.]+)/),
      bb10 = ua.match(/(BB10).*Version\/([\d.]+)/),
      rimtabletos = ua.match(/(RIM\sTablet\sOS)\s([\d.]+)/),
      playbook = ua.match(/PlayBook/),
      chrome = ua.match(/Chrome\/([\d.]+)/) || ua.match(/CriOS\/([\d.]+)/),
      firefox = ua.match(/Firefox\/([\d.]+)/),
      firefoxos = ua.match(/\((?:Mobile|Tablet); rv:([\d.]+)\).*Firefox\/[\d.]+/),
      ie = ua.match(/MSIE\s([\d.]+)/) || ua.match(/Trident\/[\d](?=[^\?]+).*rv:([0-9.].)/),
      webview = !chrome && ua.match(/(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/),
      safari = webview || ua.match(/Version\/([\d.]+)([^S](Safari)|[^M]*(Mobile)[^S]*(Safari))/);

    browser.webkit = !!webkit;
    if (browser.webkit) {
      browser.version = webkit[1];
    }

    if (android) {
      os.android = true;
      os.version = android[2];
    }
    if (iphone && !ipod) {
      os.ios = os.iphone = true;
      os.version = iphone[2].replace(/_/g, '.');
    }
    if (ipad) {
      os.ios = os.ipad = true;
      os.version = ipad[2].replace(/_/g, '.');
    }
    if (ipod) {
      os.ios = os.ipod = true;
      os.version = ipod[3] ? ipod[3].replace(/_/g, '.') : null;
    }
    if (wp) {
      os.wp = true;
      os.version = wp[1];
    }
    if (webos) {
      os.webos = true;
      os.version = webos[2];
    }
    if (touchpad) {
      os.touchpad = true;
    }
    if (blackberry) {
      os.blackberry = true;
      os.version = blackberry[2];
    }
    if (bb10) {
      os.bb10 = true;
      os.version = bb10[2];
    }
    if (rimtabletos) {
      os.rimtabletos = true;
      os.version = rimtabletos[2];
    }
    if (playbook) {
      browser.playbook = true;
    }
    if (kindle) {
      os.kindle = true;
      os.version = kindle[1];
    }
    if (silk) {
      browser.silk = true;
      browser.version = silk[1];
    }
    if (!silk && os.android && ua.match(/Kindle Fire/)) {
      browser.silk = true;
    }
    if (chrome) {
      browser.chrome = true;
      browser.version = chrome[1];
    }
    if (firefox) {
      browser.firefox = true;
      browser.version = firefox[1];
    }
    if (firefoxos) {
      os.firefoxos = true;
      os.version = firefoxos[1];
    }
    if (ie) {
      browser.ie = true;
      browser.version = ie[1];
    }
    if (safari && (osx || os.ios || win)) {
      browser.safari = true;
      if (!os.ios) {
        browser.version = safari[1];
      }
    }
    if (webview) {
      browser.webview = true;
    }

    os.tablet = !!(ipad || playbook || (android && !ua.match(/Mobile/)) ||
    (firefox && ua.match(/Tablet/)) || (ie && !ua.match(/Phone/) && ua.match(/Touch/)));
    os.phone = !!(!os.tablet && !os.ipod && (android || iphone || webos || blackberry || bb10 ||
    (chrome && ua.match(/Android/)) || (chrome && ua.match(/CriOS\/([\d.]+)/)) ||
    (firefox && ua.match(/Mobile/)) || (ie && ua.match(/Touch/))));

    return {
      os: os,
      browser: browser
    };
  };
  var _isMobileUa = function() {
    var uaInfo = global.userAgent;
    if (true === uaInfo.os.phone || true === uaInfo.os.tablet) {
      return true;
    } else {
      return false;
    }
  };
  global.userAgent = _detectUserAgent();
  global.isMobileUa = _isMobileUa();
})(window);
