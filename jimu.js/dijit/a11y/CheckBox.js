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
  //'jimu/utils',
  //'dojo/keys',
  "dijit/a11yclick"
],
  function (lang, on, html/*jimuUtils, keys,*/, a11yclick) {
    var mo = {};

    mo.a11y_init = function () {
      html.setAttr(this.domNode, 'tabindex', '0');
      html.setAttr(this.domNode, 'role', 'checkbox');

      this.setLabel(this.label);
      this.a11y_changeAriaCheckedAttr();

      //css class
      this.own(on(this.domNode, 'focus', lang.hitch(this, function () {
        html.addClass(this.checkNode, "dijitCheckBoxFocused");
      })));
      this.own(on(this.domNode, 'blur', lang.hitch(this, function () {
        html.removeClass(this.checkNode, "dijitCheckBoxFocused");
      })));

      //use keydown instead of keypress event, for#14747
      this.own(on(this.domNode, a11yclick, lang.hitch(this, function (/*evt*/) {
        if (!this.status) {
          return;
        }
        if (this.checked) {
          this.uncheck();
        } else {
          this.check();
        }
      })));
    };

    mo.a11y_changeAriaCheckedAttr = function () {
      var ariaChecked = this.checked ? 'true' : 'false';
      html.setAttr(this.domNode, 'aria-checked', ariaChecked);
    };

    mo.a11y_setDisabled = function (isDisabled) {
      var str = isDisabled.toString();
      if("false" === str){
        html.removeAttr(this.domNode, 'disabled');//for IE11
      } else{
        html.setAttr(this.domNode, 'disabled', str);
      }

      html.setAttr(this.domNode, 'aria-disabled', str);
    };

    mo.a11y_updateAriaLabel = function (label) {
      if (this.label === '') {
        html.setAttr(this.domNode, 'title', this.title);//read content's string
        html.setAttr(this.domNode, "aria-label", this.title);
      } else {
        //title = ""
        var ariaLabel = this.title ? this.title : label;//use title first
        html.setAttr(this.domNode, "aria-label", ariaLabel);
      }
    };

    return mo;
  });