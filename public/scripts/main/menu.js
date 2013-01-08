/**
 * 
 */
define('Radiant.Menu', [ 'Backbone', 'jQueryUI' ], function(a, b, c) {

	var module = {}

	/**
	 * The base menu type.
	 */
	var Base = Backbone.Model.extend({
		defaults: {
			container: null
		}
	})

	/**
	 * The main menu.
	 */
	module.Main = Base.extend({
		defaults: {
			conatiner: $('#main-menu')
		},

		initialize: function(options) {

		}
	})

	window.Radiant.Menu = module

	return module
})