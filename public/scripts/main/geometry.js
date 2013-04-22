'use strict'

/**
 * This module provides Constructive Solid Geometry (CSG) utilities. Much of
 * this is borrowed from LordHavoc's Darkwar project:
 * 
 * http://svn.icculus.org/darkwar/trunk/src/game/g_server.c?view=markup
 */
define('Radiant.Geometry', [ 'CSG', 'Radiant.Util' ], function() {

	var module = {

		/**
		 * Constant for Plane projections (clipping).
		 */
		PlaneSize: 32768,

		/**
		 * Base vectors used to calculate texture coordinates for vertices.
		 */
		TextureVectors: [ {
			n: new THREE.Vector3(0, 0, 1),
			s: new THREE.Vector3(1, 0, 0),
			t: new THREE.Vector3(0, -1, 0)
		}, {
			n: new THREE.Vector3(0, 0, -1),
			s: new THREE.Vector3(1, 0, 0),
			t: new THREE.Vector3(0, -1, 0)
		}, {
			n: new THREE.Vector3(1, 0, 0),
			s: new THREE.Vector3(0, 1, 0),
			t: new THREE.Vector3(0, 0, -1)
		}, {
			n: new THREE.Vector3(-1, 0, 0),
			s: new THREE.Vector3(0, 1, 0),
			t: new THREE.Vector3(0, 0, -1)
		}, {
			n: new THREE.Vector3(0, 1, 0),
			s: new THREE.Vector3(1, 0, 0),
			t: new THREE.Vector3(0, 0, -1)
		}, {
			n: new THREE.Vector3(0, -1, 0),
			s: new THREE.Vector3(1, 0, 0),
			t: new THREE.Vector3(0, 0, -1)
		} ]
	}

	$.extend(THREE.Vector2.prototype, {

		/**
		 * Sets all elements of this Vector2 to 0.
		 */
		clear: function() {
			this.set(0, 0)
			return this
		},

		/**
		 * @return {String} A formatted String representation of this Vector2.
		 */
		toString: function() {
			return '(' + this.x + ' ' + this.y + ')'
		}
	})

	$.extend(THREE.Vector3.prototype, {

		/**
		 * Sets all elements of this Vector3 to 0.
		 */
		clear: function() {
			this.set(0, 0, 0)
			return this
		},

		/**
		 * @return {String} A formatted String representation of this Vector3.
		 */
		toString: function() {
			return '(' + this.x + ' ' + this.y + ' ' + this.z + ')'
		}
	})

	$.extend(CSG.Vector.prototype, {

		/**
		 * Sets all elements of this Vector to 0.
		 */
		clear: function() {
			this.x = this.y = this.z = 0
		},

		/**
		 * @return {String} A formatted String representation of this Vector.
		 */
		toString: function() {
			return '(' + this.x + ', ' + this.y + ', ' + this.z + ')'
		},

		/**
		 * @return The up Vector for this Vector.
		 */
		up: function() {
			var up

			if (Math.abs(this.z) > Math.abs(this.x) && Math.abs(this.z) > Math.abs(this.y)) {
				up = new CSG.Vector(1, 0, 0)
			} else {
				up = new CSG.Vector(0, 0, 1)
			}

			var scaled = this.times(-this.dot(up))
			return up.plus(scaled).unit()
		}
	})

	$.extend(CSG.Vertex.prototype, {

		/**
		 * @return {String} A formatted String representation of this Vertex.
		 */
		toString: function() {
			return this.pos.toString()
		}
	})

	$.extend(CSG.Plane.prototype, {

		/**
		 * @return {Array} The S and T Vectors for this Plane.
		 */
		textureVectors: function(epsilon) {

			var vectors = null, dot = 0, e = epsilon || CSG.Plane.EPSILON

			for ( var i = 0; i < module.TextureVectors.length; i++) {

				var vecs = module.TextureVectors[i]
				var d = this.normal.dot(vecs.n)

				if (d > dot + e) {
					vectors = vecs
					dot = d
				}
			}

			return [ vectors.s.clone(), vectors.t.clone() ]
		},

		/**
		 * @return {String} A formatted String representation of this Plane.
		 */
		toString: function() {
			return this.normal.toString() + ' @ ' + this.w
		}
	})

	$.extend(CSG.Polygon.prototype, {

		/**
		 * Clips this Polygon to the specified Plane.
		 * 
		 * @param {CSG.Plane} The Plane to clip to.
		 * 
		 * @return The resulting Polygon, or null if clipped.
		 */
		clipTo: function(plane) {
			var retain = []

			plane.splitPolygon(this, retain, retain, retain, [])
			if (retain.length !== 1)
			console.debug(retain)
			return retain.length ? retain[0] : null
		}
	})

	/**
	 * Creates a quadrilateral Polygon from the specified Plane.
	 * 
	 * @param {CSG.Plane} plane The Plane.
	 * @param {Number} size The Polygon size (Radiant.Geometry.PlaneSize).
	 */
	CSG.Polygon.fromPlane = function(plane, size) {
		var up = plane.normal.up(), right = up.cross(plane.normal)
		var x, y, z, vertices = []

		size = size || module.PlaneSize

		x = plane.w * plane.normal.x - size * right.x + size * up.x
		y = plane.w * plane.normal.y - size * right.y + size * up.y
		z = plane.w * plane.normal.z - size * right.z + size * up.z
		vertices.push(new CSG.Vertex([ x, y, z ], plane.normal))

		x = plane.w * plane.normal.x + size * right.x + size * up.x
		y = plane.w * plane.normal.y + size * right.y + size * up.y
		z = plane.w * plane.normal.z + size * right.z + size * up.z
		vertices.push(new CSG.Vertex([ x, y, z ], plane.normal))

		x = plane.w * plane.normal.x + size * right.x - size * up.x
		y = plane.w * plane.normal.y + size * right.y - size * up.y
		z = plane.w * plane.normal.z + size * right.z - size * up.z
		vertices.push(new CSG.Vertex([ x, y, z ], plane.normal))

		x = plane.w * plane.normal.x - size * right.x - size * up.x
		y = plane.w * plane.normal.y - size * right.y - size * up.y
		z = plane.w * plane.normal.z - size * right.z - size * up.z
		vertices.push(new CSG.Vertex([ x, y, z ], plane.normal))

		return Object.create(CSG.Polygon.prototype, {
			vertices: {
				enumerable: true,
				value: vertices,
				writable: true
			},
			plane: {
				enumerable: true,
				value: plane,
				writable: true
			}
		})
	}

	window.Radiant.Geometry = module

	return module
})