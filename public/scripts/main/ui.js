'use strict'

/**
 * This module provides interface elements (widgets).
 */
define('Radiant.Ui', [ 'Radiant.Util' ], function() {

	var module = {}

	/**
	 * Centers this jQuery object on the screen.
	 */
	jQuery.fn.center = function() {
		this.css({
			position: 'absolute',
			top: (($(window).height() - $(this).height()) / 2) + 'px',
			left: (($(window).width() - $(this).width()) / 2) + 'px'
		})
		return this
	}

	/**
	 * Makes this jQuery object draggable.
	 */
	jQuery.fn.draggable = function() {
		var self = this
		this.mousedown(function(e) {
			var offset = self.offset()
			self.data('drag', {
				offsetX: e.pageX - offset.left,
				offsetY: e.pageY - offset.top,
				select: self.css('user-select')
			})
			self.css('user-select', 'none')
		})
		this.mousemove(function(e) {
			var drag = self.data('drag')
			if (drag != undefined) {
				self.offset({
					left: e.pageX - drag.offsetX,
					top: e.pageY - drag.offsetY
				})
			}
		})
		this.mouseup(function(e) {
			var drag = self.data('drag')
			if (drag != undefined) {
				self.css('user-select', drag.select)
				self.removeData('drag')
			}
		})
		return this
	}

	/**
	 * Makes this jQuery object a menu. The element should resemble:
	 * 
	 * <code>
	 * <ul class='menu'>
	 *   <li><a href='#Item1'>Item1</a></li>
	 *   <li><a href='#Item2'>Item2</a>
	 *     <ul>
	 *       <li><a href='#Item2.1'>Item2.1</a></li>
	 *       <li><a href='#Item2.2'>Item2.2</a></li>
	 *     </ul>
	 *   </li>
	 * </ul>
	 * </code>
	 */
	jQuery.fn.menu = function(action) {

		var self = this

		if (action == 'close') {
			$('li > a', this).removeClass('active')
			$('li > ul', this).hide()
			this.removeData('menu-siblings')
		} else {
			// Handle click events on all items
			$('li > a', this).click(function(e) {
				var clicked = $(this).parent()
				// For node items, show their children
				if ($('> ul', clicked).length) {
					var siblings = $(this).closest('ul').find('> li')
					siblings.each(function(index, item) {
						if ($(this).is(clicked)) {
							$(this).find('> a').addClass('active')
							$(this).find('> ul').show()
						} else {
							$(this).find('> a').removeClass('active')
							$(this).find('> ul').hide()
						}
					})
					// Enable auto-expand of siblings
					if (!e.isTrigger) {
						self.data('menu-siblings', $('> a', siblings))
					}
				} else { // For leaf items, simply close the menu
					self.menu('close')
				}
			})
			// Auto-expand sibling menus in the active context
			$('li > a', this).mouseenter(function(e) {
				if ($(this).is(self.data('menu-siblings'))) {
					$(this).click()
				}
			})
			// Swallow click events at the menu root to remain visible
			this.click(function(e) {
				e.stopPropagation()
			})
			// But hide the menu if the user clicks elsewhere on the page
			$('body').click(function(e) {
				self.menu('close')
			})
		}
	}

	/**
	 * The base Menu type. These menus emulate Apple OS X.
	 * 
	 * @constructor
	 * 
	 * @param {Object} params The initialization parameters.
	 */
	module.Menu = function(params) {

		this.application = params.application
		this.menu = params.menu.menu()

		this.initialize(params)
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
			this.menu.menu('close')
		}
	})

	/**
	 * The base Modal type.
	 * 
	 * @params {Object} The initialization parameters.
	 */
	module.Modal = function(params) {

		this.application = params.application
		this.modal = params.modal.draggable()

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
			this.modal.hide()
		}
	})

	/**
	 * The Statistics report.
	 */
	module.Statistics = function(params) {

		this.application = params.application

		this.statisics = $('#statistics')
		this.framerate = $('.framerate', this.statistics)

		this.bindEvents()
	}

	$.extend(module.Statistics.prototype, {
		constructor: module.Statistics,

		/**
		 * Binds to window events, Radiant.Event, etc.
		 */
		bindEvents: function() {
			var self = this

			self.frames = 0
			setInterval(function() {
				if (self.frames) {
					self.framerate.html(self.frames.toFixed(0) + 'fps')
					self.frames = 0
				} else {
					self.framerate.html('')
				}
			}, 1000)
		}
	})

	window.Radiant.Ui = module

	return module
})