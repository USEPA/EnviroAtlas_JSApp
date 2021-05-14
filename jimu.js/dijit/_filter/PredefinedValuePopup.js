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
    'dojo/Deferred',
    'dojo/_base/html',
    'dojo/_base/array',
    'dojo/_base/declare',
    'dojo/Evented',
    // 'dojo/on',
    'dojo/query',
    './ValueProvider',
    './EditTable',
    './AdvancedListValueSelect',
    'dijit/_TemplatedMixin',
    'dijit/_WidgetsInTemplateMixin',
    'dojo/text!./PredefinedValuePopup.html',
    'dojo/store/Memory',
    'jimu/utils',
    'jimu/dijit/Popup',
    'jimu/dijit/_filter/pageControlForQuery',
    'dojox/form/CheckedMultiSelect'
  ],
    function(lang, Deferred, html, array, declare, Evented, query, ValueProvider,
      EditTable, AdvancedListValueSelect, _TemplatedMixin,
      _WidgetsInTemplateMixin,template, Memory, jimuUtils, Popup, pageControlForQuery, CheckedMultiSelect) {

    return declare([ValueProvider, _TemplatedMixin, _WidgetsInTemplateMixin, Evented], {
        templateString: template,
        codedValues: null,//[{value,label}] for coded values and sub types
        staticValues: null,//[{value,label}]
        showNullValues: false,//show null values
        cbxPopup: null,

        pageSize: 1000, //page size
        pageIndex:1,  //current page

        //optional
        selectUI: null, //dropdown, expanded

        postMixInProperties:function(){
          this.inherited(arguments);
          this.CommonNls = window.jimuNls.common;
          this.Nls = window.jimuNls.filterBuilder;
          this.emptyStr = window.apiNls.widgets.FeatureTable.empty;
        },

        postCreate: function(){
          this.inherited(arguments);
          this.selectUI = this.selectUI ? this.selectUI : 'dropdown';
          html.addClass(this.domNode, 'jimu-filter-mutcheck-list-value-provider');
          // this.layerName.innerText = this.layerDefinition.name;

          this.controlType = 'unique';  //unique, multiple
          if(this.providerType === 'MULTIPLE_PREDEFINED_VALUE_PROVIDER'){
            this.controlType = 'multiple';
          }
          this.isNumberField = jimuUtils.isNumberField(this.fieldInfo.type);
          if(!this.editTable){
            this.editTable = new EditTable({
              tableType: this.controlType,
              dataList: [],
              codedValues: this.codedValues,
              emptyStr: this.emptyStr,
              customValue: this.Nls.addValuePlaceHolder,
              customLabel: this.Nls.addLabelPlaceHolder,
              isNumberField: this.isNumberField
            });
            this.editTable.placeAt(this.tableContent);
            this.editTable.on("editTable_openListSelectByName", lang.hitch(this, this._showListSelectByTable));
            this.editTable.on("editTable_itemChanged", lang.hitch(this, this._editTableItemChanged));
            this.editTable.on("editTable_getValLabelsArrayForNumber",
              lang.hitch(this, this._getValLabelsArrayForNumber));
          }

          this.supportPaing = true;

          if(!this.pageControlForQuery){
            this.pageControlForQuery = new pageControlForQuery({
              pageSize: this.pageSize,
              pageIndex: 1,
              layerUrl: this.url,
              // layerInfo: this.layerInfo,
              fieldInfo: this.fieldInfo,
              queryWhere: '1=1',
              layerDefinition: this.layerDefinition,
              fieldPopupInfo: this.fieldPopupInfo,
              // spatialReference: this.layerInfo.map.spatialReference,
              isNumberField: this.isNumberField
            });
          }

          if(!this.listSelect){
            // this._initAdvancedListValueSelect();
            this.listSelect = new AdvancedListValueSelect({
              emptyStr: this.emptyStr,
              runtime: this.runtime,
              pageSize: this.pageSize,
              // selectType: 'multiple',// when it's in header
              selectType: 'unique',//when it's for single item
              controlType: 'predefined',
              dataList:[],
              selectedDataList:[],
              isNumberField: this.isNumberField
            });
            // this.listSelect.placeAt(this.listSelectStore);
            // this.own(topic.subscribe("AdvancedListValueSelect/itemChecked", lang.hitch(this, this._createTarget)));

            this.listSelect.on("advancedListValueSelect_itemChecked", lang.hitch(this, this._createTarget));
            this.listSelect.on("advancedListValueSelect_itemUnChecked", lang.hitch(this, this._destoryTarget));
            this.listSelect.on("advancedListValueSelect_addNextPage", lang.hitch(this, this._addNextPage));
            this.listSelect.on("advancedListValueSelect_searchKey", lang.hitch(this, this._searchKey));
            this.listSelect.on("advancedListValueSelect_searchKeyLocal", lang.hitch(this, this._searchKeyLocal));

            this.listSelect.on("advancedListValueSelect_itemCheckedForPredefined",
              lang.hitch(this, this._createTargetForPredefined));
          }

          if(!this.mutiValuesSelect){
            this.mutiValuesSelect = new CheckedMultiSelect({
              multiple: true,
              required: false,
              intermediateChanges: true, //Fires onChange for each value change or only on demand
              style: {'width':'100%'}
            });
          }

          //event
          this._multipleSelectProviderEventHandler = lang.hitch(this, this._multipleSelectProviderEvent);
          document.addEventListener('click', this._multipleSelectProviderEventHandler);
          /*
          this.own(on(document, 'click', lang.hitch(this, function(evt){
            var target = event.target || event.srcElement;
            if((this.editTable && target !== this.editTable.searchTarget) &&
              (this.cbxPopup && this.cbxPopup.domNode && !html.isDescendant(target, this.cbxPopup.domNode))){
              this._createTargetForPredefined();
              evt.stopPropagation();
              return;
            }
            if(this.editTable && target === this.editTable.searchTarget &&
              (this.cbxPopup && this.cbxPopup.domNode)){ //click search
              if(html.getStyle(this.cbxPopup.domNode, 'display') === 'block'){
                html.setStyle(this.cbxPopup.domNode, 'display', 'none');
              }else{
                html.setStyle(this.cbxPopup.domNode, 'display', 'block');
              }
              return;
            }

            var isIn = this._isInSelectPopup(target);
            if(isIn || this.runtime){ //always displaying on runtime page
              evt.stopPropagation();
              return;
            }else{
              html.setStyle(this.valuesPopupNode, 'display', 'none');
            }
          })));
          */
          // this.own(on(this.valuesPopupNode, 'click', lang.hitch(this, function(evt){
          //   evt.stopPropagation();
          // })));

          //[{id,value,label}]
          var store = new Memory({idProperty:'id', data: []});
          this.listSelect.set('store', store);
        },

        _multipleSelectProviderEvent: function(event){
          var target = event.target || event.srcElement;
          var isSearchBtn = html.isDescendant(target, this.editTable.searchBtn);
          if(this.editTable && this.cbxPopup && this.cbxPopup.domNode){
            if(isSearchBtn){ //click search btn
              if(html.getStyle(this.cbxPopup.domNode, 'display') === 'block'){
                html.setStyle(this.cbxPopup.domNode, 'display', 'none');
              }else{
                html.setStyle(this.cbxPopup.domNode, 'display', 'block');
              }
            }else if(!html.isDescendant(target, this.cbxPopup.domNode)){ //other space
              this._createTargetForPredefined();
            }
            event.stopPropagation();
            return;
          }

          var isIn = this._isInSelectPopup(target);
          if(isIn || this.runtime){ //always displaying on runtime page
            event.stopPropagation();
            return;
          }else{
            html.setStyle(this.valuesPopupNode, 'display', 'none');
          }
        },

        _initAdvancedListValueSelect: function(){
          this.pageControlForQuery.pageIndex = 1;
          this.pageControlForQuery.isKeyQueryLoader = false;

          this.listSelect = new AdvancedListValueSelect({
            emptyStr: this.emptyStr,
            runtime: this.runtime,
            pageSize: this.pageSize,
            isCacheFinish: this.pageControlForQuery._isUniqueValueCacheFinish,
            // selectType: 'multiple',// when it's in header
            selectType: 'unique',//when it's for single item
            controlType: 'predefined',
            dataList:[],
            selectedDataList:[],
            isNumberField: this.isNumberField
          });
          // this.listSelect.placeAt(this.listSelectStore);
          // this.own(topic.subscribe("AdvancedListValueSelect/itemChecked", lang.hitch(this, this._createTarget)));

          this.listSelect.on("advancedListValueSelect_itemChecked", lang.hitch(this, this._createTarget));
          this.listSelect.on("advancedListValueSelect_itemUnChecked", lang.hitch(this, this._destoryTarget));
          this.listSelect.on("advancedListValueSelect_addNextPage", lang.hitch(this, this._addNextPage));
          this.listSelect.on("advancedListValueSelect_searchKey", lang.hitch(this, this._searchKey));
          this.listSelect.on("advancedListValueSelect_searchKeyLocal", lang.hitch(this, this._searchKeyLocal));

          this.listSelect.on("advancedListValueSelect_itemCheckedForPredefined",
            lang.hitch(this, this._createTargetForPredefined));
        },

        _isInSelectPopup:function(target){
          var classList = ['dijitCheckBoxInput', 'dojoxMultiSelectItemLabel', 'dojoxMultiSelectItemBox',
            'dojoxMultiSelectItem', 'dojoxCheckedMultiSelectWrapper', 'dojoxCheckedMultiSelect',
            'value-type-popup', 'popupOper', 'pageItem'];
          var isIn = false;
          for(var key = 0;key <= classList.length; key ++ ){
            if(html.hasClass(target, classList[key])){
              isIn = true;
              break;
            }
          }
          return isIn;
        },

        //for list select popup
        // _createTarget: function(name){
        //   this.editTable._createTarget(name);
        // },

        //for editTable
        _createTarget: function(){
          this.editTable._createTarget('', '', '', '', true);
          this._editTableItemChanged();
        },

        _createTargetForPredefined: function(value, name){
          this.editTable._setNewLabel(value, name);
          this.cbxPopup.close();
          this._editTableItemChanged();
        },

        _destoryTarget:function(name){
          this.editTable._destroyTarget(name);
          this._editTableItemChanged();
        },

        _editTableItemChanged: function(){
          if(!this.runtime){
            var valueObj = this.getValueObject();
            this._setApplyState(valueObj.value.length);
          }
        },

        _setApplyState: function(state){
          this.emit("predefinedValuePopup_setApplyBtnState", state);
        },

        _cbxWidth: 245,
        _cbxHeight: 340,
        isPopupLoading: false,
        _showListSelectByTable: function(name){
          if(this.isPopupLoading){
            return;
          }
          this._initAdvancedListValueSelect();//init select & pagecontrol
          this.valueList = [name];
          this.getCheckedList(this.valueList);

          var rPosition = html.position(this.editTable.searchBtn);
          var popupPosition = {
            left: rPosition.x - 226,
            top: rPosition.y + 30
          };
          if(window.isRTL){
            popupPosition.left = rPosition.x;
          }

          this.cbxPopup = new Popup({
            width: this._cbxWidth,
            height: this._cbxHeight,
            content: this.listSelect.domNode,
            enableMoveable: false,
            hasTitle: false,
            hasOverlay: false,
            contentHasNoMargin: true,
            moveToCenter: false,
            customPosition: {left: popupPosition.left, top: popupPosition.top},
            useFocusLogic: false,
            buttons: []
          });
          //update popup UI for this dijit
          this.cbxPopup.setDomNodeStyls({'border-radius': 0, 'border': '1px solid #999'});
          this.cbxPopup.on("popupHasInitedSuccessfully", lang.hitch(this, function(){
            var rPosition = html.position(this.editTable.searchBtn);
            var popupPosition = {
              left: rPosition.x - 226,
              top: rPosition.y + 30
            };
            if(window.isRTL){
              popupPosition.left = rPosition.x;
            }
            this.cbxPopup.setCustomPosition(popupPosition.left, popupPosition.top);
          }));
          if(this.listSelect.valueInput){
            this.listSelect.valueInput.focus();
          }

          this._showLoadingIcon();
          this.isPopupLoading = true;
          this._valueLabels().then(lang.hitch(this, function(valueLabels) {
            this.isPopupLoading = false;
            this._hideLoadingIcon();
            if(valueLabels === true){
            }else{
              var ifCheck = false;
              if(this.valueList && this.valueList.length !== 0){
                ifCheck = true;
              }
              this.listSelect.setCBXData(valueLabels,ifCheck);
            }
          }));
        },

        _valueLabels: function(){
          var def = new Deferred();
          this.listSelect.codedValues = false;
          this.listSelect.disPlayLabel = 'label';
          if(this.staticValues){
            this._setValueForStaticValues(this.staticValues);
            def.resolve(true);
            return def;
          } else if(this.codedValues){
            if(this.filterCodedValue){
              this.listSelect.codedValues = true;
            }else{
              this._setValueForStaticValues(this.codedValues);
              def.resolve(true);
              return def;
            }
          }
          this.pageControlForQuery.queryByPage(true).then(lang.hitch(this, function(valueLabels){ //for multiple
            def.resolve(valueLabels);
          }), lang.hitch(this, function(err){
            console.log(err);
            this._hideLoadingIcon();
            def.reject(err);
          }));
          return def;
        },

        _setValueForStaticValues: function(valueLabels){
          this.listSelect.codedValues = true;
          if(valueLabels){
            this.pageControlForQuery._codedvalueCache = valueLabels;
            valueLabels = valueLabels.length > 0 ? valueLabels : [];
            // this.listSelect.disPlayLabel = 'label';
            this.listSelect.setCBXData(valueLabels, true, true);
          }
        },

        //types: dropdown, expanded
        _changeDisplayType: function(evt){
          var target = evt.target || evt.srcElement;
          var option;
          if(html.hasClass(target, 'option')){
            option = target;
          }else{
            option = jimuUtils.getAncestorDom(target, function(dom){
              return html.hasClass(dom, 'option');
            }, 2);
          }
          if(!html.hasClass(option, 'checked')){
            html.addClass(option, 'checked');
            var otherOption = query('.' + this.selectUI + 'Option ', this.displayTypes)[0];
            html.removeClass(otherOption, 'checked');
            // this.selectUI = html.hasClass(option, 'dropdownOption') ? 'dropdown' : 'expanded';
            this.selectUI = this.selectUI === 'expanded' ? 'dropdown' : 'expanded';
          }
        },

        _setDisplayTypeStyle: function(){
          var titleDom = query('.title', this.displayTypes)[0];
          var labelDoms = query('.label', this.displayTypes);
          var w = (html.getStyle(this.displayTypes, 'width') - html.getStyle(titleDom, 'width') - 2 * 40) / 2;
          var leftLabelW = html.getStyle(labelDoms[0], 'width');
          leftLabelW = leftLabelW < w ? leftLabelW : w;
          var rightLabelW = html.getStyle(labelDoms[1], 'width');
          rightLabelW = rightLabelW < w ? rightLabelW : w;
          html.setStyle(labelDoms[0], 'width', leftLabelW + 'px');
          html.setStyle(labelDoms[1], 'width', rightLabelW + 'px');
        },

        _addNextPage: function(){
          if(!this.listSelect){
            return;
          }
          this._showLoadingIcon();
          var def = this.pageControlForQuery.queryByPage(this.listSelect.ifFristPage);
          def.then(lang.hitch(this, function(valueLabels){
            this.listSelect.isCacheFinish = this.pageControlForQuery._isUniqueValueCacheFinish;
            this.listSelect.setCBXData(valueLabels, true);
            this._hideLoadingIcon();
          }), lang.hitch(this, function(err){
            console.log(err);
            this._hideLoadingIcon();
          }));
        },

        //this.allFeatures = [];
        _searchKey: function(name){
          if(!this.listSelect){
            return;
          }
          this._showLoadingIcon();
          this.pageControlForQuery._searchKey(name).then(lang.hitch(this, function(result) {
            this.listSelect.setCBXContentBySearch(result);
            this._hideLoadingIcon();
          }), lang.hitch(this, function(err){
            console.log(err);
            this._hideLoadingIcon();
          }));
        },

        _searchKeyLocal: function(name){
          if(!this.listSelect){
            return;
          }
          this._showLoadingIcon();
          var result = this.pageControlForQuery._searchKeyLocal(name);
          this.listSelect.setCBXContentBySearch(result);
          this._hideLoadingIcon();
        },

        _handlerPageValues: function(){

        },

        getCheckedList: function(valueList){
          this.listSelect.checkedList = [];
          if(this.isNumberField){
            array.forEach(valueList, lang.hitch(this, function(item) {
              this.listSelect.checkedList.push(parseFloat(item));
            }));
          }else{
            this.listSelect.checkedList = valueList;
          }
        },

        _showPopup:function(){
          // this._showLoadingIcon();
          //refresh values
          var valueList = this.getValueObject().valueList;
          this.valueList = valueList === null ? undefined : valueList;
          // this.listSelect.checkedList = this.valueList;
          // if(this.listSelect.vallueInput === undefined){
          //   this.cbxPopup = null;
          // }
          this.getCheckedList(this.valueList);
          if(this.cbxPopup){
            // this.getCheckedList(this.valueList);
            this.listSelect.checkCBXItems(false);
            // this.listSelect.setCBXData(valueLabels,true);
            this.cbxPopup.show();
            // this._hideLoadingIcon();
            return;
          }
          var popupName = this.layerDefinition.name + '(' + this.fieldName + ')';
          this.cbxPopup = new Popup({
            width: 355,
            height: 596,
            content: this.listSelect.domNode, //need a dom, not html string
            titleLabel: popupName,
            isResize: false,
            useFocusLogic: false,
            // onClose: function(){return false},
            onClose: lang.hitch(this, function () {
              //save dom
              // this.cbxPopup.content = null;
              // html.place(this.listSelect.domNode, this.listSelectStore);
              //continue
              this.cbxPopup.hide();
              return false;
            }),
            buttons: []
          });

          this._showLoadingIcon();
          this.pageControlForQuery.queryByPage().then(lang.hitch(this, function(valueLabels) {
            this._hideLoadingIcon();

            var ifCheck = false;
            if(this.valueList && this.valueList.length !== 0){
              ifCheck = true;
            }
            // var cbxData = this.listSelect.setCBXData(valueLabels,ifCheck);
            this.listSelect.setCBXData(valueLabels,ifCheck);
          }));
        },

        getDijits: function(){
          return [this.mutiValuesSelect];
        },

        setValueObject: function(valueObj){//, isFromConfig
          valueObj.value = valueObj.value? valueObj.value: [];

          var selectUI = valueObj.selectUI ? valueObj.selectUI : this.selectUI;
          var typeOption = query('.' + selectUI + 'Option ', this.displayTypes)[0];
          html.addClass(typeOption, 'checked');

          var newValueLabels = null;//get values' format datas on the first colum in table
          if(this.isNumberField){
            var valsArray = [];
            for(var key = 0; key < valueObj.value.length; key ++){
              valsArray.push(valueObj.value[key].value);
            }
            newValueLabels = this._getValLabelsArrayForNumber(false, valsArray);
          }
          this.editTable.emptyLabel = valueObj.emptyLabel;
          this.editTable.enableEmpty = valueObj.enableEmpty;
          this.editTable.setListValues(valueObj.value, newValueLabels);
        },

        _getValLabelsArrayForNumber: function(isTrigger, valsArray){
          var valueLabels = jimuUtils._getValues(this.layerDefinition, this.fieldPopupInfo, this.fieldName, valsArray);
          if(isTrigger){
            this.editTable.currentValLabel = valueLabels[0].label;
          }
          return valueLabels;
        },

        tryGetValueObject: function(){
          if(this.isValidValue()){
            return this.getValueObject();
          }else if(this.isEmptyValue()){
            return {
              "isValid": true,
              "selectUI": this.selectUI,
              "type": this.partObj.valueObj.type,
              "value": [],
              "valueList": []
            };
          }
          return null;
        },

        getValueObject: function(){
          if(this.isValidValue()){
            var valsObj = this.editTable.getListValues();
            var result = {
              "isValid": true,
              "selectUI": this.selectUI,
              "type": this.partObj.valueObj.type,
              "value": valsObj.list, //valueObj list
              "valueList": valsObj.valueList //value list
            };
            if(this.controlType === 'unique'){
              result.emptyLabel = valsObj.emptyLabel;
              result.enableEmpty = valsObj.enableEmpty;
            }
            return result;
          }
          return null;
        },

        setRequired: function(required){
          this.mutiValuesSelect.set("required", required);
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
            document.removeEventListener('click', this._multipleSelectProviderEventHandler);
          }
          this.inherited(arguments);
        },

        destroyProvider:function(){
          if(this.editTable){
            this.editTable.destroy();
          }
          // this.editTable = null;
          if(this.listSelect){
            this.listSelect.destroy();
          }
          this.listSelect = null;

          this.destroy();
          html.destroy(this.domNode);

          // this.inherited(arguments);
        }
      });
  });