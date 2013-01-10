'use strict';

/**
 * This module provides an object model and framework for iterating and
 * accumulating .map geometry.
 * 
 * @author jdolan
 */
define('Radiant.Model', [ 'Backbone', 'Radiant.Material' ], function() {

	var module = {}

	/**
	 * An individual preference.
	 */
	module.Preference = Backbone.Model.extend({
		defaults: {
			key: '',
			value: ''
		}
	})

	/**
	 * A Collection of Preferences.
	 */
	module.Preferences = Backbone.Collection.extend({
		model: module.Preference
	})

	/**
	 * Surfaces are described by their Vertexes and material.
	 */
	module.Surface = Backbone.Model.extend({
		defaults: {
			flags: 0,
			value: 0
		},

		/**
		 * 
		 */
		initialize: function(attributes, options) {
			this.material = options.material || Radiant.Material.Common.caulk
		}
	})

	/**
	 * Brushes are comprised of 4 or more Surfaces. Each brush must belong to an
	 * Entity (default is Worldspawn).
	 */
	module.Brush = Backbone.Model.extend({

		/**
		 * 
		 */
		initialize: function(attributes, options) {
			this.surfaces = new Backbone.Collection()
			this.geometry = new THREE.Geometry()
		}
	})

	/**
	 * Entities are key-value pair structures that optionally encompass one or
	 * more Brushes. Worldspawn is the first entity in any Map.
	 */
	module.Entity = Backbone.Model.extend({
		defaults: function() {
			return {
				pairs: {
					'class': 'undefined'
				},
				origin: new THREE.Vector3()
			}
		},

		/**
		 * 
		 */
		initialize: function(attributes, options) {
			this.brushes = new Backbone.Collection()
		},

		/**
		 * 
		 */
		className: function() {
			return this.get('pairs')['class']
		}
	})

	/**
	 * Maps are collections of Entities. The Worldspawn entity is the first
	 * entity, and contains the bulk of the world geometry.
	 */
	module.Map = Backbone.Model.extend({
		defaults: {
			name: ''
		},

		/**
		 * 
		 */
		initialize: function(attributes, options) {
			this.entities = new Backbone.Collection()
		},

		/**
		 * 
		 */
		worldspawn: function() {
			return this.entities.at(0)
		}
	})

	/**
	 * This object parses .map files.
	 * 
	 * @constructor
	 * 
	 * @param {String} buffer The raw .map contents.
	 */
	var Parser = function(buffer) {
		this.buffer = buffer
		this.index = 0
	}

	_.extend(Parser.prototype, {

		/**
		 * Parses the next token in a .map file. This is reminiscent of
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
		 * 
		 */
		parseBrush: function() {

			var brush = new module.Brush()

			var token, x, y, z, v = 0
			while (true) {
				token = this.nextToken()
				if (!token || token == '}') {
					break
				}

				if (token == '(') {
					x = parseFloat(this.nextToken())
					y = parseFloat(this.nextToken())
					z = parseFloat(this.nextToken())

					brush.geometry.vertices.push(new THREE.Vector3(x, y, z))

					if (++v % 3 == 0) {
						brush.geometry.faces.push(new THREE.Face3(v - 3, v - 2, v - 1))
						
						// TODO parse the material, surface flags, etc..
					}
				}
			}

			return brush
		},

		/**
		 * 
		 */
		parseEntity: function() {

			var entity = new module.Entity()

			var token, key = null
			while (true) {
				token = this.nextToken()
				if (!token || token == '}') {
					break
				}

				if (token == '{') {
					entity.brushes.add(this.parseBrush())
				} else {
					if (key) {
						entity.get('pairs')[key] = token
						key = null
					} else {
						key = token
					}
				}
			}

			return entity
		},

		/**
		 * 
		 */
		parse: function() {

			var map = new module.Map()

			var token
			while (true) {
				token = this.nextToken()
				if (!token || token == '}') {
					break
				}

				if (token == '{') {
					map.entities.add(this.parseEntity())
				}
			}

			return map
		}
	})

	/**
	 * 
	 */
	module.MapFactory = {

		/**
		 * 
		 */
		load: function(file) {
			if (file) {
				var reader = new FileReader()
				reader.onload = function(e) {
					return new Parser(e.target.result).parse()
				}
				reader.readAsText(file)
			} else {
				console.error('No file specified')
			}
		}
	}

	window.Radiant.Model = module

	return module
})
