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
  'dojo/_base/html',
  'dojo/_base/lang',
  'dojo/_base/array',
  'jimu/accessibleUtils',
  'dojo/on',
  'dojo/keys',
  "dijit/a11yclick",
  'dojo/dom-geometry',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'jimu/FeatureActionManager',
  './FeatureActionPopupMenuItem'
], function(declare, html, lang, array, a11yUtils, on, keys, a11yclick, domGeom, _WidgetBase, _TemplatedMixin,
  FeatureActionManager, PopupMenuItem) {
  var instance = null;
  var clazz = declare([_WidgetBase, _TemplatedMixin], {
    baseClass: 'popup-menu',
    templateString: '<div>' +
        '<div data-dojo-attach-point="menuNode" class="menu-content">' +
          '<div class="menu-title" data-dojo-attach-point="titleNode">' +
           '<div role="title" class="label jimu-float-leading" data-dojo-attach-point="labelNode" tabindex="0"></div>' +
           '<div class="feature-action icon-close close-btn jimu-float-trailing"' +
           ' data-dojo-attach-point="closeBtn" tabindex="0"></div>' +
          '</div>' +
          '<div class="menu-items" data-dojo-attach-point="menuContent" tabindex="0"></div>' +
        '</div>' +
      '</div>',

    postCreate: function() {
      this._setFocusedNodeBeforeOpen();
      this.inherited(arguments);

      this.hide();
      this.menuItems = [];
      this.own(on(this.domNode, 'click', lang.hitch(this, function(event) {
        var target = event.target || event.srcElement, isInternal;
        isInternal = (target === this.menuNode) || html.isDescendant(target, this.menuNode);
        if(!isInternal) {
          this.hide();
        }
      })));

      //add events for a11y
      this._a11y_addEvents();

    },

    _setFocusedNodeBeforeOpen: function(){
      this.focusedNodeBeforeOpen = document.activeElement;
    },

    _a11y_addEvents: function(){
      this.own(on(this.labelNode, 'keydown', lang.hitch(this, function(evt){
        if(evt.shiftKey && evt.keyCode === keys.TAB){
          evt.preventDefault();
          this.hide();
        }
      })));

      this.own(on(this.closeBtn, a11yclick, lang.hitch(this, this.hide)));

      this.own(on(this.menuContent, 'focus', lang.hitch(this, function(){
        this.currentMenuItem = this.menuItems[0].domNode;//default
        array.forEach(this.menuItems, function(menuItem) {//use selected item instead
          if (html.hasClass(menuItem.domNode, 'selected')) {
            this.currentMenuItem = menuItem.domNode;
          }
        });
        this.currentMenuItem.focus();
      })));
      this.own(on(this.menuContent, 'keydown', lang.hitch(this, function(evt){
        if(evt.keyCode === keys.ESCAPE){
          evt.stopPropagation();
          this.hide();
        }
        //when focusing on one item
        if(html.hasClass(evt.target, 'popup-menu-item')){
          //tab/esc to close it
          if(evt.keyCode === keys.TAB && ((evt.shiftKey && !this.hasTitle) || !evt.shiftKey)){
            evt.preventDefault();
            this.hide();
          } else{
            var nextItem;
            if(evt.keyCode === keys.DOWN_ARROW){
              nextItem = this.currentMenuItem.nextSibling ?
               this.currentMenuItem.nextSibling : this.currentMenuItem;
            }else if(evt.keyCode === keys.UP_ARROW){
              nextItem = this.currentMenuItem.previousSibling ?
               this.currentMenuItem.previousSibling : this.currentMenuItem;
            }else if(evt.keyCode === keys.HOME){
              nextItem = this.menuItems[0].domNode;
            }else if(evt.keyCode === keys.END){
              nextItem = this.menuItems[this.menuItems.length - 1].domNode;
            }
            if(nextItem){
              this.currentMenuItem = nextItem;
              nextItem.focus();
            }
          }
        }
      })));
    },

    /**
     * Set array of actions.
     * Each action should follow this pattern:
     * {
     *    icon: string;
     *    label: string;
     *    onExecute: () => Promise;
     *    data: Object
     * }
     */
    setActions: function(actions) {
      this.clearActions();

      array.forEach(actions, lang.hitch(this, this._addMenuItem));
    },

    appendAction: function(action) {
      this._addMenuItem(action);
    },

    clearActions: function() {
      this.menuItems = [];
      html.empty(this.menuContent);
    },

    _addMenuItem: function(action) {
      var menuItem = new PopupMenuItem({
        action: action
      });
      html.place(menuItem.domNode, this.menuContent);
      menuItem.startup();

      this.menuItems.push(menuItem);

      // this.own(on(menuItem, 'click', lang.hitch(this, this.hide)));
      this.own(on(menuItem, 'click', lang.hitch(this, function(data){
        if(!data){
          this.hide();
        }else{//enter event
          //keep menu popup opend if it has action popup.
          var popupActions = ['ShowStatistics', 'SaveToMyContent', 'ChangeSymbol'];
          var hasPopup = popupActions.indexOf(menuItem.action.name) >= 0;
          if(!(a11yUtils.isInNavMode() && hasPopup)){
            this.hide();
          }
        }
      })));
    },

    markAsSelected: function(action) {
      array.forEach(this.menuItems, function(menuItem) {
        if (menuItem.action.label === action.label) {
          menuItem.setSelected(true);
        } else {
          menuItem.setSelected(false);
        }
      });
    },

    prepareActions: function(featureset, allowExport) {
      var fm = FeatureActionManager.getInstance();

      return fm.getSupportedActions(featureset).then(lang.hitch(this, function(actions) {
        if (allowExport === false) {
          actions = array.filter(actions, function(action) {
            return action.name.indexOf('Export') !== 0 && action.name !== 'SaveToMyContent';
          });
        }

        array.forEach(actions, function(action){
          action.data = featureset;
        }, this);

        this.setActions(actions);
      }));
    },

    hide: function() {
      html.setStyle(this.domNode, 'display', 'none');
      if(this.focusedNodeBeforeOpen){
        this.focusedNodeBeforeOpen.focus();
      }
    },

    show: function(position, title) {
      if(this.menuItems.length === 0) {
        html.setStyle(this.domNode, 'display', 'none');
        return;
      }

      if(typeof title === 'string' && title !== '') {
        this.labelNode.innerHTML = title;
        html.setStyle(this.titleNode, 'display', '');
      } else {
        this.labelNode.innerHTML = '';
        html.setStyle(this.titleNode, 'display', 'none');
      }

      var anchorX, anchorY = position.y + position.h, left, top, size, offset = 5;
      if(window.isRTL) {
        anchorX = position.x;
      }else {
        anchorX = position.x + position.w;
      }

      html.setStyle(this.domNode, 'display', '');

      html.setStyle(this.menuNode, {
        left: '-1000px',
        top: '0px',
        display: 'block'
      });

      size = domGeom.getMarginSize(this.menuNode);

      if(window.isRTL) {
        if(anchorX + size.w > window.innerWidth){ // beyond right side of the browser
          left = window.innerWidth - size.w;
        }else if(anchorX < 0){// beyond left side of the browser
          left = 0;
        }else{
          left = anchorX;
        }
      } else {
        if(anchorX - size.w < 0){ // beyond left side of the browser
          left = 0;
        }else if(anchorX > window.innerWidth){ // beyond right side of the browser
          left = window.innerWidth - size.w;
        }else{
          left = anchorX - size.w;
        }
      }

      if(size.h > window.innerHeight) {
        top = 0;
      }else if(anchorY + size.h > window.innerHeight){
        top = window.innerHeight - size.h;
      }else if(anchorY + size.h + offset < window.innerHeight){
        top = anchorY + offset;
      }else {
        top = anchorY;
      }

      html.setStyle(this.menuNode, {
        left: left + 'px',
        top: top + 'px'
      });

      if(typeof title === 'string' && title !== '') {
        this.labelNode.focus();
        this.hasTitle = true;
      } else {
        this.menuContent.focus();
        this.hasTitle = false;
      }
    }
  });

  clazz.getInstance = function() {
    if (instance === null) {
      instance = new clazz();
      html.place(instance.domNode, document.body);
      instance.startup();
    }
    instance.setActions([]);
    return instance;
  };

  return clazz;
});