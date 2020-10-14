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
define(["dojo/_base/declare",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/on",
    "./SearchComponent",
    "dojo/text!./templates/TypeOptions.html",
    "dojo/i18n!../nls/strings",
    "esri/layers/VectorTileLayer",
    "dijit/TooltipDialog",
    "dijit/form/DropDownButton",
    "jimu/dijit/CheckBox"
  ],
  function(declare, array, lang, on, SearchComponent, template, i18n,
    VectorTileLayer) {

    return declare([SearchComponent], {

      i18n: i18n,
      templateString: template,

      postCreate: function() {
        this.inherited(arguments);

        if (!VectorTileLayer || !VectorTileLayer.supported()) {
          console.warn("AddData: Vector Tile is not supported.");
          this.vectorTileNode.style.display = "none";
        }

        this.own(on(this.tooltipDialog, "open", lang.hitch(this, function() {
          var v = this.searchPane.wabWidget.appConfig.theme.name;
          this.tooltipDialog.domNode.className += " " + v;
        })));

        this.own(on(this.mapServiceToggle,'change',lang.hitch(this,function(){
          this.search();
        })));
        this.own(on(this.featureServiceToggle,'change',lang.hitch(this,function(){
          this.search();
        })));
        this.own(on(this.imageServiceToggle,'change',lang.hitch(this,function(){
          this.search();
        })));
        this.own(on(this.vectorTileServiceToggle,'change',lang.hitch(this,function(){
          this.search();
        })));
        this.own(on(this.kmlToggle,'change',lang.hitch(this,function(){
          this.search();
        })));
        this.own(on(this.wmsToggle,'change',lang.hitch(this,function(){
          this.search();
        })));
        this.own(on(this.wfsToggle,'change',lang.hitch(this,function(){
          this.search();
        })));
      },

      getOptionWidgets: function() {
        return [
          this.mapServiceToggle,
          this.featureServiceToggle,
          this.imageServiceToggle,
          this.vectorTileServiceToggle,
          this.kmlToggle,
          this.wmsToggle,
          this.wfsToggle
        ];
      },

      optionClicked: function() {
        // was working for digit/form/CheckBox but it is not fored for jimu/dijit/CheckBox
        //this.search();
      },

      /* SearchComponent API ============================================= */

      appendQueryParams: function(params) {
        var appendQ = function(q, qToAppend) {
          if (q.length > 0) {
            q += " OR ";
          }
          return q + qToAppend;
        };

        var q = "",
          qAll = "",
          hasCheck = false;
        array.forEach(this.getOptionWidgets(), function(widget) {
          var dq = widget.domNode.getAttribute("data-option-q");
          qAll = appendQ(qAll, dq);
          if (widget.getValue()) {
            q = appendQ(q, dq);
            hasCheck = true;
          }
        });
        if (!hasCheck) {
          q = qAll;
        }
        if (q !== null && q.length > 0) {
          q = "(" + q + ")";
          if (params.q !== null && params.q.length > 0) {
            params.q += " AND " + q;
          } else {
            params.q = q;
          }
        }
      }

    });
  });
