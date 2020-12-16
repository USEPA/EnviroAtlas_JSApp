//>>built
define("dojo/_base/declare dijit/_WidgetsInTemplateMixin dojo/_base/lang dojo/_base/array dojo/_base/html dojo/on dojo/keys dojo/query jimu/BaseWidgetSetting jimu/dijit/Popup jimu/dijit/Message jimu/utils ./Edit ./EditFolder libs/storejs/store ../BookmarkListView jimu/dijit/CheckBox".split(" "),function(p,q,d,f,e,r,k,t,u,m,l,y,v,w,n,x){return p([u,q],{baseClass:"enhanced-bookmark-widget-bookmark-setting",bookmarks:[],edit:null,popup:null,editFolder:null,popup2:null,popupState:"",currentIndex:null,
currentBookmark:null,currentBookmarkParent:null,startup:function(){this.inherited(arguments);this.setConfig(this.config);this.btnAddFolderImg.src=this.folderUrl+"images/i_folder.png";this.btnAddBookmarkImg.src=this.folderUrl+"images/i_bookmark.png";this.own(r(this.btnClearSelection,"click",d.hitch(this,this._onBookmarkListViewRowClear)))},setConfig:function(a){setTimeout(function(){var a=t(".help-link");a[0].href="http://gis.calhouncounty.org/WAB/V2.3/widgets/eBookmark/help/eBookmark_Help.htm";e.setStyle(a[0],
"display","block")},600);this.config=a;this.addBookmarksCbx.setValue(this.config.addbookmarks);this.bookmarks=this.config.bookmarks;f.map(this.bookmarks,function(a){this._setBookmarkAttribValue(a,"useradded",!0,!1,!0)},this);if(this.map.itemInfo&&this.map.itemInfo.itemData&&this.map.itemInfo.itemData.bookmarks){var b=[];f.forEach(this.map.itemInfo.itemData.bookmarks,function(a){a.isInWebmap=!0;a.name=a.name;for(var c=0,g=0;g<this.bookmarks.length;g++)this.bookmarks[g].name===a.name&&c++;c||b.push(a)},
this);this.bookmarks.push({name:this.nls.webmapfoldername,items:b,expanded:!0,isInWebmap:!0})}this.currentBookmark=null;this.showBookmarks()},_onBookmarkListViewRowClear:function(){this.bookmarkListView.clearSelected();this.currentBookmark=null;e.removeClass(this.btnAddFolder,"disabled");e.removeClass(this.btnAddBookmark,"disabled");this.btnAddFolderImg.src=this.folderUrl+"images/i_folder.png";this.btnAddBookmarkImg.src=this.folderUrl+"images/i_bookmark.png";e.setStyle(this.btnClearSelection,{visibility:"hidden"})},
_setBookmarkAttribValue:function(a,b,c,h,g){c?a[b]=c:(h?delete a[b]:a[b]=!1,delete a.useradded);if(a.items&&g)for(var d=0;d<a.items.length;d++)this._setBookmarkAttribValue(a.items[d],b,c,h,g)},showBookmarks:function(){e.empty(this.bookmarkListBody);this.bookmarks=f.filter(this.bookmarks,d.hitch(this,function(a){return!a.isInWebmap}));this._readBookmarksInWebmap();this.bookmarkListView=(new x({mybookmarkarray:this.bookmarks,eBookmarkWidget:this,config:this.config,map:this.map,nls:this.nls})).placeAt(this.bookmarkListBody);
this.own(this.bookmarkListView.on("onRowDeleteClick",d.hitch(this,this._onDeleteBtnClicked)));this.own(this.bookmarkListView.on("onRowEditClick",d.hitch(this,this._onBookmarkItemEditClick)));this.own(this.bookmarkListView.on("onRowClick",d.hitch(this,this._onBookmarkRowClick)))},_onBookmarkRowClick:function(a,b,c,h,g){this.currentBookmark=b;this.currentBookmarkParent=g;e.setStyle(this.btnClearSelection,{visibility:"visible"});b.isInWebmap?(e.addClass(this.btnAddFolder,"disabled"),e.addClass(this.btnAddBookmark,
"disabled"),this.btnAddFolderImg.src=this.folderUrl+"images/i_folder_disabled.png",this.btnAddBookmarkImg.src=this.folderUrl+"images/i_bookmark_disabled.png"):(e.removeClass(this.btnAddFolder,"disabled"),e.removeClass(this.btnAddBookmark,"disabled"),this.btnAddFolderImg.src=this.folderUrl+"images/i_folder.png",this.btnAddBookmarkImg.src=this.folderUrl+"images/i_bookmark.png")},getConfig:function(a){f.map(this.bookmarks,function(a){this._setBookmarkAttribValue(a,"useradded",!1,!0,!0)},this);this.config.addbookmarks=
this.addBookmarksCbx.getValue();this.config.bookmarks=f.filter(this.bookmarks,d.hitch(this,function(a){return!a.isInWebmap}));if(a){a=this.name;for(var b in n.getAll())b.startWith(a)&&n.remove(b)}return this.config},_readBookmarksInWebmap:function(){if(this.map.itemInfo&&this.map.itemInfo.itemData&&this.map.itemInfo.itemData.bookmarks){var a=[];f.forEach(this.map.itemInfo.itemData.bookmarks,function(b){b.isInWebmap=!0;b.name=b.name;for(var c=0,h=0;h<this.bookmarks.length;h++)this.bookmarks[h].name===
b.name&&c++;c||a.push(b)},this);this.bookmarks.push({name:this.nls.webmapfoldername,items:a,expanded:!0,isInWebmap:!0})}},destroy:function(){this.inherited(arguments)},onAddBookmarkClick:function(){this.popupState="ADD";this._openEdit(this.nls.addBookmark,{name:"",extent:this.map.extent.toJson()})},_onEditClick:function(a,b){this.popupState="EDIT";this._openEdit(this.nls.edit,a,b)},_onEditFolderClick:function(a,b){this.popupState2="EDIT";this._openEditFolder(this.nls.editFolder,a,b)},_openEdit:function(a,
b){this.edit=new v({nls:this.nls,folderUrl:this.folderUrl,portalUrl:this.appConfig.map.portalUrl,itemId:this.appConfig.map.itemId});this.edit.setConfig(b||{});this.popup=new m({titleLabel:a,autoHeight:!0,content:this.edit,container:"main-page",width:640,buttons:[{label:this.nls.ok,key:k.ENTER,disable:!0,onClick:d.hitch(this,"_onEditOk")},{label:this.nls.cancel,key:k.ESCAPE}],onClose:d.hitch(this,"_onEditClose")});e.addClass(this.popup.domNode,"widget-setting-popup");this.edit.startup()},_openEditFolder:function(a,
b){this.editFolder=new w({nls:this.nls,folderUrl:this.folderUrl});this.editFolder.setConfig(b||{});this.popup2=new m({titleLabel:a,autoHeight:!0,content:this.editFolder,container:"main-page",width:440,buttons:[{label:this.nls.ok,key:k.ENTER,disable:!0,onClick:d.hitch(this,"_onEditFolderOk")},{label:this.nls.cancel,key:k.ESCAPE}],onClose:d.hitch(this,"_onEditFolderClose")});e.addClass(this.popup2.domNode,"widget-setting-popup");this.editFolder.startup()},_onEditOk:function(){var a=this.edit.getConfig(),
b=null;if(a.name&&a.extent){var c;"ADD"===this.popupState?(c=this.currentBookmark?this.currentBookmark.hasOwnProperty("items")?this.currentBookmark.items:this.currentBookmarkParent.items:this.bookmarks,a.useradded=!0,this.bookmarkNameExists=!1,f.some(this.bookmarks,d.hitch(this,function(b,c){this._searchBookmarksForExistingName(b,c,a.name)})),!1===this.bookmarkNameExists&&(c.push(a),this.showBookmarks(),b=!0)):"EDIT"===this.popupState&&(c=this.currentBookmarkParent.hasOwnProperty("items")?this.currentBookmarkParent.items:
this.bookmarks,f.some(c,function(b,d){if(b.name===this.currentBookmark.name)return c.splice(d,1,a),!0},this),this.showBookmarks(),b=!0);b?(this.popup.close(),this.popupState="",b=!1):new l({message:this.nls.errorNameExist})}else new l({message:this.nls.warning})},_onEditFolderOk:function(){var a=this.editFolder.getConfig(),b=null;if(a.name){var c;"ADD"===this.popupState2?(c=this.currentBookmark?this.currentBookmark.hasOwnProperty("items")?this.currentBookmark.items:this.currentBookmarkParent.items:
this.bookmarks,a.useradded=!0,this.bookmarkNameExists=!1,f.some(this.bookmarks,d.hitch(this,function(b,c){this._searchBookmarksForExistingName(b,c,a.name)})),!1===this.bookmarkNameExists&&(c.push(a),this.showBookmarks(),b=!0)):"EDIT"===this.popupState2&&(c=this.currentBookmarkParent.hasOwnProperty("items")?this.currentBookmarkParent.items:this.bookmarks,f.some(c,function(b,d){if(b.name===this.currentBookmark.name)return c.splice(d,1,a),!0},this),this.showBookmarks(),b=!0);b?(this.popup2.close(),this.popupState2=
"",b=!1):new l({message:this.nls.errorNameExist})}else new l({message:this.nls.warning})},_onEditClose:function(){this.popup=this.edit=null},_onEditFolderClose:function(){this.popup2=this.editFolder=null},_onBookmarkItemEditClick:function(a,b,c){this.currentBookmark=a;this.currentBookmarkParent=c;e.setStyle(this.btnClearSelection,{visibility:"visible"});a.items?this._onEditFolderClick(a,c):this._onEditClick(a,c)},_onDeleteBtnClicked:function(a,b,c){var d=c.hasOwnProperty("items")?c.items:this.bookmarks;
f.some(d,function(b,c){if(b.name===a.name)return d.splice(c,1),!0},this);this.currentBookmark=null;this.showBookmarks()},_onBtnAddFolderClicked:function(){this.popupState2="ADD";this._openEditFolder(this.nls.addFolder,{name:"",items:[],expanded:!0,useradded:!0})},_searchBookmarksForExistingName:function(a,b,c){if(a.name===c)return this.bookmarkNameExists=!0;a.items&&f.some(a.items,d.hitch(this,function(a){this._searchBookmarksForExistingName(a,b,c)}))}})});