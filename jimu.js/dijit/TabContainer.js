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

define(['dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/_base/html',
  'dojo/on',
  'dojo/keys',
  'dojo/Evented',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  './ViewStack',
  '../utils'
],
function(declare, lang, array, html, on, keys, Evented, _WidgetBase, _TemplatedMixin,
  ViewStack, utils){
  return declare([_WidgetBase, _TemplatedMixin, Evented], {
    // summary:
    //    a tab dijit
    // description:
    //    constructor options:
    /*======
      {
        tabs: [{
          title: String
          content: DomNode|dijit
        }],
        selected: String
        // summary:
        //    the default selected tab title
      }
    =====*/

    'baseClass': 'jimu-tab',
    declaredClass: 'jimu.dijit.TabContainer',

    templateString: '<div>' +
      '<div class="control" data-dojo-attach-point="controlNode"></div>' +
      '<div class="jimu-container" data-dojo-attach-point="containerNode"></div>' +
      '</div>',

    postCreate: function(){
      this.inherited(arguments);
      if(this.tabs.length === 0){
        return;
      }
      this.controlNodes = [];
      this.viewStack = new ViewStack(null, this.containerNode);
      this.own(on(this.containerNode, 'keydown', lang.hitch(this, function(evt){
        if(evt.keyCode === keys.ESCAPE){
          evt.stopPropagation();
          this._currentCtrlNode.focus();
        }
      })));

      var width = 1 / this.tabs.length * 100;
      if(this.isNested){
        html.addClass(this.domNode, 'nested');
      }
      array.forEach(this.tabs, function(tabConfig){
        this._createTab(tabConfig, width);
      }, this);

      this.own(on(this.controlNode, 'keydown', lang.hitch(this, function(evt){
        var currentMenuItem = evt.target;
        var nextItem;
        if(evt.keyCode === keys.RIGHT_ARROW){
          nextItem = currentMenuItem.nextElementSibling ?
            currentMenuItem.nextElementSibling : this.controlNodes[0];
        }else if(evt.keyCode === keys.LEFT_ARROW){
          nextItem = currentMenuItem.previousElementSibling ?
            currentMenuItem.previousElementSibling : this.controlNodes[this.controlNodes.length - 1];
        }else if(evt.keyCode === keys.HOME){
          nextItem = this.controlNodes[0];
        }else if(evt.keyCode === keys.END){
          nextItem = this.controlNodes[this.controlNodes.length - 1];
        }
        if(nextItem){
          currentMenuItem = nextItem;
          nextItem.focus();
        }
      })));
    },

    startup: function() {
      // this.inherited(arguments);
      if(this.selected){
        this.selectTab(this.selected);
      }else if(this.tabs.length > 0){
        this.selectTab(this.tabs[0].title);
      }
      utils.setVerticalCenter(this.domNode);
    },

    _createTab: function(tabConfig, width){
      var ctrlNode;
      ctrlNode = html.create('div', {
        innerHTML: utils.sanitizeHTML(tabConfig.title),
        'class': 'tab jimu-vcenter-text',
        style: {
          width: this.isNested? 'auto': width + '%'
        },
        label: tabConfig.title
      }, this.controlNode);
      if(tabConfig.content.domNode){
        this.viewStack.viewType = 'dijit';
      }else{
        this.viewStack.viewType = 'dom';
      }
      tabConfig.content.label = tabConfig.title;
      this.viewStack.addView(tabConfig.content);

      this.own(on(ctrlNode, 'click', lang.hitch(this, function(evt){
        this.onSelect(tabConfig.title, evt);
      })));
      this.own(on(ctrlNode, 'keydown', lang.hitch(this, function(evt){
        if(evt.keyCode === keys.ENTER || evt.keyCode === keys.SPACE){
          this.onSelect(tabConfig.title, evt);
        }
      })));

      ctrlNode.label = tabConfig.title;
      this.controlNodes.push(ctrlNode);
    },

    onSelect: function(title, evt){
      var ctrNode = evt.target;
      if(html.hasClass(ctrNode, 'jimu-state-selected')){
        return;
      }
      this.selectTab(title, evt);
    },

    selectTab: function(title){
      this._selectControl(title);
      this.viewStack.switchView(title);
      this.emit('tabChanged', title);
    },

    _selectControl: function(title){
      array.forEach(this.controlNodes, function(ctrlNode) {
        html.removeClass(ctrlNode, 'jimu-state-selected');
        html.setAttr(ctrlNode, 'tabindex', '-1');
        if(ctrlNode.label === title){
          this._currentCtrlNode = ctrlNode;
          html.addClass(ctrlNode, 'jimu-state-selected');
          html.setAttr(ctrlNode, 'tabindex', '0');
        }
      }, this);
    }

  });
});