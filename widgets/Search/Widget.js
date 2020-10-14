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
    'dojo/_base/html',
    'dojo/when',
    'dojo/on',
    'dojo/aspect',
    'dojo/query',
    'dojo/keys',
    'dojo/Deferred',
    'dojo/promise/all',
    "dijit/focus",
    'jimu/BaseWidget',
    'jimu/LayerInfos/LayerInfos',
    'jimu/utils',
    'jimu/SpatialReference/wkidUtils',
    'esri/config',
    'esri/dijit/Search',
    'esri/tasks/locator',
    'esri/layers/FeatureLayer',
    'esri/dijit/PopupTemplate',
    'esri/lang',
    'esri/geometry/Point',
    'esri/geometry/coordinateFormatter',
    'esri/SpatialReference',
    'esri/tasks/query',
    'esri/Color',
    'esri/symbols/SimpleMarkerSymbol',
    'esri/symbols/SimpleFillSymbol',
    'esri/symbols/SimpleLineSymbol',
    './utils',
    'dojo/NodeList-dom'
  ],
  function(declare, lang, array, html, when, on, aspect, query, keys, Deferred, all, focusUtil,
    BaseWidget, LayerInfos, jimuUtils, wkidUtils, esriConfig, Search, Locator,
    FeatureLayer, PopupTemplate, esriLang, Point, coordinateFormatter, SpatialReference, FeatureQuery,
    Color, SimpleMarkerSymbol, SimpleFillSymbol, SimpleLineSymbol, utils) {
    //To create a widget, you need to derive from BaseWidget.
    return declare([BaseWidget], {
      name: 'Search',
      baseClass: 'jimu-widget-search',
      searchDijit: null,
      searchResults: null,
      _startWidth: null,
      _pointOfSpecifiedUtmCache: null,

      postCreate: function() {

        if (this.closeable || !this.isOnScreen) {
          html.addClass(this.searchNode, 'default-width-for-openAtStart');
        }

        this.listenWidgetIds.push('framework');
        this._pointOfSpecifiedUtmCache = {};
      },

      startup: function() {
        this.inherited(arguments);

        if (!(this.config && this.config.sources)) {
          this.config.sources = [];
        }

        coordinateFormatter.load();
        LayerInfos.getInstance(this.map, this.map.itemInfo)
          .then(lang.hitch(this, function(layerInfosObj) {
            this.layerInfosObj = layerInfosObj;
            this.own(this.layerInfosObj.on(
            'layerInfosFilterChanged',
            lang.hitch(this, this.onLayerInfosFilterChanged)));

            utils.setMap(this.map);
            utils.setLayerInfosObj(this.layerInfosObj);
            utils.setAppConfig(this.appConfig);
            when(utils.getConfigInfo(this.config)).then(lang.hitch(this, function(config) {
              return all(this._convertConfig(config)).then(function(searchSouces) {
                return array.filter(searchSouces, function(source) {
                  return source;
                });
              });
            })).then(lang.hitch(this, function(searchSouces) {
              if (!this.domNode) {
                return;
              }

              this.searchDijit = new Search({
                activeSourceIndex: searchSouces.length === 1 ? 0 : 'all',
                allPlaceholder: jimuUtils.stripHTML(esriLang.isDefined(this.config.allPlaceholder) ?
                  this.config.allPlaceholder : ""),
                autoSelect: true,
                enableButtonMode: false,
                enableLabel: false,
                enableHighlight: true,
                enableInfoWindow: true,
                showInfoWindowOnSelect: true,
                map: this.map,
                sources: searchSouces,
                theme: 'arcgisSearch'
              });
              html.place(this.searchDijit.domNode, this.searchNode);
              this.searchDijit.startup();

              this._resetSearchDijitStyle();

              this.own(
                this.searchDijit.watch(
                  'activeSourceIndex',
                  lang.hitch(this, '_onSourceIndexChange')
                )
              );

              this.own(
                on(this.searchDijit, 'search-results', lang.hitch(this, '_onSearchResults'))
              );

              this.own(
                on(this.searchDijit, 'suggest-results', lang.hitch(this, '_onSuggestResults'))
              );

              this.own(
                on(this.searchDijit, 'select-result', lang.hitch(this, '_onSelectResult'))
              );

              this.own(
                on(this.searchDijit, 'clear-search', lang.hitch(this, '_onClearSearch'))
              );

              this.own(
                aspect.around(this.searchDijit, '_search', lang.hitch(this, '_convertSR'))
              );

              this.own(
                aspect.before(this.searchDijit, '_formatResults',
                  lang.hitch(this.searchDijit, function(results, idx, value) {
                  try{
                    var newResults = array.map(results, function(result) {
                      if(result && (result instanceof Error || result.length >= 0)) {
                        return result;
                      } else {
                        return new Error( result && result.message || "Invalid query source or locator" );
                      }
                    });
                    return [newResults, idx, value];
                  } catch (err) {
                    console.log(err && err.message);
                    return [results, idx, value];
                  }
                }))
              );

              /*****************************************
               * Binding events about 508 accessbility
               * ***************************************/

              if(searchSouces.length === 1){
                jimuUtils.initFirstFocusNode(this.domNode, this.searchDijit.inputNode);
              }else{
                jimuUtils.initFirstFocusNode(this.domNode, this.searchDijit.sourcesBtnNode);
              }
              jimuUtils.initLastFocusNode(this.domNode, this.searchDijit.submitNode);
              this.own(on(this.domNode, "keydown", lang.hitch(this, function(evt) {
                if(html.hasClass(evt.target, this.baseClass) && evt.keyCode === keys.ENTER) {//enter to first node
                  this.searchDijit.sourcesBtnNode.focus();
                }
                //esc to close searched list
                else if(!html.hasClass(evt.target, this.baseClass) && evt.keyCode === keys.ESCAPE) {
                  if(html.getStyle(this.searchResultsNode, 'display') === 'block'){
                    html.setStyle(this.searchResultsNode, 'display', 'none');
                  }
                }
              })));

              this.own(
                aspect.around(this.searchDijit, '_inputKey', lang.hitch(this, function(originalFun) {
                  return lang.hitch(this, function(e) {
                    var returnValue = null;
                    if(html.getStyle(this.searchResultsNode, 'display') === 'block') {
                      console.log("searchResultsNode");
                      this._inputKey(e);
                    } else {
                      returnValue = originalFun.apply(this.searchDijit, [e]);
                    }
                    return returnValue;
                  });
                }))
              );

              /*****************************************
               * Binding events for control result menu
               * ***************************************/
              this.own(
                on(this.searchDijit.domNode, 'click', lang.hitch(this, '_onSearchDijitClick'))
              );

              this.own(on(this.searchDijit.inputNode, "keyup", lang.hitch(this, function(e) {
                if (e.keyCode !== keys.ENTER && e.keyCode !== keys.UP_ARROW && e.keyCode !== keys.DOWN_ARROW) {
                  this._onClearSearch();
                }
              })));

              this.own(
                on(this.searchResultsNode, 'li:click', lang.hitch(this, '_onSelectSearchResult'))
              );
              this.own(
                on(this.searchResultsNode, 'li:keyup', lang.hitch(this, '_onSearchResultLiKey'))
              );

              this.own(on(
                this.searchResultsNode,
                '.show-all-results:click',
                lang.hitch(this, '_showResultMenu')
              ));

              this.own(
                on(window.document, 'click', lang.hitch(this, function(e) {
                  if (!html.isDescendant(e.target, this.searchResultsNode)) {
                    this._hideResultMenu();
                    this._resetSelectorPosition('.show-all-results');
                  }
                  if (!html.isDescendant(e.target, this.searchDijit.suggestionsNode)) {
                    this._hideSuggestionsMenu();
                  }
                }))
              );
              this.fetchData('framework');
            }));
          }));
      },

      _convertConfig: function(config) {
        var sourceDefs = array.map(config.sources, lang.hitch(this, function(source) {
          var def = new Deferred();
          if (source && source.url && source.type === 'locator') {
            var _source = {
              locator: new Locator(source.url || ""),
              outFields: ["*"],
              singleLineFieldName: source.singleLineFieldName || "",
              name: jimuUtils.stripHTML(source.name || ""),
              placeholder: jimuUtils.stripHTML(source.placeholder || ""),
              countryCode: source.countryCode || "",
              maxResults: source.maxResults || 6,
              zoomScale: source.zoomScale || 50000,
              useMapExtent: !!source.searchInCurrentMapExtent,
              enableInfoWindow: esriLang.isDefined(this.config.showInfoWindowOnSelect) ?
                !!this.config.showInfoWindowOnSelect : true,
              showInfoWindowOnSelect: esriLang.isDefined(this.config.showInfoWindowOnSelect) ?
                !!this.config.showInfoWindowOnSelect : true,
              _zoomScaleOfConfigSource: source.zoomScale,
              _panToScale: source.panToScale
            };

            if(source.maxSuggestions === 0) {
              _source.enableSuggestions = false;
            } else if (source.maxSuggestions === null || source.maxSuggestions === undefined) {
              _source.maxSuggestions = 6;
            } else {
              _source.maxSuggestions = source.maxSuggestions;
            }

            if (source.enableLocalSearch) {
              _source.localSearchOptions = {
                minScale: source.localSearchMinScale,
                distance: this._getLocalSearchDistance(source)
              };
            }

            if (source.panToScale || source.zoomScale) {
              _source.autoNavigate = false;
            }

            def.resolve(_source);
          } else if (source && source.url && source.type === 'query') {
            var searchLayer = new FeatureLayer(source.url || null, {
              outFields: ["*"]
            });

            this.own(on(searchLayer, 'load', lang.hitch(this, function(result) {
              var flayer = result.layer;

              // identify the data source
              var sourceLayer = this.map.getLayer(source.layerId);
              var sourceLayerInfo = this.layerInfosObj.getLayerInfoById(source.layerId);
              var showInfoWindowOnSelect;
              var enableInfoWindow;
              if(sourceLayer) {
                // pure feature service layer defined in the map
                showInfoWindowOnSelect = false;
                enableInfoWindow = false;
              } else if (sourceLayerInfo){
                // feature service layer defined in the map
                showInfoWindowOnSelect = false;
                enableInfoWindow = false;
              } else {
                // data source from the outside
                showInfoWindowOnSelect = esriLang.isDefined(this.config.showInfoWindowOnSelect) ?
                  !!this.config.showInfoWindowOnSelect : true;
                enableInfoWindow = esriLang.isDefined(this.config.showInfoWindowOnSelect) ?
                  !!this.config.showInfoWindowOnSelect : true;
              }

              var fNames = null;
              if (source.searchFields && source.searchFields.length > 0) {
                fNames = source.searchFields;
              } else {
                fNames = [];
                array.forEach(flayer.fields, function(field) {
                  if (field.type !== "esriFieldTypeOID" && field.name !== flayer.objectIdField &&
                    field.type !== "esriFieldTypeGeometry") {
                    fNames.push(field.name);
                  }
                });
              }

              var convertedSource = {
                featureLayer: flayer,
                outFields: ["*"],
                searchFields: fNames,
                autoNavigate: false,
                displayField: source.displayField || "",
                exactMatch: !!source.exactMatch,
                name: jimuUtils.stripHTML(source.name || ""),
                placeholder: jimuUtils.stripHTML(source.placeholder || ""),
                maxResults: source.maxResults || 6,
                zoomScale: source.zoomScale || 50000,
                //infoTemplate: lang.clone(template),
                useMapExtent: !!source.searchInCurrentMapExtent,
                showInfoWindowOnSelect: showInfoWindowOnSelect,
                enableInfoWindow: enableInfoWindow,
                _featureLayerId: source.layerId,
                _zoomScaleOfConfigSource: source.zoomScale,
                _panToScale: source.panToScale
              };
              /*
              if (!template) {
                delete convertedSource.infoTemplate;
              }
              */

              if(source.maxSuggestions === 0) {
                convertedSource.enableSuggestions = false;
              } else if (source.maxSuggestions === null || source.maxSuggestions === undefined) {
                convertedSource.maxSuggestions = 6;
              } else {
                convertedSource.maxSuggestions = source.maxSuggestions;
              }

              if (convertedSource._featureLayerId) {
                var layerInfo = this.layerInfosObj
                  .getLayerInfoById(convertedSource._featureLayerId);
                if(layerInfo) {
                  flayer.setDefinitionExpression(layerInfo.getFilter());
                }
              }

              //var template = this._getInfoTemplate(flayer, source, source.displayField);
              this._getInfoTemplate(flayer, source).then(lang.hitch(this, function(infoTemplate){
                //convertedSource.infoTemplate = lang.clone(infoTemplate);
                convertedSource.infoTemplate = infoTemplate;
                def.resolve(convertedSource);
              }), lang.hitch(this, function() {
                def.resolve(convertedSource);
              }));

              if(sourceLayerInfo) {
                if(searchLayer.geometryType === "esriGeometryPoint") {
                  convertedSource.highlightSymbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE,
                                                                     10,
                                                                     new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                                                                                          new Color([0, 255, 255, 0.0]),
                                                                                          2),
                                                                     new Color([0, 0, 0, 0.0]));
                } else if(searchLayer.geometryType === "esriGeometryPolyline") {
                  convertedSource.highlightSymbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                                                                         new Color([0, 255, 255, 0.0]),
                                                                         2);
                } else if(searchLayer.geometryType === "esriGeometryPolygon") {
                  convertedSource.highlightSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_NULL,
                                                      new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                                                                           new Color([0, 255, 255, 0.0]),
                                                                           2));
                }
              } else {
                if(searchLayer.geometryType === "esriGeometryPoint") {
                  convertedSource.highlightSymbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE,
                                                                     10,
                                                                     new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                                                                                          new Color([0, 255, 255]),
                                                                                          2),
                                                                     new Color([0, 0, 0]));
                } else if(searchLayer.geometryType === "esriGeometryPolyline") {
                  convertedSource.highlightSymbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                                                                         new Color([0, 255, 255]),
                                                                         2);
                } else if(searchLayer.geometryType === "esriGeometryPolygon") {
                  convertedSource.highlightSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_NULL,
                                                      new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                                                                           new Color([0, 255, 255]),
                                                                           2));
                }
              }
            })));

            this.own(on(searchLayer, 'error', function() {
              def.resolve(null);
            }));
          } else {
            def.resolve(null);
          }
          return def;
        }));

        return sourceDefs;
      },

      _getLocalSearchDistance: function(source) {
        var result;
        switch(source.radiusUnit || "meter") {
          case "kilometer":
            result = source.localSearchDistance * 1000;
            break;
          case "nauticalMile":
            result = source.localSearchDistance * 1852;
            break;
          case "mile":
            result = source.localSearchDistance * 1609.344;
            break;
          case "yard":
            result = source.localSearchDistance * 0.9144;
            break;
          case "foot":
            result = source.localSearchDistance * 0.3048;
            break;
          case "inch":
            result = source.localSearchDistance * 0.0254;
            break;
          default:
            result = source.localSearchDistance;
            break;
        }
        return result;
      },

      _getInfoTemplate: function(fLayer, source) {
        var def = new Deferred();
        var layerInfo = this.layerInfosObj.getLayerInfoById(source.layerId);
        var template;

        if (layerInfo) {
          def = layerInfo.loadInfoTemplate();
        } else {
          var fieldNames = [];
          array.filter(fLayer.fields, function(field) {
            var fieldName = field.name.toLowerCase();
            if(fieldName.indexOf("shape") < 0 &&
               fieldName.indexOf("objectid") < 0 &&
               fieldName.indexOf("globalid") < 0 &&
               fieldName.indexOf("perimeter") < 0) {
              fieldNames.push(field.name);
            }
          });

          var title =  source.name + ": {" + source.displayField + "}";
          var popupInfo = jimuUtils.getDefaultPopupInfo(fLayer, title, fieldNames);
          if(popupInfo) {
            template = new PopupTemplate(popupInfo);
          }
          def.resolve(template);
        }
        return def;
      },

      _getSourceIndexOfResult: function(e) {
        if (this.searchResults){
          for (var i in this.searchResults) {
            var sourceResults = this.searchResults[i];
            var pos = array.indexOf(sourceResults, e);
            if (pos > -1) {
              return parseInt(i, 10);
            }
          }
        }

        return null;
      },


      _zoomToScale: function(zoomScale, features) {
        this.map.setScale(zoomScale);
        jimuUtils.featureAction.panTo(this.map, features);
      },

      _showPopupByFeatures: function(layerInfo, features, selectEvent) {
        /*jshint unused: false*/
        var location = null;
        var isPoint = false;

        if(this.config.showInfoWindowOnSelect) {
          //this.map.infoWindow.clearFeatures();
          //this.map.infoWindow.hide();
          this.map.infoWindow.setFeatures(features);
          if (features[0].geometry.type === "point") {
            location = features[0].geometry;
            isPoint = true;
          } else {
            var extent = features[0].geometry && features[0].geometry.getExtent();
            location = extent && extent.getCenter();
          }
          if(location) {
            this.map.infoWindow.show(location, {
              closetFirst: true
            });
          }
        } else {
          // hightlight result
          this.map.infoWindow.setFeatures(features);
          this.map.infoWindow.updateHighlight(this.map, features[0]);
          this.map.infoWindow.showHighlight();
        }

        // zoomto result
        if (selectEvent.source._panToScale) {
          jimuUtils.featureAction.panTo(this.map, features);
        } else if(selectEvent.source._zoomScaleOfConfigSource) {
          this._zoomToScale(selectEvent.source.zoomScale, features);
        } else {
          var featureSet = jimuUtils.toFeatureSet(features);
          jimuUtils.zoomToFeatureSet(this.map, featureSet);
        }
      },

      _cloneInfoTemplate: function(infoTemplate) {
        var newInfoTemplate = null;
        if(infoTemplate && infoTemplate.toJson) {
          newInfoTemplate = new infoTemplate.constructor(infoTemplate.toJson());
        }
        return newInfoTemplate;
      },

      _loadInfoTemplateAndShowPopup: function(layerInfo, selectedFeature, selectEvent) {
        if(layerInfo) {
          //this.searchDijit.clearGraphics();
          var layerObjectInMap = this.map.getLayer(layerInfo.id);
          if(layerInfo.isPopupEnabled() && layerObjectInMap) {
            this._showPopupByFeatures(layerInfo, [selectedFeature], selectEvent);
          } else {
            layerInfo.loadInfoTemplate().then(lang.hitch(this, function(infoTemplate) {
              //temporary set infoTemplate to selectedFeature.
              selectedFeature.setInfoTemplate(this._cloneInfoTemplate(infoTemplate));
              this._showPopupByFeatures(layerInfo, [selectedFeature], selectEvent);
              // clear infoTemplate for selectedFeature;
              var handle = aspect.before(this.map, 'onClick', lang.hitch(this, function() {
                selectedFeature.setInfoTemplate(null);
                handle.remove();
              }));
            }));
          }
        }
      },

      _onSelectResult: function(e) {
        var result = e.result;
        var dataSourceIndex = e.sourceIndex;
        var sourceResults = this.searchResults[dataSourceIndex];
        var dataIndex = 0;
        var resultFeature = e.result.feature;
        var sourceLayerId = e.source._featureLayerId;

        var getGraphics = function(layer, fid) {
          var graphics = layer.graphics;
          var gs = array.filter(graphics, function(g) {
            return g.attributes[layer.objectIdField] === fid;
          });
          return gs;
        };

        for (var i = 0, len = sourceResults.length; i < len; i++) {
          if (jimuUtils.isEqual(sourceResults[i], result)) {
            dataIndex = i;
            break;
          }
        }
        query('li', this.searchResultsNode)
          .forEach(lang.hitch(this, function(li) {
            html.removeClass(li, 'result-item-selected');
            var title = html.getAttr(li, 'title');
            var dIdx = html.getAttr(li, 'data-index');
            var dsIndex = html.getAttr(li, 'data-source-index');

            if (result &&
              result.name &&
              title === result.name.toString() &&
              dIdx === dataIndex.toString() &&
              dsIndex === dataSourceIndex.toString()) {
              html.addClass(li, 'result-item-selected');
              focusUtil.focus(li);
            }
          }));

        //var layer = this.map.getLayer(sourceLayerId);
        var layerInfo = this.layerInfosObj.getLayerInfoById(sourceLayerId);

        if (layerInfo) {
          layerInfo.getLayerObject().then(lang.hitch(this, function(layer) {
            var gs = getGraphics(layer, resultFeature.attributes[layer.objectIdField]);
            if (gs && gs.length > 0) {
              //this._showPopupByFeatures(gs);
              this._loadInfoTemplateAndShowPopup(layerInfo, gs[0], e);
            } else {

              var featureQuery = new FeatureQuery();
              featureQuery.where = layer.objectIdField + " = " +
                                 resultFeature.attributes[layer.objectIdField];
              featureQuery.outSpatialReference = this.map.spatialReference;
              featureQuery.outFields = ["*"];

              layer.queryFeatures(featureQuery, lang.hitch(this, function(featureSet) {
                var selectedFeature = null;
                if(featureSet && featureSet.features.length > 0) {
                  selectedFeature = featureSet.features[0];
                  // working around for js-api's generalization.
                  //   incorrect geometry of polygon result of queryFeatures.
                  selectedFeature.geometry = resultFeature.geometry;

                  this._loadInfoTemplateAndShowPopup(layerInfo, selectedFeature, e);
                }
              }), lang.hitch(this, function() {
                // show popupInfo of searchResult.
                var selectedFeature = resultFeature;
                this._loadInfoTemplateAndShowPopup(layerInfo, selectedFeature, e);
              }));
            }
          }));

        } else if (e.source.featureLayer && !e.source.locator){
          // outside resource result:
          // zoomTo or panto by zoomToExtent, popup by search dijit
          if (e.source._panToScale) {
            jimuUtils.featureAction.panTo(this.map, [e.result.feature]);
          } else if(e.source._zoomScaleOfConfigSource) {
            this._zoomToScale(e.source._zoomScaleOfConfigSource, [e.result.feature]);
          } else {
            jimuUtils.zoomToExtent(this.map, e.result.extent);
          }
        } else {
          //result of geocoder service
          if (e.source._panToScale) {
            //panToScale is configed, panTo by jimuFeatureAction. popup by search dijit
            jimuUtils.featureAction.panTo(this.map, [e.result.feature]);
          } else if (e.source._zoomScaleOfConfigSource) {
            //zoomScale is configed, zoomto by _zoomScale. popup by search dijit
            this._zoomToScale(e.source._zoomScaleOfConfigSource, [e.result.feature]);
          }
          //zoomSclae keep default value, popup and zoomto by search dijit;
        }

        // publish select result to other widgets
        this.publishData({
          'selectResult': e
        });
      },

      destroy: function() {
        utils.setMap(null);
        utils.setLayerInfosObj(null);
        utils.setAppConfig(null);
        if (this.searchDijit) {
          this.searchDijit.clear();
        }

        this.inherited(arguments);
      },

      /*********************************
       * Methods for Events
       * ******************************/
      onReceiveData: function(name, widgetId, data) {
        if (name === 'framework' && widgetId === 'framework' && data && data.searchString) {
          this.searchDijit.set('value', data.searchString);
          this.searchDijit.search();
        }
      },

      onLayerInfosFilterChanged: function(changedLayerInfos) {
        array.some(changedLayerInfos, lang.hitch(this, function(info) {
          if (this.searchDijit && this.searchDijit.sources && this.searchDijit.sources.length > 0) {
            array.forEach(this.searchDijit.sources, function(s) {
              if (s._featureLayerId === info.id) {
                s.featureLayer.setDefinitionExpression(info.getFilter());
              }
            });
          }
        }));
      },

      _onSourceIndexChange: function() {
        if (this.searchDijit.value) {
          this.searchDijit.search(this.searchDijit.value);
        }
      },

      _onSearchResults: function(evt) {
        var sources = this.searchDijit.get('sources');
        var activeSourceIndex = this.searchDijit.get('activeSourceIndex');
        var value = this.searchDijit.get('value');
        value = jimuUtils.sanitizeHTML(value);
        var htmlContent = "";
        var results = evt.results;
        var _activeSourceNumber = null;

        var outputTextforCustomInput = this._getOutputTextForCustomInput(evt.value); //*******

        if (results && evt.numResults > 0) {
          html.removeClass(this.searchDijit.containerNode, 'showSuggestions');

          this.searchResults = results;
          htmlContent += '<div class="show-all-results jimu-ellipsis" title="' +
            this.nls.showAll + '">' +
            this.nls.showAllResults + '<strong >' + value + '</strong></div>';
          htmlContent += '<div class="searchMenu" role="menu">';
          for (var i in results) {
            if (results[i] && results[i].length) {
              var source = sources[parseInt(i, 10)];
              var name = source.name;
              if (sources.length > 1 && activeSourceIndex === 'all') {
                htmlContent += '<div title="' + name + '" class="menuHeader">' + name + '</div>';
              }
              htmlContent += "<ul>";
              //var partialMatch = value;
              //var r = new RegExp("(" + partialMatch + ")", "gi");
              var maxResults = sources[i].maxResults;

              for (var j = 0, len = results[i].length; j < len && j < maxResults; j++) {
                //var text = esriLang.isDefined(results[i][j].name) ?
                //  results[i][j].name : this.nls.untitled;
                var text;
                if(esriLang.isDefined(results[i][j].name)) {
                  if(source && source.locator && outputTextforCustomInput) {
                    results[i][j].name = outputTextforCustomInput;
                  }
                  text = results[i][j].name;
                  text = jimuUtils.sanitizeHTML(text);
                } else {
                  text = this.nls.untitled;
                }

                htmlContent += '<li title="' + text + '" data-index="' + j +
                  '" data-source-index="' + i + '" role="menuitem" tabindex="0">' +
                  /*text.toString().replace(r, "<strong >$1</strong>") +*/ text.toString() + '</li>';
              }
              htmlContent += '</ul>';

              if (evt.numResults === 1) {
                _activeSourceNumber = i;
              }
            }
          }
          htmlContent += "</div>";
          this.searchResultsNode.innerHTML = htmlContent;

          this._showResultMenu();

          this._resetSelectorPosition('.searchMenu');
        } else {
          this._onClearSearch();
        }
        // publish search results to other widgets
        this.publishData({
          'searchResults': evt
        });
      },

      _onSuggestResults: function(evt) {
        this._resetSelectorPosition('.searchMenu');

        this._hideResultMenu();
        this._showSuggestionsMenu();
        // publish suggest results to other widgets
        this.publishData({
          'suggestResults': evt
        });
      },

      _onClearSearch: function() {
        html.setStyle(this.searchResultsNode, 'display', 'none');
        this.searchResultsNode.innerHTML = "";
        this.searchResults = null;
        //this.map.infoWindow.hideHighlight();
      },

      /*
      onActive: function() {
        this._mapClickHandle = aspect.before(this.map, 'onClick', lang.hitch(this, function() {
          this._hidePopup();
          return arguments;
        }));
      },

      onDeActive: function() {
        if (this._mapClickHandle && this._mapClickHandle.remove) {
          this._mapClickHandle.remove();
        }
        this._hidePopup();
      },
      */

      _hidePopup: function() {
        if (this.map.infoWindow.isShowing) {
          this.map.infoWindow.hide();
        }
      },

      setPosition: function(position) {
        this._resetSearchDijitStyle(position);
        this.inherited(arguments);
      },

      resize: function() {
        this._resetSearchDijitStyle();
      },

      // use for small screen responsive
      _resetSearchDijitStyle: function() {
        html.removeClass(this.domNode, 'use-absolute');
        if (this.searchDijit && this.searchDijit.domNode) {
          html.setStyle(this.searchDijit.domNode, 'width', 'auto');
        }

        setTimeout(lang.hitch(this, function() {
          if (this.searchDijit && this.searchDijit.domNode) {
            var box = {
              w: !window.appInfo.isRunInMobile ? 274 : // original width of search dijit
                parseInt(html.getComputedStyle(this.domNode).width, 10)
            };
            var sourcesBox = html.getMarginBox(this.searchDijit.sourcesBtnNode);
            var submitBox = html.getMarginBox(this.searchDijit.submitNode);
            var style = null;
            if (box.w) {
              html.setStyle(this.searchDijit.domNode, 'width', box.w + 'px');
              html.addClass(this.domNode, 'use-absolute');

              if (isFinite(sourcesBox.w) && isFinite(submitBox.w)) {
                if (window.isRTL) {
                  style = {
                    left: submitBox.w + 'px',
                    right: sourcesBox.w + 'px'
                  };
                } else {
                  style = {
                    left: sourcesBox.w + 'px',
                    right: submitBox.w + 'px'
                  };
                }
                var inputGroup = query('.searchInputGroup', this.searchDijit.domNode)[0];

                if (inputGroup) {
                  html.setStyle(inputGroup, style);
                  var groupBox = html.getMarginBox(inputGroup);
                  var extents = html.getPadBorderExtents(this.searchDijit.inputNode);
                  html.setStyle(this.searchDijit.inputNode, 'width', groupBox.w - extents.w + 'px');
                }
              }
            }
          }
        }), 50);
      },

      /**************************************
       * Mehtods for covert SR
       * ***********************************/
      _convertSR: function(originalFun) {
        return lang.hitch(this, function(e) {
          var source = this.searchDijit.sources[e.index];
          var pointOfSpecifiedWkid = this._getPointFromSpecifiedWkid(e.text);
          //var pointOfSpecifiedUtm = this._getPointFromSpecifiedUtm(e.text);
          if(source && source.locator && pointOfSpecifiedWkid) {
            return jimuUtils.projectToSpatialReference(pointOfSpecifiedWkid,
                                                       new SpatialReference({wkid: 4326}))
                    .then(lang.hitch(this, function(event, targetPoint) {
              var inputText = this._getFormatedInputFromPoint(targetPoint);
              if(inputText) {
                event.text = inputText;
              }
              return originalFun.apply(this.searchDijit, [event]);
            }, lang.clone(e)));
          } else if (source && source.locator){
            return this._getPointFromSpecifiedUtm(e.text).then(lang.hitch(this, function(event, pointOfSpecifiedUtm) {
              var inputText = this._getFormatedInputFromPoint(pointOfSpecifiedUtm);
              if(inputText) {
                event.text = inputText;
              }
              return originalFun.apply(this.searchDijit, [event]);
            }, lang.clone(e)));
          } else {
            return originalFun.apply(this.searchDijit, [e]);
          }

        });
      },

      _getFormatedInputFromPoint: function(point) {
        var inputText = null;
        if(point && !isNaN(point.x) && !isNaN(point.y)) {
          //inputText = "X:" + point.x + "," + "Y:" + point.y;
          inputText = "Y:" + point.y + "," + "X:" + point.x;
        }
        return inputText;
      },

      _getPointFromSpecifiedWkid: function(inputString) {
        var point = null;
        if(!inputString) {
          return point;
        }
        var coordinateParams = inputString.split(":");
        var coordinateText = coordinateParams[0];
        var wkid = Number(coordinateParams[1]);
        if(wkid && wkidUtils.isValidWkid(wkid) && coordinateText) {
          var coordinateValues = coordinateText.split(",");
          var x = Number(coordinateValues[0]);
          var y = Number(coordinateValues[1]);
          if(!isNaN(x) && !isNaN(y)) {
            point = new Point(x, y, new SpatialReference({wkid: wkid}));
          }
        }
        return point;
      },

      _getPointFromSpecifiedUtmByGeometryService: function(inputString) {
        var retDef = new Deferred();
        var resultPoint = null;
        var params = {
          sr: 4326,
          conversionType: "UTM",
          conversionMode: 'utmDefault',
          strings: [inputString]
        };
        var geometryService = esriConfig && esriConfig.defaults && esriConfig.defaults.geometryService;
        if(geometryService && geometryService.declaredClass === "esri.tasks.GeometryService") {
          geometryService.fromGeoCoordinateString(params, lang.hitch(this, function(result) {
            var x = Number(result[0][0]);
            var y = Number(result[0][1]);
            if(!isNaN(x) && !isNaN(y)) {
              resultPoint = new Point(x, y, new SpatialReference({wkid: 4326}));
              this._pointOfSpecifiedUtmCache[inputString] = resultPoint;
            }
            retDef.resolve(resultPoint);
          }), lang.hitch(this, function() {
            retDef.resolve(resultPoint);
          }));
        } else {
          retDef.resolve(resultPoint);
        }

        return retDef;
      },

      _isValidUtmFormat: function(utmString) {
        return utmString && utmString.indexOf && utmString.indexOf(',') < 0 ? true : false;
      },

      _getPointFromSpecifiedUtm: function(inputString) {
        var retDef = new Deferred();
        var resultPoint = null;
        if(!inputString || !this._isValidUtmFormat(inputString)) {
          retDef.resolve(resultPoint);
          return retDef;
        }

        if(coordinateFormatter.isSupported()) {
          if(coordinateFormatter.isLoaded()) {
            var point = coordinateFormatter.fromUtm(inputString,
                                                    new SpatialReference({wkid: 4326}),
                                                    "latitude-band-indicators");
            if(point && !isNaN(point.x) && !isNaN(point.y)) {
              // the 'fromUtm' will convert the string "8430 FOX LAIR CIR, Anchorage, AK" to a point,
              // need to further verify the utm string by geometry service.
              this._getPointFromSpecifiedUtmByGeometryService(inputString).then(lang.hitch(this, function(resultPoint) {
                retDef.resolve(resultPoint);
              }));
            } else {
              retDef.resolve(resultPoint);
            }
          } else {
            coordinateFormatter.load();
            retDef.resolve(resultPoint);
          }
        } else {
          retDef = this._getPointFromSpecifiedUtmByGeometryService(inputString);
        }
        return retDef;
      },

      _getOutputTextForCustomInput: function(inputText) {
        var outputText = null;
        var pointOfSpecifiedWkid = this._getPointFromSpecifiedWkid(inputText);
        var pointOfSpecifiedUtm = this._pointOfSpecifiedUtmCache[inputText];
        if(pointOfSpecifiedWkid) {
          outputText = "X:" + pointOfSpecifiedWkid.x + " " + "Y:" + pointOfSpecifiedWkid.y;
        } else if(pointOfSpecifiedUtm){
          outputText = inputText;
        }
        return outputText;
      },
      /***********************************
       * Mehtods for control result menu
       * *********************************/
      _onSearchDijitClick: function() {
        this._resetSelectorPosition('.searchMenu');
      },

      _onSelectSearchResult: function(evt) {
        var target = evt.target;
        while(!(html.hasAttr(target, 'data-source-index') && html.getAttr(target, 'data-index'))) {
          target = target.parentNode;
        }
        var result = null;
        var dataSourceIndex = html.getAttr(target, 'data-source-index');
        var dataIndex = parseInt(html.getAttr(target, 'data-index'), 10);
        // var sources = this.searchDijit.get('sources');

        if (dataSourceIndex !== 'all') {
          dataSourceIndex = parseInt(dataSourceIndex, 10);
        }
        if (this.searchResults && this.searchResults[dataSourceIndex] &&
          this.searchResults[dataSourceIndex][dataIndex]) {
          result = this.searchResults[dataSourceIndex][dataIndex];
          this.searchDijit.select(result);
        }
      },

      _hideSuggestionsMenu: function() {
        html.setStyle(this.searchDijit.suggestionsNode, 'display', 'none');
        html.removeClass(this.searchDijit.suggestionsNode, 'show');
      },

      _showSuggestionsMenu: function() {
        html.setStyle(this.searchDijit.suggestionsNode, 'display', 'block');
        html.addClass(this.searchDijit.suggestionsNode, 'show');
      },

      _hideResultMenu: function() {
        query('.show-all-results', this.searchResultsNode).style('display', 'block');
        query('.searchMenu', this.searchResultsNode).style('display', 'none');
      },

      _showResultMenu: function() {
        html.setStyle(this.searchResultsNode, 'display', 'block');
        this._hideSuggestionsMenu();
        query('.show-all-results', this.searchResultsNode).style('display', 'none');
        query('.searchMenu', this.searchResultsNode).style('display', 'block');

        var groupNode = query('.searchInputGroup', this.searchDijit.domNode)[0];
        if (groupNode) {
          var groupBox = html.getMarginBox(groupNode);
          var style = {
            width: groupBox.w + 'px'
          };
          if (window.isRTL) {
            var box = html.getMarginBox(this.searchDijit.domNode);
            style.right = (box.w - groupBox.l - groupBox.w) + 'px';
          } else {
            style.left = groupBox.l + 'px';
          }
          query('.show-all-results', this.searchResultsNode).style(style);
          query('.searchMenu', this.searchResultsNode).style(style);
        }
      },

      // set position for 'searchSuggestiongMenu', 'searchResultMenu', 'showAllResultsBox'
      _resetSelectorPosition: function(cls) {
        var layoutBox = html.getMarginBox(window.jimuConfig.layoutId);
        query(cls, this.domNode).forEach(lang.hitch(this, function(menu) {
          var menuPosition = html.position(menu);
          if (html.getStyle(menu, 'display') === 'none') {
            return;
          }
          var dijitPosition = html.position(this.searchDijit.domNode);
          var up = dijitPosition.y - 2;
          var down = layoutBox.h - dijitPosition.y - dijitPosition.h;
          if ((down > menuPosition.y + menuPosition.h) || (up > menuPosition.h)) {
            html.setStyle(
              menu,
              'top',
              (
                (down > menuPosition.y + menuPosition.h) ?
                dijitPosition.h : -menuPosition.h - 2
              ) + 'px'
            );
          } else {
            html.setStyle(menu, 'height', Math.max(down, up) + 'px');
            html.setStyle(menu, 'top', (down > up ? dijitPosition.h : -up - 2) + 'px');
          }
        }));
      },

      _inputKey: function(e) {
        if (e) {
          var lists = query("li", this.searchResultsNode);
          if (e.keyCode === keys.TAB || e.keyCode === keys.ESCAPE) {
            /*
            if(html.hasClass(evt.target, this.baseClass) && evt.keyCode === keys.ENTER) {//enter to first node
              this.searchDijit.sourcesBtnNode.focus();
            }
            //esc to close searched list
            else if(!html.hasClass(evt.target, this.baseClass) && evt.keyCode === keys.ESCAPE) {
              if(html.getStyle(this.searchResultsNode, 'display') === 'block'){
                html.setStyle(this.searchResultsNode, 'display', 'none');
              }
            }
            */
          } else if (e.keyCode === keys.UP_ARROW) {
            e.stopPropagation();
            e.preventDefault();
            array.some(lists, function(li, index) {
              if(html.hasClass(li, 'result-item-selected')) {
                var nextLi = lists[index - 1];
                if(nextLi) {
                  html.removeClass(li, 'result-item-selected');
                  html.addClass(nextLi, 'result-item-selected');
                  focusUtil.focus(nextLi);
                }
                return true;
              } else {
                return false;
              }
            }, this);
          } else if (e.keyCode === keys.DOWN_ARROW) {
            e.stopPropagation();
            e.preventDefault();
            array.some(lists, function(li, index) {
              if(html.hasClass(li, 'result-item-selected')) {
                var nextLi = lists[index + 1];
                if(nextLi) {
                  html.removeClass(li, 'result-item-selected');
                  html.addClass(nextLi, 'result-item-selected');
                  focusUtil.focus(nextLi);
                }
                return true;
              } else {
                return false;
              }
            }, this);
          }
          // ignored keys
          else if (e.ctrlKey || e.metaKey || e.keyCode === keys.copyKey || e.keyCode === keys.LEFT_ARROW ||
            e.keyCode === keys.RIGHT_ARROW || e.keyCode === keys.ENTER) {
            // just return. don't do anything
            return e;
          }
        }
      },

      _onSearchResultLiKey: function(e) {
        if (e) {
          if(e.keyCode === keys.ENTER) {
            this._onSelectSearchResult(e);
          } else if (e.keyCode === keys.DOWN_ARROW || e.keyCode === keys.UP_ARROW) {
            this._inputKey(e);
          }
        }
      }

    });
  });
