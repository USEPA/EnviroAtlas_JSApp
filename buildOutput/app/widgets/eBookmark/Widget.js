//>>built
require({cache:{"widgets/eBookmark/BookmarkListView":function(){define("dijit/_WidgetBase dojo/_base/declare dojo/_base/lang dojo/_base/array dojo/_base/html dojo/dom-construct dojo/on dojo/query jimu/dijit/CheckBox dijit/_TemplatedMixin dojo/text!./BookmarkListView.html dojo/dom-attr dojo/dom-class dojo/dom-style esri/geometry/Extent dojo/Evented".split(" "),function(t,w,q,r,k,e,m,n,d,x,y,u,f,p,a,c){return w([t,x,c],{templateString:y,_currentSelectedBookmarkRowNode:null,_currentIndex:1,nls:null,
openArray:null,postMixInProperties:function(){this.inherited(arguments)},postCreate:function(){r.forEach(this.mybookmarkarray,function(b){this.drawListNode(b,0,this.bookmarksListTable,this.mybookmarkarray)},this)},drawListNode:function(b,a,h,c){var g;b.items?(g=this.addBookmarkNode(b,a,h,c),r.forEach(b.items,q.hitch(this,function(b,a,c){this.drawListNode(c,b+1,g.subNode,a)},a,b))):g=this.addBookmarkNode(b,a,h,c)},addBookmarkNode:function(b,a,c,v){var g=e.create("tr",{id:"bookmark_"+this._currentIndex,
"class":"jimu-widget-row bookmark-row "},c),h,l,d,f,k,n;u.set(g,"level",a);u.set(g,"name",b.name);h=e.create("td",{"class":"col col1"},g);for(l=0;l<a;l++)e.create("div",{"class":"begin-blank-div jimu-float-leading",innerHTML:""},h);b.items&&(k=e.create("div",{"class":"expand-div jimu-float-leading"},h),f=isRTL?this.eBookmarkWidget.folderUrl+"images/v_left.png":this.eBookmarkWidget.folderUrl+"images/v_right.png",b.expanded&&(f=this.eBookmarkWidget.folderUrl+"images/v.png"),f=e.create("img",{"class":"expand-image",
src:f,alt:"l"},k));l=e.create("div",{"class":"div-icon jimu-float-leading"},h);d=e.create("img",{src:this.eBookmarkWidget.folderUrl+(b.items?b.isInWebmap?"images/i_folder_web.png":"images/i_folder.png":b.isInWebmap?"images/i_bookmark_web.png":"images/i_bookmark.png"),alt:"l"},l);e.place(d,l);p.set(h,"width",12*a+35+"px");a=e.create("td",{"class":"col col2"},g);e.create("div",{innerHTML:b.name,"class":"div-content jimu-float-leading"},a);this._currentIndex++;h=e.create("td",{"class":"col col3"},g);
l=e.create("div",{"class":"actions-div"},h);b.items||(n=e.create("img",{"class":"bookmark-loading-img",src:this.eBookmarkWidget.folderUrl+"images/loading.gif"},l),p.set(n,"display","none"));h=b.useradded?e.create("img",{"class":"bookmark-delete-img",src:this.eBookmarkWidget.folderUrl+"images/i_remove_info.png",title:this.nls.labelDelete},l):null;l=b.useradded?e.create("img",{"class":"bookmark-edit-img",src:this.eBookmarkWidget.folderUrl+"images/edit_default.png",title:this.nls.labelEdit},l):null;
d=null;b.items&&(c=e.create("tr",{"class":""},c),c=e.create("td",{"class":"",colspan:"3"},c),d=e.create("table",{"class":"bookmark-sub-node"},c),b.expanded&&p.set(d,"display","table"));this.own(m(a,"click",q.hitch(this,this._onRowTrClick,b,f,g,n,h,d,v)));h&&this.own(m(h,"click",q.hitch(this,this._onRowDeleteClick,b,g,v)));l&&this.own(m(l,"click",q.hitch(this,this._onRowEditClick,b,g,v)));k&&this.own(m(k,"click",q.hitch(this,this._onRowExpandClick,b,f,g,n,h,d,v)));this.own(m(g,"mouseover",q.hitch(this,
this._onLayerNodeMouseover,g)));this.own(m(g,"mouseout",q.hitch(this,this._onLayerNodeMouseout,g)));return{currentNode:g,subNode:d}},clearSelected:function(){this._currentSelectedBookmarkRowNode&&f.remove(this._currentSelectedBookmarkRowNode,"jimu-widget-row-selected")},_fold:function(b,a,c){"none"===p.get(c,"display")?(p.set(c,"display","table"),u.set(a,"src",this.eBookmarkWidget.folderUrl+"images/v.png"),b=!1):(p.set(c,"display","none"),u.set(a,"src",isRTL?this.eBookmarkWidget.folderUrl+"images/v_left.png":
this.eBookmarkWidget.folderUrl+"images/v_right.png"),b=!0);return b},_onLayerNodeMouseover:function(b){f.add(b,"bookmark-row-mouseover")},_onLayerNodeMouseout:function(b){f.remove(b,"bookmark-row-mouseover")},_onRowTrClick:function(b,a,c,d,e,f,l){d&&(p.set(d,"display","none"),e&&p.set(e,"display",""));this._changeSelectedBookmarkRow(c,d,e,b,l)},_onRowExpandClick:function(a,c,h,d,e,f,l){d&&(p.set(d,"display","none"),e&&p.set(e,"display",""));a.items&&(a.expanded=!this._fold(a,c,f));this._changeSelectedBookmarkRow(h,
d,e,a,l)},_onRowDeleteClick:function(a,c,d){this._currentSelectedBookmarkRowNode&&f.remove(this._currentSelectedBookmarkRowNode,"jimu-widget-row-selected");this.emit("onRowDeleteClick",a,c,d)},_onRowEditClick:function(a,c,d){this._currentSelectedBookmarkRowNode&&f.remove(this._currentSelectedBookmarkRowNode,"jimu-widget-row-selected");f.add(c,"jimu-widget-row-selected");this._currentSelectedBookmarkRowNode=c;this.emit("onRowEditClick",a,c,d)},_changeSelectedBookmarkRow:function(a,c,d,e,k){this._currentSelectedBookmarkRowNode&&
f.remove(this._currentSelectedBookmarkRowNode,"jimu-widget-row-selected");f.add(a,"jimu-widget-row-selected");this._currentSelectedBookmarkRowNode=a;this.emit("onRowClick",a,e,d,c,k)}})})},"widgets/eBookmark/_build-generate_module":function(){define(["dojo/text!./Widget.html","dojo/text!./css/style.css","dojo/i18n!./nls/strings","dojo/text!./config.json"],function(){})},"url:widgets/eBookmark/BookmarkListView.html":'\r\n\x3ctable class\x3d"bookmark-list-table"\x3e\r\n  \x3ctbody class\x3d"bookmarks-list-body" data-dojo-attach-point\x3d"bookmarksListTable"\x3e\x3c/tbody\x3e\r\n\x3c/table\x3e\r\n',
"url:widgets/eBookmark/Widget.html":'\x3cdiv\x3e\r\n  \x3cdiv data-dojo-attach-point\x3d"mainAddSection"\x3e\r\n    \x3cdiv class\x3d"jimu-r-row add-section"\x3e\r\n      \x3cinput class\x3d"jimu-input input-bookmark-name" data-dojo-attach-point\x3d"bookmarkName" type\x3d"text" placeholder\x3d"${nls.placeholderBookmarkName}" /\x3e\r\n      \x3cdiv class\x3d"btn-add" data-dojo-attach-point\x3d"btnAdd" data-dojo-attach-event\x3d"onclick:_onAddBtnClicked" title\x3d"${nls.labelBookmarkName}"\x3e\r\n        \x3cdiv class\x3d"jimu-center-img"\x3e\x3c/div\x3e\r\n      \x3c/div\x3e\r\n    \x3c/div\x3e\r\n    \x3cdiv class\x3d"jimu-state-error" data-dojo-attach-point\x3d"errorNode"\x3e\x26nbsp;\x3c/div\x3e\r\n    \x3ca style\x3d"float:right; margin-top:6px;visibility:hidden;" href\x3d"#" data-dojo-attach-point\x3d"btnClearSelection" title\x3d"${nls.clearToolTip}"\x3e${nls.clearSelected}\x3c/a\x3e\r\n  \x3c/div\x3e\r\n  \x3cdiv class\x3d"bookmarks-section" data-dojo-attach-point\x3d"bookmarksSection"\x3e\r\n    \x3cdiv class\x3d"bookmark-list-title"\x3e${nls.titlebookmarks}\x3c/div\x3e\r\n    \x3cdiv class\x3d"bookmark-list-body" data-dojo-attach-point\x3d"bookmarkListBody"\x3e\r\n    \x3c/div\x3e\r\n  \x3c/div\x3e\r\n\x3c/div\x3e\r\n',
"url:widgets/eBookmark/css/style.css":".enhanced-bookmark-widget{position: relative; height:100%; width:100%;}.enhanced-bookmark-widget .jimu-hr{margin-top: 15px;}.enhanced-bookmark-widget .bookmarks-section{margin-top: 0px; overflow: auto; clear: both;}.enhanced-bookmark-widget .bookmarks-section .bookmark-list{width: 100%; height: 100%;}.enhanced-bookmark-widget .bookmarks-section .bookmark-list-title{height: 16px; font-size: 14px; color: #86909c; margin-top: 4px;}.enhanced-bookmark-widget .bookmark-list-body {height: 265px; overflow: auto;}.enhanced-bookmark-widget .bookmark-list-table{width: 100%; border-spacing: 0px;}.enhanced-bookmark-widget .bookmark-list-body{border: 0px solid #999;}.enhanced-bookmark-widget .jimu-widget-row{}.enhanced-bookmark-widget .bookmark-row{background-color: #ffffff; height: 40px;}.enhanced-bookmark-widget .bookmark-row-mouseover{background-color: #e3ecf2;}.enhanced-bookmark-widget .jimu-widget-row-selected{background-color: #d9dde0;;}.enhanced-bookmark-widget .jimu-widget-row-active{background-color: #009cff;}.enhanced-bookmark-widget .jimu-widget-row-selected .col-bookmark-label{color: #333;}.enhanced-bookmark-widget .jimu-widget-row-active .col-bookmark-label{color: #fff;}.enhanced-bookmark-widget .col{border: 0px solid; border-bottom: 0px solid #ffffff;}.enhanced-bookmark-widget .col1{}.enhanced-bookmark-widget .col2{width: auto; word-break: break-word; cursor: pointer;}.enhanced-bookmark-widget .col3{width: 24px;}.enhanced-bookmark-widget .begin-blank-div{width: 12px; height: 2px;}.enhanced-bookmark-widget .expand-div{width: 13px; height: 13px; cursor: pointer; font-size: 2px;}.enhanced-bookmark-widget .expand-image{margin-top: 4px; font-size: 3px; padding-left: 3px;}.jimu-rtl .enhanced-bookmark-widget .expand-image{padding-left: 0; padding-right: 3px;}.enhanced-bookmark-widget .bookmark-list-imageExpand-down{-moz-transform: scale(1) rotate(270deg) translateX(0px) translateY(0px) skewX(0deg) skewY(0deg); -webkit-transform: scale(1) rotate(270deg) translateX(0px) translateY(0px) skewX(0deg) skewY(0deg); -o-transform: scale(1) rotate(270deg) translateX(0px) translateY(0px) skewX(0deg) skewY(0deg); -ms-transform: scale(1) rotate(270deg) translateX(0px) translateY(0px) skewX(0deg) skewY(0deg); transform: scale(1) rotate(270deg) translateX(0px) translateY(0px) skewX(0deg) skewY(0deg);}.enhanced-bookmark-widget .bookmark-list-imageExpand-down-div{background-color: #d9dde0;}.enhanced-bookmark-widget .icon-div{width: 33px; text-align: right; display: none;}.enhanced-bookmark-widget .icon-image{display: block; margin: 0 auto;}.enhanced-bookmark-widget .col-blank{width:17px;}.enhanced-bookmark-widget .col-select{width: 17px;}.enhanced-bookmark-widget .col-reserve-blank{width: 25px;}.enhanced-bookmark-widget .col-content{color: #686868; font-size: 12px;}.enhanced-bookmark-widget .div-content{position: relative; color: #686868; font-size: 12px; border: 0px solid;}.enhanced-bookmark-widget .bookmark-list-body .col-bookmark-label{color: #686868;}.enhanced-bookmark-widget .bookmark-sub-node{display: none; width:100%; border-spacing: 0px;}.enhanced-bookmark-widget .bookmark-loading-img{width: 24px; height: 24px; position: absolute; left: 0; top: 0; z-index: 2;}.enhanced-bookmark-widget .actions-div{position: relative; width: 24px; height: 24px; margin-right: 4px;}.enhanced-bookmark-widget .bookmark-delete-img{position: absolute; left: 4px; top: 4px; cursor: pointer;}.enhanced-bookmark-widget .bookmark-edit-img{position: absolute; left: 4px; top: 4px; cursor: pointer; display: none;}.enhanced-bookmark-widget .jimu-state-error{margin-top: 4px; width: 100%; display: none; line-height: 14px;}.enhanced-bookmark-widget .add-section{position: relative; height: 30px; overflow: visible;}.enhanced-bookmark-widget .input-bookmark-name{border-top-right-radius: 0; border-bottom-right-radius: 0; position: absolute; left: 0; top: 0; width: 99.2%;}.enhanced-bookmark-widget .btn-add{position: absolute; right: 0px; top: 0px; bottom: 0px; width: 30px; z-index: 2; border-top-right-radius: 3px; border-bottom-right-radius: 3px; background-color: #d9dde0; cursor: pointer;}.enhanced-bookmark-widget .btn-add:hover,.enhanced-bookmark-widget .btn-filter:hover{background-color: #b7b7b7;}.enhanced-bookmark-widget .btn-add .jimu-center-img{border-top: 1px solid rgba(255, 255, 255, 0.2); background-image: url(images/add.png);}.DartTheme .enhanced-bookmark-widget .bookmark-row{background-color: inherit; height: 40px;}.DartTheme .enhanced-bookmark-widget .bookmark-row-mouseover{background-color: #707070;}.DartTheme .enhanced-bookmark-widget .jimu-widget-row-selected{background-color: #777777;}.DartTheme .enhanced-bookmark-widget .jimu-widget-row-active{background-color: #777777;}",
"url:widgets/eBookmark/config.json":'{\r\n  "addbookmarks": true,\r\n  "bookmarks": [\r\n    {\r\n      "name": "Canada Sites",\r\n      "items": [\r\n        {\r\n          "name": "Victoria, BC, Canada",\r\n          "extent": {\r\n            "xmax": -13722700,\r\n            "xmin": -13740900,\r\n            "ymax": 6181400,\r\n            "ymin": 6174200,\r\n            "spatialReference": {\r\n              "wkid": 102100\r\n            }\r\n          }\r\n        },\r\n        {\r\n          "name": "Vancouver, BC, Canada",\r\n          "extent": {\r\n            "xmax": -13661500,\r\n            "xmin": -13734100,\r\n            "ymax": 6336500,\r\n            "ymin": 6307700,\r\n            "spatialReference": {\r\n              "wkid": 102100\r\n            }\r\n          }\r\n        }\r\n      ],\r\n      "expanded": true\r\n    },\r\n    {\r\n      "name": "US Sites",\r\n      "items": [\r\n        {\r\n          "name": "US Cities",\r\n          "items": [\r\n            {\r\n              "name": "Dallas, Texas",\r\n              "extent": {\r\n                "xmin": -10814036.483405419,\r\n                "ymin": 3835456.193535918,\r\n                "xmax": -10725369.53059458,\r\n                "ymax": 3896605.8161640824,\r\n                "spatialReference": {\r\n                  "wkid": 102100\r\n                }\r\n              }\r\n            },\r\n            {\r\n              "name": "San Diego, California",\r\n              "extent": {\r\n                "xmax": -13022840.0354,\r\n                "xmin": -13059529.809,\r\n                "ymax": 3866264.9695,\r\n                "ymin": 3848512.4696,\r\n                "spatialReference": {\r\n                  "wkid": 102100\r\n                }\r\n              }\r\n            }\r\n          ],\r\n          "expanded": true\r\n        },\r\n        {\r\n          "name": "Washington",\r\n          "extent": {\r\n            "xmin": -14141549.17787237,\r\n            "ymin": 5553595.086614755,\r\n            "xmax": -12722877.932899877,\r\n            "ymax": 6531989.048664751,\r\n            "spatialReference": {\r\n              "wkid": 102100\r\n            }\r\n          }\r\n        },\r\n        {\r\n          "name": "Michigan",\r\n          "extent": {\r\n            "xmin": -10050416.221927123,\r\n            "ymin": 4886070.932883748,\r\n            "xmax": -8631744.97695463,\r\n            "ymax": 5864464.894933744,\r\n            "spatialReference": {\r\n              "wkid": 102100\r\n            }\r\n          }\r\n        }\r\n      ],\r\n      "expanded": true\r\n    }\r\n  ]\r\n}\r\n',
"*now":function(t){t(['dojo/i18n!*preload*widgets/eBookmark/nls/Widget*["","ROOT"]'])}}});
define("dojo/_base/declare jimu/BaseWidget jimu/dijit/Message dojo/on dojo/_base/lang ./BookmarkListView libs/storejs/store dojo/_base/array dojo/_base/html dojo/dom-construct dojo/string dojo/query dojo/dom-style esri/geometry/Extent".split(" "),function(t,w,q,r,k,e,m,n,d,x,y,u,f,p){return t([w],{baseClass:"enhanced-bookmark-widget",name:"eBookmark",bookmarks:[],currentBookmark:null,currentBookmarkParent:null,bookmarkNameExists:!1,postCreate:function(){this.inherited(arguments);this.own(r(this.domNode,
"mousedown",k.hitch(this,function(a){a.stopPropagation();a.altKey&&(a=this.nls.widgetverstr+": "+this.manifest.version,a+="\n"+this.nls.wabversionmsg+": "+this.manifest.wabVersion,a+="\n"+this.manifest.description,new q({titleLabel:this.nls.widgetversion,message:a}))})))},startup:function(){this.inherited(arguments);this.config.addbookmarks||d.setStyle(this.mainAddSection,{display:"none"});this.own(r(this.bookmarkName,"keydown",k.hitch(this,function(a){a=void 0!==a.keyCode?a.keyCode:a.which;"block"===
d.getStyle(this.errorNode,"display")&&(d.setStyle(this.errorNode,{display:"none"}),this.errorNode.innerHTML="\x26nbsp;");13===a&&this._onAddBtnClicked()})));this.own(r(this.btnClearSelection,"click",k.hitch(this,this._onBookmarkListViewRowClear)))},onOpen:function(){var a=this._getLocalCache();this.bookmarks=0<a.length?a:k.clone(this.config.bookmarks);this.showBookmarks()},onClose:function(){this.bookmarks=[];this.currentBookmark=null},onMinimize:function(){this.resize()},onMaximize:function(){this.resize()},
showBookmarks:function(){this.bookmarks=n.filter(this.bookmarks,k.hitch(this,function(a){return!a.isInWebmap}));this._readBookmarksInWebmap();x.empty(this.bookmarkListBody);this.bookmarkListView=(new e({mybookmarkarray:this.bookmarks,eBookmarkWidget:this,config:this.config,map:this.map,nls:this.nls})).placeAt(this.bookmarkListBody);this.resize();this.own(this.bookmarkListView.on("onRowClick",k.hitch(this,this._onBookmarkListViewRowClick)));this.own(this.bookmarkListView.on("onRowDeleteClick",k.hitch(this,
this._onDeleteBtnClicked)))},_onBookmarkListViewRowClick:function(a,c,b,g,e){this.currentBookmark=c;this.currentBookmarkParent=e;d.setStyle(this.btnClearSelection,{visibility:"visible"});if(!c.items){f.set(g,"display","");b&&f.set(b,"display","none");a=p(c.extent);var h;this.own(h=r(this.map,"update-end",k.hitch(this,function(){g&&(f.set(g,"display","none"),b&&f.set(b,"display",""),h.remove())})));this.map.setExtent(a)}},_onBookmarkListViewRowClear:function(){this.bookmarkListView.clearSelected();
this.errorNode.innerHTML===this.nls.errorWebmapNode&&(d.setStyle(this.errorNode,{display:"none"}),this.errorNode.innerHTML="\x26nbsp;");this.currentBookmark=null;d.setStyle(this.btnClearSelection,{visibility:"hidden"})},_createBookmark:function(){var a={name:this.bookmarkName.value,extent:this.map.extent.toJson(),useradded:!0};this.currentBookmark?this.currentBookmark.items?this.currentBookmark.items.push(a):this.currentBookmarkParent.items.push(a):this.bookmarks.push(a);this._saveAllToLocalCache();
this.resize()},_searchBookmarksForExistingName:function(a,c,b){if(a.name===b)return this.bookmarkNameExists=!0;a.items&&n.some(a.items,k.hitch(this,function(a){this._searchBookmarksForExistingName(a,c,b)}))},_onAddBtnClicked:function(){this.bookmarkNameExists=!1;0===y.trim(this.bookmarkName.value).length?(d.setStyle(this.errorNode,{display:"block"}),this.errorNode.innerHTML=this.nls.errorNameNull):(n.some(this.bookmarks,k.hitch(this,function(a,c){this._searchBookmarksForExistingName(a,c,this.bookmarkName.value)})),
!0===this.bookmarkNameExists?(d.setStyle(this.errorNode,{display:"block"}),this.errorNode.innerHTML=this.nls.errorNameExist):this.currentBookmark&&this.currentBookmarkParent.isInWebmap?(d.setStyle(this.errorNode,{display:"block"}),this.errorNode.innerHTML=this.nls.errorWebmapNode):(this._createBookmark(),this._onBookmarkListViewRowClear(),d.setStyle(this.errorNode,{display:"none"}),this.errorNode.innerHTML="\x26nbsp;",this.bookmarkName.value="",this.showBookmarks()))},_onDeleteBtnClicked:function(a,
c,b){var d=b.hasOwnProperty("items")?b.items:this.bookmarks;n.some(d,function(c,b){if(c.name===a.name)return d.splice(b,1),!0},this);this._saveAllToLocalCache();this.resize();this.currentBookmark=null;this.showBookmarks();this._onBookmarkListViewRowClear()},_saveAllToLocalCache:function(){var a=[];n.forEach(m.get(this.name),function(a){m.remove(a)},this);n.forEach(this.bookmarks,function(c){if(!c.isInWebmap){var b=this.name+"."+c.name;a.push(b);m.set(b,c)}},this);m.set(this.name,a)},resize:function(){var a=
d.getMarginBox(this.domNode).h-21;this.config.addbookmarks&&(a=a-37-14-18);0>a&&(a=0);d.setStyle(this.bookmarkListBody,"height",a+"px")},_getLocalCache:function(){var a=[];if(!m.get(this.name))return a;n.forEach(m.get(this.name),function(c){c.startWith(this.name)&&a.push(m.get(c))},this);return a},_readBookmarksInWebmap:function(){if(this.map.itemInfo&&this.map.itemInfo.itemData&&this.map.itemInfo.itemData.bookmarks){var a=[];n.forEach(this.map.itemInfo.itemData.bookmarks,function(c){c.isInWebmap=
!0;c.name=c.name;for(var b=0,d=0;d<this.bookmarks.length;d++)this.bookmarks[d].name===c.name&&b++;b||a.push(c)},this);this.bookmarks.push({name:this.nls.webmapfoldername,items:a,expanded:!0,isInWebmap:!0})}}})});