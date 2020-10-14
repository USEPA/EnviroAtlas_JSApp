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

define(['dojo/Evented',
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  "dijit/_WidgetsInTemplateMixin",
  'dojo/on',
  'dojo/_base/html',
  "dojo/text!./Placement.html"
],
  function (Evented, declare, lang,
    _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,
    on, html, template) {
    var clazz = declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Evented], {
      templateString: template,
      state: {
        direction: ""
        //invert: false
      },

      postCreate: function () {
        this.inherited(arguments);
      },

      startup: function () {
        this.own(on(this.showLeftSide, 'click', lang.hitch(this, function () {
          this._setDisplay(this.showLeftSide);
        })));
        this.own(on(this.showRigthSide, 'click', lang.hitch(this, function () {
          this._setDisplay(this.showRigthSide);
        })));

        this.own(on(this.showUpSide, 'click', lang.hitch(this, function () {
          this._setDisplay(this.showUpSide);
        })));
        this.own(on(this.showDownSide, 'click', lang.hitch(this, function () {
          this._setDisplay(this.showDownSide);
        })));

        this.setVH(this.config.style);
        this.initInvert(this.config.invertPlacement);

        this.inherited(arguments);
      },

      setConfig: function (/*config*/) {
        //this.config = config;
      },
      getConfig: function () {
        var isInvert = false;
        if (html.hasClass(this.showLeftSide, "selected") || html.hasClass(this.showUpSide, "selected")) {
          isInvert = false;
        } else if (html.hasClass(this.showRigthSide, "selected") || html.hasClass(this.showDownSide, "selected")) {
          isInvert = true;
        }

        return isInvert;
      },

      //UI
      setVH: function (style) {
        if ("scope" === style) {
          html.addClass(this.domNode, "hide");
          return;
        }
        html.removeClass(this.domNode, "hide");

        html.removeClass(this.vertical, "hide");
        html.removeClass(this.horizontal, "hide");

        if ("horizontal" === style) {
          html.addClass(this.vertical, "hide");
          this.state.direction = "horizontal";
        } else {
          //"vertical" == style || "" == style
          html.addClass(this.horizontal, "hide");
          this.state.direction = "vertical";
        }

        var isInvert = this.getConfig();
        this.initInvert(isInvert);
      },
      initInvert: function (invertPlacement) {
        html.removeClass(this.showLeftSide, "selected");
        html.removeClass(this.showRigthSide, "selected");
        html.removeClass(this.showUpSide, "selected");
        html.removeClass(this.showDownSide, "selected");
        if (invertPlacement) {
          if (this.state.direction === "vertical") {
            html.addClass(this.showRigthSide, "selected");
          } else {
            html.addClass(this.showDownSide, "selected");
          }
        } else {
          if (this.state.direction === "vertical") {
            html.addClass(this.showLeftSide, "selected");
          } else {
            html.addClass(this.showUpSide, "selected");
          }
        }
      },
      _setDisplay: function (node) {
        html.removeClass(this.showLeftSide, "selected");
        html.removeClass(this.showRigthSide, "selected");
        html.removeClass(this.showUpSide, "selected");
        html.removeClass(this.showDownSide, "selected");

        if (node) {
          html.addClass(node, "selected");
        }
      }
    });
    return clazz;
  });