'use strict'

/**
 * Unit tests for Radiant.Geometry.
 * 
 * @author jdolan
 */
define('Radiant.Geometry.Test', [ 'Jasmine', 'Radiant.Geometry' ], function() {

	describe('Radiant.Geometry.Test', function() {

		var p1 = new CSG.Vector(1, 1, 1)
		var p2 = new CSG.Vector(0, 1, 1)
		var p3 = new CSG.Vector(0, 0, 1)

		var plane1 = new CSG.Plane.fromPoints(p1, p2, p3)

		describe('Plane ' + plane1, function() {

			var normal = new CSG.Vector(0, 0, 1)
			it('Has a normal vector of ' + normal, function() {
				expect(plane1.normal).toEqual(normal)
			})

			it('Has a distance of 1', function() {
				expect(plane1.w).toEqual(1)
			})

			var up = new CSG.Vector(1, 0, 0)
			it('Has an up vector of ' + up, function() {
				expect(plane1.normal.up()).toEqual(up)
			})
		})

		var p4 = new CSG.Vector(1, 1, 1)
		var p5 = new CSG.Vector(0, 1, 0)
		var p6 = new CSG.Vector(0, 1, 1)

		var plane2 = new CSG.Plane.fromPoints(p4, p5, p6)

		describe('Plane ' + plane2, function() {

			var normal = new CSG.Vector(0, 1, 0)
			it('Has a normal vector of ' + normal, function() {
				expect(plane2.normal).toEqual(normal)
			})

			it('Has a distance of 1', function() {
				expect(plane2.w).toEqual(1)
			})

			var up = new CSG.Vector(0, 0, 1)
			it('Has an up vector of ' + up, function() {
				expect(plane2.normal.up()).toEqual(up)
			})
		})

		var poly1 = CSG.Polygon.fromPlane(plane1)

		describe('Polygon ' + poly1, function() {

			var vertices = [], s = Radiant.Geometry.PlaneSize

			vertices.push(new CSG.Vertex([ s, s, 1 ], plane1.normal))
			vertices.push(new CSG.Vertex([ s, -s, 1 ], plane1.normal))
			vertices.push(new CSG.Vertex([ -s, -s, 1 ], plane1.normal))
			vertices.push(new CSG.Vertex([ -s, s, 1 ], plane1.normal))

			it('Has vertices ' + vertices, function() {
				expect(poly1.vertices).toEqual(vertices)
			})
		})

		var poly2 = CSG.Polygon.fromPlane(plane2)

		describe('Polygon ' + poly2, function() {

			var vertices = [], s = Radiant.Geometry.PlaneSize

			vertices.push(new CSG.Vertex([ s, 1, s ], plane2.normal))
			vertices.push(new CSG.Vertex([ -s, 1, s ], plane2.normal))
			vertices.push(new CSG.Vertex([ -s, 1, -s ], plane2.normal))
			vertices.push(new CSG.Vertex([ s, 1, -s ], plane2.normal))

			it('Has vertices ' + vertices, function() {
				expect(poly2.vertices).toEqual(vertices)
			})
		})

		describe('Clipping poly1 against plane2', function() {

			var poly = poly1.clipTo(plane2)

			var vertices = [], s = Radiant.Geometry.PlaneSize

			vertices.push(new CSG.Vertex([ s, s, 1 ], plane1.normal))
			vertices.push(new CSG.Vertex([ s, 1, 1 ], plane1.normal))
			vertices.push(new CSG.Vertex([ -s, 1, 1 ], plane1.normal))
			vertices.push(new CSG.Vertex([ -s, s, 1 ], plane1.normal))

			it('Results in ' + vertices, function() {
				expect(poly).toBeTruthy()
				expect(poly.vertices).toEqual(vertices)
			})

			it('Is repeatable', function() {
				expect(poly.clipTo(plane2).vertices).toEqual(vertices)
			})
		})

		describe('Clipping poly2 against plane1', function() {

			var poly = poly2.clipTo(plane1)

			var vertices = [], s = Radiant.Geometry.PlaneSize

			vertices.push(new CSG.Vertex([ s, 1, s ], plane2.normal))
			vertices.push(new CSG.Vertex([ -s, 1, s ], plane2.normal))
			vertices.push(new CSG.Vertex([ -s, 1, 1 ], plane2.normal))
			vertices.push(new CSG.Vertex([ s, 1, 1 ], plane2.normal))

			it('Results in ' + vertices, function() {
				expect(poly).toBeTruthy()
				expect(poly.vertices).toEqual(vertices)
			})

			it('Is repeatable', function() {
				expect(poly.clipTo(plane1).vertices).toEqual(vertices)
			})
		})
	})
})