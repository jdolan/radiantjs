'use strict';

/**
 * This is the Controller module of the Radiant MVC stack.
 * 
 * @author jdolan
 */
define('Radiant.Controller', [ 'jQueryUI', 'Radiant.Model', 'Radiant.View' ], function() {

	var module = {}

	/**
	 * The base Menu type.
	 * 
	 * @constructor
	 * 
	 * @param {Object} params The initialization parameters.
	 */
	module.Menu = function(params) {

		this.container = params.container
		this.template = params.template

		var self = this
		this.url = 'templates/' + this.template + '.html'

		this.container.load(this.url, function() {
			$('ul', this).menu({
				select: self.select
			})
		})
	}

	_.extend(module.Menu.prototype, {
		constructor: module.Menu,

		/**
		 * Select event listener for Menu selection.
		 * 
		 * @param {Event} event The Event.
		 * @param {HTMLElement} The selected item.
		 */
		select: function(event, item) {
			// to be overridden
		}

	})

	/**
	 * The main menu.
	 * 
	 * @augments Menu
	 * @constructor
	 * 
	 * @param {Object} params The initialization parameters.
	 */
	module.MainMenu = function(params) {

		params.container = params.container || $('#toolbar')
		params.template = params.template || 'main-menu'

		module.Menu.call(this, params)
	}

	_.extend(module.MainMenu.prototype, module.Menu.prototype, {
		constructor: module.MainMenu,

		/**
		 * Select event listener for Menu selection.
		 * 
		 * @param {Event} event The Event.
		 * @param {HTMLElement} The selected item.
		 */
		select: function(event, item) {
			console.debug(item)
		}
	})

	/**
	 * The Main Controller.
	 * 
	 * @constructor
	 * 
	 * @param {Object} params The initialization parameters.
	 */
	module.Main = function(params) {

		this.preferences = new Radiant.Model.Preferences(params)
		this.layout = new Radiant.View.Classic(params)
		this.menu = new module.MainMenu(params)

		console.log(Radiant.Version + ' initialized')
	}
	
	_.extend(module.Main.prototype, {
		constructor: module.Main
	})

	window.Radiant.Controller = module

	return module
})