///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 - 2018 Esri. All Rights Reserved.
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
    'dojo/topic',
    'dojo/aspect',
    'dojo/query',
    'dojo/on',
    'dojo/mouse',
    'dojo/fx',
    'dojo/dom-geometry',
    'jimu/BaseWidget',
    'jimu/PoolControllerMixin',
    'jimu/utils',
    'dojo/NodeList-manipulate',
    'dojo/NodeList-fx'
  ],
  function(declare, lang, array, html, topic, aspect, query, on, mouse, fx, domGeometry,
    BaseWidget, PoolControllerMixin, utils) {
    var clazz = declare([BaseWidget, PoolControllerMixin], {

      baseClass: 'jimu-widget-sidebar-controller jimu-main-background',

      moveTopOnActive: false,

      maxWidth: 365,
      minWidth: 55,
      animTime: 200,

      stateNode: null,
      currentTab: null, // doesn't reference to more tab
      moreTab: false,
      moreTabOpened: false,
      currentOtherGroup: null,
      lastSelectedIndex: -1,

      constructor: function() {
        this.tabs = [];
      },

      postMixInProperties: function() {
        this.inherited(arguments);

        this.nls.more = this.nls.more || "more";
        this.nls.otherPanels = this.nls.otherPanels || "Other Panels";
      },

      startup: function() {
        this.inherited(arguments);

        var openAtStartId = this.createTabs();

        if(openAtStartId === ''){
          this.widgetManager.minimizeWidget(this);
        }else{
          //open the first openatstart widget
          this.widgetManager.maximizeWidget(this);
          this.setOpenedIds([openAtStartId]);
        }
      },

      getOpenedIds: function() {
        this.inherited(arguments);

        var ids = [];
        if (this.currentTab && this.currentTab.config && this.currentTab.config.id) {
          ids.push(this.currentTab.config.id);
        } else if (this.currentOtherGroup && this.currentOtherGroup.id) {
          ids.push(this.currentOtherGroup.id);
        }

        return ids;
      },

      setOpenedIds: function(ids) {
        this._openLastTab(ids);
      },

      onMinimize: function() {
        this._resizeToMin();
      },

      onMaximize: function() {
        this._resizeToMax();
      },

      getWidth: function(){
        var box = html.getContentBox(window.jimuConfig.layoutId);
        var w;
        if(box.w * 0.8 > this.maxWidth){
          w = this.maxWidth;
        }else{
          w = box.w * 0.8;
        }
        return w;
      },

      resize: function() {
        if(this.windowState === 'minimized'){
          this._resizeMinTitleNode();
          return;
        }
        this._resizeToMax();
      },

      _resizePanels: function() {
        array.forEach(this.tabs, function(tab) {
          if (!tab.selected) {
            return;
          }
          if (tab.panel) {
            tab.panel.resize();
          }
        }, this);
      },

      _resizeTitleNode: function(){
        var nodeWidth = (this.getWidth() / 5);//var nodeWidth = (this.getWidth() / 3); var nodeWidth = (this.getWidth() - 2 - 21 - 18 * 4) / 5;
        array.forEach(query('.title-node', this.maxStateNode), function(titleNode){
          html.setStyle(titleNode, 'width', nodeWidth + 'px');
        }, this);
      },

      _resizeMinTitleNode: function(){
        var box = html.getContentBox(this.minStateNode);
        var margin = 34;
        if(box.h < 390){
          margin = box.h / 5 - 44;
        }

        margin = margin + 2;//because marginTop=-2
        array.forEach(query('.title-node', this.minStateNode), function(titleNode){
          html.setStyle(titleNode, 'marginBottom', margin + 'px');
        }, this);
      },

      setPosition: function(position) {
        this.position = position;
        var style = utils.getPositionStyle(this.position);
        style.position = 'absolute';
        html.place(this.domNode, window.jimuConfig.layoutId);
        html.setStyle(this.domNode, style);
        if(this.started){
          this.widgetManager.minimizeWidget(this);
        }
      },

      createTabs: function() {
        var allIconConfigs = this.getAllConfigs(),
          iconConfigs = [], openAtStartId = '';
        if (allIconConfigs.length <= 5) {
          iconConfigs = allIconConfigs;
          this.moreTab = false;
        } else {
          iconConfigs = allIconConfigs.splice(0, 4);
          this.moreTab = true;
        }
        array.forEach(iconConfigs, function(iconConfig) {
          this.createTab(iconConfig);
          if(iconConfig.openAtStart === true){
            openAtStartId = iconConfig.id;
          }
        }, this);
        if (this.moreTab) {
          this.createTab({
            label: this.nls.more,
            flag: 'more',
            icon: this.folderUrl + 'images/more_tab_icon.png',
            groups: allIconConfigs
          });
          if(openAtStartId === ''){
            array.forEach(allIconConfigs, function(iconConfig) {
              if(iconConfig.openAtStart === true){
                openAtStartId = iconConfig.id;
              }
            });
          }
        }
        return openAtStartId;
      },

      createTab: function(g) {
        var contentNode = this._createContentNode(g);
        var tab = {
          title: this._createTitleNode(g),
          content: contentNode,
          contentPane: query('.content-pane', contentNode)[0],
          config: g,
          selected: false,
          flag: g.flag,
          moreGroupWidgets: [],
          panels: []
        };
        this.tabs.push(tab);
        return tab;
      },

      onSelect: function(evt) {
        var node = evt.currentTarget,
          index = parseInt(query(node).attr('i')[0], 10);
        this.selectTab(index);
      },

      selectTab: function(index) {
        var color;

        if (this.tabs[index].selected && this.tabs[index].flag !== 'more') {
          return;
        }
        if (this.tabs[this.getSelectedIndex()] === undefined ||
          this.tabs[this.getSelectedIndex()].flag !== 'more') {
          this.lastSelectedIndex = this.getSelectedIndex();
        }

        this._showIndicator(index);

        color = this._getIndicatorNodeByIndex(index).style('backgroundColor');
        query('.content-title-bg', this.tabs[index].content).style({
          background: color
        });

        //switch widget and tab state
        array.forEach(this.tabs, function(tab, i) {
          if (index === i) {
            tab.selected = true;
            tab.title.classList.remove('tab-not-selected');
            tab.title.classList.add('tab-selected');
            
            // Change text in header
            $('#data_title_id p').text(tab.title.title);

          } else {
            tab.title.classList.remove('tab-selected');
            tab.title.classList.add('tab-not-selected');
            
            if (tab.selected) {
              tab.selected = false;
              if(tab.panel){
                this.panelManager.closePanel(tab.panel);
              }
            }
          }
        }, this);

        if (this.tabs[index].flag === 'more') {
          this.showMoreTabContent(this.tabs[index]);
        } else {
          query('.content-node', this.domNode).style({
            display: 'none'
          });
          query(this.tabs[index].content).style({
            display: 'block'
          });

          if (query('.jimu-wc-tpc', this.tabs[index].content).length === 0) {
            this.showTabContent(this.tabs[index]);
          }
        }
        this._resizePanels();
      },

      onAction: function(action, data) {
        /*jshint unused: false*/
        if (action === 'highLight' && data) {
          var node = query('div[settingid="' + data.widgetId + '"]', this.stateNode)[0];
          this._highLight(node);
        }
        if (action === 'removeHighLight') {
          this._removeHighLight();
        }
      },

      _openLastTab: function(ids) {
        if (ids && ids.length && ids.length > 0) {
          var configs = this.getAllConfigs();
          var configIds = array.map(configs, function(g) {
            if (g && g.id) {
              return g.id;
            }
            return null;
          });
          array.forEach(ids, lang.hitch(this, function(id) {
            var idx = configIds.indexOf(id);
            if (idx === -1) {
              return;
            }
            if (idx < 4) {
              this.selectTab(idx);
            } else {
              this._addGroupToMoreTab(configs[idx]);
            }
          }));
        }
      },

      _highLight: function(node) {
        if (this.hlDiv) {
          this._removeHighLight();
        }
        if (!node) {
          return;
        }
        var position = html.getMarginBox(node);
        var contentPosition = html.getContentBox(node);
        if (node.parentElement.firstElementChild !== node && !window.isRTL) {
          position.l = position.l + position.w - contentPosition.w;
        }

        var hlStyle = {
          position: 'absolute',
          left: (position.l) + 'px',
          top: (position.t) + 'px',
          width: (contentPosition.w) + 'px',
          height: (contentPosition.h) + 'px'
        };
        this.hlDiv = html.create('div', {
          "style": hlStyle,
          "class": 'icon-highlight'
        }, node, 'after');
      },

      _removeHighLight: function() {
        if (this.hlDiv) {
          html.destroy(this.hlDiv);
          this.hlDiv = null;
        }
      },

      _getTitleNodeByIndex: function(index) {
        var titleNode, contextNode;
        if (this.windowState === 'maximized') {
          contextNode = this.maxStateNode;
        } else {
          contextNode = this.minStateNode;
        }
        titleNode = query('.title-node:nth-child(' + (index + 1) + ')', contextNode);
        return titleNode;
      },

      _onMouseEnter: function(evt) {
        var node = evt.currentTarget,
          index = parseInt(query(node).attr('i')[0], 10);

        if (this.windowState === 'maximized' &&
          this.tabs[index].selected && this.tabs[index].flag !== 'more') {
          return;
        }
        this._showIndicator(index);
      },

      _onMouseLeave: function(evt) {
        var node = evt.currentTarget,
          index = parseInt(query(node).attr('i')[0], 10);
        if (this.windowState === 'maximized' && this.tabs[index].selected &&
          ((this.moreTabOpened && this.tabs[index].flag === 'more') ||
            !this.moreTabOpened && this.tabs[index].flag !== 'more')) {
          return;
        }
        this._hideIndicator(index);
      },

      _getIndicatorNodeByIndex: function(index) {
        return query('.tab-indicator', this._getTitleNodeByIndex(index)[0]);
      },

      _showIndicator: function(index) {
        query('.tab-indicator', this.domNode).style({
          width: '0'
        });

        var w = html.getContentBox(this._getTitleNodeByIndex(index)[0]).w;
        this._getIndicatorNodeByIndex(index).animateProperty({
          properties: {
            width: w
          },
          duration: this.animTime,
          auto: true
        });
      },

      _hideIndicator: function(index) {
        this._getIndicatorNodeByIndex(index).animateProperty({
          properties: {
            width: 0
          },
          duration: this.animTime,
          auto: true
        });
      },

      getSelectedIndex: function() {
        var i = 0;
        for (i = 0; i < this.tabs.length; i++) {
          if (this.tabs[i].selected) {
            return i;
          }
        }
        return -1;
      },

      //can't show more tab
      showTabContent: function(tab) {
        var g = tab.config;
        this.showGroupContent(g, tab);

        if(g.inPanel === false){
          this.currentTab = null;
        }else{
          this.currentTab = tab;
        }
      },
      _onButHelpSidebarClick: function(){
          //alert($('#data_title_id p')[0].innerHTML);
        window.PanelId = $('#data_title_id p')[0].innerHTML.replace(/ /g,'');    

        utils.startTour();

      },
      showGroupContent: function(g, tab) {
        var groupPane;
        if (g.widgets && g.widgets.length > 1) {
          query('.content-title', tab.content).text(g.label);
        }

        if(g.inPanel === false){
          this.widgetManager.loadWidget(g).then(lang.hitch(this, function(widget) {
            var settingId;
            if (tab.flag === 'more') {
              settingId = 'undefined';
            }else{
              settingId = g.id;
            }
            this._resizeToMin();

            var position = this._getOffPanelPosition(settingId,
                this.widgetManager.getWidgetMarginBox(widget));
            widget.setPosition(position);
            this.widgetManager.openWidget(widget);
          }));
        }else{
          this.panelManager.showPanel(g).then(lang.hitch(this, function(panel) {
            var tabPane = panel;
            query(panel.domNode).style(utils.getPositionStyle({
              left: 0,
              right: 0,
              top: 0,
              bottom: 0
            }));
            if (tab.flag === 'more') {
              groupPane = query('.more-group-pane[label="' + g.label + '"]', tab.contentPane);
              groupPane.append(tabPane.domNode);
            } else {
              query(tab.contentPane).append(tabPane.domNode);
            }

            if (array.indexOf(tab.panels, panel) === -1) {
              tab.panels.push(panel);
            }
            tab.panel = panel;
          }));
        }
      },

      _getOffPanelPosition: function(settingId, widgetBox){
        var position = {},
            node = query('div[settingid="' + settingId + '"]', this.stateNode)[0],
            iconBox = domGeometry.position(node);

        position.top = iconBox.y;
        if (window.isRTL) {
          position.right = iconBox.x - widgetBox.w - 10;
        } else {
          position.left = iconBox.x + iconBox.w + 10;
        }
        return position;
      },

      showMoreTabContent: function(tab) {
        var groups = tab.config.groups,
          anim;
        var animP1 = null;
        var animP2 = null;
        query(this.otherGroupNode).empty();
        this._createOtherGroupPaneTitle();
        array.forEach(groups, function(group) {
          this._createMoreGroupNode(group);
        }, this);

        if (!window.isRTL) {
          animP1 = {
            left: this.minWidth - this.getWidth(),
            right: this.getWidth() - this.minWidth
          };
          animP2 = {
            left: this.minWidth,
            right: 0
          };
        } else {
          animP1 = {
            left: this.getWidth() - this.minWidth,
            right: this.minWidth - this.getWidth()
          };
          animP2 = {
            left: 0,
            right: this.minWidth
          };
        }
        anim = fx.combine([
          query(this.maxStateNode).animateProperty({
            properties: animP1,
            duration: this.animTime
          }),
          query(this.otherGroupNode).animateProperty({
            properties: animP2,
            duration: this.animTime
          })
        ]);
        anim.play();
        this.moreTabOpened = true;
      },

      _createOtherGroupPaneTitle: function() {
        var node = html.create('div', {
            'class': 'other-group-pane-title'
          }, this.otherGroupNode),
          closeNode;
        html.create('div', {
          'class': 'bg'
        }, node);
        html.create('div', {
          'class': 'text',
          innerHTML: this.nls.otherPanels
        }, node);
        closeNode = html.create('div', {
          'class': 'close'
        }, node);
        this.own(on(closeNode, 'click', lang.hitch(this, function() {
          this._hideOtherGroupPane();
          if (this.lastSelectedIndex !== -1) {
            this.selectTab(this.lastSelectedIndex);
          }
        })));
        return node;
      },

      _createMoreGroupNode: function(group) {
        var node = html.create('div', {
            'class': 'other-group',
            'data-widget-id': group.id
          }, this.otherGroupNode),
          arrowNode;
        html.create('img', {
          src: group.icon,
          'class': 'other-group-icon jimu-float-leading'
        }, node);
        html.create('div', {
          'class': 'other-group-title jimu-float-leading',
          innerHTML: utils.stripHTML(group.label)
        }, node);
        var imgUrl = window.isRTL ? 'images/arrow_choose_rtl.png' : 'images/arrow_choose.png';
        arrowNode = html.create('img', {
          'class': 'other-group-choose jimu-float-trailing',
          style: {
            opacity: 0
          },
          src: this.folderUrl + imgUrl
        }, node);
        this.own(on(node, 'click', lang.hitch(this, this._onOtherGroupClick, group)));
        this.own(on(node, 'mousedown', lang.hitch(this, function() {
          query(node).addClass('jimu-state-active');
        })));
        this.own(on(node, 'mouseup', lang.hitch(this, function() {
          query(node).removeClass('jimu-state-active');
        })));
        this.own(on(node, mouse.enter, lang.hitch(this, function() {
          query(arrowNode).style({
            opacity: 1
          });
        })));
        this.own(on(node, mouse.leave, lang.hitch(this, function() {
          query(arrowNode).style({
            opacity: 0
          });
        })));
        return node;
      },

      _hideOtherGroupPane: function() {
        var animP2 = null;
        if (!window.isRTL) {
          animP2 = {
            left: this.getWidth(),
            right: 0 - this.getWidth()
          };
        } else {
          animP2 = {
            left: 0 - this.getWidth(),
            right: this.getWidth()
          };
        }

        fx.combine([
          query(this.maxStateNode).animateProperty({
            properties: {
              left: 0,
              right: 0
            }
          }),
          query(this.otherGroupNode).animateProperty({
            properties: animP2
          })
        ]).play();

        this.moreTabOpened = false;
        var lastTab = this.tabs[this.getSelectedIndex()];
        if (lastTab && lastTab.flag === 'more') {
          this._hideIndicator(this.getSelectedIndex());
        }
      },

      _onOtherGroupClick: function(group) {
        if (this.currentOtherGroup === null || this.currentOtherGroup.label !== group.label) {
          var animP1 = null;
          if (!window.isRTL) {
            animP1 = {
              left: 0 - this.getWidth(),
              right: this.getWidth()
            };
          } else {
            animP1 = {
              left: this.getWidth(),
              right: 0 - this.getWidth()
            };
          }
          var anim = fx.combine([
            query(this.maxStateNode).animateProperty({
              properties: animP1,
              duration: this.animTime
            }),
            query(this.otherGroupNode).animateProperty({
              properties: {
                left: 0,
                right: 0
              },
              duration: this.animTime
            })
          ]);
          this.own(aspect.after(anim, 'onEnd', lang.hitch(this, this._addGroupToMoreTab, group)));
          anim.play();
        } else {
          this._addGroupToMoreTab(group);
        }
      },

      _addGroupToMoreTab: function(group) {
        var tab = this.tabs[4];
        if(tab.panel){
          this.panelManager.closePanel(tab.panel);
        }
        query('.content-node', this.domNode).style({
          display: 'none'
        });
        query(tab.content).style({
          display: 'block'
        });

        if (this._getGroupFromMoreTab(tab, group) === null) {
          var groupPane = html.create('div', {
            'class': 'more-group-pane',
            label: group.label
          }, tab.contentPane);
          query(tab.contentPane).append(groupPane);
          tab.moreGroupWidgets.push({
            glabel: group.label,
            widgets: []
          });
        }

        this.currentTab = null;
        this.currentOtherGroup = group;
        this.showGroupContent(group, tab);
        query('.more-group-pane', tab.contentPane).style({
          display: 'none'
        });
        query('.more-group-pane[label="' + group.label + '"]', tab.contentPane).style({
          display: 'block'
        });

        this._hideOtherGroupPane();
        this._resizePanels();
      },

      _getGroupFromMoreTab: function(tab, group) {
        for (var i = 0; i < tab.moreGroupWidgets.length; i++) {
          if (tab.moreGroupWidgets[i].glabel === group.label) {
            return tab.moreGroupWidgets[i];
          }
        }
        return null;
      },

      _createTitleNode: function(config) {
        /*jshint unused:false*/
        var nodeWidth = (this.getWidth() /5);// var nodeWidth = (this.getWidth() /3);         var nodeWidth = (this.getWidth() - 2 - 21 - 18 * 4) / 5;
        var title = config.label,
          iconUrl = config.icon,
          node = html.create('div', {
            title: title,
            'class': 'title-node jimu-float-leading',// jimu-leading-margin15',
            'settingid': config.id,
            'id': config.id,
            i: this.tabs.length,
            style: {
              width: nodeWidth + 'px'
            }
          }, this.titleListNode),

          /*indicator = html.create('div', {
            'class': 'tab-indicator'
          }, node),*/

          imgNode = html.create('img', {
            src: iconUrl
          }, node),

          /*textNode = html.create('div', {
            innerHTML: title,
            'class': 'panel_titles'
            
          }, node),*/

          minNode = html.create('div', {
            title: title,
            'class': 'title-node',
            'settingid': config.id,
            'id': config.id + '_min',
            i: this.tabs.length
          }, this.minStateNode),

          minIndicatorNode = html.create('div', {
            'class': 'tab-indicator'
          }, minNode),

          minImgNode = html.create('img', {
            src: iconUrl
          }, minNode);

        if(window.isRTL && config.mirrorIconForRTL){
          html.addClass(imgNode, 'jimu-flipx');
        }
        if(window.isRTL && config.mirrorIconForRTL){
          html.addClass(minImgNode, 'jimu-flipx');
        }

        this.own(on(node, 'click', lang.hitch(this, this.onSelect)));
        /*this.own(on(node, mouse.enter, lang.hitch(this, this._onMouseEnter)));
        this.own(on(node, mouse.leave, lang.hitch(this, this._onMouseLeave)));*/

        this.own(on(minNode, 'click', lang.hitch(this, this._onMinIconClick, minNode)));
        /*this.own(on(minNode, mouse.enter, lang.hitch(this, this._onMouseEnter)));
        this.own(on(minNode, mouse.leave, lang.hitch(this, this._onMouseLeave)));*/
        return node;
      },

      _onMinIconClick: function(minNode) {
        var index = query(minNode).attr('i')[0],
            tab = this.tabs[index],
            config = tab.config;

        if(config.inPanel === false){
          if(!tab.selected){
            this._hideOffPanelWidgets();
            this.selectTab(parseInt(index, 10));
          }else{
            tab.selected = false;
            this.widgetManager.closeWidget(config.id);
          }
        }else{
          this._hideOffPanelWidgets();
          this.widgetManager.maximizeWidget(this);
          this.selectTab(parseInt(index, 10));
        }
      },

      /**
       *hide all off panel widgets
       */
      _hideOffPanelWidgets: function(){
        array.forEach(this.tabs, function(tab){
          if(tab.flag !== 'more'){
            if(!tab.config.inPanel){
              tab.selected = false;
              this.widgetManager.closeWidget(tab.config.id);
            }
          }else{
            array.forEach(tab.config.groups, function(g){
              if(!g.inPanel){
                tab.selected = false;
                this.widgetManager.closeWidget(g.id);
              }
            }, this);
          }
        }, this);
      },

      _createContentNode: function(config) {
        var node = html.create('div', {
          'class': 'content-node'
        }, this.contentListNode);
        /*html.create('div', {
          'class': 'content-title-bg'
        }, node);
        html.create('div', {
          'class': 'content-title',
          innerHTML: utils.stripHTML((config.widgets && config.widgets.length > 1)?
                                          config.label : '')
        }, node);*/
        html.create('div', {
          'class': 'content-pane'
        }, node);

        this.own(on(node, 'click', lang.hitch(this, function() {
          if (this.moreTabOpened) {
            this._hideOtherGroupPane();
            if (this.lastSelectedIndex !== -1) {
              this.selectTab(this.lastSelectedIndex);
            }
          }
        })));
        return node;
      },

      _doResize: function() {
        if (this.windowState === 'maximized') {
          this.widgetManager.minimizeWidget(this.id);
        } else {
          this._hideOffPanelWidgets();
          this.widgetManager.maximizeWidget(this.id);
        }
      },

      _resizeToMin: function() {
        query(this.domNode).style('width', this.minWidth + 'px');
        query(this.minStateNode).style('display', 'block');
        query(this.maxStateNode).style('display', 'none');

        if(this.currentTab && this.currentTab.panel){
          this.panelManager.closePanel(this.currentTab.panel);
        }

        if (window.isRTL) {
          query('div', this.doResizeNode).removeClass('right-arrow').addClass('left-arrow');
        } else {
          query('div', this.doResizeNode).removeClass('left-arrow').addClass('right-arrow');
        }

        this._resizeMinTitleNode();

        topic.publish('changeMapPosition', {
          left: this.minWidth
        });

        this.stateNode = this.minStateNode;
      },

      _resizeToMax: function() {
        query(this.domNode).style('width', this.getWidth() + 'px');
        this._resizeTitleNode();
        query(this.minStateNode).style('display', 'none');
        query(this.maxStateNode).style('display', 'block');
        if (window.isRTL) {
          query('div', this.doResizeNode).removeClass('left-arrow').addClass('right-arrow');
        } else {
          query('div', this.doResizeNode).removeClass('right-arrow').addClass('left-arrow');
        }
        this._resizePanels();

        topic.publish('changeMapPosition', {
          left: this.getWidth()
        });

        if (this.currentTab) {
          this.showGroupContent(this.currentTab.config, this.currentTab);
        }

        this.stateNode = this.maxStateNode;
      }
    });
    return clazz;
  });