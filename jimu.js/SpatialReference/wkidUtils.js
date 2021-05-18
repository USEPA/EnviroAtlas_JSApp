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
  'dojo/_base/array',
  'esri/SpatialReference',
  'dojo/text!./wkid.json'
], function(
  declare,
  array,
  SpatialReference,
  wkids
) {
  try {
    var spatialRefs = JSON.parse(wkids);
  } catch (err) {
    throw err;
  }

  var mo = declare(null, function() {
    // nothing
  });


  // coordinate
  mo.isSameSR = function(tWkid, sWkid) {
    var idx = this.indexOfWkid(tWkid),
      idx2 = this.indexOfWkid(sWkid);
    return spatialRefs.labels[idx] === spatialRefs.labels[idx2];
  };

  mo.isValidWkid = function(wkid) {
    return this.indexOfWkid(wkid) > -1;
  };

  mo.getSRLabel = function(wkid) {
    if (this.isValidWkid(wkid)) {
      var i = this.indexOfWkid(wkid);
      return spatialRefs.labels[i];
    }
  };

  mo.indexOfWkid = function(wkid) {
    return array.indexOf(spatialRefs.wkids, wkid);
  };

  mo.isWebMercator = function(wkid) {
    // true if this spatial reference is web mercator
    if (SpatialReference.prototype._isWebMercator) {
      return SpatialReference.prototype._isWebMercator.apply({
        wkid: parseInt(wkid, 10)
      }, []);
    } else {
      var sr = new SpatialReference(parseInt(wkid, 10));
      return sr.isWebMercator();
    }
  };

  mo.standardizeWkid = function(wkid) {
    return this.isWebMercator(wkid) ? 3857 : parseInt(wkid, 10);
  };

  return mo;
});