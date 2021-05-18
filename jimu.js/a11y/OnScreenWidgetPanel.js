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
  'dojo/_base/html',
  'dojo/keys'
  //"dijit/a11yclick"
],
  function (lang, on, html, keys/*, a11yclick*/) {
    var mo = {};

    mo.a11y_init = function () {
      this.own(on(this.domNode, 'keydown', lang.hitch(this, function (evt) {
        if (!html.hasClass(evt.target, 'close-btn') && evt.keyCode === keys.ESCAPE) {
          evt.stopPropagation(); //stop triggering panel's esc-event for dashboard theme
          this.closeNode.focus();
        }
      })));
    };

    mo._onTitleLabelKeyDown = function (evt) {
      if (evt.shiftKey && evt.keyCode === keys.TAB) {
        evt.preventDefault();
      }
    };

    mo._onMaxBtnKeyDown = function (evt) {
      if (evt.keyCode === keys.ENTER || evt.keyCode === keys.SPACE) {
        this._onMaxBtnClicked(evt);
      }
    };

    mo._onFoldableBtnKeyDown = function (evt) {
      if (evt.keyCode === keys.ENTER || evt.keyCode === keys.SPACE) {
        this._onFoldableBtnClicked(evt);
      } else if (evt.keyCode === keys.TAB && evt.shiftKey) {
        evt.preventDefault();
      }
    };

    mo._onCloseBtnKey = function (evt) {
      if (evt.keyCode === keys.ENTER || evt.keyCode === keys.SPACE) {
        this._onCloseBtnClicked(evt);
      } else if (evt.keyCode === keys.TAB && evt.shiftKey) {
        //btns don't have fold and max btns
        if (!window.appInfo.isRunInMobile) {
          evt.preventDefault();
        }
      }
      //prevent user uses tab-key to widget's first focusable node.
      // else if(evt.keyCode === keys.TAB){
      //   evt.preventDefault();
      // }
    };

    return mo;
  });