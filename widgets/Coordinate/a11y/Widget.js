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
  //'dojo/Deferred',
  'dojo/_base/html',
  'dojo/keys',
  'jimu/utils',
  "dijit/a11yclick"
],
  function (lang, on,/*Deferred, */html, keys, jimuUtils, a11yclick) {
    var mo = {};

    mo.a11y_init = function (options) {
      jimuUtils.initFirstFocusNode(this.domNode, this.locateButton);

      if (options && options.isHidePopmenu) {
        jimuUtils.initLastFocusNode(this.domNode, this.locateButton);
      } else {
        jimuUtils.initLastFocusNode(this.domNode, this.foldableNode);
      }
    };

    mo.a11y_initEvents = function () {
      this.own(on(this.locateButton, a11yclick, lang.hitch(this, this.onLocateButtonClick)));

      this.own(on(this.foldContainer, a11yclick, lang.hitch(this, this.onFoldContainerClick)));
      this.own(on(this.foldContainer, "keydown", lang.hitch(this, function (evt) {
        if (evt.keyCode === keys.UP_ARROW || evt.keyCode === keys.DOWN_ARROW) {
          this.onFoldContainerClick();
        }
      })));
    };

    mo.a11y_setCoordinateInfo = function (str) {
      var labelDom = this.coordinateInfo;
      var widgetDom = this.domNode;
      if (labelDom) {
        labelDom.innerHTML = jimuUtils.sanitizeHTML(str);
      }

      if (widgetDom) {
        html.setAttr(widgetDom, 'aria-label', str);
      }
    };

    mo._isKeyEvent = function (evt) {
      if (evt && evt._origType) {//: "keyup"
        return true;
      }

      return false;
    };

    /* popUp */
    mo.a11y_initPopMenuEvents = function () {
      this.own(on(this.popMenu.domNode, "keydown", lang.hitch(this, function (evt) {
        if (evt.keyCode === keys.ESCAPE) {
          //esc to close popup
          evt.stopPropagation();
          evt.preventDefault();

          this.onFoldContainerClick();

          setTimeout(lang.hitch(this, function () {
            this.foldableNode.focus();
          }), 0);
        }
      })));
    };

    mo.a11y_bindMenuItemEvent = function (menuItem) {
      this.own(on(menuItem, "click", lang.hitch(this, function (evt) {
        if (mo._isKeyEvent(evt)) {
          setTimeout(lang.hitch(this, function () {
            this.a11y_focusToPopMenuBtn();//just for keyboard events
          }), 0);
        }
      })));
    };

    mo.a11y_focusMenuItem = function () {
      this.selectedItem.domNode.focus();
    };

    mo.a11y_focusToPopMenuBtn = function () {
      this.foldableNode.focus();
    };

    return mo;
  });