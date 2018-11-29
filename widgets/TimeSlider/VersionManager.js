define(['jimu/shared/BaseVersionManager'],
function(BaseVersionManager) {
  function VersionManager(){
    this.versions = [{
      version: '1.0',
      upgrader: function(oldConfig){
        return oldConfig;
      }
    }, {
      version: '1.1',
      upgrader: function(oldConfig){
        return oldConfig;
      }
    }, {
      version: '1.2',
      upgrader: function(oldConfig){
        return oldConfig;
      }
    }, {
      version: '1.3',
      upgrader: function(oldConfig){
        return oldConfig;
      }
    }, {
      version: '1.4',
      upgrader: function(oldConfig){
        return oldConfig;
      }
    }, {
      version: '2.0Beta',
      upgrader: function(oldConfig) {
        return oldConfig;
      }
    }, {
      version: '2.0',
      upgrader: function(oldConfig) {
        return oldConfig;
      }
    }, {
      version: '2.0.1',
      upgrader: function(oldConfig) {
        return oldConfig;
      }
    }, {
      version: '2.1',
      upgrader: function(oldConfig) {
        return oldConfig;
      }
    }, {
      version: '2.2',
      upgrader: function(oldConfig){
        return oldConfig;
      }
    }, {
      version: '2.3',
      upgrader: function(oldConfig){
        return oldConfig;
      }
    }, {
      version: '2.4',
      upgrader: function(oldConfig){
        var newConfig = oldConfig;
        newConfig.timeFormat = "auto";

        return newConfig;
      }
    }, {
      version: '2.5',
      upgrader: function(oldConfig){
        return oldConfig;
      }
    }, {
      version: '2.6',
      upgrader: function(oldConfig){
        return oldConfig;
      }
    }, {
      version: '2.7',
      upgrader: function(oldConfig){
        return oldConfig;
      }
    }, {
      version: '2.8',
      upgrader: function(oldConfig){
        var newConfig = oldConfig;
        newConfig.autoPlay = true;

        return newConfig;
      }
    }, {
      version: '2.9',
      upgrader: function(oldConfig){
        var newConfig = oldConfig;
        newConfig.loopPlay = true;

        newConfig.isHonorWebMap = true;

        return newConfig;
      }
    }];
  }

  VersionManager.prototype = new BaseVersionManager();
  VersionManager.prototype.constructor = VersionManager;
  return VersionManager;
});