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

define(['dojo/_base/declare',
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dijit/_WidgetsInTemplateMixin',
    'dojo/_base/lang',
    'dojo/_base/array',
    "dojo/dom-class",
    'dojo/_base/html',
    'dojo/on',
    'dojo/keys',
    'dijit/Tooltip',
    'dojo/topic',
    "dojo/query",
    "jimu/utils",
    "jimu/shareUtils",
    'dojo/_base/config',
    "dojo/cookie",
    //"jimu/Query",
    'dojo/text!./templates/ShareLink.html',
    "dojo/string",
    "dijit/form/Select",
    "dijit/form/NumberTextBox",
    "dojo/dom-attr",
    'dojo/Deferred',
    'esri/request',
    //'esri/tasks/query',
    //'esri/tasks/QueryTask',
    'jimu/dijit/FilterParameters',
    'esri/symbols/jsonUtils',
    'esri/InfoTemplate',
    'jimu/LayerInfos/LayerInfos',
    "esri/symbols/PictureMarkerSymbol",
    "esri/graphic",
    "esri/layers/GraphicsLayer",
    'jimu/dijit/FeaturelayerChooserFromMap',
    'jimu/dijit/LayerChooserFromMapWithDropbox',
    "dijit/form/TextBox",
    "dijit/form/Textarea",
    "dijit/form/RadioButton",
    "jimu/dijit/CheckBox",
    "dijit/form/SimpleTextarea",
    "dijit/form/ValidationTextBox"
  ],
  function(declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, lang, array, dojoClass, html,
           on, keys, Tooltip, topic, dojoQuery, jimuUtils, shareUtils, dojoConfig, dojoCookie,// jimuQuery,
           template, dojoString, Select, NumberTextBox, domAttr, Deferred,
           esriRequest, /*EsriQuery,*/ FilterParameters, symbolJsonUtils, InfoTemplate, LayerInfos,
           PictureMarkerSymbol, Graphic, GraphicsLayer, FeaturelayerChooserFromMap, LayerChooserFromMapWithDropbox) {
    var so = declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
      templateString: template,
      declaredClass: "jimu.dijit.ShareLink",
      bitlyUrl: "https://arcg.is/prod/shorten",
      share: {
        shareEmailSubject: "",
        shareTwitterTxt: "",
        languages: ["ar", "cs", "da", "de", "en", "el", "es", "et", "fi", "fr", "he", "hr",
          "it", "ja", "ko", "lt", "lv", "nb", "nl", "pl", "pt-br", "pt-pt", "ro", "ru", "sr",
          "sv", "th", "tr", "zh-cn", "vi", "zh-hk", "zh-tw"],
        DEFAULT_MOBILE_LAYOUT: 600
      },
      _hasZoomLevelMarkerAdded: false,
      _hasMapScaleMarkerAdded: false,
      _hasAddMarkerMarkerAdded: false,
      HAS_INIT_URL: false,//flag for have got shortLink OR fail to fetch shortLink

      MAX_LAYER_VISIBILITY_LEN: 2048,

      //https://developers.arcgis.com/web-appbuilder/guide/app-url-parameters-for-dev.htm
      postMixInProperties: function() {
        this.inherited(arguments);
        this.nls = window.jimuNls.shareLink;
        this.nls.symbol = window.jimuNls.common.symbol;
        this.nls.label = window.jimuNls.common.label;
        this.nls.WKID = window.jimuNls.common.wkid || "wkid";
        this.nls.popupTitle = window.jimuNls.shareLink.popupTitle || "Pop-up title";
        this.nls.zoomLevel = window.jimuNls.shareLink.zoomLevel || "Zoom level";
        this.nls.asc = window.jimuNls.common.asc;
        this.nls.desc = window.jimuNls.common.desc;

        this.share.shareEmailSubject = this.nls.shareEmailSubject + " " + "${appTitle} ";
        this.share.shareTwitterTxt = this.nls.shareEmailSubject + "${appTitle}\n";
      },
      postCreate: function() {
        this.inherited(arguments);
        this._initUI();
        this._initMap();
        this._showSocialMediaLinksByConfig();
      },
      constructor: function(options) {
        if (!options) {
          return;
        }
        this._portalUrl = options.portalUrl;
        this._isOnline = options.isOnline;
        this._appTitle = options.appTitle;
        this._isShowBackBtn = options.isShowBackBtn;
        this._isShowSocialMediaLinks = options.isShowSocialMediaLinks;
        this._isSharedToPublic = options.isSharedToPublic;
        this._isShowFindLocation = options.isShowFindLocation;
        this._config = options.config;

        // this._queryState = {
        //   jimuQuery: null,
        //   querying: false,
        //   fields: ""
        // };
      },
      startup: function() {
        this.baseHrefUrl = shareUtils.getBaseHrefUrl(this._portalUrl);
        if (typeof this.optionSrc === "undefined") {
          this.optionSrc = "currentMapExtent";
        }

        this.updateUrl(null);
        //this._linkUrlTextBox.focus();
        // var shareLinkOptionsWrapper = dojoQuery(".shareLinkOptionsWrapper", this.domNode);
        // var labels = dojoQuery("label", shareLinkOptionsWrapper[0]);
        // this.own(on(labels, "click", lang.hitch(this, function(result) {
        //   var tar = domAttr.get(result.srcElement, "data-forid");
        //   // this[""+tar].emit("click", {
        //   //   bubbles: true,
        //   //   cancelable: true
        //   // });
        //   this[""+tar].onclick();
        // })));
        this._initOptions();
        this._initOptionsEvent();

        var shareLinkOptionsWrapper = dojoQuery(".shareLinkOptionsWrapper", this.domNode);
        this.own(on(shareLinkOptionsWrapper, "keydown", lang.hitch(this, function(evt){
          if(evt.keyCode === keys.ESCAPE){
            evt.stopPropagation();
            this.backBtn.focus();
          }
        })));
        this.own(on(this.preview, "keydown", lang.hitch(this, function(evt){
          if(!evt.shiftKey && evt.keyCode === keys.TAB){
            evt.preventDefault();
            this.backBtn.focus();
          }
        })));

      },
      destroy: function() {
        this._cleanMarkerStatus();
        if (this._mapClickHandler) {
          this._mapClickHandler = null;
        }
        this.inherited(arguments);
      },

      //for parent Plugin, set "_isSharedToPublic"
      onShareToPublicChanged: function(isEveryoneChecked) {
        this._isSharedToPublic = isEveryoneChecked;
        this.updateUrl(null);

        if (this._isSharedToPublic) {
          dojoClass.add(this.shareTips, "displaynone");
        } else {
          dojoClass.remove(this.shareTips, "displaynone");
        }
      },
      //for parent Plugin, set "_isShowSocialMediaLinks"
      // onShareCheckChanged: function(isShowSocialMediaLinks) {
      //   //change loaclhost to arcgis href, onLine only
      //   this._isShowSocialMediaLinks = isShowSocialMediaLinks;
      //   if (this._isOnline) {
      //     this.updateUrl();
      //   }
      //
      //   if (this._isShowSocialMediaLinks) {
      //     dojoClass.remove(this.socialNetworkLinks, "displaynone");
      //   } else {
      //     dojoClass.add(this.socialNetworkLinks, "displaynone");
      //   }
      // },
      //for parent Plugin, to close window
      onCloseContainer: function() {
        this._cleanMarkerStatus();
      },
      updateShareLinkOptionsUI: function(opstions) {
        if (opstions) {
          if (typeof opstions.isShowFindLocation !== "undefined" && this.findLocationRow) {
            if (false === opstions.isShowFindLocation) {
              dojoClass.add(this.findLocationRow, "displaynone");
            } else if (true === opstions.isShowFindLocation) {
              dojoClass.remove(this.findLocationRow, "displaynone");
            }
          }
        }
      },
      _initMap: function() {
        this.layerInfosObj = LayerInfos.getInstanceSync();
        this.own(on(this.layerInfosObj, "layerInfosIsVisibleChanged", lang.hitch(this, this._watchLayerChange)));

        if (window.isBuilder) {
          this.own(topic.subscribe("app/mapLoaded", lang.hitch(this, this._onMapLoaded)));
          this.own(topic.subscribe("app/mapChanged", lang.hitch(this, this._onMapLoaded)));
        } else {
          this.own(topic.subscribe("mapLoaded", lang.hitch(this, this._onMapLoaded)));
          this.own(topic.subscribe("mapChanged", lang.hitch(this, this._onMapLoaded)));
        }
        if (window._widgetManager.map) {
          this.map = window._widgetManager.map;
          this._mapEventUpdateUrls();
          this._addGraphicsLayer();
        }
      },
      _onMapLoaded: function(map) {
        this.map = map;
        this._mapEventUpdateUrls();
        this._addGraphicsLayer();
      },
      _mapEventUpdateUrls: function() {
        if (this.map) {
          this.own(on(this.map, "pan-end", lang.hitch(this, function() {
            this._mapEventHandler("pan-end");
          })));
          this.own(on(this.map, "resize", lang.hitch(this, function() {
            this._mapEventHandler("resize");
          })));
          this.own(on(this.map, "zoom-end", lang.hitch(this, function() {
            this._mapEventHandler("zoom-end");
          })));
        }
      },
      _mapEventHandler: function() {
        //url changes in linkOptions page only
        if (this._isShareLinkOptionsShow()) {
          this.updateUrl();
        }
      },

      _showSocialMediaLinksByConfig: function() {
        if (this._config && this._config.socialMedias) {
          if (typeof this._config.socialMedias.email !== "undefined" &&
            this._config.socialMedias.email === false) {
            dojoClass.add(this.emailShare, "displaynone");
          }
          if (typeof this._config.socialMedias.facebook !== "undefined" &&
            this._config.socialMedias.facebook === false) {
            dojoClass.add(this.FacebookShare, "displaynone");
          }
          if (typeof this._config.socialMedias.twitter !== "undefined" &&
            this._config.socialMedias.twitter === false) {
            dojoClass.add(this.TwitterShare, "displaynone");
          }
          if (typeof this._config.socialMedias.googlePlus !== "undefined" &&
            this._config.socialMedias.googlePlus === false) {
            dojoClass.add(this.googlePlusShare, "displaynone");
          }
        }
      },

      _initUI: function() {
        //back btn
        if (!this._isShowBackBtn) {
          dojoClass.add(this.backBtn, "displaynone");
        } else {
          domAttr.set(this.backBtn, "title", window.jimuNls.common.back);
          this.own(on(this.backBtn, "click", lang.hitch(this, this._toggleLinkOptions)));
          this.own(on(this.backBtn, "keydown", lang.hitch(this, function(evt){
            if(evt.keyCode === keys.ENTER || evt.keyCode === keys.SPACE || evt.keyCode === keys.ESCAPE){
              this._toggleLinkOptions();
              this.linkOptions.focus();
            }else if(evt.shiftKey && evt.keyCode === keys.TAB){
              evt.preventDefault();
              this.preview.textbox.focus();
            }
          })));
        }
        //socialNetworkLinks
        if (false === this._isShowSocialMediaLinks) {
          dojoClass.toggle(this.socialNetworkLinks, "displaynone");
        }
        //shareTips
        if (true === this._isSharedToPublic) {
          dojoClass.toggle(this.shareTips, "displaynone");
        }
        this.own(on(this.linkOptions, "click", lang.hitch(this, this._toggleLinkOptions)));
        this.own(on(this.linkOptions, "keydown", lang.hitch(this, this._toggleLinkOptionsKeydown)));
        this._setInputsClicktoSelect(this._linkUrlTextBox);

        //add tooltip for icons
        jimuUtils.addTooltipByDomNode(Tooltip, this.emailShare, this.nls.shareEmail);
        jimuUtils.addTooltipByDomNode(Tooltip, this.FacebookShare, this.nls.shareFacebook);
        jimuUtils.addTooltipByDomNode(Tooltip, this.TwitterShare, this.nls.shareTwitter);
        jimuUtils.addTooltipByDomNode(Tooltip, this.googlePlusShare, this.nls.shareGooglePlus);

        //this.own(on(this.emailShare, "click", lang.hitch(this, this._toEmail)));
        this.own(on(this.googlePlusShare, "click", lang.hitch(this, this._toGooglePlus)));
        this.own(on(this.googlePlusShare, "keydown", lang.hitch(this, this._toGooglePlusKeyDown)));
        this._setInputsClicktoSelect(this._embedCodeTextArea);

        this.own(on(this.MoreOptionsContainer, "keydown", lang.hitch(this, function(evt){
          if(evt.keyCode === keys.ESCAPE){
            evt.stopPropagation();
            this._moreOptionsExpandCollapse();
            this.MoreOptions.focus();
          }
        })));

        this._sizeOptions = new Select({
          options: [{
            label: this.nls.smallSize,
            value: "small",
            selected: !0
          }, {
            label: this.nls.mediumSize,
            value: "medium",
            selected: !1
          }, {
            label: this.nls.largeSize,
            value: "large",
            selected: !1
          }, {
            label: this.nls.customSize,
            value: "custom",
            selected: !1
          }],
          "class": "sizeOptionsSelect"
        });
        this._sizeOptions.placeAt(this.SizeSelect);
        this.own(on(this._sizeOptions, "change", function(a) {
          switch (a) {
            case "small":
              this._widthTextBox.set("value", 300);
              this._heightTextBox.set("value", 200);
              dojoClass.add(this.CustomSizeContainer, "disable");
              this._updateEmbedCodeFrameSize();
              break;
            case "medium":
              this._widthTextBox.set("value", 800);
              this._heightTextBox.set("value", 600);
              dojoClass.add(this.CustomSizeContainer, "disable");
              this._updateEmbedCodeFrameSize();
              break;
            case "large":
              this._widthTextBox.set("value", 1080);
              this._heightTextBox.set("value", 720);
              dojoClass.add(this.CustomSizeContainer, "disable");
              this._updateEmbedCodeFrameSize();
              break;
            case "custom":
              dojoClass.remove(this.CustomSizeContainer, "disable");
          }
        }.bind(this)));
        this.own(on(this._sizeOptions, "keydown", function(evt) {
          if (evt.shiftKey && evt.keyCode === keys.TAB) {
            evt.preventDefault();
            this._moreOptionsExpandCollapse();
            this.MoreOptions.focus();
          }
        }.bind(this)));
        //widthTextBox
        this._widthTextBox = new NumberTextBox({
          "class": "sizeTextBox inputsText",
          value: 300,
          constraints: {
            pattern: "#",
            places: 0
          }
        });
        this._widthTextBox.placeAt(this.CustomSizeContainer, 1);
        this.own(on(this._widthTextBox, "change", function(a) {
          if (200 > a) {
            this._widthTextBox.set("value", 200 > a ? 200 : a);
          } else {
            this._updateEmbedCodeFrameSize();
          }
        }.bind(this)));
        this._heightTextBox = new NumberTextBox({
          "class": "sizeTextBox inputsText",
          value: 200,
          constraints: {
            pattern: "#",
            places: 0
          }
        });
        this._heightTextBox.placeAt(this.CustomSizeContainer, 3);
        this.own(on(this._heightTextBox, "change", function(a) {
          if (200 > a) {
            this._heightTextBox.set("value", 200 > a ? 200 : a);
          } else {
            this._updateEmbedCodeFrameSize();
          }
        }.bind(this)));
        this.own(on(this._heightTextBox, "keydown", function(evt) {
          if (!evt.shiftKey && evt.keyCode === keys.TAB) {
            evt.preventDefault();
            this._moreOptionsExpandCollapse();
            this.MoreOptions.focus();
          }
        }.bind(this)));

        this.mobileLayout.set("value", this.share.DEFAULT_MOBILE_LAYOUT);

        //hide findLocation
        //var isShowUseOrg = !!(this._isOnline && this._isSharedToPublic);
        this.updateShareLinkOptionsUI({
          isShowFindLocation: this._isShowFindLocation
        });

        this._setInputsClicktoSelect(this.preview);
      },
      _setLinkUrl: function(shortenedUrl) {
        this._linkUrlTextBox.set("value", shortenedUrl);
        //select the whole text when dijit is focused at first time.
        if(html.hasClass(this._linkUrlTextBox.domNode, 'dijitFocused')){
          this._linkUrlTextBox.textbox.select();
        }
        domAttr.set(this._linkUrlTextBox.domNode, "data-old", shortenedUrl);
      },
      _setEmbedCode: function(url) {
        var b = '\x3ciframe width\x3d"' + this._widthTextBox.value + '" height\x3d"' + this._heightTextBox.value +
          '" frameborder\x3d"0" scrolling\x3d"no" allowfullscreen src\x3d"';
        b = b + url + '"\x3e\x3c/iframe\x3e';
        this._embedCodeTextArea.set("value", b);
        domAttr.set(this._embedCodeTextArea.domNode, "data-old-shortened", url);
      },
      _updateEmbedCodeFrameSize: function(a) {
        a = this._embedCodeTextArea.get("value");
        a = a.replace(/width=\"[0-9]*\"/i, 'width\x3d"' + this._widthTextBox.value + '"');
        a = a.replace(/height=\"[0-9]*\"/i, 'height\x3d"' + this._heightTextBox.value + '"');
        this._embedCodeTextArea.set("value", a);
      },

      _initOptions: function() {
        var options = [];//, i = 0;
        //var maxLvl = this.map.getMaxZoom(),
        //  minLvl = this.map.getMinZoom(),
        var currentLvl = this.map.getLevel();
        //chooseCenterWithLevel
        if (typeof currentLvl === "number" && currentLvl !== -1) {
          dojoClass.remove(this.chooseCenterWithLevelRow, "displaynone");
          // this.chooseCenterWithLevel_levels.removeOption(this.chooseCenterWithLevel_levels.getOptions());
          // options = [];
          // for (i = minLvl; i < maxLvl; i++) {
          //   var opt = {label: i + "", value: i + ""};
          //   if (i === currentLvl) {
          //     opt.selected = true;
          //   } else {
          //     opt.selected = false;
          //   }
          //   options.push(opt);
          // }
          // this.chooseCenterWithLevel_levels.addOption(options);
        } else {
          //no level, such as dynamicLayer
          dojoClass.add(this.chooseCenterWithLevelRow, "displaynone");
        }
        //chooseCenterWithScale
        //this.chooseCenterWithScale_scales.removeOption(this.chooseCenterWithScale_scales.getOptions());
        // options = [];
        // if (this.map._params && this.map._params.lods) {
        //   var scals = array.filter(this.map._params.lods, lang.hitch(this, function(lod) {
        //     return (lod.level >= minLvl && lod.level <= maxLvl);
        //   }));
        //
        //   array.forEach(scals, function(scale) {
        //     var opt = {label: scale.scale + "", value: scale.scale + ""};
        //     if (scale.level === currentLvl) {
        //       opt.selected = true;
        //     } else {
        //       opt.selected = false;
        //     }
        //     options.push(opt);
        //   });
        // }
        //this.chooseCenterWithScale_scales.addOption(options);

        //setlanguage
        options = [];
        this.setlanguage_languages.removeOption(this.setlanguage_languages.getOptions());
        array.forEach(this.share.languages, function(language) {
          var opt = {label: language, value: language};
          if (language === dojoConfig.locale) {
            opt.selected = true;
          } else {
            opt.selected = false;
          }
          options.push(opt);
        });
        this.setlanguage_languages.addOption(options);

        //token
        var token = "";
        try {
          var cookie = dojoCookie("esri_auth");
          if(cookie){
            token = JSON.parse(cookie).token;
          }
        } catch (err) {
          console.log("ShareLink can't parse Auth:" + err);
        }
        if (token) {
          this.authtoken.set("value", token);
        }

        //query feature
        var layerChooser = new FeaturelayerChooserFromMap({
          createMapResponse: this.map.webMapResponse,
          showLayerFromFeatureSet: false,
          onlyShowVisible: false,
          updateWhenLayerInfosIsShowInMapChanged: false
        });
        dojoClass.add(layerChooser.domNode, "share-layerChooser-dropbox");
        this.layerChooserFromMapWithDropbox = new LayerChooserFromMapWithDropbox({
          layerChooser: layerChooser,
          customClass: "jimu-shareLink-dropbox-popup"
        });
        this.layerChooserFromMapWithDropbox.placeAt(this.queryFeature_layer);
        this.own(on(this.layerChooserFromMapWithDropbox, 'selection-change',
          lang.hitch(this, this._updateQueryFeature_Layer)));
        //query filter
        this.queryFeature_valueFilter.filterParams = new FilterParameters();
        this.queryFeature_valueFilter.filterParams.placeAt(this.queryFeature_valueFilter);
        this.own(on(this.queryFeature_valueFilter.filterParams, 'change', lang.hitch(this, function (/*expr*/) {
          this._updateUrlByQueryFeatures();
          this.updateUrl();
        })));

        //addMarker
        if (typeof this.map.spatialReference !== "undefined" &&
          typeof this.map.spatialReference.wkid !== "undefined") {
          this.addMarker_spatialReference.set("value", this.map.spatialReference.wkid);
        }

        //this.addMarker_level.removeOption(this.addMarker_level.getOptions());
        // options = [];
        // var optLvl = {};
        // for (i = minLvl; i < maxLvl; i++) {
        //   optLvl = {label: i + "", value: i + ""};
        //   if (i === currentLvl) {
        //     optLvl.selected = true;
        //   } else {
        //     optLvl.selected = false;
        //   }
        //   options.push(optLvl);
        // }
        //this.addMarker_level.addOption(options);
      },
      _initOptionsEvent: function() {
        //if listen to KeyUpEvent in IE, the inputs would be flashed
        var isIE = jimuUtils.has("ie") || jimuUtils.has("edge"),
          inputsChangeEvent = isIE ? "change" : "KeyUp";

        //outline radios
        var shareRadios = dojoQuery(".shareRadios", this.domNode);
        // this.own(on(shareRadios, "change", lang.hitch(this, function(results) {
        //   var src = results.srcElement || results.target;
        //   this.optionSrc = domAttr.get(src, "data-id");
        //   console.log("==>radios change");
        //   this.updateUrl();
        // })));
        this.own(on(shareRadios, "click", lang.hitch(this, function(results) {
          var src = results.srcElement || results.target;
          this.optionSrc = domAttr.get(src, "data-id");
          this.updateUrl();
        })));

        //outline checkBoxes
        // mobileLayout,setlanguage,auth
        var shareCheckBoxes = dojoQuery(".shareCheckBoxes", this.domNode);
        this.own(on(shareCheckBoxes, "click", lang.hitch(this, function() {
          this.updateUrl();
        })));

        //inner shareSelects
        this.own(on(this.chooseCenterWithLevel_levels, "change", lang.hitch(this, function(/*results*/) {
          this.updateUrl();
        })));
        this.own(on(this.chooseCenterWithScale_scales, "change", lang.hitch(this, function() {
          this.updateUrl();
        })));
        this.own(on(this.setlanguage_languages, "change", lang.hitch(this, function() {
          this.updateUrl();
        })));
        //inner input
        this.own(on(this.findLocation_input, inputsChangeEvent, lang.hitch(this, this.updateUrl)));

        //this.own(on(this.queryFeature_layer, "change", lang.hitch(this, this._updateQueryFeature_Field)));
        this.own(on(this.queryFeature_field, "change", lang.hitch(this, this._updateQueryFeature_Value)));
        //this.own(on(this.queryFeature_value, "change", lang.hitch(this, this.updateUrl)));
        //this.own(on(this.queryFeature_value.dropDown, 'open', lang.hitch(this, this.dropDownOpen)));// dropdown load data as pages
        //this.own(on(this.queryFeature_sortBtn, "click", lang.hitch(this, this._updateQueryFeature_Sort)));
        this.own(on(this.mobileLayout, inputsChangeEvent, lang.hitch(this, this.updateUrl)));
        this.own(on(this.authtoken, inputsChangeEvent, lang.hitch(this, this.updateUrl)));

        //marker
        this.own(on(this.addMarker_marker, "click", lang.hitch(this, function(results) {
          this._onMarkersClick(results);
        })));
        this.own(on(this.addMarker_spatialReference, "change", lang.hitch(this, this.updateUrl)));
        this.own(on(this.addMarker_title, inputsChangeEvent, lang.hitch(this, this.updateUrl)));
        this.own(on(this.addMarker_symbolURL, inputsChangeEvent, lang.hitch(this, this.updateUrl)));
        this.own(on(this.addMarker_label, inputsChangeEvent, lang.hitch(this, this.updateUrl)));
        this.own(on(this.addMarker_level, "change", lang.hitch(this, this.updateUrl)));

        //chooseCenterWithLevel
        this.own(on(this.chooseCenterWithLevel_marker, "click", lang.hitch(this, function(results) {
          this._onMarkersClick(results);
        })));
        this.own(on(this.chooseCenterWithScale_marker, "click", lang.hitch(this, function(results) {
          this._onMarkersClick(results);
        })));
      },
      _onMarkersClick: function(results) {
        shareUtils.disableWebMapPopup(this.map);

        this._unselectMarkerBtn();
        this._selectMarkerBtn(results);

        this._hidePopup();
        this._removeGraphicsLayer();
        this._mapClickHandler = on.once(this.map, "click", lang.hitch(this, this._onMapClick));
      },
      _onMapClick: function(evt) {
        var param = evt.mapPoint;
        this._addGraphicsLayerMarker(evt);

        //reset flags
        if (this.optionSrc === "chooseCenterWithLevel") {
          this._hasZoomLevelMarkerAdded = false;
        } else if (this.optionSrc === "chooseCenterWithScale") {
          this._hasMapScaleMarkerAdded = false;
        } else if (this.optionSrc === "addMarker") {
          this._hasAddMarkerMarkerAdded = false;
        }

        this._unselectMarkerBtn();
        this.updateUrl(param);
        this._showPopup();

        shareUtils.enableWebMapPopup(this.map);
      },

      _hidePopup: function() {
        topic.publish('ShareLink/onHideContainer');
      },
      _showPopup: function() {
        topic.publish('ShareLink/onShowContainer');
      },

      _updateResUrls: function(param) {
        var paramObj = param;

        if (this.optionSrc === "currentMapExtent") {
          var gcsExtStr = this.getMapExtent(this.map);
          this.resultUrl = shareUtils.addQueryParamToUrl(this.baseHrefUrl, "extent", gcsExtStr, true);
        } else if (this.optionSrc === "chooseCenterWithLevel") {
          if (false === this._hasZoomLevelMarkerAdded) {
            this.resultUrl = shareUtils.addQueryParamToUrl(this.baseHrefUrl, "center",
              this.getMapCenter(this.map, paramObj), true);

            if (paramObj && paramObj.x && paramObj.y) {
              this._hasZoomLevelMarkerAdded = true;
            }
          }

          this.resultUrl = shareUtils.addQueryParamToUrl(this.resultUrl, "level", this._getMapLevel(), true);
        } else if (this.optionSrc === "chooseCenterWithScale") {
          if (false === this._hasMapScaleMarkerAdded) {
            this.resultUrl = shareUtils.addQueryParamToUrl(this.baseHrefUrl, "center",
              this.getMapCenter(this.map, paramObj), true);

            if (paramObj && paramObj.x && paramObj.y) {
              this._hasMapScaleMarkerAdded = true;
            }
          }

          this.resultUrl = shareUtils.addQueryParamToUrl(this.resultUrl, "scale", this._getMapScale(), true);
        } else if (this.optionSrc === "findLocation") {
          var locate = this.findLocation_input.get("value");
          this.resultUrl = shareUtils.addQueryParamToUrl(this.baseHrefUrl, "find", locate, true);
        } else if (this.optionSrc === "queryFeature") {
          this._updateUrlByQueryFeatures();//update
        } else if (this.optionSrc === "addMarker") {
          if (false === this._hasAddMarkerMarkerAdded) {
            this.resultUrl = shareUtils.addQueryParamToUrl(this.baseHrefUrl, "marker",
              this.getMapCenter(this.map, paramObj, null, this._getWkid()), true);
            this.resultUrl += ",";

            if (paramObj && paramObj.x && paramObj.y) {
              this._hasAddMarkerMarkerAdded = true;
              this._lastAddMarkerParamObj = paramObj;//cache
            }
          } else {
            this.resultUrl = shareUtils.addQueryParamToUrl(this.baseHrefUrl, "marker",
              this.getMapCenter(this.map, this._lastAddMarkerParamObj, null, this._getWkid()), true);
            this.resultUrl += ",";
          }

          this.resultUrl += encodeURIComponent(this.addMarker_title.get("value") || "");
          this.resultUrl += ",";
          this.resultUrl += encodeURIComponent(this.addMarker_symbolURL.get("value") || "");
          this.resultUrl += ",";
          this.resultUrl += encodeURIComponent(this.addMarker_label.get("value") || "");
          var level = this._getMapLevel();
          if (typeof level === "number" && level !== -1) {
            this.resultUrl = shareUtils.addQueryParamToUrl(this.resultUrl, "level", this._getMapLevel(), true);
          } else {
            //use scale if no level
            this.resultUrl = shareUtils.addQueryParamToUrl(this.resultUrl, "scale", this._getMapScale(), true);
          }
        }

        //checkbox
        this.resultUrl = shareUtils.removeQueryParamFromUrl(this.resultUrl, "mobileBreakPoint", true);
        this.resultUrl = shareUtils.removeQueryParamFromUrl(this.resultUrl, "locale", true);
        this.resultUrl = shareUtils.removeQueryParamFromUrl(this.resultUrl, "token", true);
        this.resultUrl = shareUtils.removeQueryParamFromUrl(this.resultUrl, "layers", true);
        if (this.overwirteMobileLayout.checked) {
          this.resultUrl = shareUtils.addQueryParamToUrl(this.resultUrl, "mobileBreakPoint",
            this.mobileLayout.getValue(), true);
        }
        if (this.setlanguage.checked) {
          this.resultUrl = shareUtils.addQueryParamToUrl(this.resultUrl, "locale",
            this.setlanguage_languages.getValue(), true);
        }
        if (this.auth.checked) {
          this.resultUrl = shareUtils.addQueryParamToUrl(this.resultUrl, "token",
            this.authtoken.getValue(), true);
        }
        if (this.setLayerVisibility.checked) {
          var tmpUrl = this.resultUrl;
          var enableShareFlag = false;
          var paramArray = ["showLayers", "hideLayers", "showLayersEncoded", "hideLayersEncoded"];
          var mode;
          for (var i = 0, len = paramArray.length; i < len; i++) {
            mode = paramArray[i];
            var allUrl = shareUtils.addQueryParamToUrl(tmpUrl, mode, this._getLayersVisibility(mode), true);

            if (this._isResultURLTooLong(allUrl, this.resultUrl)) {
              //console.log("---len:" + allUrl.length + "----too long url:");
            } else {
              //console.log("---len:" + allUrl.length + "----url mode: " + mode);
              enableShareFlag = true;
              this.resultUrl = allUrl;
              break;
            }
          }

          if (!enableShareFlag) {
            mode = paramArray[0];//all 4 mothods is too long, use "showLayers" param
            this.resultUrl = shareUtils.addQueryParamToUrl(tmpUrl, mode, this._getLayersVisibility(mode), true);
          }
        }

        //check if url is too long, at last
        this.cleanUrlLengthWarning();
        if(shareUtils.getQueryParamFromUrl(this.resultUrl, "showLayersEncoded") ||
          shareUtils.getQueryParamFromUrl(this.resultUrl, "hideLayersEncoded")) {
          this.setUrlEncodeWarning();
        }
        if (this._isResultURLTooLong(this.resultUrl)) {
          this.setUrlToolongWarning();
        }
      },

      setUrlEncodeWarning: function () {
        this._setUrlLengthWarning(this.nls.urlEncodedTips);
      },
      setUrlToolongWarning: function () {
        this._setUrlLengthWarning(this.nls.urlTooLongTips);
      },
      _setUrlLengthWarning: function (nls){
        html.removeClass(this.urlLengthTips1, "displaynone");
        html.removeClass(this.urlLengthTips2, "displaynone");

        if(nls){
          this.urlLengthTips1.innerHTML = nls;
          this.urlLengthTips2.innerHTML = nls;
        }
      },
      cleanUrlLengthWarning: function () {
        html.addClass(this.urlLengthTips1, "displaynone");
        html.addClass(this.urlLengthTips2, "displaynone");
        this.urlLengthTips1.innerHTML = "";
        this.urlLengthTips2.innerHTML = "";
      },
      _isResultURLTooLong: function (url, baseUrl) {
        if (!url || !url.length) {
          return false;
        }

        var baseLen = 0;
        if (baseUrl && baseUrl.length) {
          baseLen = baseUrl.length;
        }

        if (url.length >= (this.MAX_LAYER_VISIBILITY_LEN - baseLen)) {
          //console.log("---len:" + url.length + "----too long url:");
          return true;
        } else {
          return false;
        }
      },

      _getLayersVisibility: function(mode){
        var str;
        var visibility = this.layerInfosObj.getSimplificationState();
        var layersArray = visibility[mode];
        if(layersArray && layersArray.join){
          str = layersArray.join(";");
        }

        return str;
      },

      //queryFeature_layer
      _updateUrlByQueryFeatures: function() {
        var layer = this._getIdFromLayerChoose() || "";
        var field = this.queryFeature_field.get("value");
        var value = this._getQueryFeatureFilterValue();
        //if (layer) {
        this.resultUrl = shareUtils.addQueryParamToUrl(this.baseHrefUrl, "query", layer, true);
        if (field) {
          this.resultUrl += ",";
          this.resultUrl += field;
          if (value) {
            this.resultUrl += ",";
            this.resultUrl += value;
          }
        }
        //}
      },
      _updateQueryFeature_Layer: function() {
        // if (!options || options.length === 0) {
        //   //TODO show some tips
        //   return;
        // }
        this._updateUrlByQueryFeatures();
        this._updateQueryFeature_Field();
        this._updateQueryFeature_Value();
        this.updateUrl();
      },
      _updateQueryFeature_Field: function() {
        var fields = this._getFieldsFromLayerChoose();
        var options = [];
        this.queryFeature_field.removeOption(this.queryFeature_field.getOptions());
        array.forEach(fields, lang.hitch(this, function(field) {
          if (["esriFieldTypeString", "esriFieldTypeOID", "esriFieldTypeSmallInteger", "esriFieldTypeInteger",
              "esriFieldTypeSingle", "esriFieldTypeDouble"].indexOf(field.type) > -1) {
            var opt = {label: field.name, value: field.name, type: field.type};
            options.push(opt);
          }
        }));
        this.queryFeature_field.addOption(options);
        this._updateUrlByQueryFeatures();

        this._updateQueryFeature_Value();
        this.updateUrl();
      },
      _updateQueryFeature_Value: function() {
        var queryFields = [];
        var field = this.queryFeature_field.get("value");
        //this.queryFeature_value.removeOption(this.queryFeature_value.getOptions());
        if ("" === field) {
          return;
        }
        //queryFields.push(field);
        var options = this.queryFeature_field.options;
        for (var i = 0, len = options.length; i < len; i++) {
          var opt = options[i];
          if (opt.selected) {
            queryFields.push(opt);
          }
        }

        this._query(queryFields);
        // this._query(queryFields, this._getSortFromBtn(field), this._getUrlFromLayerChoose(), this.map).then(lang.hitch(this, function(response) {
        //   var options = [];
        //   options = this._getQueryedValues(field, response);
        //   this.queryFeature_value.removeOption(this.queryFeature_value.getOptions());
        //   this.queryFeature_value.addOption(options);
        //   this._updateUrlByQueryFeatures();
        //   this.updateUrl();
        // }));
      },
      _updateQueryFeature_Sort: function () {
        if(dojoClass.contains(this.queryFeature_sortBtn, 'ASC')){
          html.setAttr(this.queryFeature_sortBtn, 'title', this.nls.desc);
        } else {
          html.setAttr(this.queryFeature_sortBtn, 'title', this.nls.asc);
        }

        dojoClass.toggle(this.queryFeature_sortBtn, "DESC");
        dojoClass.toggle(this.queryFeature_sortBtn, "ASC");

        this._updateQueryFeature_Value();
      },

      _getSortFromBtn: function (field) {
        var sortStr = field;
        if (dojoClass.contains(this.queryFeature_sortBtn, "DESC")) {
          sortStr += " DESC";
        }//default is ASC
        return [sortStr];
      },
      _getIdFromLayerChoose: function() {
        var id = null;
        var item = this.layerChooserFromMapWithDropbox.getSelectedItem();
        if (item && item.layerInfo && item.layerInfo.id) {
          id = item.layerInfo.id;
        }
        return id;
      },
      _getFieldsFromLayerChoose: function() {
        var fields = [];
        var item = this.layerChooserFromMapWithDropbox.getSelectedItem();
        if (item && item.layerInfo && item.layerInfo.layerObject && item.layerInfo.layerObject.fields) {
          fields = item.layerInfo.layerObject.fields;
        }
        return fields;
      },
      _getUrlFromLayerChoose: function() {
        var url = "";
        var item = this.layerChooserFromMapWithDropbox.getSelectedItem();
        if (item && item.url) {
          url = item.url;
        }
        return url;
      },

      _updateLinkOptionsUI: function() {
        //hide others radios
        dojoQuery(".optionsMore", this.domNode).style("display", "none");
        dojoQuery("." + this.optionSrc + "_optionsMore", this.domNode).style("display", "block");
        //hide others checkboxes
        if (this.overwirteMobileLayout.checked) {
          dojoQuery(".share-options-overwirteMobileLayout_optionsMore", this.domNode).style("display", "block");
        }
        if (this.setlanguage.checked) {
          dojoQuery(".share-options-language_optionsMore", this.domNode).style("display", "block");
        }
        if (this.auth.checked) {
          dojoQuery(".share-options-auth_optionsMore", this.domNode).style("display", "block");
        }
      },
      _fixUrlIfIsOnline: function(url) {
        //if online && shared to public , url need to change to www.arcgis.com/***
        if (this._isOnline && this._isSharedToPublic) {
          var protocol = "";
          if (window.isBuilder) {
            protocol = window.top.location.protocol;
          } else {
            protocol = window.location.protocol;
          }

          // var pathname = window.top.location.pathname;
          // if (typeof pathname === "string" && pathname.indexOf("webappbuilder")) {
          //   pathname = pathname.replace("webappbuilder", "webappviewer")
          // }
          var pathname = "/apps/webappviewer/index.html";
          var search = this._getUrlQueryString(url);
          var publicUrl = this._getOnlinePublicUrl(url);
          url = protocol + "//" + publicUrl + pathname + search;
        }
        return url;
      },

      //param = null means need to refresh
      updateUrl: function(param) {
        this._updateResUrls(param);
        this._updateLinkOptionsUI();

        if (true === this.config.useOrgUrl) {
          //keep raw url(org url)
        } else {
          //false OR undefined
          this.resultUrl = this._fixUrlIfIsOnline(this.resultUrl);
        }

        this.preview.set("value", this.resultUrl);

        if (param === null) {
          this._generateShortenUrl();//init
        }

        this._updateEmailHref();
      },

      _generateShortenUrl: function() {
        var url = this.preview.get("value");
        try {
          if (this.isUseShortenUrl()) {
            this.shortenUrl(url, this.bitlyUrl).then(lang.hitch(this, function(res) {
              this._useShortenUrl(res);
              this.HAS_INIT_URL = true;
            }), lang.hitch(this, function(res) {
              this._useLengthenUrl(url, res);
              this.HAS_INIT_URL = true;
            }));
          } else {
            this._useLengthenUrl(url);
            this.HAS_INIT_URL = true;
          }
        } catch (err) {
          console.error(err);
          this.HAS_INIT_URL = true;
        }
      },
      _useShortenUrl: function(shortenedUrl) {
        this.shortenedUrl = shortenedUrl;
        this._setLinkUrl(shortenedUrl);
        this._setEmbedCode(shortenedUrl);
      },
      _useLengthenUrl: function(rawUrl) {
        var url = rawUrl || "";//result.data.long_url || rawUrl;
        //dojo.style(this._linkUrlTextBox, "width", "450px");
        this._setLinkUrl(url);
        //this._linkUrlTextBox.focus();
        this._setEmbedCode(url);
        //domStyle.set(this.socialNetworkLinks, "display", "none");
      },

      _toFacebook: function() {
        var a = "http://www.facebook.com/sharer/sharer.php?" +
          "u=" + encodeURIComponent(this._linkUrlTextBox.get('value')) +
          "&t=" + encodeURIComponent(jimuUtils.stripHTML(this.socialNetworkTitle(this._appTitle)));
        window.open(a, "", "toolbar=0,status=0,width=626,height=436");
      },
      _toFacebookKeyDown: function(evt) {
        if(evt.keyCode === keys.ENTER){
          this._toFacebook();
        }
      },
      _toTwitter: function() {
        var shareStr = dojoString.substitute(this.share.shareTwitterTxt, {
          appTitle: jimuUtils.stripHTML(this._appTitle)
        });
        var url = this._linkUrlTextBox.get('value');
        //var title = "&text=" + this.socialNetworkTitle(this._appTitle);
        window.open("http://twitter.com/home?status\x3d" +
          encodeURIComponent(shareStr + url + "\n@ArcGISOnline"), "", "toolbar=0,status=0,width=626,height=436");
      },
      _toTwitterKeyDown: function(evt) {
        if(evt.keyCode === keys.ENTER){
          this._toTwitter();
        }
      },
      //_toEmail: function() {
      // var a = "mailto:?subject\x3d" + dojoString.substitute(this.share.shareEmailSubject, {
      //       appTitle: jimuUtils.stripHTML(this._appTitle)
      //     }),
      //   previewUrl = this.preview.get('value');
      // a = a + ("\x26body\x3d" + encodeURIComponent(this.nls.shareEmailTxt1) +
      //   "%0D%0A%0D%0A" + jimuUtils.stripHTML(this._appTitle));
      // a = a + ("%0D%0A" + encodeURIComponent(previewUrl));
      // a = a + ("%0D%0A%0D%0A" + encodeURIComponent(this.nls.shareEmailTxt2));
      // a = a + ("%0D%0A%0D%0A" + encodeURIComponent(this.nls.shareEmailTxt3));
      // window.top.location.href = a;
      //},
      _updateEmailHref: function () {
        var a = "mailto:?subject\x3d" + dojoString.substitute(this.share.shareEmailSubject, {
          appTitle: jimuUtils.stripHTML(this._appTitle)
        }),
          previewUrl = this.preview.get('value');
        a = a + ("\x26body\x3d" + encodeURIComponent(this.nls.shareEmailTxt1) +
          "%0D%0A%0D%0A" + jimuUtils.stripHTML(this._appTitle));
        a = a + ("%0D%0A" + encodeURIComponent(previewUrl));
        a = a + ("%0D%0A%0D%0A" + encodeURIComponent(this.nls.shareEmailTxt2));
        a = a + ("%0D%0A%0D%0A" + encodeURIComponent(this.nls.shareEmailTxt3));

        html.setAttr(this.emailShare, 'href', a);
      },
      _toGooglePlus: function() {
        var link = this._linkUrlTextBox.get('value');
        var url = 'http://plus.google.com/share?url=' + encodeURIComponent(link);
        window.open(url,  "", "toolbar=0,status=0,width=626,height=436");
      },
      _toGooglePlusKeyDown: function(evt){
        if(evt.keyCode === keys.ENTER){
          this._toGooglePlus();
        }
      },
      _toggleLinkOptions: function() {
        shareUtils.enableWebMapPopup(this.map);

        var parentNode = this.domNode.parentNode || this.domNode.parentElement;
        var shareOptionsWrapper = dojoQuery(".shareOptionsWrapper", parentNode);
        var shareUrlsWrapper = dojoQuery(".shareUrlsWrapper", this.domNode);
        var shareLinkOptionsWrapper = dojoQuery(".shareLinkOptionsWrapper", this.domNode);
        //if the 2nd menu is show, the "X"&"cancel" means return to top menu
        var isShreeLinkOptionsShow = this._isShareLinkOptionsShow();
        if (isShreeLinkOptionsShow) {
          topic.publish('ShareLink/onHideLinkOptions');

          this._cleanMarkerStatus();
          this._generateShortenUrl();
        } else {
          topic.publish('ShareLink/onShowLinkOptions');
        }

        if (shareOptionsWrapper && shareOptionsWrapper[0]) {
          dojoClass.toggle(shareOptionsWrapper[0], "displaynone");
        }
        dojoClass.toggle(shareUrlsWrapper[0], "displaynone");
        dojoClass.toggle(shareLinkOptionsWrapper[0], "displaynone");
      },
      _toggleLinkOptionsKeydown: function(evt){
        if(evt.keyCode === keys.ENTER){
          this._toggleLinkOptions();
          //focus current selected option when opening linkOptions
          if(this._isShareLinkOptionsShow()){
            var radios = dojoQuery(".shareRadios input", this.shareOptionsRadios);
            for (var i = 0, len = radios.length; i < len; i++) {
              var radio = radios[i];
              if(radio.checked){
                radio.focus();
              }
            }
          }
        }
      },
      _moreOptionsExpandCollapse: function() {
        dojoClass.toggle(this.MoreOptionsContainer, "displaynone");
        dojoClass.toggle(this.MoreOptionsIcon, "rotate");
      },
      _moreOptionsExpandCollapseKeyDown: function(evt){
        if(evt.keyCode === keys.ENTER){
          this._moreOptionsExpandCollapse();
          if(!html.hasClass(this.MoreOptionsContainer, 'displaynone')){
            this._sizeOptions.focus();
          }
        }
      },
      _setInputsClicktoSelect: function(dijit) {
        domAttr.set(dijit, "onclick", "this.select()");
        domAttr.set(dijit, "onmouseup", "return false;");

        domAttr.set(dijit, "onfocus", "this.select()");
        domAttr.set(dijit, "onblur", "return false;");
      },

      /////////////////////////////////////////////////////////
      isUseShortenUrl: function() {
        if (location.hostname.endWith("esri.com") || location.hostname.endWith("arcgis.com")) {
          return true;
        } else {
          return false;
        }
      },
      // calls handler(shortenedUrl) on success
      shortenUrl: function(url, bitlyUrl) {
        var def = new Deferred();

        var uri = shareUtils.addQueryParamToUrl(bitlyUrl, "longUrl", url, true);
        uri = shareUtils.addQueryParamToUrl(uri, "format", "json", true);

        esriRequest({
          url: uri,
          handleAs: 'json',
          //content: content,
          callbackParamName: 'callback'
        }).then(lang.hitch(this, function(result) {
          if (result && result.status_code === 200 && result.data && result.data.url && result.data.url.length > 0) {
            def.resolve(result.data.url);
          } else {
            def.reject(result);
          }
        }), lang.hitch(this, function(err) {
          console.log("can't fetch shortenUrl " + err);
          def.reject(err);
        }));
        return def;
      },

      socialNetworkTitle: function(title) {
        if (title.length > 100) {
          title = title.substring(0, 97) + "...";
        }
        // escape :             This%20is%20a%20title%20with%20some%20special%20characters%20like%20percent%20%25%20and%20ampercent%20%26.
        // encodeURI:           This%20is%20a%20title%20with%20some%20special%20characters%20like%20percent%20%25%20and%20ampercent%20&.  (& doesn't show up in Twitter)
        // encodeURIComponent : This%20is%20a%20title%20with%20some%20special%20characters%20like%20percent%20%25%20and%20ampercent%20%26.
        // don't replace " " with "%20"
        // escape doesn't properly encode Japanese characters, umlauts, ...
        // encodeURI doesn't encode '&'
        //return encodeURIComponent(title.replace(/ /g, "+"));
        return title;
      },

      getMapExtent: function(map) {
        var accuracy = 1E4;
        var extent = map.extent;
        var sr = "";
        if (extent.spatialReference.wkid) {
          sr = extent.spatialReference.wkid;
        } else if (!extent.spatialReference.wkid && extent.spatialReference.wkt) {
          sr = "wkt=" + extent.spatialReference.wkt;
        }

        return null !== extent ? this._roundValue(extent.xmin, accuracy) + "," +
        this._roundValue(extent.ymin, accuracy) + "," + this._roundValue(extent.xmax, accuracy) + "," +
        this._roundValue(extent.ymax, accuracy) + "," + sr : "";
      },

      _roundValue: function(a, b) {
        return Math.round(a * b) / b;
      },

      getMapCenter: function(map, paramObj, separator, wkid) {
        var accuracy = 1E4;
        var spt = separator ? separator : ",";
        var center = null;
        if (paramObj && paramObj.x && paramObj.y) {
          center = paramObj;
        } else if (map.extent.getCenter()) {
          center = map.extent.getCenter();
        }

        var wkidStr = wkid || center.spatialReference.wkid;
        return null !== center ? this._roundValue(center.x, accuracy) + spt +
        this._roundValue(center.y, accuracy) + spt + wkidStr : "";
      },
      _getMapLevel: function() {
        //this.chooseCenterWithLevel_levels.get("value")
        return this.map.getLevel();
      },
      _getMapScale: function() {
        //this.chooseCenterWithScale_scales.get("value")
        return this.map.getScale();
      },
      _getWkid: function() {
        return this.addMarker_spatialReference.get("value") || "";
      },
      // _query: function(outFields, sort, url, map) {
      //   var queryParams = new EsriQuery();
      //   queryParams.where = "1=1";
      //   queryParams.outSpatialReference = map.spatialReference;
      //   queryParams.outFields = outFields;
      //   queryParams.orderByFields = sort;
      //   var queryTask = new QueryTask(url);
      //   return queryTask.execute(queryParams);
      // },
      _getQueryedValues: function(outField, response) {
        var features = response.features;
        var options = [];
        array.forEach(features, lang.hitch(this, function(feature) {
          var val = feature.attributes[outField] + "";
          var opt = {label: val, value: val};
          options.push(opt);
        }));
        return options;
      },

      //add and remove marker ,when click marker icon in linkOptions
      _addGraphicsLayer: function () {
        if (!window.isBuilder && typeof this._graphicsLayer === "undefined") {
          if (this.map.getLayer("marker-feature-action-layer")) {
            this._graphicsLayer = this.map.getLayer("marker-feature-action-layer");
          } else {
            this._graphicsLayer = new GraphicsLayer({ id: "marker-feature-action-layer" });
            this.map.addLayer(this._graphicsLayer);
          }
        }
      },
      _removeGraphicsLayer: function() {
        if (!window.isBuilder && typeof this._graphicsLayer !== "undefined") {
          //close popup
          if (this.map.infoWindow && this.map.infoWindow.features &&
            this.map.infoWindow.features[0] === this._markerGraphic) {
            this.map.infoWindow.hide();
          }
          //clean text
          if (this._markerGraphic && this._markerGraphic._textSymbol) {
            this._graphicsLayer.remove(this._markerGraphic._textSymbol);
          }

          this._graphicsLayer.remove(this._markerGraphic);
          this._markerGraphic = null;
        }
      },
      _addGraphicsLayerMarker: function (evt) {
        if (!window.isBuilder && typeof this._graphicsLayer !== "undefined") {
          if (this.optionSrc !== "addMarker") {
            this._markerGraphic = this._getMarkerGraphic(evt.mapPoint);
            this._graphicsLayer.add(this._markerGraphic);
          } else {
            //1
            var infoTemplate = new InfoTemplate('', (this.addMarker_title.get("value") || ""));
            //template.isIncludeShareUrl
            //2
            var markerSymbol = symbolJsonUtils.fromJson({
              "type": "esriPMS",
              "url": require.toUrl('jimu') + "/images/EsriBluePinCircle26.png",
              "contentType": "image/png"
            });
            markerSymbol.width = 26;
            markerSymbol.height = 26;
            markerSymbol.setOffset(0, 12);
            this._markerGraphic = new Graphic(evt.mapPoint, markerSymbol, null, infoTemplate);
            this._graphicsLayer.add(this._markerGraphic);

            //3
            var textSymbol = symbolJsonUtils.fromJson({
              "color": [0, 0, 0, 255],
              "type": "esriTS",
              "verticalAlignment": "baseline",
              "horizontalAlignment": "left",
              "angle": 0,
              "xoffset": 0,
              "yoffset": 0,
              "rotated": false,
              "kerning": true,
              "font": {
                "size": 12,
                "style": "normal",
                "weight": "bold",
                "family": "Arial"
              },
              "text": this.addMarker_label.get("value") || ""
            });
            if (textSymbol) {
              textSymbol.xoffset = markerSymbol.width / 2;
              textSymbol.yoffset = markerSymbol.height / 2 + markerSymbol.yoffset;
              var textG = new Graphic(evt.mapPoint, textSymbol);
              this._graphicsLayer.add(textG);

              this._markerGraphic._textSymbol = textG;
            }
          }
        }
      },
      _getMarkerGraphic: function(mapPoint) {
        var symbol = new PictureMarkerSymbol(
          require.toUrl('jimu') + "/images/EsriBluePinCircle26.png",
          26, 26
        );
        symbol.setOffset(0, 12);
        return new Graphic(mapPoint, symbol);
      },

      //markerBtns icon
      _unselectMarkerBtn: function() {
        var markerBtns = dojoQuery(".markers", this.domNode);
        for (var i = 0, len = markerBtns.length; i < len; i++) {
          var markerBtn = markerBtns[i];
          dojoClass.remove(markerBtn, "selected");
        }
      },
      _selectMarkerBtn: function(results) {
        var src = results.srcElement || results.target;
        dojoClass.add(src, "selected");
      },
      _cleanMarkerStatus: function() {
        if (this._mapClickHandler && this._mapClickHandler.remove) {
          this._mapClickHandler.remove();
        }

        this._unselectMarkerBtn();
        this._removeGraphicsLayer();
      },

      //is show options page
      _isShareLinkOptionsShow: function() {
        var shareLinkOptionsWrapper = dojoQuery(".shareLinkOptionsWrapper", this.domNode);
        return !dojoClass.contains(shareLinkOptionsWrapper[0], "displaynone");
      },
      _getUrlQueryString: function(url) {
        var str = "";
        if (url.indexOf("?") !== -1) {
          str = url.substring(url.indexOf("?"));
        }
        return str;
      },
      _getOnlinePublicUrl: function() {
        var url = "www.arcgis.com";
        var portalUrl = this._portalUrl;
        if (portalUrl && typeof portalUrl === "string") {
          if (portalUrl.indexOf('devext.arcgis.com') > -1) {
            url = 'devext.arcgis.com';
          } else if (portalUrl.indexOf('qaext.arcgis.com') > -1) {
            url = 'qaext.arcgis.com';
          }
        }

        return url;
      },
      _watchLayerChange: function(){
        if(this.setLayerVisibility.checked){
          this.updateUrl();
        }
      },

      //query by pages
      _query: function (outFields) {
        //this._queryState.fields = field;
        // var queryParams = new EsriQuery();
        // queryParams.where = "1=1";
        // queryParams.outSpatialReference = this.map.spatialReference;
        // queryParams.outFields = outFields;
        // queryParams.orderByFields = this._getSortFromBtn(field);
        // this._queryState.jimuQuery = new jimuQuery({
        //   url: this._getUrlFromLayerChoose(),
        //   query: queryParams,
        //   pageSize: 2000
        // });
        if (!outFields || !outFields[0]) {
          return;
        }

        var field = outFields[0],
          shortType = this._getFieldShortType(field),
          item = this.layerChooserFromMapWithDropbox.getSelectedItem();
        var filterObj = {
          layerId: item.layerInfo.id,
          url: item.url,
          name: item.name,
          filter: {
            logicalOperator: "AND",
            parts: [{
              fieldObj: { name: field.value, label: field.label, dateFormat: "", shortType: shortType, type: field.type },
              operator: shortType + "OperatorIs", //date | number | string
              valueObj: { isValid: true, type: "unique", value: null },
              interactiveObj: { prompt: "...", hint: "", cascade: "none" }
            }],
            expr: "",
            displaySQL: ""
          },
          icon: null,
          enableMapFilter: true
        };
        var layerInfo = this.layerInfosObj.getLayerInfoById(filterObj.layerId);
        if (layerInfo) {
          layerInfo.getLayerObject().then(lang.hitch(this, function (layerObject) {
            var layerId = filterObj.layerId;
            var partsObj = lang.clone(filterObj.filter);
            partsObj.wId = this.id + '_' + layerObject.id + '_' + html.getAttr(this.queryFeature_valueFilter, 'data-index');
            /*var buildDef = */this.queryFeature_valueFilter.filterParams.build(filterObj.url, layerObject, partsObj, layerId, this.id);
            this.queryFeature_valueFilter.expr = this.queryFeature_valueFilter.filterParams.getFilterExpr();
          }));
        }

        //update link, waiting for the value update
        this._updateUrlByQueryFeatures();
        this.updateUrl();
      },
      // _queryNextPage: function () {
      //   //this._queryState.jimuQuery.getCurrentPageIndex();
      //   if (!this._queryState.querying && (this._queryState.jimuQuery && this._queryState.jimuQuery.queryNextPage)) {
      //     this._queryState.querying = true;

      //     this._queryState.jimuQuery.queryNextPage().then(lang.hitch(this, function (response) {
      //       //this.queryFeature_value.closeDropDown();
      //       this._queryState.querying = false;

      //       var options = [];
      //       options = this._getQueryedValues(this._queryState.fields, response);
      //       //this.queryFeature_value.removeOption(this.queryFeature_value.getOptions());
      //       this.queryFeature_value.addOption(options);

      //       this.queryFeature_value.reset()

      //       this._updateUrlByQueryFeatures();
      //       this.updateUrl();
      //       //this.queryFeature_value.openDropDown();
      //     }))
      //   }
      // },
      // _queryCount: function () {
      //   this._queryState.jimuQuery.getFeatureCount().then(lang.hitch(this, function (response) {
      //     console.log("query Count==> " + response);
      //   }));
      // },
      // _queryAll: function () {
      //   this._queryState.jimuQuery.getAllFeatures().then(lang.hitch(this, function (response) {
      //     this._queryState.querying = false;

      //     var options = [];//
      //     options = this._getQueryedValues(this._queryState.fields, response);
      //     this.queryFeature_value.removeOption(this.queryFeature_value.getOptions());
      //     this.queryFeature_value.addOption(options);

      //     this._updateUrlByQueryFeatures();
      //     this.updateUrl();
      //   }))
      // },
      // dropDownOpen: function () {
      //   if (this.queryFeature_value.dropDown.domNode.parentElement) {
      //     // if (this._queryHanlder) {
      //     //   this._queryHanlder.remove();
      //     // } else {
      //     //   console.log("==> bind _popupWrapper");
      //     //   this._queryHanlder = on(this.queryFeature_value.dropDown.domNode.parentElement, 'scroll', lang.hitch(this, this.dropDownScroll));
      //     // }
      //     console.log("==> bind _popupWrapper");
      //     this.own(on(this.queryFeature_value.dropDown.domNode.parentElement, 'scroll', lang.hitch(this, this.dropDownScroll)));
      //   }
      // },
      // dropDownScroll: function (evt) {
      //   var scrollDiff = 50;
      //   var target = evt.target;
      //   var diff = target.scrollHeight - target.clientHeight; //offsetHeight
      //   if ((diff - target.scrollTop <= scrollDiff) && !this._queryState.querying) {
      //     this._queryNextPage();
      //     //console.log("page+");
      //   }
      // },
      _getFieldShortType: function (fieldObj) {
        var type = fieldObj.type, shortType;
        if (type === "esriFieldTypeString") {
          shortType = "string";
        } else {
          shortType = "number";
        }
        return shortType;
      },
      _getQueryFeatureFilterValue: function () {
        var v = "";
        if (this.queryFeature_valueFilter.filterParams.partsObj && this.queryFeature_valueFilter.filterParams.getValueProviders()[0].getValueObject()) {
          v = this.queryFeature_valueFilter.filterParams.getValueProviders()[0].getValueObject().value;
          if (v.toFixed) {
            v = v.toString();
          }
        }
        return v;
      }
    });
    return so;
  });
