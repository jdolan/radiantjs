'use strict'

/**
 * The Layout module is responsible for coordinating all 2D and 3D views. A
 * single WebGL canvas with multiple cameras and Views is used.
 */
define('Radiant.Layout', [ 'Radiant.Ui', 'Radiant.View' ], function() {

	var module = {}

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
				if (width !== self.width || height !== self.height) {

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
			
			this.application.update(time)

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
	 * The default GtkRadiant layout.
	 * 
	 * @constructor
	 * @augments Layout
	 * 
	 * @param {Object} params The initialization parameters.
	 */
	module.Default = function(params) {
		Layout.call(this, params)
	}

	$.extend(module.Default.prototype, Layout.prototype, {
		constructor: module.Default,
		/**
		 * Initializes the Classic Layout.
		 * 
		 * @param {Object} params The initialization parameters.
		 */
		initialize: function(params) {

			$('#layout').addClass('default')

			var w = this.width / 2
			var h = this.height / 2

			$.extend(params, {
				layout: this,
				renderer: this.renderer,
				perspectiveScene: this.perspectiveScene,
				orthographicScene: this.orthographicScene
			})

			// Perspective camera
			this.views.push(new window.Radiant.View.Perspective($.extend(params, {
				viewport: new THREE.Vector4(0, 0, w, this.height),
				position: new THREE.Vector3(0, 0, 0)
			})))

			$.extend(params, {
				perspectiveView: this.views[0]
			})

			// Orthographic XY (top-down)
			this.views.push(new window.Radiant.View.Orthographic($.extend(params, {
				viewport: new THREE.Vector4(w, h, w, h),
				position: new THREE.Vector3(0, 0, 1)
			})))

			// Orthographic XZ (back)
			this.views.push(new window.Radiant.View.Orthographic($.extend(params, {
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

			this.views[0].setViewport(new THREE.Vector4(0, 0, w, height))
			this.views[1].setViewport(new THREE.Vector4(w, h, w, h))
			this.views[2].setViewport(new THREE.Vector4(w, 0, w, h))
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
			this.views.push(new window.Radiant.View.Perspective($.extend(params, {
				viewport: new THREE.Vector4(0, h, w, h),
				position: new THREE.Vector3(0, 0, 0)
			})))

			$.extend(params, {
				perspectiveView: this.views[0]
			})

			// Orthographic XY (top-down)
			this.views.push(new window.Radiant.View.Orthographic($.extend(params, {
				viewport: new THREE.Vector4(w, h, w, h),
				position: new THREE.Vector3(0, 0, 1)
			})))

			// Orthographic YZ (left)
			this.views.push(new window.Radiant.View.Orthographic($.extend(params, {
				viewport: new THREE.Vector4(0, 0, w, h),
				position: new THREE.Vector3(1, 0, 0)
			})))

			// Orthographic XZ (back)
			this.views.push(new window.Radiant.View.Orthographic($.extend(params, {
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

	window.Radiant.Layout = module

	return module
})
