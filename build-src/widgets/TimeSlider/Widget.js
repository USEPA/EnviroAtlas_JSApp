///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 - 2018 Esri. All Rights Reserved.
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

define(['dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/html',
    'dojo/_base/array',
    'dojo/_base/fx',
    "jimu/WidgetManager",
    'dojo/dnd/move',
    'dojo/on',
    'dojo/query',
    'dojo/Deferred',
    'dojo/dom-geometry',
    'jimu/LayerInfos/LayerInfos',
    'jimu/BaseWidget',
    'esri/TimeExtent',
    'esri/dijit/TimeSlider',
    './SpeedMenu',
    'jimu/utils',
    './TimeProcesser',
    './LayerProcesser',
    './utils'
    //"dojo/throttle"
  ],
  function(declare, lang, html, array, baseFx, WidgetManager, Move,
    on, query, Deferred, domGeometry,
    LayerInfos, BaseWidget, TimeExtent, TimeSlider,
    SpeedMenu, jimuUtils,TimeProcesser,LayerProcesser, utils/*, throttle*/) {

    var clazz = declare([BaseWidget], {
      baseClass: 'jimu-widget-timeslider',
      clasName: 'esri.widgets.TimeSlider',
      speedMenu: null,
      _showed: false,
      _timeHandles: null,
      layerInfosObj: null,

      _layerInfosDef: null,
      _timeSliderPropsDef: null,

      _miniModeTimer: null,

      _KEEP_AUTO_RESTART : null,
      _LAST_SWIPE_TIME : null,
      _LAST_SPEED_RATE : null,

      postCreate: function() {
        this.inherited(arguments);
        this._timeHandles = [];

        this.layerProcesser = new LayerProcesser({map:this.map,config:this.config});
        this.timeProcesser = new TimeProcesser({map:this.map,nls:this.nls,config:this.config,widgetId:this.id});

        this._initLayerInfosObj().then(lang.hitch(this, function() {
          this.timeProcesser.setLayerInfosObj(this.layerInfosObj);
          this.layerProcesser.setLayerInfosObj(this.layerInfosObj);
          this.layerProcesser.processTimeDisableLayer();
        }));
      },

      startup: function() {
        this.inherited(arguments);
        this.own(on(this.map, 'resize', lang.hitch(this, this._onMapResize)));
        //close btn
        this.own(on(this.closeBtn, 'click', lang.hitch(this, this._closeHanlder)));
        //toggle mini-mode(desktop)
        this.own(on(this.domNode, 'mouseover', lang.hitch(this, function () {
          if (!utils.isRunInMobile()) {
            this._clearMiniModeTimer();
          }
        })));
        this.own(on(this.domNode, 'mouseout', lang.hitch(this, function () {
          if (!utils.isRunInMobile()) {
            this._setMiniModeTimer();
          }
        })));
        //toggle mini-mode(mobile)
        this.own(on(this.domNode, 'click', lang.hitch(this, function () {
          if (utils.isRunInMobile()) {
            this._clearMiniModeTimer();
            this._setMiniModeTimer();

            var isInMiniMode = html.hasClass(this.domNode, 'mini-mode');
            if (isInMiniMode) {
              html.removeClass(this.domNode, 'mini-mode');
              this._adaptResponsive();
            }
          }
        })));

        //set time layer info by config setting
        if (false === this.config.isHonorWebMap && this.config.customLayersConfig) {
          utils.setLayersUseMapTimebyConfig(this.layerInfosObj, this.config);
        }
        if (utils.isConfigLiveMode(this.config) && this.layerProcesser.hasLiveDataLayer()) {
          html.removeClass(this.liveIcon, 'hide');//show live icon
        } else {
          html.addClass(this.liveIcon, 'hide');
        }
      },

      //overwrite for dijit in header-controller
      setPosition: function(/*position, containerNode*/){
        if (!this._isSetPosition) {
          var containerNode = this.map.id;
          var style = jimuUtils.getPositionStyle(this.position);
          html.place(this.domNode, containerNode);
          html.setStyle(this.domNode, style);

          this._isSetPosition = true;
        }
      },

      resize: function () {
        //throttle(lang.hitch(this, this._onMapResize), 200);
        this._onMapResize();
      },

      onOpen: function() {
        if (this._isTestSizeFlag) {
          return;
        }

        this._closeOthersTimeSlider();

        this._initLayerInfosObj().then(lang.hitch(this, function () {
          if (!this.layerProcesser.hasVisibleTemporalLayer()) {
            this._showNoTimeLayer();
          } else {
            if (!this._showed) {
              this.showTimeSlider();
            }
          }

          //initPosition
          utils.initPosition(this.map, this.domNode, this.position);
          this._adaptResponsive();

          this._setPlayBtnStyleTimer();
        }));
      },
      _closeOthersTimeSlider: function () {
        var allTimeSlider = WidgetManager.getInstance().getWidgetsByName("TimeSlider");
        array.forEach(allTimeSlider, lang.hitch(this, function (widget) {
          if (widget.state === "opened" && this.id !== widget.id) {
            WidgetManager.getInstance().closeWidget(widget);//close others TimeSlider
          }
        }));
      },
      _openHanlder: function(){
        WidgetManager.getInstance().openWidget(this);
      },

      onClose: function() {
        this._initLayerInfosObj().then(lang.hitch(this, function() {
          if (!this.layerProcesser.hasVisibleTemporalLayer()) {
            html.setStyle(this.noTimeContentNode, 'display', 'none');
            this._showed = false;

            if (this.map.removeTimeSlider) {
              this.map.removeTimeSlider();
            }
          } else {
            if (this._showed) {
              this.timeSlider.pause();
              this.closeTimeSlider();
            }
          }

          //this.timeProcesser.clearAutoRefreshTimer();//autoRefresh
          this._cleanPlayBtnStyleTimer();
        }));
      },
      //on close btn click
      _closeHanlder: function(){
        WidgetManager.getInstance().closeWidget(this);
      },
      _showNoTimeLayer: function () {
        html.setStyle(this.noTimeContentNode, 'display', 'block');
        html.setStyle(this.timeContentNode, 'display', 'none');
        this._showed = true;
      },

      showTimeSlider: function() {
        html.setStyle(this.noTimeContentNode, 'display', 'none');

        this.createTimeSlider().then(lang.hitch(this, function() {
          if("undefined" === typeof this.timeSlider){
            this._showNoTimeLayer();
            return;
          }

          this.timeProcesser.setTimeSlider(this.timeSlider);
          this.layerProcesser.setTimeSlider(this.timeSlider);
          this._updateTimeSliderUI();

          //restore playBtn state
          if (this.playBtn && html.hasClass(this.playBtn, "pause")) {
            html.removeClass(this.playBtn, "pause");
          }
          //styles
          html.setStyle(this.domNode, 'display', 'block');
          html.setStyle(this.timeContentNode, 'display', 'block');
          html.addClass(this.domNode, 'show-time-slider');
          this._initSpeedMenu();

          baseFx.animateProperty({
            node: this.timeContentNode,
            properties: {
              opacity: {
                start: 0,
                end: 1
              }
            },
            onEnd: lang.hitch(this, function() {
              this._showed = true;
              //auto play when open
              if (false !== this.config.autoPlay &&
                false === html.hasClass(this.playBtn, "pause")) {
                on.emit(this.playBtn, 'click', { cancelable: false, bubbles: true });
              }
              this._adaptResponsive();
            }),
            duration: 500
          }).play();
        }));
      },

      closeTimeSlider: function() {
        this._draged = false;
        this._isSetPosition = false;
        this._showed = false;
        this._timeSliderPropsDef = null;

        html.setStyle(this.domNode, 'display', 'none');

        this.removeTimeSlider();
        this._destroySpeedMenu();

        baseFx.animateProperty({
          node: this.timeContentNode,
          properties: {
            opacity: {
              start: 1,
              end: 0
            }
          },
          onEnd: lang.hitch(this, this._onCloseTimeSliderEnd),
          duration: 500
        }).play();
      },

      _onCloseTimeSliderEnd: function() {
        if (this._destroyed) {
          return;
        }
        html.removeClass(this.domNode, 'show-time-slider');
        if (this.state === 'closed') {
          html.removeClass(this.domNode, 'mobile-time-slider');
          html.removeClass(this.timeContentNode, 'mobile');
        }
      },

      getTimeSliderProps: function() {
        if (!this._timeSliderPropsDef) {

          this._timeSliderPropsDef = new Deferred();
          this.own(this._timeSliderPropsDef);
          //var itemInfo = map && map.itemInfo;
          this.timeProcesser.getTsPros().then(lang.hitch(this, function (tsProps) {
            /*if (null !== tsProps &&
              (this.timeProcesser.needUpdateFullTime() || true === tsProps._needToFindDefaultInterval)) {
              this.timeProcesser._getUpdatedFullTime().then(lang.hitch(this, function (fullTimeExtent) {
                var start = fullTimeExtent.startTime.getTime();
                var end = fullTimeExtent.endTime.getTime();

                //TODO reset timeExtent:consider liveData
                if (tsProps.startTime > end || tsProps.endTime < start) {
                  tsProps.startTime = start;
                  tsProps.endTime = end;
                } else {
                  // if (tsProps.startTime < start) {
                  //   tsProps.startTime = start;
                  // }
                  // if (tsProps.endTime > end) {
                  //   tsProps.endTime = end;
                  // }
                }

                if (true === tsProps._needToFindDefaultInterval) {
                  tsProps.timeStopInterval = this.timeProcesser.findDefaultInterval(fullTimeExtent);
                }

                this._timeSliderPropsDef.resolve(tsProps);
              }));
            } else {
              this._timeSliderPropsDef.resolve(tsProps);
            }*/
            this.timeProcesser._getUpdatedFullTime().then(lang.hitch(this, function (fullTimeExtent) {
              this._timeSliderPropsDef.resolve({
                prop: tsProps,
                fulltime: fullTimeExtent
              });
            }));
          }));
        }

        return this._timeSliderPropsDef;
      },

      createTimeSlider: function () {
        return this.getTimeSliderProps().then(lang.hitch(this, function (data) {
          var props = data.prop,
            fullTimeExtent = data.fulltime;
          var timeExtent = null;
          // if (!props) {
          //   return;
          // }
          if (this.timeSlider) {
            return this.timeSlider;
          }
          //this domNode will be deleted when TimeSlider destroy
          this.sliderNode = html.create('div', {}, this.sliderNodeContainer);

          this.timeSlider = new TimeSlider({}, this.sliderNode);
          this.map.setTimeSlider(this.timeSlider);
          /******************  time-extent-change demo ********************
          this.own(on(this.map.timeSlider, 'time-extent-change', lang.hitch(this, function (res) {
            //1.time info
            var startTime = res.startTime,
              endTime = res.endTime;
            //2.layer info(LayerInfos.getInstance() ==> this.layerInfosObj)
            array.forEach(this.layerInfosObj.getLayerInfoArray(), function (info) {
              if (info.layerObject.setUseMapTime) {
                var isUseTime = info.layerObject.useMapTime;
              }
            });
          })));
          **************************************/

          if (false === this.config.isHonorWebMap) {
            //custom layers & custom time
            var timeConfig = utils.timeCalendarForBuilderConfig(this.config);

            if (null === timeConfig || (!timeConfig.startTime && !timeConfig.endTime)) {
              console.log("timeSlider: time param error");
            }

            timeExtent = new TimeExtent(timeConfig.startTime, timeConfig.endTime);
            //timeConfig.interval = null;//hack
            // if(null === timeConfig.interval ||
            // (!timeConfig.interval.number && !timeConfig.interval.units)){
            //   this.timeSlider.createTimeStopsByCount(timeExtent, (timeConfig.numberOfStops + 1));//TODO
            // }
            if (!timeConfig.interval.number && !timeConfig.interval.units) {
              timeConfig.interval = this.timeProcesser.findDefaultInterval(timeExtent);
            }
            this.timeSlider.setThumbCount(timeConfig.thumbCount);
            //this.timeSlider.setThumbIndexes([0, 1]);//default start
            this.timeSlider.setThumbMovingRate(2000);

            if (timeConfig.interval.number === "0" || timeConfig.interval.number === 0) {
              timeConfig.interval.number = 1;
            }

            this.timeSlider.createTimeStopsByTimeInterval(timeExtent, timeConfig.interval.number,
              timeConfig.interval.units);

            if (this._LAST_SWIPE_TIME) {
              this._LAST_SWIPE_TIME = null;
            }
          } else {//true === this.config.isHonorWebMap

            //create by webmap config
            if (props) {
              //var timeExtent = null;
              if (props.startTime && props.endTime) {
                timeExtent = new TimeExtent(new Date(props.startTime), new Date(props.endTime));
              } else if (props.startTime) {
                timeExtent = new TimeExtent(new Date(props.startTime), fullTimeExtent.endTime);
              } else if (props.endTime) {
                timeExtent = new TimeExtent(fullTimeExtent.startTime, new Date(props.endTime));
              } else {
                timeExtent = new TimeExtent(fullTimeExtent.startTime, fullTimeExtent.endTime);
              }
              // bug in saved web map?
              if (timeExtent.startTime > timeExtent.endTime) {
                timeExtent = new TimeExtent(fullTimeExtent.startTime, fullTimeExtent.endTime);
              }
              this.timeSlider.setThumbCount(props.thumbCount);
              if (props.numberOfStops) {
                this.timeSlider.createTimeStopsByCount(timeExtent, (props.numberOfStops + 1));
              } else {
                this.timeSlider.createTimeStopsByTimeInterval(timeExtent,
                  props.timeStopInterval.interval, props.timeStopInterval.units);
              }
              this.timeSlider.setThumbMovingRate(props.thumbMovingRate);

              //palyback
              if (props.currentTimeExtent) {
                if (!props.currentTimeExtent[0]) {
                  props.currentTimeExtent[0] = timeExtent.startTime.getTime();
                }
                if (!props.currentTimeExtent[1]) {
                  props.currentTimeExtent[1] = timeExtent.endTime.getTime();
                }
                //var timeStops = this.timeSlider.timeStops;
                if (props.thumbCount === 1) {
                  this.timeSlider.setThumbIndexes(
                    [this.timeProcesser.findClosestThumbIndex(this.timeSlider, props.currentTimeExtent[1])]);
                } else {
                  var start = this.timeProcesser.findClosestThumbIndex(this.timeSlider, props.currentTimeExtent[0]);
                  if (props.currentTimeExtent[0] === props.currentTimeExtent[1]) {
                    this.timeSlider.setThumbIndexes([start, start]);
                  } else {
                    var end = this.timeProcesser.findClosestThumbIndex(this.timeSlider, props.currentTimeExtent[1]);
                    if (start < end) {
                      this.timeSlider.setThumbIndexes([start, end]);
                    } else {
                      this.timeSlider.setThumbIndexes([start, start + 1]);
                    }
                  }
                }
              } else {
                if (props.thumbCount === 2) {
                  this.timeSlider.setThumbIndexes([0, 1]);//default start
                }
              }

              //layers
              //this.layerProcesser.processerDisableLayers(props);
            } else {
              // no-props: default settings
              props = {};
              props.thumbCount = 2;
              this.timeSlider.setThumbCount(props.thumbCount);
              this.timeSlider.setThumbIndexes([0, 1]);

              this.timeSlider.setThumbMovingRate(2000);
              //this.findDefaultInterval();
              props.timeStopInterval = this.timeProcesser.findDefaultInterval(fullTimeExtent);
              this.timeSlider.createTimeStopsByTimeInterval(fullTimeExtent,
                props.timeStopInterval.interval, props.timeStopInterval.units);
            }
          }

          if (this.timeSlider.timeStops.length > 25) {
            this.timeSlider.setTickCount(0);
          }

          var loop = true;
          if (false === this.config.loopPlay) {
            loop = false;
          }
          this.timeSlider.setLoop(loop);
          this.timeSlider.startup();

          //this.timeProcesser.restoreAutoRefreshTimer(this.timeSlider);//set autoRefresh Stops

          if (this._KEEP_AUTO_RESTART) {
            this.timeSlider.play();
            this._KEEP_AUTO_RESTART = null;
          }

          this._timeHandles.push(on(
            this.timeSlider,
            'time-extent-change',
            lang.hitch(this, this.onTimeSliderChange)
          ));

          return this.timeSlider;
        }));
      },
      onTimeSliderChange: function (timeExtent) {
        //console.log("playing==>"+this.timeSlider.playing);
        this.updateTimeExtentLabel(timeExtent);

        if (utils.isConfigLiveMode(this.config)) {
          this.timeCalendarDataAutoRefresh(timeExtent);//need to rebuild timeExtent
        }
      },
      timeCalendarDataAutoRefresh: function (timeExtent) {
        if (timeExtent && timeExtent.startTime) {
          var endLength = this.timeSlider.timeStops.length >= 1 ? this.timeSlider.timeStops.length - 1 : 0;
          var startTag = this.timeSlider.timeStops[0].getTime();
          var endTag = this.timeSlider.timeStops[endLength].getTime();
          var res = false;
          var currentTime1 = timeExtent.startTime.getTime();
          var currentTime2 = timeExtent.endTime.getTime();

          if (!this._LAST_SWIPE_TIME) {
            this._LAST_SWIPE_TIME = {};
            res = false;
          } else {
            if (this.timeSlider.playing) {//when playing
              if (1 === this.timeSlider.thumbCount) {
                if (currentTime2 === startTag && this._LAST_SWIPE_TIME.endTime === endTag) {
                  res = true;
                }
              } else {
                if (currentTime1 === startTag && this._LAST_SWIPE_TIME.endTime === endTag) {
                  res = true;
                }
              }
            }
          }

          this._LAST_SWIPE_TIME.startTime = currentTime1;
          this._LAST_SWIPE_TIME.endTime = currentTime2;

          if (res) {
            console.log("auto refresh");
            this._KEEP_AUTO_RESTART = true;
            this._closeHanlder();
            this._openHanlder();
          }
        }
      },

      _updateTimeSliderUI: function () {
        this.updateLayerLabel();
        this.updateTimeExtentLabel();
        this._updateBtnsUI();
      },
      _updateBtnsUI: function(){
        //find and hide raw btns
        var btns = query(".esriTimeSlider > table > tbody > tr > td > span > span", this.esriTimeSlider);
        if (btns && 3 === btns.length) {
          this._rawPlayBtn = btns[0];
          this._rawPreviousBtn = btns[1];
          this._rawNextBtn = btns[2];
        }
        var tds = query(".esriTimeSlider > table > tbody > tr > td", this.esriTimeSlider);
        if (tds && 4 === tds.length) {
          html.addClass(tds[0], "hide");//_rawPlayBtn
          html.addClass(tds[2], "hide");//_rawPreviousBtn
          html.addClass(tds[3], "hide");//_rawNextBtn
        }

        //trigger events
        if(!this._previousBtnHandler){
          this._previousBtnHandler = this.own(on(this.previousBtn, 'click', lang.hitch(this, function () {
            on.emit(this._rawPreviousBtn, 'click', { cancelable: false, bubbles: true });
          })));
        }
        if(!this._playBtnHandler){
          this._playBtnHandler = this.own(on(this.playBtn, 'click', lang.hitch(this, function (evt) {
            on.emit(this._rawPlayBtn, 'click', {cancelable: false, bubbles: true });
            //toggle pause class
            if(html.hasClass(this.playBtn, "pause")){
              html.removeClass(this.playBtn, "pause");

              //this.timeProcesser.clearAutoRefreshTimer();//autoRefresh
            } else {
              html.addClass(this.playBtn, "pause");
              if(utils.isRunInMobile()){
                html.addClass(this.domNode, 'mini-mode');
                this._adaptResponsive();
              }

              //this.timeProcesser.setAutoRefreshTimer(this);//auto refresh
            }

            //hack loop=false, click play btn can't play again
            var slider = this.timeSlider._slider, val;
            if (lang.isArray(slider.value)) {
              val = slider.value[1];
            } else {
              val = slider.value;
            }
            if (this.timeSlider.loop !== true && val === slider.maximum) {
              this.timeSlider.play();
              if (this.timeSlider.thumbCount > 1) {
                this.timeSlider.setThumbIndexes([0, 1]);
              } else {
                this.timeSlider.setThumbIndexes(0);
              }
            }

            evt.stopPropagation();
            evt.preventDefault();
          })));
        }
        if(!this._nextBtnHandler){
          this._nextBtnHandler = this.own(on(this.nextBtn, 'click', lang.hitch(this, function () {
            on.emit(this._rawNextBtn, 'click', { cancelable: false, bubbles: true });
          })));
        }
        //replace play btns, under RTL
        if (window.isRTL) {
          html.place(this.previousBtn, this.playBtn, "after");
          html.place(this.nextBtn, this.playBtn, "before");
        }
      },

      removeTimeSlider: function() {
        array.forEach(this._timeHandles, function(handle) {
          if (handle && handle.remove) {
            handle.remove();
          }
        });
        if (this.timeSlider && !this.timeSlider._destroyed) {
          this.timeSlider.destroy();
          this.timeSlider = null;
        }

        if (this.map) {
          this.map.setTimeExtent();
        }
      },

      updateLayerLabel: function() {
        if (this.config.showLabels) {
          html.setStyle(this.layerLabelsNode, 'display', 'block');
          var label = this.nls.layers;
          var names = this.layerProcesser._getVisibleTemporalLayerNames();
          label = label + names.join(',');
          this.layerLabelsNode.innerHTML = label;
          html.setAttr(this.layerLabelsNode, 'title', label);
        } else {
          html.setStyle(this.layerLabelsNode, 'display', 'none');
        }
      },

      updateTimeExtentLabel: function (timeExtent) {
        //TODO Humanize duration text
        var label = this.timeProcesser._getTimeFormatLabel(timeExtent);
        //console.log("===>"+label);
        this.timeExtentLabelNode.innerHTML = label;
        html.setAttr(this.timeExtentLabelNode, 'title', label);
      },

      _adaptResponsive: function (optison) {
        if (!this._showed) {
          return;
        }

        setTimeout(lang.hitch(this, function () {
          if (utils.isRunInMobile()) {
            this.disableMoveable();
            html.addClass(this.timeContentNode, 'mobile');
            html.addClass(this.domNode, 'mobile');
          } else {
            //DO NOT makeMoveable, when _clearMiniModeTimer
            if (!(optison && "undefined" !== typeof optison.refreshMoveable && false === optison.refreshMoveable)) {
              if ("none" !== html.getStyle(this.noTimeContentNode, "display")) {
                this.dragHandler = this.noTimeContentNode;
              } else {
                this.dragHandler = this.labelContainer;
              }

              this.makeMoveable(this.dragHandler);
            }

            html.removeClass(this.timeContentNode, 'mobile');
            html.removeClass(this.domNode, 'mobile');
          }
          this._setPopupPosition(utils.isRunInMobile());
        }), 10);
      },

      _setPopupPosition: function (isRunInMobile) {
        if(!isRunInMobile){
          //height
          if (this.config.showLabels){
            html.setStyle(this.domNode, 'height','92px');
          } else {
            html.setStyle(this.domNode, 'height','72px');
          }

          //do not initPosition it, if moveed by drag
          if (!this._draged) {
            utils.initPosition(this.map, this.domNode, this.position);
          }

          if (!this._moving && this.position &&
            this.position.left && this.position.top) {
            html.setStyle(this.domNode, 'top', this.position.top + 'px');
            html.setStyle(this.domNode, 'left', this.position.left + 'px');
          }
        } else {
          //height
          if (this.config.showLabels){
            html.setStyle(this.domNode, 'height','128px');
          } else {
            html.setStyle(this.domNode, 'height','108px');
          }
        }

        this._setUI(isRunInMobile);
      },
      _setUI:function(isRunInMobile){
        var btnsContainer = html.getContentBox(this.btnsContainer);

        if(isRunInMobile){
          var screenWidth = window.innerWidth;
          var middleOfScreenWidth = screenWidth / 2;
          var left = middleOfScreenWidth - btnsContainer.w / 2;

          if(window.isRTL){
            html.setStyle(this.btnsContainer, 'margin-right', left + 'px');
          } else {
            html.setStyle(this.btnsContainer, 'margin-left', left + 'px');
          }

          if (this.config.showLabels && !html.hasClass(this.domNode, 'mini-mode')) {
            html.setStyle(this.sliderContent, 'bottom', '-12px');
          } else if (this.config.showLabels && html.hasClass(this.domNode, 'mini-mode')) {
            html.setStyle(this.sliderContent, 'bottom', '20px');
          }

        } else {
          html.setStyle(this.btnsContainer, 'margin-left', 'auto');
          html.setStyle(this.btnsContainer, 'margin-right', 'auto');

          if (this.config.showLabels && !html.hasClass(this.domNode, 'mini-mode')) {
            //showLabels && no 'mini-mode'
            html.setStyle(this.sliderContent, 'bottom', '-20px');
          } else if (this.config.showLabels && html.hasClass(this.domNode, 'mini-mode')) {
            //showLabels && 'mini-mode'
            html.setStyle(this.sliderContent, 'bottom', '20px');
          } else {
            //no showLabels
            html.setStyle(this.sliderContent, 'bottom', '0px');
          }
        }
      },

      _onMapResize: function() {
        if (this.state === 'closed') {
          return;
        }

        //initPosition when widget OutofScreen
        if(!utils.isRunInMobile()){
          if (!utils.isOutOfScreen(this.map, this.position)) {
            utils.getMarginPosition(this.map, this.domNode, this.position);
          } else if (utils.isOutOfScreen(this.map, this.position)) {
            //utils.initPosition(this.map, this.domNode, this.position);
            utils.setMarginPosition(this.map, this.domNode, this.position);
          }
        }

        this._adaptResponsive();
      },

      destroy: function() {
        if (this.map) {
          this.map.setTimeExtent(null);
        }
        this.inherited(arguments);
      },

      //play btn style
      _setPlayBtnStyleTimer: function () {
        this._playBtnStyleTimer = setInterval(lang.hitch(this, function () {
          if (this.timeSlider && this.timeSlider.playing) {
            html.addClass(this.playBtn, "pause");
          } else {
            html.removeClass(this.playBtn, "pause");
          }
        }), 200);
      },
      _cleanPlayBtnStyleTimer: function () {
        if (this._playBtnStyleTimer) {
          clearTimeout(this._playBtnStyleTimer);
        }
      },

      //LayerInfosObj
      _initLayerInfosObj: function () {
        if (!this._layerInfosDef) {
          this._layerInfosDef = new Deferred();
          this.own(this._layerInfosDef);

          LayerInfos.getInstance(this.map, this.map.itemInfo).then(lang.hitch(this, function (layerInfosObj) {
            // if (this.domNode) {
            //   }
            this.layerInfosObj = layerInfosObj;
            // should check whether is timeInfo layer.
            this.own(on(
              layerInfosObj,
              'layerInfosIsShowInMapChanged',
              lang.hitch(this, this.layerProcesser._onLayerInfosIsShowInMapChanged)));
            this.own(layerInfosObj.on(
              'layerInfosChanged',
              lang.hitch(this, this.layerProcesser._onLayerInfosChanged)));

            this._layerInfosDef.resolve(this.layerInfosObj);
          }));
        }

        return this._layerInfosDef;
      },

      //miniModeTimer
      _clearMiniModeTimer: function () {
        html.removeClass(this.domNode, 'mini-mode');
        this._adaptResponsive({ refreshMoveable:false });
        if (this._miniModeTimer) {
          clearTimeout(this._miniModeTimer);
        }
      },
      _setMiniModeTimer: function () {
        var time = utils.isRunInMobile() ? 5000 : 2000;
        this._miniModeTimer = setTimeout(lang.hitch(this, function () {
          html.addClass(this.domNode, 'mini-mode');
          this._adaptResponsive();
        }), time);
      },

      //moveable
      makeMoveable: function (handleNode) {
        this.disableMoveable();
        var containerBox = domGeometry.getMarginBox(this.map.root);
        //containerBox.l = containerBox.l - width + tolerance;
        //containerBox.w = containerBox.w + 2 * (width - tolerance);
        this.moveable = new Move.boxConstrainedMoveable(this.domNode, {
          box: containerBox,
          handle: handleNode || this.handleNode,
          within: true
        });
        this.own(on(this.moveable, 'MoveStart', lang.hitch(this, this.onMoveStart)));
        this.own(on(this.moveable, 'Moving', lang.hitch(this, this.onMoving)));
        this.own(on(this.moveable, 'MoveStop', lang.hitch(this, this.onMoveStop)));
      },
      disableMoveable: function () {
        if (this.moveable) {
          this.dragHandler = null;
          this.moveable.destroy();
          this.moveable = null;
        }
      },
      onMoveStart: function (mover) {
        var containerBox = domGeometry.getMarginBox(this.map.root),
          domBox = domGeometry.getMarginBox(this.domNode);
        if (window.isRTL) {
          var rightPx = html.getStyle(mover.node, 'right');
          html.setStyle(mover.node, 'left', (containerBox.w - domBox.w - parseInt(rightPx, 10)) + 'px');
          html.setStyle(mover.node, 'right', '');
        }
        //move flag
        if (!this._draged) {
          this._draged = true;
        }
      },
      onMoving: function (/*mover*/) {
        //html.setStyle(mover.node, 'opacity', 0.9);
        this._moving = true;
      },
      onMoveStop: function (mover) {
        if (mover && mover.node) {
          html.setStyle(mover.node, 'opacity', 1);
          var panelBox = domGeometry.getMarginBox(mover.node);
          this.position.left = panelBox.l;
          this.position.top = panelBox.t;
          utils.getMarginPosition(this.map, this.domNode, this.position);

          // save move data
          setTimeout(lang.hitch(this, function () {
            this._moving = false;
          }), 10);
        }
      },
      _onHandleClick: function(evt) {
        evt.stopPropagation();
      },

      //speed meun
      _initSpeedMenu: function () {
        if (!this.speedMenu) {
          this.speedMenuNode = html.create('div', { "class": "jimu-float-trailing" }, this.sliderContent);

          this.speedMenu = new SpeedMenu({ nls: this.nls }, this.speedMenuNode);
          this.speedMenuSelectedHanlder = this.own(on(this.speedMenu, 'selected', lang.hitch(this, function (rateStr) {
            if (this.timeSlider && rateStr) {
              this._LAST_SPEED_RATE = rateStr;
              var rate = parseFloat(rateStr);
              this.timeSlider.setThumbMovingRate(2000 / rate);
            }
          })));

          this.speedMenuOpenHanlder = this.own(on(this.speedMenu, 'open', lang.hitch(this, function () {
            this._clearMiniModeTimer();
          })));

          this.speedMenuCloseHanlder = this.own(on(this.speedMenu, 'close', lang.hitch(this, function () {
            this._setMiniModeTimer();
          })));

          if (this._LAST_SPEED_RATE) {
            this.speedMenu.setSpeed(this._LAST_SPEED_RATE);//keep speed when auto refresh
          }
        }
      },
      _destroySpeedMenu: function () {
        if(this.speedMenu && this.speedMenu.destroy){
          this.speedMenu.destroy();
        }
        this.speedMenu = null;
        this.speedMenuSelectedHanlder = null;
        this.speedMenuOpenHanlder = null;
        this.speedMenuCloseHanlder = null;
      }
    });
    return clazz;
  });