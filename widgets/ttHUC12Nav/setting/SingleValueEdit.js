///////////////////////////////////////////////////////////////////////////
// Robert Scheitlin WAB eSearch Widget
///////////////////////////////////////////////////////////////////////////
/*global define, console, setTimeout*/
define([
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/_base/html',
  'dojo/_base/query',
  'dojo/on',
  'dojo/json',
  'dojo/store/Memory',
  'dojo/Deferred',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dijit/_WidgetsInTemplateMixin',
  'dijit/Tooltip',
  'dojo/text!./SingleValueEdit.html',
  'dijit/form/TextBox',
  'esri/request',
  'esri/lang',
  'dojo/date/locale',
  '../PagingQueryTask',
  './SimpleTable',
  'jimu/utils',
  'esri/layers/CodedValueDomain',
  'esri/layers/Domain',
  'dijit/form/FilteringSelect',
  'dijit/form/ValidationTextBox',
  'dijit/form/DateTextBox',
  'dijit/form/NumberTextBox',
  'jimu/dijit/CheckBox'
],
function(declare, lang, array, html, query, on, json, Memory, Deferred, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,
  Tooltip, template, TextBox, esriRequest, esriLang, locale, PagingQueryTask, eSimpleTable, jimuUtils, CodedValueDomain, Domain) {
  return declare([_WidgetBase,_TemplatedMixin,_WidgetsInTemplateMixin], {
    baseClass: 'widget-esearch-singlevalue-setting',
    templateString:template,
    nls:null,
    config:null,
    tr:null,
    searchSetting:null,
    _fieldObj:null,
    _valueObj:null,
    layerURL:null,
    layerDef:null,
    stringFieldType: 'esriFieldTypeString',
    dateFieldType: 'esriFieldTypeDate',
    numberFieldTypes: ["esriFieldTypeSmallInteger", "esriFieldTypeInteger", "esriFieldTypeSingle", "esriFieldTypeDouble", "esriFieldTypeOID"],
    supportFieldTypes: [],
    _def:null,
    _layerInfo:null,
    isValueRequired:false,
    pagingAttempts:0,
    dayInMS : (24 * 60 * 60 * 1000) - 1000,// 1 sec less than 1 day
    pagingQueryTask: null,
    pagingWasCanceled: false,
    layerUniqueCache: null,
    layerInfoCache: null,
    len: 0,
    operator: null,
    isHosted: false,
    OPERATORS:{
      stringOperatorIs:'stringOperatorIs',
      stringOperatorIsNot:'stringOperatorIsNot',
      stringOperatorStartsWith:'stringOperatorStartsWith',
      stringOperatorEndsWith:'stringOperatorEndsWith',
      stringOperatorContains:'stringOperatorContains',
      stringOperatorDoesNotContain:'stringOperatorDoesNotContain',
      stringOperatorIsBlank:'stringOperatorIsBlank',
      stringOperatorIsNotBlank:'stringOperatorIsNotBlank',
      stringOperatorIn:'stringOperatorIn',
      dateOperatorIsOn:'dateOperatorIsOn',
      dateOperatorIsNotOn:'dateOperatorIsNotOn',
      dateOperatorIsBefore:'dateOperatorIsBefore',
      dateOperatorIsAfter:'dateOperatorIsAfter',
      dateOperatorIsBeforeOrOn:'dateOperatorIsBeforeOrOn',
      dateOperatorIsAfterOrOn:'dateOperatorIsAfterOrOn',
      dateOperatorDays:'dateOperatorDays',
      dateOperatorWeeks:'dateOperatorWeeks',
      dateOperatorMonths:'dateOperatorMonths',
      dateOperatorInTheLast:'dateOperatorInTheLast',
      dateOperatorNotInTheLast:'dateOperatorNotInTheLast',
      dateOperatorIsBetween:'dateOperatorIsBetween',
      dateOperatorIsNotBetween:'dateOperatorIsNotBetween',
      dateOperatorIsBlank:'dateOperatorIsBlank',
      dateOperatorIsNotBlank:'dateOperatorIsNotBlank',
      numberOperatorIs:'numberOperatorIs',
      numberOperatorIsNot:'numberOperatorIsNot',
      numberOperatorIsAtLeast:'numberOperatorIsAtLeast',
      numberOperatorIsLessThan:'numberOperatorIsLessThan',
      numberOperatorIsAtMost:'numberOperatorIsAtMost',
      numberOperatorIsGreaterThan:'numberOperatorIsGreaterThan',
      numberOperatorIsBetween:'numberOperatorIsBetween',
      numberOperatorIsNotBetween:'numberOperatorIsNotBetween',
      numberOperatorIsBlank:'numberOperatorIsBlank',
      numberOperatorIsNotBlank:'numberOperatorIsNotBlank',
      numberOperatorIn:'numberOperatorIn'
    },

    postMixInProperties:function(){
      this.supportFieldTypes = [];
      this.supportFieldTypes.push(this.stringFieldType);
      this.supportFieldTypes.push(this.dateFieldType);
      this.supportFieldTypes = this.supportFieldTypes.concat(this.numberFieldTypes);
    },

    postCreate:function(){
      this.inherited(arguments);
      this.uservaluesTable = new eSimpleTable({
        _rowHeight: 40,
        autoHeight: true,
        selectable: true,
        fields: [
          {name:'userlabel',title:this.nls.predefinedLabel,type:'text',editable:true},
          {name:'uservalue',title:this.nls.predefinedValue,type:'text',editable:true},
          {name:'actions',title:this.nls.actions,width:'120px',type:'actions',actions:['delete','up','down']}
        ]
      }, this.uservaluesTableDiv);
      this.uservaluesTable.startup();
      html.addClass(this.uservaluesTable.domNode, "user-values-table");
      this._bindEvents();
    },

    startup: function(){
      this.inherited(arguments);
      this.popup.disableButton(0);
      this.setConfig(this.config);
      this._checkExpressionNumbers();
      this.getLayerInfo();
      this._initRadios();
    },

    getLayerInfo:function(){
      this._layerInfo = this.layerInfoCache[this.layerURL];
      if (!this._layerInfo){
        var def = this._requestLayerInfo(this.layerURL);
        return def;
      } else{
        if(this._layerInfo.fields){
          var fields = array.filter(this._layerInfo.fields,function(item){
            return item.type !== 'esriFieldTypeOID' && item.type !== 'esriFieldTypeBlob' && item.type !== 'esriFieldTypeGeometry' && item.type !== 'esriFieldTypeRaster' && item.type !== 'esriFieldTypeGUID' && item.type !== 'esriFieldTypeGlobalID' && item.type !== 'esriFieldTypeXML';
          });
          if(fields.length > 0){
            this._initFieldsSelect(fields);
          }
        }
      }
    },

    _requestLayerInfo:function(url){
      if(!url){
        return;
      }
      esriRequest.setRequestPreCallback(function (ioArgs) {
        ioArgs.failOk = true;
        return ioArgs;
      });

      var def = new Deferred();
      if(this._def && !this._def.isFulfilled()){
        this._def.cancel('new layer info was requested');
      }
      this._def = esriRequest({
        url:url,
        content:{f:"json"},
        handleAs:"json",
        callbackParamName:"callback",
        timeout:20000
      },{
        useProxy:false
      });
      this._def.then(lang.hitch(this,function(response){
        this._layerInfo = response;
        this.layerInfoCache[this.layerURL] = this._layerInfo;
        if(response && response.fields){
          var fields = array.filter(response.fields,function(item){
            return item.type !== 'esriFieldTypeOID' && item.type !== 'esriFieldTypeBlob' && item.type !== 'esriFieldTypeGeometry' && item.type !== 'esriFieldTypeRaster' && item.type !== 'esriFieldTypeGUID' && item.type !== 'esriFieldTypeGlobalID' && item.type !== 'esriFieldTypeXML';
          });
          if(fields.length > 0){
            this._initFieldsSelect(fields);
          }
        }
      }),lang.hitch(this,function(error){
        if (error.message == 'Request canceled'){
          //request was cancled so do nothng
        }else{
          console.error("request layer info failed",error);
        }
        this._layerInfo = null;
      }));
      esriRequest.setRequestPreCallback();
      return def;
    },

    setConfig:function(config){
      this.config = config;
      this.resetAll();
      if(!this.config){
        return;
      }
      if(this.config.uniquevalsfromfield && this.config.uniquevalsfromfield.length > 0){
        this.uniqueRadio.checked = true;
        this.valueRadio.checked = false;
        this.predefinedRadio.checked = false;
      }
      if(this.config.date1minus){
        this.cbxDateMinus.setValue(true);
        this.dateNumberTextBox.set('value', parseInt(this.config.date1minus, 10));
      }
      this.operatorsSelect.set('value', lang.trim(this.config.operation || ""));
      this.valueSQL.set('value', lang.trim(this.config.sqltext || ""));
      this._fieldObj = this.config.fieldObj;
      this.promptTB.set('value', this.config.prompt || '');
      this.hintTB.set('value', this.config.textsearchhint || '');
      this._valueObj = this.config.valueObj;
      this.allAnySelect.value = this.config.operator;
      if(this.config.userlist && this.config.userlist.length > 0){
        this.cbxAskValues.setValue(true);
        this.predefinedRadio.checked = true;
        this.valueRadio.checked = false;
        this.uniqueRadio.checked = false;
        this.uservaluesTable.clear();
        this.unConcatUserListVals(this.config.userlist);
      }
      if(this.config.hasOwnProperty('required')){
        this.cbxValueRequired.setValue(true);
        this.isValueRequired = true;
      }
    },

    getConfig:function(){
      if(!this.validate(false)){
        return false;
      }
      this._getValue();
      this.buildSQL();
      var config = {
        fieldObj: this._fieldObj,
        valueObj: this._valueObj,
        prompt:lang.trim(this.promptTB.get('value')),
        textsearchhint:lang.trim(this.hintTB.get('value')),
        sqltext:lang.trim(this.valueSQL.get('value')),
        operation:lang.trim(this.operatorsSelect.get('value'))
      };
      if(this.cbxDateMinus.getValue() && (config.operation === this.OPERATORS.dateOperatorIsBetween || config.operation === this.OPERATORS.dateOperatorIsNotBetween)){
        config.date1minus = parseInt(this.dateNumberTextBox.get('value'), 10);
      }else{
        delete config.date1minus;
      }
      if(config.operation === this.OPERATORS.stringOperatorIsBlank ||
        config.operation === this.OPERATORS.stringOperatorIsNotBlank ||
        config.operation === this.OPERATORS.numberOperatorIsBlank ||
        config.operation === this.OPERATORS.numberOperatorIsNotBlank ||
        config.operation === this.OPERATORS.dateOperatorIsBlank ||
        config.operation === this.OPERATORS.dateOperatorIsNotBlank){
        var label = this.nls[config.operation];
        var alias = config.fieldObj.alias||config.fieldObj.name;
        var prompt = alias + ' ' + label;
        config.prompt = prompt;
      }
      if(this.uniqueRadio.checked){
        config.uniquevalsfromfield = this._fieldObj.name;
      }
      if(html.getStyle(this.matchMsg,'display') === 'block'){
        config.operator = this.allAnySelect.value;
      }
      if (this.predefinedRadio.checked){
        config.userlist = this.concatUserListVals();
      }
      if(this.cbxValueRequired.getValue()){
        config.required = true;
      }else{
        if(config.hasOwnProperty('required')){
          delete config.required;
        }
      }
      this.config = config;
      return this.config;
    },

    trimArray: function (arr){
      for(var i=0;i<arr.length;i++)
      {
        arr[i] = arr[i].replace(/^\s*/, '').replace(/\s*$/, '');
      }
      return arr;
    },

    unConcatUserListVals: function(valsstr){
      var valsArr;
      if (valsstr.indexOf("',") > -1){
        valsArr = this.trimArray(valsstr.split("',"));
        valsArr = array.map(valsArr, function(udv, indx){
          return String(udv) + "'";
        });
        var lVal = String(valsArr[valsArr.length - 1]);
        if (lVal.substring(lVal.length - 1) == "'"){
            valsArr[valsArr.length - 1] = lVal.substring(0,lVal.length - 1);
        }
      }else{
        valsArr = this.trimArray(valsstr.split(","));
      }
      var rowData;
      array.forEach(valsArr, lang.hitch(this, function(val) {
        var data = [];
        if(val.indexOf('|') < 0){
          data[0] = val;
          data[1] = val;
        }else{
          data = val.split('|');
        }
        rowData = {
          userlabel: data[0],
          uservalue: data[1]
        };
        this._createUserValue(rowData);
      }));
    },

    concatUserListVals: function(){
      var uVals = this.uservaluesTable.getData();
      var retStr =  array.map(uVals, lang.hitch(this, function(userVal) {
        var data = userVal.userlabel + "|" + userVal.uservalue;
        return data;
      })).join(",");
      return retStr;
    },

    resetAll:function(){
      this.promptTB.set('value', '');
      this.valueSQL.set('value', '');
      this.hintTB.set('value', '');
    },

    _getShortTypeByFieldType:function(fieldType){
      if(fieldType === this.stringFieldType){
        return 'string';
      }
      else if(fieldType === this.dateFieldType){
        return 'date';
      }
      else if(this.numberFieldTypes.indexOf(fieldType) >= 0){
        return 'number';
      }
      return null;
    },

    _checkExpressionNumbers:function(){
      var expCnt = this.len;
      if(expCnt > 1){
        this.allAnySelect.value = this.operator;
        html.setStyle(this.matchMsg,'display','block');
      }
      else{
        html.setStyle(this.matchMsg,'display','none');
      }
    },

    _initFieldsSelect:function(fieldInfos){
      var data = array.map(fieldInfos,lang.hitch(this,function(fieldInfo,index){
        var item = lang.mixin({},fieldInfo);
        item.id = index;
        item.shortType = this._getShortTypeByFieldType(fieldInfo.type);
        if(!item.alias){
          item.alias = item.name;
        }
        var a = '';
        if(item.shortType === 'string'){
          a = this.nls.string;
        }
        else if(item.shortType === 'number'){
          a = this.nls.number;
        }
        else if(item.shortType === 'date'){
          a = this.nls.date;
        }
        item.displayName = item.alias + " (" + a + ")";
        return item;
      }));

      if(data.length > 0){
        var store = new Memory({data:data});
        this.fieldsSelect.set('store',store);
        this.fieldsSelect.set('value',data[0].id);
      }
      this.fieldsSelect.focusNode.focus();
      this.fieldsSelect.focusNode.blur();

      this._fieldObj = {
        "name": fieldInfos[0].name,
        "label": fieldInfos[0].alias || fieldInfos[0].name,
        "shortType": this._getShortTypeByFieldType(fieldInfos[0].type),
        "type": fieldInfos[0].type
      };

      if(this.config && this.config.fieldObj){
        this._setValueOptions();
      }
    },

    _setValueOptions:function(){
      var fieldName = this.config.fieldObj.name;
      var operation = this.config.operation;
//      console.info(this.config.valueObj);
      this._valueObj = this.config.valueObj;
      var fieldItems = this.fieldsSelect.store.query({
        name: fieldName
      });
      if (fieldItems.length === 0) {
        return;
      }
      var fieldItem = fieldItems[0];
      if (!fieldItem) {
        return;
      }
      this.fieldsSelect.set('value', fieldItem.id);
      setTimeout(lang.hitch(this,function(){
        if(!this.domNode){
          return;
        }
        if (this.config.prompt !== ""){
          this.cbxAskValues.setValue(true);
        }
        this.operatorsSelect.set('value', operation);
        setTimeout(lang.hitch(this,function(){
          if (!this.domNode) {
            return;
          }
          //console.info("Calling _resetByFieldAndOperation from: ","_setValueOptions");
          this._resetByFieldAndOperation();
        }),200);

        setTimeout(lang.hitch(this, function() {
          if (!this.domNode) {
            return;
          }
          this._updatePrompt();
          this.promptTB.set('value', this.config.prompt || '');
          this.hintTB.set('value', this.config.textsearchhint || '');
          this._checkExpressionNumbers();
        }), 100);
      }),0);
    },

    _isFieldCoded:function(fieldInfo){
      var domain = fieldInfo.domain;
      return domain && domain.type === "codedValue" && domain.codedValues && domain.codedValues.length > 0;
    },

    _isFieldSubType:function(fieldInfo){
      if(this._layerInfo.typeIdField){
        return this._layerInfo.typeIdField.toUpperCase() === fieldInfo.name.toUpperCase();
      }
      return false;
    },

    _focusValidationTextBox:function(_dijit){
      if(_dijit){
        if(_dijit.focusNode){
          _dijit.focusNode.focus();
        }
      }
    },

    _onFieldsSelectChange:function(){
      this.operatorsSelect.removeOption(this.operatorsSelect.getOptions());
      this.operatorsSelect.addOption({value:'none',label:this.nls.none});
      if(this.uniqueRadio.checked === false && this.predefinedRadio.checked === false){
        this.valueRadio.checked = true;
      }
      var fieldInfo = this._getSelectedFilteringItem(this.fieldsSelect);
      if (fieldInfo) {
        this.operatorsSelect.shortType = fieldInfo.shortType;
        var operators = this._getOperatorsByShortType(fieldInfo.shortType);
        this.operatorsSelect.removeOption(this.operatorsSelect.getOptions());
        array.forEach(operators, lang.hitch(this, function(operator) {
          var label = this.nls[operator];
          this.operatorsSelect.addOption({value: operator,label: label});
        }));
      }
      this._fieldObj =
      {
        "name": fieldInfo.name,
        "label": fieldInfo.alias || fieldInfo.name,
        "shortType": fieldInfo.shortType,
        "type": fieldInfo.type
      };
      this._onOperatorsSelectChange();
      this.hintTB.set('value','');
    },

    _getSelectedFilteringItem:function(_select){
      if(_select.validate()){
        var id = _select.get('value');
        if(isNaN(id)){
          this._showValidationErrorTip(_select);
        }
        else{
          var items = _select.store.query({id: id});
          if(items.length > 0){
            var item = items[0];
            if(item){
              return item;
            }
          }
        }
      }
      else{
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

    _getOperatorsByShortType:function(shortType){
      var operators = [];
      if(shortType === 'string'){
        operators = [
          this.OPERATORS.stringOperatorIs,
          this.OPERATORS.stringOperatorIsNot,
          this.OPERATORS.stringOperatorStartsWith,
          this.OPERATORS.stringOperatorEndsWith,
          this.OPERATORS.stringOperatorContains,
          this.OPERATORS.stringOperatorDoesNotContain,
          this.OPERATORS.stringOperatorIsBlank,
          this.OPERATORS.stringOperatorIsNotBlank,
          this.OPERATORS.stringOperatorIn
        ];
      }
      else if(shortType === 'number'){
        operators = [
          this.OPERATORS.numberOperatorIs,
          this.OPERATORS.numberOperatorIsNot,
          this.OPERATORS.numberOperatorIsAtLeast,
          this.OPERATORS.numberOperatorIsLessThan,
          this.OPERATORS.numberOperatorIsAtMost,
          this.OPERATORS.numberOperatorIsGreaterThan,
          this.OPERATORS.numberOperatorIsBetween,
          this.OPERATORS.numberOperatorIsNotBetween,
          this.OPERATORS.numberOperatorIsBlank,
          this.OPERATORS.numberOperatorIsNotBlank,
          this.OPERATORS.numberOperatorIn
        ];
      }
      else if(shortType === 'date'){
        operators = [
          this.OPERATORS.dateOperatorIsOn,
          this.OPERATORS.dateOperatorIsNotOn,
          this.OPERATORS.dateOperatorIsBeforeOrOn,
          this.OPERATORS.dateOperatorIsAfterOrOn,
          this.OPERATORS.dateOperatorIsBefore,
          this.OPERATORS.dateOperatorIsAfter,
          this.OPERATORS.dateOperatorIsBetween,
          this.OPERATORS.dateOperatorIsNotBetween,
          this.OPERATORS.dateOperatorIsBlank,
          this.OPERATORS.dateOperatorIsNotBlank
        ];
      }
      return operators;
    },

    _onOperatorsSelectChange:function(){
      if(this.uniqueRadio.checked === false && this.predefinedRadio.checked === false){
        this.valueRadio.checked = true;
      }
      var operator = this.operatorsSelect.get('value');
      if(this.cbxDateMinus.getValue() && (operator !== this.OPERATORS.dateOperatorIsBetween && operator !== this.OPERATORS.dateOperatorIsNotBetween)){
        this.cbxDateMinus.setValue(false);
      }
      if(this.config.date1minus && (operator === this.OPERATORS.dateOperatorIsBetween || operator === this.OPERATORS.dateOperatorIsNotBetween)){
        this.cbxDateMinus.setValue(true);
      }
      if(operator === this.OPERATORS.stringOperatorIsBlank ||
        operator === this.OPERATORS.stringOperatorIsNotBlank ||
        operator === this.OPERATORS.numberOperatorIsBlank ||
        operator === this.OPERATORS.numberOperatorIsNotBlank ||
        operator === this.OPERATORS.dateOperatorIsBlank ||
        operator === this.OPERATORS.dateOperatorIsNotBlank){
        this.valueRadio.checked = true;
        this.cbxAskValues.setValue(false);
        this.cbxAskValues.status = false;
        this.cbxValueRequired.status = false;
        html.setStyle(this.attributeValueContainer,'display','none');
      }
      //console.info("Calling _resetByFieldAndOperation from: ","_onOperatorsSelectChange");
      this._resetByFieldAndOperation();
    },

    _onRangeNumberBlur:function(){
      if(this.numberTextBox1.validate() && this.numberTextBox2.validate()){
        var value1 = this._getValueForNumberTextBox(this.numberTextBox1);
        var value2 = this._getValueForNumberTextBox(this.numberTextBox2);
        if(jimuUtils.isValidNumber(value1) && jimuUtils.isValidNumber(value2)){
          if(value1 > value2){
            this._setValueForNumberTextBox(this.numberTextBox1, value2);
            this._setValueForNumberTextBox(this.numberTextBox2, value1);
          }
        }
      }
      //console.info("Calling _resetByFieldAndOperation from: ","_onRangeNumberBlur");
      this._resetByFieldAndOperation();
    },

    _getProcessedString: function(str){
      if(jimuUtils.isNotEmptyString(str, true)){
        return str;
      }
      return "";
    },

    _getProcessedNumber: function(num){
      if(jimuUtils.isValidNumber(num)){
        return num;
      }
      return null;
    },

    _setValueForStringTextBox: function(stringTextBox, str){
      str = this._getProcessedString(str);
      stringTextBox.set('value', str);
    },

    _setValueForNumberTextBox: function(numberTextBox, num){
      if(jimuUtils.isValidNumber(num)){
        numberTextBox.set('value', num);
      }
    },

    _getValueForNumberTextBox: function(numberTextBox){
      var value = numberTextBox.get('value');
      return this._getProcessedNumber(value);
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
      //console.info("Calling _resetByFieldAndOperation from: ","_onRangeDateBlur");
      this._resetByFieldAndOperation();
    },

    _createUserValue:function(rowData){
      var result = this.uservaluesTable.addRow(rowData);
      if(!result.success){
        return null;
      }
    },

    _changeStartDate: function() {
      if(this.cbxDateMinus.getValue()){
        var minusVal = this.dateNumberTextBox.get('value');
        if(minusVal){
          var minusDays = parseInt(minusVal, 10);
          var today = new Date();
          var priorDate = new Date(today.getTime() - (this.dayInMS * minusDays));
          this.dateTextBox1.set('value', priorDate);
        }
      }else{
        this.dateTextBox1.set('value', new Date());
      }
    },

    _bindEvents:function(){
      this.own(on(this.dateNumberTextBox, 'change', lang.hitch(this, this._changeStartDate)));
      this.cbxDateMinus.onChange = lang.hitch(this, this._changeStartDate);

      this.own(on(this.numberTextBox, 'change', lang.hitch(this, this._checkProceed)));
      this.own(on(this.dateTextBox, 'change', lang.hitch(this, this._checkProceed)));
      this.own(on(this.stringTextBox, 'change', lang.hitch(this, this._checkProceed)));
      this.own(on(this.hintTB, 'change', lang.hitch(this, this._checkProceed)));
      this.own(on(this.btnAddUserValue, 'click', lang.hitch(this,function(){
        var rowData = {
          userlabel: '',
          uservalue: ''
        };
        this._createUserValue(rowData);
      })));
      this.cbxAskValues.onChange = lang.hitch(this, this._onCbxAskValuesClicked);
      this.cbxValueRequired.onChange = lang.hitch(this, function(){
        this._valueObj = this.config.valueObj;
        var fieldInfo = (this.fieldsSelect) ? this._getSelectedFilteringItem(this.fieldsSelect) : null;
        if(fieldInfo && this.layerURL && this.layerUniqueCache[this.layerURL]){
          delete this.layerUniqueCache[this.layerURL][fieldInfo.name];
        }
        //console.info("Calling _resetByFieldAndOperation from: ","cbxValueRequired.onChange");
        this._resetByFieldAndOperation();
      });
    },

    _checkProceed: function() {
      if(!this.popup){
        return;
      }
      var errormessage = '';
      var canProceed = true;
      html.setAttr(this.errorMessage, 'innerHTML', '');

      if(this.cbxAskValues.getValue()){
        if(lang.trim(this.hintTB.get('value')) === ''){
          canProceed = false;
          errormessage += this.nls.hint + ' ' + this.nls.requiredfield + ' ';
        }
        if(this.valueRadio.checked){
          if(this.cbxValueRequired.getValue()){
            this._getValue();
            if(!this._valueObj.value && !this._valueObj.value1 && !this._valueObj.value2){
              canProceed = false;
              if(errormessage === ''){
                errormessage += this.nls.value + ' ' + this.nls.requiredfield + ' ';
              }else{
                errormessage += ', ' + this.nls.value + ' ' + this.nls.requiredfield;
              }
            }
          }
        }
      }else{
        if(this.valueRadio.checked){
          if(this.cbxValueRequired.getValue()){
            this._getValue();
            if(!this._valueObj.value && !this._valueObj.value1 && !this._valueObj.value2){
              canProceed = false;
              if(errormessage === ''){
                errormessage += this.nls.value + ' ' + this.nls.requiredfield + ' ';
              }else{
                errormessage += ', ' + this.nls.value + ' ' + this.nls.requiredfield;
              }
            }
          }
        }
      }

      if (canProceed) {
        this.popup.enableButton(0);
      } else {
        this.popup.disableButton(0);
        if (errormessage) {
          html.setAttr(this.errorMessage, 'innerHTML', errormessage);
        }
      }
    },

    validate:function(showTooltip){
      if(lang.trim(this.valueSQL.get('value')) === ''){
        if(showTooltip){
          this._showTooltip(this.valueSQL.domNode,"Please input value.");
        }
        return false;
      }
      if(this.cbxAskValues.getValue()){
        if(lang.trim(this.hintTB.get('value')) === ''){
          if(showTooltip){
            this._showTooltip(this.hintTB.domNode,"Please input value.");
          }
          return false;
        }
      }
      return true;
    },

    _showTooltip:function(aroundNode, content, time){
      this._scrollToDom(aroundNode);
      Tooltip.show(content,aroundNode);
      time = time ? time : 2000;
      setTimeout(function(){
        Tooltip.hide(aroundNode);
      },time);
    },

    _scrollToDom:function(dom){
      var scrollDom = this.searchSetting.domNode.parentNode;
      var y1 = html.position(scrollDom).y;
      var y2 = html.position(dom).y;
      scrollDom.scrollTop = y2 - y1;
    },

    _initRadios:function(){
      var group = "radio_" + jimuUtils.getRandomString();
      this.valueRadio.name = group;

      jimuUtils.combineRadioCheckBoxWithLabel(this.valueRadio, this.valueLabel);

      this.own(on(this.valueRadio,'click',lang.hitch(this,this._resetByFieldAndOperation)));
      if(this.uniqueRadio){
        this.uniqueRadio.name = group;
        jimuUtils.combineRadioCheckBoxWithLabel(this.uniqueRadio, this.uniqueLabel);
        this.own(on(this.uniqueRadio,'click',lang.hitch(this,this._resetByFieldAndOperation)));
      }
      if(this.predefinedRadio){
        this.predefinedRadio.name = group;
        jimuUtils.combineRadioCheckBoxWithLabel(this.predefinedRadio, this.predefinedLabel);
        this.own(on(this.predefinedRadio,'click',lang.hitch(this,this._resetByFieldAndOperation)));
      }
      //console.info("Calling _resetByFieldAndOperation from: ","_initRadios");
      this._resetByFieldAndOperation();
    },

    _enableRadios:function(){
      this.valueRadio.disabled = false;
      html.setStyle(this.valueLabel,'color','initial');
      if(this.uniqueRadio){
        this.uniqueRadio.disabled = false;
        html.setStyle(this.uniqueLabel,'color','initial');
      }
      if(this.predefinedRadio && this.cbxAskValues.getValue()){
        this.predefinedRadio.disabled = false;
        html.setStyle(this.predefinedLabel,'color','initial');
      }
    },

    _disableRadios:function(){
      this.valueRadio.disabled = true;
      html.setStyle(this.valueLabel,'color','lightgray');
      if(this.uniqueRadio){
        this.uniqueRadio.disabled = true;
        html.setStyle(this.uniqueLabel,'color','lightgray');
      }
      if(this.predefinedRadio){
        this.predefinedRadio.disabled = true;
        html.setStyle(this.predefinedLabel,'color','lightgray');
      }
    },

    _resetByFieldAndOperation:function(){
      this.isValueRequired = this.cbxValueRequired.getValue();
      html.setStyle(this.attributeValueContainer,'display','block');
      this._enableRadios();

      var fieldInfo = (this.fieldsSelect) ? this._getSelectedFilteringItem(this.fieldsSelect) : null;
      var shortType = fieldInfo && fieldInfo.shortType;
      var operator = this.operatorsSelect.get('value');
      if(fieldInfo){
        if(shortType === 'string'){
          switch(operator){
          case this.OPERATORS.stringOperatorStartsWith:
          case this.OPERATORS.stringOperatorEndsWith:
          case this.OPERATORS.stringOperatorContains:
          case this.OPERATORS.stringOperatorDoesNotContain:
          case this.OPERATORS.stringOperatorIn:
            this.uniqueRadio.disabled = true;
            html.setStyle(this.uniqueLabel,'color','lightgray');
            break;
          default:
            break;
          }
        }
        else if(shortType === 'number'){
          switch(operator){
          case this.OPERATORS.numberOperatorIsBetween:
          case this.OPERATORS.numberOperatorIsNotBetween:
          case this.OPERATORS.numberOperatorIn:
            this.valueRadio.checked = true;
            this._disableRadios();
            break;
          default:
            break;
          }
        }
        else if(shortType === 'date'){
          switch(operator){
          case this.OPERATORS.dateOperatorIsBetween:
          case this.OPERATORS.dateOperatorIsNotBetween:
            this.valueRadio.checked = true;
            this._disableRadios();
            break;
          default:
            break;
          }
          if(this.uniqueRadio){
            this.uniqueRadio.disabled = true;
            html.setStyle(this.uniqueLabel,'color','lightgray');
            if(this.uniqueRadio.checked){
              this.valueRadio.checked = true;
            }
          }
        }
      }
//      console.info(this.config.valueObj);
      this.buildSQL();
      this._updateUIOfAttrValueContainer(fieldInfo, operator);
    },

    /*_onCbxOverrideSQLClicked:function(){
      this.valueSQL.set('disabled', !this.cbxOverrideSQL.checked);
    },*/

    buildSQL:function(){
      /*if(this.cbxOverrideSQL.checked){
        return;
      }*/
      var whereClause = "";
      var prefix, suffix;
      var operator = this.operatorsSelect.get('value');
      if (this.uniqueRadio.checked || this.predefinedRadio.checked || operator == this.OPERATORS.stringOperatorIn){
        prefix = "";
        suffix = "";
      }else{
        prefix = "Upper(";
        suffix = ")";
      }

//      this._getValue();
      var value, value1, value2;
      if(!this._valueObj){
        value = "";
        value1 = "";
        value2 = "";
      }else{
        value = this._valueObj.value || "";
        value1 = this._valueObj.value1 || "";
        value2 = this._valueObj.value2 || "";
      }

      var fieldInfo = (this.fieldsSelect) ? this._getSelectedFilteringItem(this.fieldsSelect) : null;

      var shortType = fieldInfo && fieldInfo.shortType;
      if (this.cbxAskValues.getValue()){
        value = '[value]';
        value1 = '[value1]';
        value2 = '[value2]';
      }

      if(shortType === "string"){
        switch (operator) {
          case this.OPERATORS.stringOperatorIn:
            whereClause = prefix + fieldInfo.name + suffix + " IN (" + prefix + "'" + value.replace(/\'/g, "''") + "'" + suffix + ")";
            break;
          case this.OPERATORS.stringOperatorIs:
            whereClause = prefix + fieldInfo.name + suffix + " = " + prefix + "'" + value.replace(/\'/g, "''") + "'" + suffix;
            break;
          case this.OPERATORS.stringOperatorIsNot:
            whereClause = prefix + fieldInfo.name + suffix + " <> " + prefix + "'" + value.replace(/\'/g, "''") + "'" + suffix;
            break;
          case this.OPERATORS.stringOperatorStartsWith:
            whereClause = prefix + fieldInfo.name + suffix + " LIKE " + prefix + "'" + value.replace(/\'/g, "''") + "%'" + suffix;
            break;
          case this.OPERATORS.stringOperatorEndsWith:
            whereClause = prefix + fieldInfo.name + suffix + " LIKE " + prefix + "'%" + value.replace(/\'/g, "''") + "'" + suffix;
            break;
          case this.OPERATORS.stringOperatorContains:
            whereClause = prefix + fieldInfo.name + suffix + " LIKE " + prefix + "'%" + value.replace(/\'/g, "''") + "%'" + suffix;
            break;
          case this.OPERATORS.stringOperatorDoesNotContain:
            whereClause = prefix + fieldInfo.name + suffix + " NOT LIKE " + prefix + "'%" + value.replace(/\'/g, "''") + "%'" + suffix;
            break;
          case this.OPERATORS.stringOperatorIsBlank:
            whereClause = fieldInfo.name + " IS NULL";
            break;
          case this.OPERATORS.stringOperatorIsNotBlank:
            whereClause = fieldInfo.name + " IS NOT NULL";
            break;
        }
      } else if (shortType === "number") {
        switch (operator) {
          case this.OPERATORS.numberOperatorIn:
            whereClause = fieldInfo.name + " IN (" + value + ")";
            break;
          case this.OPERATORS.numberOperatorIs:
            whereClause = fieldInfo.name + " = " + value;
            break;
          case this.OPERATORS.numberOperatorIsNot:
            whereClause = fieldInfo.name + " <> " + value;
            break;
          case this.OPERATORS.numberOperatorIsAtLeast:
            whereClause = fieldInfo.name + " >= " + value;
            break;
          case this.OPERATORS.numberOperatorIsLessThan:
            whereClause = fieldInfo.name + " < " + value;
            break;
          case this.OPERATORS.numberOperatorIsAtMost:
            whereClause = fieldInfo.name + " <= " + value;
            break;
          case this.OPERATORS.numberOperatorIsGreaterThan:
            whereClause = fieldInfo.name + " > " + value;
            break;
          case this.OPERATORS.numberOperatorIsBetween:
            whereClause = fieldInfo.name + " BETWEEN " + value1 + " AND " + value2;
            break;
          case this.OPERATORS.numberOperatorIsNotBetween:
            whereClause = fieldInfo.name + " NOT BETWEEN " + value1 + " AND " + value2;
            break;
          case this.OPERATORS.numberOperatorIsBlank:
            whereClause = fieldInfo.name + " IS NULL";
            break;
          case this.OPERATORS.numberOperatorIsNotBlank:
            whereClause = fieldInfo.name + " IS NOT NULL";
            break;
        }
      } else { //Date
        if (this.cbxAskValues.getValue() === false){
          if(value && value !== '' && value !== '[value]'){
            value = new Date(value);
          }
          if(value1){
            value1 = new Date(value1);
          }
          if(value2){
            value2 = new Date(value2);
          }
        } else {
          if(value){
            value = "[value]";
          }
          if(value1){
            value1 = "[value1]";
          }
          if(value2){
            value2 = "[value2]";
          }
        }

        switch (operator) {
        case this.OPERATORS.dateOperatorIsOn:
          whereClause = fieldInfo.name + " BETWEEN " + (this.isHosted ? "" : "timestamp ") +
            "'" + (this.cbxAskValues.getValue() ? "[value]" : this.formatDate(value)) + "' AND " + (this.isHosted ? "" : "timestamp ") +
            "'" + (this.cbxAskValues.getValue() ? "[value]" : this.formatDate(this.addDay(value))) + "'";
          break;
        case this.OPERATORS.dateOperatorIsNotOn:
          whereClause = fieldInfo.name +
              " NOT BETWEEN " + (this.isHosted ? "" : "timestamp ") +
              "'" + (this.cbxAskValues.getValue() ? "[value]" : this.formatDate(value)) + "' AND " + (this.isHosted ? "" : "timestamp ") +
              "'" + (this.cbxAskValues.getValue() ? "[value]" : this.formatDate(this.addDay(value))) + "'";
          break;
        case this.OPERATORS.dateOperatorIsBefore:
          whereClause = fieldInfo.name + " < " +
             (this.isHosted ? "" : "timestamp ") + "'" + (this.cbxAskValues.getValue() ? "[value]" : this.formatDate(value)) + "'";
          break;
        case this.OPERATORS.dateOperatorIsAfter:
          whereClause = fieldInfo.name + " > " +
             (this.isHosted ? "" : "timestamp ") + "'" + (this.cbxAskValues.getValue() ? "[value]" : this.formatDate(this.addDay(value))) + "'";
          break;
        case this.OPERATORS.dateOperatorIsBeforeOrOn:
          whereClause = fieldInfo.name + " <= " +
             (this.isHosted ? "" : "timestamp ") + "'" + (this.cbxAskValues.getValue() ? "[value]" : this.formatDate(value)) + "'";
          break;
        case this.OPERATORS.dateOperatorIsAfterOrOn:
          whereClause = fieldInfo.name + " >= " +
             (this.isHosted ? "" : "timestamp ") + "'" + (this.cbxAskValues.getValue() ? "[value]" : this.formatDate(this.addDay(value))) + "'";
          break;
        case this.OPERATORS.dateOperatorIsBetween:
          whereClause = fieldInfo.name + " BETWEEN " +
             (this.isHosted ? "" : "timestamp ") +
              "'" + (this.cbxAskValues.getValue() ? "[value1]" : this.formatDate(value1)) + "' AND " + (this.isHosted ? "" : "timestamp ") +
              "'" + (this.cbxAskValues.getValue() ? "[value2]" : this.formatDate(this.addDay(value2))) + "'";
          break;
        case this.OPERATORS.dateOperatorIsNotBetween:
          whereClause = fieldInfo.name + " NOT BETWEEN " +
             (this.isHosted ? "" : "timestamp ") + "'" + (this.cbxAskValues.getValue() ? "[value1]" : this.formatDate(value1)) +
              "' AND " + (this.isHosted ? "" : "timestamp ") +
              "'" + (this.cbxAskValues.getValue() ? "[value2]" : this.formatDate(this.addDay(value2))) + "'";
          break;
        case this.OPERATORS.dateOperatorIsBlank:
          whereClause = fieldInfo.name + " IS NULL";
          break;
        case this.OPERATORS.dateOperatorIsNotBlank:
          whereClause = fieldInfo.name + " IS NOT NULL";
          break;
        }
      }
      this.valueSQL.set('value', lang.trim(whereClause));
    },

    formatDate: function(value){
      if(value === '[value]' || value === ''){
        return value;
      }
      // see also parseDate()
      // to bypass the locale dependent connector character format date and time separately
      var s1 = locale.format(value, {
        datePattern: "yyyy-MM-dd",
        selector: "date"
      });
      var s2 = locale.format(value, {
        selector: "time",
        timePattern: "HH:mm:ss"
      });
      return s1 + " " + s2;
    },

    addDay: function(date){
      if(date === '[value]' || date === ''){
        return date;
      }
      return new Date(date.getTime() + this.dayInMS);
    },

    _updateUIOfAttrValueContainer:function(fieldInfo, operator){
      this._updatePrompt();
      //radio->shortType->operator
      //radio->interative
      var shortType = fieldInfo && fieldInfo.shortType;
      var isShortTypeValid = shortType === 'string' || shortType === 'number' || shortType === 'date';
      if(isShortTypeValid){
        html.setStyle(this.attributeValueContainer,'display','block');
      }else{
        html.setStyle(this.attributeValueContainer,'display','none');
        return;
      }

      if(this.valueRadio.checked){
        html.setStyle(this.valuesTable,'display','none');
        html.setStyle(this.uniqueValuesSelect.domNode,'display','none');
        this._showAllValueBoxContainer();
        this._resetValueTextBox();
        if(shortType === 'string'){
          html.setStyle(this.stringTextBoxContainer,'display','block');
          html.setStyle(this.numberTextBoxContainer,'display','none');
          html.setStyle(this.dateTextBoxContainer,'display','none');

          if(this._isFieldCoded(fieldInfo) && operator === this.OPERATORS.stringOperatorIs){
            html.setStyle(this.stringCodedValuesFS.domNode,'display','inline-block');
            html.setStyle(this.stringTextBox.domNode,'display','none');
            var stringDomain = fieldInfo.domain;
            var stringCodedData = array.map(stringDomain.codedValues,lang.hitch(this,function(item,index){
              //item:{name,code},name is the code description and code is code value.
              var dataItem = lang.mixin({},item);
              dataItem.id = index;
              return dataItem;
            }));
            if(!this.isValueRequired){
              var dataItem2 = lang.mixin({}, {name:'',code:''});
              dataItem2.id = stringCodedData.length;
              stringCodedData.unshift(dataItem2);
            }
            var stringCodedStore = new Memory({data:stringCodedData});
            this.stringCodedValuesFS.set('store', stringCodedStore);
            if(this._valueObj){
              var stringSelectedItems = array.filter(stringCodedData,lang.hitch(this,function(item){
                return item.code === this._valueObj.value;
              }));
              if(stringSelectedItems.length > 0){
                this.stringCodedValuesFS.set('value',stringSelectedItems[0].id);
              }else{
                this.stringCodedValuesFS.set('value',stringCodedData[0].id);
              }
            }else{
              this.stringCodedValuesFS.set('value',stringCodedData[0].id);
            }
          }else{
            html.setStyle(this.stringTextBox.domNode,'display','inline-block');
            html.setStyle(this.stringCodedValuesFS.domNode,'display','none');
            if(this._valueObj){
              this._setValueForStringTextBox(this.stringTextBox, this._valueObj.value);
            }
          }

          if(operator === this.OPERATORS.stringOperatorIsBlank || operator === this.OPERATORS.stringOperatorIsNotBlank){
            html.setStyle(this.attributeValueContainer,'display','none');
          }
        }else if(shortType === 'number'){
          html.setStyle(this.stringTextBoxContainer,'display','none');
          html.setStyle(this.numberTextBoxContainer,'display','block');
          html.setStyle(this.dateTextBoxContainer,'display','none');
          if(operator === this.OPERATORS.numberOperatorIsBetween || operator === this.OPERATORS.numberOperatorIsNotBetween){
            html.setStyle(this.numberTextBox.domNode,'display','none');
            html.setStyle(this.numberRangeTable,'display','table');
            html.setStyle(this.numberCodedValuesFS.domNode,'display','none');
            if(this._valueObj){
              var num1, num2;
              var isValidValue1 = jimuUtils.isValidNumber(this._valueObj.value1);
              var isValidValue2 = jimuUtils.isValidNumber(this._valueObj.value2);

              if(isValidValue1 && isValidValue2){
                num1 = parseFloat(this._valueObj.value1);
                num2 = parseFloat(this._valueObj.value2);
                var min = Math.min(num1, num2);
                var max = Math.max(num1, num2);
                this.numberTextBox1.set('value', min);
                this.numberTextBox2.set('value', max);
              }else if(isValidValue1 && !isValidValue2){
                num1 = parseFloat(this._valueObj.value1);
                this.numberTextBox1.set('value', num1);
              }else if(!isValidValue1 && isValidValue2){
                num2 = parseFloat(this._valueObj.value2);
                this.numberTextBox2.set('value', num2);
              }
            }
          }
          else{
            html.setStyle(this.numberRangeTable,'display','none');
            if(this._isFieldCoded(fieldInfo) && operator === this.OPERATORS.numberOperatorIs){
              html.setStyle(this.numberTextBox.domNode,'display','none');
              html.setStyle(this.numberCodedValuesFS.domNode,'display','inline-block');
              var numberDomain = fieldInfo.domain;
              var numberCodedData = array.map(numberDomain.codedValues,lang.hitch(this,function(item,index){
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
              if(this._valueObj && !isNaN(this._valueObj.value)){
                var number = parseFloat(this._valueObj.value);
                var numberSelectedItems = array.filter(numberCodedData,lang.hitch(this,function(item){
                  return parseFloat(item.code) === number;
                }));
                if(numberSelectedItems.length > 0){
                  this.numberCodedValuesFS.set('value',numberSelectedItems[0].id);
                }
                else{
                  this.numberCodedValuesFS.set('value',numberCodedData[0].id);
                }
              }
              else{
                this.numberCodedValuesFS.set('value',numberCodedData[0].id);
              }
            }
            else{
              html.setStyle(this.numberTextBox.domNode,'display','inline-block');
              html.setStyle(this.numberCodedValuesFS.domNode,'display','none');
              if(this._valueObj){
                if(!isNaN(this._valueObj.value)){
                  this.numberTextBox.set('value',parseFloat(this._valueObj.value));
                }
              }
            }
          }
          if(operator === this.OPERATORS.numberOperatorIsBlank || operator === this.OPERATORS.numberOperatorIsNotBlank){
            html.setStyle(this.attributeValueContainer,'display','none');
          }
        }
        else if(shortType === 'date'){
          html.setStyle(this.stringTextBoxContainer,'display','none');
          html.setStyle(this.numberTextBoxContainer,'display','none');
          html.setStyle(this.dateTextBoxContainer,'display','block');

          if(operator === this.OPERATORS.dateOperatorIsBetween ||
             operator === this.OPERATORS.dateOperatorIsNotBetween){
            html.setStyle(this.dateTextBox.domNode,'display','none');
            html.setStyle(this.dateRangeTable,'display','table');
            if(this._valueObj && this._valueObj.value1 && this._valueObj.value2){
              if (this._valueObj.value1 === '[value]' && !this.dateminus){return;}
              this.dateTextBox1.set('value', new Date(this._valueObj.value1));
              this.dateTextBox2.set('value', new Date(this._valueObj.value2));
            }
          }
          else{
            html.setStyle(this.dateTextBox.domNode,'display','inline-block');
            html.setStyle(this.dateRangeTable,'display','none');
            if(this._valueObj && this._valueObj.value){
              if (this._valueObj.value === '[value]'){return;}
              this.dateTextBox.set('value', new Date(this._valueObj.value));
            }
          }

          if(operator === this.OPERATORS.dateOperatorIsBlank || operator === this.OPERATORS.dateOperatorIsNotBlank){
            html.setStyle(this.attributeValueContainer,'display','none');
          }
        }
      }
      else if(this.uniqueRadio && this.uniqueRadio.checked){
        this._hideAllValueBoxContainer();
        html.setStyle(this.uniqueValuesSelect.domNode,'display','inline-block');
        html.setStyle(this.valuesTable,'display','none');
        this._resetUniqueValuesSelect();
      }
      else if(this.predefinedRadio && this.predefinedRadio.checked){
        this._hideAllValueBoxContainer();
        html.setStyle(this.valuesTable,'display','table-row');
      }
    },

    _showAllValueBoxContainer:function(){
      html.setStyle(this.allValueBoxContainer,'display','block');
    },

    _hideAllValueBoxContainer:function(){
      html.setStyle(this.allValueBoxContainer,'display','none');
    },

    _resetValueTextBox:function(){
      this.stringTextBox.set('value','');
      this.numberTextBox.set('value','');
      this.dateTextBox.set('value',new Date());
    },

    _getValue:function(){
      if (!this._valueObj){
        this._valueObj = {};
      }
      var fieldInfo = this._getSelectedFilteringItem(this.fieldsSelect);
      if(!fieldInfo){
        return null;
      }
      var shortType = fieldInfo.shortType;
      var operator = this.operatorsSelect.get('value');
      if(this.valueRadio.checked){
        if(shortType === 'string'){
          if(operator === this.OPERATORS.stringOperatorIsBlank ||
             operator === this.OPERATORS.stringOperatorIsNotBlank){
            this._valueObj.value = null;
          }
          else{
            if(this._isFieldCoded(fieldInfo) && operator === this.OPERATORS.stringOperatorIs){
              if(!this.stringCodedValuesFS.validate()){
                this._showValidationErrorTip(this.stringCodedValuesFS);
                return null;
              }
              var stirngCodedItem = this._getSelectedFilteringItem(this.stringCodedValuesFS);
              this._valueObj.value = stirngCodedItem.code;
            }
            else{
              if(!this.stringTextBox.validate()){
                this._showValidationErrorTip(this.stringTextBox);
                return null;
              }
              this._valueObj.value = this.stringTextBox.get('value');
            }
          }
        }
        else if(shortType === 'number'){
          if(operator === this.OPERATORS.numberOperatorIsBlank ||
             operator === this.OPERATORS.numberOperatorIsNotBlank){
            this._valueObj.value = null;
          }
          else if(operator === this.OPERATORS.numberOperatorIsBetween ||
                  operator === this.OPERATORS.numberOperatorIsNotBetween){
            if(!this.numberTextBox1.validate()){
              this._showValidationErrorTip(this.numberTextBox1);
              return null;
            }
            if(!this.numberTextBox2.validate()){
              this._showValidationErrorTip(this.numberTextBox2);
              return null;
            }
            this._valueObj.value1 = parseFloat(this.numberTextBox1.get('value'));
            this._valueObj.value2 = parseFloat(this.numberTextBox2.get('value'));
            delete this._valueObj.value;
          }
          else{
            if(this._isFieldCoded(fieldInfo) && operator === this.OPERATORS.numberOperatorIs){
              if(!this.numberCodedValuesFS.validate()){
                this._showValidationErrorTip(this.numberCodedValuesFS);
                return null;
              }
              var numberCodedItem = this._getSelectedFilteringItem(this.numberCodedValuesFS);
              this._valueObj.value = parseFloat(numberCodedItem.code);
            }
            else if(this._isFieldSubType(fieldInfo) && operator === this.OPERATORS.numberOperatorIs){
              if(!this.numberCodedValuesFS.validate()){
                this._showValidationErrorTip(this.numberCodedValuesFS);
                return null;
              }
              var numberCodedItem2 = this._getSelectedFilteringItem(this.numberCodedValuesFS);
              this._valueObj.value = parseFloat(numberCodedItem2.code);
            }
            else{
              if(!this.numberTextBox.validate()){
                this._showValidationErrorTip(this.numberTextBox);
                return null;
              }
              this._valueObj.value = parseFloat(this.numberTextBox.get('value'));
            }
          }
        }
        else if(shortType === 'date'){
          if(operator === this.OPERATORS.dateOperatorIsBlank ||
             operator === this.OPERATORS.dateOperatorIsNotBlank){
            this._valueObj.value = null;
          }
          else if(operator === this.OPERATORS.dateOperatorIsBetween ||
                  operator === this.OPERATORS.dateOperatorIsNotBetween){
            if(!this.dateTextBox1.validate()){
              this._showValidationErrorTip(this.dateTextBox1);
              return null;
            }
            if(!this.dateTextBox2.validate()){
              this._showValidationErrorTip(this.dateTextBox2);
              return null;
            }
            if(this.cbxAskValues.getValue()){
              this._valueObj.value1 = "[value]";
              this._valueObj.value2 = "[value]";
            } else {
              this._valueObj.value1 = this.dateTextBox1.get('value').toDateString();
              this._valueObj.value2 = this.dateTextBox2.get('value').toDateString();
            }
            delete this._valueObj.value;
          }
          else{
            if(!this.dateTextBox.validate()){
              this._showValidationErrorTip(this.dateTextBox);
              return null;
            }
            this._valueObj.value = this.dateTextBox.get('value').toDateString();
          }
        }
      }
      else if(this.uniqueRadio && this.uniqueRadio.checked){
        var uniqueItem = this._getSelectedFilteringItem(this.uniqueValuesSelect);
        if(!uniqueItem){
          this._showValidationErrorTip(this.uniqueValuesSelect);
          return null;
        }

        if(shortType === 'string'){
          this._valueObj.value = uniqueItem.code;
        }
        else if(shortType === 'number'){
          this._valueObj.value = parseFloat(uniqueItem.code);
        }
      }
    },

    _resetUniqueValuesSelect:function(){
      if(this.pagingWasCanceled){
        this._type = 1;
        this._showDijit(this.stringTextBox);
        this._hideDijit(this.uniqueValuesSelect);
        this.stringTextBox.set('value', '');
        html.setStyle(this.uniqueMessageTR, 'display', 'none');
        this.uniqueMessageNode.innerHTML = '';
        return;
      }
      this.uniqueValuesSelect.set('displayedValue','');
      var store = new Memory({data:[]});
      this.uniqueValuesSelect.set('store',store);
      if(this._layerInfo){
        var item2 = (this.fieldsSelect) ? this._getSelectedFilteringItem(this.fieldsSelect) : null;
        if(!item2){
          return;
        }
        var stringCodedData, uniqueCache;
        //console.info(this.layerUniqueCache);
        if(this.disableuvcache){
          uniqueCache = null;
        }else{
          uniqueCache = this.layerUniqueCache[this.layerURL];
        }

        if (!uniqueCache){
          uniqueCache = {};
          this.layerUniqueCache[this.layerURL] = uniqueCache;
        }
        var uniqueKey = item2.name;
        if (uniqueKey in uniqueCache){
          stringCodedData = uniqueCache[uniqueKey];
          var stringCodedStore2 = new Memory({
            data: stringCodedData
          });
          if(this.uniqueValuesSelect && stringCodedStore2){
            this.uniqueValuesSelect.set('store', stringCodedStore2);
            if(this._valueObj && this._valueObj.value){
              var stringSelectedItems = array.filter(this.uniqueValuesSelect.store.data, lang.hitch(this, function(item) {
                return item.code === this._valueObj.value;
              }));
              if (stringSelectedItems.length > 0) {
                this.uniqueValuesSelect.set('value', stringSelectedItems[0].id);
              }
            }else{
              if(this.isValueRequired){
                this.uniqueValuesSelect.set('value', 0);
              }
            }
          }
        }else{
          if(this.pagingWasCanceled){
            this._type = 1;
            this._showDijit(this.stringTextBox);
            this._hideDijit(this.uniqueValuesSelect);
            this.stringTextBox.set('value', '');
            html.setStyle(this.uniqueMessageTR, 'display', 'none');
            this.uniqueMessageNode.innerHTML = '';
            return;
          }
          this.pagingAttempts = 0;
          this.pagingQueryTask = new PagingQueryTask();
          this.own(on(this.uniqueCancelNode, "click", lang.hitch(this, function(){
            this.pagingQueryTask.esc = this.pagingQueryTask.pagingEscaped = true;
            this.pagingWasCanceled = true;
            html.setStyle(this.uniqueMessageTR, 'display', 'none');
            this.uniqueMessageNode.innerHTML = '';
          })));
          this.pagingQueryTask.uri = this.layerURL;
          this.pagingQueryTask.fieldName = item2.name;
          this.pagingQueryTask.dateFormat = '';
          this.pagingQueryTask.version = this._layerInfo.currentVersion;
          this.pagingQueryTask.maxRecordCount = this._layerInfo.maxRecordCount;
          this.pagingQueryTask.isRequired = this.isValueRequired;
          if(this.layerDef){
            this.pagingQueryTask.defExpr = this.layerDef;
            return false;
          }
          this.pagingQueryTask.on('pagingComplete', lang.hitch(this, function(uniqueValuesArray){
            html.setStyle(this.uniqueMessageTR, 'display', 'none');
            this.uniqueMessageNode.innerHTML = '';
            this.pagingAttempts = 0;
            var convert2subtypeVal = false;
            if(this._layerInfo.typeIdField){
              convert2subtypeVal = (this._layerInfo.typeIdField.toUpperCase() === item2.name.toUpperCase());
            }

            stringCodedData = array.map(uniqueValuesArray, lang.hitch(this, function(item, index) {
              //item:{name,code}
              if(convert2subtypeVal && (item.name !== '' || item.name !== ' ')){
                var featType = this._getFeatureType(this._layerInfo, item.name);
                if(featType && featType.name){
                  item.name = featType.name;
                }
              }
              var dataItem = lang.mixin({}, item);
              dataItem.id = index;
              return dataItem;
            }));
            if(this._isFieldCoded(item2)){
              var stringDomain = item2.domain;
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
              uniqueCache[uniqueKey] = stringCodedData;
            }else{
              this._type = 1;
              this._showDijit(this.stringTextBox);
              this._hideDijit(this.uniqueValuesSelect);
              this.stringTextBox.set('value', '');
              html.setStyle(this.uniqueMessageTR, 'display', 'none');
              this.uniqueMessageNode.innerHTML = '';
              return true;
            }
            var stringCodedStore2 = new Memory({
              data: stringCodedData
            });
            if(this.uniqueValuesSelect && stringCodedStore2){
              this.uniqueValuesSelect.set('store', stringCodedStore2);
              if(this._valueObj && this._valueObj.value){
                var stringSelectedItems = array.filter(this.uniqueValuesSelect.store.data, lang.hitch(this, function(item) {
                  return item.code === this._valueObj.value;
                }));
                if (stringSelectedItems.length > 0) {
                  this.uniqueValuesSelect.set('value', stringSelectedItems[0].id);
                  //console.info("setting to the value object", this._valueObj.value, stringSelectedItems[0].id);
                }
              }else{
                if(this.isValueRequired){
                  this.uniqueValuesSelect.set('value', 0);
                  //console.info("setting to 0");
                }
              }
            }
          }));
          this.pagingQueryTask.on('pagingFault', lang.hitch(this, function(){
            this.pagingAttempts++;
            if(this.pagingAttempts <= 4 && !this.pagingWasCanceled){
                this.pagingQueryTask.execute();
            }else{
              this._type = 1;
              this._showDijit(this.stringTextBox);
              this._hideDijit(this.uniqueValuesSelect);
              //this.stringTextBox.set('value', valueObj.value || '');
              this.stringTextBox.set('value', '');
              html.setStyle(this.uniqueMessageTR, 'display', 'none');
              this.uniqueMessageNode.innerHTML = '';
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
      }
    },

    _getFeatureType: function (layer, typeID) {
      var result;
      if (layer) {
        for (var t = 0; t < layer.types.length; t++) {
          var featureType = layer.types[t];
          if (typeID === featureType.id) {
            result = featureType;
            break;
          }
        }
      }
      return result;
    },

    _onCbxAskValuesClicked:function(){
      this._updatePrompt();
      this.buildSQL();
      if(this.predefinedRadio){
        this.predefinedRadio.disabled = false;
        html.setStyle(this.predefinedLabel,'color','initial');
      }
    },

    _updatePrompt:function(){
      this.promptTB.set('value','');
      this.cbxAskValues.status = true;
      html.setStyle(this.promptTable,'display','table');

      var operator = this.operatorsSelect.get('value');
      var label = this.nls[operator];
      if(operator === this.OPERATORS.stringOperatorIsBlank ||
        operator === this.OPERATORS.stringOperatorIsNotBlank ||
        operator === this.OPERATORS.numberOperatorIsBlank ||
        operator === this.OPERATORS.numberOperatorIsNotBlank ||
        operator === this.OPERATORS.dateOperatorIsBlank ||
        operator === this.OPERATORS.dateOperatorIsNotBlank){
        if(this.uniqueRadio.checked === true || this.predefinedRadio.checked === true){
          this.valueRadio.checked = true;
        }
        this.cbxAskValues.status = false;
        this.cbxValueRequired.status = false;
        html.setStyle(this.attributeValueContainer,'display','none');
      }else{
        this.cbxAskValues.status = true;
        this.cbxValueRequired.status = true;
        html.setStyle(this.attributeValueContainer,'display','inline-block');
      }

      if(this.cbxAskValues.status && this.cbxAskValues.getValue()){
        html.setStyle(this.promptTable,'display','table');
        var fieldInfo = (this.fieldsSelect) ? this._getSelectedFilteringItem(this.fieldsSelect) : null;
        if(fieldInfo){
          if(operator !== 'none'){
            var alias = fieldInfo.alias||fieldInfo.name;
            var prompt = alias + ' ' + label;
            this.promptTB.set('value', prompt);
          }
        }
      }else{
        html.setStyle(this.promptTable,'display','none');
      }

      /*if(!this.cbxAskValues.status){
        this.cbxAskValues.setValue(false);
      }*/

      this._checkProceed();
    }
  });
});
