'use strict'

/**
 * This is a JavaScript implementation of the Radiant level editing software for
 * idTech games. It requires WebGL and a decent JavaScript engine.<br/>
 * 
 * To run tests, source this script with <code>Radiant.Test = true</code>.
 * 
 * @author jdolan
 */

require.config({
	baseUrl: 'scripts',

	paths: {
		Backbone: 'main/lib/backbone-0.9.9.min',
		GoogleAnalytics: 'main/lib/ga.min',
		jQuery: 'main/lib/jquery-1.9.0.min',
		THREE: 'main/lib/three-r55',
		Underscore: 'main/lib/underscore-1.4.3.min',

		'Radiant.Controller': 'main/controller',
		'Radiant.Event': 'main/event',
		'Radiant.Material': 'main/material',
		'Radiant.Media': 'main/media',
		'Radiant.Model': 'main/model',
		'Radiant.Polygon': 'main/polygon',
		'Radiant.Ui': 'main/ui',
		'Radiant.Util': 'main/util',
		'Radiant.View': 'main/view',

		Jasmine: 'test/lib/jasmine-1.3.1',
		JasmineHtml: 'test/lib/jasmine-html-1.3.1',

		'Radiant.Model.Test': 'test/model',
		'Radiant.Polygon.Test': 'test/polygon'
	},

	shim: {
		Backbone: {
			deps: [ 'Underscore' ],
			exports: 'Backbone'
		},
		JasmineHtml: {
			deps: [ 'Jasmine' ]
		}
	},

	urlArgs: 'bust=' + (new Date()).getTime()
})

var Radiant = Radiant || {}
Radiant.Version = 'RadiantJS 0.1'

if (Radiant.Test) {
	require([ 'JasmineHtml', 'Radiant.Model.Test', 'Radiant.Polygon.Test' ], function() {
		jasmine.getEnv().addReporter(new jasmine.HtmlReporter())
		jasmine.getEnv().execute()
	})
} else {
	require([ 'Radiant.Controller', 'GoogleAnalytics' ], function() {
		window.radiant = new Radiant.Controller.Application({})
		window.radiant.loadMap('media/maps/torn.map')

		try {
			if (window.location.hostname !== 'localhost') {
				_gat._getTracker('UA-21071758-5')._trackPageview()
			}
		} catch (e) {
			console.debug('Google Analytics tracking failed', e)
		}
	})
}