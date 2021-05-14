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
  'dojo/_base/array',
  'dojo/_base/lang',
  'dojo/on',
  'dojo/has',
  'dojo/query',
  'dojo/dom-attr',
  'dojo/dom-class',
  'dojo/dom-style',
  'dojo/string',
  'dojo/topic',
  'dojo/keys',
  'dojo/Deferred',
  'dojo/Evented',
  'dojo/dom',
  'dojo/dom-construct',
  'dojo/aspect',
  'jimu/BaseWidget',
  'dijit/_TemplatedMixin',
  'dijit/_WidgetsInTemplateMixin',
  'dijit/registry',
  'dijit/Tooltip',
  'dijit/TooltipDialog',
  'dijit/popup',
  'dojo/text!./templates/CoordinateControl.html',
  'esri/geometry/webMercatorUtils',
  'esri/graphic',
  'esri/geometry/Point',
  'esri/request',
  'esri/SpatialReference',
  'esri/tasks/GeometryService',
  'esri/tasks/ProjectParameters',
  'esri/toolbars/draw',
  'jimu/dijit/Message',
  './_CoordinateControlFormatNotation',
  './_CoordinateControlConfirmNotation',
  'dojo/_base/sniff',
  'dijit/form/TextBox',
  'dijit/form/Textarea',
  'dijit/form/Select',
  'dijit/InlineEditBox'
], function (
  dojoDeclare,
  dojoArray,
  dojoLang,
  dojoOn,
  dojoHas,
  dojoQuery,
  dojoDomAttr,
  dojoDomClass,
  dojoDomStyle,
  dojoString,
  dojoTopic,
  dojoKeys,
  DojoDeferred,
  dojoEvented,
  dojoDom,
  dojoDomConstruct,
  dojoAspect,
  dijitWidgetBase,
  dijitTemplatedMixin,
  dijitWidgetsInTemplate,
  dijitRegistry,
  dijitTooltip,
  DijitTooltipDialog,
  dijitPopup,
  coordCntrl,
  EsriWMUtils,
  EsriGraphic,
  EsriPoint,
  EsriRequest,
  EsriSpatialReference,
  EsriGeometryService,
  EsriProjectParameters,
  EsriDraw,
  JimuMessage,
  CoordFormat,
  ConfirmNotation
) {
  'use strict';
  return dojoDeclare([dijitWidgetBase, dijitTemplatedMixin, dijitWidgetsInTemplate, dojoEvented], {
    templateString: coordCntrl,
    baseClass: 'jimu-coordinate-control',

    /**
    Config parameters:
      parentWidget: widget (mandatory) ->
        the parent widget the control is going to be used in
      input: boolean (optional) ->
        set the control to type input or output
        Default true
      label: string (optional) ->
        label to be used above the coordinate control
        if not set label will not be shown
      showCopyButton: boolean (optional) ->
        is copy notation button shown
        Default false
      showFormatButton: boolean (optional) ->
        is format notation button shown
        Default false
      zoomScale: number (optional) ->
        if not set, the zoom button will not be shown
      showDeleteButton: boolean (optional) ->
        is delete button shown (only used if input set to false)
        Default true
      showExpandButton: boolean (optional) ->
        is expand button shown (only used if input set to false)
        Default true
      drawButtonLabel: string (optional) ->
        if not set, the draw button button will not be shown
      drawToolTip: string (optional) ->
        tooltip to be used on draw point
        if not set default tooltip will be used from main nls file
      graphicsLayer: graphicsLayer (optional) ->
        The graphics layer to place current map point on
        if not supplied no graphics will be drawn on map
      type: string (optional) ->
        default notation format. Available Types:
        DD, DDM, DMS, GARS, GEOREF, MGRS, USNG, UTM, UTM_H
        Default DD

    Methods:
      getFormattedCoordinateText: Returns the sanitized formatted coordinate
      getCurrentMapCoordinate: Returns the current map coordinate
      getMapCoordinateDD: Returns the current map coordinate in DD

    Event:
      get-coordinate-complete: Fired when coordinates are returned in sanitized format.
    */

    parentWidget: null,
    input: true,
    label: null,
    showCopyButton: false,
    showFormatButton: false,
    zoomScale: null,
    showDeleteButton: true,
    showExpandButton: true,
    showDrawPoint: true,
    drawButtonLabel: null,
    drawToolTip: null,
    graphicsLayer: null,
    type: 'DD',
    inputFromText: true,
    addSign: false,
    hasCustomLabel: false,

    /**
     *
     **/
    postMixInProperties: function () {
      this.nls = window.jimuNls.coordinateControl;
      this.isRenderIdForAttrs = true;
    },

    /**
     *
     **/
    constructor: function (args) {
      dojoDeclare.safeMixin(this, args);
      this.uid = args.id || dijitRegistry.getUniqueId('cc');

      if (this.parentWidget === null) {
        console.error('No parentWidget parameter supplied: ' +
          'Parameter is mandatory');
      }

      if (this.label === null) {
        console.info('No label parameter supplied (optional): ' +
          'Coordinate Control will have no label');
      }

      if (this.zoomScale === null) {
        console.info('No zoomScale parameter supplied (optional): ' +
          'Coordinate Control will have no zoom button');
      }

      if (this.drawButtonLabel === null) {
        console.info('No drawButtonLabel parameter supplied (optional): ' +
          'Coordinate Control will have no draw button');
      }

      if (this.graphicsLayer === null) {
        console.info('No graphicsLayer parameter supplied: ' +
          'Input graphics will not be shown on map');
      }
    },

    /**
     *
     **/
    postCreate: function () {
      this._frmtdlg = new DijitTooltipDialog({
        id: this.uid + '_formatCoordinateTooltip',
        content: new CoordFormat({
          nls: this.nls,
          ct: this.type
        }),
        style: 'width: 400px',
        onClose: dojoLang.hitch(this, this.popupDidClose)
      });
      //Set focus to the form select once the tooltip is opened
      dojoAspect.after(this._frmtdlg, "onShow", dojoLang.hitch(this, function () {
        this._frmtdlg.content.frmtSelect.focus();
      }));
      //Set focus back bto the format settings button once the tooltip is closed
      dojoAspect.after(this._frmtdlg, "onClose", dojoLang.hitch(this, function () {
        this.formatButton.focus();
      }));
      //Close the tooltip on ESCAPE key press
      this.own(dojoOn(this._frmtdlg, "keydown", dojoLang.hitch(this, function (evt) {
        if (evt.keyCode === dojoKeys.ESCAPE) {
          dijitPopup.close(this._frmtdlg);
        }
      })));
      if (this.parentWidget.appConfig.theme.name === 'DartTheme') {
        dojoDomClass.add(this._frmtdlg.domNode, 'coordinateControlDialog');
      }
      if (this.defaultFormat) {
        this._frmtdlg.content.formats[this.type].defaultFormat = this.defaultFormat;
      }
      this.geomsrvc = new EsriGeometryService(this.parentWidget.appConfig.geometryService);
      this.dt = new EsriDraw(this.parentWidget.map);
      this.initUI();
      this.setUIListeners();
    },

    /**
     *
     **/
    initUI: function () {
      // show label above control
      if (this.label === null) {
        this.setHidden(this.coordNameContainer, false);
      } else {
        this.coordName.setValue(this.label);
      }
      if (this.input) {
        this.zoomButton.parentNode.style.display = "none";
        // hide any actions we don't want to see on the input coords
        this.setHidden(this.expandButton, true); //we never want to show expand button on input
        this.setHidden(this.removeControlBtn, true); //we never want to show delete on input
        this.coordName.set("disabled", "disabled"); //disable the edit function of the inline edit box
        this.coordName.set('value', this.label + " (" + this._frmtdlg.content.ct + ")");
        if (this.showDrawPoint) {
          this.drawPointButton.title = this.drawButtonLabel;
          if (this.drawToolTip === null) {
            this.drawToolTip = this.nls.tooltip;
          }
        } else {
          // if no drawButtonLabel supplied hide button
          this.setHidden(this.drawPointButton, true);
        }
      } else {
        //for an output control set the text area to read only
        this.coordtext.disabled = true;
        this.setHidden(this.drawPointButton, true); //we never want to show draw button on output
        if (!this.showExpandButton) {
          this.setHidden(this.expandButton, true);
          dojoDomClass.remove(this.domNode, "coordinateContainer");
          dojoDomClass.add(this.domNode, "outputCoordinateContainer");
          dojoDomClass.add(this.cpbtn, 'outputCopyBtn');
          this.coordtext.readOnly = true;
        }
        if (!this.showDeleteButton) {
          this.setHidden(this.removeControlBtn, true);
        }
      }
      if (!this.showCopyButton) {
        this.setHidden(this.cpbtn, true);
        dojoDomClass.add(this.cpbtn, 'inputCopyBtn');
        dojoDomAttr.set(this.cpbtn, 'title', this.nls.copyAll);
      }
      if (!this.showFormatButton) {
        this.setHidden(this.formatButton, true);
      }
      if (this.zoomScale === null) {
        this.setHidden(this.zoomButton, true);
      }
      this.formatButton.title = (this.input) ? this.nls.formatInput : this.nls.formatOutput;
      dojoDomAttr.set(this.formatButton, "aria-label", this.formatButton.title);
    },

    /**
     *
     **/
    setUIListeners: function () {
      if (!this.input) {
        dojoTopic.subscribe(
          'INPUTPOINTDIDCHANGE',
          dojoLang.hitch(this, this.mapWasClicked)
        );
      }

      dojoTopic.subscribe(
        'INPUTERROR',
        dojoLang.hitch(this, this.inputError)
      );

      // listen for dijit events
      this.own(dojoOn(
        this.expandButton,
        'click',
        dojoLang.hitch(this, this.expandButtonWasClicked)
      ));

      this.own(dojoOn(
        this.expandButton,
        'keydown',
        dojoLang.hitch(this, function (evt) {
          if (evt.keyCode === dojoKeys.ENTER || evt.keyCode === dojoKeys.SPACE) {
            this.expandButtonWasClicked(evt);
            //Prevent the scrolling of panel when the SPACE key is pressed.
            evt.preventDefault();
          }
        })));

      this.own(dojoOn(
        this.zoomButton,
        'click',
        dojoLang.hitch(this, this.zoomButtonWasClicked)
      ));

      this.own(dojoOn(
        this.zoomButton,
        'keydown',
        dojoLang.hitch(this, function (evt) {
          if (evt.keyCode === dojoKeys.ENTER || evt.keyCode === dojoKeys.SPACE) {
            this.zoomButtonWasClicked(evt);
          }
        })));

      this.own(dojoOn(
        this.coordName,
        'change',
        dojoLang.hitch(this, this.coordNameDidChange)
      ));

      this.cpbtn.addEventListener(
        'click',
        dojoLang.hitch(this, this.cpBtnWasClicked)
      );

      this.own(dojoOn(
        this.cpbtn,
        'keydown',
        dojoLang.hitch(this, function (evt) {
          if (evt.keyCode === dojoKeys.ENTER || evt.keyCode === dojoKeys.SPACE) {
            this.cpBtnWasClicked(evt);
          }
        })));

      this.subVal1CpBtn.addEventListener(
        'click',
        dojoLang.hitch(this, this.cpSubBtnWasClicked)
      );

      this.own(dojoOn(
        this.subVal1CpBtn,
        'keydown',
        dojoLang.hitch(this, function (evt) {
          if (evt.keyCode === dojoKeys.ENTER || evt.keyCode === dojoKeys.SPACE) {
            this.cpSubBtnWasClicked(evt);
          }
        })));

      this.subVal2CpBtn.addEventListener(
        'click',
        dojoLang.hitch(this, this.cpSubBtnWasClicked)
      );

      this.own(dojoOn(
        this.subVal2CpBtn,
        'keydown',
        dojoLang.hitch(this, function (evt) {
          if (evt.keyCode === dojoKeys.ENTER || evt.keyCode === dojoKeys.SPACE) {
            this.cpSubBtnWasClicked(evt);
          }
        })));

      this.subVal3CpBtn.addEventListener(
        'click',
        dojoLang.hitch(this, this.cpSubBtnWasClicked)
      );

      this.own(dojoOn(
        this.subVal3CpBtn,
        'keydown',
        dojoLang.hitch(this, function (evt) {
          if (evt.keyCode === dojoKeys.ENTER || evt.keyCode === dojoKeys.SPACE) {
            this.cpSubBtnWasClicked(evt);
          }
        })));

      this.subVal4CpBtn.addEventListener(
        'click',
        dojoLang.hitch(this, this.cpSubBtnWasClicked)
      );

      this.own(dojoOn(
        this.subVal4CpBtn,
        'keydown',
        dojoLang.hitch(this, function (evt) {
          if (evt.keyCode === dojoKeys.ENTER || evt.keyCode === dojoKeys.SPACE) {
            this.cpSubBtnWasClicked(evt);
          }
        })));

      this.own(dojoOn(
        this.formatButton,
        'click',
        dojoLang.hitch(this, this.formatButtonWasClicked)
      ));

      this.own(dojoOn(
        this.formatButton,
        'keydown',
        dojoLang.hitch(this, function (evt) {
          if (evt.keyCode === dojoKeys.ENTER || evt.keyCode === dojoKeys.SPACE) {
            this.formatButtonWasClicked(evt);
          }
        })));

      this.own(dojoOn(
        this.drawPointButton,
        'click',
        dojoLang.hitch(this, this.drawPointButtonWasClicked)
      ));

      this.own(dojoOn(
        this.drawPointButton,
        'keydown',
        dojoLang.hitch(this, function (evt) {
          if (evt.keyCode === dojoKeys.ENTER || evt.keyCode === dojoKeys.SPACE) {
            this.drawPointButtonWasClicked(evt);
          }
        })));

      this.own(dojoOn(
        this.removeControlBtn,
        'keydown',
        dojoLang.hitch(this, function (evt) {
          if (evt.keyCode === dojoKeys.ENTER || evt.keyCode === dojoKeys.SPACE) {
            this.remove();
          }
        })));

      this.own(dojoOn(this._frmtdlg.content.applyButton, 'click',
        dojoLang.hitch(this, this.formatDialogApplyButtonClicked)));

      this.own(dojoOn(this._frmtdlg.content.applyButton, 'keydown',
        dojoLang.hitch(this, function (evt) {
          if (evt.keyCode === dojoKeys.ENTER || evt.keyCode === dojoKeys.SPACE) {
            this.formatDialogApplyButtonClicked();
          }
        })));

      this.own(dojoOn(this._frmtdlg.content.cancelButton, 'click',
        dojoLang.hitch(this, function () {
          dijitPopup.close(this._frmtdlg);
        })));

      this.own(dojoOn(this._frmtdlg.content.cancelButton, 'keydown',
        dojoLang.hitch(this, function (evt) {
          if (evt.keyCode === dojoKeys.ENTER || evt.keyCode === dojoKeys.SPACE) {
            dijitPopup.close(this._frmtdlg);
          }
        })));

      this.own(dojoOn(
        this.coordtext,
        'keydown',
        dojoLang.hitch(this, this.coordTextInputKeyWasPressed)
      ));

      this.own(dojoOn(this.coordtext, 'input', dojoLang.hitch(this, function () {
        this.currentClickPointDD = null;
        if (this.zoomButton.parentNode) {
          this.zoomButton.parentNode.style.display = "none";
        }
        this.emit('coordinates-deleted', {});
      })));

      this.own(this.geomsrvc.on('error', dojoLang.hitch(
        this,
        this.geomSrvcDidFail)));

      this.own(dojoOn(
        this.dt,
        'draw-complete',
        dojoLang.hitch(this, this.drawComplete)
      ));

      this.own(dojoAspect.after(this.parentWidget, 'onClose', dojoLang.hitch(this, function () {
        if (this.input) {
          if (dojoDomClass.contains(this.drawPointButton, 'drawPointBtn-active')) {
            this.deactivateDrawTool();
          }
        }
        if (this._frmtdlg && this._frmtdlg.domNode.offsetParent &&
          this.parentWidget.state === "closed") {
          dijitPopup.close(this._frmtdlg);
        }
      })));

      this.own(dojoAspect.after(this.parentWidget, 'onOpen', dojoLang.hitch(this, function () {
        var widgetContainer = this.parentWidget.getParent().getParent().domNode;
        this.own(dojoOn(widgetContainer, 'click', dojoLang.hitch(this, function (evt) {
          if (evt.target.className !== "settingBtn" &&
            this._frmtdlg && this._frmtdlg.domNode.offsetParent &&
            this.parentWidget.state === "active") {
            dijitPopup.close(this._frmtdlg);
          }
        })));
      })));
    },

    /**
     * Listen for apply button click event
     **/
    formatDialogApplyButtonClicked: function () {
      this.type = this._frmtdlg.content.ct;
      this.updateDisplay();
      if (this.input) {
        this.coordName.set('value', this.label + " (" + this._frmtdlg.content.ct + ")");
      } else {
        if (this.hasCustomLabel) {
          this.coordName.set('value', this.label);
        }
      }
      dijitPopup.close(this._frmtdlg);
    },

    /**
     *
     **/
    popupDidClose: function () {
      var isCanceled = this._frmtdlg.content.isCanceled;
      if (isCanceled) {
        if (this.addSign !== this._frmtdlg.content.addSignChkBox.checked) {
          this._frmtdlg.content.addSignChkBox.checked = this.addSign;
        }
        return;
      }
      this.addSign = this._frmtdlg.content.addSignChkBox.checked;
      var fv = this._frmtdlg.content.ct;
      if (this.type !== fv) {
        this.type = fv;
        this.updateDisplay();
      }
    },

    coordNameDidChange: function () {
      this.hasCustomLabel = true;
    },

    /**
     *
     **/
    cpSubBtnWasClicked: function (evt) {
      var c = evt.currentTarget.id.split('~')[0];
      var s;
      this[c].select();
      try {
        s = document.execCommand('copy');
      } catch (err) {
        s = false;
      }
      var t = s ? this.nls.copySuccessful : this.nls.copyFailed;
      this.showToolTip(evt.currentTarget.id, t);
    },

    /**
     *
     **/
    cpBtnWasClicked: function (evt) {
      evt.preventDefault();
      var s, t, tv, fw, w;
      if (this.input) {
        fw = dijitRegistry.toArray().filter(function (w) {
          return w.baseClass === 'jimu-coordinate-control' && !w.input;
        });

        w = fw.map(function (w) {
          if (w.coordtext) {
            return w.coordtext.value;
          }
        }).join('\r\n');

        tv = this.coordtext.value;
        w = tv + '\r\n' + w;
        this.coordtext.value = w;

        this.selectText(this.coordtext);

        try {
          s = document.execCommand('copy');
        } catch (caerr) {
          s = false;
        }
        this.coordtext.value = tv;
      } else {
        this.selectText(this.coordtext);
        try {
          s = document.execCommand('copy');
        } catch (cerr) {
          s = false;
        }
      }
      t = s ? this.nls.copySuccessful : this.nls.copyFailed;
      this.showToolTip(this.cpbtn.id, t);
    },

    /**
     * Creates a selection in a textbox
     * @param {textbox} component
     */
    selectText: function (component) {
      // Create a selection
      var selection = document.getSelection();
      // Remove all previous selections
      selection.removeAllRanges();
      // Set focus on the target component
      component.focus();

      // Check if Edge or IE11
      var isEdge = /Edge/.test(navigator.userAgent);
      var isIE11 = !!window.MSInputMethodContext && !!document.documentMode;

      // Cases for Firefox, Chrome and Safari
      if (dojoHas("ff") || dojoHas("chrome") || dojoHas("safari")) {
        if (!this.input && this.coordtext.disabled) {
          this.coordtext.disabled = false;
          component.select();
          this.coordtext.disabled = true;
        } else {
          component.select();
        }
      }

      // Case for Edge
      if (isEdge) {
        component.select();
      }

      // Cases for IE11
      if (isIE11) {
        var range = document.createRange();
        range.selectNode(component);
        selection.addRange(range);
      }
    },

    /**
     *
     **/
    showToolTip: function (onId, withText) {
      var n = dojoDom.byId(onId);
      dijitTooltip.show(withText, n);
      setTimeout(function () {
        dijitTooltip.hide(n);
      }, 1000);
    },

    /**
     *
     **/
    geomSrvcDidComplete: function (r) {
      if (r[0].length <= 0) {
        new JimuMessage({
          message: this.nls.parseCoordinatesError
        });
        dojoTopic.publish('INPUTERROR');
        return;
      }
      var newpt = new EsriPoint(r[0][0], r[0][1], new EsriSpatialReference({
        wkid: 4326
      }));
      this.currentClickPointDD = this.currentClickPoint = newpt;
      if (this.input) {
        this.parentWidget.map.centerAt(this.currentClickPointDD);
        this.updateDisplay();
        dojoTopic.publish('INPUTPOINTDIDCHANGE', {
          mapPoint: this.currentClickPointDD,
          inputFromText: true
        });
      }
    },

    /**
     *
     **/
    geomSrvcDidFail: function () {
      new JimuMessage({
        message: this.nls.parseCoordinatesError
      });
      dojoTopic.publish('INPUTERROR');
    },

    /**
     * Handles enter key press event
     **/
    coordTextInputKeyWasPressed: function (evt) {
      if (evt.keyCode === dojoKeys.ENTER) {
        evt.preventDefault();
        var sanitizedInput = this.getCleanInput(evt.currentTarget.value);
        this.getCoordinateType(sanitizedInput).then(dojoLang.hitch(this, function (itm) {
          if (itm) {
            if (itm.length === 1) {
              var withStr = this.processCoordTextInput(sanitizedInput, itm[0], false);
              this.getXYNotation(withStr, itm[0].conversionType).then(
                dojoLang.hitch(this, function (r) {
                  if (r[0].length > 0) {
                    this.geomSrvcDidComplete(r);
                  } else {
                    this.geomSrvcDidFail();
                  }
                }));
            } else {
              if (!this.confirmNotationDialog) {
                this.confirmNotationDialog = new ConfirmNotation({
                  title: this.nls.comfirmInputNotation,
                  nls: this.nls,
                  options: itm,
                  style: "width: 400px",
                  hasSkipCheckBox: false,
                  theme: this.parentWidget.appConfig.theme.name
                });
              }

              this.confirmNotationDialog.show().then(dojoLang.hitch(this, function () {
                var singleMatch = dojoArray.filter(itm, function (singleItm) {
                  return singleItm.name === this.confirmNotationDialog.comboOptions.get('value');
                }, this);
                var withStr = this.processCoordTextInput(sanitizedInput, singleMatch[0], false);
                this.getXYNotation(withStr, singleMatch[0].conversionType).then(
                  dojoLang.hitch(this, function (r) {
                    if (r[0].length > 0) {
                      this.geomSrvcDidComplete(r);
                    } else {
                      this.geomSrvcDidFail();
                    }
                  }));
              }, function () {
                //THROW ERROR
              }));
            }
          } else {
            new JimuMessage({
              message: this.nls.parseCoordinatesError
            });
            dojoTopic.publish('INPUTERROR');
          }
        }));
        dojoDomAttr.set(this.coordtext, 'value', sanitizedInput);
        this.emit('get-coordinate-complete', sanitizedInput);
        this.currentClickPoint = null;
        if (this.zoomButton.parentNode) {
          this.zoomButton.parentNode.style.display = "inline-block";
        }
      }
      // Clear everything if user deleted coordinates
      if ((evt.keyCode === dojoKeys.BACKSPACE) || (evt.keyCode === dojoKeys.DELETE)) {
        this.clear();
        this.currentClickPointDD = null;
        if (this.zoomButton && this.zoomButton.parentNode) {
          this.zoomButton.parentNode.style.display = "none";
        }
        this.emit('coordinates-deleted', {});
      }
    },

    /**
     * Returns the sanitized formatted coordinate
     */
    getFormattedCoordinateText: function () {
      return this.coordtext.value;
    },

    /**
     * Returns the current map coordinate
     */
    getCurrentMapCoordinate: function () {
      return this.currentClickPoint;
    },

    /**
     * Returns the current map coordinate in DD
     */
    getMapCoordinateDD: function () {
      return this.currentClickPointDD;
    },

    /**
     * Deactivates the draw tool
     */
    deactivateDrawTool: function () {
      this.dt.deactivate();
      dojoDomClass.remove(this.drawPointButton, 'drawPointBtn-active');
    },

    /**
     *
     **/
    processCoordTextInput: function (withStr, asType, testingMode) {
      var match = asType.pattern.exec(withStr);
      var northSouthPrefix, northSouthSuffix,
        eastWestPrefix, eastWestSuffix,
        latDeg, longDeg, latMin,
        longMin, latSec, longSec;
      var prefixSuffixError = false;
      var conversionType = asType.name;

      switch (asType.name) {
        case 'DD':
          northSouthPrefix = match[2];
          northSouthSuffix = match[7];
          eastWestPrefix = match[10];
          eastWestSuffix = match[16];
          latDeg = match[3].replace(/[,:]/, '.');
          longDeg = match[11].replace(/[,:]/, '.');
          conversionType = 'DD';
          break;
        case 'DDrev':
          northSouthPrefix = match[11];
          northSouthSuffix = match[16];
          eastWestPrefix = match[2];
          eastWestSuffix = match[8];
          latDeg = match[12].replace(/[,:]/, '.');
          longDeg = match[3].replace(/[,:]/, '.');
          conversionType = 'DD';
          break;
        case 'DDM':
          northSouthPrefix = match[2];
          northSouthSuffix = match[7];
          eastWestPrefix = match[10];
          eastWestSuffix = match[15];
          latDeg = match[3];
          latMin = match[4].replace(/[,:]/, '.');
          longDeg = match[11];
          longMin = match[12].replace(/[,:]/, '.');
          conversionType = 'DDM';
          break;
        case 'DDMrev':
          northSouthPrefix = match[10];
          northSouthSuffix = match[15];
          eastWestPrefix = match[2];
          eastWestSuffix = match[7];
          latDeg = match[11];
          latMin = match[12].replace(/[,:]/, '.');
          longDeg = match[3];
          longMin = match[4].replace(/[,:]/, '.');
          conversionType = 'DDM';
          break;
        case 'DMS':
          northSouthPrefix = match[2];
          northSouthSuffix = match[8];
          eastWestPrefix = match[11];
          eastWestSuffix = match[17];
          latDeg = match[3];
          latMin = match[4];
          latSec = match[5].replace(/[,:]/, '.');
          longDeg = match[12];
          longMin = match[13];
          longSec = match[14].replace(/[,:]/, '.');
          conversionType = 'DMS';
          break;
        case 'DMSrev':
          northSouthPrefix = match[11];
          northSouthSuffix = match[17];
          eastWestPrefix = match[2];
          eastWestSuffix = match[8];
          latDeg = match[12];
          latMin = match[13];
          latSec = match[14].replace(/[,:]/, '.');
          longDeg = match[3];
          longMin = match[4];
          longSec = match[5].replace(/[,:]/, '.');
          conversionType = 'DMS';
          break;
      }

      //check for north/south prefix/suffix
      if (northSouthPrefix && northSouthSuffix) {
        prefixSuffixError = true;
        if (new RegExp(/[Ss-]/).test(northSouthPrefix)) {
          northSouthPrefix = '-';
        } else {
          northSouthPrefix = '+';
        }
      } else {
        if (northSouthPrefix && new RegExp(/[Ss-]/).test(northSouthPrefix)) {
          northSouthPrefix = '-';
        } else {
          if (northSouthSuffix && new RegExp(/[Ss-]/).test(northSouthSuffix)) {
            northSouthPrefix = '-';
          } else {
            northSouthPrefix = '+';
          }
        }
      }

      //check for east/west prefix/suffix
      if (eastWestPrefix && eastWestSuffix) {
        prefixSuffixError = true;
        if (new RegExp(/[Ww-]/).test(eastWestPrefix)) {
          eastWestPrefix = '-';
        } else {
          eastWestPrefix = '+';
        }
      } else {
        if (eastWestPrefix && new RegExp(/[Ww-]/).test(eastWestPrefix)) {
          eastWestPrefix = '-';
        } else {
          if (eastWestSuffix && new RegExp(/[Ww-]/).test(eastWestSuffix)) {
            eastWestPrefix = '-';
          } else {
            eastWestPrefix = '+';
          }
        }
      }

      //give user warning if lat or long is determined as having a prefix and suffix
      if (prefixSuffixError) {
        if (!testingMode) {
          new JimuMessage({
            message: this.nls.latLongWarningMessage
          });
        }
      }

      switch (conversionType) {
        case 'DD':
          withStr = northSouthPrefix + latDeg + ',' + eastWestPrefix + longDeg;
          break;
        case 'DDM':
          withStr = northSouthPrefix + latDeg +
            ' ' + latMin + ',' + eastWestPrefix +
            longDeg + ' ' + longMin;
          break;
        case 'DMS':
          withStr = northSouthPrefix + latDeg + ' ' +
            latMin + ' ' + latSec + ',' + eastWestPrefix +
            longDeg + ' ' + longMin + ' ' + longSec;
          break;
        default:
          withStr = withStr;
          break;
      }
      return withStr;
    },

    /**
     *
     **/
    zoomButtonWasClicked: function () {
      if (this.currentClickPointDD) {
        if (this.parentWidget.map.getZoom() < this.zoomScale) {
          this.parentWidget.map.centerAt(this.currentClickPointDD).then(
            dojoLang.hitch(this, function () {
              this.parentWidget.map.setScale(this.zoomScale);
            })
          );
        } else {
          this.parentWidget.map.centerAt(this.currentClickPointDD);
        }
      }
    },

    /**
     *
     **/
    setHidden: function (cntrl, shouldDestroy) {
      dojoDomStyle.set(cntrl, 'display', 'none');
      if (shouldDestroy) {
        dojoDomConstruct.destroy(cntrl.parentNode);
      }
    },

    /**
     *
     **/
    setVisible: function (cntrl) {
      dojoDomStyle.set(cntrl, 'display', 'inline-flex');
    },

    /**
     *
     **/
    remove: function () {
      if (this._frmtdlg && this._frmtdlg.domNode.offsetParent) {
        dijitPopup.close(this._frmtdlg);
      }
      this.destroyRecursive();
      this.emit('removeCoordsControl');
    },

    /**
     *
     **/
    mapWasClicked: function (evt) {
      this.currentClickPoint = evt.mapPoint;
      this.getDDPoint(evt.mapPoint).then(dojoLang.hitch(this, function (mapPoint) {
        this.currentClickPointDD = mapPoint;
        this.currentClickPointDDDD = mapPoint;
        if (evt.inputFromText) {
          this.inputFromText = true;
        } else {
          this.inputFromText = false;
        }
        this.updateDisplay();
      }), dojoLang.hitch(this,
        function (err) {
          console.error(err);
        }
      ));
    },

    /**
     *
     **/
    getDDPoint: function (fromPoint) {
      var def = new DojoDeferred();
      var webMerc = new EsriSpatialReference(3857);
      if (EsriWMUtils.canProject(fromPoint, webMerc)) {
        // if the point is in geographics or can be projected to geographics do so
        def.resolve(EsriWMUtils.webMercatorToGeographic(EsriWMUtils.project(fromPoint, webMerc)));
      } else {
        // if the point is NOT geographics and can NOT be projected to geographics
        // Find the most appropriate geo transformation and project the point to geographic
        var args = {
          url: this.geomsrvc.url + '/findTransformations',
          content: {
            f: 'json',
            inSR: fromPoint.spatialReference.wkid,
            outSR: 4326,
            extentOfInterest: JSON.stringify(this.parentWidget.map.extent) // jshint ignore:line
          },
          handleAs: 'json',
          callbackParamName: 'callback'
        };
        new EsriRequest(args, {
          usePost: false
        }).then(dojoLang.hitch(this, function (response) {
          var transformations = response && response.transformations ?
            response.transformations : undefined;
          var wkid = transformations && transformations.length > 0 ?
            transformations[0].wkid : undefined;
          var pp = new EsriProjectParameters();
          pp.outSR = new EsriSpatialReference(4326);
          pp.geometries = [fromPoint];
          pp.transformForward = true;
          pp.transformation = wkid;
          this.geomsrvc.project(pp, dojoLang.hitch(this, function (r) {
            def.resolve(r[0]);
          }), function (err) {
            def.reject(err);
          });
        }), dojoLang.hitch(this, function (err) {
          def.reject(err);
        }));
      }
      return def;
    },

    /**
     *
     **/
    getProjectedPoint: function (fromPoint) {
      var def = new DojoDeferred();
      if (EsriWMUtils.canProject(fromPoint, this.parentWidget.map)) {
        // if the geographic point can be projected the map spatial reference do so
        def.resolve(EsriWMUtils.geographicToWebMercator(fromPoint));
      } else {
        // if the point can NOT be projected to the maps spatial reference
        // find the most appropriate geo transformation and project the point to the map SR
        var args = {
          url: this.geomsrvc.url + '/findTransformations',
          content: {
            f: 'json',
            inSR: 4326,
            outSR: this.parentWidget.map.spatialReference.wkid,
            extentOfInterest: JSON.stringify(this.parentWidget.map.extent) // jshint ignore:line
          },
          handleAs: 'json',
          callbackParamName: 'callback'
        };
        new EsriRequest(args, {
          usePost: false
        }).then(dojoLang.hitch(this, function (response) {
          var transformations = response && response.transformations ?
            response.transformations : undefined;
          var wkid = transformations && transformations.length > 0 ?
            transformations[0].geoTransforms[0].wkid : undefined;
          var pp = new EsriProjectParameters();
          pp.outSR = new EsriSpatialReference(this.parentWidget.map.spatialReference);
          pp.geometries = [fromPoint];
          pp.transformForward = true;
          pp.transformation = wkid;
          this.geomsrvc.project(pp, dojoLang.hitch(this, function (r) {
            def.resolve(r[0]);
          }), function (err) {
            def.reject(err);
          });
        }), dojoLang.hitch(this, function (err) {
          def.reject(err);
        }));
      }
      return def;
    },

    /**
     *
     **/
    expandButtonWasClicked: function () {
      dojoDomClass.toggle(this.coordcontrols, 'expanded');
      if (dojoDomClass.contains(this.coordcontrols, 'expanded')) {
        dojoDomClass.remove(this.expandButton, "expandBtn");
        dojoDomClass.add(this.expandButton, "collapseBtn");
        dojoDomAttr.set(this.expandButton, "aria-expanded", "true");
      } else {
        dojoDomClass.remove(this.expandButton, "collapseBtn");
        dojoDomClass.add(this.expandButton, "expandBtn");
        dojoDomAttr.set(this.expandButton, "aria-expanded", "false");
      }
      // if this.coordcontrols is expanded then disable all it's children
      this.setSubCoordUI(dojoDomClass.contains(this.coordcontrols, 'expanded'));
      this._setCoordControlsTabindex(dojoDomClass.contains(this.coordcontrols, 'expanded'));
      this.emit("expandButtonClicked", dojoDomClass.contains(this.coordcontrols, 'expanded'));
    },

    /**
     * Set tab index to all the focusable elements inside coord control section
     * based on the expand/collapse state
     **/
    _setCoordControlsTabindex: function (isExpanded) {
      var existingTabIndex, tabIndexValue, allNodes = [];
      if (isExpanded) {
        tabIndexValue = 0;
        existingTabIndex = -1;
      } else {
        tabIndexValue = -1;
        existingTabIndex = 0;
      }
      allNodes = dojoQuery("input[tabindex='" + existingTabIndex + "']", this.coordcontrols);
      allNodes = allNodes.concat(dojoQuery("span[tabindex='" + existingTabIndex + "']", this.coordcontrols));
      dojoArray.forEach(allNodes, dojoLang.hitch(this, function (coordsNode) {
        dojoDomAttr.set(coordsNode, "tabindex", tabIndexValue);
      }));


    },

    /**
     *
     **/
    formatButtonWasClicked: function () {
      this._frmtdlg.content.setCt(this.type);
      dijitPopup.open({
        popup: this._frmtdlg,
        around: this.formatButton
      });
    },

    /**
     *
     **/
    drawPointButtonWasClicked: function () {
      if (dojoDomClass.contains(this.drawPointButton, 'drawPointBtn-active')) {
        //already selected so deactivate draw tool
        this.dt.deactivate();
        this.parentWidget.map.enableMapNavigation();
      } else {
        this.parentWidget.map.disableMapNavigation();
        this.dt.activate(EsriDraw.POINT);
        var tooltip = this.dt._tooltip;
        if (tooltip) {
          tooltip.innerHTML = this.drawToolTip;
        }
      }
      dojoDomClass.toggle(this.drawPointButton, 'drawPointBtn-active');
    },

    drawComplete: function (results) {
      var evt = {};
      evt.mapPoint = results.geometry;
      this.parentWidget.map.enableMapNavigation();
      this.mapWasClicked(evt);
    },

    /**
     *
     **/
    setSubCoordUI: function (expanded) {
      if (expanded) {
        var cntrHeight = '165px';
        switch (this.type) {
          case 'DD':
          case 'DMS':
          case 'DDM':
            this.sub1label.innerHTML = 'Lat';
            this.sub2label.innerHTML = 'Lon';
            this.setHidden(this.sub3, false);
            this.setHidden(this.sub4, false);
            cntrHeight = '90px';
            break;
          case 'GARS':
            this.sub1label.innerHTML = 'Lon';
            this.sub2label.innerHTML = 'Lat';
            this.sub3label.innerHTML = 'Quadrant';
            this.sub4label.innerHTML = 'Key';
            this.setVisible(this.sub3);
            this.setVisible(this.sub4);
            break;
          case 'GEOREF':
            this.sub1label.innerHTML = '15° Quad';
            this.sub2label.innerHTML = '1° Quad';
            this.sub3label.innerHTML = 'Easting';
            this.setVisible(this.sub3);
            this.sub4label.innerHTML = 'Northing';
            this.setVisible(this.sub4);
            break;
          case 'USNG':
          case 'MGRS':
            this.sub1label.innerHTML = 'GZD';
            this.sub2label.innerHTML = 'Grid Sq';
            this.sub3label.innerHTML = 'Easting';
            this.sub4label.innerHTML = 'Northing';
            this.setVisible(this.sub3);
            this.setVisible(this.sub4);
            break;
          case 'UTM':
            this.sub1label.innerHTML = 'Zone';
            this.sub2label.innerHTML = 'Band';
            this.sub3label.innerHTML = 'Easting';
            this.sub4label.innerHTML = 'Northing';
            this.setVisible(this.sub3);
            this.setVisible(this.sub4);
            break;
          case 'UTM_H':
            this.sub1label.innerHTML = 'Zone';
            this.sub2label.innerHTML = 'Hemisphere';
            this.sub3label.innerHTML = 'Easting';
            this.sub4label.innerHTML = 'Northing';
            this.setVisible(this.sub3);
            this.setVisible(this.sub4);
            break;
        }
        dojoDomStyle.set(this.coordcontrols, "display", "block");
        dojoDomStyle.set(this.coordcontrols, 'height', cntrHeight);
        dojoDomStyle.set(this.coordcontrols, 'width', '300px');
      } else {
        dojoDomStyle.set(this.coordcontrols, "display", "none");
        dojoDomStyle.set(this.coordcontrols, 'height', '0px');
      }
      var cntrlid = this.uid.split('_')[1];
      dojoDomAttr.set(this['cc_' + cntrlid + 'sub1val'], "aria-label", this.sub1label.innerHTML);
      dojoDomAttr.set(this['cc_' + cntrlid + 'sub2val'], "aria-label", this.sub2label.innerHTML);
      dojoDomAttr.set(this['cc_' + cntrlid + 'sub3val'], "aria-label", this.sub3label.innerHTML);
      dojoDomAttr.set(this['cc_' + cntrlid + 'sub4val'], "aria-label", this.sub4label.innerHTML);
    },

    /**
     *
     **/
    setCoordUI: function (withValue) {
      var formattedStr;
      if (withValue) {
        var cntrlid = this.uid.split('_')[1];

        // make sure we haven't been removed
        if (!this['cc_' + cntrlid + 'sub1val']) {
          return;
        }

        if (this.input && this.inputFromText) {
          return;
        } else {
          var format;
          var f = this._frmtdlg.content.formats[this.type];
          var r;

          if (f.useCustom) {
            format = f.customFormat;
          } else {
            format = f.defaultFormat;
          }

          switch (this.type) {
            case 'DD':

              r = this.getFormattedDDStr(withValue, format, this.addSign);

              this['cc_' + cntrlid + 'sub1val'].value =
                dojoString.substitute('${xcrd}', {
                  xcrd: r.latdeg
                });

              this['cc_' + cntrlid + 'sub2val'].value =
                dojoString.substitute('${ycrd}', {
                  ycrd: r.londeg
                });

              formattedStr = r.formatResult;
              break;
            case 'DDM':

              r = this.getFormattedDDMStr(withValue, format, this.addSign);

              this['cc_' + cntrlid + 'sub1val'].value =
                dojoString.substitute('${latd} ${latm}', {
                  latd: r.latdeg,
                  latm: r.latmin
                });

              this['cc_' + cntrlid + 'sub2val'].value =
                dojoString.substitute('${lond} ${lonm}', {
                  lond: r.londeg,
                  lonm: r.lonmin
                });

              formattedStr = r.formatResult;
              break;
            case 'DMS':

              r = this.getFormattedDMSStr(withValue, format, this.addSign);

              this['cc_' + cntrlid + 'sub1val'].value =
                dojoString.substitute('${latd} ${latm} ${lats}', {
                  latd: r.latdeg,
                  latm: r.latmin,
                  lats: r.latsec
                });

              this['cc_' + cntrlid + 'sub2val'].value =
                dojoString.substitute('${lond} ${lonm} ${lons}', {
                  lond: r.londeg,
                  lonm: r.lonmin,
                  lons: r.lonsec
                });

              formattedStr = r.formatResult;
              break;
            case 'USNG':

              r = this.getFormattedUSNGStr(withValue, format, false);

              this['cc_' + cntrlid + 'sub1val'].value = r.gzd;
              this['cc_' + cntrlid + 'sub2val'].value = r.grdsq;
              this['cc_' + cntrlid + 'sub3val'].value = r.easting;
              this['cc_' + cntrlid + 'sub4val'].value = r.northing;

              formattedStr = r.formatResult;

              break;
            case 'MGRS':
              r = this.getFormattedMGRSStr(withValue, format, false);

              this['cc_' + cntrlid + 'sub1val'].value = r.gzd;
              this['cc_' + cntrlid + 'sub2val'].value = r.grdsq;
              this['cc_' + cntrlid + 'sub3val'].value = r.easting;
              this['cc_' + cntrlid + 'sub4val'].value = r.northing;

              formattedStr = r.formatResult;
              break;
            case 'GARS':
              r = this.getFormattedGARSStr(withValue, format, false);

              this['cc_' + cntrlid + 'sub1val'].value = r.lon;
              this['cc_' + cntrlid + 'sub2val'].value = r.lat;
              this['cc_' + cntrlid + 'sub3val'].value = r.quadrant;
              this['cc_' + cntrlid + 'sub4val'].value = r.key;

              formattedStr = r.formatResult;
              break;
            case 'GEOREF':
              r = this.getFormattedGEOREFStr(withValue, format, false);

              this['cc_' + cntrlid + 'sub1val'].value = r.lon + r.lat;
              this['cc_' + cntrlid + 'sub2val'].value = r.quadrant15lon + r.quadrant15lat;
              this['cc_' + cntrlid + 'sub3val'].value = r.quadrant1lon;
              this['cc_' + cntrlid + 'sub4val'].value = r.quadrant1lat;

              formattedStr = r.formatResult;
              break;
            case 'UTM':
              r = this.getFormattedUTMStr(withValue, format, false);

              if (r.bandLetter.match(/^[AaBbYyZz]/)) {
                //do not calculate values if out side of the UTM range (i.e. polar regions)
                this['cc_' + cntrlid + 'sub1val'].value = '';
                this['cc_' + cntrlid + 'sub2val'].value = '';
                this['cc_' + cntrlid + 'sub3val'].value = '';
                this['cc_' + cntrlid + 'sub4val'].value = '';
                r.formatResult = '';
              } else {
                this['cc_' + cntrlid + 'sub1val'].value = r.zone;
                this['cc_' + cntrlid + 'sub2val'].value = r.bandLetter;
                this['cc_' + cntrlid + 'sub3val'].value = r.easting;
                this['cc_' + cntrlid + 'sub4val'].value = r.westing;
              }

              //r.bandLetter.match(/^[AaBbYyZz]/)?this.coordName.set('value','UPS'):this.coordName.set('value','UTM');
              formattedStr = r.formatResult;
              break;
            case 'UTM_H':
              r = this.getFormattedUTMHStr(withValue, format, false);

              if (r.hemisphere.match(/^[AaBbYyZz]/)) {
                //do not calculate values if out side of the UTM range (i.e. polar regions)
                this['cc_' + cntrlid + 'sub1val'].value = '';
                this['cc_' + cntrlid + 'sub2val'].value = '';
                this['cc_' + cntrlid + 'sub3val'].value = '';
                this['cc_' + cntrlid + 'sub4val'].value = '';
                r.formatResult = '';
              } else {
                this['cc_' + cntrlid + 'sub1val'].value = r.zone;
                this['cc_' + cntrlid + 'sub2val'].value = r.hemisphere;
                this['cc_' + cntrlid + 'sub3val'].value = r.easting;
                this['cc_' + cntrlid + 'sub4val'].value = r.westing;
              }

              //r.hemisphere.match(/^[AaBbYyZz]/) ?
              //  this.coordName.set('value','UPS') :
              //  this.coordName.set('value','UTM_H');
              formattedStr = r.formatResult;
              break;
          }
        }
      } else {
        formattedStr = '';

      }
      if (this.coordcontrols) {
        this.setSubCoordUI(dojoDomClass.contains(this.coordcontrols, 'expanded'));
      }
      if (this.coordtext) {
        dojoDomAttr.set(this.coordtext, 'value', formattedStr);
        this.emit('get-coordinate-complete', formattedStr);
      }
    },

    /**
     *
     **/
    getFormattedCoordinates: function () {
      this.getCoordValues(this.currentClickPointDD, this.type, 4).then(
        dojoLang.hitch(this, function (r) {
          this.setCoordUI(r);
        }),
        dojoLang.hitch(this, function (err) {
          console.log(err);
        })
      );
    },

    /**
     * Updates the input coordinate textbox (coordtext)
     **/
    updateDisplay: function () {
      if (this.currentClickPoint) {
        if (!this.currentClickPointDD) {
          this.currentClickPointDD = this.currentClickPoint;
        }
        this.getFormattedCoordinates(this.currentClickPointDD);
        if (this.input) {
          if (this.graphicsLayer !== null) {
            this.graphicsLayer.clear();
            if (this.currentClickPoint.spatialReference.wkid ===
              this.parentWidget.map.spatialReference.wkid) {
              this.graphicsLayer.add(new EsriGraphic(this.currentClickPoint));
            } else {
              this.getProjectedPoint(this.currentClickPointDD).then(dojoLang.hitch(this,
                function (mapPoint) {
                  this.graphicsLayer.add(new EsriGraphic(mapPoint));
                }
              ), dojoLang.hitch(this,
                function (err) {
                  console.error(err);
                }));
            }
          }
          dojoTopic.publish('INPUTPOINTDIDCHANGE', {
            mapPoint: this.currentClickPointDD,
            inputFromText: true
          });
          if (this.zoomButton.parentNode) {
            this.zoomButton.parentNode.style.display = "inline-block";
          }
        }
      }
    },

    /**
     * Clears current coordinate and text input
     */
    clear: function () {
      this.coordtext.value = "";
      this.currentClickPoint = null;
      this.currentClickPointDD = null;
      this.currentClickPointDDDD = null;
      this.graphicsLayer.clear();
    },

    /**
     *
     **/
    inputError: function () {
      this.setCoordUI();
    },

    /**
     *
     **/
    getCleanInput: function (fromstr) {
      fromstr = fromstr.replace(/\n/g, '');
      fromstr = fromstr.replace(/\s+/g, ' ').trim();
      return fromstr.toUpperCase();
    },

    /**
     * Send request to get dd coordinates in format string
     **/
    getCoordValues: function (fromInput, toType, numDigits) {
      var deferred = new DojoDeferred();
      var nd = numDigits || 6;
      var tt;
      if (toType.name) {
        tt = toType.name;
      } else {
        tt = toType;
      }
      /**
       * for parameter info
       * http://resources.arcgis.com/en/help/arcgis-rest-api/#/To_GeoCoordinateString/02r30000026w000000/
       **/
      var params = {
        sr: 4326,
        coordinates: [
          [fromInput.x, fromInput.y]
        ],
        conversionType: tt,
        numOfDigits: nd,
        rounding: true,
        addSpaces: false
      };

      switch (toType) {
        case 'DD':
          params.numOfDigits = 6;
          break;
        case 'USNG':
          params.numOfDigits = 5;
          break;
        case 'MGRS':
          params.conversionMode = 'mgrsDefault';
          params.numOfDigits = 5;
          break;
        case 'UTM_H':
          params.conversionType = 'utm';
          params.conversionMode = 'utmNorthSouth';
          params.addSpaces = true;
          break;
        case 'UTM':
          params.conversionType = 'utm';
          params.conversionMode = 'utmDefault';
          params.addSpaces = true;
          break;
        case 'GARS':
          params.conversionMode = 'garsDefault';
          break;
      }

      this.geomsrvc.toGeoCoordinateString(params).then(function (itm) {
        deferred.resolve(itm);
      }, function () {
        deferred.resolve(null);
      });

      return deferred.promise;
    },

    /**
     *
     **/
    getXYNotation: function (fromStr, toType) {
      var deferred = new DojoDeferred();
      var a;
      var tt;
      if (toType.name) {
        tt = toType.name;
      } else {
        tt = toType;
      }

      var params = {
        sr: 4326,
        conversionType: tt,
        strings: []
      };

      switch (tt) {
        case 'DD':
        case 'DDM':
        case 'DMS':
          params.numOfDigits = 2;
          a = fromStr.replace(/[°˚º^~*"'′¨˝]/g, '');
          params.strings.push(a);
          break;
        case 'DDrev':
          params.conversionType = 'DD';
          params.numOfDigits = 2;
          a = fromStr.replace(/[°˚º^~*"'′¨˝]/g, '');
          params.strings.push(a);
          break;
        case 'DDMrev':
          params.conversionType = 'DDM';
          params.numOfDigits = 2;
          a = fromStr.replace(/[°˚º^~*"'′¨˝]/g, '');
          params.strings.push(a);
          break;
        case 'DMSrev':
          params.conversionType = 'DMS';
          params.numOfDigits = 2;
          a = fromStr.replace(/[°˚º^~*"'′¨˝]/g, '');
          params.strings.push(a);
          break;
        case 'USNG':
          params.strings.push(fromStr);
          params.addSpaces = 'false';
          break;
        case 'MGRS':
          params.conversionMode = 'mgrsNewStyle';
          params.strings.push(fromStr);
          params.addSpaces = 'false';
          break;
        case 'UTM_H':
          params.conversionType = 'utm';
          params.conversionMode = 'utmNorthSouth';
          params.strings.push(fromStr);
          break;
        case 'UTM':
          params.conversionType = 'utm';
          params.conversionMode = 'utmDefault';
          params.strings.push(fromStr);
          break;
        case 'GARS':
          params.conversionMode = 'garsCenter';
          params.strings.push(fromStr);
          break;
        case 'GEOREF':
          params.strings.push(fromStr);
          break;
      }

      this.geomsrvc.fromGeoCoordinateString(params).then(function (itm) {
        deferred.resolve(itm);
      }, function () {
        deferred.resolve(null);
      });

      return deferred.promise;
    },

    getNotations: function () {
      // using jshint ignore line on parts of the regular
      // expressions that cannot be split over lines
      var strs = [{
          name: "DD",
          pattern: new RegExp([
            /^(([NS\+\-\s])*([0-8]?\d([,.]\d*)?|90([,.]0*)?)([°˚º^~*]*)([NS\+\-\s])*)([,:;\s|\/\\]+)/,
            /(([EW\+\-\s])*([0]?\d?\d([,.]\d*)?|1[0-7]\d([,.]\d*)?|180([,.]0*)?)([°˚º^~*]*)([EW\+\-\s])*)$/ // jshint ignore:line
          ].map(function (r) {
            return r.source;
          }).join("")),
          notationType: this.nls.DDLatLongNotation,
          conversionType: "DD"
        }, {
          name: "DDrev",
          pattern: new RegExp([
            /^(([EW\+\-\s])*([0]?\d?\d([,.]\d*)?|1[0-7]\d([,.]\d*)?|180([,.]0*)?)([°˚º^~*]*)([EW\+\-\s])*)/, // jshint ignore:line
            /([,:;\s|\/\\]+)(([NS\+\-\s])*([0-8]?\d([,.]\d*)?|90([,.]0*)?)([°˚º^~*]*)([NS\+\-\s])*)$/
          ].map(function (r) {
            return r.source;
          }).join("")),
          notationType: this.nls.DDLongLatNotation,
          conversionType: "DD"
        }, {
          name: "DDM",
          pattern: new RegExp([
            /^(([NS\+\-\s])*([0-8]?\d|90)[°˚º^~*\s\-_]+(([0-5]?\d|\d)([,.]\d*)?)['′\s_]*([NS\+\-\s])*)/,
            /([,:;\s|\/\\]+)/,
            /(([EW\+\-\s])*([0]?\d?\d|1[0-7]\d|180)[°˚º^~*\s\-_]+(([0-5]\d|\d)([,.]\d*)?)['′\s_]*([EW\+\-\s])*)/, // jshint ignore:line
            /[\s]*$/
          ].map(function (r) {
            return r.source;
          }).join("")),
          notationType: this.nls.DDMLatLongNotation,
          conversionType: "DDM"
        }, {
          name: "DDMrev",
          pattern: new RegExp([
            /^(([EW\+\-\s])*([0]?\d?\d|1[0-7]\d|180)[°˚º^~*\s\-_]+(([0-5]\d|\d)([,.]\d*)?)['′\s_]*([EW\+\-\s])*)/, // jshint ignore:line
            /([,:;\s|\/\\]+)/,
            /(([NS\+\-\s])*([0-8]?\d|90)[°˚º^~*\s\-_]+(([0-5]?\d|\d)([,.]\d*)?)['′\s_]*([NS\+\-\s])*)[\s]*$/ // jshint ignore:line
          ].map(function (r) {
            return r.source;
          }).join("")),
          notationType: this.nls.DDMLongLatNotation,
          conversionType: "DDM"
        }, {
          name: "DMS",
          pattern: new RegExp([
            /^(([NS\+\-\s])*([0-8]?\d|90)[°˚º^~*\s\-_]+([0-5]?\d|\d)['′\s\-_]+(([0-5]?\d|\d)([,.]\d*)?)["¨˝\s_]*([NS\+\-\s])*)/, // jshint ignore:line
            /([,:;\s|\/\\]+)/,
            /(([EW\+\-\s])*([0]?\d?\d|1[0-7]\d|180)[°˚º^~*\s\-_]+([0-5]\d|\d)['′\s\-_]+(([0-5]?\d|\d)([,.]\d*)?)["¨˝\s_]*([EW\+\-\s])*)[\s]*$/ // jshint ignore:line
          ].map(function (r) {
            return r.source;
          }).join("")),
          notationType: this.nls.DMSLatLongNotation,
          conversionType: "DMS"
        }, {
          name: "DMSrev",
          pattern: new RegExp([
            /^(([EW\+\-\s])*([0]?\d?\d|1[0-7]\d|180)[°˚º^~*\s\-_]+([0-5]\d|\d)['′\s\-_]+(([0-5]?\d|\d)([,.]\d*)?)["¨˝\s_]*([EW\+\-\s])*)/, // jshint ignore:line
            /([,:;\s|\/\\]+)/,
            /(([NS\+\-\s])*([0-8]?\d|90)[°˚º^~*\s\-_]+([0-5]?\d|\d)['′\s\-_]+(([0-5]?\d|\d)([,.]\d*)?)["¨˝\s_]*([NS\+\-\s])*)[\s]*$/ // jshint ignore:line
          ].map(function (r) {
            return r.source;
          }).join("")),
          notationType: this.nls.DMSLongLatNotation,
          conversionType: "DMS"
        }, {
          name: "GARS",
          pattern: /^\d{3}[a-zA-Z]{2}[1-4]?[1-9]?$/,
          notationType: this.nls.GARSNotation,
          conversionType: "GARS"
        }, {
          name: "GEOREF",
          pattern: /^[a-zA-Z]{4}\d{1,8}$/,
          notationType: this.nls.GEOREFNotation,
          conversionType: "GEOREF"
        }, {
          name: "MGRS",
          pattern: new RegExp([
            /^\d{1,2}[-,;:\s]*[C-HJ-NP-X][-,;:\s]*[A-HJ-NP-Z]{2}[-,;:\s]*/,
            /(\d[-,;:\s]+\d|\d{2}[-,;:\s]+\d{2}|\d{3}[-,;:\s]+\d{3}|\d{4}[-,;:\s]+\d{4}|\d{5}[-,;:\s]+\d{5})/, // jshint ignore:line
            /$|^(\d{1,2}[-,;:\s]*[C-HJ-NP-X][-,;:\s]*[A-HJ-NP-Z]{2}[-,;:\s]*)/,
            /(\d{2}|\d{4}|\d{6}|\d{8}|\d{10})?$|^[ABYZ][-,;:\s]*[A-HJ-NP-Z]{2}[-,;:\s]*/,
            /(\d[-,;:\s]+\d|\d{2}[-,;:\s]+\d{2}|\d{3}[-,;:\s]+\d{3}|\d{4}[-,;:\s]+\d{4}|\d{5}[-,;:\s]+\d{5})/, // jshint ignore:line
            /$|^[ABYZ][-,;:\s]*[A-HJ-NP-Z]{2}[-,;:\s]*(\d{2}|\d{4}|\d{6}|\d{8}|\d{10})?$/
          ].map(function (r) {
            return r.source;
          }).join("")),
          notationType: this.nls.MGRSNotation,
          conversionType: "MGRS"
        },
        {
          name: "UTM",
          pattern: new RegExp([
            /^\d{1,2}[-,;:\s]*[c-hj-np-xC-HJ-NP-X][-,;:\s]*\d{1,6}\.?\d*[mM]?[-,;:\s]?\d{1,7}\.?\d*[mM]?$/ // jshint ignore:line
          ].map(function (r) {
            return r.source;
          }).join("")),
          notationType: this.nls.UTMBandNotation,
          conversionType: "UTM"
        }, {
          name: "UTM (H)",
          pattern: new RegExp([
            /^\d{1,2}[-,;:\s]*[NnSs][-,;:\s]*\d{1,6}\.?\d*[mM]?[-,;:\s]+\d{1,7}\.?\d*[mM]?$/
          ].map(function (r) {
            return r.source;
          }).join("")),
          notationType: this.nls.UTMHemNotation,
          conversionType: "UTM_H"
        }
      ];
      return strs;
    },

    getCoordinateType: function (fromInput) {
      var clnInput = this.getCleanInput(fromInput);
      var deferred = new DojoDeferred();
      //regexr.com

      var strs = this.getNotations();

      var matchedtype = dojoArray.filter(strs, function (itm) {
        return itm.pattern.test(this.v);
      }, {
        v: clnInput
      });

      if (matchedtype.length > 0) {
        deferred.resolve(matchedtype);
      } else {
        deferred.resolve(null);
      }
      return deferred.promise;
    },

    /**
     *
     **/
    getFormattedDDStr: function (fromValue, withFormatStr, addSignPrefix) {
      var r = {};
      r.sourceValue = fromValue;
      r.sourceFormatString = withFormatStr;

      var parts = fromValue[0].split(/[ ,]+/);

      r.latdeg = parts[0].replace(/[nNsS]/, '');
      r.londeg = parts[1].replace(/[eEwW]/, '');

      if (addSignPrefix) {
        if (parts[0].slice(-1) === 'N') {
          r.latdeg = '+' + r.latdeg;
        } else {
          r.latdeg = '-' + r.latdeg;
        }
        if (parts[1].slice(-1) === "W") {
          r.londeg = '-' + r.londeg;
        } else {
          r.londeg = '+' + r.londeg;
        }
      }

      var s = withFormatStr.replace(/X/, r.londeg);
      s = s.replace(/[eEwW]/, parts[1].slice(-1));
      s = s.replace(/[nNsS]/, parts[0].slice(-1));
      s = s.replace(/Y/, r.latdeg);

      r.formatResult = s;
      return r;
    },

    /**
     *
     **/
    getFormattedDDMStr: function (fromValue, withFormatStr, addSignPrefix) {
      var r = {};
      r.sourceValue = fromValue;
      r.sourceFormatString = withFormatStr;

      r.parts = fromValue[0].split(/[ ,]+/);

      r.latdeg = r.parts[0];
      r.latmin = r.parts[1].replace(/[nNsS]/, '');
      r.londeg = r.parts[2];
      r.lonmin = r.parts[3].replace(/[eEwW]/, '');

      if (addSignPrefix) {
        if (r.parts[1].slice(-1) === 'N') {
          r.latdeg = '+' + r.latdeg;
        } else {
          r.latdeg = '-' + r.latdeg;
        }
        if (r.parts[3].slice(-1) === 'W') {
          r.londeg = '-' + r.londeg;
        } else {
          r.londeg = '+' + r.londeg;
        }
      }

      //A° B'N X° Y'E
      var s = withFormatStr.replace(/[EeWw]/, r.parts[3].slice(-1));
      s = s.replace(/Y/, r.lonmin);
      s = s.replace(/X/, r.londeg);
      s = s.replace(/[NnSs]/, r.parts[1].slice(-1));
      s = s.replace(/B/, r.latmin);
      s = s.replace(/A/, r.latdeg);

      r.formatResult = s;
      return r;
    },

    /**
     *
     **/
    getFormattedDMSStr: function (fromValue, withFormatStr, addSignPrefix) {
      var r = {};
      r.sourceValue = fromValue;
      r.sourceFormatString = withFormatStr;

      r.parts = fromValue[0].split(/[ ,]+/);

      r.latdeg = r.parts[0];
      r.latmin = r.parts[1];
      r.latsec = r.parts[2].replace(/[NnSs]/, '');


      r.londeg = r.parts[3];
      r.lonmin = r.parts[4];
      if (r.parts[5]) {
        r.lonsec = r.parts[5].replace(/[EWew]/, '');
      }

      if (addSignPrefix) {
        if (r.parts[2].slice(-1) === 'N') {
          r.latdeg = '+' + r.latdeg;
        } else {
          r.latdeg = '-' + r.latdeg;
        }
        if (r.parts[5].slice(-1) === 'W') {
          r.londeg = '-' + r.londeg;
        } else {
          r.londeg = '+' + r.londeg;
        }
      }

      //A° B' C''N X° Y' Z''E
      var s = withFormatStr.replace(/A/, r.latdeg);
      s = s.replace(/B/, r.latmin);
      s = s.replace(/C/, r.latsec);
      s = s.replace(/X/, r.londeg);
      s = s.replace(/Y/, r.lonmin);
      s = s.replace(/Z/, r.lonsec);
      s = s.replace(/[NnSs]/, r.parts[2].slice(-1));
      if (r.parts[5]) {
        s = s.replace(/[EeWw]/, r.parts[5].slice(-1));
      }

      r.formatResult = s;
      return r;
    },

    /**
     *
     **/
    getFormattedUSNGStr: function (fromValue, withFormatStr) {
      var r = {};
      r.sourceValue = fromValue;
      r.sourceFormatString = withFormatStr;

      if (fromValue[0].match(/^[ABYZ]/)) {
        r.gzd = fromValue[0].match(/[ABYZ]/)[0].trim();
      } else {
        r.gzd = fromValue[0].match(/\d{1,2}[C-HJ-NP-X]/)[0].trim();
      }
      if (fromValue[0].replace(r.gzd, '').match(/[a-hJ-zA-HJ-Z]{2}/)) {
        r.grdsq = fromValue[0].replace(r.gzd, '').match(/[a-hJ-zA-HJ-Z]{2}/)[0].trim();
      }
      if (fromValue[0].replace(r.gzd + r.grdsq, '').match(/^\d{1,5}/)) {
        r.easting = fromValue[0].replace(r.gzd + r.grdsq, '').match(/^\d{1,5}/)[0].trim();
      }
      if (fromValue[0].replace(r.gzd + r.grdsq, '').match(/\d{1,5}$/)) {
        r.northing = fromValue[0].replace(r.gzd + r.grdsq, '').match(/\d{1,5}$/)[0].trim();
      }

      //Z S X# Y#
      var s = withFormatStr.replace(/Y/, r.northing);
      s = s.replace(/X/, r.easting);
      s = s.replace(/S/, r.grdsq);
      s = s.replace(/Z/, r.gzd);

      r.formatResult = s;
      return r;
    },

    /**
     *
     **/
    getFormattedMGRSStr: function (fromValue, withFormatStr) {
      var r = {};
      r.sourceValue = fromValue;
      r.sourceFormatString = withFormatStr;

      if (fromValue[0].match(/^[ABYZ]/)) {
        r.gzd = fromValue[0].match(/[ABYZ]/)[0].trim();
      } else {
        r.gzd = fromValue[0].match(/\d{1,2}[C-HJ-NP-X]/)[0].trim();
      }
      r.grdsq = fromValue[0].replace(r.gzd, '').match(/[a-hJ-zA-HJ-Z]{2}/)[0].trim();
      r.easting = fromValue[0].replace(r.gzd + r.grdsq, '').match(/^\d{1,5}/)[0].trim();
      r.northing = fromValue[0].replace(r.gzd + r.grdsq, '').match(/\d{1,5}$/)[0].trim();

      //Z S X# Y#
      var s = withFormatStr.replace(/Y/, r.northing);
      s = s.replace(/X/, r.easting);
      s = s.replace(/S/, r.grdsq);
      s = s.replace(/Z/, r.gzd);

      r.formatResult = s;
      return r;
    },

    /**
     *
     **/
    getFormattedGARSStr: function (fromValue, withFormatStr) {
      var r = {};
      r.sourceValue = fromValue;
      r.sourceFormatString = withFormatStr;

      r.lon = fromValue[0].match(/\d{3}/);
      r.lat = fromValue[0].match(/[a-zA-Z]{2}/);

      var q = fromValue[0].match(/\d*$/);
      r.quadrant = q[0][0];
      r.key = q[0][1];

      //XYQK
      var s = withFormatStr.replace(/K/, r.key);
      s = s.replace(/Q/, r.quadrant);
      s = s.replace(/Y/, r.lat);
      s = s.replace(/X/, r.lon);

      r.formatResult = s;
      return r;
    },

    /**
     *
     **/
    getFormattedGEOREFStr: function (fromValue, withFormatStr) {
      var r = {};
      r.sourceValue = fromValue;
      r.sourceFormatString = withFormatStr;

      r.lon = fromValue[0].match(/[a-zA-Z]{1}/)[0].trim();
      r.lat = fromValue[0].replace(r.lon, '').match(/[a-zA-Z]{1}/)[0].trim();
      r.quadrant15lon = fromValue[0].replace(r.lon + r.lat, '').match(/[a-zA-Z]{1}/)[0].trim();
      r.quadrant15lat = fromValue[0].replace(r.lon +
        r.lat + r.quadrant15lon, '').match(/[a-zA-Z]{1}/)[0].trim();

      var q = fromValue[0].replace(r.lon + r.lat + r.quadrant15lon + r.quadrant15lat, '');

      r.quadrant1lon = q.substr(0, q.length / 2);
      r.quadrant1lat = q.substr(q.length / 2, q.length);

      //ABCDXY
      var s = withFormatStr.replace(/Y/, r.quadrant1lat);
      s = s.replace(/X/, r.quadrant1lon);
      s = s.replace(/D/, r.quadrant15lat);
      s = s.replace(/C/, r.quadrant15lon);
      s = s.replace(/B/, r.lat);
      s = s.replace(/A/, r.lon);

      r.formatResult = s;
      return r;
    },

    /**
     *
     **/
    getFormattedUTMStr: function (fromValue, withFormatStr) {
      var r = {};
      r.sourceValue = fromValue;
      r.sourceFormatString = withFormatStr;

      r.parts = fromValue[0].split(/[ ,]+/);
      r.zone = r.parts[0].replace(/[A-Z]/, '');
      r.bandLetter = r.parts[0].slice(-1);
      r.easting = r.parts[1];
      r.westing = r.parts[2];

      //ZB Xm Ym'
      var s = withFormatStr.replace(/Y/, r.westing);
      s = s.replace(/X/, r.easting);
      s = s.replace(/B/, r.bandLetter);
      s = s.replace(/Z/, r.zone);

      r.formatResult = s;
      return r;
    },

    /**
     *
     **/
    getFormattedUTMHStr: function (fromValue, withFormatStr) {
      var r = {};
      r.sourceValue = fromValue;
      r.sourceFormatString = withFormatStr;

      r.parts = fromValue[0].split(/[ ,]+/);
      r.zone = r.parts[0].replace(/[A-Z]/, '');
      r.hemisphere = r.parts[0].slice(-1);

      r.easting = r.parts[1];
      r.westing = r.parts[2];

      //ZH Xm Ym'
      var s = withFormatStr.replace(/Y/, r.westing);
      s = s.replace(/X/, r.easting);
      s = s.replace(/H/, r.hemisphere);
      s = s.replace(/Z/, r.zone);

      r.formatResult = s;
      return r;
    }
  });
});