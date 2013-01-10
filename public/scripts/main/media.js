'use strict';

/**
 * The Media module provides media and asset management.
 * 
 * @author jdolan
 */
define('Radiant.Media', [ 'THREE', 'Radiant.Event', 'Radiant.Util' ], function() {

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
	 * Loads the asset by the specified URL and type.
	 * 
	 * @param {String} url The asset URL.
	 * @param {int} type The asset type.
	 * @param {Boolean} reload Force reload.
	 * 
	 * @return {Object} The asset.
	 */
	module.load = function(url, type, reload) {

		var asset = null

		if (cache[url] && !reload) {
			asset = cache[url]
		} else {
			switch (type) {

			case module.Material:
				asset = THREE.ImageUtils.loadTexture(url)
				asset.wrapS = asset.wrapT = THREE.RepeatWrapping
				break

			default:
				console.error('Failed to load "' + url + '" (' + type + ')')
				break
			}

			if (asset) {
				cache[url] = asset
			}
		}

		return asset
	}

	window.Radiant.Media = module

	return module
})