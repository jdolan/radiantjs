/**
 * 
 */
define('Radiant.Math', [], function() {
	
	var module = {}
	
	/**
	 * A two-dimensional vector.
	 */
	module.Vector2 = function(x, y) {
		this.x = x || 0.0
		this.y = y || 0.0
	}

	/**
	 * A three-dimensional vector.
	 */
	module.Vector3 = function(x, y, z) {
		this.x = x || 0.0
		this.y = y || 0.0
		this.z = z || 0.0
	}

	module.Vector3.prototype = {
			
		add: function(v) {
			return new module.Vector3(this.x + v.x, this.y + v.y, this.z + v.z)
		},
		
		subtract: function(v) {
			return new module.Vector3(this.x - v.x, this.y - v.y, this.z - v.z)
		},
		
		scale: function(s) {
			return new module.Vector3(this.x * s, this.y * s, this.z * s)
		},

		normalize: function() {
			return this.scale(1.0 / this.length())
		},

		length: function() {
			return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z)
		},

		toString: function() {
			return '(' + this.x + ', ' + this.y + ', ' + this.z + ')'
		}
	}
	
	window.Radiant.Math = module
	window.Vector2 = window.Radiant.Math.Vector2
	window.Vector3 = window.Radiant.Math.Vector3
	
	return module
})