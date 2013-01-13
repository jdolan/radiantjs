'use strict';

/**
 * This is a JavaScript implementation of the Radiant level editing software for
 * idTech games. It requires WebGL and a decent JavaScript engine.
 * 
 * @author jdolan
 */

/**
 * The Radiant global is eventually populated through AMD via Require.js.
 */
var Radiant = {
	Version: 'RadiantJS 0.1'
}

/*
 * Setup AMD through Require.js.
 */
require.config({
	baseUrl: 'scripts',

	paths: {
		Backbone: 'lib/backbone-0.9.9.min',
		jQuery: 'lib/jquery-1.8.3.min',
		THREE: 'lib/three-r54.min',
		Underscore: 'lib/underscore-1.4.3.min',

		'Radiant.Controller': 'main/controller',
		'Radiant.Event': 'main/event',
		'Radiant.Material': 'main/material',
		'Radiant.Media': 'main/media',
		'Radiant.Model': 'main/model',
		'Radiant.Ui': 'main/ui',
		'Radiant.Util': 'main/util',
		'Radiant.View': 'main/view'
	},

	shim: {
		Backbone: {
			deps: [ 'Underscore' ],
			exports: 'Backbone'
		}
	},

	urlArgs: 'bust=' + (new Date()).getTime()
})

/*
 * Load the Main module and instantiate it.
 */
require([ 'Radiant.Controller' ], function() {
	window.radiant = new Radiant.Controller.Application({})
	window.radiant.loadMap('media/maps/construct.map')
})