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
	 * Axis render arrows indicating forward, right and up.
	 * 
	 * @constructor
	 * @augments {THREE.Object3D}
	 * 
	 * @param {Number} len The Axis arrow length.
	 */
	module.Axis = function(length) {

		THREE.Object3D.call(this)

		this.length = length || 64

		var pos = this.position, len = this.length
		this.add(new THREE.ArrowHelper(module.Axis.__forward, pos, len, 0x00ff00))
		this.add(new THREE.ArrowHelper(module.Axis.__right, pos, len, 0x0000ff))
		this.add(new THREE.ArrowHelper(module.Axis.__up, pos, len, 0xff0000))
	}

	module.Axis.__forward = new THREE.Vector3(0, 0, -1)
	module.Axis.__right = new THREE.Vector3(1, 0, 0)
	module.Axis.__up = new THREE.Vector3(0, 1, 0)

	$.extend(module.Axis.prototype, THREE.Object3D.prototype)

	/**
	 * Views are responsible for drawing a 2D or 3D area of the layout.
	 * 
	 * @constructor
	 * 
	 * @param {Object} params The initialization parameters.
	 */
	module.View = function(params) {

		this.layout = params.layout
		this.renderer = params.renderer
		this.viewport = params.viewport
		this.aspect = this.viewport.z / this.viewport.w
		this.perspectiveScene = params.perspectiveScene
		this.orthographicScene = params.orthographicScene
		this.renderScene = null
		this.time = 0

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
		 * @param {Number} time The current time.
		 */
		update: function(time) {
			// to be overridden
		},

		/**
		 * Renders this view. The underlying implementation is given an
		 * opportunity to act on the frame via <code>update</code>.
		 * 
		 * @param {Number} time The current time in milliseconds.
		 */
		render: function(time) {

			this.update(time)

			var v = this.viewport
			this.renderer.setViewport(v.x, v.y, v.z, v.w)

			this.renderer.render(this.renderScene, this.camera)
		},

		/**
		 * Sets the viewport for this View. To be overridden.
		 * 
		 * @param {THREE.Vector4} viewport The viewport.
		 */
		setViewport: function(viewport) {

			this.viewport = viewport
			this.aspect = viewport.z / viewport.w

			// to be overridden
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
					var x = e.screenX, y = e.target.height - e.screenY
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

			this.fov = params.orthographicFov || 1024
			this.lastFov = this.fov

			var w = this.fov
			var h = w / this.aspect

			this.camera = new THREE.OrthographicCamera(-w, w, h, -h, -16384, 16384)
			this.camera.position.copy(params.position)
			this.camera.up.set(0, 0, 1)
			this.camera.lookAt(new THREE.Vector3(0, 0, 0))

			this.renderScene = params.orthographicScene
			this.renderScene.add(this.camera)

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
		 * @param {Number} time The current time.
		 */
		update: function(time) {

			if (this.target) {
				if (this.layout.application.preferences.get('FollowPerspective')) {
					this.camera.position.addVectors(this.target.position, this.offset)
				}
			}

			this.fov = THREE.Math.clamp(this.fov, 128, 8192)
			if (this.fov != this.lastFov) {
				this.setViewport(this.viewport)
				this.lastFov = this.fov
			}
		},

		/**
		 * Sets the viewport for this View.
		 * 
		 * @param {THREE.Vector4} viewport The viewport.
		 */
		setViewport: function(viewport) {
			module.View.prototype.setViewport.call(this, viewport)

			var w = this.fov
			var h = w / this.aspect

			this.camera.left = -w
			this.camera.right = w
			this.camera.top = h
			this.camera.bottom = -h

			this.camera.updateProjectionMatrix()
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

			this.fov = params.perspectiveFov || 60

			params.position = params.position || new THREE.Vector3()

			this.boom = new THREE.Object3D()
			this.boom.position.copy(params.position)
			this.boom.up.set(0, 0, 1)
			this.boom.lookAt(new THREE.Vector3(0, 1, 0).add(params.position))

			this.camera = new THREE.PerspectiveCamera(this.fov, this.aspect, 0.1, 4096)
			this.camera.add(new module.Axis())

			this.boom.add(this.camera)

			this.renderScene = params.perspectiveScene
			this.renderScene.add(this.boom)

			this.velocity = new THREE.Vector3()
			this.avelocity = new THREE.Vector3()

			this.freelook = false
			this.lastMousemove = new THREE.Vector2()

			var self = this

			this.on('keypress', function(e) {
				var k = String.fromCharCode(e.which)
				var prefs = self.layout.application.preferences

				if (self.freelook) {
					if (k == prefs.get('KeyForward')) {
						self.velocity.z--
						self.velocity.y += self.camera.rotation.x
					} else if (k == prefs.get('KeyBack')) {
						self.velocity.z++
						self.velocity.y -= self.camera.rotation.x
					} else if (k == prefs.get('KeyMoveLeft')) {
						self.velocity.x--
					} else if (k == prefs.get('KeyMoveRight')) {
						self.velocity.x++
					}
				} else {
					if (k == prefs.get('KeyForward')) {
						self.velocity.z--
					} else if (k == prefs.get('KeyBack')) {
						self.velocity.z++
					} else if (k == prefs.get('KeyMoveUp')) {
						self.velocity.y++
					} else if (k == prefs.get('KeyMoveDown')) {
						self.velocity.y--
					} else if (k == prefs.get('KeyLookUp')) {
						self.avelocity.x++
					} else if (k == prefs.get('KeyLookDown')) {
						self.avelocity.x--
					} else if (k == prefs.get('KeyLookLeft')) {
						self.avelocity.y--
					} else if (k == prefs.get('KeyLookRight')) {
						self.avelocity.y++
					}
				}
			})

			this.on('mousemove', function(e) {
				if (self.freelook) {
					var s = self.layout.application.preferences.get('FreelookSensitivity')
					var i = self.layout.application.preferences.get('FreelookInvert')

					var yaw = (e.screenX - self.lastMousemove.x) * s
					self.avelocity.y += yaw

					var pitch = (e.screenY - self.lastMousemove.y) * (i ? -s : s)
					self.avelocity.x -= pitch

					self.lastMousemove.set(e.screenX, e.screenY)
				}
			})

			this.on('mousedown', function(e) {
				if (e.which == 3) {
					self.freelook = !self.freelook
					if (self.freelook) {
						self.lastMousemove.set(e.screenX, e.screenY)
					}
				} else if (e.which == 1 && e.shiftKey) {
					console.debug('select brush')
				} else if (e.which == 1 && e.ctrlKey) {
					console.debug('select face')
				}
			})

			$(this.layout.application).on(Radiant.Event.Map.Load, function(event, map) {

				self.boom.position.clear()
				self.boom.lookAt(new THREE.Vector3(0, 1, 0))

				self.camera.rotation.clear()
			})
		},

		/**
		 * Updates this View. This is called once per frame.
		 * 
		 * @param {Number} time The current time.
		 */
		update: function(time) {

			if (this.velocity.length() < 0.15) {
				this.velocity.clear()
			} else {
				this.velocity.multiplyScalar(0.85)
			}

			if (this.velocity.x || this.velocity.y || this.velocity.z) {
				var s = this.layout.application.preferences.get('CameraMovementSpeed')
				this.boom.translate(s, this.velocity.clone())

				this.boom.position.clamp(-16384, 16384)
			}

			if (this.avelocity.length() < 0.15) {
				this.avelocity.clear()
			} else {
				this.avelocity.multiplyScalar(0.85)
			}

			if (this.avelocity.x || this.avelocity.y) {
				var s = this.layout.application.preferences.get('CameraRotationSpeed')
				var rotation = this.avelocity.clone().multiplyScalar(s * Math.PI / 180)

				this.boom.rotation.y += rotation.y
				this.camera.rotation.x += rotation.x

				var half = Math.PI / 2
				this.camera.rotation.x = THREE.Math.clamp(this.camera.rotation.x, -half, half)
			}
		},

		/**
		 * Sets the viewport for this View.
		 * 
		 * @param {THREE.Vector4} viewport The viewport.
		 */
		setViewport: function(viewport) {
			module.View.prototype.setViewport.call(this, viewport)

			this.camera.aspect = this.aspect
			this.camera.updateProjectionMatrix()
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

		this.width = $(window).width()
		this.height = $(window).height()

		this.views = new Array()

		params.canvas = params.canvas || $('#layout > canvas')[0]

		this.renderer = new THREE.WebGLRenderer(params)
		if (this.renderer.getContext()) {

			this.renderer.autoClear = false
			this.renderer.setSize(this.width, this.height)

			this.perspectiveScene = new THREE.Scene()
			this.orthographicScene = new THREE.Scene()

			this.initialize(params)

			this.statistics = new Radiant.Ui.Statistics(params)

			this.bindEvents()
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
		 * Binds to window events, Radiant.Event and enters the rendering loop.
		 */
		bindEvents: function() {

			$(window).on('contextmenu', function(e) {
				e.preventDefault()
			})

			var self = this
			$(window).resize(function(e) {
				var width = $(window).width(), height = $(window).height()
				if (width != self.width || height != self.height) {

					self.renderer.setSize(width, height)
					self.onResize(width, height)

					self.width = width
					self.height = height
				}
			})

			var app = $(this.application)

			app.on(Radiant.Event.Map.Load, this.onMapLoad.bind(this))
			app.on(Radiant.Event.Map.Unload, this.onMapUnload.bind(this))

			requestAnimationFrame(this.render.bind(this));
		},

		/**
		 * Renders all Views in this Layout.
		 * 
		 * @param {Number} time The current time in milliseconds.
		 */
		render: function(time) {

			this.renderer.clear()

			for ( var i = 0; i < this.views.length; i++) {
				this.views[i].render(time)
			}

			this.statistics.frames++

			requestAnimationFrame(this.render.bind(this))
		},

		/**
		 * Resizes the layout on window resize events. To be overridden.
		 * 
		 * @param {Number} width The Layout width.
		 * @param {Number} height The Layout height.
		 */
		onResize: function(width, height) {
			// to be overridden
		},

		/**
		 * Radiant.Event.Map.Load listener.
		 */
		onMapLoad: function(event, map) {

			for ( var i = 0; i < map.entities.length; i++) {
				var entity = map.entities[i]

				this.perspectiveScene.add(entity.mesh)
				this.orthographicScene.add(entity.line)
			}
		},

		/**
		 * Radiant.Event.Map.Unload listener.
		 */
		onMapUnload: function(event, map) {

			for ( var i = 0; i < map.entities.length; i++) {
				var entity = map.entities[i]

				this.perspectiveScene.remove(entity.mesh)
				this.orthographicScene.remove(entity.line)
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

			$('#layout').addClass('classic')

			var w = this.width / 2
			var h = this.height / 2

			$.extend(params, {
				layout: this,
				renderer: this.renderer,
				perspectiveScene: this.perspectiveScene,
				orthographicScene: this.orthographicScene
			})

			// Perspective camera
			this.views.push(new module.View.Perspective($.extend(params, {
				viewport: new THREE.Vector4(0, h, w, h),
				position: new THREE.Vector3(0, 0, 0)
			})))

			$.extend(params, {
				target: this.views[0].boom
			})

			// Orthographic XY (top-down)
			this.views.push(new module.View.Orthographic($.extend(params, {
				viewport: new THREE.Vector4(w, h, w, h),
				position: new THREE.Vector3(0, 0, 1)
			})))

			// Orthographic YZ (left)
			this.views.push(new module.View.Orthographic($.extend(params, {
				viewport: new THREE.Vector4(0, 0, w, h),
				position: new THREE.Vector3(1, 0, 0)
			})))

			// Orthographic XZ (back)
			this.views.push(new module.View.Orthographic($.extend(params, {
				viewport: new THREE.Vector4(w, 0, w, h),
				position: new THREE.Vector3(0, -1, 0)
			})))
		},

		/**
		 * Resizes all Views based on the window size.
		 * 
		 * @param {Number} width The new Layout width.
		 * @param {Number} height The new Layout height.
		 */
		onResize: function(width, height) {

			var w = width / 2, h = height / 2

			this.views[0].setViewport(new THREE.Vector4(0, h, w, h))
			this.views[1].setViewport(new THREE.Vector4(w, h, w, h))
			this.views[2].setViewport(new THREE.Vector4(0, 0, w, h))
			this.views[3].setViewport(new THREE.Vector4(w, 0, w, h))
		}
	})

	window.Radiant.View = module

	return module
})