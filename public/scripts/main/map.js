'use strict';

/**
 * This module provides an object model and framework for iterating and
 * accumulating .map geometry.
 * 
 * @author jdolan
 */
define('Radiant.Map', [ 'Radiant.Material', 'Radiant.Polygon' ], function() {

	var module = {}

	/**
	 * Surfaces are described by their plane, texture and attributes. Every
	 * Surface must belong to a Brush.
	 */
	module.Surface = function() {

		this.brush = null
		this.plane = null

		this.index = 0
		this.vertices = null

		this.texture = 'common/caulk'
		this.material = null

		this.offsetS = 0
		this.offsetT = 0

		this.angle = 0

		this.scaleS = 1
		this.scaleT = 1

		this.contents = 0

		this.flags = 0
		this.value = 0
	}

	$.extend(module.Surface.prototype, {

		/**
		 * Returns the S and T vectors for the Surface. Ported directly from
		 * q3map2's map.c.
		 * 
		 * @return {Array} The S and T Vectors (Vector3).
		 */
		textureVectors: function() {

			var sv, tv, vectors = this.plane.textureVectors()
			if (vectors[0].x) {
				sv = 0
			} else if (vectors[0].y) {
				sv = 1
			} else {
				sv = 2
			}

			if (vectors[1].x) {
				tv = 0
			} else if (vectors[1].y) {
				tv = 1
			} else {
				tv = 2
			}

			var theta = THREE.Math.degToRad(this.angle)

			var sin = Math.sin(theta)
			var cos = Math.cos(theta)

			for ( var i = 0; i < 2; i++) {
				var s = vectors[i].getComponent(sv)
				var t = vectors[i].getComponent(tv)

				var newS = cos * s - sin * t
				var newT = sin * s + cos * t

				vectors[i].setComponent(sv, newS)
				vectors[i].setComponent(tv, newT)
			}

			vectors[0].divideScalar(this.scaleS)
			vectors[1].divideScalar(this.scaleT)

			return vectors
		},

		/**
		 * Updates the Brush Geometry to include this Surface.
		 */
		update: function(forced) {
			var materials = this.brush.entity.materials
			var materialIndex = materials.indexOf(this.material)

			if (materialIndex === -1) {
				materialIndex = materials.push(this.material) - 1
			}

			var textureVectors = this.textureVectors()
			var textureCoordinates = []

			var meshGeometry = this.brush.meshGeometry
			var lineGeometry = this.brush.lineGeometry

			var normal = this.plane.normal.clone().negate()

			var w = this.material.map.image.width || 256
			var h = this.material.map.image.height || 256

			this.index = meshGeometry.vertices.length

			for ( var i = 0; i < this.vertices.length; i++) {

				var vert0 = this.vertices[i]
				var vert1 = this.vertices[(i + 1) % this.vertices.length]

				meshGeometry.vertices.push(vert0)

				var s = (vert0.dot(textureVectors[0]) + this.offsetS) / w
				var t = (vert0.dot(textureVectors[1]) + this.offsetT) / h

				textureCoordinates.push(new THREE.Vector2(s, t))

				if (i >= 2) {
					var a = this.index, b = this.index + i - 1, c = this.index + i
					var face = new THREE.Face3(a, b, c, normal, undefined, materialIndex)

					meshGeometry.faces.push(face)

					var st0 = textureCoordinates[0]
					var st1 = textureCoordinates[i - 1]
					var st2 = textureCoordinates[i]

					meshGeometry.faceVertexUvs[0].push([ st0, st1, st2 ])
				}

				lineGeometry.vertices.push(vert0)
				lineGeometry.vertices.push(vert1)
			}
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

		this.dirty = true
	}

	$.extend(module.Brush.prototype, {

		/**
		 * Updates all Geometry for this Brush.
		 */
		update: function(forced) {

			if (!forced && !this.dirty) {
				return
			}

			this.dirty = false

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
					surface.update(forced)
				} else {
					culledSurfaces.push(surface)
				}
			}

			for ( var i = 0; i < culledSurfaces.length; i++) {
				this.surfaces.splice(this.surfaces.indexOf(culledSurfaces[i]), 1)
			}

			return
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
			classname: 'unknown'
		}

		this.brushes = []
		this.materials = []

		this.dirty = true
		this.mesh = new THREE.Mesh(undefined, Radiant.Material.Mesh.entity)
		this.line = new THREE.Line(undefined, Radiant.Material.Line.entity)

		this.built_geometry = false
	}

	/**
	 * Geometry singletons for Entity classes.
	 */
	module.Entity.geometry = {
		info_player_deathmatch: new THREE.CubeGeometry(24, 24, 64),
		light: new THREE.CubeGeometry(8, 8, 8),
		unknown: new THREE.CubeGeometry(16, 16, 16)
	}

	/**
	 * <code>update</code> routines for Entity classes.
	 */
	module.Entity.update = {
		light: function(self) {
			self.mesh.rotation = self.line.rotation = new THREE.Vector3(1, 0, 1)
		}
	}

	$.extend(module.Entity.prototype, {

		/**
		 * Updates the Geometry instances for this Entity.
		 */
		update: function(forced) {

			if (!forced && !this.dirty) {
				return
			}

			this.dirty = false

			if (this.brushes.length) {
				if (!this.built_geometry) {
					this.mesh.geometry = new THREE.Geometry()
					this.mesh.geometry.dynamic = true
					this.mesh.material = new THREE.MeshFaceMaterial(this.materials)

					this.line.geometry = new THREE.Geometry()
					this.line.geometry.dynamic = true
					this.line.material = Radiant.Material.Line.brush
					this.line.type = THREE.LinePieces

					this.built_geometry = true
				} else {
					this.mesh.geometry.vertices.length = 0
					this.mesh.geometry.faces.length = 0
					this.mesh.geometry.faceVertexUvs[0].length = 0

					this.line.geometry.vertices.length = 0
				}

				for ( var i = 0; i < this.brushes.length; i++) {
					var brush = this.brushes[i]
					
					brush.update(forced)

					THREE.GeometryUtils.merge(this.mesh.geometry, brush.meshGeometry)
					THREE.GeometryUtils.merge(this.line.geometry, brush.lineGeometry)
				}

				this.mesh.geometry.verticesNeedUpdate = true
				this.mesh.geometry.uvsNeedUpdate = true
				this.line.geometry.verticesNeedUpdate = true
			} else {
				var geometry = module.Entity.geometry[this.classname()]
				if (!geometry) {
					geometry = module.Entity.geometry.unknown
				}
				this.mesh.geometry = this.line.geometry = geometry

				var update = module.Entity.update[this.classname()]
				if (update) {
					update(this, forced)
				}
				this.mesh.position = this.line.position = this.origin()
			}

			// Setup culling for all Entities except worldspawn

			if (this.classname() === 'worldspawn') {
				this.mesh.frustumCulled = this.line.frustumCulled = false
			} else {
				this.mesh.geometry.computeBoundingSphere()
				this.line.geometry.boundingSphere = this.mesh.geometry.boundingSphere
				this.mesh.frustumCulled = this.line.frustumCulled = true
			}
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
						surface.material = Radiant.Material.load(surface.texture)

						surface.material.map.onLoad(function() {
							surface.brush.dirty = true
							surface.brush.entity.dirty = true
						})

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

			return brush
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
	module.Factory = {

		/**
		 * Loads a Map from the specified File or URI.
		 * 
		 * @param {File|String} resource The .map File or URI.
		 * @param {function(Radiant.Map.Map)} complete A completion handler.
		 */
		load: function(resource, complete) {
			if (resource instanceof File) {
				var reader = new FileReader()
				reader.onload = function(e) {
					complete(new Parser(e.target.result).parse())
				}
				reader.readAsText(resource)
			} else if ($.type(resource) === 'string') {
				$.get(resource, function(data) {
					complete(new Parser(data).parse())
				})
			} else {
				console.error('Invalid file specified', resource)
			}
		}
	}

	window.Radiant.Map = module

	return module
})
