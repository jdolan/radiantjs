/**
 * RadiantJS main file. Include this file to instantiate a RadiantJS instance.
 */

var Radiant = Radiant || {}

/**
 * 
 */
Radiant.Main = function(modules) {
	this.modules = modules

	this.menuElement = $('#menu')
	this.layoutElement = $('#layout')

	console.log('initialized')
}

/*
 * Require jQuery and all Radiant modules before we proceed.
 */
var deps = [ 'scripts/lib/jquery-1.8.3.min.js', 'scripts/lib/jquery-ui-1.9.2.custom.min.js', 'map' ]

require(deps, function() {
	window.radiant = Radiant.Main([])
})