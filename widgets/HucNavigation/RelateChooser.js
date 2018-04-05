///////////////////////////////////////////////////////////////////////////
// Relate Chooser Dijit
// By: Robert Scheitlin
///////////////////////////////////////////////////////////////////////////
/*global define, document, window, setTimeout*/
/*jslint maxlen: 800, -W116 */
define([
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/_base/html',
  'dojo/on',
  'dojo/has',
  './MobilePopup',
  'dojo/dom',
  'dojo/dom-construct',
  'dojo/dom-style',
  'dojo/dom-class',
  'dojo/dom-attr',
  'dojo/_base/array',
  'dojo/Evented',
  'dojo/sniff'
  ],
  function(declare, lang, html, on, has, MobilePopup, dom, domConstruct, domStyle, domClass, domAttr, array, Evented) {
    return declare([MobilePopup, Evented], {
      //summary:
      //  show the Relate Chooser

      baseClass: 'jimu-popup jimu-message',
      declaredClass: 'esearch.dijit.relate.chooser',

      //type: String
      //  the popup messge type, can be: message/question/error
      type: 'message',

      //type:String
      message: '',

      autoHeight: false,
      relatesArr: null,
      folderurl: null,
      maxWidth: 400,
      maxHeight: 400,

      postMixInProperties: function() {
        this.inherited(arguments);
      },

      _dataMixin: function(){
        this._listContainer = domConstruct.create("div");
        domClass.add(this._listContainer, "relateLyrUrl-list-container");
        this.own(on(this._listContainer, "click", lang.hitch(this, this._onClick)));
        domConstruct.place(this._listContainer, this.contentContainerNode);
        // console.info(this.relatesArr);

        array.map(this.relatesArr, lang.hitch(this, function(relateInfo){
          // console.info(relateInfo);
          var div = domConstruct.create("div");
          domAttr.set(div, "id", relateInfo.id);

          var iconDiv = domConstruct.create("div");
          domAttr.set(iconDiv, "id", relateInfo.id);
          domClass.add(iconDiv, "iconDiv");
          domConstruct.place(iconDiv, div);

          var rImg = domConstruct.toDom("<img src='" + this.folderurl + "images/i_relate.png' alt='' border='0' width='20px' height='20px'>");
          domConstruct.place(rImg, iconDiv);

          var rTitle = domConstruct.create("p");
          domAttr.set(rTitle, "id", relateInfo.id);
          domClass.add(rTitle, "_title");
          rTitle.textContent = rTitle.innerText = relateInfo.name;
          domConstruct.place(rTitle, div);
          domClass.add(div, "relate-list-item");
          domConstruct.place(div, this._listContainer);
        }));
      },

      _onClick: function(evt) {
        //console.info(evt);
        if (evt.target.id === "" && evt.target.parentNode.id === "") {
          return;
        }
        var id = evt.target.id.toLowerCase();
        if (!id) {
          id = evt.target.parentNode.id;
        }
        this._selectedNode = id;
        this.emit('click', id);
        this.close();
      },

      _createTitleNode: function(){
        if (this.titleLabel) {
          this.titleNode = html.create('div', {
            'class': 'title'
          }, this.domNode);
          this.handleNode = html.create('div', {
            'class': 'handle'
          }, this.titleNode);
          this.titleLabeNode = html.create('span', {
            'class': 'title-label jimu-float-leading',
            innerHTML: this.titleLabel || '&nbsp'
          }, this.titleNode);
          this.closeBtnNode = html.create('div', {
            'class': 'close-btn jimu-icon jimu-icon-close jimu-float-trailing',
          }, this.titleNode);
          this.own(on(this.closeBtnNode, 'click', lang.hitch(this, this.close)));
        }
      },

      _increaseZIndex: function() {
        html.setStyle(this.domNode, 'zIndex', 9999);
        html.setStyle(this.overlayNode, 'zIndex', 9998);
      }
    });
  });
