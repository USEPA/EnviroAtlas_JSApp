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
    activeContainer: null,

    postCreate: function() {
      this.inherited(arguments);
      console.log('postCreate');
    },

    startup: function() {
      self = this;
      this.inherited(arguments);
        activeContainer = null;
        this.fetchData();

      //this.mapIdNode.innerHTML = 'map id:' + this.map.id;

      //Add Help content
      aContainer = new AccordionContainer({style:"height: 300px"}, this.helptopics);
      aContainer.addChild(new ContentPane({
        title: "Simple Search Filter",
        content: "Simple Search Filter Help stuff"
      }));
      aContainer.addChild(new ContentPane({
        id: "Addfile",
        title:"Upload Data Widget",
        content:"Put lots of Help Content here!"
      }));
      aContainer.addChild(new ContentPane({
        id: "eBasemapGallery",
        title:"Basemap Gallery",
        content:"Help Documentation for Basemap Widget"
      }));
      aContainer.startup();

      if(activeContainer){
        aContainer.selectChild( activeContainer );
      }

      //Tour setup
      helpTour = this.config.tour; //tour info from config.json file
      numberStops = helpTour.length; //number of stops for tour
      stop = 0;//Start tour at stop 0
      tourDialog = null; //container for dialog

      nodeToHelp = helpTour[stop].node;
      helpContent = helpTour[stop].content + "<div><button type='button' onclick='self._nextStop()'>Next</button></div>";

      tourDialog = new TooltipDialog({
        id: 'tourDialog',
        style: "width: 300px;",
        content: helpContent,
      });

      console.log('startup');
    },

    onReceiveData: function(name, widgetId, data, historyData) {
        console.log("onRecieveData", name);
        //dom.byId('title').innerHTML = data.message;
        activeContainer = name;

    },

    _startTour: function(){
        stop = 0;

        nodeToHelp = helpTour[stop].node;
        helpContent = helpTour[stop].content + "<div><button type='button' onclick='self._nextStop()'>Next</button></div>";
        tourDialog.set("content", helpContent);

        popup.open({
            popup: tourDialog,
            around: dom.byId(nodeToHelp)
        });
    },

    _nextStop: function(){
        stop = stop + 1;

        if(tourDialog){
          popup.close(tourDialog);
        }
        if(stop < numberStops - 1 ){
          nodeToHelp = helpTour[stop].node;
          helpContent = helpTour[stop].content + "<div><button type='button' onclick='self._previousStop()'>Previous</button><button type='button' onclick='self._nextStop()'>Next</button></div>";

          //Change tooltipdialog content
          tourDialog.set("content", helpContent);

          popup.open({
            popup: tourDialog,
            around: dom.byId(nodeToHelp)
          });

        }else if(stop == numberStops - 1) {
            nodeToHelp = helpTour[stop].node;
            helpContent = helpTour[stop].content + "<div><button type='button' onclick='self._previousStop()'>Previous</button><button type='button' onclick='self._nextStop()'>End</button></div>";
            //Change tooltipdialog content
            tourDialog.set("content", helpContent);

            popup.open({
                popup: tourDialog,
                around: dom.byId(nodeToHelp)
            });
        }else {
          stop = 0;
          console.log("stop", stop);
        }

    },

    _previousStop: function(){
      stop = stop - 1;
      console.log("Stop value: ", stop);
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
      }else if(stop == 0){
          nodeToHelp = helpTour[stop].node;
          helpContent = helpTour[stop].content + "<div><button type='button' onclick='self._nextStop()'>Next</button></div>";
          //Change tooltipdialog content
          tourDialog.set("content", helpContent);
          popup.open({
              popup: tourDialog,
              around: dom.byId(nodeToHelp)
          });
      }
    },

    onOpen: function(){
        this.fetchData();
        if(activeContainer){
            aContainer.selectChild( activeContainer );
        }
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