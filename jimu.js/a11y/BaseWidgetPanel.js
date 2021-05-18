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
  'dojo/_base/html',
  'dojo/query',
  'dojo/on',
  'dojo/keys',
  './../utils'
],
  function (lang, html, query, on, keys, utils) {
    var mo = {};

    mo.frameSectionIndex = '91';
    mo.panelNls = window.jimuNls.panelHeader;

    mo._addTagToGroupPanel = function(){
      var configs = this.config.widgets;
      this.isGroupPanel = true; // it's a group panel with several widgets
      configs.forEach(function(widget){
        widget.inGroupPanel = true; // add inGroupPanel attr to every widget.
      });
    };

    mo._setAriaLabel = function(frame, widgetLabel){
      var ariaLabel;
      if(frame.folded){
        ariaLabel = mo.panelNls.expanded;
        html.setStyle(frame.containerNode, 'display', 'inherit');
      }else{
        ariaLabel = mo.panelNls.collapsed;
        //hide node for removing it from tabbing order
        html.setStyle(frame.containerNode, 'display', 'none');
      }
      var titleAriaLabel = utils.getSubstituteString(widgetLabel, ariaLabel);
      html.setAttr(frame.titleNode, 'aria-label', titleAriaLabel);
    };

    mo._initFrameEvents = function (frame, widgetConfig, index) {
      if(this.isGroupPanel){
        var titleAriaLabel = utils.getSubstituteString(widgetConfig.label, mo.panelNls.expanded);
        var contentAriaLabel = utils.getSubstituteString(widgetConfig.label, mo.panelNls.pressToFocus);
        html.setAttr(frame.titleNode, 'aria-label', titleAriaLabel);
        html.setAttr(frame.titleNode, 'tabindex', mo.frameSectionIndex);
        html.setAttr(frame.containerNode, 'aria-label', contentAriaLabel);
        html.setAttr(frame.containerNode, 'tabindex', mo.frameSectionIndex);
        if(index === 0){
          this.firstTitleNode = frame.titleNode;
        }else if(index === this.config.widgets.length - 1){
          this.lastTitleNode = frame.titleNode;
          this.lastContent = frame.containerNode;
        }

        this.own(on(frame.titleNode, 'click', lang.hitch(this, function(){
          if(frame.foldEnable){
            this._setAriaLabel(frame, frame.label);
          }
        })));
        this.own(on(frame.titleNode, 'keydown', lang.hitch(this, function(evt){
          if(html.hasClass(evt.target, 'title')){
            if(evt.keyCode === keys.TAB){
              if(evt.target === this.firstTitleNode && evt.shiftKey){
                evt.preventDefault();
                this.lastContent.focus();
              }
              //tab last titleNode to first titleNode when last contentNode is folded
              else if(evt.target === this.lastTitleNode && !evt.shiftKey &&
                html.getStyle(this.lastContent, 'display') === 'none'){
                evt.preventDefault();
                this.firstTitleNode.focus();
              }
            }else if(frame.foldEnable && (evt.keyCode === keys.ENTER || evt.keyCode === keys.SPACE)){
              evt.stopPropagation();
              this._setAriaLabel(frame, frame.label);
              frame.onFoldableNodeClick();
            }
          }
        })));

        this.own(on(frame.containerNode, 'keydown', lang.hitch(this, function(evt){
          var container = evt.target;
          if(html.hasClass(container, 'jimu-panel-content')){
            if(evt.keyCode === keys.ENTER){
              var widgetDom = query('.jimu-widget', container)[0];
              if(widgetDom){
                utils.focusFirstFocusNode(widgetDom);
              }
            }else if(evt.target === this.lastContent && !evt.shiftKey && evt.keyCode === keys.TAB){
              evt.preventDefault();
              this.firstTitleNode.focus();
            }
          }else if(evt.keyCode === keys.ESCAPE){
            evt.stopPropagation();
            frame.containerNode.focus();
          }
        })));
      }
    };

    mo._onOpenAndFocus = function(){
      //Not focus first title node at first time when openAtStart is true.
      if(this.config.openAtStart && !this._isFirstOpenAtStart){
        this._isFirstOpenAtStart = true;
        return;
      }
      if(this.isGroupPanel && this.firstTitleNode){
        this.firstTitleNode.focus();
      }
    };

    return mo;
  });