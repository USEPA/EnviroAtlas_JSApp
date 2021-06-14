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
  'dijit/_WidgetBase',
  'dojo/_base/lang',
  'dojo/_base/html',
  'dojo/on',
  'dojo/mouse',
  'dojo/_base/fx',
  'dojo/topic',
  'dojo/Evented'
], function(declare, _WidgetBase, lang, html, on, Mouse, baseFx, topic, Evented) {
  var ANIMATION_DURATION = 1000,
    AUTO_CLOSE_INTERVAL = 10000,
    STATE_HIDE = 0,
    STATE_SHOW = 1;

  return declare([_WidgetBase, Evented], {
    'baseClass': 'jimu-appstate-popup',
    declaredClass: 'jimu.dijit.AppStatePopup',

    currentState: STATE_HIDE,
    timeoutHandler: undefined,

    constructor: function(params) {
      this.inherited(arguments);
      if('animationDuration' in params) {
        ANIMATION_DURATION = params.animationDuration;
      }

      if('autoCloseInterval' in params) {
        AUTO_CLOSE_INTERVAL = params.autoCloseInterval;
      }
    },

    postCreate: function() {
      if(window.appInfo.isRunInMobile){
        html.addClass(this.domNode, 'mobile');
      }
      var header = html.create('div', {
        'class': 'appstate-header'
      });
      html.create('div', {
        'class': 'appstate-title',
        innerHTML: this.nls.title
      }, header);
      var closeNode = html.create('div', {
        'class': 'appstate-close'
      }, header);
      html.place(header, this.domNode);
      var labelNode = html.create('div', {
        'class': 'appstate-tips',
        innerHTML: this.nls.restoreMap
      });
      html.place(labelNode, this.domNode);

      this.own(on(labelNode, 'click', lang.hitch(this, function() {
        this.emit('applyAppState');
        this.hide();
      })));

      this.own(on(closeNode, 'click', lang.hitch(this, function() {
        this.hide();
      })));

      this.own(on(this.domNode, Mouse.enter, lang.hitch(this, function() {
        this._timerStop();
      })));

      this.own(on(this.domNode, Mouse.leave, lang.hitch(this, function() {
        this._timerStart();
      })));
    },

    show: function() {
      var animProperties;
      if(window.appInfo.isRunInMobile){
        animProperties = {
          top: {
            start: -120,
            end: 0
          }
        };
      }else {
        animProperties = {
          bottom: {
            start: -100,
            end: 10
          }
        };
      }
      baseFx.animateProperty({
        node: this.domNode,
        duration: ANIMATION_DURATION,
        properties: animProperties,
        onEnd: lang.hitch(this, function() {
          this.currentState = STATE_SHOW;
        })
      }).play();

      //wait for splash hide, when init
      topic.subscribe("splashPopupShow", lang.hitch(this, function () {
        this._timerStop();
      }));
      topic.subscribe("splashPopupHide", lang.hitch(this, function () {
        this._timerStart();
      }));

      this.timeoutHandler = setTimeout(lang.hitch(this, this.hide), AUTO_CLOSE_INTERVAL);
    },

    hide: function() {
      if(this.currentState === STATE_HIDE) {
        return;
      }

      var animProperties;
      if(window.appInfo.isRunInMobile){
        animProperties = {
          top: {
            start: 0,
            end: -120
          }
        };
      }else {
        animProperties = {
          bottom: {
            start: 10,
            end: -100
          }
        };
      }

      baseFx.animateProperty({
        node: this.domNode,
        duration: ANIMATION_DURATION,
        properties: animProperties,
        onEnd: lang.hitch(this, function() {
          this.currentState = STATE_HIDE;
          html.setStyle(this.domNode, 'display', 'none');
        })
      }).play();
    },

    _timerStart: function () {
      if (this.currentState === STATE_SHOW && !this.timeoutHandler) {
        this.timeoutHandler = setTimeout(lang.hitch(this, this.hide), AUTO_CLOSE_INTERVAL);
      }
    },
    _timerStop: function () {
      if (this.timeoutHandler) {
        clearTimeout(this.timeoutHandler);
        this.timeoutHandler = undefined;
      }
    }
  });
});
