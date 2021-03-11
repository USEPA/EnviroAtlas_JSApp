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
  "dojo/_base/lang",
  'dojo/on',
  'dojo/_base/html',
  'dojo/_base/array',
  'dojo/Deferred',
  'dojo/text!./BaseLayerConfig.html',
  "../utils",
  'jimu/utils',
  "jimu/dijit/LoadingShelter",
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dijit/_WidgetsInTemplateMixin'
],
  function (declare, lang, on, html, array, Deferred, template, utils, jimuUtils, LoadingShelter,
    _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin) {
    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
      templateString: template,
      nls: null,
      TYPE: utils.TYPE,

      postCreate: function () {
        this.shelter = new LoadingShelter({ hidden: true });
        this.shelter.placeAt(this.domNode);
        this.inherited(arguments);
      },
      startup: function () {
        this._toggleVELayerByKey();
        this._setBaseLayerStyle();

        this.own(on(this.baseLayerType, 'change', lang.hitch(this, function (value) {
          this._setBaseLayerStyle(value);
        })));
        // this.own(on(this.tileLayerUrl, 'change,blur', lang.hitch(this, function () {
        //   this._onTileLayerUrlChange();
        // })));
        this.initVerification();

        this.inherited(arguments);
      },

      initVerification: function () {
        //clean errorMsg
        this.own(on(this.baseLayerType, 'change', lang.hitch(this, function () {
          this._showErrMsg(null);
        })));
        this.own(on(this.baseLayerType, 'blur', lang.hitch(this, function () {
          this._showErrMsg(null);
        })));

        //verification
        var checkList = [this.tiledMapServiceUrlInput, this.dynamicMapServiceUrlInput, this.imageServiceUrlInput];
        array.forEach(checkList, lang.hitch(this, function (input) {
          this.own(on(input, 'change', lang.hitch(this, function () {
            this.isValid();
          })));
          this.own(on(input, 'blur', lang.hitch(this, function () {
            this.isValid();
          })));
        }));
      },

      isValid: function () {
        this.shelter.show();
        var def = new Deferred();
        html.addClass(this.domNode, "validating");

        utils.valid.baseLayerVerification(this.getValues(), this.map).then(lang.hitch(this, function (validRes) {
          html.removeClass(this.domNode, "validating");
          this._showErrMsg(null);

          if (validRes && true === validRes.res) {
            html.removeClass(this.domNode, "error");
            this.shelter.hide();
            def.resolve(true);//true: no class "validating"||"error"
          } else {
            html.addClass(this.domNode, "error");
            var type = this._getType();
            if (type === this.TYPE.ARCGIS_TILED_MAP ||
              type === this.TYPE.ARCGIS_DYNAMIC_MAP_SERVICE ||
              type === this.TYPE.ARCGIS_IMAGE_SERVICE) {
              this._setArcGISLayerInputState("Error");

              html.removeClass(this.errorNode, "hide");
              var errInfo = validRes.err;//handle errors
              if (errInfo) {
                if (errInfo === "wkid") {
                  this._showErrMsg(this.nls.errWkid);
                } else if (errInfo === "layerType") {
                  this._showErrMsg(this.nls.errUrl);
                } else if (errInfo.name && -1 !== errInfo.name.indexOf("SyntaxError")) {
                  this._showErrMsg(this.nls.errUrl);
                } else if (errInfo.name && -1 !== errInfo.name.indexOf("RequestError")) {
                  this._showErrMsg(this.nls.errUrl);
                } else if (errInfo.name && (-1 !== errInfo.message.indexOf("Invalid URL") ||
                    -1 !== errInfo.message.indexOf("Unexpected token <"))) {
                  this._showErrMsg(this.nls.errUrl);
                } else if (errInfo.name && -1 !== errInfo.message.indexOf("Timeout exceeded")) {
                  this._showErrMsg(this.nls.errReqTimeout);
                } else {
                  this._showErrMsg(this.nls.errUrl);
                }
              }
            }

            this.shelter.hide();
            def.resolve(false);
          }
        }), lang.hitch(this, function (/*err*/) {
          //TODO err
          html.removeClass(this.domNode, "validating");
          html.removeClass(this.domNode, "error");
          this.shelter.hide();
          def.resolve(false);
        }));

        return def;
      },
      isUrlEmpty: function () {
        html.addClass(this.domNode, "validating");
        var type = this._getType();
        var url = this._getArcLayerInputsValue(type);
        if (!url || "" === url) {
          this._showErrMsg(this.nls.errUrl);
        } else {
          html.removeClass(this.domNode, "validating");
          this._showErrMsg(null);
        }
      },

      getValues: function () {
        var type = this._getType();
        var baseLayerObj = {
          url: this._getArcLayerInputsValue(type),
          type: type,
          // tileLayerInfo: {
          //   url: jimuUtils.stripHTML(this.tileLayerUrl.value || ""),
          //   tile: this.tile.value,
          //   credits: this.credits.value,
          //   subDomains: this._getSubDomains(),
          //   tileInfo: this._getTileInfo(),
          //   extent: this.map.extent.toJson()//TODO initExtent
          // },
          veLayerInfo: {
            //credential: this.VECredential.value,
            isKeyInPortal: utils.valid.isHaveBingKey()
            //style: this.VEStyle.value
          }
        };

        return baseLayerObj;
      },

      setValues: function (config) {
        if (config.overviewMap.baseLayer) {
          var type = config.overviewMap.baseLayer.type;
          this._setArcLayerInputsValue(config.overviewMap.baseLayer.url, type);
          this.baseLayerType.set('value', type);
          // if (config.overviewMap.baseLayer.tileLayerInfo) {
          //   this.tileLayerUrl.value = jimuUtils.stripHTML(config.overviewMap.baseLayer.tileLayerInfo.url || "");
          //   this.tile.value = jimuUtils.stripHTML(config.overviewMap.baseLayer.tileLayerInfo.tile || "");
          //   this.credits.value = jimuUtils.stripHTML(config.overviewMap.baseLayer.tileLayerInfo.credits || "");
          //   this.subdomain.value = jimuUtils.stripHTML(config.overviewMap.baseLayer.tileLayerInfo.subDomains || "");
          //   //this.extent.value = jimuUtils.stripHTML(config.overviewMap.baseLayer.tileLayerInfo.extent || "");//TODO
          //   this.tileInfo.value = jimuUtils.stripHTML(config.overviewMap.baseLayer.tileLayerInfo.tileInfo || "");
          // }
          if (config.overviewMap.baseLayer.veLayerInfo) {
            //this.VECredential.value = jimuUtils.stripHTML(config.overviewMap.baseLayer.veLayerInfo.credential || "");
            //this.VEStyle.set('value', config.overviewMap.baseLayer.veLayerInfo.style);
          }
          //this._onTileLayerUrlChange();
        }
      },

      /************************************** */
      _getType: function () {
        return this.baseLayerType.value;
      },
      _setArcLayerInputsValue: function (value, type) {
        var input = this._getArcGISLayerInput(type);
        if (input && input.setValue) {
          input.setValue(jimuUtils.stripHTML(value || ""));
        }
      },
      _getArcGISLayerInput: function (type) {
        switch (type) {
          case this.TYPE.ARCGIS_TILED_MAP: {
            return this.tiledMapServiceUrlInput;
          } case this.TYPE.ARCGIS_DYNAMIC_MAP_SERVICE: {
            return this.dynamicMapServiceUrlInput;
          } case this.TYPE.ARCGIS_IMAGE_SERVICE: {
            return this.imageServiceUrlInput;
          }
        }
      },
      _setArcGISLayerInputState: function (state) {
        var type = this._getType();
        var input = this._getArcGISLayerInput(type);
        if (input) {
          input.set("state", state);
        }
      },
      _getArcLayerInputsValue: function (type) {
        var value;
        var input = this._getArcGISLayerInput(type);
        if (input && input.value) {
          value = input.value;

          if ("" !== value && (false === /^\/\//.test(value) && false === /(^(.+):\/\/)/.test(value))) {
            value = 'http://' + value;
          }
        }

        return jimuUtils.stripHTML(value || "");
      },
      _showErrMsg: function (msg) {
        if (!msg) {
          this._setArcGISLayerInputState("");
          html.addClass(this.errorNode, "hide");
          this.errorNode.innerHTML = "";
        } else {
          //this._getArcGISLayerInput().focus();
          this._setArcGISLayerInputState("Error");
          html.removeClass(this.errorNode, "hide");
        }

        var type = this._getType();
        var input = this._getArcGISLayerInput(type);
        if (input && input.displayMessage) {
          input.displayMessage(msg);
        }
        this.errorNode.innerHTML = msg;
      },

      _toggleVELayerByKey: function () {
        //hide VE, when there is NO bing-key
        if (!utils.valid.isHaveBingKey()) {
          this.baseLayerType.removeOption(this.TYPE.BING_AERIAL);
          this.baseLayerType.removeOption(this.TYPE.BING_HYBRID);
          this.baseLayerType.removeOption(this.TYPE.BING_ROAD);
        }
      },
      _setBaseLayerStyle: function (layerType) {
        var type = layerType;
        if (!layerType) {
          if (this.config.overviewMap.baseLayer && this.config.overviewMap.baseLayer.type) {
            type = this.config.overviewMap.baseLayer.type;
          }
        }

        html.addClass(this.baseLayerContainer, "hide");

        html.addClass(this.tiledMapServiceUrlInput.domNode, "hide");
        html.addClass(this.dynamicMapServiceUrlInput.domNode, "hide");
        html.addClass(this.imageServiceUrlInput.domNode, "hide");
        //html.addClass(this.tileLayerContainer, "hide");
        //html.addClass(this.VELayerContainer, "hide");
        switch (type) {
          case this.TYPE.BASE_MAP: {
            break;
          } case this.TYPE.ARCGIS_TILED_MAP: {
            html.removeClass(this.baseLayerContainer, "hide");
            html.removeClass(this.tiledMapServiceUrlInput.domNode, "hide");
            break;
          } case this.TYPE.ARCGIS_DYNAMIC_MAP_SERVICE: {
            html.removeClass(this.baseLayerContainer, "hide");
            html.removeClass(this.dynamicMapServiceUrlInput.domNode, "hide");
            break;
          } case this.TYPE.ARCGIS_IMAGE_SERVICE: {
            html.removeClass(this.baseLayerContainer, "hide");
            html.removeClass(this.imageServiceUrlInput.domNode, "hide");
            break;
          } case this.TYPE.OSM: {
            break;
          } case this.TYPE.BING_ROAD: {
            break;
          } case this.TYPE.BING_AERIAL: {
            break;
          } case this.TYPE.BING_HYBRID: {
            break;
          } default: { break; }
        }
      },

      /***************   TileLayer   ***************** */
      _onTileLayerUrlChange: function (isCleanSubDomain) {
        var url = this.tileLayerUrl.value;
        if (url.toLowerCase().indexOf("{subdomain}") > -1) {
          html.removeClass(this.subdomainContainer, "hide");
        } else {
          html.addClass(this.subdomainContainer, "hide");
          if (isCleanSubDomain) {
            this.subdomain.value = "";
          }
        }
      },
      _getSubDomains: function () {
        this._onTileLayerUrlChange(true);

        var tileLayerSubDomains = null;
        if (this.subdomain.value && this.subdomain.value.length > 0) {
          tileLayerSubDomains = this.subdomain.value.split(",");
          tileLayerSubDomains = array.map(tileLayerSubDomains, function (sd) {
            return lang.trim(sd);
          });
        }

        return tileLayerSubDomains;
      },
      _getTileInfo: function () {
        var tileInfoStr = this.tileInfo.value;
        if (true !== utils.valid.tileInfoStr(tileInfoStr)) {
          //TODO popup the error
        }

        return tileInfoStr;
      }
    });
  });