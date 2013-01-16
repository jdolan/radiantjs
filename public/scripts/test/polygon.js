'use strict'

/**
 * Unit tests for Radiant.Polygon.
 * 
 * @author jdolan
 */
define('Radiant.Polygon.Test', [ 'Jasmine', 'Radiant.Polygon' ], function() {

	describe('Radiant.Polygon.Test', function() {

		var p1 = new THREE.Vector3(1, 1, 1)
		var p2 = new THREE.Vector3(0, 1, 1)
		var p3 = new THREE.Vector3(0, 0, 1)

		var plane1 = new THREE.Plane().setFromCoplanarPoints(p1, p2, p3)

		describe('Plane ' + plane1, function() {

			var normal = new THREE.Vector3(0, 0, 1)
			it('Has a normal vector of ' + normal, function() {
				expect(plane1.normal).toEqual(normal)
			})

			var up = new THREE.Vector3(1, 0, 0)
			it('Has an up vector of ' + up, function() {
				expect(plane1.up()).toEqual(up)
			})

			var v1 = new THREE.Vector3()
			it('Has distance to ' + v1, function() {
				expect(plane1.distanceToPoint(v1)).toBe(-1)
			})

			var v2 = new THREE.Vector3(5, 8, -4)
			it('Has distance to ' + v2, function() {
				expect(plane1.distanceToPoint(v2)).toBe(-5)
			})

			var vertices = [], s = Radiant.Polygon.PlaneSize
			it('Has a quad of ' + s, function() {
				vertices.push(new THREE.Vector3(s, s, 1))
				vertices.push(new THREE.Vector3(s, -s, 1))
				vertices.push(new THREE.Vector3(-s, -s, 1))
				vertices.push(new THREE.Vector3(-s, s, 1))
				expect(vertices).toEqual(plane1.quad())
			})
		})

		var p4 = new THREE.Vector3(1, 1, 1)
		var p5 = new THREE.Vector3(0, 1, 0)
		var p6 = new THREE.Vector3(0, 1, 1)

		var plane2 = new THREE.Plane().setFromCoplanarPoints(p4, p5, p6)

		describe('Plane ' + plane2, function() {

			var normal = new THREE.Vector3(0, 1, 0)
			it('Has a normal vector of ' + normal, function() {
				expect(plane2.normal).toEqual(normal)
			})

			var up = new THREE.Vector3(0, 0, 1)
			it('Has an up vector of ' + up, function() {
				expect(plane2.up()).toEqual(up)
			})

			var v1 = new THREE.Vector3()
			it('Has distance to ' + v1, function() {
				expect(plane2.distanceToPoint(v1)).toBe(-1)
			})

			var v2 = new THREE.Vector3(4, 5, 6)

			it('Has distance to ' + v2, function() {
				expect(plane2.distanceToPoint(v2)).toBe(4)
			})

			var vertices = [], s = Radiant.Polygon.PlaneSize
			it('Has a quad of ' + s, function() {
				vertices.push(new THREE.Vector3(s, 1, s))
				vertices.push(new THREE.Vector3(-s, 1, s))
				vertices.push(new THREE.Vector3(-s, 1, -s))
				vertices.push(new THREE.Vector3(s, 1, -s))
				expect(vertices).toEqual(plane2.quad())
			})
		})

		describe('Clipping ' + plane1 + ' against ' + plane2, function() {

			var vertices = plane1.clip([ plane2 ])
			it('Results in 4 vertices', function() {
				expect(vertices.length).toBe(4)
			})

			it('Clips along XZ', function() {
				for ( var i = 0; i < vertices.length; i++) {
					expect(vertices[i].y).toBeGreaterThan(0.99)
				}
			})
		})

		describe('Clipping ' + plane2 + ' against ' + plane1, function() {

			var vertices = plane2.clip([ plane1 ])
			it('Results in 4 vertices', function() {
				expect(vertices.length).toBe(4)
			})

			it('Clips along XY', function() {
				for ( var i = 0; i < vertices.length; i++) {
					expect(vertices[i].z).toBeGreaterThan(0.99)
				}
			})
		})
	})
})