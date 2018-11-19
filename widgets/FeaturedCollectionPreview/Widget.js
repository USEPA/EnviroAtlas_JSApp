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
    'dojo/dnd/move',
    'dojo/_base/lang',
    'dojo/on',
    "dojo/dom-style",
    "dojo/dom-class",
    "dojo/aspect",
    "dojo/touch",
    "dojo/Deferred",
    'dojo/dom-geometry',
    "dojo/query",
    'dijit/TitlePane',
    "dijit/form/Button",
    'jimu/WidgetManager'
  ],
  function(
    declare,
    html,
    has,
    _WidgetsInTemplateMixin,
    BaseWidget,
    utils,
    Move,
    lang,
    on,
    domStyle,
    domClass,
    aspect,
    touch,
    Deferred,
    domGeometry,
    domQuery,
    TitlePane,
    Button,
    WidgetManager
  ) {


    /**
     * Show details of AddWebMapData as featured collection floating widget.
     *
     * @module widgets/FeaturedCollectionPreview
     */
    var leftPreset = 0;
    var heightPreset = 700;
    var triedHeight = 0;
    var widthPreset = 460;
    var triedWidth = 0;
    var minimumWidth = 200;
    var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {

      baseClass: 'jimu-widget-FeaturedCollectionPreview',
      name: 'FeaturedCollectionPreview',
      
	  onReceiveData: function(name, widgetId, data, historyData) {

	  },
      startup: function() {
        this.inherited(arguments);
        this._hide();
        this.displayCloseButton();
      },

      onOpen: function() {
      	if (window.fcDetailsFirstCreated == true) {
      		this._hide();
      	} 
      	else {
      		this._setHeight_Width();      		
      	}    
        this.own(on(window.document, "mouseup", lang.hitch(this, this._onResizeEnd)));
        this.own(on(window.document, "mousemove", lang.hitch(this, this._onResizing)));
        this.own(on(window.document, touch.move, lang.hitch(this, this._onResizing)));
        this.own(on(window.document, touch.release, lang.hitch(this, this._onResizeEnd)));
      }, 
      _onResizeStart: function(evt) {
        this.moveMode = true;
        this.moveY = evt.clientY;
        this.moveX = evt.clientX;
        this._draggingHandlers = this._draggingHandlers.concat([
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

      _onResizing: function(evt) {
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

      _onResizeEnd: function() {
        this.moveMode = false;
        if (triedHeight>0) {
        	heightPreset = triedHeight;
        }   
        if (triedWidth>0) {
        	widthPreset = triedWidth;
        }         
        var h = this._draggingHandlers.pop();
        while (h) {
          h.remove();
          h = this._draggingHandlers.pop();
        }
      },          
      postCreate:function() {
      	this._draggingHandlers = [];
      },

      displayCloseButton: function() {		
        indexImage = 0;
        var tableOfRelationship = document.getElementById('closeFCWidget');
        var tableRef = tableOfRelationship.getElementsByTagName('tbody')[0];

        newRow = tableRef.insertRow(tableRef.rows.length);
        var newCheckboxCell  = newRow.insertCell(0);

        var checkbox = document.createElement('input');
        checkbox.type = "button";
        
        checkbox.id = "closeForFCWidget";
        checkbox.className ="jimu-widget-filterforselect-close";

        newCheckboxCell.appendChild(checkbox);    
    
        checkbox.addEventListener('click', function() {
            //Close the details widget
            var widgetManager;
            var fcDetailsWidgetEle = selfAddWebMapData.appConfig.getConfigElementsByName("FeaturedCollectionPreview")[0];
            widgetManager = WidgetManager.getInstance();
            widgetManager.closeWidget(fcDetailsWidgetEle.id);
            document.getElementById("titleForFCWidget").style.display = "none"; 
            document.getElementById("closeFCWidgetArea").style.display = "none";
            window.fcDetailsOpened = false;				
        }); 
      },     
      onClose: function() {     
      	this._dragged = false; 	
      	this._hide();
      },       
      _setHeight_Width: function() {        
        var heightOfFilterWidget = selfAddWebMapData.domNode.parentNode.clientHeight;
        html.setStyle(this.domNode, "width", widthPreset + "px");
        html.setStyle(this.domNode, "left",leftPreset + "px");
        html.setStyle(this.domNode, "height", heightOfFilterWidget + "px");
        html.setStyle(this.domNode, "top", 35 + "px");        
      },
      
      _hide: function() {
        html.setStyle(this.domNode, "width", 0 + "px");
        html.setStyle(this.domNode, "left",leftPreset + "px");
        document.getElementById("titleForFCWidget").style.display = "none";
        document.getElementById("closeFCWidget").style.display = "none";
      }
    });

    return clazz;
  });