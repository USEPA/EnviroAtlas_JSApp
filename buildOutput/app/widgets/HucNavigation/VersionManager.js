//>>built
define(["jimu/shared/BaseVersionManager"],function(c){function b(){this.versions=[{version:"1.0",upgrader:function(a){return a}},{version:"1.1",upgrader:function(a){return a}},{version:"1.2",upgrader:function(a){a.bufferDefaults.addtolegend=!1;for(var b=0;b<a.layers.length;b++)delete a.layers[b].showattachments;return a}},{version:"1.2.0.1",upgrader:function(a){return a}},{version:"1.2.0.2",upgrader:function(a){a.exportsearchurlchecked=!0;return a}},{version:"1.2.0.3",upgrader:function(a){a.enablePopupsOnResultClick=
!0;return a}},{version:"1.2.0.4",upgrader:function(a){a.graphicalsearchoptions.keepgraphicalsearchenabled=a.oldConfig;a.graphicalsearchoptions.toleranceforpointgraphicalselection=a.toleranceforpointgraphicalselection;a.graphicalsearchoptions.addpointtolerancechecked=a.addpointtolerancechecked;a.graphicalsearchoptions.multipartgraphicsearchchecked=a.multipartgraphicsearchchecked;a.graphicalsearchoptions.buffercheckedbydefaultgraphicaloption=!1;a.graphicalsearchoptions.showmultigraphicsgraphicaloption=
!0;a.graphicalsearchoptions.showaddtolerancegraphicaloption=!0;a.graphicalsearchoptions.showaddsqltextgraphicaloption=!0;a.graphicalsearchoptions.showbuffergraphicaloption=!0;return a}},{version:"1.2.0.5",upgrader:function(a){return a}},{version:"1.2.0.6",upgrader:function(a){return a}},{version:"1.3",upgrader:function(a){return a}},{version:"1.3.0.1",upgrader:function(a){return a}},{version:"1.3.0.2",upgrader:function(a){a.disablePopups=!1;a.disableuvcache=!1;return a}},{version:"2.0.1",upgrader:function(a){return a}},
{version:"2.0.1.1",upgrader:function(a){return a}},{version:"2.0.1.2",upgrader:function(a){return a}},{version:"2.0.1.3",upgrader:function(a){return a}},{version:"2.0.1.4",upgrader:function(a){return a}},{version:"2.1",upgrader:function(a){return a}},{version:"2.1.1",upgrader:function(a){return a}},{version:"2.1.2",upgrader:function(a){return a}},{version:"2.2",upgrader:function(a){return a}},{version:"2.2.1",upgrader:function(a){return a}},{version:"2.3",upgrader:function(a){return a}},{version:"2.4",
upgrader:function(a){return a}},{version:"2.4.0.1",upgrader:function(a){return a}},{version:"2.4.0.2",upgrader:function(a){return a}},{version:"2.5",upgrader:function(a){return a}}]}b.prototype=new c;return b.prototype.constructor=b});