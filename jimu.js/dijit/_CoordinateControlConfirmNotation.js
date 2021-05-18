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

/*global define*/
define([
  'dojo/_base/declare',
  'dojo/_base/Deferred',
  'dojo/_base/lang',
  'dojo/dom-construct',
  'dojo/dom-class',
  'dojo/aspect',
  'dojo/keys',
  'dojo/query',
  'dijit/Dialog',
  'dijit/form/Select',
  'dojo/_base/lang'
], function (
  dojoDeclare,
  dojoDeferred,
  dojoLang,
  dojoDomConstruct,
  dojoDomClass,
  dojoAspect,
  keys,
  dojoQuery,
  dijitDialog,
  dijitSelect,
  lang
) {
  return dojoDeclare([dijitDialog], {
    baseClass: 'jimu-coordinate-control',
    numberOfInputs: 0,
    selectOptions: {},
    comboOptions: {},
    dfd: null,

    constructor: function (options) {
      lang.mixin(this, options);
      this.numberOfInputs = options.options.length;
      this.selectOptions = options.options;
    },

    postCreate: function () {
      this.inherited('postCreate', arguments);

      //Do not show the close button
      this.closable = false;
      this.closeButtonNode.style.display = "none";

      if (this.theme === 'DartTheme') {
        dojoDomClass.add(this.containerNode, 'coordinateControlDialog');
      }

      this.message = dojoDomConstruct.create('div', {
        style: 'margin-bottom: 5px'
      }, this.containerNode, 'first');

      this.message.innerHTML = this.numberOfInputs + " " + this.nls.multipleNotationLabel;

      this.comboOptions = new dijitSelect({
        style: {
          width: '99%'
        },
        'aria-label': this.numberOfInputs + " " + this.nls.multipleNotationLabel
      }, dojoDomConstruct.create('div', {}, this.containerNode, 'last'));
      this.own(dojoAspect.after(this.comboOptions, 'onChange', dojoLang.hitch(this, this._onComboOptionsChanged)));

      for (var i = 0; i < this.selectOptions.length; i++) {
        this.comboOptions.addOption({
          value: this.selectOptions[i].name,
          label: this.selectOptions[i].notationType
        });
      }

      var styleAlignment = 'margin-top:10px;' + ((window.isRTL) ? 'text-align:left' : 'text-align:right');
      this.buttonDiv = dojoDomConstruct.create('div', {
        'class': 'buttonContainer',
        style: styleAlignment
      }, this.containerNode, 'last');

      this.okButton = dojoDomConstruct.create('div', {
        innerHTML: this.nls.applyButtonLabel,
        'class': 'jimu-btn',
        'role': 'button',
        'tabindex': '0',
        'aria-label': this.nls.applyButtonLabel,
        onclick: lang.hitch(this, function () {
          this.hide();
          this.dfd.resolve();
        }),
        onkeypress: lang.hitch(this, function (evt) {
          if (evt.keyCode === keys.ENTER || evt.keyCode === keys.SPACE) {
            this.hide();
            this.dfd.resolve();
          }
        })
      }, this.buttonDiv, 'first');

      this.cancelButton = dojoDomConstruct.create('div', {
        innerHTML: this.nls.cancelButtonLabel,
        'class': 'jimu-btn',
        style: 'margin: 0 5px 0 5px',
        'role': 'button',
        'tabindex': '0',
        'aria-label': this.nls.cancelButtonLabel,
        onclick: lang.hitch(this, function () {
          this.hide();
          this.dfd.cancel();
        }),
        onkeypress: lang.hitch(this, function (evt) {
          if (evt.keyCode === keys.ENTER || evt.keyCode === keys.SPACE) {
            this.hide();
            this.dfd.cancel();
          }
        })
      }, this.buttonDiv, 'last');
    },

    /**
     * Shows the dialog.
     * @return {Deferred}
     */
    show: function () {
      this.inherited('show', arguments);
      this.dfd = new dojoDeferred();
      //Add class to options element
      var optionsElement = this._getDOMElement('.dijitSelectLabel', this.comboOptions.domNode);
      if (optionsElement) {
        dojoDomClass.add(optionsElement, 'dijitSelectLabelConfirmNotation');
      }
      return this.dfd;
    },

    _onComboOptionsChanged: function () {
      //Add class to options element
      var optionsElement = this._getDOMElement('.dijitSelectLabel', this.comboOptions.domNode);
      if (optionsElement) {
        dojoDomClass.add(optionsElement, 'dijitSelectLabelConfirmNotation');
      }
    },

    _getDOMElement: function (className, srcNode) {
      var nl = dojoQuery(className, srcNode);
      if (nl) {
        if (nl.length === 1) {
          return nl[0];
        }
      }
      return null;
    }
  });
});