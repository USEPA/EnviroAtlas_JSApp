define(['dojo/_base/declare', 'jimu/BaseWidget', 'jimu/WidgetManager',
      'jimu/PanelManager', 'dojo/on', 'dojo/dom'],
function(declare, BaseWidget, WidgetManager, PanelManager, on, dom) {
  //To create a widget, you need to derive from BaseWidget.
  return declare([BaseWidget], {
    // DemoWidget code goes here

    //please note that this property is be set by the framework when widget is loaded.
    //templateString: template,

    baseClass: 'jimu-widget-demo',

    postCreate: function() {
      this.inherited(arguments);
      console.log('postCreate');
    },

    startup: function() {
      this.inherited(arguments);
      this.mapIdNode.innerHTML = 'map id:' + this.map.id;
      console.log('startup');
    },

    onOpen: function(){
      var self = this;
      var widgetButton = dom.byId('dijit__WidgetBase_David');
      on(dom.byId(widgetButton), "click", function(){

        //console.log(self);
        var widgetManage = WidgetManager.getInstance();
        var bMapWidget = {
          position : {
            left : 5,
            top : 5,
            width : 400,
            height : 410,
            relativeTo : "map"
          },
          placeholderIndex : 1,
          id : "_25",
          name : "BasemapGallery",
          label : "Basemap Gallery",
          version : "1.3",
          uri : "widgets/eBasemapGallery/Widget",
          config : "configs/eBasemapGallery/config_Enhanced Basemap Gallery.json"
        };
        var bWid = widgetManage.loadWidget(bMapWidget).then(function (bWid){
          //widgetManage.openWidget(bWid);
          console.log(bWid);
          
          //var pm = PanelManager.getInstance();
          //pm.showPanel(bWid);

          console.log("load Widget");
        });
        //var bMap = widgetManage.getWidgetsByName('BasemapGallery');
        //console.log(bWid);
        //widgetManage.openWidget(bMap);

        //var widgets = self.appConfig.getConfigElementsByName('BasemapGallery');
        //
       //var pm = PanelManager.getInstance();
        // console.log(widgets[0]);
        // if(widgets[0].visible){
        //   pm.closePanel(widgets[0].id + "_panel");
        // }
        //pm.showPanel(bWid);

      });
      console.log('onOpen');
    },

    onClose: function(){
      console.log('onClose');
    },

    onMinimize: function(){
      console.log('onMinimize');
    },

    onMaximize: function(){
      console.log('onMaximize');
    },

    onSignIn: function(credential){
      /* jshint unused:false*/
      console.log('onSignIn');
    },

    onSignOut: function(){
      console.log('onSignOut');
    }
  });
});