/**
 * The Main module bootstraps the editor.
 */
define('Radiant.Main', [ 'Radiant.Layout', 'Radiant.Map', 'Radiant.Menu' ], function() {

	var module = {}

	/**
	 * 
	 */
	module.Preference = Backbone.Model.extend({
		defaults: {
			key: '',
			value: ''
		}
	})

	/**
	 * 
	 */
	module.Preferences = Backbone.Collection.extend({
		model: module.Preference
	})

	/**
	 * 
	 */
	module.Application = function() {
		
		this.preferences = new module.Preferences()
		this.mainMenu = new Radiant.Menu.Main()
		this.layout = new Radiant.Layout.Classic({})
		this.map = new Radiant.Map.Map()
		
		console.log(Radiant.Version + ' initialized')
	}

	window.Radiant.Main = module

	return module
})