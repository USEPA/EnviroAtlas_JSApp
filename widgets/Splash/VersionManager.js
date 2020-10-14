///////////////////////////////////////////////////////////////////////////
// Copyright © Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////
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
        var newConfig = oldConfig;
        if (newConfig && newConfig.splash) {
          newConfig.splash.showOption = true;
        }

        return newConfig;
      }
    }, {
      version: '1.4',
      upgrader: function(oldConfig){
        var newConfig = oldConfig;
        if (newConfig && newConfig.splash) {
          newConfig.splash.backgroundColor = "#485566";
          newConfig.splash.confirmEverytime = false;
        }

        return newConfig;
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
      upgrader: function(oldConfig) {
        var newConfig = oldConfig;
        if (newConfig && newConfig.splash) {
          var splash = newConfig.splash;
          if ("undefined" !== typeof splash.backgroundColor) {
            splash.confirm = {
              "text": splash.confirmText || "",
              "color": "#ffffff",
              "transparency": "0"
            };
            splash.size = {
              "mode": "wh",
              "wh": {
                "w": 600,
                "h": null
              }
            };
            splash.background = {
              "mode": "color",
              "color": splash.backgroundColor,
              "transparency": "0"
            };
            splash.button = {
              "color": "#518dca",
              "transparency": "0"
            };

            splash.contentVertical = "top";

            splash.confirmText = null;
            delete splash.confirmText;
            splash.backgroundColor = null;
            delete splash.backgroundColor;
          }
        }

        return newConfig;
      }
    }];
  }

  VersionManager.prototype = new BaseVersionManager();
  VersionManager.prototype.constructor = VersionManager;
  return VersionManager;
});