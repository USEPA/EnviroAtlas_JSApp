///////////////////////////////////////////////////////////////////////////
// Robert Scheitlin WAB eSearch Widget
///////////////////////////////////////////////////////////////////////////
/*global define, dojo, setTimeout*/
define([
  'dojo/_base/declare',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dijit/_WidgetsInTemplateMixin',
  'dojo/text!./SingleParameter.html',
  'dojo/_base/lang',
  'dojo/_base/html',
  'dojo/_base/array',
  'dojo/json',
  'dojo/on',
  'dojo/query',
  'dojo/Deferred',
  'dijit/form/FilteringSelect',
  'dijit/form/ValidationTextBox',
  'dijit/form/DateTextBox',
  'dijit/form/Textarea',
  'dijit/form/NumberTextBox',
  'dojo/store/Memory',
  'esri/request',
  './PagingQueryTask',
  'dojo/keys',
  'dojo/Evented',
  'dijit/focus'
],
  function(declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, template, lang,
  html, array, json, on, query, Deferred, FilteringSelect, ValidationTextBox, DateTextBox,
  Textarea, NumberTextBox, Memory, esriRequest,PagingQueryTask,keys,Evented, focusUtil) {/*jshint unused: false*/
    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
      baseClass: 'widget-esearch-single-parameter',
      templateString: template,
      fieldInfo:null,
      layerDetails:null,
      layerUri:null,
      layerDef:null,
      value:null,
      nls:null,
      isValueRequired:false,
      allString:'all',
      dayInMS : (24 * 60 * 60 * 1000) - 1000,// 1 sec less than 1 day
      _type:-1,
      layerUniqueCache: null,
      pagingQueryTask: null,
      pagingAttempts:0,
      disableuvcache: false,
      pagingWasCanceled: false,
      selectFilterType: null,
      numberwithin: false,

      postCreate:function(){
        this.inherited(arguments);
        if(this.fieldInfo && this.value){
          this.build(this.fieldInfo, this.value);
        }
      },

      focusValueObj:function(){
        var shortType = this.value.fieldObj.shortType;
        if(shortType === 'string' || this.numberwithin){
          if(this._type === 1){
            focusUtil.focus(this.stringTextBox);
          }else if(this._type === 2){
            focusUtil.focus(this.stringCodedValuesFS);
          }
        }
        else if(shortType === 'number'){
          if(this._type === 1){
            focusUtil.focus(this.numberTextBox);
          } else if(this._type === 2){
            focusUtil.focus(this.numberCodedValuesFS);
          } else if(this._type === 3){
            focusUtil.focus(this.numberTextBox1);
          }
        }
        else if(shortType === 'date'){
          if(this._type === 1){
            focusUtil.focus(this.dateTextBox);
          } else if(this._type === 2){
            focusUtil.focus(this.dateTextBox1);
          }
        }
      },

      getValueObj:function(){
        var shortType = this.value.fieldObj.shortType;
        if(shortType === 'string' || this.numberwithin){
          return this._getStringValueObj();
        }
        else if(shortType === 'number'){
          return this._getNumberValueObj();
        }
        else if(shortType === 'date'){
          return this._getDateValueObj();
        }
        return null;
      },

      setValueObj:function(valueObj){
        //console.info(valueObj.valueObj);
        var shortType = this.value.fieldObj.shortType;
        if(shortType === 'string' || this.numberwithin){
          if(this._type === 1){
            this.stringTextBox.set('value',valueObj.valueObj.value);
          }
          else if(this._type === 2){
            var stringSelectedItems = array.filter(this.stringCodedValuesFS.store.data, lang.hitch(this, function(item) {
              return item.code === valueObj.valueObj.value;
            }));
            if (stringSelectedItems.length > 0) {
              this.stringCodedValuesFS.set('value', stringSelectedItems[0].id);
            }
          }
        }
        else if(shortType === 'number'){
          if(this._type === 1){
            this.numberTextBox.set('value', valueObj.valueObj.value);
          }
          else if(this._type === 2){
            var numSelectedItems = array.filter(this.numberCodedValuesFS.store, lang.hitch(this, function(item) {
              return item.code === valueObj.valueObj.value;
            }));
            if (numSelectedItems.length > 0) {
              this.numberCodedValuesFS.set('value', numSelectedItems[0].id);
            }
          }
          else if(this._type === 3){
            this.numberTextBox1.set('value', valueObj.valueObj.value1);
            this.numberTextBox2.set('value', valueObj.valueObj.value2);
          }
        }
        else if(shortType === 'date'){
          if(this._type === 1){
            if(valueObj.valueObj.value === ""){
              this.dateTextBox.set('value', null);
            }else{
              this.dateTextBox.set('value', new Date(valueObj.valueObj.value));
            }
          }
          else if(this._type === 2){
            if(valueObj.valueObj.value === ""){
              this.dateTextBox1.set('value', null);
              this.dateTextBox2.set('value', null);
            }else{
              this.dateTextBox1.set('value', new Date(valueObj.valueObj.value1));
              this.dateTextBox2.set('value', new Date(valueObj.valueObj.value2));
            }
          }
        }
      },

      _getStringValueObj:function(){
        var valueObj = null;
        if(this._type === 1){
          /*if(!this.stringTextBox.validate()){
            this._showValidationErrorTip(this.stringTextBox);
            return null;
          }*/
          valueObj = {};
          valueObj.value = this.stringTextBox.get('value');
        }
        else if(this._type === 2){
          if (!this.stringCodedValuesFS.validate()) {
            this._showValidationErrorTip(this.stringCodedValuesFS);
            return null;
          }
          valueObj = {};
          var stirngCodedItem = this._getSelectedFilteringItem(this.stringCodedValuesFS);
          valueObj.value = stirngCodedItem.code;
        }
        return valueObj;
      },

      _getNumberValueObj:function(){
        var valueObj = null;
        if(this._type === 1){
          if(!this.numberTextBox.validate()){
            this._showValidationErrorTip(this.numberTextBox);
            return null;
          }
          valueObj = {};
          valueObj.value = parseFloat(this.numberTextBox.get('value'));
        }
        else if(this._type === 2){
          if (!this.numberCodedValuesFS.validate()) {
            this._showValidationErrorTip(this.numberCodedValuesFS);
            return null;
          }
          valueObj = {};
          var numberCodedItem = this._getSelectedFilteringItem(this.numberCodedValuesFS);
          if(numberCodedItem.code === 'allu' || numberCodedItem.code === 'all'){
            valueObj.value =numberCodedItem.code;
          }else{
            valueObj.value = parseFloat(numberCodedItem.code);
          }
        }
        else if(this._type === 3){
          if(!this.numberTextBox1.validate()){
            this._showValidationErrorTip(this.numberTextBox1);
            return null;
          }
          if(!this.numberTextBox2.validate()){
            this._showValidationErrorTip(this.numberTextBox2);
            return null;
          }
          valueObj = {};
          valueObj.value1 = parseFloat(this.numberTextBox1.get('value'));
          valueObj.value2 = parseFloat(this.numberTextBox2.get('value'));
        }
        //console.info(valueObj);
        return valueObj;
      },

      _getDateValueObj:function(){
        var valueObj = null;
        if(this._type === 1){
          if (!this.dateTextBox.validate()) {
            this._showValidationErrorTip(this.dateTextBox);
            return null;
          }
          valueObj = {};
          if(this.dateTextBox.get('value')){
            valueObj.value = dojo.date.locale.format(this.dateTextBox.get('value'), {datePattern: "yyyy-MM-dd HH:mm:ss", selector: "date"});
          } else{
            valueObj.value = null;
          }

        }
        else if(this._type === 2){
          if (!this.dateTextBox1.validate()) {
            this._showValidationErrorTip(this.dateTextBox1);
            return null;
          }
          if (!this.dateTextBox2.validate()) {
            this._showValidationErrorTip(this.dateTextBox2);
            return null;
          }
          valueObj = {};
          if(this.dateTextBox1.get('value')){
            valueObj.value1 = dojo.date.locale.format(this.dateTextBox1.get('value'), {datePattern: "yyyy-MM-dd HH:mm:ss", selector: "date"});
          }else{
            valueObj.value1 = null;
          }
          if(this.dateTextBox2.get('value')){
            valueObj.value2 = dojo.date.locale.format(this.dateTextBox2.get('value'), {datePattern: "yyyy-MM-dd HH:mm:ss", selector: "date"});
          }else{
            valueObj.value2 = null;
          }
        }
//        console.info(valueObj);
        return valueObj;
      },

      formatDate: function(value){
        // see also parseDate()
        // to bypass the locale dependent connector character format date and time separately
        var s1 = dojo.date.locale.format(value, {
          datePattern: "yyyy-MM-dd",
          selector: "date"
        });
        var s2 = dojo.date.locale.format(value, {
          selector: "time",
          timePattern: "HH:mm:ss"
        });
        return s1 + " " + s2;
      },

      addDay: function(date){
        return new Date(date.getTime() + this.dayInMS);
      },

      build:function(fieldInfo, value){
        this.numberwithin = false;
        this.own(on(this.stringTextBox, 'keydown', lang.hitch(this, function(evt){
          var keyNum = evt.keyCode !== undefined ? evt.keyCode : evt.which;
          if (keyNum === 13) {
            this.emit('sp-enter-pressed',{});
          }
        })));
        this.own(on(this.numberTextBox, 'keydown', lang.hitch(this, function(evt){
          var keyNum = evt.keyCode !== undefined ? evt.keyCode : evt.which;
          if (keyNum === 13) {
            this.emit('sp-enter-pressed',{});
          }
        })));
        this.own(on(this.dateTextBox, 'keydown', lang.hitch(this, function(evt){
          var keyNum = evt.keyCode !== undefined ? evt.keyCode : evt.which;
          if (keyNum === 13) {
            this.emit('sp-enter-pressed',{});
          }
        })));
        this.fieldInfo = fieldInfo;
        this.value = value;
        if(value.hasOwnProperty('required') && value.required){
          html.setStyle(this.requiredNode, 'display', '');
        }else{
          html.setStyle(this.requiredNode, 'display', 'none');
        }

        this.promptNode.innerHTML = value.prompt||'';
        this.hintNode.innerHTML = value.textsearchhint||'';
        var shortType = this.value.fieldObj.shortType;
        var userList = this.value.userlist || null;
        var uvField = this.value.uniquevalsfromfield || null;

        if(shortType === 'string'){
          this.stringCodedValuesFS.set('autoComplete', false);
          if(this.selectFilterType === 'contains'){
            this.stringCodedValuesFS.set('queryExpr', '*${0}*');
          }
          if(value.prompt === ""){
            this.stringCodedValuesFS.set('readOnly', true);
            this.stringTextBox.set('readOnly', true);
          }else{
            this.stringCodedValuesFS.set('readOnly', false);
            this.stringTextBox.set('readOnly', false);
          }
          if(userList){
            this._buildString(fieldInfo, this.value, userList);
          }else if(uvField){
            this._buildString(fieldInfo, this.value, null, uvField);
          }else{
            this._buildString(fieldInfo, this.value);
          }
        }
        else if(shortType === 'number'){
          if(value.prompt === ""){
            this.numberTextBox1.set('readOnly', true);
            this.numberTextBox2.set('readOnly', true);
            this.numberCodedValuesFS.set('readOnly', true);
            this.numberTextBox.set('readOnly', true);
          }else{
            this.numberTextBox1.set('readOnly', false);
            this.numberTextBox2.set('readOnly', false);
            this.numberCodedValuesFS.set('readOnly', false);
            this.numberTextBox.set('readOnly', false);
          }
          if(this.value.sqltext.toLowerCase().indexOf(" in (") > 0){
            this.numberwithin = true;
            this._buildString(fieldInfo, this.value);
            return;
          }
          if(userList){
            this._buildNumber(fieldInfo, this.value, userList);
          }else if(uvField){
            this._buildNumber(fieldInfo, this.value, null, uvField);
          }else{
            this._buildNumber(fieldInfo, this.value);
          }
        }
        else if(shortType === 'date'){
          if(value.prompt === ""){
            this.dateTextBox.set('readOnly', true);
            this.dateTextBox1.set('readOnly', true);
            this.dateTextBox2.set('readOnly', true);
          }else{
            this.dateTextBox.set('readOnly', false);
            this.dateTextBox1.set('readOnly', false);
            this.dateTextBox2.set('readOnly', false);
          }
          this._buildDate(fieldInfo, this.value);
        }
        if(value.operation === 'numberOperatorIsBlank' ||
          value.operation === 'numberOperatorIsNotBlank' ||
          value.operation === 'stringOperatorIsBlank' ||
          value.operation === 'stringOperatorIsNotBlank' ||
          value.operation === 'dateOperatorIsBlank' ||
          value.operation === 'dateOperatorIsNotBlank'){
          html.setStyle(this.allValueBoxContainer,'display','none');
        }else{
          html.setStyle(this.allValueBoxContainer,'display','inline-block');
        }
      },

      _getCodedValues:function(fieldInfo){
        var codedValues = null;
        var domain = fieldInfo.domain;
        if(domain && domain.type === 'codedValue' && domain.codedValues && domain.codedValues.length > 0){
          codedValues = domain.codedValues;
        }
        return codedValues;
      },

      _getSubTypeValues:function(){
        var subtypeValues = [];
        subtypeValues.push({name: '', code: -1});
        for (var t = 0; t < this.layerDetails.types.length; t++) {
          var featureType = this.layerDetails.types[t];
          var stObj = {
            name: featureType.name,
            code: featureType.id
          };
          subtypeValues.push(stObj);
        }
        return subtypeValues;
      },

      _buildString: function(fieldInfo, value, /* optional */ userList, uvField) {
        html.setStyle(this.stringTextBoxContainer, 'display', 'block');
        html.setStyle(this.numberTextBoxContainer, 'display', 'none');
        html.setStyle(this.dateTextBoxContainer, 'display', 'none');

        var fieldObj = value.fieldObj;//name,shortType
        var valueObj = value.valueObj;//value,value1,value2
//        console.info(valueObj);
        var codedValues = this._getCodedValues(fieldInfo);

        if (codedValues || userList || uvField) {
          var stringCodedData;
          this._type = 2;
          this._showDijit(this.stringCodedValuesFS);
          this._hideDijit(this.stringTextBox);
          this.stringCodedValuesFS.set('displayedValue','');
          var estore = new Memory({data:[]});
          this.stringCodedValuesFS.set('store',estore);
          if(codedValues && !uvField && !userList){
            stringCodedData = array.map(codedValues, lang.hitch(this, function(item, index) {
              //item:{name,code},name is the code description and code is code value.
              var dataItem = lang.mixin({}, item);
              dataItem.id = index;
              return dataItem;
            }));
            if(!this.isValueRequired){
              var dataItem3 = lang.mixin({}, {name:'',code:''});
              dataItem3.id = stringCodedData.length;
              stringCodedData.unshift(dataItem3);
            }
          }else if(uvField){
            var stringUniqueStore, stringSelectedItem, uniqueCache;
            if(this.disableuvcache){
              uniqueCache = null;
            }else{
              uniqueCache = this.layerUniqueCache[this.layerUri];
            }
            if (!uniqueCache){
              uniqueCache = {};
              this.layerUniqueCache[this.layerUri] = uniqueCache;
            }
            var uniqueKey;
            if(this.layerDef){
              uniqueKey = uvField + this.layerDef;
            }else{
              uniqueKey = uvField;
            }
            var UniqueValArr = [];
            if (uniqueKey in uniqueCache){
              UniqueValArr = uniqueCache[uniqueKey];
              stringUniqueStore = new Memory({
                data: UniqueValArr
              });
              this.stringCodedValuesFS.set('store', stringUniqueStore);
              if (valueObj) {
                stringSelectedItem = array.filter(stringCodedData, lang.hitch(this, function(item) {
                  return item.code === valueObj.value;
                }));
                if (stringSelectedItem.length > 0) {
                  this.stringCodedValuesFS.set('value', stringSelectedItem[0].id);
                }else{
                  this.stringCodedValuesFS.set('value', UniqueValArr[0].id);
                }
              }
              setTimeout(lang.hitch(this, function () {
                this.emit('sp-ready',{});
              }), 200);
            }else{
              this.pagingQueryTask = new PagingQueryTask();
              this.own(on(this.uniqueCancelNode, "click", lang.hitch(this, function(){
                this.pagingQueryTask.esc = this.pagingQueryTask.pagingEscaped = true;
                this.pagingWasCanceled = true;
              })));
              this.pagingQueryTask.uri = this.layerUri;
              this.pagingQueryTask.fieldName = uvField;
              this.pagingQueryTask.dateFormat = '';
              this.pagingQueryTask.version = this.layerDetails.currentVersion;
              if(this.layerDetails.maxRecordCount){
                this.pagingQueryTask.maxRecordCount = this.layerDetails.maxRecordCount
              }
              this.pagingQueryTask.isRequired = this.isValueRequired;
              if(this.layerDef){
                this.pagingQueryTask.defExpr = this.layerDef;
              }
              this.pagingQueryTask.on('pagingComplete', lang.hitch(this, function(uniqueValuesArray){
                html.setStyle(this.uniqueMessageTR, 'display', 'none');
                this.uniqueMessageNode.innerHTML = '';
                this.pagingAttempts = 0;
                stringCodedData = array.map(uniqueValuesArray, lang.hitch(this, function(item, index) {
                  //item:{name,code}
                  var dataItem = lang.mixin({}, item);
                  dataItem.id = index;
                  return dataItem;
                }));
                if(this._isFieldCoded(fieldInfo)){
                  var stringDomain = fieldInfo.domain;
                  array.map(stringCodedData, lang.hitch(this, function(item) {
                    for (var cv = 0; cv < stringDomain.codedValues.length; cv++) {
                      var codedValue = stringDomain.codedValues[cv];
                      if (item.code === codedValue.code) {
                        item.name = codedValue.name;
                        break;
                      }
                    }
                  }));
                }
                if(!this.pagingWasCanceled){
                  if(this.layerDef){
                    this.layerUniqueCache[this.layerUri][this.pagingQueryTask.fieldName + this.layerDef] = stringCodedData;
                  }else{
                    this.layerUniqueCache[this.layerUri][this.pagingQueryTask.fieldName] = stringCodedData;
                  }
                }
                stringUniqueStore = new Memory({
                  data: stringCodedData
                });
                if(typeof this.stringCodedValuesFS === 'undefined'){
                  return;
                }
                this.stringCodedValuesFS.set('store', stringUniqueStore);
                if (valueObj) {
                  var stringSelectedItem = array.filter(stringCodedData, lang.hitch(this, function(item) {
                    return item.code === valueObj.value;
                  }));
                  if (stringSelectedItem.length > 0) {
                    this.stringCodedValuesFS.set('value', stringSelectedItem[0].id);
                  }else{
                    this.stringCodedValuesFS.set('value', stringCodedData[0].id);
                  }
                }
                setTimeout(lang.hitch(this, function () {
                  this.emit('sp-ready',{});
                }), 200);
              }));
              this.pagingQueryTask.on('pagingFault', lang.hitch(this, function(){
                this.pagingAttempts++;
                if(this.pagingAttempts <= 4){
                  console.warn("pagingQueryTask has been launched again for the " + this.pagingAttempts + " time");
                  this.pagingQueryTask.startup();
                  this.pagingQueryTask.execute();
                }else{
                  this._type = 1;
                  this._showDijit(this.stringTextBox);
                  this._hideDijit(this.stringCodedValuesFS);
                  this.stringTextBox.set('value', valueObj.value || '');
                  html.setStyle(this.uniqueMessageTR, 'display', 'none');
                  this.uniqueMessageNode.innerHTML = '';
                  setTimeout(lang.hitch(this, function () {
                    this.emit('sp-ready',{});
                  }), 200);
                }
              }));
              this.pagingQueryTask.startup();
              this.pagingQueryTask.execute();
              html.setStyle(this.uniqueMessageTR, 'display', 'table-row');
              this.uniqueMessageNode.innerHTML = this.nls.uniqueValues;
              this.pagingQueryTask.on('featuresTotal', lang.hitch(this, function(){
                html.setStyle(this.uniqueMessageTR, 'display', 'table-row');
                this.uniqueMessageNode.innerHTML = this.nls.processingUnique + this.pagingQueryTask.featuresProcessed +
                  this.nls.of + this.pagingQueryTask.featuresTotal;
              }));
              this.pagingQueryTask.on('featuresProcessed', lang.hitch(this, function(){
                html.setStyle(this.uniqueMessageTR, 'display', 'table-row');
                this.uniqueMessageNode.innerHTML = this.nls.processingUnique + this.pagingQueryTask.featuresProcessed +
                  this.nls.of + this.pagingQueryTask.featuresTotal;
              }));
            }
          }else{
            var uaList;
            //If the userlist values are text qualified (because of a value with a comma) then split based
            //in the qualifier with is a single qoute.
            if (userList.indexOf("',") > -1){
              uaList = this.trimArray(userList.split("',"));
              uaList = array.map(uaList, function(udv, indx){
                if(String(udv).indexOf("|'")){
                  udv = String(udv).replace("|'", "|");
                }
                return udv
              });
              var lVal = String(uaList[uaList.length - 1]);
              if (lVal.substring(lVal.length - 1) == "'"){
                  uaList[uaList.length - 1] = lVal.substring(0,lVal.length - 1);
              }
            }else{
              uaList = this.trimArray(userList.split(","));
            }
            stringCodedData = array.map(uaList, lang.hitch(this, function(item, index) {
              //item:{name,code}
              var dataItem, uval = item;
              if(item === this.allString){
                uval = 'all';
              }
              if(item.indexOf('|') < 0){
                dataItem = lang.mixin({}, {name:item,code:uval});
              }else{
                var data = item.split('|');
                if(uval === 'all'){
                  dataItem = lang.mixin({}, {name:data[0],code:uval});
                }else{
                  dataItem = lang.mixin({}, {name:data[0],code:data[1]});
                }
              }
              dataItem.id = index;
              return dataItem;
            }));
            if(!this.isValueRequired){
              var dataItem3 = lang.mixin({}, {name:'',code:''});
              dataItem3.id = stringCodedData.length;
              stringCodedData.unshift(dataItem3);
            }
          }
          if(!stringCodedData){
            return;
          }
          var stringCodedStore = new Memory({
            data: stringCodedData
          });
          this.stringCodedValuesFS.set('store', stringCodedStore);
          if (valueObj) {
            var stringSelectedItems = array.filter(stringCodedData, lang.hitch(this, function(item) {
              return item.code === valueObj.value;
            }));
            if (stringSelectedItems.length > 0) {
              this.stringCodedValuesFS.set('value', stringSelectedItems[0].id);
            }else{
              this.stringCodedValuesFS.set('value', stringCodedData[0].id);
            }
          }
          setTimeout(lang.hitch(this, function () {
            this.emit('sp-ready',{});
          }), 200);
        }else{
          var estore2 = new Memory({data:[]});
          this.stringCodedValuesFS.set('store',estore2);
          this._type = 1;
          this._showDijit(this.stringTextBox);
          this._hideDijit(this.stringCodedValuesFS);
          this.stringTextBox.set('value', (valueObj) ? valueObj.value : '');
          if(this.isValueRequired){
            this.stringTextBox.set('required', true);
          }
          setTimeout(lang.hitch(this, function () {
            this.emit('sp-ready',{});
          }), 200);
        }
      },

      trimArray: function (arr){
        for(var i=0;i<arr.length;i++)
        {
          arr[i] = arr[i].replace(/^\s*/, '').replace(/\s*$/, '');
        }
        return arr;
      },

      _buildNumber: function(fieldInfo, val, /* optional */ userList, uvField){
        html.setStyle(this.stringTextBoxContainer,'display','none');
        html.setStyle(this.numberTextBoxContainer,'display','block');
        html.setStyle(this.dateTextBoxContainer,'display','none');

        var fieldObj = val.fieldObj;//name,shortType
        var valueObj = val.valueObj;//value,value1,value2
        var operator = val.operation;
        var codedValues = this._getCodedValues(fieldInfo);
        var value = parseFloat(valueObj.value);
        var isRange = operator === this.nls.numberOperatorIsBetween || operator === this.nls.numberOperatorIsNotBetween;
        if(isRange){
          this._type = 3;
          html.setStyle(this.numberRangeTable,'display','table');
          this._hideDijit(this.numberTextBox);
          this._hideDijit(this.numberCodedValuesFS);
          var value1 = parseFloat(valueObj.value1);
          var value2 = parseFloat(valueObj.value2);
          this.numberTextBox1.set('value',value1);
          this.numberTextBox2.set('value',value2);
          if(this.isValueRequired){
            this.numberTextBox1.set('required', true);
            this.numberTextBox2.set('required', true);
          }
          setTimeout(lang.hitch(this, function () {
            this.emit('sp-ready',{});
          }), 200);
        }else{
          html.setStyle(this.numberRangeTable,'display','none');
          if(this.layerDetails.typeIdField && this.layerDetails.typeIdField.toUpperCase() === fieldInfo.name.toUpperCase()){
            var subtypeValues = this._getSubTypeValues();
            if(subtypeValues){
              this._type = 2;
              this._showDijit(this.numberCodedValuesFS);
              this._hideDijit(this.numberTextBox);
              var numberCodedData = array.map(subtypeValues, lang.hitch(this,function(item,index){
                //item:{name,code},name is the code description and code is code value.
                var dataItem = lang.mixin({},item);
                dataItem.id = index;
                return dataItem;
              }));
              if(!this.isValueRequired){
                var dataItem3 = lang.mixin({}, {name:'',code:''});
                dataItem3.id = numberCodedData.length;
                numberCodedData.unshift(dataItem3);
              }
              var numberCodedStore = new Memory({data:numberCodedData});
              this.numberCodedValuesFS.set('store',numberCodedStore);
              if(valueObj && !isNaN(valueObj.value)){
                var number = parseFloat(valueObj.value);
                var numberSelectedItems = array.filter(numberCodedData,lang.hitch(this,function(item){
                  return parseFloat(item.code) === number;
                }));
                if(numberSelectedItems.length > 0){
                  this.numberCodedValuesFS.set('value',numberSelectedItems[0].id);
                }else{
                  this.numberCodedValuesFS.set('value',numberCodedData[0].id);
                }
              }else{
                this.numberCodedValuesFS.set('value',numberCodedData[0].id);
              }
              setTimeout(lang.hitch(this, function () {
                this.emit('sp-ready',{});
              }), 200);
            }
            return;
          }
          if (codedValues || userList || uvField) {
            var numberCodedData2;
            this._type = 2;
            this._showDijit(this.numberCodedValuesFS);
            this._hideDijit(this.numberTextBox);
            this.numberCodedValuesFS.set('displayedValue','');
            var estore = new Memory({data:[]});
            this.numberCodedValuesFS.set('store',estore);
            if(codedValues && !uvField && !userList){
              numberCodedData2 = array.map(codedValues,lang.hitch(this,function(item,index){
                //item:{name,code},name is the code description and code is code value.
                var dataItem = lang.mixin({},item);
                dataItem.id = index;
                return dataItem;
              }));
              if(!this.isValueRequired){
                var dataItem4 = lang.mixin({}, {name:'',code:''});
                dataItem4.id = numberCodedData2.length;
                numberCodedData2.unshift(dataItem4);
              }
              var numberCodedStore2 = new Memory({data:numberCodedData2});
              this.numberCodedValuesFS.set('store', numberCodedStore2);
              if(valueObj && !isNaN(valueObj.value)){
                var number2 = parseFloat(valueObj.value);
                var numberSelectedItems2 = array.filter(numberCodedData2,lang.hitch(this,function(item){
                  return parseFloat(item.code) === number2;
                }));
                if(numberSelectedItems2.length > 0){
                  this.numberCodedValuesFS.set('value',numberSelectedItems2[0].id);
                }else{
                  this.numberCodedValuesFS.set('value',numberCodedData2[0].id);
                }
              }else{
                this.numberCodedValuesFS.set('value',numberCodedData2[0].id);
              }
              setTimeout(lang.hitch(this, function () {
                this.emit('sp-ready',{});
              }), 200);
            }else if(uvField){
              var numberUniqueStore;
              var numberSelectedItem;
              var uniqueCache = this.layerUniqueCache[this.layerUri];
              if (!uniqueCache){
                  uniqueCache = {};
                  this.layerUniqueCache[this.layerUri] = uniqueCache;
              }
              var uniqueKey = uvField;
              var UniqueValArr = [];
              if (uniqueKey in uniqueCache){
                UniqueValArr = uniqueCache[uniqueKey];
                numberUniqueStore = new Memory({
                  data: UniqueValArr
                });
                this.numberCodedValuesFS.set('store', numberUniqueStore);
                if (valueObj) {
                  numberSelectedItem = array.filter(numberCodedData2, lang.hitch(this, function(item) {
                    return item.code === valueObj.value;
                  }));
                  if (numberSelectedItem.length > 0) {
                    this.numberCodedValuesFS.set('value', numberSelectedItem[0].id);
                  }else{
                    this.numberCodedValuesFS.set('value', UniqueValArr[0].id);
                  }
                }
                setTimeout(lang.hitch(this, function () {
                  this.emit('sp-ready',{});
                }), 200);
              }else{
                this.pagingQueryTask = new PagingQueryTask();
                this.own(on(this.uniqueCancelNode, "click", lang.hitch(this, function(){
                  this.pagingQueryTask.esc = this.pagingQueryTask.pagingEscaped = true;
                  this.pagingWasCanceled = true;
                })));
                this.pagingQueryTask.uri = this.layerUri;
                this.pagingQueryTask.fieldName = uvField;
                this.pagingQueryTask.dateFormat = '';
                this.pagingQueryTask.version = this.layerDetails.currentVersion;
                this.pagingQueryTask.maxRecordCount = this.layerDetails.maxRecordCount;
                if(this.layerDef){
                  this.pagingQueryTask.defExpr = this.layerDef;
                }
                this.pagingQueryTask.on('pagingComplete', lang.hitch(this, function(uniqueValuesArray){
                  html.setStyle(this.uniqueMessageTR, 'display', 'none');
                  this.uniqueMessageNode.innerHTML = '';
                  this.pagingAttempts = 0;
                  numberCodedData2 = array.map(uniqueValuesArray, lang.hitch(this, function(item, index) {
                    //item:{name,code}
                    var dataItem = lang.mixin({}, item);
                    dataItem.id = index;
                    return dataItem;
                  }));
                  if(this._isFieldCoded(fieldInfo)){
                    var numDomain = fieldInfo.domain;
                    array.map(numberCodedData2, lang.hitch(this, function(item) {
                      for (var cv = 0; cv < numDomain.codedValues.length; cv++) {
                        var codedValue = numDomain.codedValues[cv];
                        if (item.code === codedValue.code) {
                          item.name = codedValue.name;
                          break;
                        }
                      }
                    }));
                  }
                  if(!this.pagingWasCanceled){
                    this.layerUniqueCache[this.layerUri][this.pagingQueryTask.fieldName] = numberCodedData2;
                  }
                  numberUniqueStore = new Memory({
                    data: numberCodedData2
                  });
                  if(typeof this.numberCodedValuesFS === 'undefined'){
                    return;
                  }
                  this.numberCodedValuesFS.set('store', numberUniqueStore);
                  if (valueObj) {
                    var numberSelectedItem = array.filter(numberCodedData2, lang.hitch(this, function(item) {
                      return item.code === valueObj.value;
                    }));
                    if (numberSelectedItem.length > 0) {
                      this.numberCodedValuesFS.set('value', numberSelectedItem[0].id);
                    }else{
                      this.numberCodedValuesFS.set('value', numberCodedData2[0].id);
                    }
                  }
                  setTimeout(lang.hitch(this, function () {
                    this.emit('sp-ready',{});
                  }), 200);
                }));
                this.pagingQueryTask.on('pagingFault', lang.hitch(this, function(){
                  this.pagingAttempts++;
                  if(this.pagingAttempts <= 4){
                    console.warn("pagingQueryTask has been launched again for the " + this.pagingAttempts + " time");
                    this.pagingQueryTask.startup();
                    this.pagingQueryTask.execute();
                  }else{
                    this._type = 1;
                    this._showDijit(this.numberTextBox);
                    this._hideDijit(this.numberCodedValuesFS);
                    this.numberTextBox.set('value',value);
                    setTimeout(lang.hitch(this, function () {
                      this.emit('sp-ready',{});
                    }), 200);
                  }
                }));
                this.pagingQueryTask.startup();
                this.pagingQueryTask.execute();
                html.setStyle(this.uniqueMessageTR, 'display', 'table-row');
                this.uniqueMessageNode.innerHTML = this.nls.uniqueValues;
                this.pagingQueryTask.on('featuresTotal', lang.hitch(this, function(){
                  html.setStyle(this.uniqueMessageTR, 'display', 'table-row');
                  this.uniqueMessageNode.innerHTML = this.nls.processingUnique + this.pagingQueryTask.featuresProcessed +
                    this.nls.of + this.pagingQueryTask.featuresTotal;
                }));
                this.pagingQueryTask.on('featuresProcessed', lang.hitch(this, function(){
                  html.setStyle(this.uniqueMessageTR, 'display', 'table-row');
                  this.uniqueMessageNode.innerHTML = this.nls.processingUnique + this.pagingQueryTask.featuresProcessed +
                    this.nls.of + this.pagingQueryTask.featuresTotal;
                }));
              }
            }else{
              var uaList;
              uaList = this.trimArray(userList.split(","));
              numberCodedData2 = array.map(uaList, lang.hitch(this, function(item, index) {
                //item:{name,code}
                var dataItem, uval = item;
                if(item === this.allString){
                  uval = 'all';
                }
                if(item.indexOf('|') < 0){
                  dataItem = lang.mixin({}, {name:item,code:uval});
                }else{
                  var data = item.split('|');
                  if(uval === 'all'){
                    dataItem = lang.mixin({}, {name:data[0],code:uval});
                  }else{
                    dataItem = lang.mixin({}, {name:data[0],code:data[1]});
                  }
                }
                dataItem.id = index;
                return dataItem;
              }));
              if(!this.isValueRequired){
                var dataItem3 = lang.mixin({}, {name:'',code:''});
                dataItem3.id = numberCodedData2.length;
                numberCodedData2.unshift(dataItem3);
              }
              var numberCodedStore3 = new Memory({data:numberCodedData2});
              this.numberCodedValuesFS.set('store',numberCodedStore3);
              if(valueObj && !isNaN(valueObj.value)){
                var number3 = parseFloat(valueObj.value);
                var numberSelectedItems3 = array.filter(numberCodedData2,lang.hitch(this,function(item){
                  return parseFloat(item.code) === number2;
                }));
                if(numberSelectedItems3.length > 0){
                  this.numberCodedValuesFS.set('value', numberSelectedItems3[0].id);
                }else{
                  this.numberCodedValuesFS.set('value', numberCodedData2[0].id);
                }
              }else{
                this.numberCodedValuesFS.set('value', numberCodedData2[0].id);
              }
              setTimeout(lang.hitch(this, function () {
                this.emit('sp-ready',{});
              }), 200);
            }
          }else{
            var estore2 = new Memory({data:[]});
            this.numberCodedValuesFS.set('store', estore2);
            this._type = 1;
            this._showDijit(this.numberTextBox);
            this._hideDijit(this.numberCodedValuesFS);
            this.numberTextBox.set('value', value);
            if(this.isValueRequired){
              this.numberTextBox.set('required', true);
            }
            setTimeout(lang.hitch(this, function () {
              this.emit('sp-ready',{});
            }), 200);
          }
        }
      },

      _isFieldCoded:function(fieldInfo){
        var domain = fieldInfo.domain;
        return domain && domain.type === "codedValue" && domain.codedValues && domain.codedValues.length > 0;
      },

      _buildDate: function(fieldInfo, value){/*jshint unused: false*/
        html.setStyle(this.stringTextBoxContainer, 'display', 'none');
        html.setStyle(this.numberTextBoxContainer, 'display', 'none');
        html.setStyle(this.dateTextBoxContainer, 'display', 'block');

        var fieldObj = value.fieldObj;//name,shortType
        var valueObj = value.valueObj;//value,value1,value2
        var operator = value.operation;
        var isRange = operator === this.nls.dateOperatorIsBetween || operator === this.nls.dateOperatorIsNotBetween;
//        console.info(operator + " : " + this.nls.dateOperatorIsBetween);
        if(isRange){
          this._type = 2;
          html.setStyle(this.dateRangeTable,'display','table');
          this._hideDijit(this.dateTextBox);
          if(value.date1minus){
            var minusDays = parseInt(value.date1minus, 10);
            var today = new Date();
            var priorDate = new Date(today.getTime() - (this.dayInMS * minusDays));
            this.dateTextBox1.set('value', priorDate);
          }
          if(valueObj.value1 !== '[value]' && valueObj.value2 !== '[value]'){
            //console.info(valueObj.value1);
            this.dateTextBox1.set('value', new Date(valueObj.value1));
            this.dateTextBox2.set('value', new Date(valueObj.value2));
          }
          if(this.isValueRequired){
            this.dateTextBox1.set('required', true);
            this.dateTextBox2.set('required', true);
          }
          setTimeout(lang.hitch(this, function () {
            this.emit('sp-ready',{});
          }), 200);
        }else{
          this._type = 1;
          html.setStyle(this.dateRangeTable,'display','none');
          this._showDijit(this.dateTextBox);
          this.dateTextBox.set('value', new Date(valueObj.value));
          if(this.isValueRequired){
            this.dateTextBox.set('required', true);
          }
          setTimeout(lang.hitch(this, function () {
            this.emit('sp-ready',{});
          }), 200);
        }
      },

      _getSelectedFilteringItem:function(_select){
        if(_select.validate()){
          var id = _select.get('value');
          if(isNaN(id)){
            this._showValidationErrorTip(_select);
          }else{
            var items = _select.store.query({id: id});
            if(items.length > 0){
              var item = items[0];
              if(item){
                return item;
              }
            }
          }
        }else{
          this._showValidationErrorTip(_select);
        }
        return null;
      },

      _showValidationErrorTip:function(_dijit){
        if(!_dijit.validate() && _dijit.domNode){
          if(_dijit.focusNode){
            _dijit.focusNode.focus();
            _dijit.focusNode.blur();
          }
        }
      },

      _showDijit:function(_dijit){
        if(_dijit && _dijit.domNode){
          html.setStyle(_dijit.domNode,'display','inline-block');
        }
      },

      _hideDijit:function(_dijit){
        if(_dijit && _dijit.domNode){
          html.setStyle(_dijit.domNode,'display','none');
        }
      },

      _onRangeNumberBlur:function(){
        if(this.numberTextBox1.validate() && this.numberTextBox2.validate()){
          var value1 = parseFloat(this.numberTextBox1.get('value'));
          var value2 = parseFloat(this.numberTextBox2.get('value'));
          if(value1 > value2){
            this.numberTextBox1.set('value',value2);
            this.numberTextBox2.set('value',value1);
          }
        }
      },

      _onRangeDateBlur:function(){
        if(this.dateTextBox1.validate() && this.dateTextBox2.validate()){
          var date1 = this.dateTextBox1.get('value');
          var time1 = date1.getTime();
          var date2 = this.dateTextBox2.get('value');
          var time2 = date2.getTime();
          if(time1 > time2){
            this.dateTextBox1.set('value', date2);
            this.dateTextBox2.set('value', date1);
          }
        }
      }
    });
  });
