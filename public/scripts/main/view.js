'use strict';

/**
 * They Layout module is responsible for rendering all Views (2D and 3D) of a
 * <code>Radiant.Map.Map</code>. A single WebGL canvas with multiple cameras
 * and viewports are used.
 * 
 * @author jdolan
 */
define('Radiant.View', [ 'Radiant.Material' ], function() {

	var module = {}

	/**
	 * Views are responsible for drawing a 2D or 3D area of the layout.
	 * 
	 * @constructor
	 * @param {Object} params The initialization parameters.
	 */
	module.View = function(params) {
		this.layout = params.layout
		this.renderer = params.renderer
		this.viewport = params.viewport
		this.scene = params.scene
		this.time = new Date().value

		this.initialize(params)
	}

	_.extend(module.View.prototype, {
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
		 * Updates this View. This is called once per frame. To be overridden.
		 * 
		 * @param {long} delta The delta (milliseconds) since the last frame.
		 */
		update: function(delta) {
			// to be overridden
		},

		/**
		 * Renders this view. The underlying implementation is given an
		 * opportunity to act on the frame via <code>update</code>.
		 */
		render: function(time) {

			this.update(time - this.time)
			this.time = time

			var v = this.viewport
			this.renderer.setViewport(v.x, v.y, v.z, v.w)

			this.renderer.render(this.scene, this.camera)
		},

		/**
		 * Binds the specified event on the target of this View's renderer.
		 * Mouse events are only handled if they fall within the viewport. Key
		 * events are only handled if they are received by the <tt>body</tt>
		 * element.
		 * 
		 * @param {String} event The event type.
		 * @param {Function} handler The event handler.
		 */
		on: function(event, handler) {

			if (/mouse.*/.test(event)) {
				var self = this
				$(self.renderer.domElement).on(event, function(e) {
					var x = e.offsetX, y = e.target.height - e.offsetY
					if (x > self.viewport.x && x < (self.viewport.x + self.viewport.z)) {
						if (y > self.viewport.y && y < (self.viewport.y + self.viewport.w)) {
							return handler(e)
						}
					}
				})
			} else if (/key.*/.test(event)) {
				$(document).on(event, function(e) {
					if (e.target.nodeName == 'BODY') {
						return handler(e)
					}
				})
			} else {
				return handler(e)
			}
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
			this.camera.position.copy(params.position)
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
		 * @param {Object} params The initialization parameters.
		 */
		initialize: function(params) {
			var aspect = this.viewport.z / this.viewport.w

			this.camera = new THREE.PerspectiveCamera(60.0, aspect, 0.1, 4096.0)
			this.camera.position.copy(params.position)
			this.camera.lookAt(new THREE.Vector3())

			this.scene.add(this.camera)

			this.translate = new THREE.Vector3()
			this.rotate = new THREE.Vector3()

			this.freelook = false

			var self = this

			this.on('keypress', function(e) {
				var k = String.fromCharCode(e.which)
				var prefs = self.layout.application.preferences

				if (self.freelook) {
					if (k == prefs.get('KeyForward')) {
						self.translate.z++
					} else if (k == prefs.get('KeyBack')) {
						self.translate.z--
					} else if (k == prefs.get('KeyMoveLeft')) {
						self.translate.x--
					} else if (k == prefs.get('KeyMoveRight')) {
						self.translate.x++
					}
				} else {
					if (k == prefs.get('KeyMoveUp')) {
						self.translate.y++
					} else if (k == prefs.get('KeyMoveDown')) {
						self.translate.y--
					} else if (k == prefs.get('KeyLookUp')) {
						self.rotate.x++
					} else if (k == prefs.get('KeyLookDown')) {
						self.rotate.x--
					} else if (k == prefs.get('KeyLookLeft')) {
						self.rotate.y++
					} else if (k == prefs.get('KeyLookRight')) {
						self.rotate.y--
					}
				}
			})

			this.on('mousedown', function(e) {
				if (e.which == 3) {
					self.freelook = !self.freelook
				} else if (e.which == 1 && e.shiftKey) {
					console.debug('select brush')
				} else if (e.which == 1 && e.ctrlKey) {
					console.debug('select face')
				}
			})
		},

		/**
		 * Updates this View. This is called once per frame.
		 * 
		 * @param {long} delta The delta (milliseconds) since the last frame.
		 */
		update: function(delta) {
			if (this.translate.x || this.translate.y || this.translate.z)
				console.log('translate ' + this.translate)
			if (this.rotate.x || this.rotate.y || this.rotate.z)
				console.log('rotate ' + this.rotate)
			this.translate = new THREE.Vector3()
			this.rotate = new THREE.Vector3()
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

		this.application = params.application

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

			this.trapEvents()
		} else {
			console.error('Failed to initialize WebGL context')
		}
	}

	_.extend(Layout.prototype, {
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
		 * Traps Radiant.Event and begins the rendering loop.
		 */
		trapEvents: function() {

			$(this.renderer.domElement).on('contextmenu', function(e) {
				e.preventDefault()
			})

			var app = $(this.application)

			app.on(Radiant.Event.Map.Load, this.onMapLoad.bind(this))
			app.on(Radiant.Event.Map.Unload, this.onMapUnload.bind(this))

			requestAnimationFrame(this.render.bind(this));
		},

		/**
		 * Renders all Views in this Layout. The Renderer is manually cleared
		 * just once before the Views are repainted.
		 */
		render: function(time) {

			this.renderer.clear()

			for ( var i = 0; i < this.views.length; i++) {

				if (this.views[i] instanceof module.View.Orthographic) {
					this.scene.overrideMaterial = Radiant.Material.Lines.wireframe
				} else {
					this.scene.overrideMaterial = undefined
				}

				this.views[i].render(time)
			}

			requestAnimationFrame(this.render.bind(this))
		},

		/**
		 * Radiant.Event.Map.Load listener.
		 */
		onMapLoad: function(event, map) {

			for ( var i = 0; i < map.entities.length; i++) {
				var entity = map.entities.at(i)

				for ( var j = 0; j < entity.brushes.length; j++) {
					var brush = entity.brushes.at(j)
					this.scene.add(brush.mesh)
				}
			}
		},

		/**
		 * Radiant.Event.Map.Unload listener.
		 */
		onMapUnload: function(event, map) {

			for ( var i = 0; i < map.entities.length; i++) {
				var entity = map.entities.at(i)

				for ( var j = 0; j < entity.brushes.length; j++) {
					var brush = entity.brushes.at(j)
					this.scene.remove(brush.mesh)
				}
			}
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
				position: new THREE.Vector3(256, 256, 256)
			})))

			// Orthographic XZ (top-down)
			this.views.push(new module.View.Orthographic(_.extend(params, {
				viewport: new THREE.Vector4(w, h, w, h),
				position: new THREE.Vector3(0, 256, 0)
			})))

			// Orthographic ZY (left)
			this.views.push(new module.View.Orthographic(_.extend(params, {
				viewport: new THREE.Vector4(0, 0, w, h),
				position: new THREE.Vector3(256, 0, 0)
			})))

			// Orthographic XY (back)
			this.views.push(new module.View.Orthographic(_.extend(params, {
				viewport: new THREE.Vector4(w, 0, w, h),
				position: new THREE.Vector3(0, 0, 256)
			})))

			// cube time
			var cube = new THREE.CubeGeometry(64, 128, 256)
			this.scene.add(new THREE.Mesh(cube, Radiant.Material.Common.caulk))
		}
	})

	window.Radiant.View = module

	return module
})