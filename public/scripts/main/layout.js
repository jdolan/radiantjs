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
	module.Region = function(area) {
		this.area = area
	}

	_.extend(module.Region.prototype, new Object(), {
		render: function() {
			// to be overridden
		}
	})

	/**
	 * Orthographic (2D) regions.
	 */
	module.Region.Orthographic = function(area) {
		module.Region.call(this, area)
	}

	_.extend(module.Region.Orthographic.prototype, new module.Region(), {
		render: function() {
			console.debug('Orthographic render')
		}
	})

	/**
	 * Perspective (3D) regions.
	 */
	module.Region.Perspective = function(area) {
		module.Region.call(this, area)
	}

	_.extend(module.Region.Perspective.prototype, new module.Region(), {
		render: function() {
			console.debug('Perspective render')
		}
	})

	/**
	 * The base Layout class.
	 */
	var Base = function() {
		this.canvas = $('#layout > canvas')[0]

		this.renderer = new THREE.WebGLRenderer({
			canvas: this.canvas,
			antialias: true
		})
		
		if (this.renderer.getContext()) {
			this.regions = new Array()
			this.initialize()
		} else {
			console.error('Failed to initialize WebGL context')
		}
	}

	_.extend(Base.prototype, new Object(), {
		initialize: function() {
			// to be overridden
		},

		render: function() {
			for ( var i = 0; i < this.regions.length; i++) {
				this.regions[i].render()
			}
		}
	})

	/**
	 * The classic (4-quadrant) GtkRadiant layout.
	 */
	module.Classic = function() {
		Base.call(this)
	}

	_.extend(module.Classic.prototype, new Base(), {
		initialize: function() {

			var w = this.canvas.width / 2
			var h = this.canvas.height / 2

			// Camera
			this.regions.push(new module.Region.Perspective({
				area: new THREE.Box2(new THREE.Vector2(0, 0), new THREE.Vector2(w, h))
			}))

			// XY
			this.regions.push(new module.Region.Orthographic({
				area: new THREE.Box2(new THREE.Vector2(w, 0), new THREE.Vector2(w, h))
			}))

			// XZ
			this.regions.push(new module.Region.Orthographic({
				area: new THREE.Box2(new THREE.Vector2(0, h), new THREE.Vector2(w, h))
			}))

			// YZ
			this.regions.push(new module.Region.Orthographic({
				area: new THREE.Box2(new THREE.Vector2(w, h), new THREE.Vector2(w, h))
			}))
		}
	})

	window.Radiant.Layout = module

	return module
})