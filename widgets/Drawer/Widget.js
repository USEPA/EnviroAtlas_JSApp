define(['dojo/_base/declare', 'jimu/BaseWidget', 'jimu/WidgetManager',
      'jimu/PanelManager', 'dojo/on', 'dojo/dom'],
function(declare, BaseWidget, WidgetManager, PanelManager, on, dom) {
  //To create a widget, you need to derive from BaseWidget.
  return declare([BaseWidget], {
    // DemoWidget code goes here

    //please note that this property is be set by the framework when widget is loaded.
    //templateString: template,

    baseClass: 'jimu-widget-drawer',

    postCreate: function() {
      this.inherited(arguments);
      console.log('postCreate');
    },

    startup: function() {
      var self = this;
      this.inherited(arguments);

      //on click events
      var AddDataButton = dom.byId('widget_AddData');
      on(dom.byId(AddDataButton), "click", function(){
        var widgets = self.appConfig.getConfigElementsByName('AddData');
        var pm = PanelManager.getInstance();
        
        if(widgets[0].visible){
          pm.closePanel(widgets[0].id + "_panel");
        }
        pm.showPanel(widgets[0]);
        pm.closePanel(self.id + "_panel");
      });

      var AddFileButton = dom.byId('widget_AddFile');
      on(dom.byId(AddFileButton), "click", function(){
        var widgets = self.appConfig.getConfigElementsByName('AddShapefile');
        var pm = PanelManager.getInstance();
        //console.log(widgets[0]);
        if(widgets[0].visible){
          pm.closePanel(widgets[0].id + "_panel");
        }
        pm.showPanel(widgets[0]);
        pm.closePanel(self.id + "_panel");
      });

      var AddServiceButton = dom.byId('widget_AddService');
      on(dom.byId(AddServiceButton), "click", function(){
        var widgets = self.appConfig.getConfigElementsByName('AddService');
        var pm = PanelManager.getInstance();
        //console.log(widgets[0]);
        if(widgets[0].visible){
          pm.closePanel(widgets[0].id + "_panel");
        }
        pm.showPanel(widgets[0]);
        pm.closePanel(self.id + "_panel");
      });

      console.log('startup');
    },

    onOpen: function(){
      var self = this;
      
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