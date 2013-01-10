'use strict';

/**
 * This is the Controller module of the Radiant MVC stack.
 * 
 * @author jdolan
 */
define('Radiant.Controller', [ 'jQueryUI', 'Radiant.Model', 'Radiant.View' ], function() {

	var module = {}

	/**
	 * Returns the URL of the specified template.
	 * 
	 * @param {String} template The template name (e.g. 'main-menu').
	 * 
	 * @return {String} The URL of the template.
	 */
	var T = function(template) {
		return 'templates/' + template + '.html'
	}

	/**
	 * The base Menu type.
	 * 
	 * @constructor
	 * 
	 * @param {Object} params The initialization parameters.
	 */
	module.Menu = function(params) {
		var self = this

		this.application = params.application
		this.container = params.container
		this.template = params.template

		this.container.load(this.template, function() {
			self.menu = $('ul', this).menu()
			self.bindUiEvents()
		})
	}

	_.extend(module.Menu.prototype, {
		constructor: module.Menu,

		/**
		 * Bind UI events to elements loaded into this menu. To be overridden.
		 */
		bindUiEvents: function() {
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
		params.template = params.template || T('main-menu')

		module.Menu.call(this, params)
	}

	_.extend(module.MainMenu.prototype, module.Menu.prototype, {
		constructor: module.MainMenu,

		/**
		 * Bind UI events to elements loaded in this menu.
		 */
		bindUiEvents: function() {
			var self = this
			
			$('a[href=#Open]', this.menu).click(function(e) {
				$('#dialog').load(T('file-open')).dialog({
					title: 'Select a .map file..',
					buttons: {
						Open: function() {
							var file = $('#map-file')[0].files[0]
							self.application.map = Radiant.Model.MapFactory.load(file)
							$(this).dialog('close')
						},
						Cancel: function() {
							$(this).dialog('close')
						}
					}
				})
			})
		}
	})

	/**
	 * The application entry point.
	 * 
	 * @constructor
	 * 
	 * @param {Object} params The initialization parameters.
	 */
	module.Application = function(params) {
		
		params.application = this

		this.preferences = new Radiant.Model.Preferences(params)
		this.layout = new Radiant.View.Classic(params)
		this.menu = new module.MainMenu(params)
		this.map = new Radiant.Model.Map(params)

		console.log(Radiant.Version)
	}

	_.extend(module.Main.prototype, {
		constructor: module.Application,
		
		/**
		 * 
		 */
		
	})

	window.Radiant.Controller = module

	return module
})