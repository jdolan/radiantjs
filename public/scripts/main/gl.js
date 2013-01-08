/**
 * The GL module provides convenience and standardization for WebGL usage.
 */
define('Radiant.GL', [], function() {

	var module = {}

	/**
	 * Returns a GL context for the specified canvas element.
	 * 
	 * @param {HTMLCanvasElement}
	 *            canvas The canvas element.
	 * 
	 * @return {WebGLRenderingContext}
	 */
	module.getContext = function(canvas) {
		var gl = undefined
		try {
			gl = canvas.getContext('experimental-webgl')
			gl.viewportWidth = canvas.width
			gl.viewportHeight = canvas.height
		} catch (e) {
			console.error(e)
		}
		return gl
	}
	
	window.Radiant.GL = module

	return module
})