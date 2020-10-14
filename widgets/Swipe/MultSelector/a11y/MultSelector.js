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
  "dojo/query",
  //"dojo/aspect",
  //'dojo/Deferred',
  //'dojo/_base/array',
  'dojo/_base/html',
  //'jimu/utils',
  //'dojo/keys'
  "dijit/a11yclick"
],
  function (lang, on, query,/* aspect,Deferred, array,*/html/*, jimuUtils, keys*/, a11yclick) {
    var mo = {};

    mo.a11y_init = function () {
      //html.setAttr(this.domNode, 'aria-label', );
    };

    mo.a11y_initEvents = function () {
      this.own(on(this.selector, a11yclick, lang.hitch(this, function (/*evt*/) {
        //if (evt.target.nodeName === "INPUT") {
        this.selector.dropDownButton.toggleDropDown();
        //}
        var dropDown = this.selector.dropDown;
        var layerList = query(".dijitReset.dijitMenuItemLabel", dropDown.domNode);
        for (var i = 0, len = layerList.length; i < len; i++) {
          var layer = layerList[i];
          html.attr(layer, "title", layer.innerText);
        }
      })));
    };

    mo.a11y_initSelectorLabel = function () {
      var rawLabel = query(".dijitButtonText", this.selector.dropDownButton.buttonNode)[0];
      html.addClass(rawLabel, "hide");//hide raw tips, such as: 1 itme selected
      html.addClass(this.selector.dropDownButton.buttonNode, "hide");

      html.setAttr(this.selector.dropDownButton.titleNode, "tabindex", -1);
    };

    return mo;
  });