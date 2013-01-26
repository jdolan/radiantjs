'use strict';

/**
 * The View module provides Orthographic and Perspective projections into the
 * Scenes maintained by the Layout. Views also handle input events for
 * navigating the map, selecting and creating objects.
 * 
 * @author jdolan
 */
define('Radiant.View', [ 'Radiant.Ui', 'Radiant.Event' ], function() {

	var module = {}

	/**
	 * Axis render arrows indicating forward, right and up. Axis can be added as
	 * children to other Object3Ds, or independently (i.e. in a different Scene)
	 * with frequent calls to <code>update</code>.
	 * 
	 * @constructor
	 * @augments {THREE.Object3D}
	 * 
	 * @param {Object3D} object The Object3D to render Axis for.
	 * @param {Number} length The Axis arrow length.
	 */
	module.Axis = function(object, length) {

		THREE.Object3D.call(this)

		this.object = object
		this.length = length || 64

		this.add(new THREE.ArrowHelper(module.Axis.__forward, null, this.length, 0x00ff00))
		this.add(new THREE.ArrowHelper(module.Axis.__right, null, this.length, 0x0000ff))
		this.add(new THREE.ArrowHelper(module.Axis.__up, null, this.length, 0xff0000))
	}

	module.Axis.__forward = new THREE.Vector3(0, 0, -1)
	module.Axis.__right = new THREE.Vector3(1, 0, 0)
	module.Axis.__up = new THREE.Vector3(0, 1, 0)

	module.Axis.prototype = Object.create(THREE.Object3D.prototype)

	$.extend(module.Axis.prototype, {

		/**
		 * Updates the position and rotation of this Axis.
		 */
		update: function() {
			this.matrix.identity()

			var obj = this.object
			while (obj) {
				this.applyMatrix(obj.matrix)
				obj = obj.parent
			}
		}
	})

	/**
	 * Views are responsible for drawing a 2D or 3D area of the layout.
	 * 
	 * @constructor
	 * 
	 * @param {Object} params The initialization parameters.
	 */
	module.View = function(params) {

		this.application = params.application
		this.preferences = params.preferences
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
					if (e.target.nodeName === 'BODY') {
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
	module.Orthographic = function(params) {
		module.View.call(this, params)
	}

	$.extend(module.Orthographic.prototype, module.View.prototype, {
		constructor: module.Orthographic,

		/**
		 * Initializes this Orthographic View.
		 * 
		 * @param {Object} params The initialization parameters.
		 */
		initialize: function(params) {

			this.perspectiveView = params.perspectiveView
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

				if (k === self.preferences.keyZoomIn.value) {
					self.fov = self.fov << 1
				} else if (k === self.preferences.keyZoomOut.value) {
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

			if (this.perspectiveView) {
				if (this.preferences.followPerspectiveView.value) {
					var position = this.perspectiveView.boom.position
					this.camera.position.addVectors(position, this.offset)
				}
			}

			this.fov = THREE.Math.clamp(this.fov, 128, 8192)
			if (this.fov !== this.lastFov) {
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
	module.Perspective = function(params) {
		module.View.call(this, params)
	}

	$.extend(module.Perspective.prototype, module.View.prototype, {
		constructor: module.Perspective,

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
			this.boom.add(this.camera)

			this.renderScene = params.perspectiveScene
			this.renderScene.add(this.boom)

			// an ambient light
			this.ambientLight = new THREE.AmbientLight(0x808080)
			this.renderScene.add(this.ambientLight)

			// a point light at camera origin (DP r_fakelight)
			this.pointLight = new THREE.PointLight(0xc0c0c0)
			this.camera.add(this.pointLight)

			/*
			 * // a directional light in camera view direction (GtkRadiant)
			 * this.directionalLight = new THREE.DirectionalLight(0x808080)
			 * this.renderScene.add(this.directionalLight)
			 */

			this.axis = new module.Axis(this.camera)
			this.orthographicScene.add(this.axis)

			this.velocity = new THREE.Vector3()
			this.avelocity = new THREE.Vector3()

			this.freelook = false
			this.lastMousemove = new THREE.Vector2()

			var self = this

			this.on('keypress', function(e) {
				var k = String.fromCharCode(e.which)

				if (self.freelook) {
					if (k === self.preferences.keyForward.value) {
						self.velocity.z--
						self.velocity.y += self.camera.rotation.x
					} else if (k === self.preferences.keyBack.value) {
						self.velocity.z++
						self.velocity.y -= self.camera.rotation.x
					} else if (k === self.preferences.keyMoveLeft.value) {
						self.velocity.x--
					} else if (k === self.preferences.keyMoveRight.value) {
						self.velocity.x++
					}
				} else {
					if (k === self.preferences.keyForward.value) {
						self.velocity.z--
					} else if (k === self.preferences.keyBack.value) {
						self.velocity.z++
					} else if (k === self.preferences.keyMoveUp.value) {
						self.velocity.y++
					} else if (k === self.preferences.keyMoveDown.value) {
						self.velocity.y--
					} else if (k === self.preferences.keyLookUp.value) {
						self.avelocity.x++
					} else if (k === self.preferences.keyLookDown.value) {
						self.avelocity.x--
					} else if (k === self.preferences.keyLookLeft.value) {
						self.avelocity.y--
					} else if (k === self.preferences.keyLookRight.value) {
						self.avelocity.y++
					}
				}
			})

			this.on('mousemove', function(e) {
				if (self.freelook) {
					var s = self.preferences.freelookSensitivity.value
					var i = self.preferences.freelookInvert.value

					var yaw = (e.screenX - self.lastMousemove.x) * s
					self.avelocity.y += yaw

					var pitch = (e.screenY - self.lastMousemove.y) * (i ? -s : s)
					self.avelocity.x -= pitch

					self.lastMousemove.set(e.screenX, e.screenY)
				}
			})

			this.on('mousedown', function(e) {
				if (e.which === 3) {
					self.freelook = !self.freelook
					if (self.freelook) {
						self.lastMousemove.set(e.screenX, e.screenY)
					}
				} else if (e.which === 1 && e.shiftKey) {
					console.debug('select brush')
				} else if (e.which === 1 && e.ctrlKey) {
					console.debug('select face')
				}
			})

			$(this.layout.application).on(Radiant.Event.Map.Load, function(event, map) {

				// TODO move to center
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
				var s = this.preferences.cameraMovementSpeed.value
				this.boom.translate(s, this.velocity.clone())

				this.boom.position.clamp(-16384, 16384)
			}

			if (this.avelocity.length() < 0.15) {
				this.avelocity.clear()
			} else {
				this.avelocity.multiplyScalar(0.85)
			}

			if (this.avelocity.x || this.avelocity.y) {
				var s = this.preferences.cameraRotationSpeed.value
				var rotation = this.avelocity.clone().multiplyScalar(s * Math.PI / 180)

				this.boom.rotation.y += rotation.y
				this.camera.rotation.x += rotation.x

				var half = Math.PI / 2
				this.camera.rotation.x = THREE.Math.clamp(this.camera.rotation.x, -half, half)
			}

			this.axis.update()

			if (this.directionalLight)
				this.directionalLight.position = new THREE.Vector3(0, 0, 1).applyEuler(
						this.camera.rotation).applyEuler(this.boom.rotation)
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

	window.Radiant.View = module

	return module
})
