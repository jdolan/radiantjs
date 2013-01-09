'use strict';

/**
 * The Media module provides media and asset management.
 * 
 * @author jdolan
 */
define('Radiant.Media', [ 'THREE' ], function() {

	var module = {

		/**
		 * Constant for material images.
		 */
		Material: 0x1
	}

	/**
	 * Loads the asset by the specified URL and type.
	 * 
	 * @param {String} url The asset URL.
	 * @param {int} type The asset type.
	 * 
	 * @return {Object} The asset.
	 */
	module.load = function(url, type) {

		var asset = null

		switch (type) {
		case module.Material:
			asset = THREE.ImageUtils.loadTexture(url)
			asset.wrapS = asset.wrapT = THREE.RepeatWrapping
			break
		default:
			console.error('Failed to load "' + url + '" (' + type + ')')
		}

		return asset

	}

	window.Radiant.Media = module

	return module
})