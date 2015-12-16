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

  return declare([BaseWidget], {

     baseClass: 'jimu-widget-SimpleSearchFilter',    
        
    startup: function(){
		
	    var tableOfRelationship = document.getElementById('layersFilterTable');
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
                   	newRow.style.height = "38px";
                   	var newCheckboxCell  = newRow.insertCell(0);
					var checkbox = document.createElement('input');
					checkbox.type = "checkbox";
					var eaLyrNum = "";
                    if(layer.hasOwnProperty('eaLyrNum')){
                        eaLyrNum = layer.eaLyrNum.toString();
                    }
                    chkboxId = "ck" + eaLyrNum;
					checkbox.name = chkboxId;
					checkbox.value = 1;
					checkbox.id = chkboxId;
					newCheckboxCell.style.verticalAlign = "top";//this will put checkbox on first line
			        newCheckboxCell.appendChild(checkbox);    			              
          	
                   	chkIdDictionary[chkboxId] = layer.name;
			        var newCell  = newRow.insertCell(1);
			        newCell.style.verticalAlign = "top";//this will put layer name on first line
			        
			        var photo = document.createElement("td");

					var ulElem = document.createElement("ul");
					ulElem.setAttribute("id", "navlist");
					
			        newCell.innerHTML = layer.name;
					
					//define the dictionary of mapping category names to sprite style id which is defined in css
			        var categoryDic = {}
			        categoryDic["Clean Air"] = "cair";
			        categoryDic["Clean and Plentiful Water"] = "cpw";
			        categoryDic["Climate Stabilization"] = "clim";
			        categoryDic["Natural Hazard Mitigation"] = "nhm";
			        categoryDic["Recreation, Culture, and Aesthetics"] = "rca";
			        categoryDic["People and Built Spaces"] = "pbs";
			        categoryDic["Supplemental"] = "sup";
			        categoryDic["Food, Fuel, and Materials"] ="ffm";
			        categoryDic["Biodiversity Conservation"] = "biod";
					var liHomeElem = null;
					var aHomeElem = null;
					indexImage = 0;
					for (var key in categoryDic) {
						if(layer.hasOwnProperty('eaCategory')){
						    liElem = document.createElement("li");
							liElem.style.left = (indexImage*20).toString() + "px";
							liElem.style.top = "-11px";
							aElem = document.createElement("a");
							liElem.appendChild(aElem);
							ulElem.appendChild(liElem);							
							if (layer.eaCategory.indexOf(key) !=-1) {
								liElem.setAttribute("id",categoryDic[key]);
							}
							else {
								liElem.setAttribute("id",categoryDic[key] + "_bw");
							}
						}
						indexImage = indexImage + 1;
					}
			        photo.appendChild(ulElem);
					newCell.appendChild(photo);

                }
            }

        });
            
    },               
                    
    i: 0,
    j: 0,

    _onAddLayersClick: function() {
        layersToBeAdded = "a";
		for (var key in chkIdDictionary) {
		  if (chkIdDictionary.hasOwnProperty(key)) {
		  	if (document.getElementById(key).checked) {
            	layersToBeAdded = layersToBeAdded + "," + key.replace("ck", "");
        	}
		  }
		}
        this.publishData({
	        message: layersToBeAdded
	    });
	    this.i ++;
	    //this.pubInfoNode.innerText = 'Publish ' + this.i;
    },
    _onRemoveLayersClick: function() {
        layersToBeRemoved = "r";
		for (var key in chkIdDictionary) {
		  if (chkIdDictionary.hasOwnProperty(key)) {
		  	if (document.getElementById(key).checked) {
            	layersToBeRemoved = layersToBeRemoved + "," + key.replace("ck", "") ;
        	}
		  }
		}
        this.publishData({
	        message: layersToBeRemoved
	    });
	    this.i ++;
	    //this.pubInfoNode.innerText = 'Publish ' + this.i;
    },
  });
});