///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 - 2018 Esri. All Rights Reserved.
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
    'jimu/BaseWidget',
    'esri/toolbars/navigation',
    'esri/geometry/Extent'
  ],
  function(on, declare, lang, html, BaseWidget, Navigation, Extent) {
    var clazz = declare([BaseWidget], {
      name: 'HawaiiAlaskaConusRico',
      navToolbar: null,

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
        this.btnHawaii.title = this.nls.Hawaii;
        this.btnAlaska.title = this.nls.Alaska;
        this.btnConus.title = this.nls.Conus;
        this.btnPRVI.title = this.nls.PRVI;

      },
      _onHawaiiClicked: function() {
        for (var i = 0; i <this.config.bookmarks[0].items.length; i++ ){
          var currentItem = this.config.bookmarks[0].items[i];
          if (currentItem.name === "Hawaii"){
            var nExtent = Extent(currentItem.extent);
            this.map.setExtent(nExtent);
            document.getElementById("areaGeographyHawaii").click();
          }
        }          
      },
      _onAlaskaClicked: function() {
        for (var i = 0; i <this.config.bookmarks[0].items.length; i++ ){
          var currentItem = this.config.bookmarks[0].items[i];
          if (currentItem.name === "Alaska"){
            var nExtent = Extent(currentItem.extent);
            this.map.setExtent(nExtent);
            document.getElementById("areaGeographyAlaska").click();
            
          }
        }          
      },
      _onConusClicked: function() {
        for (var i = 0; i <this.config.bookmarks[0].items.length; i++ ){
          var currentItem = this.config.bookmarks[0].items[i];
          if (currentItem.name === "Conus"){
            var nExtent = Extent(currentItem.extent);
            this.map.setExtent(nExtent);
            document.getElementById("areaGeographyConus").click();
          }
        }          
      },
      _onPRVIClicked: function() {
        for (var i = 0; i <this.config.bookmarks[0].items.length; i++ ){
          var currentItem = this.config.bookmarks[0].items[i];
          if (currentItem.name === "PRVI"){
            var nExtent = Extent(currentItem.extent);
            this.map.setExtent(nExtent);
            document.getElementById("areaGeographyPR").click();
          }
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



        /*html.removeClass(this.btnNext, this._floatClass);
        html.removeClass(this.btnNext, this._cornerBottom);
        html.removeClass(this.btnNext, this._cornerTrailing);*/

        if(isVertical){
          html.addClass(this.domNode, this._verticalClass);

          //html.addClass(this.btnNext, this._cornerBottom);
        }else{
          //html.addClass(this.domNode, this._horizontalClass);
          //html.addClass(this.btnNext, this._floatClass);
          //html.addClass(this.btnNext, this._cornerTrailing);
        }
      }

    });
    return clazz;
  });