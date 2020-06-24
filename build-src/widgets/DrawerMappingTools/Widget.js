define(['dojo/_base/declare', 'jimu/BaseWidget', 'jimu/WidgetManager',
      'jimu/PanelManager', 'dojo/on', 'dojo/dom', 'dojo/dom-construct'],
function(declare, BaseWidget, WidgetManager, PanelManager, on, dom, domConstruct) {
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

      //test creating from config
      var widgetsArray = this.config.includeWidgets;
      var topLocation = 0;

      //loop through widgets to add to drawer
      widgetsArray.forEach(function(w){
        //get widget label
        var widgets = self.appConfig.getConfigElementsByName(w);
        var widgetLabel = widgets[0].label;
        //Add buttons into widget
        domConstruct.place('<div style="left: 0px; top: ' + topLocation + 'px; right: auto; bottom: auto; width: 100%; height: 40px; padding: 0px; z-index: auto;line-height: 40px" class="jimu-widget-onscreen-icon" id="widget_' + w + '"><img style="float:left" src="widgets/' + w + '/images/icon.png"><span class="droplabel" >' + widgetLabel + '</span></div>', dom.byId("drawerMappingNode"));
        //create click event
        self._setWidgetOpenHandler(w);
        //move next button down 40px
        topLocation = topLocation + 40;
      });
      console.log('startup');
    },

    _setWidgetOpenHandler: function(widgetName){
      var self = this;
      var AddFileButton = dom.byId('widget_' + widgetName);
      on(dom.byId(AddFileButton), "click", function(){
        var widgets = self.appConfig.getConfigElementsByName(widgetName);
        var pm = PanelManager.getInstance();
            if (widgets[0].inPanel) {
                pm.showPanel(widgets[0]);
            } else {
                var offPanelIconId = dojo.attr(dojo.query("[data-widget-name^='" + widgetName + "']")[0],"widgetid");
                dijit.byId(offPanelIconId).onClick();
            }
	        panelID = "widgets_DrawerMapping_34_panel";
	        pm.closePanel(panelID);
	        pm.openPanel(panelID);
	        pm.closePanel(panelID);        
      });
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