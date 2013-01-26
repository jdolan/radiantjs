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
	module.Line = {
		brush: new THREE.LineBasicMaterial({
			color: 0x888888
		}),
		entity: new THREE.MeshBasicMaterial({
			wireframe: true
		})
	}

	/**
	 * The Mesh materials.
	 */
	module.Mesh = {
		entity: new THREE.MeshBasicMaterial({
			color: 0x888822,
			opacity: 0.66
		})
	}

	/**
	 * The shared Materials cache.
	 */
	var cache = []

	/**
	 * Textures load asynchronously and from remote servers.
	 * 
	 * @constructor
	 * @augments {THREE.Texture}
	 * 
	 * @param {String} uri The URI (e.g. textures/torn/floor1.png).
	 */
	module.Texture = function(uri) {
		THREE.Texture.call(this, new Image())

		this.name = uri

		this.wrapS = THREE.RepeatWrapping
		this.wrapT = THREE.RepeatWrapping

		this.loader = new THREE.ImageLoader()
		this.loader.crossOrigin = 'anonymous'

		var self = this
		var listener = function(event) {
			if (event.type === 'load') {
				self.needsUpdate = true
			}
			self.loader = undefined
		}

		this.loader.addEventListener('load', listener)
		this.loader.addEventListener('error', listener)

		this.loader.load(Radiant.Media.Root + uri, this.image)
	}

	$.extend(module.Texture.prototype, THREE.Texture.prototype, {
		constructor: module.Texture,

		isLoaded: function() {
			return !this.loader
		},

		onLoad: function(cb) {
			this.loader.addEventListener('load', cb)
		}
	})

	/**
	 * Loads the Material by the specified name.
	 * 
	 * @param {String} name The Material name (e.g. torn/floor1).
	 * @param {function(THREE.Material)} Optional completion handler.
	 * 
	 * @return {THREE.Material} The material.
	 */
	module.load = function(name, complete) {

		var uri
		if (name.charAt(0) === '#') {
			uri = encodeURI(name.substring(1)) + '.png'
		} else {
			uri = 'textures/' + encodeURI(name) + '.png'
		}

		var material = cache[uri]

		if (material === undefined) {
			cache[uri] = material = new THREE.MeshPhongMaterial({
				map: new module.Texture(uri)
			})
		}

		if (material.map.loader && complete) {
			material.map.loader.addEventListener('load', function(event) {
				complete(material)
			})
		}

		return material
	}

	window.Radiant.Material = module

	return module
})
