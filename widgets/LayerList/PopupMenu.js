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
  'dojo/_base/array',
  'dojo/_base/html',
  'dojo/_base/lang',
  'dojo/query',
  'dojo/on',
  'dojo/keys',
  'dijit/focus',
  'dojo/Deferred',
  'jimu/dijit/DropMenu',
  'jimu/utils',
  'dijit/_TemplatedMixin',
  'dijit/form/HorizontalSlider',
  'dijit/form/HorizontalRuleLabels',
  'dojo/text!./PopupMenu.html',
  'dojo/dom-style',
  'esri/dijit/VisibleScaleRangeSlider',
  './NlsStrings',
  './PopupMenuInfo'
], function(declare, array, html, lang, query, on, keys, focusUtil, Deferred, DropMenu, jimuUtils,
  _TemplatedMixin, HorizSlider, HorzRuleLabels, template, domStyle, VisibleScaleRangeSlider,
  NlsStrings, PopupMenuInfo) {
  return declare([DropMenu, _TemplatedMixin], {
    templateString: template,
    popupMenuInfo: null,
    loading: null,
    _deniedItems: null,
    _deniedItemsFromConfig: null,
    _layerInfo: null,
    constructor: function() {
      this.nls = NlsStrings.value;
    },

    postCreate: function() {
      this.inherited(arguments);
      this._initDeniedItems();
      this.loading = html.create('div', {
        'class': 'popup-menu-loading'
      }, this.popupMenuNode);

      // if(!this.hasContentMenu()) {
      //   this.hide();
      //   domStyle.set(this.popupMenuNode, 'display', 'none');
      // }
    },

    _initDeniedItems: function() {
      var deniedItemsFromConfigKeys = [];
      var menuItemDictionary = {
        "ZoomTo": "zoomto",
        "Transparency": "transparency",
        "SetVisibilityRange": "setVisibilityRange",
        "EnableOrDisablePopup": "controlPopup",
        "ControlLabels": "controlLabels",
        "MoveupOrMovedown": "moveup movedown",
        "OpenAttributeTable": "table",
        "DescriptionOrShowItemDetailsOrDownload": "url"
      };
      this._deniedItems = [];
      this._deniedItemsFromConfig = [];
      // ignore if this._config.contextMenu has not configured.
      // compatible with old version app.
      for (var menuItem in this._config.contextMenu) {
        if(this._config.contextMenu.hasOwnProperty(menuItem) &&
            (typeof this._config.contextMenu[menuItem] !== 'function') &&
            this._config.contextMenu[menuItem] === false) {
          deniedItemsFromConfigKeys =
            deniedItemsFromConfigKeys.concat(menuItemDictionary[menuItem].split(" "));
        }
      }

      array.forEach(deniedItemsFromConfigKeys,
                    lang.hitch(this, function(deniedItemKey) {
        this._deniedItemsFromConfig.push({
          'key': deniedItemKey,
          'denyType': 'hidden'
        });
      }));
    },

    _getDropMenuPosition: function() {
      return {
        top: "40px",
        right: "0px",
        zIndex: 1
      };
    },

    _getTransNodePosition: function() {
      return {
        top: "28px",
        //left: "-107px"
        //left: -1 * html.getStyle(this.transparencyDiv, 'width') + 'px'
        right: "2px"
      };
    },

    _onBtnClick: function() {},

    // will call after openDropMenu
    _refresh: function() {
      this._denyItems();
      this._changeItemsUI();
    },

    _denyItems: function() {
      var itemNodes = query("[class~='menu-item-identification']", this.dropMenuNode);
      itemNodes.forEach(function(itemNode) {
        html.removeClass(itemNode, "menu-item-dissable");
        html.removeClass(itemNode, "menu-item-hidden");
      }, this);
      html.removeClass(this.dropMenuNode, "no-border");
      array.forEach(this._deniedItems, function(deniedItem) {
        var itemNode = query("div[itemId='" + deniedItem.key + "']", this.dropMenuNode)[0];
        if (itemNode) {
          if (deniedItem.denyType === "disable") {
            html.addClass(itemNode, "menu-item-dissable");
            html.setAttr(itemNode, 'aria-disabled', 'true');
            if (deniedItem.key === 'url') {
              query(".menu-item-description", itemNode).forEach(function(itemA) {
                html.setAttr(itemA, 'href', '#');
                html.removeAttr(itemA, 'target');
              });
            }
          } else {
            html.removeAttr(itemNode, 'aria-disabled');
            html.addClass(itemNode, "menu-item-hidden");
          }
        }
      }, this);

      // handle separator line
      var lastDisplayItemNodeIndex = -1;
      for (var i = 0; i < itemNodes.length; i++) {
        if (html.hasClass(itemNodes[i], 'menu-item-line')) {
          if (lastDisplayItemNodeIndex === -1 ||
            html.hasClass(itemNodes[lastDisplayItemNodeIndex], 'menu-item-line')) {
            html.addClass(itemNodes[i], "menu-item-hidden");
          }
        }

        if (!html.hasClass(itemNodes[i], 'menu-item-hidden')) {
          lastDisplayItemNodeIndex = i;
        }
      }
      // Hide last item if that is a line.
      var displayItemNodes = array.filter(itemNodes, function(itemNode) {
        return !html.hasClass(itemNode, 'menu-item-hidden');
      });
      if (displayItemNodes.length === 0) {
        html.addClass(this.dropMenuNode, "no-border");
      } else {
        html.removeClass(this.dropMenuNode, "no-border");
        if (html.hasClass(displayItemNodes[displayItemNodes.length - 1], 'menu-item-line')) {
          html.addClass(displayItemNodes[displayItemNodes.length - 1], "menu-item-hidden");
        }
      }
    },

    _changeItemsUI: function() {
      //handle controlPopup item.
      var itemNode = query("[itemid=controlPopup]", this.dropMenuNode)[0];
      if (itemNode) {
        //if (this._layerInfo.controlPopupInfo.enablePopup) {
        if (this._layerInfo.isPopupNestedEnabled()) {
          html.setAttr(itemNode, 'innerHTML', this.nls.removePopup);
        } else {
          html.setAttr(itemNode, 'innerHTML', this.nls.enablePopup);
        }
      }
      //handle controlLabels item.
      itemNode = query("[itemid=controlLabels]", this.dropMenuNode)[0];
      if (itemNode && this._layerInfo.canShowLabel()) {
        if (this._layerInfo.isShowLabels()) {
          html.setAttr(itemNode, 'innerHTML', this.nls.hideLables);
        } else {
          html.setAttr(itemNode, 'innerHTML', this.nls.showLabels);
        }
      }
      //add tartet to a tag.
      itemNode = query("[itemid=url] a", this.dropMenuNode)[0];
      if(itemNode) {
        html.setAttr(itemNode, 'target', '_blank');
      }
    },

    _switchLoadingState: function(isShow) {
      if(isShow) {
        html.setStyle(this.loading, 'display', 'block');
      } else {
        html.setStyle(this.loading, 'display', 'none');
      }
    },

    selectItem: function(item, evt) {
      var found = false;
      for (var i = 0; i < this._deniedItems.length; i++) {
        if (this._deniedItems[i].key === item.key) {
          found = true;
          break;
        }
      }
      if (!found) {
        this.emit('onMenuClick', item);
      }
      evt.stopPropagation(evt);
    },

    openDropMenu: function() {
      var inheritedCallBack = lang.hitch(this, this.inherited, arguments);
      var popupMenuInfoDef = new Deferred();
      this._switchLoadingState(true);
      if (!this.dropMenuNode) {
        // create popupMenuInfo first.
        PopupMenuInfo.create(this._layerInfo, this.layerListWidget)
          .then(lang.hitch(this, function(popupMenuInfo) {
            // set environment and create.
            this.items = popupMenuInfo.getDisplayItems();
            this.popupMenuInfo = popupMenuInfo;
            this._createDropMenuNode();
            popupMenuInfoDef.resolve(this.popupMenuInfo);
          }));
      } else {
        popupMenuInfoDef.resolve(this.popupMenuInfo);
      }

      popupMenuInfoDef.then(lang.hitch(this, function() {
        // get deniedItems
        this.popupMenuInfo.getDeniedItems().then(lang.hitch(this, function(deniedItems) {
          this._deniedItems = this._deniedItemsFromConfig.concat(deniedItems);
          // deny items
          this._refresh();
          // display dropMenuNode.
          inheritedCallBack(arguments);
          this._switchLoadingState(false);
        }), lang.hitch(this, function() {
          this._switchLoadingState(false);
        }));
      }), lang.hitch(this, function() {
        this._switchLoadingState(false);
      }));
    },

    closeDropMenu: function() {
      this.inherited(arguments);
      this.hideTransNode();
      this.hideSetVisibilityRangeNode();
    },

    // about transparcency
    _onTransparencyDivClick: function(evt) {
      // summary:
      //    response to click transparency in popummenu.
      evt.stopPropagation();
    },

    showTransNode: function(transValue, item) {
      /* global isRTL */
      this.hideSetVisibilityRangeNode();
      if (!this.transHorizSlider) {
        this._createTransparencyWidget(item);
        this.transHorizSlider.set("value", 1 - transValue);
      } else {
        this.transHorizSlider.set("value", 1 - transValue);
      }
      domStyle.set(this.transparencyDiv, "top", this._getTransNodePosition().top);
      if (isRTL) {
        domStyle.set(this.transparencyDiv, "left", this._getTransNodePosition().right);
      } else {
        domStyle.set(this.transparencyDiv, "right", this._getTransNodePosition().right);
      }
      domStyle.set(this.transparencyDiv, "display", "block");
      this.transHorizSlider.focus();
    },

    hideTransNode: function() {
      domStyle.set(this.transparencyDiv, "display", "none");
    },

    _createTransparencyWidget: function(item) {
      this.transHorizSlider = new HorizSlider({
        minimum: 0,
        maximum: 1,
        intermediateChanges: true
      }, this.transparencyBody);

      this.own(this.transHorizSlider.on("change", lang.hitch(this, function(newTransValue) {
        var data = {
          newTransValue: newTransValue
        };
        this.emit('onMenuClick', {
          key: 'transparencyChanged'
        }, data);
      })));

      this.own(on(this.transHorizSlider.domNode, "keydown", lang.hitch(this, function(e) {
        if(e.keyCode === keys.ESCAPE) {
          e.stopPropagation();
          e.preventDefault();
          this.hideTransNode();
          var menuItem = this.getMenuItemNodeByItemKey(item.key);
          if(menuItem) {
            focusUtil.focus(menuItem);
          }
        } else if(e.keyCode === keys.TAB) {
          e.stopPropagation();
          e.preventDefault();
          this._enableNavMode(e);
        }
      })));

      new HorzRuleLabels({
        container: "bottomDecoration"
      }, this.transparencyRule);
    },

    _onSetVisibilityRangeNode: function(evt) {
      // summary:
      //    response to click transparency in popummenu.
      evt.stopPropagation();
    },

    showSetVisibilityRangeNode: function(layerInfo, item) {
      /* global isRTL */
      this.hideTransNode();
      if (!this.visibleScaleRangeSlider) {
        var scaleRange = layerInfo.getScaleRange();
        this.visibleScaleRangeSlider = new VisibleScaleRangeSlider({
          map: layerInfo.map,
          minScale: scaleRange.minScale,
          maxScale: scaleRange.maxScale
        }).placeAt(this.setVisibilityRangeNode);
        this.visibleScaleRangeSlider.startup();
        this._supportsVisibilityRange508Accessibility(item);
      }

      this.own(this.visibleScaleRangeSlider.on("scale-range-change", lang.hitch(this, function(scaleRange) {
        layerInfo.setScaleRange(scaleRange.minScale, scaleRange.maxScale);
      })));

      domStyle.set(this.setVisibilityRangeNode, "top", this._getTransNodePosition().top);
      if (isRTL) {
        domStyle.set(this.setVisibilityRangeNode, "left", this._getTransNodePosition().right);
      } else {
        domStyle.set(this.setVisibilityRangeNode, "right", this._getTransNodePosition().right);
      }
      domStyle.set(this.setVisibilityRangeNode, "display", "block");
      this.visibleScaleRangeSlider._slider.focus();
      this.visibleScaleRangeSlider._slider.focus();
    },

    hideSetVisibilityRangeNode: function() {
      domStyle.set(this.setVisibilityRangeNode, "display", "none");
    },

    hide: function() {
      domStyle.set(this.domNode, 'display', 'none');
    },

    show: function() {
      domStyle.set(this.domNode, 'display', 'block');
    },

    _enableNavMode:function(evt) {
      if(evt.keyCode === keys.TAB && !jimuUtils.isInNavMode()){
        html.addClass(document.body, 'jimu-nav-mode');
      }
    },

    /*
    hasContentMenu: function() {
      var hasContentMenu = false;
      var item;
      if(this._config.contextMenu) {
        for (item in this._config.contextMenu) {
          if(this._config.contextMenu.hasOwnProperty(item) &&
             (typeof this._config.contextMenu[item] !== 'function')) {
            hasContentMenu = hasContentMenu || this._config.contextMenu[item];
          }
        }
      } else {
        hasContentMenu = true;
      }
      return hasContentMenu;
    }
    */
    /***************************************************
     * methods for 508 accessibility.
     ***************************************************/

    _supportsVisibilityRange508Accessibility: function(item) {
      var sliderBtns = query('.dijitSliderImageHandle', this.setVisibilityRangeNode);
      var firstFocusNode = sliderBtns[0];
      var downArrowButtons = query('.dijitDownArrowButton', this.setVisibilityRangeNode);
      var lastFocusNode = downArrowButtons[1];
      var firstDownArrowButton = downArrowButtons[0];
      var secondDownArrowButton = downArrowButtons[1];

      this.own(on(firstFocusNode, "keydown", lang.hitch(this, function(e) {
        if(e.keyCode === keys.TAB && e.shiftKey) {
          e.stopPropagation();
          e.preventDefault();
        }
      })));

      this.own(on(lastFocusNode, "keydown", lang.hitch(this, function(e) {
        if(e.keyCode === keys.TAB && !e.shiftKey) {
          e.stopPropagation();
          e.preventDefault();
        } else if (e.keyCode === keys.ENTER) {
          e.stopPropagation();
          e.preventDefault();
          setTimeout(lang.hitch(this, function() {
            this._bindEsriScaleMenuPopupKey(secondDownArrowButton);
          }), 200);
        }
      })));

      this.own(on(firstDownArrowButton, "keydown", lang.hitch(this, function(e) {
        if (e.keyCode === keys.ENTER) {
          e.stopPropagation();
          e.preventDefault();
          setTimeout(lang.hitch(this, function() {
            this._bindEsriScaleMenuPopupKey(firstDownArrowButton);
          }), 200);
        }
      })));

      this.own(on(firstDownArrowButton, "click", lang.hitch(this, function(e) {
        e.stopPropagation();
        e.preventDefault();
        setTimeout(lang.hitch(this, function() {
          this._bindEsriScaleMenuPopupKey(firstDownArrowButton);
        }), 200);
      })));

      this.own(on(secondDownArrowButton, "click", lang.hitch(this, function(e) {
        e.stopPropagation();
        e.preventDefault();
        setTimeout(lang.hitch(this, function() {
          this._bindEsriScaleMenuPopupKey(secondDownArrowButton);
        }), 200);
      })));

      this.own(on(this.setVisibilityRangeNode, "keydown", lang.hitch(this, function(e) {
        if(e.keyCode === keys.ESCAPE) {
          e.stopPropagation();
          e.preventDefault();
          this.hideSetVisibilityRangeNode();
          var menuItem = this.getMenuItemNodeByItemKey(item.key);
          if(menuItem) {
            focusUtil.focus(menuItem);
          }
        } else if(e.keyCode === keys.TAB) {
          e.stopPropagation();
          //e.preventDefault();
          this._enableNavMode(e);
        } else if(e.keyCode === keys.ENTER) {
          e.stopPropagation();
        }
      })));
    },

    _bindEsriScaleMenuPopupKey: function(focusNodeWhenLeave) {
      var esriScaleMenuPopup = this._getEsriScaleMenuPopup();
      var dijitInputInner;
      var esriHeaders;
      var esriCurrent;

      if(esriScaleMenuPopup) {
        //var dijitTextBox = query('.dijitTextBox', esriScaleMenuPopup)[0];
        dijitInputInner = query('.dijitInputInner', esriScaleMenuPopup)[0];
        html.setAttr(dijitInputInner, 'tabindex', '0');
        esriHeaders = query('.esriHeader', esriScaleMenuPopup);
        esriCurrent = query('.esriCurrent', esriScaleMenuPopup)[0];
        if(esriHeaders[0] && esriCurrent) {
          html.setAttr(dijitInputInner, 'aria-label', esriHeaders[0].innerText + ' ' + esriCurrent.innerText);
        }
        focusUtil.focus(dijitInputInner);
      }

      if(esriScaleMenuPopup && !esriScaleMenuPopup._hasBeenBoundKey) {
        var esriScaleMenuList = query('.esriContent', esriScaleMenuPopup)[1];
        html.setAttr(esriScaleMenuList, 'tabindex', '0');
        if(esriHeaders[1]) {
          html.setAttr(esriScaleMenuList, 'aria-label', esriHeaders[1].innerText + ' ');
        }

        //var firstMenuItem = null;
        //var lastMenuItem = null;
        var esriScaleMenuItems = query('li.esriItem', esriScaleMenuPopup);
        /*
        esriScaleMenuItems = array.filter(esriScaleMenuItems, lang.hitch(this, function(menuItem) {
          if(html.hasClass(menuItem, 'esriHidden')) {
            return false;
          } else {
            return true;
          }
        }));
        */
        array.forEach(esriScaleMenuItems, function(menuItem) {
          /*
          var isFirstMenuItem = false;
          var isLastMenuItem = false;
          var previousMenuItem = null;
          var nextMenuItem = null;
          if(index === 0) {
            firstMenuItem = menuItem;
            isFirstMenuItem = true;
          }
          if(index === esriScaleMenuItems.lenght - 1) {
            lastMenuItem = menuItem;
            isLastMenuItem = true;
          }
          previousMenuItem = esriScaleMenuItems[index - 1];
          nextMenuItem = esriScaleMenuItems[index + 1];
          */
          html.setAttr(menuItem, 'tabindex', '0');

          this.own(on(menuItem, "keydown", lang.hitch(this, function(e) {
            var menuItemInfo = this._getMenuItemInfo(esriScaleMenuPopup, menuItem);
            if(e.keyCode === keys.TAB) {
              e.stopPropagation();
              e.preventDefault();
              if(esriScaleMenuList) {
                focusUtil.focus(esriScaleMenuList);
              }
            } else if(e.keyCode === keys.DOWN_ARROW){
              e.stopPropagation();
              e.preventDefault();
              if(menuItemInfo.nextMenuItem) {
                focusUtil.focus(menuItemInfo.nextMenuItem);
              }
            } else if(e.keyCode === keys.UP_ARROW){
              e.stopPropagation();
              e.preventDefault();
              if(menuItemInfo.previousMenuItem) {
                focusUtil.focus(menuItemInfo.previousMenuItem);
              }
            } else if(e.keyCode === keys.ESCAPE){
              e.stopPropagation();
              e.preventDefault();
              if(esriScaleMenuList) {
                focusUtil.focus(esriScaleMenuList);
              }
            } else if(e.keyCode === keys.ENTER){
              e.stopPropagation();
              e.preventDefault();
              var event = document.createEvent("MouseEvents");
              event.initEvent('click', true, true);
              menuItem.dispatchEvent(event);
              if(focusNodeWhenLeave) {
                focusUtil.focus(focusNodeWhenLeave);
              }
            }
          })));
        }, this);

        this.own(on(dijitInputInner, "keydown", lang.hitch(this, function(e) {
          if(e.keyCode === keys.TAB) {
            e.stopPropagation();
            e.preventDefault();
            this._enableNavMode(e);
            focusUtil.focus(esriScaleMenuList);
          } else if(e.keyCode === keys.ESCAPE){
            if(focusNodeWhenLeave) {
              focusUtil.focus(focusNodeWhenLeave);
            }
          } else if(e.keyCode === keys.ENTER){
            if(focusNodeWhenLeave) {
              focusUtil.focus(focusNodeWhenLeave);
            }
          }
        })));

        if(esriScaleMenuList) {
          this.own(on(esriScaleMenuList, "keydown", lang.hitch(this, function(e) {
            var menuItemInfo = this._getMenuItemInfo(esriScaleMenuPopup);
            if(e.keyCode === keys.TAB) {
              e.stopPropagation();
              e.preventDefault();
              this._enableNavMode(e);
              focusUtil.focus(dijitInputInner);
            } else if (e.keyCode === keys.ENTER) {
              e.stopPropagation();
              e.preventDefault();
              if(menuItemInfo.firstMenuItem) {
                focusUtil.focus(menuItemInfo.firstMenuItem);
              }
            } else if(e.keyCode === keys.ESCAPE){
              if(focusNodeWhenLeave) {
                focusUtil.focus(focusNodeWhenLeave);
              }
            }
          })));
        }
        esriScaleMenuPopup._hasBeenBoundKey = true;
      }

    },

    _getMenuItemInfo: function(esriScaleMenuPopup, currentMenuItem) {
      var menuItemInfo = {
        firstMenuItem: null,
        lastMenuItem: null,
        previousMenuItem: null,
        nextMenuItem: null
      };
      var esriScaleMenuItems = query('li.esriItem', esriScaleMenuPopup);
      esriScaleMenuItems = array.filter(esriScaleMenuItems, lang.hitch(this, function(menuItem) {
        if(html.hasClass(menuItem, 'esriHidden')) {
          return false;
        } else {
          return true;
        }
      }));
      if(currentMenuItem) {
        array.some(esriScaleMenuItems, function(menuItem, index) {
          if(menuItem === currentMenuItem) {
            menuItemInfo.previousMenuItem = esriScaleMenuItems[index - 1];
            menuItemInfo.nextMenuItem = esriScaleMenuItems[index + 1];
            return true;
          } else {
            return false;
          }
        }, this);
      }
      menuItemInfo.firstMenuItem = esriScaleMenuItems[0];
      menuItemInfo.lastMenuItem = esriScaleMenuItems[esriScaleMenuItems.length - 1];
      return menuItemInfo;
    },

    _getEsriScaleMenuPopup: function() {
      var esriScaleMenuPopup = null;
      query('.esriScaleMenuPopup', document.body).some(function(scaleMenu) {
        if(html.getStyle(scaleMenu, 'display') === 'block') {
          esriScaleMenuPopup = scaleMenu;
          return true;
        } else {
          return false;
        }
      });
      return esriScaleMenuPopup;
    }
  });
});
