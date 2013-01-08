/**
 * 
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
		 * 
		 */
		render: function() {
			
			this.update()
			
			this.renderer.setViewport(this.viewport.x, this.viewport.y, this.viewport.z, this.viewport.w)
			
			this.renderer.render(this.scene, this.camera)
		},
	})

	/**
	 * Orthographic (2D) regions.
	 */
	module.View.Orthographic = function(params) {
		module.View.call(this, params)
	}

	_.extend(module.View.Orthographic.prototype, module.View.prototype, {
		/**
		 * 
		 */
		initialize: function(params) {
			var w = this.viewport.z / 2
			var h = this.viewport.w / 2
			
			this.camera = new THREE.OrthographicCamera(-w, w, h, -h, 0.1, 16384.0)
			this.camera.position.copy(params.origin)
			this.camera.lookAt(new THREE.Vector3())
			
			this.scene = new THREE.Scene()
			this.scene.add(this.camera)
			
			// ----------
			var geometry = new THREE.CubeGeometry(256, 128, 64);
			var material = new THREE.MeshBasicMaterial({
				color: 0x00ff00
			});
			var cube = new THREE.Mesh(geometry, material);
			this.scene.add(cube);
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
		 * 
		 */
		initialize: function(params) {
			var aspect = this.viewport.x / this.viewport.y
			
			this.camera = new THREE.PerspectiveCamera(60.0, aspect, 0.1, 4096.0)
			this.camera.position.copy(params.origin)
			this.camera.lookAt(new THREE.Vector3())
			
			this.scene = new THREE.Scene()
			this.scene.add(this.camera)
			
			// ----------
			var geometry = new THREE.CubeGeometry(256, 128, 64);
			var material = new THREE.MeshBasicMaterial({
				color: 0x00ff00
			});
			var cube = new THREE.Mesh(geometry, material);
			this.scene.add(cube);
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
			this.renderer.setSize(this.width, this.height)
			this.initialize(params)

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

			// Perspective camera
			this.views.push(new module.View.Perspective({
				layout: this,
				renderer: this.renderer,
				viewport: new THREE.Vector4(0, 0, w, h),
				origin: new THREE.Vector3()
			}))

			// Orthographic XZ (top-down)
			this.views.push(new module.View.Orthographic({
				layout: this,
				renderer: this.renderer,
				viewport: new THREE.Vector4(w, 0, w, h),
				origin: new THREE.Vector3(0, 1024, 0)
			}))
			
			// Orthographic XY (left)
			this.views.push(new module.View.Orthographic({
				layout: this,
				renderer: this.renderer,
				viewport: new THREE.Vector4(0, h, w, h),
				origin: new THREE.Vector3(1024, 0, 0)
			}))

			// Orthographic YZ (back)
			this.views.push(new module.View.Orthographic({
				layout: this,
				renderer: this.renderer,
				viewport: new THREE.Vector4(w, h, w, h),
				origin: new THREE.Vector3(0, 0, 1024)
			}))
		}
	})

	window.Radiant.Layout = module

	return module
})