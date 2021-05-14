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
  "dojo/_base/array",
  'dijit/_WidgetBase',
  'dojo/_base/lang',
  'dojo/Evented',
  "libs/arcgis-html-sanitizer/arcgis-html-sanitizer",
],
  function (declare, array, _WidgetBase, lang, Evented, Sanitizer) {
    /* usage:
      1.import: 'jimu/dijit/EditorXssFilter',
      2.safeContent = EditorXssFilter.getInstance().sanitize(xssContent);
    */
    var singleton = null;
    var clazz = declare([_WidgetBase, Evented], {
      baseClass: 'jimu-editor-xss-filter',
      declaredClass: 'jimu.dijit.EditorXssFilter',
      //refs
      sanitizer: null,
      xss: null,
      //filter: null,
      //rules
      whiteList: {},
      graphicsWhiteList: {},

      postCreate: function () {
        this.whiteList = this._getWhiteList();
        this.sanitizer = new Sanitizer({
          whiteList: this.whiteList,
          safeAttrValue: lang.hitch(this, function (tag, name, value, cssFilter) {
            if (name === 'style') {
              var quots = this.xss.friendlyAttrValue(value);
              return quots.replace(/\"/g, "'");//replace " to ', for the inline style
            } else if (tag === 'img' && name === 'src') {
              return this.xss.escapeAttrValue(value);//keep string for base64
            }
            return this.xss.safeAttrValue(tag, name, value, cssFilter);
          }),
          // onTagAttr: lang.hitch(this, function(tag, name, value, isWhiteAttr) {
          //   // if (tag === "b" && name === "style" &&
          //   //   ((value.indexOf("color:") > -1) && value.indexOf("-color") == -1)) {
          //   //   return value.replace(/\bcolor\b/g, "");//dojo editor delete the <b style="color"
          //   // }
          //   if (tag === "style") {
          //     return value.replace(/\"/g, "'");
          //   }
          // }),
          onTag: lang.hitch(this, function (tag, html, options) {
            if (options.isWhite && this._isInWhiteList(tag, this.graphicsWhiteList)) { //for svg, canvas
              return html;
            }
          }),
          onIgnoreTagAttr: lang.hitch(this, function (tag, name, value, isWhiteAttr) { // Allow attributes of whitelist tags 
            if (name.substr(0, 5) === "data-") {
              return name + '="' + this.xss.escapeAttrValue(value) + '"';
            }
          }),
          onIgnoreTag: lang.hitch(this, function (tag, html, options) {
            if (tag.substr(0, 2) === "o:") { //MS word, means "Office namespace", e.g. <o:p>
              return html;
            }

            if (tag === "!--[if") { // e.g. <!--[if !supportLists]-->, <!--[if gte mso
              return html; //<!--[if 
            } else if (tag === "!--[endif]--") {
              return html; //<!--[endif]-->
            }
          })
        }, true);
        this.xss = this.sanitizer.xss; //keep codes-scope for dojo
        //this.filter = this.sanitizer;
      },

      sanitize: function (str) {
        return this.sanitizer.sanitize(str);
      },

      _getWhiteList: function () {
        var htmlTagWhiteList = {
          a: ["target", "href", "title"],
          abbr: ["title"],
          address: [],
          area: ["shape", "coords", "href", "alt"],
          article: [],
          aside: [],
          audio: ["autoplay", "controls", "loop", "preload", "src"],
          b: [],
          bdi: ["dir"],
          bdo: ["dir"],
          big: [],
          blockquote: ["cite"],
          br: [],
          caption: [],
          center: [],
          cite: [],
          code: [],
          col: ["align", "valign", "span", "width"],
          colgroup: ["align", "valign", "span", "width"],
          dd: [],
          del: ["datetime"],
          details: ["open"],
          div: [],
          dl: [],
          dt: [],
          em: [],
          font: ["color", "size", "face"],
          footer: [],
          h1: [],
          h2: [],
          h3: [],
          h4: [],
          h5: [],
          h6: [],
          header: [],
          hr: [],
          i: [],
          img: ["src", "alt", "title", "width", "height"],
          ins: ["datetime"],
          li: [],
          mark: [],
          nav: [],
          ol: [],
          p: [],
          pre: [],
          s: [],
          section: [],
          small: [],
          span: [],
          sub: [],
          sup: [],
          strong: [],
          table: ["width", "border", "align", "valign"],
          tbody: ["align", "valign"],
          td: ["width", "rowspan", "colspan", "align", "valign"],
          tfoot: ["align", "valign"],
          th: ["width", "rowspan", "colspan", "align", "valign"],
          thead: ["align", "valign"],
          tr: ["rowspan", "align", "valign"],
          tt: [],
          u: [],
          ul: [],
          video: ["autoplay", "controls", "loop", "preload", "src", "height", "width"]
        };

        var baseAttrs = ['title', 'height', 'width', 'class', 'style', 'font-family', 'id', 'align', 'text-align'];
        var editorWhiteList = {
          div: baseAttrs,
          h1: baseAttrs,
          h2: baseAttrs,
          h3: baseAttrs,
          h4: baseAttrs,
          h5: baseAttrs,
          h6: baseAttrs,
          span: baseAttrs,
          p: baseAttrs,
          s: baseAttrs,
          strong: baseAttrs,
          em: baseAttrs,
          u: baseAttrs,
          ol: baseAttrs,
          ul: baseAttrs,
          li: baseAttrs,
          a: ['href', 'target'].concat(baseAttrs),
          img: ['src', 'alt', 'border'].concat(baseAttrs),//for chosseImage
          blockquote: baseAttrs,//for 'indent', 'outdent'
          font: ['face', 'size', 'color'].concat(baseAttrs),//for FontChoice
          pre: baseAttrs,// formatBlock
          code: baseAttrs,
          b: baseAttrs,
          i: baseAttrs,
          wbr: baseAttrs,
          video: ["autoplay", "controls", "loop", "muted", "poster", "preload"].concat(baseAttrs),
          audio: ["autoplay", "controls", "loop", "muted", "preload"].concat(baseAttrs),
          source: ["media", "src", "type"].concat(baseAttrs),
          table: ["cellpadding", "cellspacing", "border"].concat(baseAttrs), // tables
          tbody: [].concat(baseAttrs),
          tr: ["valign"].concat(baseAttrs),
          td: ["valign", "colspan", "rowspan", "nowrap"].concat(baseAttrs),
          th: ["valign", "colspan", "rowspan", "nowrap"].concat(baseAttrs),
          hr: baseAttrs,
          html: baseAttrs, //copy from *.html
          title: baseAttrs,
          link: ["rel", "href"],
          style: ["type"].concat(baseAttrs),
          body: baseAttrs
        };

        this.graphicsWhiteList = { //skip all those graphics attrs in .onTag()
          animate: [],
          animateMotion: [],
          animateTransform: [],
          circle: [],
          clipPath: [],
          "color-profile": [],
          defs: [],
          desc: [],
          discard: [],
          ellipse: [],
          feBlend: [],
          feColorMatrix: [],
          feComponentTransfer: [],
          feComposite: [],
          feConvolveMatrix: [],
          feDiffuseLighting: [],
          feDisplacementMap: [],
          feDistantLight: [],
          feDropShadow: [],
          feFlood: [],
          feFuncA: [],
          feFuncB: [],
          feFuncG: [],
          feFuncR: [],
          feGaussianBlur: [],
          feImage: [],
          feMerge: [],
          feMergeNode: [],
          feMorphology: [],
          feOffset: [],
          fePointLight: [],
          feSpecularLighting: [],
          feSpotLight: [],
          feTile: [],
          feTurbulence: [],
          filter: [],
          foreignObject: [],
          g: [],
          hatch: [],
          hatchpath: [],
          line: [],
          linearGradient: [],
          marker: [],
          mask: [],
          mesh: [],
          meshgradient: [],
          meshpatch: [],
          meshrow: [],
          metadata: [],
          mpath: [],
          path: [],
          pattern: [],
          polygon: [],
          polyline: [],
          radialGradient: [],
          rect: [],
          //script: [],
          set: [],
          solidcolor: [],
          stop: [],
          //style: [],
          svg: [],
          switch: [],
          symbol: [],
          text: [],
          textPath: [],
          title: [],
          tspan: [],
          use: [],
          view: [],
          object: [],
          canvas: baseAttrs
        };

        return this._extendObjectOfArrays([editorWhiteList, htmlTagWhiteList, this.graphicsWhiteList]);
      },
      //_extendObjectOfArrays[arcgisWhiteList, whiteList || {}]
      _extendObjectOfArrays: function (arry) {
        var sumList = {};
        array.forEach(arry, function (inputList) {
          var items = Object.keys(inputList)
          array.forEach(items, function (item) {
            if (Array.isArray(inputList[item]) && Array.isArray(sumList[item])) {
              sumList[item] = sumList[item].concat(inputList[item]);
            } else {
              sumList[item] = inputList[item];
            }
          }, this);
        }, this);

        return sumList;
      },
      _isInWhiteList: function (tar, whiteList) {
        var items = Object.keys(whiteList);
        var isIn = false;
        array.forEach(items, function (item) {
          if (tar === item) {
            isIn = true;
            return;
          }
        }, this);

        return isIn;
      }
    });


    clazz.getInstance = function () {
      if (null === singleton) {
        singleton = new clazz();
      }
      return singleton;
    };
    return clazz;
  });