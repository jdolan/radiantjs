/**
 * 
 */
define('Radiant.Draw', [ 'Radiant.Math' ], function() {

	var module = {}

	/**
	 * 
	 */
	module.Rectangle = function(topLeft, bottomRight) {
		this.topLeft = topLeft || new Vector2()
		this.bottomRight = bottomRight || new Vector2()
	}

	window.Radiant.Draw = module
	window.Rectangle = window.Radiant.Draw.Rectangle

	return module
})