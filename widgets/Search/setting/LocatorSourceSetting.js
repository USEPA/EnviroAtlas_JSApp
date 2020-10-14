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
define(
  ["dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/html",
    "dojo/on",
    "dojo/Evented",
    "dojo/Deferred",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "jimu/portalUrlUtils",
    "jimu/dijit/Message",
    "jimu/dijit/_GeocodeServiceChooserContent",
    "jimu/dijit/Popup",
    "jimu/dijit/LoadingShelter",
    "esri/request",
    "esri/lang",
    "../utils",
    "jimu/utils",
    "dojo/text!./LocatorSourceSetting.html",
    "jimu/dijit/CheckBox",
    "dijit/form/ValidationTextBox",
    "dijit/form/RadioButton",
    "dijit/form/NumberTextBox"
  ],
  function(
    declare,
    lang,
    html,
    on,
    Evented,
    Deferred,
    _WidgetBase,
    _TemplatedMixin,
    _WidgetsInTemplateMixin,
    portalUrlUtils,
    Message,
    _GeocodeServiceChooserContent,
    Popup,
    LoadingShelter,
    esriRequest,
    esriLang,
    utils,
    jimuUtils,
    template,
    CheckBox) {
    /*jshint maxlen:150*/
    return declare([
      _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Evented
    ], {
      baseClass: "jimu-widget-search-locator-source-setting",
      tr: null,
      nls: null,
      config: null,
      singleLineFieldName: null,
      templateString: template,

      _suggestible: false,
      _locatorDefinition: null,
      _esriLocatorRegExp: /http(s)?:\/\/geocode(.){0,3}\.arcgis.com\/arcgis\/rest\/services\/World\/GeocodeServer/g,
      serviceChooserContent: null,
      geocoderPopup: null,

      _clickSet: false,
      _defaultZoomScale: null,

      postCreate: function() {
        this.inherited(arguments);
        this.zoomScale.set('placeHolder', window.jimuNls.common.defaults);
        this.exampleHint = this.nls.locatorExample +
          ": http://&lt;myServerName&gt;/arcgis/rest/services/World/GeocodeServer";

        this.searchInCurrentMapExtent = new CheckBox({
          checked: false,
          label: this.nls.searchInCurrentMapExtent
        }, this.searchInCurrentMapExtent);

        this.enableLocalSearch = new CheckBox({
          checked: false,
          label: this.nls.enableLocalSearch
        }, this.enableLocalSearch);
        this._processlocalSearchTable(false);
        this.own(on(this.enableLocalSearch, 'change', lang.hitch(this, function() {
          this._processlocalSearchTable(this.enableLocalSearch.getValue());
        })));
        html.setStyle(this.enableLocalSearch.domNode, 'display', 'none');

        this._setMessageNodeContent(this.exampleHint);
        this.own(on(this.panToRadio, 'click', lang.hitch(this, this._onRadioClicke)));
        this.own(on(this.zoomToRadio, 'click', lang.hitch(this, this._onRadioClicke)));

        this.config = this.config ? this.config : {};
        this.setConfig(this.config);
      },

      setRelatedTr: function(tr) {
        this.tr = tr;
      },

      getRelatedTr: function() {
        return this.tr;
      },

      setDefinition: function(definition) {
        this._locatorDefinition = definition || {};
      },

      getDefinition: function() {
        return this._locatorDefinition;
      },

      setConfig: function(config) {
        if (Object.prototype.toString.call(config) !== "[object Object]") {
          return;
        }

        var url = config.url;
        if (!url) {
          // set default zoomToRadio if there is no url.
          //html.setAttr(this.zoomToRadio, 'checked', '');
          this.zoomToRadio.set('checked', true);
          return;
        }
        this.config = config;

        this.shelter.show();
        if (this._locatorDefinition.url !== url) {
          this._getDefinitionFromRemote(url).then(lang.hitch(this, function(response) {
            if (url && (response && response.type !== 'error')) {
              this._locatorDefinition = response;
              this._locatorDefinition.url = url;
              this._setSourceItems();

              this._setMessageNodeContent(this.exampleHint);
            } else if (url && (response && response.type === 'error')) {
              this._setSourceItems();
              this._disableSourceItems();

              this._setMessageNodeContent(esriLang.substitute({
                'URL': response.url
              }, lang.clone(this.nls.invalidUrlTip)), true);
            }
            this.shelter.hide();
          }));
        } else {
          this._setSourceItems();
          this._setMessageNodeContent(this.exampleHint);
          this.shelter.hide();
        }
      },

      isValidConfig: function() {
        var config = this.getConfig();
        if (config.url && config.name && config.singleLineFieldName) {
          return true;
        } else {
          return false;
        }
      },

      showValidationTip: function() {
        this._showValidationErrorTip(this.locatorUrl);
        this._showValidationErrorTip(this.locatorName);
      },

      getConfig: function() {
        var geocode = {
          url: this.locatorUrl.get('value'),
          name: jimuUtils.stripHTML(this.locatorName.get('value')),
          singleLineFieldName: this.singleLineFieldName,
          placeholder: jimuUtils.stripHTML(this.placeholder.get('value')),
          countryCode: jimuUtils.stripHTML(this.countryCode.get('value')),
          panToScale: this.panToRadio.get('checked') ? true : false,
          zoomScale: this.zoomScale.get('value') || this._defaultZoomScale,
          maxSuggestions: this.maxSuggestions.get('value'),
          maxResults: this.maxResults.get('value') || 6,
          searchInCurrentMapExtent: this.searchInCurrentMapExtent.checked,
          enableLocalSearch: this.enableLocalSearch.getValue(),
          localSearchMinScale: this.localSearchMinScale.get('value'),
          localSearchDistance: this.localSearchDistance.get('value'),
          radiusUnit: this.radiusUnit.get('value'),
          type: "locator"
        };
        return geocode;
      },

      _onLocatorNameBlur: function() {
        this.locatorName.set('value', jimuUtils.stripHTML(this.locatorName.get('value')));
      },

      _onPlaceholderBlur: function() {
        this.placeholder.set('value', jimuUtils.stripHTML(this.placeholder.get('value')));
      },

      _onCountryCodeBlur: function() {
        this.countryCode.set('value', jimuUtils.stripHTML(this.countryCode.get('value')));
      },

      _disableSourceItems: function() {
        this.locatorName.set('disabled', true);
        this.placeholder.set('disabled', true);
        this.countryCode.set('disabled', true);
        this.maxSuggestions.set('disabled', true);
        this.maxResults.set('disabled', true);
        this.zoomScale.set('disabled', true);
      },

      _enableSourceItems: function() {
        this.locatorName.set('disabled', false);
        this.placeholder.set('disabled', false);
        this.countryCode.set('disabled', false);
        this.maxSuggestions.set('disabled', false);
        this.maxResults.set('disabled', false);
        this._controlZoomScaleTextBox();
      },

      _setSourceItems: function() {
        var config = this.config;
        if (config.url) {
          // this.validService = true;
          this.locatorUrl.set('value', config.url);
          this._processCountryCodeRow(config.url);
        }
        if (config.name) {
          this.locatorName.set('value', jimuUtils.stripHTML(config.name));
        }
        if (config.singleLineFieldName) {
          this.singleLineFieldName = config.singleLineFieldName;
        }
        if (config.placeholder) {
          this.placeholder.set('value', jimuUtils.stripHTML(config.placeholder));
        }
        if (config.countryCode) {
          this.countryCode.set('value', jimuUtils.stripHTML(config.countryCode));
        }

        this._processLocalSearchRadiusUnit();
        if ('capabilities' in this._locatorDefinition) {
          html.setStyle(this.enableLocalSearch.domNode, 'display', '');
          this._processlocalSearchTable(config.enableLocalSearch);
          this.enableLocalSearch.setValue(config.enableLocalSearch);
          if (config.localSearchMinScale && config.enableLocalSearch) {
            this.localSearchMinScale.set('value', config.localSearchMinScale);
          }
          if (config.localSearchDistance && config.enableLocalSearch) {
            this.localSearchDistance.set('value', config.localSearchDistance);
          }
          this.radiusUnit.set('value', config.radiusUnit || 'meter');
        } else {
          this.enableLocalSearch.setValue(false);
          html.setStyle(this.enableLocalSearch.domNode, 'display', 'none');
        }

        this._suggestible = this._locatorDefinition && this._locatorDefinition.capabilities &&
          this._locatorDefinition.capabilities.indexOf("Suggest") > -1;
        if (!this._suggestible) {
          this._showSuggestibleTips();
        } else {
          this._hideSuggestibleTips();
        }

        this.searchInCurrentMapExtent.setValue(!!config.searchInCurrentMapExtent);

        //html.removeAttr(this.zoomToRadio, 'checked');
        this.zoomToRadio.set('checked', false);
        if(this.config.panToScale) {
          //html.setAttr(this.panToRadio, 'checked', '');
          this.panToRadio.set('checked', true);
        } else {
          //html.setAttr(this.zoomToRadio, 'checked', '');
          this.zoomToRadio.set('checked', true);
        }

        this.zoomScale.set('value', config.zoomScale || this._defaultZoomScale);

        this.maxSuggestions.set('value', config.maxSuggestions);

        this.maxResults.set('value', config.maxResults || 6);

        this._enableSourceItems();
      },

      _isEsriLocator: function(url) {
        this._esriLocatorRegExp.lastIndex = 0;
        return this._esriLocatorRegExp.test(url);
      },

      _getDefinitionFromRemote: function(url) {
        var resultDef = new Deferred();
        if (this._isEsriLocator(url)) {
          // optimize time
          resultDef.resolve({
            singleLineAddressField: {
              name: "SingleLine",
              type: "esriFieldTypeString",
              alias: "Single Line Input",
              required: false,
              length: 200,
              localizedNames: {},
              recognizedNames: {}
            },
            capabilities: "Geocode,ReverseGeocode,Suggest"
          });
        } else {
          var def = esriRequest({
            url: url,
            content: {
              f: 'json'
            },
            handleAs: 'json',
            callbackParamName: 'callback'
          });
          this.own(def);
          def.then(lang.hitch(this, function(response) {
            resultDef.resolve(response);
          }), lang.hitch(this, function(err) {
            console.error(err);
            resultDef.resolve({
              type: 'error',
              url: this._getRequestUrl(url)
            });
          }));
        }

        return resultDef.promise;
      },

      _setMessageNodeContent: function(content, err) {
        html.empty(this.messageNode);
        if (!content.nodeType) {
          content = html.toDom(content);
        }
        html.place(content, this.messageNode);
        if (err) {
          html.addClass(this.messageNode, 'error-message');
        } else {
          html.removeClass(this.messageNode, 'error-message');
        }
      },

      _getRequestUrl: function(url) {
        var protocol = window.location.protocol;
        if (protocol === 'http:') {
          return portalUrlUtils.setHttpProtocol(url);
        } else if (protocol === 'https:'){
          return portalUrlUtils.setHttpsProtocol(url);
        } else {
          return url;
        }
      },

      _onSetLocatorUrlClick: function() {
        this._clickSet = true;
        this._openServiceChooser();
      },

      _openLocatorChooser: function() {
        this._clickSet = false;
        this._openServiceChooser();
      },

      _openServiceChooser: function() {
        this.serviceChooserContent = new _GeocodeServiceChooserContent({
          url: this.locatorUrl.get('value') || ""
        });
        this.shelter = new LoadingShelter({
          hidden: true
        });

        this.geocoderPopup = new Popup({
          titleLabel: this.nls.setGeocoderURL,
          autoHeight: true,
          content: this.serviceChooserContent.domNode,
          container: window.jimuConfig.layoutId,
          width: 640
        });
        this.shelter.placeAt(this.geocoderPopup.domNode);
        html.setStyle(this.serviceChooserContent.domNode, 'width', '580px');
        html.addClass(
          this.serviceChooserContent.domNode,
          'override-geocode-service-chooser-content'
        );

        this.serviceChooserContent.own(
          on(this.serviceChooserContent, 'validate-click', lang.hitch(this, function() {
            html.removeClass(
              this.serviceChooserContent.domNode,
              'override-geocode-service-chooser-content'
            );
          }))
        );
        this.serviceChooserContent.own(
          on(this.serviceChooserContent, 'ok', lang.hitch(this, '_onSelectLocatorUrlOk'))
        );
        this.serviceChooserContent.own(
          on(this.serviceChooserContent, 'cancel', lang.hitch(this, '_onSelectLocatorUrlCancel'))
        );
      },

      _onSelectLocatorUrlOk: function(evt) {
        if (!(evt && evt[0] && evt[0].url && this.domNode)) {
          return;
        }
        this.shelter.show();
        esriRequest({
          url: evt[0].url,
          content: {
            f: 'json'
          },
          handleAs: 'json',
          callbackParamName: 'callback'
        }).then(lang.hitch(this, function(response) {
          this.shelter.hide();
          if (response &&
            response.singleLineAddressField &&
            response.singleLineAddressField.name) {
            this._enableSourceItems();
            this.locatorUrl.set('value', evt[0].url);
            if(!this.locatorName.get('value')){
              this.locatorName.set('value', utils.getGeocoderName(evt[0].url));
            }
            if ('capabilities' in response) {
              html.setStyle(this.enableLocalSearch.domNode, 'display', '');
              if (this._isEsriLocator(evt[0].url)) {
                this.enableLocalSearch.setValue(true);
              } else {
                this.enableLocalSearch.setValue(false);
              }
            } else {
              this.enableLocalSearch.setValue(false);
              html.setStyle(this.enableLocalSearch.domNode, 'display', 'none');
            }

            this.singleLineFieldName = response.singleLineAddressField.name;

            this._processCountryCodeRow(evt[0].url);

            this._locatorDefinition = response;
            this._locatorDefinition.url = evt[0].url;
            this._suggestible = response.capabilities &&
              this._locatorDefinition.capabilities.indexOf("Suggest") > -1;
            if (!this._suggestible) {
              this._showSuggestibleTips();
            } else {
              this._hideSuggestibleTips();
            }

            if (this._clickSet) {
              this.emit('reselect-locator-url-ok', this.getConfig());
            } else {
              this.emit('select-locator-url-ok', this.getConfig());
            }
            if (this.geocoderPopup) {
              this.geocoderPopup.close();
              this.geocoderPopup = null;
            }

            this._setMessageNodeContent(this.exampleHint);
          } else {
            new Message({
              'message': this.nls.locatorWarning
            });
          }
        }), lang.hitch(this, function(err) {
          console.error(err);
          this.shelter.hide();
          new Message({
            'message': esriLang.substitute({
                'URL': this._getRequestUrl(evt[0].url)
              }, lang.clone(this.nls.invalidUrlTip))
          });
        }));
      },

      _onSelectLocatorUrlCancel: function() {
        if (this.geocoderPopup) {
          this.geocoderPopup.close();
          this.geocoderPopup = null;

          this.emit('select-locator-url-cancel');
        }
      },

      _processLocalSearchRadiusUnit: function() {
        var options = [{
          label: window.jimuNls.units.meters,
          value: "meter"
        }, {
          label: window.jimuNls.units.kilometers,
          value: "kilometer"
        }, {
          label: window.jimuNls.units.nauticalMiles,
          value: "nauticalMile"
        }, {
          label: window.jimuNls.units.miles,
          value: "mile"
        }, {
          label: window.jimuNls.units.yards,
          value: "yard"
        }, {
          label: window.jimuNls.units.feet,
          value: "foot"
        }/*, {
          label: window.jimuNls.units.inches,
          value: "inch"
        }*/];

        this.radiusUnit.set('options', options);
      },

      _processlocalSearchTable: function(enable) {
        if (enable) {
          html.removeClass(this.minScaleNode, 'hide-local-search-table');
          html.removeClass(this.radiusNode, 'hide-local-search-table');

          var radiusBox = html.getMarginBox(this.radiusHintNode);
          var defaultPB = 45;
          html.setStyle(
            this.radiusHintNode.parentNode,
            'paddingBottom',
            (radiusBox.h > defaultPB ? radiusBox.h + 10 : defaultPB) + 'px'
          );
        } else {
          html.addClass(this.minScaleNode, 'hide-local-search-table');
          html.addClass(this.radiusNode, 'hide-local-search-table');
        }
      },

      _processCountryCodeRow: function(url) {
        if (this._isEsriLocator(url)) {
          this.countryCode.set('value', "");
          html.removeClass(this.countryCodeRow, 'hide-country-code-row');
        } else {
          html.addClass(this.countryCodeRow, 'hide-country-code-row');
        }
      },

      _showSuggestibleTips: function() {
        html.addClass(this.tipsNode, 'source-tips-show');
        html.setStyle(this.maxSuggestions.domNode, 'display', 'none');
      },

      _hideSuggestibleTips: function() {
        html.removeClass(this.tipsNode, 'source-tips-show');
        html.setStyle(this.maxSuggestions.domNode, 'display', 'block');
      },

      _showValidationErrorTip: function(_dijit) {
        if (!_dijit.validate() && _dijit.domNode) {
          if (_dijit.focusNode) {
            var _disabled = _dijit.get('disabled');
            if (_disabled) {
              _dijit.set('disabled', false);
            }
            _dijit.focusNode.focus();
            setTimeout(lang.hitch(this, function() {
              _dijit.focusNode.blur();
              if (_disabled) {
                _dijit.set('disabled', true);
              }
              _dijit = null;
            }), 100);
          }
        }
      },

      _controlZoomScaleTextBox: function() {
        if(this.panToRadio.get('checked')){
          this.zoomScale.set("disabled", true);
        } else if(this.zoomToRadio.get('checked')){
          this.zoomScale.set("disabled", false);
        }
      },

      _onRadioClicke: function() {
        this._controlZoomScaleTextBox();
      }
    });
  });
