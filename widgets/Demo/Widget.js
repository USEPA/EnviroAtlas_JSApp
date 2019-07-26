define(['dojo/_base/declare',
  'jimu/BaseWidget',
  'jimu/PanelManager',
  'dijit/TooltipDialog',
  'dijit/form/Button',
  'dijit/popup',
  'dijit/layout/AccordionContainer',
  'dijit/layout/ContentPane',
  'dojo/on',
  'dojo/dom'],
function(declare, BaseWidget, PanelManager, TooltipDialog, Button, popup, AccordionContainer, ContentPane, on, dom) {
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
      selfDemo = this;
      this.inherited(arguments);
      activeContainer = null;
      this.fetchData();      

      //Tour setup
      helpTour = this.config.tour; //tour info from config.json file
      numberStops = helpTour.length; //number of stops for tour
      stop = 0;//Start tour at stop 0
      tourDialog = null; //container for dialog

      nodeToHelp = helpTour[stop].node;
      helpContent = helpTour[stop].content + "<div><button type='button' onclick='selfDemo._nextStop()'>Next</button></div>";

      tourDialog = new TooltipDialog({
        id: 'tourDialog',
        style: "width: 350px;",
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
       var overlayElement = document.getElementById("overlay");
       if (overlayElement!=null){
            var overlay1 = dojo.create('div', {
              "class": "overlay",
              "id": "overlay"
            }, dojo.byId('main-page'));
       }
        

       var overlay2Element = document.getElementById("overlay");
       if (overlay2Element!=null){
            var overlay2 = dojo.create('div', {
              "class": "overlay2",
              "id": "overlay2"
            }, dojo.byId('main-page'));
       }

        //Close the tour main widget
        PanelManager.getInstance().closePanel(this.id + "_panel");
        console.log(window.PanelId.toUpperCase());

        numberStops = helpTour.length;
        for (i=0; i<numberStops; i++) {
            var widgetName = helpTour[i].widgetName;
            if (widgetName!=null){
                if (window.PanelId.toUpperCase().indexOf(widgetName.toUpperCase()) >= 0) {
                    stop = i;
                }               
            }            
        }  
              
        //stop = 0;
        this._nextStop(stop);
       
    },

    _nextStop: function(stop){
        
        
        if(tourDialog){
          popup.close(tourDialog);
        }

        //change z-index to selected element
        for (i=0; i<numberStops; i++) {
            $('#'+helpTour[i].highlight).css('z-index', '');
          }
        if (helpTour[stop].highlight) {
          $('#'+helpTour[stop].highlight).css('z-index', '998');
        } 

        if (stop == 0) {
          //Open to simple search widget
          $('#widgets_SimpleSearchFilter_Widget_37').click();
          $('#widgets_SimpleSearchFilter_Widget_37_min').click();
          
          

          nodeToHelp = helpTour[stop].node;
          helpContent = "<div> \
                          <a class='exit_button' onclick='selfDemo._endTour()'>&#10006</a> \
                        </div>"+
                        helpTour[stop].content.join("") +
                        "<div> \
                          <button type='button' onclick='selfDemo._nextStop("+ stop+1 +")'>Next &raquo;</button> \
                        </div> \
                        <div class='counter'>" + (stop+1).toString() +"/"+ numberStops.toString()+"</div>";
          tourDialog.set("content", helpContent);

          
        } else if (stop < numberStops -1) {



          nodeToHelp = helpTour[stop].node;
          helpContent = "<div> \
                        <a class='exit_button' onclick='selfDemo._endTour()'>&#10006</a> \
                      </div>"+
                      helpTour[stop].content.join("") +
                      "<div> \
                        <button type='button' onclick='selfDemo._nextStop("+ (stop-1).toString() +")'>&laquo Previous</button> \
                        &nbsp \
                        <button type='button' onclick='selfDemo._nextStop("+ (stop+1).toString() +")'>Next &raquo;</button> \
                      </div> \
                      <div class='counter'>" + (stop+1).toString() + "/" + numberStops.toString() + "</div>";

          //Change tooltipdialog content
          tourDialog.set("content", helpContent);

          } else {
            nodeToHelp = helpTour[stop].node;
            helpContent = "<div> \
                        <a class='exit_button' onclick='selfDemo._endTour()'>&#10006</a> \
                      </div>"+
                      helpTour[stop].content.join("") +
                      "<div> \
                        <button type='button' onclick='selfDemo._nextStop("+ (stop-1).toString() +")'>&laquo Previous</button> \
                        &nbsp \
                        <button type='button' onclick='selfDemo._endTour()'>End</button> \
                      </div> \
                      <div class='counter'>" + (stop+1).toString() + "/" + numberStops.toString() + "</div>";


            //Change tooltipdialog content
            tourDialog.set("content", helpContent);   
        }

         popup.open({
                popup: tourDialog,
                around: dom.byId(nodeToHelp),
                orient: helpTour[stop].orient,
                padding: {x:100, y:100}
                });

    },

    
    _endTour: function(){
        popup.close(tourDialog);
        dojo.destroy("overlay");
        dojo.destroy("overlay2");
        
        for (i=0; i<numberStops; i++) {
            $('#'+helpTour[i].highlight).css('z-index', '');
          }
        stop = 0;
       console.log("End the Guided Tour");
    },

    onOpen: function(){
        this.fetchData();
        /*if(activeContainer){
            aContainer.selectChild( activeContainer );
        }*/
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