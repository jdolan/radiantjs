'use strict';

/**
 * @author jdolan
 */
define('Radiant.Controller', [ 'jQueryUI', 'Radiant.Model', 'Radiant.View' ], function() {

	var module = {}

	/**
	 * The base menu type.
	 */
	module.Menu = function() {
		this.items = new Array()
	}
	
	_.extend(module.Menu.prototype, Object.prototype, {
		
	})

	/**
	 * The main menu.
	 */
	module.MainMenu = function() {
		module.Menu.call(this)
	}

	/**
	 * 
	 */
	module.Main = function() {

		this.preferences = new Radiant.Model.Preferences({})
		this.layout = new Radiant.View.Classic({})

		console.log(Radiant.Version + ' initialized')
	}

	window.Radiant.Controller = module

	return module
})