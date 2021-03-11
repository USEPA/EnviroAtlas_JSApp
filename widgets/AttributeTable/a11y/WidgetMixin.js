define([
	'dojo/_base/declare',
	'dojo/_base/array',
	'dojo/_base/lang',
	'dojo/_base/html',
	'dojo/on',
	'dojo/aspect',
	'dojo/keys',
	'dijit/focus',
	'dojo/topic',
	'jimu/utils',
	'jimu/LayoutManager'
], function (declare, array, lang, html, on, aspect, keys, focus, topic, jimuUtils, LayoutManager) {
	return declare(null, {

		_layoutManager: null,
		_focusedTab: null,
		focusToDisplay: false,
		hasBeenActivated: false, //widget has been manually activated, such as by pressing the ENTER key

		postCreate: function() {
			this.inherited(arguments);

			this._layoutManager = LayoutManager.getInstance();

			this.focusToDisplay = true;
			this.hasBeenActivated = this.config.initiallyExpand;

			this.own(on(this.domNode, 'keydown', lang.hitch(this, function (evt) {
				if(html.hasClass(evt.target, this.baseClass) && evt.keyCode === keys.ENTER) {
					this.focusToDisplay = false;
					this.hasBeenActivated = true;
					if(!this.showing) {
						this.widgetManager.activateWidget(this);//active it to add z-index for dashboardTheme
						this._switchTable(); //show widget temporarily
					}
				}
			})));
			this.own(on(this.domNode, 'focus', lang.hitch(this, function () {
				if(jimuUtils.isInNavMode() && this.focusToDisplay && !this.showing) {
					this.widgetManager.activateWidget(this); //active it to add z-index for dashboardTheme
					this._switchTable(); //show widget temporarily
				}
			})));
			this.own(on(this.domNode, 'blur', lang.hitch(this, function () {
				if(jimuUtils.isInNavMode() && this.focusToDisplay && this.showing) {
					if(!this.hasBeenActivated) {
						this._switchTable(); //hide widget
					}
				}
				this.focusToDisplay = true; // turn it back on
				// turn flags off when the widget is mimimized
				if(!this.showing) {
					this.hasBeenActivated = false;
				}
			})));

			this.own(
				// listen to event when a feature table is created / activated
				topic.subscribe(this.id + '_table_created', lang.hitch(this, function(args) {
					var grid = args && args.grid;
					this._applyA11y2Grid(grid, args && args.context);
				})),
				// listen to event when a toolbar is created / activated
				topic.subscribe(this.id + '_toolbar_created', lang.hitch(this, function(args) {
					var toolbar = args && args.toolbar;
					this._applyA11y2Toolbar(toolbar, args && args.context);
				}))
			);
		},

		applyA11y: function () {

			// handle Launchpad and Billboard themes
			if(this._isOnlyTable()){
				html.removeAttr(this.domNode, 'tabindex');
			}

			// step 1:
			//
			if(this.switchBtn) {
				this.own(
					on(this.switchBtn, 'keydown', lang.hitch(this, function (e) {
						if(e.keyCode === keys.ENTER) {
							this._switchTable();
							this.focusToDisplay = this.showing;
							this.__focus2WidgetNode();
						}
					}))
				);
			}

			// step 2: tab container or no data message
			//
			if(this.tabContainer && this.tabContainer.hasChildren()) {
				this._applyA11y2TabContainer(this.tabContainer);
			} else {
				if(this.NoTableMessageDiv) {
					html.setAttr(this.NoTableMessageDiv, {tabindex: '0'});
					jimuUtils.initFirstFocusNode(this.domNode, this.NoTableMessageDiv);
					jimuUtils.initLastFocusNode(this.domNode, this.NoTableMessageDiv);
					this.own(
						on(this.NoTableMessageDiv, 'keydown', lang.hitch(this, function (evt) {
							if(evt.keyCode === keys.ESCAPE) {
								this.__escape2WidgetSwitch(evt);
							}
						}))
					);
					if(this._isOnlyTable()){
						focus.focus(this.NoTableMessageDiv);
					}
				}
			}
		},

		_applyA11y2TabContainer: function(tabContainer) {
			if(!tabContainer) return;

			var self = this;

			var _activeCloseButtonTabIndex = function(activeControlButton) {
				if(!activeControlButton) return;

				// mute tab indexes for all other tabs
				array.forEach(tabContainer.tablist.getChildren(), function(controlButton) {
					if(!controlButton.active &&
						controlButton.closeButton &&
						controlButton.id !== activeControlButton.id
					) {
						html.setAttr(controlButton.closeNode, 'tabindex', -1);
					}
				});
				// activate tab index for the active tab
				html.setAttr(activeControlButton.closeNode, 'tabindex', 0);
			};

			// step 1:
			// monkey patch the StackController in the tabContainer
			//
			var oldOnkeyDownMethod = tabContainer.tablist.onkeydown;

			// override the "adjacent" method in dijit/layout/StackController
			var __stackAdjacent = function(forward, context){
				if(!context.isLeftToRight() &&
					(!context.tabPosition || /top|bottom/.test(context.tabPosition))
					) {
					forward = !forward;
				}
				var children = context.getChildren();
				var idx = array.indexOf(children, context.pane2button(
					self._focusedTab ?
					self._focusedTab.page && self._focusedTab.page.id :
						context._currentChild.id)),
					current = children[idx];
				var child;

				do{
					idx = (idx + (forward ? 1 : children.length - 1)) % children.length;
					child = children[idx];
				}while(child.disabled && child !== current);

				return child;
			};

			tabContainer.tablist.onkeydown = function(e, fromContainer) {
				var forward = null, applyOldMethod = false;
				switch(e.keyCode) {
					case keys.LEFT_ARROW:
					case keys.UP_ARROW:
						if(!e._djpage){
							forward = false;
						}
						break;
					case keys.PAGE_UP:
						if(e.ctrlKey){
							forward = false;
						}
						break;
					case keys.RIGHT_ARROW:
					case keys.DOWN_ARROW:
						if(!e._djpage){
							forward = true;
						}
						break;
					case keys.PAGE_DOWN:
						if(e.ctrlKey){
							forward = true;
						}
						break;
					case keys.HOME:
						var children = this.getChildren();
						for(var idx = 0; idx < children.length; idx++){
							var child = children[idx];
							if(!child.disabled){
								focus.focus(child.focusNode);
								self._focusedTab = child;
								break;
							}
						}
						e.stopPropagation();
						e.preventDefault();
						break;
					case keys.END:
						var children = this.getChildren();
						for(var idx = children.length - 1; idx >= 0; idx--){
							var child = children[idx];
							if(!child.disabled){
								focus.focus(child.focusNode);
								self._focusedTab = child;
								break;
							}
						}
						e.stopPropagation();
						e.preventDefault();
						break;
					case keys.DELETE:
					case "W".charCodeAt(0):    // ctrl-W
						// remove default delete keyboard behavior
						if(this._currentChild.closable &&
							(e.keyCode == keys.DELETE || e.ctrlKey)){
							e.stopPropagation();
							e.preventDefault();
						}
						break;
					case keys.ENTER:
					case keys.SPACE:
						self.tabForwardStep = 0;
						break;
					case keys.ESCAPE:
						if(e.target.title === 'Close') {
							self._focusedTab && focus.focus(self._focusedTab.focusNode);
						} else {
							self.__escape2WidgetSwitch(e);
						}
						e.stopPropagation();
						e.preventDefault();
						break;
					case keys.TAB:
						if(self.isLoading()) {
							e.stopPropagation();
							e.preventDefault();
							return;
						}
						break;
					default:
						applyOldMethod = true;
				}

				if(forward !== null) {
					self._focusedTab = __stackAdjacent(forward, this);
					focus.focus(self._focusedTab.focusNode);

					e.stopPropagation();
					e.preventDefault();
				}

				if(applyOldMethod) {
					oldOnkeyDownMethod.apply(this, arguments);
				}
			};

			// step 2:
			// make first tab as the first focusable node in widget
			//
			if(tabContainer.hasChildren()) {
				array.forEach(tabContainer.getChildren(), lang.hitch(this, function(tab) {
					if(!tab.controlButton.checked) {
						html.setAttr(tab.controlButton.focusNode, 'aria-selected', 'false');
					}
					if(tab.closable) {
						html.setAttr(tab.controlButton.closeNode, 'role', 'button');
					}
				}));

				var firstTabChild = tabContainer.tablist.getChildren()[0];

				this._focusedTab = firstTabChild;
				jimuUtils.initFirstFocusNode(this.domNode, firstTabChild.focusNode);
				if(firstTabChild.closeNode) {
					_activeCloseButtonTabIndex(firstTabChild);
				}
				if(this._isOnlyTable() &&
					 (this.appConfig.theme.name ==='LaunchpadTheme' ||
						this.appConfig.theme.name ==='BillboardTheme')) { // TODO: have a better check?
					focus.focus(firstTabChild.focusNode);
				}
			}

			// step 3:
			// attach event handlers
			//

			this.own(
				aspect.after(tabContainer, 'selectChild', function() {
					var controlButton = lang.getObject(
						'controlButton',
						false,
						this.selectedChildWidget);
					if(controlButton) {
						jimuUtils.initFirstFocusNode(self.domNode, controlButton.focusNode);
						if(controlButton.closeNode) {
							_activeCloseButtonTabIndex(controlButton);
						}
					}

					self._focusedTab = controlButton;
				}),
				// reset _focusedTab when tablist loses focus
				on(tabContainer.tablist, 'blur', lang.hitch(this, function() {
					this._focusedTab = null;
				}))
				// // reset _focusedTab when tablist loses focus
				// on(tabContainer.tablist, 'keydown', lang.hitch(this, function(e) {
				// 	if(e.keyCode === keys.ESCAPE) {
				// 		if(e.target.title === 'Close') {
				// 			this._focusedTab && focus.focus(this._focusedTab.focusNode);
				// 		} else {
				// 			this.__escape2WidgetSwitch(e);
				// 		}
				// 		e.stopPropagation();
				// 		e.preventDefault();
				// 	}
				// }))
			);
		},

		_applyA11y2Toolbar: function(toolbar, context) {
			if(!toolbar) {
				return;
			}
			// step 1:
			// override the default on left / right arrow click navigation
			//
			lang.mixin(toolbar, {
				_onLeftArrow: function() {/* null */},
				_onRightArrow: function() {/* null */}
			});

			// step 2:
			// attach keyboard event handlers
			//
			this.own(
				on(toolbar, 'keydown', lang.hitch(this, function(e) {
					if(e.keyCode === keys.TAB) {
						if(e.shiftKey) {
							if(e.target.id === toolbar._getFirstFocusableChild().id) {
								return;
							}
						} else {
							if(e.target.id === toolbar._getLastFocusableChild().id) {
								return;
							}
						}
						e.shiftKey ? toolbar.focusPrev() : toolbar.focusNext();
						e.stopPropagation();
						e.preventDefault();
					} else if(e.keyCode === keys.ESCAPE) {
						this.__escape2ActiveTab(e);
					}
				}))
			);
			if(context && context.toggleColumnsMenuItem) {
				this.own(
					on(context.toggleColumnsMenuItem, 'click', lang.hitch(this, function(e) {
						if(jimuUtils.isInNavMode()) {
							var grid  = this._activeTable && this._activeTable.grid;
							this.__applyA11y2GridHiderMenu(grid);
						}
					}))
				)
			}
		},

		_applyA11y2Grid: function(grid, context) {
			if(!grid || !grid.hiderToggleNode || !grid.hiderMenuNode) {
				return;
			}

			var toggleNode = grid.hiderToggleNode,
					menuNode = grid.hiderMenuNode;

			// step 1:
			// set last focus node to the column hider button in the active grid
			// as the last focusable node in the widget
			//
			jimuUtils.initLastFocusNode(this.domNode, toggleNode);

			// step 2:
			// attach keyboard handlers
			//
			if(!grid._customEvtHandlersInitialized) {
				this.own(
					on(grid, 'keydown', lang.hitch(this, function(e) {
						if(e.keyCode === keys.ESCAPE) {
							this.__escape2ActiveTab(e);
						}
					})),
					on(toggleNode, 'keydown', lang.hitch(this, function(e) {
						if(e.keyCode === keys.SPACE || e.keyCode === keys.ENTER) {
							grid._toggleColumnHiderMenu();
							this.__applyA11y2GridHiderMenu(grid);
							e.stopPropagation();
							e.preventDefault();
						}
					})),
					on(menuNode, 'keydown', lang.hitch(this, function(e) {
						if(e.keyCode === keys.ESCAPE) {
							toggleNode.focus();
							if(grid._hiderMenuOpened) {
								grid._toggleColumnHiderMenu(e);
							}
							e.stopPropagation();
							e.preventDefault();
						}
					}))
				);
				grid._customEvtHandlersInitialized = true;
			}

			if(this._focusedTab && this._focusedTab.checked && context) {
				html.setAttr(
					this._focusedTab.focusNode,
					'aria-labelledby',
					this._focusedTab.focusNode.id + ' ' + this.id + '_' + context.id + '_footer'
				);
			}
		},

		__escape2WidgetSwitch: function(e) {
			if(this.switchBtn) {
				this.switchBtn.focus();
			} else {
				if(jimuUtils.isDomFocusable(this.domNode)) {
					this.__focus2WidgetNode();
				} else {
					this._controllerDiv && this._controllerDiv.focus();
				}
			}

			if(this.closeable && this._isOnlyTable()) {
				if(this.widgetManager) {
					var oncreenIcons = this._layoutManager &&
					this._layoutManager.layoutManager &&
					this._layoutManager.layoutManager.onScreenWidgetIcons;
					var widgetonScreenIcon;
					array.some(oncreenIcons, lang.hitch(this, function(iconObj) {
						if(iconObj && iconObj.widgetConfig && iconObj.widgetConfig.id === this.id) {
							widgetonScreenIcon = iconObj;
							return true;
						}
					}));
					if(widgetonScreenIcon) {
						widgetonScreenIcon.domNode.focus();
					} else {
						this.widgetManager.closeWidget(this); // close widget to focus the icon
					}
				}
			}

			if(e) {
				e.stopPropagation();
				e.preventDefault();
			}
		},

		__focus2WidgetNode: function() {
			this.domNode.focus();
		},

		__escape2ActiveTab: function(e) {
			jimuUtils.focusFirstFocusNode(this.domNode);
			if(e) {
				e.stopPropagation();
				e.preventDefault();
			}
		},

		__applyA11y2GridHiderMenu: function(grid) {
			if(grid && grid._hiderMenuOpened) {
				var menuNode = grid.hiderMenuNode;
				var isMenuHasChild = menuNode.children && menuNode.children.length > 0;
				if(isMenuHasChild) {
					var firstChild = menuNode.children[0],
							lastChild = menuNode.children[menuNode.children.length - 1];
					var firstChildCheck = firstChild.querySelector('input');

					// init focusable nodes in the column hider menu
					jimuUtils.initFirstFocusNode(menuNode, firstChild.querySelector('input'));
					jimuUtils.initLastFocusNode(menuNode, lastChild.querySelector('input'));

					if(firstChildCheck) {
						firstChildCheck.focus();
					}
				}
			}
		},

		__focusOnActiveTab: function(){
			setTimeout(lang.hitch(this, function(){
				jimuUtils.focusFirstFocusNode(this.domNode);
			}),600);
		}

	});
});