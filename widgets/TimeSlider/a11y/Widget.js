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
  'dojo/_base/lang',
  'dojo/on',
  //"dojo/query",
  //"dojo/aspect",
  //'dojo/Deferred',
  //'dojo/_base/array',
  'dojo/_base/html',
  '../utils',
  'jimu/utils',
  'dojo/keys'
  //"dijit/a11yclick"
],
  function (lang, on, /*query, aspect,Deferred, array,*/html, utils, jimuUtils, keys/*, a11yclick*/) {
    var mo = {};

    mo.a11y_init = function () {
      html.setAttr(this.domNode, 'aria-label', this.nls._widgetLabel);

      html.setAttr(this.closeBtn, "role", "button");
      html.setAttr(this.closeBtn, "aria-label", window.jimuNls.common.close);

      html.setAttr(this.playBtn, "tabindex", 0);
      html.setAttr(this.previousBtn, "tabindex", 0);
      html.setAttr(this.nextBtn, "tabindex", 0);
      html.setAttr(this.playBtn, "role", "button");
      html.setAttr(this.playBtn, "aria-label", this.nls.pause);
      html.setAttr(this.previousBtn, "role", "button");
      html.setAttr(this.previousBtn, "aria-label", this.nls.previous);
      html.setAttr(this.nextBtn, "role", "button");
      html.setAttr(this.nextBtn, "aria-label", this.nls.next);

      this.a11y_firstNode = this.previousBtn;
      this.a11y_lastNode = this.speedMenu.speedLabelNode;

      jimuUtils.initFirstFocusNode(this.domNode, this.a11y_firstNode);
      jimuUtils.initLastFocusNode(this.domNode, this.a11y_lastNode);
    };

    mo.a11y_open = function () {
      if (!jimuUtils.isInNavMode()) {
        return;
      }
      if (!utils.isRunInMobile()) {
        this._clearMiniModeTimer();
        this.a11y_shownBy508 = true;//keep showing

        setTimeout(lang.hitch(this, function () {
          if("none" !== html.getStyle(this.noTimeContentNode, 'display')){
            this.closeBtn.focus();//no time data
          } else {
            this.playBtn.focus();// play/pause
          }
        }), 50);
      }
    };

    mo.a11y_initEvents = function () {
      //domNode
      this.own(on(this.domNode, 'focus', lang.hitch(this, function (evt) {
        var target = evt.target;
        if (!html.hasClass(target, this.baseClass)) {
          return;
        }
        if (!utils.isRunInMobile()) {
          this._clearMiniModeTimer();//show all
        }
      })));
      this.own(on(this.domNode, 'blur', lang.hitch(this, function (evt) {
        var target = evt.target;
        if (!html.hasClass(target, this.baseClass)) {
          return;
        }
        if (!utils.isRunInMobile()) {
          this._setMiniModeTimer();
          var isInMiniMode = html.hasClass(this.domNode, 'mini-mode');
          if (isInMiniMode) {
            html.removeClass(this.domNode, 'mini-mode');
            this._adaptResponsive();
          }
        }
      })));
      this.own(on(this.domNode, 'keydown', lang.hitch(this, function (evt) {
        var target = evt.target;
        if (html.hasClass(target, this.baseClass) &&
          (evt.keyCode === keys.ENTER || evt.keyCode === keys.SPACE || evt.keyCode === keys.TAB)) {

          if (this.a11y_firstNode && this.a11y_firstNode.focus) {
            this.a11y_firstNode.focus();
          }
        }

        this.a11y_shownBy508 = true;
      })));

      //closeBtn
      this.own(on(this.closeBtn, 'keydown', lang.hitch(this, function (evt) {
        if (evt.keyCode === keys.TAB) {
          if (this.a11y_firstNode && this.a11y_firstNode.focus) {
            evt.stopPropagation();
            evt.preventDefault();
            //console.log("close btn tab");
            this.previousBtn.focus();
          }
        }
        if (evt.keyCode === keys.ENTER || evt.keyCode === keys.SPACE || evt.keyCode === keys.ESCAPE) {
          evt.stopPropagation();
          on.emit(this.closeBtn, 'click', { cancelable: false, bubbles: true });
        }
      })));
      this.own(on(this.closeBtn, 'focus', lang.hitch(this, function (evt) {
        evt.stopPropagation();
      })));
      this.own(on(this.timeContentNode, 'keydown', lang.hitch(this, function (evt) {
        if (evt.keyCode === keys.ESCAPE) {
          evt.stopPropagation();
          this.closeBtn.focus();
        }
      })));

      //btns
      this.own(on(this.playBtn, 'keydown', lang.hitch(this, function (evt) {
        if (evt.keyCode === keys.ENTER || evt.keyCode === keys.SPACE) {
          evt.stopPropagation();
          on.emit(this.playBtn, 'click', { cancelable: false, bubbles: true });
        }
      })));
      this.own(on(this.previousBtn, 'keydown', lang.hitch(this, function (evt) {
        if (evt.keyCode === keys.ENTER || evt.keyCode === keys.SPACE) {
          evt.stopPropagation();
          on.emit(this.previousBtn, 'click', { cancelable: false, bubbles: true });
        }
      })));
      this.own(on(this.nextBtn, 'keydown', lang.hitch(this, function (evt) {
        if (evt.keyCode === keys.ENTER || evt.keyCode === keys.SPACE) {
          evt.stopPropagation();
          on.emit(this.nextBtn, 'click', { cancelable: false, bubbles: true });
        }
      })));
    };

    return mo;
  });