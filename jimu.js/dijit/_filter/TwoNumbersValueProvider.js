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
  'dojo/_base/lang',
  'dojo/_base/declare',
  './ValueProvider',
  'dijit/_TemplatedMixin',
  'dijit/_WidgetsInTemplateMixin',
  'dojo/text!./TwoNumbersValueProvider.html',
  'dijit/form/NumberTextBox',
  'jimu/utils'
],
  function(html, lang, declare, ValueProvider, _TemplatedMixin, _WidgetsInTemplateMixin,
     template, NumberTextBox, jimuUitls) {

    return declare([ValueProvider, _TemplatedMixin, _WidgetsInTemplateMixin], {

      templateString: template,
      customId: null, //optional, for screen readers

      postCreate: function(){
        this.inherited(arguments);
        html.addClass(this.domNode, 'jimu-two-numbers-filter-value-provider');

        this.customId = this.partObj.vpId;

        var opts1 = {
          required: false,
          intermediateChanges: true,
          constraints: {pattern: "#####0.##########"}
        };
        var opts2 = lang.clone(opts1);
        var opts2_id;
        if(this.customId){
          opts1.id = this.customId + '_between';
          opts2_id = this.customId;
          //Add labels
          var labelStr1 = '<label for="' + opts1.id + '" class="screen-readers-only">' +
           this.partObj.interactiveObj.prompt + ' ' + this.partObj.interactiveObj.hint + '</label>';
          var labelNode1 = html.toDom(labelStr1);
          html.place(labelNode1, this._dijit1_container);
        }else{
          opts2_id = jimuUitls.getUUID();
        }
        opts2.id = opts2_id + '_and';
        var labelStr2 = '<label for="' + opts2.id + '" class="screen-readers-only">' + this.nls.and + '</label>';
        var labelNode2 = html.toDom(labelStr2);
        html.place(labelNode2, this._dijit2_container);

        this._dijit1 = new NumberTextBox(opts1);
        this._dijit2 = new NumberTextBox(opts2);
        this._dijit1.startup();
        this._dijit2.startup();

        this._dijit1.on('blur', (function(){
          this._onRangeNumberBlur();
        }).bind(this));
        this._dijit2.on('blur', (function(){
          this._onRangeNumberBlur();
        }).bind(this));

        html.setStyle(this._dijit1.domNode, 'width', '100%');
        html.setStyle(this._dijit2.domNode, 'width', '100%');
        this._dijit1.placeAt(this._dijit1_container);
        this._dijit2.placeAt(this._dijit2_container);
      },

      _onRangeNumberBlur:function(){
        if(this._dijit1.validate() && this._dijit2.validate()){
          var value1 = parseFloat(this._dijit1.get('value'));
          var value2 = parseFloat(this._dijit2.get('value'));
          if(value1 > value2){
            this._dijit1.set('value', value2);
            this._dijit2.set('value', value1);
          }
        }
      },

      getDijits: function(){
        return [this._dijit1, this._dijit2];
      },

      setValueObject: function(valueObj){
        if(this.isDefined(valueObj.value1)){
          this._dijit1.set('value', valueObj.value1);
        }
        if(this.isDefined(valueObj.value2)){
          this._dijit2.set('value', valueObj.value2);
        }
      },

      getValueObject: function(){
        if(this.isValidValue()){
          return {
            "isValid": true,
            "type": this.partObj.valueObj.type,
            "value1": parseFloat(this._dijit1.get('value')),
            "value2": parseFloat(this._dijit2.get('value'))
          };
        }
        return null;
      },

      tryGetValueObject: function(){
        if(this.isValidValue()){
          return this.getValueObject();
        }else if(this.isEmptyValue()){
          var result = {
            "isValid": true,
            "type": this.partObj.valueObj.type,
            "value1": parseFloat(this._dijit1.get('value')),
            "value2": parseFloat(this._dijit2.get('value'))
          };
          if(isNaN(result.value1)){
            result.value1 = null;
          }
          if(isNaN(result.value2)){
            result.value2 = null;
          }
          return result;
        }
        return null;
      },

      setRequired: function(required){
        this._dijit1.set("required", required);
        this._dijit2.set("required", required);
      }

    });
  });