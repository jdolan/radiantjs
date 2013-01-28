'use strict';

/**
 * This module provides plane and polygon utilities. Much of this is borrowed
 * from LordHavoc's Darkwar project:
 * 
 * http://svn.icculus.org/darkwar/trunk/src/game/g_server.c?view=markup
 */
define('Radiant.Polygon', [ 'Radiant.Util' ], function() {

	var module = {

		/**
		 * Constant for Plane projections (clipping).
		 */
		PlaneSize: 32768,

		/**
		 * Constant for Plane intersections (clipping).
		 */
		Epsilon: 0.001,

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

	$.extend(THREE.Plane.prototype, {

		/**
		 * @return The up-vector for this Plane.
		 */
		up: function() {
			var up = new THREE.Vector3(0, 0, 1)

			if (Math.abs(this.normal.z) > Math.abs(this.normal.x)
					&& Math.abs(this.normal.z) > Math.abs(this.normal.y)) {
				up.set(1, 0, 0)
			}

			var dot = -up.dot(this.normal)
			up.add(this.normal.clone().multiplyScalar(dot))

			return up.normalize()
		},

		/**
		 * Returns a quadrilateral of the specified size for this plane.
		 * 
		 * @param {Number} size The quad size (Radiant.Polygon.PlaneSize).
		 * 
		 * @return {Array} An Array of Vector3 of length 4.
		 */
		quad: function(size) {
			var up = this.up(), right = up.clone().cross(this.normal)
			var v = new THREE.Vector3(), vertices = []

			size = size || module.PlaneSize

			v.x = -this.constant * this.normal.x - size * right.x + size * up.x
			v.y = -this.constant * this.normal.y - size * right.y + size * up.y
			v.z = -this.constant * this.normal.z - size * right.z + size * up.z
			vertices.push(v.clone())

			v.x = -this.constant * this.normal.x + size * right.x + size * up.x
			v.y = -this.constant * this.normal.y + size * right.y + size * up.y
			v.z = -this.constant * this.normal.z + size * right.z + size * up.z
			vertices.push(v.clone())

			v.x = -this.constant * this.normal.x + size * right.x - size * up.x
			v.y = -this.constant * this.normal.y + size * right.y - size * up.y
			v.z = -this.constant * this.normal.z + size * right.z - size * up.z
			vertices.push(v.clone())

			v.x = -this.constant * this.normal.x - size * right.x - size * up.x
			v.y = -this.constant * this.normal.y - size * right.y - size * up.y
			v.z = -this.constant * this.normal.z - size * right.z - size * up.z
			vertices.push(v.clone())

			return vertices
		},

		/**
		 * Clips this Plane against the specified Array of Planes, returning the
		 * resulting Array of vertices.
		 * 
		 * @param {Array} planes An Array of Planes to clip against.
		 * @param {Array} vertices The Array of Vector3 to clip.
		 * @param {Number} epsilon The Epsilon value for sidedness.
		 * 
		 * @return {Array} The resulting Array of Vector3.
		 */
		clip: function(planes, vertices, epsilon) {

			vertices = vertices || this.quad()
			var e = epsilon || module.Epsilon

			for ( var i = 0; i < planes.length; i++) {
				var plane = planes[i]

				if (plane == this) {
					continue
				}

				var newVertices = []

				for ( var j = 0; j < vertices.length; j++) {

					var vert0 = vertices[j]
					var vert1 = vertices[(j + 1) % vertices.length]

					var dist0 = plane.distanceToPoint(vert0)
					var dist1 = plane.distanceToPoint(vert1)

					if (dist0 >= -e) {
						newVertices.push(vert0.clone())
					}

					if ((dist0 > e && dist1 < -e) || (dist0 < -e && dist1 > e)) {

						var frac = dist0 / (dist0 - dist1)

						var v = new THREE.Vector3()

						v.x = vert0.x + frac * (vert1.x - vert0.x)
						v.y = vert0.y + frac * (vert1.y - vert0.y)
						v.z = vert0.z + frac * (vert1.z - vert0.z)

						newVertices.push(v)
					}
				}

				if (newVertices.length < 3) {
					console.debug(plane + ' culled ' + this, vertices)
					return []
				}

				vertices = newVertices
			}

			return vertices
		},

		/**
		 * @return {Array} The S and T Vectors for this Plane.
		 */
		textureVectors: function(epsilon) {

			var vectors = null, dot = 0, e = epsilon || module.Epsilon

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
			return this.normal.toString() + ' @ ' + this.constant
		}
	})

	window.Radiant.Polygon = module

	return module
})
