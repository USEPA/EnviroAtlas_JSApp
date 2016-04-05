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
    'dijit/_WidgetsInTemplateMixin',
    "dojo/Deferred",
    'jimu/BaseWidget',
    'dijit/Dialog',
    'dijit/layout/AccordionContainer', 
    'dijit/layout/ContentPane',
    'dijit/layout/TabContainer',
    'dijit/form/TextBox',
    'dojox/grid/DataGrid',
    'dojo/data/ItemFileWriteStore'
  ],
  function(
    declare,
    _WidgetsInTemplateMixin,
    Deferred,
    BaseWidget,
    Dialog) {
        var   layerData = {
            identifier: "eaLyrNum",  //This field needs to have unique values
            label: "name", //Name field for display. Not pertinent to a grid but may be used elsewhere.
            items: []};
    	var layerDataStore = new dojo.data.ItemFileWriteStore({ data:layerData });
    	//var myNewItem = {eaLyrNum: layer.eaLyrNum, name: layer.name, description: layer.eaDescription, eaDfsLink: layer.eaDfsLink};
    	var SelectableLayerFactory = function(data) {
		    this.eaLyrNum = data.eaLyrNum;
		    this.name = data.name;
		    this.eaDescription = data.eaDescription;		    
		    this.eaDfsLink = data.eaDfsLink;
		    this.eaCategory = data.eaCategory ;
		}
		var selectableLayerArray = [];
		var hashFactsheetLink = {};
		var hashLayerNameLink = {};
		var objectPropInArray = function(list, prop, val) {
		  if (list.length > 0 ) {
		    for (i in list) {
		      if (list[i][prop] === val) {
		        return true;
		      }
		    }
		  }
		  return false;  
		};
    	var dataFactSheet = "https://leb.epa.gov/projects/EnviroAtlas/currentDevelopment/";
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
    var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {

      name: 'eBasemapGallery',
      baseClass: 'jimu-widget-ebasemapgallery',



      startup: function() {

        this.inherited(arguments);

	    //tableRef.innerHTML = "";	    	                     
	                     
        loadJSON(function(response) {
            var localLayerConfig = JSON.parse(response);
            var arrLayers = localLayerConfig.layers.layer;
           
            for (index = 0, len = arrLayers.length; index < len; ++index) {
                layer = arrLayers[index];
                var indexCheckbox = 0;
                if(layer.hasOwnProperty('name')){
                    if(layer.hasOwnProperty('eaLyrNum')){
                        eaLyrNum = layer.eaLyrNum.toString();
                        if ((window.allLayerNumber.indexOf(layer.eaLyrNum)) == -1) {                        	
    					    var myNewItem = {eaLyrNum: layer.eaLyrNum, name: layer.name, eaDescription: layer.eaDescription, eaDfsLink: layer.eaDfsLink, eaCategory: layer.eaCategory};
    					    layerDataStore.newItem(myNewItem);
                        }
                    }                	
                }
            }
            console.log("layerDataStore:"+ layerDataStore);
        });
    },               
    i: 0,
    j: 0,
    _onSearchLayersByPhraseClick: function() {
    	selectableLayerArray = [];
    	var divsearchWordRemovable = document.getElementById('searchWordRemovable');    	
	    divsearchWordRemovable.innerHTML = "";//Remove all searching words
        var tableOfRelationship = document.getElementById('layersFilterTable');
	    var tableRef = tableOfRelationship.getElementsByTagName('tbody')[0];    	
		while(tableOfRelationship.rows.length > 0) {
		  tableOfRelationship.deleteRow(0);
		}
    	var searchPhraseInput = document.getElementById('searchPhraseInput').value;
    	if (searchPhraseInput.replace(/ /g,'') == "") {
    		this._constructSelectableLayerArray("*", 'name');
    	}
		var result = [];
		searchPhraseInput.split("\"").map(function(v, i ,a){
		    if(i % 2 == 0) {
		        result = result.concat(v.split(" ").filter(function(v){
		            return v !== "";
		        }));
		    } else {
		        result.push(v);
		    }
		});
		console.log(result);
		for (var wordIndex in result) {
			//layerDataStore.fetch( { query: { name: '*ork' },  
			//foodStore.fetch({onBegin: clearSortedList, onComplete: gotSortedItems, onError: fetchFailed, sort: [{ attribute: "aisle"},{attribute: "name"}]});
			word = result[wordIndex];
			console.log("look for word: " + word);
			var singleLineChildren = document.createElement('div');
			singleLineChildren.style.whiteSpace = "nowrap";
			singleLineChildren.style.overflow="hidden";
			singleLineChildren.style.display = "inline-block";			
			var strStyleDisplay = "inline-block";
			var strStyleVerticalAlign = "bottom";
			var strStyleHeight = "20px";
			var strStyleBackgroundColor = "SteelBlue";
			var strMarginTop = '10px';
			var searchWord = document.createElement('Label');
			var searchWordRemoveId = word.replace(" ","_");
			var searchWordElementPrefix = "search";
			var blueSpace = document.createElement('Label');
			blueSpace.innerHTML = ".";
			blueSpace.style.display = strStyleDisplay;//should set label to be inline-block or block, otherwise cannot set height attribute
			blueSpace.style.verticalAlign = strStyleVerticalAlign;//make the label and button aligned
			blueSpace.style.height = strStyleHeight;
			blueSpace.htmlFor = searchWordRemoveId;
			blueSpace.style.backgroundColor = strStyleBackgroundColor;
			blueSpace.style.color = strStyleBackgroundColor;
			blueSpace.style.marginTop = strMarginTop; 
			singleLineChildren.appendChild(blueSpace);		
			searchWord.innerHTML = word;
			searchWord.id = searchWordElementPrefix + searchWordRemoveId;
			searchWord.style.display = strStyleDisplay;//should set label to be inline-block or block, otherwise cannot set height attribute
			searchWord.style.verticalAlign = strStyleVerticalAlign;//make the label and button aligned
			searchWord.style.height = strStyleHeight;
			searchWord.htmlFor = searchWordRemoveId;
			searchWord.style.backgroundColor = strStyleBackgroundColor;
			searchWord.style.color = "white";
			searchWord.style.textAlign = "right";
			searchWord.style.marginTop = strMarginTop; 
			singleLineChildren.appendChild(searchWord);			
			var searchWordRemove = document.createElement('button');
			searchWordRemove.style.display = strStyleDisplay;
			searchWordRemove.style.verticalAlign = strStyleVerticalAlign;//make the label and button aligned
			searchWordRemove.style.height = strStyleHeight;
			searchWordRemove.style.backgroundColor = strStyleBackgroundColor;
			searchWordRemove.style.marginTop = strMarginTop; 
			searchWordRemove.style.border = "none";
			searchWordRemove.name = searchWordRemoveId;
			searchWordRemove.id = searchWordRemoveId;
			searchWordRemove.innerHTML = "X";
			singleLineChildren.appendChild(searchWordRemove);
			var whiteSpace = document.createElement('Label');
			whiteSpace.innerHTML = "k";
			whiteSpace.style.display = strStyleDisplay;//should set label to be inline-block or block, otherwise cannot set height attribute
			whiteSpace.style.verticalAlign = strStyleVerticalAlign;//make the label and button aligned
			whiteSpace.style.height = strStyleHeight;
			whiteSpace.htmlFor = searchWordRemoveId;
			whiteSpace.style.backgroundColor = "white";
			whiteSpace.style.color = "white";
			whiteSpace.style.marginTop = strMarginTop; 
			singleLineChildren.appendChild(whiteSpace);			
			var spanForSearchWord = document.createTextNode(" ");  
			singleLineChildren.appendChild(spanForSearchWord);	
			divsearchWordRemovable.appendChild(singleLineChildren);	
	        document.getElementById(searchWordRemoveId).onclick = function(e) {
		        var strToBeRemoved = document.getElementById(searchWordElementPrefix + this.id).innerHTML;
				resultNew = [];
				searchPhraseInput.split("\"").map(function(v, i ,a){
				    if(i % 2 == 0) {
				        resultNew = resultNew.concat(v.split(" ").filter(function(v){
				            return v !== "";
				        }));
				    } else {
				        resultNew.push(v);
				    }
				});
				var strSearchWordAfterRemoved = "";
				for (var wordNewIndex in resultNew) {
					var wordNew = resultNew[wordNewIndex];
					if (wordNew.toUpperCase()!=strToBeRemoved.toUpperCase()){
						if  (wordNew.indexOf(" ") ==-1){
							strSearchWordAfterRemoved = strSearchWordAfterRemoved + wordNew + " ";
						}
						else {
							strSearchWordAfterRemoved = strSearchWordAfterRemoved + "\"" + wordNew + "\"" + " ";
						}
					}
				}		    
		        document.getElementById('searchPhraseInput').value = strSearchWordAfterRemoved;	      
		        document.getElementById('buttonSearchLayersByPhrase').click();
		    };  // end of onclick
		    this._constructSelectableLayerArray(word, 'name');
		    this._constructSelectableLayerArray(word, 'eaDescription');
		    //this._constructSelectableLayerArray(word, 'tag');



        };
        if (selectableLayerArray.length > 0 ) {
		    for (i in selectableLayerArray) {
                   	var newRow   = tableRef.insertRow(tableRef.rows.length);
                   	newRow.style.height = "38px";
                   	var newCheckboxCell  = newRow.insertCell(0);
					var checkbox = document.createElement('input');
					checkbox.type = "checkbox";
					var eaLyrNum = "";

                    eaLyrNum = selectableLayerArray[i]['eaLyrNum'].toString();
                    if ((window.allLayerNumber.indexOf(selectableLayerArray[i]['eaLyrNum'])) == -1) {                        	
                    	window.allLayerNumber.push(selectableLayerArray[i]['eaLyrNum']);
                        }

                    chkboxId = "ck" + eaLyrNum;
					checkbox.name = chkboxId;
					checkbox.value = 1;
					checkbox.id = chkboxId;
					newCheckboxCell.style.verticalAlign = "top";//this will put checkbox on first line
			        newCheckboxCell.appendChild(checkbox);    			              
          	
               	chkIdDictionary[chkboxId] = selectableLayerArray[i]['name'];
			        var newCell  = newRow.insertCell(1);
			        newCell.style.verticalAlign = "top";//this will put layer name on first line
			        
			        var photo = document.createElement("td");
		        //photo.style.position = "absolute";

					var ulElem = document.createElement("ul");
					ulElem.setAttribute("id", "navlistSearchfilter");
					var newTitle  = document.createElement('div');
		        newTitle.innerHTML = selectableLayerArray[i]['name'];
		        newTitle.title = selectableLayerArray[i]['eaDescription'];
					

					var liHomeElem = null;
					var aHomeElem = null;
					indexImage = 0;
					for (var key in window.categoryDic) {

						    liElem = document.createElement("li");
							liElem.style.left = (indexImage*20).toString() + "px";
							liElem.style.top = "-10px";
							aElem = document.createElement("a");
							aElem.title  = key;
							liElem.appendChild(aElem);
							ulElem.appendChild(liElem);							
						if (selectableLayerArray[i]['eaCategory'].indexOf(key) !=-1) {
							console.log("bji new Mar 2016");
								liElem.setAttribute("id",window.categoryDic[key]);
							}
							else {
								liElem.setAttribute("id",window.categoryDic[key] + "_bw");
							}
					
						indexImage = indexImage + 1;
					}
			        photo.appendChild(ulElem);
					newTitle.appendChild(photo);
					newCell.appendChild(newTitle);
				var newButtonInfoCell  = newRow.insertCell(2);
				var buttonInfo = document.createElement('input');
				buttonInfo.type = "button";
                var buttonInfoId = "but" + eaLyrNum;
				buttonInfo.name = buttonInfoId;
				buttonInfo.id = buttonInfoId;
				buttonInfo.value = "i";
				buttonInfo.style.height = "16px";
				buttonInfo.style.width = "16px";
				buttonInfo.style.lineHeight = "3px";//to set the text vertically center
				newButtonInfoCell.style.verticalAlign = "top";//this will put checkbox on first line
		        newButtonInfoCell.appendChild(buttonInfo);  
		        hashFactsheetLink[buttonInfoId] = selectableLayerArray[i]['eaDfsLink'];
		        hashLayerNameLink[buttonInfoId] = selectableLayerArray[i]['name'];
		        document.getElementById(buttonInfoId).onclick = function(e) {
			        //alert(this.id);
			        //alert(selectableLayerArray[i]['eaLyrNum']);
			        //window.open(dataFactSheet + selectableLayerArray[i]['eaDfsLink']);//this will open the wrong link
			        if (hashFactsheetLink[this.id] == "N/A") {
		        		var dataFactNote = new Dialog({
					        title: hashLayerNameLink[this.id],
					        style: "width: 300px",    
				    	});
				        dataFactNote.show();
				        dataFactNote.set("content", "Data fact sheet link is not available!");
			        } else {
			        	window.open(dataFactSheet + hashFactsheetLink[this.id]);
			        }		      
			    };     
                }
            }

        layersToBeAdded = "a";

            
    },               
    _constructSelectableLayerArray: function(word,columnSearchAgainst) {
    	   /*if ((word.indexOf(" ") !=-1) || (word.indexOf("*") !=-1)){
		    	console.log("word:"+word);
		    	layerDataStore.fetch( {   
		               onItem: function(item) {
   								word = word.replace("*", "");
					    		if ((layerDataStore.getValue( item, columnSearchAgainst).toUpperCase().indexOf(word.toUpperCase()) != -1)&& (!objectPropInArray(selectableLayerArray, 'eaLyrNum', layerDataStore.getValue( item, 'eaLyrNum')))){         		
									selectableLayerArray.push(new SelectableLayerFactory({eaLyrNum: layerDataStore.getValue( item, 'eaLyrNum') , name: layerDataStore.getValue( item, 'name'), eaDescription: layerDataStore.getValue( item, 'eaDescription'), eaDfsLink: layerDataStore.getValue( item, 'eaDfsLink'), eaCategory: layerDataStore.getValue( item, 'eaCategory')}));
								}
		               }
		         });	    	
		    }
		    else {
		    	layerDataStore.fetch( {   
		               onItem: function(item) {
		               		var layerNameArray= layerDataStore.getValue( item, columnSearchAgainst).split(/[ .:;?!~,`"&|()<>{}\[\]\r\n/\\]+/);
					    	for (i in layerNameArray) {		   
					    		if ((layerNameArray[i].toUpperCase() ==  word.toUpperCase())&& (!objectPropInArray(selectableLayerArray, 'eaLyrNum', layerDataStore.getValue( item, 'eaLyrNum')))){         		
									console.log("bji eaLyrNum for no*: "+ layerDataStore.getValue( item, 'eaLyrNum'));
									selectableLayerArray.push(new SelectableLayerFactory({eaLyrNum: layerDataStore.getValue( item, 'eaLyrNum') , name: layerDataStore.getValue( item, 'name'), eaDescription: layerDataStore.getValue( item, 'eaDescription'), eaDfsLink: layerDataStore.getValue( item, 'eaDfsLink'), eaCategory: layerDataStore.getValue( item, 'eaCategory')}));
									break;
								}
			                } 
		               }
		         });

		    }*/
	    	layerDataStore.fetch( {   
	               onItem: function(item) {
							word = word.replace("*", "");
				    		if ((layerDataStore.getValue( item, columnSearchAgainst).toUpperCase().indexOf(word.toUpperCase()) != -1)&& (!objectPropInArray(selectableLayerArray, 'eaLyrNum', layerDataStore.getValue( item, 'eaLyrNum')))){         		
								selectableLayerArray.push(new SelectableLayerFactory({eaLyrNum: layerDataStore.getValue( item, 'eaLyrNum') , name: layerDataStore.getValue( item, 'name'), eaDescription: layerDataStore.getValue( item, 'eaDescription'), eaDfsLink: layerDataStore.getValue( item, 'eaDfsLink'), eaCategory: layerDataStore.getValue( item, 'eaCategory')}));
							}
	               }
	         });	
    },
    _onAddLayersClick: function() {
        layersToBeAdded = "a";
	    var tableOfRelationship = document.getElementById('layersFilterTable');
	    var tableRef = tableOfRelationship.getElementsByTagName('tbody')[0];
		for (var key in chkIdDictionary) {
		  if ((chkIdDictionary.hasOwnProperty(key)) && (document.getElementById(key)!=null) ){
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
    },
    sortOn:function(property){
	    return function(a, b){
	        if(a[property] < b[property]){
	            return -1;
	        }else if(a[property] > b[property]){
	            return 1;
	        }else{
	            return 0;   
	        }
	    }
	},


    });

    return clazz;
  });
