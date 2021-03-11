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
define(["dojo/_base/declare",
    "dojo/_base/array",
    "dojo/date/locale",
    "dojo/dom-class",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "jimu/utils",
    "dojo/text!./templates/help_LayerList2.html"
  ],
  function(declare, array, locale, domClass, _WidgetBase, _TemplatedMixin,
    _WidgetsInTemplateMixin, jimuUtils, template) {

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {

      templateString: template,

      canRemove: false,
      item: null,
      resultsPane: null,

      _dfd: null,

      postCreate: function() {
        this.inherited(arguments);
      },

      startup: function() {

        if (this._started) {
        
          return;
        }
        this.inherited(arguments);
      },

    });

  });
