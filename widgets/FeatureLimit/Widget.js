///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 - 2018 Esri. All Rights Reserved.
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

define(['dojo/_base/declare', 'dojo/_base/html', 'dijit/_WidgetsInTemplateMixin', 'esri/layers/FeatureLayer', 'esri/SpatialReference', "esri/tasks/query", "esri/tasks/QueryTask", 'jimu/BaseWidget', 'jimu/utils', 'jimu/dijit/Message', 'dojo/_base/lang', 'dojo/on', "dojo/dom-class", "dojo/aspect", "dojo/Deferred", "esri/request", "esri/config", "libs/usng/usng", "jimu/SpatialReference/unitUtils"], function(declare, html, _WidgetsInTemplateMixin, FeatureLayer, SpatialReference, Query, QueryTask, BaseWidget, utils, Message, lang, on, domClass, aspect, Deferred, esriRequest, esriConfig, usng, unitUtils) {

	/**
	 * The FeatureLimit widget displays the warning sign of number of features in current extent exceeding the MaxRecordCount of the top feature layer on map.
	 */
	var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {

		baseClass : 'jimu-widget-featurelimit',
		name : 'FeatureLimit',
		postMixInProperties : function() {
			
		},

		postCreate : function() {
			this.inherited(arguments);
			this.own(on(this.map, "extent-change", lang.hitch(this, this.onExtentChange)));
			featureLimit = this;
		},

		startup : function() {
			this.inherited(arguments);
		},

		onOpen : function() {

		},

		onExtentChange : function(evt) {
			urlForQuery = "";
			var maxRecordCount = null;
			for ( kk = featureLimit.map.graphicsLayerIds.length - 1; kk >= 0; kk--) {
				nationalLayerEAID = featureLimit.map.graphicsLayerIds[kk].replace(window.layerIdPrefix, "");
				
				//check if it is Feaured Collection
				var bNationalFeaturedCollection = false;
			    var eaIDinFeatureCollection = window.hashFeaturedCollectionToEAID[featureLimit.map.graphicsLayerIds[kk]];
			    if (((eaIDinFeatureCollection !=null) && (eaIDinFeatureCollection !=undefined))) {
			          if ((window.hashScale[window.hashFeaturedCollectionToEAID[featureLimit.map.graphicsLayerIds[kk]]]== 'NATIONAL')){
			          		bNationalFeaturedCollection = true;
			          };
			    }
			    
				if (!(window.nationalLayerNumber.includes(nationalLayerEAID)) && (bNationalFeaturedCollection == false)) {
					continue;
				}
				if (bNationalFeaturedCollection = false) {
					lyrFL = this.map.getLayer(window.layerIdPrefix + nationalLayerEAID);
				}
				else {
					lyrFL = this.map.getLayer(featureLimit.map.graphicsLayerIds[kk]);
				}
				
				if (lyrFL != null) {
					if (lyrFL.visible != false) {
						urlForQuery = lyrFL.url;
						maxRecordCount = lyrFL.maxRecordCount;
						break;
					}
				}
			}
			if (urlForQuery != "") {
				//modify url to address "Cross-Origin Request Blocked" issue
				if (window.location.href.indexOf("leb.epa.gov")) {
					urlForQuery = urlForQuery.replace("enviroatlas.epa.gov", "leb.epa.gov");
				}	
				
				var query = new Query();
				var queryTask = new QueryTask(urlForQuery);
				query.geometry = this.map.extent;
				query.spatialRelationship = Query.SPATIAL_REL_INTERSECTS;
				queryTask.executeForCount(query, function(count) {
					if (count > maxRecordCount) {
						html.setStyle(featureLimit.featurelimitContainer, 'display', 'block');
					} else {
						html.setStyle(featureLimit.featurelimitContainer, 'display', 'none');
					}

				}, function(error) {
					console.log(error);
				});
			} else {
				html.setStyle(featureLimit.featurelimitContainer, 'display', 'none');
			}
		},

		destroy : function() {
			this.inherited(arguments);
		}
	});

	return clazz;
}); 