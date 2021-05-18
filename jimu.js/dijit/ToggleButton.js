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
  'dojo/_base/declare',
  'dijit/_WidgetBase',
  'dojo/_base/lang',
  'dojo/_base/html',
  'dojo/on',
  'dojo/keys',
  'dojo/Evented'
],
function(declare, _WidgetBase, lang, html, on, keys, Evented) {

  return declare([_WidgetBase, Evented], {
    'baseClass': 'jimu-toggle-button',
    declaredClass: 'jimu.dijit.ToggleButton',

    checked: false,

    postCreate: function(){
      var toggleTips = this.toggleTips ? this.toggleTips : window.jimuNls.toggleButton;
      this.toggleTips = {
        'true': toggleTips.toggleOn,
        'false': toggleTips.toggleOff
      };
      html.setAttr(this.domNode, 'role', 'button');
      html.setAttr(this.domNode, 'tabindex', '0');
      this._setDomNodeAttrs();
      this.innerNode = html.create('div', {
        'class': 'inner'
      }, this.domNode);

      if(this.checked){
        html.addClass(this.domNode, 'checked');
      }

      this.own(on(this.domNode, 'click', lang.hitch(this, function(){
        this.toggle();
      })));
      this.own(on(this.domNode, 'keydown', lang.hitch(this, function(evt){
        if(evt.keyCode === keys.ENTER || evt.keyCode === keys.SPACE){
          this.toggle();
        }
      })));
    },

    _setDomNodeAttrs: function(){
      html.setAttr(this.domNode, 'aria-label', this.toggleTips[!this.checked + '']);
      html.setAttr(this.domNode, 'aria-pressed', this.checked + '');
    },

    resetToggleTips: function(toggleTips){
      this.toggleTips = {
        'true': toggleTips.toggleOn,
        'false': toggleTips.toggleOff
      };
      this._setDomNodeAttrs();
    },

    check: function(){
      this.checked = true;
      html.addClass(this.domNode, 'checked');
      this._setDomNodeAttrs();
      this.emit('change', this.checked);
    },

    uncheck: function(){
      this.checked = false;
      html.removeClass(this.domNode, 'checked');
      this._setDomNodeAttrs();
      this.emit('change', this.checked);
    },

    toggle: function(){
      if(this.checked){
        this.uncheck();
      }else{
        this.check();
      }
    },

    setValue: function(isCheck){
      if(this.checked === isCheck){
        return;
      }

      this.toggle();
    }

  });
});