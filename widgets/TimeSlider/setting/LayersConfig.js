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

define(['dojo/Evented',
  'dojo/_base/declare',
  'dojo/_base/lang',
  "esri/lang",
  'dojo/_base/html',
  'dojo/_base/array',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  "dijit/_WidgetsInTemplateMixin",
  'dojo/on',
  "dojo/text!./LayersConfig.html",
  'jimu/LayerInfos/LayerInfos',
  //'moment/moment',
  "../utils",
  'jimu/utils',
  "jimu/dijit/CheckBox"
],
  function (Evented, declare, lang, esriLang, html, array,
    _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,
    on, template, LayerInfos,/* moment,*/ utils, jimuUtils,
    CheckBox) {
    var clazz = declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Evented], {
      templateString: template,
      layersCheckboxes: [],
      /*
      var layers = [{
          id:
          isTimeEnable:
        },{
          id:
          isTimeEnable
      }]
      */
      startup: function () {
        //var timeLayers = [];
        this.layersCheckboxes = [];
        LayerInfos.getInstance(this.map, this.map.itemInfo).then(lang.hitch(this, function (layerInfosObj) {
          //table head
          //this._creatTableRow(this.layersContainer, this.nls.layerTableCol1, this.nls.layerTableCol2);

          this._layerInfosObj = layerInfosObj;
          var infos = this._layerInfosObj.getLayerInfoArray();

          array.forEach(infos, lang.hitch(this, function (info) {
            //show all time layers, even disabled in webmap
            var isTimeLayer = (esriLang.isDefined(info.layerObject.timeInfo) &&
              esriLang.isDefined(info.layerObject.timeInfo.timeExtent));
            if (isTimeLayer) {
              this.addARow(info);
            }
          }));

          this.emit('initTimeExtent', this.getFullTimeExtent());
          this.emit('initedLaysers', this.getFullTimeExtent());

          //scorller
          //var nowHeight = html.getContentBox(this.layersContainer);
          var maxHeight = 170;
          var rowHeight = 50;
          //html.setStyle(this.layersContainer, "max-height", maxHeight + "px");
          if ((infos.length * rowHeight) >= maxHeight) {
            html.setStyle(this.layersContainer, "overflow-y", "auto");
          } else {
            html.setStyle(this.layersContainer, "overflow-y", "hidden");
          }
        }));

        this.inherited(arguments);
      },

      // _emitChangeEvent:function(){
      //   this.emit('initTimeExtent', this.getFullTimeExtent());
      // },
      _creatTableRow: function (container, layerName, timeInfo) {
        var row = html.create('div', {
          "class": "row"
        }, container);
        var layerNameDom = html.create('div', {
          "class": "layer-name",
          "innerHTML": jimuUtils.sanitizeHTML(layerName || "")
        }, row);
        var timeInfoDom = html.create('div', {
          "class": "time-info",
          "innerHTML": jimuUtils.sanitizeHTML(timeInfo || "")
        }, row);

        return {
          layerNameDom: layerNameDom,
          timeInfoDom: timeInfoDom
        };
      },
      addARow: function (layerInfo) {
        var row = this._creatTableRow(this.layersContainer);

        var checkBox = new CheckBox({
          label: layerInfo.id,
          _layerId: layerInfo.id,
          checked: true//default selected
        }, row.layerNameDom);
        this.own(on(checkBox, 'change', lang.hitch(this, function () {
          this.emit('change', this.getFullTimeExtent());
        })));

        if (layerInfo.layerObject.timeInfo && esriLang.isDefined(layerInfo.layerObject.timeInfo.timeExtent)) {
          var startTimeLabel = jimuUtils.localizeDate(layerInfo.layerObject.timeInfo.timeExtent.startTime);
          var endTimeLabel = jimuUtils.localizeDate(layerInfo.layerObject.timeInfo.timeExtent.endTime);

          var timeStr = startTimeLabel + "   " + this.nls.timeTo + "   " + endTimeLabel;
          html.setAttr(row.timeInfoDom, "innerHTML", jimuUtils.sanitizeHTML(timeStr));
          checkBox.timeExtent = layerInfo.layerObject.timeInfo.timeExtent;
        }

        //this.own(on(this.selectedBtn, 'click', lang.hitch(this, this.onSelected)));
        this.layersCheckboxes.push(checkBox);

        return row;
      },

      getFullTimeExtent: function () {
        if (0 === this.layersCheckboxes.length) {
          return null;//no time layers
        }

        var timeExtents = [];
        array.forEach(this.layersCheckboxes, lang.hitch(this, function (checkBox) {
          if (checkBox.timeExtent && true === checkBox.getValue()) {
            timeExtents.push(checkBox.timeExtent);
          }
        }));

        var fts;
        if (timeExtents.length > 0) {
          var noRound = true;
          fts = utils.getFullTimeExtent(timeExtents, noRound);
        } else {
          return null;
        }

        return {
          timeExtent: fts
        };
      },

      setConfig: function (config) {
        if (!config) {
          return;
        }

        array.forEach(this.layersCheckboxes, lang.hitch(this, function (checkBox) {
          array.forEach(config, lang.hitch(this, function (layer) {
            if (checkBox._layerId === layer.id) {
              if (true === layer.isTimeEnable) {
                checkBox.setValue(true);
              } else {
                checkBox.setValue(false);
              }
            }
          }));
        }));
      },
      getConfig: function () {
        var layersConfig = [];

        array.forEach(this.layersCheckboxes, lang.hitch(this, function (checkBox) {
          layersConfig.push({
            id: checkBox._layerId,
            isTimeEnable: checkBox.checked
          });
        }));

        return layersConfig;
      },
      isValid: function () {
        return true;
      }
    });
    return clazz;
  });