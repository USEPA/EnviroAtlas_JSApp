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
		"dojo/on",
		"dojo/dom-style",
		"dojo/request/xhr",
		"dojo/dom",
		"dojo/dom-class"
		],
function(declare, 
		BaseWidget, 
		on,
		domStyle,
		 xhr,
		dom,
		 domClass
	    ) {

  var communitySelected = "";
  var prefixRadioCommunity = "radio_"
  //To create a widget, you need to derive from BaseWidget.
  return declare([BaseWidget], {
    // DemoWidget code goes here 

    //please note that this property is be set by the framework when widget is loaded.
    //templateString: template,

    baseClass: 'jimu-widget-selectcommunity',

    postCreate: function() {
      this.inherited(arguments);
      console.log('postCreate');
    },
    

    startup: function() {
      this.inherited(arguments);
      //this.mapIdNode.innerHTML = 'map id:' + this.map.id;
	  this.displayCommunitySelection();
      console.log('startup');
    },
    addRowButton: function(radioId, radioName, labelForRadio) {
    	var tableOfRelationship = document.getElementById('communityTable');
	    var tableRef = tableOfRelationship.getElementsByTagName('tbody')[0];    	
	    indexImage = 0;
	    var newRow   = tableRef.insertRow(tableRef.rows.length);
	    
       	newRow.style.height = "20px";
       	var newCheckboxCell  = newRow.insertCell(0);
		var radioCommunity = document.createElement("input");
		radioCommunity.setAttribute("type", "radio");
		radioCommunity.setAttribute("id", radioId);			
		
		radioCommunity.setAttribute("name", radioName);
        newCheckboxCell.appendChild(radioCommunity);    
        var label = document.createElement('label');
        label.setAttribute("for", radioId);
		label.innerHTML = "  " + labelForRadio;
		newCheckboxCell.appendChild(label);
		
		radioCommunity.addEventListener('click', function() {
			//alert("key is clicked: " + this.id);
			communitySelected = this.id.replace(prefixRadioCommunity, "");
			document.getElementById('butSelectCommunity').click();
			
	    });
    },
    _onSelectCommunityClick: function() {


        this.publishData({
	        message: communitySelected
	    });
	    this.i ++;
    },    
    displayCommunitySelection: function() {
    	this.addRowButton(prefixRadioCommunity + window.strAllCommunity, "community", "Combined Communities");
    	for (var key in window.communityDic) {
    		this.addRowButton(prefixRadioCommunity + key, "community", window.communityDic[key]);
    	}
    	
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
    }
  });
  

});

