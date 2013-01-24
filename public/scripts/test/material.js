'use strict'

/**
 * Unit tests for Radiant.Material.
 * 
 * @author jdolan
 */
define('Radiant.Material.Test', [ 'Jasmine', 'Radiant.Material' ], function() {
	
	describe('common/origin', function() {
		
		var material = undefined
		Radiant.Material.load('common/origin', function(m) {
			material = m
		})
		
		it('Loads asynchronously', function() {
			waitsFor(function() {
				return material
			})
		})
	})
})