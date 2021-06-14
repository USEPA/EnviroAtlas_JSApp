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
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/_base/html',
  'dojo/query',
  'dojo/on',
  'dijit/focus',
  'dojo/keys',
  'dojo/Evented',
  '../utils'
],
function(declare, _WidgetBase, lang, array, html, query, on, focusUtil, keys, Evented, utils) {
  return declare([_WidgetBase, Evented], {
    // summary:
    //    the params format:
    //    items: [{
    //      key:
    //      label: <as innerHTML set to UI>
    //    }]
    //    box: String|DomNode.
    //      if not set, use the menu's parent node to calculate the menu's position.
    'baseClass': 'jimu-dropmenu',
    declaredClass: 'jimu.dijit.DropMenu',
    focusNodeWhenLeave: null,


    constructor: function(){
      this.state = 'closed';
    },
    postCreate: function(){
      this.btnNode = html.create('div', {
        'class': 'popup-menu-button'//'jimu-icon-btn'
      }, this.domNode);

      this.own(on(this.btnNode, 'click', lang.hitch(this, this._onBtnClick)));
      if(!this.box){
        this.box = this.domNode.parentNode;
      }
      this.own(on(this.box, 'click', lang.hitch(this, function(){
        if(this.dropMenuNode){
          this.closeDropMenu();
        }
      })));
    },

    _onBtnClick: function(evt){
      evt.stopPropagation();
      if(!this.dropMenuNode){
        this._createDropMenuNode();
      }
      if(this.state === 'closed'){
        this.openDropMenu();
      }else{
        this.closeDropMenu();
      }
    },

    _createDropMenuNode: function(){
      this.dropMenuNode = html.create('div', {
        'class': 'drop-menu',
        style: {
          display: 'none'
        }
      }, this.domNode);

      if(!this.items){
        this.items = [];
      }

      array.forEach(this.items, function(item){
        var node;
        if(item.key && item.key === 'separator'){
          html.create('hr', {
            'class': 'menu-item-identification menu-item-line',
            'itemId': item.key
          }, this.dropMenuNode);
        }else if(item.key) {
          node = html.create('div', {
            'class': 'menu-item-identification menu-item',
            'tabindex': '0',
            'itemId': item.key,
            'role': 'button',
            innerHTML: utils.sanitizeHTML(item.label)
          }, this.dropMenuNode);

          this.own(on(node, 'click', lang.hitch(this, function(evt){
            this.selectItem(item, evt);
          })));

          this.own(on(node, 'keydown', lang.hitch(this, function(evt){
            if(evt.keyCode === keys.ENTER) {
              evt.stopPropagation();
              evt.preventDefault();
              var aElement = query('a', node)[0];
              if(aElement) {
                var event = document.createEvent("MouseEvents");
                event.initEvent('click', true, true);
                aElement.dispatchEvent(event);
              } else {
                this.selectItem(item, evt);
              }
            }
          })));
        }
      }, this);

      if(!this.focusNodeWhenLeave) {
        this.focusNodeWhenLeave = this.domNode.parentNode;
      }
    },

    _getDropMenuPosition: function(){
      var outBox = html.getContentBox(this.box);
      var thisBox = html.getMarginBox(this.domNode);
      var btnBox = html.getMarginBox(this.btnNode);
      var menuBox = html.getMarginBox(this.dropMenuNode);
      var pos = {}, max, l, t, b, r;
      //display at the bottom by default, if the space is not enough,
      //get the maximum space of the left/top/bottom/right
      pos.l = thisBox.l;
      pos.t = thisBox.t + btnBox.h;
      if(pos.t + menuBox.h > outBox.h){
        t = thisBox.t;
        b = outBox.h - thisBox.t - btnBox.h;
        max = Math.max(t, b);
        if(max === t){
          //put on top of the btn
          pos.t =  0 - menuBox.h;
        }
      }
      if(pos.l + menuBox.w > outBox.w){
        l = thisBox.l;
        r = outBox.w - thisBox.l - btnBox.w;
        max = Math.max(l, r);
        if(max === l){
          pos.l = '';
          pos.r = 0;
        }
      }
      pos.left = pos.l;
      pos.top = pos.t;
      pos.right = pos.r;
      return pos;
    },

    getMenuItemNodeByItemKey: function(itemKey) {
      var itemNode;
      var menuItems = query('.menu-item', this.dropMenuNode);
      menuItems.some(function(menuItem) {
        var itemId = html.getAttr(menuItem, 'itemId');
        if(itemId === itemKey) {
          itemNode = menuItem;
          return true;
        } else {
          return false;
        }
      }, this);
      return itemNode;
    },

    selectItem: function(item){
      this.closeDropMenu();
      this.emit('onMenuClick', item);
    },

    openDropMenu: function(){
      this.state = 'opened';
      html.setStyle(this.dropMenuNode, 'display', '');
      html.setStyle(this.dropMenuNode, utils.getPositionStyle(this._getDropMenuPosition()));
      this.emit('onOpenMenu');
    },

    closeDropMenu: function(){
      if(this.state === 'opened') {
        focusUtil.focus(this.focusNodeWhenLeave);
      }
      this.state = 'closed';
      html.setStyle(this.dropMenuNode, 'display', 'none');
      this.emit('onCloseMenu');
    }
  });
});
