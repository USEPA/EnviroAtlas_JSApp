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
    'dojo/_base/html',
    'dojo/on',
    'dojo/dnd/move',
    'dijit/_TemplatedMixin',
    'jimu/BaseWidgetPanel',
    'jimu/utils',
    'dojox/layout/ResizeHandle',
    "./a11y/OnScreenWidgetPanel",
    'dojo/touch'
  ],
  function(
    declare, lang, html, on, Move,
    _TemplatedMixin, BaseWidgetPanel, utils, ResizeHandle, a11y
  ) {
      var numberStops = null;
      

    /* global jimuConfig */
    var clazz = declare([BaseWidgetPanel, _TemplatedMixin], {
      baseClass: 'jimu-panel jimu-on-screen-widget-panel jimu-main-background',
      _positionInfoBox: null,
      _originalBox: null,
      widgetIcon: null,
      _resizeOnOpen: true,

      templateString:
        '<div data-dojo-attach-point="boxNode">' +
          '<div class="jimu-panel-title jimu-main-background" data-dojo-attach-point="titleNode">' +
          '<h2 class="title-label jimu-vcenter-text jimu-float-leading jimu-leading-padding1"' +
          'data-dojo-attach-point="titleLabelNode" tabindex="-1" ' +
          'data-dojo-attach-event="onkeydown:_onTitleLabelKeyDown">${label}</h2>' +
          '<div class="btns-container">' +
            '<div tabindex="0" class="foldable-btn jimu-vcenter" aria-label="${headerNls.foldWindow}" role="button"' +
              'data-dojo-attach-point="foldableNode"' +
              'data-dojo-attach-event="onclick:_onFoldableBtnClicked,onkeydown:_onFoldableBtnKeyDown"></div>' +
            '<div tabindex="0" class="max-btn jimu-vcenter" aria-label="${headerNls.maxWindow}" role="button"' +
              'data-dojo-attach-point="maxNode"' +
              'data-dojo-attach-event="onclick:_onMaxBtnClicked,onkeydown:_onMaxBtnKeyDown"></div>' +
        '<div tabindex="0" class="help-btn jimu-vcenter" ' +
        'data-dojo-attach-point="helpNode"' +
        'data-dojo-attach-event="onclick:_onHelpBtnClicked,press:_onHelpBtnClicked,onkeydown:_onHelpBtnClicked"></div>' +         
            '<div tabindex="0" class="close-btn jimu-vcenter" aria-label="${headerNls.closeWindow}" role="button"' +
              'data-dojo-attach-point="closeNode"' +
              'data-dojo-attach-event="onclick:_onCloseBtnClicked,onkeydown:_onCloseBtnKey"></div>' +
          '</div></div>' +
          '<div class="jimu-panel-content" data-dojo-attach-point="containerNode"></div>' +
        '</div>',

      postMixInProperties:function(){
        this.headerNls = window.jimuNls.panelHeader;
      },

      postCreate: function() {
        this._originalBox = {
          w: 400,
          h: 410
        };
      },

      startup: function() {
        self = this;
        //tourDialogOnScreenWidget = null;
        var helpExist = false;
        
            for (var i=0, il=window.helpTour.length; i<il; i++) {
               var widgetName = window.helpTour[i].widgetName;
               if (widgetName !=null) {
                   if (this.id.toUpperCase().indexOf(widgetName.toUpperCase()) >= 0) {
                       helpExist = true;
                       break;                 
                   }                   
               }

            }  
         
        
            if (helpExist == false){            
                this.helpNode.parentNode.removeChild(this.helpNode);     
            }
        this.inherited(arguments);

        this._normalizePositionObj(this.position);
        this._makeOriginalBox();
        this.makePositionInfoBox();
        this.makeMoveable(this._positionInfoBox.w, this._positionInfoBox.w * 0.25);

        this.a11y_init();
      },

      _onMaxBtnClicked: function(evt) {
        evt.stopPropagation();
        var posInfo = this._getPositionInfo();
        if (posInfo.isRunInMobile) {
          if (this.windowState === 'maximized') {
            html.setAttr(this.maxNode, 'aria-label', this.headerNls.maxWindow);
            this.panelManager.normalizePanel(this);
          } else {
            html.setAttr(this.maxNode, 'aria-label', this.headerNls.restoreWindow);
            this.panelManager.maximizePanel(this);
            //set foldable btn's styles
            html.removeClass(this.foldableNode, 'fold-up');
            html.addClass(this.foldableNode, 'fold-down');
            html.setAttr(this.foldableNode, 'aria-label', this.headerNls.foldWindow);
          }
          this._setMobilePosition();
        }

        this.panelManager.activatePanel(this);
      },

      _onFoldableBtnClicked: function(evt) {
        if(evt){
          evt.stopPropagation();
        }
        var posInfo = this._getPositionInfo();
        if (posInfo.isRunInMobile) {
          if (this.windowState === 'minimized') {
            html.removeClass(this.foldableNode, 'fold-up');
            html.addClass(this.foldableNode, 'fold-down');
            html.setAttr(this.foldableNode, 'aria-label', this.headerNls.foldWindow);
            this.panelManager.normalizePanel(this);
          } else {
            html.removeClass(this.foldableNode, 'fold-down');
            html.addClass(this.foldableNode, 'fold-up');
            html.setAttr(this.foldableNode, 'aria-label', this.headerNls.unfoldWindow);
            this.panelManager.minimizePanel(this);
          }
          //set max btn's label
          html.setAttr(this.maxNode, 'aria-label', this.headerNls.maxWindow);
          this._setMobilePosition();
        }
      },
      _onHelpBtnClicked: function(evt) {
        

        evt.stopPropagation();

        //avoid to touchEvent pass through the closeBtn
        if (evt.type === "touchstart") {
          evt.preventDefault();
        }
        
        window.PanelId = this.id;    

        utils.startTour();
      },
      _onCloseBtnClicked: function(evt) {
        //avoid to touchEvent pass through the closeBtn
        evt.preventDefault();
        evt.stopPropagation();

        this.panelManager.closePanel(this);
      },

      _normalizePositionObj: function(position) {
        var layoutBox = this._getLayoutBox();
        position.left = isFinite(position.left) ? position.left : layoutBox.w - position.right;
        position.top = isFinite(position.top) ? position.top : layoutBox.h - position.bottom;

        delete position.right;
        delete position.bottom;
        this.position = lang.mixin(lang.clone(this.position), position);
      },

      makePositionInfoBox: function() {
        this._positionInfoBox = {
          w: this.position.width || 400,
          h: this.position.height || 410,
          l: this.position.left || 0,
          t: this.position.top || 0
        };
      },

      _makeOriginalBox: function() {
        this._originalBox = {
          w: this.position.width || 400,
          h: this.position.height || 410,
          l: this.position.left || 0,
          t: this.position.top || 0
        };
      },

      makeResizable: function() {
        this.disableResizable();
        this.resizeHandle = new ResizeHandle({
          targetId: this,
          minWidth: this._originalBox.w,
          minHeight: this._originalBox.h,
          activeResize: false
        }).placeAt(this.domNode);
        this.resizeHandle.startup();
      },

      disableResizable: function() {
        if (this.resizeHandle) {
          this.resizeHandle.destroy();
          this.resizeHandle = null;
        }
      },

      makeMoveable: function(width, tolerance) {
        this.disableMoveable();
        var containerBox = html.getMarginBox(jimuConfig.layoutId);
        containerBox.l = containerBox.l - width + tolerance;
        containerBox.w = containerBox.w + 2 * (width - tolerance);

        this.moveable = new Move.boxConstrainedMoveable(this.domNode, {
          box: containerBox,
          handle: this.titleNode,
          within: true
        });
        this.own(on(this.moveable, 'Moving', lang.hitch(this, this.onMoving)));
        this.own(on(this.moveable, 'MoveStop', lang.hitch(this, this.onMoveStop)));
      },

      disableMoveable: function() {
        if (this.moveable) {
          this.moveable.destroy();
          this.moveable = null;
        }
      },

      createHandleNode: function() {
        return this.titleNode;
      },

      onOpen: function() {
        if (this._resizeOnOpen) {
          this.resize();
          this._resizeOnOpen = false;
        }

        if (window.appInfo.isRunInMobile) {
          this._setMobilePosition();
          if(utils.isInNavMode() && this.windowState === 'minimized') {
            this._onFoldableBtnClicked();
          }
        }

        this.inherited(arguments);
      },

      _switchToMobileUI: function() {
        html.removeClass(this.titleNode, 'title-normal');
        html.addClass(this.titleNode, 'title-full');
        html.setStyle(this.foldableNode, 'display', 'block');
        html.setStyle(this.maxNode, 'display', 'block');

        if (this.windowState === 'normal') {
          html.removeClass(this.foldableNode, 'fold-up');
          html.addClass(this.foldableNode, 'fold-down');
          html.setAttr(this.foldableNode, 'aria-label', this.headerNls.foldWindow);
        } else {
          html.removeClass(this.foldableNode, 'fold-down');
          html.addClass(this.foldableNode, 'fold-up');
          html.setAttr(this.foldableNode, 'aria-label', this.headerNls.unfoldWindow);
        }
      },

      _switchToDesktopUI: function() {
        html.removeClass(this.titleNode, 'title-full');
        html.addClass(this.titleNode, 'title-normal');
        html.setStyle(this.foldableNode, 'display', 'none');
        html.setStyle(this.maxNode, 'display', 'none');
      },

      resize: function(tmp) {
        var posInfo = this._getPositionInfo();
        var _pos = {
          left: posInfo.position.left,
          top: posInfo.position.top,
          width: this._positionInfoBox.w,
          height: this._positionInfoBox.h
        };
        if (tmp) {
          tmp.t = this.domNode.offsetTop;
          _pos.left = isFinite(tmp.l) ? tmp.l : _pos.left;
          _pos.top = isFinite(tmp.t) ? tmp.t : _pos.top;
          _pos.width = isFinite(tmp.w) ? tmp.w : _pos.width;
          _pos.height = isFinite(tmp.h) ? tmp.h : _pos.height;

          this._normalizePositionObj(lang.clone(_pos));
          this.makePositionInfoBox();

          _pos.width = this._positionInfoBox.w;
          _pos.height = this._positionInfoBox.h;
        }
        posInfo.position = _pos;

        this._onResponsible(posInfo);
        this.inherited(arguments);
      },

      _onResponsible: function(posInfo) {
        if (posInfo.isRunInMobile) {
          this._setMobilePosition();
          this.disableMoveable();
          this.disableResizable();
          this._switchToMobileUI();
        } else {
          this._setDesktopPosition(posInfo.position);
          this.makeResizable();
          this.makeMoveable(this._positionInfoBox.w, this._positionInfoBox.w * 0.25);
          this._switchToDesktopUI();
        }
      },

      setPosition: function(position) {
        this._normalizePositionObj(position);
        this.makePositionInfoBox();

        var posInfo = this._getPositionInfo();
        this._onResponsible(posInfo);
      },

      destroy: function() {
        this.widgetIcon = null;
        this.inherited(arguments);
      },

      _getLayoutBox: function() {
        var pid = jimuConfig.layoutId;
        if (this.position.relativeTo === 'map') {
          pid = jimuConfig.mapId;
        } else {
          pid = jimuConfig.layoutId;
        }
        return html.getMarginBox(pid);
      },

      _getPositionInfo: function() {
        var result = {
          isRunInMobile: false,
          position: {
            left: 0,
            top: 5
          }
        };
        var layoutBox = this._getLayoutBox();
        //judge width
        var leftBlankWidth = this._positionInfoBox.l;
        if (!window.appInfo.isRunInMobile) {
          if (window.isRTL) {
            result.position.left = layoutBox.w - leftBlankWidth;

            // prevent the panel out of map content
            if ((result.position.left + this._positionInfoBox.w) > layoutBox.w) {
              result.position.left -= this._positionInfoBox.w;
              if (result.position.left < 0) {
                result.position.left = layoutBox.w - this._positionInfoBox.w;
              }
            }
          } else {
            result.position.left = leftBlankWidth;
            // prevent the panel out of map content
            if ((result.position.left + this._positionInfoBox.w) > layoutBox.w) {
              if (layoutBox.w > this._positionInfoBox.w) {
                result.position.left = layoutBox.w - this._positionInfoBox.w;
              } else {
                result.position.left = 0;
              }
            }
          }
        } else {
          result.isRunInMobile = true;
          return result;
        }

        //judge height
        // preloadIcon height is 40px, tolerance is 3px
        var topBlankHeight = this._positionInfoBox.t;
        var bottomBlankHeight = layoutBox.h - topBlankHeight;
        if (topBlankHeight >= bottomBlankHeight) {
          if (topBlankHeight >= this._positionInfoBox.h) { // preloadIcon height is 40px
            result.position.top = this._positionInfoBox.t - this._positionInfoBox.h - 40 - 3;
          }
        } else {
          if (bottomBlankHeight >= this._positionInfoBox.h) {
            result.position.top = this._positionInfoBox.t + 40 + 3; // preloadIcon height is 40px
          }
        }

        return result;
      },

      _setMobilePosition: function() {
        if (window.appInfo.isRunInMobile && this.domNode &&
          this.domNode.parentNode !== html.byId(jimuConfig.layoutId)) {
          html.place(this.domNode, jimuConfig.layoutId);
        }
        var pos = this.panelManager.getPositionOnMobile(this);
        if (this.position.zIndex) {
          pos.zIndex = this.position.zIndex;
        }
        var style = utils.getPositionStyle(pos);
        lang.mixin(style, pos.borderRadiusStyle);
        html.setStyle(this.domNode, style);
      },

      _setDesktopPosition: function(position) {
        if(!window.appInfo.isRunInMobile && this.domNode &&
          this.domNode.parentNode !== html.byId(jimuConfig.mapId)) {
          html.place(this.domNode, jimuConfig.mapId);
        }

        html.setStyle(this.domNode, {
          left: position.left + 'px',
          right: 'auto',
          top: position.top + 'px',
          width: (position.width || this.position.width || this._originalBox.w) + 'px',
          height: (position.height || this.position.height || this._originalBox.h) + 'px'
        });
      },

      onMoving: function(mover) {
        html.setStyle(mover.node, 'opacity', 0.9);
      },

      onMoveStop: function(mover) {
        html.setStyle(mover.node, 'opacity', 1);
        var panelBox = html.getMarginBox(mover.node);
        var _pos = {
          left: panelBox.l,
          top: panelBox.t,
          width: panelBox.w,
          height: panelBox.h
        };

        this._normalizePositionObj(lang.clone(_pos));
        this.makePositionInfoBox();
      }
    });

    clazz.extend(a11y);//for a11y
    return clazz;
  });