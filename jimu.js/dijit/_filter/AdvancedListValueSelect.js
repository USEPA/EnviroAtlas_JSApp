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
    'dojo/Evented',
    'dojo/_base/html',
    'dojo/_base/declare',
    'dijit/_WidgetBase',
    'dojo/on',
    'dojo/keys',
    'dojo/query',
    'dijit/_TemplatedMixin',
    'dijit/_WidgetsInTemplateMixin',
    'dojo/text!./AdvancedListValueSelect.html',
    'jimu/utils'
  ],function(lang, Evented, html, declare, _WidgetBase, on, keys, query,
      _TemplatedMixin, _WidgetsInTemplateMixin, template, jimuUtils) {

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Evented], {
        templateString: template,
        selectType: null,
        dataList:[],
        checkedList:[], //save value
        checkedLabelList: [], //save label or alias
        _itemLabelW: 215, //ellipsis if label's width is larger than this

        ifFristPage: true, // if it is the first page to show
        queryState: true,// if it is quering data from server

        isCacheFinish: false,
        keyQueryMode: false,
        cacheQueryMode : false,

        emptyStr: '',

        postMixInProperties:function(){
          this.inherited(arguments);
          this.jimuCommonNls = window.jimuNls.common;
          this.Nls = window.jimuNls.filterBuilder;
          this.noDataNls = window.apiNls.widgets.FeatureTable.noData;
        },

        postCreate: function(){
          this.inherited(arguments);
          // this.checkedList = [];

          if(this.selectType === 'unique'){
            this.inputType = 'radio';
          }else{
            this.inputType = 'checkbox';
          }

          if(this.controlType === 'multipleDynamic' || this.controlType === 'uniqueDynamic'){
            html.addClass(this.listContainer, "items-setting-dropdown-content");
            this.searchKeyInput.style.display = 'block';
          }
          if(this.controlType === 'uniqueDynamic'){
            html.addClass(this.listContainer, 'items_content_no_selected_toggle');
          }

          if(this.runtime){
            // this.listContainer.style.height = 230 + 'px';
            html.addClass(this.listContainer, "items-widget-content");
            if(this.selectUI !== 'dropdown'){ //predefind & expanded
              html.addClass(this.listContainer, "items-widget-expaned-content");
              html.addClass(this.listContent, "jimu-multiple-items-expanded-list");

              html.setAttr(this.listContent, "aria-label", this.label);
              html.addClass(this.listContent, jimuUtils.lastFocusNodeClassInDOM);//set it as last node
              html.removeAttr(this.multipleSelect, 'tabindex');
            }
          }else{
            html.addClass(this.listContainer, "items-setting-popup-content");
            this.searchKeyInput.style.display = 'block';
            // this.initDoms();
          }

          //for enable listSelect for every item when type is predefined
          if(!this.runtime && this.controlType === 'predefined'){
            html.addClass(this.listContainer, "items-setting-dropdown-content");
            html.addClass(this.listContainer, 'items_content_no_selected_toggle');
            this.searchKeyInput.style.display = 'block';
          }
          this._addCBXClickEvent();
          this._addCBXHoverEvent();

          //show custom label string when runtime & predefined
          this.disPlayLabel = 'value';
          if(this.runtime && (this.controlType === 'multiplePredefined' || this.controlType === 'uniquePredefined')){
            this.disPlayLabel = 'alias';
          }

          //for selected model
          if(this.controlType === 'multipleDynamic'){
            this.selectedToggleDiv.style.display = 'block';
            this.selectedToggle = query('.showAllIcon', this.selectedToggleDiv)[0];
            this.own(on(this.selectedToggleDiv, 'click', lang.hitch(this, '_toggleFilter')));
            this.own(on(this.selectedToggleDiv, 'keydown', lang.hitch(this, function(evt){
              if(evt.keyCode === keys.ENTER){
                this._toggleFilter(evt);
              }
            })));
            this._addSelectedContainerEvent();
          }
          this._addKeyDownEvent();
        },

        _addKeyDownEvent: function(){
          this.own(on(this.multipleSelect, 'keydown', lang.hitch(this, function(evt){
            var key = evt.which || evt.keyCode;
            var target = evt.target;
            //esc or tab(before the first node or after the last node), close popup
            if(key === keys.ESCAPE ||
              (this.selectUI === 'dropdown' &&
               ( (target.tagName === 'INPUT' && evt.shiftKey && key === keys.TAB) ||
                (((this.controlType === 'multipleDynamic' && html.hasClass(target, 'clearAllSelectedIcon')) ||
                (this.controlType !== 'multipleDynamic' && html.hasClass(target, 'item'))) &&
                !evt.shiftKey && key === keys.TAB)))){
              evt.preventDefault();
              if(this.currentHoverItem){
                html.removeClass(this.currentHoverItem, 'active');
                this.currentHoverItem = null;
              }
              this.emit("advancedListValueSelect_itemsConfirmed");
            }
          })));

          //listContent - event
          this.own(on(this.listContent, 'focus', lang.hitch(this, function(){
            if(!jimuUtils.isInNavMode()){
              return;
            }
            this.currentItem = this.getCurrentItem();
            this.currentItem = this.currentItem ? this.currentItem : this._getCheckInputItems()[0];
            this.currentHoverItem = this.currentItem.parentNode;
            if(this.selectUI === 'dropdown'){
              this.currentHoverItem.focus();//focus current item directly
            }else{
              this._isFocusFirstItem = true;
            }
            html.addClass(this.currentHoverItem, 'active');
            setTimeout(lang.hitch(this, function(){//for IE
              html.addClass(this.currentHoverItem, 'active');
            }), 10);
          })));
          this.own(on(this.listContent, 'blur', lang.hitch(this, function(){
            if(this.currentHoverItem){
              html.removeClass(this.currentHoverItem, 'active');
            }
          })));
          //pervent cursor enter content from showAllIconBtn by shift&tab-key #firefox
          this.own(on(this.showAllIconBtn, 'keydown', lang.hitch(this, function(evt){
            if(evt.shiftKey && evt.keyCode === keys.TAB){
              evt.preventDefault();
              if(html.getStyle(this.selectedContainer, 'display') === 'block'){
                this.selectedListContent.focus();
              }else{
                this.listContent.focus();
              }
            }
          })));
          this.own(on(this.listContent, 'keydown', lang.hitch(this, function(evt){
            if(!jimuUtils.isInNavMode()){
              return;
            }

            var key = evt.which || evt.keyCode;
            //prevent default behaviors
            if([keys.SPACE, keys.UP_ARROW, keys.DOWN_ARROW].indexOf(key) > -1){//space, up, down
              evt.preventDefault();
            }

            if(key === keys.TAB && html.hasClass(evt.target, 'item')){
              evt.preventDefault();
              if(this.currentHoverItem){
                html.removeClass(this.currentHoverItem, 'active');
              }
              if(this.selectUI === 'dropdown'){
                this.currentHoverItem = null;
                if(evt.shiftKey){
                  if(this.searchKeyInput.style.display === 'block'){
                    this.valueInput.focus();
                  }else{
                    this.emit("advancedListValueSelect_itemsConfirmed");
                  }
                }else{
                  if(this.controlType === 'multipleDynamic'){
                    this.showAllIconBtn.focus();
                  }
                }
              }else{
                //back to focus on listContent node
                this.listContent.focus();
              }
            }else if(key === keys.SPACE || key === keys.ENTER){//space or enter
              var currentItem = query('.checkInput', this.currentHoverItem)[0];
              var labelTarget = query('.label', this.currentHoverItem)[0];
              this._setCBXChecked(currentItem, this._getNodeText(labelTarget));
              if(this.inputType === 'radio'){
                if(this.selectUI === 'dropdown'){
                  html.removeClass(this.currentHoverItem, 'active');
                  this.currentHoverItem = null;
                }
                this.emit("advancedListValueSelect_itemsConfirmed");
              }
            }
            else if(key === keys.UP_ARROW || key === keys.DOWN_ARROW){//up or down
              if(this.selectUI !== 'dropdown' && this._isFocusFirstItem){
                this._isFocusFirstItem = false;
                this.currentHoverItem.focus();
                setTimeout(lang.hitch(this, function(){
                  html.addClass(this.currentHoverItem, 'active');
                }), 5);
                return;
              }
              var currentHoverItem = key === keys.UP_ARROW ? this.currentHoverItem.previousSibling :
              this.currentHoverItem.nextSibling;
              currentHoverItem = currentHoverItem ? currentHoverItem : this.currentHoverItem; //current
              //set position
              if (this.listContainer.scrollHeight > this.listContainer.clientHeight) {
                //currentHoverItem's position is wrong by one item???
                var searchHeight = 30;
                var scrollBottom = this.listContainer.clientHeight + this.listContainer.scrollTop;
                var elementBottom = currentHoverItem.offsetTop + currentHoverItem.offsetHeight;
                elementBottom = elementBottom - searchHeight;
                if (elementBottom > scrollBottom) {
                  this.listContainer.scrollTop = elementBottom - this.listContainer.clientHeight;
                }
                else if (currentHoverItem.offsetTop < this.listContainer.scrollTop + searchHeight) {
                  this.listContainer.scrollTop = currentHoverItem.offsetTop - searchHeight;
                }
              }
              html.removeClass(this.currentHoverItem, 'active');
              this.currentHoverItem = currentHoverItem;
              html.addClass(this.currentHoverItem, 'active');
              this.currentHoverItem.focus();
            }
          })));

          //selectContent - event
          this.own(on(this.selectedListContent, 'focus', lang.hitch(this, function(){
            if(!jimuUtils.isInNavMode()){
              return;
            }
            var items = query(".item", this.selectedListContent);
            if(items.length){
              this.currentHoverItem = items[0];
              this.currentHoverItem.focus();
              html.addClass(this.currentHoverItem, 'active');
              setTimeout(lang.hitch(this, function(){//for IE
                html.addClass(this.currentHoverItem, 'active');
              }), 50);
            }
          })));
          this.own(on(this.selectedListContent, 'blur', lang.hitch(this, function(){
            if(jimuUtils.isInNavMode() && this.currentHoverItem){
              html.removeClass(this.currentHoverItem, 'active');
            }
          })));
          this.own(on(this.selectedContainer, 'keydown', lang.hitch(this, function(evt){
            if(!jimuUtils.isInNavMode()){
              return;
            }
            var key = evt.which || evt.keyCode;
            if(key === keys.TAB){
              evt.preventDefault();
              if(this.currentHoverItem){
                html.removeClass(this.currentHoverItem, 'active');
              }
              this.showAllIconBtn.focus();
              // this.showSelectedIconBtn.focus();
              return;
            }
            var items = query(".item", this.selectedListContent);
            if(items.length === 0){
              return;
            }

            //prevent default behaviors
            if([keys.SPACE, keys.UP_ARROW, keys.DOWN_ARROW].indexOf(key) > -1){//space, up, down
              evt.preventDefault();
            }

            if(key === keys.SPACE || key === keys.ENTER){//space or enter
              var inputTarget = query('.checkInput', this.currentHoverItem)[0];
              var labelTarget = query('.label', this.currentHoverItem)[0];
              this._setCBXSelectedChecked(inputTarget, this._getNodeText(labelTarget));//trigger
            }
            else if(key === keys.UP_ARROW || key === keys.DOWN_ARROW){//up or down
              var currentHoverItem = key === keys.UP_ARROW ? this.currentHoverItem.previousSibling :
                this.currentHoverItem.nextSibling;
              currentHoverItem = currentHoverItem ? currentHoverItem : this.currentHoverItem; //current
              //set position
              if (this.selectedContainer.scrollHeight > this.selectedContainer.clientHeight) {
                //currentHoverItem's position is wrong by one item???
                var scrollBottom = this.selectedContainer.clientHeight + this.selectedContainer.scrollTop;
                var elementBottom = currentHoverItem.offsetTop + currentHoverItem.offsetHeight;
                if (elementBottom > scrollBottom) {
                  this.selectedContainer.scrollTop = elementBottom - this.selectedContainer.clientHeight;
                }
                else if (currentHoverItem.offsetTop < this.selectedContainer.scrollTop) {
                  this.selectedContainer.scrollTop = currentHoverItem.offsetTop;
                }
              }

              html.removeClass(this.currentHoverItem, 'active');
              this.currentHoverItem = currentHoverItem;
              html.addClass(this.currentHoverItem, 'active');
              this.currentHoverItem.focus();
            }
          })));
        },

        _toggleFilter: function(evt){
          var target = evt.target;
          if(html.hasClass(target, 'clearAllSelectedIcon')){ //clear selected all
            this._clearAllSelected();
            this.currentItem = null;
            this.currentHoverItem = null;
            return;
          }

          if(html.hasClass(target, 'iconHover') || html.hasClass(target, 'selectedToggleDiv')){
            return;
          }

          if(html.hasClass(target, 'showAllIcon')){
            this.selectedContainer.style.display = 'none';
            this.listContent.focus();
          }else{
            this._initSelectedContainerItems();
            this.selectedContainer.style.display = 'block';
            this.selectedListContent.focus();
          }

          html.removeClass(this.selectedToggle, 'iconHover');
          this.selectedToggle = target;
          html.addClass(this.selectedToggle, 'iconHover');

          evt.stopPropagation();
        },

        showAllList: function(){
          var applied = html.hasClass(this.selectedToggle, 'showSelectedIcon') &&
            html.hasClass(this.selectedToggle, 'iconHover');
          if(applied){
            html.removeClass(this.selectedToggle, 'iconHover');

            this.selectedToggle = query('.showAllIcon', this.selectedToggleDiv)[0];
            html.addClass(this.selectedToggle, 'iconHover');

            html.setStyle(this.selectedContainer, 'display', 'none');
          }
        },

        _clearAllSelected: function(){
          var listContainer;
          if(html.hasClass(this.selectedToggle, 'showAllIcon')){
            listContainer = this.listContainer;
          }else{
            listContainer = this.selectedListContent;
          }
          var inputs = query('.item .checkInput.checked', listContainer);
          for(var key = 0; key < inputs.length; key ++){
            // html.removeClass(inputs[key], 'checked');
            inputs[key].click();
          }
        },

        _initSelectedContainerItems: function(){
          this.selectedListContent.innerHTML = '';
          var items = '';
          var labelRuntimeClass = this.runtime ? ' labelRuntime' : '';
          for(var index = 0; index < this.checkedList.length; index ++){
            var value = this.checkedList[index];
            var label = this.disPlayLabel === 'value' ? value : this.checkedLabelList[index];
            // var dataAttr = this.isNumberField ? "data=" + value : "data='" + value + "'";
            var dataValue = this.isNumberField ? value : encodeURIComponent(value);
            var dataAttr = "data=\"" + dataValue + "\"";
            var item = '<div role="option" class="item" tabindex="-1" aria-selected="true" aria-checked="true">' +
                  '<div class="checkInput ' + this.inputType + ' checked" ' + dataAttr + '></div>' +
                  '<div class="label jimu-ellipsis-Blanks' + labelRuntimeClass + '" style="max-width:' +
                  this._itemLabelW + 'px">' +
                  label + '</div>' +
                  '</div>';
            items += item;
          }
          this.selectedListContent.innerHTML = items;
        },

        _addSelectedContainerEvent: function(){
          this.own(on(this.selectedListContent, 'click', lang.hitch(this, function(evt){
            var evtTarget = evt.target;
            var cbxTarget, labelTarget;
            if(html.hasClass(evtTarget,'item')){
              cbxTarget = evtTarget.firstElementChild;
              labelTarget = evtTarget.firstElementChild.nextSibling;
            }else if(html.hasClass(evtTarget,'checkInput')){
              cbxTarget = evtTarget;
              labelTarget = evtTarget.nextSibling;
            }else if(html.hasClass(evtTarget,'label')){
              cbxTarget = evtTarget.previousSibling;
              labelTarget = evtTarget;
            }else{
              evt.stopPropagation();
              return;
            }
            this._setCBXSelectedChecked(cbxTarget, this._getNodeText(labelTarget));
            evt.stopPropagation();
          })));
        },

        _setCBXSelectedChecked: function(target, name){
          //show
          var value = name;
          if(this.disPlayLabel === 'alias' || this.disPlayLabel === 'label'){
            value = decodeURIComponent(html.getAttr(target, 'data'));
          }
          if(html.hasClass(target, 'checked')){
            html.setAttr(target.parentNode, 'aria-checked', 'false');
            if(this.inputType === 'radio'){
              return;
            }
            html.removeClass(target, 'checked');
            //update list
            this._updateCheckedList('remove', value, name);
            this.checkCBXItems();
            this.emit("advancedListValueSelect_itemUnChecked", name);
          }else{
            html.setAttr(target.parentNode, 'aria-checked', 'true');
            if(this.inputType === 'radio' && this.currentItem){
              if(this.currentItem === true){
                this.currentItem = this.getCurrentItem();
              }
              html.removeClass(this.currentItem, 'checked');
            }
            html.addClass(target, 'checked');
            this._updateCheckedList('add', value, name);
            this.checkCBXItems();
            this.emit("advancedListValueSelect_itemChecked", name);
          }
        },

        _getNodeText: function(target){
          // return target.textContent || target.innerText || target.innerHTML;
          return target.textContent || target.innerText || '';
        },

        _updateCheckedList: function(type,name,label){
          if(name !== this.emptyStr){
            name = this.isNumberField ? parseFloat(name): name;
          }
          if(type === 'remove'){
            for(var key in this.checkedList){
              if(this.checkedList[key] === name ||
                (this.isNumberField && isNaN(this.checkedList[key]) && isNaN(name))){//isNaN('abc') = true
                this.checkedList.splice(key,1);//remove this unChecked name
                this.checkedLabelList.splice(key,1);
                break; //only remove first value, when there're same values in the checkedList.
              }
            }
          }else{
            if(this.inputType === 'radio'){
              this.checkedList = [name];
              this.checkedLabelList = [label];
            }else{
              //allow same values, it could be [1,2,2,3] when multiplePredefined
              // if(this.checkedList.indexOf(name) < 0){
              this.checkedList.push(name);
              this.checkedLabelList.push(label);
              // }
            }
          }
          this._updateListContentLabel();
        },

        //update aria-label for listContent
        _updateListContentLabel: function(){
          if(this.selectUI !== 'dropdown' && this.runtime){
            var labels = this.checkedLabelList.join(' ');
            labels = labels ? labels : this.emptyStr;
            html.setAttr(this.listContent, "aria-label", this.label + labels);
          }
        },

        _updateCheckedLabelList: function(valueLabels){
          this.checkedLabelList = [];
          for(var key = 0; key < this.checkedList.length; key ++){
            for(var index = 0; index < valueLabels.length; index ++){
              if(this.checkedList[key] === valueLabels[index].value){
                this.checkedLabelList.push(valueLabels[index].label);
              }
            }
          }
        },

        _updateCheckedLabelListFromCheckedList: function(){
          for(var key = 0; key < this.checkedList.length; key ++ ){
            this.checkedLabelList.push(this.checkedList[key] + '');
          }
          this._updateListContentLabel();
        },

        _createTarget: function(evt){
          var text = this._getNodeText(evt.target);
          var name = text.split(': ')[1];
          this.emit("advancedListValueSelect_itemChecked", name);
        },

        //delete item by namename
        _deleteCBXItem: function(){//name
        },

        _getCheckInputItems: function(){
          return query('.item .checkInput', this.listContent);
        },

        //get all checked values
        getListCheckedValuesOrigin: function(){
          var checkedVals = [];
          var items = this._getCheckInputItems(); //can't get this.listContent in this function
          for(var key = 0; key < items.length; key ++){
            var item = items[key];
            var value = this._getNodeText(item.nextSibling);
            if(html.hasClass(item,'checked')){
              checkedVals.push(value);
            }
          }
          return checkedVals;
        },

        getListCheckedValues: function(){
          var checkedVals = [];
          var strs = lang.clone(this.checkedList);
          for(var key = 0; key < strs.length; key ++){
            var str = strs[key];
            var value = this.isNumberField ? parseFloat(str):str;
            checkedVals.push(value);
          }
          return checkedVals;
        },

        //get all values with checked field
        getListValues: function(){
          var valsObj = [];
          // var checkedVals = [];
          var items = this._getCheckInputItems();
          if(items.length === 0){return this.dataList;}
          for(var key = 0; key < items.length; key ++){
            var item = items[key];
            var value = this._getNodeText(item.nextSibling);
            if(this.disPlayLabel === 'alias' || this.disPlayLabel === 'label'){
              value = decodeURIComponent(html.getAttr(item, 'data'));
            }
            value = this.isNumberField ? parseFloat(value): value;
            var valObj = {value: value, isChecked: false};
            if(html.hasClass(item,'checked')){
              valObj.isChecked = true;
              // checkedVals.push(value);
            }
            valsObj.push(valObj);
          }
          // return checkedVals;
          return valsObj;
        },

        //get if value exist
        getIfValueExist: function(name){
          var items = this._getCheckInputItems();
          for(var key = 0; key < items.length; key ++){
            var item = items[key];
            var value = this._getNodeText(item.nextSibling);
            if(name === value){
              return true;
            }
          }
          return false;
        },

        //get all checked values
        getCurrentItem: function(){
          // var items = query('.item .radio', this.listContent);
          var items = this._getCheckInputItems();
          for(var key = 0; key < items.length; key ++){
            var item = items[key];
            if(html.hasClass(item,'checked')){
              return item;
            }
          }
          return null;
        },

        //set cbx item checked status depending on predefined table
        checkCBXItems: function(ifClearValue){
          var value = ifClearValue ? '' : this.valueInput.get('value');
          this.valueInput.set('value',value);
          var items = query('.item .label', this.listContent);
          for(var key = 0; key < items.length; key ++){
            var item = items[key];
            var valStr = this.disPlayLabel === 'value' ? this._getNodeText(item) :
            decodeURIComponent(html.getAttr(item.previousSibling, 'data'));
            // var itemVal = this.isNumberField ? parseFloat(item.innerText) : item.innerText;
            var itemVal = this.isNumberField ? parseFloat(valStr) : valStr;
            if(this.checkedList.indexOf(itemVal) >= 0 ||
              (this.isNumberField && this.checkedList.indexOf(parseFloat(itemVal)) >= 0)){//for number string data
              html.addClass(item.previousSibling, 'checked');
            }else{
              html.removeClass(item.previousSibling, 'checked');
            }
          }
        },

        reset: function(){
          this.listContent.innerHTML = '';
        },

        //add data to list when get data every time, don't need to clear previous data.
        //isCheck: if need checked option's status
        //isInit: if need to init select content
        setCBXData: function(valueLabels, isCheck, ifInit, isResetPopup){
          if(!isResetPopup){
            this.queryState = false;
          }
          valueLabels = valueLabels? valueLabels : [];

          // for listSelect Popup on predefined setting page
          // close popup (destroy popup) while it's quering data from server.
          if(!this.listContent){
            return;
          }
          html.setStyle(this.noDataTips, 'display', 'none');

          var realCheckedNum = 0;
          var labelBig = this.inputType === 'radio' ? ' labelBig' : '';
          var labelRuntimeClass = this.runtime ? ' labelRuntime' : '';

          var innerHTML = this.listContent.innerHTML;
          if(ifInit){
            this.listContent.innerHTML = '';
            innerHTML = '';
            if((this.controlType === 'uniquePredefined' && this.enableEmpty) ||
              (this.controlType === 'uniqueDynamic' && !this.keyQueryMode)){//cacheQueryMode
              var _checkedClass = '', itemActiveClass = '';
              if(this.checkedList[0] === this.emptyStr){
                _checkedClass = ' checked';
                itemActiveClass = ' active';
                realCheckedNum = 1;
              }
              if(this.checkedList.length === 0){//uniquePredefined
                _checkedClass = ' checked';
                this.currentItem = true;
                realCheckedNum = 1;
              }
              var _ariaChecked = '';
              // if(this.inputType === 'checkbox'){
              _ariaChecked = _checkedClass ? 'aria-checked="true"' : 'aria-checked="false"';
              // }
              var _dataAttr = "data='" + this.emptyStr + "'";
              innerHTML = '<div role="option" class="item emptyItem' + itemActiveClass + '" aria-selected="true" tabindex="-1" ' + _ariaChecked + '>' +
                  '<div class="checkInput ' + this.inputType + _checkedClass + '" ' + _dataAttr + '></div>' +
                  '<div class="label' + labelBig + ' jimu-ellipsis-Blanks' + labelRuntimeClass +
                  '" style="max-width:' + this._itemLabelW + 'px">' +
                  this.emptyStr + '</div></div>';
            }
            this.listContainer.scrollTop = 0;//reset scroll position
          }

          if(valueLabels.length === 0){
            var _contentHtml = this.listContent.innerHTML.replace(/(^\s*)|(\s*$)/g, "");
            if(_contentHtml === '' && (!this.cacheQueryMode || this.isCacheFinish)){
              html.setStyle(this.noDataTips, 'display', 'block');
            }
            if(_contentHtml === ''){
              this.listContent.innerHTML = innerHTML;
            }
            return this.listContent;
          }

          var items = '';
          for(var index = 0; index < valueLabels.length; index ++){
            var valueLabel = valueLabels[index];
            var checkedClass = '';
            if(isCheck){
              if(this.runtime &&
                (this.controlType === 'multiplePredefined' || this.controlType === 'uniquePredefined')){
                if(valueLabel.isChecked){
                  checkedClass = ' checked';
                  this.currentItem = true;
                  realCheckedNum ++;
                }
              }else if(this.checkedList.indexOf(valueLabel.value) >= 0 ||
                (this.isNumberField && this.checkedList.indexOf(parseFloat(valueLabel.value)) >= 0)){//for number string data
                checkedClass = ' checked';
                this.currentItem = true;
                realCheckedNum ++;
              }
            }
            var ariaChecked = '';
            // if(this.inputType === 'checkbox'){
            ariaChecked = checkedClass ? 'aria-checked="true"' : 'aria-checked="false"';
            // }
            // var selectClass = "radio";
            // var dataAttr = this.isNumberField ? "data=" + valueLabel.value : "data='" + valueLabel.value + "'";
            var dataValue = this.isNumberField ? valueLabel.value : encodeURIComponent(valueLabel.value);//string maybe has ',""
            var dataAttr = "data=\"" + dataValue + "\"";
            var item = '<div class="item" role="option" tabindex="-1" aria-selected="true" ' + ariaChecked + '>' +
                  // '<div class="checkInput ' + this.inputType + checkedClass + '" data=' + valueLabel.value + '></div>' +
                  '<div class="checkInput ' + this.inputType + checkedClass + '" ' + dataAttr + '></div>' +
                  '<div class="label' + labelBig + ' jimu-ellipsis-Blanks' + labelRuntimeClass +
                  '" style="max-width:' + this._itemLabelW + 'px">' +
                  // valueLabel.value + '</div>' +
                  valueLabel[this.disPlayLabel] + '</div>' +
                  '</div>';
            items += item;
          }
          var checkedDiff = this.checkedList.length - realCheckedNum;
          if(this.runtime && checkedDiff > 0){
            for(var key = 0;key < checkedDiff; key ++){
              this.emit("advancedListValueSelect_itemUnChecked", '');
            }
          }
          this.listContent.innerHTML = innerHTML + items;
          // var containerH = html.getStyle(this.listContainer, 'height') + 15;
          // html.setStyle(this.listContainer, 'height', containerH + 'px');

          return this.listContent;
        },

        //set content with data which query by searchkey(this data doesn't require paging)
        setCBXContentBySearch: function(valueLabels, isResetPopup){//, pageSize
          // var name = this.searchName;
          // pageSize = pageSize ? pageSize : this.pageSize;
          if(valueLabels.length === 0){
            this.setCBXData([], false, true, isResetPopup);//, pageSize
            // if(this.controlType !== 'multipleDynamic'){
            //   this._addCreateDom(name);
            // }
          }else{
            this.setCBXData(valueLabels, true, true, isResetPopup);//, pageSize
            // if(this.controlType !== 'multipleDynamic'){
            //   var ifExist = this.getIfValueExist(name);
            //   if(!ifExist){
            //     this._addCreateDom(name);
            //   }else{
            //     html.setStyle(this.createNewItem, 'display', 'none');
            //   }
            // }
          }
        },

        //query from local cache
        _onSearchKeyChange: function(){
          var name = this.valueInput.get('value');
          this.searchName = name;
          this.listContainer.scrollTop = 0;//reset scroll position
          this.reset();
          this.ifFristPage = true;
          this.keyQueryMode = true;
          this.cacheQueryMode = true;

          this.emit("advancedListValueSelect_searchKeyLocal", name);

          if(this.codedValues){
            return;
          }

          if(!this.isCacheFinish){
            html.setStyle(this.loadMoreDataBtn, 'display', 'block');
          }
          //back to query from server mode
          if(name.length === 0){
            this.keyQueryMode = false;
            this.cacheQueryMode = false;
            this.queryState = false;
            html.setStyle(this.loadMoreDataBtn, 'display', 'none');
          }
        },

        _loadMoreDataFromServer: function(){
          this.ifFristPage = true;
          this.keyQueryMode = true;
          this.cacheQueryMode = false;
          this.queryState = true;
          html.setStyle(this.loadMoreDataBtn, 'display', 'none'); //only show once time after local querying
          var name = this.valueInput.get('value');
          this.searchName = name;
          this.listContainer.scrollTop = 0;//reset scroll position
          // if(name.length !== 0){ //search
          // this.keyQueryMode = true;
          // runtime & predefined need 'search' and 'addBtn'
          // setting & multiple need 'search' no 'addBtn'
          if(this.controlType === 'multipleDynamic' || this.controlType === 'uniqueDynamic'){//multiple
            this.emit("advancedListValueSelect_searchKey", name);
          }else if(this.runtime){
            // console.log('runtime');
          }else{//setting---two predefineds
            this.emit("advancedListValueSelect_searchKey", name);
          }
          // }else{
          //   this.keyQueryMode = false;
          //   // this.createNewItem.style.display = 'none';
          //   this.reset();
          //   // this.setCBXData([], false, true, 1);
          //   this.emit("advancedListValueSelect_addNextPage");
          //   // this.listContentStore.placeAt(this.listContent);
          // }
        },

        // _addCreateDom: function(name){
        // this.createNewItem.style.display = 'block';
        // var label = this.Nls.createValue;
        // var str = label.replace('${value}', name);
        // this.createNewItem.innerText = str;
        // },
        currentHoverItem: null,
        _addCBXHoverEvent: function(){
          this.own(on(this.listContent, 'mouseover', lang.hitch(this, function(event){
            var target = event.target || event.srcElement;
            var itemDom;
            if(html.hasClass(target, 'item')){
              itemDom = target;
            }else{
              itemDom = jimuUtils.getAncestorDom(target, function(dom){
                return html.hasClass(dom, 'item');
              }, 3);
            }

            if(itemDom){
              if(this.currentHoverItem){
                html.removeClass(this.currentHoverItem, 'active');
              }
              html.addClass(itemDom, 'active');
              this.currentHoverItem = itemDom;
            }
          })));
          this.own(on(this.listContent, 'mouseout', lang.hitch(this, function(){
            if(this.currentHoverItem){
              html.removeClass(this.currentHoverItem, 'active');
            }
            this.currentHoverItem = null;
          })));
        },

        _addCBXClickEvent: function(){
          // this.own(on(this.valueInput, 'blur', lang.hitch(this, function(){
          //   this._loadMoreDataFromServer();
          // })));

          this.own(on(this.valueInput, 'change', lang.hitch(this, function(){
            this._onSearchKeyChange();
          })));

          this.own(on(this.loadMoreDataBtn, 'click', lang.hitch(this, function(){
            this._loadMoreDataFromServer();
          })));

          // if(this.controlType === 'multipleDynamic' || this.controlType === 'uniqueDynamic'){
          this.own(on(this.listContainer, 'scroll', lang.hitch(this, this.dropDownScroll)));
          // }

          this.own(on(this.searchKeyInput, 'click', lang.hitch(this, function(evt){
            evt.stopPropagation();
          })));

          // var contentDoms = query('.jimu-multiple-items-list', this.cbxPopup.domNode)[0];
          this.own(on(this.listContainer, 'click', lang.hitch(this, function(evt){
            var evtTarget = evt.target;
            var cbxTarget, labelTarget;
            if(html.hasClass(evtTarget,'item')){
              cbxTarget = evtTarget.firstElementChild;
              labelTarget = evtTarget.firstElementChild.nextSibling;
            }else if(html.hasClass(evtTarget,'checkInput')){
              cbxTarget = evtTarget;
              labelTarget = evtTarget.nextSibling;
            }else if(html.hasClass(evtTarget,'label')){
              cbxTarget = evtTarget.previousSibling;
              labelTarget = evtTarget;
            }else{
              evt.stopPropagation();
              return;
            }
            this._setCBXChecked(cbxTarget, this._getNodeText(labelTarget));
            evt.stopPropagation();
          })));
        },


        scrollDiff:100,//add more data when the distance is 100px from bottom
        dropDownScroll: function(evt){
          if(this.runtime && (this.controlType === "uniquePredefined" || this.controlType === "multiplePredefined")){
            return;
          }
          if(this.cacheQueryMode || this.codedValues){
            return;
          }
          if(this.queryState){
            this.listContainer.scrollTop = this.containerScrollTop;
            // html.setStyle(this.listContainerOverlay, 'display', 'block');
            return;
          }else{
            // html.setStyle(this.listContainerOverlay, 'display', 'none');
          }
          var target = evt.target;
          var diff = target.scrollHeight - target.clientHeight;
          if(diff - target.scrollTop <= this.scrollDiff){
            if(!this.queryState){
              this.containerScrollTop = this.listContainer.scrollTop;
              this.queryState = true;
              this.ifFristPage = false;
              this.emit("advancedListValueSelect_addNextPage");
            }
          }
        },

        _setCBXChecked: function(target, name){
          var value = name;
          if(this.disPlayLabel === 'alias' || this.disPlayLabel === 'label'){
            value = decodeURIComponent(html.getAttr(target, 'data'));
          }
          if(html.hasClass(target, 'checked')){
            html.setAttr(target.parentNode, 'aria-checked', 'false');
            if(this.inputType === 'radio'){
              //close list when reChecked radio item
              if(!this.runtime && this.controlType === 'predefined'){
                this.emit("advancedListValueSelect_itemCheckedForPredefined", value, name);
              }else{
                this.emit("advancedListValueSelect_itemChecked", name);
              }
              return;
            }
            html.removeClass(target, 'checked');
            this._updateCheckedList('remove', value, name);
            this.emit("advancedListValueSelect_itemUnChecked", name);
          }else{
            html.setAttr(target.parentNode, 'aria-checked', 'true');
            if(this.inputType === 'radio' && this.currentItem){
              if(this.currentItem === true){
                this.currentItem = this.getCurrentItem();
              }
              if(this.currentItem){
                html.removeClass(this.currentItem, 'checked');
                html.setAttr(this.currentItem.parentNode, 'aria-checked', 'false');
              }
            }
            html.addClass(target, 'checked');
            this.currentItem = target;
            // if(!this.runtime){
            this._updateCheckedList('add', value, name);
            if(!this.runtime && this.controlType === 'predefined'){
              this.emit("advancedListValueSelect_itemCheckedForPredefined", value, name);
            }else{
              this.emit("advancedListValueSelect_itemChecked", name);
            }
            // }
          }
        },

        initDoms: function(valueLabels,ifCheck){
          this.setCBXData(valueLabels,ifCheck);
        },

        getData: function(){

        },

        refreshData: function(){
          this.checkCBXItems();
        },

        validate: function() {
          var displayVal = this.checkedList.length ? '12345678': null;
          if(this.checkedList.length === 1 && this.checkedList[0] === this.emptyStr){
            displayVal = null;
          }
          //return null if there are some invalid datas(number type) in checkList
          if(this.isNumberField){
            for(var key = 0; key < this.checkedList.length; key ++){
              var itemVal = this.checkedList[key];
              if(itemVal === this.emptyStr){
                continue;
              }
              if(isNaN(itemVal)){
                displayVal = null;
                break;
              }
            }
          }

          this.set("DisplayedValue", displayVal);
          return true;

          // var valid = false;
          // var valList = this.getListValues();
          // if(this.controlType === "uniqueDynamic"){
          //   if(valList || valList === 0){
          //     valid = true;
          //   }
          // }else{
          //   if(valList && valList.length > 0){
          //     valid = true;
          //   }
          // }
          // if(valid){
          //   this.set("DisplayedValue", '100000000');
          // }
          // return true;
        },

        setRequired: function(required){
          this.mutiValuesSelect.set("required", required);
        },

        destroy:function(){
          // if(this.valueInputBlur){
          //   this.valueInputBlur.remove();
          // }
          html.destroy(this.domNode);
          // this = null;
          this.inherited(arguments);
        }
      });
  });