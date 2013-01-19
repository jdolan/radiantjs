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
	 * Game configurations.
	 */
	module.Game = Backbone.Model.extend({
		defaults: {
			Name: 'Unnamed Game',
			LevelBounds: 8192,
			Brushdef: 'idTech2'
		}
	})

	/**
	 * User Preferences.
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
			CameraMovementSpeed: 5.5,
			CameraRotationSpeed: 2.0,
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
			this.brush = null
			this.plane = null
			this.color = null
			this.vertices = null

			this.textureMatrix = new THREE.Matrix4()
		},

		/**
		 * Adds this Surface to the specified Geometry.
		 * 
		 * @param {THREE.Geometry} The Geometry to add to.
		 */
		addToGeometry: function(geometry) {
			var color = 0.75 + (0.25 / (Math.abs(this.plane.normal.z) + 1))

			for ( var i = 0; i < this.vertices.length; i++) {
				geometry.vertices.push(this.vertices[i])

				if (i >= 2) {
					var face = new THREE.Face3(0, i - 1, i, this.plane.normal)
					face.color.setRGB(color, color, color)

					geometry.faces.push(face)

					var st0 = new THREE.Vector2(0, 1)
					var st1 = new THREE.Vector2(0, 1)
					var st2 = new THREE.Vector2(0, 1)

					geometry.faceVertexUvs[0].push([ st0, st1, st2 ])
				}
			}
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
			this.entity = null

			this.geometry = new THREE.Geometry()
		},

		/**
		 * Updates the Geometry for this Brush.
		 */
		update: function() {

			this.geometry.vertices.length = 0
			this.geometry.faces.length = 0
			this.geometry.faceVertexUvs[0].length = 0

			var planes = []
			for ( var i = 0; i < this.surfaces.length; i++) {
				planes.push(this.surfaces.at(i).plane)
			}

			var culledSurfaces = []
			for ( var i = 0; i < this.surfaces.length; i++) {
				var surface = this.surfaces.at(i)

				surface.vertices = surface.plane.clip(planes, surface.vertices)

				if (surface.vertices.length) {
					surface.addToGeometry(this.geometry)
				} else {
					culledSurfaces.push(surface)
				}
			}
			this.surfaces.remove(culledSurfaces)

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

			this.geometry = new THREE.Geometry()
			this.mesh = new THREE.Mesh(this.geometry, Radiant.Material.Common.caulk)
		},

		/**
		 * Updates the Geometry and Mesh for this Entity.
		 */
		update: function() {

			this.geometry.vertices.length = 0
			this.geometry.faces.length = 0
			this.geometry.faceVertexUvs[0].length = 0

			for ( var i = 0; i < this.brushes.length; i++) {
				THREE.GeometryUtils.merge(this.geometry, this.brushes.at(i).geometry)
			}

			this.geometry.mergeVertices()
			this.geometry.computeBoundingSphere()

			this.mesh.updateMorphTargets()

			return this
		},

		/**
		 * @param {String} The key, e.g. <em>angle</em>.
		 * 
		 * @return {String|Number} The value for the specified key.
		 */
		getValue: function(key) {
			return this.get('pairs')[key]
		},

		/**
		 * Sets the key-value pair.
		 * 
		 * @param {String} key The key, e.g. <em>angle</em>
		 * @param {String|Number} The value.
		 */
		setValue: function(key, value) {
			this.get('pairs')[key] = value
		},

		/**
		 * @return {String} The class name (e.g. 'func_rotating').
		 */
		classname: function() {
			return this.getValue('classname')
		},

		/**
		 * Returns the origin of this Entity iff it contains no brushes.
		 * 
		 * @return {THREE.Vector3} The origin, or null.
		 */
		origin: function() {
			if (this.brushes.length == 0) {
				return Radiant.Util.parseVector3(this.getValue('origin'))
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

			return entity.update()
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
