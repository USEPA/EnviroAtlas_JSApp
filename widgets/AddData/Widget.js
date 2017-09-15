///////////////////////////////////////////////////////////////////////////
// Copyright © 2016 Esri. All Rights Reserved.
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
    "dojo/Deferred",
    "dojo/dom-class",
    "jimu/portalUtils",
    "jimu/tokenUtils",
    "jimu/BaseWidget",
    "dijit/_WidgetsInTemplateMixin",
    "./search/SearchContext",
    "./search/util",
    "./search/SearchPane"
  ],
  function(declare, Deferred, domClass, portalUtils, tokenUtils, BaseWidget,
    _WidgetsInTemplateMixin, SearchContext, util) {
    // debugger;
    return declare([BaseWidget, _WidgetsInTemplateMixin], {

      name: "AddData",
      baseClass: "jimu-widget-add-data",

      _isOpen: false,
      _searchOnOpen: false,

      postCreate: function() {
        this.inherited(arguments);
        this.searchPane.wabWidget = this;
      },

      startup: function() {
        if (this._started) {
          return;
        }
        var self = this,
          args = arguments;
        this._getUser().then(function(user) {
          //console.warn("AddData.user=",user);
          return self._initContext(user);
        }).then(function() {
          self.inherited(args);
          self._initListeners();
          self.resize();
          //console.warn("AddData.startup",this);
        }).otherwise(function(error) {
          console.warn("AddData.startup error:", error);
          self.inherited(args);
          self.resize();
        });
        /*
        this._initContext().then(function() {
          self.inherited(args);
          self._initListeners();
          self.resize();
          //console.warn("AddData.startup",this);
        }).otherwise(function(error) {
          console.warn("AddData.startup error:", error);
          self.inherited(args);
          self.resize();
        });
        */
      },

      _checkConfig: function() {
        var config = this.config;
        if (!config.scopeOptions) {
          config.scopeOptions = {};
        }
        var options = config.scopeOptions;
        var initOption = function(name) {
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
        };
        initOption("MyContent");
        initOption("MyOrganization");
        initOption("ArcGISOnline");
        initOption("FromUrl");
      },

      _getUser: function() {
        var dfd = new Deferred();
        var portalUrl = this.appConfig.portalUrl;
        if (tokenUtils.userHaveSignInPortal(portalUrl)) {
          portalUtils.getPortal(portalUrl).getUser().then(function(user) {
            dfd.resolve(user);
          }).otherwise(function(error) {
            console.warn("AddData._getUser error:", error);
            dfd.resolve(null);
          });
        } else {
          dfd.resolve(null);
        }
        return dfd;
      },

      _initContext: function(user) {
        this._checkConfig();
        var dfd = new Deferred(),
          bResolve = true;
        // TODO configure this?
        var arcgisOnlineUrl = util.checkMixedContent("http://www.arcgis.com");
        var searchContext = new SearchContext();
        var portal = portalUtils.getPortal(this.appConfig.portalUrl);
        searchContext.portal = portal;
        if (user) {
          if (typeof user.orgId === "string" && user.orgId.length > 0) {
            searchContext.orgId = user.orgId;
          }
          if (typeof user.username === "string" && user.username.length > 0) {
            searchContext.username = user.username;
          }
        }
        /*
        if (portal.user) {
          if (typeof portal.user.orgId === "string" && portal.user.orgId.length > 0) {
            searchContext.orgId = portal.user.orgId;
          }
          if (typeof portal.user.username === "string" && portal.user.username.length > 0) {
            searchContext.username = portal.user.username;
          }
        }
        */
        this.searchPane.searchContext = searchContext;
        this.searchPane.portal = portal;
        //console.warn("AddData.portal",portal);

        var msg = this.nls.loadError + arcgisOnlineUrl;
        var arcgisOnlineOption = this.config.scopeOptions.ArcGISOnline;
        searchContext.allowArcGISOnline = arcgisOnlineOption.allow;
        if (portal.isPortal && searchContext.allowArcGISOnline) {
          var arcgisOnlinePortal = portalUtils.getPortal(arcgisOnlineUrl);
          if (!arcgisOnlinePortal) {
            console.warn(msg);
            searchContext.allowArcGISOnline = false;
            arcgisOnlineOption.allow = false;
          } else {
            if (!arcgisOnlinePortal.helperServices) {
              bResolve = false;
              arcgisOnlinePortal.loadSelfInfo().then(function() {
                if (!arcgisOnlinePortal.helperServices) {
                  console.warn(msg);
                  searchContext.allowArcGISOnline = false;
                  arcgisOnlineOption.allow = false;
                } else {
                  searchContext.arcgisOnlinePortal = arcgisOnlinePortal;
                  //console.warn("searchContext.arcgisOnlinePortal",arcgisOnlinePortal);
                }
                dfd.resolve();
              }).otherwise(function(error) {
                searchContext.allowArcGISOnline = false;
                arcgisOnlineOption.allow = false;
                console.warn(msg);
                console.warn(error);
                dfd.resolve();
              });
            }
          }
          //console.warn("arcgisOnlinePortal",arcgisOnlinePortal);
        }
        if (bResolve) {
          dfd.resolve();
        }
        return dfd;
      },

      _initListeners: function() {
        var self = this;
        if (this.map) {
          this.own(this.map.on("extent-change", function() {
            try {
              if (self.searchPane.bboxOption.bboxToggle.get("checked")) {
                if (self._isOpen) {
                  self.searchPane.search();
                } else {
                  self._searchOnOpen = true;
                }
              }
            } catch (ex) {
              console.warn(ex);
            }
          }));
        }
      },

      onClose: function() {
        this._isOpen = false;
      },

      onOpen: function() {
        var bSearch = this._searchOnOpen;
        this._isOpen = true;
        this._searchOnOpen = false;
        this.resize();
        if (bSearch) {
          this.searchPane.search();
        }
      },

      resize: function() {
        var newWidth = this.domNode.clientWidth;
        if (newWidth > 1000) {
          domClass.remove(this.domNode, "width-768");
          domClass.add(this.domNode, "width-1200");
        } else if (newWidth > 768) {
          domClass.remove(this.domNode, "width-1200");
          domClass.add(this.domNode, "width-768");
        } else {
          domClass.remove(this.domNode, ["width-768", "width-1200"]);
        }

        if (newWidth < 320) {
          domClass.remove(this.domNode, "width-medium");
          domClass.add(this.domNode, "width-small");
        } else if (newWidth < 750) {
          domClass.remove(this.domNode, "width-small");
          domClass.add(this.domNode, "width-medium");
        } else {
          domClass.remove(this.domNode, ["width-small", "width-medium"]);
        }

        if (this.searchPane) {
          this.searchPane.resize();
        }
      }
    });

  });
