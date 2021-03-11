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
  'dojo/Deferred',
  "esri/layers/GraphicsLayer",
  'jimu/BaseWidget',
  "esri/dijit/LocateButton",
  'dojo/_base/html',
  'dojo/on',
  'dojo/_base/lang',
  'jimu/utils',
  "./Compass",
  "./a11y/Widget",
  'jimu/dijit/Message',
  'dojo/touch'
],
  function (declare, Deferred, GraphicsLayer, BaseWidget, LocateButton, html, on, lang, jimuUtils, Compass, a11y) {
    var clazz = declare([BaseWidget], {
      name: 'MyLocation',
      baseClass: 'jimu-widget-mylocation',

      moveTopOnActive: false,
      _DEBUG: false,

      _graphicsLayer: null,

      startup: function () {
        this.inherited(arguments);
        this.placehoder = html.create('div', {
          'class': 'place-holder',
          title: this.label
        }, this.domNode);
        this.a11y_updateLabel(this.nls._widgetLabel);

        this.isNeedHttpsButNot = jimuUtils.isNeedHttpsButNot();

        if (true === this.isNeedHttpsButNot) {
          console.log('LocateButton::navigator.geolocation requires a secure origin.');
          html.addClass(this.placehoder, "nohttps");

          html.setAttr(this.placehoder, 'title', this.nls.httpNotSupportError);
          this.a11y_updateLabel(this.nls.httpNotSupportError);
          this.a11y_disable();
        } else if (window.navigator.geolocation) {
          this.own(on(this.placehoder, 'click', lang.hitch(this, this.onLocationClick)));
          this.own(on(this.map, 'zoom-end', lang.hitch(this, this._scaleChangeHandler)));

          this.a11y_initEvents();
          this.a11y_enable();
        } else {
          html.setAttr(this.placehoder, 'title', this.nls.browserError);
          this.a11y_updateLabel(this.nls.browserError);
          this.a11y_disable();
        }
      },

      onLocationClick: function (evt) {
        if (evt && evt.stopPropagation) {
          evt.stopPropagation();
        }

        if (html.hasClass(this.domNode, "onCenter") ||
          html.hasClass(this.domNode, "locating")) {

          if(!(this.geoLocate && true === this.geoLocate._canDestroy)){
            if(this._DEBUG){
              console.log("==>block click1");
            }
            return;
          }


          this._destroyGeoLocate();//this._clearGeoLocate();
          this._tryToCleanCompass();
        } else {
          if(!(!this.geoLocate || (this.geoLocate && true === this.geoLocate._canDestroy))){
            if(this._DEBUG){
              console.log("==>block click2");
            }
            return;
          }

          this._destroyGeoLocate();//this._clearGeoLocate();
          this._createGeoLocateAndLocate();
        }
      },


      //create & async-locate
      _createGeoLocateAndLocate: function () {
        if(this._DEBUG){
          console.log("==>_createGeoLocateAndLocate");
        }
        this.getGeoLocateInstance().then(lang.hitch(this, function () {
          this.geoLocate.locate();
          html.addClass(this.placehoder, "locating");
        }));
      },
      getGeoLocateInstance: function () {
        var def = new Deferred();
        //1 get
        if (this.geoLocate) {
          def.resolve(this.geoLocate);
        }
        //2 create
        var json = this.config.locateButton;
        json.map = this.map;
        if (typeof (this.config.locateButton.useTracking) === "undefined") {
          json.useTracking = true;
        }
        json.centerAt = true;
        json.setScale = true;
        var geoOptions = {
          maximumAge: 0,
          timeout: 15000,
          enableHighAccuracy: true
        };
        if (json.geolocationOptions) {
          json.geolocationOptions = lang.mixin(geoOptions, json.geolocationOptions);
        }
        if (jimuUtils.has('ie') === 11) {//hack for issue,#11199
          json.geolocationOptions.maximumAge = 300;
          json.geolocationOptions.enableHighAccuracy = false;
        }

        if (!this._graphicsLayer) {
          this._graphicsLayer = new GraphicsLayer();
          this.map.addLayer(this._graphicsLayer);
        }
        json.graphicsLayer = this._graphicsLayer;

        this.geoLocate = new LocateButton(json);
        this.geoLocate.own(on(this.geoLocate, 'load', lang.hitch(this, function () {
          def.resolve(this.geoLocate);
        })));
        //only 3d-api have error event
        this.geoLocate.own(on(this.geoLocate, "locate", lang.hitch(this, this.onLocateOrError)));
        this.geoLocate.startup();

        return def;
      },


      //events handler
      //there is no "locate-error" event in 2d-api
      onLocateOrError: function (evt) {
        if(this.geoLocate){
          setTimeout(lang.hitch(this, function () {
            this.geoLocate._canDestroy = true;

            if (evt.error) {
              this.onLocateError(evt);
            } else {
              this.onLocate(evt);
            }
          }), 300);
        }
      },
      onLocate: function (parameters) {
        html.removeClass(this.placehoder, "locating");
        if (this.geoLocate.useTracking) {
          html.addClass(this.placehoder, "tracking");
        }

        if (parameters.error) {
          this.onLocateError(parameters);
        } else {
          html.addClass(this.domNode, "onCenter");
          this.neverLocate = false;

          this._tryToShowCompass(parameters);
        }
      },
      onLocateError: function (evt) {
        console.error(evt.error);
        //this._destroyAPIBugLocate();
        this._tryToCleanCompass();
        html.removeClass(this.placehoder, "locating");
        html.removeClass(this.domNode, "onCenter");
        html.removeClass(this.placehoder, "tracking");
      },
      //use current scale in Tracking
      _scaleChangeHandler: function () {
        var scale = this.map.getScale();
        if (scale && this.geoLocate && this.geoLocate.useTracking) {
          this.geoLocate.scale = scale;
        }
      },


      //compass
      _tryToShowCompass: function (parameters) {
        if (true !== this.config.locateButton.highlightLocation ||
          true !== this.config.locateButton.useTracking) {
          return;//1 or all false
        }
        if (true !== this.config.useCompass && true !== this.config.useAccCircle) {
          return;//all false
        }

        this.compass = Compass.getInstance({ folderUrl: this.folderUrl, map: this.map, config: this.config });
        this.compass.show(parameters, this.geoLocate);
      },
      _tryToCleanCompass: function () {
        if (this.compass && this.compass.clean) {
          this.compass.clean();
        }
      },
      _tryToDestroyCompass: function () {
        if (this.compass && this.compass.destroy) {
          this.compass.destroy();
        }
      },


      // _clearGeoLocate: function () {
      //   if (this.geoLocate){
      //     this.geoLocate.clear();
      //     html.removeClass(this.domNode, "onCenter");
      //     html.removeClass(this.placehoder, "tracking");
      //     this._destroyAPIBugLocate();
      //   }
      // },
      // _isGeoLocateLocating: function () {
      //   return html.hasClass(this.geoLocate._locateNode, this.geoLocate._css.loading);
      // },
      _destroyGeoLocate: function () {
        if(this._DEBUG){
          console.log("==>_destroyGeoLocate");
        }

        if(this._graphicsLayer){
          this._graphicsLayer.clear();
        }

        if (this.geoLocate && this.geoLocate._canDestroy) {
          if (this.geoLocate) {
            this.geoLocate.clear();
            this.geoLocate.destroy();
            this.geoLocate = null;
          }
          //this._destroyAPIBugLocate();
          html.removeClass(this.domNode, "onCenter");
          html.removeClass(this.placehoder, "tracking");
        }
      },
      //hack api bug, when destroy before locating finish
      // _destroyAPIBugLocate: function () {
      //   var graphics = this.map.graphics.graphics;
      //   for (var i = 0, len = graphics.length; i < len; i++) {
      //     var g = graphics[i];
      //     if (g.symbol && this._endsWithStr(g.symbol.url, "/dijit/images/sdk_gps_location.png")) {
      //       this.map.graphics.remove(g);
      //       i = 0;
      //       len = graphics.length;
      //     }
      //   }
      // },
      /*jshint esnext: true */
      /* jscs:disable */
      // _endsWithStr(string, suf) {
      //   var reg = new RegExp(suf + "$");
      //   return reg.test(string);
      // },
      /* jscs:enable */
      destroy: function () {
        this._tryToCleanCompass();
        this._tryToDestroyCompass();

        this._destroyGeoLocate();

        if(this._graphicsLayer){
          this.map.removeLayer(this._graphicsLayer);
          this._graphicsLayer = null;
        }

        this.inherited(arguments);
      }
    });
    clazz.inPanel = false;
    clazz.hasUIFile = false;

    clazz.extend(a11y);//for a11y
    return clazz;
  });