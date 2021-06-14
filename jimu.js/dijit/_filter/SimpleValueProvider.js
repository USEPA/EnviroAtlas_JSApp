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
  'dojo/_base/html',
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/on',
  'dojo/keys',
  'jimu/utils',
  './ValueProvider',
  'dijit/form/ValidationTextBox',
  'dijit/form/NumberTextBox',
  './DateValueSelector'
],
  function(html, declare, lang, on,
    keys, jimuUtils, ValueProvider, ValidationTextBox, NumberTextBox, DateValueSelector) {

    return declare([ValueProvider], {

      templateString: '<div></div>',

      _dijit: null,
      customId: null, //optional, for screen readers

      postCreate: function(){
        this.inherited(arguments);
        this.customId = this.partObj.vpId;
        html.addClass(this.domNode, 'jimu-filter-simple-value-provider');

        var options = null;
        if(this.shortType === 'string'){
          options = {
            required: false,
            trim: true,
            intermediateChanges: false
          };
          if(this.customId){
            options.id = this.customId;
          }
          this._dijit = new ValidationTextBox(options);

          this._dijit.startup();
          this._dijit.on('keydown', (function(e){
            var code = e.keyCode || e.which;
            if (code === keys.ENTER) {
              this._dijit.emit('enter');
            }
          }).bind(this));
        }else if(this.shortType === 'number'){
          options = {
            required: false,
            intermediateChanges: false,
            constraints: {pattern: "#####0.##########"}
          };
          if(this.customId){
            options.id = this.customId;
          }
          this._dijit = new NumberTextBox(options);

          this._dijit.startup();
          this._dijit.on('keydown', (function(e){
            var code = e.keyCode || e.which;
            if (code === keys.ENTER) {
              this._dijit.emit('enter');
            }
          }).bind(this));
        }else{
          options = {
            runtime: this.runtime,
            popupInfo: this.popupInfo,
            _fieldInfo: this.fieldInfo
          };
          if(this.runtime){
            options.virtualDates = this.partObj.interactiveObj.virtualDates;
          }
          if(this.customId){
            options.customId = this.customId;
            options.prompt = this.partObj.interactiveObj.prompt + ' ' + this.partObj.interactiveObj.hint;
          }
          this._dijit = new DateValueSelector(options);

          //bind change event
          this.own(on(this._dijit, 'change', lang.hitch(this, function(date){
            this.emit('change', date, 'start');
          })));
        }
        //use id&for to read label
        if(this.customId && (this.shortType === 'string' || this.shortType === 'number')){
          var labelStr = '<label for="' + this.customId + '" class="screen-readers-only">' +
           this.partObj.interactiveObj.prompt + ' ' + this.partObj.interactiveObj.hint + '</label>';
          var labelNode = html.toDom(labelStr);
          html.place(labelNode, this.domNode);
        }

        html.setStyle(this._dijit.domNode, 'width', '100%');
        this._dijit.placeAt(this.domNode);
      },

      getDijits: function(){
        return [this._dijit];
      },

      setValueObject: function(valueObj){
        if(this.isDefined(valueObj.value)){
          if(this.shortType === 'date'){
            //this._dijit is DateValueSelector
            this._dijit.setValueObject(valueObj);
          }else{
            this._dijit.set('value', valueObj.value);
          }
        }
      },

      //return {isValid,type,value}
      getValueObject: function(){
        if(this.isValidValue()){
          if(this.shortType === 'date'){
            //this._dijit is DateValueSelector
            var dateValueObject = this._dijit.getValueObject();
            if(dateValueObject && dateValueObject.value){
              dateValueObject.isValid = true;
              dateValueObject.type = this.partObj.valueObj.type;
              return dateValueObject;
            }else{
              return null;
            }
          }else{
            var value = this._dijit.get('value');
            if(this.shortType === 'number'){
              value = parseFloat(value);
            }else{//string
              value = jimuUtils.sanitizeHTML(value);
            }
            return {
              "isValid": true,
              "type": this.partObj.valueObj.type,
              "value": value
            };
          }
        }
        return null;
      },

      //return {isValid,type,value}
      tryGetValueObject: function(){
        if(this.isValidValue()){
          return this.getValueObject();
        }else if(this.isEmptyValue()){
          return {
            "isValid": true,
            "type": this.partObj.valueObj.type,
            "value": null
          };
        }
        return null;
      },

      setRequired: function(required){
        this._dijit.set("required", required);
      }

    });
  });