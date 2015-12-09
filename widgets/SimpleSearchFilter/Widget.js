define(['dojo/_base/declare', 'dojo/_base/lang', 'jimu/BaseWidget'],
function(declare, lang, BaseWidget) {
	var chkIdDictionary = {};
	  var loadJSON = function(callback){   

        var xobj = new XMLHttpRequest();

        xobj.overrideMimeType("application/json");

        xobj.open('GET', 'widgets/LocalLayer/config.json', true); 

        xobj.onreadystatechange = function () {
              if (xobj.readyState == 4 && xobj.status == "200") {
                callback(xobj.responseText);
              }
        };
        xobj.send(null);  
    };
    var SelectRow = function(row) {
       //alert(row.name);
              
    };
    var addEvent = function (element, evt, callback) {
        if (element.addEventListener) {
            element.addEventListener(evt, callback, false);
        } else if (element.attachEvent) {
            element.attachEvent("on" + evt, callback);
        } else {
            element["on" + evt] = callback;
        }
    };      
  return declare([BaseWidget], {

     baseClass: 'jimu-widget-SimpleSearchFilter',

    
        
    startup: function(){
		
	    var tableOfRelationship = document.getElementById('coralRelationTable');
	    var tableRef = tableOfRelationship.getElementsByTagName('tbody')[0];
	    tableRef.innerHTML = "";
	                     
        loadJSON(function(response) {
            var localLayerConfig = JSON.parse(response);
            var arrLayers = localLayerConfig.layers.layer;
           
            for (index = 0, len = arrLayers.length; index < len; ++index) {
                layer = arrLayers[index];
                var indexCheckbox = 0;
                if(layer.hasOwnProperty('name')){
                   	var newRow   = tableRef.insertRow(tableRef.rows.length);
                   	var newCheckboxCell  = newRow.insertCell(0);
					var checkbox = document.createElement('input');
					checkbox.type = "checkbox";
					var eaLyrNum = "";
                    if(layer.hasOwnProperty('eaLyrNum')){
                        //alert(layer.eaLyrNum);
                        eaLyrNum = layer.eaLyrNum.toString();
                    }
                    chkboxId = "ck" + eaLyrNum;
					checkbox.name = chkboxId;
					checkbox.value = 1;
					checkbox.id = chkboxId;
					checkbox.align="top";
					newCheckboxCell.style.verticalAlign = "top";
			        newCheckboxCell.appendChild(checkbox);    
			              
          	
                   	chkIdDictionary[chkboxId] = layer.name;
			        var newCell  = newRow.insertCell(1);
			        var strCategory = "Clean Air;Clean and Plentiful Water;Climate Stabilization;Natural Hazard Mitigation;Recreation, Culture, and Aesthetics;People and SupplementalBuilt Spaces;Biodiversity Conservation;";
			        	//People and Built Spaces; Supplemental does not exist
			        var stringArray = strCategory.split(";");
			        var strCategoryOfThisLayer = "";
					for (i in stringArray) {
						if(layer.hasOwnProperty('eaCategory')){
							if (layer.eaCategory.indexOf(stringArray[i]) !=-1) {
							    strCategoryOfThisLayer = strCategoryOfThisLayer + "Y;"
							}
							else {
								strCategoryOfThisLayer = strCategoryOfThisLayer + "N;"
							}
						}
					}   
					strCategoryOfThisLayer = strCategoryOfThisLayer.substring(0, strCategoryOfThisLayer.length - 1);
			        newCell.innerHTML = layer.name+ "</br>" + strCategoryOfThisLayer;
			        //var newText  = document.createTextNode(layer.name+ "</br>" + "my added line");
			        //newCell.appendChild(newText);    
			        
			        var chkBox = tableRef.getElementsByTagName(chkboxId);

                }
            }

        });
	    
	    
	    /*var rows = tableRef.getElementsByTagName("tr");       
	    for (var i = 0; i < rows.length; i++) {
	        (function (idx) {
	            addEvent(rows[idx], "click", function () {
	                SelectRow(rows[idx]);
	            });
	        })(i);
	    }*/                     
	                                        
            
    },
        
                    
                    
    i: 0,
    j: 0,

    _onPublishClick: function() {
        layersToBeAdded = "";
		for (var key in chkIdDictionary) {
		  if (chkIdDictionary.hasOwnProperty(key)) {
		  	if (document.getElementById(key).checked) {
            	layersToBeAdded = layersToBeAdded + key.replace("ck", "") + ",";
        	}
		  }
		}
        layersToBeAdded = layersToBeAdded.substring(0, layersToBeAdded.length - 1);
        this.publishData({
	        message: layersToBeAdded
	    });
	    this.i ++;
	    this.pubInfoNode.innerText = 'Publish ' + this.i;
    },

    /*_onPublishHisClick: function() {
      this.publishData({
        message: 'I am widget A.'
      }, true);
      this.j ++;
      this.pubHisInfoNode.innerText = 'Publish ' + this.j;
    },

    _onLoadWidgetBClick: function(){
      var widgets = this.appConfig.getConfigElementsByName('WidgetB');
      if(widgets.length === 0){
        this.loadWidgetBInfoNode.innerText = 'Widget B is not configured.';
        return;
      }

      var widgetId = widgets[0].id;
      if(this.widgetManager.getWidgetById(widgetId)){
        this.loadWidgetBInfoNode.innerText = 'Widget B has been loaded.';
        return;
      }
      this.openWidgetById(widgetId).then(lang.hitch(this, function(widget){
        this.loadWidgetBInfoNode.innerText = widget.name + ' is loaded';
      }));
    }*/
  });
});