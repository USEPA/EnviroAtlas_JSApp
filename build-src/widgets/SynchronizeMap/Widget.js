///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 Esri. All Rights Reserved.
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
    'dojo/_base/html',
    'dojo/sniff',
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidget',
    'esri/geometry/Extent',
    'esri/SpatialReference',
    'jimu/utils',
    'dojo/_base/lang',
    'dojo/on',
    "dojo/dom-style",
    "dojo/dom-class",
    "dojo/aspect",
    "dojo/Deferred"
  ],
  function(
    declare,
    html,
    has,
    _WidgetsInTemplateMixin,
    BaseWidget,
    Extent,
    SpatialReference,
    utils,
    lang,
    on,
    domStyle,
    domClass,
    aspect,
    Deferred
  ) {


    /**
     * The synchronizeMap widget coordinate the maps of two frames
     *
     * @module widgets/SynchronizeMap
     */
    var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {

      baseClass: 'jimu-widget-synchronizemap',
      name: 'SynchronizeMap',      

      startup: function() {
      	var map = this.map;
        this.inherited(arguments);
        
    	var frameChoice = window.parent.document.getElementById("selNumOfFram");
    	if (frameChoice) {
    		frameChoice.selectedIndex  = 0;
        } 	
	    var changedNewValue = window.changedExtentByOtherFrameXmin;
	
	    Object.defineProperty(window, "changedExtentByOtherFrameXmin", {
	        set: function(newValue) {
	        	
	            if(newValue === null) { 
	                alert("new value is null!"); // <-- breakpoint here!
	            }

			    var startExtent = new Extent();
	  			startExtent.xmin = window.changedExtentByOtherFrameXmin;
			    startExtent.ymin = window.changedExtentByOtherFrameYmin;
			    startExtent.xmax = window.changedExtentByOtherFrameXmax;
			    startExtent.ymax = window.changedExtentByOtherFrameYmax;
			    startExtent.spatialReference = new SpatialReference(3857);
			    
	      		if (window.frameBeClicked == 1) {
					if (window.frameElement.name == "app2") {
					  	map.setExtent(startExtent);	
					 }
			  	}	
	      		if (window.frameBeClicked == 2) {
					if (window.frameElement.name == "app1") {
					  	map.setExtent(startExtent);	
					 }
			  	}				  				    
			    changedNewValue = newValue;	            
	        },
	
	        get: function() { return changedNewValue; }
	    });

		this.own(on(this.map, 'extent-change', lang.hitch(this, 'onExtentChange')));	
      },
      
      onExtentChange: function(params) {
      	
      	var adjustForFurtherSynchronize = 0.0000000000001;
      	
      	if (window.frameBeClicked == 1) {
			if (window.frameElement.name == "app1") {				
				if (window.parent.document.getElementById("chkSynchronizeMap").checked) {
					
					window.parent.frames['app2'].changedExtentByOtherFrameXmin = params.extent.xmin;
					window.parent.frames['app2'].changedExtentByOtherFrameXmax = params.extent.xmax;
					window.parent.frames['app2'].changedExtentByOtherFrameYmin = params.extent.ymin;
					window.parent.frames['app2'].changedExtentByOtherFrameYmax = params.extent.ymax;	
					
					
					window.parent.frames['app2'].changedExtentByOtherFrameXmin = params.extent.xmin+adjustForFurtherSynchronize;
					window.parent.frames['app2'].changedExtentByOtherFrameXmax = params.extent.xmax+adjustForFurtherSynchronize;
					window.parent.frames['app2'].changedExtentByOtherFrameYmin = params.extent.ymin+adjustForFurtherSynchronize;
					window.parent.frames['app2'].changedExtentByOtherFrameYmax = params.extent.ymax+adjustForFurtherSynchronize;		
				}
			}       	
		}
		
      	if (window.frameBeClicked == 2) {
			if (window.frameElement.name == "app2") {				
				if (window.parent.document.getElementById("chkSynchronizeMap").checked) {
					
					window.parent.frames['app1'].changedExtentByOtherFrameXmin = params.extent.xmin;
					window.parent.frames['app1'].changedExtentByOtherFrameXmax = params.extent.xmax;
					window.parent.frames['app1'].changedExtentByOtherFrameYmin = params.extent.ymin;
					window.parent.frames['app1'].changedExtentByOtherFrameYmax = params.extent.ymax;	
					
					window.parent.frames['app1'].changedExtentByOtherFrameXmin = params.extent.xmin+adjustForFurtherSynchronize;
					window.parent.frames['app1'].changedExtentByOtherFrameXmax = params.extent.xmax+adjustForFurtherSynchronize;
					window.parent.frames['app1'].changedExtentByOtherFrameYmin = params.extent.ymin+adjustForFurtherSynchronize;
					window.parent.frames['app1'].changedExtentByOtherFrameYmax = params.extent.ymax+adjustForFurtherSynchronize;		
				}
			}       	
		}		

      },
      onOpen: function() {

      }, 

    });

    return clazz;
  });