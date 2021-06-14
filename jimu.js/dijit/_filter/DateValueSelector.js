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
  'dojo/aspect',
  'dojo/Evented',
  'dojo/on',
  'dojo/keys',
  'dojo/query',
  'dojo/_base/html',
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/_base/declare',
  'dijit/_WidgetBase',
  'jimu/filterUtils',
  'jimu/utils',
  'jimu/dijit/Popup',
  'jimu/dijit/formSelect',
  'jimu/dijit/dateTimePicker'
],
  function(aspect, Evented, on, keys, query, html, lang, array, declare, _WidgetBase,
    filterUtils, jimuUtils, Popup, jimuSelect, dateTimePicker) {

    return declare([_WidgetBase, Evented], {

      //options:
      virtualDates: null,//['today', 'yesterday', 'tomorrow']
      customId: null, //optional, for screen readers

      //events:
      //change

      postMixInProperties: function(){
        this.inherited(arguments);
        this.nls = window.jimuNls.filterBuilder;
      },

      postCreate: function(){
        this.inherited(arguments);
        html.addClass(this.domNode, 'jimu-date-value-selector');

        this.dateTypeSelect = new jimuSelect({'aria-label': this.prompt});//it uses table tag not select.
        html.addClass(this.dateTypeSelect.domNode, 'date-type-select');
        html.addClass(this.dateTypeSelect.domNode, 'restrict-select-width');
        this.dateTypeSelect.placeAt(this.domNode);

        //bind change event
        this.own(on(this.dateTypeSelect, 'change', lang.hitch(this, function(){
          this._onDateTypeSelectChanged();
        })));

        if(!(this.virtualDates && this.virtualDates.length > 0)){
          this.virtualDates =
            [filterUtils.VIRTUAL_DATE_TODAY, filterUtils.VIRTUAL_DATE_YESTERDAY, filterUtils.VIRTUAL_DATE_TOMORROW];
          if(this.runtime){
            this.virtualDates.unshift(filterUtils.VIRTUAL_DATE_CUSTOM);
          }
        }
        this.dateTypeSelect.addOption({
          value: '',
          label: '&nbsp;'
        });
        if(!this.runtime || (this.runtime && this.virtualDates.indexOf(filterUtils.VIRTUAL_DATE_CUSTOM) >= 0) ){
          this.dateTypeSelect.addOption({
            value: 'custom',
            label: this.nls.custom
          });
        }
        array.map(this.virtualDates, lang.hitch(this, function(virtualDate){
          if(virtualDate !== 'custom'){
            var option = {
              value: virtualDate,
              label: virtualDate
            };
            switch(virtualDate){
              case filterUtils.VIRTUAL_DATE_TODAY:
                option.label = this.nls.today;
                break;
              case filterUtils.VIRTUAL_DATE_YESTERDAY:
                option.label = this.nls.yesterday;
                break;
              case filterUtils.VIRTUAL_DATE_TOMORROW:
                option.label = this.nls.tomorrow;
                break;
              default:
                break;
            }
            this.dateTypeSelect.addOption(option);
          }
        }));
        this.dateTypeSelect.startup();

        this.own(on(html.byId('main-page'), 'click', lang.hitch(this, function(){
          this.hideDateTimePopup();
        })));

        this.own(aspect.before(this.dateTypeSelect, 'openDropDown', lang.hitch(this, function(){
          this.hideDateTimePopup();
          if(this.dateTypeSelect.getValue() === 'custom' && this.dateTimeObj && this.dateTimeObj.value){
            this.dateTypeSelect.textDirNode.innerText = this.dateTimeObj.value;
          }
          if(this.dateTypeSelect.getValue() !== 'custom' && this.dateTimePopup){
            this.dateTimePopup.hide();
            // this.dateTimeObj = null;
            // this.enableTime = false;
            // this.dateTimePopup.onClose = lang.hitch(this, function () {
            //   return true;
            // });
            // this.dateTimePopup.close();
            // this.dateTimePopup = null;
          }
        })));

        this.own(aspect.after(this.dateTypeSelect, 'closeDropDown', lang.hitch(this, function(){
          if(!this.customId){//update aria-label
            html.setAttr(this.dateTypeSelect, 'aria-label', this.dateTypeSelect.textDirNode.innerText);
          }
          this.dateTypeSelect.textDirNode.title = '';
          setTimeout(lang.hitch(this, function() {
            if(this.dateTypeSelect.getValue() === 'custom' && this.dateTimeObj && this.dateTimeObj.value &&
             this.dateTypeSelect.textDirNode){
              this.dateTypeSelect.textDirNode.innerText = this.dateTimeObj.value;
              this.dateTypeSelect.textDirNode.title = this.dateTimeObj.value;
            }
            if(this.dateTimePopup && this.dateTimePopup.domNode &&
             html.getStyle(this.dateTimePopup.domNode, 'display') === 'block' &&
             this.dateTimePicker && this.dateTimePicker.calendar){
              this.dateTimePicker.calendar.focus(); //focus on the selected day
            }
          }), 200);
        })));

        this.own(aspect.after(this.dateTypeSelect.dropDown, 'onItemClick', lang.hitch(this, function(item){
          if(item && item.option.value === 'custom'){
            this.showDateTimePopup();
          }
        }), true));

        if(this.popupInfo && this.popupInfo.fieldInfos){
          this.fieldInfo = this.popupInfo.fieldInfos.filter(lang.hitch(this, function(f){
            return f.fieldName === this._fieldInfo.name;
          }))[0];
        }
      },

      hideDateTimePopup: function(){
        if(this.dateTimePopup && this.dateTimePopup.domNode &&
         html.getStyle(this.dateTimePopup.domNode, 'display') === 'block'){
          if(this.dateTimePicker && this.dateTimePopupClick === true){
            this.dateTimePopupClick = false;
          }else{
            this.dateTimePopup.hide();
          }
        }
      },

      getDijits: function(){
        // return [this._dijit1, this._dijit2];
        return [];
      },

      //valueObj: {value,virtualDate}
      setValueObject: function(valueObj){
        //valueObj.value: string
        //virtualDate: today,yesterday,...

        if(!valueObj.virtualDate || valueObj.virtualDate === 'custom'){
          //custom date
          this.dateTypeSelect.set('value', 'custom', false);
          if(valueObj.value){
            var date = jimuUtils.getDateByDateTimeStr(valueObj.value);
            var value = jimuUtils.localizeDateTimeByFieldInfo(date, this.fieldInfo,
              valueObj.enableTime, valueObj.timeAccuracy);
            this.dateTimeObj = {date: date, value: value};

            this.dateTypeSelect.textDirNode.innerText = value;
            this.dateTypeSelect.textDirNode.title = value;
            this.enableTime = valueObj.enableTime;
            this.timeAccuracy = valueObj.timeAccuracy;

            //this dijit uses table tag not select, so aria-label would stop reading prompt label.
            if(!this.customId){
              html.setAttr(this.dateTypeSelect, 'aria-label', this.dateTypeSelect.textDirNode.innerText);
            }
          }
        }else{
          //virtual date
          this.dateTypeSelect.set('value', valueObj.virtualDate, false);
          if(!this.customId){
            html.setAttr(this.dateTypeSelect, 'aria-label', valueObj.virtualDate);
          }
        }
      },

      //return {value,virtualDate}
      getValueObject: function(){
        if(!this.isValidValue()){
          return null;
        }

        return this.tryGetValueObject();
      },

      //return {value,virtualDate}
      tryGetValueObject: function(){
        if(this.isInvalidValue()){
          return null;
        }

        var result = {
          "value": null,//date.toDateString()
          "virtualDate": ''//today,yesterday,...
        };

        var virtualDate = this.dateTypeSelect.get('value');
        var date = null;

        if(virtualDate === 'custom'){
          date = this.dateTimeObj.date;
          if(date){
            result.value = jimuUtils.getDateTimeStr(date, true);//save a full date time format
          }else{
            result.value = null;
          }
          result.virtualDate = '';
          result.enableTime = this.enableTime ? this.enableTime : false;
          result.timeAccuracy = this.timeAccuracy ? this.timeAccuracy : '';
        }else{
          date = filterUtils.getRealDateByVirtualDate(virtualDate);
          result.virtualDate = virtualDate;
          if(date){
            result.value = jimuUtils.getDateTimeStr(date);
          }else{
            result = null;
          }
        }

        return result;
      },

      setRequired: function(){
      },

      //-1 means invalid value type
      //0 means empty value, this ValueProvider should be ignored
      //1 means valid value
      getStatus: function(){
        if(this.dateTypeSelect.get('value') === 'custom'){
          if(this.dateTimePicker) {
            return this._getStatusForDijit(this.dateTimePicker);
          }else{
            return this.dateTimeObj ? 1 : 0;
          }
        }else if(this.dateTypeSelect.get('value') === ''){
          return 0;
        }else{
          return 1;
        }
      },

      //return -1 means input a wrong value
      //return 0 means empty value
      //return 1 means valid value
      _getStatusForDijit: function(dijit){
        if(dijit.validate()){
          if(dijit.get("DisplayedValue")){
            return 1;
          }else{
            return 0;
          }
        }else{
          return -1;
        }
      },

      isInvalidValue: function(){
        return this.getStatus() < 0;
      },

      isEmptyValue: function(){
        return this.getStatus() === 0;
      },

      isValidValue: function(){
        return this.getStatus() > 0;
      },

      _onDateTypeSelectChanged: function(){
        if(this.dateTypeSelect.get('value') === 'dateTime'){
          this.showDateTimePopup();
        }
        this.emit('change', this.dateTypeSelect.get('value'));
      },

      showDateTimePopup: function(){
        if(this.dateTimePopup){
          this.resize();
          this.dateTimePicker.reset();
          this.dateTimePopup.show();
          return;
        }

        if(!this.dateTimeObj){
          this.dateTimeObj = {date: null};
        }
        this.dateTimePicker = new dateTimePicker({
          runtime: this.runtime,
          value: this.dateTimeObj.date,
          fieldInfo: this.fieldInfo,
          enableTime: this.enableTime,
          timeAccuracy: this.timeAccuracy

        });
        this.own(on(this.dateTimePicker, 'created', lang.hitch(this, function(dateTimeObj){
          this.dateTypeSelect.textDirNode.innerText = dateTimeObj.value;//overwrite current day value
          this.dateTypeSelect.textDirNode.title = dateTimeObj.value;
          this.dateTimeObj = dateTimeObj;
        })));

        this.own(on(this.dateTimePicker, 'timeChange', lang.hitch(this, function(dateTimeObj){
          if(dateTimeObj){
            this.dateTypeSelect.textDirNode.innerText = dateTimeObj.value;
            this.dateTypeSelect.textDirNode.title = dateTimeObj.value;
            this.enableTime = dateTimeObj.enableTime;
            this.timeAccuracy = dateTimeObj.timeAccuracy;
            this.dateTimeObj = dateTimeObj;
            this.emit('change');
          }
        })));

        //setting: checkbox status
        this.own(on(this.dateTimePicker, 'timeStatusChanged', lang.hitch(this, function(){
          this.popupH = this.enableTime ? 353 : 309;
        })));


        this.own(on(this.dateTimePicker, 'close', lang.hitch(this, function(){
          this.dateTimePopup.hide();
          this.dateTypeSelect.focus();
        })));

        if(this.runtime){
          if(this._isOnlyShowDate()){
            this.popupH = 265;
            this.own(on(this.dateTimePicker, 'calendarChange', lang.hitch(this, function(dateTimeObj){
              if(dateTimeObj){
                if(this.dateTypeSelect.textDirNode.innerText !== dateTimeObj.value){
                  this.dateTypeSelect.textDirNode.innerText = dateTimeObj.value;
                  this.dateTypeSelect.textDirNode.title = dateTimeObj.value;
                  this.enableTime = dateTimeObj.enableTime;
                  this.timeAccuracy = dateTimeObj.timeAccuracy;
                  this.dateTimeObj = dateTimeObj;
                  this.emit('change');
                }
              }
            })));
          }else{
            this.popupH = 320;
          }
        }else{
          this.popupH = this.enableTime ? 353 : 309;
        }

        var popupPosition = this._calculatePopup();
        this.dateTimePopup = new Popup({
          width: this.popupW,
          // height: this.popupH,
          autoHeight: true,
          classNames: ['dijitCalendarPopup', 'jimu-popup-date-time-picker'],
          content: this.dateTimePicker.domNode,
          enableMoveable: false,
          hasTitle: false,
          hasOverlay: false,
          contentHasNoMargin: true,
          moveToCenter: false,
          customPosition: {left: popupPosition.left, top: popupPosition.top},
          useFocusLogic: false,
          onClose: lang.hitch(this, function () {
            this.dateTimePopup.hide();
            return false;
          }),
          buttons:[]
        });
        if(this._isOnlyShowDate()){
          html.setStyle(this.dateTimePopup.contentContainerNode, {
            marginBottom: '-3px'
          });
        }
        this.own(on(this.dateTimePopup.domNode, 'click', lang.hitch(this, function(){
          this.dateTimePopupClick = true;
        })));
        this.own(on(this.dateTimePopup.domNode, 'keydown', lang.hitch(this, function(evt){
          if(evt.keyCode === keys.ESCAPE){
            this.dateTimePopup.hide();
            this.dateTypeSelect.focus();
          }else if(this.runtime && evt.keyCode === keys.TAB){
            evt.preventDefault(); //keep focusing on current date if no timePicker
            if(!this._isOnlyShowDate()){
              var focusNode = html.hasClass(evt.target, 'dijitCalendarSelectedDate') ?
                this.dateTimePicker.timeTextBox.focusNode : this.dateTimePicker.calendar;
              focusNode.focus();
            }
          }
        })));
      },

      _getLastBtnFromDTPopup: function(){//from Popup dijit
        var lastBtn = null;
        var btns = query('.jimu-btn', this.dateTimePopup.buttonContainer);
        for(var i = btns.length - 1; i >= 0; i--) {
          if(html.getStyle(btns[i], 'display') !== 'none'){
            lastBtn = btns[i];
            break;
          }
        }
        return lastBtn;
      },

      _isOnlyShowDate: function(){
        if(this.runtime && !this.enableTime){
          return true;
        }
        return false;
      },

      _calculatePopup: function(){
        var selectBtnW = html.getStyle(this.domNode, 'width');
        this.popupW = selectBtnW > 210 ? selectBtnW : 210; //mixWidth

        var rPosition = html.position(this.domNode);

        //The pop-up displayed below the button by default
        var bodyH = html.position(document.body).h;
        var popupTop = rPosition.y + 30;
        if(bodyH - popupTop < this.popupH){
          popupTop = rPosition.y - this.popupH;
          popupTop = popupTop > 0 ? popupTop : ((bodyH - this.popupH) / 2);
        }
        //The pop-up is aligned to the left of the button
        var bodyW = html.position(document.body).w;
        if(rPosition.x + this.popupW > bodyW){
          rPosition.x = rPosition.x - (this.popupW - selectBtnW);
        }

        return {
          left: rPosition.x,
          top: popupTop - 1
        };
      },

      resize: function(){
        var popupPosition = this._calculatePopup();
        this.dateTimePopup.setCustomPosition(popupPosition.left, popupPosition.top, this.popupW, this.popupH);
      },

      destroy: function() {
        if(this.dateTimePopup){
          this.dateTimePopup.onClose = lang.hitch(this, function() {
            return true;
          });
          this.dateTimePopup.close();
        }
      }

    });
  });