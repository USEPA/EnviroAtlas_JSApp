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
    'dojo/Evented',
    'dojo/on',
    'dojo/keys',
    'dojo/dom-attr',
    'dojo/_base/declare',
    'dijit/_WidgetBase',
    'dojo/query',
    'dijit/form/ValidationTextBox',
    'dijit/form/NumberTextBox',
    'dijit/_TemplatedMixin',
    'dijit/_WidgetsInTemplateMixin',
    'dojo/text!./EditTable.html',
    'jimu/utils'
  ],
    function(lang, html, Evented, on, keys, domAttr, declare, _WidgetBase, query,
      ValidationTextBox, NumberTextBox,
      _TemplatedMixin, _WidgetsInTemplateMixin,template, jimuUtils) {

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Evented], {
        templateString: template,
        currentItem: null, //for radio
        dataList:[],
        codedValues: null,

        //optional
        isNumberField: true, //for validate
        tableType: 'unique', //for input[type=radio]

        postMixInProperties:function(){
          this.inherited(arguments);
          this.CommonNls = window.jimuNls.common;
          this.Nls = window.jimuNls.filterBuilder;
        },

        postCreate: function(){
          this.inherited(arguments);
          html.addClass(this.domNode, 'jimu-filter-mutcheck-list-value-provider');

          if(this.tableType === 'unique'){
            this.inputType = 'radio';
            html.addClass(this.listContent, 'radio-items-list-content');
          }else{
            this.inputType = 'checkbox';
          }
        },

        //add dblclick event to item.
        _onListContentDblClicked: function(event){
          // console.log('dbclick...');
          this.isSearch = false;
          var target = event.target || event.srcElement;
          var itemDom = jimuUtils.getAncestorDom(target, function(dom){
            return html.hasClass(dom, 'item');
          }, 3);
          if(!itemDom){
            return;
          }
          if(!(html.hasClass(target, 'name') || html.hasClass(target, 'alias'))){
            return;
          }

          //allow to change emptyLabel
          if(html.hasClass(itemDom, 'empty') && html.hasClass(target, 'name') ){
            return;
          }

          if(this._dijit){//click another when one is active
            this.editState = 'active';
            this.updateInputDivPre = this.updateInputDiv;
            this._dijitPre = this._dijit;
          }else{
            this.editState = 'negative';
          }

          var nodeText = this._getNodeText(target);
          var nodeData = decodeURIComponent(html.getAttr(target, 'data'));
          //custom
          var isCustom = html.hasClass(itemDom, 'custom');
          this.placeHolder = (html.hasClass(target, 'name') && !this.codedValues) ? nodeData : nodeText;
          if(!isCustom){
            this.currentLabel = (this.isNumberField && html.hasClass(target, 'name') && !this.codedValues) ?
              parseFloat(this.placeHolder) : this.placeHolder;//string need to be number when operator is ','
          }else{
            if(html.hasClass(target, 'alias') && this.placeHolder !== this.customLabel){
              this.currentLabel = nodeText;
            }else{
              this.currentLabel = NaN;
            }
          }

          domAttr.set(target, "innerHTML", '');

          var searchHtml = '';
          if(html.hasClass(target, 'name')){
            // '<span class="searchBtn" data-dojo-attach-event="click:_onSearchClicked">Search</span>'
            // searchHtml = '<span class="searchBtn">' + this.CommonNls.search + '</span>';
            // searchHtml = '<div class="searchBtn jimu-icon jimu-icon-search"></div>';
            searchHtml = '<div class="searchBtn"><div class="jimu-icon jimu-icon-down-arrow-8"></div></div>';
          }
          this.updateInputDiv = html.create("div", {
            "class": "updateInputDiv",
            "innerHTML":  '<div class="inputDiv"></div>' + searchHtml
          }, target);
          var inputNode = query('.inputDiv', this.updateInputDiv)[0];
          this.searchBtn = query('.searchBtn', this.updateInputDiv)[0];

          this.own(on(this.updateInputDiv, 'dblclick', lang.hitch(this, function(event){
            // console.log('dbclick..input...');
            event.stopPropagation();
            event.preventDefault();
          })));
          var dijitOptions = {
            required: false,
            intermediateChanges: false,
            value: this.currentLabel
          };
          if(this.codedValues && html.hasClass(target, 'name')){
            dijitOptions.disabled = true;
          }

          if(this.isNumberField && html.hasClass(target, 'name')){ //number
            dijitOptions.constraints = {pattern: "#####0.##########"};
            this._dijit = new NumberTextBox(dijitOptions);
          }else{ //string
            dijitOptions.trim = true;
            this._dijit = new ValidationTextBox(dijitOptions);
          }
          this._dijit.startup();

          this._dijit.on('keydown', (function(e){
            var code = e.keyCode || e.which;
            if (code === keys.ENTER) {
              this._dijit.emit('blur');
            }
          }).bind(this));

          // this._dijit.on('mouseleave', (function(event){
          this._dijit.on('blur', lang.hitch(this, function(){
            // input 1.235.265,256, then:
            //  _dijit._lastInputEventValue='1.235.265,256'
            //  _dijit.displayedValue = '1235265,256'
            //  _dijit.value = 1235265.256
            if(!this._dijit){
              return;
            }
            var newLabel = this._dijit.state !== 'Error'? this._dijit.displayedValue : this.currentLabel;
            if(this.isNumberField && html.hasClass(target, 'name') && this._dijit.state === 'Error'){
              this._dijit.setValue(parseFloat(newLabel));//reset last value when dijit has error.
            }
            newLabel = jimuUtils.sanitizeHTML(newLabel);
            var dijitVal = this._dijit.get('value');
            if(dijitVal === '' || !dijitVal){//back to its previous value('' || NaN)
              newLabel = this.placeHolder;
            }else{
              if(html.hasClass(target, 'name') && (this.placeHolder === this.customValue ||
                (this.placeHolder === 'NaN' && this._dijit.displayedValue !== ''))){//only verify by item's value
                var itemDom = jimuUtils.getAncestorDom(this._dijit.domNode, function(dom){
                  return html.hasClass(dom, 'item');
                }, 4);
                html.removeClass(itemDom, 'custom');
                this.emit("editTable_itemChanged");
              }
            }

            // domAttr.set(this._dijit.domNode.parentNode, "innerHTML", newLabel);
            // domAttr.set(this.updateInputDiv.parentNode, "innerHTML", newLabel);
            this.newLabel = newLabel;

            // setTimeout(lang.hitch(this, this._dijitBlurTimeout), 300);
            setTimeout(lang.hitch(this, function(){
              var newValue, displayTxt, labelTxt, nodeData;
              if(!this.isSearch && this.editState !== 'active'){
                var inputParentNode = this.updateInputDiv.parentNode;
                nodeData = decodeURIComponent(html.getAttr(inputParentNode, 'data'));
                if(html.hasClass(inputParentNode, 'name')){
                  this.currentValLabel = this._dijit.displayedValue === '' ?
                  (nodeData === this.customValue ? this.customValue :
                    (this.isNumberField ? this._getLocalNumber(nodeData) : nodeData)):
                  (this.isNumberField ? this._getLocalNumber(this._dijit.value) : this._dijit.value);
                }else{
                  this.currentValLabel = this._dijit.displayedValue === '' ?
                    (nodeData === this.customLabel ? this.customLabel : nodeData) : this._dijit.displayedValue;
                }
                if(html.hasClass(inputParentNode, 'name') &&
                  (this.newLabel !== 'NaN' && this.newLabel !== this.customValue) &&
                  this._getNodeText(inputParentNode.nextSibling) === this.customLabel){//value triggers label only at first time.
                  labelTxt = this.isNumberField ? this.currentValLabel : this.newLabel;
                  html.setAttr(inputParentNode.nextSibling, 'data', encodeURIComponent(labelTxt));
                  this._setNodeText(inputParentNode.nextSibling, labelTxt);
                  html.setAttr(inputParentNode.nextSibling, 'title', labelTxt);
                }

                newValue = html.hasClass(inputParentNode, 'name') ?
                  (this._dijit.displayedValue === '' ?
                  (nodeData === this.customValue ? this.customValue : nodeData) : this._dijit.value) : this.newLabel;
                html.setAttr(inputParentNode, 'data', encodeURIComponent(newValue));
                displayTxt = html.hasClass(inputParentNode, 'name') ? this.currentValLabel : this.newLabel;
                this._setNodeText(inputParentNode, displayTxt);
                html.setAttr(inputParentNode, 'title', displayTxt);
                this._dijit = null;
                this.isSearch = false;
              }else if(this.editState === 'active'){
                var inputPreParentNode = this.updateInputDivPre.parentNode;
                nodeData = decodeURIComponent(html.getAttr(inputPreParentNode, 'data'));
                if(html.hasClass(inputPreParentNode, 'name')){
                  this.currentValLabel = this._dijitPre.displayedValue === '' ?
                  (nodeData === this.customValue ? this.customValue :
                  (this.isNumberField ? this._getLocalNumber(nodeData) : nodeData)):
                  (this.isNumberField ? this._getLocalNumber(this._dijitPre.value) : this._dijitPre.value);
                }else{
                  this.currentValLabel = this._dijitPre.displayedValue === '' ?
                    (nodeData === this.customLabel ? this.customLabel : nodeData) : this._dijitPre.displayedValue;
                }
                if(html.hasClass(inputPreParentNode, 'name') &&
                  (this.newLabel !== 'NaN' && this.newLabel !== this.customValue) &&
                  (this._getNodeText(inputPreParentNode.nextSibling) === this.customLabel ||
                    this._dijit.value === this.customLabel)){
                  //don't trigger to update label if we click value, then click its label
                  if(html.isDescendant(this.updateInputDiv, inputPreParentNode.nextSibling) ){
                    // this._dijit.set('value', this._dijitPre.value);
                    this._dijit.set('value', this.currentValLabel);
                  }else{
                    labelTxt = this.isNumberField ? this.currentValLabel : this.newLabel;
                    html.setAttr(inputPreParentNode.nextSibling, 'data', encodeURIComponent(labelTxt));
                    this._setNodeText(inputPreParentNode.nextSibling, labelTxt);
                    html.setAttr(inputPreParentNode.nextSibling, 'title', labelTxt);
                  }
                }
                newValue = html.hasClass(inputPreParentNode, 'name') ?
                  (this._dijitPre.displayedValue === '' ?
                  (nodeData === this.customValue ? this.customValue : nodeData) : this._dijitPre.value) : this.newLabel;
                html.setAttr(inputPreParentNode, 'data', encodeURIComponent(newValue));
                displayTxt = html.hasClass(inputPreParentNode, 'name') ? this.currentValLabel : this.newLabel;
                this._setNodeText(inputPreParentNode, displayTxt);
                html.setAttr(inputPreParentNode, 'title', displayTxt);
                this.updateInputDivPre = null;
                this._dijitPre = null;
                this.editState = 'negative';
              }
            }), 300);
            // this._dijit = null;
            this.placeHolder = '';
          }));
          html.setStyle(this._dijit.domNode, 'width', '100%');
          // this._dijit.placeAt(target);
          this._dijit.placeAt(inputNode);

          // this._dijit.onFocus();
          // this._dijit.domNode.focus();
          var input = query('input', this._dijit.domNode)[1];
          // if(this._dijit.get('value') === ''){
          //   domAttr.set(input, "placeholder", this.placeHolder);
          // }
          input.focus();

          if(this.searchBtn){
            this.own(on(this.searchBtn, 'click', lang.hitch(this, function(event){
              if(this.isSearch){//prevent secondary clicks
                // console.log('repeated click');
                return;
              }
              this.isSearch = true;
              var _target = event.target || event.srcElement;
              this.searchTarget = _target;
              this.emit("editTable_openListSelectByName", this.newLabel);
              event.stopPropagation();
              event.preventDefault();
            })));

            if(this.codedValues){
              this.searchBtn.click();
            }
          }
        },

        _getLocalNumber: function(num){
          if(typeof num === 'string'){
            num = parseFloat(num);
          }
          this.emit('editTable_getValLabelsArrayForNumber', true, [num]);
          return this.currentValLabel;
        },

        _setNewLabel: function(value, name){
          var nameNode;
          if(value === undefined && name === undefined){
            if(this._dijit.displayedValue !== ''){
              if(this.codedValues){
                name = this._dijit.displayedValue;
                value = this._getCodeFromCodevalueLabel(name);
              }else{
                value = this._dijit.value;
                name = value;
                if(this.isNumberField && this.newLabel !== this.customValue){
                  name = this._getLocalNumber(value);
                }
              }
            }else{
              value = name = this.customValue;
              if(this.updateInputDiv && this.updateInputDiv.parentNode){
                nameNode = this.updateInputDiv.parentNode;
                var nodeData = decodeURIComponent(html.getAttr(nameNode, 'data'));
                if(nodeData !== this.customValue){
                  value = this.isNumberField ? parseFloat(nodeData) : nodeData;
                  if(this.codedValues){
                    name = this._getLabelFromCodevalue(value);
                  }else{
                    name = this.isNumberField ? this._getLocalNumber(value) : value;
                  }
                }
              }
            }
          }
          if(this.updateInputDiv && this.updateInputDiv.parentNode){
            nameNode = this.updateInputDiv.parentNode;
            if(name !== this.customValue && this._getNodeText(nameNode.nextSibling) === this.customLabel){
              html.setAttr(nameNode.nextSibling, 'data', encodeURIComponent(name));
              this._setNodeText(nameNode.nextSibling, name);
              html.setAttr(nameNode.nextSibling, 'title', name);
            }
            if(!this.codedValues){
              value = value ? value : decodeURIComponent(html.getAttr(nameNode, 'data'));
            }
            html.setAttr(nameNode, 'data', encodeURIComponent(value));
            var itemDom = nameNode.parentNode;
            if(name !== this.customValue){
              html.removeClass(itemDom, 'custom');
            }
            this._setNodeText(nameNode, name);
            html.setAttr(nameNode, 'title', name);
          }
          this.updateInputDiv = null;
          this._dijit = null;
        },

        // _onSearchClicked: function(){
        //   this.emit("editTable_openListSelectByName", 'table');
        // },

        _onListContentClicked: function(event){
          var target = event.target || event.srcElement;
          var itemDom = jimuUtils.getAncestorDom(target, function(dom){
            return html.hasClass(dom, 'item');
          }, 3);
          if(!itemDom){
            return;
          }
          if(html.hasClass(target, 'checkboxEmpty')){
            if(html.hasClass(target, 'checked')){
              html.removeClass(target, 'checked');
            }else{
              html.addClass(target, 'checked');
            }
          }else if(html.hasClass(target, this.inputType)){
            if(this.inputType === 'radio' && this.currentItem === true){
              this.currentItem = this.getCurrentItem();
            }
            if(html.hasClass(target, 'checked')){
              if(this.inputType !== 'radio'){
                html.removeClass(target, 'checked');
              }else if(!html.hasClass(this.currentItem, 'checked')){ //can't unchecked current radio
                html.removeClass(target, 'checked');
              }
            }else{
              if(this.inputType === 'radio' && this.currentItem){
                html.removeClass(this.currentItem, 'checked');
              }
              html.addClass(target, 'checked');
              this.currentItem = target;
            }
          }else if(html.hasClass(target, 'action')){
            // if(html.hasClass(target, 'enabled')){
            //   html.removeClass(target, 'enabled');
            //   html.addClass(target, 'disabled');
            // }else if(html.hasClass(target, 'disabled')){
            //   html.removeClass(target, 'disabled');
            //   html.addClass(target, 'enabled');
            // }else
            if(html.hasClass(target, 'up')){
              if(itemDom.previousElementSibling){
                html.place(itemDom, itemDom.previousElementSibling, 'before');
              }
            }else if(html.hasClass(target, 'down')){
              if(itemDom.nextElementSibling){
                html.place(itemDom, itemDom.nextElementSibling, 'after');
              }
            }else if(html.hasClass(target, 'delete')){
              html.destroy(itemDom);
              this.emit('editTable_itemChanged');
            }
          }
        },

        _getLabelFromCodevalue: function(codevalue){
          var label = codevalue;
          for(var key = 0; key < this.codedValues.length; key ++){
            var item = this.codedValues[key];
            if(item.value === codevalue){
              label = item.label;
              break;
            }
          }
          return label;
        },

        _getCodeFromCodevalueLabel: function(label){
          var codevalue = label;
          for(var key = 0; key < this.codedValues.length; key ++){
            var item = this.codedValues[key];
            if(item.label === label){
              codevalue = item.value;
              break;
            }
          }
          return codevalue;
        },

        _createEmptyTarget: function(dataList){
          var name = this.emptyStr;
          var label = this.emptyLabel ? this.emptyLabel : name;
          var checkedClass = ' checked';
          for(var key = 0; key < dataList.length; key ++){
            if(dataList[key].isChecked){
              checkedClass = '';
              break;
            }
          }
          if(checkedClass === ' checked'){
            this.currentItem = true;
          }
          var dataAttr = "data=\"" + encodeURIComponent(name) + "\"";

          var enableClass = '';
          var enableTitle = this.Nls.emptyValueTips;
          if(dataList.length === 0 || this.enableEmpty){
            enableClass = ' checked';
          }

          var target = html.create("div", {
            "class": 'item empty',
            "innerHTML": '<div class="label name jimu-ellipsis" style="cursor: default;"' + dataAttr + '>' +
                         name + '</div>' +
                         '<div class="label alias jimu-ellipsis-Blanks" data="' + label + '">' + label + '</div>' +
                         '<div class="label ' + this.inputType + checkedClass + ' jimu-ellipsis"></div>' +
                         '<div class="label checkbox checkboxEmpty' + enableClass + ' jimu-ellipsis jimu-flipx" ' +
                         'title="' + enableTitle + '"></div>'
          }, this.listContent);
          return target;
        },

        _createTarget: function(name, nameLabel, label, checkedClass, isCustom){
          var itemClass = 'item';
          if(isCustom){
            name = nameLabel = this.customValue;
            label = this.customLabel;
            itemClass = 'item custom';
          }
          name = (name || name === 0) ? name : ""; //name could be 0 when it's a numberical field.
          nameLabel = nameLabel || "";
          label = label ? label : name;
          checkedClass = checkedClass ? checkedClass : '';
          //save value to nameDom include codedvalue
          var value = name, dataAttr = '';
          if((this.codedValues || this.isNumberField) && name !== this.Nls.addValuePlaceHolder){
            value = this.codedValues ? this._getLabelFromCodevalue(name) : nameLabel;
          }
          var dataValue = this.isNumberField ? name : encodeURIComponent(name);//string maybe has ',""
          dataAttr = "data=\"" + dataValue + "\"";
          var target = html.create("div", {
            "class": itemClass,
            "innerHTML": '<div class="label name jimu-ellipsis-Blanks" ' + dataAttr + '>' +
                         value + '</div>' +
                         '<div class="label alias jimu-ellipsis-Blanks" data="' + label + '">' + label + '</div>' +
                         '<div class="label ' + this.inputType + checkedClass + ' jimu-ellipsis"></div>' +
                         '<div class="actions jimu-float-trailing">' +
                            '<div class="delete action jimu-float-trailing"></div>' +
                            '<div class="down action jimu-float-trailing"></div>' +
                            '<div class="up action jimu-float-trailing"></div>' +
                         '</div>'
          }, this.listContent);
          if(isCustom){
            var nameNode = query('.name', target)[0];
            html.setAttr(nameNode, 'title', name);
            var labelNode = nameNode.nextSibling;
            html.setAttr(labelNode, 'title', label);
          }
          return target;
        },

        _destroyTarget: function(name){
          var labels = query('.item .name', this.listContent);
          for(var key = 0; key < labels.length; key++){
            var label = labels[key];
            var labelTxt = domAttr.get(this._dijit.domNode.parentNode, "innerHTML");
            if(labelTxt === name){
              html.destroy(label.parentNode);
              break;
            }
          }
        },

        getCurrentItem: function(){
          var items = query('.item .radio', this.listContent);
          for(var key = 0; key < items.length; key ++){
            var item = items[key];
            if(html.hasClass(item,'checked')){
              return item;
            }
          }
          return null;
        },

        _getEmptyLabel: function(){
          var labelDom = query('.label.alias', this.listContent.firstChild)[0];
          var label = this._getNodeText(labelDom);
          if(labelDom.children.length){//edit state
            label = this._dijit.state === 'Error' ?
              decodeURIComponent(html.getAttr(labelDom, 'data')) : this._dijit.value;
          }
          label = jimuUtils.sanitizeHTML(label);
          return label;
        },

        _getEmptyStatus: function(){
          // return query('.enabled', this.listContent.firstChild).length;
          var emptyDom = query('.checkboxEmpty', this.listContent.firstChild)[0];
          return html.hasClass(emptyDom, 'checked') ? true : false;
        },

        _getNodeText: function(target){
          return target.textContent || target.innerText || '';
        },

        _setNodeText: function(target, label){
          target.innerHTML = '&nbsp;'; //for inputDom tree
          if(target.textContent){
            target.textContent = label;
          }else{
            target.innerText = label;
          }
        },

        getListValues: function(){
          this.listItemsArray = [];//['a','b','c'];
          this.listValuesArray = [];
          var items = query('.item .name',this.listContent);
          var firstKey = this.inputType === 'radio' ? 1 : 0;
          for(var key = firstKey; key < items.length; key ++){
            var item = items[key];
            var parentDom = jimuUtils.getAncestorDom(item, function(dom){
              return html.hasClass(dom, 'item');
            }, 3);
            if(html.hasClass(parentDom, 'custom')){//delete item if value does not update
              continue;
            }
            var itemVal = this._getNodeText(item);
            var itemData = decodeURIComponent(html.getAttr(item, 'data'));
            if(this.isNumberField || this.codedValues){
              itemVal = itemData;
            }
            if(item.children.length){//edit state
              itemVal = this._dijit.state === 'Error' ? itemData : this._dijit.value;
              if(this.codedValues){
                var code = this._getCodeFromCodevalueLabel(itemVal);
                itemVal = code !== undefined ? code : itemData;
              }
            }
            itemVal = this.isNumberField? parseFloat(itemVal): jimuUtils.sanitizeHTML(itemVal);

            var alias = this._getNodeText(item.nextSibling);
            if(alias === this.customLabel){//when value exists and label is undefined yet
              alias = itemVal.toString();
              if(this.isNumberField){
                alias = this._getLocalNumber(alias);
              }
            }
            if(item.nextSibling.children.length){//edit state
              alias = this._dijit.state === 'Error' ?
                decodeURIComponent(html.getAttr(item.nextSibling, 'data')) : this._dijit.value;
            }
            alias = jimuUtils.sanitizeHTML(alias);
            var itemObj = {
              value: itemVal,
              alias: alias,
              isChecked: false
            };
            this.listItemsArray.push(itemObj);
            this.listValuesArray.push(itemVal);
            if(html.hasClass(item.nextSibling.nextSibling, 'checked')){
              itemObj.isChecked = true;
            }
          }
          var result = {
            list: this.listItemsArray,
            valueList: this.listValuesArray //for multiple select to verify if cbxItem should be checked
          };
          if(this.inputType === 'radio'){
            result.emptyLabel = this._getEmptyLabel();
            result.enableEmpty = this._getEmptyStatus();//save this to config to keep old version
          }
          return result;
        },

        setListValues: function(dataList, labelsArray){
          domAttr.set(this.listContent, "innerHTML", '');
          if(this.inputType === 'radio'){ // only radio has empty target
            this._createEmptyTarget(dataList);
          }
          for(var key = 0; key < dataList.length; key ++){
            var data = dataList[key];
            var checkedClass = '';
            if(data.isChecked){
              checkedClass = ' checked';
              this.currentItem = true;
            }

            var valLabel = labelsArray ? labelsArray[key].label : data.value;
            this._createTarget(data.value, valLabel, data.alias, checkedClass);
          }
          //add title attr for name nodes and alias nodes
          var nameNodes = query('.name', this.listContent);
          for(var k = 0; k < nameNodes.length; k ++){
            var nameNode = nameNodes[k];
            html.setAttr(nameNode, 'title', this._getNodeText(nameNode));
            var labelNode = nameNode.nextSibling;
            html.setAttr(labelNode, 'title', this._getNodeText(labelNode));
          }
        },


        _initTable: function(){

        },

        getDijits: function(){
          return [this.mutiValuesSelect];
        },

        destroy:function(){
          this.inherited(arguments);
        }
      });
  });