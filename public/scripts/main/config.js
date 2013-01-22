'use strict'

/**
 * The configuration module provides Preferences and Game settings management.
 * 
 * @author jdolan
 */
define('Radiant.Config', [ 'Radiant.Util' ], function() {

	var module = {}

	/**
	 * Game configurations.
	 */
	module.Game = function() {

		this.name = 'Unnamed Game'
		this.levelBounds = 8192
		this.brushDef = 'idTech2'
	}

	/**
	 * A Preference key-value pair. Preferences are saved to local storage.
	 * 
	 * @constructor
	 */
	module.Preference = function(key, defaultValue) {
		this.key = 'Radaint.Preferences.' + key
		this.value = /* $.localStorage(this.key) || */defaultValue
	}

	$.extend(module.Preference.prototype, {
		constructor: module.Preference,

		/**
		 * Saves this Preference to local storage.
		 */
		save: function() {
			// $.localStorage(this.key, this.value)
		}
	})

	/**
	 * User Preferences.
	 */
	module.Preferences = function(params) {

		params.preferences = this

		for ( var p in module.Preferences.__defaults) {
			this[p] = new module.Preference(p, module.Preferences.__defaults[p])
		}
	}

	$.extend(module.Preferences.prototype, {
		constructor: module.Preferences,

		/**
		 * Saves all Preferences to local storage.
		 */
		save: function() {
			for ( var p in this) {
				if (this[p] instanceof module.Preference) {
					this[p].save()
				}
			}
		}
	})

	/**
	 * The default Preferences.
	 */
	module.Preferences.__defaults = {
		keyForward: 'w',
		keyBack: 's',
		keyMoveLeft: 'a',
		keyMoveRight: 'd',
		keyMoveUp: 'd',
		keyMoveDown: 'c',
		keyLookUp: 'a',
		keyLookDown: 'z',
		keyLookLeft: ',',
		keyLookRight: '.',
		keyZoomIn: '-',
		keyZoomOut: '+',
		keySurfaceInspector: 'S',
		keyEntityInspector: 'n',
		cameraMovementSpeed: 5.5,
		cameraRotationSpeed: 2.0,
		freelookSensitivity: 0.1,
		freelookInvert: false,
		followPerspectiveView: true
	}

	window.Radiant.Config = module

	return module
})