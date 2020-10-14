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
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/_base/html',
    'dojo/query',
    'dojo/on',
    'dojo/topic',
    'jimu/BaseWidget',
    'jimu/tokenUtils',
    'jimu/portalUtils',
    'jimu/utils',
    'jimu/dijit/Message',
    'jimu/PanelManager',
    'dojo/NodeList-dom',
    'dojo/NodeList-manipulate'
  ],
  function(declare, lang, array, html, query, on, topic,
    BaseWidget, tokenUtils, portalUtils, utils, Message, PanelManager) {
    /* global jimuConfig */
    /*jshint scripturl:true*/
    var clazz = declare([BaseWidget], {

      baseClass: 'jimu-widget-header jimu-main-background',
      name: 'Header',

      switchableElements: {},

      moveTopOnActive: false,

      constructor: function() {
        this.height = this.getHeaderHeight() + 'px';
      },

      postMixInProperties: function() {
        this.inherited(arguments);
        this.isRenderIdForAttrs = true;
      },

      postCreate: function() {
        this.inherited(arguments);
        var logoH = this.getLogoHeight() + 'px';

        if (this.position && this.position.height) {
          this.height = this.position.height;
        }

        this.switchableElements.logo = query('.logo', this.domNode);
        this.switchableElements.title = query('.jimu-title', this.domNode);
        this.switchableElements.links = query('.links', this.domNode);
        this.switchableElements.subtitle = query('.jimu-subtitle', this.domNode);
        this.mapTour = query('#mapTourIcon', this.domNode);

        this._handleTitleColorAndLogoLink(this.appConfig);

        this.switchableElements.logo.style({
          // width: logoH,
          height: logoH
        });

        // if(!this.appConfig.portalUrl){
        html.setStyle(this.signInSectionNode, 'display', 'none');
        // }else{
        //   html.setStyle(this.signInSectionNode, 'display', '');
        // }

        this._setElementsSize();
        this.own(topic.subscribe('changeMapPosition', lang.hitch(this, this._onMapResize)));
      },

      startup: function() {
        this.inherited(arguments);

        // this.switchableElements.logo.attr(
        //   'src',
        //   this.appConfig.logo ? this.appConfig.logo : this.folderUrl + 'images/app-logo.png'
        // );
        if (this.appConfig && this.appConfig.logo) {
          this.logoNode.src = this.appConfig.logo;
          html.removeClass(this.logoNode, 'hide-logo');
        } else {
          this.logoNode.src = "";
          html.addClass(this.logoNode, 'hide-logo');
        }
        this.switchableElements.title.innerHTML(
          //utils.sanitizeHTML(this.appConfig.title ? this.appConfig.title : '')
        );
        this.switchableElements.subtitle.innerHTML(
          utils.sanitizeHTML(this.appConfig.subtitle ? this.appConfig.subtitle : '')
        );

        this._createDynamicLinks(this.appConfig.links);

        if (this.appConfig.about) {
          html.setStyle(this.aboutNode, 'display', '');
        } else {
          html.setStyle(this.aboutNode, 'display', 'none');
        }
        on(this.mapTour, "click", function(){
            var widgetName = 'Demo';
            var widget = selfCommunityDisplay.appConfig.getConfigElementsByName(widgetName)[0];
            var pm = PanelManager.getInstance();
            pm.showPanel(widget);
        });
      },

      onAppConfigChanged: function(appConfig, reason, changedData) {
        switch (reason) {
          case 'attributeChange':
            this._onAttributeChange(appConfig, changedData);
            break;
          default:
            return;
        }
        this.appConfig = appConfig;
        this.resize();
      },

      _onMapResize: function(){
        if(!window.appInfo.isRunInMobile){
          return;
        }
        var sideBar = this.widgetManager.getWidgetsByName('SidebarController');
        if(sideBar.length === 0){
          return;
        }
        sideBar = sideBar[0];

        if(sideBar.windowState === 'minimized'){
          this.width = sideBar.minWidth;
        }else{
          this.width = sideBar.getWidth();
        }
        html.setStyle(this.domNode, 'width', this.width + 'px');
        this.resize();
      },

      _onAttributeChange: function(appConfig, changedData) {
        /*jshint unused: false*/
        if ('title' in changedData && changedData.title !== this.appConfig.title) {
          this.switchableElements.title.innerHTML(utils.sanitizeHTML(changedData.title));
        }
        if ('subtitle' in changedData && changedData.subtitle !== this.appConfig.subtitle) {
          this.switchableElements.subtitle.innerHTML(utils.sanitizeHTML(changedData.subtitle));
        }
        if ('logo' in changedData && changedData.logo !== this.appConfig.logo) {
          if(changedData.logo){
            html.setAttr(this.logoNode, 'src', changedData.logo);
            html.removeClass(this.logoNode, 'hide-logo');
          }else{
            html.removeAttr(this.logoNode, 'src');
            html.addClass(this.logoNode, 'hide-logo');
          }
        }
        if ('links' in changedData) {
          this._createDynamicLinks(changedData.links);
        }

        this._handleTitleColorAndLogoLink(appConfig);
      },

      _handleTitleColorAndLogoLink: function(appConfig){
        if(appConfig.titleColor){
          html.setStyle(this.switchableElements.title, 'color', appConfig.titleColor);
        }else{
          html.setStyle(this.switchableElements.title, 'color', '');
        }

        utils.themesHeaderLogoA11y(appConfig, this.tabIndex, {
          link: this.logoLinkNode,
          logo: this.logoNode,
          icon: this.logoNode
        });
      },

      _setElementsSize: function() {
        html.setStyle(this.logoNode, {
          height: '30px',
          marginTop: ((this.height - 30) / 2) + 'px'
        });

        html.setStyle(this.titleNode, {
          lineHeight: this.height + 'px'
        });

        html.setStyle(this.subtitleNode, {
          lineHeight: this.height + 'px'
        });

        query('.link', this.domNode).style({
          lineHeight: this.height + 'px'
        });
      },

      _createDynamicLinks: function(links) {
        html.empty(this.dynamicLinksNode);
        array.forEach(links, function(link) {
          html.create('a', {
            href: link.url,
            'role': 'link',
            'tabindex': this.tabIndex,
            target: '_blank',
            rel: "noopener noreferrer",
            innerHTML: utils.sanitizeHTML(link.label),
            'class': "link",
            style: {
              lineHeight: this.height + 'px'
            }
          }, this.dynamicLinksNode);
        }, this);
      },

      onSignIn: function(credential) {
        this.inherited(arguments);

        html.setStyle(this.signinLinkNode, 'display', 'none');
        html.setStyle(this.userNameLinkNode, 'display', 'inline');
        html.setStyle(this.signoutLinkNode, 'display', 'inline');

        this.userNameLinkNode.innerHTML = credential.userId;
        html.setAttr(this.userNameLinkNode, 'href', this.appConfig.portalUrl + 'home/user.html');

        //popup
        if (this.popupLinkNode) {
          html.setStyle(this.popupSigninNode, 'display', 'none');
          html.setStyle(this.popupUserNameNode, 'display', 'block');
          html.setStyle(this.popupSignoutNode, 'display', 'block');

          query('a', this.popupUserNameNode).html(credential.userId)
            .attr('href', this.appConfig.portalUrl + 'home/user.html');
        }

        this.resize();
      },

      onSignOut: function(signInTip) {
        this.inherited(arguments);

        this._onSignOut(signInTip);

        var portal = portalUtils.getPortal(this.appConfig.portalUrl);
        portal.loadSelfInfo().then(lang.hitch(this, function(selfInfo) {
          var name = selfInfo.name;
          var signInTip = this.nls.signInTo + ' ' + name;
          this._onSignOut(signInTip);
        }), lang.hitch(this, function(err) {
          console.error(err);
        }));
      },

      _onSignOut: function(signInTip) {
        html.setStyle(this.signinLinkNode, 'display', 'inline');
        html.setAttr(this.signinLinkNode, 'innerHTML', signInTip);
        html.setStyle(this.userNameLinkNode, 'display', 'none');
        html.setStyle(this.signoutLinkNode, 'display', 'none');

        this.userNameLinkNode.innerHTML = '';

        //popup
        if (this.popupLinkNode) {
          html.setStyle(this.popupSigninNode, 'display', 'block');
          html.setAttr(this.popupSigninNode, 'innerHTML', signInTip);
          html.setStyle(this.popupUserNameNode, 'display', 'none');
          html.setStyle(this.popupSignoutNode, 'display', 'none');

          query('a', this.popupUserNameNode).html('');
        }

        this.resize();
      },

      switchElements: function(showElement) {
        var es = this.switchableElements;

        for (var p in es) {
          if (es.hasOwnProperty(p)) {
            if (p === 'logo') {
              es[p].style('display', '');
            } else if (showElement.indexOf(p) > -1) {
              es[p].style('display', 'block');
            } else {
              es[p].style('display', 'none');
            }
          }
        }
        //links is hidden
        if (this.logoClickHandle) {
          this.logoClickHandle.remove();
          html.setStyle(this.logoNode, 'cursor', 'default');
        }

        if (showElement.indexOf('links') < 0) {
          this.linksVisible = false;
          this.logoClickHandle = on(es.logo[0], 'click', lang.hitch(this, this.switchPopupLinks));
          html.setStyle(this.logoNode, 'cursor', 'pointer');
        } else {
          if (this.linksVisible) {
            this.switchPopupLinks();
          }
        }
      },

      switchSignin: function() {
        var credential = tokenUtils.getPortalCredential(this.appConfig.portalUrl);
        if (credential) {
          this.onSignIn(credential);
        } else {
          this.onSignOut();
        }
        html.setStyle(this.signInSectionNode, 'display', 'none');
      },

      switchPopupLinks: function() {
        if(!this.appConfig.links || this.appConfig.links.length === 0){
          return;
        }
        html.destroy(this.popupLinkNode);

        this.popupLinkNode = this.createPopupLinkNode();
        // this.switchSignin();
        html.setStyle(this.popupSigninNode, 'display', 'none');
        html.setStyle(this.popupUserNameNode, 'display', 'none');
        html.setStyle(this.popupSignoutNode, 'display', 'none');

        if (this.linksVisible) {
          this.linksVisible = false;
          html.setStyle(this.popupLinkNode, 'display', 'none');
        } else {
          this.linksVisible = true;
          html.setStyle(this.popupLinkNode, 'display', 'block');
        }
      },

      createPopupLinkNode: function() {
        var node;
        var box = html.getContentBox(jimuConfig.layoutId);

        node = html.create('div', {
          'class': 'popup-links',
          style: {
            top: 0,
            width: (box.w - this.width) + 'px'
          }
        }, this.domNode);

        if (window.isRTL) {
          html.setStyle(node, 'right', this.width + 'px');
        } else {
          html.setStyle(node, 'left', this.width + 'px');
        }

        array.forEach(this.appConfig.links, function(link) {
          this.createLinkNode(node, link, false);
        }, this);

        this.popupSigninNode = this.createLinkNode(node, {
          label: 'SignIn',
          url: '#'
        }, true);
        this.popupUserNameNode = this.createLinkNode(node, {
          label: '',
          url: '#'
        }, true);
        this.popupSignoutNode = this.createLinkNode(node, {
          label: 'SignOut',
          url: '#'
        }, true);

        this.own(on(this.popupSigninNode, 'click', lang.hitch(this, '_onSigninClick')));
        this.own(on(this.popupSignoutNode, 'click', lang.hitch(this, '_onSignoutClick')));
        utils.setVerticalCenter(node);
        //empty
        this.createLinkNode(node, {
          label: '',
          url: '#'
        }, false);
        return node;
      },

      createLinkNode: function(containerNode, link, isSign) {
        var node, lineNode, linkSectionNode, className;

        node = html.place('<div class="link"></div>', containerNode);

        lineNode = html.place('<div class="line"></div>', node);
        if (isSign) {
          className = 'link-section signin';
        } else {
          className = 'link-section';
        }
        linkSectionNode = html.place('<div class="' + className + '"></div>', node);
        html.create('a', {
          href: link.url,
          target: '_blank',
          rel: "noopener noreferrer",
          innerHTML: utils.sanitizeHTML(link.label),
          'class': "jimu-vcenter-text jimu-ellipsis",
          title: link.label
        }, linkSectionNode);

        return node;
      },

      _onSigninClick: function() {
        tokenUtils.signInPortal(this.appConfig.portalUrl, this.appConfig.appId);
      },

      _onSignoutClick: function() {
        var isDepolyedApp = !this.appConfig.mode;

        if (isDepolyedApp) {
          //tokenUtils.signOutPortal(this.appConfig.portalUrl);
          tokenUtils.signOutAll();
        } else {
          new Message({
            message: this.nls.cantSignOutTip
          });
        }
      },

      _onUserNameClick: function() {},

      _onAboutClick: function() {
        var widgetConfig = {
          id: this.appConfig.about + '_1',
          uri: this.appConfig.about,
          label: 'About'
        };
        this.widgetManager.loadWidget(widgetConfig).then(lang.hitch(this, function(widget) {
          html.place(widget.domNode, jimuConfig.layoutId);
          widget.startup();
        }));
      },

      resize: function() {
        this.switchElements(['title', 'links', 'subtitle']);
        var box = html.getContentBox(this.domNode);
        var logoBox = html.getMarginBox(this.logoNode);
        var titlesBox = html.getMarginBox(this.titlesNode);
        var linksBox = html.getMarginBox(this.linksNode);

        this.width = box.w;
        if (box.w <= titlesBox.w + linksBox.w + logoBox.w){
          this.switchElements(['title', 'links']);
          titlesBox = html.getMarginBox(this.titlesNode);
          if (box.w <= titlesBox.w + linksBox.w + logoBox.w) {
            this.switchElements(['title']);
            if (box.w <= titlesBox.w + logoBox.w) {
              this.switchElements([]);
            }
          }
        }
      },


      getHeaderHeight: function() {
        return 44;
      },

      getHeaderEmptyWidth: function() {
        return 1 / 8 * html.getMarginBox(this.domNode).w;
      },

      getLogoHeight: function() {
        return 34;
      },

      destroy: function() {
        this.inherited(arguments);

        if (this.popupLinkNode && this.linksVisible) {
          this.switchPopupLinks();
        }
        html.destroy(this.popupLinkNode);
      }
    });
    return clazz;
  });
