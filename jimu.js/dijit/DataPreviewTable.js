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
  'dojo/_base/html',
  'dijit/_WidgetBase',
  'dojo/_base/lang',
  'dojo/_base/array',
  'jimu/utils',
  'dgrid/OnDemandGrid',
  /*"dgrid/extensions/ColumnHider",*/
  "dgrid/extensions/ColumnResizer",
  "dgrid/extensions/ColumnReorder"
], function (declare, html, _WidgetBase, lang, array, utils,
  OnDemandGrid, /*ColumnHider,*/ColumnResizer, ColumnReorder) {
  /* global apiUrl */
  return declare([_WidgetBase], {
    declaredClass: "jimu.dijit.DataPreviewTable",
    baseClass: "jimu-data-preview-table",
    featureSet: null,
    loadingIndicator: null,
    _AUTO_WIDTH_COLS: 6,

    postCreate: function () {
      this.inherited(arguments);
      utils.loadStyleLink("dgrid", apiUrl + "dgrid/css/dgrid.css");

      this.tableContainer = html.create('div', {
        'class': "table-container"
      }, this.domNode);

      if (this.height) {
        html.style(this.tableContainer, "height", (this.height - 80) + "px");
      }

      var columns = this._getColumns();
      this.grid = new (declare([OnDemandGrid, /*ColumnHider,*/ColumnResizer, ColumnReorder]))({
        columns: columns
      }, this.tableContainer);
      var data = this._getData();
      this.grid.renderArray(data);
    },

    _getColumns: function () {
      // columns: {
      //     first: 'First Name',
      //     last: 'Last Name',
      //     age: 'Age'
      //   }
      var cellWidth = "auto";
      if (this.featureSet.fields &&
        this.featureSet.fields.length && this.featureSet.fields.length > this._AUTO_WIDTH_COLS) {
        cellWidth = 120;
      }

      var layout = {};
      array.forEach(this.featureSet.fields, function (f) {
        layout[f.name] = {
          label: f.alias,
          width: cellWidth
        };
      });
      return layout;
    },
    _getData: function () {
      // [
      //   { first: 'Bob', last: 'Barker', age: 89 },
      //   { first: 'Vanna', last: 'White', age: 55 },
      //   { first: 'Pat', last: 'Sajak', age: 65 }
      // ];
      var data = [];
      array.forEach(this.featureSet.features, function (feature, idx) {
        var row = {};
        array.forEach(this.featureSet.fields, function (f) {
          row[f.name] = feature.attributes[f.name];
        }, this);
        data.push(lang.clone(lang.mixin({ id: idx + 1 }, row)));
      }, this);

      return data;
    }
  });
});