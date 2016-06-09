
		<script src="../build/three.js"></script>

		<script src="js/libs/dat.gui.min.js"></script>

		<script src="js/shaders/CopyShader.js"></script>

		<script src="js/postprocessing/EffectComposer.js"></script>
		<script src="js/postprocessing/ManualMSAARenderPass.js"></script>
		<script src="js/postprocessing/RenderPass.js"></script>
		<script src="js/postprocessing/MaskPass.js"></script>
		<script src="js/postprocessing/ShaderPass.js"></script>



			var scene, renderer;
			var cameraP, composerP, copyPassP, msaaRenderPassP;
			var cameraO, composerO, copyPassO, msaaRenderPassO;
			var gui, texture;

			var param = {
				sampleLevel: 4,
				unbiased: true,
				camera: 'perspective'
			};

			init();
			animate();

			clearGui();

			function clearGui() {

				if ( gui ) gui.destroy();

				gui = new dat.GUI();

				gui.add( param, "unbiased" );
				gui.add( param, 'sampleLevel', {
					'Level 0: 1 Sample': 0,
					'Level 1: 2 Samples': 1,
					'Level 2: 4 Samples': 2,
					'Level 3: 8 Samples': 3,
					'Level 4: 16 Samples': 4,
					'Level 5: 32 Samples': 5
				} );
				gui.add( param, 'camera', [ 'perspective', 'ortho' ] );

				gui.open();

			}

			function init() {

				container = document.getElementById( "container" );

				var width = window.innerWidth || 1;
				var height = window.innerHeight || 1;
				var aspect = width / height;
				var devicePixelRatio = window.devicePixelRatio || 1;

				renderer = new THREE.WebGLRenderer( { antialias: false } );
				renderer.setPixelRatio( devicePixelRatio );
				renderer.setSize( width, height );
				document.body.appendChild( renderer.domElement );

				//

				cameraP = new THREE.PerspectiveCamera( 65, aspect, 3, 10 );
				cameraP.position.z = 7;

				cameraO = new THREE.OrthographicCamera( width / - 2, width / 2, height / 2, height / - 2, 3, 10 );
				cameraO.position.z = 7;

				var fov = THREE.Math.degToRad( cameraP.fov );
				var hyperfocus = ( cameraP.near + cameraP.far ) / 2;
				var _height = 2 * Math.tan( fov / 2 ) * hyperfocus;
				cameraO.zoom = height / _height;


				scene = new THREE.Scene();

				group = new THREE.Object3D();
				scene.add( group );

				var light = new THREE.PointLight( 0xddffdd, 1.0 );
				light.position.z = 70;
				light.position.y = -70;
				light.position.x = -70;
				scene.add( light );

				var light2 = new THREE.PointLight( 0xffdddd, 1.0 );
				light2.position.z = 70;
				light2.position.x = -70;
				light2.position.y = 70;
				scene.add( light2 );

				var light3 = new THREE.PointLight( 0xddddff, 1.0 );
				light3.position.z = 70;
				light3.position.x = 70;
				light3.position.y = -70;
				scene.add( light3 );

				var light3 = new THREE.AmbientLight( 0xffffff, 0.05 );
				scene.add( light3 );

				var geometry = new THREE.SphereBufferGeometry( 3, 48, 24 );
				for ( var i = 0; i < 120; i ++ ) {

					var material = new THREE.MeshStandardMaterial();
					material.roughness = 0.5 * Math.random() + 0.25;
					material.metalness = 0;
					material.color.setHSL( Math.random(), 1.0, 0.3 );

					var mesh = new THREE.Mesh( geometry, material );
					mesh.position.x = Math.random() * 4 - 2;
					mesh.position.y = Math.random() * 4 - 2;
					mesh.position.z = Math.random() * 4 - 2;
					mesh.rotation.x = Math.random();
					mesh.rotation.y = Math.random();
					mesh.rotation.z = Math.random();

					mesh.scale.x = mesh.scale.y = mesh.scale.z = Math.random() * 0.2 + 0.05;
					group.add( mesh );
				}

				// postprocessing

				composerP = new THREE.EffectComposer( renderer );
				msaaRenderPassP = new THREE.ManualMSAARenderPass( scene, cameraP );
				composerP.addPass( msaaRenderPassP );
				copyPassP = new THREE.ShaderPass( THREE.CopyShader );
				copyPassP.renderToScreen = true;
				composerP.addPass( copyPassP );

				composerO = new THREE.EffectComposer( renderer );
				msaaRenderPassO = new THREE.ManualMSAARenderPass( scene, cameraO );
				composerO.addPass( msaaRenderPassO );
				copyPassO = new THREE.ShaderPass( THREE.CopyShader );
				copyPassO.renderToScreen = true;
				composerO.addPass( copyPassO );

				window.addEventListener( 'resize', onWindowResize, false );

			}

			function onWindowResize() {

				var width = window.innerWidth;
				var height = window.innerHeight;
				var aspect = width / height;

				cameraP.aspect = aspect;
				cameraO.updateProjectionMatrix();

				cameraO.left = - height * aspect;
				cameraO.right = height * aspect;
				cameraO.top = height;
				cameraO.bottom = - height;
				cameraO.updateProjectionMatrix();

				renderer.setSize( width, height );

				var pixelRatio = renderer.getPixelRatio();
				var newWidth  = Math.floor( width / pixelRatio ) || 1;
				var newHeight = Math.floor( height / pixelRatio ) || 1;
				composer.setSize( newWidth, newHeight );

			}

			function animate() {

				requestAnimationFrame( animate );

				for ( var i = 0; i < scene.children.length; i ++ ) {

					var child = scene.children[ i ];

					child.rotation.x += 0.005;
					child.rotation.y += 0.01;

				}

				msaaRenderPassP.sampleLevel = param.sampleLevel;
				msaaRenderPassP.unbiased = param.unbiased;

				msaaRenderPassO.sampleLevel = param.sampleLevel;
				msaaRenderPassO.unbiased = param.unbiased;

				if( param.camera === 'perspective' ){
					composerP.render();
				}else{
					composerO.render();
				}


			}
