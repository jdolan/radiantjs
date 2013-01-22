'use strict'

/**
 * Unit tests for Radiant.Model.
 * 
 * @author jdolan
 */
define('Radiant.Map.Test', [ 'Jasmine', 'Radiant.Map' ], function() {

	describe('Radiant.Map.Test', function() {

		describe('media/maps/construct.map', function() {

			var map = undefined
			Radiant.Map.Factory.load('media/maps/construct.map', function(m) {
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
					brushes += map.entities[i].brushes.length
				}
				expect(brushes).toBe(22)
			})

			it('Has 132 surfaces with 4 vertices each', function() {
				var surfaces = 0
				for ( var i = 0; i < map.entities.length; i++) {
					var entity = map.entities[i]

					for ( var j = 0; j < entity.brushes.length; j++) {
						var brush = entity.brushes[j]

						surfaces += brush.surfaces.length

						for ( var k = 0; k < brush.surfaces.length; k++) {
							var surface = brush.surfaces[k]

							expect(surface.vertices.length).toBe(4)
						}
					}
				}
				expect(surfaces).toBe(132)
			})

			it('Can be updated efficiently', function() {

				var start = new Date().getTime()
				map.worldspawn().update()
				var end = new Date().getTime()

				expect(end - start).toBeLessThan(50)
				console.log('Construct worldspawn update', end - start)
			})
		})

		describe('media/maps/torn.map', function() {

			var map = undefined
			Radiant.Map.Factory.load('media/maps/torn.map', function(m) {
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

			it('Has 194 entities', function() {
				expect(map.entities.length).toBe(194)
			})

			it('Has 2031 world brushes', function() {
				expect(map.worldspawn().brushes.length).toBe(2031)
			})

			it('Has rotated light emitters', function() {

				var s = map.worldspawn().brushes[412].surfaces[5]

				expect(s.texture).toBe('torn/metpan_lite1')
				expect(s.offsetS).toBe(0)
				expect(s.offsetT).toBe(64)
				expect(s.angle).toBe(90)
				expect(s.scaleS).toBe(0.5)
				expect(s.scaleT).toBe(0.5)
				expect(s.contents).toBe(1)
				expect(s.flags).toBe(1)
				expect(s.value).toBe(150)
			})

			it('Has plausible base texture vectors', function() {

				var s = map.worldspawn().brushes[1].surfaces[3]
				var tv = s.plane.textureVectors()

				expect(tv[0]).toEqual(new THREE.Vector3(1, 0, 1))
				expect(tv[1]).toEqual(new THREE.Vector3(0, -1, 1))
			})

			it('Can be updated efficiently', function() {

				var start = new Date().getTime()
				map.worldspawn().update()
				var end = new Date().getTime()

				expect(end - start).toBeLessThan(150)
				console.log('Torn worldspawn update', end - start)
			})
		})
	})
})