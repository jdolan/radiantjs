/**
 * The Map module provides an object model and framework for iterating and
 * accumulating .map geometry.
 */
define('Radiant.Map', [ 'Backbone', 'Three' ], function() {

	var module = {}

	/**
	 * Surfaces are described by their Vertexes and material.
	 */
	module.Surface = Backbone.Model.extend({
		defaults: {
			flags: 0,
			value: 0
		},
		geometry: new THREE.Geometry()
	})

	/**
	 * Brushes are comprised of 4 or more Surfaces. Each brush must belong to an
	 * Entity (default is Worldspawn).
	 */
	module.Brush = Backbone.Model.extend({
		defaults: {
			contents: 0
		},
		surfaces: new Backbone.Collection()
	})

	/**
	 * Entities are key-value pair structures that optionally encompass one or
	 * more Brushes. Worldspawn is the first entity in any Map.
	 */
	module.Entity = Backbone.Model.extend({
		defaults: {
			pairs: {
				'class': 'undefined'
			},
			origin: new THREE.Vector3(),
		},
		
		brushes: new Backbone.Collection(),

		className: function() {
			return this.get('pairs')['class']
		}
	})

	/**
	 * Maps are collections of Entities. The Worldspawn entity is the first
	 * entity, and contains the bulk of the world geometry.
	 */
	module.Map = Backbone.Model.extend({
		defaults: {
			entities: new Backbone.Collection()
		},
		
		worldspawn: function() {
			return this.get('entities').at(0)
		}
	})

	window.Radiant.Map = module

	return module
})
