define(['dojo/_base/declare',
  'jimu/BaseWidget',
  'dijit/TooltipDialog',
  'dijit/form/Button',
  'dijit/popup',
  'dijit/layout/AccordionContainer',
  'dijit/layout/ContentPane',
  'dojo/on',
  'dojo/dom'],
function(declare, BaseWidget, TooltipDialog, Button, popup, AccordionContainer, ContentPane, on, dom) {
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
      self = this;
      this.inherited(arguments);
      //this.mapIdNode.innerHTML = 'map id:' + this.map.id;

      //Add Help content
      var aContainer = new AccordionContainer({style:"height: 300px"}, this.helptopics);
      aContainer.addChild(new ContentPane({
        title: "Simple Search Filter",
        content: "Simple Search Filter Help stuff"
      }));
      aContainer.addChild(new ContentPane({
        title:"Basemap Gallery",
        content:"Basemap Gallery help stuff"
      }));
      aContainer.addChild(new ContentPane({
        title:"This too",
        content:"Hello im fine.. thnx"
      }));
      aContainer.startup();

      helpTour = this.config.tour; //tour info from config.json file
      numberStops = helpTour.length; //number of stops for tour
      stop = 0;//Start tour at stop 0
      tourDialog = null; //container for dialog

      nodeToHelp = helpTour[stop].node;
      helpContent = helpTour[stop].content + "<div><button type='button' onclick='self._nextStop()'>Next</button></div>";

      console.log('startup');
    },

    _nextStop: function(){
      if(stop < 1 && !tourDialog){
        tourDialog = new TooltipDialog({
          id: 'tourDialog',
          style: "width: 300px;",
          content: helpContent,
        });

        popup.open({
          popup: tourDialog,
          around: dom.byId(nodeToHelp)
        });

      }else{
        stop = stop + 1;
        if(tourDialog){
          popup.close(tourDialog);
        }
        if(stop < numberStops ){
          nodeToHelp = helpTour[stop].node;
          helpContent = helpTour[stop].content + "<div><button type='button' onclick='self._previousStop()'>Previous</button><button type='button' onclick='self._nextStop()'>Next</button></div>";

          //Change tooltipdialog content
          tourDialog.set("content", helpContent);

          popup.open({
            popup: tourDialog,
            around: dom.byId(nodeToHelp)
          });

          //stop = stop + 1;
        }else{
          stop = 0;
          console.log("stop", stop);
        }

      }
    },

    _previousStop: function(){
      stop = stop - 1;
      //close open dialog
      if(tourDialog){
        popup.close(tourDialog);
      }
      if(stop > 0 ){
        nodeToHelp = helpTour[stop].node;
        helpContent = helpTour[stop].content + "<div><button type='button' onclick='self._previousStop()'>Previous</button><button type='button' onclick='self._nextStop()'>Next</button></div>";
        //Change tooltipdialog content
        tourDialog.set("content", helpContent);
        popup.open({
          popup: tourDialog,
          around: dom.byId(nodeToHelp)
        });
      }
    },

    onOpen: function(){
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