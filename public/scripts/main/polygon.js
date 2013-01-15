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
		PlaneSize: 1024 * 1024,

		/**
		 * Constant for Plane intersections (clipping).
		 */
		Epsilon: 0.01
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
		 * Returns the distance to the specified Plane for clipping purposes.
		 * 
		 * @param {THREE.Plane} p The plane to test.
		 * 
		 * @return {Number} The distance to the specified Plane.
		 */
		distanceToPlane: function(p) {
			return this.x * p.normal.x + this.y * p.normal.y + this.z * p.normal.z - p.constant
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
		 * @return The right-vector for this plane.
		 */
		right: function() {
			return this.up().clone().cross(this.normal)
		},

		/**
		 * Returns a quad of the specified size for this plane.
		 * 
		 * @param {Number} size The quad size (Radiant.Polygon.PlaneSize).
		 * 
		 * @return {Array} An Array of Vector3 of length 4.
		 */
		quad: function(size) {
			var up = this.up(), right = this.right(), v = new THREE.Vector3(), vertices = []

			size = size || module.PlaneSize

			v.x = this.constant * this.normal.x - size * right.x + size * up.x
			v.y = this.constant * this.normal.y - size * right.y + size * up.y
			v.z = this.constant * this.normal.z - size * right.z + size * up.z
			vertices.push(v.clone())

			v.x = this.constant * this.normal.x + size * right.x + size * up.x
			v.y = this.constant * this.normal.y + size * right.y + size * up.y
			v.z = this.constant * this.normal.z + size * right.z + size * up.z
			vertices.push(v.clone())

			v.x = this.constant * this.normal.x + size * right.x - size * up.x
			v.y = this.constant * this.normal.y + size * right.y - size * up.y
			v.z = this.constant * this.normal.z + size * right.z - size * up.z
			vertices.push(v.clone())

			v.x = this.constant * this.normal.x - size * right.x - size * up.x
			v.y = this.constant * this.normal.y - size * right.y - size * up.y
			v.z = this.constant * this.normal.z - size * right.z - size * up.z
			vertices.push(v.clone())

			return vertices
		},

		/**
		 * Clips this Plane against the specified Array of Planes, returning the
		 * resulting Array of vertices.
		 * 
		 * @param {Array} planes An Array of Planes to clip against.
		 * 
		 * @return {Array} The resulting Array of Vector3.
		 */
		clip: function(planes, vertices) {

			vertices = vertices || this.quad()

			for ( var i = 0; i < planes.length; i++) {

				if (planes[i] == this) {
					continue
				}

				var newVertices = []

				var prev, vert = vertices[0]
				var prevDistance, distance = vert.distanceToPlane(planes[i])

				for ( var j = 0; j < vertices.length; j++) {

					prev = vert
					prevDistance = distance

					vert = vertices[(j + 1) % vertices.length]
					distance = vert.distanceToPlane(planes[i])

					if (prevDistance > -module.Epsilon) {
						newVertices.push(prev.clone())
					}

					if ((prevDistance > module.Epsilon && distance < -module.Epsilon)
							|| (prevDistance < -module.Epsilon && distance > module.Epsilon)) {

						var fraction = prevDistance / (prevDistance - distance)

						var v = new THREE.Vector3()

						v.x = prev.x + fraction * (vert.x - prev.x)
						v.y = prev.y + fraction * (vert.y - prev.y)
						v.z = prev.z + fraction * (vert.z - prev.z)

						newVertices.push(v)
					}
				}

				vertices = newVertices
			}

			console.debug('clipped to ' + vertices.length)
			return vertices
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