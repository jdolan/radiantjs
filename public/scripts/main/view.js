'use strict';

/**
 * The Layout module is responsible for rendering all 2D and 3D views. A single
 * WebGL canvas with multiple cameras and viewports is used.
 * 
 * @author jdolan
 */
define('Radiant.View', [ 'Radiant.Material', 'Radiant.Ui' ], function() {

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
		this.aspect = this.viewport.z / this.viewport.w

		this.initialize(params)
	}

	$.extend(module.View.prototype, {
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
		 * @param {Number} delta The length of the frame (milliseconds / 16).
		 */
		update: function(delta) {
			// to be overridden
		},

		/**
		 * Renders this view. The underlying implementation is given an
		 * opportunity to act on the frame via <code>update</code>.
		 * 
		 * @param {Number} time The current time in milliseconds.
		 */
		render: function(time) {

			this.update((time - this.time) / 16)
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
		 * @param {String} event The event name.
		 * @param {function(jQuery.Event)} handler The event handler.
		 */
		on: function(event, handler) {

			if (/mouse(up|down)/.test(event)) {
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
				$(document).on(event, function(e) {
					return handler(e)
				})
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

	$.extend(module.View.Orthographic.prototype, module.View.prototype, {
		constructor: module.View.Orthographic,

		/**
		 * Initializes this Orthographic View.
		 * 
		 * @param {Object} params The initialization parameters.
		 */
		initialize: function(params) {
			this.target = params.target
			this.offset = params.position

			this.fov = params.fov || 1024
			this.lastFov = this.fov

			var w = this.fov
			var h = w / this.aspect

			this.camera = new THREE.OrthographicCamera(-w, w, h, -h, -16384, 16384)
			this.camera.position.copy(params.position)
			this.camera.lookAt(new THREE.Vector3())

			this.scene.add(this.camera)

			var self = this

			this.on('keypress', function(e) {
				var k = String.fromCharCode(e.which)
				var prefs = self.layout.application.preferences

				if (k == prefs.get('KeyZoomIn')) {
					self.fov = self.fov << 1
				} else if (k == prefs.get('KeyZoomOut')) {
					self.fov = self.fov >> 1
				}
			})
		},

		/**
		 * Updates this View. This is called once per frame.
		 * 
		 * @param {Number} delta The length of the frame (milliseconds / 16).
		 */
		update: function(delta) {

			if (this.target) {
				if (this.layout.application.preferences.get('FollowPerspective')) {
					this.camera.position.add(this.target.position, this.offset)
				}
			}

			this.fov = Math.clamp(this.fov, 128, 8192)
			if (this.fov != this.lastFov) {

				var w = this.fov
				var h = w / this.aspect

				this.camera.left = -w
				this.camera.right = w
				this.camera.top = h
				this.camera.bottom = -h

				this.camera.updateProjectionMatrix()

				this.lastFov = this.fov
			}
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

	$.extend(module.View.Perspective.prototype, module.View.prototype, {
		constructor: module.View.Perspective,

		/**
		 * Initializes this Perspective View.
		 * 
		 * @param {Object} params The initialization parameters.
		 */
		initialize: function(params) {

			this.fov = params.fov || 50

			this.camera = new THREE.PerspectiveCamera(this.fov, this.aspect, 0.1, 4096.0)
			this.camera.position.copy(params.position)
			this.camera.lookAt(new THREE.Vector3())

			this.scene.add(this.camera)

			this.velocity = new THREE.Vector3()
			this.rotation = new THREE.Vector3()

			this.freelook = false
			this.lastMousemove = new THREE.Vector2()

			var self = this

			this.on('keypress', function(e) {
				var k = String.fromCharCode(e.which)
				var prefs = self.layout.application.preferences

				if (k == prefs.get('KeyForward')) {
					self.velocity.z--
				} else if (k == prefs.get('KeyBack')) {
					self.velocity.z++
				}

				if (self.freelook) {
					if (k == prefs.get('KeyMoveLeft')) {
						self.velocity.x--
					} else if (k == prefs.get('KeyMoveRight')) {
						self.velocity.x++
					}
				} else {
					if (k == prefs.get('KeyMoveUp')) {
						self.velocity.y++
					} else if (k == prefs.get('KeyMoveDown')) {
						self.velocity.y--
					} else if (k == prefs.get('KeyLookUp')) {
						self.rotation.x++
					} else if (k == prefs.get('KeyLookDown')) {
						self.rotation.x--
					} else if (k == prefs.get('KeyLookLeft')) {
						self.rotation.y++
					} else if (k == prefs.get('KeyLookRight')) {
						self.rotation.y--
					}
				}
			})

			this.on('mousemove', function(e) {
				if (self.freelook) {
					var s = self.layout.application.preferences.get('FreelookSensitivity')

					self.rotation.y -= (e.screenX - self.lastMousemove.x) * s

					if (self.layout.application.preferences.get('FreelookInvert')) {
						self.rotation.x += (e.screenY - self.lastMousemove.y) * s
					} else {
						self.rotation.x -= (e.screenY - self.lastMousemove.y) * s
					}

					self.lastMousemove.x = e.screenX
					self.lastMousemove.y = e.screenY
				}
			})

			this.on('mousedown', function(e) {
				if (e.which == 3) {
					self.freelook = !self.freelook
					if (self.freelook) {
						self.lastMousemove.x = e.screenX
						self.lastMousemove.y = e.screenY
					}
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
		 * @param {Number} delta The length of the frame (milliseconds / 16).
		 */
		update: function(delta) {

			if (this.velocity.length() < 0.15) {
				this.velocity.clear()
			} else {
				this.velocity.multiplyScalar(0.85 * delta)
			}

			if (this.velocity.x || this.velocity.y || this.velocity.z) {
				this.camera.position = this.camera.localToWorld(this.velocity.clone())
			}

			if (this.rotation.length() < 0.15) {
				this.rotation.clear()
			} else {
				this.rotation.multiplyScalar(0.85 * delta)
			}

			if (this.rotation.x || this.rotation.y || this.rotation.z) {
				var rotation = this.rotation.clone().multiplyScalar(Math.PI / 180)
				this.camera.rotation.addSelf(rotation)
			}
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

	$.extend(Layout.prototype, {
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
		 * Traps Radiant.Event and enters the rendering loop.
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
		 * once before the Views are repainted.
		 * 
		 * @param {Number} time The current time in milliseconds.
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

	$.extend(module.Classic.prototype, Layout.prototype, {
		constructor: module.Classic,

		/**
		 * Initializes the Classic Layout.
		 * 
		 * @param {Object} params The initialization parameters.
		 */
		initialize: function(params) {

			var w = this.width / 2
			var h = this.height / 2

			$.extend(params, {
				layout: this,
				renderer: this.renderer,
				scene: this.scene
			})

			// Perspective camera
			this.views.push(new module.View.Perspective($.extend(params, {
				viewport: new THREE.Vector4(0, h, w, h),
				position: new THREE.Vector3(256, 256, 256)
			})))

			$.extend(params, {
				target: this.views[0].camera
			})

			// Orthographic XZ (top-down)
			this.views.push(new module.View.Orthographic($.extend(params, {
				viewport: new THREE.Vector4(w, h, w, h),
				position: new THREE.Vector3(0, -1, 0)
			})))

			// Orthographic ZY (left)
			this.views.push(new module.View.Orthographic($.extend(params, {
				viewport: new THREE.Vector4(0, 0, w, h),
				position: new THREE.Vector3(-1, 0, 0)
			})))

			// Orthographic XY (back)
			this.views.push(new module.View.Orthographic($.extend(params, {
				viewport: new THREE.Vector4(w, 0, w, h),
				position: new THREE.Vector3(0, 0, -1)
			})))
		}
	})

	window.Radiant.View = module

	return module
})