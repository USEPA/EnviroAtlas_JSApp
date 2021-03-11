///////////////////////////////////////////////////////////////////////////
//
// HUC12 Navigator
// based on Robert Scheitlin WAB eSearch Widget
//
// Note: there is tons on unused code that relates to the original eSearch Widget.
// Don't use this to fork related navigation widgets, it isn't a good example.
//
// Note: I can't understand how to use 'this' (the widget's 'app') inside of closures.
// It seems to revert to a reference to 'Window'. Thus there is some crazy bad code 
// and me using something called 'that' to try and keep it sane
//
/////////////////////////////////////////////////////////////////////////
/*global define, dojo, console, window, setTimeout, jimuConfig*/

define([
	'dojo/_base/declare',
	'dijit/_WidgetsInTemplateMixin',
	'jimu/BaseWidget',
	'jimu/dijit/TabContainer',
	'./List',
	'./Parameters',
	'./RelateChooser',
	'jimu/dijit/Message',
	'jimu/utils',
	'esri/urlUtils',
	'esri/tasks/query',
	'esri/tasks/QueryTask',
	'esri/tasks/RelationshipQuery',
	'esri/layers/CodedValueDomain',
	'esri/layers/Domain',
	'esri/layers/GraphicsLayer',
	'esri/layers/FeatureLayer',
	'esri/layers/FeatureType',
	'esri/layers/Field',
	'esri/layers/RangeDomain',
	'esri/tasks/BufferParameters',
	'esri/tasks/GeometryService',
	"esri/tasks/StatisticDefinition",
	'esri/config',
	'esri/graphic',
	'esri/graphicsUtils',
	'esri/geometry/Point',
	'esri/symbols/SimpleMarkerSymbol',
	'esri/symbols/PictureMarkerSymbol',
	'esri/geometry/Polyline',
	'esri/symbols/SimpleLineSymbol',
	'esri/geometry/Polygon',
	'esri/geometry/Multipoint',
	'esri/geometry/Extent',
	'esri/symbols/SimpleFillSymbol',
	'esri/symbols/jsonUtils',
	'esri/renderers/SimpleRenderer',
	'esri/renderers/jsonUtils',
	'esri/toolbars/draw',
	'esri/dijit/PopupTemplate',
	'esri/request',
	'esri/Color',
	'dojo/Deferred',
	'dijit/ProgressBar',
	'dojo/_base/lang',
	'dojo/on',
	
	'dojo/_base/html',
	'dojo/_base/array',
	
	"dojo/store/Memory",
	"dojo/data/ObjectStore",
	"dojox/grid/DataGrid",
	"dojo/dom", 
	
	'dojo/promise/all',
	'dojo/date',
	'dojo/date/locale',
	'dijit/form/Select',
	'dijit/form/TextBox',
	'dijit/form/NumberTextBox',
	'jimu/dijit/DrawBox',
	'jimu/dijit/RadioBtn',
	'jimu/dijit/LoadingShelter',
	'dojo/io-query',
	'dojo/query',
	'esri/SpatialReference',
	'jimu/WidgetManager',
	'jimu/PanelManager',
	'dojo/aspect',
	'esri/domUtils',
	'jimu/LayerInfos/LayerInfos',
	'jimu/CSVUtils',
	'jimu/BaseFeatureAction',
	'jimu/FeatureActionManager',
	'jimu/dijit/FeatureActionPopupMenu',
	'esri/tasks/FeatureSet',
	'dojo/dom-construct',
	'dojo/dom-class',
	'dojo/topic',
	'jimu/dijit/CheckBox',
	'dijit/form/DropDownButton',
	'dijit/Menu',
	'dijit/MenuItem',
    'dijit/ConfirmDialog'
	],
function (
	declare, 
	_WidgetsInTemplateMixin, 
	BaseWidget, 
	TabContainer, 
	List, 
	Parameters, 
	RelateChooser, 
	Message, jimuUtils, urlUtils, Query, QueryTask,
	RelationshipQuery, CodedValueDomain, Domain, 
	GraphicsLayer, FeatureLayer, FeatureType, 
	Field, RangeDomain, BufferParameters, GeometryService,StatisticDefinition,
	esriConfig, Graphic, graphicsUtils, Point, 
	SimpleMarkerSymbol, PictureMarkerSymbol, Polyline, SimpleLineSymbol, Polygon, Multipoint, 
	Extent,
	SimpleFillSymbol, symUtils, SimpleRenderer, jsonUtil, 
	Draw, PopupTemplate, esriRequest, Color, Deferred, ProgressBar, lang, 
	on, 
	html, 
	array,
	
	Memory,
	ObjectStore,
	DataGrid,
	dom,
	
	all, date, locale, Select, TextBox, NumberTextBox, DrawBox, RadioButton, LoadingShelter,
	ioquery, dojoQuery, SpatialReference, WidgetManager,
	PanelManager, aspect, domUtils, LayerInfos, CSVUtils, 
	BaseFeatureAction, FeatureActionManager, PopupMenu, 
	FeatureSet, 
	domConstruct, 
	domClass, 
	topic,
    ConfirmDialog
) { /*jshint unused: true*/

return declare([BaseWidget, _WidgetsInTemplateMixin], {
	name: 'eSearch',
	label:'Enhanced Search',
	baseClass: 'widget-esearch',
	resultLayers: [],
	operationalLayers: [],
	relateLayers:[],
	graphicLayerIndex: 0,
	AttributeLayerIndex: 0,
	spatialLayerIndex: 0,
	expressIndex: 0,
	progressBar: null,
	tabContainer: null,
	list: null,
	selTab: null,
	garr: [],
	pointSearchTolerance: 6,
	polygonsToDiscard: [],
	autozoomtoresults: true,
	layerautozoomtoresults: false,
	keepgraphicalsearchenabled: false,
	layerDomainsCache: {},
	layerUniqueCache: null,
	graphicsLayerBuffer: null,
	bufferWKID: null,
	initiator: null,
	currentLayerIndex: null,
	lastWhere: null,
	wManager: null,
	pManager: null,
	attTableOpenedbySearch: false,
	oidArray: null,
	disabledTabs: null,
	shapeTab: true,
	attribTab: true,
	spatTab: true,
	rsltsTab: true,
	mouseovergraphics: false,
	lastDrawCommonType: null,
	lastDrawTool: null,
	zoomAttempt: 0,
	tempResultLayer: null,
	currentSearchLayer: null,
	currentFeatures: null,
	eLocateGLFound: false,
	locateGraphicsLayer: null,
	mapLayerAddResultEvent: null,
	eLocateEnabled: true,
	gSelectTypeVal: 'new',
	aSelectTypeVal: 'new',
	serviceFailureNames: [],
	resultFormatString: "",
	operLayerInfos: null,
	sumResultArr: [],
	sumFields: [],
	currentCSVResults: null,
	popupMenu: null,
	autoactivatedtool: null,

	//jab - object variables to support HUC12 navigation
	map_click_point: null,
	
	results_json: {},
	
	g_gridHUC12: null,      // this is the list of HUC12s found during the users click
	g_gridNavResults:null,  // this is the table of results of the HUC12 navigation
	gridAttributeResults: null,
	huc8_mapserver: null, // defined in config.json

	huc8_id_field_name: null, //set in startup
	
	huc12_mapserver: null, // set based on user input
	
	huc12_array_slice_size: 0, // defined in config.json
	// HUC12 navigator
	navigator_url: null, // defined in config.json
	
	navHUC12Layer: null,
	navHUC8Layer: null,

    //new - maybe should be initialized elsewhere
    huc12_field_nm: "HUC_12",
	huc12_name_field_nm: "HU_12_Name",
	huc8_field_nm: "HUC_8",
	huc8_name_field_nm: "HU_8_Name",

    featHUC12: null,
	featHUC8: null,

    hu12_headwater_list: [],
    hu12_for_recompute:[],	
    huc12_feature_selected: null,
    


    //END new

	//jab-end
	
	postCreate: function () 
	{

		this.inherited(arguments);
		
		this.list = new List({}, this.listDiv);
		this.list.startup();
		this.own(on(this.list, "click", lang.hitch(this, this._selectResultItem)));
		html.addClass(this.list.domNode, "esearch-list");

		this.popupMenu = PopupMenu.getInstance();
		this.featureActionManager = FeatureActionManager.getInstance();
		if(this.config.graphicalsearchoptions.autoactivatedtool){
		  this.autoactivatedtool = this.config.graphicalsearchoptions.autoactivatedtool;
		}
		if (this.map.itemId) {
			LayerInfos.getInstance(this.map, this.map.itemInfo).then(lang.hitch(this, function(operLayerInfos)
            {
				this.operLayerInfos = operLayerInfos;
			}));
		}
		else {
			var itemInfo = this._obtainMapLayers();
			LayerInfos.getInstance(this.map, itemInfo).then(lang.hitch(this, function(operLayerInfos) {
				this.operLayerInfos = operLayerInfos;
			}));
		}
		
		html.empty(this.divResultMessage);
		
		this.resultLayers = [];
		this.layerUniqueCache = {};
		this._initResultFormatString();
		this._initDrawBox();
		this._initTabContainer();
		this._initLayerSelect();
		this._initProgressBar();
		this._initCheckForSupportedWidgets();
		this.garr = [];
		this.polygonsToDiscard = [];
		this._addBufferLayer();

		this.wManager = WidgetManager.getInstance();
		this.pManager = PanelManager.getInstance();

		aspect.before(this, "onClose", this.closeDDs);
		
		this.own(on(this.domNode, 'mousedown', lang.hitch(this, function (event) {
			event.stopPropagation();
			if (event.altKey) {
				var msgStr = this.nls.widgetverstr + ': ' + this.manifest.version;
				msgStr += '\n' + this.nls.wabversionmsg + ': ' + this.manifest.wabVersion;
				msgStr += '\n' + this.manifest.description;
				new Message({
					titleLabel: this.nls.widgetversion,
					message: msgStr
				});
			}
		})));

        this.own(on(this.divNavigationDirection, "change", lang.hitch(this, function() {
            var noptions = document.getElementsByName("navigation_direction");
            var direction = '';
            for (i=0; i < noptions.length; i++)
            {
                if (noptions[i].checked === true)
                {
                    direction = noptions[i].value;
                    break;
                }
            }

            var existingMessageText = this.divNavigationMessages.innerHTML;

            var messageText = 'Click the map to navigate '
                + direction.toLowerCase() + ' on the<br>Watershed Boundary Dataset Subwatersheds (HUC-12)';

            var messageText2 =	'Click on only one of the highlighted HUC-12 subwatersheds to navigate '
                + direction.toLowerCase() + '.';

            var messageToUse = messageText;
            if(existingMessageText.indexOf('highlighted') !== -1)
            {
                messageToUse = messageText2;
            }

            this.divNavigationMessages.innerHTML = messageToUse;

            //navigation_huc_code
            //dojo.query("#navigation_huc_code").focus();
            var huc_code_input = this.divNavigationHUCode;
            if (huc_code_input.value.length == 12){
                //TODO: use a dijit Dialog for this question rather than javascript built-in
    // create instance
    var dialog = new ConfirmDialog({
        title: "Session Expiration",
        content: "the test. Your session is about to expire. Do you want to continue?",
        style: "width: 300px"
    });

    // change button labels
    dialog.set("buttonOk","Yes");
    dialog.set("buttonCancel","No");

    // register events
    dialog.on('execute', function() { /*do something*/ });
    dialog.on('cancel', function() { /*do something*/ });

    // show
    // dialog.show();


        // myDialog.refresh();
        // myDialog.show();

                var r = confirm("Do you want to navigate " + direction.toLowerCase() + " from subwatershed " + huc_code_input.value + "'?");
                if (r == true){
                    //this.executeHUCSearch(huc_code_input.value);
                    if (this.huc12_feature_selected != null) {
                    	this.navigate_upstream(this.huc12_feature_selected);
                    }
                    
                    
                }
            }

        })));

		//set up Select Indicator Category and Select Specific Indicators stuff
        this.own(on(this.divCategorySelect, "change", lang.hitch(this, function() {
            var value = this.divCategorySelect.value;
            if (value === undefined || value == 'NONE')
            {
                var attribute_select = document.getElementById('divAttributeSelect');

                attribute_select.options.length = 0;
                var o = document.createElement("option");
                o.value = 'NONE';
                o.text = '--- Select ----';
                attribute_select.appendChild(o);
            }
            else
            {
                this.updateIndicator(value);
            }

        })));

        this.own(on(this.divAttributeSelect, "change", lang.hitch(this, function() {
            //var value = this.divCategorySelect.value;
            var huc_code_input = this.divNavigationHUCode;
            if (huc_code_input.value.length == 12) {
                // enable Recompute Aggregate
                var recompute_button = this.divRecomputeAggregate;
                recompute_button.disabled = false;
            }

        })));

        this.own(on(this.divRecomputeAggregate, "click", lang.hitch(this, this.recomputeAggregate)));

        var direction = 'upstream';
        var messageText = 'Click the map to navigate '
			+ direction.toLowerCase() + ' on the<br>Watershed Boundary Dataset Subwatersheds (HUC-12)';

        this.divNavigationMessages.innerHTML = messageText;
	},

      startup: function(){
        this.inherited(arguments);
        this.fetchData();
        this.list.parentWidget = this;
        //jab
        this.navigator_url = this.config.navigator_url;
        this.watersgeo_huc12_mapserver = this.config.watersgeo_huc12_mapserver;
        this.enviroatlas_huc12_mapserver = this.config.enviroatlas_huc12_mapserver;
        this.huc12_mapserver = '';
        
        this.watersgeo_huc8_mapserver = this.config.watersgeo_huc8_mapserver;
        this.enviroatlas_huc8_mapserver = this.config.enviroatlas_huc8_mapserver;
        
        //jab - leave it on WatersGEO until someone notices. It is faster than
        // EnviroAtlas since it is simplified
        this.huc8_mapserver = this.watersgeo_huc8_mapserver;
        if (this.huc8_mapserver == this.watersgeo_huc8_mapserver)
        {
        	this.huc8_id_field_name = 'HUC_8';
        }
        else
        {
        	this.huc8_id_field_name = 'HUC8';
        	this.huc8_id_field_name = 'HUC_8';//debugging failed query
        }

        this.huc12_array_slice_size = this.config.huc12_array_slice_size;
		this.initHUC12Grid();
		this.initNavigationGrid();
		this.initAttributeGrid();
		html.setStyle(this.clickAgainMessage, 'display', 'none');

		// position and size - can be set manually here
        // var panel = this.getPanel();
        // var pos = panel.position;
        // pos.height = 500;
        // pos.width = 400;
        // panel.setPosition(pos);
        // panel.panelManager.normalizePanel(panel);
          // or can be set using css.  in css add '_panel' to the id
          // "id": "widgets_HUC12Nav",
          // #widgets_HUC12Nav_panel { height: 500px; }
		//jab-end
      },

      _obtainMapLayers: function() {
        // summary:
        //    obtain basemap layers and operational layers if the map is not webmap.
        var basemapLayers = [],
          operLayers = [];
        // emulate a webmapItemInfo.
        var retObj = {
          itemData: {
            baseMap: {
              baseMapLayers: []
            },
            operationalLayers: []
          }
        };
        
        array.forEach(this.map.graphicsLayerIds, function(layerId) {
          var layer = this.map.getLayer(layerId);
          if (layer.isOperationalLayer) {
            operLayers.push({
              layerObject: layer,
              title: layer.label || layer.title || layer.name || layer.id || " ",
              id: layer.id || " "
            });
          }
        }, this);
        
        array.forEach(this.map.layerIds, function(layerId) {
          var layer = this.map.getLayer(layerId);
          if (layer.isOperationalLayer) {
            operLayers.push({
              layerObject: layer,
              title: layer.label || layer.title || layer.name || layer.id || " ",
              id: layer.id || " "
            });
          } else {
            basemapLayers.push({
              layerObject: layer,
              id: layer.id || " "
            });
          }
        }, this);

        retObj.itemData.baseMap.baseMapLayers = basemapLayers;
        retObj.itemData.operationalLayers = operLayers;
        return retObj;
      },

      _initCheckForSupportedWidgets: function () {
        if(this.eLocateEnabled){
          array.forEach(this.map.graphicsLayerIds, lang.hitch(this, function(glId){
            var layer = this.map.getLayer(glId);
            if(layer.name && layer.name.toLowerCase() === "elocate results"){
              this.locateGraphicsLayer = layer;

              on(this.locateGraphicsLayer, 'graphic-add', lang.hitch(this, this.checkeLocateNumGras));
              on(this.locateGraphicsLayer, 'graphic-remove', lang.hitch(this, this.checkeLocateNumGras));
              on(this.locateGraphicsLayer, 'graphic-clear',  lang.hitch(this, this.checkeLocateNumGras));
              this.eLocateGLFound = true;

              //Add the button
              var itemsDiv = dojoQuery('.draw-items', this.drawBox.domNode);
              var eLocateButton = html.create('div', {
                'style': 'display:none;',
                'class': 'draw-item',
                'data-gratype': 'ELOCATE',
                'title': this.nls.eLocateTip
              }, itemsDiv[0]);
              html.addClass(eLocateButton, 'elocate-icon');
              this.own(on(eLocateButton, 'click', lang.hitch(this, this._eLocateButtonOnClick)));

              if(this.locateGraphicsLayer.graphics.length > 0){
                this.checkeLocateNumGras();
              }
            }
          }));
          if(!this.eLocateGLFound){
            this.own(this.mapLayerAddResultEvent = this.map.on('layer-add-result', lang.hitch(this, this.checkForeLocateGL)));
          }
        }
      },

      _initResultFormatString: function () {
        this.list._wrapResults = this.config.resultFormat.wrap || false;
        var tBold = false, tItalic = false, tUnder = false, tColorHex = "#000000";
        var vBold = false, vItalic = false, vUnder = false, vColorHex = "#000000";
        this.resultFormatString = "";
        if(this.config.resultFormat){
          var attribName = '[attribname]';
          tBold = this.config.resultFormat.attTitlesymbol.bold;
          tItalic = this.config.resultFormat.attTitlesymbol.italic;
          tUnder = this.config.resultFormat.attTitlesymbol.underline;
          if(this.config.resultFormat.attTitlesymbol.color){
            tColorHex = new Color(this.config.resultFormat.attTitlesymbol.color).toHex();
          }
          if(tBold){
            attribName = "<strong>" + attribName + "</strong>";
          }
          if(tItalic){
            attribName = "<em>" + attribName + "</em>";
          }
          if(tUnder){
            attribName = "<u>" + attribName + "</u>";
          }
          if(tColorHex){
            attribName = "<font color='" + tColorHex + "'>" + attribName + "</font>";
          }
          var attribValue = '[attribvalue]';
          vBold = this.config.resultFormat.attValuesymbol.bold;
          vItalic = this.config.resultFormat.attValuesymbol.italic;
          vUnder = this.config.resultFormat.attValuesymbol.underline;
          if(this.config.resultFormat.attValuesymbol.color){
            vColorHex = new Color(this.config.resultFormat.attValuesymbol.color).toHex();
          }
          if(vBold){
            attribValue = "<strong>" + attribValue + "</strong>";
          }
          if(vItalic){
            attribValue = "<em>" + attribValue + "</em>";
          }
          if(vUnder){
            attribValue = "<u>" + attribValue + "</u>";
          }
          if(vColorHex){
            attribValue = "<font color='" + vColorHex + "'>" + attribValue + "</font>";
          }
          this.resultFormatString = attribName + ": " + attribValue + '<br>';
        }else{
          this.resultFormatString = '<font><em>[attribname]</em></font>: <font>[attribvalue]</font><br>';
        }
      },

      onReceiveData: function(name, widgetId, data) {
        if(data.message && data.message === "Deactivate_DrawTool"){
          this.drawBox.deactivate();
        }
      },

      _getFeatureSet: function(){
        var layer = this.currentSearchLayer;
        var featureSet = new FeatureSet();
        featureSet.fields = lang.clone(layer.fields);
        featureSet.features = [].concat(layer.graphics);
        featureSet.geometryType = layer.geometryType;
        featureSet.fieldAliases = {};
        array.forEach(featureSet.fields, lang.hitch(this, function(fieldInfo){
          var fieldName = fieldInfo.name;
          var fieldAlias = fieldInfo.alias || fieldName;
          featureSet.fieldAliases[fieldName] = fieldAlias;
        }));
        return featureSet;
      },
    _onConfirmationBtnMenuClicked: function(evt){
	        myDialog = new ConfirmDialog({
            title: "My ConfirmDialog",
            content: "Test content.",
            buttonCancel: "Label of cancel button",
            buttonOk: "Label of OK button",
            style: "width: 300px",
            onCancel: function(){
                //Called when user has pressed the Dialog's cancel button, to notify container.
            },
            onExecute: function(){
               //Called when user has pressed the dialog's OK button, to notify container.
            }
            });
	        myDialog.show();
    },

      _onBtnMenuClicked: function(evt){
        var position = html.position(evt.target || evt.srcElement);
        var featureSet = this._getFeatureSet();

        var layer = this.currentSearchLayer;
        if(!layer.fields){
          layer.fields = [];
        }
        if(!featureSet.geometryType){
          var geomType = "";
          switch(layer.graphics[0].geometry.type){
            case "point":
            case "multipoint":
              geomType = "esriGeometryPoint";
              break;
            case "polygon":
            case "extent":
              geomType = "esriGeometryPolygon";
              break;
            case "polyline":
              geomType = "esriGeometryPolyline";
              break;
          }
          featureSet.geometryType = geomType;
          featureSet.fields = [];
        }
        var layerConfig = this.config.layers[this.currentLayerIndex];
        var noStats = this.getNoStatFieldNames(layerConfig);
        this.featureActionManager.getSupportedActions(featureSet, layer).then(lang.hitch(this, function(actions){
          array.forEach(actions, lang.hitch(this, function(action){
            //console.info(action);
            if(action.name === "eShowStatistics"){
              if(noStats.length > 0){
                var gFlds = array.filter(featureSet.fields, lang.hitch(this, function(field){
                  return noStats.indexOf(field.name) === -1;
                }));
                featureSet.fields = gFlds;
              }
              action.data = featureSet;
            }else{
              action.data = featureSet;
            }
          }));

          if(layerConfig.relates && layerConfig.relates.relate && this.list.hasSelectedItem()){
            var showRelateAction = new BaseFeatureAction({
              name: "eShowRelate",
              iconClass: 'icon-show-related-record',
              label: this.nls._featureAction_eShowRelate,
              iconFormat: 'svg',
              map: this.map,
              onExecute: lang.hitch(this, function(){
                this._relateResultItem(0, this.list.getSelectedItem());
              })
            });
            showRelateAction.name = "eShowRelate";
            showRelateAction.data = featureSet;
            actions.push(showRelateAction);
          }

          if(!layerConfig.export2Geo){
            actions = array.filter(actions, lang.hitch(this, function(action){
              return action.name !== 'ExportToGeoJSON';
            }));
          }

          if(!layerConfig.export2FC){
            actions = array.filter(actions, lang.hitch(this, function(action){
              return action.name !== 'ExportToFeatureCollection';
            }));
          }

          actions = array.filter(actions, lang.hitch(this, function(action){
            return action.name !== 'CreateLayer' && action.name !== 'ShowStatistics' && action.name !== 'ExportToCSV';
          }));

          if(layerConfig.export2Csv){
            var exportCSVAction = new BaseFeatureAction({
              name: "eExportToCSV",
              iconClass: 'icon-export',
              label: this.nls._featureAction_eExportToCSV,
              iconFormat: 'svg',
              map: this.map,
              onExecute: lang.hitch(this, function(){
                CSVUtils.exportCSV(this.currentSearchLayer.name, this.currentCSVResults.data, this.currentCSVResults.columns);
              })
            });
            exportCSVAction.name = "eExportToCSV";
            exportCSVAction.data = featureSet;
            actions.push(exportCSVAction);
          }

          if(this.initiator && this.initiator === 'attribute' && this.config.exportsearchurlchecked){
            var exportUrlAction = new BaseFeatureAction({
              name: "exportSearchUrl",
              iconClass: 'icon-export',
              label: this.nls.exporturl,
              iconFormat: 'svg',
              map: this.map,
              onExecute: lang.hitch(this, this.exportURL)
            });
            exportUrlAction.name = "exportSearchUrl";
            exportUrlAction.data = featureSet;
            actions.push(exportUrlAction);
          }

          if(this.graphicsLayerBuffer && this.graphicsLayerBuffer.graphics.length > 0){
            var removeBufferAction = new BaseFeatureAction({
              name: "RemoveBufferResult",
              iconClass: 'icon-close',
              label: this.nls.clearBuffer,
              iconFormat: 'svg',
              map: this.map,
              onExecute: lang.hitch(this,  this.clearbuffer)
            });
            removeBufferAction.name = "RemoveBufferResult";
            removeBufferAction.data = featureSet;
            actions.push(removeBufferAction);
          }

          var removeAction = new BaseFeatureAction({
            name: "CleareSearchResult",
            iconClass: 'icon-close',
            label: this.nls.clearResults,
            iconFormat: 'svg',
            map: this.map,
            onExecute: lang.hitch(this, this.clear)
          });
          removeAction.name = "CleareSearchResult";
          removeAction.data = featureSet;
          actions.push(removeAction);

          if(this.relateLayers && this.relateLayers.length > 0){
            var removeAction2 = new BaseFeatureAction({
              name: "ClearRelateResult",
              iconClass: 'icon-close',
              label: this.nls.clearRelates,
              iconFormat: 'svg',
              map: this.map,
              onExecute: lang.hitch(this, this._clearRelateLayers)
            });
            removeAction2.name = "ClearRelateResult";
            removeAction2.data = featureSet;
            actions.push(removeAction2);
          }

          this.popupMenu.setActions(actions);
          this.popupMenu.show(position);
        }));
      },

      resetFeatureActions: function(featureSet, layer) {
        this.featureActionManager.getSupportedActions(featureSet, layer).then(lang.hitch(this, function(actions){
          array.forEach(actions, lang.hitch(this, function(action){
            action.data = featureSet;
          }));
          this.popupMenu.setActions(actions);
        }));
      },

      getNoStatFieldNames: function(layerConfig){
        var retval = [];
        array.forEach(layerConfig.fields.field, lang.hitch(this, function(fld){
          if(fld.excludestat){
            retval.push(fld.name);
          }
        }));
        return retval;
      },

      checkForeLocateGL: function (result) {
        if(result.layer.name && result.layer.name.toLowerCase() === "elocate results"){
          this.locateGraphicsLayer = result.layer;
          on(this.locateGraphicsLayer, 'graphic-add', lang.hitch(this, this.checkeLocateNumGras));
          on(this.locateGraphicsLayer, 'graphic-remove', lang.hitch(this, this.checkeLocateNumGras));
          on(this.locateGraphicsLayer, 'graphic-clear',  lang.hitch(this, this.checkeLocateNumGras));
          this.mapLayerAddResultEvent.remove();

          //Add the button
          var itemsDiv = dojoQuery('.draw-items', this.drawBox.domNode);
          var eLocateButton = html.create('div', {
            'style': 'display:none;',
            'class': 'draw-item',
            'data-gratype': 'ELOCATE',
            'title': this.nls.eLocateTip
          }, itemsDiv[0]);
          html.addClass(eLocateButton, 'elocate-icon');
          this.own(on(eLocateButton, 'click', lang.hitch(this, this._eLocateButtonOnClick)));
        }
      },

      checkeLocateNumGras: function (){
        if(this.locateGraphicsLayer){
          var eLocateButton = dojoQuery('.draw-item.elocate-icon', this.drawBox.domNode);
          if(this.locateGraphicsLayer.graphics.length > 0){
            //show the button
            html.setStyle(eLocateButton[0], 'display', 'block');
          }else{
            //hide the button
            html.setStyle(eLocateButton[0], 'display', 'none');
          }
        }
      },

      _eLocateButtonOnClick: function() {
        var graLayGras = this.locateGraphicsLayer.graphics;
        if (graLayGras.length > 1){
          this.processInputs(this.unionGeoms(graLayGras));
        }else if (graLayGras.length == 1){
          this.processInputs(graLayGras[0].geometry);
        }
      },

      processInputs: function (geom) {
        if (geom === Polygon && geom.isSelfIntersecting(geom)){
          esriConfig.defaults.geometryService.simplify([geom], lang.hitch(this, function (result) {
            if (this.cbxBufferGraphic.getValue()) {
              this._bufferGeometries([geom], new SpatialReference({
                wkid: this.bufferWKID
              }), [parseFloat(this.txtBufferValue.get('value'))], this.bufferUnits.get('value'), true);
            } else {
              this.search(result[0], this.graphicLayerIndex);
            }
          }));
        }
        else{
        	//jab - create extent around map point to control size of search area around point
        	// this is controlled by config setting "toleranceforpointgraphicalselection": 3,
          if (geom.type === "point" && this.cbxAddTolerance.getValue()) {
        	
        	geom = this.pointToExtent(geom, this.pointSearchTolerance);
        	  
        	//jab - Put a point on the place where the user clicked.
              showLoading();
        	this.map_click_point = geom.getCenter();
			
        	// put the users click point back on the map
			this.add_click_point_graphic(this.map_click_point);
          }
          //jab-end
          
          if (this.cbxBufferGraphic.getValue()) 
          {
            this._bufferGeometries([geom], new SpatialReference({
              wkid: this.bufferWKID
            }), [parseFloat(this.txtBufferValue.get('value'))], this.bufferUnits.get('value'), true);
          } 
          else 
          {
            this.search(geom, this.graphicLayerIndex);
          }
        }
      },

      _addBufferLayer: function () {
        if (this.config.bufferDefaults.addtolegend) {
          //new a feature layer
          var layerInfo = {
            "type" : "Feature Layer",
            "description" : "",
            "definitionExpression" : "",
            "name": "Search Buffer Results",
            "geometryType": "esriGeometryPolygon",
            "objectIdField": "ObjectID",
            "drawingInfo": {
              "renderer": {
                "type": "simple",
                "label": "Buffer",
                "description" : "Buffer",
                "symbol": this.config.bufferDefaults.simplefillsymbol
              }
            },
            "fields": [{
              "name": "ObjectID",
              "alias": "ObjectID",
              "type": "esriFieldTypeOID"
            }, {
              "name": "bufferdist",
              "alias": "Buffer Distance",
              "type": "esriFieldTypeString"
            }]
          };

          var featureCollection = {
            layerDefinition: layerInfo,
            featureSet: null
          };
          this.graphicsLayerBuffer = new FeatureLayer(featureCollection);
          this.graphicsLayerBuffer.name = "Search Buffer Results";
        } else {
          //use graphics layer
          this.graphicsLayerBuffer = new GraphicsLayer();
          this.graphicsLayerBuffer.name = "Search Buffer Results";
          this.map.addLayer(this.graphicsLayerBuffer);
        }
      },

      closeDDs: function () {
        this.selectLayerAttribute.closeDropDown();
        this.selectLayerGraphical.closeDropDown();
        
        //this.selectExpression.closeDropDown();
        //this.selectLayerSpatial.closeDropDown();
        
//        this.gSelectType.closeDropDown();
//        this.aSelectType.closeDropDown();


      },

      onDeactivate: function() {
        this.drawBox.deactivate();
      },

      onClose: function () {
      	
      	window.toggleOnHucNavigation = false;    	
      	
        this.drawBox.deactivate();
        this._hideInfoWindow();
        this.inherited(arguments);
        if (!this.config.bufferDefaults.addtolegend) {
          if (this.graphicsLayerBuffer) {
            this.graphicsLayerBuffer.hide();
            
          }
        }
        if (this.tempResultLayer) {
          this.tempResultLayer.hide();
        }
        
        //copy from destroy
        
        this._hideInfoWindow();
        this._resetDrawBox();
        this._removeAllResultLayers();
        this._clearRelateLayers();
        
        //this.map.graphics.clear();
        document.getElementById("butInitClickEventForPopup").click();
      },

      onOpen: function () {
      	window.toggleOnHucNavigation = true;
	    this.publishData({
			message : "mapClickForPopup"
		});  

        //if(this.autoactivatedtool){
        //  this.drawBox.activate(this.autoactivatedtool.toUpperCase());
        //}
		 
        if (!this.config.bufferDefaults.addtolegend) {
          if (this.graphicsLayerBuffer) {
            this.graphicsLayerBuffer.show();
          }
        }
        if (this.tempResultLayer) {
          this.tempResultLayer.show();
        }
      },

      _resetDrawBox: function () {
        this.drawBox.deactivate();
        this.drawBox.clear();
      },

      destroy: function () {
        this._hideInfoWindow();
        this._resetDrawBox();
        this._removeAllResultLayers();
        this._clearRelateLayers();
        this.inherited(arguments);
      },

      _removeAllResultLayers: function () {
        this._hideInfoWindow();
        this._removeTempResultLayer();
        this._removeAllOperatonalLayers();
      },

      _removeAllOperatonalLayers: function () {
        var layers = this.operationalLayers;
        while (layers.length > 0) {
          var layer = layers[0];
          if (layer) {
            this.map.removeLayer(layer);
          }
          layers[0] = null;
          layers.splice(0, 1);
        }
        this.operationalLayers = [];
      },

      _removeAllRelateLayers: function () {
        var layers = this.relateLayers;
        if(layers && layers.length > 0){
          while (layers.length > 0) {
            var layer = layers[0];
            if (layer) {
              this.map.removeLayer(layer);
            }
            layers[0] = null;
            layers.splice(0, 1);
          }
          this.relateLayers = [];
        }
      },

      _addOperationalLayer: function (resultLayer) {
        this.operationalLayers.push(resultLayer);
        this.map.addLayer(resultLayer);
      },

      _addRelateLayer: function (resultLayer) {
        if(this.relateLayers.indexOf(resultLayer) === -1){
          this.relateLayers.push(resultLayer);
          this.map.addLayer(resultLayer);
        }else{
          resultLayer.clear();
        }
      },

      _resetAndAddTempResultLayer: function (layerIndex) 
      {
        this._removeTempResultLayer();
      
        this.tempResultLayer = new GraphicsLayer();
        
        this.tempResultLayer.name = "Search Results jb"; //jab - not used
        
        var layerConfig = this.config.layers[layerIndex];
        
        var lyrDisablePopupsAndTrue = (layerConfig.hasOwnProperty("disablePopups") && layerConfig.disablePopups)?true:false;
        
        if(!this.config.disablePopups && !lyrDisablePopupsAndTrue)
        {
          this.tempResultLayer.infoTemplate = new PopupTemplate();
        }
        this.map.addLayer(this.tempResultLayer);
      },

      _removeTempResultLayer: function () 
      {
        if (this.tempResultLayer) 
        {
          this.map.removeLayer(this.tempResultLayer);
        }
        this.tempResultLayer = null;
      },

      onSpatialLayerChange: function (newValue) {
        this.spatialLayerIndex = newValue;
      },

	onGraphicalLayerChange: function (newValue) {
		this.graphicLayerIndex = newValue;
		//determine if this layer has any expressions
		if(this.config.layers[newValue].expressions.expression.length > 0){
			this.cbxAddTextQuery.setStatus(true);
		}
		else{
			this.cbxAddTextQuery.setStatus(false);
		}
		
		//determine if this layer has any sum field(s)
		this._getSumFields(newValue);
		if(this.sumFields.length > 0)
		{
			html.addClass(this.list.domNode, 'sum');
			html.setStyle(this.divSum, 'display', '');
		}
		else
		{
			html.removeClass(this.list.domNode, 'sum');
			html.setStyle(this.divSum, 'display', 'none');
		}
	},

      onAttributeLayerChange: function (newValue) {
        this.AttributeLayerIndex = newValue;
        this._initSelectedLayerExpressions();
        var valuesObj = lang.clone(this.config.layers[newValue].expressions.expression[0].values.value);
        html.empty(this.textsearchlabel);
        if(this.config.layers[newValue].expressions.expression[0].textsearchlabel !== ""){
          html.place(html.toDom(this.config.layers[newValue].expressions.expression[0].textsearchlabel), this.textsearchlabel);
          html.style(this.textsearchlabel, 'display', 'block');
        }else{
          html.style(this.textsearchlabel, 'display', 'none');
        }
        this.paramsDijit.clear();
        this.paramsDijit.build(valuesObj, this.resultLayers[newValue], this.config.layers[newValue].url,
                               this.config.layers[newValue].definitionexpression);
        this.paramsDijit.setFocusOnFirstParam();
        this.expressIndex = 0;
        //set the graphical layer to be the same
        this.graphicLayerIndex = newValue;
        this.selectLayerGraphical.set('value', newValue);
        //determine if this layer has any sum field(s)
        this._getSumFields(newValue);
        if(this.sumFields.length > 0){
          html.addClass(this.list.domNode, 'sum');
          html.setStyle(this.divSum, 'display', '');
        }else{
          html.removeClass(this.list.domNode, 'sum');
          html.setStyle(this.divSum, 'display', 'none');
        }
      },

      onAttributeLayerExpressionChange: function (newValue) {
        this.expressIndex = newValue;
        var valuesObj = lang.clone(this.config.layers[this.AttributeLayerIndex].expressions.expression[newValue].values.value);
        html.empty(this.textsearchlabel);
        if(this.config.layers[this.AttributeLayerIndex].expressions.expression[newValue].textsearchlabel !== ""){
          html.place(html.toDom(this.config.layers[this.AttributeLayerIndex].expressions.expression[newValue].textsearchlabel), this.textsearchlabel);
          html.style(this.textsearchlabel, 'display', 'block');
        }else{
          html.style(this.textsearchlabel, 'display', 'none');
        }
        this.paramsDijit.clear();
        this.paramsDijit.build(valuesObj, this.resultLayers[this.AttributeLayerIndex], this.config.layers[this.AttributeLayerIndex].url,
                               this.config.layers[this.AttributeLayerIndex].definitionexpression);
        this.paramsDijit.setFocusOnFirstParam();
      },


      _spatButtonOnClick: function (event) {
        event.stopPropagation();
        this._intersectResults(event.target.getAttribute('data-spatialtype'));
      },

      _intersectResults: function (dataSpatialType) {
        this.garr = [];
        var intersectGeom;
        if (this.graphicsLayerBuffer && this.graphicsLayerBuffer.graphics.length > 0 && this.currentLayerAdded && this.currentLayerAdded.graphics.length > 0) {
          var qMessage = new Message({
            type: 'question',
            titleLabel: this.nls.spatialchoicetitle,
            message: this.nls.spatialchoicemsg,
            buttons: [{
              label: this.nls.buffergraphics,
              onClick: lang.hitch(this, lang.hitch(this, function () {
                qMessage.close();
                var g = this.graphicsLayerBuffer.graphics[0];
                intersectGeom = g.geometry;
                this.search(intersectGeom, this.spatialLayerIndex, null, null, dataSpatialType);
              }))
            }, {
              label: this.nls.selectiongraphics,
              onClick: lang.hitch(this, lang.hitch(this, function () {
                qMessage.close();
                intersectGeom = this.unionGeoms(this.currentLayerAdded.graphics);
                this.search(intersectGeom, this.spatialLayerIndex, null, null, dataSpatialType);
              }))
            }]
          });
          return;
        }
        var gra;
        if (this.graphicsLayerBuffer && this.graphicsLayerBuffer.graphics.length > 0) {
          gra = this.graphicsLayerBuffer.graphics[0];
          intersectGeom = gra.geometry;
//          console.info("spatial layer index: " + this.spatialLayerIndex);
          this.search(intersectGeom, this.spatialLayerIndex, null, null, dataSpatialType);
        } else if (this.currentLayerAdded && this.currentLayerAdded.graphics.length > 0) {
          intersectGeom = this.unionGeoms(this.currentLayerAdded.graphics);
          if (intersectGeom === Polygon && (intersectGeom.isSelfIntersecting(intersectGeom) || intersectGeom.rings.length > 1)) {
            esriConfig.defaults.geometryService.simplify([intersectGeom], lang.hitch(this,
              function (result) {
//                console.info("spatial layer index: " + this.spatialLayerIndex);
                this.search(result[0], this.spatialLayerIndex, null, null, dataSpatialType);
              }));
          } else {
//            console.info("spatial layer index: " + this.spatialLayerIndex);
            this.search(intersectGeom, this.spatialLayerIndex, null, null, dataSpatialType);
          }
        } else {
          new Message({
            titleLabel: this.nls.spatialSearchErrorTitle,
            message: this.nls.intersectMessage
          });
        }
      },

      _getSpatialIconClass: function (spatRel) {
        var iClass;
        switch (spatRel) {
        case 'esriSpatialRelContains':
          iClass = 'contain-icon';
          break;
        case 'esriSpatialRelIntersects':
          iClass = 'intersect-icon';
          break;
        case 'esriSpatialRelEnvelopeIntersects':
          iClass = 'envintersects-icon';
          break;
        case 'esriSpatialRelCrosses':
          iClass = 'crosses-icon';
          break;
        case 'esriSpatialRelIndexIntersects':
          iClass = 'indexintersects-icon';
          break;
        case 'esriSpatialRelOverlaps':
          iClass = 'overlaps-icon';
          break;
        case 'esriSpatialRelTouches':
          iClass = 'touches-icon';
          break;
        case 'esriSpatialRelWithin':
          iClass = 'within-icon';
          break;
        default:
          iClass = 'contain-icon';
        }
        return iClass;
      },

      _initTabContainer: function () {
        if (this.config.hasOwnProperty('disabledtabs')) {
          this.disabledTabs = this.config.disabledtabs;
        } else {
          this.disabledTabs = [];
        }

        if(this.autoactivatedtool){
          this.drawBox.activate(this.autoactivatedtool.toUpperCase());
        }

        var tabs = [];

        tabs.push({
            title: this.nls.selectFeatures,
            content: this.tabNodeSelect
        });
        html.replaceClass(this.tabNodeSelect, 'search-tab-node', 'search-tab-node-hidden');

        tabs.push({
            title: "Aggregate Indicators",
            content: this.tabNodeAggregate
        });
        html.replaceClass(this.tabNodeAggregate, 'search-tab-node', 'search-tab-node-hidden');

        /*tabs.push({
            title: "Downloads",
            content: this.tabNodeDownloads
        });
        html.replaceClass(this.tabNodeDownloads, 'search-tab-node', 'search-tab-node-hidden');*/

        this.tabContainer = new TabContainer({
          tabs: tabs,
          selected: this.selTab
        }, this.tabSearch);

        this.tabContainer.startup();

        this.own(on(this.tabContainer, "tabChanged", lang.hitch(this, function (title) {
        	
        //populate the category dropdown list
            var that = this;

            var attribute_select = that.divCategorySelect;

            //TODO: do this in a dojo/dijit way, instead of straight javascript
            attribute_select.options.length = 0;
            var o = document.createElement("option");
            o.value = 'NONE';
            o.text = '--- Select ----';
            attribute_select.appendChild(o);

            for (var i = 0; i < window.nationalFeatureTopicList.length; i++) {
                var o = document.createElement("option");

                o.value = window.nationalFeatureTopicList[i];

                o.text = window.nationalFeatureTopicList[i];

                attribute_select.appendChild(o);
            }
		  //end of populating the category dropdown list     
		     	
          if (title !== this.nls.results) {
            this.selTab = title;
          }
          if(title === this.nls.selectFeatures) {
            if(this.autoactivatedtool){
              this.drawBox.activate(this.autoactivatedtool.toUpperCase());
            }
          }else{
            if (title === this.nls.selectByAttribute || title === this.nls.selectSpatial) {
              this.drawBox.deactivate();
            }else if(title === this.nls.results && !this.keepgraphicalsearchenabled) {
              this.drawBox.deactivate();
            }
          }
        })));
        jimuUtils.setVerticalCenter(this.tabContainer.domNode);
      },

      _getSumFields: function(index) {
        this.sumFields = [];
        array.map(this.config.layers[index].fields.field, lang.hitch(this,function(field){
          if(field.sumfield){
            this.sumFields.push({field: field.name, sumlabel: field.sumlabel});
          }
        }));
      },

      _initLayerSelect: function () {
        this.serviceFailureNames = [];
        if(!this.currentFeatures){
          this.currentFeatures = [];
        }
        var options = [];
        var spatialOptions = [];
        var attribOptions = [];
        var len = this.config.layers.length;
        for (var i = 0; i < len; i++) {
          var option = {
            value: i,
            label: this.config.layers[i].name
          };
          options.push(option);
          if (this.config.layers[i].spatialsearchlayer) {
            spatialOptions.push(option);
          }
          if(this.config.layers[i].expressions.expression.length > 0){
            attribOptions.push(option);
          }
        }
        //select the first layer in the lists
        if (options.length > 0) {
          options[0].selected = true;
        }
        if (spatialOptions.length > 0) {
          spatialOptions[0].selected = true;
        }
        if (attribOptions.length > 0) {
          attribOptions[0].selected = true;
        }else{
          // html.setStyle(this.addSqlTextDiv, 'display', 'none');
        }

        if (len > 0) {
          this.paramsDijit = new Parameters({
            nls: this.nls,
            layerUniqueCache: this.layerUniqueCache,
            disableuvcache: this.config.disableuvcache,
            selectFilterType: this.config.selectfilter
          });
          // this.paramsDijit.placeAt(this.parametersDiv);
          // this.paramsDijit.startup();
          // this.paramsDijit.on('enter-pressed', lang.hitch(this, function () {
          //   this.search(null, this.AttributeLayerIndex, this.expressIndex);
          // }));
          this.shelter.show();

          var defs = array.map(this.config.layers, lang.hitch(this, function (layerConfig) {
            return this._getLayerInfoWithRelationships(layerConfig.url);
          }));

          all(defs).then(lang.hitch(this, function (results) {
            this.shelter.hide();
            array.forEach(results, lang.hitch(this, function (result, j) {
              if(result.state === 'success'){
                var layerInfo = result.value;
                //console.info(layerInfo);
                var layerConfig = this.config.layers[j];

                if (layerInfo.objectIdField) {
                  layerConfig.objectIdField = layerInfo.objectIdField;
                } else {
                  var fields = layerInfo.fields;
                  var oidFieldInfos = array.filter(fields, lang.hitch(this, function (fieldInfo) {
                    return fieldInfo.type === 'esriFieldTypeOID';
                  }));
                  if (oidFieldInfos.length > 0) {
                    var oidFieldInfo = oidFieldInfos[0];
                    layerConfig.objectIdField = oidFieldInfo.name;
                  }
                }
                layerConfig.existObjectId = array.some(layerConfig.fields.field, lang.hitch(this, function (element) {
                  return element.name === layerConfig.objectIdField;
                }));
                layerConfig.typeIdField = layerInfo.typeIdField;
                //ImageServiceLayer doesn't have drawingInfo
                if (!layerInfo.drawingInfo) {
                  layerInfo.drawingInfo = {};
                }
                layerInfo.name = this.nls.search + ' ' + this.nls.results + ': ' + layerConfig.name;
                layerInfo._titleForLegend = layerInfo.name;
                layerInfo.minScale = 0;
                layerInfo.maxScale = 0;
                layerInfo.effectiveMinScale = 0;
                layerInfo.effectiveMaxScale = 0;
                layerInfo.defaultVisibility = true;
                this.resultLayers.push(layerInfo);
              }else{
                //remove this layer from the options list
                var oIndex = -1;
                array.some(options, lang.hitch(this, function(option,o){
                  if(option.label === this.config.layers[j].name){
                    oIndex = o;
                    return true;
                  }
                  return false;
                }));
                options.splice(oIndex, 1);
                if (this.config.layers[j].spatialsearchlayer) {
                  spatialOptions.splice(spatialOptions.indexOf(this.config.layers[j].spatialsearchlayer), 1);
                }
                this.serviceFailureNames.push(this.config.layers[j].name);
                this.resultLayers.push({});
              }
            }));
            setTimeout(lang.hitch(this, function(){
              if(options.length === 1){
                this.labelLayerGraphical.innerHTML = options[0].label;
                html.setStyle(dojoQuery(".esearch-select-graphic")[0], 'display', 'none');
                html.removeClass(this.labelLayerGraphical, 'hidden');
              }else{
                this.selectLayerGraphical.addOption(options);
              }
              if(attribOptions.length === 1){
                this.labelLayerAttribute.innerHTML = attribOptions[0].label;
                html.setStyle(dojoQuery(".esearch-select-attrib")[0], 'display', 'none');
                html.removeClass(this.labelLayerAttribute, 'hidden');
              }else{
                this.selectLayerAttribute.addOption(attribOptions);
              }
              if(spatialOptions.length === 1){
                // this.labelLayerSpatial.innerHTML = spatialOptions[0].label;
                // html.setStyle(dojoQuery(".select-layer-spatial")[0], 'display', 'none');
                // html.removeClass(this.labelLayerSpatial, 'hidden');
              }else{
                this.selectLayerSpatial.addOption(spatialOptions);
              }
            }), 100);

            if(spatialOptions.length > 0){
              this.spatialLayerIndex = spatialOptions[0].value;
            }

            //now check if there is a url search to do
            var myObject = this.getUrlParams();
            if (myObject.esearch) {
              if(myObject.esearch === "last48"){
                var today = new Date();
                var priorDate = new Date(today.getTime() - (((24 * 60 * 60 * 1000) - 1000) * 2));
                var priorDateStr = this._formatDate(priorDate.getTime(), 'yyyy/MM/dd');
                myObject.esearch = priorDateStr + "~" + this._formatDate(new Date().getTime(), 'yyyy/MM/dd');
              }
              if(myObject.esearch === "thismonth"){
                var today = new Date();
                today.setDate(1);
                var thisMonthStr = this._formatDate(today.getTime(), 'yyyy/MM/dd');
                myObject.esearch = thisMonthStr + "~" + this._formatDate(new Date().getTime(), 'yyyy/MM/dd');
              }
              if(myObject.esearch === "thisyear"){
                var today = new Date();
                today.setMonth(0,1);
                var thisMonthStr = this._formatDate(today.getTime(), 'yyyy/MM/dd');
                myObject.esearch = thisMonthStr + "~" + this._formatDate(new Date().getTime(), 'yyyy/MM/dd');
              }
              if(this.config.layers[myObject.slayer].expressions.expression.length > 0){
                var valuesObj1 = lang.clone(this.config.layers[myObject.slayer].expressions.expression[myObject.exprnum || 0].values.value);
                var values = myObject.esearch.split("|");
                array.forEach(values, lang.hitch(this, function(val, index){
                  if (val.indexOf('~') > -1){
                    var ranges = val.split("~");
                    valuesObj1[index].valueObj.value1 = ranges[0];
                    valuesObj1[index].valueObj.value2 = ranges[1];
                  }else{
                    valuesObj1[index].valueObj.value = val;
                  }
                }));
                html.empty(this.textsearchlabel);
                if(this.config.layers[myObject.slayer].expressions.expression[myObject.exprnum || 0].textsearchlabel !== ""){
                  html.place(html.toDom(this.config.layers[myObject.slayer].expressions.expression[myObject.exprnum || 0].textsearchlabel), this.textsearchlabel);
                  html.style(this.textsearchlabel, 'display', 'block');
                }else{
                  html.style(this.textsearchlabel, 'display', 'none');
                }
                this.paramsDijit.build(valuesObj1, this.resultLayers[myObject.slayer], this.config.layers[myObject.slayer].url,
                                     this.config.layers[myObject.slayer].definitionexpression);
                on.once(this.paramsDijit, 'param-ready', lang.hitch(this, function () {
                  this._queryFromURL(myObject.esearch, myObject.slayer, myObject.exprnum || 0, myObject.close || false, attribOptions.length);
                }));
              }
            } else {
              //init the first available attrib layers paramsDijit
              if(attribOptions.length > 0){
                var aIndex = attribOptions[0].value;
                this.AttributeLayerIndex = aIndex;
                this._initSelectedLayerExpressions();
                if(this.config.layers[aIndex].expressions.expression.length > 0){
                  var valuesObj = lang.clone(this.config.layers[aIndex].expressions.expression[0].values.value);
                  html.empty(this.textsearchlabel);
                  if(this.config.layers[aIndex].expressions.expression[0].textsearchlabel !== ""){
                    html.place(html.toDom(this.config.layers[aIndex].expressions.expression[0].textsearchlabel), this.textsearchlabel);
                    html.style(this.textsearchlabel, 'display', 'block');
                  }else{
                    html.style(this.textsearchlabel, 'display', 'none');
                  }
                  this.paramsDijit.build(valuesObj, this.resultLayers[aIndex], this.config.layers[aIndex].url,
                                       this.config.layers[aIndex].definitionexpression);
                  on.once(this.paramsDijit, 'param-ready', lang.hitch(this, function () {
                    this.paramsDijit.setFocusOnFirstParam();
                  }));
                }
                //determine if this layer has any sum field(s)
                this._getSumFields(aIndex);
                if(this.sumFields.length > 0){
                  html.addClass(this.list.domNode, 'sum');
                  html.setStyle(this.divSum, 'display', '');
                }else{
                  html.removeClass(this.list.domNode, 'sum');
                  html.setStyle(this.divSum, 'display', 'none');
                }
              }
            }

            if(this.serviceFailureNames.length > 0){
              console.info("service failed", this.serviceFailureNames);
              new Message({
                titleLabel: this.nls.mapServiceFailureTitle,
                message: this.nls.mapServicefailureMsg + this.serviceFailureNames.join(", ") + this.nls.mapServicefailureMsg2
              });
            }
          }), lang.hitch(this, function (err) {
            this.shelter.hide();
            if(options.length === 1){
              this.labelLayerGraphical.innerHTML = options[0].label;
              html.setStyle(dojoQuery(".esearch-select-graphic")[0], 'display', 'none');
              html.removeClass(this.labelLayerGraphical, 'hidden');
            }else{
              this.selectLayerGraphical.addOption(options);
            }
            if(attribOptions.length === 1){
              this.labelLayerAttribute.innerHTML = attribOptions[0].label;
              html.setStyle(dojoQuery(".esearch-select-attrib")[0], 'display', 'none');
              html.removeClass(this.labelLayerAttribute, 'hidden');
            }else{
              this.selectLayerAttribute.addOption(attribOptions);
            }
            if(spatialOptions.length === 1){
              this.labelLayerSpatial.innerHTML = spatialOptions[0].label;
              html.setStyle(dojoQuery(".select-layer-spatial")[0], 'display', 'none');
              html.removeClass(this.labelLayerSpatial, 'hidden');
            }else{
              this.selectLayerSpatial.addOption(spatialOptions);
            }
            console.error(err);
            for (var j = 0; j < this.config.layers.length; j++) {
              var layer = new GraphicsLayer();
              this.resultLayers.push(layer);
            }
          }));
        }
        this.own(on(this.selectLayerGraphical, "change", lang.hitch(this, this.onGraphicalLayerChange)));
        this.own(on(this.selectLayerAttribute, "change", lang.hitch(this, this.onAttributeLayerChange)));
        this.own(on(this.selectLayerSpatial, "change", lang.hitch(this, this.onSpatialLayerChange)));
        // this.own(on(this.selectExpression, "change", lang.hitch(this, this.onAttributeLayerExpressionChange)));
        this.own(on(this.list, 'remove', lang.hitch(this, this._removeResultItem)));
      },

      _relateResultItem: function(index, item) {
        var layerConfig = this.config.layers[this.currentLayerIndex];
        var oidField = layerConfig.objectIdField;
        if(!item){
          return;
        }
        var sResult = item;
        this.relArray = [];
        for(var r=0; r < layerConfig.relates.relate.length; r++){
          var relRslt = {
            id: layerConfig.relates.relate[r].id,
            name: layerConfig.relates.relate[r].label,
            fields: layerConfig.relates.relate[r].fields,
            oid: sResult.graphic.attributes[oidField]
          };
          this.relArray.push(relRslt);
        }

        if (this.wManager) {
          var widgetCfg = this._getWidgetConfig('AttributeTable');
          if(widgetCfg){
            var attWidget = this.wManager.getWidgetByLabel(widgetCfg.label);
            if(attWidget){
              this.attTableOpenedbySearch = !attWidget.showing;
              this.wManager.openWidget(attWidget);
              if(this.relArray.length === 1){
                this._createLayerAndExecuteQuery(0);
              }else{
                var rc = new RelateChooser({
                  relatesArr: this.relArray,
                  autoHeight: true,
                  width: 400,
                  titleLabel: this.nls.chooserelate,
                  folderurl: this.folderUrl
                });
                on(rc, "click", lang.hitch(this, function(evt){
                  this._createLayerAndExecuteQuery(evt);
                }));
              }
            }
          }
        }
      },

      _createLayerAndExecuteQuery: function(relateId) {
        var layerConfig = this.config.layers[this.currentLayerIndex];
        this._createRelateResultLayer(relateId).then(lang.hitch(this, function(result){
          var relateFL = result.value;
          this._addRelateLayer(relateFL);
          var relQuery = new RelationshipQuery();
          relQuery.outSpatialReference = this.map.spatialReference;
          if(this.relArray[relateId].fields.all){
            relQuery.outFields = ["*"];
          }else{
            var outFields = array.map(this.relArray[relateId].fields.field, lang.hitch(this, function (fieldInfo) {
              return fieldInfo.name;
            }));
            relQuery.outFields = outFields;
          }
          relQuery.relationshipId = parseInt(relateId);
          relQuery.objectIds = [this.relArray[relateId].oid];
          relQuery.returnGeometry = true;
          var queryTask = new QueryTask(layerConfig.url);
          queryTask.executeRelationshipQuery(relQuery, lang.hitch(this, this._onRelSearchFinish, this.relArray[relateId].oid, relateId));
        }));
      },

      _onRelSearchFinish: function (oid, relateId, result) {
        var layerConfig = this.config.layers[this.currentLayerIndex];
        // console.info(oid, relateId, result);
        if(!result[oid]){
          this.map.removeLayer(this._relateLyr);
          this.relateLayers.splice(this.relateLayers.length - 1, 1);
          new Message({
            titleLabel: this.nls.noResults,
            message: this.nls.noRelatedRecords + " " + layerConfig.relates.relate[relateId].label
          });
          return;
        }
        this._relateLyr.applyEdits(result[oid].features);
        var layerInfo = this.operLayerInfos.getLayerInfoById(this._relateLyr.id);
        //Adjust field info based on config
        if(!layerConfig.relates.relate[relateId].fields.all){
          var adjRelFldInfos = [];
          array.map(layerInfo.layerObject.fields, lang.hitch(this, function (fieldInfo){
            var cnfgFldObj = this._getRelateConfigFieldObject(fieldInfo.name, this.currentLayerIndex, relateId);
            if(cnfgFldObj){
              adjRelFldInfos.push({
                fieldName: cnfgFldObj.name,
                label: cnfgFldObj.alias,
                show: true,
                format: this._convertFormatInfo(cnfgFldObj)
              });
            }
          }));
          layerInfo.originOperLayer.popupInfo = {
            fieldInfos: adjRelFldInfos
          }
        }

        this.publishData({
          'target': 'AttributeTable',
          'layer': layerInfo
        });
      },

      _createRelateResultLayer: function (relateId) {
        var def = new Deferred();
        var relLyrExists = false;
        var layerConfig = this.config.layers[this.currentLayerIndex];
        //Check if the layer already exists
        if(this.relateLayers && this.relateLayers.length > 0){
          array.some(this.relateLayers, lang.hitch(this, function(rLayer){
            if(rLayer.name === this.nls.relate + ': ' + layerConfig.relates.relate[relateId].label){
              this._relateLyr = rLayer;
              def.resolve({state: 'success', value: rLayer});
              relLyrExists = true;
              return true;
            }
          }));
        }
        if(!relLyrExists){
          var serviceUrl = this._getServiceUrlByLayerUrl(layerConfig.url);
          relateLyrUrl = serviceUrl + '/' + relateId
          this._getLayerInfoWithRelationships(relateLyrUrl).then(lang.hitch(this, function(result){
            var layerInfo = result.value;
            layerInfo.name = this.nls.relate + ': ' + layerConfig.relates.relate[relateId].label;
            layerInfo._titleForLegend = layerInfo.name;
            layerInfo.minScale = 0;
            layerInfo.maxScale = 0;
            layerInfo.effectiveMinScale = 0;
            layerInfo.effectiveMaxScale = 0;
            layerInfo.defaultVisibility = true;

            //only keep necessary fields
            var necessaryFieldNames = array.map(layerConfig.relates.relate[relateId].fields.field, lang.hitch(this, function (fieldInfo) {
              return fieldInfo.name;
            }));

            var oidField;
            if (layerInfo.objectIdField) {
              oidField = layerInfo.objectIdField;
            } else {
              var fields = layerInfo.fields;
              var oidFieldInfos = array.filter(fields, lang.hitch(this, function (fieldInfo) {
                return fieldInfo.type === 'esriFieldTypeOID';
              }));
              if (oidFieldInfos.length > 0) {
                var oidFieldInfo = oidFieldInfos[0];
                oidField = oidFieldInfo.name;
              }
            }
            if (array.indexOf(necessaryFieldNames, oidField) < 0) {
              necessaryFieldNames.push(oidField);
            }
            //match field order with order specified in relate config.
            if(!layerConfig.relates.relate[relateId].fields.all){
              var adjFieldsOrder = [];
              array.map(layerConfig.relates.relate[relateId].fields.field, lang.hitch(this, function (fieldInfo) {
                array.some(layerInfo.fields, lang.hitch(this, function (oFieldInfo) {
                  if(oFieldInfo.name === fieldInfo.name){
                    adjFieldsOrder.push(oFieldInfo);
                    return true;
                  }
                }));
              }));
              layerInfo.fields = adjFieldsOrder;
            }

            layerInfo.fields = array.filter(layerInfo.fields, lang.hitch(this, function (fieldInfo) {
              if(!layerConfig.relates.relate[relateId].fields.all){
                return necessaryFieldNames.indexOf(fieldInfo.name) >= 0;
              }else{
                return true;
              }
            }));
            /*Adjust field aliases to those configured in the json*/
            array.map(layerInfo.fields, lang.hitch(this, function (fieldInfo){
              if(necessaryFieldNames.indexOf(fieldInfo.name) >= 0){
                var cnfgFldObj = this._getRelateConfigFieldObject(fieldInfo.name, this.currentLayerIndex, relateId);
                if(cnfgFldObj && cnfgFldObj.alias !== fieldInfo.alias){
                  fieldInfo.alias = cnfgFldObj.alias;
                }
              }
            }));

            var featureCollection = {
              layerDefinition: layerInfo,
              featureSet: null
            };
            resultLayer = new FeatureLayer(featureCollection);
            this._relateLyr = resultLayer;
            def.resolve({state: 'success', value: resultLayer});
          }));
        }
        return def;
      },

      _removeResultItem: function (index, item) {
        //console.info(item);
        array.some(this.currentCSVResults.data, lang.hitch(this, function(csvRow){
          if(csvRow.OID === item.OID){
            this.currentCSVResults.data.splice(this.currentCSVResults.data.indexOf(csvRow), 1);
            return true;
          }
          return false;
        }));
        var sResult = item;
        var layerConfig = this.config.layers[this.currentLayerIndex];
        this.currentFeatures.splice(this.currentFeatures.indexOf(sResult.graphic), 1);
        
        if(this.currentFeatures.length === 0)
        {
          // clear up environment if there are no features found(???)
          this.clear();
        
          // if (this.isSelTabVisible()) {
          //   this.tabContainer.selectTab(this.selTab);
          // }
          return;
        }
        this.currentSearchLayer.remove(sResult.graphic);
        this.currentSearchLayer.refresh();
        
        html.empty(this.divResultMessage);
        var msg_text = "<label>" + this.nls.featuresSelected + this.currentFeatures.length + "</label>";
        html.place(html.toDom(msg_text), this.divResultMessage);
        
        this.list.remove(index);
        this._hideInfoWindow();
        if (layerConfig.shareResult && layerConfig.addToAttrib) {
          if (this.wManager) {
            var widgetCfg = this._getWidgetConfig('AttributeTable');
            if(widgetCfg){
              var attWidget = this.wManager.getWidgetByLabel(widgetCfg.label);
              if(attWidget){
                this.attTableOpenedbySearch = !attWidget.showing;
                this.wManager.openWidget(attWidget);
                attWidget._activeTable.refresh();
              }
            }
          }
        }
      },

      _getServiceUrlByLayerUrl: function (layerUrl) {
        var lastIndex = layerUrl.lastIndexOf("/");
        var serviceUrl = layerUrl.slice(0, lastIndex);
        return serviceUrl;
      },

      _isServiceSupportsOrderBy: function(layerInfo){
        var isSupport = false;
        if(layerInfo.advancedQueryCapabilities){
          if(layerInfo.advancedQueryCapabilities.supportsOrderBy){
            isSupport = true;
          }
        }
        return isSupport;
      },

      _getLayerInfoWithRelationships: function (layerUrl) {
        var def = new Deferred();
        esriRequest({
          url: layerUrl,
          content: {
            f: 'json'
          },
          handleAs: 'json',
          callbackParamName: 'callback'
        }).then(lang.hitch(this, function (layerInfo) {
          if (!layerInfo.relationships) {
            layerInfo.relationships = [];
          }
          layerInfo._origLayerURL = layerUrl;
          var serviceUrl = this._getServiceUrlByLayerUrl(layerUrl);
          layerInfo._origServiceURL = serviceUrl
          var defs = array.map(layerInfo.relationships, lang.hitch(this, function (relationship) {
            return esriRequest({
              url: serviceUrl + '/' + relationship.relatedTableId,
              content: {
                f: 'json'
              },
              handleAs: 'json',
              callbackParamName: 'callback'
            });
          }));
          all(defs).then(lang.hitch(this, function (results) {
            array.forEach(results, lang.hitch(this, function (relationshipInfo, index) {
              var relationship = layerInfo.relationships[index];
              relationship.name = relationshipInfo.name;
              //ignore shape field
              relationship.fields = array.filter(relationshipInfo.fields,
                lang.hitch(this, function (relationshipFieldInfo) {
                  return relationshipFieldInfo.type !== 'esriFieldTypeGeometry';
                }));
            }));
            def.resolve({state: 'success', value: layerInfo});
          }), lang.hitch(this, function (err) {
            def.resolve({state: 'failure', value: err});
          }));
          def.resolve({state: 'success', value: layerInfo});
        }), lang.hitch(this, function (err) {
          def.resolve({state: 'failure', value: err});
        }));
        return def;
      },

      _queryFromURL: function (value, slayerId, exprNum, close, numOfAttribLayers) {
        slayerId = typeof slayerId !== 'undefined' ? slayerId : 0;
        exprNum = typeof exprNum !== 'undefined' ? exprNum : 0;
        this.AttributeLayerIndex = slayerId;
        this.expressIndex = exprNum;
//make sure the form reflects what was searched
        if(numOfAttribLayers > 1){
          this.selectLayerAttribute.set('value', slayerId);
        }
        setTimeout(lang.hitch(this, function(){
          this.selectExpression.set('value', exprNum || 0);
          setTimeout(lang.hitch(this, function(){
            var valuesObj = lang.clone(this.config.layers[slayerId].expressions.expression[exprNum || 0].values.value);
            this.paramsDijit.setSingleParamValues(valuesObj, value);
          }), 200);
        }), 200);

        var valsArr = this._buildSearchValues(value);
        //determine if this layer has any sum field(s)
        this._getSumFields(slayerId);
        if(this.sumFields.length > 0){
          html.addClass(this.list.domNode, 'sum');
          html.setStyle(this.divSum, 'display', '');
        }else{
          html.removeClass(this.list, 'sum');
          html.setStyle(this.divSum, 'display', 'none');
        }
        this.search(null, slayerId, exprNum, valsArr, null, close);
      },

      _createSearchResultLayer: function (layerIndex) {
        var resultLayer = null;
        var layerConfig = this.config.layers[layerIndex];
        var layerInfo = lang.clone(this.resultLayers[layerIndex]);
        var _hasInfoTemplate = false;
        var _infoTemplate = null;
        var _popupNeedFields = [];

        //now setup the infoTemplate
        //check if this layer is part of map and if it has a popup defined already
        var lyrDisablePopupsAndTrue = (layerConfig.hasOwnProperty("disablePopups") && layerConfig.disablePopups)?true:false;
        if(!this.config.disablePopups && !lyrDisablePopupsAndTrue){
          if(layerConfig.popupfrom && layerConfig.popupfrom === "webmap"){
            array.forEach(this.operLayerInfos.getLayerInfoArray(), function(layerInfo2) {
              //console.info(layerInfo2);
              if(layerInfo2.layerObject && layerInfo2.layerObject.url === layerInfo._origServiceURL || layerInfo2.layerObject.url === layerInfo._origLayerURL){
                //console.info(layerInfo2);
                if(layerInfo2.controlPopupInfo.hasOwnProperty("infoTemplates")){
                  if(layerInfo2.controlPopupInfo.infoTemplates[layerInfo.id]){
                    //console.info(layerInfo2.controlPopupInfo.infoTemplates[layerInfo.id].infoTemplate);
                    if(layerInfo2.controlPopupInfo.infoTemplates[layerInfo.id].infoTemplate._fieldLabels){
                      _popupNeedFields = this._addPopupFields(layerInfo2.controlPopupInfo.infoTemplates[layerInfo.id].infoTemplate._fieldLabels);
                    }
                    _infoTemplate = layerInfo2.controlPopupInfo.infoTemplates[layerInfo.id].infoTemplate;
                    _hasInfoTemplate = true;
                  }else{
                    _hasInfoTemplate = false;
                  }
                }else{
                  if(layerInfo2.controlPopupInfo.infoTemplate._fieldLabels){
                    _popupNeedFields = this._addPopupFields(layerInfo2.controlPopupInfo.infoTemplate._fieldLabels);
                  }
                  _infoTemplate = layerInfo2.controlPopupInfo.infoTemplate;
                  _hasInfoTemplate = true;
                }
              }
            }, this);
          }else{
            _hasInfoTemplate = false;
          }
        }

        if (layerConfig.shareResult) {
          //only keep necessary fields
          var necessaryFieldNames = this._getOutputFields(layerIndex, _popupNeedFields);
          layerInfo.fields = array.filter(layerInfo.fields, lang.hitch(this, function (fieldInfo) {
            if(!layerConfig.fields.all){
              return necessaryFieldNames.indexOf(fieldInfo.name) >= 0;
            }else{
              return true;
            }
          }));
/*Adjust field aliases to those configured in the json*/
          array.map(layerInfo.fields, lang.hitch(this, function (fieldInfo){
            if(necessaryFieldNames.indexOf(fieldInfo.name) >= 0){
              var cnfgFldObj = this._getConfigFieldObject(fieldInfo.name, layerIndex);
              if(cnfgFldObj && cnfgFldObj.alias !== fieldInfo.alias){
                fieldInfo.alias = cnfgFldObj.alias;
              }
            }
          }));
          var featureCollection = {
            layerDefinition: layerInfo,
            featureSet: null
          };
          resultLayer = new FeatureLayer(featureCollection);
        } else {
          //use graphics layer
          this._resetAndAddTempResultLayer(layerIndex);
          resultLayer = this.tempResultLayer;
        }
        if(_hasInfoTemplate){
          resultLayer._hasInfoTemplate = true;
          resultLayer.infoTemplate = _infoTemplate;
        }else{
          resultLayer._hasInfoTemplate = false;
        }
        return resultLayer;
      },

      _addPopupFields: function(fields) {
        var popFldArr = [];
        for(var fld in fields){
          popFldArr.push(fields[fld]);
        }
        return popFldArr;
      },

      _getConfigFieldObject: function (fldName, layerIndex) {
//        console.info(fldName, layerIndex);
        var layerConfig = this.config.layers[layerIndex];
        var fields = layerConfig.fields.field;
        var retFldObj = null;
        array.some(fields, lang.hitch(this, function (fieldInfo) {
          if(fieldInfo.name === fldName){
            retFldObj = fieldInfo;
            return true;
          }else{
            return false;
          }
        }));
        return retFldObj;
      },

      _getRelateConfigFieldObject: function (fldName, layerIndex, relateId) {
//        console.info(fldName, layerIndex, relateId);
        var layerConfig = this.config.layers[layerIndex].relates.relate[relateId];
        var fields = layerConfig.fields.field;
        var retFldObj = null;
        array.some(fields, lang.hitch(this, function (fieldInfo) {
          if(fieldInfo.name === fldName){
            retFldObj = fieldInfo;
            return true;
          }else{
            return false;
          }
        }));
        return retFldObj;
      },

      _getOutputFields: function (layerIndex, popupFieldName) {
        var layerConfig = this.config.layers[layerIndex];
        var fields = layerConfig.fields.field;
        var outFields = array.map(fields, lang.hitch(this, function (fieldInfo) {
          return fieldInfo.name;
        }));
        //we need to add objectIdField into outFields because relationship query
        //needs objectId infomation
        var objectIdField = layerConfig.objectIdField;
        if (array.indexOf(outFields, objectIdField) < 0) {
          outFields.push(objectIdField);
        }

        //Make sure the title field is added to the fields array
        var title = layerConfig.titlefield;
        if (array.indexOf(outFields, title) < 0) {
          outFields.push(title);
        }

        var allFieldInfos = this.resultLayers[layerIndex].fields;
        var allFieldNames = array.map(allFieldInfos, lang.hitch(this, function (fieldInfo) {
          return fieldInfo.name;
        }));
        //make sure every fieldName of outFields exists in fieldInfo
        outFields = array.filter(outFields, lang.hitch(this, function (fieldName) {
          return allFieldNames.indexOf(fieldName) >= 0;
        }));
        //make sure every popupfield is added
        array.map(popupFieldName, lang.hitch(this, function(fldname){
          if (array.indexOf(outFields, fldname) < 0) {
            outFields.push(fldname);
            //console.info("Added popup field: " + fldname);
          }
        }));
        if(layerConfig.fields.all){
          outFields = allFieldNames;
        }
        //console.info(outFields);
        return outFields;
      },

      _bufferGeometries: function (geomArr, sr, dist, unit, isGraphicalBufferOp) {
        if (geomArr) {
          var bufferParameters = new BufferParameters();
          var resultEvent;
          bufferParameters.geometries = geomArr;
          bufferParameters.bufferSpatialReference = sr;
          bufferParameters.unit = GeometryService[unit];
          bufferParameters.distances = dist;
          bufferParameters.unionResults = true;
          bufferParameters.geodesic = true;
          bufferParameters.outSpatialReference = this.map.spatialReference;
          esriConfig.defaults.geometryService.buffer(bufferParameters, lang.hitch(this, function (evt) {
            resultEvent = evt[0];
            var graphic = new Graphic();
            graphic.geometry = resultEvent;
            graphic.symbol = new SimpleFillSymbol(this.config.bufferDefaults.simplefillsymbol);

            this.graphicsLayerBuffer.clear();
            this.graphicsLayerBuffer.add(graphic);
            html.setStyle(this.btnClearBuffer2, 'display', 'block');
            html.setStyle(this.btnClearBuffer3, 'display', 'block');
            if (isGraphicalBufferOp) {
              this.search(resultEvent, this.graphicLayerIndex);
            }
          }));
        }
      },

      _buildSearchValues: function (value) {
        var valArray = [];
        var values = value.split("|");
        array.forEach(values, lang.hitch(this, function (val) {
          var retValueObj = {};
          if (val.indexOf('~') > -1) {
            var ranges = val.split("~");
            retValueObj.value1 = ranges[0];
            retValueObj.value2 = ranges[1];
          } else {
            retValueObj.value = val;
          }
          valArray.push(retValueObj);
        }));
        return valArray;
      },

      getUrlParams: function () {
        var s = window.location.search,
          p;
        if (s === '') {
          return {};
        }
        p = ioquery.queryToObject(s.substr(1));
        return p;
      },

      _initProgressBar: function () {
        this.progressBar = new ProgressBar({
          indeterminate: true
        }, this.progressbar);
        html.setStyle(this.progressBar.domNode, 'display', 'none'); // always show '' hide 'none'
      },

      _initSelectedLayerExpressions: function () {
        this.selectExpression.removeOption(this.selectExpression.getOptions());
        var express = [];
        //now loop through the expressions
        var elen = this.config.layers[this.AttributeLayerIndex].expressions.expression.length;
        for (var e = 0; e < elen; e++) {
          var eoption = {
            value: e,
            label: this.config.layers[this.AttributeLayerIndex].expressions.expression[e].alias
          };
          express.push(eoption);
          if (e === 0) {
            express[e].selected = true;
          }
        }
        this.selectExpression.addOption(express);
        if (elen === 1) {
          domUtils.hide(this.expressionDiv);
        } else {
          domUtils.show(this.expressionDiv);
        }
      },

      _initDrawBox: function () {
        this.keepgraphicalsearchenabled = this.config.graphicalsearchoptions.keepgraphicalsearchenabled || false;
        aspect.before(this.drawBox, "_activate", lang.hitch(this, function(){
          this.publishData({message: "Deactivate_DrawTool"});
        }));
        this.drawBox.setMap(this.map);
        var enabledButtons = [];
        if (this.config.graphicalsearchoptions.enablepointselect) {
          enabledButtons.push('POINT');
        }
        if (this.config.graphicalsearchoptions.enablelineselect) {
          enabledButtons.push('LINE');
        }
        if (this.config.graphicalsearchoptions.enablepolylineselect) {
          enabledButtons.push('POLYLINE');
        }
        if (this.config.graphicalsearchoptions.enablefreehandlineselect) {
          enabledButtons.push('FREEHAND_POLYLINE');
        }
        if (this.config.graphicalsearchoptions.enabletriangleselect) {
          enabledButtons.push('TRIANGLE');
        }
        if (this.config.graphicalsearchoptions.enableextentselect) {
          enabledButtons.push('EXTENT');
        }
        if (this.config.graphicalsearchoptions.enablecircleselect) {
          enabledButtons.push('CIRCLE');
        }
        if (this.config.graphicalsearchoptions.enableellipseselect) {
          enabledButtons.push('ELLIPSE');
        }
        if (this.config.graphicalsearchoptions.enablepolyselect) {
          enabledButtons.push('POLYGON');
        }
        if (this.config.graphicalsearchoptions.enablefreehandpolyselect) {
          enabledButtons.push('FREEHAND_POLYGON');
        }
        this.drawBox.geoTypes = enabledButtons;
        this.drawBox._initTypes();
        if(this.keepgraphicalsearchenabled){
          this.drawBox.deactivateAfterDrawing = false;
        }
        this.own(on(this.drawBox, 'IconSelected', lang.hitch(this, function (tool, geotype, commontype) {
          if (this.lastDrawCommonType && this.lastDrawCommonType !== commontype && this.garr.length > 0) {
            var qMessage = new Message({
              type: 'question',
              titleLabel: this.nls.warning,
              message: this.nls.graphicgeomtypemsg1 + "\n\n" + this.nls.graphicgeomtypemsg2,
              buttons: [{
                label: this.nls._continue,
                onClick: lang.hitch(this, lang.hitch(this, function () {
                  qMessage.close();
                  this.lastDrawCommonType = commontype;
                  this.lastDrawTool = geotype;
                  this.drawBox.clear();
                  this.garr = [];
                }))
              }, {
                label: this.nls.cancel,
                onClick: lang.hitch(this, lang.hitch(this, function () {
                  qMessage.close();
                  this.drawBox.activate(this.lastDrawTool);
                }))
              }]
            });
          }else{
            this.lastDrawCommonType = commontype;
            this.lastDrawTool = geotype;
          }
        })));
        this.own(on(this.drawBox, 'DrawEnd', lang.hitch(this, function (graphic) {
              var ext = this.pointToExtent(graphic.geometry, this.pointSearchTolerance);
              this.search(ext, this.graphicLayerIndex);

        })));

      },

      exportURL: function () {
        var useSeparator, eVal;
        var url = window.location.protocol + '//' + window.location.host + window.location.pathname;
        var urlObject = urlUtils.urlToObject(window.location.href);
        urlObject.query = urlObject.query || {};
        var content = this.paramsDijit.getSingleParamValues();
        for (var s = 0; s < content.length; s++) {
          eVal = content[s].value.toString();
        }
        urlObject.query.esearch = eVal;
        urlObject.query.slayer = this.AttributeLayerIndex.toString();
        urlObject.query.exprnum = this.expressIndex.toString();
        // each param
        for (var i in urlObject.query) {
          if (urlObject.query[i] && urlObject.query[i] !== 'config') {
            // use separator
            if (useSeparator) {
              url += '&';
            } else {
              url += '?';
              useSeparator = true;
            }
            url += i + '=' + urlObject.query[i];
          }
        }
        window.prompt(this.nls.copyurlprompt, url);
      },

      _bufferFeatures: function () {
        if (this.currentLayerAdded && this.currentLayerAdded.graphics.length > 0) {
          var geoms = array.map(this.currentLayerAdded.graphics, function (gra) {
            return gra.geometry;
          });
          this._bufferGeometries(geoms, new SpatialReference({
            wkid: this.bufferWKID
          }), [parseFloat(this.txtBufferValueSpat.get('value'))], this.bufferUnitsSpat.get('value'), false);
        } else {
          new Message({
            titleLabel: this.nls.bufferSearchErrorTitle,
            message: this.nls.bufferMessage
          });
        }
      },

      onSearch: function () {
        var content = this.paramsDijit.getSingleParamValues();
        if (!content || content.length === 0 || !this.config.layers.length) {
          return;
        }
        this.search(null, this.AttributeLayerIndex, this.expressIndex);
      },

      _onBtnGraSearchClicked: function () {
        if (this.garr.length > 0) {
          if (!this.keepgraphicalsearchenabled) {
            this.map.enableMapNavigation();
          }
          this.lastDrawCommonType = null;
          this.lastDrawTool = null;
          if (this.cbxBufferGraphic.getValue()) {
            var geoms = array.map(this.garr, function (gra) {
              return gra.geometry;
            });
            this._bufferGeometries(geoms, new SpatialReference({
              wkid: this.bufferWKID
            }), [parseFloat(this.txtBufferValue.get('value'))], this.bufferUnits.get('value'), true);
          } else {
            this.search(this.unionGeoms(this.garr), this.graphicLayerIndex);
          }
        }
      },

      _onCbxMultiGraphicClicked: function () {
        if (this.cbxMultiGraphic.getValue()) {
          this.drawBox.deactivateAfterDrawing = false;
          html.setStyle(this.btnGraSearch, 'display', 'inline-block');
        } else {
          if(this.keepgraphicalsearchenabled){
            this.drawBox.deactivateAfterDrawing = false;
          }else{
            this.drawBox.deactivateAfterDrawing = true;
          }
          html.setStyle(this.btnGraSearch, 'display', 'none');
        }
      },

      unionGeoms: function (gArray) {
        var retGeom;
        var mPoint = new Multipoint(this.map.spatialReference);
        var mPoly = new Polygon(this.map.spatialReference);
        var mPolyL = new Polyline(this.map.spatialReference);
        var rType;
        this.polygonsToDiscard = [];
        if (gArray.length > 0 && gArray[0].geometry.type === "polygon") {
          //For each polygon, test if another polgon exists that contains the first polygon.
          //If it does, the polygon will not be included in union operation and it will added to the polygonsToDiscard array.
          dojo.forEach(gArray, lang.hitch(this, function (graphic) {
            var poly1 = graphic.geometry;
            dojo.forEach(this.gArray, lang.hitch(this, function (aGraphic) {
              var aPoly = aGraphic.geometry;
              if (aPoly.extent.contains(this.graphic.geometry) && (aPoly.extent.center.x !== poly1.extent.center.x ||
                                                                   aPoly.extent.center.y !== poly1.extent.center.y)) {
                this.polygonsToDiscard.push(poly1);
              }
            }));
          }));
        }
        //globals
        var poly, ext, j, mp, ringArray;
        dojo.forEach(gArray, lang.hitch(this, function (graphic) {
          // if (graphic.geometry.type === "point" && !this.cbxAddTolerance.getValue()) {
          //   mPoint.addPoint(graphic.geometry);
          //   rType = "point";
          // } else if (graphic.geometry.type === "point" && this.cbxAddTolerance.getValue()) {
            ext = this.pointToExtent(graphic.geometry, this.pointSearchTolerance);
            ringArray = this.extentToMPArray(ext);
            mPoly.addRing(ringArray);
            rType = "poly";
            mPoly.spatialReference = ext.spatialReference;
          // }
          if (graphic.geometry.type === "multipoint") {
            var mp1 = graphic.geometry;
            for (var p = 0; p < mp1.points.length; p++) {
              mPoint.addPoint(mp1.points[p]);
            }
            rType = "point";
          }
          if (graphic.geometry.type === "polyline") {
            var polyl = graphic.geometry;
            for (var l = polyl.paths.length - 1; l >= 0; l--) {
              var pathArray = [];
              for (j = 0; j < polyl.paths[l].length; j++) {
                mp = polyl.getPoint(l, j);
                mp.spatialReference = polyl.spatialReference;
                pathArray.push(mp);
              }
              mPolyL.addPath(pathArray);
            }
            rType = "line";
          }
          if (graphic.geometry.type === "extent") {
            ext = graphic.geometry;
            ringArray = this.extentToMPArray(ext);
            mPoly.addRing(ringArray);
            rType = "poly";
            mPoly.spatialReference = ext.spatialReference;
          }
          if (graphic.geometry.type === "polygon") {
            poly = graphic.geometry;
            //Consider only the rings that not coincide with any polygon ring on polygonsToDiscard array.
            var targetRings = [];
            for (var m = 0; m < poly.rings.length; m++) {
              var polygonToDiscard;
              var targetRing = [];
              var targetPolygon = new Polygon([poly.rings[m]], poly.spatialReference);
              var add = true;
              if (this.polygonsToDiscard.length > 0) {
                for (polygonToDiscard in this.polygonsToDiscard) {
                  add = true;
                  if (targetPolygon.extent.center.x === polygonToDiscard.extent.center.x &&
                      targetPolygon.extent.center.y === polygonToDiscard.extent.center.y) {
                    add = false;
                    break;
                  }
                }
                if (add) {
                  targetRing[0] = m;
                  targetRing[1] = poly.rings[m];
                  targetRings.push(targetRing);
                }
              } else {
                targetRing[0] = m;
                targetRing[1] = poly.rings[m];
                targetRings.push(targetRing);
              }
            }
            for (var i2 = targetRings.length - 1; i2 >= 0; i2--) {
              ringArray = [];
              for (var j1 = 0; j1 < targetRings[i2][1].length; j1++) {
                var mp2 = poly.getPoint(i2, j1);
                mp2.spatialReference = poly.spatialReference;
                ringArray.push(mp2);
              }
              mPoly.addRing(ringArray);
            }
            rType = "poly";
            mPoly.spatialReference = poly.spatialReference;
          }
        }));

        switch (rType) {
        case "point":
          {
            retGeom = mPoint;
            break;
          }
        case "poly":
          {
            retGeom = mPoly;
            break;
          }
        case "line":
          {
            retGeom = mPolyL;
            break;
          }
        }
        this.garr = [];
        return retGeom;
      },

      pointToExtent: function (objPoint, distance) {
        var clickOffset = distance || 6;
        var centerPoint = new Point(objPoint.x, objPoint.y, objPoint.spatialReference);
        var mapWidth = this.map.extent.getWidth();
        var pixelWidth = mapWidth / this.map.width;
        var tolerance = clickOffset * pixelWidth;
        var queryExtent = new Extent(1, 1, tolerance, tolerance, objPoint.spatialReference);
        return queryExtent.centerAt(centerPoint);
      },

      extentToPolygon: function (extent) {
        var polygon = new Polygon([extent.xmax, extent.ymax], [extent.xmax, extent.ymin], [extent.xmin, extent.ymin],
                                  [extent.xmin, extent.ymax], [extent.xmax, extent.ymax]);
        polygon.setSpatialReference(this.map.spatialReference);
        return polygon;
      },

      extentToMPArray: function (extent) {
        var MPArr = [[extent.xmax, extent.ymax], [extent.xmax, extent.ymin], [extent.xmin, extent.ymin],
                     [extent.xmin, extent.ymax], [extent.xmax, extent.ymax]];
        return MPArr;
      },

      checkforenterkey: function (evt) {
        var keyNum = evt.keyCode !== undefined ? evt.keyCode : evt.which;
        if (keyNum === 13) {
          this.search(null, this.AttributeLayerIndex, this.expressIndex);
        }
      },

      onNewSelection: function(){
//        html.replaceClass(this.gSelectType.iconNode, 'newSelIcon', 'removeSelIcon');
//        html.replaceClass(this.gSelectType.iconNode, 'newSelIcon', 'addSelIcon');
        this.gSelectTypeVal = 'new';
      },

      onAddSelection: function(){
        this.gSelectTypeVal = 'add';
      },

      onRemoveSelection: function(){
        this.gSelectTypeVal = 'rem';
      },

      onNewSelection2: function(){
        html.replaceClass(this.aSelectType.iconNode, 'newSelIcon', 'removeSelIcon');
        html.replaceClass(this.aSelectType.iconNode, 'newSelIcon', 'addSelIcon');
        this.aSelectTypeVal = 'new';
      },

      onAddSelection2: function(){
        html.replaceClass(this.aSelectType.iconNode, 'addSelIcon', 'newSelIcon');
        html.replaceClass(this.aSelectType.iconNode, 'addSelIcon', 'removeSelIcon');
        this.aSelectTypeVal = 'add';
      },

      onRemoveSelection2: function(){
        html.replaceClass(this.aSelectType.iconNode, 'removeSelIcon', 'newSelIcon');
        html.replaceClass(this.aSelectType.iconNode, 'removeSelIcon', 'addSelIcon');
        this.aSelectTypeVal = 'rem';
      },

      search: function (geometry, layerIndex, /* optional */ expressIndex, theValue, spatialRelationship, closeOnComplete) {
        var adding = false,
            removing = false;
        if (typeof closeOnComplete === 'undefined') {
          closeOnComplete = false;
        }
        this.oidArray = [];
        if (!this.config.layers) {
          return;
        }
        if (this.config.layers.length === 0) {
          return;
        }

        if (geometry) {
          //get the adding or removing
          if(this.gSelectTypeVal === 'add'){
            adding = true;
          }
          if(this.gSelectTypeVal === 'rem'){
            removing = true;
          }
        }else{
          //get the adding or removing
          if(this.aSelectTypeVal === 'add'){
            adding = true;
          }
          if(this.aSelectTypeVal === 'rem'){
            removing = true;
          }
        }
        var queryParams = new Query();
		
        if(!adding && !removing)
        {
           // clear up the environment
          this.clear();
        }
        else
        {
          this._clearLayers();
          this._clearRelateLayers();
          this.drawBox.clear();
          this.garr = [];
          this.lastDrawCommonType = null;
          this.lastDrawTool = null;
        }
        this.currentSearchLayer = this._createSearchResultLayer(layerIndex || 0);
        this.currentLayerIndex = layerIndex;

        var layerConfig = this.config.layers[layerIndex];

        if (geometry) 
        {
          this.initiator = 'graphic';
          
          queryParams.geometry = geometry;
          //jab
          this.map_click_point = geometry.getExtent().getCenter();
          this.add_click_point_graphic(this.map_click_point);
          //jab-end
          queryParams.spatialRelationship = spatialRelationship || Query.SPATIAL_REL_INTERSECTS;         
        } 
        else 
        {
          this.initiator = 'attribute';
          var where = this.buildWhereClause(layerIndex, expressIndex, theValue);
          queryParams.where = this.lastWhere = where;
          if (this.limitMapExtentCbx.getValue()) {
            queryParams.geometry = this.map.extent;
          }
          if (layerConfig.definitionexpression && this.lastWhere.indexOf(layerConfig.definitionexpression) === -1) {
            queryParams.where = layerConfig.definitionexpression + ' AND ' + this.lastWhere;
          }
          console.info('SQL Where with layers definition expression: ', queryParams.where);
        }

        //check for required fields
        if(this.initiator === 'attribute' || this.initiator === 'graphic'){ // && this.cbxAddTextQuery.getValue()
          if(!this.checkForRequiredFieldsEntered()){
            new Message({
              titleLabel: this.nls.requiredWarning,
              message: this.nls.requiredErrorMessage
            });
            return;
          }
        }


        html.setStyle(this.progressBar.domNode, 'display', 'block');
        // this.progressBar.domNode.innerHTML = "Searching ...";
        html.setStyle(this.divOptions, 'display', 'none');
        var fields = [];
        if (this.config.layers[layerIndex].fields.all) {
          fields[0] = "*";
        } else {
          for (var i = 0, len = this.config.layers[layerIndex].fields.field.length; i < len; i++) {
            fields[i] = this.config.layers[layerIndex].fields.field[i].name;
          }
        }
        if (!this.config.layers[layerIndex].existObjectId && fields.indexOf(this.config.layers[layerIndex].objectIdField) < 0) {
          if(!this.config.layers[layerIndex].fields.all){
            fields.push(this.config.layers[layerIndex].objectIdField);
          }
        }

        queryParams.returnGeometry = true;
        queryParams.outSpatialReference = this.map.spatialReference;
        queryParams.outFields = fields;

        if(this._isServiceSupportsOrderBy(this.resultLayers[layerIndex])){
          //set sorting info
          var orderByFields = this.config.layers[layerIndex].orderByFields;   //Need to feed in my orderby field array

          if(orderByFields && orderByFields.length > 0){
            queryParams.orderByFields = orderByFields;

            var orderFieldNames = array.map(orderByFields, lang.hitch(this, function(orderByField){
              var splits = orderByField.split(' ');
              return splits[0];
            }));

            //make sure orderFieldNames exist in outFields, otherwise the query will fail
            array.forEach(orderFieldNames, lang.hitch(this, function(orderFieldName){
              if(queryParams.outFields.indexOf(orderFieldName) < 0){
                queryParams.outFields.push(orderFieldName);
              }
            }));
          }
        }

        var queryTask = new QueryTask(layerConfig.url);
        
        html.empty(this.divResultMessage);
        html.place(html.toDom(this.nls.searching), this.divResultMessage);
        
        queryTask.execute(queryParams, lang.hitch(this, this._onSearchFinish, layerIndex, closeOnComplete, removing, adding),
          lang.hitch(this, this._onSearchError));
      },

      checkForRequiredFieldsEntered: function() {

	    return true; //not used for now

        var content = this.paramsDijit.getSingleParamValues();
        //console.info(content);
        if (!content || content.length === 0 || !this.config.layers.length) {
          return false;
        }
        //loop though the single params
        for (var s = 0; s < content.length; s++) {
          var spRequired = this.config.layers[this.AttributeLayerIndex].expressions.expression[this.expressIndex].values.value[s].required || false;

          //console.info("Is required:", spRequired, "Single Param Value:", content[s].value);
          var hasAValue = false;
          if (!content[s].hasOwnProperty('value') || content[s].value === null) {
            if(!content[s].hasOwnProperty('value1') || content[s].value1 === null){
              continue;
            }
            if (content[s].value1.toString() !== "NaN" && content[s].value2.toString() !== "NaN") {
              hasAValue = false;
            }
          }else{
            if(content[s].value === "" || content[s].value.toString().toLowerCase() === "nan"){
              hasAValue = false;
            }else{
              hasAValue = true;
            }
          }
          //console.info("Is required:", spRequired, "Has a value:", hasAValue);
          if(spRequired && !hasAValue){
             return false;
          }
        }
        return true;
      },
    //not used
      isSelTabVisible: function () {
        switch (this.selTab) {
        case this.nls.selectByAttribute:
          return this.attribTab;
        case this.nls.selectFeatures:
          return this.shapeTab;
        case this.nls.selectSpatial:
          return this.spatTab;
        case this.nls.results:
          return this.rsltsTab;
        }
      },

      clearFields: function () {
        if(this.AttributeLayerIndex || this.AttributeLayerIndex === 0){
          var exInd = this.expressIndex || 0;
          if(exInd > 0){
            this.onAttributeLayerExpressionChange(this.expressIndex);
          }else{
            this.onAttributeLayerChange(this.AttributeLayerIndex);
          }
          var valuesObj = lang.clone(this.config.layers[this.AttributeLayerIndex].expressions.expression[exInd].values.value);
          //console.info(valuesObj);
          array.map(valuesObj, lang.hitch(this, function(valObj){
            if(valObj.operation.toLowerCase().indexOf('date') > -1){
              if(valObj.valueObj.hasOwnProperty('value')){
                valObj.valueObj.value = "";
              }
              if(valObj.valueObj.hasOwnProperty('value1')){
                valObj.valueObj.value1 = "";
              }
              if(valObj.valueObj.hasOwnProperty('value2')){
                valObj.valueObj.value2 = "";
              }
              this.paramsDijit.setSingleParamValues(valuesObj, "");
            }
          }));
        }
      },

      clear: function ( /* optional */ closeAtt) 
      {
        if(this.sumDivEvt){
          this.sumDivEvt.remove();
        }
        html.removeClass(this.list.domNode, 'sum');
        html.setStyle(this.divSum, 'display', 'none');
        html.setStyle(this.divOptions, 'display', 'none');
        this.currentLayerIndex = null;
        this.currentCSVResults = null;
        this.initiator = null;
        this.lastWhere = null;
        this.oidArray = [];
        this.currentFeatures = [];
        this._hideInfoWindow();
        this._clearLayers();
        this._clearRelateLayers();
        this.divSum.innerHTML = '';
        this.zoomAttempt = 0;
        this.gSelectTypeVal = 'new';
        this.aSelectTypeVal = 'new';
        this.sumResultArr = [];


        this.list.clear();
        
        html.empty(this.divResultMessage);
        
        this.drawBox.clear();
        this.garr = [];
        this.lastDrawCommonType = null;
        this.lastDrawTool = null;
        
        //jab to hide HUC12 and NavResults grids
		dojo.style(dom.byId("gridNavResults"), 'display', 'none');
		dojo.style(dom.byId("gridHUC12"), 'display', 'none');
		if (this.navHUC12Layer) 
		{
		  this.map.removeLayer(this.navHUC12Layer);
		}
		this.navHUC12Layer = null;
		if (this.navHUC8Layer) 
		{
		  this.map.removeLayer(this.navHUC8Layer);
		}
		this.navHUC8Layer = null;
		html.empty(this.clickAgainMessage);
		this.results_json = {};
		//jab-end
        
        if (closeAtt) {
          if (this.wManager && this.attTableOpenedbySearch) {
            var widgetCfg = this._getWidgetConfig('AttributeTable');
            if(widgetCfg){
              var attWidget = this.wManager.getWidgetByLabel(widgetCfg.label);
              if (attWidget) {
                attWidget._closeTable();
              }
              this.attTableOpenedbySearch = false;
            }
          }
        }
        return false;
      },

      clearbuffer: function () {
        this.garr = [];
        this.graphicsLayerBuffer.clear();
        html.setStyle(this.btnClearBuffer2, 'display', 'none');
        html.setStyle(this.btnClearBuffer3, 'display', 'none');
        return false;
      },

      buildWhereClause: function (layerIndex, expressIndex, /* optional */ theValue) {
        var myPattern = /\[value\]/g;
        var myPattern1 = /\[value1\]/g;
        var myPattern2 = /\[value2\]/g;
        var myPattern3 = /\[value\]/;
        var expr = "";
        var eVal;
        var eVal1;
        var eVal2;
        var criteriaFromValue;
        var content = theValue || this.paramsDijit.getSingleParamValues();
        if (!content || content.length === 0 || !this.config.layers.length) {
          return;
        }
        //loop though the SPs and assemble the where clause
        for (var s = 0; s < content.length; s++) {
          var tOperator = (this.config.layers[layerIndex].expressions.expression[expressIndex].values.value[s] &&
            typeof this.config.layers[layerIndex].expressions.expression[expressIndex].values.value[s].operator !== 'undefined') ? this.config.layers[layerIndex].expressions.expression[expressIndex].values.value[s].operator : 'OR';
          var tOperation = this.config.layers[layerIndex].expressions.expression[expressIndex].values.value[s].operation;
          var queryExpr = this.config.layers[layerIndex].expressions.expression[expressIndex].values.value[s].sqltext;
          if (!content[s].hasOwnProperty('value') || content[s].value === null) {
            if(!content[s].hasOwnProperty('value1') || content[s].value1 === null){
              continue;
            }
            if (content[s].value1.toString() !== "NaN" && content[s].value2.toString() !== "NaN") {
              eVal1 = content[s].value1.toString();
              eVal2 = content[s].value2.toString();
              criteriaFromValue = queryExpr.replace(myPattern1, eVal1);
              criteriaFromValue = criteriaFromValue.replace(myPattern2, eVal2);
              expr = this.AppendTo(expr, criteriaFromValue, tOperator);
              continue;
            } else {
              continue;
            }
          }

          if (tOperation === 'stringOperatorContains') {
            var sa = content[s].value.toString().split(" "), word;
            for(w=0; w < sa.length; w++){
              word = sa[w];
              criteriaFromValue = queryExpr.replace(myPattern, word);
              expr = this.AppendTo(expr, criteriaFromValue, "AND");
            }
            continue;
          }

          if (tOperation === 'dateOperatorIsOn' || tOperation === 'dateOperatorIsNotOn') {
            eVal = content[s].value.toString();
            criteriaFromValue = queryExpr.replace(myPattern3, eVal);
            criteriaFromValue = criteriaFromValue.replace(myPattern3, eVal.replace('00:00:00', '23:59:59'));
            expr = this.AppendTo(expr, criteriaFromValue, tOperator);
            continue;
          } else if (tOperation === 'dateOperatorIsAfter') {
            eVal = content[s].value.toString();
            criteriaFromValue = queryExpr.replace(myPattern, eVal.replace('00:00:00', '23:59:59'));
            expr = this.AppendTo(expr, criteriaFromValue, tOperator);
            continue;
          }

          if (queryExpr === "[value]" || queryExpr.toLowerCase().indexOf(" in (") > 0) {
            //meaning an open SQL expression or an SQL with an IN Statement
            eVal = content[s].value.toString();
          } else {
            eVal = content[s].value.toString().replace(/'/g, "''");
          }

          /*If the expression is an IN Statement and the the value is a string then
          replace the user defines comma seperated values with single quoted values*/
          if (queryExpr.toLowerCase().indexOf(" in (") > 0 && queryExpr.toLowerCase().indexOf("'[value]'") > -1) {
            //replace the begining and trailing single qoutes if they exist
            eVal = eVal.replace(/^'|'$/g, "").replace(/,|','/g, "','");
          }

          if (content[s].value.toString().toLowerCase().trim() === "all") {
            var mExpr;
            if (queryExpr.indexOf("=") > -1) {
              mExpr = queryExpr.replace("=", "IN(") + ")";
            } else {
              mExpr = queryExpr;
            }
            var uList = this.config.layers[layerIndex].expressions.expression[expressIndex].values.value[s].userlist;
            var myPat;
            var uaList;
            if (uList.indexOf("','") > -1) {
              myPat = /,\s*'all'/gi;
              uList = uList.replace(myPat, "");
              uaList = this.trimArray(uList.split("','"));
              if (String(uaList[0]).substring(0, 1) === "'") {
                uaList[0] = String(uaList[0]).substring(1);
              }
              var lVal = String(uaList[uaList.length - 1]);
              if (lVal.substring(lVal.length - 1) === "'") {
                uaList[uaList.length - 1] = lVal.substring(0, lVal.length - 1);
              }
            } else {
              myPat = /,\s*all/gi;
              uList = uList.replace(myPat, "");
              uaList = this.trimArray(uList.split(","));
            }

            if (mExpr.indexOf("'[value]'") > -1) {
              uList = uaList.join("','");
            }
            criteriaFromValue = mExpr.replace(myPattern, uList);
            expr = this.AppendTo(expr, criteriaFromValue, tOperator);
          } else if (content[s].value.toString().toLowerCase() === "allu") {
            expr = this.AppendTo(expr, "1=1", tOperator);
          } else if (content[s].value.toString().toLowerCase() === "null" || content[s].value.toString().toLowerCase() === "nan"){
            //console.info(content[s].value.toString().toLowerCase());
            if (content[s].isValueRequired === true){
              var mExpr2 = queryExpr.substr(0, queryExpr.indexOf("=")) + " is null";
              expr = this.AppendTo(expr, mExpr2, tOperator);
            }
          } else {
            //don't add the expression if there is no user input
            if (eVal !== "") {
              criteriaFromValue = queryExpr.replace(myPattern, eVal);
              expr = this.AppendTo(expr, criteriaFromValue, tOperator);
            }
            //unless we are using isblank or notisblank
            if (tOperation === 'stringOperatorIsBlank' ||
                tOperation === 'stringOperatorIsNotBlank' ||
                tOperation === 'numberOperatorIsBlank' ||
                tOperation === 'numberOperatorIsNotBlank' ||
                tOperation === 'dateOperatorIsBlank' ||
                tOperation === 'dateOperatorIsNotBlank') {
              expr = this.AppendTo(expr, queryExpr, tOperator);
            }
          }
        }
        return expr;
      },

      AppendTo: function (string1, string2, operator) {
        if (string1.length > 0) {
          return string1 + " " + operator + " " + string2;
        } else {
          return string2;
        }
      },

      trimArray: function (arr) {
        for (var i = 0; i < arr.length; i++) {
          arr[i] = arr[i].replace(/^\s*/, '').replace(/\s*$/, '');
        }
        return arr;
      },

      zoomall: function () {
        var layerConfig = this.config.layers[this.currentLayerIndex];
        var zoomScale = layerConfig.zoomScale || 10000;
        if (!this.currentLayerAdded) {
          return false;
        }
        if (this.currentLayerAdded.graphics.length === 1 && this.currentLayerAdded.graphics[0].geometry.type === "point") {
          var mp = this.currentLayerAdded.graphics[0].geometry;
          this.map.setScale(zoomScale);
          this.map.centerAt(mp);
        } else {
          if (this.currentLayerAdded.graphics.length === 0) {
            if (this.zoomAttempt <= 10) {
              setTimeout(lang.hitch(this, function () {
                this.zoomall();
              }), 300);
              this.zoomAttempt++;
            } else {
              this.zoomAttempt = 0;
              new Message({
                titleLabel: this.nls.warning,
                message: this.nls.zoomErrorMessage
              });
            }
          }
          var gExt = graphicsUtils.graphicsExtent(this.currentLayerAdded.graphics);
          if (gExt)
          {
        	//jab was .9 changed to 1 - which means it used to zoom in, now it does no zooming
            this.map.setExtent(gExt.expand(1), true);
            //jab-end
          } 
          else {
            var mp2 = this.currentLayerAdded.graphics[0].geometry;
            this.map.setScale(zoomScale);
            this.map.centerAt(mp2);
          }
        }
        return false;
      },

      _clearLayers: function () {
        this._removeAllResultLayers();
      },

      _clearRelateLayers: function () {
        this._removeAllRelateLayers();
      },

      _onSearchError: function (error) 
      {
        // clear up environment if the search crashes
    	this.clear();
      
        html.setStyle(this.progressBar.domNode, 'display', 'none');
        //html.setStyle(this.divOptions, 'display', 'block');
        new Message({
          message: this.nls.searchError
        });
        console.debug(error);
      },

      _substitute: function (string, Attribs, currentLayer) {
        var lfields = this._getFieldsfromLink(string);
        for (var lf = 0; lf < lfields.length; lf++) {
          if (Attribs[lfields[lf]]) {
            var fld = this._getField(currentLayer, lfields[lf]);
            if (fld.type === "esriFieldTypeString") {
              string = string.replace(new RegExp('{' + lang.trim(lfields[lf]) + '}', 'g'), lang.trim(Attribs[lfields[lf]]));
            } else {
              string = string.replace(new RegExp('{' + lang.trim(lfields[lf]) + '}', 'g'), Attribs[lfields[lf]]);
            }
          }
        }
        return string;
      },

      _getFieldsfromLink: function (strLink) {
        var retArr = [];
        var b1 = 0;
        var e1 = 0;
        var fldName = '';
        do {
          b1 = strLink.indexOf("{", e1);
          if (b1 === -1) {
            break;
          }
          e1 = strLink.indexOf("}", b1);
          fldName = strLink.substring(b1 + 1, e1);
          retArr.push(fldName);
        } while (e1 < strLink.length - 1);
        return retArr;
      },

      _getAllLyrFields: function(){
        var tempFlds = array.filter(this.resultLayers[this.currentLayerIndex].fields, lang.hitch(this, function (fieldInfo) {
          return fieldInfo.type !== 'esriFieldTypeGeometry';
        }));
        return tempFlds;
      },

	/*************************************************************************************************
	 * 
	 * 
	 * jab here is the start of inserting the navigation code into the main Objects list of functions.  
	 * 
	 * 
	 *************************************************************************************************/
	initHUC12Grid: function ()
	{
		this.g_gridHUC12 = new DataGrid({
			visibility: "hidden",
			autoHeight:true,
			selectable: true,
            canSort: function(){return false},
			structure: [
	        {name:"HUC12", field:"HUC12", width: "120px"},
	        {name:"HUC12 Name", field:"HU_12_Name", width: "249px"},
	        ]
		}, "gridHUC12");
		this.g_gridHUC12.startup();
	    dijit.byId('gridHUC12').resize();
	    dojo.style(dom.byId("gridHUC12"), 'display', 'none');
	},
	
	initNavigationGrid: function ()
	{
		this.g_gridNavResults = new DataGrid({
			visibility: "hidden",
			autoHeight:true,
			selectable: true,
            canSort: function(){return false},
			structure: [
	        {name:"Attribute", field:"key", width: "175px"},
	        {name:"Value", field:"value", width: "194px"},
	        ]
		}, "gridNavResults");
		this.g_gridNavResults.startup();
	    dijit.byId('gridNavResults').resize();
	    dojo.style(dom.byId("gridNavResults"), 'display', 'none');
	},
	initAttributeGrid: function()
	{
		this.gridAttributeResults = new DataGrid({
			visibility: "hidden",
			autoHeight:true,
			selectable: true,
            canSort: function(){return false},
			structure: [
	        {name:"Indicator", field:"key", width: "150px"},
	        {name:"Value", field:"value", width: "278px"},
	        ]
		}, "gridAttributeResults");
		this.gridAttributeResults.startup();
	    dijit.byId('gridAttributeResults').resize();
	    dojo.style(dom.byId("gridAttributeResults"), 'display', 'none');
	},
	label_huc12s: function (results_features) 
	{
		var that = this;
		array.forEach(results_features, function(feat)
			{
				if (! that.results_json.hasOwnProperty('huc12'))
				{
					that.results_json.huc12 = [];
				}
				
				that.results_json.huc12.push({
					'HUC12' : feat.attributes.HUC_12, 'HU_12_Name' : feat.attributes.HU_12_Name
				});
				
				var huc12_tx = feat.attributes.HUC_12 + 
					(feat.attributes.HU_12_Name !== undefined ? " HUC12_NAME:" + feat.attributes.HU_12_Name : '');

				that.add_label(feat.geometry.getExtent().getCenter(), huc12_tx)
				
			})
	},
	
	navigate_upstream: function(results)
	{

		var that = this;
		
		var featureAttributes = results.features[0].attributes;
		var huc_id = featureAttributes["HUC_12"];
		this.results_json = {};
		
		// select the HUC12 Map Server based on the user selection
		// note: if the 'Select HUC12 Map Server' UI element is commented out
		//       then the default will be set (below)
		var noptions = document.getElementsByName("huc12_mapserver")
		if (noptions.length > 0)
		{
			var huc12_mapserver_tag = '';
			for (i=0; i < noptions.length; i++)
			{
				if (noptions[i].checked == true)
				{
					huc12_mapserver_tag = noptions[i].value;
				}
			}
			if (huc12_mapserver_tag == 'WatersGEO')
			{
				this.huc12_mapserver = this.watersgeo_huc12_mapserver
			}
			else
			{
				this.huc12_mapserver = this.enviroatlas_huc12_mapserver
			}
		}
		else
		{
			this.huc12_mapserver = this.watersgeo_huc12_mapserver
		}
		
		this.qtHUC12 = new QueryTask(this.huc12_mapserver);
		this.qHUC12 = new Query();
		this.qHUC12.returnGeometry = true;
		this.qHUC12.outFields = ["HUC_12"];
		
		// query task and query for HUC8
		this.qtHUC8 = new QueryTask(this.huc8_mapserver);
		this.qHUC8 = new Query();	
		this.qHUC8.returnGeometry = true;
		this.qHUC8.outFields  = [ "*" ];
		

		
		// create the place to put the results of the navigation - use the 'divSum'
		// which is otherwise not used
		html.addClass(this.list.domNode, 'sum');
		html.setStyle(this.divSum, 'display', '');
		
		if (! this.results_json.hasOwnProperty('huc12'))
		{
			this.results_json.huc12 = [];
		}
		
		this.results_json.huc12.push({
			'HUC12' : huc_id, 
			'HU_12_Name' : featureAttributes["HU_12_Name"]
		});

		var navigation_direction = 'Upstream';
        var noptions = document.getElementsByName("navigation_direction");
        //var direction = '';
        for (i=0; i < noptions.length; i++)
        {
            if (noptions[i].checked === true)
            {
                navigation_direction = noptions[i].value;
                break;
            }
        }

		/*
		 * call to get HUC12 Upstream navigation results - This is a REST service - NOT GIS
		 */
		// url: navigator_url + '/huc/' + huc_id + '/' + navigation_direction.toLowerCase() + '/?format=json&summary_data=true',
                    //TODO: progressBar
            html.setStyle(this.progressBar.domNode, 'display', '');
            this.progressBar.domNode.innerText = "starting " + this.navigator_url + " search!"
		var request = esriRequest({
				url: this.navigator_url + '/huc/' + huc_id + '/' + navigation_direction.toLowerCase() + '/',
				content: {
					format: 'json',
					summary_data: 'true'
				},
				handleAs: "json"
			});
		
		html.setStyle(this.progressBar.domNode, 'display', 'block');

		if (navigation_direction.toUpperCase() == 'UPSTREAM')
		{
			request.then(
					function(data)   { that.upstreamNavigationSucceeded(data) },
					function(reason) { that.navigationFailed }
			);
		}
		else
		{
			request.then(
					function(data)   { that.downstreamNavigationSucceeded(data) },
					function(reason) { that.navigationFailed }
			);
		}
	},
	
	withinMyHUC8_slice: function(ids, max_count_nu, target_huc_id)
	{
		if (ids.length <= max_count_nu)
		{
			return ids
		}

		var returned_ids = [];
		
		//
		// return HUC12s that are in the same huc8 as the 'target' huc, up to a maximum number of HUC12s
		//
		for (var idx in ids)
		{
			id = ids[idx];
		
			if (id.slice(0, 8) == target_huc_id.slice(0, 8))
			{
				returned_ids.push(id);
				
				if (returned_ids.length == max_count_nu)
				{
					break;
				}
			}
		}
		return (returned_ids);
	},
	closest_slice: function(ids, max_count_nu, target_huc_id)
	{
		if (ids.length <= max_count_nu)
		{
			return ids;
		}

		var returned_ids = [];
		
		// this loop gets the hucs that most look like the 'target' huc (the one the user clicked)
		// it is superceded by the one above it
		for (i = 0; i < target_huc_id.length; i++)
		{
			for (var idx in ids)
			{
				id = ids[idx];
			
				if (id.slice(0, 12 - i) == target_huc_id.slice(0, 12 - i))
				{
					console.log('matched id==' + id.slice(0, 12 - i) + ' for target_huc_id==' + target_huc_id);
				
					returned_ids.push(id);
					if (returned_ids.length == max_count_nu)
					{
						break;
					}
				}
			}
			if (returned_ids.length == max_count_nu)
			{
				break;
			}
		}
		return (returned_ids);
	},
	

	
	//
	// this is using 'data' - the results of the REST query - NOT ArcGIS
	//
	upstreamNavigationSucceeded: function(data) 
	{
		this.divNavigationMessages.innerHTML = '';
		this.hu12_headwater_list = [];

		var that = this;

		var promises;

		huc_json = this.results_json.huc12;
		huc_json.pop();
		
		//data['huc8'] = data.huc12.value.substring(0, 8);
		
		var deferred_queries = [ ];

        if (data.navigation_data == null){
            this.tableNavigationResults(data);

            // if this is a terminal huc or a headwater huc, change the symbol
            //TODO: figure out how to make sure I'm changing the right graphic
            // - should use an ID of some kind
            if (data.hu_data.headwater_bool == true){
                that.map.graphics.graphics[1].symbol = that.huc12_headwater_symbol();
                that.map.graphics.refresh();
            }
            else if (data.hu_data.terminal_bool == true){
                that.map.graphics.graphics[1].symbol = that.huc12_terminal_symbol();
                that.map.graphics.refresh();
            }



            // show grid
            dojo.style(dom.byId("gridNavResults"), 'display', '');
            // NProgress.done();
            //TODO: progressBar
            html.setStyle(this.progressBar.domNode, 'display', 'none');
            // alert("Error: There are no navigation results for the selected HU");
            return;
        }
        if (data.navigation_data.results.hasOwnProperty('Error')){


            alert("Error: " + data.navigation_data.results.Error);
            return;
        }
        var hu12_list = data.navigation_data.results.hu12_data.hu12_list;
        this.hu12_for_recompute = [];
        huc12_ids_len = hu12_list.length;

        if (huc12_ids_len > 0)
        {

            html.setStyle(this.progressBar.domNode, 'display', '');
            this.progressBar.domNode.innerText = "done " + this.navigator_url + " search. Found " + huc12_ids_len.toString() + " h12s. Starting ArcGIS Query";


            //todo: check that it exists
            var huc_code_index_nu = data.navigation_data.results.hu12_data.fields.huc_code;

            //ibid
            var headwater_index_nu = data.navigation_data.results.hu12_data.fields.headwater_bool;

            // the rest service returns a list of the HUC12s called 'huc12_ids' (using NHD terminology)
            //var huc12_ids = data.huc12_ids;

            // huc12_ids_len = data.us_huc12_ids.value.length;

            // get a list of the HUC8s for HUC12s that were found - these will be shown on the map
            var huc8_ids = [];
            array.forEach(hu12_list, function(hu12_tuple)
            {
                huc12_id = hu12_tuple[huc_code_index_nu];
                that.hu12_for_recompute.push(huc12_id);

                if (headwater_index_nu > -1
                    && hu12_tuple[headwater_index_nu] == true
                    && that.hu12_headwater_list.indexOf(huc12_id) === -1)
                {
                    that.hu12_headwater_list.push(huc12_id)
                }

                var huc8_id = huc12_id.substring(0, 8);

                if (huc8_ids.indexOf(huc8_id) === -1)
                {
                    huc8_ids.push(huc8_id)
                }
            });
            data['upstream_huc8_count_nu'] = {};
            data['upstream_huc8_count_nu']['value'] = huc8_ids.length;

            console.log("there are " + huc12_ids_len + " HUC12s and " + huc8_ids.length + " HUC8s upstream");

            // now send off the HUC12 query again, this time with a list of all HUC8s just created
            // there is a limit of how many huc12_ids can be included.  it might be line length of the query
            // it seems that the magic number is 90
            var huc12_ids = []
            var deferred_queries = [ ];
            //TODO check it exists
            var huc_code_index_nu = data.navigation_data.results.hu12_data.fields.huc_code;

            if (dom.byId("show_all_huc12").checked)
            {
                //huc12_ids =	closest_slice(data.us_huc12_ids.value, 90, data.huc12.value);

                var i,j,temparray,chunk = 90;
                for (i=0,j=huc12_ids_len; i<j; i+=chunk)
                {
                    temparray = hu12_list.slice(i,i+chunk);


                    var hu12s = []
                    array.forEach(temparray, function(hu12_tuple) {
                        var hc12_id = hu12_tuple[huc_code_index_nu];
                        hu12s.push(hc12_id);
                    });

                    // do whatever
                    var query12 = new Query();
                    query12.where = "HUC_12 in ('" + hu12s.join("','") + "')";
                    query12.returnGeometry = true;
                    query12.outFields  = [ "*" ];

                    that.qtHUC12 = new QueryTask(this.huc12_mapserver);
                    var exHUC12 = that.qtHUC12.execute(query12);

                    deferred_queries.push(exHUC12);
                }
                console.log("running " + deferred_queries.length + " HUC12 GIS queries");
            }
            else // this is for 'show hu8s only
            {
                huc12_ids = carefully_slice(hu12_list, 90, data.hu_data.huc_code);
                var hu12s = []
                array.forEach(temparray, function(hu12_tuple) {
                    var hc12_id = hu12_tuple[huc_code_index_nu];
                    hu12s.push(hc12_id);
                });

                var query12 = new Query();
                query12.where = "HUC_12 in ('" + hu12s.join("','") + "')";
                query12.returnGeometry = true;
                query12.outFields  = [ "HUC_12,HU_12_Name" ];

                that.qtHUC12 = new QueryTask(this.huc12_mapserver);
                exHUC12 = that.qtHUC12.execute(query12);

                deferred_queries.push(exHUC12);
            }
            var huc12_queries_count = deferred_queries.length;

            if (huc8_ids.length > 0) //  & ! dom.byId("termsCheck").checked)
            {
                var query8 = new Query();
                query8.where = this.huc8_field_nm + " in ('" + huc8_ids.join("','") + "')";
                query8.returnGeometry = true;
                query8.outFields  = [ "*" ];

                that.qtHUC8 = new QueryTask(this.huc8_mapserver);
                exHUC8 = that.qtHUC8.execute(query8);

                deferred_queries.push(exHUC8);
            }
            promises = all(deferred_queries);

            console.time("ArcGIS Query");
			promises.then(
					function(data) { that.handleUpstreamNavigationQueryResults(data) }
				);

            t0 = performance.now();
            console.log("++ gis queries started. " + huc12_queries_count + " HUC12 and 1 HUC8 upstream queries");
        }
        else
        {
            this.progressBar.domNode.innerText = "done " + this.navigator_url + " search. Failed to find HU12"
            var query12 = new Query();
            query12.where = "HUC_12 = '" + data.huc12 + "'";
            query12.returnGeometry = true;
            query12.outFields  = [ "*" ];

            that.qtHUC12 = new QueryTask(this.huc12_mapserver);
            exHUC12 = that.qtHUC12.execute(query12);
            promises = all([ exHUC12 ]); //

            console.time("ArcGIS Query");
			promises.then(
					function(data) { that.handleUpstreamNavigationQueryResults(data) }
				);

            console.log("running single HUC12 Upstream queries");
        }
        huc_json.push({'NAVIGATION_RESULTS': data });

        this.tableNavigationResults(data);
        // show grid
        dojo.style(dom.byId("gridNavResults"), 'display', '');
        //dojo.style(dom.byId("gridAttributeResults"), 'display', '');

        this.results_json.huc12 = huc_json;
        if (this.featHUC12 == null || this.featHUC12.length == 1)
        {
            this.results_json.huc12.push('GETTING GIS RESULTS <img src=/wbdmap/images/hourglass.gif />');
        }
        str = 'JSON: ' + JSON.stringify(this.results_json, null, 4);

        this.divNavigationMessages.innerHTML = '';
        dom.byId("NavigateErrorMessage").innerHTML = '';
    },


	numberWithCommas(x) {
        var parts = x.toString().split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return parts.join(".");
    },
	//
	// handle the ArcGIS Map Service query results of the upstream navigation.
	//
	handleUpstreamNavigationQueryResults: function(Qresults)
	{
		console.timeEnd("ArcGIS Query");
        this.progressBar.domNode.innerText = "Done ArcGIS Query.  Rendering";

		console.time("ArcGIS Display Results");
		
		var that = this;
		
		if (this.navHUC12Layer) 
		{
		  this.map.removeLayer(this.navHUC12Layer);
		}
		this.navHUC12Layer = null;
		if (this.navHUC8Layer) 
		{
		  this.map.removeLayer(this.navHUC8Layer);
		}
		this.navHUC8Layer = null;
		
		//new a feature layer
		var layerHUC12Info = {
			"type" : "Feature Layer",
			"description" : "",
			"definitionExpression" : "",
			"name": window.NavHuc12LayerTitle,
			"geometryType": "esriGeometryPolygon",
			"objectIdField": "ObjectID",
			"drawingInfo": {
				"renderer": {
			    "type": "classBreaks",
			    "field": "ObjectID",
			    "minValue": 1,
			    "classBreakInfos": [
			      {
			        "symbol": this.huc12_symbol(),
			        "label": "HUC12",
			        "classMaxValue": 2
			      },
			            {
			        "symbol": this.huc12_headwater_symbol(),
			        "label": "HUC12 HEADWATER",
			        "classMaxValue": 3
			      }
			    ]
			  }
			},
			"fields": [
				{
					"name": "HUC_12",
					"alias": "HUC12 ID",
					"type": "esriFieldTypeString"
				},
				{
					"name": "HU_12_Name",
					"alias": "HUC12 Name",
					"type": "esriFieldTypeString"
				}						
				]
		};

		// HUC12 layer is always shown because the bottom-most HUC12s need to be 
		// displayed
		var featureHUC12Collection = {
				layerDefinition: layerHUC12Info,
				featureSet: null
		};
		this.navHUC12Layer = new FeatureLayer(featureHUC12Collection);
//		this.navHUC12Layer.name = "Navigated HUC12 Subwatershed";
		this.map.addLayer(this.navHUC12Layer);

		
		//new a feature layer
		var layerHUC8Info = {
			"type" : "Feature Layer",
			"description" : "",
			"definitionExpression" : "",
			"name": window.NavHuc8LayerTitle,
			"geometryType": "esriGeometryPolygon",
			"objectIdField": "ObjectID",
			"drawingInfo": {
				"renderer": {
					"type": "simple",
					"label": "HUC8",
					"description" : "Watershed",
					"symbol": this.huc8_symbol()
				}
			},
			"fields": [
				{
					"name": this.huc8_id_field_name,
					"alias": "HUC8 ID",
					"type": "esriFieldTypeString"
				},
				{
					"name": "HU_8_NAME",
					"alias": "HUC8 Name",
					"type": "esriFieldTypeString"
				},		
				]
		};

		var featureHUC8Collection = {
				layerDefinition: layerHUC8Info,
				featureSet: null
		};
		this.navHUC8Layer = new FeatureLayer(featureHUC8Collection);
//		this.navHUC8Layer.name = "Navigated HUC8 Subbasin";
		
		huc_json = this.results_json.huc12;
		huc_json.pop();
		
		dom.byId("results").innerHTML = '';
		
		if (!Qresults[0].hasOwnProperty("features"))
		{
			console.log("exHUC12 query failed.");
		}
		
		if (Qresults.length > 1)
		{
			if (! Qresults[Qresults.length - 1].hasOwnProperty("features"))
			{
				console.log("exHUC8s query failed.");
			}
			else if (dom.byId("showAllHUC12") == null || ! dom.byId("showAllHUC12").checked)
			{
				this.map.addLayer(this.navHUC8Layer);
				
				this.featHUC8 = Qresults[Qresults.length - 1].features;

				this.map.setExtent(graphicsUtils.graphicsExtent(this.featHUC8));
				
				array.forEach(this.featHUC8, function(feat)
				{
					feat.setSymbol(that.huc8_symbol());
					
					that.navHUC8Layer.add(feat);
				});
			}
		}
		else
		{
			that.featHUC12 = Qresults[0].features;

			this.map.setExtent(graphicsUtils.graphicsExtent(that.featHUC12));
		}
		
		// remove all the previous navigation results
		this.map.graphics.clear();
		
		html.empty(this.divResultMessage);
		
		// this adds each chunked query (for example 90 HUC12s) to the navHUC12Layer map
		// so it might run a bunch of times  It also could run for navHUC8Layer
		//
        var huc12_feature_count = 0;
		array.forEach(Qresults, function(featureSet)
		{
			if (featureSet.hasOwnProperty('features') 
				& featureSet.features[0].attributes.hasOwnProperty('HUC_12') == true)
			{
				for (i=0; i < featureSet.features.length; i += 1) 
				{
					huc12_feature_count += 1;

					var sym = that.huc12_symbol();
					var huc12_field_nm = 'HUC_12';

					var huc_code = featureSet.features[i]['attributes'][huc12_field_nm];

					if (that.hu12_headwater_list.includes(huc_code)){
						sym = that.huc12_headwater_symbol();
					}

					featureSet.features[i].setSymbol(sym);
	
					that.navHUC12Layer.add(featureSet.features[i]);
				}

			}
			else if (featureSet.hasOwnProperty('features') 
				& featureSet.features[0].attributes.hasOwnProperty('HUC_12') == false)
			{
				for (i=0; i < featureSet.features.length; i += 1) 
				{
					featureSet.features[i].setSymbol(that.huc8_symbol());
	
					that.navHUC8Layer.add(featureSet.features[i]);
				}
			}
		});
		
		// set the extent to the union of the navHUC12 and navHUC8 layers
		var navHUC12Extent = graphicsUtils.graphicsExtent(this.navHUC12Layer.graphics).expand(1.2);
		if (this.navHUC8Layer.graphics.length > 0)
		{
			navHUC12Extent = navHUC12Extent.union(graphicsUtils.graphicsExtent(this.navHUC8Layer.graphics).expand(1.2));
		}
		this.map.setExtent(navHUC12Extent);

		//console.log("Upsteam HUC12 features added to map");
		
		html.setStyle(this.progressBar.domNode, 'display', 'none');
		
		// put the users click point back on the map
		this.add_click_point_graphic(this.map_click_point);
		
		console.timeEnd("ArcGIS Display Results");
	},

    //
    // Search using a HU12 code
    //
    executeHUCSearch: function (huc_code)
	{
		var exHUC12, exHUC8, promises;

		// to hide grid
		dojo.style(dom.byId("gridNavResults"), 'display', 'none');
		dojo.style(dom.byId("gridAttributeResults"), 'display', 'none');

		this.results_json = {};
		
		// add_click_point_graphic(map_click_point);
		dojo.style(dom.byId("gridHUC12"), 'display', 'none');


		// use the 'map_click_pointGeom' for the initial query
		if (huc_code.length == 8)
		{
			this.qHUC12.where = this.huc8_field_nm + "  = '" + huc_code + "'";

		}
		else
		{
			this.qHUC12.where = this.huc12_field_nm + "  LIKE '" + huc_code + "%'";
		}

		this.qHUC8.where = this.huc8_field_nm + "  = '" + huc_code.substr(0, 8) + "'";

		this.exHUC12 = this.qtHUC12.execute(this.qHUC12);

		this.exHUC8  = this.qtHUC8.execute(this.qHUC8);

		// send these off for processing
		promises = all([ this.exHUC12 ]); // , exHUC8

		// promises.then(handleQueryResults);
        var that = this;
        promises.then(
                function(data) { that.handleUpstreamNavigationQueryResults(data) }
            );


		console.log("++++ user entered huc_code. running initial HUC12 query ++++");
	},
	//
	// this is using 'data' - the results of the REST query - NOT ArcGIS
	//
	downstreamNavigationSucceeded: function (data) 
	{
		var that = this;
		
        //NProgress.done();
        huc_json = this.results_json.huc12;
        huc_json.pop();

        var hu12_index_nu = '';
        var hu12_list = [];


        if (data.navigation_data !== null)
        {
            var hu12_index_nu = data.navigation_data.results.hu12_data.fields.huc_code;
            var hu12_list = data.navigation_data.results.hu12_data.hu12_list;
        }
		
		this.hu12_for_recompute = [];
        huc12_ids_len = hu12_list.length;
        if (huc12_ids_len > 0)
        {


            // get a list of the HUC8s for HUC12s that were found - these will be shown on the map
            var huc8_ids = [];
            array.forEach(hu12_list, function(hu12_tuple)
            {
                var hu12_id = hu12_tuple[hu12_index_nu];
                that.hu12_for_recompute.push(hu12_id);

                var huc8_id = hu12_id.substring(0, 8);
                // don't add the HUC8 that contains the user clicked HUC12
                if (huc8_id == data.hu_data.huc_code.substring(0, 8))
                {
                    return;
                }
                if (huc8_ids.indexOf(huc8_id) === -1)
                {
                    huc8_ids.push(huc8_id)
                }
            });
            // data['downstream_huc8_count_nu']['value'] = huc8_ids.length;

            // now send off the HUC12 query again, this time with a list of all HUC8s just created
            // there is a limit of how many huc12_ids can be included.  it might be line length of the query
            // it seems that the magic number is 90
            var huc12_ids = []
            var deferred_queries = [ ];


                //huc12_ids =	closest_slice(data.us_huc12_ids.value, 90, data.huc12.value);

            var i,j,temparray,chunk = 90;
            for (i=0,j=huc12_ids_len; i<j; i+=chunk)
            {
                temparray = hu12_list.slice(i,i+chunk);

                var hu12s = []
                array.forEach(temparray, function(hu12_tuple) {
                    hu12s.push(hu12_tuple[hu12_index_nu]);
                });

                var query12 = new Query();
                query12.where = "HUC_12 in ('" + hu12s.join("','") + "')";

                query12.returnGeometry = true;
                query12.outFields  = [ "*" ];

                this.qtHUC12 = new QueryTask(this.huc12_mapserver);
                var exHUC12 = this.qtHUC12.execute(query12);

                deferred_queries.push(exHUC12);
            }




            //TODO maybe we dont need the hu8s on downstream
            if (huc8_ids.length > 0) //  & ! dom.byId("termsCheck").checked)
            {
                // var query8 = new Query();
                // query8.where = "HUC_8 in ('" + huc8_ids.join("','") + "')";
                // query8.returnGeometry = true;
                // query8.outFields  = [ "*" ];
                //
                // app.qtHUC8 = new QueryTask(huc8_mapserver);
                // exHUC8 = app.qtHUC8.execute(query8);
                //
                // deferred_queries.push(exHUC8);
            }
            promises = all(deferred_queries);

            console.time("ArcGIS Query");

            // promises.then(this.handleUpstreamNavigationQueryResults);
			promises.then(
					function(data) { that.handleUpstreamNavigationQueryResults(data) }
				);
            console.log("running " + deferred_queries.length + " HUC12 Downstream GIS queries");
        }
        else
        {
            var query12 = new Query();
            query12.where = "HUC_12 = '" + data.huc12 + "'";
            query12.returnGeometry = true;
            query12.outFields  = [ "*" ];

            this.qtHUC12 = new QueryTask(this.huc12_mapserver);
            exHUC12 = this.qtHUC12.execute(query12);
            promises = all([ exHUC12 ]); //

            console.time("ArcGIS Query");
            // promises.then(this.handleUpstreamNavigationQueryResults);
			promises.then(
					function(data) { that.handleUpstreamNavigationQueryResults(data) }
				);
            console.log("running single HUC12 Downstream queries");
        }
        huc_json.push({'NAVIGATION_RESULTS': data });

        this.tableNavigationResults(data);
        // show grid
        dojo.style(dom.byId("gridNavResults"), 'display', '');
        //dojo.style(dom.byId("gridAttributeResults"), 'display', '');

        this.results_json.huc12 = huc_json;

        if (this.featHUC12 == null || this.featHUC12.length == 1)
        {
            this.results_json.huc12.push('GETTING GIS RESULTS <img src=/wbdmap/images/hourglass.gif />');
            if (data.hu_data.terminal_bool == true){
                that.map.graphics.graphics[1].symbol = this.huc12_terminal_symbol();
                that.map.graphics.refresh();
            }
        }
        str = 'JSON: ' + JSON.stringify(this.results_json, null, 4);

        dom.byId("NavigationMessages").innerHTML = '';
        dom.byId("NavigateErrorMessage").innerHTML = '';
	},
	
	navigationFailed: function(error) 
	{
		console.log("HUC12 Navigation Failed: ", error.message);
		this.results_json['HUC12_Navigation'] = {'NAVIGATION_FAILED': error.message};
	},
	
	
	populate_gridHUC12: function(data)
	{
		// create an object store
		var results_data = [];
		for (var i in data.huc12)
		{
			values = data.huc12[i];
			
			if (values.hasOwnProperty('HUC12'))
			{
				
				results_data.push(values);
			}
		}
		var objectStore = new Memory({
			data: results_data
		});
		gridStore = new dojo.data.ObjectStore({objectStore: objectStore});
		this.g_gridHUC12.store = gridStore;
		
		//hide the list of selected HUC12s created by eSearch
		html.setStyle(this.listDiv, 'display', 'none');
		
		this.g_gridHUC12.render();
		dojo.style(dom.byId("gridHUC12"), 'display', '');
		dijit.byId('gridHUC12').resize();
	},
		
	populate_gridNavResults: function (data)
	{
		// things are formatted in the REST service - but this is setting the contents and order
		attribute_list = [
			 'area_sq_km', 
			 'water_area_sq_km', 
			 'upstream_count_nu', 
			 'downstream_count_nu', 
			 'us_area_sq_km', 
			 'ds_area_sq_km',
			 'us_water_area_sq_km', 
			 'ds_water_area_sq_km', 
			 'huc8', 
			 'upstream_huc8_count_nu',
			 'downstream_huc8_count_nu'
			];

		var results_data = [];
		attribute_list.forEach(function(key) {
			if (data.hasOwnProperty(key))
			{
				result_data = data[key];
				
				value_display = result_data['value'];

				if (result_data.hasOwnProperty('units'))
				{
					value_display = value_display + ' ' + result_data['units']
				}
				results_data.push({'key': result_data['name'], 'value': value_display});
			}
		});

		// create an object store
		var objectStore = new Memory({
			data: results_data
		});
		results2Store = new dojo.data.ObjectStore({objectStore: objectStore});
		this.g_gridNavResults.store = results2Store;

		// show grid
		this.g_gridNavResults.render();
		dojo.style(dom.byId("gridNavResults"), 'display', '');
		dijit.byId('gridNavResults').resize();
	},
	//jab new

    navAttributeLabel(label_tx) {
		switch (label_tx){
			case 'headwater_bool':
				return "Is Headwater?";
			case 'terminal_bool':
				return "Is Terminal?";
			case 'hu12_count_nu':
				return "HU12 Upstream Count";
			case 'headwater_bool':
				return "Is Headwater?";
			case 'area_sq_km':
				return "Area (km2)";
			case 'water_area_sq_km':
				return "Water Area (km2)";
			case 'distance_km':
				return "Upstream Stream Length (km)";
			case 'headwater_count_nu':
				return  "HU12 Headwater Count";
			case 'terminal_huc12_ds':
				return "Terminal HU12";
			case 'terminal_huc12_ds_name':
				return "Terminal HU12 Name";
			case 'terminal_hu12_ds_count_nu':
				return  "HU12 Downstream Count";
			case 'outlet_type':
				return  "Terminal HU12 Type";
			case 'outlet_type_code':
				return  "Terminal HU12 Type Code";
			default:
				return label_tx;
		}
	},

    tableNavigationResults(data)
	{
	    var that = this;
		/*

		TODO: change this to a list, and show the title text.  Also include links to download metatadata
		i.e.
		* US EPA Metrics 2016 Download (metadata)


		 */
		if (data.hasOwnProperty('navigation_data')
			&& data.navigation_data !== null
			&& data.navigation_data.hasOwnProperty('download')){
			//TODO: use the data structures for this, don't hardwire it
			var download_list = [
				['download_metrics2016', 'Metrics 2016', data.navigation_data.download.metrics2016.url, data.navigation_data.download.metrics2016.title],
				['download_metrics2017', 'Metrics 2017', data.navigation_data.download.metrics2017.url, data.navigation_data.download.metrics2017.title],
				['download_geography', 'Geography', data.navigation_data.download.geography.url, data.navigation_data.download.geography.title],
				['download_attributes', 'Navigation', data.navigation_data.download.download.url, data.navigation_data.download.download.title],
				['permalink', 'Permalink', data.navigation_data.download.permalink.url, data.navigation_data.download.permalink.title],

				['api_downstream', 'API Downstream', data.hu_data.resources.downstream.url, data.hu_data.resources.downstream.title],
				['api_upstream', 'API Upstream', data.hu_data.resources.upstream.url, data.hu_data.resources.upstream.title],
				//TODO: 'download' should also be called 'resources' - they are downloadable resources
			]
			download_list.forEach(function(item) {
				var function_tx = 'target="_api"';
				var id = item[0];
				var metadata_button_label = 'Metadata';
				//TODO: figure out how to get this URL correct
				var wbd_app_alias = '/wbd';
				var metadata_url = wbd_app_alias + '/metadata/' + id;
				if (id == 'permalink'){
					metadata_button_label = "-- Copy --";
					function_tx = 'onclick="return copyToClipboard(\'' + data.navigation_data.download.permalink.url + '\')"';
				}
				var label = item[1];
				label = "Download";
				if (id == 'permalink') label = "-- Open --";
				var url = item[2];


				var title = (item.length == 4) ? item[3] : '';

				var target = (id.indexOf('api_') > -1) ? 'target="_api"': '';

				var domBit = dom.byId(id);

				var tx = "<div style='float: left;'>" + title + '</div>' +
					"<div style='float: right'>" +

					'<a href="' + metadata_url + '" ' + function_tx + ' class="btn btn-info" role="button" title=" metadata ' + title + '">' + metadata_button_label + '</a>' +
					'<a href="' + url + '" ' + target + ' class="btn btn-info" style="margin-left: 3px;" role="button" title="' + title + '">' + label + '</a>' +
					'</div></div>';
				//TODO change into a list with Label and 2 buttons - 1 for data, and 1 for metadata
				//tx = '<li>' + label + '<a href="' + url + '" target="_api" class="btn btn-info" role="button">Download</a><a href="' + url + '" target="_api" class="btn btn-info" role="button">Metadata</a></li><br>';
				domBit.innerHTML = tx;
				dojo.style(domBit, 'display', 'inline');
				dojo.style(domBit, 'line-height', '24px');
			})
		}
		else
		{
			dojo.style(dom.byId("api_downstream"), 'display', 'none');
			dojo.style(dom.byId("api_upstream"), 'display', 'none');
			dojo.style(dom.byId("permalink"), 'display', 'none');
			dojo.style(dom.byId("download_attributes"), 'display', 'none');
			dojo.style(dom.byId("download_metrics2016"), 'display', 'none');
			dojo.style(dom.byId("download_metrics2017"), 'display', 'none');
			dojo.style(dom.byId("download_geography"), 'display', 'none');
		}


		// things are formatted in the REST service - but this is setting the contents and order
		upstream_only_list = [
			'hu12_count_nu',
			'headwater_count_nu',
			'area_sq_km',
			'water_area_sq_km',
			'distance_km'
		];

		attribute_list = [
			 'headwater_bool',
			 'terminal_bool',
			 'ds_area_sq_km',
			 'us_water_area_sq_km',
			 'ds_water_area_sq_km',
			 'huc8',
			 'upstream_huc8_count_nu',
			 'downstream_huc8_count_nu'
			];



		// there are attributes in data.hu_data
		//  and data.navigation_data.results.summary_data
		var results_data = [];
		var direction = 'upstream';
		if (data.hasOwnProperty('navigation_data')
			&& data.navigation_data !== null
			&& data.navigation_data.hasOwnProperty('direction'))
		{
			direction = data.navigation_data.direction;
		}


		if (direction == 'upstream'){
			upstream_only_list.forEach(function(key) {
				result_data = '';
				if (data.hasOwnProperty('navigation_data')
					&& data.navigation_data !== null
					&& data.navigation_data.results.summary_data.hasOwnProperty(key))
				{
					result_data = data.navigation_data.results.summary_data[key];
				}
				else if (data.hu_data.hasOwnProperty(key))
				{
					result_data = data.hu_data[key];

				}
				if (result_data.toString().length > 0){
					result_with_commas = that.numberWithCommas(result_data);

					results_data.push({'key': that.navAttributeLabel(key), 'value': result_with_commas});
				}
			});
		}

		attribute_list.forEach(function(key) {
			result_data = '';
			if (data.hasOwnProperty('navigation_data')
				&& data.navigation_data !== null
				&& data.navigation_data.results.summary_data.hasOwnProperty(key))
			{
				result_data = data.navigation_data.results.summary_data[key];

			}
			else if (data.hu_data.hasOwnProperty(key))
			{
				result_data = data.hu_data[key];
					if (result_data === true)
					{
						result_data = 'Yes'
					}
					else if (result_data === false)
					{
						result_data = 'No'
					}
			}
			if (result_data.toString().length > 0){
				result_with_commas = that.numberWithCommas(result_data);

				results_data.push({'key': that.navAttributeLabel(key), 'value': result_with_commas});
			}

		});

		if (data.hu_data.hasOwnProperty('terminal_hu12_ds')
			&& data.hu_data.terminal_hu12_ds !== null)
		{
			results_data.push({'key': that.navAttributeLabel('terminal_huc12_ds'), 'value': data.hu_data.terminal_hu12_ds.huc_code});
			results_data.push({'key': that.navAttributeLabel('terminal_huc12_ds_name'), 'value': data.hu_data.terminal_hu12_ds.name});
			results_data.push({'key': that.navAttributeLabel('terminal_hu12_ds_count_nu'), 'value': data.hu_data.terminal_hu12_ds.hu12_ds_count_nu});
			results_data.push({'key': that.navAttributeLabel('outlet_type'), 'value': data.hu_data.terminal_hu12_ds.outlet_type});
			results_data.push({'key': that.navAttributeLabel('outlet_type_code'), 'value': data.hu_data.terminal_hu12_ds.outlet_type_code});
		}
        // create an object store
        var objectStore = new Memory({
            data: results_data
        });
        results2Store = new dojo.data.ObjectStore({objectStore: objectStore});
        that.g_gridNavResults.store = results2Store;

		// show grid
        that.g_gridNavResults.render();
		dojo.style(dom.byId("gridNavResults"), 'display', '');
        dijit.byId('gridNavResults').resize();

		// things are formatted in the REST service - but this is setting the contents and order
		// NOT CURRENTLY WORKING
        if (data.hasOwnProperty('attribute_results'))
        {
			attribute_list = [
				 'name',
				 'root_value',
				 'us_value',
				];

			results_data2 = [];
			results_data2.push({'key': 'Name', 'value': data.attribute_results['name']});
			results_data2.push({'key': 'HUC Value', 'value': data.attribute_results['root_value'] + ' ' + data.attribute_results['units']});
			if (data.attribute_results['us_count_nu'] > 0)
			{
				results_data2.push({'key': 'Upstream HUC Value', 'value': data.attribute_results['us_value'] + ' ' + data.attribute_results['units']});
			}
				// create an object store
	        var objectStore2 = new Memory({
	            data: results_data2
	        });
	        results2Store2 = new dojo.data.ObjectStore({objectStore: objectStore2});
	        gridAttributeResults.store = results2Store2;

			// show grid
	        gridAttributeResults.render();
			dojo.style(dom.byId("gridAttributeResults"), 'display', '');
	        dijit.byId('gridAttributeResults').resize();
        }
		if (data.navigation_data !== null
			&& data.hasOwnProperty('attributes')
			&& data['attributes'].hasOwnProperty(('sanitized')))
        {
        	var field_nm = data['attributes']['attributes_tx'];
        	var field_meta = data['attributes']['sanitized']['valid_attributes'][field_nm];

        	//TODO: figure out data handling better
        	var result_va = data['navigation_data']['results']['aggregated_attribute']['result_va'];

			result_tx = that.numberWithCommas(result_va);
			results_data2 = [];
			results_data2.push({'key': 'Indicator Category', 'value': field_meta['category_name']});
			results_data2.push({'key': 'Indicator Name', 'value': field_meta['label_tx']});
			results_data2.push({'key': 'Units', 'value': field_meta['units_tx']});
			results_data2.push({'key': 'Statistic', 'value': field_meta['statistic_cd']});
			results_data2.push({'key': 'Aggregated Value', 'value': result_tx});

			// if (data.attribute_results['us_count_nu'] > 0)
			// {
			// 	results_data2.push({'key': 'Upstream HUC Value', 'value': data.attribute_results['us_value'] + ' ' + data.attribute_results['units']});
			// }
				// create an object store
	        var objectStore2 = new Memory({
	            data: results_data2
	        });
	        results2Store2 = new dojo.data.ObjectStore({objectStore: objectStore2});
	        gridAttributeResults.store = results2Store2;

			// show grid
	        gridAttributeResults.render();
			dojo.style(dom.byId("gridAttributeResults"), 'display', '');
	        dijit.byId('gridAttributeResults').resize();
        }
	},




	add_click_point_graphic: function(point)
	{
		this.map.graphics.clear();
		var that = this;
		
		dojo.some(this.map.graphics.graphics, function(g) {  
			  if( g && g.id === "clickPoint" ) {  
			    //remove graphic with specific id  
			    that.map.graphics.remove(g); 
			    return false;
			  }  
			});
		
		// add a simple marker graphic at the location where the user clicked on the map.
		var pointSymbol = new esri.symbol.SimpleMarkerSymbol(
				esri.symbol.SimpleMarkerSymbol.STYLE_CROSS, 22,
				new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,
				new dojo.Color([ 0, 128, 0 ]), 4)
				);
		var clickPointGraphic = new esri.Graphic(point, pointSymbol);
		clickPointGraphic.id = 'clickPoint';
		this.map.graphics.add(clickPointGraphic);
	},
	
	huc12_symbol: function()
	{
		//toggle 'my' visualization format vs. what enviroatlas uses
		var use_enviroatlas_format = false;
		
		if (use_enviroatlas_format == true)
		{ 
			var sfs = new esri.symbol.SimpleFillSymbol({
				  "type": "esriSFS",
				  "style": "esriSFSSolid",
				  "color": [255, 170, 0, 0]
				});
			var sls = new esri.symbol.SimpleLineSymbol(
					esri.symbol.SimpleLineSymbol.STYLE_SOLID, 
					new dojo.Color([0,0,0, 100]), 1);
		}
		else
		{
			var sfs = new esri.symbol.SimpleFillSymbol({
				  "type": "esriSFS",
				  "style": "esriSFSSolid",
				  "color": [255,0,0,100] //originally, it was [0,255,0,40]
				});
			var sls = new esri.symbol.SimpleLineSymbol(
					esri.symbol.SimpleLineSymbol.STYLE_DASHDOT, 
					new dojo.Color([0,0,0, 50]), 1);
		}
		sfs.setOutline(sls);
		return sfs;
	},
    //jab new
    huc12_headwater_symbol()
    {
        var sfs = new esri.symbol.SimpleFillSymbol({
              "type": "esriSFS",
              "style": "esriSFSSolid",
              "color": [255, 0, 170, 100] // originally, it was [105, 170, 170, 100]
            });
        var sls = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_DASHDOT, new dojo.Color([0,0,0, 50]), 1);

        sfs.setOutline(sls);

        return sfs;
    },

    huc12_terminal_symbol()
    {
        var sfs = new esri.symbol.SimpleFillSymbol({
              "type": "esriSFS",
              "style": "esriSFSSolid",
              "color": [222, 0, 0, 100]
            });
        var sls = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_DASHDOT, new dojo.Color([0,0,0, 50]), 1);

        sfs.setOutline(sls);

        return sfs;
    },
    //end new


	huc8_symbol: function()
	{
	    // barely visible (or use 0 for transparent)
		var sfs = new esri.symbol.SimpleFillSymbol({
			  "type": "esriSFS",
			  "style": "esriSFSSolid",
			  "color": [255,0, 0, 10]
			});
		var sls = new esri.symbol.SimpleLineSymbol(
				esri.symbol.SimpleLineSymbol.STYLE_DASHDOTDOT, 
				new dojo.Color([0,0,0, 50]), 1);
		
		sfs.setOutline(sls);
		
		return sfs;
	},

	add_huc8_label: function(point, label_text)
	{
		//Add HUC12 ID to each feature
		var hucFont = new esri.symbol.Font("12pt",
		  esri.symbol.Font.STYLE_NORMAL,
		  esri.symbol.Font.VARIANT_NORMAL,
		  esri.symbol.Font.WEIGHT_BOLD, "Arial");
		
		var hucTextSymbol = new esri.symbol.TextSymbol(label_text);
		hucTextSymbol.setColor(new dojo.Color([0, 0, 0]));
		
		hucTextSymbol.setAlign(esri.symbol.TextSymbol.ALIGN_MIDDLE);
		hucTextSymbol.setFont(label_text);

		var graphic = new esri.Graphic(point, hucTextSymbol);
		this.map.graphics.add(graphic);
	},

	add_label: function(point, label_text)
	{
		//Add HUC12 ID to each feature
		var hucFont = new esri.symbol.Font("14pt",
		  esri.symbol.Font.STYLE_NORMAL,
		  esri.symbol.Font.VARIANT_NORMAL,
		  esri.symbol.Font.WEIGHT_BOLD, "Arial");
		
		var hucTextSymbol = new esri.symbol.TextSymbol(label_text);
		hucTextSymbol.setColor(new dojo.Color([0, 0, 0]));
		
		hucTextSymbol.setAlign(esri.symbol.TextSymbol.ALIGN_MIDDLE);
		hucTextSymbol.setFont(label_text);

		var graphic = new esri.Graphic(point, hucTextSymbol);
		this.map.graphics.add(graphic);
		
		//testing only
		//this.add_click_point_graphic(point)
		
	},

  	/***************************************************************************
  	 * 
  	 * 
  	 * jab-end of added object functions
  	 * 
  	 * 
  	 ***************************************************************************/
  	  
     
      
	_onSearchFinish : function(layerIndex, closeOnComplete, removing, adding, results)
	{
		var layerConfig = this.config.layers[layerIndex];
		var currentLayer;
		array.map(this.currentSearchLayer.fields, lang.hitch(this, function(element)
			{
				if (layerConfig.fields.all)
				{
					element.show = true;
				}
				else
				{
					element.show = false;
					for (var f = 0; f < layerConfig.fields.field.length; f++)
					{
						if (layerConfig.fields.field[f].name == element.name)
						{
							element.show = true;
						}
					}
				}
			}
		));
		currentLayer = this.currentSearchLayer;
		if (layerConfig.layersymbolfrom === 'server') {
			currentLayer.setRenderer(this._setCurentLayerRenderer('server'));
		} else if(layerConfig.layersymbolfrom === 'layer') {
			currentLayer.setRenderer(this._setCurentLayerRenderer('layer'));
		} else{
			currentLayer.setRenderer(this._setCurentLayerRenderer('config'));
		}

		html.setStyle(this.progressBar.domNode, 'display', 'none');
		html.setStyle(this.divOptions, 'display', 'block');
		
		var title = "";
		var titlefield = layerConfig.titlefield;
		var sumfield = layerConfig.sumfield || null;
		var objectIdField = layerConfig.objectIdField;
		var existObjectId = layerConfig.existObjectId;
		var typeIdField = layerConfig.typeIdField;

//modify the currentFeatures with the new results
		var csvData;
		if(adding && this.currentFeatures && this.currentFeatures.length > 0){
		  csvData = this.currentCSVResults.data || [];
		  array.forEach(results.features, lang.hitch(this, function(gra){
		    if(this.currentFeatures.indexOf(gra) < 0){
		      this.currentFeatures.push(gra);
		    }
		  }));
		}
		else if (removing && this.currentFeatures && this.currentFeatures.length > 0){
		  csvData = this.currentCSVResults.data || [];
		  array.forEach(results.features, lang.hitch(this, function(gra){
		    for (var g = this.currentFeatures.length - 1; g >= 0; g--){
		      if(this.currentFeatures[g].attributes[objectIdField] == gra.attributes[objectIdField]){
		        this.currentFeatures.splice(g, 1);
		        break;
		      }
		    }
		    for (var g1 = csvData.length - 1; g1 >= 0; g1--){
		      var csvRowRem = csvData[g1];
		      if(csvRowRem.OID == gra.attributes[objectIdField]){
		        csvData.splice(g1, 1);
		        break;
		      }
		    }
		  }));
		}
		else{
			csvData = [];
			this.currentCSVResults = null;
			// count of features selected
			this.currentFeatures = results.features;
		}

		var listLen = this.list.items.length;
		
		var len = results.features.length;
		
		if (this.currentFeatures.length === 0) 
		{
			html.empty(this.divResultMessage);
			html.place(html.toDom(this.nls.noResults), this.divResultMessage);
			
			this.list.clear();
			this.gSelectTypeVal = 'new';
			this.aSelectTypeVal = 'new';

			html.setStyle(this.divOptions, 'display', 'none');
			
			//jab
			html.empty(this.clickAgainMessage);
			html.setStyle(this.clickAgainMessage, 'display', 'none');
			
			return;
		} 
		//jab
		else if (this.currentFeatures.length > 1)
		{
			/*html.empty(this.divResultMessage);
			html.empty(this.clickAgainMessage);
			var msg_text = "<label style=\"font-size: 18px;\">" + "Click on only one of the " + this.currentFeatures.length + " highlighted Subwatersheds to navigate." + "</label>";
			html.place(html.toDom(msg_text), this.clickAgainMessage);
			html.setStyle(this.clickAgainMessage, 'display', '');*/
			
			this.divNavigationMessages.innerHTML = "Click on only one of the " + this.currentFeatures.length + " highlighted Subwatersheds to navigate.";
		}
		else 
		{
			html.empty(this.divResultMessage);
			//html.place(html.toDom("<label>" + this.nls.featuresSelected + this.currentFeatures.length + "</label>"), this.divResultMessage);
		}
		//jab


		//jab-end
		
		
		var i, slen, sumTotal, numFormat, currFormat, args, sValue, args2;
		
		//determine if this layer has any sum field(s)
		this._getSumFields(layerIndex);
		if(this.sumFields.length > 0){
		  html.addClass(this.list.domNode, 'sum');
		  html.setStyle(this.divSum, 'display', '');
		}else{
		  html.removeClass(this.list.domNode, 'sum');
		  html.setStyle(this.divSum, 'display', 'none');
		}
		
		if(this.sumFields.length > 0){
		  this.sumResultArr = [];
		  if(this.sumDivEvt){
		    this.sumDivEvt.remove();
		  }
		  array.map(this.sumFields, lang.hitch(this, function(sumfield){
		    sumTotal = 0;
		    for ( i = 0, slen = this.currentFeatures.length; i < slen; i++) {
		      var feature = this.currentFeatures[i];
		      sumTotal += Number(feature.attributes[sumfield.field]);
		    }
		
		    numFormat = this._getNumberFormat(sumfield.field, layerIndex);
		    if (numFormat) {
		      args = numFormat.split("|");
		      /*value,precision,symbol,thousands,decimal*/
		      sValue = this._formatNumber(sumTotal, args[0] || null, args[1] || null, args[2] || null);
		    }
		    currFormat = this._getCurrencyFormat(sumfield.field, layerIndex);
		    if (currFormat) {
		      args2 = currFormat.split("|");
		      /*value,precision,symbol,thousands,decimal*/
		      sValue = this._formatCurrency(sumTotal, args2[1] || null, args2[0] || null, args2[2] || null, args2[3] || null);
		    }
		    this.sumResultArr.push(sumfield.sumlabel + ' ' + sValue);
		  }));
		  if(this.sumFields.length > 1){
		    this.divSum.innerHTML = this.sumResultArr[0] + '&nbsp;&nbsp;' + this.nls.more + '...';
		    html.setStyle(this.divSum, 'cursor', 'pointer');
		    this.sumDivEvt = on(this.divSum, 'click', lang.hitch(this, function(){
		      new Message({titleLabel: this.nls.summaryresults, message: this.sumResultArr.join('<br>')});
		    }));
		  }else if(this.sumFields.length === 1){
		    html.setStyle(this.divSum, 'cursor', 'default');
		    this.divSum.innerHTML = this.sumResultArr[0];
		  }
		}
        

		
        var csvColumns = [];
        for (i = 0; i < len; i++) {
          var featureAttributes = results.features[i].attributes;
          //console.info(results.features[i]);
          //work with the links now
          var qLinks = [];
          if (layerConfig.links && layerConfig.links.link) {
            qLinks = layerConfig.links.link;
          }
          var lyrQLinks = [];
          for (var a = 0; a < qLinks.length; a++) {
            var link = "",
              alias = "",
              linkicon = "",
              linkFieldNull = false,
              disableInPopUp = false,
              popupType;
            if (qLinks[a].disableinpopup) {
              disableInPopUp = true;
            }
            if (qLinks[a].disablelinksifnull) {
              var lfields = this._getFieldsfromLink(qLinks[a].content);
              for (var lf = 0; lf < lfields.length; lf++) {
                if (!featureAttributes[lfields[lf]] || featureAttributes[lfields[lf]] === "") {
                  linkFieldNull = true;
                  break;
                }
              }
            }
            if (linkFieldNull) {
              link = "";
            } else {
              link = this._substitute(qLinks[a].content, featureAttributes, results);
            }
            var sub = this._substitute(qLinks[a].alias, featureAttributes, results);
            alias = (sub) ? sub : qLinks[a].alias;
            linkicon = this._substitute((qLinks[a].icon || this.folderUrl + 'images/w_link.png'), featureAttributes, results);
            popupType = qLinks[a].popuptype;
            var lObj = {
              link: link,
              icon: linkicon,
              alias: alias,
              disableinpopup: disableInPopUp,
              popuptype: popupType
            };
            if(!linkFieldNull){
              lyrQLinks.push(lObj);
            }
          }

          var lyrHideNullValues = (layerConfig.hasOwnProperty("hidenullvalue") && layerConfig.hidenullvalue)?true:false;

          var content = "",
            rsltcontent = "",
            value = "",
            csvRow = {},
            oidVal;
          csvColumns = [];
          //ensure fields are ordered the same way they are configuraed in the json (this is an issue for ArcGIS Server 10.2.x)
          var tempFlds = lang.clone(this.config.layers[layerIndex].fields.field);
          if(this.config.layers[layerIndex].fields.all){
            var tempFlds = this._getAllLyrFields();
          }
          if(!existObjectId && objectIdField && tempFlds.indexOf({"name": objectIdField}) < 0){
            tempFlds.push(
              {"name": objectIdField}
            );
          }
          array.map(tempFlds, lang.hitch(this, function (attr) {
            var att = attr.name;
            var fld = this._getField(results, att);
            if(!fld){
              console.info(att, results);
            }
            if (fld.name === objectIdField) {
              oidVal = featureAttributes[att];
              if(existObjectId){
                csvColumns.push(this._getAlias(att, layerIndex));
                csvRow[this._getAlias(att, layerIndex)] = oidVal;
              }
              csvRow["OID"] = oidVal;
            }else{
              csvColumns.push(this._getAlias(att, layerIndex));
            }
            if (this.initiator && (this.initiator === 'graphic' || this.limitMapExtentCbx.getValue())) {
              if (fld.name === objectIdField) {
                this.oidArray.push(oidVal);
              }
            }

            if (!existObjectId && fld.name === objectIdField) {
              //continue;
              return;
            }
            var fieldValue = featureAttributes[att];
            value = fieldValue !== null ? String(fieldValue) : "";
            if (value !== "") {
              var isDateField;
              if (fld) {
                isDateField = fld.type === "esriFieldTypeDate";
              }
              if (isDateField) {
                var dateMS = Number(fieldValue);
                if (!isNaN(dateMS)) {
                  if (this._getDateFormat(att, layerIndex) !== "") {
                    value = this._formatDate(dateMS, this._getDateFormat(att, layerIndex));
                  } else {
                    value = this._formatDate(dateMS, 'MM/dd/yyyy');
                  }
                }
              }
              numFormat = this._getNumberFormat(att, layerIndex);
              if (numFormat) {
                args = numFormat.split("|");
                /*value,percision,symbol,thousands,decimal*/
                value = this._formatNumber(fieldValue, args[0] || null, args[1] || null, args[2] || null);
              }
              currFormat = this._getCurrencyFormat(att, layerIndex);
              if (currFormat) {
                args2 = currFormat.split("|");
                /*value,percision,symbol,thousands,decimal*/
                value = this._formatCurrency(fieldValue, args2[1] || null, args2[0] || null, args2[2] || null, args2[3] || null);
              }
              var typeID = typeIdField ? featureAttributes[typeIdField] : null;
              if (att === typeIdField) {
                var featureType = this._getFeatureType(this.resultLayers[layerIndex], typeID);
                if (featureType && featureType.name) {
                  value = featureType.name;
                }
              } else {
                var codedValue = this._getCodedValue(this.resultLayers[layerIndex], att, fieldValue, null);
                if (codedValue) {
                  value = codedValue.name;
                }
              }
            }

            var upperCaseFieldName = att.toUpperCase();
            if (titlefield && upperCaseFieldName === titlefield.toUpperCase()) {
              title = value;
              csvRow[this._getAlias(att, layerIndex)] = value;
            } else {
              if (this._isVisible(att, layerIndex)) {
                if(lyrHideNullValues && value === ""){
                  console.log("Removed " + att);
                }else{
                  content = content + this.resultFormatString.replace('[attribname]', this._getAlias(att, layerIndex)).replace('[attribvalue]', value);
                  if (!this._isPopupOnly(att, layerIndex)) {
                    rsltcontent = rsltcontent + this.resultFormatString.replace('[attribname]',
                      this._getAlias(att, layerIndex)).replace('[attribvalue]', value);
                  }
                }
                csvRow[this._getAlias(att, layerIndex)] = value;
              }
            }
          }));
          if (content.lastIndexOf('<br>') === (content.length - 4)) {
            content = content.substr(0, content.length - 4);
          } else {
            content = content;
          }
          if (rsltcontent.lastIndexOf('<br>') === (rsltcontent.length - 4)) {
            rsltcontent = rsltcontent.substr(0, rsltcontent.length - 4);
          } else {
            rsltcontent = rsltcontent;
          }
          var symbol = currentLayer.renderer.getSymbol(results.features[i]);

          if(!removing){
            csvData.push(csvRow);
            this.list.add({
              id: "id_" + i + listLen,
              OID: oidVal,
              title: title,
              content: content,
              rsltcontent: rsltcontent,
              alt: (i % 2 === 0),
              sym: symbol,
              links: lyrQLinks,
              removeResultMsg: this.nls.removeResultMsg,
              showRelate: layerConfig.relates && layerConfig.relates.relate,
              relalias: this.nls.showrelates
            });
          }else{
            var index = this._returnListIndexFromOID(oidVal);
            if(index > -1){
              this.list.remove(index);
            }
          }
        }
        this.list.addComplete();
        this.currentCSVResults = {
          data: csvData,
          columns: csvColumns
        }
        // html.setStyle(this.btnClear2, 'display', 'block');
        // html.setStyle(this.btnClear3, 'display', 'block');

        // this is where the HUCs are added to the map
        this._drawResults(layerIndex, results, currentLayer, closeOnComplete);
		/***************************************************************************************
		 *
		 *  jab here is code for upstream navigation.
		 *     If there is one or more HUC12 selected, then label them
		 *     If there is only 1 HUC12 selected, then navigate
		 *
		 *
		***************************************************************************************/
		if (results.features.length > 0)
		{
		    //TODO: figure correct place to zoom.  I prefer to do it before the labels are added.
		    this.zoomall();
			this.label_huc12s(results.features);

			this.populate_gridHUC12(this.results_json, this);

			// if only 1 HUC12 was clicked, then navigate upstream
			if (results.features.length === 1)
			{
				var atts = results.features[0].attributes;

				console.log("Click point found HUC12: " + atts["HUC_12"] +
						(atts["HU_12_Name"] !== undefined ? ", HUC12_NAME:" + atts["HU_12_Name"] : ''));

				//divNnavigationHUCode
                this.divNavigationHUCode.value = atts["HUC_12"];

				console.time("Navigate HUC12");
				this.huc12_feature_selected = results;
				this.navigate_upstream(results);
				console.timeEnd("Navigate HUC12");

			}
			else
			{
				console.log("Click point found " + results.features.length + " HUC12s.");
			}
		}
		/*jab
		 *
		 * end of inserted code for HUC12 upstream navigation
		 *
		 *
		 *
		 */
      },

      _returnListIndexFromOID: function (OID) {
        var retVal = -1;
        array.some(this.list.items, lang.hitch(this, function(item, index){
          if (item.OID === OID) {
            retVal = index;
            return true;
          }
        }));
        return retVal;
      },

      _setCurentLayerRenderer: function (symFromWhere) {
        if (symFromWhere === 'server') {
          return jsonUtil.fromJson(this.resultLayers[this.currentLayerIndex].drawingInfo.renderer);
        } else {
          var symbol,
            type = this.resultLayers[this.currentLayerIndex].geometryType;

          if(symFromWhere === 'layer'){
            var layerConfig = this.config.layers[this.currentLayerIndex];
            if(layerConfig.symbology){
              symbol = symUtils.fromJson(layerConfig.symbology);
              var sRend = new SimpleRenderer(symbol);
              sRend.label = sRend.description = this.config.layers[this.currentLayerIndex].name;
              return sRend;
            }
          }

          //Determine the geometry type to set the symbology
          switch (type) {
          case "esriGeometryMultipoint":
          case "esriGeometryPoint":
            if (this.config.symbols && this.config.symbols.simplemarkersymbol) {
              symbol = new SimpleMarkerSymbol(this.config.symbols.simplemarkersymbol);
            } else {
              if (this.config.symbols && this.config.symbols.picturemarkersymbol) {
                var pms = lang.clone(this.config.symbols.picturemarkersymbol);
                pms.url = this.folderUrl + pms.url;
                symbol = new PictureMarkerSymbol(pms);
              } else {
                symbol = new SimpleMarkerSymbol();
              }
            }
            break;
          case "esriGeometryPolyline":
            if (this.config.symbols && this.config.symbols.simplelinesymbol) {
              symbol = new SimpleLineSymbol(this.config.symbols.simplelinesymbol);
            } else {
              symbol = new SimpleLineSymbol();
            }
            break;
          case "esriGeometryEnvelope":
          case "esriGeometryPolygon":
            if (this.config.symbols && this.config.symbols.simplefillsymbol) {
              symbol = new SimpleFillSymbol(this.config.symbols.simplefillsymbol);
            } else {
              symbol = new SimpleFillSymbol();
            }
            break;
          default:
            break;
          }
          var simpRend = new SimpleRenderer(symbol);
          simpRend.label = simpRend.description = this.config.layers[this.currentLayerIndex].name;
          return simpRend;
        }
      },

      _openResultInAttributeTable: function (currentLayer) {
        var layerConfig = this.config.layers[this.currentLayerIndex];
        var lyrZoomExistsAndTrue = (layerConfig.hasOwnProperty("autozoomtoresults") && !layerConfig.autozoomtoresults)?false:true;
        if (this.autozoomtoresults && lyrZoomExistsAndTrue) {
          setTimeout(lang.hitch(this, function () {
            this.zoomall();
          }), 300);
        }
        var layerInfo = this.operLayerInfos.getLayerInfoById(currentLayer.id);

        //Adjust field info based on config
        if(!layerConfig.fields.all){
          var adjFldInfos = [];
          array.map(layerInfo.layerObject.fields, lang.hitch(this, function (fieldInfo){
            var cnfgFldObj = this._getConfigFieldObject(fieldInfo.name, this.currentLayerIndex);
            if(cnfgFldObj){
              adjFldInfos.push({
                fieldName: cnfgFldObj.name,
                label: cnfgFldObj.alias,
                show: true,
                format: this._convertFormatInfo(cnfgFldObj)
              });
            }
          }));
          layerInfo.originOperLayer.popupInfo = {
            fieldInfos: adjFldInfos
          }
        }

        this.publishData({
          'target': 'AttributeTable',
          'layer': layerInfo
        });
      },

      _convertFormatInfo: function(configFldInfo){
        var result = null;
        if(configFldInfo.currencyformat){
          var cOps = configFldInfo.currencyformat.split("|");
          result = {
            places: parseInt(cOps[1] || 0),
            digitSeparator: ((cOps[2])? true : false)
          };
        }
        if(configFldInfo.dateformat){
          var dFormat;
          switch (configFldInfo.dateformat){
            case "M/d/yyyy":
              dFormat = "shortDate";
              break;
            case "d MMM yyyy":
              dFormat = "dayShortMonthYear";
              break;
            case "EEEE, MMMM d, yyyy":
              dFormat = "longDate";
              break;
            case "MMMM d, yyyy":
              dFormat = "longMonthDayYear";
              break;
            case "MMMM yyyy":
              dFormat = "longMonthYear";
              break;
            case "M/d/yyyy h:mm:ss a":
              dFormat = "shortDateLongTime";
              break;
            case "M/d/yyyy H:mm:ss":
              dFormat = "shortDateLongTime24";
              break;
            case "M/d/yyyy h:mm a":
              dFormat = "shortDateShortTime";
              break;
            case "M/d/yyyy h:mm":
              dFormat = "shortDateShortTime24";
              break;
            case "MMM yyyy":
              dFormat = "shortMonthYear";
              break;
            case "yyyy":
              dFormat = "year";
              break;
            default:
              dFormat = "shortDate";
              break;
          }
          result = {
            dateFormat: dFormat
          };
          if(configFldInfo.useutc){
            result.timezone = "utc"
          }
        }
        if(configFldInfo.numberformat){
          var nOps = configFldInfo.numberformat.split("|");
          result = {
            places: parseInt(nOps[0] || 0),
            digitSeparator: ((nOps[1])? true : false)
          };
        }
        return result;
      },

      _getFeatureType: function (layer, typeID) {
        var result;
        if (layer) {
          for (var t = 0; t < layer.types.length; t++) {
            var featureType = layer.types[t];
            if (typeID === featureType.id) {
              result = featureType;
              break;
            }
          }
        }
        return result;
      },

      _getCodedValue: function (layer, fieldName, fieldValue, typeID) {
        var result;
        var codedValueDomain;
        if (typeID) {
          var featureType = this._getFeatureType(layer, typeID);
          if (featureType) {
            codedValueDomain = featureType.domains[fieldName];
          }
        } else {
          var field = this._getField(layer, fieldName);
          if (field) {
            codedValueDomain = field.domain;
          }
        }
        if (codedValueDomain) {
          if (codedValueDomain.type === 'codedValue') {
            for (var cv = 0; cv < codedValueDomain.codedValues.length; cv++) {
              var codedValue = codedValueDomain.codedValues[cv];
              if (fieldValue === codedValue.code) {
                result = codedValue;
                break;
              }
            }
          }
        }
        return result;
      },

      _getField: function (layer, fieldName) {
        var result;
        if (layer) {
          for (var f = 0; f < layer.fields.length; f++) {
            var field = layer.fields[f];
            if (fieldName === field.name) {
              result = field;
              break;
            }
          }
        }
        return result;
      },

      _formatDate: function (value, dateFormat) {
        if (dateFormat) {
          dateFormat = dateFormat.replace(/D/g, "d").replace(/Y/g, "y");
        }
        var inputDate = new Date(value);
        return locale.format(inputDate, {
          selector: 'date',
          datePattern: dateFormat
        });
      },

      _getAlias: function (att, layerIndex) {
        var field = this.config.layers[layerIndex].fields.field;
        var item;
        for (var i in field) {
          item = field[i];
          if (item && item.name && item.name.toLowerCase() === att.toLowerCase() && item.alias) {
            return item.alias;
          }
        }
        return att;
      },

      _isVisible: function (att, layerIndex) {
        var field = this.config.layers[layerIndex].fields.field;
        var item;
        for (var i in field) {
          item = field[i];
          if (item && item.name && item.name.toLowerCase() === att.toLowerCase()) {
            if (item.hasOwnProperty('visible') && item.visible === false) {
              return false;
            } else {
              return true;
            }
          }
        }
        return true;
      },

      _isPopupOnly: function (att, layerIndex) {
        var field = this.config.layers[layerIndex].fields.field;
        var item;
        for (var i in field) {
          item = field[i];
          if (item && item.name && item.name.toLowerCase() === att.toLowerCase()) {
            if (item.hasOwnProperty('popuponly') && item.popuponly === true) {
              return true;
            } else {
              return false;
            }
          }
        }
        return false;
      },

      _getDateFormat: function (att, layerIndex) {
        var field = this.config.layers[layerIndex].fields.field;
        var item;
        for (var i in field) {
          item = field[i];
          if (item && item.name && item.name.toLowerCase() === att.toLowerCase() && item.dateformat) {
            return item.dateformat;
          }
        }
        return "";
      },

      _getCurrencyFormat: function (att, layerIndex) {
        var field = this.config.layers[layerIndex].fields.field;
        var item;
        for (var i in field) {
          item = field[i];
          if (item && item.name && item.name.toLowerCase() === att.toLowerCase() && item.currencyformat) {
            return item.currencyformat;
          }
        }
        return null;
      },

      _formatCurrency: function (value, percision, symbol, thousand, decimal) {
        value = value || 0;
        percision = !isNaN(percision = Math.abs(percision)) ? percision : 2;
        symbol = symbol !== undefined ? symbol : "$";
        thousand = thousand || ",";
        decimal = decimal || ".";
        var negative = value < 0 ? "-" : "",
          i = parseInt(value = Math.abs(+value || 0).toFixed(percision), 10) + "",
          j = (j = i.length) > 3 ? j % 3 : 0;
        return symbol + negative + (j ? i.substr(0, j) + thousand : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousand) +
          (percision ? decimal + Math.abs(value - i).toFixed(percision).slice(2) : "");
      },

      _getNumberFormat: function (att, layerIndex) {
        var field = this.config.layers[layerIndex].fields.field;
        var item;
        for (var i in field) {
          item = field[i];
          if (item && item.name && item.name.toLowerCase() === att.toLowerCase() && item.numberformat) {
            return item.numberformat;
          }
        }
        return null;
      },

      _formatNumber: function (value, percision, thousand, decimal) {
        value = value || 0;
        percision = !isNaN(percision = Math.abs(percision)) ? percision : 2;
        thousand = thousand || ",";
        decimal = decimal || ".";
        var negative = value < 0 ? "-" : "",
          i = parseInt(value = Math.abs(+value || 0).toFixed(percision), 10) + "",
          j = (j = i.length) > 3 ? j % 3 : 0;
        return negative + (j ? i.substr(0, j) + thousand : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousand) +
          (percision ? decimal + Math.abs(value - i).toFixed(percision).slice(2) : "");
      },

      _drawResults: function (layerIndex, results, currentLayer, closeOnComplete) {
        var layerConfig = this.config.layers[layerIndex];
        if (this.graphicsLayerBuffer instanceof FeatureLayer) {
          this._addOperationalLayer(this.graphicsLayerBuffer);
        }
        if (currentLayer instanceof FeatureLayer) {
          this._addOperationalLayer(currentLayer);
        }

        var type, centerpoint;
        for (var i = 0, len = this.currentFeatures.length; i < len; i++) {
          var feature = this.currentFeatures[i];
          var listItem = this.list.items[this._returnListIndexFromOID(feature.attributes[layerConfig.objectIdField])];
          type = feature.geometry.type;
          switch (type) {
          case "multipoint":
          case "point":
            centerpoint = feature.geometry;
            break;
          case "polyline":
            centerpoint = feature.geometry.getPoint(0, 0);
            break;
          case "extent":
          case "polygon":
            centerpoint = feature.geometry.getExtent().getCenter();
            break;
          default:
            break;
          }
          listItem.centerpoint = centerpoint;
          var lyrDisablePopupsAndTrue = (layerConfig.hasOwnProperty("disablePopups") && layerConfig.disablePopups)?true:false;
          if((!this.config.disablePopups && !lyrDisablePopupsAndTrue) && !currentLayer._hasInfoTemplate){
            feature.setInfoTemplate(this._configurePopupTemplate(listItem));
          }
          feature.setSymbol(listItem.sym);
          if (feature.geometry) {
            currentLayer.add(feature);
            listItem.graphic = feature;
          }
        }
        this.zoomAttempt = 0;
        if (layerConfig.shareResult && layerConfig.addToAttrib) {
          if (this.wManager) {
            var widgetCfg = this._getWidgetConfig('AttributeTable');
            if(widgetCfg){
              var attWidget = this.wManager.getWidgetByLabel(widgetCfg.label);
              if(attWidget){
                this.attTableOpenedbySearch = !attWidget.showing;
                this.wManager.openWidget(attWidget);
                attWidget._openTable().then(lang.hitch(this, this._openResultInAttributeTable, currentLayer));
              }else{
                /*Attribute Table Widget is not loaded*/
                this.wManager.loadWidget(widgetCfg).then(lang.hitch(this, function(widget){
                  if(widget){
                    this.attTableOpenedbySearch = true;
                    widget.setPosition(this.getOffPanelWidgetPosition(widget));
                    this.wManager.openWidget(widget);
                    widget._openTable().then(lang.hitch(this, this._openResultInAttributeTable, currentLayer));
                  }
                }));
              }
            }else{
              console.warn('The Attribute Table Widget is not configured for use in this application.');
              this._zoomAndClose(closeOnComplete);
            }
          }
          if (closeOnComplete) {
            setTimeout(lang.hitch(this, function () {
              this.pManager.closePanel(this.id + '_panel');
            }), 500);
          }
        }
        else {
          this._zoomAndClose(closeOnComplete);
        }

        if (this.mouseovergraphics) {
          on(currentLayer, 'mouse-over', lang.hitch(this, this.onMouseOverGraphic));
        }
        this.currentLayerAdded = currentLayer;
      },

      _zoomAndClose: function (closeOnComplete) {
        var layerConfig = this.config.layers[this.currentLayerIndex];
        var lyrZoomExistsAndTrue = (layerConfig.hasOwnProperty("autozoomtoresults") && !layerConfig.autozoomtoresults)?false:true;
        if (this.autozoomtoresults && lyrZoomExistsAndTrue) {
          setTimeout(lang.hitch(this, function () {
            this.zoomall();
          }), 300);
        }
        if (closeOnComplete) {
          setTimeout(lang.hitch(this, function () {
            // this.pManager.closePanel(this.id + '_panel');
          }), 500);
        }
      },

      _getWidgetConfig: function(widgetName){
        var widgetCnfg = null;
        array.some(this.wManager.appConfig.widgetPool.widgets, function(aWidget) {
          if(aWidget.name == widgetName) {
            widgetCnfg = aWidget;
            return true;
          }
          return false;
        });
        if(!widgetCnfg){
          /*Check OnScreen widgets if not found in widgetPool*/
          array.some(this.wManager.appConfig.widgetOnScreen.widgets, function(aWidget) {
            if(aWidget.name == widgetName) {
              widgetCnfg = aWidget;
              return true;
            }
            return false;
          });
        }
        return widgetCnfg;
      },

      getOffPanelWidgetPosition: function(widget){
        var position = {
          relativeTo: widget.position.relativeTo
        };
        var pbox = html.getMarginBox(this.domNode);
        var sbox = this.widgetManager.getWidgetMarginBox(widget);
        var containerBox = html.getMarginBox(position.relativeTo === 'map'?
          this.map.id: jimuConfig.layoutId);

        var top = pbox.t + pbox.h + 1;//put under icon by default
        if(top + sbox.h > containerBox.h){
          position.bottom = containerBox.h - pbox.t + 1;
        }else{
          position.top = top;
        }

        if (window.isRTL) {
          if(pbox.l + pbox.w - sbox.w < 0){
            position.right = 0;
          }else{
            position.right = pbox.l + pbox.w - sbox.w;
          }
        } else {
          if(pbox.l + sbox.w > containerBox.w){
            position.right = 0;
          }else{
            position.left = pbox.l;
          }
        }
        return position;
      },

      _searchResultListByOID: function (OID) {
        var layerConfig = this.config.layers[this.currentLayerIndex];
        var lyrHasPopupDisabled = (layerConfig.hasOwnProperty("disablePopups") && layerConfig.disablePopups)?true:false;
        for (var i = 0; i < this.list.items.length; i++) {
          var item = this.list.items[i];
          var point = item.centerpoint;
          if (item.OID === OID) {
            var itemDom = dojo.byId(this.list.id.toLowerCase() + item.id);
            if(itemDom){
              itemDom.scrollIntoView(false);
            }
            this.list.setSelectedItem(this.list.id.toLowerCase() + item.id);
            if ((this.map.infoWindow && this.config.enablePopupsOnResultClick) && !lyrHasPopupDisabled) {
              this.map.infoWindow.setFeatures([item.graphic]);
              if (this.map.infoWindow.reposition) {
                this.map.infoWindow.reposition();
              }
              if(layerConfig.showattachments){
                this._addAttachment(item.OID);
              }
              this.map.infoWindow.show(point);
            }
          }
        }
      },

      onMouseOverGraphic: function (evt) {
        var layerConfig = this.config.layers[this.currentLayerIndex];
        var oidField = layerConfig.objectIdField;
        this._searchResultListByOID(evt.target.e_graphic.attributes[oidField]);
      },

      _configurePopupTemplate: function (listItem) {
        var popUpInfo = {
          title: listItem.title,
          description: listItem.content,
          showAttachments: true
        };
        var pminfos = [];
        var popUpMediaInfo;

        for (var l = 0; l < listItem.links.length; l++) {
          if (listItem.links[l].link) {
            var pos = listItem.links[l].link.length - 4;
            var sfx = String(listItem.links[l].link).substr(pos, 4).toLowerCase();
            if (((sfx === ".jpg") || (sfx === ".png") || (sfx === ".gif")) && listItem.links[l].popuptype !== "text") {
              // use PopUpMediaInfo if it is an image
              if (!listItem.links[l].disableinpopup) {
                popUpMediaInfo = {};
                popUpMediaInfo.type = "image";
                var val = {};
                val.sourceURL = listItem.links[l].link;
                val.linkURL = listItem.links[l].link;
                popUpMediaInfo.value = val;
                popUpMediaInfo.caption = listItem.links[l].alias;
                pminfos.push(popUpMediaInfo);
              }
            } else if (listItem.links[l].icon !== "" && listItem.links[l].popuptype !== "text") {
              if (!listItem.links[l].disableinpopup) {
                popUpMediaInfo = {};
                popUpMediaInfo.type = 'image';
                popUpMediaInfo.value = {};
                popUpMediaInfo.value.sourceURL = listItem.links[l].icon;
                popUpMediaInfo.value.linkURL = listItem.links[l].link;
                popUpMediaInfo.caption = listItem.links[l].alias;
                pminfos.push(popUpMediaInfo);
              }
            } else {
              if (!listItem.links[l].disableinpopup) {
                var lText = (listItem.links[l].alias !== "") ? listItem.links[l].alias : listItem.links[l].link;
                popUpInfo.description += "<br><a href='" + listItem.links[l].link + "'>" + lText + "</a>";
              }
            }
          }
        }
        if (pminfos.length > 0) {
          popUpInfo.mediaInfos = pminfos;
        }
        var pt = new PopupTemplate(popUpInfo);
        return pt;
      },

      _selectResultItem: function (index, item) {
        var FeatLyr = new FeatureLayer(this.resultLayers[this.currentLayerIndex]._origLayerURL);
        var point = item.centerpoint;
        var layerConfig = this.config.layers[this.currentLayerIndex];
        var lyrHasPopupDisabled = (layerConfig.hasOwnProperty("disablePopups") && layerConfig.disablePopups)?true:false;
        var zoomScale = layerConfig.zoomScale || 10000;
        if (item.graphic.geometry.type === "point") {
          if ((this.map.getScale() > zoomScale || layerConfig.forceZoomScale) && !lyrHasPopupDisabled) {
            this.map.setScale(zoomScale).then(lang.hitch(this, this.map.centerAt(point).then(lang.hitch(this, function () {
              if (this.map.infoWindow && this.config.enablePopupsOnResultClick) {
                this.map.infoWindow.setFeatures([item.graphic]);
                if (this.map.infoWindow.reposition) {
                  this.map.infoWindow.reposition();
                }
                if(layerConfig.showattachments){
                  this._addAttachment(item.OID);
                }
                this.map.infoWindow.show(point);
              }
            }))));
          } else {
            this.map.centerAt(point).then(lang.hitch(this, function () {
              if ((this.map.infoWindow && this.config.enablePopupsOnResultClick) && !lyrHasPopupDisabled) {
                this.map.infoWindow.setFeatures([item.graphic]);
                if (this.map.infoWindow.reposition) {
                  this.map.infoWindow.reposition();
                }
                if(layerConfig.showattachments){
                  this._addAttachment(item.OID);
                }
                this.map.infoWindow.show(point);
              }
            }));
          }
        } else {
          var gExt = graphicsUtils.graphicsExtent([item.graphic]);
          if (gExt && !layerConfig.forceZoomScale) {
        	  //jab was .9 changed to 1
            this.map.setExtent(gExt.expand(1), true).then(lang.hitch(this, function () {
              if ((this.map.infoWindow && this.config.enablePopupsOnResultClick) && !lyrHasPopupDisabled) {
                this.map.infoWindow.setFeatures([item.graphic]);
                if (this.map.infoWindow.reposition) {
                  this.map.infoWindow.reposition();
                }
                if(layerConfig.showattachments){
                  this._addAttachment(item.OID);
                }
                this.map.infoWindow.show(point);
              }
            }));
          } else {
            if (this.map.getScale() > zoomScale || layerConfig.forceZoomScale) {
              this.map.setScale(zoomScale).then(lang.hitch(this, this.map.centerAt(point).then(lang.hitch(this, function () {
                if ((this.map.infoWindow && this.config.enablePopupsOnResultClick) && !lyrHasPopupDisabled) {
                  this.map.infoWindow.setFeatures([item.graphic]);
                  if (this.map.infoWindow.reposition) {
                    this.map.infoWindow.reposition();
                  }
                  if(layerConfig.showattachments){
                    this._addAttachment(item.OID);
                  }
                  this.map.infoWindow.show(point);
                }
              }))));
            } else {
              this.map.centerAt(point).then(lang.hitch(this, function () {
                if ((this.map.infoWindow && this.config.enablePopupsOnResultClick) && !lyrHasPopupDisabled) {
                  this.map.infoWindow.setFeatures([item.graphic]);
                  if (this.map.infoWindow.reposition) {
                    this.map.infoWindow.reposition();
                  }
                  if(layerConfig.showattachments){
                    this._addAttachment(item.OID);
                  }
                  this.map.infoWindow.show(point);
                }
              }));
            }
          }
        }
      },

      _addAttachment: function(OID) {
        var ofl = new FeatureLayer(this.resultLayers[this.currentLayerIndex]._origLayerURL);
        ofl.queryAttachmentInfos(OID, lang.hitch(this, function(info){
          if(info.length > 0){
            var domAttSec = dojoQuery(".attachmentsSection", this.map.infoWindow.domNode)[0];
            var aWidget = dijit.getEnclosingWidget(domAttSec);
            array.map(info, lang.hitch(this, function(att){
              var attLi = domConstruct.toDom('<li><a href="' + att.url + '" target="_blank">' + att.name +'</a></li>');
              domConstruct.place(attLi, aWidget._attachmentsList);
            }));
            domClass.remove(domAttSec,'hidden');
            aWidget = null;
          }
        }));
        ofl = null;
      },

      _hideInfoWindow: function () {
        if (this.map && this.map.infoWindow) {
          this.map.infoWindow.hide();
        }
      },

    /******************
     *
     * suppport for Aggregate Indicators tab
     *
     *
     *
     */
        updateIndicator(category_name)
        {
            var attribute_select = this.divAttributeSelect;
            //TODO: do this in a dojo/dijit way, instead of straight javascript
            attribute_select.options.length = 0;
            var o = document.createElement("option");
            o.value = 'NONE';
            o.text = '--- Select ----';
            attribute_select.appendChild(o);
            for (var eaID in window.hashTopic) {
            	if ((window.hashTopic[eaID] == category_name) && (window.hashScale[eaID] == 'NATIONAL')){
            		var numStatistic = 0;
            		var bAverageStatic = false;
            		if (window.hashEAIDToNavHucStats[eaID]!= undefined) {
            			layerStatistic = window.hashEAIDToNavHucStats[eaID];
            			numStatistic = layerStatistic.length;
            			if (window.hashEAIDToNavHucStats[eaID].indexOf(window.NavHucTermForAverage) != -1) {
        					bAverageStatic = true;
            			}
            		}
            		
            		if (window.hashEAIDToTitle[eaID]!= undefined) {
            			if ((numStatistic == 0) || (window.hashEAIDToNavHucStats[eaID].indexOf('sum') != -1)){//if no statistic info is defined, we will choose sum as default
	            			var o = document.createElement("option");
			                o.value = window.hashEAIDToTitle[eaID] + " [sum]";
			                o.text = window.hashEAIDToTitle[eaID] + " [sum]";		
			                attribute_select.appendChild(o);            				
            			}
            			if (bAverageStatic == true) {
	            			var o = document.createElement("option");
			                o.value = window.hashEAIDToTitle[eaID] + " [average]";
			                o.text = window.hashEAIDToTitle[eaID] + " [average]";		
			                attribute_select.appendChild(o);   
            			}
            		 
            		}

            	}
            }

            // enable Recompute Aggregate
            var recompute_button = this.divRecomputeAggregate;
            recompute_button.disabled = true;
        },
        recomputeAggregate() {
            var that = this;
            selfHucNav = this;
            // /wbd/huc/170401040901/upstream/?format=json&attribute_only&navigation_direction=Upstream&attribute_field_nm=FRUITYIELD
            var huc_code_input = this.divNavigationHUCode;

			var titleWhole = this.divAttributeSelect.value;
			
			var bAverageForStatistic;
			var titleLayer;

			termAverageInTopic = " [" + window.NavHucTermForAverage + "]";
			if (titleWhole.slice((-1)*termAverageInTopic.length) == termAverageInTopic) {
				bAverageForStatistic = true;
				titleLayer = titleWhole.substring(0, titleWhole.length-termAverageInTopic.length)
			} else {
				bAverageForStatistic = false;
				titleLayer = titleWhole.substring(0, titleWhole.length-" [sum]".length)
			}
            for (var eaID in window.hashEAIDToTitle) {
            	
            	if ((window.hashEAIDToTitle[eaID] == titleLayer) && (window.hashScale[eaID] == 'NATIONAL')){
					
            		url = window.hashURL[eaID];
        		    var statisticLyr = new FeatureLayer(url, {
				      outFields: window.hashAttribute[eaID]
				    });
				    var sqlExpression = window.hashAttribute[eaID];
				    var avgStatDef = new StatisticDefinition();
				    if (bAverageForStatistic == true) {
				    	avgStatDef.statisticType = "avg";
				    } else {
				    	avgStatDef.statisticType = "sum";
				    }
				    
				    avgStatDef.onStatisticField = sqlExpression;
				    avgStatDef.outStatisticFieldName = "hucNavValue";

				    var queryParams = new Query();
				    queryParams.where = "HUC_12 in (";
				    for (i=0; i < that.hu12_for_recompute.length - 1; i++) {
				    	queryParams.where = queryParams.where + "'" + that.hu12_for_recompute[i] + "',"; 
				    }
				    queryParams.where = queryParams.where + "'" + that.hu12_for_recompute[that.hu12_for_recompute.length - 1] + "')";
				    //queryParams.where = "HUC_12 in ('031800020404', '031800020401')";  // Return all block groups within one mile of the point
				    queryParams.outFields = [window.hashAttribute[eaID]];
				    queryParams.outStatistics = [avgStatDef];
				    
				    statisticLyr.queryFeatures(queryParams, this.getStats, this.errback);
				    
            	}
            }
        },
        getStats(results){

			var titleWhole = selfHucNav.divAttributeSelect.value;
			
			var bAverageForStatistic;
			var titleLayer;
			var navHucStatsUnit;
			var navHucStatsMethod;

			termAverageInTopic = " [" + window.NavHucTermForAverage + "]";
			if (titleWhole.slice((-1)*termAverageInTopic.length) == termAverageInTopic) {
				navHucStatsMethod = "average";
				titleLayer = titleWhole.substring(0, titleWhole.length-termAverageInTopic.length)

			} else {
				navHucStatsMethod = "sum";
				titleLayer = titleWhole.substring(0, titleWhole.length - " [sum]".length)
			}
			
			for (var eaID in window.hashEAIDToTitle) {			
				if ((window.hashEAIDToTitle[eaID] == titleLayer) && (window.hashScale[eaID] == 'NATIONAL')) {			
					navHucStatsUnit = window.hashEAIDToNavHucStatsUnit[eaID];
				}
			}
			        	
        	var stats = results.features[0].attributes;
        	
        	results_data2 = [];
        	results_data2.push({'key': 'Indicator Category', 'value': selfHucNav.divCategorySelect.value});
            results_data2.push({'key': 'Indicator Name', 'value': titleLayer});
            results_data2.push({'key': 'Units', 'value': navHucStatsUnit});
            results_data2.push({'key': 'Statistic', 'value': navHucStatsMethod});
            //results_data2.push({'key': 'Aggregated Value', 'value': stats.hucNavValue.toString()});
            results_data2.push({'key': 'Aggregated Value', 'value': stats.hucNavValue.toFixed(2)});
            

                // create an object store
            var objectStore2 = new Memory({
                data: results_data2
            });
            results2Store2 = new dojo.data.ObjectStore({objectStore: objectStore2});
            selfHucNav.gridAttributeResults.store = results2Store2;

            selfHucNav.gridAttributeResults.render();
            dojo.style(dom.byId("gridAttributeResults"), 'display', '');
            dijit.byId('gridAttributeResults').resize();


        },
        errback(err){
	      console.log("Couldn't retrieve statistics. ", err);
	    },

        recomputeSucceeded(data)
        {
            var t1 = performance.now();
            console.log("++ indicator recompute finished in " + (t1 - t0).toFixed(3) + "ms");

            results_data2 = [];
            if ( ! data['attribute_data']['aggregated_attribute'].hasOwnProperty('attribute_field_nm'))
            {

            }
            else
            {
                var attribute_name = data['attribute_data']['aggregated_attribute']['attribute_field_nm'];

                // enable Recompute Aggregate
                var recompute_button = this.divRecomputeAggregate;
                recompute_button.disabled = true;

                var field_nm = data['attributes']['attributes_tx'];
                var field_meta = data['attributes']['sanitized']['valid_attributes'][attribute_name];

                //TODO: figure out data handling better
                result_tx = '';
                if (data['attribute_data']['aggregated_attribute'].hasOwnProperty('result_va'))
                {
                    var result_va = data['attribute_data']['aggregated_attribute']['result_va'];
                    result_tx = this.numberWithCommas(result_va);
                }

                results_data2.push({'key': 'Indicator Category', 'value': field_meta['category_name']});
                results_data2.push({'key': 'Indicator Name', 'value': field_meta['label_tx']});
                results_data2.push({'key': 'Units', 'value': field_meta['units_tx']});
                results_data2.push({'key': 'Statistic', 'value': field_meta['statistic_cd']});
                results_data2.push({'key': 'Aggregated Value', 'value': result_tx});
            }

                // create an object store
            var objectStore2 = new Memory({
                data: results_data2
            });
            results2Store2 = new dojo.data.ObjectStore({objectStore: objectStore2});
            selfHucNav.gridAttributeResults.store = results2Store2;

            // show grid
            selfHucNav.gridAttributeResults.render();
            dojo.style(dom.byId("gridAttributeResults"), 'display', '');
            dijit.byId('gridAttributeResults').resize();
            //NProgress.done();
        },
        recomputeFailed(data)
        {
            alert('boo!' + data);
            NProgress.done();
        },
    });
  });

