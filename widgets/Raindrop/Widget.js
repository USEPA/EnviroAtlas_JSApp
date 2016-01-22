define([
      'dojo/_base/declare',
      'jimu/BaseWidget'],
    'jimu/dijit/TabContainer',
function(declare, BaseWidget, TabContainer) {
  //To create a widget, you need to derive from BaseWidget.
  return declare([BaseWidget], {
    // DemoWidget code goes here

    //please note that this property is be set by the framework when widget is loaded.
    //templateString: template,

    baseClass: 'jimu-widget-Raindrop',

    postCreate: function() {
      this.inherited(arguments);
      console.log('postCreate');
    },

    startup: function() {
      this.inherited(arguments);
      this.mapIdNode.innerHTML = 'map id:' + this.map.id;

      //add slider for Maximum Raindrop Distance in kilometers
      //var slider = new HorizontalSlider({
      //  name: "slider",
      //  value: 5,
      //  minimum: 1,
      //  maximum: 250,
      //  discreteValues: 250,
      //  intermediateChanges: false,
      //  style: "width:300px;",
      //  onChange: function (value) {
      //    dom.byId("sliderValue").value = value;
      //    buffDist = value;
      //    //alert(buffDist);
      //  }
      //}, "slider").startup();
      console.log('startup');
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