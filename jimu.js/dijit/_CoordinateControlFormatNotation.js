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
  'dojo/_base/lang',
  'dojo/dom-style',
  'dojo/on',
  'dojo/dom-attr',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dijit/_WidgetsInTemplateMixin',
  'jimu/dijit/formSelect',
  'jimu/dijit/CheckBox'
], function (
  dojoDeclare,
  dojoLang,
  dojoDomStyle,
  dojoOn,
  dojoDomAttr,
  dijitWidgetBase,
  dijitTemplatedMixin,
  dijitWidgetsInTemplate
) {
  'use strict';
  return dojoDeclare([dijitWidgetBase, dijitTemplatedMixin, dijitWidgetsInTemplate], {
    baseClass: 'jimu-coordinate-control',
    templateString: '<div>' +
      '<span class="formatText">${nls.editCoordinateDialogTitle}</span>' +
      '<div class="controlContainer">' +
      '<select tabindex="0" class="selectFormat" data-dojo-attach-point="frmtSelect" ' +
      'aria-label="${nls.editCoordinateDialogTitle}" data-dojo-type="jimu/dijit/formSelect"></select>' +
      '<input tabindex="0" type="text" data-dojo-attach-point="frmtVal" class="formatInput"></input>' +
      '<div class="settingsContainer" data-dojo-attach-point="prefixContainer">' +
      '<div class="formatText" data-dojo-attach-point="addSignChkBox" label="${nls.posNegPrefixLabel}" ' +
      'data-dojo-type="jimu/dijit/CheckBox"/></div></div><div class="btnContainer">' +
      '<div tabindex="0" role="button" aria-label="${nls.applyButtonLabel}" data-dojo-attach-point="applyButton" ' +
      'class="jimu-btn">${nls.applyButtonLabel}</div>' +
      '<div data-dojo-attach-point="cancelButton" tabindex="0" role="button" aria-label="${nls.cancelButtonLabel}" ' +
      'class="jimu-btn formatCoordCancelButton">${nls.cancelButtonLabel}</div></div></div></div>',
    isCanceled: false,
    formats: {},

    setCt: function (v) {
      this.ct = v;
      this.frmtSelect.set('value', this.ct);
    },

    /**
     *
     **/
    postCreate: function () {
      this.formats = {
        DD: {
          defaultFormat: 'YN XE',
          customFormat: null,
          useCustom: false
        },
        DDM: {
          defaultFormat: 'A° B\'N X° Y\'E',
          customFormat: null,
          useCustom: false
        },
        DMS: {
          defaultFormat: 'A° B\' C\"N X° Y\' Z\"E',
          customFormat: null,
          useCustom: false
        },
        GARS: {
          defaultFormat: 'XYQK',
          customFormat: null,
          useCustom: false
        },
        GEOREF: {
          defaultFormat: 'ABCDXY',
          customFormat: null,
          useCustom: false
        },
        MGRS: {
          defaultFormat: 'ZSXY',
          customFormat: null,
          useCustom: false
        },
        USNG: {
          defaultFormat: 'ZSXY',
          customFormat: null,
          useCustom: false
        },
        UTM: {
          defaultFormat: 'ZB X Y',
          customFormat: null,
          useCustom: false
        },
        UTM_H: {
          defaultFormat: 'ZH X Y',
          customFormat: null,
          useCustom: false
        }
      };

      var options = [],
        option;
      //Add options for selected dropdown
      for (var notation in this.formats) {
        option = {
          value: notation,
          label: this.nls.notations[notation]
        };
        options.push(option);
      }
      this.frmtSelect.addOption(options);

      dojoDomAttr.set(this.frmtVal, 'value', this.formats[this.ct].defaultFormat);

      this.own(
        dojoOn(this.frmtSelect, 'change',
          dojoLang.hitch(this, this.frmtSelectValueDidChange)
        ));

      this.own(dojoOn(
        this.frmtVal,
        'change',
        dojoLang.hitch(this, this.formatValDidChange)
      ));

      this.own(
        dojoOn(this.cancelButton,
          'click',
          dojoLang.hitch(this, function () {
            this.isCanceled = true;
          })
        ));

      this.own(
        dojoOn(this.applyButton,
          'click',
          dojoLang.hitch(this, function () {
            this.isCanceled = false;
          })
        ));

      this.displayPrefixContainer();
    },

    /**
     *
     **/
    formatValDidChange: function () {
      var newvalue = dojoDomAttr.get(this.frmtVal, 'value');
      var crdType = this.frmtSelect.get('value');
      this.formats[crdType].customFormat = newvalue;
      this.formats[crdType].useCustom = true;
    },

    /**
     *
     **/
    frmtSelectValueDidChange: function (evt) {
      var selval = this.formats[evt].useCustom ? this.formats[evt].customFormat :
        this.formats[evt].defaultFormat;
      this.ct = evt;
      dojoDomAttr.set(this.frmtVal, 'value', selval);
      this.displayPrefixContainer();
    },

    /**
     *
     **/
    displayPrefixContainer: function () {
      switch (this.ct) {
        case 'DD':
        case 'DDM':
        case 'DMS':
          dojoDomStyle.set(this.prefixContainer, {
            display: ''
          });
          break;
        default:
          dojoDomStyle.set(this.prefixContainer, {
            display: 'none'
          });
          break;
      }
    }

  });
});