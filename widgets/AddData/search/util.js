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
define(["dojo/_base/array",
    "dojo/aspect",
    "dojo/io-query",
    "esri/InfoTemplate",
    "esri/layers/WFSLayer"],
  function(array, aspect, ioQuery, InfoTemplate, WFSLayer) {

    return {

      checkMixedContent: function(uri) {
        if ((typeof window.location.href === "string") &&
          (window.location.href.indexOf("https://") === 0)) {
          if ((typeof uri === "string") && (uri.indexOf("http://") === 0)) {
            uri = "https:" + uri.substring("5");
          }
        }
        return uri;
      },

      endsWith: function(sv, sfx) {
        return (sv.indexOf(sfx, (sv.length - sfx.length)) !== -1);
      },

      escapeForLucene: function(value) {
        var a = ['+', '-', '&', '!', '(', ')', '{', '}', '[', ']',
        '^', '"', '~', '*', '?', ':', '\\'];
        var r = new RegExp("(\\" + a.join("|\\") + ")", "g");
        return value.replace(r, "\\$1");
      },

      findLayersAdded: function(map, itemId) {
        var ids = [],
          itemIds = [],
          layers = [];
        var response = {
          itemIds: itemIds,
          layers: layers
        };
        if (!map) {
          return response;
        }
        var checkId = (typeof itemId === "string" && itemId.length > 0);
        array.forEach(map.layerIds, function(id) {
          ids.push(id);
        });
        array.forEach(map.graphicsLayerIds, function(id) {
          ids.push(id);
        });
        array.forEach(ids, function(id) {
          var lyr = map.getLayer(id);
          if (lyr && typeof lyr.xtnItemId === "string" && lyr.xtnItemId.length > 0) {
            //console.warn("found added layer",lyr);
            if (!checkId || lyr.xtnItemId === itemId) {
              layers.push(lyr);
              if (itemIds.indexOf(lyr.xtnItemId) === -1) {
                itemIds.push(lyr.xtnItemId);
              }
            }
          }
        });
        return response;
      },

      loadWFSByUrl: function(dfd, map, loader, url, id, addToMap) {
        var h1, h2, h3, title;
        var reqInfo = this.makeOGCRequestInfo(url);
        url = reqInfo.url;
        var layer = new WFSLayer();
        h1 = layer.on("error", function(layerError) {
          if (h1) h1.remove();
          var error = layerError.error;
          dfd.reject(error);
        });
        layer.fromJson(reqInfo,function(layerList){
          try {
            if (h1) h1.remove();
            if (layerList && layerList.push && layerList.length > 0) {
              var lyr = layerList[0];
              var wfsOptions = {
                url: url,
                version: layer._version,
                name: lyr.name
              };
              title = lyr.name || lyr.title;
              if (typeof wfsOptions.version === "string" &&
                  wfsOptions.version.length > 0 &&
                  typeof wfsOptions.name === "string" &&
                  wfsOptions.name.length > 0) {
                var wfsLayer = new WFSLayer({
                  id: id,
                  infoTemplate: new InfoTemplate()
                });
                if (typeof title === "string" && title.length > 0) {
                  wfsLayer.name = title;
                }
                h2 = wfsLayer.on("error", function(layerError) {
                  if (h2) h2.remove();
                  var error = layerError.error;
                  dfd.reject(error);
                });
                h3 = aspect.after(wfsLayer,"_describeFeatureTypeResponse",function() {
                  if (h3) h3.remove();
                  if (wfsLayer.fields && wfsLayer.fields.length > 0) {
                    loader._setFeatureLayerInfoTemplate(wfsLayer);
                  }
                });
                wfsLayer.fromJson(wfsOptions,function(){
                  if (h2) h2.remove();
                  wfsLayer.xtnAddData = true;
                  if (map && addToMap) {
                    map.addLayer(wfsLayer);
                  }
                  dfd.resolve(wfsLayer)
                });
              } else {
                dfd.reject(new Error("Error loading WFSLayer, missing version and/or layer"));
              }
            } else {
              dfd.reject(new Error("Error loading WFSLayer, no layers"));
            }
          } catch(ex) {
            console.warn("Error loading WFSLayer",url);
            console.error(ex);
            dfd.reject(ex);
          }
        });
      },

      makeOGCRequestInfo: function(url) {
        var reqInfo = {url: url};
        var idx = url.indexOf("?");
        if (idx !== -1) {
          reqInfo.url = url.substring(0,idx);
          var k, v, lc, q = url.substring(idx + 1,url.length);
          if (typeof q === "string" && q.length > 0) {
            var qObj = ioQuery.queryToObject(q);
            var qObj2 = {};
            if (qObj) {
              for (k in qObj) {
                if (qObj.hasOwnProperty(k)) {
                  v = qObj[k];
                  lc = k.toLowerCase();
                  if (lc ==="request") {
                  } else if (lc ==="service") {
                  } else if (lc ==="version") {
                    if (typeof v === "string" && v.length > 0) {
                      reqInfo.version = v;
                    }
                  } else if (lc ==="name") {
                    // non-standard parameter
                    if (typeof v === "string" && v.length > 0) {
                      reqInfo.name = v;
                    }
                  } else {
                    qObj2[k] = v;
                  }
                }
              }
              v = ioQuery.objectToQuery(qObj2);
              if (typeof v === "string" && v.length > 0) {
                reqInfo.url = reqInfo.url + "?" + v;
              }
            }
          }
        }
        return reqInfo;
      },

      setNodeText: function(nd, text) {
        nd.innerHTML = "";
        if (text) {
          nd.appendChild(document.createTextNode(text));
        }
      },

      setNodeTitle: function(nd, text) {
        nd.title = "";
        if (text) {
          nd.setAttribute("title", text);
        }
      },

      setNodeHTML: function(nd, html) {
        nd.innerHTML = "";
        if (html) {
          nd.innerHTML = html;
        }
      }

    };

  });
