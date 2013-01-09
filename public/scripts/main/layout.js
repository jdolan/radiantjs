'use strict';

/**
 * They Layout module is responsible for rendering all Views (2D and 3D) of a
 * <code>Radiant.Map.Map</code>. A single WebGL canvas with multiple cameras
 * and viewports are used.
 * 
 * @author jdolan
 */
define('Radiant.Layout', [ 'Underscore', 'jQuery', 'Radiant.Material' ], function() {

	var module = {}

	/**
	 * Views are responsible for drawing a 2D or 3D area of the Layout.
	 * 
	 * @constructor
	 * @param {Object} params The initialization parameters.
	 */
	module.View = function(params) {
		this.layout = params.layout
		this.renderer = params.renderer
		this.viewport = params.viewport
		this.scene = params.scene

		this.initialize(params)
	}

	_.extend(module.View.prototype, Object.prototype, {
		constructor: module.View,

		/**
		 * Initializes this View. To be overridden.
		 * 
		 * @param {Object} params The initialization parameters.
		 */
		initialize: function(params) {
			// to be overridden
		},

		/**
		 * Render this view. The underlying implementation is given an
		 * opportunity to act on the frame via <code>update</code>.
		 */
		render: function() {

			var v = this.viewport
			this.renderer.setViewport(v.x, v.y, v.z, v.w)

			this.renderer.render(this.scene, this.camera)
		}
	})

	/**
	 * Orthographic (2D) Views.
	 * 
	 * @constructor
	 * @augments Radiant.Layout.View
	 * 
	 * @param {Object} params The initialization parameters.
	 */
	module.View.Orthographic = function(params) {
		module.View.call(this, params)
	}

	_.extend(module.View.Orthographic.prototype, module.View.prototype, {
		constructor: module.View.Orthographic,

		/**
		 * Initializes this Orthographic View.
		 * 
		 * @param {Object} params The initialization parameters.
		 */
		initialize: function(params) {

			this.zoom = params.zoom || 1

			var w = 1024 * this.zoom / 2
			var h = w / (this.viewport.z / this.viewport.w)

			this.camera = new THREE.OrthographicCamera(-w, w, h, -h, 0.1, 16384)
			this.camera.position.copy(params.origin)
			this.camera.lookAt(new THREE.Vector3())

			this.scene.add(this.camera)
		}
	})

	/**
	 * Perspective (3D) Views.
	 * 
	 * @constructor
	 * @augments Radiant.Layout.View
	 * 
	 * @param {Object} params The initialization parameters.
	 */
	module.View.Perspective = function(params) {
		module.View.call(this, params)
	}

	_.extend(module.View.Perspective.prototype, module.View.prototype, {
		constructor: module.View.Perspective,

		/**
		 * Initializes this Perspective View.
		 * 
		 * @override
		 * 
		 * @param {Object} params The initialization parameters.
		 */
		initialize: function(params) {
			var aspect = this.viewport.z / this.viewport.w

			this.camera = new THREE.PerspectiveCamera(60.0, aspect, 0.1, 4096.0)
			this.camera.position.copy(params.origin)
			this.camera.lookAt(new THREE.Vector3())

			this.scene.add(this.camera)
		}
	})

	/**
	 * The base Layout class.
	 * 
	 * @private
	 * @constructor
	 * 
	 * @param {Object} params The initialization parameters.
	 */
	var Layout = function(params) {

		params.canvas = params.canvas || $('#layout > canvas')[0]

		this.width = $(params.canvas).width()
		this.height = $(params.canvas).height()

		this.views = new Array()

		this.renderer = new THREE.WebGLRenderer(params)

		if (this.renderer.getContext()) {

			this.renderer.autoClear = false
			this.renderer.setSize(this.width, this.height)

			this.scene = new THREE.Scene()

			this.initialize(params)

			// let's build a shitty little scene

			var material = Radiant.Materials.Common.missing

			var cube = new THREE.Mesh(new THREE.CubeGeometry(300, 100, 100), material)
			this.scene.add(cube)

			material = Radiant.Materials.Common.hint

			var sphere = new THREE.Mesh(new THREE.SphereGeometry(75), material)
			sphere.position = new THREE.Vector3(0, 0, 0)
			this.scene.add(sphere)

			requestAnimationFrame(this.render.bind(this));
		} else {
			console.error('Failed to initialize WebGL context')
		}
	}

	_.extend(Layout.prototype, Object.prototype, {
		constructor: Layout,

		/**
		 * Initializes this Layout. To be overridden.
		 * 
		 * @param {Object} params The initialization parameters.
		 */
		initialize: function(params) {
			// to be overridden
		},

		/**
		 * Render all Views in this Layout. The Renderer is manually cleared
		 * just once before the Views are repainted.
		 */
		render: function() {

			this.renderer.clear()

			for ( var i = 0; i < this.views.length; i++) {

				if (this.views[i] instanceof module.View.Orthographic) {
					this.scene.overrideMaterial = Radiant.Materials.Lines.wireframe
				} else {
					this.scene.overrideMaterial = undefined
				}

				this.views[i].render()
			}

			requestAnimationFrame(this.render.bind(this))
		}
	})

	/**
	 * The classic (4-quadrant) GtkRadiant layout.
	 * 
	 * @constructor
	 * @augments Layout
	 * 
	 * @param {Object} params The initialization parameters.
	 */
	module.Classic = function(params) {
		Layout.call(this, params)
	}

	_.extend(module.Classic.prototype, Layout.prototype, {
		constructor: module.Classic,

		/**
		 * Initializes the Classic Layout.
		 * 
		 * @param {Object} params The initialization parameters.
		 */
		initialize: function(params) {

			var w = this.width / 2
			var h = this.height / 2

			_.extend(params, {
				layout: this,
				renderer: this.renderer,
				scene: this.scene
			})

			// Perspective camera
			this.views.push(new module.View.Perspective(_.extend(params, {
				viewport: new THREE.Vector4(0, h, w, h),
				origin: new THREE.Vector3(256, 256, 256)
			})))

			// Orthographic XZ (top-down)
			this.views.push(new module.View.Orthographic(_.extend(params, {
				viewport: new THREE.Vector4(w, h, w, h),
				origin: new THREE.Vector3(0, 256, 0)
			})))

			// Orthographic ZY (left)
			this.views.push(new module.View.Orthographic(_.extend(params, {
				viewport: new THREE.Vector4(0, 0, w, h),
				origin: new THREE.Vector3(256, 0, 0)
			})))

			// Orthographic XY (back)
			this.views.push(new module.View.Orthographic(_.extend(params, {
				viewport: new THREE.Vector4(w, 0, w, h),
				origin: new THREE.Vector3(0, 0, 256)
			})))
		}
	})

	window.Radiant.Layout = module

	return module
})