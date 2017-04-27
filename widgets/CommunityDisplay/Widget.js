///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 Esri. All Rights Reserved.
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
    'dojo/sniff',
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidget',
    'jimu/utils',
    'dojo/_base/lang',
    'dojo/on',
    "dojo/dom-style",
    "dojo/dom-class",
    "dojo/aspect",
    "dojo/Deferred"
  ],
  function(
    declare,
    html,
    has,
    _WidgetsInTemplateMixin,
    BaseWidget,
    utils,
    lang,
    on,
    domStyle,
    domClass,
    aspect,
    Deferred
  ) {


    /**
     * The communityDisplay widget displays the current user-selected community
     *
     * @module widgets/CommnityDisplay
     */
    var allCommunities = "All Communities";
    var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {

      baseClass: 'jimu-widget-communitydisplay',
      name: 'CommunityDisplay',
      
	  onReceiveData: function(name, widgetId, data, historyData) {
		  if ((name == 'SelectCommunity') ||(name == 'LocalLayer')){
			  if ((window.communitySelected != window.strAllCommunity)){
			  	this.communitydisplayInfo.innerHTML = window.communityDic[window.communitySelected];
			  }
			  else {
			  	this.communitydisplayInfo.innerHTML = allCommunities;
			  }
		  } 
	  },
      startup: function() {
        this.inherited(arguments);
		this.communitydisplayInfo.innerHTML = allCommunities;
		domClass.add(this.communityDisplayBackground, "communitydisplay-background");
        var box = html.getContentBox(this.communityDisplayBackground);

        html.setStyle(this.foldContainer, 'width', (box.w) + 'px');

      },

      onOpen: function() {

      }, 

    });

    return clazz;
  });