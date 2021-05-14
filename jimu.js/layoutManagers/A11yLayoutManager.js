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
  'dojo/_base/lang',
  'dojo/on',
  'dojo/_base/html',
  'dojo/keys',
  'dojo/query',
  'esri/lang',
  'dijit/Tooltip',
  'dojo/dom-geometry',
  'jimu/utils'
],
  function (lang, on, html, keys, query, esriLang, Tooltip, domGeometry, jimuUtils) {
    var mo = {};
    mo.TabindexForSplash = 1;
    mo.TabindexForSkipLinks = 101;
    mo.TabindexRangeForController = 10000;
    mo.TabindexRangeForWidget = 200;

    mo._setTabindex = function (appConfig, isGridLayout){ //absolute layout
      var rtoWindowElements = [];
      var rtoMapElements = [];

      var isSplashExist = false;
      var attributeTableBrowser = null;
      if(isGridLayout){
        appConfig.visitElement(function(e, info){
          //the pool widgets tabindex will be handled by controller.
          if(!info.isOnScreen){
            return;
          }
          var pos = e.position || e.panel && e.panel.position;
          if(!pos || Array.isArray(e.widgets)){
            return;
          }
          //handel all visible widgets
          if(e.gid === 'widgetOnScreen' && e.visible){
            if(pos.relativeTo === 'browser'){//like AT
              rtoWindowElements.push(e);
              if(e.name === 'Splash'){
                isSplashExist = true;
              }
            }else{
              rtoMapElements.push(e);
            }
          }
        });
      }else{
        appConfig.visitElement(function(e, info){
          if(!info.isOnScreen){
            return;
          }
          var pos = e.position || e.panel && e.panel.position;
          if(!pos){
            return;
          }
          //handel all visible widgets and side panel(visible is false)
          if((e.gid === 'widgetOnScreen' && e.visible) || (!e.visible && e.panel)){
            if(pos.relativeTo === 'browser'){
              if(e.name === 'AttributeTable'){
                attributeTableBrowser = e;
              }else{
                rtoWindowElements.push(e); //excluding AT widget
              }
              if(e.name === 'Splash'){
                isSplashExist = true;
              }
            }else{
              rtoMapElements.push(e);
            }
          }
        });
      }

      var layoutBox = domGeometry.getMarginBox(this.layoutId);
      var mapBox = domGeometry.getMarginBox(this.mapId);

      rtoWindowElements = rtoWindowElements.sort(lang.hitch(this, sortElements, layoutBox));
      rtoMapElements = rtoMapElements.sort(lang.hitch(this, sortElements, mapBox));

      //add map to array
      if(isGridLayout){
        rtoWindowElements.unshift(this.map);
      }else{
        rtoWindowElements.push(this.map);
      }
      //if AT widget realted to browser exists, add it to rtoMapElements as last item
      if(attributeTableBrowser){
        rtoMapElements.push(attributeTableBrowser);
      }

      //Set tabindex as following steps:
      var tabIndex = mo.TabindexForSplash;
      //Step 1. set tabindex=1 for splash widget or skip container
      if(isSplashExist){
        rtoWindowElements.every(function(e){
          if(e.name === 'Splash'){
            e.tabIndex = tabIndex;
            return false;
          }
          return true;
        });
      }else{
        var skipContainer = query('#skipContainer')[0];
        html.setAttr(skipContainer , 'tabindex', tabIndex + '');
        this.own(on(skipContainer, 'focus', lang.hitch(this, function() {
          jimuUtils.focusOnFirstSkipLink();
        })));
      }

      //Step 2. set tabindex=101 for skip links
      this._initSkipLinks(isGridLayout, rtoWindowElements, attributeTableBrowser);

      //Step 3. set tabindex from 201 for rtoWindowElements
      tabIndex += mo.TabindexRangeForWidget;
      if(isGridLayout){
        rtoWindowElements.forEach(function(e){
          if(e.name !== 'Splash'){
            e.tabIndex = tabIndex;
            if(e.isController){
              tabIndex += mo.TabindexRangeForController;
            }else{
              tabIndex += mo.TabindexRangeForWidget;
            }
          }
        });
        //Set tabindex for all panels
        tabIndex = this._initGridLayoutPanels(tabIndex); //, rtoWindowElements);
        //Step 4. set tabindex for Map
        this._initGridMapEvents(tabIndex);
      }else{
        rtoWindowElements.forEach(function(e){
          if(e.name !== 'Splash'){
            if(e.inPanel){ //inPanel widget doesn't need this attr, like side panel in JewelryBox theme
              e.tabIndexJimu = tabIndex;
            }else if(e.id === 'map'){
              e.container.tabIndex = tabIndex;
            }else{
              e.tabIndex = tabIndex;
            }
            if(e.isController){
              tabIndex += mo.TabindexRangeForController;
            }else{
              tabIndex += mo.TabindexRangeForWidget;
            }
          }
        });
        //Step 4. set tabindex for Map
        this._initAbsoluteMapEvents();
      }

      //set trap node for resolving the final links which tabindex equals 0.
      var trapLinkNodes = query('.trapLinkNode');
      var firstTrapNode = trapLinkNodes[0];
      this.lastTrapNode = trapLinkNodes[1];
      //add tips for last trap node
      var tabAwayStr = esriLang.substitute({value: window.jimuNls.skips.skips}, window.jimuNls.skips.tabAway);
      html.setAttr(this.lastTrapNode, 'aria-label', tabAwayStr);
      jimuUtils.addTooltipByDomNode(Tooltip, this.lastTrapNode, tabAwayStr);

      this.own(on(firstTrapNode, 'focus', lang.hitch(this, function(evt) {
        var isSpalsh = jimuUtils.tryToFocusSplashWidget(evt);
        if(!isSpalsh){
          this.lastTrapNode.focus();
        }
      })));

      this.own(on(this.lastTrapNode, 'keydown', lang.hitch(this, function(evt) {
        if(evt.shiftKey && evt.keyCode === keys.TAB){
          evt.preventDefault();
          jimuUtils.focusOnFirstSkipLink(); //go to skip-links when shift+tab
        }
      })));

      //Step 5. set tabindex for rtoMapElements by position
      tabIndex += 1000;
      rtoMapElements.forEach(function(e){
        if(e.inPanel){ //inPanel widgets only need tabindex to init their widget-icons
          e.tabIndexJimu = tabIndex;
        }else{
          e.tabIndex = tabIndex;
        }

        if(e.isController){
          tabIndex += mo.TabindexRangeForController;
        }else{
          tabIndex += mo.TabindexRangeForWidget;
        }
      });

      function changePosition(pos, box){
        var widgetBox = {w: 100, h: 100};// hard code the widget box here for simple.

        if(!pos){
          return;
        }
        if(typeof pos.bottom !== 'undefined'){
          pos.top = box.h - pos.bottom - widgetBox.h;
          delete pos.bottom;
        }
        if(typeof pos.right !== 'undefined'){
          pos.left = box.w - pos.right - widgetBox.w;
          delete pos.right;
        }
      }

      //sort nodes by position, compare top and then left.
      function sortElements(box, e1, e2){
        var pos1 = lang.clone(e1.position || e1.panel && e1.panel.position);
        var pos2 = lang.clone(e2.position || e2.panel && e2.panel.position);

        //change position to x, y
        changePosition(pos1, box);
        changePosition(pos2, box);

        if(pos1.top === pos2.top){
          return pos1.left - pos2.left;
        }else{
          return pos1.top - pos2.top;
        }
      }
    };

    mo._initGridLayoutPanels = function(tabIndex){
      //make layoutPanels support enter-key and esc-key events.
      var layoutPanels = query('.lm_item.lm_stack', this.layoutContainer);
      //for nvda + ff
      var panelHandler = layoutPanels.on('focus', lang.hitch(this, function(evt) {
        panelHandler.remove();
        var isSpalsh = jimuUtils.tryToFocusSplashWidget(evt);
        if(!isSpalsh){
          jimuUtils.focusOnFirstSkipLink();
        }
      }));
      for(var i = 0; i <= layoutPanels.length - 1; i ++){
        var panel = layoutPanels[i];
        panel.tabIndex = tabIndex - 1;
        // html.setAttr(panel, 'aria-label', 'panel box');
        this.own(on(panel, 'keydown', lang.hitch(this, function(panel, evt) {
          if(html.hasClass(evt.target, 'lm_stack')){
            var widgetDom;
            if(evt.keyCode === keys.ENTER){
              widgetDom = query('.jimu-widget', panel)[0];
              if(widgetDom){
                if(html.hasClass(widgetDom.parentNode, 'map')){
                  this.map.container.focus();
                }else{
                  jimuUtils.focusFirstFocusNode(widgetDom);
                }
              }
            }else if(evt.keyCode === keys.TAB){
              if(!evt.shiftKey && !panel.nextSibling && !panel.parentNode.nextSibling){
                //stop cursor focusing on the widget which has bigger tabindex in map container.
                evt.preventDefault();
                //focus on last virtual DOM which tabindex=0 from last panel.
                this.lastTrapNode.focus();
              }
            }
          }else if(evt.keyCode === keys.ESCAPE){
            panel.focus();
          }
        }, panel)));
      }
      return tabIndex;
    };

    mo._initMapAttrs = function(tabIndex){
      if(tabIndex){
        html.setAttr(this.map.container, 'tabindex', tabIndex);
      }
      html.setAttr(this.map.container, 'aria-label', window.jimuNls.common.mapArea);
      jimuUtils.addTooltipByDomNode(Tooltip, this.map.container, window.jimuNls.common.mapArea);
    };

    //map supports key-events
    mo._initGridMapEvents = function(tabIndex){
      this._initMapAttrs(tabIndex);

      this.own(on(this.map.container, 'keydown', lang.hitch(this, function(evt) {
        if(html.getAttr(evt.target, 'id') === 'map'){
          if(evt.shiftKey && evt.keyCode === keys.TAB){
            evt.preventDefault();
          }
        }
        //for widgets that related to map
        // else{
        //   evt.stopPropagation(); //remove it for fixing #16554
        // }
      })));

      this.own(on(this.map.container, 'focus', lang.hitch(this, function(evt) {
        if(jimuUtils.isInNavMode() && html.getAttr(evt.target, 'id') === 'map'){
          var myTarget = document.getElementById("map_container");
          myTarget.addEventListener("mouseover", function(){});
          //simulate a hover event
          myTarget.simulateEvent = new MouseEvent('mouseover', {
            'view': window,
            'bubbles': true,
            'cancelable': true
          });
          this.map.isKeyboardNavigationOrigin = this.map.isKeyboardNavigation;
          var isTrue = myTarget.dispatchEvent(myTarget.simulateEvent);
          if(isTrue){
            this.map.enableKeyboardNavigation();
          }
        }
      })));

      this.own(on(this.map.container, 'blur', lang.hitch(this, function(evt) {
        if(jimuUtils.isInNavMode() && html.getAttr(evt.target, 'id') === 'map'){
          var myTarget = document.getElementById('map_container');
          myTarget.removeEventListener("mouseover", function(){});
          //reset to original state
          if(!this.map.isKeyboardNavigationOrigin){
            this.map.disableKeyboardNavigation();
          }
        }
      })));
    };

    mo._initAbsoluteMapEvents = function(){
      this._initMapAttrs();

      //allow map's pan-action with arrow and support cancel-event
      this.own(on(this.map.container, 'keydown', lang.hitch(this, function(evt) {
        if(html.getAttr(evt.target, 'id') === 'map' && evt.keyCode === keys.ESCAPE){
          jimuUtils.trapToNextFocusContainer(this.map.container);
        }
      })));

      window.isMoveFocusWhenInit = true;
      this.own(on(this.map.container, 'focus', lang.hitch(this, function(evt) {
        if(jimuUtils.isInNavMode() && html.getAttr(evt.target, 'id') === 'map'){
          if(this.widgetManager._resetFirstFocusNode()){
            return;
          }
          var myTarget = document.getElementById("map_container");
          myTarget.addEventListener("mouseover", function(){});
          //simulate a hover event
          myTarget.simulateEvent = new MouseEvent('mouseover', {
            'view': window,
            'bubbles': true,
            'cancelable': true
          });
          this.map.isKeyboardNavigationOrigin = this.map.isKeyboardNavigation;
          var isTrue = myTarget.dispatchEvent(myTarget.simulateEvent);
          if(isTrue){
            this.map.enableKeyboardNavigation();
          }
        }
      })));

      this.own(on(this.map.container, 'blur', lang.hitch(this, function(evt) {
        if(jimuUtils.isInNavMode() && html.getAttr(evt.target, 'id') === 'map'){
          if(this.widgetManager._resetFirstFocusNode()){//for ff+nvda, it triggers keydown event for two tabs.
            return;
          }
          var myTarget = document.getElementById('map_container');
          myTarget.removeEventListener("mouseover", function(){});
          // this.map.disableKeyboardNavigation();
          //reset to original state
          if(!this.map.isKeyboardNavigationOrigin){
            this.map.disableKeyboardNavigation();
          }
        }
      })));
    };

    //create skipping links
    mo._initSkipLinks = function (isGridLayout, rtoWindowElements, attributeTableBrowser){
      var tabindex = mo.TabindexForSkipLinks;
      var skipNls = window.jimuNls.skips;

      var links = '';
      var linksContainer = query('#skipContainer')[0];
      html.setAttr(linksContainer, 'aria-label', skipNls.skips);
      rtoWindowElements.forEach(function(e){
        if(e.name !== 'Splash'){
          var linkName;
          if(e.id === 'map'){ //skip to map
            linkName = skipNls.map;
          }else if(e.panel && e.widgets){//skip to panel
            if(e.widgets.length === 0){
              return;
            }else if(e.isOnScreen){ //side panel
              linkName = skipNls.sidePanel;
            }else{ //group name
              linkName = e.label;
            }
          }else if(e.inPanel){//excluding inPanel widget configured on side panel
            return;
          }else{ //skip to widget
            linkName = esriLang.substitute({value: e.label}, skipNls.skipTo);
          }
          links += '<li><a role="link" id="skip_' + e.id + '" aria-hidden="true" tabindex="' + tabindex + '">' +
          linkName + '</a></li>';
        }
      });
      if(attributeTableBrowser){
        var _linkName = esriLang.substitute({value: attributeTableBrowser.label}, skipNls.skipTo);
        links += '<li><a role="link" id="skip_' + attributeTableBrowser.id +
          '" aria-hidden="true" tabindex="' + tabindex + '">' +
          _linkName + '</a></li>';
      }
      linksContainer.innerHTML = '<ul>' + links + '</ul>';

      //event
      var linkNodes = query('a', linksContainer);
      this.own(on(linkNodes, 'focus', lang.hitch(this, function(evt) {
        if(this.widgetManager._resetFirstFocusNode()){
          return;
        }
        html.setAttr(evt.target, 'aria-hidden', 'false');
      })));
      this.own(on(linkNodes, 'blur', lang.hitch(this, function(evt) {
        html.setAttr(evt.target, 'aria-hidden', 'true');
      })));
      this.own(on(linkNodes, 'keydown', lang.hitch(this, function(evt) {
        if(evt.keyCode === keys.ENTER){
          var linkId = evt.target.id.split('skip_')[1];
          var container = query('#' + linkId)[0];
          if(!container){
            container = query('#' + linkId + '_panel')[0];
          }
          container.focus();
          return;
        }

        var focusNode, layoutPanels;
        if(isGridLayout){
          layoutPanels = query('.lm_item.lm_stack', this.layoutContainer);
        }
        //stop nvda focusing its own first node from toolbar ???
        if(!evt.target.parentNode.previousSibling && evt.shiftKey && evt.keyCode === keys.TAB){
          evt.preventDefault();
          //focus on previous node, this behavior will stop nvda focusing its own first node from toolbar.
          if(isGridLayout){
            focusNode = layoutPanels[layoutPanels.length - 1]; //last panel
          }else{
            var newFrameNodesArray = jimuUtils.getFrameNodesByAsc();
            focusNode = newFrameNodesArray[newFrameNodesArray.length - 1];//the section with max tabindex
          }
        }else if(evt.keyCode === keys.ESCAPE){
          focusNode = jimuUtils.trapToNextFocusContainer(linksContainer);
          if(isGridLayout && !focusNode){ //no section configurated in dashboard theme
            focusNode = layoutPanels[0]; //first panel
          }
        }
        if(focusNode){
          focusNode.focus();
        }
      })));
    };

    return mo;
  });