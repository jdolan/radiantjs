'use strict';

/**
 * Utilities and helpers.
 * 
 * @author jdolan
 */
define('Radiant.Util', [ 'jQuery', 'Underscore', 'THREE' ], function() {

	/*
	 * Crutch up some things in THREE for convenience.
	 */
	THREE.Vector3.prototype.toString = function() {
		return '(' + this.x + ' ' + this.y + ' ' + this.z + ')'
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

	_.extend(module.Parser.prototype, {

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