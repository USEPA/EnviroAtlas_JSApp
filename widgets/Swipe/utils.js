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

define(['dojo/_base/lang', 'dojo/_base/array', 'dojo/_base/Color', 'dojo/_base/html'],
  function (lang, array, Color, html) {

    var mo = {};
    mo.defaultColor = "#dadada";//handler default color
    mo.handlerPosition = {
      top: null,
      bottom: null,
      left: null,
      right: null
    };

    mo._isNewAddedLayer = function (layerInfo, layerInfosObj) {
      var webmapLayerInfoArray = layerInfosObj.getLayerInfoArrayOfWebmap();
      for (var i = 0, len = webmapLayerInfoArray.length; i < len; i++) {
        var webmapLayerInfo = webmapLayerInfoArray[i];
        if (webmapLayerInfo.id === layerInfo.id) {
          return false;
        }
      }

      return true;
    };

    mo.zoomToCurrentLayer = function (that) {
      var isZoom = that.config.isZoom,
        layerInfosObj = that.layerInfosObj;
      var selection = that.getSelection();
      var currentLayerId;
      if (selection && selection[0]) {
        currentLayerId = selection[0];
      }

      if (isZoom && currentLayerId) {
        var layerInfo = layerInfosObj.getLayerInfoById(currentLayerId);
        if (!layerInfo || !layerInfo.zoomTo) {
          return;//can't get layer
        }

        layerInfo.zoomTo();//zoom to layer
      }
    };

    mo.shouldHideInfoWindow = function (swipeLayers, that) {
      if (!that.map.infoWindow.isShowing) {
        return false;
      }
      var sf = that.map.infoWindow.getSelectedFeature();
      var inSwipeLayers = swipeLayers && array.some(swipeLayers, function (l) {
        var sfLayer = sf && sf.getLayer && sf.getLayer();
        var layerInfo = that.layerInfosObj.getLayerInfoById(l.id);
        var isSubLayer = sfLayer && layerInfo &&
          layerInfo.traversal(function (linfo) {
            return linfo.id === sfLayer.id;
          });
        return sfLayer === l || isSubLayer;
      }, that);

      return inSwipeLayers;
    };

    mo.getVisibleLayerInfos = function (layerInfosObj, exceptions) {
      var infos = layerInfosObj.getLayerInfoArray();

      if (exceptions) {
        //visible + exceptions
        var res = [];
        for (var i = 0, len = infos.length; i < len; i++) {
          var info = infos[i];

          if (info.isShowInMap()) {
            res.push(info);//1 isShowInMap
          } else {
            for (var j = 0, lenJ = exceptions.length; j < lenJ; j++) {
              var ex = exceptions[j];

              if (ex === info.id) {
                res.push(info);//2 is exception
              }
            }
          }
        }

        return res;
      } else {
        //no exceptions, all visible
        return array.filter(infos, function (info) {
          return info.isShowInMap();
        });
      }
    };

    // mo.revertLayerStateInConfig = function (layerInfosObj, config) {
    //   var res = [];

    //   if (config && config.layerState) {
    //     var layerOptions = config.layerState;
    //     for (var key in layerOptions) {
    //       if (layerOptions.hasOwnProperty(key)) {
    //         var layer = layerOptions[key];
    //         if (true === layer.selected) {//selected in config

    //           var info = layerInfosObj.getLayerInfoById(key);
    //           if (info.isShowInMap()) {
    //             res.push(info);// visible
    //           }
    //         }
    //       }
    //     }
    //   }

    //   return res;
    // };

    mo.isDefaultSelectedLayerAndInShow = function (data, layerInfosObj, config, mode){
      var value, info;
      if (mode === "mult") {
        //mult
        if (config && config.defaultLayers && config.defaultLayers.length) {
          value = data.value;

          for (var i = 0, len = config.defaultLayers.length; i < len; i++) {
            var defaultLayerInSetting = config.defaultLayers[i];

            if (value === defaultLayerInSetting) {
              info = layerInfosObj.getLayerInfoById(value);
              if (info.isShowInMap()) {
                return true;// visible
              }
            }
          }
        }
      } else {
        //single
        if (config && config.layer) {
          value = data.value;
          if (value === config.layer) {
            info = layerInfosObj.getLayerInfoById(value);
            if (info.isShowInMap()) {
              return true;// visible
            }
          }
        }
      }

      return false;
    };

    //whether has layerConfig after setting
    mo.isTherePreconfiguredLayer = function (config, currentLayerId) {
      if (currentLayerId) {
        return true;
      }

      if (config && config.layerState) {
        var layerOptions = config.layerState;
        for (var key in layerOptions) {
          if (layerOptions.hasOwnProperty(key)) {
            var layer = layerOptions[key];
            if (true === layer.selected) {//selected in config
              return true;
            }
          }
        }
      }

      return false;//all disselected
    };

    mo.processColor = function (configColor) {
      if (!configColor) {
        return new Color(mo.defaultColor);
      }

      return new Color(configColor);
    };

    //put swipe bar to center
    mo.getScreenMiddle = function (map) {
      var left = 0,
        top = 0;
      if (map) {
        if (map.root) {
          var mapBox = html.getMarginBox(map.root);
          left = mapBox.w / 2;
          top = mapBox.h / 2;
        } else if (map.width && map.height) {
          left = map.width / 2;
          top = map.height / 2;
        }
      }

      return {
        left: left,
        top: top
      };
    };

    //show or hide chooser
    mo.hideSelectorPopup = function (domNode) {
      html.addClass(domNode, "hide");
    };
    mo.showSelectorPopup = function (domNode) {
      html.removeClass(domNode, "hide");
    };

    //hack to refresh: sometimes need to drag the bar to see the other half
    mo.hackToRefreshSwipe = function (that) {
      setTimeout(lang.hitch(that, function () {
        if (that.swipeDijit.swipe) {
          that.swipeDijit.swipe();
        }
      }), 200);
    };

    //keep Handler's position
    mo.cleanHandlerPosition = function () {
      mo.handlerPosition = {
        top: null,
        bottom: null,
        left: null,
        right: null
      };
    };
    mo.isCacheHandlerPosition = function () {
      if ((mo.handlerPosition.top || mo.handlerPosition.bottom) ||
        (mo.handlerPosition.left || mo.handlerPosition.right)) {
        return true;
      }

      return false;
    };
    mo.saveHandlerPosition = function (data) {
      if (data) {
        mo.handlerPosition.top = data.top;
        mo.handlerPosition.bottom = data.bottom;
        mo.handlerPosition.left = data.left;
        mo.handlerPosition.right = data.right;
        //console.log("SAVE top==>"+data.top+"__bottom==>"+data.bottom+"__left==>"+data.left+"__right==>"+data.right);
      }
    };
    mo.setHandlerPosition = function (option, config, map) {
      if (config.style && config.style === "scope") {
        var hackPos = 9;//the position-error of save/load position in API ,#13359

        if (mo.handlerPosition.top) {
          option.top = mo.handlerPosition.top - hackPos;
        }
        if (mo.handlerPosition.bottom) {
          option.bottom = mo.handlerPosition.bottom;
        }
        if (mo.handlerPosition.left) {
          option.left = mo.handlerPosition.left - hackPos;
        }
        if (mo.handlerPosition.right) {
          option.right = mo.handlerPosition.right;
        }
      } else {
        //style === "vertical"/"horizontal"
        if(config.invertPlacement){
          if (mo.handlerPosition.right) {
            option.right = mo.handlerPosition.right;
          }
          if (mo.handlerPosition.left) {
            option.left = mo.handlerPosition.left;
          }
          if (mo.handlerPosition.bottom) {
            option.bottom = mo.handlerPosition.bottom;
          }
          if (mo.handlerPosition.top) {
            option.top = mo.handlerPosition.top;
          }
        } else {
          //must switch top/buttom and left/right, i think it's api bug
          if (mo.handlerPosition.right) {
            option.left = mo.handlerPosition.right;
          }
          if (mo.handlerPosition.left) {
            option.right = mo.handlerPosition.left;
          }
          if (mo.handlerPosition.bottom) {
            option.top = mo.handlerPosition.bottom;
          }
          if (mo.handlerPosition.top) {
            option.bottom = mo.handlerPosition.top;
          }
        }
      }

      if(option.top < 0){
        option.top = 0;
      }
      if(option.top > map.height){
        option.top = map.height;
      }
      if(option.left < 0){
        option.left = 0;
      }
      if(option.left > map.width){
        option.left = map.width;
      }
    };
    mo.getLayerNode = function (layer) {
      return layer._heatmapManager && layer._heatmapManager.imageLayer &&
        layer._heatmapManager.imageLayer._div || layer._div;
    };
    //API line#600
    mo.getLayerTransform = function (layers, swipeDijit) {
      var layer = layers.layer;
      var tf = { dx: 0, dy: 0 };
      if(layer.getNavigationTransform){
        tf = layer.getNavigationTransform();
      } else  if (layer._getTransform) {
        var tr = layer._getTransform();// get layer transform,if we got the transform object
        if (tr) {
          tf.dx = tr.dx;
          tf.dy = tr.dy;
        }
      } else {
        var layerNode = mo.getLayerNode(layer);
        // Non graphics layer
        // If CSS Transformation is applied to the layer (i.e. swipediv),
        // record the amount of translation and adjust clip rect accordingly
        var divStyle = layerNode.style;
        if (divStyle && swipeDijit.map.navigationMode === "css-transforms") {
          // if style exists get vendor transform value
          var transformValue = swipeDijit._getTransformValue(divStyle);
          // if we have the transform values
          if (transformValue) {
            var t = swipeDijit._parseTransformValue(transformValue);
            tf.dx = t.x;
            tf.dy = t.y;
          }
        }
      }

      return tf;
    };
    return mo;
  });