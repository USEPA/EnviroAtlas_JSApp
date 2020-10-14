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
    'dojo/_base/lang',
    'dojo/_base/html',
    'dojo/_base/array',
    'dojo/Evented',
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dijit/_WidgetsInTemplateMixin',
    'dojo/text!./SpeedMenu.html',
    'dojo/on',
    'dojo/query',
    'jimu/utils',
    "./a11y/SpeedMenu"
  ],
  function (declare, lang, html, array,
    Evented, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, template,
    on, query, jimuUtils, a11y) {
    // box of speed-menu

    var clazz = declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Evented], {
      baseClass: 'speed-container',
      templateString: template,
      nls: null,
      menuBox : {
        w: 75,
        h: 120
      },
      _speedList: {
        x025: 0.25,
        x05: 0.5,
        x1: 1,
        x15: 1.5,
        x2: 2
      },

      postCreate: function() {
        this.inherited(arguments);
        //init speed meun
        this._initSpeedMenu();
      },

      startup: function() {
        this.inherited(arguments);
      },

      destroy: function(){
        this.inherited(arguments);
      },

      _initSpeedMenu: function(){
        this.a11y_init();
        this.a11y_initEvents();

        Object.keys(this._speedList).forEach(lang.hitch(this, function (key) {
          var dom = this[key];
          var str = jimuUtils.localizeNumber(this._speedList[key]) + "x";
          dom.innerText = str;
          this.a11y_setAriaLabel(dom.parentElement || dom.parentNode, str);
        }));

        this.own(on(this.domNode, 'click', lang.hitch(this, this._closeSpeedMenu)));
        this._checks = query(".check", this.speedMenu);

        this.setSpeed("1");//init display
      },

      _onSelectSpeedItem: function(evt) {
        array.map(this._checks, lang.hitch(this, function (check) {
          html.addClass(check, 'hide');
        }));

        var rateStr, optionItem;
        if (evt.target) {
          rateStr = html.getAttr(evt.target, 'data-speed');
          if (rateStr) {
            optionItem = evt.target;
          } else {
            optionItem = evt.target.parentNode;//click on checked icon
            rateStr = html.getAttr(optionItem, 'data-speed');
          }
        }
        if (optionItem) {
          var check = query(".check", optionItem)[0];
          if (check) {
            html.removeClass(check, 'hide');
          }
          this.speedLabelNode.innerHTML = jimuUtils.sanitizeHTML(optionItem.innerText);

          this._speed = rateStr;
          this.emit("selected", rateStr);
        }
      },

      getSpeed: function () {
        return this._speed;
      },
      setSpeed: function (speed) {
        var item = null;
        switch (speed) {
          case "0.25": {
            item = this.item025; break;
          } case "0.5": {
            item = this.item05; break;
          } case "1": {
            item = this.item1; break;
          } case "1.5": {
            item = this.item15; break;
          } case "2": {
            item = this.item2; break;
          } default: {
            item = null;
          }
        }
        if (item) {
          on.emit(item, 'click', { cancelable: false, bubbles: true });
        }
      },

      //speed menu
      _setMenuPosition: function() {
        var sPosition = html.position(this.speedLabelNode);
        if (sPosition.y - this.menuBox.h - 2 < 0) {
          html.setStyle(this.speedMenu, {
            top: '27px',
            bottom: 'auto'
          });
        }

        var layoutBox = html.getMarginBox(this.domNode);
        if (window.isRTL) {
          if (sPosition.x - this.menuBox.w < 0) {
            html.setStyle(this.speedMenu, {
              left: 0
            });
          }
        } else {
          if (sPosition.x + this.menuBox.w > layoutBox.w) {
            html.setStyle(this.speedMenu, {
              right: 0
            });
          }
        }
      },

      _onSpeedLabelClick: function(evt) {
        evt.stopPropagation();
        evt.preventDefault();

        if(html.hasClass(this.speedMenu, "hide")){
          this._setMenuPosition();
          this._showSpeedMenu();
        } else {
          this._closeSpeedMenu();
        }
      },

      _showSpeedMenu: function() {
        html.removeClass(this.speedMenu, "hide");
        this.emit("open");

        this.a11y_focusOnSelectedItem();
      },

      _closeSpeedMenu: function() {
        html.addClass(this.speedMenu, "hide");
        this.emit("close");
      }

    });

    clazz.extend(a11y);//for a11y
    return clazz;
  });