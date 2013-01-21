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
	 * Surfaces are described by their plane, texture and attributes. Every
	 * Surface must belong to a Brush.
	 */
	module.Surface = function() {

		this.brush = null
		this.plane = null

		this.vertices = null

		this.texture = 'common/caulk'

		this.offsetS = 0
		this.offsetT = 0

		this.angle = 0

		this.scaleS = 0
		this.scaleT = 0

		this.contents = 0

		this.flags = 0
		this.value = 0
	}

	module.Surface._textureMatrix = new THREE.Matrix4()

	$.extend(module.Surface.prototype, {

		/**
		 * Updates the Brush Geometry to include this Surface.
		 */
		update: function() {
			var meshGeometry = this.brush.meshGeometry
			var lineGeometry = this.brush.lineGeometry

			var index = meshGeometry.vertices.length
			var normal = this.plane.normal.clone().negate()

			for ( var i = 0; i < this.vertices.length; i++) {
				meshGeometry.vertices.push(this.vertices[i])

				if (i >= 2) {
					var a = index, b = index + i - 1, c = index + i
					var face = new THREE.Face3(a, b, c, normal)

					meshGeometry.faces.push(face)

					var st0 = new THREE.Vector2(0, 1)
					var st1 = new THREE.Vector2(0, 1)
					var st2 = new THREE.Vector2(0, 1)

					meshGeometry.faceVertexUvs[0].push([ st0, st1, st2 ])
				}

				lineGeometry.vertices.push(this.vertices[i])
				lineGeometry.vertices.push(this.vertices[(i + 1) % this.vertices.length])
			}
		},

		/**
		 * @return {THREE.Matrix4} The UV coordinate Matrix for this surface.
		 */
		textureMatrix: function() {

		}
	})

	/**
	 * Brushes are comprised of 4 or more Surfaces. Each brush belongs to an
	 * Entity. Geometry is accumulated at the Brush level: each Brush maintains
	 * a Mesh Geometry and a Line Geometry to facilitate perspective and
	 * orthographic views.
	 * 
	 * @constructor
	 */
	module.Brush = function() {

		this.entity = null
		this.surfaces = []

		this.meshGeometry = new THREE.Geometry()
		this.lineGeometry = new THREE.Geometry()
	}

	$.extend(module.Brush.prototype, {

		/**
		 * Updates all Geometry for this Brush.
		 */
		update: function() {

			this.meshGeometry.vertices.length = 0
			this.meshGeometry.faces.length = 0
			this.meshGeometry.faceVertexUvs[0].length = 0

			this.lineGeometry.vertices.length = 0

			var planes = []
			for ( var i = 0; i < this.surfaces.length; i++) {
				planes.push(this.surfaces[i].plane)
			}

			var culledSurfaces = []
			for ( var i = 0; i < this.surfaces.length; i++) {
				var surface = this.surfaces[i]

				surface.vertices = surface.plane.clip(planes, surface.vertices)

				if (surface.vertices.length) {
					surface.update()
				} else {
					culledSurfaces.push(surface)
				}
			}

			if (culledSurfaces.length) {
				this.surfaces = _.without(this.surfaces, culledSurfaces)
			}

			return this
		}
	})

	/**
	 * Entities are key-value pair structures that optionally encompass one or
	 * more Brushes. Worldspawn is the first entity in any Map.
	 * 
	 * If an Entity contains Brushes, it's Geometries should be ignored.
	 * 
	 * @constructor
	 */
	module.Entity = function() {

		this.pairs = {
			classname: 'undefined'
		}

		this.brushes = []

		this.meshGeometry = new THREE.Geometry()
		this.mesh = new THREE.Mesh(this.meshGeometry, Radiant.Material.Mesh.entity)

		this.lineGeometry = new THREE.Geometry()
		this.line = new THREE.Line(this.lineGeometry, Radiant.Material.Line.line, THREE.LinePieces)
	}

	$.extend(module.Entity.prototype, {

		/**
		 * Updates the Geometry for this Entity.
		 */
		update: function() {

			if (this.brushes.length) {

				this.meshGeometry.vertices.length = 0
				this.meshGeometry.faces.length = 0
				this.meshGeometry.faceVertexUvs[0].length = 0

				this.lineGeometry.vertices.length = 0

				for ( var i = 0; i < this.brushes.length; i++) {
					var brush = this.brushes[i]

					THREE.GeometryUtils.merge(this.meshGeometry, brush.meshGeometry)
					THREE.GeometryUtils.merge(this.lineGeometry, brush.lineGeometry)
				}

				this.mesh.material = Radiant.Material.Common.caulk

				if (this.classname() === 'worldspawn') {
					this.mesh.frustumCulled = this.line.frustumCulled = false
				} else {
					this.mesh.frustumCulled = this.line.frustumCulled = true
				}
			} else {
				this.meshGeometry = this.lineGeometry = new THREE.CubeGeometry(24, 24, 24)
				this.mesh.position = this.line.position = this.origin()

				this.mesh.material = Radiant.Material.Mesh.entity

				this.mesh.frustumCulled = this.line.frustumCulled = true
			}

			if (this.mesh.frustumCulled) {
				this.meshGeometry.computeBoundingSphere()
			}

			if (this.line.frustumCulled) {
				this.lineGeometry.computeBoundingSphere()
			}

			return this
		},

		/**
		 * @param {String} The key, e.g. <em>angle</em>.
		 * 
		 * @return {String|Number} The value for the specified key.
		 */
		getValue: function(key) {
			return this.pairs[key]
		},

		/**
		 * Sets the key-value pair.
		 * 
		 * @param {String} key The key, e.g. <em>angle</em>
		 * @param {String|Number} The value.
		 */
		setValue: function(key, value) {
			this.pairs[key] = value
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
			if (this.brushes.length === 0) {
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
	 * 
	 * @constructor
	 */
	module.Map = function() {
		this.entities = []
	}

	$.extend(module.Map.prototype, {

		/**
		 * @return {Radiant.Model.Entity} The worldspawn entity.
		 */
		worldspawn: function() {
			return this.entities[0]
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
		 * @param {Radiant.Model.Entity} The current Entity.
		 * 
		 * @return {Radiant.Model.Brush} The parsed Brush.
		 */
		parseBrush: function(entity) {

			var brush = new module.Brush()
			brush.entity = entity

			var token, points = []
			while (true) {
				token = this.nextToken()
				if (!token || token === '}') {
					break
				}

				if (token === '(') {
					var x = parseFloat(this.nextToken())
					var y = parseFloat(this.nextToken())
					var z = parseFloat(this.nextToken())

					points.push(new THREE.Vector3(x, y, z))

					if (points.length === 3) {
						var surface = new module.Surface()
						surface.brush = brush

						var a = points[0], b = points[1], c = points[2]
						surface.plane = new THREE.Plane().setFromCoplanarPoints(a, b, c)

						points.length = 0

						this.nextToken() // )

						surface.texture = this.nextToken()

						surface.offsetS = parseFloat(this.nextToken())
						surface.offsetT = parseFloat(this.nextToken())

						surface.angle = parseFloat(this.nextToken())

						surface.scaleS = parseFloat(this.nextToken())
						surface.scaleT = parseFloat(this.nextToken())

						// the remaining fields are optional

						token = this.nextToken()
						if (token !== '(' && token !== '}') {
							surface.contents = parseInt(token)

							token = this.nextToken()
							if (token !== '(' && token !== '}') {
								surface.flags = parseInt(token)

								token = this.nextToken()
								if (token !== '(' && token !== '}') {
									surface.value = parseFloat(token)
								} else {
									this.unparse(token)
								}
							} else {
								this.unparse(token)
							}
						} else {
							this.unparse(token)
						}

						brush.surfaces.push(surface)
					}
				}
			}

			return brush.update()
		},

		/**
		 * Parses an Entity.
		 * 
		 * @param {Radiant.Model.Map} The current Map.
		 * 
		 * @return {Radiant.Model.Entity} The parsed Entity.
		 */
		parseEntity: function(map) {

			var entity = new module.Entity()
			entity.map = map

			var token, key = null
			while (true) {
				token = this.nextToken()
				if (!token || token === '}') {
					break
				}

				if (token === '{') {
					entity.brushes.push(this.parseBrush(entity))
				} else {
					if (key) {
						entity.setValue(key, token)
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
				if (!token || token === '}') {
					break
				}

				if (token === '{') {
					map.entities.push(this.parseEntity(map))
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
			} else if ($.type(resource) === 'string') {
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
