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
		"dojo/dom-class",
		'esri/geometry/Extent',
		'esri/layers/FeatureLayer',
		'dojo/_base/array'
		],
function(declare, 
		BaseWidget, 
		on,
		domStyle,
		 xhr,
		dom,
		 domClass,
		Extent,
		FeatureLayer,
		array
	    ) {

  var communitySelected = "";
  var prefixRadioCommunity = "radio_";
  
  var minXCombinedExtent = -15914327.3951;
  var minYCombinedExtent = 1853426.1440;
  var maxXCombinedExtent = -5347672.6049;
  var maxYCombinedExtent = 7733573.8560;  
  var spatialReference = {"wkid": 102100}
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
	  this.displayCommunitySelection();  
	  selfSelectCommunity = this;
      console.log('startup');
    },
    addRowButton: function(radioId, radioName, labelForRadio, direction) {
    	var tableOfRelationship = document.getElementById('communityTable' + direction);
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
        label.setAttribute('style', 'vertical-align: top');
        label.setAttribute("for", radioId);
		label.innerHTML = "  " + labelForRadio;
		newCheckboxCell.appendChild(label);
		
		radioCommunity.addEventListener('click', function() {
			communitySelected = this.id.replace(prefixRadioCommunity, "");
			document.getElementById('butSelectCommunity').click();
			
	    });
    },
    addRowButtonCombinedCommunity: function(radioId, radioName, labelForRadio, direction) {
        var tableOfRelationship = document.getElementById('communityTableCombined' );
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
        label.setAttribute('style', 'vertical-align: top');
        label.setAttribute("for", radioId);
        label.innerHTML = "  " + labelForRadio;
        newCheckboxCell.appendChild(label);
        
        radioCommunity.addEventListener('click', function() {
            communitySelected = this.id.replace(prefixRadioCommunity, "");
            document.getElementById('butSelectCommunity').click();
            
        });
        
        var newRowHr   = tableRef.insertRow(tableRef.rows.length);
        
        newRowHr.style.height = "1px";

        var newCheckboxCellHr  = newRowHr.insertCell(0);
        var radioCommunityHr = document.createElement("HR");
        radioCommunityHr.setAttribute('style', 'height: 1px; margin-top: 0px');
        
        radioCommunityHr.setAttribute("name", "hr"+radioName);
        newCheckboxCellHr.appendChild(radioCommunityHr); 
  
    },
    _onSelectCommunityClick: function() {

		window.communitySelected = communitySelected;

	    this.i ++;
	    var nExtent;
	    if (window.communitySelected != window.strAllCommunity) {
	    	commnunityWholeName = window.communityDic[communitySelected];
	    	extentForCommunity = window.communityExtentDic[window.communityDic[communitySelected]];
	    	nExtent = Extent(extentForCommunity);

	    } else {
	    	nExtent = Extent({
			    "xmin":minXCombinedExtent,"ymin":minYCombinedExtent,"xmax":maxXCombinedExtent,"ymax":maxYCombinedExtent,
			    "spatialReference":spatialReference
			});

	    }
	    this.map.setExtent(nExtent);
	    
	    selfSelectCommunity.publishData({
			message : "updateCommunityLayers"
		}); 

    },    
    displayCommunitySelection: function() {
    	//this.addRowButton(prefixRadioCommunity + window.strAllCommunity, "community", "Combined Communities", "R");
    	this.addRowButtonCombinedCommunity(prefixRadioCommunity + window.strAllCommunity, "community", "Combined Communities", "L");
    	var i = -1;
    	var half = Math.ceil((Object.keys(window.communityDic).length / 2))-1;

    	for (var key in window.communityDic) {
    		if (i<half) {
    			direction = 'L';
    		} else {
    			direction = 'R';
    		}
    		i++;
    		this.addRowButton(prefixRadioCommunity + key, "community", window.communityDic[key], direction);
    	}
    	//this.addRowButton(prefixRadioCommunity + window.strAllCommunity, "community", "Combined Communities", "L");
    	
    },

    onOpen: function(){
        console.log('onOpen');
        var panel = this.getPanel();
        var pos = panel.position;
        pos.height = 540;
        panel.setPosition(pos);
        panel.panelManager.normalizePanel(panel);
        
	    if (window.communitySelected != window.strAllCommunity) {
	    	commnunityWholeName = window.communityDic[communitySelected];
	    	extentForCommunity = window.communityExtentDic[window.communityDic[communitySelected]];
	    	nExtent = Extent(extentForCommunity);
	    	document.getElementById(prefixRadioCommunity + window.communitySelected).checked = true;
	
	    } else {

			document.getElementById(prefixRadioCommunity + window.strAllCommunity).checked = true;
	    }   
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

