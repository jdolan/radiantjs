'use strict';

/**
 * The Media module provides media and asset management.
 * 
 * @author jdolan
 */
define('Radiant.Media', [ 'Radiant.Event', 'Radiant.Util' ], function() {

	var module = {

		/**
		 * The media root.
		 */
		Root: 'http://media.radiantjs.com/media/'
	}
		
	module.index = function() {
		
	}

	window.Radiant.Media = module

	return module
})