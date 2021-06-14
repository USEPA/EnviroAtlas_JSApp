///////////////////////////////////////////////////////////////////////////
// Robert Scheitlin WAB eSearch Widget
///////////////////////////////////////////////////////////////////////////
/*global define*/
/*jslint nomen: true, sloppy: true*/
define(['dojo/_base/declare',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dojo/_base/lang',
  'dojo/_base/html',
  'dojo/on'
  ],
  function (declare, _WidgetBase, _TemplatedMixin, lang, html, on) {
    return declare([_WidgetBase, _TemplatedMixin], {
      baseClass: 'widgets-Search-setting-include-button',
      templateString: '<div><span nowrap style="white-space:nowrap;">${nls.include}' +
        '</span><div class="include-arrow"></div></div>',
      nls: null,

      postMixInProperties: function () {
        this.inherited(arguments);
      },

      postCreate: function () {
        this.inherited(arguments);
        this.own(on(this.domNode, 'click', lang.hitch(this, function () {
          this.onClick();
        })));
      },

      enable: function () {
        html.addClass(this.domNode, 'enable');
      },

      disable: function () {
        html.removeClass(this.domNode, 'enable');
      },

      onClick: function () {}

    });
  });
