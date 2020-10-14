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
  "dijit/a11yclick"
],
  function (lang, on, html, a11yclick) {
    var mo = {};
    mo.a11y_updateLabel = function (str) {
      if (str) {
        html.setAttr(this.domNode, 'aria-label', str);
        //this.placehoder
      }
    };
    mo.a11y_initEvents = function () {
      this.own(on(this.domNode, a11yclick, lang.hitch(this, this.onLocationClick)));
    };

    mo.a11y_disable = function () {
      html.setAttr(this.domNode, 'aria-disabled', "true");
      html.setAttr(this.domNode, 'disabled', "disabled");
    };
    mo.a11y_enable = function () {
      html.removeAttr(this.domNode, 'aria-disabled');
      html.removeAttr(this.domNode, 'disabled');
    };

    return mo;
  });