/**
 * 
 */
define('Radiant.Layout', [ 'Underscore', 'jQuery', 'Radiant.Draw', 'Radiant.GL' ], function() {

	var module = {}

	/**
	 * Regions are responsible for drawing a 2D or 3D area of the Layout.
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

		this.context = Radiant.GL.getContext(this.canvas)
		if (this.context) {
			this.regions = new Array()
			this.initialize()
		} else {
			console.error('Failed to initialize GL context')
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
			// Camera
			this.regions.push(new module.Region.Perspective({
				area: new Rectangle(new Vector2(0, 0), new Vector2(this.canvas.width / 2,
						this.canvas.height / 2))
			}))

			// XY
			this.regions.push(new module.Region.Orthographic({
				area: new Rectangle(new Vector2(this.canvas.width / 2, 0), new Vector2(
						this.canvas.width, this.canvas.height / 2))
			}))

			// XZ
			this.regions.push(new module.Region.Orthographic({
				area: new Rectangle(new Vector2(0, this.canvas.width / 2), new Vector2(
						this.canvas.width / 2, this.canvas.height))
			}))

			// YZ
			this.regions.push(new module.Region.Orthographic({
				area: new Rectangle(new Vector2(this.canvas.width / 2, this.canvas.width / 2),
						new Vector2(this.canvas.width, this.canvas.height))
			}))
		}
	})

	window.Radiant.Layout = module

	return module
})