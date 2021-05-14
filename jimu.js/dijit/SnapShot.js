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
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/Deferred',
  'dojo/DeferredList',
  'jimu/utils',
  'esri/request',
  'esri/geometry/webMercatorUtils',
  'jimu/portalUtils',
  'jimu/tokenUtils',
  'jimu/dijit/Message',
  'esri/layers/FeatureLayer',
  'esri/graphic'
],
  function (declare, lang, array, Deferred, DeferredList, utils, esriRequest,
    webMercatorUtils, portalUtils, tokenUtils, Message, FeatureLayer, Graphic) {
    var Snapshot = declare('Snapshot', null, {
      _portal: null,
      _portalUrl: "",
      _layerArray: [],
      _originMapId: "",
      _originAppId: "",
      _credential: null,

      name: "",
      appendTimeStamp: null,
      baseMap: null,
      tags: "",
      description: "",
      shareWith: null,
      logo: "",
      time: null,

      //options
      //shareWith: {everyone: bool, org: bool, groups: "comma seperated list of group IDs"},
      //  shareWith is expected to follow "share item (as item owner)" props
      //  http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#/Share_Item_as_item_owner/02r30000007s000000/
      //folderOptions: folderOptions will be passed to CreateFolder in the _createFolder function
      //  http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#/Create_Folder/02r300000074000000/
      //mapTitle: str,
      //mapExtent: {},
      //data: [{
      //  graphics: [<Object>],
      //  renderer: <Object>,
      //  infoTemplate: <Object>,
      //  fields: [],
      //  tags: [],
      //  description: str,
      //  name: str,
      //  visibleOnStartup: bool,
      //  appendTimeStamp: bool,
      //  typeIdField: str,
      //  types: [],
      //  minScale: int,
      //  maxScale: int,
      //  originalLayerName: str
      //}]

      constructor: function (appConfig, map) {
        this.map = map;
        this.appConfig = appConfig;
        this._originAppId = appConfig.appId;
        this._originMapId = map.itemId;
        this._mapItemInfo = map.itemInfo;
        this._portalUrl = appConfig.portalUrl;
        this._portal = portalUtils.getPortal(this._portalUrl);
        this._baseUrl = this._portalUrl + 'sharing/rest/';
        this.nls = lang.mixin({}, window.jimuNls.drawBox, window.jimuNls.snapshot);
      },

      createSnapShot: function (options) {
        this.ids = [];
        this.layerArray = [];
        this.time = this._getDateString(Date.now());
        var _name = options.appendTimeStamp && options.name ? options.name + "_" + this.time : options.name;
        this.name = _name || this._mapItemInfo.item.title + "_" + this.time; //if no name is specified in options always append timestamp to avoid duplicate name issues
        this.extent = options.mapExtent || this.map.extent;
        this.logo = options.logo || this.appConfig.logo;
        this.mapName = options.mapTitle || this.name;
        this.shareWith = options.shareWith || { everyone: false, org: false, groups: "" };

        var folderOptions = options.folderOptions;
        //make sure the required ones have a value
        folderOptions.name = options.folderOptions.name || this.name;
        folderOptions.title = options.folderOptions.title || this.name;
        folderOptions.description = options.folderOptions.description || this.name;

        //reverse to preserve inital order as we will push to another array later
        var data = options.data.reverse();

        return this._createSnapshot(folderOptions, data);
      },

      _createSnapshot: function (folderOptions, data) {
        var def = new Deferred();
        this._portal.getUser()
          .then(lang.hitch(this, this._processUser), function (err) { def.reject(err); })
          .then(lang.hitch(this, this._createFolder, folderOptions), function (err) { def.reject(err); })
          .then(lang.hitch(this, this._createItems, data), function (err) { def.reject(err); })
          .then(lang.hitch(this, this._addLayers), function (err) { def.reject(err); })
          .then(lang.hitch(this, this._createMap, this._mapItemInfo), function (err) { def.reject(err); })
          .then(lang.hitch(this, this._processMap), function (err) { def.reject(err); })
          .then(lang.hitch(this, this._shareItems), function (err) { def.reject(err); })
          .then(lang.hitch(this, this._showMessage), function(err) { def.reject(err); })
          .then(function() {
            def.resolve();
          });
        return def;
      },

      _processUser: function (user) {
        var def = new Deferred();
        this.user = user;
        this.groups = user.groups;
        def.resolve();
        return def;
      },

      _createFolder: function (folderOptions) {
        var def = new Deferred();
        var args = {
          url: this._baseUrl + 'content/users/' + this.user.username + '/createFolder',
          content: lang.mixin({
            f: 'json'
          }, folderOptions),
          handleAs: 'json',
          callbackParamName: 'callback'
        };
        if (this._isValidCredential()) {
          args.content.token = this._credential.token;
        }
        esriRequest(args, {
          usePost: true
        }).then(lang.hitch(this, function (response) {
          if (response.success) {
            this.folder = response.folder;
            if (this.folder && this.folder.id) {
              this.ids.push(this.folder.id);
            }
            def.resolve(response.folder);
          } else {
            console.log(response);
            def.reject(response);
          }
        }), lang.hitch(this, function (err) {
          def.reject(err);
        }));
        return def;
      },

      _createItems: function (data) {
        var def = new Deferred();
        var defArray = [];
        array.forEach(data, lang.hitch(this, function (dataItem) {
          if (dataItem.graphics && dataItem.graphics.length > 0) {
            defArray.push(this._createLayerItem(dataItem));
          }
        }));
        var itemList = [];
        var defList = new DeferredList(defArray);
        defList.then(lang.hitch(this, function (defResults) {
          for (var r = 0; r < defResults.length; r++) {
            //to skip failed layer
            if (defResults[r][0] === true && defResults[r][1] !== null) {
              var featureSet = defResults[r][1];
              itemList.push(featureSet);
            }
          }
          def.resolve(itemList);
        }), lang.hitch(this, function (err) {
          def.reject(err);
        }));
        return def;
      },

      _addLayers: function (items) {
        var def = new Deferred();
        var defArray = [];
        for (var i = 0; i < items.length; i++) {
          defArray.push(this.user.addItem(items[i], this.folder.id));
        }
        var layerList = [];
        var defList = new DeferredList(defArray);
        defList.then(lang.hitch(this, function (defResults) {
          for (var r = 0; r < defResults.length; r++) {
            var featureSet = defResults[r][1];
            if (featureSet.success) {
              layerList.push(featureSet.id);
              this.ids.push(featureSet.id);
            }
          }
          def.resolve(layerList);
        }), lang.hitch(this, function (err) {
          def.reject(err);
        }));
        return def;
      },

      _createMap: function (mapItemInfo) {
        var itemData = mapItemInfo.itemData;
        var title = this.name;
        var baseMapLayers = [];
        for (var i = 0; i < itemData.baseMap.baseMapLayers.length; i++) {
          var bml = itemData.baseMap.baseMapLayers[i];
          baseMapLayers.push({
            "id": bml.id,
            "layerType": bml.layerType,
            "url": bml.url,
            "visibility": bml.visibility,
            "opacity": bml.opacity,
            "title": bml.title,
            "styleUrl": bml.styleUrl,
            "itemId": bml.itemId
          });
        }
        var baseMap = {
          "baseMapLayers": baseMapLayers
        };
        var operationalLayers = [];
        for (var j = 0; j < this.layerArray.length; j++) {
          var l = this.layerArray[j];
          operationalLayers.push({
            id: l.layer.id,
            layerType: "ArcGISFeatureLayer",
            visibility: l.layer.visible,
            opacity: l.layer.opacity,
            title: l.layer.label,
            type: "feature",
            url: l.layer.url,
            popupInfo: l.layer.popupInfo// To enable popup of layer in webMap
          });
        }

        //TODO think through this
        var ext1 = webMercatorUtils.webMercatorToGeographic(this.extent);
        var webMap = {
          title: title,
          type: "Web Map",
          item: title,
          extent: ext1.xmin + "," + ext1.ymin + "," + ext1.xmax + "," + ext1.ymax,
          text: JSON.stringify({
            "operationalLayers": operationalLayers,
            "baseMap": baseMap,
            "spatialReference": this.map.spatialReference,
            "version": mapItemInfo && mapItemInfo.itemData && mapItemInfo.itemData.version ?
              mapItemInfo.itemData.version : "2.4"
          }),
          tags: this.name + "," + this.nls.snapshot_append,
          wabType: "HTML"
        };
        return this.user.addItem(webMap, this.folder.id);
      },

      _processMap: function (r) {
        var def = new Deferred();
        if (r.id) {
          this.ids.push(r.id);
        }
        if (r.success) {
          def.resolve(r.id);
        } else {
          def.reject('fail');
        }
        return def;
      },

      _shareItems: function (mapId) {
        var def = new Deferred();
        var args = {
          url: this._baseUrl + 'content/users/' + this.user.username + '/shareItems',
          content: {
            f: 'json',
            everyone: this.shareWith.everyone,
            org: this.shareWith.org,
            items: this.ids.join(),
            groups: this.shareWith.groups,
            confirmItemControl: this._validateGroupItemControl(this.shareWith.groups)
          },
          handleAs: 'json',
          callbackParamName: 'callback'
        };
        if (this._isValidCredential()) {
          args.content.token = this._credential.token;
        }
        esriRequest(args, {
          usePost: true
        }).then(lang.hitch(this, function (response) {
          if (response.results && response.results.length > 0) {
            def.resolve(this._portalUrl + 'home/webmap/viewer.html?webmap=' + mapId);
          } else {
            def.reject("fail");
          }
        }), lang.hitch(this, function (err) {
          def.reject(err);
        }));
        return def;
      },

      _validateGroupItemControl: function (groupIds) {
        var _groupIds = groupIds.split(',');
        var _groups = this.groups.filter(function (group) {
          var capabilities = group.capabilities || [];
          return _groupIds.indexOf(group.id) > -1 && capabilities.indexOf("updateitemcontrol") > -1;
        });
        return _groups.length > 0;
      },

      _showMessage: function (r) {
        var def = new Deferred();
        if (r === 'fail') {
          new Message({
            message: this.nls.snapshot_failed
          });
          def.reject(r);
        } else {
          new Message({
            message: '<a href="' + r + '" target="_blank">' + this.nls.snapshot_complete + '</a>'
          });
          def.resolve('success');
        }
        return def;
      },

      _getDateString: function (time) {
        var date = new Date(time);
        var _off = date.getTimezoneOffset();
        return utils.fieldFormatter.getFormattedDate(date, {
          dateFormat: 'shortDateShortTime'
        }) + " " + this.nls.utc + (_off < 0 ? "+" + (Math.abs(_off) / 60) : "-" + (_off / 60));
      },

      _checkCredential: function () {
        var isValid = tokenUtils.isValidCredential(this._credential);
        if (!isValid) {
          this._clearCredential();
        }
        return isValid;
      },

      _isValidCredential: function () {
        this._updateCredential();
        return this._checkCredential();
      },

      _updateCredential: function () {
        if (!this._checkCredential()) {
          this._credential = tokenUtils.getPortalCredential(this._portalUrl);
        }
      },

      _clearCredential: function () {
        this._credential = null;
      },

      _createLayerItem: function (dataItem) {
        var def = new Deferred();
        var layerDetailsDefault = {
          description: dataItem.name,
          name: dataItem.name,
          tags: [dataItem.name],
          type: "Feature Service",
          title: dataItem.name
        };
        //dataItem.originalLayerName contains original layer name without any modification
        //to ensure that feature service name should not contain any special characters otherwise it will fail
        this._createFeatureService(dataItem.originalLayerName).then(lang.hitch(this, function (response1) {
          if (response1.success) {
            var addToDefinitionUrl = response1.serviceurl.replace(
              new RegExp('rest', 'g'), "rest/admin") + "/addToDefinition";
            var layerParams = this._createLayer(lang.mixin(dataItem, layerDetailsDefault));
            this._addDefinitionToService(addToDefinitionUrl, layerParams).then(lang.hitch(this, function (response2) {
              if (response2.success) {
                //Push features to new layer
                var newFeatureLayer =
                  new FeatureLayer(response1.serviceurl + "/0?token=" + this._credential.token, {
                    id: layerDetailsDefault.name,
                    outFields: ["*"]
                  });

                layerDetailsDefault.url = response1.serviceurl + "/0";
                //this Layerarray will be used for adding layer info to webMap
                //So added required details
                this.layerArray.push({
                  layer: {
                    id: layerDetailsDefault.name,
                    label: layerDetailsDefault.name,
                    opacity: 1,
                    visible: true,
                    url: layerDetailsDefault.url,
                    popupInfo: dataItem.infoTemplate && dataItem.infoTemplate.info ?
                      dataItem.infoTemplate.info : dataItem.infoTemplate ? dataItem.infoTemplate : undefined
                  }
                });
                this._applyEditsOnLayer(newFeatureLayer, dataItem.graphics, def, layerDetailsDefault);
              }
            }), lang.hitch(this, function (err2) {
              console.log(err2.message);
              //to skip failed layer passed null
              def.reject(null);

            }));
          } else {
            //to skip failed layer passed null
            def.reject(null);
          }
        }), lang.hitch(this, function (err1) {
          console.log(err1.message);
          //to skip failed layer passed null
          def.reject(null);
        }));
        return def;
      },

      _applyEditsOnLayer: function (layer, graphics, def, layerDetailsDefault) {
        var newGraphics = [];
        array.forEach(graphics, function (g) {
          //if attributes found - pass d attributes else add blank obj
          if (g.attributes) {
            newGraphics.push(new Graphic(g.geometry, null, g.attributes));
          } else {
            newGraphics.push(new Graphic(g.geometry, null, {}));
          }
        }, this);
        layer.applyEdits(newGraphics, null, null).then(
          lang.hitch(this, function () {
            def.resolve(layerDetailsDefault);
          })).otherwise(lang.hitch(this, function (err) {
            console.log(err.message);
            //to skip failed layer passed null
            def.reject(null);
          }));
      },

      _createFeatureService: function (layerDetailsDefault) {
        var serviceUrl = this._portalUrl +
          "sharing/content/users/" + this._credential.userId + "/createService";
        //create the service
        var def = esriRequest({
          url: serviceUrl,
          content: {
            f: "json",
            token: this._credential.token,
            typeKeywords: "ArcGIS Server,Data,Feature Access,Feature Service,Service,Hosted Service",
            createParameters: JSON.stringify(this._getFeatureServiceParams(layerDetailsDefault)),
            outputType: "featureService"
          },
          handleAs: "json",
          callbackParamName: "callback"
        }, {
          usePost: true
        });
        return def;
      },

      _getFeatureServiceParams: function (featureServiceName) {
        return {
          "name": featureServiceName + "_" + new Date().getTime(),// like originalLayerName_timestamp
          "serviceDescription": "",
          "hasStaticData": false,
          "maxRecordCount": 1000,
          "supportedQueryFormats": "JSON",
          "capabilities": "Create,Delete,Query,Update,Editing",
          "tags": "",
          "description": "",
          "copyrightText": "",
          "spatialReference": {
            "wkid": 102100
          },
          "initialExtent": {
            "xmin": this.map.extent.xmin,
            "ymin": this.map.extent.ymin,
            "xmax": this.map.extent.xmax,
            "ymax": this.map.extent.ymax,
            "spatialReference": {
              "wkid": 102100
            }
          },
          "allowGeometryUpdates": true,
          "units": "esriMeters",
          "xssPreventionInfo": {
            "xssPreventionEnabled": true,
            "xssPreventionRule": "InputOnly",
            "xssInputRule": "rejectInvalid"
          }
        };
      },

      _addDefinitionToService: function (serviceUrl, defParams) {
        var def = esriRequest({
          url: serviceUrl,
          content: {
            token: this._credential.token,
            addToDefinition: JSON.stringify(defParams),
            f: "json"
          },
          handleAs: "json",
          callbackParamName: "callback"
        }, {
          usePost: true
        });
        return def;
      },

      /* jshint loopfunc:true */
      _createLayer: function (li) {
        var gl = {
          'point': "esriGeometryPoint",
          'polyline': "esriGeometryPolyline",
          'polygon': "esriGeometryPolygon"
        };
        var nls = this.nls;
        var g = li.graphics[0];
        var gt = gl[typeof (g.geometry) !== 'undefined' ? g.geometry.type : g.type];
        var symbol = g.symbol ? g.symbol.toJson() : "";
        var fields = [{
          name: "ObjectID",
          alias: "ObjectID",
          type: "esriFieldTypeOID"
        }, {
          name: nls.snapshot_append,
          alias: nls.snapshot_append,
          type: "esriFieldTypeString"
        }];
        if (li.fields && li.fields.length > 0) {
          array.forEach(li.fields, function (field) {
            fields.push({
              name: field.name,
              alias: field.alias,
              type: field.type,
              domain: field.domain
            });
          });
        }

        var extent = {
          xmin: this.extent.xmin,
          ymin: this.extent.ymin,
          xmax: this.extent.xmax,
          ymax: this.extent.ymax,
          spatialReference: this.extent.spatialReference
        };

        var renderer = li.renderer && li.renderer.toJson ? li.renderer.toJson() : li.renderer ?
          JSON.stringify(li.renderer) : {
            type: "simple",
            label: '',
            description: '',
            symbol: symbol
          };
        return {
          "layers": [{
            "adminLayerInfo": {
              "geometryField": {
                "name": "Shape"
              },
              "xssTrustedFields": ""
            },
            "id": 0,
            "name": li.name,
            "type": "Feature Layer",
            "displayField": "",
            "description": li.description,
            "tags": "SA",
            "copyrightText": "",
            "defaultVisibility": true,
            "ownershipBasedAccessControlForFeatures": {
              "allowOthersToQuery": false,
              "allowOthersToDelete": false,
              "allowOthersToUpdate": false
            },
            "relationships": [],
            "isDataVersioned": false,
            "supportsCalculate": true,
            "supportsAttachmentsByUploadId": true,
            "supportsRollbackOnFailureParameter": true,
            "supportsStatistics": true,
            "supportsAdvancedQueries": true,
            "supportsValidateSql": true,
            "supportsCoordinatesQuantization": true,
            "supportsApplyEditsWithGlobalIds": true,
            "advancedQueryCapabilities": {
              "supportsPagination": true,
              "supportsQueryWithDistance": true,
              "supportsReturningQueryExtent": true,
              "supportsStatistics": true,
              "supportsOrderBy": true,
              "supportsDistinct": true,
              "supportsQueryWithResultType": true,
              "supportsSqlExpression": true,
              "supportsReturningGeometryCentroid": true
            },
            "useStandardizedQueries": false,
            "geometryType": gt,
            "minScale": 0,
            "maxScale": 0,
            "extent": extent,
            "drawingInfo": {
              "renderer": renderer
            },
            "allowGeometryUpdates": true,
            "hasAttachments": false,
            "htmlPopupType": "esriServerHTMLPopupTypeNone",
            "hasM": false,
            "hasZ": false,
            "objectIdField": "OBJECTID",
            "globalIdField": "",
            "typeIdField": "",
            "fields": this._getLayerFields(li.fields),
            "indexes": [],
            "types": [],
            "templates": [{
              "name": "New Feature",
              "description": "",
              "drawingTool": "esriFeatureEditToolPolygon",
              "prototype": {
                "attributes": {
                }
              }
            }],
            "supportedQueryFormats": "JSON",
            "hasStaticData": false,
            "maxRecordCount": 10000,
            "standardMaxRecordCount": 4000,
            "tileMaxRecordCount": 4000,
            "maxRecordCountFactor": 1,
            "exceedsLimitFactor": 1,
            "capabilities": "Query,Editing,Create,Update,Delete"
          }]
        };
      },

      _getLayerFields: function (layerFields) {
        var fields = [{
          "name": "OBJECTID",
          "type": "esriFieldTypeOID",
          "actualType": "int",
          "alias": "OBJECTID",
          "sqlType": "sqlTypeOther",
          "nullable": false,
          "editable": false,
          "domain": null,
          "defaultValue": null
        }];
        array.forEach(layerFields, lang.hitch(this, function (field) {
          if (field.type === "esriFieldTypeString") {
            field.actualType = "nvarchar";
            field.sqlType = "sqlTypeNVarchar";
          }
          fields.push(field);
        }));
        return fields;
      }
    });
    return Snapshot;
  });