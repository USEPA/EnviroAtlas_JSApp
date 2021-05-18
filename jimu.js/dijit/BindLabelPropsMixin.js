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
  'dojo/query',
  'dojo/_base/array',
  'jimu/utils'
], function(declare, html, query, array, jimuUtils) {
  return declare('jimu-bind-label-props-mixin', null, {
    isRenderIdForAttrs: false,//if add attrs for screen readers.
    /*
      //Two templates:
      *Before rendering*
      <span data-a11y-label-id="a">span string</span>
      <label data-a11y-label-id="b">label string</span>
      <input data-a11y-label-by="a" value="myValue" />
      <input data-a11y-label-by="a b" value="myValue" />
      *After rendering*
      <span id="uuid_a">span string</span>
      <label id="uuid_b">label string 1</span>
      <input aira-labelledby="uuid_a" value="myValue" />
      <input aira-labelledby="uuid_a uuid_b" value="myValue" />

      *Before rendering*
      <label data-label-for="c">label string</label>
      <input data-label-id="c" value="myValue" />
      *After rendering*
      <label for="uuid_c">label string</span>
      <input id="uuid_c" value="myValue" />
    */

    buildRendering: function(){
      this.inherited(arguments);
      if(!this.isRenderIdForAttrs){
        return;
      }
      var a11yLabelId = 'data-a11y-label-id', a11yLabelBy = 'data-a11y-label-by';
      var labelFor = 'data-label-for', labelId = 'data-label-id';
      var labelledDoms = query("[" + a11yLabelId + "],[" + a11yLabelBy + "], [" + labelFor +
       "], [" + labelId + "]", this.domNode);

      if(html.getAttr(this.domNode, a11yLabelId) || html.getAttr(this.domNode, a11yLabelBy) ||
        html.getAttr(this.domNode, labelFor) || html.getAttr(this.domNode, labelId)){
        labelledDoms.unshift(this.domNode);
      }

      var idByDict = {idsDict: {}, bysDict: []}; //idsDict:{'id1':id1_Dom, 'id2':id2_Dom}

      var idForDict = {};//{'groupName':{idDom: operateDom, forDom: labelDom}}
      //Init dict
      var uid, index = 0;
      var uniqId = 'jimuUniqName_' + jimuUtils.getUUID();
      array.forEach(labelledDoms, function(labelledDom) {
        var _a11yLabelId = html.getAttr(labelledDom, a11yLabelId);
        var _a11yLabelBy = html.getAttr(labelledDom, a11yLabelBy);
        var _labelFor = html.getAttr(labelledDom, labelFor);
        var _labelId = html.getAttr(labelledDom, labelId);

        //Id & labelledby
        if(_a11yLabelId){
          html.removeAttr(labelledDom, a11yLabelId);
          uid = uniqId + '_' + index;
          html.setAttr(labelledDom, 'id', uid);
          idByDict.idsDict[_a11yLabelId] = uid;
          index ++;
        }else if(_a11yLabelBy){
          idByDict.bysDict.push(labelledDom);
        }
        //For & id
        else if(_labelFor){
          if(!idForDict.hasOwnProperty(_labelFor)){
            idForDict[_labelFor] = {};
          }
          idForDict[_labelFor].forDom = labelledDom;
        }else{
          if(!idForDict.hasOwnProperty(_labelId)){
            idForDict[_labelId] = {};
          }
          idForDict[_labelId].idDom = labelledDom;
        }
      });

      //set ids rendered for bysDict from idsDict
      for(var idx1 in idByDict.bysDict){//ids & aria-labelledby
        var byDom = idByDict.bysDict[idx1];
        var ids = html.getAttr(byDom, a11yLabelBy).split(' ');
        var idsArray = [];
        array.forEach(ids, function(id) {
          idsArray.push(idByDict.idsDict[id]);
        });
        html.removeAttr(byDom, a11yLabelBy);
        html.setAttr(byDom, 'aria-labelledby', idsArray.join(' '));
      }

      for(var idx2 in idForDict){//for & id
        uid = uniqId + '_' + index;
        var forDom = idForDict[idx2].forDom;
        var idDom = idForDict[idx2].idDom;
        if(forDom){
          html.removeAttr(forDom, labelFor);
          html.setAttr(forDom, 'for', uid);
        }
        if(idDom){
          html.removeAttr(idDom, labelId);
          html.setAttr(idDom, 'id', uid);
        }
        index ++;
      }
    }
  });
});