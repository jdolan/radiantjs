'use strict';

/**
 * This module provides an object model and framework for iterating and
 * accumulating .map geometry.
 * 
 * @author jdolan
 */
define('Radiant.Model', [ 'Backbone', 'Radiant.Material', 'Radiant.Polygon' ], function() {

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
			KeyZoomIn: '-',
			KeyZoomOut: '+',
			KeySurfaceInspector: 'S',
			KeyEntityInspector: 'n',
			FreelookSensitivity: 0.1,
			FreelookInvert: false,
			FollowPerspective: true
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
		},

		/**
		 * Backbone initialization.
		 */
		initialize: function(attribtues, options) {
			this.plane = null
			this.vertices = null

			this.textureMatrix = new THREE.Matrix4()
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
			this.mesh = new THREE.Mesh(this.geometry, Radiant.Material.Common.caulk)
		},

		/**
		 * Updates the geometry for this Brush.
		 */
		update: function() {

			this.geometry.vertices.length = 0
			this.geometry.faces.length = 0
			this.geometry.faceVertexUvs.length = 0

			var planes = []
			for ( var i = 0; i < this.surfaces.length; i++) {
				planes.push(this.surfaces.at(i).plane)
			}

			var culledSurfaces = []
			for ( var i = 0; i < this.surfaces.length; i++) {
				var surface = this.surfaces.at(i)

				surface.vertices = surface.plane.clip(planes, surface.vertices)
				if (surface.vertices.length) {
					
					for ( var j = 0; j < surface.vertices.length; j++) {
						this.geometry.vertices.push(surface.vertices[j])
	
						if (j >= 2) {
							var a = surface.vertices[0]
							var b = surface.vertices[j]
							var c = surface.vertices[j - 1]
	
							var face = new THREE.Face3(a, b, c, surface.normal)
							this.geometry.faces.push(face)
	
							var sta = new THREE.Vector2(0, 1)
							var stb = new THREE.Vector2(0, 1)
							var stc = new THREE.Vector2(0, 1)
	
							this.geometry.faceVertexUvs.push([ sta, stb, stc ])
						}
					}
				} else {
					culledSurfaces.push(surface)
				}
			}			
			this.surfaces.remove(culledSurfaces)

			this.geometry.mergeVertices()

			return this
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

	$.extend(Parser.prototype, Radiant.Util.Parser.prototype, {
		constructor: Parser,

		/**
		 * Parses a Brush.
		 * 
		 * @return {Radiant.Model.Brush} The parsed Brush.
		 */
		parseBrush: function() {

			var brush = new module.Brush()

			var token, points = []
			while (true) {
				token = this.nextToken()
				if (!token || token == '}') {
					break
				}

				if (token == '(') {
					var x = parseFloat(this.nextToken())
					var y = parseFloat(this.nextToken())
					var z = parseFloat(this.nextToken())

					points.push(new THREE.Vector3(x, y, z))

					if (points.length == 3) {
						var surface = new module.Surface()

						var a = points[0], b = points[1], c = points[2]
						surface.plane = new THREE.Plane().setFromCoplanarPoints(a, b, c)

						brush.surfaces.push(surface)
						points.length = 0
					}
				}
			}

			return brush.update()
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
		 * Loads a Map from the specified File or URI.
		 * 
		 * @param {File|String} resource The .map File or URI.
		 * @param {function} handler A success handler taking the new Map.
		 */
		load: function(resource, handler) {
			if (resource instanceof File) {
				var reader = new FileReader()
				reader.onload = function(e) {
					handler(new Parser(e.target.result).parse())
				}
				reader.readAsText(resource)
			} else if ($.type(resource) == 'string') {
				$.get(resource, function(data) {
					handler(new Parser(data).parse())
				})
			} else {
				console.error('Invalid file specified', resource)
			}
		}
	}

	window.Radiant.Model = module

	return module
})
