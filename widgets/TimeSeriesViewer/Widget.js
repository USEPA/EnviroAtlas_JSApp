//////////////////////////////////////////////////////////
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
///////////////////////////////////////////////////////////////////////////

define(['dojo/_base/declare', 
		'jimu/BaseWidget', 
		'esri/layers/ArcGISDynamicMapServiceLayer',
		'esri/tasks/Geoprocessor',
        "esri/tasks/IdentifyTask",
        "esri/tasks/IdentifyParameters",
        "esri/InfoTemplate",
        'dijit/form/HorizontalSlider',
		"dojo/on",
		"dojo/dom-style",
		"dojo/request/xhr",
		"dojo/dom",
		"dojo/dom-class",
		"dijit/form/FilteringSelect"
		],
function(declare, 
		BaseWidget, 
		ArcGISDynamicMapServiceLayer,
		Geoprocessor,
		IdentifyTask,
		IdentifyParameters,
		InfoTemplate,
		HorizontalSlider,
		on,
		domStyle,
		 xhr,
		dom,
		 domClass
	    ) {

    var map;

  //To create a widget, you need to derive from BaseWidget.
  return declare([BaseWidget], {
    //please note that this property is be set by the framework when widget is loaded.
    //templateString: template,

    baseClass: 'jimu-widget-ECAT',

    postCreate: function() {
      this.inherited(arguments);
      console.log('postCreate');
    },
    

    startup: function() {
      	this.inherited(arguments);
      	map = this.map;

    },


    onOpen: function(){
      console.log('onOpen');
    },

    onClose: function(){
      console.log('onClose');
    },

    onMinimize: function(){
      console.log('onMinimize');
    },
    onMaximize: function(){
      console.log('onMaximize');
    },

    onSignIn: function(credential){
      /* jshint unused:false*/
      console.log('onSignIn');
    },

    onSignOut: function(){
      console.log('onSignOut');
    },


  });  

});

