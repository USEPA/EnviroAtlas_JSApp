///////////////////////////////////////////////////////////////////////////
// Copyright © Esri. All Rights Reserved.
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
  'dijit/_WidgetBase',
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/_base/html',
  'dojo/dom-construct',
  'dojo/on',
  'dojo/keys',
  'dijit/focus',
  'dojo/query',
  'jimu/dijit/CheckBox',
  'jimu/PanelManager',
  'jimu/dijit/DropMenu',
  'jimu/dijit/LoadingShelter',
  './PopupMenu',
  'dijit/_TemplatedMixin',
  'jimu/utils',
  'dojo/text!./LayerListView.html',
  'dojo/dom-attr',
  'dojo/dom-class',
  'dojo/dom-style',
  './NlsStrings'
], function(_WidgetBase, declare, lang, array, html, domConstruct, on, keys, focusUtil, query,
  CheckBox, PanelManager, DropMenu, LoadingShelter, PopupMenu, _TemplatedMixin, jimuUtils, template,
  domAttr, domClass, domStyle, NlsStrings) {
  	var received = "";

  return declare([_WidgetBase, _TemplatedMixin], {
    templateString: template,
    _currentSelectedLayerRowNode: null,
    operationsDropMenu: null,
    _layerNodeHandles: null,
    // _layerDomNodeStorage = {
    //   layerInfoObjectId: {// layerDomNode
    //     layerTrNode: domNode,
    //     layerContentTrNode: domeNode,
    //     layerNodeEventHandles: []
    //     layerNodeReferredDijits: []
    //   }
    // }
    _layerDomNodeStorage: null,
    _firstLayerNode: false,
    _lastLayerNode: null,
    _eventHandlers: null,
    _layerIndexs: null,

    postMixInProperties: function() {
      this.inherited(arguments);
      this.nls = NlsStrings.value;
      this._layerDomNodeStorage = {};
      this._eventHandlers = [];
      this._initLayerIndexs();
    },

    postCreate: function() {
      this.refresh();
      this._initOperations();
    },

    _initLayerIndexs: function() {
      var count = 2;
      this._layerIndexs = {};
      this.operLayerInfos.traversalAll(lang.hitch(this, function(layerInfo) {
        this._layerIndexs[layerInfo.id] = count++;
      }));
    },
    refresh: function() {
      this._removeLayerNodes();
      array.forEach(this.operLayerInfos.getLayerInfoArray(), function(layerInfo) {
        //this.drawListNode(layerInfo, 0, this.layerListTable);
        var refHrNode = query("[class~='hrClass']", this.domNode)[0];
        var refHrNodeNonGraphic = query("[class~='hrClassNonGraphic']", this.domNode)[0];
        //if ((layerInfo.layerObject.type) && (layerInfo.layerObject.type.toUpperCase() == "FEATURE LAYER")) {
        if (((layerInfo.layerObject.type) && (layerInfo.layerObject.type.toUpperCase() == "FEATURE LAYER")) ||((layerInfo.layerObject.url != null)&&(layerInfo.layerObject.url.toUpperCase().indexOf("FEATURESERVER"))&&(layerInfo.layerObject.url.toUpperCase().indexOf("ARCGIS.COM")))) {

        	this.drawListNode(layerInfo, 0, refHrNode,'before');
        }
        else {

        	this.drawListNode(layerInfo, 0, refHrNodeNonGraphic,'before');
        }
        
        if (layerInfo.title == window.communityLayerTitle) {
        	layerInfo.enablePopupNested();
        }
      }, this);

      if(this.config.showBasemap) {
        array.forEach(this.operLayerInfos.getBasemapLayerInfoArray(), function(layerInfo) {
          this.drawListNode(layerInfo, 0, this.layerListTable);
        }, this);
      }

      array.forEach(this.operLayerInfos.getTableInfoArray(), function(layerInfo) {
        this.drawListNode(layerInfo, 0, this.tableListTable);
      }, this);

      array.forEach(this._eventHandlers, function(eventHander) {
        if(eventHander.remove) {
          eventHander.remove();
        }
      });

      this._supports508Accessibility();
    },

    drawListNode: function(layerInfo, level, toTableNode, position) {
      var nodeAndSubNode, showLegendDiv;
      if(this.isLayerHiddenInWidget(layerInfo) || !this.layerFilter.isValidLayerInfo(layerInfo)) {
          //alert("do nothing;");
        return;
      }
      nodeAndSubNode = this._layerDomNodeStorage[layerInfo.getObjectId()];
      if((layerInfo.isRootLayer() || layerInfo.isTable)  && nodeAndSubNode) {
        domConstruct.place(nodeAndSubNode.layerTrNode, toTableNode, position);
        domConstruct.place(nodeAndSubNode.layerContentTrNode, toTableNode, position);
      } else if (layerInfo.newSubLayers.length === 0) {
        //addLayerNode
        nodeAndSubNode = this.addLayerNode(layerInfo, level, toTableNode, position);
        //add legend node
        if (this.config.showLegend) {
          this.addLegendNode(layerInfo, level, nodeAndSubNode.subNode);
        } else {
          showLegendDiv = query(".showLegend-div", nodeAndSubNode.layerTrNode)[0];
          if(showLegendDiv) {
            domClass.add(showLegendDiv, 'hidden-showLegend-div');
          }
        }
      } else {
        //addLayerNode
        nodeAndSubNode = this.addLayerNode(layerInfo, level, toTableNode, position);
        array.forEach(layerInfo.newSubLayers, lang.hitch(this, function(level, subLayerInfo) {
          this.drawListNode(subLayerInfo, level + 1, nodeAndSubNode.subNode);
        }, level));
      }
    },

    addLayerNode: function(layerInfo, level, toTableNode, position) {
      var layerIndex = this._layerIndexs[layerInfo.id];
      var layerTrNode, layerTdNode, ckSelectDiv, ckSelect, imageNoLegendDiv, handle,
        imageGroupDiv, imageNoLegendNode, popupMenuNode, i, imageShowLegendDiv, popupMenu, divLabel, eaId;

      var rootLayerInfo = layerInfo.getRootLayerInfo();
      // if(!this._layerNodeHandles[rootLayerInfo.id]) {
      //   this._layerNodeHandles[rootLayerInfo.id] = [];
      // }

      // init _layerDomNodeStorage for rootLayerInfo.
      //if(layerInfo.isRootLayer() || layerInfo.isTable) {
      this._layerDomNodeStorage[layerInfo.getObjectId()] = {
        layerTrNode: null,
        layerContentTrNode: null,
        layerNodeEventHandles: [],
        layerNodeReferredDijits: [],
        layerInfo: layerInfo
      };
      //}

      var layerTrNodeClass = "layer-tr-node-" + layerInfo.id;
      var layerOrTableString = layerInfo.isTable ? window.jimuNls.common.table : window.jimuNls.common.layer;
      layerTrNode = domConstruct.create('tr', {
        'class': 'jimu-widget-row layer-row ' +
          ( /*visible*/ false ? 'jimu-widget-row-selected ' : ' ') + layerTrNodeClass + '',
        //(!this._firstLayerNode ? ' firstFocusNode' : ' '),
        'tabindex': 0,
        'aria-label':  layerOrTableString + ' ' + layerInfo.title,
        //'aria-label': (!this._firstLayerNode ? 'Layers' + layerInfo.title : ''),
        'layerTrNodeId': layerInfo.id
      });
      domConstruct.place(layerTrNode, toTableNode, position);
      if(!this._firstLayerNode) {
        this._firstLayerNode = layerTrNode;
      }
      this._lastLayerNode = layerTrNode;
      this._lastLayerInfo = layerInfo;

      layerTdNode = domConstruct.create('td', {
        'class': 'col col1'
      }, layerTrNode);

      for (i = 0; i < level; i++) {
        domConstruct.create('div', {
          'class': 'begin-blank-div jimu-float-leading',
          'innerHTML': ''
        }, layerTdNode);
      }

      imageShowLegendDiv = domConstruct.create('div', {
        'class': 'showLegend-div jimu-float-leading ',
        'tabindex': layerIndex,
        'role': 'button',
        'aria-label': this.nls.expandLayer,
        'aria-expanded': 'false',
        'imageShowLegendDivId': layerInfo.id
      }, layerTdNode);

      ckSelectDiv = domConstruct.create('div', {
        'class': 'div-select jimu-float-leading'
      }, layerTdNode);
		layerId = layerInfo.id;
		if (layerId.indexOf(window.layerIdPrefix) >= 0) {
		    eaId = layerId.replace(window.layerIdPrefix, "");                     	
		} 
		     
      ckSelect = new CheckBox({
        checked: layerInfo.isVisible()||window.allLayersTurnedOn[eaId], //layerInfo.visible
        'class': "visible-checkbox-" + layerInfo.id
      });		
      /*ckSelect = new CheckBox({
        checked: layerInfo.isVisible(), //layerInfo.visible
        'class': "visible-checkbox-" + layerInfo.id
      });*/

      domConstruct.place(ckSelect.domNode, ckSelectDiv);
      html.setAttr(ckSelect.domNode, 'tabindex', layerIndex);

      imageNoLegendDiv = domConstruct.create('div', {
        'class': 'noLegend-div jimu-float-leading'
      }, layerTdNode);

      var imageName;
      if (layerInfo.isTable) {
        imageName = 'images/table.png';
      } else if(layerInfo.isBasemap()) {
        imageName = 'images/basemap.png';
      } else {
        imageName = 'images/noLegend.png';
      }

      imageNoLegendNode = domConstruct.create('img', {
        'class': 'noLegend-image',
        'src': this.layerListWidget.folderUrl + imageName,
        'alt': 'l'
      }, imageNoLegendDiv);

      if (layerInfo.isTiled || layerInfo.isTable) {
        domStyle.set(imageShowLegendDiv, 'display', 'none');
        domStyle.set(ckSelectDiv, 'display', 'none');
        domStyle.set(imageNoLegendDiv, 'display', 'block');
      }
      if(layerInfo.isBasemap()) {
        domStyle.set(imageShowLegendDiv, 'display', 'block');
        domStyle.set(ckSelectDiv, 'display', 'none');
        domStyle.set(imageNoLegendDiv, 'display', 'block');
        domStyle.set(imageNoLegendDiv, 'width', 'auto');
        domStyle.set(imageNoLegendDiv, 'margin-left', '2px');
      }

      // set tdNode width
      domStyle.set(layerTdNode, 'width', level * 12 + 40 + 'px');

      scaleLabel = domConstruct.create('td', {
        'class': 'col col15'
      }, layerTrNode);
      
  	  bTileOnMap = false;
      tileLayer = layerInfo.map.getLayer(window.layerIdTiledPrefix + window.hashFeaturedCollectionToEAID[layerInfo.id]);         	
      if(tileLayer != null){
        	bTileOnMap = true;      
      } 
      
      var eaIDinFeatureCollection = window.hashFeaturedCollectionToEAID[layerInfo.id];
      var indexID = window.featureLyrNumber.indexOf(eaIDinFeatureCollection);
      	
      scaleObject = '';

      if ((layerInfo.layerObject.eaScale) || ((eaIDinFeatureCollection !=null) && (eaIDinFeatureCollection !=undefined))) {
        scaleTitle = 'Community Dataset';
        if ((layerInfo.layerObject.eaScale == 'NATIONAL') ||(window.hashScale[window.hashFeaturedCollectionToEAID[layerInfo.id]]== 'NATIONAL')){
          scaleTitle = 'National Dataset';
        };
        
        scaleForFeaturedCollection = window.hashScale[window.hashFeaturedCollectionToEAID[layerInfo.id]];
        if (((scaleForFeaturedCollection != null) && (scaleForFeaturedCollection != undefined))) {
        	scale = scaleForFeaturedCollection;
        } else {
        	scale = layerInfo.layerObject.eaScale;
        }
        
        scaleImage = domConstruct.create('div', {
          'title': scaleTitle,
          'class': 'icon_style ' + scale
        }, scaleLabel);
      }

      var layerTitleText = layerInfo.title
      var layerTitleTdNode = domConstruct.create('div', {
        'class': 'col col2', 
      }, layerTrNode);
     
      var grayedTitleClass = '';
      try {
      	var eaID = layerInfo.id.replace(window.layerIdPrefix, "");


      	//use ((indexID >= 0) && (bTileOnMap == true)) to check if tileLayer corresponding to Featured Collection exist.
        if ((!layerInfo.isInScale())&&(window.hashIDtoTileURL[eaID] == null)&&((indexID >= 0) && (bTileOnMap == true))) {
          grayedTitleClass = 'grayed-title';
        }
      } catch (err) {
        console.warn(err.message);
      }
      
      var layerTitleDivIdClass = 'layer-title-div-' + layerInfo.id;
      divLabel = domConstruct.create('td', {
        	'id': window.layerTitlePrefix + layerInfo.id,
        'innerHTML': jimuUtils.sanitizeHTML(layerInfo.title),
        'class':layerTitleDivIdClass + ' div-content jimu-float-leading ' + grayedTitleClass
      }, layerTitleTdNode);

      //domStyle.set(divLabel, 'width', 263 - level*13 + 'px');

      layerTdNode = domConstruct.create('td', {
        'class': 'col col3'
      }, layerTrNode);

      var popupMenuDisplayStyle = this.hasContentMenu() ? "display: block" : "display: none";
      // add popupMenu
      popupMenuNode = domConstruct.create('div', {
        'class': 'layers-list-popupMenu-div',
        'style': popupMenuDisplayStyle
      }, layerTdNode);

      /*
      var handle = on(popupMenuNode,
                  'click',
                  lang.hitch(this, function() {
                    var popupMenu = new PopupMenu({
                      //items: layerInfo.popupMenuInfo.menuItems,
                      _layerInfo: layerInfo,
                    box: this.layerListWidget.domNode.parentNode,
                    popupMenuNode: popupMenuNode,
                    layerListWidget: this.layerListWidget,
                    _config: this.config
                    }).placeAt(popupMenuNode);
                    this.own(on(popupMenu,
                        'onMenuClick',
                        lang.hitch(this, this._onPopupMenuItemClick, layerInfo, popupMenu)));

                    handle.remove();
                  }));
      */
      /*
      popupMenu = new PopupMenu({
        //items: layerInfo.popupMenuInfo.menuItems,
        _layerInfo: layerInfo,
        box: this.layerListWidget.domNode.parentNode,
        popupMenuNode: popupMenuNode,
        layerListWidget: this.layerListWidget,
        _config: this.config
      }).placeAt(popupMenuNode);
      this.own(on(popupMenu,
        'onMenuClick',
        lang.hitch(this, this._onPopupMenuItemClick, layerInfo, popupMenu)));
      */

      //add a tr node to toTableNode.
      var layerContentTrNode = domConstruct.create('tr', {
        'class': '',
        'layerContentTrNodeId': layerInfo.id
      });
      domConstruct.place(layerContentTrNode, toTableNode, position);

      var tdNode = domConstruct.create('td', {
        'class': '',
        'colspan': '3'
      }, layerContentTrNode);

      var tableNode = domConstruct.create('table', {
        'class': 'layer-sub-node',
        'subNodeId': layerInfo.id
      }, tdNode);

      //bind event
      handle = this.own(on(layerTitleTdNode,
        'click',
        lang.hitch(this,
          this._onRowTrClick,
          layerInfo,
          imageShowLegendDiv,
          layerTrNode,
          tableNode)));
      //this._layerNodeHandles[rootLayerInfo.id].push(handle[0]);
      this._storeLayerNodeEventHandle(rootLayerInfo, handle[0]);

      handle = this.own(on(imageShowLegendDiv,
        'click',
        lang.hitch(this,
          this._onRowTrClick,
          layerInfo,
          imageShowLegendDiv,
          layerTrNode,
          tableNode)));
      //this._layerNodeHandles[rootLayerInfo.id].push(handle[0]);
      this._storeLayerNodeEventHandle(rootLayerInfo, handle[0]);

      handle = this.own(on(ckSelect.domNode, 'click', lang.hitch(this,
        this._onCkSelectNodeClick,
        layerInfo,
        ckSelect)));
      //this._layerNodeHandles[rootLayerInfo.id].push(handle[0]);
      this._storeLayerNodeEventHandle(rootLayerInfo, handle[0]);

      handle = this.own(on(popupMenuNode, 'click', lang.hitch(this,
        this._onPopupMenuClick,
        layerInfo,
        popupMenuNode,
        layerTrNode)));
      //this._layerNodeHandles[rootLayerInfo.id].push(handle[0]);
      this._storeLayerNodeEventHandle(rootLayerInfo, handle[0]);

      handle = this.own(on(layerTrNode,
        'keydown',
        lang.hitch(this,
          this._onLayerNodeKey,
          imageShowLegendDiv,
          popupMenuNode)));
      this._storeLayerNodeEventHandle(rootLayerInfo, handle[0]);

      handle = this.own(on(imageShowLegendDiv,
        'keydown',
        lang.hitch(this,
          this._onImageShowLegendKey,
          layerInfo,
          imageShowLegendDiv,
          layerTrNode,
          tableNode,
          popupMenuNode)));
      this._storeLayerNodeEventHandle(rootLayerInfo, handle[0]);

      handle = this.own(on(ckSelectDiv,
        'keydown',
        lang.hitch(this,
          this._onCkSelectDivKey,
          layerInfo,
          ckSelect,
          layerTrNode)));
      this._storeLayerNodeEventHandle(rootLayerInfo, handle[0]);

      handle = this.own(on(popupMenuNode,
        'keydown',
        lang.hitch(this,
          this._onPopupMenuNodeKey,
          layerInfo,
          popupMenuNode,
          layerTrNode,
          imageShowLegendDiv)));
      this._storeLayerNodeEventHandle(rootLayerInfo, handle[0]);



      //if(layerInfo.isRootLayer() || layerInfo.isTable) {
      this._layerDomNodeStorage[layerInfo.getObjectId()].layerTrNode = layerTrNode;
      this._layerDomNodeStorage[layerInfo.getObjectId()].layerContentTrNode = layerContentTrNode;
      //}

      if(this.layerFilter.isExpanded(layerInfo)) {
        this._foldOrUnfoldLayer(layerInfo, false, imageShowLegendDiv, tableNode);
      }

      return {
        layerTrNode: layerTrNode,
        subNode: tableNode
      };
    },

    hasContentMenu: function() {
      var hasContentMenu = false;
      var item;
      if(this.config.contextMenu) {
        for (item in this.config.contextMenu) {
          if(this.config.contextMenu.hasOwnProperty(item) &&
             (typeof this.config.contextMenu[item] !== 'function')) {
            hasContentMenu = hasContentMenu || this.config.contextMenu[item];
          }
        }
      } else {
        hasContentMenu = true;
      }
      return hasContentMenu;
    },
        
     addLegendNode: function(layerInfo, level, toTableNode) {
      //var legendsDiv;
      var legendTrNode = domConstruct.create('tr', {
          'class': 'legend-node-tr',
          'tabindex': 0
        }, toTableNode),
        legendTdNode;

      domConstruct.create('td', {
        'aria-label': window.jimuNls.common.layer + " " + window.jimuNls.statisticsChart.legend
      }, legendTrNode);

      legendTdNode = domConstruct.create('td', {
        'class': 'legend-node-td'
      }, legendTrNode);

      try {
        var legendsNode = layerInfo.createLegendsNode();
        //layerInfo.legendsNode = legendsNode;
        //domStyle.set(legendsNode, 'marginLeft', (level+1)*12 + 'px');
        domStyle.set(legendsNode, 'font-size', (level + 1) * 12 + 'px');
        domConstruct.place(legendsNode, legendTdNode);
      } catch (err) {
        console.error(err);
      }
    },

    redrawLegends: function(layerInfo) {
      var legendsNode = query("div[legendsDivId='" + layerInfo.id + "']", this.layerListTable)[0];
      if(legendsNode) {
        if(legendsNode._legendDijit && legendsNode._legendDijit.destroy) {
          legendsNode._legendDijit.destroy();
        }
        layerInfo.drawLegends(legendsNode, this.layerListWidget.appConfig.portalUrl);
      }
    },

    // destroyLayerTrNode: function(layerInfo) {
    //   var removedLayerNode = query("[class~='layer-tr-node-" + layerInfo.id + "']", this.domNode)[0];
    //   var removedLayerContentNode = query("[layercontenttrnodeid='" + layerInfo.id + "']", this.domNode)[0];
    //   if(removedLayerNode) {
    //     var rootLayerInfo = layerInfo.getRootLayerInfo();
    //     array.forEach(this._layerNodeHandles[rootLayerInfo.id], function(handle) {
    //       handle.remove();
    //     }, this);
    //     delete this._layerNodeHandles[rootLayerInfo.id];
    //     domConstruct.destroy(removedLayerNode);
    //     if(removedLayerContentNode) {
    //       domConstruct.destroy(removedLayerContentNode);
    //     }
    //   }
    // },

    /***************************************************
     * methods for refresh layerListView
     ***************************************************/
    _storeLayerNodeEventHandle: function(rootLayerInfo, handle) {
      var rootLayerStorage = this._layerDomNodeStorage[rootLayerInfo.getObjectId()];
      if(rootLayerStorage) {
        rootLayerStorage.layerNodeEventHandles.push(handle);
      }
    },

    _storeLayerNodeDijit: function(rootLayerInfo, dijit) {
      var rootLayerStorage = this._layerDomNodeStorage[rootLayerInfo.getObjectId()];
      if(rootLayerStorage) {
        rootLayerStorage.layerNodeReferredDijits.push(dijit);
      }
    },

    _clearLayerDomNodeStorage:function() {
      //jshint unused:false
      /*
      var layerInfoArray = this.operLayerInfos.getLayerInfoArray();
      var tableInfoArray = this.operLayerInfos.getTableInfoArray();
      var layerAndTableInfoArray = layerInfoArray.concat(tableInfoArray);
      */
      var findElem;
      var allLayerAndTableInfos = [];
      this.operLayerInfos.traversalAll(function(layerInfo) {
        allLayerAndTableInfos.push(layerInfo);
      });
      for(var elem in this._layerDomNodeStorage) {
        if(this._layerDomNodeStorage.hasOwnProperty(elem) &&
           (typeof this._layerDomNodeStorage[elem] !== 'function')) {
          /* jshint loopfunc: true */
          findElem = array.some(allLayerAndTableInfos, function(layerInfo) {
            if(layerInfo.getObjectId().toString() === elem) {
              return true;
            }
          }, this);
          if(!findElem) {
            //release layer node.
            array.forEach(this._layerDomNodeStorage[elem].layerNodeEventHandles, function(handle) {
              handle.remove();
            }, this);
            array.forEach(this._layerDomNodeStorage[elem].layerNodeReferredDijits, function(dijit) {
              dijit.destroy();
            }, this);
            domConstruct.destroy(this._layerDomNodeStorage[elem].layerTrNode);
            domConstruct.destroy(this._layerDomNodeStorage[elem].layerContentTrNode);
            delete this._layerDomNodeStorage[elem];
          }
        }
      }
    },

    _removeLayerNodes: function() {
      var nodeAndSubNode, parentNode;
      this._clearLayerDomNodeStorage();
      for(var elem in this._layerDomNodeStorage) {
        if(this._layerDomNodeStorage.hasOwnProperty(elem) &&
           (typeof this._layerDomNodeStorage[elem] !== 'function')) {
          nodeAndSubNode = this._layerDomNodeStorage[elem];
          if(nodeAndSubNode &&
             nodeAndSubNode.layerInfo &&
             nodeAndSubNode.layerInfo.isRootLayer() &&
             nodeAndSubNode.layerContentTrNode &&
             nodeAndSubNode.layerTrNode) {
            parentNode = nodeAndSubNode.layerTrNode.parentNode;
            if(parentNode) {
              parentNode.removeChild(nodeAndSubNode.layerTrNode);
            }
            parentNode = nodeAndSubNode.layerContentTrNode.parentNode;
            if(parentNode) {
              parentNode.removeChild(nodeAndSubNode.layerContentTrNode);
            }
          }
        }
      }
      // this.inherited(arguments);
    },

    /***************************************************
     * methods for control layerListView
     ***************************************************/
    // return current state:
    //   true:  fold,
    //   false: unfold
    _foldSwitch: function(layerInfo, imageShowLegendDiv, subNode) {
      /*jshint unused: false*/
      var state;
      if (domStyle.get(subNode, 'display') === 'none') {
        state = this._foldOrUnfoldLayer(layerInfo, false, imageShowLegendDiv, subNode);
      } else {
        state = this._foldOrUnfoldLayer(layerInfo, true, imageShowLegendDiv, subNode);
      }
      return state;
    },

    _foldOrUnfoldLayer: function(layerInfo, isFold, imageShowLegendDivParam, subNodeParam) {
      var imageShowLegendDiv =
        imageShowLegendDiv ?
        imageShowLegendDivParam :
        query("div[imageShowLegendDivId='" + layerInfo.id + "']", this.layerListTable)[0];
      var subNode =
        subNode ?
        subNodeParam :
        query("table[subNodeId='" + layerInfo.id + "']", this.layerListTable)[0];

      var state = null;
      if(imageShowLegendDiv && subNode) {
        if (isFold) {
          //fold
          domStyle.set(subNode, 'display', 'none');
          domClass.remove(imageShowLegendDiv, 'unfold');
          state = true;
          html.setAttr(imageShowLegendDiv, 'aria-label', this.nls.expandLayer);
          html.setAttr(imageShowLegendDiv, 'aria-expanded', 'false');
        } else {
          //unfold
          domStyle.set(subNode, 'display', 'table');
          domClass.add(imageShowLegendDiv, 'unfold');
          state = false;
          html.setAttr(imageShowLegendDiv, 'aria-label', this.nls.collapseLayer);
          html.setAttr(imageShowLegendDiv, 'aria-expanded', 'true');
          if (layerInfo.isLeaf()) {
            var legendsNode = query(".legends-div", subNode)[0];
            var loadingImg = query(".legends-loading-img", legendsNode)[0];
            if (legendsNode && loadingImg) {
              layerInfo.drawLegends(legendsNode, this.layerListWidget.appConfig.portalUrl);
            }
          }
        }
      }
      return state;
    },
    redrawLegends: function(layerInfo) {
      var legendsNode = query("div[legendsDivId='" + layerInfo.id + "']", this.layerListTable)[0];
      if(legendsNode) {
        if(legendsNode._legendDijit && legendsNode._legendDijit.destroy) {
          legendsNode._legendDijit.destroy();
        }
        layerInfo.drawLegends(legendsNode, this.layerListWidget.appConfig.portalUrl);
      }
    },
    _foldOrUnfoldLayers: function(layerInfos, isFold) {
      array.forEach(layerInfos, function(layerInfo) {
        this._foldOrUnfoldLayer(layerInfo, isFold);
      }, this);
    },

    _onCkSelectNodeClick: function(layerInfo, ckSelect, evt) {
      if(evt.ctrlKey || evt.metaKey) {
        if(layerInfo.isRootLayer()) {
          this.turnAllRootLayers(ckSelect.checked);
        } else {
          this.turnAllSameLevelLayers(layerInfo, ckSelect.checked);
        }
      } else {
        this.layerListWidget._denyLayerInfosIsVisibleChangedResponseOneTime = true;
        //set visibility for corresponding tiled layers
	    eaId = "";
	    layerId = layerInfo.id;
	    if (layerId.indexOf(window.layerIdPrefix) >= 0) {
	        eaId = layerId.replace(window.layerIdPrefix, "");                     	
	    } 
	    else {
	    	eaIDFromFeaturedCollection = window.hashFeaturedCollectionToEAID[layerId];
	    	if (((eaIDFromFeaturedCollection != null) && (eaIDFromFeaturedCollection != undefined))) {
	    		eaId = eaIDFromFeaturedCollection;
				var bNationalFeaturedCollection = false;
			    var eaIDinFeatureCollection = window.hashFeaturedCollectionToEAID[layerId];
			    if (((eaIDinFeatureCollection !=null) && (eaIDinFeatureCollection !=undefined))) {
			          if ((window.hashScale[eaIDinFeatureCollection]== 'NATIONAL')){
			          		bNationalFeaturedCollection = true;
			          };
			    }	    		
	    	}
	    }
	    
		lyrTiled = layerInfo.map.getLayer(window.layerIdTiledPrefix + eaId);   
		if (ckSelect.checked) {
	        if(lyrTiled){
	        	if (window.hashRenderer[eaId] == null) {
		       	  	lyrTiled.setVisibility(true);//set tile visible only when user not set the dynamic symbology
		       	}
	      	}	
	    } else {
	        if(lyrTiled){
	       	  lyrTiled.setVisibility(false);
	      	}         
	    }     
	    //end of set visibility for corresponding tiled layers
	    
		if (window.nationalLayerNumber.includes(eaId) || (bNationalFeaturedCollection == true)){//check if it is national layer. If yes, then set warning sign by triggering extent-change event
			jimuUtils.adjustMapExtent(layerInfo.map);   			                            	
        } 
        
        layerInfo.setTopLayerVisible(ckSelect.checked);
      }
      evt.stopPropagation();
    },

    _onPopupMenuClick: function(layerInfo, popupMenuNode, layerTrNode, evt) {
      var rootLayerInfo = layerInfo.getRootLayerInfo();
      var popupMenu = popupMenuNode.popupMenu;
      if(!popupMenu) {
        popupMenu = new PopupMenu({
          //items: layerInfo.popupMenuInfo.menuItems,
          _layerInfo: layerInfo,
          box: this.layerListWidget.domNode.parentNode,
          popupMenuNode: popupMenuNode,
          layerListWidget: this.layerListWidget,
          _config: this.config
        }).placeAt(popupMenuNode);
        popupMenuNode.popupMenu = popupMenu;
        this._storeLayerNodeDijit(rootLayerInfo, popupMenu);
        var handle = this.own(on(popupMenu,
              'onMenuClick',
              lang.hitch(this, this._onPopupMenuItemClick, layerInfo, popupMenu)));
        //this._layerNodeHandles[rootLayerInfo.id].push(handle[0]);
        this._storeLayerNodeEventHandle(rootLayerInfo, handle[0]);

        handle = this.own(popupMenuNode.popupMenu.on('onOpenMenu',
          lang.hitch(this, this._onPopupMenuOpen, layerInfo, popupMenuNode, rootLayerInfo)));
        this._storeLayerNodeEventHandle(rootLayerInfo, handle[0]);
      }

      /*jshint unused: false*/
      this._changeSelectedLayerRow(layerTrNode);
      if (popupMenu && popupMenu.state === 'opened') {
        popupMenu.closeDropMenu();
      } else {
        this._hideCurrentPopupMenu();
        if (popupMenu) {
          this.currentPopupMenu = popupMenu;
          popupMenu.openDropMenu();
        }
      }

      //hidden operation mene if that is opened.
      if (this.operationsDropMenu && this.operationsDropMenu.state === 'opened') {
        this.operationsDropMenu.closeDropMenu();
      }
      evt.stopPropagation();
    },

    _hideCurrentPopupMenu: function() {
      if (this.currentPopupMenu && this.currentPopupMenu.state === 'opened') {
        this.currentPopupMenu.closeDropMenu();
      }
    },

    _onLayerListWidgetPaneClick: function() {
      if (this.operationsDropMenu) {
        this.operationsDropMenu.closeDropMenu();
      }
    },

    _onRowTrClick: function(layerInfo, imageShowLegendDiv, layerTrNode, subNode, evt) {
      this._changeSelectedLayerRow(layerTrNode);
      var fold = this._foldSwitch(layerInfo, imageShowLegendDiv, subNode);
      layerTrNode._expanded = !fold;
      if(evt.ctrlKey || evt.metaKey) {
        if(layerInfo.isRootLayer()) {
          this.foldOrUnfoldAllRootLayers(fold);
        } else {
          this.foldOrUnfoldSameLevelLayers(layerInfo, fold);
        }
      }
    },

    _changeSelectedLayerRow: function(layerTrNode) {
      if (this._currentSelectedLayerRowNode && this._currentSelectedLayerRowNode === layerTrNode) {
        return;
      }
      if (this._currentSelectedLayerRowNode) {
        domClass.remove(this._currentSelectedLayerRowNode, 'jimu-widget-row-selected');
      }
      domClass.add(layerTrNode, 'jimu-widget-row-selected');
      this._currentSelectedLayerRowNode = layerTrNode;
    },

    _onPopupMenuItemClick: function(layerInfo, popupMenu, item, data) {
      var evt = {
          itemKey: item.key,
          extraData: data,
          layerListWidget: this.layerListWidget,
          layerListView: this
        },
        result;

      // window.jimuNls.layerInfosMenu.itemTransparency NlsStrings.value.itemTransparency
      if (item.key === 'transparency') {
        if (domStyle.get(popupMenu.transparencyDiv, 'display') === 'none') {
          popupMenu.showTransNode(layerInfo.getOpacity(), item);
        } else {
          popupMenu.hideTransNode();
        }
      } else if(item.key === 'setVisibilityRange') {
        if (domStyle.get(popupMenu.setVisibilityRangeNode, 'display') === 'none') {
          popupMenu.showSetVisibilityRangeNode(layerInfo, item);
        } else {
          popupMenu.hideSetVisibilityRangeNode();
        }
      } else {
        result = popupMenu.popupMenuInfo.onPopupMenuClick(evt);
        if (result.closeMenu) {
          popupMenu.closeDropMenu();
        }
      }
    },

    /***************************************************
     * methods for control moveUp/moveDown.
     ***************************************************/
    // befor exchange:  id1 -> id2
    // after exchanged: id2 -> id1
    _exchangeLayerTrNode: function(layerInfo1, layerInfo2) {
      var layer1TrNode = query("tr[layerTrNodeId='" + layerInfo1.id + "']", this.layerListTable)[0];
      //var layer1ContentTrNode = query("tr[layerContentTrNodeId='" + layerInfo1.id + "']",
      //                                this.layerListTable)[0];
      var layer2TrNode = query("tr[layerTrNodeId='" + layerInfo2.id + "']", this.layerListTable)[0];
      var layer2ContentTrNode = query("tr[layerContentTrNodeId='" + layerInfo2.id + "']",
        this.layerListTable)[0];
      if(layer1TrNode && layer2TrNode && layer2ContentTrNode) {
        // change layerTr
        this.layerListTable.removeChild(layer2TrNode);
        this.layerListTable.insertBefore(layer2TrNode, layer1TrNode);
        // change LayerContentTr
        this.layerListTable.removeChild(layer2ContentTrNode);
        this.layerListTable.insertBefore(layer2ContentTrNode, layer1TrNode);
      }
    },

    _getMovedSteps: function(layerInfo, upOrDown) {
      // summary:
      //   according to hidden layers to get moved steps.
      var steps = 1;
      var layerInfoIndex;
      var layerInfoArray = this.operLayerInfos.getLayerInfoArray();
      array.forEach(layerInfoArray, function(currentLayerInfo, index) {
        if(layerInfo.id === currentLayerInfo.id) {
          layerInfoIndex = index;
        }
      }, this);
      if(upOrDown === "moveup") {
        while(!layerInfoArray[layerInfoIndex].isFirst) {
          layerInfoIndex--;
          if((this.isLayerHiddenInWidget(layerInfoArray[layerInfoIndex]) ||
                !this.layerFilter.isValidLayerInfo(layerInfoArray[layerInfoIndex])) &&
              !layerInfoArray[layerInfoIndex].isFirst) {
            steps++;
          } else {
            break;
          }
        }
      } else {
        while(!layerInfoArray[layerInfoIndex].isLast) {
          layerInfoIndex++;
          if((this.isLayerHiddenInWidget(layerInfoArray[layerInfoIndex])  ||
                !this.layerFilter.isValidLayerInfo(layerInfoArray[layerInfoIndex])) &&
              !layerInfoArray[layerInfoIndex].isLast) {
            steps++;
          } else {
            break;
          }
        }
      }
      return steps;
    },
 
    moveUpLayer: function(layerInfo) {
      // summary:
      //    move up layer in layer list.
      // description:
      //    call the moveUpLayer method of LayerInfos to change the layer order in map,
      //    and update the data in LayerInfos
      //    then, change layerNodeTr and layerContentTr domNode
      /*
      var steps = this._getMovedSteps(layerInfo, 'moveup');
      this.layerListWidget._denyLayerInfosReorderResponseOneTime = true;
      var beChangedLayerInfo = this.operLayerInfos.moveUpLayer(layerInfo, steps);
      if (beChangedLayerInfo) {
        this._exchangeLayerTrNode(beChangedLayerInfo, layerInfo);
      }
      */
      var steps = this._getMovedSteps(layerInfo, 'moveup');
      this.operLayerInfos.moveUpLayer(layerInfo, steps);
    },

    moveDownLayer: function(layerInfo) {
      // summary:
      //    move down layer in layer list.
      // description:
      //    call the moveDownLayer method of LayerInfos to change the layer order in map,
      //    and update the data in LayerInfos
      //    then, change layerNodeTr and layerContentTr domNode
      /*
      var steps = this._getMovedSteps(layerInfo, 'movedown');
      this.layerListWidget._denyLayerInfosReorderResponseOneTime = true;
      var beChangedLayerInfo = this.operLayerInfos.moveDownLayer(layerInfo, steps);
      if (beChangedLayerInfo) {
        this._exchangeLayerTrNode(layerInfo, beChangedLayerInfo);
      }
      */
      var steps = this._getMovedSteps(layerInfo, 'movedown');
      this.operLayerInfos.moveDownLayer(layerInfo, steps);
    },

    isLayerHiddenInWidget: function(layerInfo) {
      var isHidden = false;
      var currentLayerInfo = layerInfo;
      if(layerInfo &&
         this.config.layerOptions &&
         this.config.layerOptions[layerInfo.id] !== undefined) {
        while(currentLayerInfo) {
          isHidden = isHidden ||  !this.config.layerOptions[currentLayerInfo.id].display;
          if(isHidden) {
            break;
          }
          currentLayerInfo = currentLayerInfo.parentLayerInfo;
        }
      } else {
        // if config has not been configured, default value is 'true'.
        // if config has been configured, but new layer of webmap is ont in config file,
        //   default value is 'true'.
        isHidden = false;
      }
      return isHidden;
    },
        isFirstDisplayedLayerInfo: function(layerInfo) {
      var isFirst;
      var steps;
      var layerInfoIndex;
      var layerInfoArray;
      if(layerInfo.isFirst || !layerInfo.isRootLayer() || layerInfo.isBasemap()) {
        isFirst = true;
      } else {
        steps = this._getMovedSteps(layerInfo, "moveup");
        layerInfoArray = this.operLayerInfos.getLayerInfoArray();
        layerInfoIndex = this.operLayerInfos._getTopLayerInfoIndexById(layerInfo.id);
        if(this.isLayerHiddenInWidget(layerInfoArray[layerInfoIndex - steps]) ||
            !this.layerFilter.isValidLayerInfo(layerInfoArray[layerInfoIndex - steps])) {
          isFirst = true;
        } else {
          isFirst = false;
        }
      }
      return isFirst;
    },

    isLastDisplayedLayerInfo: function(layerInfo) {
      var isLast;
      var steps;
      var layerInfoIndex;
      var layerInfoArray;
      if(layerInfo.isLast || !layerInfo.isRootLayer() || layerInfo.isBasemap()) {
        isLast = true;
      } else {
        steps = this._getMovedSteps(layerInfo, "movedown");
        layerInfoArray = this.operLayerInfos.getLayerInfoArray();
        layerInfoIndex = this.operLayerInfos._getTopLayerInfoIndexById(layerInfo.id);
        if(this.isLayerHiddenInWidget(layerInfoArray[layerInfoIndex + steps])  ||
            !this.layerFilter.isValidLayerInfo(layerInfoArray[layerInfoIndex + steps])) {
          isLast = true;
        } else {
          isLast = false;
        }
      }
      return isLast;
    },
    
    /***************************************************
     * methods for control operation.
     ***************************************************/
    _initOperations: function() {
      this.operationsDropMenu = new DropMenu({
        items:[{
          key: "turnAllLayersOn",
          label: this.nls.turnAllLayersOn
        }, {
          key: "turnAllLayersOff",
          label: this.nls.turnAllLayersOff
        }, {
          key: "separator"
        }, {
          key: "expandAllLayers",
          label: this.nls.expandAllLayers
        }, {
          key: "collapseAlllayers",
          label: this.nls.collapseAlllayers
        }, {
          key: "removeAllLayers",
          label: this.nls.removeAllLayers
        }],
        box: this.layerListWidget.domNode.parentNode
      }).placeAt(this.layerListOperations);

      var operationIconBtnNode = query('div.jimu-dropmenu > div:first-child',
          this.layerListOperations)[0];

      if(operationIconBtnNode) {
        domClass.remove(operationIconBtnNode, ['jimu-icon-btn', 'popup-menu-button']);
        domClass.add(operationIconBtnNode, ['feature-action', 'icon-operation']);
      }

      if(this.operationsDropMenu.btnNode) {
        this.own(on(this.operationsDropMenu.btnNode,
          'click',
          lang.hitch(this, this._onLayerListOperationsClick)));
      }

      this.own(on(this.operationsDropMenu ,
        'onMenuClick',
        lang.hitch(this, this._onOperationsMenuItemClick)));


      this.operationsDropMenuLoading = new LoadingShelter({
        hidden: true
      }).placeAt(this.operationsDropMenu.domNode);
      this.own(on(this.layerListOperations,
        'keydown',
        lang.hitch(this, this._onLayerListOperationsKey)));

      this.own(on(this.operationsDropMenu,
        'onOpenMenu',
        lang.hitch(this, this._onOperationsDropMenuOpen)));
    },

    _onLayerListOperationsClick: function() {
      this._hideCurrentPopupMenu();
    },

    _onOperationsMenuItemClick: function(item) {
      switch (item.key) {
        case 'turnAllLayersOn':
          this.turnAllRootLayers(true);
          return;
        case 'turnAllLayersOff':
          this.turnAllRootLayers(false);
          return;
        case 'expandAllLayers':
          this.foldOrUnfoldAllLayers(false);
          return;
        case 'collapseAlllayers':
          this.foldOrUnfoldAllLayers(true);
          return;
      case 'removeAllLayers':
        document.getElementById("butRemoveAllLayers").click();        
        return;
        default:
          return;
      }
    },



    
    turnAllRootLayers: function(isOnOrOff) {
      var layerInfoArray = this.operLayerInfos.getLayerInfoArray();
      array.forEach(layerInfoArray, function(layerInfo) {
        if (!this.isLayerHiddenInWidget(layerInfo)) {
            layerInfo.setTopLayerVisible(isOnOrOff);
			eaId = "";
			layerId = layerInfo.id;
			if (layerId.indexOf(window.layerIdPrefix) >= 0) {
			    eaId = layerId.replace(window.layerIdPrefix, "");                     	
			} 
			
			window.allLayersTurnedOn[eaId] = isOnOrOff;
			lyrTiled = layerInfo.map.getLayer(window.layerIdTiledPrefix + eaId);   
			if (isOnOrOff) {

			    if(lyrTiled){
			    	if (window.hashRenderer[eaId] == null) {
			       	  	lyrTiled.setVisibility(true);//set tile visible only when user not set the dynamic symbology
			       	}
			  	}	
			} else {
			    if(lyrTiled){
			   	  lyrTiled.setVisibility(false);
			  	}         
			}           
        }
      }, this);
      jimuUtils.adjustMapExtent(this.operLayerInfos.map);
    },

    turnAllSameLevelLayers: function(layerInfo, isOnOrOff) {
      var layerOptions = {};
      var rootLayerInfo = layerInfo.getRootLayerInfo();
      rootLayerInfo.traversal(lang.hitch(this, function(subLayerInfo) {
        if(subLayerInfo.parentLayerInfo &&
           subLayerInfo.parentLayerInfo.id === layerInfo.parentLayerInfo.id &&
           !this.isLayerHiddenInWidget(subLayerInfo)) {
          layerOptions[subLayerInfo.id] = {visible: isOnOrOff};
        } else {
          layerOptions[subLayerInfo.id] = {visible: subLayerInfo.isVisible()};
        }
      }));
      rootLayerInfo.resetLayerObjectVisibility(layerOptions);
    },

    foldOrUnfoldAllRootLayers: function(isFold) {
      var layerInfoArray = array.filter(this.operLayerInfos.getLayerInfoArray(),
                                        function(layerInfo) {
        return !this.isLayerHiddenInWidget(layerInfo);
      }, this);
      this._foldOrUnfoldLayers(layerInfoArray, isFold);
    },

    foldOrUnfoldSameLevelLayers: function(layerInfo, isFold) {
      var layerInfoArray;
      if(layerInfo.parentLayerInfo) {
        layerInfoArray = array.filter(layerInfo.parentLayerInfo.getSubLayers(),
                                          function(layerInfo) {
          return !this.isLayerHiddenInWidget(layerInfo);
        }, this);
        this._foldOrUnfoldLayers(layerInfoArray, isFold);
      }
    },

    foldOrUnfoldAllLayers: function(isFold) {
      var layerInfoArray = [];
      var rootLayerInfoArray = [];

      this.operationsDropMenuLoading.show();
      this.operLayerInfos.traversal(lang.hitch(this, function(layerInfo) {
        if(!this.isLayerHiddenInWidget(layerInfo)) {
          if(layerInfo.isRootLayer()) {
            rootLayerInfoArray.push(layerInfo);
          } else {
            layerInfoArray.push(layerInfo);
          }
        }
      }));

      layerInfoArray = rootLayerInfoArray.concat(layerInfoArray);

      var i = 0;
      var layerInfoArrayLength = layerInfoArray.length;
      var steps = 50;
      setTimeout(lang.hitch(this, function() {
        if(i < layerInfoArrayLength) {
          var candidateLayerInfoArray = layerInfoArray.slice(i, i + steps);
          this._foldOrUnfoldLayers(candidateLayerInfoArray, isFold);
          i = i + steps;
          setTimeout(lang.hitch(this, arguments.callee), 60); // jshint ignore:line
        } else {
          this.operationsDropMenuLoading.hide();
        }
      }), 60);
    },
    /***************************************************
     * methods for 508 accessibility.
     ***************************************************/
    _supports508Accessibility: function() {
      var eventHandler;
      if(this._lastLayerNode) {
        /*
        eventHandler = on(this._lastLayerNode, 'keydown', lang.hitch(this, '_onLastLayerNodeKey'));
        this._eventHandlers.push(eventHandler);
        eventHandler = on(this.supports508Node, 'keydown', lang.hitch(this, '_onLastLayerNodeKey'));
        this._eventHandlers.push(eventHandler);
        */
        eventHandler = on(this.layerListWidget.layerFilter.searchButton,
                          'keydown',
                          lang.hitch(this, '_onSearchButtonKey'));
        this._eventHandlers.push(eventHandler);
        eventHandler = on(this.supports508Node, 'focus', lang.hitch(this, '_onLastNodeFocus'));
        this._eventHandlers.push(eventHandler);
        jimuUtils.initLastFocusNode(this.layerListWidget.domNode, this.supports508Node);
      } else {
        jimuUtils.initLastFocusNode(this.layerListWidget.domNode, this.layerListOperations);
        eventHandler = on(this.supports508Node, 'focus', lang.hitch(this, '_onLastNodeFocus'));
        this._eventHandlers.push(eventHandler);
        //this.domNode.removeChild(this.supports508Node);
      }
    },


    _onSearchButtonKey: function(e) {
      if(e.keyCode === keys.TAB && e.shiftKey) {
        e.stopPropagation();
        e.preventDefault();
        //focusUtil.focus(this._lastLayerNode);
        this._backToLastNodeFlag = true;
      }
    },

    _getLastExpandedLayerNode: function() {
      var lastExpandedLayerNode = this._lastLayerNode;
      //var layerTrNode = this._lastLayerNode;
      var parentLayerTrNode = null;
      var layerInfo = this._lastLayerInfo;
      while(layerInfo) {
        var parentLayerInfo = layerInfo.parentLayerInfo;
        if(!parentLayerInfo) {
          lastExpandedLayerNode = this._layerDomNodeStorage[layerInfo.getObjectId()].layerTrNode;
          break;
        } else {
          parentLayerTrNode = this._layerDomNodeStorage[parentLayerInfo.getObjectId()].layerTrNode;
          if(parentLayerTrNode && parentLayerTrNode._expanded) {
            lastExpandedLayerNode = this._layerDomNodeStorage[layerInfo.getObjectId()].layerTrNode;
            break;
          }
        }
        layerInfo = parentLayerInfo;
      }
      return lastExpandedLayerNode;
    },

    _onLastNodeFocus: function() {
      //e.stopPropagation();
      //e.preventDefault();
      if(this._backToLastNodeFlag) {
        var lastExpandedLayerNode = this._getLastExpandedLayerNode();
        if(lastExpandedLayerNode) {
          focusUtil.focus(lastExpandedLayerNode);
        }
        this._backToLastNodeFlag = false;
      } else {
        focusUtil.focus(this.layerListWidget.layerFilter.searchButton);
      }
    },

    _onLastLayerNodeKey: function(e) {
      if(e.keyCode === keys.TAB && !e.shiftKey) {
        e.stopPropagation();
        e.preventDefault();
        focusUtil.focus(this.layerListWidget.layerFilter.searchButton);
      }
    },

    _onLayerNodeKey: function(imageShowLegendDiv, popupMenuNode, e) {
      if(e.keyCode === keys.ENTER) {
        e.stopPropagation();
        e.preventDefault();
        if(html.getStyle(imageShowLegendDiv, 'display') === 'none') {
          focusUtil.focus(popupMenuNode);
        } else {
          focusUtil.focus(imageShowLegendDiv);
        }
      }
    },

    _onImageShowLegendKey: function(layerInfo, imageShowLegendDiv, layerTrNode, subNode, popupMenuNode, e) {
      // avoid be impacted if the current layer is lastFocueNode.
      if(e.keyCode === keys.TAB) {
        e.stopPropagation();
      }
      if(e.keyCode === keys.TAB && e.shiftKey) {
        e.stopPropagation();
        e.preventDefault();
        focusUtil.focus(popupMenuNode);
      } else if(e.keyCode === keys.ESCAPE) {
        e.stopPropagation();
        e.preventDefault();
        focusUtil.focus(layerTrNode);
      } else if(e.keyCode === keys.ENTER) {
        e.stopPropagation();
        e.preventDefault();
        this._onRowTrClick(layerInfo, imageShowLegendDiv, layerTrNode, subNode, e);
      }
    },

    _onCkSelectDivKey: function(layerInfo, ckSelect, layerTrNode, e) {
      // avoid be impacted if the current layer is lastFocueNode.
      if(e.keyCode === keys.TAB) {
        e.stopPropagation();
      }
      if(e.keyCode === keys.ESCAPE) {
        e.stopPropagation();
        e.preventDefault();
        focusUtil.focus(layerTrNode);
      } else if(e.keyCode === keys.SPACE || e.keyCode === keys.ENTER) {
        e.stopPropagation();
        e.preventDefault();
        if(ckSelect.checked) {
          ckSelect.uncheck(true);
        } else {
          ckSelect.check(true);
        }
        this._onCkSelectNodeClick(layerInfo, ckSelect, e);
      }
    },

    _onPopupMenuNodeKey: function(layerInfo, popupMenuNode, layerTrNode, imageShowLegendDiv, e) {
      // avoid be impacted if the current layer is lastFocueNode.
      if(e.keyCode === keys.TAB) {
        e.stopPropagation();
      }
      if(e.keyCode === keys.TAB && !e.shiftKey) {
        e.stopPropagation();
        e.preventDefault();
        focusUtil.focus(imageShowLegendDiv);
      } else if(e.keyCode === keys.ESCAPE) {
        e.stopPropagation();
        e.preventDefault();
        focusUtil.focus(layerTrNode);
      } else if(e.keyCode === keys.ENTER || e.keyCode === keys.DOWN_ARROW || e.keyCode === keys.UP_ARROW) {
        e.stopPropagation();
        e.preventDefault();
        this._onPopupMenuClick(layerInfo, popupMenuNode, layerTrNode, e);
      }
    },

    _onPopupMenuOpen: function(layerInfo, popupMenuNode, rootLayerInfo) {
      //jshint unused:false
      var menuItems = query('.menu-item', popupMenuNode.popupMenu.dropMenuNode);
      menuItems = menuItems.filter(function(menuItem) {
        if(html.hasClass(menuItem, 'menu-item-hidden')) {
          return false;
        } else {
          return true;
        }
      });
      var firstItem = menuItems[0], lastItem = menuItems[menuItems.length - 1];
      menuItems.forEach(function(menuItem, index) {
        var isFirstItem = false, isLastItem = false;
        var previousItem = menuItems[index - 1], nextItem = menuItems[index + 1];
        if(index === 0) {
          focusUtil.focus(menuItem);
          isFirstItem = true;
        } else if(index === menuItems.length - 1) {
          isLastItem = true;
        }

        if(!menuItem.hasBeenOpened) {
          var handle = this.own(on(menuItem, 'keydown', lang.hitch(this, this._onPopupMenuItemKey,
            popupMenuNode, previousItem, nextItem, firstItem, lastItem, isFirstItem, isLastItem)));
          this._storeLayerNodeEventHandle(rootLayerInfo, handle[0]);
          menuItem.hasBeenOpened = true;
        }
      }, this);
    },

    _onPopupMenuItemKey: function(popupMenuNode,
      previousItem, nextItem, firstItem, lastItem, isFirstItem, isLastItem, e) {
      //jshint unused:false
      /*if(e.keyCode === keys.TAB && !e.shiftKey) {
        e.stopPropagation();
        if(isLastItem) {
          e.preventDefault();
        }
        this._enableNavMode(e);
      } else if(e.keyCode === keys.TAB && e.shiftKey) {
        e.stopPropagation();
        if(isFirstItem) {
          e.preventDefault();
        }
        this._enableNavMode(e);
      } else */
      if(e.keyCode === keys.DOWN_ARROW) {
        e.stopPropagation();
        e.preventDefault();
        if(nextItem) {
          focusUtil.focus(nextItem);
        }
      } else if(e.keyCode === keys.UP_ARROW) {
        e.stopPropagation();
        e.preventDefault();
        if(previousItem) {
          focusUtil.focus(previousItem);
        }
      } else if(e.keyCode === keys.HOME) {
        e.stopPropagation();
        e.preventDefault();
        if(firstItem) {
          focusUtil.focus(firstItem);
        }
      } else if(e.keyCode === keys.END) {
        e.stopPropagation();
        e.preventDefault();
        if(lastItem) {
          focusUtil.focus(lastItem);
        }
      } else if(e.keyCode === keys.ESCAPE || e.keyCode === keys.TAB) {
        e.stopPropagation();
        e.preventDefault();
        focusUtil.focus(popupMenuNode);
        popupMenuNode.popupMenu.closeDropMenu();
      }
    },

    _enableNavMode:function(evt) {
      if(evt.keyCode === keys.TAB && !jimuUtils.isInNavMode()){
        html.addClass(document.body, 'jimu-nav-mode');
      }
    },

    _onLayerListOperationsKey: function(e) {
      if(e.keyCode === keys.ENTER) {
        /*
        if(this.operationsDropMenu.state === "opened") {
          html.setAttr(this.layerListOperations, 'aria-expanded', 'true');
        } else {
          html.setAttr(this.layerListOperations, 'aria-expanded', 'false');
        }
        */
        this.operationsDropMenu._onBtnClick(e);
      }
    },

    _onOperationsDropMenuOpen: function() {
      var menuItems = query('.menu-item', this.operationsDropMenu.domNode);
      menuItems = menuItems.filter(function(menuItem) {
        if(html.hasClass(menuItem, 'menu-item-hidden')) {
          return false;
        } else {
          return true;
        }
      });
      var firstItem = menuItems[0], lastItem = menuItems[menuItems.length - 1];
      menuItems.forEach(function(menuItem, index) {
        var isFirstItem = false, isLastItem = false;
        var previousItem = menuItems[index - 1], nextItem = menuItems[index + 1];
        if(index === 0) {
          focusUtil.focus(menuItem);
          isFirstItem = true;
        } else if(index === menuItems.length - 1) {
          isLastItem = true;
        }

        if(!menuItem.hasBeenOpened) {
          this.own(on(menuItem, 'keydown',
            lang.hitch(this, this._onLayerListOperationsMenuItemKey,
              previousItem, nextItem, firstItem, lastItem, isFirstItem, isLastItem)));
          menuItem.hasBeenOpened = true;
        }
      }, this);
    },

    _onLayerListOperationsMenuItemKey: function(previousItem,
      nextItem, firstItem, lastItem, isFirstItem, isLastItem, e) {
      //jshint unused:false
      /*
      if(e.keyCode === keys.TAB && !e.shiftKey) {
        e.stopPropagation();
        if(isLastItem) {
          e.preventDefault();
        }
        this._enableNavMode(e);
      } else if(e.keyCode === keys.TAB && e.shiftKey) {
        e.stopPropagation();
        if(isFirstItem) {
          e.preventDefault();
        }
        this._enableNavMode(e);
      } else */
      if(e.keyCode === keys.DOWN_ARROW) {
        e.stopPropagation();
        e.preventDefault();
        if(nextItem) {
          focusUtil.focus(nextItem);
        }/*else {
          focusUtil.focus(firstItem);
        }*/
      } else if(e.keyCode === keys.UP_ARROW) {
        e.stopPropagation();
        e.preventDefault();
        if(previousItem) {
          focusUtil.focus(previousItem);
        }/*else {
          focusUtil.focus(lastItem);
        }*/
      } else if(e.keyCode === keys.HOME) {
        e.stopPropagation();
        e.preventDefault();
        if(firstItem) {
          focusUtil.focus(firstItem);
        }
      } else if(e.keyCode === keys.END) {
        e.stopPropagation();
        e.preventDefault();
        if(lastItem) {
          focusUtil.focus(lastItem);
        }
      } else if(e.keyCode === keys.ESCAPE || e.keyCode === keys.TAB) {
        e.stopPropagation();
        e.preventDefault();
        focusUtil.focus(this.layerListOperations);
        this.operationsDropMenu.closeDropMenu();
      }
    }
  });
});
