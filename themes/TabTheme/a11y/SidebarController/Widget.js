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
  "dojo/query",
  'dojo/Deferred',
  //'dojo/_base/array',
  'dojo/_base/html',
  'jimu/utils',
  'dojo/keys',
  "dijit/a11yclick",
  'dijit/Tooltip'
],
  function (lang, on, query, Deferred,/* array,*/html, jimuUtils, keys, a11yclick, Tooltip) {
    var mo = {};

    mo.a11y_init = function () {
      html.setAttr(this.domNode, "aria-label", this.nls._widgetLabel);

      this.a11y_useDoResizeNode();
      this.own(on(this.doResizeNode, a11yclick, lang.hitch(this, function (/*evt*/) {
        this._doResize();
      })));
    };

    //icons
    mo.a11y_nodeSelect = function (node, hanlder) {
      this.own(on(node, a11yclick, hanlder));
    };
    mo.a11y_nodeEscEvent = function (node) {
      this.own(on(node, "keydown", lang.hitch(this, function (evt) {
        if (evt.keyCode === keys.ESCAPE) {
          evt.stopPropagation();
          evt.preventDefault();

          this.doResizeNode.focus();
        }
      })));
    };
    mo.a11y_getIconNodeById = function (id) {
      var isMaxMode = (html.getStyle(this.maxStateNode, "display") === "block");
      var cNode = true === isMaxMode ? this.maxStateNode : this.minStateNode;
      var node = query('.title-node[settingId="' + id + '"]', cNode);
      if (node.length === 0) {
        return;
      }
      return node[0];
    };
    mo.a11y_addTooltip = function(node, label){
      jimuUtils.addTooltipByDomNode(Tooltip, node, label);
    };

    //ResizeNode
    mo.a11y_useDoResizeNode = function () {
      html.setAttr(this.doResizeNode, "tabindex", this.tabIndex);
    };
    mo.a11y_ignoreDoResizeNode = function () {
      html.removeAttr(this.doResizeNode, "tabindex");
    };
    mo.a11y_resizeNodeAriaLabel = function (mode) {
      var str = ("e" === mode) ? window.jimuNls.common.expand ://expand
          window.jimuNls.common.collapse;//collapse
      str = str.replace("${value}", this.nls._widgetLabel);
      html.setAttr(this.doResizeNode, "aria-label", str);
      html.setAttr(this.doResizeNode, "aria-expanded", "e" === mode ? 'false' : 'true');
    };

    //main panel
    mo.a11y_focusToItemInMoreTab = function (idx) {
      if (idx) {
        //console.log("focus---"+idx);
        var node = query(".other-group[data-widget-id='" + idx + "']", this.otherGroupNode);
        if (node && node[0] && node[0].focus) {
          node[0].focus();
        }
      }
    };
    mo.a11y_switchNodeToClose = function (id) {
      query('.title-node', this.domNode).removeClass('jimu-state-selected');
      var iconJson = this.appConfig.getConfigElementById(id);
      var def;
      if (iconJson) {
        if (iconJson.inPanel === false) {
          this.widgetManager.closeWidget(id);
          //this.openedId = '';
          def = new Deferred();
          def.resolve();
          return def;
        } else {
          return this.panelManager.closePanel(id + '_panel');
        }
      } else {
        def = new Deferred();
        def.resolve();
        return def;
      }
    };

    //more tab
    mo.a11y_moreTabCloseAriaLabel = function (closeNode) {
      html.setAttr(closeNode, "title", window.jimuNls.common.close);
    };
    mo.a11y_moreTabCloseEvent = function (closeNode) {
      this.own(on(closeNode, "click", lang.hitch(this, function () {
        this._hideOtherGroupPane();
        if (this.lastSelectedIndex !== -1) {
          this.selectTab(this.lastSelectedIndex);
        }
      })));
      this.own(on(closeNode, "keydown", lang.hitch(this, function (evt) {
        if(evt.shiftKey && evt.keyCode === keys.TAB){
          evt.stopPropagation();
          evt.preventDefault();
          if(this.a11y_moreTab_last && this.a11y_moreTab_last.focus){
            this.a11y_moreTab_last.focus();
          }
          // var lastNode = query('.other-group:last-child', this.otherGroupNode);
          // lastNode[0].focus();
        } else if (evt.keyCode === keys.ENTER || evt.keyCode === keys.SPACE || evt.keyCode === keys.ESCAPE) {
          evt.stopPropagation();
          this._hideOtherGroupPane();

          var moreIcon = query('.title-node[title="more"]', this.titleListNode);
          moreIcon[0].focus();
        }
      })));
    };
    mo.a11y_moreTabEscapeEvent = function (node) {
      this.own(on(node, 'keydown', lang.hitch(this, function (evt) {
        if (evt.keyCode === keys.ESCAPE) {
          evt.stopPropagation();
          evt.preventDefault();

          this.a11y_moreTab_close.focus();
        }
      })));
    };
    mo.a11y_cleanTabIndex_otherGroupPane = function () {
      if (this.a11y_moreTab_close) {
        html.removeAttr(this.a11y_moreTab_close, "tabindex");
      }

      var otherGroupNodes = query(".other-group", this.otherGroupNode);
      for (var i = 0, len = otherGroupNodes.length; i < len; i++) {
        html.removeAttr(otherGroupNodes[i], "tabindex");
      }
    };
    mo.a11y_moreTabLastNodeTabEvent = function () {
      this.own(on(this.a11y_moreTab_last, 'keydown', lang.hitch(this, function (evt) {
        if (!evt.shiftKey && evt.keyCode === keys.TAB) {
          evt.stopPropagation();
          evt.preventDefault();
          this.a11y_moreTab_close.focus();
        }
      })));
    };
    mo.a11y_moreTabInonEscEvent = function (node) {
      this.own(on(node, 'keydown', lang.hitch(this, function (evt) {
        if (evt.keyCode === keys.ESCAPE) {
          evt.stopPropagation();
          evt.preventDefault();

          this.a11y_moreTab_close.focus();
        }
      })));
    };

    //events
    mo.a11y_getEventOps = function (evt) {
      var ops = {};
      if ("keyup" === evt._origType) {
        ops.a11y_byKeyEvent = true;
      }
      return ops;
    };

    return mo;
  });