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
    'dojo/_base/lang',
    'dojo/_base/html',
    'dojo/on',
    'dojo/keys',
    'dojo/query',
    'dojo/cookie',
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidget',
    'dojo/topic',
    'jimu/dijit/CheckBox',
    'jimu/utils',
    'esri/lang',
    'jimu/dijit/LoadingShelter',
    'dojo/Deferred',
    'jimu/dijit/EditorXssFilter',
    'jimu/dijit/TabContainer',
    'jimu/WidgetManager',
    'jimu/PanelManager'
  ],
  function(declare, lang, html, on, keys, query, cookie, _WidgetsInTemplateMixin, BaseWidget, topic,
           CheckBox, utils, esriLang, LoadingShelter, Deferred, EditorXssFilter, TabContainer, WidgetManager, PanelManager) {
    var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {
      baseClass: 'jimu-widget-splash',
      _hasContent: null,
      _requireConfirm: null,
      _isClosed: false,

      postCreate: function() {
        this.inherited(arguments);
        this.isFirstFoucs = true;
        html.setAttr(this.domNode, 'aria-label', this.nls._widgetLabel);

        //LoadingShelter
        this.shelter = new LoadingShelter({
          hidden: true
        });
        this.shelter.placeAt(this.domNode);
        this.shelter.startup();

        //xss filter
        this.config.splash.splashContent = EditorXssFilter.getInstance().sanitize(this.config.splash.splashContent);

        this._hasContent = this.config.splash && this.config.splash.splashContent;
        this._requireConfirm = this.config.splash && this.config.splash.requireConfirm;
        this._showOption = this.config.splash && this.config.splash.showOption;
        this._confirmEverytime = this.config.splash && this.config.splash.confirmEverytime;

        if (this._hasContent) {
          this.customContentNode.innerHTML = this.config.splash.splashContent;
        }
        this._hasDisclaimer = this.config.splash && this.config.splash.disclaimerContent;
        if (this._hasDisclaimer) {
          this.customDisclaimerNode.innerHTML = this.config.splash.disclaimerContent;
        }        
        
        //if (!this._requireConfirm && !this._showOption) {            
        if ((!this._requireConfirm && !this._showOption) || (window.extentFromURL != null) || (window.eaLayerFromURL  != null) || (window.eaCommunityFromURL != null)) {
          html.setStyle(this.confirmCheck, 'display', 'none');
          html.addClass(this.okNode, 'enable-btn');
        } else {
          var hint = "";
          if (this._requireConfirm) {
            hint = this.config.splash.confirm.text;
            html.addClass(this.okNode, 'disable-btn');
          } else {
            hint = this.nls.notShowAgain;
            html.addClass(this.okNode, 'enable-btn');
          }
          this.confirmCheck = new CheckBox({
            label: utils.stripHTML(hint),
            checked: false
          }, this.confirmCheck);
          html.setAttr(this.confirmCheck.domNode, 'title', utils.stripHTML(hint));
          this.own(on(this.confirmCheck, 'change', lang.hitch(this, this.onCheckBoxClick)));
          this.confirmCheck.startup();
        }
      },
      
      _initTabContainer: function () {
          var tabs = [];
          tabs.push({
            title: "Welcome",
            content: this.welcomeTab
          });
          tabs.push({
            title: "Disclaimer",
            content: this.disclaimerTab
          });
          this.selTab = "Welcome"; 
          this.tabContainer = new TabContainer({
            tabs: tabs,
            selected: this.selTab,
            id: "welcometabContainer"
          }, this.tabMain);
          this.tabContainer.startup();
          this.own(on(this.tabContainer, 'tabChanged', lang.hitch(this, function (title) {
            this.selTab = title;
          })));
        },
      
      onOpen: function() {
        if( (window.extentFromURL != null) || (window.eaLayerFromURL  != null) || (window.eaCommunityFromURL != null)) {
            this.close();
        }
        if (!utils.isInConfigOrPreviewWindow()) {
          var isFirstKey = this._getCookieKey();
          var isfirst = cookie(isFirstKey);
          if (esriLang.isDefined(isfirst) && isfirst.toString() === 'false') {
            this.close();
          }
        }
        // if (true === this._requireConfirm) {
        //   //checkbox
        //   this.confirmCheck.focus();
        // } else if ((false === this._requireConfirm && false === this._showOption) ||
        //   (false === this._requireConfirm && true === this._showOption)) {
        //   this.okNode.focus();
        // }
        if (!this._requireConfirm && !this._showOption) {
          this.okNode.focus();
        } else {
          this.confirmCheck.focus();
        }

        this._eventShow();
      },

      startup: function() {
        this.inherited(arguments);
        this.shelter.show();
        this._normalizeDomNodePosition();
        this._initTabContainer();
        this._setConfig();

        this.own(on(this.domNode, 'keydown', lang.hitch(this, function(evt){
          if(html.hasClass(evt.target, this.baseClass) && evt.keyCode === keys.ESCAPE){
            if(!this._requireConfirm){
              this.close();
              utils.focusOnFirstSkipLink();
            }
          }
        })));

        this.own(on(this.splashDesktop, 'keydown', lang.hitch(this, function(evt){
          if(html.hasClass(evt.target, 'jimu-widget-splash-desktop')){
            if(evt.keyCode === keys.TAB){
              evt.preventDefault();
            }
            //allow user to use tab-key to focus first node from widgetDom on this spacial widget.
            if(evt.keyCode === keys.ENTER || (!evt.shiftKey && evt.keyCode === keys.TAB)){
              utils.focusFirstFocusNode(this.domNode);
            }
          }
        })));

        var focusableNodes = utils.getFocusNodesInDom(this.domNode);
        utils.initFirstFocusNode(this.domNode, focusableNodes[0]);
        utils.initLastFocusNode(this.domNode, this.okNode);

        this._onlyFocus = true;
        this.own(on(this.customContentNode, 'focus', lang.hitch(this, function(){
          if(this._onlyFocus){
            this._onlyFocus = false;
          }else{
            this.customContentNode.scrollTop = 0;
            html.setStyle(this.customContentNode, 'display', 'none');
            // blur current node's focus state. It only works when it's between up and down settings.
            // this.domNode.focus(); //This causes the page to flicker.
            this.customContentNode.blur();
            html.setStyle(this.customContentNode, 'display', 'block');
            setTimeout(lang.hitch(this, function(){
              this._onlyFocus = true;
              this.customContentNode.focus();
            }), 30);
          }
        })));

        utils.setWABLogoDefaultAlt(this.customContentNode);

        //focus on first-node when focusing on the container of splash widget at first time.
        this.own(on(this.splashDesktop, 'focus', lang.hitch(this, function(){
          if(this.isFirstFoucs){
            this.isFirstFoucs = false;
            setTimeout(function(){
              focusableNodes[0].focus();
            }, 0);
          }
        })));
      },

      _setOkNodeAriaLabel: function(){
        var okNodeAriaLabel = this.okNode.innerHTML;
        if(this._requireConfirm && !this.confirmCheck.getValue()){
          okNodeAriaLabel = okNodeAriaLabel + ' ' + window.jimuNls.common.disabled;
        }
        html.attr(this.okNode, "aria-label", okNodeAriaLabel);
      },

      _setConfig: function() {
        this._setWidthForOldVersion().then(lang.hitch(this, function() {

          this._setSizeFromConfig();

          var button = this.config.splash.button;
          if (typeof button !== "undefined") {
            if (typeof button.color !== "undefined") {
              html.setStyle(this.okNode, 'backgroundColor', button.color);
              html.setStyle(this.okNode, 'color', utils.invertColor(button.color));//auto color for text
              html.setStyle(this.backNode, 'backgroundColor', button.color);
              html.setStyle(this.backNode, 'color', utils.invertColor(button.color));//auto color for text
            }
            if (typeof button.transparency !== "undefined") {
              html.setStyle(this.okNode, 'opacity', (1 - button.transparency));
            }
          }
          this.okNode.innerHTML = this.config.splash.button.text || this.nls.ok;
          html.attr(this.okNode, "title", this.config.splash.button.text || this.nls.ok);
          this._setOkNodeAriaLabel();

          var background = this.config.splash.background;
          if (typeof background !== "undefined") {
            //image
            if ("image" === background.mode && typeof background.image !== "undefined") {
              var bg = "", repeat = "";
              bg = "url(" + utils.processUrlInWidgetConfig(background.image, this.folderUrl) + ") center center ";
              repeat = "no-repeat";

              var type = background.type;
              if ("undefined" !== typeof type) {
                html.addClass(this.splashContainerNode, type);
                if ("tile" === type) {
                  repeat = "repeat";//only "tile" need repeat
                }
              }
              html.setStyle(this.splashContainerNode, 'background', bg + repeat);
            } /*else if ("color" === background.mode && typeof background.color !== "undefined") {
              //color
              if ("undefined" !== typeof background.color) {
                html.setStyle(this.splashContainerBackground, 'backgroundColor', background.color);
              }
              if ("undefined" !== typeof background.transparency) {
                html.setStyle(this.splashContainerBackground, 'opacity', (1 - background.transparency));
              }
            }*/
          }
          //html.setStyle(query(".label", this.domNode)[0], 'color', utils.invertColor(background.color));//auto color for text
          var confirm = this.config.splash.confirm;
          if (typeof confirm !== "undefined" && this.domNode) {
            var dom = query(".label", this.domNode)[0];
            if ("undefined" !== typeof confirm.color && dom) {
              html.setStyle(dom, 'color', confirm.color);
            }
            if ("undefined" !== typeof confirm.transparency && dom) {
              html.setStyle(dom, 'opacity', (1 - confirm.transparency));
            }
          }

          if ("undefined" !== typeof this.config.splash.contentVertical) {
            this.contentVertical = this.config.splash.contentVertical;
          } else {
            this.contentVertical = "top";
          }

          //resize
          if (!utils.isInConfigOrPreviewWindow()) {
            var isFirstKey = this._getCookieKey();
            var isfirst = cookie(isFirstKey);
            if (esriLang.isDefined(isfirst) && isfirst.toString() === 'false') {
              this.close();
            }
          }

          this.resize();
          this.own(on(window, 'resize', lang.hitch(this, function() {
            this.resize();
          })));
          this._resizeContentImg();

          html.removeClass(this.envelopeNode, "buried");//show the node
          this.shelter.hide();
        }));
      },

      _normalizeDomNodePosition: function() {
        html.setStyle(this.domNode, 'top', 0);
        html.setStyle(this.domNode, 'left', 0);
        html.setStyle(this.domNode, 'right', 0);
        html.setStyle(this.domNode, 'bottom', 0);
      },

      setPosition: function(position) {
        this.position = position;

        html.place(this.domNode, window.jimuConfig.layoutId);
        this._normalizeDomNodePosition();
        if (this.started) {
          this.resize();
        }
      },

      resize: function() {
        this._changeStatus();
      },

      _resizeContentImg: function() {
        if (this._hasContent && !this._isClosed) {
          var customBox = html.getContentBox(this.envelopeNode);
          html.empty(this.customContentNode);

          var splashContent = html.toDom(this.config.splash.splashContent);
          html.place(splashContent, this.customContentNode);
          // single node only(no DocumentFragment)
          if (this.customContentNode.nodeType && this.customContentNode.nodeType === 1) {
            var contentImgs = query('img', this.customContentNode);
            if (contentImgs && contentImgs.length) {
              contentImgs.style({
                maxWidth: (customBox.w - 40 - 20) + 'px', // prevent x scroll
                maxHeight: (customBox.h - 40) + 'px'
              });
            }
          }
        }
      },

      _changeStatus: function() {
        if (window.appInfo.isRunInMobile) {
          html.setStyle(this.envelopeNode, 'height', "100%");
          html.setStyle(this.envelopeNode, 'width', "100%");
        } else {
          this._setSizeFromConfig();
        }

        this._resizeCustomContent();
        this._resizeContentImg();
      },
      _getNodeStylePx: function(node, prop) {
        if (node && prop) {
          return parseInt(html.getStyle(node, prop), 10);
        } else {
          return 0;
        }
      },
      _resizeCustomContent: function() {
        var containerContent = html.getContentBox(this.splashContainerNode),
          customContentScrollheight = this.customContentNode.scrollHeight,
          footerBox = html.getMarginBox(this.footerNode);
        var contentMarginButtom = this._getNodeStylePx(this.customContentNode, "margin-bottom"),//between content & confirm text
          footerBottom = this._getNodeStylePx(this.footerNode, "bottom"),//between footer & splashBottom
          contentSpace = containerContent.h - (footerBox.h + footerBottom);

        var isNeedLimitCustomContentHeight = (customContentScrollheight >= contentSpace);
        if (true === isNeedLimitCustomContentHeight || window.appInfo.isRunInMobile) {
          //limit the customContent height   OR   extend height in mobile
          
          html.setStyle(this.tourNode, 'left', '2px');
          html.setStyle(this.learnNode, 'left', '2px');
          html.setStyle(this.exploreNode, 'left', '2px');   
          
          html.setStyle(this.tourNode, 'margin', '5px');
          html.setStyle(this.tourNode, 'line-height', '16px');

          html.setStyle(this.learnNode, 'margin', '5px');
		  html.setStyle(this.learnNode, 'line-height', '16px');
		  
          html.setStyle(this.exploreNode, 'margin', '5px');
          html.setStyle(this.exploreNode, 'line-height', '16px');
          
          html.setStyle(this.footerNode, 'height','70px');
          html.setStyle(this.footerNode, 'padding','5px');
          
          //html.setStyle(this.customContentNode, 'height', (contentSpace - contentMarginButtom) + 'px');
          
          html.setStyle(this.customContentNode, 'height', '80px');
          html.setStyle(this.customContentNode, 'margin-bottom', '0px');
          //var splashContent = html.toDom(this.config.splash.splashContent);
          //splashContent.firstChild.style.marginBottom = "0px";
        } else {

          html.setStyle(this.tourNode, 'line-height', '33px');
		  html.setStyle(this.learnNode, 'line-height', '33px'); 
          html.setStyle(this.exploreNode, 'line-height', '33px'); 
          
          //html.setStyle(this.customContentNode, 'margin-bottom', '60px');     
            	
          //html.setStyle(this.customContentNode, 'height', 'auto');
          this._moveContentToMiddle({
            contentSpace: contentSpace,
            customContentScrollheight: customContentScrollheight
          });
        }
      },
      //align custom content to vertically
      _moveContentToMiddle: function(context) {
        var contentMarginTop = 10,//this._getNodeStylePx(this.customContentNode, "margin-top"),
          middleLine = (context.contentSpace - contentMarginTop) / 2;
        //move the content to middle
        if (this.contentVertical === "middle") {
          //customContent half-height line is upon the middleLine
          var uponTheMiddleline = context.customContentScrollheight / 2 - middleLine;
          if (uponTheMiddleline < 0) {
            //Content is short
            var abs = Math.abs(uponTheMiddleline);
            html.setStyle(this.customContentNode, 'marginTop', abs + contentMarginTop + 'px');
          } else {
            //Content too long
            html.setStyle(this.customContentNode, 'marginTop', contentMarginTop + 'px');
          }
        }
      },
      onCheckBoxClick: function() {
        if (this._requireConfirm) {
          if (this.confirmCheck.getValue()) {
            html.addClass(this.okNode, 'enable-btn');
            html.removeClass(this.okNode, 'disable-btn');
          } else {
            html.addClass(this.okNode, 'disable-btn');
            html.removeClass(this.okNode, 'enable-btn');
          }
          this._setOkNodeAriaLabel();
        }
      },

      _getCookieKey: function() {
        return 'isfirst_' + encodeURIComponent(utils.getAppIdFromUrl());
      },

      onOkClick: function() {
        var isFirstKey = this._getCookieKey();
        if (this._requireConfirm) {
          if (this.confirmCheck.getValue()) {
            if (utils.isInConfigOrPreviewWindow() || this._confirmEverytime) {
              cookie(isFirstKey, null, {expires: -1});
            } else {
              cookie(isFirstKey, false, {
                expires: 1000,
                path: '/'
              });
            }
            this.close();
          }
        } else {
          if (this._showOption) {
            if (!utils.isInConfigOrPreviewWindow() && this.confirmCheck.getValue()) {
              cookie(isFirstKey, false, {
                expires: 1000,
                path: '/'
              });
            }
          } else {
            cookie(isFirstKey, null, {expires: -1});
          }
          this.close();
        }
      },
      onOkKeydown: function(evt){
        if(evt.keyCode === keys.ENTER || evt.keyCode === keys.SPACE){
          this.onOkClick();
          if(!this._requireConfirm || (this._requireConfirm && this.confirmCheck.getValue())){
            utils.focusOnFirstSkipLink();
          }else{
            evt.preventDefault();
          }
        }
      },
      onBackClick: function(){
        var welcomeTabs = dijit.byId("welcometabContainer"); 
        welcomeTabs.selectTab("Welcome");
      },
      onFwdClick: function(){
        var welcomeTabs = dijit.byId("welcometabContainer"); 
        welcomeTabs.selectTab("Disclaimer");
      },   
      onTourClick: function(){
        this.openWidgetById('widgets_Demo_28').then(lang.hitch(this, function() {
            var wm = WidgetManager.getInstance();
            widget = wm.getWidgetById('widgets_Demo_28');
            widget._startTour(); 
        }));
        this.close();
      },
      onLearnClick: function(){
        this.openWidgetById('widgets_AddWebMapData');
        var wm = WidgetManager.getInstance();
        widget = wm.getWidgetById('themes_TabTheme_widgets_SidebarController_Widget_20');
        for (var i=0; i<widget.tabs.length; i++){
            var tab = widget.tabs[i];
            if (tab.config.id=="widgets_AddWebMapData"){
                widget.selectTab(i);
            }
        }
        this.close();
      },   
      close: function() {
        this._isClosed = true;
        this._eventHide();
        this.widgetManager.closeWidget(this);
      },

      _setSizeFromConfig: function() {
        var size = this.config.splash.size;
        if ("undefined" !== typeof size) {
          if (typeof size === "object") {
            var percent = size.percent;
            var wh = size.wh;
            if ("percent" === size.mode && typeof percent !== "undefined") {
              html.setStyle(this.envelopeNode, 'width', percent);
              html.setStyle(this.envelopeNode, 'height', percent);
            } else if ("wh" === size.mode && typeof wh !== "undefined") {
              this._setWidthInCurrentScreen(wh);
              this._setHeightInCurrentScreen(wh);
            }
          }
        }
      },
      //avoid to screen is too small to show the splash, when user use wh pixel
      _setWidthInCurrentScreen: function(wh) {
        var screenWidth = window.innerWidth;
        if (!window.appInfo.isRunInMobile && wh.w <= screenWidth) {
          html.setStyle(this.envelopeNode, 'width', wh.w + "px");
        } else {
          html.setStyle(this.envelopeNode, 'width', "100%");
        }
      },
      _setHeightInCurrentScreen: function(wh) {
        var screenHeight = window.innerHeight;
        if (!window.appInfo.isRunInMobile && wh.h <= screenHeight) {
          html.setStyle(this.envelopeNode, 'height', wh.h + "px");
        } else {
          html.setStyle(this.envelopeNode, 'height', "100%");
        }
      },
      //for old version update
      _setWidthForOldVersion: function() {
        var def = new Deferred();
        var size = this.config.splash.size;
        var isOldVersion = ("wh" === size.mode && typeof size.wh !== "undefined" && null === size.wh.h);
        if (true === isOldVersion) {
          //this._setWhiteColorTextForOldVersion();
          return utils.getEditorContentHeight(this.config.splash.splashContent, this.domNode, {
            "contentWidth": 600 - 40,
            "contentMarginTop": 20,//contentMarginTop
            "footerHeight": 88 + 10//contentMarginBottom
          }).then(
            lang.hitch(this, function(h) {
              size.wh.h = h;
              return h;
            }));
        } else {
          //this._restoreTextColorForNormal();
          def.resolve();
          return def;
        }
      },
      // _setWhiteColorTextForOldVersion: function() {
      //   html.setStyle(this.customContentNode, 'color', "#fff");
      // },
      // _restoreTextColorForNormal: function() {
      //   html.setStyle(this.customContentNode, 'color', "#000");
      // }
      //event for AppStatePopup
      _eventShow: function () {
        setTimeout(lang.hitch(this, function(){
          topic.publish('splashPopupShow');
        }), 800);// becauseof MapManager._checkAppState setTimeout 500;
      },
      _eventHide: function () {
        topic.publish('splashPopupHide');
      }
    });
    return clazz;
  });