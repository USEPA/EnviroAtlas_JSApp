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
  'dojo/_base/array',
  'dojo/_base/html',
  //'../utils',
  //'jimu/utils',
  'dojo/keys',
  "dijit/a11yclick"
],
  function (lang, on, query,/* aspect,Deferred,*/ array, html, /*utils, jimuUtils,*/ keys, a11yclick) {
    var mo = {};

    mo.a11y_init = function () {
      html.setAttr(this.speedLabelNode, "role", "button");
      html.setAttr(this.speedLabelNode, "aria-label", this.nls.speed);
    };

    mo.a11y_setAriaLabel = function (dom, str){
      html.setAttr(dom, "aria-label", str);
    };

    mo.a11y_focusOnSelectedItem = function () {
      var dom = query(".check:not(.hide)", this.speedMenu)[0];
      var item;
      if(dom && (dom.parentElement || dom.parentNode)){
        item = dom.parentElement || dom.parentNode;
      }
      if (item && item.focus) {
        item.focus();
      }
    };

    mo.a11y_initEvents = function () {
      var speedList = query('[tabindex $=\"0\"]', this.speedMenu);
      if (speedList) {
        this.a11y_firstNode = speedList[0];
        this.a11y_lastNode = speedList[speedList.length - 1];
      }

      //btn
      this.own(on(this.speedLabelNode, a11yclick, lang.hitch(this, function (evt) {
        this._onSpeedLabelClick(evt);
      })));

      //esc
      this.own(on(this.speedMenu, 'keydown', lang.hitch(this, function (evt) {
        if (evt.keyCode === keys.ESCAPE) {
          evt.stopPropagation();
          evt.preventDefault();
          this._closeSpeedMenu();
          this.speedLabelNode.focus();
        }
      })));

      //list
      if (speedList && speedList.length) {
        this.a11y_firstNode = speedList[0];//1st one
        this.a11y_lastNode = speedList[length - 1];//last one

        array.forEach(speedList, lang.hitch(this, function (speedItem, i) {
          var previousOne;
          if (i === 0) {
            previousOne = speedList[speedList.length - 1];
          } else {
            previousOne = speedList[i - 1];
          }
          this.own(on(speedItem, 'keydown', lang.hitch(this, function (evt) {
            evt.stopPropagation();
            evt.preventDefault();
            if (evt.keyCode === keys.UP_ARROW) {
              if (previousOne && previousOne.focus) {
                //console.log("111 previousOne" + nextOne.dataset.speed);
                previousOne.focus();//up key
              }
            }
          })));

          var nextOne;
          if (i === speedList.length - 1) {
            nextOne = speedList[0];
          } else {
            nextOne = speedList[i + 1];
          }
          this.own(on(speedItem, 'keydown', lang.hitch(this, function (evt) {
            evt.stopPropagation();
            evt.preventDefault();
            if (evt.keyCode === keys.DOWN_ARROW || evt.keyCode === keys.TAB) {
              if (nextOne && nextOne.focus) {
                //console.log("111 nextOne" + nextOne.dataset.speed);
                nextOne.focus();//down key
              }
            }
          })));

          this.own(on(speedItem, 'keydown', lang.hitch(this, function (evt) {
            evt.stopPropagation();
            evt.preventDefault();
            if (evt.keyCode === keys.ENTER || evt.keyCode === keys.SPACE) {
              //console.log("111 enter" + speedItem.dataset.speed)
              on.emit(speedItem, 'click', { cancelable: false, bubbles: true });//enter
              //setTimeout(function () {
              this.speedLabelNode.focus();
              //}, 0);
            }
            //esc
            if (evt.keyCode === keys.ESCAPE) {
              this._closeSpeedMenu();
              this.speedLabelNode.focus();
            }
          })));
        }));
      }
    };

    return mo;
  });