/****************************
 *
 *
 * this function prevents input of anything but numbers in the HUC Code input text box
 * Note: which is hidden per EPA directions
 *
 *
 ****************************/


function chkNumeric(evt) {
	evt = (evt) ? evt : window.event;
	var charCode = (evt.which) ? evt.which : evt.keyCode;
	if (charCode > 31 && (charCode < 48 || charCode > 57)) {
		if (charCode == 46) { return true; }
		else { return false; }
	}
	return true;
}
		// //NProgress.done();
		// huc_json = this.results_json.huc12;
		// huc_json.pop();
        //
		// var promises;
		// //data['huc8'] = data.huc12.value.substring(0, 8);
		//
		// if (data.ds_huc12_ids.value.length > 0)
		// {
		// 	// the rest service returns a list of the HUC12s called 'huc12_ids' (using NHD terminology)
		// 	//var huc12_ids = data.huc12_ids;
		//
		// 	huc12_ids_len = data.ds_huc12_ids.value.length;
		//
		// 	// get a list of the HUC8s for HUC12s that were found - these will be shown on the map
		// 	var huc8_ids = [];
		// 	array.forEach(data.ds_huc12_ids.value, function(huc12_id)
		// 	{
		// 		var huc8_id = huc12_id.substring(0, 8);
		// 		// don't add the HUC8 that contains the user clicked HUC12
		// 		if (huc8_id == data.huc8.value)
		// 		{
		// 			return;
		// 		}
		// 		if (huc8_ids.indexOf(huc8_id) === -1)
		// 		{
		// 			// this is a hack to fix a problem in the WBD HUC8
		// 			if (huc8_id == '10160010')
		// 			{
		// 				huc8_ids.push('10160011')
		// 			}
		// 			if (huc8_id == '10160011')
		// 			{
		// 				huc8_ids.push('10160010')
		// 			}
		//
		// 			huc8_ids.push(huc8_id)
		// 		}
		// 	});
		// 	data['downstream_huc8_count_nu']['value'] = huc8_ids.length;
		//
		// 	// now send off the HUC12 query again, this time with a list of all HUC8s just created
		// 	// there is a limit of how many huc12_ids can be included.  it might be line length of the query
		// 	// it seems that the magic number is 90
		// 	var huc12_ids = []
		// 	var deferred_queries = [ ];
		//
		// 	var i,j,temparray;
		// 	// var chunk = 90; // replaced with global setting
		// 	for (i=0,j=data.ds_huc12_ids.value.length; i<j; i += this.huc12_array_slice_size)
		// 	{
		// 	    temparray = data.ds_huc12_ids.value.slice(i, i + this.huc12_array_slice_size);
		//
		// 	    // do whatever
		// 		var query12 = new Query();
		// 		query12.where = "HUC_12 in ('" + temparray.join("','") + "')";
		// 		query12.returnGeometry = true;
		// 		query12.outFields  = [ "*" ];
		//
		// 		this.qtHUC12 = new QueryTask(this.huc12_mapserver);
		// 		var exHUC12 = this.qtHUC12.execute(query12);
		//
		// 		deferred_queries.push(exHUC12);
		// 	}
		//
		//
        //
        //
		//
		// 	if (huc8_ids.length > 0) //  & ! dom.byId("termsCheck").checked)
		// 	{
		// 		var query8 = new Query();
		// 		query8.where = this.huc8_id_field_name + " in ('" + huc8_ids.join("','") + "')";
		// 		query8.returnGeometry = true;
		// 		query8.outFields  = [ "*" ];
        //
		// 		this.qtHUC8 = new QueryTask(this.huc8_mapserver);
		// 		exHUC8 = this.qtHUC8.execute(query8);
		//
		// 		// don't include HUC8s in downstream navigation
		// 		//deferred_queries.push(exHUC8);
		// 	}
		// 	promises = all(deferred_queries);
		//
		// 	promises.then(
		// 			function(data) { that.handleUpstreamNavigationQueryResults(data) }
		// 		);
		//
        //
		// 	console.log("running " + deferred_queries.length + " HUC8 Downstream GIS queries");
		// }
		// else
		// {
		// 	var query12 = new Query();
		// 	query12.where = "HUC_12 = '" + data.huc12 + "'";
		// 	query12.returnGeometry = true;
		// 	query12.outFields  = [ "*" ];
        //
		// 	this.qtHUC12 = new QueryTask(this.huc12_mapserver);
		// 	exHUC12 = this.qtHUC12.execute(query12);
		// 	promises = all([ exHUC12 ]); //
		//
		// 	promises.then(
		// 			function(data) { that.handleUpstreamNavigationQueryResults(data) }
		// 		);
		//
		// 	console.log("running single HUC12 Downstream queries");
		// }
		// huc_json.push({'NAVIGATION_RESULTS': data });
		//
		// this.populate_gridNavResults(data);
		// // show grid
		// dojo.style(dom.byId("gridNavResults"), 'display', '');
		// //dojo.style(dom.byId("gridAttributeResults"), 'display', '');
		//
		// this.results_json.huc12 = huc_json;
		// //if (featHUC12.length == 1)
		// //{
		// //	results_json.huc12.push('GETTING GIS RESULTS <img src=/wbdmap/images/hourglass.gif />');
		// //}
		// //str = 'JSON: ' + JSON.stringify(results_json, null, 4);
        //
		// dom.byId("results").innerHTML = '';