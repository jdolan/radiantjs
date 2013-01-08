'use strict';

/**
 * They Layout module is responsible for rendering all Views (2D and 3D) of a
 * <code>Radiant.Map.Map</code>. A single WebGL canvas with multiple cameras
 * and viewports are used.
 */
define('Radiant.Layout', [ 'Underscore', 'jQuery', 'Three' ], function() {

	var module = {}

	/**
	 * Views are responsible for drawing a 2D or 3D area of the Layout.
	 * 
	 * @param {Array} params
	 */
	module.View = function(params) {
		this.layout = params.layout
		this.renderer = params.renderer
		this.viewport = params.viewport
		this.scene = params.scene

		this.initialize(params)
	}

	_.extend(module.View.prototype, Object.prototype, {
		initialize: function(params) {
			// to be overridden
		},

		update: function() {
			// to be overridden
		},

		/**
		 * Render this view. The underlying implementation is given an
		 * opportunity to act on the frame via <code>update</code>.
		 */
		render: function() {

			this.update()

			this.renderer.clear()

			var v = this.viewport
			this.renderer.setViewport(v.x, v.y, v.z, v.w)

			this.renderer.render(this.scene, this.camera)
		}
	})

	/**
	 * Orthographic (2D) regions.
	 */
	module.View.Orthographic = function(params) {
		module.View.call(this, params)
	}

	_.extend(module.View.Orthographic.prototype, module.View.prototype, {
		
		/**
		 * Initializes this Orthographic View.
		 */
		initialize: function(params) {

			this.zoom = params.zoom || 1

			var w = 1024 * this.zoom / 2
			var h = w / (this.viewport.z / this.viewport.w)

			this.camera = new THREE.OrthographicCamera(-w, w, h, -h, 0.1, 16384)
			this.camera.position.copy(params.origin)
			this.camera.lookAt(new THREE.Vector3())
			
			console.debug('Ortho: ' + -w + '-' + w + ', ' + h + '-' + -h)

			this.scene.add(this.camera)
		},

		/**
		 * Update this View's Scene to reflect the current Map.
		 */
		update: function() {
			// TODO iterate Map and update scene
		}
	})

	/**
	 * Perspective (3D) regions.
	 */
	module.View.Perspective = function(params) {
		module.View.call(this, params)
	}

	_.extend(module.View.Perspective.prototype, module.View.prototype, {
		
		/**
		 * Initializes this Perspective View.
		 */
		initialize: function(params) {
			var aspect = this.viewport.z / this.viewport.w

			this.camera = new THREE.PerspectiveCamera(60.0, aspect, 0.1, 4096.0)
			this.camera.position.copy(params.origin)
			this.camera.lookAt(new THREE.Vector3())

			this.scene.add(this.camera)
		},

		/**
		 * Update this View's Scene to reflect the current Map.
		 */
		update: function() {
			// TODO iterate Map and update scene
		}
	})

	/**
	 * The base Layout class.
	 * 
	 * @param {Array} params The parameters to pass to THREE.WebGLRenderer.
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

			this.defaultMaterial = new THREE.MeshLambertMaterial()

			this.initialize(params)

			var cube = new THREE.Mesh(new THREE.CubeGeometry(300, 100, 100), this.defaultMaterial)
			this.scene.add(cube)

			var sphere = new THREE.Mesh(new THREE.SphereGeometry(75), this.defaultMaterial)
			sphere.position = new THREE.Vector3(0, 0, 0)
			this.scene.add(sphere)

			var light = new THREE.PointLight(0x2222dd, 1, 1024);
			light.position.set(100, 100, 100);
			this.scene.add(light);

			requestAnimationFrame(this.render.bind(this));
		} else {
			console.error('Failed to initialize WebGL context')
		}
	}

	_.extend(Layout.prototype, Object.prototype, {
		initialize: function(params) {
			// to be overridden
		},

		/**
		 * Render all Views in this Layout.
		 */
		render: function() {
			for ( var i = 0; i < this.views.length; i++) {
				this.views[i].render()
			}
			requestAnimationFrame(this.render.bind(this))
		}
	})

	/**
	 * The classic (4-quadrant) GtkRadiant layout.
	 */
	module.Classic = function(params) {
		Layout.call(this, params)
	}

	_.extend(module.Classic.prototype, Layout.prototype, {
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