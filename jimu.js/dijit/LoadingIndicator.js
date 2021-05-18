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

define(['dojo/_base/declare',
  'dijit/_WidgetBase',
  'dojo/dom-style',
  'dojo/dom-construct'
],
function(declare, _WidgetBase, domStyle, domConstruct) {
  return declare(_WidgetBase, {
    'baseClass': 'jimu-loading-indicator jimu-agol-loading',
    declaredClass: 'jimu.dijit.LoadingIndicator',
    hidden:false,

    postCreate: function(){
      this.inherited(arguments);
      this.hidden = this.hidden === true;
      if(this.hidden){
        domStyle.set(this.domNode, {
          display: 'none'
        });
      }
      domStyle.set(this.domNode, {width: '100%', height: '100%'});

      var str = ' <div class="loading-container">' +
        '<div data-dojo-attach-point="loadingNode" class="img-div"></div></div>';
      domConstruct.place(str, this.domNode);
    },

    show:function(){
      if(!this.domNode){
        return;
      }
      if(this.hidden){
        domStyle.set(this.domNode, 'display', 'block');
        this.hidden = false;
      }
    },

    hide:function(){
      if(!this.domNode){
        return;
      }
      if(!this.hidden){
        domStyle.set(this.domNode, 'display', 'none');
        this.hidden = true;
      }
    }
  });
});