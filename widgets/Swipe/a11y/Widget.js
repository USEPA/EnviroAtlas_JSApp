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
  'jimu/utils',
  //'dojo/keys'
  "dijit/a11yclick"
],
  function (lang, on,/* query, aspect,Deferred, array,*/html, jimuUtils/*, keys*/, a11yclick) {
    var mo = {};

    mo.a11y_init = function () {
      html.setAttr(this.domNode, 'aria-label', this.nls._widgetLabel);
      this._LAST_FOCUS_NODE = null;//ref of LastFocusNode
      //first node
      jimuUtils.initFirstFocusNode(this.domNode, this.showDetailIcon);
      //last node
      if (this._SWIPE_MODE === "mult") {
        if (this.multLayersSelector.selector) {
          this._LAST_FOCUS_NODE = this.multLayersSelector.selector.dropDownButton._popupStateNode;
        }
      } else {
        this._LAST_FOCUS_NODE = this.singleLayersContainer;//"single"
      }

      this.a11y_setFocusUnfold();
    };

    mo.a11y_setFocusUnfold = function () {
      jimuUtils.initLastFocusNode(this.domNode, this._LAST_FOCUS_NODE);
    };

    mo.a11y_setFocusFold = function () {
      jimuUtils.initLastFocusNode(this.domNode, this.showDetailIcon);//set FirstFocusNode == LastFocusNode
    };

    mo.a11y_updateFocusNodes = function (options) {
      if (options && options.isFouceToFirstNode) {
        this.showDetailIcon.focus();
      }
    };

    mo.a11y_initEvents = function () {
      this.own(on(this.showDetailIcon, a11yclick, lang.hitch(this, this._onShowDetailIconClick)));
    };

    return mo;
  });