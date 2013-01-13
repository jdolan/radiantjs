/**
 * This module provides interface elements (widgets).
 */
define('Radiant.Ui', [ 'Radiant.Util' ], function() {

	var module = {}

	/**
	 * The base Menu type. These menus emulate Apple OS X.
	 * 
	 * @constructor
	 * 
	 * @param {Object} params The initialization parameters.
	 */
	module.Menu = function(params) {

		this.application = params.application
		this.menu = params.menu

		var self = this

		// Bind the click handler for all menu items
		$('li > a', self.menu).click(function(e) {
			// Resolve the item which received the click
			var that = $(this).parent()[0]
			// For node items, expand their tree and hide others
			if ($('> ul', that).length) {
				var siblings = $(this).closest('ul').find('> li')
				siblings.each(function(index, item) {
					if (this == that) {
						$(this).find('> a').addClass('active')
						$(this).find('> ul').show()
					} else {
						$(this).find('> a').removeClass('active')
						$(this).find('> ul').hide()
					}
				})
				// For clicks, enable auto-expand of siblings
				if (!e.isTrigger) {
					self.context = $(this).closest('ul').find('> li > a')
				}
			} else { // For leaf items, simply close the menu
				self.close()
			}
		})

		// Auto-expand sibling menus in the active context
		$('li > a', self.menu).mouseenter(function(e) {
			if ($(this).is(self.context)) {
				$(this).click()
			}
		})

		// Swallow click events anywhere within the menu to remain visible
		$(self.menu).click(function(e) {
			e.stopPropagation()
		})

		// But hide the menu if the user clicks elsewhere on the page
		$('body').click(function(e) {
			self.close()
		})

		self.initialize(params)
	}

	$.extend(module.Menu.prototype, {
		constructor: module.Menu,

		/**
		 * Initializes this Menu. To be overridden.
		 * 
		 * @param {Object} params The initialization parameters.
		 */
		initialize: function(params) {
			// to be overridden
		},

		/**
		 * Closes all expanded sub-menus of this menu.
		 */
		close: function() {

			$('li > a', this.menu).removeClass('active')
			$('li > ul', this.menu).hide()

			this.context = null
		}
	})

	/**
	 * The base Modal type.
	 * 
	 * @params {Object} The initialization parameters.
	 */
	module.Modal = function(params) {

		this.application = params.application
		this.modal = params.modal
		this.options = params.options || {

		}

		this.initialize(params)
	}

	$.extend(module.Modal.prototype, {
		constructor: module.Modal,

		/**
		 * Initializes this Dialog. To be overridden.
		 * 
		 * @param {Object} params The initialization parameters.
		 */
		initialize: function(params) {
			// to be overridden
		},

		/**
		 * Shows this Modal.
		 */
		show: function() {
			this.modal.show().center()
		},

		/**
		 * Hides this Modal.
		 */
		hide: function() {
			this.modal.hide(this.options)
		}
	})

	window.Radiant.Ui = module

	return module
})