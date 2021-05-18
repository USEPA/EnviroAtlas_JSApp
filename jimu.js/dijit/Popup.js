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
    'dojo/Evented',
    'dojo/_base/array',
    'dojo/_base/html',
    'dojo/_base/fx',
    'dojo/on',
    'dojo/keys',
    'dojo/sniff',
    'dojo/touch',
    'dojo/query',
    'dojo/dnd/move',
    'dijit/_WidgetBase',
    'jimu/utils'
  ],
  function(declare, lang, Evented, array, html, baseFx, on, keys, has, touch,
    query, Move, _WidgetBase, jimuUtils) {
    var count = 0;
    /* global jimuConfig */
    return declare([_WidgetBase, Evented], {
      //summary:
      //  show a popup window
      declaredClass: 'jimu.dijit.Popup',
      baseClass: 'jimu-popup',
      classNames: [], //custom style class list

      //titleLabel: String
      //  the popup window title. if this property is empty, no title display
      titleLabel: '',

      //content: DOM|Dijit|String
      content: null,

      //container: String|DOM
      //  this popup parent dom node
      container: null,

      customZIndex: null, //custom z-index

      //buttons: Object[]
      //  this is the object format
      /*=====
      //label: String
      label: '',
      //onClick: function
      onClick: null, if this function return false,
      the popup will not close, or the popup will close after button click.
      //key: dojo/keys
      key: optional, if key is set, the button will response to the key event
    =====*/
      buttons: [],

      //enabledButtons: DOM[]
      enabledButtons: [],
      //disabledButton: DOM[]
      disabledButtons: [],
      // parseKeyhanles: hashMap
      // pauseKeys: [],

      //onClose: function
      //  callback function when click the close button.
      //If this function return false, the popup will not close
      onClose: null,

      _fixedHeight: false, //it's true only when height is numberical value.
      // the height of Popup depends on the height of content
      autoHeight: false,

      isResize: true,

      // the width of Popup depends on the windows.w.
      // Its range is (0,1]
      horizontalWidthRate: 0,

      maxHeight: 800,
      maxWidth: 1024,

      //optional
      enableMoveable: true,
      hasTitle: true, //if false, no title bar and close btn
      contentHasNoMargin: false, //no margin on content except margin-bottom is 3px.
      hasOverlay: true, //if has overlay
      moveToCenter: true,
      //it works when moveToCenter is false. eg: {left: 1px, top: 1px, width: 100, height: 100}
      //left and top are required, width and height are optional.
      customPosition: null,
      hiddenAfterInit: false,

      useFocusLogic: true,

      constructor: function() {
        this.buttons = [];
        this.enabledButtons = [];
        this.disabledButtons = [];
        this.pauseKeyHandles = [];
        this.container = jimuConfig.layoutId;
      },

      focusLastActiveNode: function(){
        if(this.focusedNodeBeforeOpen && this.useFocusLogic){
          this.focusedNodeBeforeOpen.focus();
        }
      },

      postCreate: function() {
        this.focusedNodeBeforeOpen = document.activeElement;
        this._preProcessing();

        this.inherited(arguments);

        // We should not set tabIndex for Popup, there is an issue for Edge browser if we set it.
        // #4888
        // this.domNode.tabIndex = 1;
        // init dom node
        this._initDomNode();
        this._addStylesByHeightType();

        //position the popup
        this._calcAndSetPosition();

        html.place(this.domNode, this.container);

        //although this function only works when autoHeight is true.
        //but we need it to trigger event 'popupHasInitedSuccessfully', so keep this setTimeout
        // if(this.autoHeight){
        setTimeout(lang.hitch(this, function() { //tolerance height
          this._calcAndSetPosition(true, false);

          //init focusable nodes
          this.initFocusNodes();
        }), 50);
        // }else{
        //   this._calcAndSetPosition(true, false);
        // }
        // this._limitButtonsMaxWidth();

        if(this.isResize){
          this.own(on(window, 'resize', lang.hitch(this, function() {
            this._calcAndSetPosition(true, true);
          })));
        }

        if(this.hasOverlay){
          this.overlayNode = html.create('div', {
            'class': 'jimu-overlay'
          }, this.container);
        }

        if(this.customZIndex || this.customZIndex === 0){//numberical value could be 0.
          html.setStyle(this.domNode, 'zIndex', this.customZIndex + 1);
          if(this.overlayNode){
            html.setStyle(this.overlayNode, 'zIndex', this.customZIndex);
          }
        }else{
          this._increaseZIndex();
        }

        if(this.hiddenAfterInit){
          this.hide();
        }

        baseFx.animateProperty({
          node: this.domNode,
          properties: {
            opacity: 1
          },
          duration: 200
        }).play();

        html.setAttr(this.domNode, 'aria-label', window.jimuNls.common.popup);
        this.own(on(this.domNode, 'keydown', lang.hitch(this, function(evt) {
          if (evt.keyCode === keys.ESCAPE) {
            if(this.closeBtnNode){
              this.closeBtnNode.focus();
            }else{
              this.close();
              this.focusLastActiveNode();
            }
          }
          jimuUtils.preventMapNavigation(evt);
        })));
      },

      initFocusNodes: function(){
        if(this.useFocusLogic){

          //read content when focusing on popup's domNode when content is in string format.
          if(typeof this.content === 'string'){
            var uniqMsgId = 'uniqMsgId_' + jimuUtils.getUUID();
            html.setAttr(this.contentContainerNode, 'id', uniqMsgId);

            html.setAttr(this.domNode, 'tabindex', '0');
            html.setAttr(this.domNode, 'aria-labelledby', uniqMsgId);
          }

          this.firstFocusNode = this._getFirstFocusNode();
          this.lastFocusNode = this._getLastFocusNode();
          if(this.firstFocusNode){
            this.own(on(this.firstFocusNode, 'keydown', lang.hitch(this, function(evt) {
              if(evt.shiftKey && evt.keyCode === keys.TAB) {
                evt.preventDefault();
                this.firstFocusNode.focus();
              }
            })));
            this.firstFocusNode.focus();
          }
          if(this.lastFocusNode){
            this.own(on(this.lastFocusNode, 'keydown', lang.hitch(this, function(evt) {
              if(!evt.shiftKey && evt.keyCode === keys.TAB) {
                evt.preventDefault();
                this.firstFocusNode.focus();
              }
            })));
          }
        }
      },

      _getFirstFocusNode: function(){
        var firstNode = this.closeBtnNode;
        if (typeof this.content === 'string') {
          firstNode = this.domNode;
        }
        if(!firstNode){
          var focusableNodes = [];
          if(this.content.domNode) {
            focusableNodes = jimuUtils.getFocusNodesInDom(this.content.domNode);
          }else if (this.content.nodeType === 1) {
            focusableNodes = jimuUtils.getFocusNodesInDom(this.content);
          }
          if(focusableNodes.length > 0 ){
            firstNode = focusableNodes[0];
          }else if(this.buttons.length){
            firstNode = this._getFirstBtn();
          }
        }
        return firstNode;
      },

      _getLastFocusNode: function(){
        var lastNode = this._getLastBtn();
        if(!lastNode){
          if(this.content && typeof this.content !== 'string') {
            var focusableNodes;
            if(this.content.domNode) {
              focusableNodes = jimuUtils.getFocusNodesInDom(this.content.domNode);
            }else if (this.content.nodeType === 1) {
              focusableNodes = jimuUtils.getFocusNodesInDom(this.content);
            }
            if(focusableNodes.length > 0 ){
              lastNode = focusableNodes[focusableNodes.length - 1];
            }else{
              lastNode = this.closeBtnNode;
            }
          }else{
            lastNode = this.closeBtnNode;
          }
        }
        return lastNode;
      },

      _getFirstBtn: function(){
        var firstBtn = null;
        var btns = query('.jimu-btn', this.buttonContainer);
        for(var i = 0; i <= btns.length - 1; i++) {
          if(html.getStyle(btns[i], 'display') !== 'none'){
            firstBtn = btns[i];
            break;
          }
        }
        return firstBtn;
      },

      _getLastBtn: function(){
        var lastBtn = null;
        var btns = query('.jimu-btn', this.buttonContainer);
        for(var i = btns.length - 1; i >= 0; i--) {
          if(html.getStyle(btns[i], 'display') !== 'none'){
            lastBtn = btns[i];
            break;
          }
        }
        return lastBtn;
      },

      _preProcessing: function() {
        if (typeof this.width !== 'number') {
          this.width = this.maxWidth;
        }

        if (typeof this.height === 'number') {
          this._fixedHeight = true;
          this.autoHeight = false;
        }

        if (this.autoHeight) {
          this.maxHeight = 598;
        }
      },

      _createTitleNode: function() {
        this.titleNode = html.create('div', {
          'class': 'title'
        }, this.domNode);
        this.titleLabeNode = html.create('span', {
          'class': 'title-label jimu-float-leading',
          innerHTML: jimuUtils.sanitizeHTML(this.titleLabel) || '&nbsp'
        }, this.titleNode);
        this.closeBtnNode = html.create('div', {
          'class': 'close-btn jimu-icon jimu-icon-close jimu-float-trailing',
          'tabindex': 0,
          'aria-label': window.jimuNls.common.close,
          "role": "button"
        }, this.titleNode);

        var eventName = null;
        if ('ontouchstart' in document) {
          eventName = touch.press;
        } else {
          eventName = 'click';
        }
        this.own(on(this.closeBtnNode, eventName, lang.hitch(this, this.close)));
        this.own(on(this.closeBtnNode, 'keydown', lang.hitch(this, function(evt){
          if(evt.keyCode === keys.ENTER || evt.keyCode === keys.SPACE){
            this.close();
          }
        })));
      },

      _initDomNode: function() {
        for(var c = 0; c <= this.classNames.length - 1; c++) {
          html.addClass(this.domNode, this.classNames[c]);
        }

        if(this.hasTitle){
          this._createTitleNode();
        }

        this.contentContainerNode = html.create('div', {
          'class': 'content'
        }, this.domNode);

        if (this.content) {
          if (typeof this.content === 'string') {
            this.contentContainerNode.innerHTML = this.content;
          } else if (this.content.domNode) {
            this.content.placeAt(this.contentContainerNode);
            this.content.popup = this;
          } else if (this.content.nodeType === 1) {
            html.place(this.content, this.contentContainerNode);
          }
        }

        this.buttonContainer = html.create('div', {
          'class': 'button-container'
        }, this.domNode);

        if (this.buttons.length === 0) {
          html.setStyle(this.buttonContainer, 'display', 'none');
        }

        // for (var i = this.buttons.length - 1; i > -1; i--) {
        for(var i = 0; i <= this.buttons.length - 1; i++) {
          this._createButton(this.buttons[i]);
          if (this.buttons[i].disable) {
            this.disableButton(i);
          }
        }
      },

      _limitButtonsMaxWidth: function() {
        var btnLength = this.enabledButtons.length;
        if (btnLength === 0) {
          return;
        }
        var btnContainerBox = html.getContentBox(this.buttonContainer);
        var btnMarginBox = html.getMarginExtents(this.enabledButtons[0]);
        var btnPbBox = html.getPadBorderExtents(this.enabledButtons[0]);
        var btnMaxWidth = 0;
        //it seems IE 8 ignores border-box when using min-height/width on the same element
        var _ie8hackWidth = has('ie') === 8 ? btnPbBox.l + btnPbBox.r : 0;
        btnMaxWidth = (btnContainerBox.w -
          (btnMarginBox.l + btnMarginBox.r + _ie8hackWidth) *
          btnLength) / btnLength;

        if (btnMaxWidth > 0) {
          array.forEach(this.enabledButtons, lang.hitch(this, function(btn) {
            html.setStyle(btn, 'maxWidth', btnMaxWidth + 'px');
          }));
          array.forEach(this.disabledButtons, lang.hitch(this, function(btn) {
            html.setStyle(btn, 'maxWidth', btnMaxWidth + 'px');
          }));
        }
      },

      _moveableNode: function(width, tolerance) {
        if (this.moveable) {
          this.moveable.destroy();
          this.moveable = null;
        }
        var containerBox = html.getMarginBox(this.container);
        containerBox.l = containerBox.l - width + tolerance;
        containerBox.w = containerBox.w + 2 * (width - tolerance);

        this.moveable = new Move.boxConstrainedMoveable(this.domNode, {
          box: containerBox,
          handle: this.titleNode || this.contentContainerNode,
          within: true
        });
        this.own(on(this.moveable, 'Moving', lang.hitch(this, this.onMoving)));
        this.own(on(this.moveable, 'MoveStop', lang.hitch(this, this.onMoveStop)));
      },

      _getHeaderBox: function() {
        var headerBox;
        if (query('#header').length === 0) {
          headerBox = {
            t: 0,
            l: 0,
            w: 0,
            h: 0
          };
        } else {
          headerBox = html.getMarginBox('header');
        }

        return headerBox;
      },

      _getFooterBox: function() {
        var footerBox;
        if (query('.footer', this.container).length === 0) {
          footerBox = {
            t: 0,
            l: 0,
            w: 0,
            h: 0
          };
        } else {
          footerBox = html.getMarginBox(query('.footer', this.container)[0]);
        }

        return footerBox;
      },

      _calcAndSetPosition: function(ifSendEvent, ifResize) {
        var selfBox = html.getMarginBox(this.domNode);

        //because this method is called async, so the container may be destoryed before this.
        if(typeof this.container === 'string' && !html.byId(this.container)){
          return;
        }
        var box = html.getContentBox(this.container);
        var headerBox = this._getHeaderBox(),
          footerBox = this._getFooterBox();

        var flexHeight = box.h - headerBox.h - footerBox.h - 40;

        var width = 0, height = 0;
        if(this.customPosition && this.customPosition.height){
          this.height = this.customPosition.height;
          height = (typeof this.height === 'number') ? this.height + 'px' : this.height;
        }else{
          if (this._fixedHeight) {
            //use flexH when height is out of bounds
            this.height = this.height > flexHeight ? flexHeight : this.height;
          } else if (this.autoHeight) {
            var selfBoxH = selfBox.h > flexHeight ? flexHeight : selfBox.h;//out of bounds
            this.height = selfBoxH || flexHeight - 100 * 2; // tolerance
          } else {
            this.height = flexHeight > this.maxHeight ? this.maxHeight : flexHeight;
          }
          height = this.height + 'px';
        }

        if(this.customPosition && this.customPosition.width){
          this.width = this.customPosition.width;
          width = (typeof this.width === 'number') ? this.width + 'px' : this.width;
        }else{
          // this.width = this.width || this.maxWidth;
          // _calculateWidth
          if (typeof this.horizontalWidthRate === 'number' && this.horizontalWidthRate > 0) {
            var popupWidth = (html.getMarginBox(window.document.body).w) * this.horizontalWidthRate;
            popupWidth = popupWidth > this.maxWidth ? popupWidth : this.maxWidth;
            this.width = popupWidth;
          }else{
            this.width = this.width || this.maxWidth;
          }
          width = this.width + 'px';
        }

        var left = 0, top = 0;
        if(this.customPosition){
          left = (typeof this.customPosition.left === 'number') ?
            this.customPosition.left + 'px' : this.customPosition.left;
          top = (typeof this.customPosition.top === 'number') ?
           this.customPosition.top + 'px' : this.customPosition.top;
        }else if(this.moveToCenter){
          top = (flexHeight - this.height) / 2 + headerBox.h + 20;
          top = top < headerBox.h ? headerBox.h : top;
          left = (box.w - this.width) / 2 + 'px';
          top = top + 'px';
        }

        html.setStyle(this.domNode, {
          width: width,
          height: this.autoHeight ? 'auto' : height,
          left: left,
          top: top
        });

        if(this.enableMoveable){
          this._moveableNode(this.width, 100);
        }

        // console.log("calc popup's position");
        if(!this.moveToCenter && ifSendEvent && html.getStyle(this.domNode, 'display') === 'block'){
          this.emit('popupHasInitedSuccessfully', ifResize);
        }
      },

      setDomNodeStyls: function(stylesObj){
        html.setStyle(this.domNode, stylesObj);
      },

      setCustomPosition: function(left, top, width, height) {
        this.width = width || this.width || this.maxWidth;
        this.height = height || this.height || this.maxHeight;

        left = (typeof left === 'number') ? left + 'px' : left;
        top = (typeof top === 'number') ? top + 'px' : top;
        width = (typeof this.width === 'number') ? this.width + 'px' : this.width;
        height = (typeof this.height === 'number') ? this.height + 'px' : this.height;

        html.setStyle(this.domNode, {
          left: left,
          top: top,
          width: width,
          height: this.autoHeight ? 'auto' : height
        });
      },

      _addStylesByHeightType: function() {
        if (!this.autoHeight) { // position: absolute
          html.addClass(this.contentContainerNode, 'content-absolute');
          if(!this.hasTitle){
            html.addClass(this.contentContainerNode, 'no-popup-title-content-absolute');
          }
          html.addClass(this.buttonContainer, 'button-container-absolute');

          if (this.buttons.length === 0) {
            html.setStyle(this.contentContainerNode, {
              bottom: '15px'
            });
          }
        } else { // position: static
          html.addClass(this.contentContainerNode, 'content-static');

          if (this.buttons.length === 0) {
            html.setStyle(this.contentContainerNode, {
              marginBottom: '15px'
            });
          }
        }

        if(this.contentHasNoMargin){
          html.addClass(this.contentContainerNode, 'content-fill-Popup');
        }
      },

      _increaseZIndex: function() {
        var baseIndex = 200;
        html.setStyle(this.domNode, 'zIndex', count + baseIndex + 1);
        if(this.overlayNode){
          html.setStyle(this.overlayNode, 'zIndex', count + baseIndex);
        }
        count++;
      },

      setTitleLabel: function(titleLabel) {
        this.titleNode.innerHTML = jimuUtils.stripHTML(titleLabel);
      },

      onMoving: function(mover) {
        html.setStyle(mover.node, 'opacity', 0.9);
      },

      onMoveStop: function(mover) {
        html.setStyle(mover.node, 'opacity', 1);
      },

      show: function(){
        if(this.overlayNode){
          html.setStyle(this.overlayNode, 'display', 'block');
        }
        html.setStyle(this.domNode, 'display', 'block');
      },

      hide: function(){
        if(this.overlayNode){
          html.setStyle(this.overlayNode, 'display', 'none');
        }
        html.setStyle(this.domNode, 'display', 'none');
      },

      close: function() {
        if (this.onClose && this.onClose() === false) {
          return;
        }

        var parent = this.domNode.parentNode;
        var cloneNode = lang.clone(this.domNode);
        html.setStyle(this.domNode, 'display', 'none');
        if(this.overlayNode){
          html.destroy(this.overlayNode);
        }
        this.destroy();
        if(this.moveable) {
          this.moveable.destroy();
        }
        html.place(cloneNode, parent);

        baseFx.animateProperty({
          node: cloneNode,
          properties: {
            opacity: 0
          },
          duration: 200,
          onEnd: function() {
            html.destroy(cloneNode);
          }
        }).play();

        this.focusLastActiveNode();

        window.currentMsgPopup = null;
      },

      addButton: function(btn) {
        this._createButton(btn);
      },

      _createButton: function(button) {
        var appendedClasses = " ";
        if(button.classNames && button.classNames.length > 0){
          if(typeof button.classNames.join === 'function'){
            appendedClasses += button.classNames.join(" ");
          }
        }
        var node = html.create('div', {
          'class': 'jimu-btn jimu-popup-action-btn jimu-float-trailing jimu-trailing-margin1 ' +
            appendedClasses,
          'innerHTML': button.label,
          'tabindex': 0,
          'role': 'button',
          'title': button.title || button.label
        }, this.buttonContainer);
        this.enabledButtons.push(node);

        var disableNode = html.create('div', {
          'class': 'jimu-btn jimu-state-disabled jimu-float-trailing jimu-trailing-margin1 ' +
            appendedClasses,
          'title': button.title || button.label,
          'innerHTML': button.label,
          'tabindex': 0,
          'role': 'button',
          'aria-disabled': 'true',
          'style': {
            display: 'none'
          }
        }, this.buttonContainer);
        this.disabledButtons.push(disableNode);

        this.own(on(node, 'click', lang.hitch(this, function(evt) {
          //we don't close popup because that maybe the
          //listener function is async
          if (button.onClick) {
            button.onClick(evt);
          } else {
            this.close();
          }
        })));

        this.own(on(node, 'keydown', lang.hitch(this, function(evt) {
          if(evt.keyCode === keys.ENTER || evt.keyCode === keys.SPACE){
            if (button.onClick) {
              button.onClick(evt);
            } else {
              this.close();
            }
          }
        })));
      },

      setButtonProps: function(idx, props) {
        if (typeof idx === 'number' && isFinite(idx)) {
          idx = idx;
        } else {
          props = idx;
          idx = 0;
        }
        if (!props || this.enabledButtons.length === 0) {
          return;
        }

        for (var p in props) {
          if (p === 'title') {
            html.setAttr(this.enabledButtons[idx], 'title', props[p]);
            html.setAttr(this.disabledButtons[idx], 'title', props[p]);
          } else if (p === 'label') {
            html.setProp(this.enabledButtons[idx], 'innerHTML', props[p]);
            html.setProp(this.disabledButtons[idx], 'innerHTML', props[p]);
          }
        }
      },

      enableButton: function(idx) {
        // var btn = null;
        if (typeof idx === 'number' && isFinite(idx) && idx < this.enabledButtons.length) {
          html.setStyle(this.enabledButtons[idx], 'display', 'inline-block');
          html.setStyle(this.disabledButtons[idx], 'display', 'none');

          // btn = this.buttons[idx];
          // if (btn && btn.key && this.pauseKeys.indexOf(btn.key) > -1) {
          //   this.pauseKeys.splice(this.pauseKeys.indexOf(btn.key), 1);
          // }
        } else {
          array.forEach(this.enabledButtons[idx], lang.hitch(this, function(itm) {
            html.setStyle(itm, 'display', 'inline-block');
          }));
          array.forEach(this.disabledButtons[idx], lang.hitch(this, function(itm) {
            html.setStyle(itm, 'display', 'none');
          }));
          // this.pauseKeys.splice(0, this.pauseKeys.length);
        }
      },

      disableButton: function(idx) {
        // var btn = null;
        if (typeof idx === 'number' && isFinite(idx) && idx < this.disabledButtons.length) {
          html.setStyle(this.disabledButtons[idx], 'display', 'inline-block');
          html.setStyle(this.enabledButtons[idx], 'display', 'none');

          // btn = this.buttons[idx];
          // if (btn && btn.key && this.pauseKeys.indexOf(btn.key) === -1) {
          //   this.pauseKeys.push(btn.key);
          // }
        } else {
          array.forEach(this.disabledButtons, lang.hitch(this, function(itm) {
            html.setStyle(itm, 'display', 'inline-block');
          }));
          array.forEach(this.enabledButtons, lang.hitch(this, function(itm) {
            html.setStyle(itm, 'display', 'none');
          }));
          // array.forEach(this.buttons, lang.hitch(this, function(btn) {
          //   if (btn && btn.key && this.pauseKeys.indexOf(btn.key) === -1) {
          //     this.pauseKeys.push(btn.key);
          //   }
          // }));
        }
      },

      showButton: function(idx) {
        // var btn = null;
        // if (typeof idx === 'number' && isFinite(idx) && idx < this.enabledButtons.length) {
        //   html.setStyle(this.enabledButtons[idx], 'display', 'inline-block');
        //   html.setStyle(this.disabledButtons[idx], 'display', 'none');

        //   // btn = this.buttons[idx];
        //   // if (btn && btn.key && this.pauseKeys.indexOf(btn.key) > -1) {
        //   //   this.pauseKeys.splice(this.pauseKeys.indexOf(btn.key), 1);
        //   // }
        // } else {
        //   array.forEach(this.enabledButtons[idx], lang.hitch(this, function(itm) {
        //     html.setStyle(itm, 'display', 'inline-block');
        //   }));
        //   array.forEach(this.disabledButtons[idx], lang.hitch(this, function(itm) {
        //     html.setStyle(itm, 'display', 'none');
        //   }));
        //   // this.pauseKeys.splice(0, this.pauseKeys.length);
        // }
        this.enableButton(idx);
      },

      hideButton: function(idx) {
        if (typeof idx === 'number' && isFinite(idx) && idx < this.disabledButtons.length) {
          html.setStyle(this.disabledButtons[idx], 'display', 'none');
          html.setStyle(this.enabledButtons[idx], 'display', 'none');
        } else {
          array.forEach(this.disabledButtons, lang.hitch(this, function(itm) {
            html.setStyle(itm, 'display', 'none');
          }));
          array.forEach(this.enabledButtons, lang.hitch(this, function(itm) {
            html.setStyle(itm, 'display', 'none');
          }));
        }
      },

      //custom resize popup's width and height
      resize: function(size){
        // console.log('function - resize');
        if(size){
          this.width = size.w;
          this.height = size.h;
        }

        this._calcAndSetPosition();

        if (this.content && this.content.domNode && this.content.resize){
          this.content.resize();
        }
      }
    });
  });