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
    'dojo/on',
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/html',
    'jimu/utils',
    'dijit/Tooltip',
    'dojo/keys',
    'jimu/BaseWidget',
    'esri/toolbars/navigation'
  ],
  function(on, declare, lang, html, jimuUtils, Tooltip, keys, BaseWidget, Navigation) {
    var clazz = declare([BaseWidget], {
      name: 'ExtentNavigate',
      navToolbar: null,

      baseClass: 'jimu-widget-extent-navigate',
      _disabledClass: 'jimu-state-disabled',
      _verticalClass: 'vertical',
      _horizontalClass: 'horizontal',
      _floatClass: 'jimu-float-leading',
      _cornerTop: 'jimu-corner-top',
      _cornerBottom: 'jimu-corner-bottom',
      _cornerLeading: 'jimu-corner-leading',
      _cornerTrailing: 'jimu-corner-trailing',

      moveTopOnActive: false,

      postCreate: function(){
        this.inherited(arguments);
        this.navToolbar = new Navigation(this.map);
        this.own(on(this.navToolbar, 'extent-history-change', lang.hitch(this, this._onExtentHistoryChange)));
        this.btnPrevious.title = this.nls.previousExtent;
        this.btnNext.title = this.nls.nextExtent;
        this._onExtentHistoryChange();

        //add tooltip for navigation btns
        jimuUtils.addTooltipByDomNode(Tooltip, this.btnPrevious, this.nls.previousExtent);
        jimuUtils.addTooltipByDomNode(Tooltip, this.btnNext, this.nls.nextExtent);
      },

      _onExtentHistoryChange: function(){
        if(this.navToolbar.isFirstExtent()){
          html.addClass(this.btnPrevious, this._disabledClass);
        }else{
          html.removeClass(this.btnPrevious, this._disabledClass);
        }

        if(this.navToolbar.isLastExtent()){
          html.addClass(this.btnNext, this._disabledClass);
        }else{
          html.removeClass(this.btnNext, this._disabledClass);
        }
      },

      _onBtnPreviousClicked: function(){
        this.navToolbar.zoomToPrevExtent();
      },

      _onBtnPreviousKeyDown: function(evt){
        if(evt.keyCode === keys.ENTER || evt.keyCode === keys.SPACE){
          this._onBtnPreviousClicked();
        }
      },

      _onBtnNextClicked: function(){
        this.navToolbar.zoomToNextExtent();
      },

      _onBtnNextKeyDown: function(evt){
        if(evt.keyCode === keys.ENTER || evt.keyCode === keys.SPACE){
          this._onBtnNextClicked();
        }
      },

      setPosition: function(position){
        this.inherited(arguments);
        if(typeof position.height === 'number' && position.height <= 30){
          this.setOrientation(false);
        }else{
          this.setOrientation(true);
        }
      },

      setOrientation: function(isVertical){
        html.removeClass(this.domNode, this._horizontalClass);
        html.removeClass(this.domNode, this._verticalClass);

        html.removeClass(this.btnPrevious, this._floatClass);
        html.removeClass(this.btnPrevious, this._cornerTop);
        html.removeClass(this.btnPrevious, this._cornerLeading);

        html.removeClass(this.btnNext, this._floatClass);
        html.removeClass(this.btnNext, this._cornerBottom);
        html.removeClass(this.btnNext, this._cornerTrailing);

        if(isVertical){
          html.addClass(this.domNode, this._verticalClass);
          html.addClass(this.btnPrevious, this._cornerTop);
          html.addClass(this.btnNext, this._cornerBottom);
        }else{
          html.addClass(this.domNode, this._horizontalClass);
          html.addClass(this.btnPrevious, this._floatClass);
          html.addClass(this.btnNext, this._floatClass);
          html.addClass(this.btnPrevious, this._cornerLeading);
          html.addClass(this.btnNext, this._cornerTrailing);
        }
      }

    });
    return clazz;
  });