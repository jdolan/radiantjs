'use strict'

/**
 * Unit tests for Radiant.Polygon.
 * 
 * @author jdolan
 */
define('Radiant.Polygon.Test', [ 'Jasmine', 'Radiant.Polygon' ], function() {

	describe('Radiant.Polygon.Test', function() {

		var v = new THREE.Vector3(0, 0, 1)

		var p1 = new THREE.Vector3(1, 1, 0)
		var p2 = new THREE.Vector3(0, 1, 0)
		var p3 = new THREE.Vector3(0, 0, 0)

		var p = new THREE.Plane().setFromCoplanarPoints(p1, p2, p3)

		/**
		 * Tests for THREE.Vector3 extensions.
		 */
		describe('Vector ' + v, function() {

			it('Has distance 1 to Plane ' + p, function() {
				expect(v.distanceToPlane(p)).toBe(-1)
			})

			v.z = -1

			it('Remains that distance when mirrored', function() {
				expect(v.distanceToPlane(p)).toBe(-1)
			})
		})

		/**
		 * Tests for THREE.Plane extensions.
		 */
		describe('Plane ' + p, function() {

			var normal = new THREE.Vector3(0, 0, 1)
			it('Has a normal vector of ' + normal, function() {
				expect(p.normal).toEqual(normal)
			})

			var up = new THREE.Vector3(1, 0, 0)
			it('Has an up vector of ' + up, function() {
				expect(p.up()).toEqual(up)
			})

			var right = new THREE.Vector3(0, -1, 0)
			it('Has a right vector of ' + right + '.', function() {
				expect(p.right()).toEqual(right)
			})

			var vertices = [], s = Radiant.Polygon.PlaneSize
			it('Has a quad of ' + (2 * s), function() {
				vertices.push(new THREE.Vector3(s, s, 0))
				vertices.push(new THREE.Vector3(s, -s, 0))
				vertices.push(new THREE.Vector3(-s, -s, 0))
				vertices.push(new THREE.Vector3(-s, s, 0))
				expect(vertices).toEqual(p.quad())
			})
		})
	})
})