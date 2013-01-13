'use strict';

/**
 * Utilities and helpers.
 * 
 * @author jdolan
 */
define('Radiant.Util', [ 'jQuery', 'Underscore', 'THREE' ], function() {

	/**
	 * Clamps the value to the specified bounds.
	 * 
	 * @param {Number} value The value.
	 * @param {Number} min The lower bounds.
	 * @param {Number} max The upper bounds.
	 * 
	 * @return {Number} The clamped value.
	 */
	Math.clamp = function(value, min, max) {
		return Math.max(min, Math.min(value, max));
	}

	/**
	 * Sets all elements of this Vector2 to 0.
	 */
	THREE.Vector2.prototype.clear = function() {
		this.x = this.y = 0
		return this
	}

	/**
	 * @return {String} A formatted String representation of this Vector2.
	 */
	THREE.Vector2.prototype.toString = function() {
		return '(' + this.x + ' ' + this.y + ')'
	}

	/**
	 * Sets all elements of this Vector3 to 0.
	 */
	THREE.Vector3.prototype.clear = function() {
		this.x = this.y = this.z = 0
		return this
	}

	/**
	 * @return {String} A formatted String representation of this Vector3.
	 */
	THREE.Vector3.prototype.toString = function() {
		return '(' + this.x + ' ' + this.y + ' ' + this.z + ')'
	}

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

	var module = {}

	/**
	 * A base class for parsing text files.
	 * 
	 * @constructor
	 * 
	 * @param {String} buffer The raw .map contents.
	 */
	module.Parser = function(buffer) {
		this.buffer = buffer
		this.index = 0
	}

	$.extend(module.Parser.prototype, {

		/**
		 * Parses the next token in the buffer. This is reminiscent of
		 * <code>Com_Parse</code> in Quake's shared.c.
		 * 
		 * @return {String} The next available token, or null.
		 */
		nextToken: function() {

			var token = '', comment = false, quote = false
			while (this.index < this.buffer.length) {
				var c = this.buffer.charAt(this.index++)

				if (comment) {
					if (/\n/.test(c)) {
						comment = false
						token = ''
					}
				} else {
					if ('"' == c) {
						if (quote) {
							return token
						} else {
							quote = true
						}
					} else if (/\s/.test(c) && !quote) {
						if (token.length) {
							return token
						}
					} else {
						token += c
						if (token == '//') {
							comment = true
						}
					}
				}
			}

			return null
		},

		/**
		 * Resets this Parser to the beginning of the buffer.
		 */
		reset: function() {
			this.index = 0
		}
	})

	/**
	 * Parses a Vector3 from the specified String.
	 * 
	 * @param {String} string The String to parse.
	 * 
	 * @return {THREE.Vector3} The Vector3.
	 */
	module.parseVector3 = function(string) {
		var vector = null

		if (string && string.length) {
			var p = new module.Parser(string)

			var x = parseFloat(p.nextToken())
			var y = parseFloat(p.nextToken())
			var z = parseFloat(p.nextToken())

			vector = new THREE.Vector3(x, y, z)
		}

		return vector
	}

	window.Radiant.Util = module

	return module
})