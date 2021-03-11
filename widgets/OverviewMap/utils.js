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

define(['dojo/_base/lang', 'dojo/_base/array',// 'dojo/_base/html',
  "dojo/string",
  'dojo/Deferred',
  "esri/lang",
  'esri/request',
  //"esri/geometry/Extent",
  "dojo/_base/url",
  "esri/layers/TileInfo",
  "jimu/portalUtils",
  // "esri/layers/layer",
  // "esri/layers/TiledMapServiceLayer",
  // "esri/SpatialReference",
  "esri/layers/ArcGISTiledMapServiceLayer",
  "esri/layers/ArcGISDynamicMapServiceLayer",
  "esri/layers/ArcGISImageServiceLayer",
  //"esri/layers/WebTiledLayer",
  "esri/virtualearth/VETiledLayer",
  "esri/layers/OpenStreetMapLayer",
  "esri/layers/ImageParameters"
],
  function (lang, array,/* html,*/ string, Deferred, esriLang, esriRequest,/* Extent,*/ Url, TileInfo, portalUtils,/* Layer, TiledMapServiceLayer, SpatialReference,*/
    ArcGISTiledMapServiceLayer, ArcGISDynamicMapServiceLayer, ArcGISImageServiceLayer,
    /*WebTiledLayer, */VETiledLayer, OpenStreetMapLayer, ImageParameters) {
    var mo = {};

    mo.TYPE = {
      "BASE_MAP": "baseMap",
      "ARCGIS_TILED_MAP": "tiledMapService",
      "ARCGIS_DYNAMIC_MAP_SERVICE": "dynamicMapService",
      "ARCGIS_IMAGE_SERVICE": "imageService",
      "OSM": "openStreetMap",
      "BING_ROAD": "bingMapsRoad",
      "BING_AERIAL": "bingMapsAerial",
      "BING_HYBRID": "bingMapsHybrid"
    };

    mo.createBaseLayer = function (baseLayer, map, that) {
      var def = new Deferred();
      var layer = null;
      var url = baseLayer.url,
        type = baseLayer.type,
        //tileLayer = baseLayer.tileLayerInfo,
        veLayer = baseLayer.veLayerInfo;

      if (type === mo.TYPE.BASE_MAP) {
        def.resolve({ layer: "BaseMap" });//use raw BaseMap
      } else if (type === mo.TYPE.ARCGIS_TILED_MAP) {
        mo.valid.isArcGISLayersValid(url, map, type).then(function (isValid) {
          if (isValid && true === isValid.res) {
            layer = new ArcGISTiledMapServiceLayer(url/*, param*/);
            def.resolve({ layer: layer });
          } else {
            //console.error(isValid.err);
            def.resolve({ layer: null, err: isValid.err });
          }

        }, function (err) {
          def.resolve({ res: false, err: err });
        });
      } else if (type === mo.TYPE.ARCGIS_DYNAMIC_MAP_SERVICE) {
        mo.valid.isArcGISLayersValid(url, map, type).then(function (isValid) {
          if (isValid && true === isValid.res) {
            var info = isValid.info;
            var mslOptions = {};
            if (info && info.supportedImageFormatTypes &&
              info.supportedImageFormatTypes.indexOf("PNG24") !== -1) {
              mslOptions.imageParameters = new ImageParameters();
              mslOptions.imageParameters.format = "png24";
            }
            layer = new ArcGISDynamicMapServiceLayer(url, mslOptions);//2.2
            def.resolve({ layer: layer });
          } else {
            def.resolve({ layer: null, err: isValid.err });
          }

        }, function (err) {
          def.resolve({ res: false, err: err });
        });
      } else if (type === mo.TYPE.ARCGIS_IMAGE_SERVICE) {
        mo.valid.isArcGISLayersValid(url, map, type).then(function (isValid) {
          if (isValid && true === isValid.res) {
            layer = new ArcGISImageServiceLayer(url, {});//2.3
            def.resolve({ layer: layer });
          } else {
            def.resolve({ layer: null, err: isValid.err });
          }

        }, function (err) {
          def.resolve({ res: false, err: err });
        });
      } else if (type === mo.TYPE.OSM) {
        //OpenStreetMapLayer
        layer = new OpenStreetMapLayer(url, {/*id: id*/ });
        def.resolve({ layer: layer });
      } else if ((type === mo.TYPE.BING_ROAD || type === mo.TYPE.BING_AERIAL || type === mo.TYPE.BING_HYBRID) &&
        veLayer) {

        var key = mo.layers.getBingMapKey(that);
        if (!key || !veLayer.isKeyInPortal) {
          key = "__invalidKey";//set "__invalidKey" to show widget panel, when no key in portal
          console.error("OverviewMap Error: BingMapsKey must be provided");
        }
        layer = new VETiledLayer({
          bingMapsKey: key,
          mapStyle: mo.layers._getVEStyle(type)
        });
        def.resolve({ layer: layer });
      } else {
        def.resolve({ layer: null });//DO NOT SUPPORT
      } /* TODO WebTiledLayer
      else if (type === "WebTiled" && tileLayer) {
        //if (!canAdd) {}
      } */

      return def;
    };

    //layers
    mo.layers = {
      _getLayerInfoSR: function (info) {
        var infoSR = info.spatialReference || (info.extent && info.extent.spatialReference);
        return infoSR;
      },
      _getTileServers: function (tileLayer) {
        var _tileServers = [];
        var url = new Url(tileLayer.url);
        if (tileLayer.subDomains && tileLayer.subDomains.length > 0 && url.authority.split(".").length > 1) {
          var subDomainTileServer;
          array.forEach(tileLayer.subDomains, function (subDomain) {
            if (url.authority.indexOf("${subDomain}") > -1) {
              subDomainTileServer = url.scheme + "://" +
                string.substitute(url.authority, { subDomain: subDomain }) + "/";
            }
            else if (url.authority.indexOf("{subDomain}") > -1) {
              subDomainTileServer = url.scheme + "://" + url.authority.replace(/\{subDomain\}/gi, subDomain) + "/";
            }
            _tileServers.push(subDomainTileServer);
          }, this);
        }

        if (_tileServers && _tileServers.length > 0) {
          return _tileServers;
        } else {
          return null;
        }
      },
      _getVEStyle: function (VEStyle) {
        switch (VEStyle) {
          case mo.TYPE.BING_AERIAL: {
            return VETiledLayer.MAP_STYLE_AERIAL;
          } case mo.TYPE.BING_HYBRID: {
            return VETiledLayer.MAP_STYLE_AERIAL_WITH_LABELS;
          } case mo.TYPE.BING_ROAD: {
            return VETiledLayer.MAP_STYLE_ROAD;
          } default: {
            return VETiledLayer.MAP_STYLE_AERIAL;
          }
        }
      },
      fetchLayerInfo: function (url) {
        var def = new Deferred();
        esriRequest({
          url: url,
          handleAs: 'json',
          callbackParamName: 'callback',
          timeout: 15000,
          content: { f: 'json' }
        }).then(lang.hitch(this, function (res) {
          var layerObject = res;
          def.resolve(layerObject);
        }), function (err) {
          def.reject(err);
        });
        return def;
      },
      getBingMapKey: function (that) {
        //setting || runtime
        var portal = window.portalSelf || (that && portalUtils.getPortal(that.appConfig.portalUrl));

        if (portal && portal.bingKey) {
          return portal.bingKey;
        } else {
          return "";
        }
      }
    };

    //validations
    mo.valid = {
      baseLayerVerification: function (baseLayerObj, map) {
        var def = new Deferred();
        var mapSR = map.spatialReference;
        mo.createBaseLayer(baseLayerObj, map).then(function (res) {
          if (res.layer) {
            var layerSr = mo.layers._getLayerInfoSR(res.layer);
            var isSameSR = mo.valid.sameSpatialReference(mapSR, layerSr);
            if (isSameSR || res.layer === "BaseMap") {
              def.resolve({ res: true });
            } else {
              def.resolve({ res: false });
            }
          } else {
            def.resolve({ res: false, err: res.err });
          }
        }, function (err) {
          def.resolve({ res: false, err: err });
        });
        return def;
      },

      ArcGISLayersTypeVerification: function (url, info, type) {
        var lc = url.toLowerCase();
        if (lc.indexOf("/featureserver") > 0 || lc.indexOf("/mapserver") > 0) {
          if (info && typeof info.type === "string" &&
            (info.type === "Feature Layer" || info.type === "Table")) {
            return false;//DO NOT SUPPORT
          } else {
            if (lc.indexOf("/featureserver") > 0) {
              return false;//DO NOT SUPPORT
            } else if (lc.indexOf("/mapserver") > 0) {
              if (info.tileInfo) {
                if (type === mo.TYPE.ARCGIS_TILED_MAP || type === mo.TYPE.ARCGIS_DYNAMIC_MAP_SERVICE) {
                  return true;
                } else {
                  return false;
                }
              } else {
                if (type === mo.TYPE.ARCGIS_DYNAMIC_MAP_SERVICE) {
                  return true;
                } else {
                  return false;
                }
              }
            }
          }
        } else if (lc.indexOf("/imageserver") > 0) {
          if (type === mo.TYPE.ARCGIS_IMAGE_SERVICE) {
            return true;
          } else {
            return false;
          }
        }
      },
      isArcGISLayersValid: function (url, map, type) {
        var def = new Deferred();

        mo.layers.fetchLayerInfo(url).then(function (info) {
          var infoSR = null,
            mapSR = null;
          infoSR = mo.layers._getLayerInfoSR(info);
          mapSR = (map && map.spatialReference);

          if (infoSR && mapSR && mo.valid.sameSpatialReference(mapSR, infoSR)) {
            if (true === mo.valid.ArcGISLayersTypeVerification(url, info, type)) {
              def.resolve({ res: true, info: info });
            } else {
              def.resolve({ res: false, err: "layerType"});//TODO layer type err
            }
          } else if (infoSR && mapSR && !mo.valid.sameSpatialReference(mapSR, infoSR)) {
            def.resolve({ res: false, err: "wkid" });
          } else {
            def.resolve({ res: false });
          }
        }, function (err) {
          def.resolve({ res: false, err: err });
        }/*).otherwise(function (error) {
          def.reject({ layer: null, err: error });
        }*/);
        return def;
      },

      tileInfoStr: function (str) {
        try {
          new TileInfo(JSON.parse(str));
          return true;
        } catch (error) {
          return error;
        }
      },

      isHaveBingKey: function () {
        if (mo.layers.getBingMapKey()) {
          return true;
        } else {
          return false;
        }
      },

      sameSpatialReference: function (sp1, sp2) {
        var mercator = [102113, 102100, 3857, 4326];//add 4326 for WAB-Widget
        if (sp1 && sp2 && esriLang.isDefined(sp1.wkid) && esriLang.isDefined(sp2.wkid) &&
          //arcgisonline.map.main.contains(mercator, sp1.wkid) &&
          //arcgisonline.map.main.contains(mercator, sp2.wkid)
          -1 !== mercator.indexOf(sp1.wkid) &&
          -1 !== mercator.indexOf(sp2.wkid)
        ) {
          return true;
        } else if (sp1 && sp2 &&
          (
            esriLang.isDefined(sp1.wkid) && esriLang.isDefined(sp2.wkid) && sp1.wkid === sp2.wkid ||
            (esriLang.isDefined(sp1.latestWkid) && esriLang.isDefined(sp2.wkid) && sp1.latestWkid === sp2.wkid) ||
            (esriLang.isDefined(sp1.wkid) && esriLang.isDefined(sp2.latestWkid) && sp1.wkid === sp2.latestWkid) ||
            (esriLang.isDefined(sp1.latestWkid) && esriLang.isDefined(sp2.latestWkid) &&
              sp1.latestWkid === sp2.latestWkid)
          )
        ) {
          return true;
        } else if (sp1 && sp2 && esriLang.isDefined(sp1.wkt) && esriLang.isDefined(sp2.wkt) && sp1.wkt === sp2.wkt) {
          return true;
        }

        return false;
      }
    };

    /********/
    // mo.createBaseLayer_autoType = function (baseLayer, map) {
    //   var def = new Deferred();
    //   var layer = null;
    //   var url = baseLayer.url,
    //     type = baseLayer.type,
    //     tileLayer = baseLayer.tileLayerInfo,
    //     veLayer = baseLayer.veLayerInfo;
    //   var lc = url.toLowerCase();

    //   if (type === "BaseMap") {
    //     def.resolve({ layer: "BaseMap" });//use raw BaseMap
    //   } else if (type === "ArcGIS") {
    //     mo.layers.fetchLayerInfo(url).then(function (info) {
    //       var infoSR = null, mapSR = null;
    //       infoSR = mo.layers._getLayerInfoSR(info);
    //       mapSR = (map && map.spatialReference);
    //       if (infoSR && mapSR && !mo.valid.sameSpatialReference(mapSR, infoSR)) {
    //         def.resolve({ layer: null, err: "wkid" });
    //       } else {
    //         //2 same wkid
    //         if (lc.indexOf("/featureserver") > 0 || lc.indexOf("/mapserver") > 0) {
    //           if (info && typeof info.type === "string" &&
    //             (info.type === "Feature Layer" || info.type === "Table")) {
    //             def.resolve({ layer: null });//DO NOT SUPPORT
    //           } else {
    //             if (lc.indexOf("/featureserver") > 0) {
    //               def.resolve({ layer: null });//DO NOT SUPPORT
    //             } else if (lc.indexOf("/mapserver") > 0) {
    //               if (info.tileInfo) {
    //                 layer = new ArcGISTiledMapServiceLayer(url/*, param*/);//2.1
    //                 def.resolve({ layer: layer });
    //               } else {
    //                 var mslOptions = {/* id: id*/ };
    //                 if (info && info.supportedImageFormatTypes &&
    //                   info.supportedImageFormatTypes.indexOf("PNG24") !== -1) {
    //                   mslOptions.imageParameters = new ImageParameters();
    //                   mslOptions.imageParameters.format = "png24";
    //                 }
    //                 layer = new ArcGISDynamicMapServiceLayer(url, mslOptions);//2.2
    //                 def.resolve({ layer: layer });
    //               }
    //             }
    //           }
    //         } else if (lc.indexOf("/imageserver") > 0) {
    //           layer = new ArcGISImageServiceLayer(url, {/*id: id*/ });//2.3
    //           def.resolve({ layer: layer });
    //         }
    //       }
    //     }).otherwise(function (error) {
    //       def.reject({ layer: null, err: error });
    //     });
    //   } else if (type === "OSM") {
    //     //OpenStreetMapLayer
    //     layer = new OpenStreetMapLayer(url, {/*id: id*/ });
    //     def.resolve({ layer: layer });
    //   } else if (type === "WebTiled" && tileLayer) {
    //     //WebTiledLayer TODO if (!canAdd) {}
    //     tileLayer.url = tileLayer.url.replace(/{subdomain}/i, '{subDomain}');// fix URL
    //     tileLayer.url = tileLayer.url.replace(/{level}/i, '{level}');
    //     tileLayer.url = tileLayer.url.replace(/{col}/i, '{col}');
    //     tileLayer.url = tileLayer.url.replace(/{row}/i, '{row}');
    //     var _fullExtent = new Extent(tileLayer.extent);
    //     //fullExtent = (tileLayer.fullExtent instanceof Extent) ? tileLayer.fullExtent : (tileLayer.fullExtent ? esri.geometry.Extent(tileLayer.fullExtent) : null);
    //     var param = {
    //       id: "WebTiled_" + Math.floor(Math.random() * 10001),
    //       visible: true,
    //       visibility: true,
    //       opacity: 1,
    //       identify: false,
    //       title: tileLayer.tile,
    //       copyright: tileLayer.credits,
    //       fullExtent: _fullExtent,//TODO
    //       initialExtent: _fullExtent,//TODO
    //       //subDomains: tileLayer.subDomains, //API DO NOT pass this
    //       tileServers: mo.layers._getTileServers(tileLayer)
    //       //_addedVia: "url",
    //       //snippet: "",
    //       //wmtsInfo: tileLayer.wmtsInfo,
    //       //refreshInterval: tileLayer.refreshInterval,
    //     };
    //     if (tileLayer.tileInfo && true === mo.valid.tileInfoStr(tileLayer.tileInfo)) {
    //       param.tileInfo = new TileInfo(JSON.parse(tileLayer.tileInfo));
    //     }

    //     layer = new WebTiledLayer(tileLayer.url, param);
    //     def.resolve({ layer: layer });
    //   } else if (type === "VETiled" && veLayer) {
    //     var key = mo.layers.getBingMapKey();
    //     if (!key || !veLayer.isKeyInPortal) {
    //       key = "__invalidKey";//set "__invalidKey" to show widget panel, when no key in portal
    //       console.error("OverviewMap Error: BingMapsKey must be provided");
    //     }
    //     layer = new VETiledLayer({
    //       bingMapsKey: key,
    //       mapStyle: mo.layers._getVEStyle(veLayer.style)
    //     });
    //     def.resolve({ layer: layer });
    //   } else {
    //     def.resolve({ layer: null });//DO NOT SUPPORT
    //   }

    //   return def;
    // };

    return mo;
  });