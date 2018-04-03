///////////////////////////////////////////////////////////////////////////
// Robert Scheitlin WAB eSearch Widget
///////////////////////////////////////////////////////////////////////////
/*global define, console, setTimeout, document*/
define([
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/_base/html',
  'dojo/_base/query',
  'dojo/on',
  'dojo/Deferred',
  'dojo/json',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dijit/_WidgetsInTemplateMixin',
  'dijit/Tooltip',
  'dojo/text!./SingleRelateEdit.html',
  'dijit/form/TextBox',
  './IncludeAllButton',
  './IncludeButton',
  './SimpleTable',
  './LayerFieldChooser',
  'jimu/dijit/SimpleTable',
  './FieldFormatEdit',
  'jimu/dijit/Popup',
  'dojo/keys'
],
function(declare,lang,array,html,query,on,Deferred,json,_WidgetBase,_TemplatedMixin,_WidgetsInTemplateMixin,
  Tooltip,template,TextBox,IncludeAllButton,IncludeButton,eSimpleTable,LayerFieldChooser,SimpleTable,
  FieldFormatEdit, Popup, keys) {/*jshint unused: false*/
  return declare([_WidgetBase,_TemplatedMixin,_WidgetsInTemplateMixin], {
    baseClass: 'widget-esearch-singlerelate-setting',
    templateString:template,
    nls:null,
    config:null,
    searchSetting:null,
    layerInfoCache:null,
    _layerInfo:null,
    layerURL:null,
    tr: null,
    selectedId: null,
    allFields: false,

    postCreate:function(){
      this.inherited(arguments);
      this.allFieldsTable = new LayerFieldChooser({}, this.allFieldsTableDiv);
      this.includeButton = new IncludeButton({nls: this.nls}, this.includeButtonDiv);
      this.includeAllButton = new IncludeAllButton({nls: this.nls}, this.includeAllButtonDiv);
      this.displayFieldsTable = new eSimpleTable({
        _rowHeight:40,
        autoHeight:true,
        selectable:true,
        fields:[
          {name:'name',title:this.nls.name,type:'text',editable:false,unique:true, width:'25%'},
          {name:'alias',title:this.nls.alias,type:'text',editable:true, width:'30%'},
          {name:'actions',width:'85px',title:this.nls.actions,type:'actions',actions:['up','down','edit','delete']},
          {name:'isdate',type:'text',hidden:true},
          {name:'isnumber',type:'text',hidden:true},
          {name:'useutc',type:'text',hidden:true},
          {name:'dateformat',type:'text',hidden:true},
          {name:'numberformat',type:'text',hidden:true},
          {name:'currencyformat',type:'text',hidden:true}
        ]
      }, this.displayFieldsTableDiv)
      this.displayFieldsTable.startup();
      html.addClass(this.displayFieldsTable.domNode, "searchLayerFieldsTable");
      this.setConfig(this.config);
      this._bindEvents();
      this._initTables();
    },

    setConfig:function(config){
      if(!config){
        return;
      }
      this.config = config;
      this.resetAll();
      this.relateAlias.set('value', lang.trim(this.config.label || ""));

      if(this.config.fields && !this.config.fields.all){
        var displayFields = this.config.fields.field;
        this._addDisplayFields(displayFields);
      }

      if(this.config.hasOwnProperty("id")){
        this.selectedId = this.config.id;
        this.allFieldsTable.refresh(this._getServiceUrlByLayerUrl(this.layerURL) + "/" + this.config.id).then(lang.hitch(this, function(){
          if (this.layerURL) {
            this.includeAllButton.enable();
          }
          html.setStyle(this.relateChoiceArea, 'display', 'none');
          if(this.config.fields.all){
            this.allFields = true;
            this.onIncludeAllClick();
          }
        }));
      }else{
        var rowData;
        array.map(this.layerInfoCache[this.layerURL].relationships, lang.hitch(this,function(relate){
          rowData = {
            name: (relate && relate.name) || '',
            id: (relate.id).toString()
          };
          this.relateChoiceTable.addRow(rowData);
        }));
        html.setStyle(this.relateChoiceArea, 'display', 'block');
      }
    },

    getConfig:function(){
      if(!this.validate(false)){
        return false;
      }
      var config = {
        label:lang.trim(this.relateAlias.get('value')),
        id: parseInt(this.selectedId),
        fields: {
          all: false,
          field: []
        }
      };
      if(this.allFields){
        config.fields.all = true;
      }else{
        var rowsData = this.displayFieldsTable.getData();
        var retVal;
        var fieldsArray = array.map(rowsData, lang.hitch(this, function (item) {
          retVal = {
            name: item.name,
            alias: item.alias
          };
          if (item.dateformat) {
            retVal.dateformat = item.dateformat;
          }
          if (item.useutc) {
            retVal.useutc = true;
          }
          if (item.numberformat) {
            retVal.numberformat = item.numberformat;
          }
          if (item.currencyformat) {
            retVal.currencyformat = item.currencyformat;
          }
          if (item.isnumber) {
            retVal.isnumber = true;
          }
          if (item.isdate) {
            retVal.isdate = true;
          }
          return retVal;
        }));
        config.fields.field = fieldsArray;
      }

      this.config = config;
      return this.config;
    },

    _bindEvents: function () {
      this.own(on(this.includeButton, 'Click', lang.hitch(this, this.onIncludeClick)));
      this.own(on(this.includeAllButton, 'Click', lang.hitch(this, this.onIncludeAllClick)));
    },

    _initTables: function () {
      this.own(on(this.allFieldsTable, 'row-select', lang.hitch(this, function () {
        this.includeButton.enable();
      })));
      this.own(on(this.allFieldsTable, 'rows-clear', lang.hitch(this, function () {
        this.includeButton.disable();
        this.includeAllButton.disable();
      })));
      this.own(on(this.allFieldsTable, 'row-dblclick', lang.hitch(this, function () {
        this.includeButton.enable();
        this.includeButton.onClick();
      })));

      this.own(on(this.displayFieldsTable, 'actions-edit', lang.hitch(this, function (tr) {
        if (tr.fieldInfo) {
          this._openFieldEdit(this.nls.edit + ": " + tr.fieldInfo.name, tr);
        }
      })));

      this.own(on(this.relateChoiceTable, 'row-select', lang.hitch(this, function (tr) {
        var rowData = this.relateChoiceTable.getRowData(tr);
        this.selectedId = rowData.id;
        this.relateAlias.set('value', lang.trim(rowData.name || ""));
        this.displayFieldsTable.clear();
        this.allFieldsTable.refresh(this._getServiceUrlByLayerUrl(this.layerURL) + "/" + rowData.id);
        this.includeAllButton.enable();
      })));
    },

    onIncludeClick: function () {
      var tr = this.allFieldsTable.getSelectedRow();
      if (tr) {
        var fieldInfo = tr.fieldInfo;
        this._createDisplayField(fieldInfo);
      }
    },

    onIncludeAllClick: function () {
      var tr = this.allFieldsTable.getRows();
      var r = 0;
      for (r = 0; r < tr.length; r++) {
        var fieldInfo = tr[r].fieldInfo;
        this._createDisplayField(fieldInfo);
      }
    },

    _addDisplayFields: function (fieldInfos) {
      var i = 0;
      for (i = 0; i < fieldInfos.length; i++) {
        this._createDisplayField(fieldInfos[i]);
      }
    },

    _isNumberType: function (type) {
      var numberTypes = ['esriFieldTypeOID',
                         'esriFieldTypeSmallInteger',
                         'esriFieldTypeInteger',
                         'esriFieldTypeSingle',
                         'esriFieldTypeDouble'];
      return array.indexOf(numberTypes, type) >= 0;
    },

    _openFieldEdit: function (name, tr) {
      this.fieldformatedit = new FieldFormatEdit({
        nls: this.nls,
        tr: tr,
        isRelate: true
      });
      //console.info(tr.fieldInfo);
      this.fieldformatedit.setConfig(tr.fieldInfo || {});
      this.popup = new Popup({
        titleLabel: name,
        autoHeight: true,
        content: this.fieldformatedit,
        container: 'main-page',
        width: 660,
        buttons: [
          {
            label: this.nls.ok,
            key: keys.ENTER,
            onClick: lang.hitch(this, '_onFieldEditOk')
          }, {
            label: this.nls.cancel,
            key: keys.ESCAPE
          }
        ],
        onClose: lang.hitch(this, '_onFieldEditClose')
      });
      html.addClass(this.popup.domNode, 'widget-setting-popup');
      this.fieldformatedit.startup();
    },

    _onFieldEditOk: function () {
      var edits = {};
      var fieldInfo = this.fieldformatedit.getConfig();
      if (fieldInfo.dateformat) {
        edits.dateformat = fieldInfo.dateformat;
      }
      if (fieldInfo.useutc) {
        edits.useutc = true;
      }else{
        edits.useutc = false;
      }
      if (fieldInfo.dateformat) {
        edits.dateformat = fieldInfo.dateformat;
      }
      if (fieldInfo.numberformat) {
        edits.numberformat = fieldInfo.numberformat;
      }
      if (fieldInfo.currencyformat) {
        edits.currencyformat = fieldInfo.currencyformat;
      }
      if(edits !== {}){
        this.allFields = false;
      }
      this.displayFieldsTable.editRow(this.fieldformatedit.tr, edits);
      this.popup.close();
    },

    _onFieldEditClose: function () {
      this.fieldformatedit = null;
      this.popup = null;
    },

    _createDisplayField: function (fieldInfo) {
      var isNumeric = (this._isNumberType(fieldInfo.type) || fieldInfo.isnumber);
      var rowData = {
        name: fieldInfo.name,
        alias: fieldInfo.alias || fieldInfo.name,
        isnumber: isNumeric,
        isdate: (fieldInfo.type === "esriFieldTypeDate" || fieldInfo.isdate)
      };
      if (fieldInfo.hasOwnProperty('visible') && fieldInfo.visible === false){
        return false;
      }
      if (fieldInfo.dateformat) {
        rowData.dateformat = fieldInfo.dateformat;
      }
      if (fieldInfo.numberformat) {
        rowData.numberformat = fieldInfo.numberformat;
      }
      if (fieldInfo.currencyformat) {
        rowData.currencyformat = fieldInfo.currencyformat;
      }
      if (fieldInfo.useutc) {
        rowData.useutc = fieldInfo.useutc;
      }
      var result = this.displayFieldsTable.addRow(rowData);
      result.tr.fieldInfo = fieldInfo;
    },

    _getServiceUrlByLayerUrl: function (layerUrl) {
      var lastIndex = layerUrl.lastIndexOf("/");
      var serviceUrl = layerUrl.slice(0, lastIndex);
      return serviceUrl;
    },

    resetAll:function(){
      this.relateAlias.set('value', '');
    },

    validate:function(showTooltip){
      if(lang.trim(this.relateAlias.get('value')) === ''){
        if(showTooltip){
          this._showTooltip(this.relateAlias.domNode, "Please input value.");
        }
        return false;
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
    }
  });
});
