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
    'jimu/utils',
    'dojo/_base/lang',
    'dojo/on',
    "dojo/dom-style",
    "dojo/dom-class",
    "dojo/aspect",
    "dojo/Deferred",
    'dijit/TitlePane'
  ],
  function(
    declare,
    html,
    has,
    _WidgetsInTemplateMixin,
    BaseWidget,
    utils,
    lang,
    on,
    domStyle,
    domClass,
    aspect,
    Deferred
  ) {


    /**
     * The FilterForSelect widget displays the toggle buttons of filtering selectable layers
     *
     * @module widgets/FilterForSelect
     */
    var leftPreset = 50;
    var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {

      baseClass: 'jimu-widget-FilterForSelect',
      name: 'FilterForSelect',
      
	  onReceiveData: function(name, widgetId, data, historyData) {

	  },
      startup: function() {
        this.inherited(arguments);
        this._hide();

      },

      onOpen: function() {
      	if (window.filterForSelectFirstCreated == true) {
      		this._hide();
      	} 
      	else {
      		this._setHeight_Width();      		
      	}    	    	
      	

      }, 
      postCreate:function() {

      },
      onClose: function() {
      	
      	this._hide();

      },       
      _setHeight_Width: function() {
      	var heightPreset = 700;
        html.setStyle(this.domNode, "height", heightPreset + "px");
        if (this.tabContainer && this.tabContainer.domNode &&
          (heightPreset - this.arrowDivHeight >= 0)) {
          html.setStyle(
            this.tabContainer.domNode,
            "height",
            (heightPreset - this.arrowDivHeight) + "px"
          );
        }
        html.setStyle(this.domNode, "width", 300 + "px");
        html.setStyle(this.domNode, "left",leftPreset + "px");


      },
      _hide: function() {
        html.setStyle(this.domNode, "width", 0 + "px");
        html.setStyle(this.domNode, "left",leftPreset + "px");
        document.getElementById("titleForFilter").style.display = "none";

      }
    });

    return clazz;
  });