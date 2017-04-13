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
  var communityExtentDic = {};
  var minXCombinedExtent = 9999999999999;
  var minYCombinedExtent = 9999999999999;
  var maxXCombinedExtent = -9999999999999;
  var maxYCombinedExtent = -9999999999999;  
  var spatialReference;
  var loadBookmarkExtent = function(callback){   

	    var xobj = new XMLHttpRequest();
	
	    xobj.overrideMimeType("application/json");
	
	    xobj.open('GET', 'configs/eBookmark/config_Enhanced Bookmark.json', true); 
	
	    xobj.onreadystatechange = function () {
	      if (xobj.readyState == 4 && xobj.status == "200") {
	            callback(xobj.responseText);
	          }
	    };
	    xobj.send(null);  
 }; 	
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
	  loadBookmarkExtent(function(response){
	    	var bookmarkClassified = JSON.parse(response);
	
	        for (index = 0, len = bookmarkClassified.bookmarks.length; index < len; ++index) {
	        	currentBookmarkClass = bookmarkClassified.bookmarks[index];
	        	if (currentBookmarkClass.name == "Community") {
	        		bookmarkCommunity = currentBookmarkClass.items;
	        		for (indexCommunity = 0, lenCommunity = bookmarkCommunity.length; indexCommunity < lenCommunity; ++indexCommunity) {
	        			var currentExtent = bookmarkCommunity[indexCommunity].extent;
	        			communityExtentDic[bookmarkCommunity[indexCommunity].name] = currentExtent;
	        			spatialReference= currentExtent.spatialReference;
	        			if (minXCombinedExtent > currentExtent.xmin) {
	        				minXCombinedExtent = currentExtent.xmin;	        				
	        			}
	        			if (minYCombinedExtent > currentExtent.ymin) {
	        				minYCombinedExtent = currentExtent.ymin;	        				
	        			}	
	        			if (maxXCombinedExtent < currentExtent.xmax) {
	        				maxXCombinedExtent = currentExtent.xmax;	        				
	        			}
	        			if (maxYCombinedExtent < currentExtent.ymax) {
	        				maxYCombinedExtent = currentExtent.ymax;	        				
	        			}	        			
	        			        			
	        		}
	        	}
	        }
	   }); // end of loadCommunityJSON(function(response)
  
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
			//alert("key is clicked: " + this.id);
			communitySelected = this.id.replace(prefixRadioCommunity, "");
			document.getElementById('butSelectCommunity').click();
			
	    });
    },
    _onSelectCommunityClick: function() {

		window.communitySelected = communitySelected;
        this.publishData({
	        message: communitySelected
	    });
	    this.i ++;
	    var nExtent;
	    if (communitySelected != window.strAllCommunity) {
	    	commnunityWholeName = window.communityDic[communitySelected];
	    	extentForCommunity = communityExtentDic[window.communityDic[communitySelected]];
	    	nExtent = Extent(extentForCommunity);

	    } else {
	    	nExtent = Extent({
			    "xmin":minXCombinedExtent,"ymin":minYCombinedExtent,"xmax":maxXCombinedExtent,"ymax":maxYCombinedExtent,
			    "spatialReference":spatialReference
			});

	    }
	    this.map.setExtent(nExtent);	    

	    /*var lyr;
	    layersToBeAdded = "u";
    	for (i in window.allLayerNumber) {
    		lyr = this.map.getLayer(window.layerIdPrefix + window.allLayerNumber[i]);
			if(lyr){
	    		layersToBeAdded = layersToBeAdded + "," + lyr.id.replace(window.layerIdPrefix, "");
          	}
        } 	    
        this.publishData({
			message: layersToBeAdded
		}); */  
    },    
    displayCommunitySelection: function() {
    	//this.addRowButton(prefixRadioCommunity + window.strAllCommunity, "community", "Combined Communities", "R");
    	var i = -1;
    	var half = Math.ceil((Object.keys(window.communityDic).length / 2));

    	for (var key in window.communityDic) {
    		if (i<half) {
    			direction = 'L';
    		} else {
    			direction = 'R';
    		}
    		i++;
    		this.addRowButton(prefixRadioCommunity + key, "community", window.communityDic[key], direction);
    	}
    	this.addRowButton(prefixRadioCommunity + window.strAllCommunity, "community", "Combined Communities", "R");
    	
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

