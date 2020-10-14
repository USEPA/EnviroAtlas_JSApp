define(['dojo/_base/declare', 'jimu/BaseWidget', 'jimu/PanelManager', 'dijit/TooltipDialog', 'dijit/form/Button', 'dijit/popup', 'dijit/layout/AccordionContainer', 'dijit/layout/ContentPane', 'dojo/_base/lang',
    'widgets/Demo/help/help_Welcome',
    'widgets/Demo/help/help_Elevation1',
    'widgets/Demo/help/help_Elevation2',
    'widgets/Demo/help/help_FeaturedCollections1',
    'widgets/Demo/help/help_FeaturedCollections2',
    'widgets/Demo/help/help_Demographic1',
    'widgets/Demo/help/help_Demographic2',
    'widgets/Demo/help/help_EnviroAtlasDataSearch1',
    'widgets/Demo/help/help_EnviroAtlasDataSearch2',
    'widgets/Demo/help/help_TimesSeries1',
    'widgets/Demo/help/help_TimesSeries2',
    'widgets/Demo/help/help_AddData1',
    'widgets/Demo/help/help_AddData2',
    'widgets/Demo/help/help_SelectCommunity1',
    'widgets/Demo/help/help_SelectCommunity2',
    'widgets/Demo/help/help_DrawerMapping1',
    'widgets/Demo/help/help_DrawerMapping2',
    'widgets/Demo/help/help_ECAT1',
    'widgets/Demo/help/help_ECAT2',
    'widgets/Demo/help/help_HucNavigation1',
    'widgets/Demo/help/help_HucNavigation2',
    'widgets/Demo/help/help_Raindrop1',
    'widgets/Demo/help/help_Raindrop2',
	'widgets/Demo/help/help_AttributeTable1',
    'widgets/Demo/help/help_AttributeTable2',
    'widgets/Demo/help/help_SelectByTopic1',
    'widgets/Demo/help/help_SelectByTopic2',
    'widgets/Demo/help/help_DrawMeasure1',
    'widgets/Demo/help/help_DrawMeasure2',
    'widgets/Demo/help/help_EnhancedBookmarks1',
    'widgets/Demo/help/help_EnhancedBookmarks2',
    'widgets/Demo/help/help_DynamicSymbology1',
    'widgets/Demo/help/help_DynamicSymbology2',
    'widgets/Demo/help/help_Print1',
    'widgets/Demo/help/help_Print2',
    'widgets/Demo/help/help_LayerList1',
    'widgets/Demo/help/help_LayerList2',
    'widgets/Demo/help/help_EndPage',   
 'dojo/on', 'dojo/dom', 'dojo/topic'], function(declare, BaseWidget, PanelManager, TooltipDialog, Button, popup, AccordionContainer, ContentPane, lang, help_Welcome, help_Elevation1, help_Elevation2, help_FeaturedCollections1, help_FeaturedCollections2, help_Demographic1, help_Demographic2, help_EnviroAtlasDataSearch1, help_EnviroAtlasDataSearch2, help_TimesSeries1, help_TimesSeries2, help_AddData1, help_AddData2,
    help_SelectCommunity1, help_SelectCommunity2, help_DrawerMapping1, help_DrawerMapping2, help_ECAT1, help_ECAT2, help_HucNavigation1, help_HucNavigation2, help_Raindrop1, help_Raindrop2, help_AttributeTable1, help_AttributeTable2, help_SelectByTopic1, help_SelectByTopic2, help_DrawMeasure1, help_DrawMeasure2, help_EnhancedBookmarks1, help_EnhancedBookmarks2, help_DynamicSymbology1, help_DynamicSymbology2, help_Print1, help_Print2, help_LayerList1, help_LayerList2, help_EndPage, on, dom, topic) {
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
                "id" : 'tourDialog',
                "class" : "tourDialog",
                "content" : helpContent
            });

            console.log('Help/Tour startup');
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
        
        _displayMoreInformation : function() {

    		elemHelpContents2 = document.getElementsByClassName("helpContent2");
            elemHelpContent2 = elemHelpContents2.item(0);
        	if (window.displayMoreInfor=="true"){    		
                if (elemHelpContent2 != null)
                {
                    elemHelpContent2.style.display = '';
                    window.displayMoreInfor = "false";
                }          
        	} else {
                if (elemHelpContent2 != null)
                {
                    elemHelpContent2.style.display = 'None';
                    window.displayMoreInfor = "true";
                }             		
        	}
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
                newlink.setAttribute('class', 'exit_buttonOnScreenWidget');
                newlink.setAttribute('onclick', 'selfDemo._endTour()');
                newlink.innerHTML = '&#10006';
                newlink.setAttribute('title', 'close');
                newDiv.appendChild(newlink);
                helpContent.domNode.insertBefore(newDiv, helpContent.domNode.firstChild);

                //insert clickNext button
                newDiv = document.createElement("div");
                newlink = document.createElement('button');
                newlink.setAttribute('onclick', "selfDemo._nextStop(" + (stop + 1).toString() + ")");
                newlink.innerHTML = 'Next &raquo;';
                newlink.setAttribute('title', 'Next');
                newDiv.appendChild(newlink);

                //insert page number
                newlink = document.createElement("div");
                newlink.setAttribute('class', 'counter');
                newlink.innerHTML = (stop + 1).toString() + "/" + numberStops.toString();
                newlink.setAttribute('title', (stop + 1).toString() + "/" + numberStops.toString());
                newDiv.appendChild(newlink);
                helpContent.domNode.appendChild(newDiv);

                tourDialog.set("content", helpContent);
                //end of new code

            } else if (stop < numberStops - 1) {
                var bSidebarWidget = false;
                nodeToHelp = window.helpTour[stop].node;

                //helperClass = window.formatters[window.helpTour[stop].helpFile];
                //helpContent = new helperClass();
                helperClass1 = window.formatters[window.helpTour[stop].helpFile+"1"];
                helperClass2 = window.formatters[window.helpTour[stop].helpFile+"2"];
                helpContent = new helperClass1();
                helpContent2 = new helperClass2();
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
                newlink.setAttribute('class', 'exit_buttonOnScreenWidget');
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
                newlink.setAttribute('title', 'Previous');
                newDiv.appendChild(newlink);

                //insert space
                newDiv.appendChild(document.createTextNode('\u00A0'));

                //insert clickNext button
                newlink = document.createElement('button');
                newlink.setAttribute('onclick', "selfDemo._nextStop(" + (stop + 1).toString() + ")");
                newlink.innerHTML = 'Next &raquo;';
                newlink.setAttribute('title', 'Next');
                newDiv.appendChild(newlink);
                
                //insert page number
                newlink = document.createElement("div");
                newlink.setAttribute('class', 'counter');
                newlink.innerHTML = (stop + 1).toString() + "/" + numberStops.toString();
                newlink.setAttribute('title', (stop + 1).toString() + "/" + numberStops.toString());            
                newDiv.appendChild(newlink);    

		    	//insert More infomation button
                newlink = document.createElement('button');
                newlink.setAttribute('onclick', "selfDemo._displayMoreInformation(" + ")");
                newlink.innerHTML = 'More information';
                newlink.setAttribute('title', 'More information');
                newlink.setAttribute('class', 'topicHeader');
                newlink.setAttribute('style', 'width:100%;background-color: #9aadbb; margin-top:20px');
                newDiv.appendChild(newlink);
                helpContent.domNode.appendChild(newDiv);                
                		
                helpContent.domNode.appendChild(helpContent2.domNode);

                tourDialog.set("content", helpContent);


            } else {
                nodeToHelp = window.helpTour[stop].node;
                var bSidebarWidget = false;

                helperClass = window.formatters[window.helpTour[stop].helpFile];
                helpContent = new helperClass();
                var newDiv = document.createElement("div");
                var newlink = document.createElement('a');
                newlink.setAttribute('class', 'exit_buttonOnScreenWidget');
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
                newlink.setAttribute('title', 'Previous');
                newDiv.appendChild(newlink);

                //insert space
                newDiv.appendChild(document.createTextNode('\u00A0'));

                //insert End button
                newlink = document.createElement('button');
                newlink.setAttribute('onclick', 'selfDemo._endTour()');
                newlink.innerHTML = 'End';
                newlink.setAttribute('title', 'End');
                newDiv.appendChild(newlink);

                //insert page number
                newlink = document.createElement("div");
                newlink.setAttribute('class', 'counter');
                newlink.innerHTML = (stop + 1).toString() + "/" + numberStops.toString();
                newlink.setAttribute('title', (stop + 1).toString() + "/" + numberStops.toString());
                newDiv.appendChild(newlink);
                helpContent.domNode.appendChild(newDiv);




                tourDialog.set("content", helpContent);
            }
            
            var dialogHeightTotal = 820; 
            if (bSidebarWidget==true) {
                //setTimeout(lang.hitch(this, function() {
                    popup.open({
                        popup : tourDialog,
                        around : dom.byId(nodeToHelp),
                        orient : helpTour[stop].orient,
                        overflow:'hidden',
                        maxHeight: dialogHeightTotal,
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
                    overflow:'hidden',
                    padding : {
                        x : 100,
                        y : 100
                    }
                });               
                
            }
                
            elemHelpContents1 = document.getElementsByClassName("helpContent1");
            elemHelpContent1 = elemHelpContents1.item(0);
            if (elemHelpContent1 != null)
            {
                Content1Height = elemHelpContent1.clientHeight;                   
                elemHelpContents2 = document.getElementsByClassName("helpContent2");
                elemHelpContent2 = elemHelpContents2.item(0);
                
                if (elemHelpContent2 != null)
                {
                    elemHelpContent2Height = dialogHeightTotal-Content1Height-100;//originally 50
                    elemHelpContent2.style.height = elemHelpContent2Height.toString()+"px";
                }                    
            }
            
        	

            
    		elemHelpContents2 = document.getElementsByClassName("helpContent2");
            elemHelpContent2 = elemHelpContents2.item(0);

            if (elemHelpContent2 != null)
            {
                elemHelpContent2.style.display = 'None';
                window.displayMoreInfor = "true";
            }             		
                  

            
            popupContentsForScroll = document.getElementsByClassName("dijitTooltipDialogPopup");
            popupContentForScroll = popupContentsForScroll.item(0);
            popupContentForScroll.style.overflow='hidden';
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
