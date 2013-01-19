'use strict'

/**
 * Unit tests for Radiant.Model.
 * 
 * @author jdolan
 */
define('Radiant.Model.Test', [ 'Jasmine', 'Radiant.Model' ], function() {

	describe('Radiant.Model.Test', function() {

		describe('media/maps/construct.map', function() {

			var map = undefined
			Radiant.Model.MapFactory.load('media/maps/construct.map', function(m) {
				map = m
			})

			it('Loads asynchronously', function() {
				waitsFor(function() {
					return map
				})
			})

			it('Has a message', function() {
				expect(map.worldspawn().getValue('message')).toBeDefined()
			})

			it('Has 50 entities', function() {
				expect(map.entities.length).toBe(50)
			})

			it('Has 22 brushes', function() {
				var brushes = 0
				for ( var i = 0; i < map.entities.length; i++) {
					brushes += map.entities.at(i).brushes.length
				}
				expect(brushes).toBe(22)
			})

			it('Has 132 surfaces with 4 vertices each', function() {
				var surfaces = 0
				for ( var i = 0; i < map.entities.length; i++) {
					var entity = map.entities.at(i)
					for ( var j = 0; j < entity.brushes.length; j++) {
						var brush = entity.brushes.at(j)
						surfaces += brush.surfaces.length
						for ( var k = 0; k < brush.surfaces.length; k++) {
							var surface = brush.surfaces.at(k)
							expect(surface.vertices.length).toBe(4)
						}
					}
				}
				expect(surfaces).toBe(132)
			})

			it('Brush 0 has 6 planes', function() {
				expect(map.worldspawn().brushes.at(0).surfaces.length).toBe(6)
			})
		})
	})
})