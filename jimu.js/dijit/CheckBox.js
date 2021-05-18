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

define([
  'dojo/_base/declare',
  'dijit/_WidgetBase',
  'dojo/_base/lang',
  'dojo/_base/html',
  'dojo/dom-class',
  //'dojo/on',
  'dojo/Evented',
  "./a11y/CheckBox"
],
function (declare, _WidgetBase, lang, html, domClass, /*on, */Evented, a11y) {
  var clazz = declare([_WidgetBase, Evented], {
    baseClass: 'jimu-checkbox',
    declaredClass: 'jimu.dijit.CheckBox',

    checked: false,
    disabled: false, //checkBoxDijit.set("disabled", "true"/"disabled" or "false")
    status: true, //isEnable
    label: "",
    title: "", //it's used for screen reader when no label'

    postCreate: function () {
      this.checkNode = html.create('div', {
        'class': 'checkbox jimu-float-leading jimu-icon jimu-icon-checkbox'
      }, this.domNode);
      this.labelNode = html.create('div', {
        'class': 'label jimu-float-leading',
        innerHTML: this.label || ""
      }, this.domNode);
      if (this.checked) {
        html.addClass(this.checkNode, 'checked');
        html.addClass(this.checkNode, 'jimu-icon-checked');
      }

      this.status = this._getStatusByDisabled(this.disabled);//for back compatibility
      if (!this.status) {
        html.addClass(this.domNode, 'jimu-state-disabled');
        html.addClass(this.checkNode, 'jimu-state-disabled');
      }
      this.a11y_setDisabled(!this.status);

      this.own(this.watch("disabled", lang.hitch(this, function () {
        this.setStatus(this._getStatusByDisabled(this.disabled));
      })));

      this._udpateLabelClass();

      this.a11y_init();
    },

    setLabel: function (label) {
      this.label = label;
      this.labelNode.innerHTML = this.label;
      this.labelNode.title = this.label;
      this.a11y_updateAriaLabel(label);

      this._udpateLabelClass();
    },

    _udpateLabelClass: function () {
      if (this.labelNode) {
        if (this.labelNode.innerHTML) {
          html.removeClass(this.labelNode, 'not-visible');
        } else {
          html.addClass(this.labelNode, 'not-visible');
        }
      }
    },

    setValue: function (value) {
      if (!this.status) {
        return;
      }
      if (value === true) {
        this.check();
      } else {
        this.uncheck();
      }
    },

    getValue: function () {
      return this.checked;
    },

    setStatus: function (newStatus) {
      newStatus = !!newStatus;

      var isStatusChanged = (this.status !== newStatus);
      this.status = newStatus;

      if (this.status) {
        domClass.remove(this.domNode, 'jimu-state-disabled');
        html.removeClass(this.checkNode, 'jimu-state-disabled');
      } else {
        domClass.add(this.domNode, 'jimu-state-disabled');
        html.addClass(this.checkNode, 'jimu-state-disabled');
      }

      this.a11y_setDisabled(!this.status);

      if (isStatusChanged) {
        this.emit('status-change', newStatus);
      }
    },

    getStatus: function () {
      return this.status;
    },

    check: function (notEvent) {
      if (!this.status) {
        return;
      }
      this.checked = true;
      this.a11y_changeAriaCheckedAttr();
      html.addClass(this.checkNode, 'checked jimu-icon-checked');
      html.removeClass(this.checkNode, 'checked jimu-icon-checkbox');
      if (!notEvent) {
        this.onStateChange();
      }
    },

    uncheck: function (notEvent) {
      if (!this.status) {
        return;
      }
      this.checked = false;
      this.a11y_changeAriaCheckedAttr();
      html.removeClass(this.checkNode, 'checked');
      html.removeClass(this.checkNode, 'jimu-icon-checked');
      html.addClass(this.checkNode, 'jimu-icon-checkbox');

      if (!notEvent) {
        this.onStateChange();
      }
    },

    onStateChange: function () {
      if (this.onChange && lang.isFunction(this.onChange)) {
        this.onChange(this.checked);
      }
      this.emit('change', this.checked);
    },

    focus: function () {
      if (this.checkNode && this.checkNode.focus) {
        this.checkNode.focus();
      }
    },

    _getStatusByDisabled: function (disable) {
      if (true === disable || "true" === disable || "disabled" === disable) {
        return false;
      }

      return true;
    }
  });

  clazz.extend(a11y);//for a11y
  return clazz;
});