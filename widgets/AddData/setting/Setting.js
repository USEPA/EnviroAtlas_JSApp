///////////////////////////////////////////////////////////////////////////
// Copyright © 2015 Esri. All Rights Reserved.
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
    "dojo/_base/lang",
    "jimu/BaseWidgetSetting",
    "dijit/_WidgetsInTemplateMixin",
    "dijit/form/CheckBox",
    "dijit/form/NumberTextBox",
    "dijit/form/ValidationTextBox"
  ],
  function(declare, lang, BaseWidgetSetting, _WidgetsInTemplateMixin) {

    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {

      baseClass: "jimu-widget-add-data-setting",

      postCreate: function() {
        this.inherited(arguments);
      },

      startup: function() {
        if (this._started) {
          return;
        }
        this.inherited(arguments);
        this.setConfig(this.config);
      },

      getConfig: function() {
        this.config = this.config;
        var v = this.numPerBageBox.get("value");
        if (typeof v === "number" && !isNaN(v)) {
          v = Math.floor(v);
          if (v >= 1 && v <= 100) {
            this.config.numPerPage = v;
          }
        }

        var options = this.config.scopeOptions;
        var setOption = function(name, checkBox, textBox) {
          var opt = options[name];
          opt.allow = !!checkBox.get("checked");
          if (textBox) {
            opt.label = null;
            var s = textBox.get("value");
            if (typeof s === "string") {
              s = lang.trim(s);
              if (s.length > 0) {
                opt.label = s;
              }
            }
          }
        };
        setOption("MyContent", this.MyContentCheckBox, this.MyContentTextBox);
        setOption("MyOrganization", this.MyOrganizationCheckBox, this.MyOrganizationTextBox);
        setOption("ArcGISOnline", this.ArcGISOnlineCheckBox, this.ArcGISOnlineTextBox);
        // setOption("FromUrl", this.FromUrlCheckBox);

        return this.config;
      },

      setConfig: function(config) {
        this.config = config || {};
        //console.warn("setConfig",this.config);
        var numPer = this.config.numPerPage;
        try {
          var v = Number(numPer);
          if (typeof v === "number" && !isNaN(v)) {
            v = Math.floor(v);
            if (v >= 1 && v <= 100) {
              this.numPerBageBox.set("value", v);
            }
          }
        } catch (ex) {
          console.warn("Error setting number:");
          console.warn(ex);
        }

        if (!config.scopeOptions) {
          config.scopeOptions = {};
        }
        var options = config.scopeOptions;
        var initOption = function(name, checkBox, textBox) {
          var opt = options[name];
          if (!opt) {
            opt = options[name] = {
              allow: true,
              label: null
            };
          }
          if (typeof opt.allow !== "boolean") {
            opt.allow = true;
          }
          checkBox.set("checked", opt.allow);
          if (textBox) {
            if (typeof opt.label === "string") {
              var s = lang.trim(opt.label);
              if (s.length > 0) {
                textBox.set("value", s);
              }
            }
          }
        };
        initOption("MyContent", this.MyContentCheckBox, this.MyContentTextBox);
        initOption("MyOrganization", this.MyOrganizationCheckBox, this.MyOrganizationTextBox);
        initOption("ArcGISOnline", this.ArcGISOnlineCheckBox, this.ArcGISOnlineTextBox);
        // initOption("FromUrl", this.FromUrlCheckBox);

      }

    });

  });
