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
  'dojo/_base/declare',
  'dojo/_base/html',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dijit/_WidgetsInTemplateMixin',
  'dojo/_base/lang',
  'jimu/utils',
  'dijit/Calendar',
  'dijit/form/TimeTextBox',
  'dojo/text!./templates/dateTimePicker.html',
  'dojo/on',
  'dojo/Evented',
  'jimu/dijit/CheckBox'
],
function (declare, html, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, lang, jimuUtils,
  Calendar, TimeTextBox, template, on, Evented) {
  var clazz = declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Evented], {
    baseClass: 'jimu-datetimepicker',
    declaredClass: 'jimu.datetimepicker',
    templateString: template,

    value: null, //date format
    fieldInfo: null,
    enableTime: false,
    timeAccuracy: '', //'', h, m, s
    runtime: false, //related to if only displaying calendar

    postMixInProperties:function(){
      this.timeNls = window.apiNls.widgets.imageFilter.imageFilterSettings;
      this.timeUnit = window.jimuNls.timeUnit;
    },

    postCreate: function () {
      this._initSelf();
    },

    _initSelf: function(){
      this.calendar = new Calendar({
        value: this.value,
        "class": "jimu-calendar"
      }, this.calendarDiv);
      this.own(on(this.calendar, 'change', lang.hitch(this, function(){
        this._valueChange();
        if(this.runtime && !this.enableTime){
          this.emit('close');
        }
      })));
      this.calendar.startup();

      if(this.runtime){
        html.setStyle(this.timeTextContainerSetting, 'display', 'none');
        if(this.enableTime){//show hms-time picker
          html.setStyle(this.timeTextContainerRuntime, 'display', 'block');
          var timePattern = this.timeAccuracy === 's' ? 'HH:mm:ss' : (this.timeAccuracy === 'm' ? 'HH:mm' : 'HH');
          var timeOptions = {
            constraints:{
              timePattern: timePattern,
              clickableIncrement: 'T00:30:00',
              visibleIncrement: 'T01:00:00',
              visibleRange: 'T01:00:00'
            }
          };
          if(this.timeAccuracy === 'h'){
            timeOptions.constraints.clickableIncrement = 'T01:00:00';
          }
          this.timeTextBox = new TimeTextBox(timeOptions, this.timeTextBoxDiv);
          this.own(on(this.timeTextBox, 'change', lang.hitch(this, function(){
            if(this.timeTextBox.displayedValue === ''){
              this.enableTime = false;
            }else{
              this.enableTime = true;
            }
            this._valueChange();
          })));
          this.timeTextBox.startup();

          this.timeTextBox.set('value', this.value);
        }else{
          html.setStyle(this.timeTextContainerRuntime, 'display', 'none');
        }
      }else{
        html.setStyle(this.timeTextContainerRuntime, 'display', 'none');
        html.setStyle(this.timeTextContainerSetting, 'display', 'block');
        this._initTimePickers();
      }

      this._enableTime = this.enableTime; //as temporary status

      this.emit('created', this.getValueObj());
    },

    _initTimePickers: function(){
      this.timeCheckbox.setValue(this.enableTime);
      if(this.enableTime){
        html.setStyle(this.timeTableContainer, 'display', 'block');
        if(this.value){ //set default values
          this._setTimeBox_HMS(this.value);
        }
      }
      this.own(on(this.timeCheckbox, 'change', lang.hitch(this, function(){
        this._changeTimeCheckStatus();
        this._valueChange();
        this.emit('timeStatusChanged');
      })));

      this.own(on(this.hourSelect, 'change', lang.hitch(this, function(){
        this._valueChange();
      })));
      this.own(on(this.minuteSelect, 'change', lang.hitch(this, function(){
        this._valueChange();
      })));
      this.own(on(this.secondSelect, 'change', lang.hitch(this, function(){
        this._valueChange();
      })));
    },

    _changeTimeCheckStatus: function(){
      this._enableTime = this.timeCheckbox.checked;
      if(this._enableTime){
        html.setStyle(this.timeTableContainer, 'display', 'block');
      }else{
        html.setStyle(this.timeTableContainer, 'display', 'none');
      }
    },

    _valueChange: function(){
      this.emit('timeChange', this.getValueObj());
    },

    isValid: function(){
      if(this.calendar.value === null){
        return false;
      }

      if(this.runtime){
        if(this._enableTime && !this.timeTextBox.isValid()){
          return false;
        }
      }else if(this.timeCheckbox.checked){ //setting
        if(!this.hourSelect.isValid() || !this.minuteSelect.isValid() || !this.secondSelect.isValid()){
          return false; //has valid value
        }else if(this.hourSelect.displayedValue === '' ||
          (this.hourSelect.displayedValue !== '' && this.secondSelect.displayedValue !== '' &&
           this.minuteSelect.displayedValue === '')){
          return false;
        }
      }else{ //empty value if it's invalid when uncheck timeCheckBox.
        if(!this.hourSelect.isValid()){
          this.hourSelect.set('value', null);
        }
        if(!this.minuteSelect.isValid()){
          this.minuteSelect.set('value', null);
        }
        if(!this.secondSelect.isValid()){
          this.secondSelect.set('value', null);
        }
      }
      return true;
    },

    getValueObj: function(){
      if(!this.isValid()){
        return false;
      }
      var dateTime = new Date(this.calendar.value.toDateString());
      if(this.runtime){
        if(this.enableTime){
          var hms = this.timeTextBox.get('value');
          if(hms){
            dateTime.setHours(hms.getHours());
            dateTime.setMinutes(hms.getMinutes());
            dateTime.setSeconds(hms.getSeconds());
          }
        }
      }else{
        this.enableTime = this._enableTime;
        if(this.enableTime){
          var hour = this.hourSelect.get('value');
          var minute = this.minuteSelect.get('value');
          var second = this.secondSelect.get('value');
          this.timeAccuracy = second ? 's' : (minute ? 'm' : 'h');
          dateTime.setHours(hour ? hour.getHours() : null);
          dateTime.setMinutes(minute ? minute.getMinutes(): null);
          dateTime.setSeconds(second ? second.getSeconds() : null);
        }else{
          this.timeAccuracy = '';
        }
      }
      var dateString = jimuUtils.localizeDateTimeByFieldInfo(dateTime, this.fieldInfo,
        this.enableTime, this.timeAccuracy);
      this.value = dateTime; //update current date
      return {date: dateTime, value: dateString, enableTime: this.enableTime, timeAccuracy: this.timeAccuracy};
    },

    validate: function(){
      var val = this.calendar.value ? 1 : 0;
      this.set("DisplayedValue", val);
      return true;
    },

    reset: function () {
      var calendarVal = this.calendar.get('value');
      if(!(calendarVal && this.value && this.value.toDateString() === calendarVal.toDateString())){
        this.calendar.set('value', this.value);
      }
      this.timeCheckbox.setValue(this.enableTime);
      if(this.runtime){
        if(this.enableTime){
          this.timeTextBox.set('value', this.value);
        }
      }else{
        var timeVal = this.enableTime ? this.value : null;
        this._setTimeBox_HMS(timeVal);
      }
    },

    _setTimeBox_HMS: function(timeVal){
      var hVal = null, mVal = null, sVal = null;
      if(this.timeAccuracy === 'h'){
        hVal = timeVal;
      }else if(this.timeAccuracy === 'm'){
        hVal = mVal = timeVal;
      }else if(this.timeAccuracy === 's'){
        hVal = mVal = sVal = timeVal;
      }
      this.hourSelect.set('value', hVal);
      this.minuteSelect.set('value', mVal);
      this.secondSelect.set('value', sVal);
    }
  });

  return clazz;
});