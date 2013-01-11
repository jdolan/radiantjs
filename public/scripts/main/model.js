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
	 * A Collection of Preferences.
	 */
	module.Preferences = Backbone.Model.extend({
		defaults: {
			KeyForward: 'w',
			KeyBack: 's',
			KeyMoveLeft: 'a',
			KeyMoveRight: 'd',
			KeyMoveUp: 'd',
			KeyMoveDown: 'c',
			KeyLookUp: 'a',
			KeyLookDown: 'z',
			KeyLookLeft: ',',
			KeyLookRight: '.',
			KeySurfaceInspector: 'S',
			KeyEntityInspector: 'n',
			FreelookSensitivity: 0.1,
			FreelookInvert: false
		}
	})

	/**
	 * Surfaces are described by their texture and attributes. Every Surface
	 * must belong to a Brush.
	 */
	module.Surface = Backbone.Model.extend({
		defaults: {
			texture: 'common/caulk',
			offsetS: 0,
			offsetT: 0,
			scaleS: 0,
			scaleT: 0,
			flags: 0,
			value: 0
		}
	})

	/**
	 * Brushes are comprised of 4 or more Surfaces. Each brush must belong to an
	 * Entity (default is Worldspawn).
	 */
	module.Brush = Backbone.Model.extend({

		/**
		 * Backbone initialization.
		 */
		initialize: function(attributes, options) {
			this.surfaces = new Backbone.Collection()
			this.geometry = new THREE.Geometry()
			this.mesh = new THREE.Mesh(this.geometry, Radiant.Material.Common.caulk/*
																					 * new
																					 * THREE.MeshFaceMaterial()
																					 */)
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
					'classname': 'undefined'
				}
			}
		},

		/**
		 * Backbone initialization.
		 */
		initialize: function(attributes, options) {
			this.brushes = new Backbone.Collection()
		},

		/**
		 * @return {String} The class name (e.g. 'func_rotating').
		 */
		classname: function() {
			return this.get('pairs')['classname']
		},

		/**
		 * Returns the origin of this Entity iff it contains no brushes.
		 * 
		 * @return {THREE.Vector3} The origin, or null.
		 */
		origin: function() {
			if (this.brushes.length == 0) {
				return Radiant.Util.parseVector3(this.get('pairs')['origin'])
			}
			return null
		},

		/**
		 * @return {String} A String representation of this Entity.
		 */
		toString: function() {
			var string = this.classname(), origin = this.origin()
			if (origin) {
				string += ' at ' + origin
			} else {
				string += ' with ' + this.brushes.length + ' brushes'
			}
			return string
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
		 * Backbone initialization.
		 */
		initialize: function(attributes, options) {
			this.entities = new Backbone.Collection()
		},

		/**
		 * @return {Radiant.Model.Entity} The worldspawn entity.
		 */
		worldspawn: function() {
			return this.entities.at(0)
		}
	})

	/**
	 * A Parser for .map files.
	 * 
	 * @constructor
	 * @augments {Radiant.Util.Parser}
	 * 
	 * @param {String} buffer The raw .map contents.
	 */
	var Parser = function(buffer) {
		Radiant.Util.Parser.call(this, buffer)
	}

	_.extend(Parser.prototype, Radiant.Util.Parser.prototype, {
		constructor: Parser,

		/**
		 * Parses a Brush.
		 * 
		 * @return {Radiant.Model.Brush} The parsed Brush.
		 */
		parseBrush: function() {

			var brush = new module.Brush()

			var token, x, y, z, face, material, v = 0
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
						// material = Radiant.Material.Common.caulk
						// brush.mesh.material.materials.push(material)

						face = new THREE.Face3(v - 3, v - 2, v - 1)
						// face.materialIndex =
						// brush.mesh.material.materials.length - 1

						brush.geometry.faces.push(face)
					}
				}
			}

			// brush.geometry.mergeVertices()

			return brush
		},

		/**
		 * Parses an Entity.
		 * 
		 * @return {Radiant.Model.Entity} The parsed Entity.
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

			// console.debug(entity.toString())

			return entity
		},

		/**
		 * Parse entry point.
		 * 
		 * @return {Radiant.Model.Map} The parsed Map.
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
	 * A factory class for loading or creating Maps.
	 */
	module.MapFactory = {

		/**
		 * Loads a Map from the specified .map file.
		 * 
		 * @param {File} file The .map file.
		 * @param {Function} callback A callback taking the new Map.
		 * 
		 * @return {Radiant.Model.Map} The Map.
		 */
		load: function(file, callback) {
			if (file) {
				var reader = new FileReader()
				reader.onload = function(e) {
					callback(new Parser(e.target.result).parse())
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
