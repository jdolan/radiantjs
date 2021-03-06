'use strict'

/**
 * Controller module of the Radiant MVC stack.
 * 
 * @author jdolan
 */
define('Radiant.Controller', [ 'Radiant.Config', 'Radiant.Map', 'Radiant.Layout' ], function() {

	var module = {}

	/**
	 * The <em>Open File..</em> Modal.
	 * 
	 * @constructor
	 * @augments Radiant.Ui.Modal
	 * 
	 * @param {Object} params The initialization parameters.
	 */
	module.OpenFileModal = function(params) {

		params.modal = params.modal || $('#open-file-modal')

		Radiant.Ui.Modal.call(this, params)

		this.input = $('input[type=file]', this.modal)[0]
	}

	$.extend(module.OpenFileModal.prototype, Radiant.Ui.Modal.prototype, {
		constructor: module.OpenFileModal,

		/**
		 * Initializes this OpenFileModal.
		 * 
		 * @param {Object} params The initialization parameters.
		 */
		initialize: function(params) {
			var self = this

			$(':button[name=Cancel]', this.modal).click(function(e) {
				self.hide()
				e.preventDefault()
			})

			$(':button[name=Open]', this.modal).click(function(e) {
				if (self.input.files.length) {
					self.application.loadMap(self.input.files[0])
					self.hide()
				}
				e.preventDefault()
			})

			$('#sample-maps > li > a', this.modal).click(function(e) {
				self.application.loadMap(this.href)
				self.hide()
				e.preventDefault()
			})
		}
	})

	/**
	 * The main Menu.
	 * 
	 * @constructor
	 * @augments Radiant.Ui.Menu
	 * 
	 * @param {Object} params The initialization parameters.
	 */
	module.MainMenu = function(params) {

		params.menu = params.menu || $('#main-menu')

		Radiant.Ui.Menu.call(this, params)
	}

	$.extend(module.MainMenu.prototype, Radiant.Ui.Menu.prototype, {
		constructor: module.MainMenu,

		/**
		 * Initializes this Menu. To be overridden.
		 * 
		 * @param {Object} params The initialization parameters.
		 */
		initialize: function(params) {

			this.openFileModal = new module.OpenFileModal(params)

			var self = this
			$('a[href=#Open]', this.menu).click(function(e) {
				self.openFileModal.show()
			})

			$('a[href=#Close]', this.menu).click(function(e) {
				self.application.loadMap(null)
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

		this.preferences = new Radiant.Config.Preferences(params)
		this.game = new Radiant.Config.Game(params)

		this.layout = new Radiant.Layout.Classic(params)
		this.mainMenu = new module.MainMenu(params)

		this.map = new Radiant.Map.Map()

		console.log(Radiant.Version)
	}

	$.extend(module.Application.prototype, {
		constructor: module.Application,

		/**
		 * Loads a Map from the specified File or URI.
		 * 
		 * Triggers:
		 * <ul>
		 * <li><code>Radiant.Event.Map.Unload</code></li>
		 * <li><code>Radiant.Event.Map.Load</code></li>
		 * </ul>
		 * 
		 * @param {File|String} The .map file or URI.
		 */
		loadMap: function(file) {

			$(this).trigger(Radiant.Event.Map.Unload, this.map)

			if (file) {
				var complete = function(map) {
					this.map = map
					$(this).trigger(Radiant.Event.Map.Load, this.map)
				}

				Radiant.Map.Factory.load(file, complete.bind(this))
			} else {
				this.map = new Radiant.Map.Map()
			}
		},

		/**
		 * Refreshes any stale information in the application. This is called
		 * once per frame by the Layout.
		 * 
		 * @param {Number} time Milliseconds since start.
		 */
		update: function(time) {

			if (this.map) {
				this.map.update()
			}
		}
	})

	window.Radiant.Controller = module

	return module
})