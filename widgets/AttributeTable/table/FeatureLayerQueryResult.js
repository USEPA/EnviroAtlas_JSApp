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
  "esri/main",
  "dojo/_base/lang",
  "dojo/_base/kernel",
  "dojo/_base/Deferred",
  "dojo/DeferredList",
  "dojo/_base/array"
], function(
  esri,
  lang,
  dojo,
  Deferred
){
  var FeatureLayerQueryResult = function (result) {
    if (!result) {
      return result;
    }

    if (result.then) {
      result = lang.delegate(result);
    }

    if (!result.total) {
      result.total = Deferred.when(result, function (result) {
        return esri._isDefined(result.total) ? result.total : (result.length || 0);
      });
    }

    function addIterativeMethod(method) {
      if (!result[method]) {
        result[method] = function () {
          var args = arguments;
          return Deferred.when(result, function (result) {
            Array.prototype.unshift.call(args, (result.features || result));
            return FeatureLayerQueryResult(dojo[method].apply(dojo, args));
          });
        };
      }
    }

    addIterativeMethod("forEach");
    addIterativeMethod("filter");
    addIterativeMethod("map");
    addIterativeMethod("some");
    addIterativeMethod("every");

    return result;
  };
  return FeatureLayerQueryResult;
});