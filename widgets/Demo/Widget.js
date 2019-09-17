define(['dojo/_base/declare', 'jimu/BaseWidget', 'jimu/PanelManager', 'dijit/TooltipDialog', 'dijit/form/Button', 'dijit/popup', 'dijit/layout/AccordionContainer', 'dijit/layout/ContentPane', 'dojo/_base/lang',
    'widgets/Demo/help/help_Welcome',
    'widgets/Demo/help/help_Elevation',
    'widgets/Demo/help/help_FeaturedCollections',
    'widgets/Demo/help/help_Demographic',
    'widgets/Demo/help/help_EnviroAtlasDataSearch',
    'widgets/Demo/help/help_TimesSeries',
    'widgets/Demo/help/help_AddData',
    'widgets/Demo/help/help_SelectCommunity',
    'widgets/Demo/help/help_DrawerMapping',
    'widgets/Demo/help/help_ECAT',
    'widgets/Demo/help/help_HucNavigation',
    'widgets/Demo/help/help_Raindrop',
    'widgets/Demo/help/help_EndPage',   
 'dojo/on', 'dojo/dom'], function(declare, BaseWidget, PanelManager, TooltipDialog, Button, popup, AccordionContainer, ContentPane, lang, help_Welcome, help_Elevation, help_FeaturedCollections, help_Demographic, help_EnviroAtlasDataSearch, help_TimesSeries, help_AddData,
    help_SelectCommunity, help_DrawerMapping, help_ECAT, help_HucNavigation, help_Raindrop, help_EndPage, on, dom) {
    //To create a widget, you need to derive from BaseWidget.
    return declare([BaseWidget], {
        // DemoWidget code goes here

        //please note that this property is be set by the framework when widget is loaded.
        //templateString: template,

        baseClass : 'jimu-widget-demo',
        activeContainer : null,

        postCreate : function() {
            this.inherited(arguments);
            console.log('postCreate');
        },

        startup : function() {
            selfDemo = this;
            this.inherited(arguments);
            activeContainer = null;
            this.fetchData();

            //Tour setup
            helpTour = this.config.tour;
            //tour info from config.json file
            numberStops = helpTour.length;
            //number of stops for tour
            stop = 0;
            //Start tour at stop 0
            tourDialog = null;
            //container for dialog

            nodeToHelp = helpTour[stop].node;
            helpContent = helpTour[stop].content + "<div><button type='button' onclick='selfDemo._nextStop()'>Next</button></div>";

            tourDialog = new TooltipDialog({
                id : 'tourDialog',
                style : "width: 350px;",
                content : helpContent,
            });

            console.log('startup');
        },

        onReceiveData : function(name, widgetId, data, historyData) {
            console.log("onRecieveData", name);
            //dom.byId('title').innerHTML = data.message;
            activeContainer = name;

        },

        _startTour : function() {

            var overlay1 = dojo.create('div', {
                "class" : "overlay",
                "id" : "overlay"
            }, dojo.byId('main-page'));

            var overlay2 = dojo.create('div', {
                "class" : "overlay2",
                "id" : "overlay2"
            }, dojo.byId('main-page'));

            //Close the tour main widget
            PanelManager.getInstance().closePanel(this.id + "_panel");

            stop = 0;
            this._nextStop(stop);

        },

        _nextStop : function(stop) {

            if (tourDialog) {
                popup.close(tourDialog);
            }

            //change z-index to selected element
            for ( i = 0; i < numberStops; i++) {
                $('#' + helpTour[i].highlight).css('z-index', '');
            }
            if (helpTour[stop].highlight) {
                $('#' + helpTour[stop].highlight).css('z-index', '998');
            }

            if (stop == 0) {
                
                var bSidebarWidget = false;
                //Open to simple search widget
                $('#widgets_SimpleSearchFilter_Widget_37').click();
                $('#widgets_SimpleSearchFilter_Widget_37_min').click();

                //start new code
                nodeToHelp = window.helpTour[0].node;

                helperClass = window.formatters[window.helpTour[0].helpFile];
                helpContent = new helperClass();
                var newDiv = document.createElement("div");
                var newlink = document.createElement('a');
                newlink.setAttribute('class', 'exit_button');
                newlink.setAttribute('onclick', 'selfDemo._endTour()');
                newlink.innerHTML = '&#10006';
                newlink.setAttribute('title', 'close');
                newDiv.appendChild(newlink);
                helpContent.domNode.insertBefore(newDiv, helpContent.domNode.firstChild);

                //insert clickNext button
                newDiv = document.createElement("div");
                newlink = document.createElement('button');
                //newlink.setAttribute('onclick', 'selfDemo._nextStop("+ stop+1 +")');
                newlink.setAttribute('onclick', "selfDemo._nextStop(" + (stop + 1).toString() + ")");
                newlink.innerHTML = 'Next &raquo;';
                newlink.setAttribute('title', 'Next &raquo;');
                newDiv.appendChild(newlink);
                helpContent.domNode.appendChild(newDiv);

                //insert page number
                newlink = document.createElement("div");
                newlink.setAttribute('class', 'counter');
                newlink.innerHTML = (stop + 1).toString() + "/" + numberStops.toString();
                newlink.setAttribute('title', (stop + 1).toString() + "/" + numberStops.toString());
                helpContent.domNode.appendChild(newlink);

                tourDialog.set("content", helpContent);
                //end of new code

            } else if (stop < numberStops - 1) {
                var bSidebarWidget = false;
                nodeToHelp = window.helpTour[stop].node;

                helperClass = window.formatters[window.helpTour[stop].helpFile];
                helpContent = new helperClass();

                switch(window.helpTour[stop].helpFile) {
                    case "help_FeaturedCollections":
                        $('#widgets_AddWebMapData').click();
                        bSidebarWidget = true;
                        break;
                    case "help_Demographic":
                        $('#widgets_DemographicLayers').click();
                        bSidebarWidget = true;
                        break;
                    case "help_EnviroAtlasDataSearch":
                        $('#widgets_SimpleSearchFilter_Widget_37').click();
                        $('#widgets_SimpleSearchFilter_Widget_37_min').click();
                        bSidebarWidget = true;
                        break;
                    case "help_TimesSeries":
                        $('#widgets_TimeSeries_Widget').click();
                        bSidebarWidget = true;
                        break;
                    case "help_AddData":
                        $('#widgets_AddData_30').click();
                        bSidebarWidget = true;
                        break;
                    default:
                        $('#widgets_SimpleSearchFilter_Widget_37').click();
                        $('#widgets_SimpleSearchFilter_Widget_37_min').click();
                }

                

                var newDiv = document.createElement("div");
                var newlink = document.createElement('a');
                newlink.setAttribute('class', 'exit_button');
                newlink.setAttribute('onclick', 'selfDemo._endTour()');
                newlink.innerHTML = '&#10006';
                newlink.setAttribute('title', 'close');
                newDiv.appendChild(newlink);
                helpContent.domNode.insertBefore(newDiv, helpContent.domNode.firstChild);

                //insert clickPrevious button
                newDiv = document.createElement("div");
                newlink = document.createElement('button');
                newlink.setAttribute('onclick', "selfDemo._nextStop(" + (stop - 1).toString() + ")");
                newlink.innerHTML = '&laquo Previous';
                newlink.setAttribute('title', '&laquo Previous');
                newDiv.appendChild(newlink);

                //insert space
                newDiv.appendChild(document.createTextNode('\u00A0'));

                //insert clickNext button
                newlink = document.createElement('button');
                newlink.setAttribute('onclick', "selfDemo._nextStop(" + (stop + 1).toString() + ")");
                newlink.innerHTML = 'Next &raquo;';
                newlink.setAttribute('title', 'Next &raquo;');
                newDiv.appendChild(newlink);

                helpContent.domNode.appendChild(newDiv);

                //insert page number
                newlink = document.createElement("div");
                newlink.setAttribute('class', 'counter');
                newlink.innerHTML = (stop + 1).toString() + "/" + numberStops.toString();
                newlink.setAttribute('title', (stop + 1).toString() + "/" + numberStops.toString());
                helpContent.domNode.appendChild(newlink);

                tourDialog.set("content", helpContent);


            } else {
                nodeToHelp = window.helpTour[stop].node;
                var bSidebarWidget = false;

                helperClass = window.formatters[window.helpTour[stop].helpFile];
                helpContent = new helperClass();
                var newDiv = document.createElement("div");
                var newlink = document.createElement('a');
                newlink.setAttribute('class', 'exit_button');
                newlink.setAttribute('onclick', 'selfDemo._endTour()');
                newlink.innerHTML = '&#10006';
                newlink.setAttribute('title', 'close');
                newDiv.appendChild(newlink);
                helpContent.domNode.insertBefore(newDiv, helpContent.domNode.firstChild);

                //insert clickPrevious button
                newDiv = document.createElement("div");
                newlink = document.createElement('button');
                newlink.setAttribute('onclick', "selfDemo._nextStop(" + (stop - 1).toString() + ")");
                newlink.innerHTML = '&laquo Previous';
                newlink.setAttribute('title', '&laquo Previous');
                newDiv.appendChild(newlink);

                //insert space
                newDiv.appendChild(document.createTextNode('\u00A0'));

                //insert End button
                newlink = document.createElement('button');
                newlink.setAttribute('onclick', 'selfDemo._endTour()');
                newlink.innerHTML = 'End';
                newlink.setAttribute('title', 'End');
                newDiv.appendChild(newlink);

                helpContent.domNode.appendChild(newDiv);

                //insert page number
                newlink = document.createElement("div");
                newlink.setAttribute('class', 'counter');
                newlink.innerHTML = (stop + 1).toString() + "/" + numberStops.toString();
                newlink.setAttribute('title', (stop + 1).toString() + "/" + numberStops.toString());
                helpContent.domNode.appendChild(newlink);

                tourDialog.set("content", helpContent);
            }
            if (bSidebarWidget==true) {
                //setTimeout(lang.hitch(this, function() {
                    popup.open({
                        popup : tourDialog,
                        around : dom.byId(nodeToHelp),
                        orient : helpTour[stop].orient,
                        maxHeight: 600,
                        padding : {
                            x : 100,
                            y : 100
                        }
                    });                      
                //}), 100);
            }
            else {
             
                popup.open({
                    popup : tourDialog,
                    around : dom.byId(nodeToHelp),
                    orient : helpTour[stop].orient,
                    padding : {
                        x : 100,
                        y : 100
                    }
                });               
                
            }
                


        },

        _endTour : function() {
            popup.close(tourDialog);
            dojo.destroy("overlay");
            dojo.destroy("overlay2");

            for ( i = 0; i < numberStops; i++) {
                $('#' + helpTour[i].highlight).css('z-index', '');
            }
            stop = 0;
            console.log("End the Guided Tour");
        },

        onOpen : function() {
            this.fetchData();
            /*if(activeContainer){
             aContainer.selectChild( activeContainer );
             }*/
            console.log('onOpen');
        },

        onClose : function() {
            console.log('onClose');
        },

        onMinimize : function() {
            console.log('onMinimize');
        },

        onMaximize : function() {
            console.log('onMaximize');
        },

        onSignIn : function(credential) {
            /* jshint unused:false*/
            console.log('onSignIn');
        },

        onSignOut : function() {
            console.log('onSignOut');
        }
    });
});
