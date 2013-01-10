'use strict';

/**
 * This module defines custom events.
 */
define('Radiant.Event', [], function() {
	
	var module = {
		Map: {
			Loaded: 'Map.Loaded'
		}
	}
	
	window.Radiant.Event = module
	
	return module
})