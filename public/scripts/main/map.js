/**
 *
 */
var Radiant = Radiant || {}

Radiant.Vertex = function(x, y, z) {
	this.x = x
	this.y = y
	this.z = z
}

Radiant.Side = function() {
	this.vertexes = new Array()
}

Radiant.Brush = function() {
	this.sides = new Array()
}
