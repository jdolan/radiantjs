/**
 * 
 */
define('Radiant.Layout', [ 'Underscore', 'jQuery', 'Three' ], function() {

	var module = {}

	/**
	 * Regions are responsible for drawing a 2D or 3D area of the Layout.
	 * 
	 * @param {THREE.Box2}
	 */
	module.Region = function(params) {
		this.layout = params.layout
		this.area = params.area

		this.scene = new THREE.Scene()

		this.initialize(params)
	}

	_.extend(module.Region.prototype, new Object(), {
		initialize: function(params) {
			// to be overridden
		},

		render: function() {
			// to be overridden
		}
	})

	/**
	 * Orthographic (2D) regions.
	 */
	module.Region.Orthographic = function(params) {
		module.Region.call(this, params)
	}

	_.extend(module.Region.Orthographic.prototype, module.Region.prototype, {
		initialize: function(params) {
			// TODO this.scene.add
		},

		render: function() {
			console.debug('Orthographic render')
		}
	})

	/**
	 * Perspective (3D) regions.
	 */
	module.Region.Perspective = function(params) {
		module.Region.call(this, params)
	}

	_.extend(module.Region.Perspective.prototype, module.Region.prototype, {
		initialize: function(params) {

		},

		render: function() {
			console.debug('Perspective render')
		}
	})

	/**
	 * The base Layout class.
	 */
	var Base = function(params) {

		params.canvas = params.canvas || $('#layout > canvas')[0]
		this.renderer = new THREE.WebGLRenderer(params)

		if (this.renderer.getContext()) {
			this.regions = new Array()
			this.initialize(params)
		} else {
			console.error('Failed to initialize WebGL context')
		}
	}

	_.extend(Base.prototype, Object.prototype, {
		initialize: function(params) {
			// to be overridden
		},

		/**
		 * Render all Regions in the Layout.
		 */
		render: function(params) {
			for ( var i = 0; i < this.regions.length; i++) {
				this.regions[i].render(params)
			}
		}
	})

	/**
	 * The classic (4-quadrant) GtkRadiant layout.
	 */
	module.Classic = function(params) {
		Base.call(this, params)
	}

	_.extend(module.Classic.prototype, Base.prototype, {
		initialize: function(params) {

			var w = this.renderer.domElement.width
			var h = this.renderer.domElement.height

			var dw = w / 2
			var dh = h / 2

			// Camera
			this.regions.push(new module.Region.Perspective({
				layout: this,
				area: new THREE.Box2(new THREE.Vector2(0, 0), new THREE.Vector2(dw, dh))
			}))

			// XY
			this.regions.push(new module.Region.Orthographic({
				layout: this,
				area: new THREE.Box2(new THREE.Vector2(dw, 0), new THREE.Vector2(w, dh))
			}))

			// XZ
			this.regions.push(new module.Region.Orthographic({
				layout: this,
				area: new THREE.Box2(new THREE.Vector2(0, dh), new THREE.Vector2(dw, h))
			}))

			// YZ
			this.regions.push(new module.Region.Orthographic({
				layout: this,
				area: new THREE.Box2(new THREE.Vector2(dw, dh), new THREE.Vector2(w, h))
			}))
		}
	})

	window.Radiant.Layout = module

	return module
})