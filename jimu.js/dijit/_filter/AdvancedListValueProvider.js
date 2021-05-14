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
    'dojo/Deferred',
    'dojo/_base/lang',
    'dojo/on',
    'dojo/keys',
    'dojo/Evented',
    'dojo/_base/html',
    'dojo/_base/array',
    'dojo/_base/declare',
    'dojo/query',
    './ValueProvider',
    './AdvancedListValueSelect',
    'dijit/_TemplatedMixin',
    'dijit/_WidgetsInTemplateMixin',
    'dojo/text!./AdvancedListValueProvider.html',
    'jimu/utils',
    'jimu/dijit/_filter/pageControlForQuery',
    'jimu/dijit/Popup'
  ],
  function(Deferred, lang, on, keys, Evented, html, array, declare, query, ValueProvider,
    AdvancedListValueSelect, _TemplatedMixin,_WidgetsInTemplateMixin,template, jimuUtils,
    pageControlForQuery, Popup) {

    return declare([ValueProvider, _TemplatedMixin, _WidgetsInTemplateMixin, Evented], {
        templateString: template,
        codedValues: null,//[{value,label}] for coded values and sub types
        staticValues: null,//[{value,label}]
        showNullValues: false,//show null values
        cbxPopup: null,

        pageSize: 1000, //page size
        pageIndex:1,  //current page

        emptyStr: '',

        postMixInProperties:function(){
          this.inherited(arguments);
          this.CommonNls = window.jimuNls.common;
          this.emptyStr = window.apiNls.widgets.FeatureTable.empty;
        },

        postCreate: function(){
          this.inherited(arguments);
          this.noDataTips = '<div class="error-tip-section" style="display: block;">' +
                            '<span class="jimu-icon jimu-icon-error"></span>' +
                            '<span class="jimu-state-error-text">' + this.nls.noFilterValueTip + '</span></div>';

          html.addClass(this.domNode, 'jimu-filter-mutcheck-list-value-provider');

          if(this.providerType === 'ADVANCED_LIST_VALUE_PROVIDER'){ //setting&multiple
            this.controlType = 'multipleDynamic';
            this.checkedNumDiv.style.display = 'block';
          }else if(this.providerType === 'LIST_VALUE_PROVIDER'){ //setting&multiple
            this.controlType = 'uniqueDynamic';
            this.checkedNameDiv.style.display = 'block';
          }else{
            if(this.runtime && this.selectUI === 'dropdown'){
              if(this.providerType === 'UNIQUE_PREDEFINED_VALUE_PROVIDER'){
                this.checkedNameDiv.style.display = 'block';
              }else{
                this.checkedNumDiv.style.display = 'block';
              }
            }
            if(this.providerType === 'MULTIPLE_PREDEFINED_VALUE_PROVIDER'){
              this.controlType = 'multiplePredefined';
            }else{
              this.controlType = 'uniquePredefined';
            }
          }

          if(this.providerType === 'MULTIPLE_PREDEFINED_VALUE_PROVIDER'){//runtime&multiple predefined
            this.selectType = 'multiple';
          }else if(this.providerType === 'UNIQUE_PREDEFINED_VALUE_PROVIDER'){//runtime&unique predefined
            this.selectType = 'unique';
          }else if(this.providerType === 'LIST_VALUE_PROVIDER'){
            this.selectType = 'unique';
          }else{
            this.selectType = 'multiple';
          }

          this.disPlayLabel = 'value';
          if(this.runtime && (this.controlType === 'multiplePredefined' || this.controlType === 'uniquePredefined')){
            this.disPlayLabel = 'alias';
          }

          if(this.runtime && (this.controlType === 'multipleDynamic' || this.controlType === 'uniqueDynamic')){
            this.isLoadDataAdvanced = true;
          }

          //keep the date format which was saved in setting page, not the lasteast date format by mapviewer.
          if(this.runtime && this.fieldInfo.type === 'esriFieldTypeDate' && this.partObj.fieldObj){
            this.fieldPopupInfo = {format: {dateFormat: this.partObj.fieldObj.dateFormat}};
          }

          //for valuetype = field
          this.isNumberField = jimuUtils.isNumberField(this.fieldInfo.type);
          if(!this.pageControlForQuery){
            this.pageControlForQuery = new pageControlForQuery({
              pageSize: this.pageSize,
              pageIndex: 1,
              layerUrl: this.url,
              fieldInfo: this.fieldInfo,
              queryWhere: '1=1',
              layerDefinition: this.layerDefinition,
              fieldPopupInfo: this.fieldPopupInfo,
              // spatialReference: this.layerInfo.map.spatialReference,
              isNumberField: this.isNumberField
            });
            this.pageControlForQuery.on("query_getNewExpr", lang.hitch(this, this._resetPageControlNewExpr));
          }
          if(!this.listSelect){
            this._resetPromptLabel(false);

            this.listSelectDataList = (this.partObj && this.partObj.valueObj && this.partObj.valueObj.value) ?
              this.partObj.valueObj.value : [];
            this.listSelect = new AdvancedListValueSelect({
              label: this.promptLabel.innerHTML, //for aria-label in expanded list
              emptyStr: this.emptyStr,
              runtime: this.runtime,
              pageSize: this.pageSize,
              selectUI: this.selectUI,
              controlType: this.controlType,
              selectType: this.selectType,
              dataList: this.listSelectDataList,
              selectedDataList:[],
              isNumberField: this.isNumberField
            });
            //for init checkedList data, it's necessary to display and hold data on page if no open popup again.
            if(lang.isArray(this.listSelectDataList)){
              this.getCheckedList(this.listSelectDataList);
            }else{
              this.listSelect.checkedList = [this.listSelectDataList];
              this.listSelect._updateCheckedLabelListFromCheckedList();
            }

            this.listSelect.on("advancedListValueSelect_itemChecked", lang.hitch(this, this._createTarget));
            this.listSelect.on("advancedListValueSelect_itemUnChecked", lang.hitch(this, this._destoryTarget));
            this.listSelect.on("advancedListValueSelect_addNextPage", lang.hitch(this, this._addNextPage));
            this.listSelect.on("advancedListValueSelect_searchKey", lang.hitch(this, this._searchKey));
            this.listSelect.on("advancedListValueSelect_searchKeyLocal", lang.hitch(this, this._searchKeyLocal));

            this.listSelect.on("advancedListValueSelect_itemsConfirmed", lang.hitch(this, function(){
              if(this.cbxPopup && this.cbxPopup.domNode){
                if(html.getStyle(this.cbxPopup.domNode, 'display') === 'block'){
                  this._resetListSelectState(this);
                  this.cbxPopup.hide();
                }
                this.checkedBtn.focus();
              }
            }));

            this.own(on(this.checkedBtn, 'keydown', lang.hitch(this, function(evt){
              var target = evt.target || evt.srcElement;
              if(html.hasClass(target, 'checkBtn') && evt.keyCode === keys.ENTER){
                this._checkedBtnEvent();
              }
            })));


            if(!this.staticValues && typeof this._checkedBtnEvent === 'function'){
              if(!this.codedValues || (this.codedValues && this.filterCodedValue)){
                // to be continued ...
                if(this.layerInfo){ //it always exsits because it's required from valueProviderFactory constructor
                  //it will tragger after the  add/remove/update events happen
                  this.layerInfo.getLayerObject().then(lang.hitch(this, function(layerObject){
                    layerObject.on("edits-complete", lang.hitch(this, function() {
                      this.layerDataChanged = true;
                    }));
                  }));
                }
              }
            }
          }
          //show dijit in popup
          // if(!this.runtime || (this.runtime && this.type === 'dropdown')){
          if(this.selectUI === 'dropdown'){
            html.setStyle(this.checkedBtn, 'display', 'block');
            this._multipleSelectProviderEventHandler = lang.hitch(this, this._multipleSelectProviderEvent);
            document.addEventListener('click', this._multipleSelectProviderEventHandler , {capture: true});
          }else{ //show dijit in dropdown
            this.listSelect.placeAt(this.listContent);
          }
        },

        _resetPromptLabel: function(isNoData){
          var noDataLabel = isNoData ? this.nls.noFilterValueTip + ' ' : '';
          if(typeof(this.promptLabel) !== "undefined") {
            this.promptLabel.innerHTML = jimuUtils.sanitizeHTML(this.partObj.interactiveObj.prompt + ' ' +
            this.partObj.interactiveObj.hint + noDataLabel);
          }
        },

        filterExpr: null,
        _resetPageControlNewExpr: function(){
          // var newExpr = this.getDropdownFilterExpr();
          var newExpr = this.getDropdownFilterExpr(this.partObj.widgetId);
          if(this.filterExpr !== newExpr){
            // console.log('newExpr:' + newExpr);
            this.pageControlForQuery.reset();
            this.pageControlForQuery.cascadeFilterExprs = newExpr;
            this.filterExpr = newExpr;
            return true;
          }
          return false;
        },

        _multipleSelectProviderEvent: function(event){
          var target = event.target || event.srcElement;
          if(this.cbxPopup && this.cbxPopup.domNode){
            if(html.isDescendant(target, this.cbxPopup.domNode)){
              return;
            }
            if(html.isDescendant(target, this.checkedBtn)){
              return;
            }
            if(html.getStyle(this.cbxPopup.domNode, 'display') === 'block'){
              this._resetListSelectState(this);
              this.cbxPopup.hide();
            }
          }
          //init select: hide result popup after it's loading data
          //once other dijit or space is clicked.#13346
          else{
            if(!html.isDescendant(target, this.checkedBtn)){
              if(this.isPopupLoading){
                this.isLoadDataAdvanced = true;
              }
            }
          }
          if(this.msgDiv){
            html.setStyle(this.msgDiv, "display", "none");
          }
        },

        _checkedBtnEvent: function(){//evt
          this._showPopup(); //in popup
          // this._showDropdown(evt); //in dropdown
        },

        _onBeforeDropDownMouseDown: function(){
          this._tryUpdatingUniqueValues(undefined, true);
          return arguments;
        },

        _isRestSelectList: false,
        _resetListSelectState: function(_this){
          if(html.getStyle(_this.listSelect.searchKeyInput, 'display') === 'block'){
            if(this.controlType === 'multipleDynamic'){
              this.listSelect.showAllList();
            }
            _this.listSelect.listContainer.scrollTop = 0;
            _this.listSelect.queryState = true;
            _this.listSelect.valueInput.set('value', '');
            this._isRestSelectList = true;
            // _this.listSelect.emit("advancedListValueSelect_searchKeyLocal", '', true);//init list
          }
        },

        _createTarget: function(name){//name
          this._checkedChanged(1, name);
          if(this.cbxPopup && (this.controlType === 'uniqueDynamic' || this.controlType === 'uniquePredefined')){
            if(this.cbxPopup.domNode){
              this._resetListSelectState(this);
              this.cbxPopup.close();
            }
          }
        },

        _destoryTarget:function(name){
          this._checkedChanged(-1, name);
        },

        _checkedChanged: function(num, name){
          if(this.controlType === 'multipleDynamic' ||
            (this.controlType === 'multiplePredefined' && this.runtime && this.selectUI === 'dropdown')){
            if(name){
              num = parseInt(this.checkedNum.innerText, 10) + num;
              num = num > 0 ? num : 0; //prevent negative number when it doesn't exist at runtime
              this.checkedNum.innerText = num;
            }
          }else if(this.controlType === 'uniqueDynamic' ||
            (this.controlType === 'uniquePredefined' && this.runtime && this.selectUI === 'dropdown')){
            if(this.controlType === 'uniqueDynamic'){
              if(name === this.emptyStr){
                html.addClass(this.checkedNameDiv, 'checkedEmptyNameDiv');
              }else{
                html.removeClass(this.checkedNameDiv, 'checkedEmptyNameDiv');
              }
            }
            var newName = name ? name : this._getCheckedNameDivText();
            this._setCheckedNameDivText(newName);
          }
          this.listSelect.set("displayedValue", '12345678');
          this.emit('change');
        },

        _clearCheckedTxt: function(){
          if(this.runtime && this.selectUI === 'dropdown'){
            if(this.controlType === 'multipleDynamic' || this.controlType === 'multiplePredefined'){
              // this._setCheckedNameDivText(0);
              if(this.checkedNum.textContent){
                this.checkedNum.textContent = 0;
              }else{
                this.checkedNum.innerText = 0;
              }
            }else if(this.controlType === 'uniqueDynamic' || this.controlType === 'uniquePredefined'){
              this._setCheckedNameDivText('');
            }
            this.valueList = []; //empty current config
            this.listSelect.checkedList = [];
            this.listSelect.checkedLabelList = [];
            this.listSelect.valueInput.set('value','');
            if(this.controlType === 'multipleDynamic'){
              this.listSelect.showAllList();
            }
          }
          this.listSelect.set("displayedValue", '12345678');
          this.emit('change');
        },

        _layerDataChangedCallback: function(){
          if(this.layerDataChanged){
            this.pageControlForQuery.reset();
            this.listSelect.ifFristPage = true;
            this.layerDataChanged = false;
          }
        },

        _addNextPage: function(){
          if(!this.listSelect){
            return;
          }
          this._showLoadingIcon();
          this._layerDataChangedCallback();
          var def = this.pageControlForQuery.queryByPage(this.listSelect.ifFristPage);
          def.then(lang.hitch(this, function(valueLabels){
            this.listSelect.isCacheFinish = this.pageControlForQuery._isUniqueValueCacheFinish;
            if(this.listSelect.ifFristPage){
              var isNoData = this._checkIfNoData(valueLabels);
              if(isNoData){
                return;
              }
            }
            this.listSelect.setCBXData(valueLabels, true, this.listSelect.ifFristPage);
            this._hideLoadingIcon();
          }), lang.hitch(this, function(err){
            console.log(err);
            this.listSelect.queryState = false;
            this._hideLoadingIcon();
          }));
        },

        _searchKey: function(name){
          if(!this.listSelect){
            return;
          }
          this._showLoadingIcon();
          this._layerDataChangedCallback();
          this.pageControlForQuery._searchKey(name).then(lang.hitch(this, function(result) {
            this.listSelect.setCBXContentBySearch(result);
            this._resetPopupStyles(!result.length);
            this._hideLoadingIcon();
          }), lang.hitch(this, function(err){
            console.log(err);
            this._hideLoadingIcon();
          }));
        },

        _searchKeyLocal: function(name, isResetPopup){
          if(!this.listSelect){
            return;
          }
          if(this.controlType === 'uniqueDynamic' && this._isRestSelectList){//for showing empty item
            this.listSelect.keyQueryMode = false;
            this.listSelect.cacheQueryMode = false;
            this._isRestSelectList = false;
          }
          this._showLoadingIcon();
          var result = this.pageControlForQuery._searchKeyLocal(name);
          //cache maybe is cleaned because of layerDataChanged
          //so query the data of first page again
          if(name === '' && result.length === 0){
            this.layerDataChanged = true; //for init pageControl parameters
            this._layerDataChangedCallback();
            this._addNextPage();
          }else{
            // result = result.slice(0,this.pageSize); //only show data from first page
            this.listSelect.setCBXContentBySearch(result, isResetPopup);
          }
          this._resetPopupStyles(true);
          this._hideLoadingIcon();
        },

        queryByPage: function(){
          var def = this.pageControlForQuery.queryByPage(this.listSelect.ifFristPage);
          def.then(lang.hitch(this, function(features){
            def.resolve(features);
          }), lang.hitch(this, function(err){
            console.log(err);
            def.reject(err);
          }));
        },

        getCheckedList: function(valueList){
          this.listSelect.checkedList = [];
          this.listSelect.checkedLabelList = [];
          if(this.controlType === 'uniquePredefined' && this.selectUI !== 'dropdown' && this.enableEmpty){
            // this.listSelect.checkedList.push(val);
          }
          array.forEach(valueList, lang.hitch(this, function(item) {
            var val;
            if(lang.isObject(item)){//predefined or runtime&dropdown
              if(item.isChecked){
                val = item.value;
              }
            }else{//dynamic
              val = item;
            }
            if(val || val === 0){//number could be 0
              val = this.isNumberField ? parseFloat(val): val;
              this.listSelect.checkedList.push(val);
            }
          }));
        },

        //for runtime & predefined
        getCheckedStrsList: function(valueList){
          var checkedStrsList = [];
          array.forEach(valueList, lang.hitch(this, function(item) {
            var val;
            if(lang.isObject(item)){
              if(item.isChecked){
                val = item[this.disPlayLabel];
              }
            }else{//dynamic
              val = item;
            }
            if(val || val === 0){
              checkedStrsList.push(val);
            }
          }));
          return checkedStrsList;
        },


        showContent:function(ifInit){
          var def = new Deferred();
          // this.listSelect.checkedList = [];
          this.getCheckedList(this.valueList);
          this.listSelect.codedValues = false;
          this.listSelect.disPlayLabel = 'value';
          var isNoData;
          if(this.controlType === 'multiplePredefined' || this.controlType === 'uniquePredefined'){
            if(this.runtime){
              this.listSelect.disPlayLabel = 'alias';
            }
            // this.getCheckedList(this.valueList);
            //valueList is a vals Obj
            isNoData = this._checkIfNoData(this.valueList);
            if(!isNoData){
              this.listSelect.setCBXData(this.valueList,true,ifInit);
              this.listSelect._updateCheckedLabelListFromCheckedList();
            }
            this._hideLoadingIcon();
            def.resolve(isNoData);
            return def;
          }
          if(this.staticValues){
            // this._setValueForStaticValues(this.listSelect.checkedList, this.staticValues);
            isNoData = this._setValueForStaticValues(this.staticValues);
            def.resolve(isNoData);
            return def;
          } else if(this.codedValues){
            if(this.filterCodedValue){
              this.listSelect.codedValues = true;
            }else{
              isNoData = this._setValueForStaticValues(this.codedValues);
              def.resolve(isNoData);
              return def;
            }
          } else{
          }

          this._showLoadingIcon();
          if(this.controlType === 'multipleDynamic' || this.controlType === 'uniqueDynamic'){
            this._layerDataChangedCallback();
            this.pageControlForQuery.queryByPage(ifInit).then(lang.hitch(this, function(valueLabels){ //for multiple
              this.listSelect.isCacheFinish = this.pageControlForQuery._isUniqueValueCacheFinish;
              // if(this.codedValues){
              valueLabels = this._handleCodedValue(valueLabels);
              // valueLabels = this.pageControlForQuery._handleCodedValue(valueLabels);
              // }
              // this.getCheckedList(this.valueList);
              //valueList is a vals array---todo
              isNoData = this._checkIfNoData(valueLabels);
              if(!isNoData){
                this.listSelect.setCBXData(valueLabels, true, ifInit);
              }
              this._hideLoadingIcon();
              def.resolve(isNoData);
            }), lang.hitch(this, function(err){
              console.log(err);
              this._hideLoadingIcon();
              def.reject(err);
            }));
          }else{ //unique-predefined & multiple-predefined
          }
          return def;
        },

        _handleCodedValue: function(valueLabels){
          this.listSelect.disPlayLabel = 'label';
          if(!this.codedValues){
            this.listSelect._updateCheckedLabelListFromCheckedList();
            return valueLabels;
          }
          //update codedvalue cache
          this.pageControlForQuery._codedvalueCache = valueLabels;
          if(this.controlType === 'uniqueDynamic'){
            var value = this.listSelect.checkedList ? this.listSelect.checkedList[0] : '';
            this._setCheckedName(value, valueLabels);
          }
          this.listSelect._updateCheckedLabelList(this.codedValues);
          return valueLabels;
        },

        //Deprecated, because popup z-index is too low
        _showDropdown: function(evt){
          var position = html.position(evt.target);
          var rNode;
          if(this.isInFilterSet){
            rNode = this.domNode.parentNode.parentNode.parentNode;
          }else{
            rNode = this.domNode.parentNode;
          }
          var rPosition = html.position(rNode);

          if(html.getStyle(this.listContentPopup, 'display') !== 'none'){
            html.setStyle(this.listContentPopup, 'display', 'none');
            return;
          }
          array.forEach(query('.value-type-popup', rNode), function(node){
            html.setStyle(node, 'display', 'none');
          }, this);
          html.place(this.listContentPopup, rNode);

          var topMargin;
          if(html.hasClass(query('.desktop-add-section', rNode.parentNode)[0], 'hidden')){
            topMargin = 55 - 60;
          }else{
            topMargin = 90 - 60;
          }
          var top = position.y - rPosition.y - rNode.parentNode.scrollTop + topMargin;
          if(top + 170 > rNode.parentNode.scrollHeight){
            top = rNode.parentNode.scrollHeight - 170 - 40;
          }

          var left;
          if(window.isRTL){
            left = position.x - rPosition.x + 20;
          }else{
            left = position.x - rPosition.x - 100 - 90;
            if(left + 150 > rNode.clientWidth){
              left = rNode.clientWidth - 150;
            }
          }
          html.setStyle(this.listContentPopup, {
            display: 'block',
            left: left + 'px',
            top: top + 'px'
          });
          evt.stopPropagation();
        },

        _calculatePopup: function(){
          var rNode = this.domNode.parentNode;
          var rPosition = html.position(rNode);

          var bodyH = html.position(document.body).h;
          var popupTop = rPosition.y + 30; //default show popup under the button
          if(bodyH - popupTop < this._cbxHeight){
            popupTop = rPosition.y - this._cbxHeight;
          }
          return {
            left: rPosition.x,
            top: popupTop
          };
        },

        _cbxWidth: 210,
        _cbxHeight: 362,
        popupIsNoData: false,
        isPopupLoading: false,
        isLoadDataAdvanced: false,
        _showPopup:function(){//evt
          if(this.isPopupLoading){//prevent secondary clicks
            return;
          }
          if(this.cbxPopup && this.cbxPopup.domNode &&
            html.getStyle(this.cbxPopup.domNode, 'display') === 'block'){
            this._resetListSelectState(this);
            this.cbxPopup.hide();
            return;
          }
          //check new expr
          var isNewExpr = this._resetPageControlNewExpr();
          if(isNewExpr && this.cbxPopup){
            this.cbxPopup.close();
            this._clearCheckedTxt();
          }

          //not query again if no data is already known
          if(!isNewExpr && !this.cbxPopup){
            html.setStyle(this.msgDiv, "display", "block"); //show no data label
            return;
          }

          var popupPosition = this._calculatePopup();

          //calc popup width by btn(for resize of view)
          var btnW = html.getStyle(this.checkedBtn, 'width');
          // if(this.controlType === 'multipleDynamic' || this.controlType === 'multiplePredefined'){
          //   btnW = btnW + 8;
          // }
          this._cbxWidth = btnW;

          if(!isNewExpr && this.cbxPopup && this.cbxPopup.domNode && !this.layerDataChanged){
            if(!this.popupIsNoData){
              this.cbxPopup.show();
              this._resetPopupStyles();
              if(this.listSelect.valueInput &&
                html.getStyle(this.listSelect.searchKeyInput, 'display') === 'block'){
                this.listSelect.valueInput.focus();
              }else{
                this.listSelect.listContent.focus();
              }
              this.listSelect.queryState = false;
            }else{
              this._checkIfNoData([]);
            }
          }else{
            this.isPopupLoading = true;
            if(!this.isLoadDataAdvanced){//hide spinning icon if loadDataAdvanced at runtime
              this._showDataQueryingIcon();
            }
            var def = this.showContent(true); //get data,need pages
            def.then(lang.hitch(this, function(isNoData){
              this.isPopupLoading = false;
              this._hideDataQueryingIcon();
              this.popupIsNoData = isNoData;
              if(!isNoData){
                // var popupName = this.layerDefinition.name + '(' + this.fieldName + ')';
                var hiddenAfterInit = this.isLoadDataAdvanced;
                var popupW = this._cbxWidth;
                this.cbxPopup = new Popup({
                  width: popupW,
                  height: this._cbxHeight,
                  content: this.listSelect.domNode, //need a dom, not html string

                  enableMoveable: false,
                  hasTitle: false,
                  hasOverlay: false,
                  contentHasNoMargin: true,
                  moveToCenter: false,
                  customPosition: {left: popupPosition.left, top: popupPosition.top},
                  hiddenAfterInit: hiddenAfterInit,
                  useFocusLogic: false,
                  onClose: lang.hitch(this, function () {
                    this.cbxPopup.hide();
                    return false;
                  }),
                  buttons: []
                });
                //update popup UI for this dijit
                this.cbxPopup.setDomNodeStyls({'border-radius': 0, 'border': '1px solid #999'});

                this.cbxPopup.on("popupHasInitedSuccessfully", lang.hitch(this, function(ifWindowResize){
                  this._resetPopupStyles(false, true);
                  if(ifWindowResize){//when window resizes
                    return;
                  }
                  if(this.listSelect.valueInput &&
                    html.getStyle(this.listSelect.searchKeyInput, 'display') === 'block'){
                    this.listSelect.valueInput.focus();
                  }else{
                    this.listSelect.listContent.focus();
                  }
                }));
              }else{
                this._clearCheckedTxt();
              }
              if(this.isLoadDataAdvanced){
                this.isLoadDataAdvanced = false;
              }
            }), lang.hitch(this, function(err){
              this.isPopupLoading = false;
              console.log(err);
              def.reject(err);
            }));
          }
          // if(evt){
          //   evt.stopPropagation();
          // }
        },

        //set popup styles by item list
        _itemContainerH: 300,
        _resetPopupStyles: function(isSearch, isInit){
          var _cbxHeight = this._itemContainerH;
          var _itemH = html.getStyle(this.listSelect.listContent,'height');

          if(_itemH === 0 && this.cbxPopup && this.cbxPopup.domNode &&
            html.getStyle(this.cbxPopup.domNode, 'display') === 'none'){
            _itemH = this.popupInitHeight;
          }

          var itemsH = _itemH;
          if(isInit){
            this.popupInitHeight = itemsH;
          }

          //show loadMore btn
          if(isSearch && !this.listSelect.codedValues && !this.pageControlForQuery._isUniqueValueCacheFinish){
            itemsH = itemsH + 25;
          }

          if(this.pageControlForQuery._isUniqueValueCacheFinish &&
            html.getStyle(this.listSelect.noDataTips, 'display') === 'block'){
            itemsH = itemsH + 30;
          }
          _cbxHeight = itemsH < _cbxHeight ? itemsH : _cbxHeight;

          html.setStyle(this.listSelect.listContainer, 'height', _cbxHeight + 'px');
          html.setStyle(this.listSelect.selectedContainer, 'height', _cbxHeight + 30 + 'px');

          if(this.controlType === "multipleDynamic"){
            _cbxHeight = _cbxHeight + 30 + 30;
          }else if(this.controlType === "uniqueDynamic"){
            _cbxHeight = _cbxHeight + 30;
          }
          // else if(this.selectUI === 'dropdown'){//predefined
          //   _cbxHeight = _cbxHeight + 10;
          // }
          this._cbxHeight = _cbxHeight + 10;
          // html.setStyle(this.cbxPopup.domNode, 'height', this._cbxHeight + 'px');

          //calc popup width by btn's position and size (for resize of view)
          var popupPosition = this._calculatePopup();
          this._cbxWidth = html.getStyle(this.checkedBtn, 'width');
          this.cbxPopup.setCustomPosition(popupPosition.left, popupPosition.top, this._cbxWidth, this._cbxHeight);

          this._resetItemWidth();
        },

        //reset item text width
        _resetItemWidth: function(){
          var _itemLabelW = this._cbxWidth - 20;
          if(this.controlType === "uniqueDynamic" ||
            (this.runtime && this.controlType === 'uniquePredefined' && this.selectUI === 'dropdown') ||
            (!this.runtime && (this.controlType === "multiplePredefined" || this.controlType === "uniquePredefined"))){
            _itemLabelW = _itemLabelW;
          }else if(this.runtime && this.selectUI !== 'dropdown' &&
            (this.controlType === 'uniquePredefined' || this.controlType === 'multiplePredefined')){
            _itemLabelW = _itemLabelW - 15;
          }else{
            _itemLabelW = _itemLabelW - 30; //delete input's width
          }
          if(window.isRTL){
            _itemLabelW = _itemLabelW - 3;
          }
          this.listSelect._itemLabelW = _itemLabelW;
          var items = query('.item .label', this.listSelect.listContent);
          items.style({
            'max-width': _itemLabelW + 'px'
          });
        },

        _setValueForStaticValues: function(valueLabels){
          this.listSelect.codedValues = true;
          this.listSelect._updateCheckedLabelList(this.codedValues);
          if(valueLabels){
            this.pageControlForQuery._codedvalueCache = valueLabels;
            var isNoData = this._checkIfNoData(valueLabels);
            if(!isNoData){
              this.listSelect.disPlayLabel = 'label';
              this.listSelect.setCBXData(valueLabels, true, true);
            }
            return isNoData;
          }
          return false;
        },

        _checkIfNoData: function(dataList){
          if(this.runtime && this.selectUI === 'dropdown'){
            if(dataList && dataList.length > 0){
              this._resetPromptLabel(false);
              return false;
            }
            // var valObj = this.getValueObject();
            // if(valObj && ((lang.isArray(valObj.value) && valObj.length > 0) ||
            //   (valObj.value && valObj.value !== 0) ||
            //    valObj.value === 0
            // )){
            //   return false;
            // }
            else{
              if(!this.msgDiv){
                this.msgDiv = document.createElement('div');
                html.addClass(this.msgDiv, "jimu-filter-list-value-provider-tip-container");
                this.msgDiv.innerHTML = this.noDataTips;
                this.checkedBtn.parentNode.appendChild(this.msgDiv);
              }else{
                html.setStyle(this.msgDiv, "display", "block");
              }
              this._resetPromptLabel(true);
              return true;
            }
          }else{
            this._resetPromptLabel(false);
            return false;
          }
        },

        getDijits: function(){
          return [this.listSelect];
        },

        //for displaying codedvalue's description
        _setCheckedName: function(value, codedValues){
          var newValue = value;
          codedValues = codedValues ? codedValues : this.codedValues;
          if(codedValues){
            var isExist = false;
            for(var key = 0; key < codedValues.length; key ++){
              var item = codedValues[key];
              if(item.value === value){
                newValue = item.label;
                isExist = true;
                break;
              }
            }
            if(!isExist){
              // newValue = '';
              // newValue = this.isNumberField ? null : '';
              newValue = this.emptyStr;
              this.valueList = [];
              if(this.listSelect){
                this.listSelect.checkedList = [];
                this.listSelect.checkedLabelList = [];
              }
            }
          }else{
            if(value === undefined){
              newValue = this.emptyStr;
              html.addClass(this.checkedNameDiv, 'checkedEmptyNameDiv');
            }else{
              html.removeClass(this.checkedNameDiv, 'checkedEmptyNameDiv');
            }
          }
          this._setCheckedNameDivText(newValue);
        },

        setValueObject: function(valueObj){
          valueObj.value = (valueObj.value || valueObj.value === 0)? valueObj.value: [];
          this.valueList = valueObj.value;
          this.enableEmpty = valueObj.enableEmpty;
          this.listSelect.enableEmpty = valueObj.enableEmpty;

          if(this.controlType === 'multipleDynamic'){
            this.checkedNum.innerText = this.valueList.length;
            if(this.isLoadDataAdvanced){
              this._checkedBtnEvent();
            }
          }else if(this.controlType === 'uniqueDynamic'){
            // this._setCheckedNameDivText(this.valueList);
            var uniqueVal = this.valueList;
            if(lang.isArray(uniqueVal) && uniqueVal.length === 0){
              uniqueVal = undefined;
            }
            this._setCheckedName(uniqueVal);
            this.valueList = [this.valueList];

            //overwrite date format as mapviewer configured.
            if(uniqueVal && this.fieldInfo.type === 'esriFieldTypeDate'){
              //get current date with correct precision from date configured
              var currentDate = jimuUtils.getDateByDateTimeStrAndFormat(uniqueVal, this.fieldPopupInfo);
              //get current date in correct format for config
              var currentDateStr = jimuUtils.getDateTimeStrByFieldInfo(currentDate, this.fieldPopupInfo);
              //get current date in correct format for displaying
              var newValue = jimuUtils.localizeDateByFieldInfo(currentDate, this.fieldPopupInfo);//current format
              this._setCheckedName(newValue);
              this.valueList = [currentDateStr];
            }
            if(this.isLoadDataAdvanced){
              this._checkedBtnEvent();
            }
          }else{
            this.emptyStr = valueObj.emptyLabel ? valueObj.emptyLabel : this.emptyStr;
            this.listSelect.emptyStr = this.emptyStr;
            if(this.runtime && this.selectUI === 'dropdown'){
              var checkedStrsList = [];
              if(this.disPlayLabel === 'value'){
                this.getCheckedList(this.valueList);
                checkedStrsList = this.listSelect.checkedList;
              }else{
                checkedStrsList = this.getCheckedStrsList(this.valueList);//init
              }
              if(this.controlType === 'uniquePredefined'){
                if(this.listSelect.checkedList.length > 0){
                  this._setCheckedNameDivText(checkedStrsList[0]);
                  // this._setCheckedName(checkedStrsList[0]);
                }else{
                  var emptyStr = valueObj.enableEmpty ? this.emptyStr : '';
                  this._setCheckedNameDivText(emptyStr);
                }
              }else{
                this.checkedNum.innerText = checkedStrsList.length;
              }
            }
            this.showContent(true);
            setTimeout(lang.hitch(this, function(){
              this._cbxWidth = html.getStyle(this.listSelect.listContent, 'width');
              this._resetItemWidth();
            }), 50);
          }
        },

        _getCheckedNameDivText: function(){
          return this.checkedNameDiv.textContent || this.checkedNameDiv.innerText || '';
        },

        _setCheckedNameDivText: function(newValue){
          if(this.isNumberField && typeof newValue === 'number'){
            var valueLabel = jimuUtils._getValues(this.layerDefinition, this.fieldPopupInfo,
              this.fieldName, [newValue]);
            newValue = valueLabel[0].label;
          }
          if(this.checkedNameDiv.textContent){
            this.checkedNameDiv.textContent = newValue;
          }else{
            this.checkedNameDiv.innerText = newValue;
          }
        },

        tryGetValueObject: function(){
          if(this.isValidValue()){
            return this.getValueObject();
          }else if(this.isEmptyValue()){
            var value = null;
            if(this.controlType === 'multipleDynamic' || this.controlType === 'multiplePredefined'){//multiple types
              value = [];
            }else if(this.shortType === 'string'){
              value = '';
            }else{
              value = null;
            }
            return {
              "isValid": true,
              "type": this.partObj.valueObj.type,
              "value": value
            };
          }
          return null;
        },

        getValueObject: function(){
          if(this.isValidValue()){//no value and no askForValue
            var values;
            if(this.controlType === 'multipleDynamic' || this.controlType === 'uniqueDynamic'){
              values = this.listSelect.getListCheckedValues(); //valsArray
            }else{
              values = this.listSelect.getListValues(); //valsObj
            }
            if(this.controlType === 'uniqueDynamic'){
              values = lang.isArray(values) ? values[0] : values;
            }
            return {
              "isValid": true,
              "type": this.partObj.valueObj.type,
              "value": values
            };
          }
          return null;
        },

        setRequired: function(required){
          this.listSelect.set("required", required);
        },

        _showDataQueryingIcon: function(){
          if(!this._validatingNode){
            this._validatingNode = html.create('div', {
              'class': 'jimu-circle-loading'
            }, this.checkedBtn);
          }
          html.setStyle(this._validatingNode, 'display', 'block');
        },

        _hideDataQueryingIcon: function(){
          if(this._validatingNode){
            html.setStyle(this._validatingNode, 'display', 'none');
          }
        },

        _showLoadingIcon: function(){
          if(this.listSelect && this.listSelect.listContainer){
            html.addClass(this.listSelect.listContainer, 'jimu-circle-loading');
          }
        },

        _hideLoadingIcon: function(){
          if(this.listSelect && this.listSelect.listContainer){
            html.removeClass(this.listSelect.listContainer, 'jimu-circle-loading');
          }
        },

        destroy: function() {
          if(this._multipleSelectProviderEventHandler){
            document.removeEventListener('click', this._multipleSelectProviderEventHandler, {capture: true});
          }
          if(this.cbxPopup && this.cbxPopup.domNode){
            this.cbxPopup.onClose = lang.hitch(this, function () {
              return true;
            });
            this.cbxPopup.close();
          }
          this.inherited(arguments);
        },

        destroyProvider: function(){
          if(this.listSelect){
            this.listSelect.destroy();
          }
          this.listSelect = null;
        }
      });
  });