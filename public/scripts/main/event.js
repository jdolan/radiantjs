'use strict';

/**
 * This module defines custom events.
 */
define('Radiant.Event', [], function() {
	
	var module = {
		Map: {
			Load: 'Map.Load',
			Unload: 'Map.Unload'
		}
	}
	
	window.Radiant.Event = module
	
	return module
})