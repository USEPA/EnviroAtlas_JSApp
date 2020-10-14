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
  'dijit/_TemplatedMixin',
  'dojo/text!./LayerFilter.html',
  'dojo/dom',
  'dojo/on',
  'dojo/keys',
  'dojo/dom-class',
  'dijit/focus',
  'jimu/utils',
  'jimu/dijit/Search'
], function(_WidgetBase, declare, lang, _TemplatedMixin, template, dom, on, keys,
domClass, focusUtil, jimuUtils, Search) {

  return declare([_WidgetBase, _TemplatedMixin], {
    templateString: template,
    baseClass: 'layer-filter',
    layerFilterInput: null,
    isValid: false,
    layerListWidget: null,
    layerInfoIsValidStatus: null,
    layerInfoIsExpandStatus: null,

    postMixInProperties: function() {
      this.inherited(arguments);
      this.nls = lang.mixin(lang.clone(this.layerListWidget.nls), window.jimuNls.common);
    },

    constructor: function() {
      this.layerInfoIsValidStatus = {};
      this.layerInfoIsExpandStatus = {};
    },

    startup: function() {
      this.layerFilterInput = new Search({
        placeholder: this.nls.typeAKeywork,
        onSearch: lang.hitch(this, this._onFilter),
        searchWhenInput: true
      }).placeAt(this.searchInputNode);
      dom.setSelectable(this.cancelButton, false);

      this.own(on(this.searchButton,
        'keydown',
        lang.hitch(this, '_onSearchButtonKey')));

      this.own(on(this.layerFilterInput.inputSearch,
        'keydown',
        lang.hitch(this, '_onLayerFilterInputKey')));

      this.own(on(this.clearInputButton,
        'keydown',
        lang.hitch(this, '_onClearInputButtonKey')));

      this.own(on(this.cancelButton,
        'keydown',
        lang.hitch(this, '_onCancelButtonKey')));
    },

    _updateLayerInfoStatus: function(filterText) {
      this.layerInfoIsValidStatus = {};
      this.layerInfoIsExpandStatus = {};
      this.layerListWidget.operLayerInfos.traversalAll(lang.hitch(this, function(layerInfo) {
        if(filterText) {
          var currentLayerInfo;
          if(layerInfo.title.toLowerCase().indexOf(filterText.toLowerCase()) >= 0) {
            currentLayerInfo = layerInfo;
            while(currentLayerInfo) {
              this.layerInfoIsValidStatus[currentLayerInfo.id] = true;
              currentLayerInfo = currentLayerInfo.parentLayerInfo;
              if(currentLayerInfo) {
                this.layerInfoIsExpandStatus[currentLayerInfo.id] = true;
              }
            }
          } else {
            currentLayerInfo = layerInfo.parentLayerInfo;
            while(currentLayerInfo) {
              if(currentLayerInfo.title.toLowerCase().indexOf(filterText.toLowerCase()) >= 0) {
                this.layerInfoIsValidStatus[layerInfo.id] = true;
                break;
              }
              currentLayerInfo = currentLayerInfo.parentLayerInfo;
            }
          }
        } else {
          this.layerInfoIsValidStatus[layerInfo.id] = true;
        }
      }));
    },

    isValidLayerInfo: function(layerInfo) {
      return !this.isValid || this.layerInfoIsValidStatus[layerInfo.id];
    },

    isExpanded: function(layerInfo) {
      return this.isValid && this.layerInfoIsExpandStatus[layerInfo.id];
    },

    cancelFilter: function() {
      this.isValid = false;
      if(this.layerFilterInput.inputSearch.value) {
        this.layerFilterInput.inputSearch.value = "";
        this.layerListWidget._refresh();
      }
      domClass.remove(this.searchButton, 'invalid');
      domClass.add(this.searchInputNode, 'invalid');
      domClass.add(this.cancelButton, 'invalid');
      focusUtil.focus(this.searchButton);
    },

    hideFilter: function() {
      // keep isValid is ture
      domClass.remove(this.searchButton, 'invalid');
      domClass.add(this.searchInputNode, 'invalid');
      domClass.add(this.cancelButton, 'invalid');
      focusUtil.focus(this.searchButton);
    },

    _onFilter: function(text) {
      if(text) {
        domClass.remove(this.clearInputButton, 'disable');
      } else {
        domClass.add(this.clearInputButton, 'disable');
      }
      this._updateLayerInfoStatus(text);
      this.layerListWidget._refresh();
    },

    _onSearchBtnClick: function() {
      this.isValid = true;
      domClass.add(this.searchButton, 'invalid');
      domClass.remove(this.searchInputNode, 'invalid');
      domClass.remove(this.cancelButton, 'invalid');
      this.layerFilterInput.inputSearch.focus();
    },

    _onCancelBtnClick: function() {
      this.cancelFilter();
    },

    _onClearInputButton: function() {
      if(this.layerFilterInput.inputSearch.value) {
        domClass.add(this.clearInputButton, 'disable');
        this.layerFilterInput.inputSearch.focus();
        this.layerFilterInput.inputSearch.value = "";
        this._updateLayerInfoStatus("");
        this.layerListWidget._refresh();
      }
    },

    _onSearchButtonKey: function(e) {
      if(e.keyCode === keys.ENTER) {
        this._onSearchBtnClick();
      }
    },

    _onLayerFilterInputKey: function(e) {
      if(e.keyCode === keys.TAB && e.shiftKey) {
        e.stopPropagation();
        e.preventDefault();
        this._enableNavMode(e);
      } else if(e.keyCode === keys.TAB && !e.shiftKey) {
        e.stopPropagation();
        e.preventDefault();
        this._enableNavMode(e);
        if(domClass.contains(this.clearInputButton, 'disable')) {
          focusUtil.focus(this.cancelButton);
        } else {
          focusUtil.focus(this.clearInputButton);
        }
      } else if(e.keyCode === keys.ESCAPE) {
        e.stopPropagation();
        e.preventDefault();
        //this._onCancelBtnClick();
        this.hideFilter();
      }
    },

    _onClearInputButtonKey: function(e) {
      if(e.keyCode === keys.TAB && e.shiftKey) {
        e.stopPropagation();
        e.preventDefault();
        this._enableNavMode(e);
        focusUtil.focus(this.layerFilterInput.inputSearch);
      } else if(e.keyCode === keys.TAB && !e.shiftKey) {
        e.stopPropagation();
        e.preventDefault();
        focusUtil.focus(this.cancelButton);
      } else if(e.keyCode === keys.ENTER) {
        e.stopPropagation();
        e.preventDefault();
        this._onClearInputButton();
      } else if(e.keyCode === keys.ESCAPE) {
        e.stopPropagation();
        e.preventDefault();
        //this._onCancelBtnClick();
        this.hideFilter();
      }
    },

    _onCancelButtonKey: function(e) {
      if(e.keyCode === keys.TAB && e.shiftKey) {
        e.stopPropagation();
        e.preventDefault();
        this._enableNavMode(e);
        focusUtil.focus(this.layerFilterInput.inputSearch);
      } else if(e.keyCode === keys.TAB && !e.shiftKey) {
        e.stopPropagation();
        e.preventDefault();
        this._enableNavMode(e);
      } else if(e.keyCode === keys.ENTER) {
        e.stopPropagation();
        e.preventDefault();
        this._onCancelBtnClick();
      } else if(e.keyCode === keys.ESCAPE) {
        e.stopPropagation();
        e.preventDefault();
        //this._onCancelBtnClick();
        this.hideFilter();
      }
    },

    _enableNavMode:function(evt) {
      if(evt.keyCode === keys.TAB && !jimuUtils.isInNavMode()){
        domClass.add(document.body, 'jimu-nav-mode');
      }
    }
  });
});
