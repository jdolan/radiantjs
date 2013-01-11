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
	 * The Mesh materials.
	 */
	module.Mesh = {
		entity: new THREE.MeshBasicMaterial({
			color: 0x888822
		})
	}

	/**
	 * A convenience function for loading materials.
	 * 
	 * @param {String} name The material name (e.g. torn/floor1.jpg).
	 * 
	 * @return {THREE.Texture} The texture.
	 */
	module.load = function(name) {
		return Radiant.Media.load('textures/' + name, Radiant.Media.Material)
	}

	/**
	 * The Common materials.
	 */
	module.Common = {
		caulk: new THREE.MeshBasicMaterial({
			map: module.load('common/caulk.png')
		}),
		clip: new THREE.MeshBasicMaterial({
			map: module.load('common/clip.png')
		}),
		hint: new THREE.MeshBasicMaterial({
			map: module.load('common/hint.png')
		}),
		ladder: new THREE.MeshBasicMaterial({
			map: module.load('common/ladder.png')
		}),
		missing: new THREE.MeshBasicMaterial({
			map: module.load('common/missing.png')
		}),
		origin: new THREE.MeshBasicMaterial({
			map: module.load('common/origin.png')
		}),
		sky: new THREE.MeshBasicMaterial({
			map: module.load('common/sky.png')
		}),
		trigger: new THREE.MeshBasicMaterial({
			map: module.load('common/trigger.png')
		})
	}

	window.Radiant.Material = module

	return module
})