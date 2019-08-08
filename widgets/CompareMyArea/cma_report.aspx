<%@ Page Language="VB" AutoEventWireup="false" CodeFile="cma_report.aspx.vb" Inherits="cma_report" %>
<!DOCTYPE html>
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    
    <meta name="viewport" content="initial-scale=1, maximum-scale=1,user-scalable=no">
    <title>Compare My Area| EnviroAtlas | US EPA</title>
    <link rel="stylesheet" href="//js.arcgis.com/3.24/dijit/themes/claro/claro.css" />
    <link rel="stylesheet" href="//js.arcgis.com/3.24/esri/css/esri.css" />
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">
    <link rel="stylesheet" href="//ajax.googleapis.com/ajax/libs/dojo/1.10.4/dojo/resources/dojo.css" />
    <link rel="stylesheet" href="//ajax.googleapis.com/ajax/libs/dojo/1.10.4/dojox/grid/resources/claroGrid.css" />
  <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
  <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js"></script>
    <style>
      td, th {
        border: 1px solid #A8A8A8;
        padding: 0.88235em;
    }
      .arrow_right {
    background: #EEEEEE url(images/arrow_right.png) no-repeat left !important;
}
.arrow_down {
    background: #EEEEEE url(images/arrow_down.png) no-repeat left !important;
}
.pagetop {
  text-align: right;
}
.pagetop > a {
  font-size: 12pt;
  margin-right: 0.5em;
  padding: 0 0.25em;
  text-decoration: none;
}
.pagetop > a:before {
  background: no-repeat center/100% url(images/pagetop.svg);
  content: '';
  display: inline-block;
  height: 1em;
  margin: -0.2667em 0.25em 0 0;
  vertical-align: middle;
  width: 1em;
}
.pagetop > a:hover {
  text-decoration: underline;
}
.panel-title > a {
  text-decoration: none;
}
.panel-group {
    margin-bottom: 0;
}
.panel-body {
    padding: 0;
}
.chart {
    width: 96%;
    height: 400px;
}
.legend {
    width: 96%;
    text-align: center;
}
.dojoxLegendNode td {
    border-width: 0!important;
}
input[type=submit] {
    font-size: 12px;
    padding: 2px 4px 2px 4px;
}
.note {
    font-size: 9pt;
    font-style: italic;

}
/* .panel-title > a:after {
  content: "\2212";
  float: right!important;
  position: relative;
  top: 1px;
  display: inline-block;
  font-family: 'Glyphicons Halflings';
  font-style: normal;
  font-weight: normal;
  line-height: 1;
}
.panel-title > a.collapsed:after {
  content: "\002b";
}

.panel-default > .panel-heading {
    background-color: #CCFFFF;
} */
    </style>
    <script type="text/javascript">
        dojoConfig = {
            dojoxGfxSvgProxyFrameUrl: "gfxSvgProxyFrame.html",
            parseOnLoad: true //enables declarative chart creation
            //gfxRenderer: "svg,vml" // svg is first priority, adding silverlight with Column chart gives err.                
        };
    </script>
    <script src="https://js.arcgis.com/3.24/"></script>
    <script>
      require([
        "dojo/dom", "dojo/on","dojo/promise/all",'./configLocal.js',
        'dojo/_base/Color',
        "esri/request",
        "esri/symbols/SimpleFillSymbol",
 'esri/symbols/SimpleMarkerSymbol',
 'esri/symbols/SimpleLineSymbol',
 'esri/renderers/SimpleRenderer',
        "esri/tasks/query", "esri/tasks/QueryTask",
        "esri/tasks/PrintTask","esri/tasks/PrintParameters","esri/tasks/PrintTemplate",
        'dojox/charting/Chart',
'dojox/charting/plot2d/ClusteredColumns',
'dojox/charting/widget/SelectableLegend',
'dojox/charting/action2d/Highlight',
'dojox/charting/action2d/Tooltip',
'dojox/charting/plot2d/Grid',
'dojox/charting/plot2d/Markers',
'dojox/charting/axis2d/Default',
'dojox/grid/DataGrid',
'dojo/data/ItemFileWriteStore',
'dojox/gfx/utils',
        "dojo/domReady!"
      ], function (dom, on,all,_config,
      Color,
      esriRequest,
      SimpleFillSymbol,
  SimpleMarkerSymbol,
  SimpleLineSymbol,
  SimpleRenderer,
   Query, QueryTask,PrintTask, PrintParameters, PrintTemplate,
   Chart,ClusteredColumns,SelectableLegend,Highlight,Tooltip) {
        heightNum = 531*dojo.byId('CMA_bannerHUC').width/2560;
        heightStr = Math.ceil(heightNum).toString();
        dojo.setStyle("CMA_bannerHUC", "height", heightStr + "px");
        //dojo.setStyle("CMA_bannerHUC", "height", heightStr + "px");
        var tractid = getQueryVariable('tract');
        if ((!(tractid)) || (tractid.length != 11)) {
            alert("Please pass in 11-digits Tract ID!");
            document.write('<script type="text/javascript">');
            window.stop();
            if ((i = navigator.userAgent.indexOf('MSIE')) >= 0) {document.execCommand("Stop");};
        }
        var cmamap = _config.nata.mapurl;
        var enotestr = _config.nata.enote;
        var acsmapurl = _config.demog.mapurl;
        var printServerURL = _config.print.mapurl;
        var nataLayers = _config.nata.natalayers;
        var demogLayers = _config.demog.demoglayers;

        var trindex = nataLayers.tract.layerid;
       
        var themeObj = _config.themeObj;

        var acsfields =[];
        for (var a in themeObj["demog"].fields) {
            acsfields.push(a);
        }
        var nacelltd = '<td style="text-align:left; width:10%;">N/A</td>';
        var natametatd = '<td style="text-align:center; width:20%"><a href="https://www.epa.gov/national-air-toxics-assessment/2014-national-air-toxics-assessment" target="_blank">2014 NATA</a></td>';
        var acsmetatd = '<td style="text-align:center; width:20%"><a href="https://www.census.gov/programs-surveys/acs/data/summary-file.2016.html" target="_blank">2012-2016 ACS</a></td>';
        var hasOpener = true;
        var headerjson = {};
        var getImageStatus = false;
        var nolegend = true;
        var pname = location.pathname.replace(/\/[^/]+$/, '');
        var rooturl = location.protocol + "//" + location.host + pname;
        //console.log("path: " + rooturl)
        document.forms['Form1']['pdfBut'].style.display = "none";
        try {
            if ((!(opener)) || (!(opener.map)) || (!(opener.map.extent))) {
                //document.getElementById("mapDiv").style.display = "none";
                hasOpener = false;
            }
        } catch (e) {
            hasOpener = false;
        }
        if (hasOpener) generateImage(opener.map);
        else getMap();
        document.getElementById("titlediv").innerHTML = tractid
        var queryArray = [];
        var demogqueryArray = [];
        var query = new Query();
            
            query.outFields = ['*'];
        var dquery = new Query();
            dquery.returnGeometry = false;
            dquery.outFields = acsfields;

        processNata();
        
        
        $(".collapse").on('show.bs.collapse', function(e){
            $(e.target)
            .prev('.panel-heading')
            .toggleClass('arrow_down arrow_right');
            
        });
        $(".collapse").on('hide.bs.collapse', function(e){
            $(e.target)
            .prev('.panel-heading')
            .toggleClass('arrow_right arrow_down');
        });
        checkStatus();
        function getQueryVariable(variable) {
              var query = window.location.search.substring(1);
              var vars = query.split("&");
              for (var i = 0; i < vars.length; i++) {
                  var pair = vars[i].split("=");
                  if (pair[0].toLowerCase() == variable.toLowerCase()) {
                      return pair[1];
                  }
              } // end of for loop
          }
        function processNata() {
            
            
            var tractwhere = nataLayers['tract'].idfield +"='" + tractid + "'";
            var countywhere = nataLayers['county'].idfield +"='" + tractid.substr(0,5) + "'";
            var stwhere = nataLayers['state'].idfield +"='" + tractid.substr(0,2) + "'";
            pushQuery(nataLayers['tract'].layerid,tractwhere);
            pushQuery(nataLayers['county'].layerid,countywhere);
            pushQuery(nataLayers['state'].layerid,stwhere);

            var promises = all(queryArray);
            promises.then(handleNataResults);
        }

        function processDemog() {
            var tractwhere = demogLayers['tract'].idfield +"='" + tractid + "'";
            var countywhere = demogLayers['county'].idfield +"='" + tractid.substr(0,5) + "'";
            var stwhere = demogLayers['state'].idfield +"='" + tractid.substr(0,2) + "'";
            pushDemogQuery(demogLayers['tract'].layerid,tractwhere);
            pushDemogQuery(demogLayers['county'].layerid,countywhere);
            pushDemogQuery(demogLayers['state'].layerid,stwhere);
            var promises = all(demogqueryArray);
            promises.then(handleDemogResults);
        }
        function handleDemogResults(results) {
            if (results.length == 0){
                document.getElementById("demogdiv").innerHTML = "Did not find the tract '" + tractid + "'";
                return false;
            }
            var demogFieldObj = themeObj["demog"].fields;
            
            var demogtble = '';
            for (var dfield in demogFieldObj) {
                var demogdesc = demogFieldObj[dfield].description;
                demogtble += '<tr><td style="text-align:left; width:40%;">' + demogdesc + '</td>';

                if (results[0].features.length > 0) {
                    var tractatts = results[0].features[0].attributes;
                    var dvalue = tractatts[dfield];
                    
                    if (dvalue == null) {
                        dvalue = "N/A";
                        demogFieldObj[dfield]["tract"] = null;
                    } else {
                        dvalue = dvalue.toFixed(1);
                        demogFieldObj[dfield]["tract"] = dvalue;
                    } 
                    demogtble += '<td style="text-align:right; width:10%;">' + dvalue + '</td>';
                    
                } else {
                    demogtble += nacelltd;
                    demogFieldObj[dfield]["tract"] = null;
                }
                if (results[1].features.length > 0) {
                    var cntyatts = results[1].features[0].attributes;
                    var dvalue = cntyatts[dfield];
                    if (dvalue == null) {
                        dvalue = "N/A";
                        demogFieldObj[dfield]["county"] = null;
                    } else {
                        dvalue = dvalue.toFixed(1);
                        demogFieldObj[dfield]["county"] = dvalue;
                    } 
                    demogtble += '<td style="text-align:right; width:10%;">' + dvalue + '</td>';
                    
                } else {
                    demogtble += nacelltd;
                    demogFieldObj[dfield]["county"] = null;
                }
                if (results[2].features.length > 0) {
                    var statts = results[2].features[0].attributes;
                    var dvalue = statts[dfield];
                    if (dvalue == null) {
                        dvalue = "N/A";
                        demogFieldObj[dfield]["state"] = null;
                    } else {
                        dvalue = dvalue.toFixed(1);
                        demogFieldObj[dfield]["state"] = dvalue;
                    } 
                    demogtble += '<td style="text-align:right; width:10%;">' + dvalue + '</td>';
                    
                } else {
                    demogtble += nacelltd;
                    demogFieldObj[dfield]["state"] = null;
                }
                demogtble += acsmetatd + '</tr>';
                
            }
            demogtble += '</table>';
          document.getElementById("demogdiv").innerHTML = '<table style="width: 100%;">' + getHeaderTR() + demogtble;
          
          themeObj["demog"].status = true;
          generateChart("demog");
        }

        function pushQuery(layerid,wherestr) {
            //console.log(cmamap + "/" + layerid);
            query.returnGeometry = false;
            query.where = wherestr;
            var queryTask = new QueryTask(cmamap + "/" + layerid);
            queryArray.push(queryTask.execute(query));
        }
        function pushDemogQuery(layerid,wherestr) {
            //console.log(acsmapurl + "/" + layerid);
            dquery.where = wherestr;
            var queryTask = new QueryTask(acsmapurl + "/" + layerid);
            demogqueryArray.push(queryTask.execute(dquery));
        }        
        function handleNataResults(results) {
            
            try {
                            
                if (results[0].features.length == 0) {
                    dojo.byId("container").innerHTML = "Did not find the tract '" + tractid + "'";
                    return false;
                }
                var tractatt = results[0].features[0].attributes;
                var cntyatt = results[1].features[0].attributes;
                var stateatt = results[2].features[0].attributes;
                var tnamefld = nataLayers["tract"].namefield;
                
                nataLayers["tract"].name = tractatt[tnamefld];
                var cnamefld = nataLayers["county"].namefield;
                nataLayers["county"].name = cntyatt[cnamefld]
                var snamefld = nataLayers["state"].namefield;
                nataLayers["state"].name =stateatt[snamefld];
                
                for (var theme in themeObj) {
                    if (themeObj[theme].isNATA) {
                        if (themeObj[theme].subsets) {
                            for (var subtheme in themeObj[theme].subsets) {
                                var fldobj = themeObj[theme].subsets[subtheme].fields;
                                for (var fld in fldobj) {
                                    var d = Number(fldobj[fld].digits);
                                    var nvalue = tractatt[fld];
                                    if (nvalue != null) {
                                        if (Number(nvalue) < 0.00005) {
                                            fldobj[fld].tract = nvalue.toExponential(d);
                                            themeObj[theme].hasscinote = true;
                                        } else fldobj[fld].tract = nvalue.toFixed(d);
                                        //fldobj[fld].tract = nvalue.toFixed(d);
                                    } else {
                                        fldobj[fld].tract = null;
                                    }
                                    var cvalue = cntyatt[fld];
                                    if (cvalue != null) {
                                        if (Number(cvalue) < 0.00005) {
                                            fldobj[fld].county = cvalue.toExponential(d);
                                            themeObj[theme].hasscinote = true;
                                        } else fldobj[fld].county = cvalue.toFixed(d);
                                        //fldobj[fld].county = cvalue.toFixed(d);
                                    } else {
                                        fldobj[fld].county = null;
                                    }
                                    var svalue = stateatt[fld];
                                    if (svalue != null) {
                                        if (Number(svalue) < 0.00005) {
                                            fldobj[fld].state = svalue.toExponential(d);
                                            themeObj[theme].hasscinote = true;
                                        } else fldobj[fld].state = svalue.toFixed(d);
                                        //fldobj[fld].state = svalue.toFixed(d);
                                    } else {
                                        fldobj[fld].state = null;
                                    }
                                }
                                
                            }
                        } else if (themeObj[theme].fields) {
                            var fldobj = themeObj[theme].fields;
                            for (var fld in fldobj) {
                                var d = Number(fldobj[fld].digits);
                                var nvalue = tractatt[fld];
                                if (nvalue != null) {
                                    if (Number(nvalue) < 0.00005) {
                                        fldobj[fld].tract = nvalue.toExponential(d);
                                        themeObj[theme].hasscinote = true;
                                    } else fldobj[fld].tract = nvalue.toFixed(d);
                                    //fldobj[fld].tract = nvalue.toFixed(d);
                                } else {
                                    fldobj[fld].tract = null;
                                }
                                var cvalue = cntyatt[fld];
                                if (cvalue != null) {
                                    if (Number(cvalue) < 0.00005) {
                                        fldobj[fld].county = cvalue.toExponential(d);
                                        themeObj[theme].hasscinote = true;
                                    } else fldobj[fld].county = cvalue.toFixed(d);
                                    //fldobj[fld].county = cvalue.toFixed(d);
                                } else {
                                    fldobj[fld].county = null;
                                }
                                var svalue = stateatt[fld];
                                if (svalue != null) {
                                    if (Number(svalue) < 0.00005) {
                                        fldobj[fld].state = svalue.toExponential(d);
                                        themeObj[theme].hasscinote = true;
                                    } else fldobj[fld].state = svalue.toFixed(d);
                                    //fldobj[fld].state = svalue.toFixed(d);
                                } else {
                                    fldobj[fld].state = null;
                                }
                            }
                        }
                        themeObj[theme].status = true;
                        
                    }
                }
                    
                getCharts();

                headerjson = {"desc": "Indicators and Indices","tract":"Tract "+ nataLayers["tract"].name, "county": nataLayers["county"].name + " County", "state": nataLayers["state"].name };

                getTable();
            } catch (err) {
                alert("error occurred when parsing NATA json result: " + err);
            }
            processDemog();
        }
        function getCharts() {
            for (var theme in themeObj) {
                if (themeObj[theme].isNATA) {
                    if (themeObj[theme].subsets) {
                        for (var subtheme in themeObj[theme].subsets) {
                            generateChart(theme,subtheme);
                        }
                    } else {
                        generateChart(theme);
                    }
                }
            }
        }
        function getTable() {
            for (var t in themeObj) {
                var notestr = '';
                if (themeObj[t].note) {
                    notestr = themeObj[t].note;
                }
                if (themeObj[t].hasscinote) {
                    notestr += enotestr;
                }    
                var dvid = themeObj[t].divid;
                var notedivid = "notediv" + dvid;
                if (dojo.byId(notedivid)) dojo.byId(notedivid).innerHTML = notestr;
                themeObj[t].note = notestr;
                if (themeObj[t].isNATA) {
                    var tablestr = '<table style="width: 100%;">';
                    var headerstring = getHeaderTR();
                    tablestr += headerstring;

                    if (themeObj[t].subsets) {
                        for (var sb in themeObj[t].subsets) {
                            var sobj = themeObj[t].subsets[sb];
                            var surfixstr = sobj.surfix;
                            var fieldsobj = sobj.fields;
                            for (var f in fieldsobj) {
                                
                                var desc = fieldsobj[f].description;

                            
                                var tvalue = fieldsobj[f]["tract"];
                                if (tvalue == null) tvalue = "";
                                var cvalue = fieldsobj[f]["county"];
                                if (cvalue == null) cvalue = "";
                                var svalue = fieldsobj[f]["state"];
                                if (svalue == null) svalue = "";
                                if (fieldsobj[f].cumulate) {
                                    tablestr += '<tr><td style="text-align:left; width:40%;">' + desc + ' ' + surfixstr + '</td>';
                                    tablestr += '<td style="text-align:right; width:10%;">' + tvalue + '</td>';
                                    tablestr += '<td style="text-align:right; width:10%;">' + cvalue + '</td>';
                                    tablestr += '<td style="text-align:right; width:10%;">' + svalue + '</td>';
                                    tablestr += natametatd + '</tr>';
                                } else {
                                    var cmetalink = fieldsobj[f].metalink;
                                    var cdesc = '<a href="' + cmetalink + '" class="cdt_link" target="_blank">Outdoor Air - ' + desc + ' ' + surfixstr + '</a>';
                                    
                                    tablestr += '<tr><td style="text-align:left; width:40%;">&nbsp;&nbsp;&nbsp;' + cdesc + '</td>';
                                    tablestr += '<td style="text-align:right; width:10%;">' + tvalue + '</td>';
                                    tablestr += '<td style="text-align:right; width:10%;">' + cvalue + '</td>';
                                    tablestr += '<td style="text-align:right; width:10%;">' + svalue + '</td>';
                                    tablestr += natametatd + '</tr>';

                                }
                            }
                        }
                    } else {
                        var surfixstr = themeObj[t].surfix;
                        var fieldsobj = themeObj[t].fields;
                        for (var c in fieldsobj) {
                            var rdata = fieldsobj[c];
                            var desc = rdata["description"];
                            var tractvalue = rdata["tract"];
                            if (tractvalue == null) tractvalue = "";
                            var countyvalue = rdata["county"];
                            if (countyvalue == null) countyvalue = "";
                            var statevalue = rdata["state"];
                            if (statevalue == null) statevalue = "";
                            var cmetalink = rdata["metalink"];
                            var cdesc = '<a href="' + cmetalink + '" class="cdt_link" target="_blank">Outdoor Air - ' + desc + ' ' + surfixstr + '</a>';
                            
                            tablestr += '<tr><td style="text-align:left; width:40%;">' + cdesc + '</td>';
                            tablestr += '<td style="text-align:right; width:10%;">' + tractvalue + '</td>';
                            tablestr += '<td style="text-align:right; width:10%;">' + countyvalue + '</td>';
                            tablestr += '<td style="text-align:right; width:10%;">' + statevalue + '</td>';
                            tablestr += natametatd + '</tr>';

                        }
                    }
                    tablestr += '</table>';
                    dojo.byId(t+'div').innerHTML = tablestr;
                }
            }
            
          }

          function getHeaderTR() {
            var headertble = '';
            headertble += '<tr style="color:white;background-color:#0098C9; font-weight: bold;">';
            headertble += '<td style="text-align:center; width:40%;">Indicators and Indices</td>';
            headertble += '<td style="text-align:center; width:10%;" id="headerTract">Tract '+ nataLayers["tract"].name + '</td>';
            headertble += '<td style="text-align:center; width:10%;" id="headerCounty">' + nataLayers["county"].name + ' County</td>';
            headertble += '<td style="text-align:center; width:10%;" id="headerState">' + nataLayers["state"].name + '</td>';
            headertble += '<td style="text-align:center; width:20%;">Data Info/Notes</td>';
            headertble += '</tr>';
            headertble += '';
            
            return headertble;
          }
          function getMap() {
              dojo.byId("imgDiv").style.width = "100%";
              dojo.byId("imgDiv").style.height = "300px";
              dojo.byId("imgDiv").style.visibility = "hidden";
              var fillSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASHDOT,
                new Color([255,0,0]), 2),new Color([255,255,0,0.25]));
           
            
                var queryTask = new QueryTask(cmamap + "/" + trindex);
                var tractidfld = nataLayers.tract.idfield;
                var wherestr = tractidfld + "='" + tractid + "'";
                var query = new Query();

                query.returnGeometry = true;
                query.where = wherestr;
                query.outFields = ['*'];
                query.outSpatialReference = new esri.SpatialReference({ wkid: 102100 });
                queryTask.execute(query,function(results){
                    if (results.features.length>0) {
                        //map.graphics.clear();
                        var tractfeat = results.features[0];
                        tractfeat.setSymbol(fillSymbol);
                        var uExtent = tractfeat.geometry.getExtent().expand(3);
                        var map = new esri.Map("imgDiv", {
                            //wrapAround180: true,
                            basemap: "topo",
                            extent: uExtent
                        });
                        map.on("load", function(){
                           map.graphics.add(tractfeat);
                           generateImage(map);
                        });
                        
                        /*  map.on("extent-change",function() {
                            console.log("start generate map image")
                            generateImage(map)
                        });  */
                    }
                    
                }, function(err){
                    
                    console.log("error occurred: " + err);
                });
           
            
          }
          function checkStatus() {
              var allstatus = true;
              for (var t in themeObj) {
                  var astatus = themeObj[t].status;
                    allstatus = (allstatus && astatus);
              }
              
              if ((allstatus) && (getImageStatus)) {
                
                document.forms['Form1']['cjsonstr'].value = JSON.stringify(themeObj);
                document.forms['Form1']['headerjson'].value = JSON.stringify(headerjson);
                document.forms['Form1']['pdfBut'].style.display = "block";
              } else {
                setTimeout(function () {
                    checkStatus();
                }, 500);
              }
          }
          function generateChart(theme,subtheme) {
              //console.log("generate chart for " + theme);
              var workobj;
              if (typeof subtheme == "undefined") {
                  subtheme = "";
                workobj = themeObj[theme];
              } else {
                workobj = themeObj[theme].subsets[subtheme];
              }
              var chartobj = workobj.fields;
              var s =workobj.divid;
              var ctitle = workobj.description;
              var legendid = "ejlegendNode" + s;
              var chartid = "ejchartNode" + s;

            var chartTract = [];
            var chartCounty = [];
            var chartState = [];
            var chartLabels = [];
            
            for (var c in chartobj) {
                var obj = chartobj[c];
                if (!(obj.cumulate)) {
                    var ldesc = obj["description"];
                    
                    chartLabels.push(ldesc);
                    chartTract.push(Number(obj["tract"]));
                    chartCounty.push(Number(obj["county"]));
                    chartState.push(Number(obj["state"]));
                    //console.log(ldesc + ": " +obj["tract"]);
                }

            }
            


            chartDataObj = {
                "tractVals": chartTract,
                "countyVals": chartCounty,
                "stateVals": chartState,
                "labels": chartLabels
            };

            

            var xLabels = [];
            for (var i = 0; i < chartDataObj.labels.length; i++) {
                xLabels.push({ value: i + 1, text: chartDataObj.labels[i] });
            }

            levelegObj = {
                tract: { color: "#ff9966", highlight: "#ff5500", label: "Tract (" + tractid + ")"},
                county: { color: "#99cc66", highlight: "#557733", label: "County (" + nataLayers["county"].name + ")" },
                state: { color: "#3399ff", highlight: "#2266BB", label: "State (" + nataLayers["state"].name + ")" }

            }
        chart = new Chart(chartid, {
            title: ctitle,
            titlePos: "top",
            titleGap: 0,
            titleFont: "normal normal normal 12pt Tahoma",
            titleFontColor: "black",
            htmlLabels: false,
            margins: { l: 0, t: 0, r: 0, b: 0 }

        });

        //main chart
        chart.addPlot("default", {
            type: ClusteredColumns,
            markers: true,
            gap: 12
        });
        //background lines on chart
        chart.addPlot("grid", { type: dojox.charting.plot2d.Grid,
            hMajorLines: true,
            hMinorLines: false,
            vMajorLines: false,
            vMinorLines: false,
            width: 800,
            majorHLine: { color: "#D3D3D3", width: 1 },
            renderOnAxis: false
        });
        var unitstr = workobj.unit;
        var tstr = workobj.xtitle;
        chart.addAxis("x", { title: tstr, htmlLabels: true, titleOrientation: "away", titleFont: "normal normal normal 9pt Tahoma", labels: xLabels, dropLabels: false, rotation: 30, font: "normal normal normal 7pt Verdana", fontColor: "#000000", majorTick: { length: 0 }, minorTick: { length: 0 }, majorTickStep: 1, minorTickStep: 0, minorLabels: false }); //set major tick to 1, minor to 0 so draws every step of data but doesn't fill in decimals between integers.
        chart.addAxis("y", { title: unitstr,  htmlLabels: true, titleFont: "normal normal normal 9pt Tahoma", vertical: true, min: 0}); //gridline fix: set max to 101 and fixUpper to minor ticks. 100 cuts off top grid line. 101 adds bit of padding.

                chart.addSeries(levelegObj.state.label, chartDataObj.stateVals, { stroke: 'white', fill: levelegObj.state.color });
                chart.addSeries(levelegObj.county.label, chartDataObj.countyVals, { stroke: 'white', fill: levelegObj.county.color });
                chart.addSeries(levelegObj.tract.label, chartDataObj.tractVals, { stroke: 'white', fill: levelegObj.tract.color });
            
            
            new dojox.charting.action2d.Highlight(chart, "default");
            var pattern = "<span style='font-family:Verdana;font-size: 9px !important'><strong>{0}</strong><br>{1}:&nbsp;{2}</span>";
            var tip = new dojox.charting.action2d.Tooltip(chart, "default", { text:
                    function (o) {
                        return dojo.replace(pattern, [o.run.name, xLabels[o.index].text, o.y]);
                    }
            });

            chart.render();
            if (dojo.byId(legendid)) {
                var columnsLegend = new dojox.charting.widget.Legend({ chart: chart,series: chart.series.reverse()}, legendid);
            }
            
                //reset hidden fields
            document.forms['Form1'][theme+subtheme + 'Chart'].value = "";
            //put svg into hidden fields for export
            dojox.gfx.utils.toSvg(chart.surface).then(
                     function (svg) {
                        //console.log(svg)
                        document.forms['Form1'][theme+subtheme + 'Chart'].value = svg;

                     },
                    function (error) {
                        alert("Error occurred: " + error);
                    }
                );
            if (nolegend) {
                var legendtablestr = JSON.stringify(levelegObj);
                
                
                document.forms['Form1']['commonLegend'].value = legendtablestr;
                
                nolegend = false;
            }

          }
          function generateImage(omap) {
              var layoutOptions = {
                'scalebarUnit': 'Miles'
            };
            var printTask = new PrintTask(printServerURL);
            var template = new esri.tasks.PrintTemplate();
            template.exportOptions = {
                width: omap.width,
                height: omap.height,
                dpi: 96
            };
            template.format = "PNG32";
            template.layout = "MAP_ONLY";
            template.layoutOptions = layoutOptions;
            template.preserveScale = true;
            template.showAttribution = false;

            var params = new esri.tasks.PrintParameters();
            params.map = omap;
            params.template = template;

            //alert(params.toJson().Web_Map_as_JSON);
            printTask.execute(params, function (result) {

                if (result.url) {
                    //console.log(result.url);
                    var mapimageurl = result.url;
                    dojo.byId("imgDiv").style.width = "100%";
                    dojo.byId("imgDiv").style.visibility = "visible";
                    document.getElementById("imgDiv").innerHTML = "<img src='" +  mapimageurl + "' alt='map image' title='map image' />";
                    document.forms['Form1']['mapimage'].value = mapimageurl;
                    getImageStatus = true;
                }
            },
            function (err) {
                console.log("error occurred when generating map image: " + err);
                getImageStatus = true;
            });
          }
      });
    </script>
  </head>

  <body class="claro">
        <a name="top"></a>
    <div id="container" class="container">
        <img id="CMA_bannerHUC" src="images/header.png" style="width: 100%; height: 231px;" alt="CMA banner" />
        <div style="font-size: 32px;width: 100%; text-align: center;">Community Data Table for Census Tract <span id="titlediv"></span></div>
            <form id="Form1" runat="server" target="_blank"> 	
             <asp:Button ID="pdfBut" runat="server" Text="Save as PDF" title="Save this report as PDF" style="display: none;" />
             <asp:HiddenField ID="envconChart" runat="server" Value="" />
             <asp:HiddenField ID="humanexpoChart" runat="server" Value="" />
             <asp:HiddenField ID="riskcancerChart" runat="server" Value="" />
             <asp:HiddenField ID="riskrespChart" runat="server" Value="" />
             <asp:HiddenField ID="riskneuroChart" runat="server" Value="" />
             <asp:HiddenField ID="demogChart" runat="server" Value="" />
             <asp:HiddenField ID="commonLegend" runat="server" Value="" />
             <asp:HiddenField ID="cjsonstr" runat="server" Value="" />
             <asp:HiddenField ID="headerjson" runat="server" Value="" />      
             <asp:HiddenField ID="mapimage" runat="server" Value="" />      
          </form>
        <div>
            <div id="imgDiv" style="text-align:center;"></div>
            <br>
            <div style="text-align:center; font-size:10pt;">
                The default indicators in the table are based on EPA-related issues, stakeholder feedback, 
                and available data.<br />There may be other important issues that are not currently included in this table.
            </div>
        </div>
        <div id="headerdiv"></div>
        <div class="panel-group">
          <div class="panel panel-default">
            <div class="panel-heading arrow_down">
              <h4 class="panel-title">
                <a data-toggle="collapse" href="#collapse1" aria-expanded="true">&nbsp;Environmental Concentration Estimates</a>
              </h4>
            </div>
            <div id="collapse1" class="panel-collapse collapse in">
              <div class="panel-body" id="envcondiv">Loading...</div>
              
              <div id="notediv1" class="note"></div>
              <br />
              <div id="ejchartNode1" class="chart"></div>
            <br />
            <center><div id="ejlegendNode1" class="legend"></div></center>
            </div>
      
          </div>
        </div>
        <div class="panel-group">
          <div class="panel panel-default">
            <div class="panel-heading arrow_down">
              <h4 class="panel-title">
                <a data-toggle="collapse" href="#collapse2" aria-expanded="true">&nbsp;Human Exposure Estimates</a>
              </h4>
            </div>
            <div id="collapse2" class="panel-collapse collapse in">
              <div class="panel-body" id="humanexpodiv">Loading...</div>
              
              <div id="notediv2" class="note"></div>
              <br />
              <div id="ejchartNode2" class="chart"></div>
            <br />
              <center><div id="ejlegendNode2" class="legend"></div></center>
            </div>
      
          </div>
        </div>
        <div class="panel-group">
            <div class="panel panel-default">
              <div class="panel-heading arrow_down">
                <h4 class="panel-title">
                  <a data-toggle="collapse" href="#collapse3" aria-expanded="true">&nbsp;Health Risk Estimates</a>
                </h4>
              </div>
              <div id="collapse3" class="panel-collapse collapse in">
                <div class="panel-body" id="riskdiv">Loading...</div>
                
                <div id="notediv3" class="note"></div>
              <br />
                <div id="ejchartNode3-1" class="chart"></div><br />
                <div id="ejchartNode3-2" class="chart"></div><br />
                <div id="ejchartNode3-3" class="chart"></div>
            <br />
            <center><div id="ejlegendNode3-1" class="legend"></div></center>
              </div>
        
            </div>
          </div>
          <div class="panel-group">
            <div class="panel panel-default">
              <div class="panel-heading arrow_down">
                <h4 class="panel-title">
                  <a data-toggle="collapse" href="#collapse4" aria-expanded="true">&nbsp;Demographic, Social and Economic Indicators</a>
                </h4>
              </div>
              <div id="collapse4" class="panel-collapse collapse in">
                <div class="panel-body" id="demogdiv">Loading...</div>
                <div id="notediv1" class="note"></div>
              <br />
                <div id="ejchartNode4" class="chart"></div>
            <br />
            <center><div id="ejlegendNode4" class="legend"></div></center>
              </div>
        
            </div>
          </div>
          <p></p>
          <p><a href="https://www.epa.gov/national-air-toxics-assessment/nata-limitations" target="_blank">NATA Limitations</a><br>
            <a href="https://www.epa.gov/national-air-toxics-assessment/nata-frequent-questions" target="_blank">NATA Frequent Questions</a>
         </p>
          <div style="font-family: Verdana; font-size:9pt;">
            <sup>1</sup> <a href="https://www.epa.gov/national-air-toxics-assessment/nata-frequent-questions#emm10" target="_blank">How does EPA estimate cancer risk?</a> See <a href="https://www.epa.gov/national-air-toxics-assessment/2014-national-air-toxics-assessment" target="_blank">NATA 2014</a> for more details.
            <br>
            <sup>2</sup> Hazard Quotient is the ratio of the potential exposure to the substance and the level at which no adverse effects are expected. 
            <br>&nbsp;&nbsp; Please see <a href="https://www.epa.gov/national-air-toxics-assessment/nata-glossary-terms" target="_blank">NATA: Glossary of Terms</a> for more information.
        </div>
        <br />
        <p class="pagetop"><a href="#top">Top of page</a></p>
      </div>
      
  </body>
</html>


