/**
 * 
 */
define('Radiant.Layout', [ 'Underscore', 'jQuery', 'Three' ], function() {

	var module = {}

	/**
	 * Views are responsible for drawing a 2D or 3D area of the Layout.
	 * 
	 * @param {THREE.Box2}
	 */
	module.View = function(params) {
		this.layout = params.layout
		this.onRender = params.onRender

		this.initialize(params)
	}

	_.extend(module.View.prototype, Object.prototype, {
		initialize: function(params) {
			// to be overridden
		},

		render: function(params) {
			// to be overridden
		}
	})

	/**
	 * Orthographic (2D) regions.
	 */
	module.View.Orthographic = function(params) {
		module.View.call(this, params)
	}

	_.extend(module.View.Orthographic.prototype, module.View.prototype, {
		initialize: function(params) {

		},

		/**
		 * Render the scene using this Orthographic View.
		 */
		render: function(params) {
			this.layout.camera.toOrthographic()

			if (this.onRender) {
				this.onRender(params)
			}

			console.debug('Orthographic render')
		}
	})

	/**
	 * Perspective (3D) regions.
	 */
	module.View.Perspective = function(params) {
		module.View.call(this, params)
	}

	_.extend(module.View.Perspective.prototype, module.View.prototype, {
		initialize: function(params) {

		},

		/**
		 * Render the scene using this Perspective View.
		 */
		render: function(params) {
			this.layout.camera.toPerspective()

			if (this.onRender) {
				this.onRender(params)
			}

			console.debug('Perspective render')
		}
	})

	/**
	 * The base Layout class.
	 * 
	 * @param {Array} params The parameters to pass to THREE.WebGLRenderer.
	 */
	var Layout = function(params) {

		params.canvas = params.canvas || $('#layout > canvas')[0]
		this.renderer = new THREE.WebGLRenderer(params)

		if (this.renderer.getContext()) {
			this.scene = new THREE.Scene()
			this.camera = new THREE.CombinedCamera(8192.0, 8192.0, 60.0, 0.1, 4096.0, 0.1, 8192.0)
			this.scene.add(this.camera)
			this.views = new Array()
			this.initialize(params)
		} else {
			console.error('Failed to initialize WebGL context')
		}
	}

	_.extend(Layout.prototype, Object.prototype, {
		initialize: function(params) {
			// to be overridden
		},

		/**
		 * Render all Views in the Layout.
		 */
		render: function(params) {
			for ( var i = 0; i < this.regions.length; i++) {
				this.views[i].render(params)
			}
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

			var w = this.renderer.domElement.width
			var h = this.renderer.domElement.height

			// Perspective camera
			this.views.push(new module.View.Perspective({
				layout: this,
				onRender: function(params) {
					this.renderer.setViewport(0, 0, w / 2, h / 2)
				}
			}))

			// Orthographic XY
			this.views.push(new module.View.Orthographic({
				layout: this,
				onRender: function(params) {
					this.renderer.setViewport(w / 2, 0, w / 2, h / 2)
					this.camera.toTopView()
				}
			}))

			// Orthographic XZ
			this.views.push(new module.View.Orthographic({
				layout: this,
				onRender: function(params) {
					this.renderer.setViewport(0, h / 2, w / 2, h / 2)
					this.camera.toFrontView()
				}
			}))

			// Orthographic YZ
			this.views.push(new module.View.Orthographic({
				layout: this,
				onRender: function(params) {
					this.renderer.setViewport(w / 2, h / 2, w / 2, h / 2)
					this.camera.toLeftView()
				}
			}))
		}
	})

	window.Radiant.Layout = module

	return module
})