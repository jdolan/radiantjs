'use strict';

/**
 * Utilities and helpers.
 * 
 * @author jdolan
 */
define('Radiant.Util', [ 'jQuery', 'THREE' ], function() {

	var module = {}

	/**
	 * 
	 */
	module.waitFor = function(callable, timeout) {

		timeout = timeout || 1000 * 5

		var time = 0, interval = setInterval(function() {

			if (callable()) {
				clearInterval(interval)
				return true
			}

			if (time >= timeout) {
				clearInterval(interval)
				return false
			}

			time += 16
		}, 16)
	}

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
					if ('"' === c) {
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
						if (token === '//') {
							comment = true
						}
					}
				}
			}

			return token.length ? token : null
		},

		/**
		 * Resets this Parser to the beginning of the buffer.
		 */
		reset: function() {
			this.index = 0
		},

		/**
		 * Unparses the specified token. It will be returned by the next call to
		 * <code>nextToken</code>.
		 * 
		 * @param {String} token The token to unparse.
		 */
		unparse: function(token) {
			if (token.length + 1 > this.index) {
				this.reset()
			} else {
				this.index -= (token.length + 1)
			}
		}
	})
	
	var __parser = new module.Parser()

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
			__parser.buffer = string
			__parser.reset()

			var x = parseFloat(__parser.nextToken())
			var y = parseFloat(__parser.nextToken())
			var z = parseFloat(__parser.nextToken())

			vector = new THREE.Vector3(x, y, z)
		}

		return vector
	}

	window.Radiant.Util = module

	return module
})