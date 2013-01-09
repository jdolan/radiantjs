'use strict';

/**
 * This is a JavaScript implementation of the Radiant level editing software
 * for idTech games. It requires WebGL and a decent JavaScript engine.
 * 
 * @author jdolan
 */

/**
 * The Radiant global is eventually populated through AMD via Require.js.
 */
var Radiant = {
	Version: 'RadiantJS 0.1',
}

/*
 * Setup AMD through Require.js.
 */
require.config({
	baseUrl: 'scripts',

	paths: {
		Backbone: 'lib/backbone-0.9.9.min',
		jQuery: 'lib/jquery-1.8.3.min',
		jQueryUI: 'lib/jquery-ui-1.9.2.custom.min',
		Three: 'lib/three-r54.min',
		Underscore: 'lib/underscore-1.4.3.min',
		
		'Radiant.Layout': 'main/layout',
		'Radiant.Main': 'main/main',
		'Radiant.Map': 'main/map',
		'Radiant.Menu': 'main/menu',
	},

	shim: {
		Backbone: {
			deps: [ 'Underscore' ],
			exports: 'Backbone'
		},
		jQueryUI: {
			deps: [ 'jQuery' ]
		}
	},

	urlArgs: 'bust=' + (new Date()).getTime()
})

/*
 * Load the Main module and instantiate it.
 */
require(['Radiant.Main'], function() {
	window.radiant = Radiant.Main.Application()
})