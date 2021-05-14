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
  'dojo/_base/lang',
  'dojo/on',
  'dojo/query',
  'dojo/_base/array',
  'dojo/dom-construct',
  'dijit/form/Select'
], function (declare, html, lang, on, query, array, domConstruct, Select) {
  return declare([Select], {
    //Use 'caption' element to provide an accessible name for a data table.
    //Use 'aria-label' attribute to provide an accessible name for a data table (NOTE: inconsistent browser/AT support).
    //Use 'aria-labelledby' attribute to provide an accessible name for a data table (NOTE: inconsistent browser/AT support).
    postCreate: function () {
      this.inherited(arguments);
      var a11yLabel = this['aria-label'];
      var a11yLabellBy = this['aria-labelledby'];
      var captionStr;
      if(a11yLabel && a11yLabel !== 'focusNode'){
        captionStr = '<caption class="screen-readers-only-no-position">' + a11yLabel + '</caption>';
        var captionNode = html.toDom(captionStr);
        domConstruct.place(captionNode, this.domNode, 'first');
      }else if(a11yLabellBy){
        setTimeout(lang.hitch(this, function(){
          var ids = a11yLabellBy.split(' ');
          var labels = [];
          array.forEach(ids, function(id) {
            var label = query('#' + id)[0];
            if(label && label !== '' && label.innerHTML){
              labels.push(label.innerHTML);
            }
          });
          if(labels.length > 0){
            //captionStr = '<caption aria-labelledby="id1 id2"></caption>'; //not work
            captionStr = '<caption class="screen-readers-only-no-position">' + labels.join(' ') + '</caption>';
            var captionNode = html.toDom(captionStr);
            domConstruct.place(captionNode, this.domNode, 'first');
          }
        }), 1000);
      }else{//if no label, use current value instead.
        this.setAttrs = function(){
          this.domNode.title = "";
          var value = this.get('value');
          if(value){
            var option = this.getOptions(value);
            this.domNode.title = option.label;
            html.setAttr(this.domNode, 'aria-label', option.label);
          }
        };
        this.setAttrs();
        on(this, 'change', lang.hitch(this, this.setAttrs));
      }
    }
  });
});