///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 Esri. All Rights Reserved.
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

define(["./ConfigManager",
    "./LayoutManager",
    './DataManager',
    'dojo/_base/html',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/on',
    'dojo/mouse',
    'dojo/topic',
    'dojo/cookie',
    'dojo/Deferred',
    'dojo/promise/all',
    'dojo/io-query',
    'dojo/domReady!',
    'esri/request',
    'esri/urlUtils',
    'esri/IdentityManager',
    'jimu/portalUrlUtils',
    './utils',
    'require',
    'dojo/i18n',
    'dojo/i18n!./nls/main'
  ],
  function(ConfigManager, LayoutManager, DataManager, html, lang, array, on, mouse, topic, cookie,
    Deferred, all, ioquery, domReady, esriRequest, urlUitls, IdentityManager, portalUrlUtils,
    jimuUtils, require, i18n, mainBundle) {
    /* global jimuConfig:true */
    var mo = {};

    window.layerIdPrefix = "eaLyrNum_";
    window.layerIdBndrPrefix = "eaLyrBndrNum_";
    window.layerIdPBSPrefix = "eaLyrPBSNum_";
    window.layerIdTiledPrefix = "tiledNum_";
    window.addedLayerIdPrefix = "added_";
    window.removeAllMessage = "removeAll";
    window.chkTopicPrefix = "ckTopic_";
    window.chkTopicPBSPrefix = "ckTopicPBS_";
    
    window.dataFactSheet = "https://enviroatlas.epa.gov/enviroatlas/DataFactSheets/pdf/";
    //window.matadata = "https://edg.epa.gov/metadata/catalog/search/resource/details.page?uuid=%7BBDF514A6-05A8-400D-BF3D-030645461334%7D";
	window.matadata = "https://edg.epa.gov/metadata/catalog/search/resource/details.page";//?uuid=%7BBDF514A6-05A8-400D-BF3D-030645461334%7D";
    
    window.bFirstLoadFilterWidget = true;
    window.allLayerNumber = [];
    window.nationalLayerNumber = [];
    window.layerID_Portal_WebMap = [];
    window.categoryDic = {};
    window.categoryDic["Clean Air"] = "cair";
    window.categoryDic["Clean and Plentiful Water"] = "cpw";
    window.categoryDic["Climate Stabilization"] = "clim";
    window.categoryDic["Natural Hazard Mitigation"] = "nhm";
    window.categoryDic["Recreation, Culture, and Aesthetics"] = "rca";
    window.categoryDic["Food, Fuel, and Materials"] ="ffm";
    window.categoryDic["Biodiversity Conservation"] = "biod";
    //window.categoryDic["People and Built Spaces"] = "pbs";
    //window.categoryDic["Supplemental"] = "sup";
    window.categoryClassSupply = "Supply";
    window.categoryClassDemand = "Demand";
    window.categoryClassDriver = "Driver";
    window.categoryClassSpatialExplicit = "Spatially Explicit";
    window.topicDic = {};
    window.topicDic["Carbon Storage"] = "CS";
    window.topicDic["Climate and Weather"] = "CaW";
    window.topicDic["Crop Productivity"] = "CP";
    //window.topicDic["Demographics"] = "D";
    window.topicDic["Ecosystem Markets"] = "EM";
    window.topicDic["Ecosystem Type"] = "ET";
    window.topicDic["Energy Potential"] = "EP";
    window.topicDic["Engagement with Outdoors"] = "EwO";
    window.topicDic["Health and Economic Outcomes"] = "HaEO";
    window.topicDic["Impaired Waters"] = "IW";
    window.topicDic["Land Cover: Near-Water"] = "LCNW";
    window.topicDic["Land Cover: Type"] = "LCT";
    window.topicDic["Landscape Pattern"] = "LP";
    window.topicDic["Near-Road Environments"] = "NRE";
    window.topicDic["Pollutant and Runoff Reduction"] = "PaRR";
    window.topicDic["Pollutants: Nutrients"] = "PN";
    window.topicDic["Pollutants: Other"] = "PO";
    window.topicDic["Protected Lands"] = "PL";
    window.topicDic["Species: At-Risk and Priority"] = "SARP";
    window.topicDic["Species: Game"] = "SG";
    window.topicDic["Species: Other"] = "SO";
    window.topicDic["Water Supply and Hydrology"] = "WSaH";
    window.topicDic["Water Use"] = "WU";
    window.topicDic["Wetlands and Lowlands"] = "WaL";
	window.topicDicPBS = {};
    window.topicDicPBS["Housing and Facilities"] = "HaF";
    window.topicDicPBS["Community Demographics"] = "CD";
    window.topicDicPBS["Employment"] = "E";
    window.topicDicPBS["National Demographics"] = "ND";
    window.topicDicPBS["Commuting and Walkability"] = "CaW";
    
    window.strAllCommunity = "AllCommunity";	
    window.communityDic = {};
	window.communityDic["ATX"] = "Austin, TX";
	window.communityDic["DMIA"] = "Des Moines, IA";
    window.communityDic["DNC"]= "Durham, NC";
    window.communityDic["FCA"] = "Fresno, CA";
    window.communityDic["GBWI"] = "Green Bay, WI";
    window.communityDic["MTN"] = "Memphis, TN";
    window.communityDic["MWI"] = "Milwaukee, WI";
    window.communityDic["NBMA"] = "New Bedford, MA";
    window.communityDic["NYNY"] = "New York, NY";
    window.communityDic["PNJ"] = "Paterson, NJ";
    window.communityDic["PAZ"] = "Phoenix, AZ";
    window.communityDic["PitPA"] = "Pittsburgh, PA";
    window.communityDic["PME"] = "Portland, ME"
    window.communityDic["POR"] = "Portland, OR"
    window.communityDic["TFL"] = "Tampa, FL";
    window.communityDic["WIA"] = "Woodbine, IA";
    
    window.communitySelected = window.strAllCommunity;
    
    window.communitySelectedByTheOtherFrame = window.strAllCommunity;
    //variables that are used for synchronize map
    window.changedExtentByOtherFrameXmin = null;
    window.changedExtentByOtherFrameXmax = null;   
    window.changedExtentByOtherFrameYmin = null;
    window.changedExtentByOtherFrameYmax = null;   
    window.frameBeClicked = 1;
    window.communityMetadataDic = {};
    window.faildedLayerDictionary = {};
    window.successLayerDictionary = {};
                
    //patch for JS API 3.10
    var hasMethod = typeof cookie.getAll === 'function';
    if (!hasMethod) {
      cookie.getAll = function(e) {
        var result = [];
        var v = cookie(e);
        if (v) {
          result.push(v);
        }
        return result;
      };
    }

    //jimu nls
    window.jimuNls = mainBundle;

    IdentityManager.setProtocolErrorHandler(function() {
      return true;
    });

    var ancestorWindow = jimuUtils.getAncestorWindow();
    var parentHttps = false;

    try {
      parentHttps = ancestorWindow.location.href.indexOf("https://") === 0;
    } catch (err) {
      console.log(err);
      parentHttps = window.location.protocol === "https:";
    }

    esriRequest.setRequestPreCallback(function(ioArgs) {
      if (ioArgs.content && ioArgs.content.printFlag) { // printTask
        ioArgs.timeout = 300000;
      }

      //use https protocol
      if (parentHttps) {
        var patt = /^http(s?):\/\//gi;
        ioArgs.url = ioArgs.url.replace(patt, '//');
      }

      //working around an arcgis server feature service bug.
      //Requests to queryRelatedRecords operation fail with feature service 10.
      //Detect if request conatins the queryRelatedRecords operation
      //and then change the source url for that request to the corresponding mapservice.
      if (ioArgs.url.indexOf("/queryRelatedRecords?") !== -1) {
        if (!jimuUtils.isHostedService(ioArgs.url)) { // hosted service doesn't depend on MapServer
          ioArgs.url = ioArgs.url.replace("FeatureServer", "MapServer");
        }
      }

      return ioArgs;
    });


    // disable middle mouse button scroll
    on(window, 'mousedown', function(evt) {
      if (!mouse.isMiddle(evt)) {
        return;
      }

      evt.preventDefault();
      evt.stopPropagation();
      evt.returnValue = false;
      return false;
    });

    String.prototype.startWith = function(str) {
      if (this.substr(0, str.length) === str) {
        return true;
      } else {
        return false;
      }
    };

    String.prototype.endWith = function(str) {
      if (this.substr(this.length - str.length, str.length) === str) {
        return true;
      } else {
        return false;
      }
    };

    /*jshint unused: false*/
    if (typeof jimuConfig === 'undefined') {
      jimuConfig = {};
    }
    jimuConfig = lang.mixin({
      loadingId: 'main-loading',
      loadingImageId: 'app-loading',
      loadingGifId: 'loading-gif',
      layoutId: 'jimu-layout-manager',
      mapId: 'map',
      mainPageId: 'main-page',
      timeout: 5000,
      breakPoints: [600, 1280]
    }, jimuConfig);

    window.wabVersion = '1.3';
    window.productVersion = 'Web AppBuilder for ArcGIS (Developer Edition) 1.2';
    // window.productVersion = 'Online 3.8';

    function initApp() {
      var urlParams, configManager, layoutManager;
      console.log('jimu.js init...');
      urlParams = getUrlParams();

      DataManager.getInstance();

      html.setStyle(jimuConfig.loadingId, 'display', 'none');
      html.setStyle(jimuConfig.mainPageId, 'display', 'block');

      layoutManager = LayoutManager.getInstance({
        mapId: jimuConfig.mapId
      }, jimuConfig.layoutId);
      configManager = ConfigManager.getInstance(urlParams);

      layoutManager.startup();
      configManager.loadConfig();
    }

    function getUrlParams() {
      var s = window.location.search,
        p;
      if (s === '') {
        return {};
      }

      p = ioquery.queryToObject(s.substr(1));
      return p;
    }

    mo.initApp = initApp;
    return mo;
  });