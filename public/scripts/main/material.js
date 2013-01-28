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
	var cache = [], bust = window.location.host

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

		this.flipY = false

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

		this.loader.load(Radiant.Media.Root + uri + '?' + bust, this.image)
	}

	$.extend(module.Texture.prototype, THREE.Texture.prototype, {
		constructor: module.Texture,

		/**
		 * @return {Boolean} True if this Texture is loading, false if loaded.
		 */
		isLoading: function() {
			return this.loader !== undefined
		},

		/**
		 * Adds the specified <code>onLoad</code> handler to this Texture.
		 * 
		 * @param {function(Event)} handler The <code>onLoad</code> handler.
		 */
		onLoad: function(handler) {
			if (this.isLoading()) {
				this.loader.addEventListener('load', handler)
			}
		}
	})

	/**
	 * Loads the Material by the specified name.
	 * 
	 * @param {String} name The Material name (e.g. torn/floor1).
	 * @param {function(Event)} An optional <code>onLoad</code> handler.
	 * 
	 * @return {THREE.Material} The material.
	 */
	module.load = function(name, onLoad) {

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

		material.map.onLoad(onLoad)

		return material
	}

	window.Radiant.Material = module

	return module
})
