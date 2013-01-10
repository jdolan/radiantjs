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
			self.initialize(params)
		})
	}

	_.extend(module.Menu.prototype, {
		constructor: module.Menu,

		/**
		 * Initializes this Menu. To be overridden.
		 * 
		 * @param {Object} params The initialization parameters.
		 */
		initialize: function(params) {
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
		 * Initializes this Menu. To be overridden.
		 * 
		 * @param {Object} params The initialization parameters.
		 */
		initialize: function(params) {
			var self = this
			$('a[href=#Open]', this.menu).click(function(e) {
				$('#dialog').load(T('file-open')).dialog({
					title: 'Select a .map file..',
					buttons: {
						Open: function() {
							var file = $('#file-open-file')[0].files[0]
							self.application.loadMap(file)
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

	_.extend(module.Application.prototype, {
		constructor: module.Application,

		/**
		 * Loads a Radiant.Model.Map from the specified File. Triggers the
		 * <code>onLoadMap</code> Event on success.
		 * 
		 * @param {File} The .map file.
		 */
		loadMap: function(file) {

			var callback = function(map) {
				this.map = map
				$(this).trigger(Radiant.Event.Map.Loaded, this.map)
			}

			Radiant.Model.MapFactory.load(file, callback.bind(this))
		}
	})

	window.Radiant.Controller = module

	return module
})