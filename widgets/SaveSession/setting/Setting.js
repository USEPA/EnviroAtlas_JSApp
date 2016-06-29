///////////////////////////////////////////////////////////////////////////
// Copyright © 2015 Softwhere Solutions. All Rights Reserved.
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
/*global console, define, dojo */
define([
    'dojo/_base/declare',
    'jimu/BaseWidgetSetting',
    'dijit/_WidgetsInTemplateMixin',
    "dojo/_base/lang",
    'dojo/on',
    'dojo/json',
    'dojo/Deferred',
    "dojo/dom-style",
    "dojo/dom-attr",
    'jimu/dijit/Message',
    'dijit/form/ValidationTextBox',
    'jimu/dijit/CheckBox'
],
    function (
        declare,
        BaseWidgetSetting,
        _WidgetsInTemplateMixin,
        lang,
        on,
        dojoJSON,
        Deferred,
        domStyle,
        domAttr,
        Message,
        ValidationTextBox,
        CheckBox
    ) {
        return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {

            baseClass: 'jimu-widget-savesession-setting',

            startup: function () {
                this.inherited(arguments);
                this.setConfig(this.config);
            },

            setConfig: function (config) {
                this.config = config;

                if (config.useServerToDownloadFile) {
                    this.shouldUseServerToDownloadFile.setValue(true);
                }

                if (config.saveToFileUrl) {
                    this.saveToFileUrl.set('value', config.saveToFileUrl);
                }

                if (config.fileNameForAllSessions) {
                    this.fileNameForAllSessions.set('value', config.fileNameForAllSessions);
                }
                if (config.fileNameTplForSession) {
                    this.fileNameTplForSession.set('value', config.fileNameTplForSession);
                }
            },

            getConfig: function () {
                this.config.useServerToDownloadFile = this.shouldUseServerToDownloadFile.getValue();
                this.config.saveToFileUrl = this.saveToFileUrl.get('value');
                this.config.fileNameForAllSessions = this.fileNameForAllSessions.get('value');
                this.config.fileNameTplForSession = this.fileNameTplForSession.get('value');
                return this.config;
            }
        });
    });