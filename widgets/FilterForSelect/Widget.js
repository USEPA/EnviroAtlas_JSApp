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
    "dojo/touch",
    "dojo/Deferred",
    "dojo/query",
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
    touch,
    Deferred,
    domQuery
  ) {


    /**
     * The FilterForSelect widget displays the toggle buttons of filtering selectable layers
     *
     * @module widgets/FilterForSelect
     */
    var leftPreset = 50;
    var heightPreset = 700;
    var triedHeight = 0;
    var widthPreset = 300;
    var triedWidth = 0;
    var minimumWidth = 200;
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
  	


        this.own(on(window.document, "mouseup", lang.hitch(this, this._onDragEnd)));
        this.own(on(window.document, "mousemove", lang.hitch(this, this._onDraging)));
        this.own(on(window.document, touch.move, lang.hitch(this, this._onDraging)));
        this.own(on(window.document, touch.release, lang.hitch(this, this._onDragEnd)));
      }, 
      _onDragStart: function(evt) {
        this.moveMode = true;
        this.moveY = evt.clientY;
        this.moveX = evt.clientX;
        this._dragingHandlers = this._dragingHandlers.concat([
          on(this.ownerDocument, 'dragstart', function(e) {
            e.stopPropagation();
            e.preventDefault();
          }),
          on(this.ownerDocumentBody, 'selectstart', function(e) {
            e.stopPropagation();
            e.preventDefault();
          })
        ]);
      },      

      _onDraging: function(evt) {
        if (this.moveMode ) {
	        var mapContainer = this.map.container;
	        var maximumHeight = mapContainer.offsetHeight -150;
	        triedHeight = heightPreset + evt.clientY - this.moveY;
	         if (triedHeight > maximumHeight) {
	          	triedHeight = maximumHeight;
	        }
	        html.setStyle(this.domNode, "height", triedHeight + "px");
	        
	        
	        triedWidth = widthPreset + evt.clientX - this.moveX;
	         if (triedWidth < minimumWidth) {
	          	triedWidth = minimumWidth;
	        }
	        html.setStyle(this.domNode, "width", triedWidth + "px");	        
        }
      },

      _onDragEnd: function() {
        this.moveMode = false;
        if (triedHeight>0) {
        	heightPreset = triedHeight;
        }   
        if (triedWidth>0) {
        	widthPreset = triedWidth;
        }         
        var h = this._dragingHandlers.pop();
        while (h) {
          h.remove();
          h = this._dragingHandlers.pop();
        }
      },          
      postCreate:function() {
      	this._dragingHandlers = [];
        this.own(on(this.resizeFilter, 'mousedown', lang.hitch(this, this._onDragStart)));
        this.own(on(this.resizeFilter, touch.press, lang.hitch(this, this._onDragStart)));	    
      },
      onClose: function() {      	
      	this._hide();
      },       
      _setHeight_Width: function() {
        html.setStyle(this.domNode, "height", heightPreset + "px");
        if (this.tabContainer && this.tabContainer.domNode &&
          (heightPreset - this.arrowDivHeight >= 0)) {
          html.setStyle(
            this.tabContainer.domNode,
            "height",
            (heightPreset - this.arrowDivHeight) + "px"
          );
        }
        html.setStyle(this.domNode, "width", widthPreset + "px");
        html.setStyle(this.domNode, "left",leftPreset + "px");
      },
      
      _hide: function() {
        html.setStyle(this.domNode, "width", 0 + "px");
        html.setStyle(this.domNode, "left",leftPreset + "px");
        document.getElementById("titleForFilter").style.display = "none";
        document.getElementById("resizeForFilterArea").style.display = "none";
        document.getElementById("closeFilterArea").style.display = "none";
      }
    });

    return clazz;
  });