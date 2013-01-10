'use strict';

/**
 * The Material module provides material (texture) management.
 * 
 * @author jdolan
 */
define('Radiant.Material', [ 'Radiant.Media' ], function() {

	var module = {}

	/**
	 * The Lines materials.
	 */
	module.Lines = {
		grid: new THREE.MeshBasicMaterial({
			color: 0x888888,
			wireframe: true
		}),
		wireframe: new THREE.MeshBasicMaterial({
			color: 0x222222,
			wireframe: true
		})
	}

	/**
	 * A convenience function for loading materials.
	 * 
	 * @param {String} The image URL.
	 * 
	 * @return {THREE.Texture} The texture.
	 */
	module.load = function(url) {
		return Radiant.Media.load(url, Radiant.Media.Material)
	}

	/**
	 * The Common materials.
	 */
	module.Common = {
		caulk: new THREE.MeshBasicMaterial({
			map: module.load('images/materials/common/caulk.png')
		}),
		clip: new THREE.MeshBasicMaterial({
			map: module.load('images/materials/common/clip.png')
		}),
		hint: new THREE.MeshBasicMaterial({
			map: module.load('images/materials/common/hint.png')
		}),
		ladder: new THREE.MeshBasicMaterial({
			map: module.load('images/materials/common/ladder.png')
		}),
		missing: new THREE.MeshBasicMaterial({
			map: module.load('images/materials/common/missing.png')
		}),
		origin: new THREE.MeshBasicMaterial({
			map: module.load('images/materials/common/origin.png')
		}),
		sky: new THREE.MeshBasicMaterial({
			map: module.load('images/materials/common/sky.png')
		}),
		trigger: new THREE.MeshBasicMaterial({
			map: module.load('images/materials/common/trigger.png')
		})
	}

	window.Radiant.Material = module

	return module
})