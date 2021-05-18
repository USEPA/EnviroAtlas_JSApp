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
  "dojo/_base/lang",
  "dojo/_base/connect",
  "dojo/has",
  "esri/kernel",
  'esri/toolbars/draw',
  "esri/graphic",
  "esri/geometry/Polyline",
  "esri/geometry/Polygon",
  "esri/geometry/Multipoint",
  "esri/geometry/Rect"
],
function(declare, lang, connect, has, esriNS, Draw, Graphic, Polyline, Polygon, Multipoint, Rect) {
  var DRAW = declare([Draw], {
    baseClass: 'jimu-draw',
    declaredClass: 'jimu.dijit.Draw',

    //copy this function from esri/toolbars/draw, only overwrite arrow part.
    _onMouseDragHandler: function(evt) {

      // Pressing escape while drawing causing errors for certain draw tools
      // -- Issue #1381
      if(!this._graphic && !this._points.length){
        return;
      }

      // BlackBerry legacy issue (not changing for 3x)
      if (has("esri-touch") && !this._points.length) {
        // BlackBerry Torch certainly needs this
        // to prevent page from panning
        evt.preventDefault();
        return;
      }

      this._dragged = true;
      var snappingPoint;
      if (this.map.snappingManager) {
        snappingPoint = this.map.snappingManager._snappingPoint;
      }
      var start = this._points[0],
          end = snappingPoint || evt.mapPoint,
          map = this.map,
          spatialReference = map.spatialReference,
          _graphic = this._graphic,
          Draw = DRAW,
          startScreenPoint = map.toScreen(start),
          endScreenPoint = map.toScreen(end),
          pts = [],
          a = endScreenPoint.x - startScreenPoint.x,
          b = endScreenPoint.y - startScreenPoint.y,
          numPts = 60,
          d = Math.sqrt(a*a + b*b);

      switch (this._geometryType) {
        case Draw.CIRCLE:
          this._hideTooltip();
          _graphic.geometry = Polygon.createCircle({
                                center: startScreenPoint,
                                r: d,
                                numberOfPoints: numPts,
                                map: map
                              });
          _graphic.setGeometry(_graphic.geometry);
          break;
        case Draw.ELLIPSE:
          this._hideTooltip();
          _graphic.geometry = Polygon.createEllipse({
                                center: startScreenPoint,
                                longAxis: a,
                                shortAxis: b,
                                numberOfPoints: numPts,
                                map: map
                              });
          _graphic.setGeometry(_graphic.geometry);
          break;
        case Draw.TRIANGLE:
          this._hideTooltip();
          pts = [[0,-d],[0.8660254037844386*d,0.5*d],[-0.8660254037844386*d,0.5*d],[0,-d]];
          _graphic.geometry = this._toPolygon(pts, startScreenPoint.x, startScreenPoint.y);
          _graphic.setGeometry(_graphic.geometry);
          break;
        case Draw.ARROW:
          this._hideTooltip();
          var sina = b/d, cosa = a/d, tana = b/a;
          var f = cosa * 0.25 * d, e = 0.25*d/tana, g = sina*0.25*d;

          // pts = [[a,b],[a-f*(1+24/e),b+24*cosa-g],[a-f*(1+12/e),b+12*cosa-g],[-12*sina,12*cosa],[12*sina,-12*cosa],[a-f*(1-12/e),b-12*cosa-g],[a-f*(1-24/e),b-24*cosa-g],[a,b]];
          var _aWidth = this.fillSymbol ? this.fillSymbol.arrowWidth : 12;
          pts = [[a,b],[a-f*(1+_aWidth/e),b+_aWidth*cosa-g],[a-f*(1+_aWidth/2/e),b+_aWidth/2*cosa-g],[-_aWidth/2*sina,_aWidth/2*cosa],[_aWidth/2*sina,-_aWidth/2*cosa],[a-f*(1-_aWidth/2/e),b-_aWidth/2*cosa-g],[a-f*(1-_aWidth/e),b-_aWidth*cosa-g],[a,b]];

          _graphic.geometry = this._toPolygon(pts, startScreenPoint.x, startScreenPoint.y);
          _graphic.setGeometry(_graphic.geometry);
          break;
        case Draw.LEFT_ARROW:
          this._hideTooltip();
          if (a <= 0) {
            pts = [[a,0],[0.75*a,b],[0.75*a,0.5*b],[0,0.5*b],[0,-0.5*b],[0.75*a,-0.5*b],[0.75*a,-b],[a,0]];
          }
          else {
            pts = [[0,0],[0.25*a,b],[0.25*a,0.5*b],[a,0.5*b],[a,-0.5*b],[0.25*a,-0.5*b],[0.25*a,-b],[0,0]];
          }
          _graphic.geometry = this._toPolygon(pts, startScreenPoint.x, startScreenPoint.y);
          _graphic.setGeometry(_graphic.geometry);
          break;
        case Draw.RIGHT_ARROW:
          this._hideTooltip();
          if (a >= 0) {
            pts = [[a,0],[0.75*a,b],[0.75*a,0.5*b],[0,0.5*b],[0,-0.5*b],[0.75*a,-0.5*b],[0.75*a,-b],[a,0]];
          }
          else {
            pts = [[0,0],[0.25*a,b],[0.25*a,0.5*b],[a,0.5*b],[a,-0.5*b],[0.25*a,-0.5*b],[0.25*a,-b],[0,0]];
          }
          _graphic.geometry = this._toPolygon(pts, startScreenPoint.x, startScreenPoint.y);
          _graphic.setGeometry(_graphic.geometry);
          break;
        case Draw.UP_ARROW:
          this._hideTooltip();
          if (b <= 0) {
            pts = [[0,b],[-a,0.75*b],[-0.5*a,0.75*b],[-0.5*a,0],[0.5*a,0],[0.5*a,0.75*b],[a,0.75*b],[0,b]];
          }
          else {
            pts = [[0,0],[-a,0.25*b],[-0.5*a,0.25*b],[-0.5*a,b],[0.5*a,b],[0.5*a,0.25*b],[a,0.25*b],[0,0]];
          }
          _graphic.geometry = this._toPolygon(pts, startScreenPoint.x, startScreenPoint.y);
          _graphic.setGeometry(_graphic.geometry);
          break;
        case Draw.DOWN_ARROW:
          this._hideTooltip();
          if (b >= 0) {
            pts = [[0,b],[-a,0.75*b],[-0.5*a,0.75*b],[-0.5*a,0],[0.5*a,0],[0.5*a,0.75*b],[a,0.75*b],[0,b]];
          }
          else {
            pts = [[0,0],[-a,0.25*b],[-0.5*a,0.25*b],[-0.5*a,b],[0.5*a,b],[0.5*a,0.25*b],[a,0.25*b],[0,0]];
          }
          _graphic.geometry = this._toPolygon(pts, startScreenPoint.x, startScreenPoint.y);
          _graphic.setGeometry(_graphic.geometry);
          break;
        case Draw.RECTANGLE:
          this._hideTooltip();
          pts = [[0,0],[a,0],[a,b],[0,b], [0,0]];
          _graphic.geometry = this._toPolygon(pts, startScreenPoint.x, startScreenPoint.y);
          _graphic.setGeometry(_graphic.geometry);
          break;
        case Draw.LINE:
          _graphic.setGeometry(lang.mixin(_graphic.geometry, { paths:[[[start.x, start.y], [end.x, end.y]]] }));
          break;
        case Draw.EXTENT:
          if (_graphic) {
            map.graphics.remove(_graphic, true);
          }
          var rect = new Rect(this._normalizeRect(start, end, spatialReference));
          // TODO
          // We can remove this once graphics layer is able to duplicate
          // rects/extens when wrapping (we may have to render them as polygons).
          rect._originOnly = true;
          this._graphic = map.graphics.add(new Graphic(rect, this.fillSymbol), true);
          if (map.snappingManager) {
            map.snappingManager._setGraphic(this._graphic);
          }
          // _graphic.setGeometry(dojo.mixin(_graphic.geometry, this._normalizeRect(start, end, spatialReference)));
          break;
        case Draw.FREEHAND_POLYLINE:
          this._hideTooltip();
          if (this._canDrawFreehandPoint(evt) === false){
              if (has("esri-touch")) {
                // BlackBerry Torch certainly needs this
                // to prevent page from panning
                evt.preventDefault();
              }
              return;
          }

          this._points.push(evt.mapPoint.offset(0, 0));
          _graphic.geometry._insertPoints([end.offset(0, 0)], 0);
          _graphic.setGeometry(_graphic.geometry);
          break;
        case Draw.FREEHAND_POLYGON:
          this._hideTooltip();
          if (this._canDrawFreehandPoint(evt) === false){
              if (has("esri-touch")) {
                // BlackBerry Torch certainly needs this
                // to prevent page from panning
                evt.preventDefault();
              }
              return;
          }

          this._points.push(evt.mapPoint.offset(0, 0));
          _graphic.geometry._insertPoints([end.offset(0, 0)], 0);
          _graphic.setGeometry(_graphic.geometry);
          break;
      }

      if (has("esri-touch")) {
        // Prevent iOS from panning the web page
        evt.preventDefault();
      }
    },

    //copy this function from esri/toolbars/draw, only overwrite arrow part.
    _onClickHandler: function(evt) {
      var snappingPoint;
      if (this.map.snappingManager) {
        snappingPoint = this.map.snappingManager._snappingPoint;
      }
      var start = snappingPoint || evt.mapPoint,
          map = this.map,
          screenPoint = map.toScreen(start),
          Draw = DRAW,
          polygon;

      this._points.push(start.offset(0, 0));

      switch (this._geometryType) {
        case Draw.POINT:
          this.onDrawStart();
          this._drawEnd(start.offset(0, 0));
          this._setTooltipMessage(0);
          break;

        case Draw.POLYLINE:
          if (this._points.length === 1) {
            var polyline = new Polyline(map.spatialReference);
            polyline.addPath(this._points);
            this._graphic = map.graphics.add(new Graphic(polyline, this.lineSymbol), true);
            if (map.snappingManager) {
              map.snappingManager._setGraphic(this._graphic);
            }

            this._onMouseMoveHandler_connect = connect.connect(map, "onMouseMove", this._onMouseMoveHandler);
            this.onDrawStart();
          }
          else {
            this._graphic.geometry._insertPoints([start.offset(0, 0)], 0);
            this._graphic.setGeometry(this._graphic.geometry).setSymbol(this.lineSymbol);
          }
          break;

        case Draw.POLYGON:
          if (this._points.length === 1) {
            polygon = new Polygon(map.spatialReference);
            polygon.addRing(this._points);
            this._graphic = map.graphics.add(new Graphic(polygon, this.fillSymbol), true);
            if (map.snappingManager) {
              map.snappingManager._setGraphic(this._graphic);
            }

            this._onMouseMoveHandler_connect = connect.connect(map, "onMouseMove", this._onMouseMoveHandler);
            this.onDrawStart();
          }
          else {
            this._graphic.geometry._insertPoints([start.offset(0, 0)], 0);
            this._graphic.setGeometry(this._graphic.geometry).setSymbol(this.fillSymbol);
          }
          break;

        case Draw.MULTI_POINT:
          var tps = this._points;
          if (tps.length === 1) {
            var multiPoint = new Multipoint(map.spatialReference);
            multiPoint.addPoint(tps[tps.length - 1]);
            this._graphic = map.graphics.add(new Graphic(multiPoint, this.markerSymbol), true);
            if (map.snappingManager) {
              map.snappingManager._setGraphic(this._graphic);
            }
            this.onDrawStart();
          }
          else {
            this._graphic.geometry.addPoint(tps[tps.length - 1]);
            this._graphic.setGeometry(this._graphic.geometry).setSymbol(this.markerSymbol);
          }
          break;

        case Draw.ARROW:
           var _aWidth = this.fillSymbol ? this.fillSymbol.arrowWidth : 12;
           this._addShape(
             //[[0,0],[-24,24],[-24,12],[-96,12],[-96,-12],[-24,-12],[-24,-24],[0,0]],
             [[0,0],[-_aWidth,_aWidth],[-_aWidth,_aWidth/2],[-96,_aWidth/2],[-96,-_aWidth/2],[-_aWidth,-_aWidth/2],[-_aWidth,-_aWidth],[0,0]],
             screenPoint.x,
             screenPoint.y
           );
           break;

        case Draw.LEFT_ARROW:
          this._addShape(
             [[0,0],[24,24],[24,12],[96,12],[96,-12],[24,-12],[24,-24],[0,0]],
             screenPoint.x,
             screenPoint.y
           );
           break;

        case Draw.RIGHT_ARROW:
           this._addShape(
             [[0,0],[-24,24],[-24,12],[-96,12],[-96,-12],[-24,-12],[-24,-24],[0,0]],
             screenPoint.x,
             screenPoint.y
           );
           break;

        case Draw.UP_ARROW:
           this._addShape(
             [[0,0],[-24,24],[-12,24],[-12,96],[12,96],[12,24],[24,24],[0,0]],
             screenPoint.x,
             screenPoint.y
           );
           break;

        case Draw.DOWN_ARROW:
           this._addShape(
             [[0,0],[-24,-24],[-12,-24],[-12,-96],[12,-96],[12,-24],[24,-24],[0,0]],
             screenPoint.x,
             screenPoint.y
           );
           break;

        case Draw.TRIANGLE:
           this._addShape(
             [[0,-48],[41.56921938165306,24],[-41.56921938165306,24],[0,-48]],
             screenPoint.x,
             screenPoint.y
           );
           break;

        case Draw.RECTANGLE:
           this._addShape(
             [[0,-96],[96,-96],[96,0],[0,0], [0,-96]],
             screenPoint.x - 48,
             screenPoint.y + 48
           );
           break;

        case Draw.CIRCLE:
           this._clear();
           this.onDrawStart();
           this._drawEnd(Polygon.createCircle({
             center: screenPoint,
             r: 48,
             numberOfPoints: 60,
             map: map
           }));
           break;

        case Draw.ELLIPSE:
           this._clear();
           this.onDrawStart();
           this._drawEnd(Polygon.createEllipse({
             center: screenPoint,
             longAxis: 48,
             shortAxis: 24,
             numberOfPoints: 60,
             map: map
           }));
           break;
      }

      this._setTooltipMessage(this._points.length);
    }

  });

  lang.mixin(DRAW, {
    POINT: "point",
    MULTI_POINT: "multipoint",
    LINE: "line",
    EXTENT: "extent",
    POLYLINE: "polyline",
    POLYGON:"polygon",
    FREEHAND_POLYLINE:"freehandpolyline",
    FREEHAND_POLYGON:"freehandpolygon",
    ARROW:"arrow",
    LEFT_ARROW:"leftarrow",
    RIGHT_ARROW:"rightarrow",
    UP_ARROW:"uparrow",
    DOWN_ARROW:"downarrow",
    TRIANGLE:"triangle",
    CIRCLE:"circle",
    ELLIPSE:"ellipse",
    RECTANGLE:"rectangle"
  });

  if (has("extend-esri")) {
    lang.setObject("toolbars.Draw", DRAW, esriNS);
  }

  return DRAW;
});