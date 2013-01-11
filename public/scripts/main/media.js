'use strict';

/**
 * The Media module provides media and asset management.
 * 
 * @author jdolan
 */
define('Radiant.Media', [ 'Radiant.Event', 'Radiant.Util' ], function() {

	var module = {

		/**
		 * Constant for material images.
		 */
		Material: 0x1
	}

	/**
	 * The media cache.
	 */
	var cache = []

	/**
	 * Loads the asset by the specified name and type.
	 * 
	 * @param {String} name The asset name.
	 * @param {Number} type The asset type.
	 * @param {Boolean} reload Force reload.
	 * 
	 * @return {Object} The asset.
	 */
	module.load = function(name, type, reload) {
		
		var key = '/media/' + name
		var asset = null

		if (cache[key] && !reload) {
			asset = cache[key]
		} else {
			switch (type) {

			case module.Material:
				asset = THREE.ImageUtils.loadTexture(key)
				asset.wrapS = asset.wrapT = THREE.RepeatWrapping
				break

			default:
				console.error('Failed to load "' + key + '" (' + type + ')')
				break
			}

			if (asset) {
				cache[key] = asset
			}
		}

		return asset
	}

	window.Radiant.Media = module

	return module
})