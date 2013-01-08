/**
 * The Map module provides an object model and framework for iterating and
 * accumulating .map geometry.
 */
define('Radiant.Map', [ 'Backbone', 'Radiant.Math' ], function() {

	var module = {}

	/**
	 * A Vertex is a point in world coordinates.
	 */
	module.Vertex = Backbone.Model.extend({
		defaults: {
			v: new Vector3()
		}
	})

	/**
	 * A Collection of Vertexes.
	 */
	module.Vertexes = Backbone.Collection.extend({
		model: module.Vertex
	})

	/**
	 * Surfaces are described by their Vertexes and material.
	 */
	module.Surface = Backbone.Model.extend({
		defaults: {
			flags: 0,
			value: 0,
			vertexes: new module.Vertexes()
		}
	})

	/**
	 * A Collection of Surfaces.
	 */
	module.Surfaces = Backbone.Collection.extend({
		model: module.Surface
	})

	/**
	 * Brushes are comprised of 4 or more Surfaces. Each brush must belong to an
	 * Entity (default is Worldspawn).
	 */
	module.Brush = Backbone.Model.extend({
		defaults: {
			surfaces: new module.Surfaces()
		}
	})

	/**
	 * A Collection of Brushes.
	 */
	module.Brushes = Backbone.Collection.extend({
		model: module.Brush
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
			origin: new module.Vertex(),
			brushes: new module.Brushes()
		},

		className: function() {
			return this.pairs['class']
		}
	})

	/**
	 * A Collection of Entities.
	 */
	module.Entities = Backbone.Collection.extend({
		model: module.Entity,

		worldspawn: function() {
			return this.models[0]
		}
	})

	/**
	 * Maps are collections of Entities. The Worldspawn entity is the first
	 * entity, and contains the bulk of the world geometry.
	 */
	module.Map = Backbone.Model.extend({

		entities: new module.Entities()

	})

	window.Radiant.Map = module

	return module
})
