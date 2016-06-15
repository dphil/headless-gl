var createContext = require('./../index.js')
var THREE = require('./vendor/three.js')
var webglDebug = require('webgl-debug')
var png = require('pngjs').PNG;
var fs = require('fs');

var width = 500
var height = 500

var path = 'out.png';
img = new png({width: width, height: height});


// Init GL

function logGLCall(functionName, args) {
	console.log("gl." + functionName + "(" + webglDebug.glFunctionArgsToString(functionName, args) + ")");
}
function validateNoneOfTheArgsAreUndefined(functionName, args) {
	for (var ii = 0; ii < args.length; ++ii) {
		if (args[ii] === undefined) {
			console.error("undefined passed to gl." + functionName + "(" +
			WebGLDebugUtils.glFunctionArgsToString(functionName, args) + ")");
		}
	}
}
function logAndValidate(functionName, args) {
	logGLCall(functionName, args);
	validateNoneOfTheArgsAreUndefined (functionName, args);
}



var original_gl = createContext(width, height)
var debug_log_gl = webglDebug.makeDebugContext(original_gl, undefined, logAndValidate);
var debug_errors_gl = webglDebug.makeDebugContext(original_gl);
gl = debug_errors_gl


var camera, scene, renderer;

var composer, msaaRenderPass, saoPass, copyPass;

var group;
var params = {
  scale: 1.0,
  distance: 7.0,
  manualCompositing: false,
  renderToScreen: true,
  msaaEnabled: false,
  msaaLevel: 4,
  saoEnabled: true,
  saoIntensity: 0.75,
  saoSphereRadius: 0.5,
  saoBlur: true,
  saoOutput: 0
}
// Init gui

// gui.add( params, "scale", 0.01, 10 );
// gui.add( params, "distance", 1, 100 );
// gui.add( params, "manualCompositing" );
// gui.add( params, "renderToScreen" );
// gui.add( params, "msaaEnabled" );
// gui.add( params, "msaaLevel", 0, 4 );
// gui.add( params, "saoEnabled" );
// gui.add( params, "saoIntensity", 0, 1 );
// gui.add( params, "saoSphereRadius", 0.01, 5 );
// gui.add( params, "saoBlur" );
// gui.add( params, "saoOutput", {
// 	'Default': 0,
// 	'Depth': 1,
// 	'SAO': 2,
// 	'Normal': 3,
// 	'Depth1': 4,
// 	'Depth2': 5,
// 	'Depth3': 6,
// });

var supportsDepthTextureExtension = false;
var isWebGL2 = false;

init();
animate();
writeToFile();

function init() {

  var canvas = {addEventListener: function (){}} // use dummy event listener to squelch warning

  renderer = new THREE.WebGLRenderer({
    antialias: false,
    width: width,
    height: height,
    canvas: canvas,
    context: gl
  })

  renderer.setClearColor( 0xa0a0a0 );
  renderer.setPixelRatio( 1 );
  renderer.setSize( width, height, false );

  if( renderer.extensions.get( 'WEBGL_depth_texture' ) ) {
    supportsDepthTextureExtension = true;
  }

  camera = new THREE.PerspectiveCamera( 65, width / height, 1, 10 );
  camera.position.z = 7;

  scene = new THREE.Scene();

  group = new THREE.Object3D();
  scene.add( group );

  var light = new THREE.PointLight( 0xddffdd, 1.8 );
  light.position.z = 70;
  light.position.y = -70;
  light.position.x = -70;
  scene.add( light );

  var light2 = new THREE.PointLight( 0xffdddd, 1.8 );
  light2.position.z = 70;
  light2.position.x = -70;
  light2.position.y = 70;
  scene.add( light2 );

  var light3 = new THREE.PointLight( 0xddddff, 1.8 );
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

  var floorMaterial = new THREE.MeshStandardMaterial();
  material.roughness = 0.5 * Math.random() + 0.25;
  material.metalness = 0;

  var floorGeometry = new THREE.PlaneBufferGeometry( 12, 12 );
  var floorMesh = new THREE.Mesh( floorGeometry, floorMaterial );
  floorMesh.rotation.x -= Math.PI * 0.5;
  floorMesh.position.y -= 2;
  group.add( floorMesh );


  // postprocessing
  composer = new THREE.EffectComposer( renderer );

  renderPass = new THREE.RenderPass( scene, camera );
  composer.addPass( renderPass );

  msaaRenderPass = new THREE.ManualMSAARenderPass( scene, camera );
  composer.addPass( msaaRenderPass );

   saoPass = new THREE.SAOPass( scene, camera );
   composer.addPass( saoPass );

  copyPass = new THREE.ShaderPass( THREE.CopyShader );
  copyPass.renderToScreen = true;
  composer.addPass( copyPass );
}


function animate() {

//  var timer = performance.now();
  //	group.rotation.x = timer * 0.0002;
//  group.rotation.y = timer * 0.0001;
  camera.position.z = params.distance * params.scale;
  camera.near = Math.max( ( params.distance - 4 ) * params.scale, 1 );
  camera.far = ( params.distance + 4 ) * params.scale;
  console.log( 'near', camera.near, 'far', camera.far );
  camera.updateMatrixWorld( true );
  camera.updateProjectionMatrix();
  group.scale.set( params.scale, params.scale, params.scale );
  group.updateMatrixWorld( true );

  if( params.manualCompositing ) params.renderToScreen = false;

  msaaRenderPass.manualCompositing = params.manualCompositing;
  saoPass.manualCompositing = params.manualCompositing;
  //saoPass.manualCompositing = true; // image is blank

  renderPass.renderToScreen = params.renderToScreen;
  msaaRenderPass.renderToScreen = params.renderToScreen;

  saoPass.renderToScreen = params.renderToScreen;
  //saoPass.renderToScreen = false; // works
  copyPass.enabled = ! params.renderToScreen;

  renderPass.enabled = ! params.msaaEnabled;
  msaaRenderPass.enabled = params.msaaEnabled;

  msaaRenderPass.sampleLevel = Math.round( params.msaaLevel );

  saoPass.enabled = params.saoEnabled;
  //saoPass.enabled = false; // works
  saoPass.intensity = params.saoIntensity;
  saoPass.occlusionSphereWorldRadius = params.saoSphereRadius * params.scale;
  saoPass.blurEnabled = params.saoBlur;
//  saoPass.blurEnabled = false; // same bad normals

  switch( params.saoOutput ) {
    case '1': saoPass.outputOverride = "depth"; break;
    case '2': saoPass.outputOverride = "sao"; break;
    case '3': saoPass.outputOverride = "normal"; break;
    case '4': saoPass.outputOverride = "depth1"; break;
    case '5': saoPass.outputOverride = "depth2"; break;
    case '6': saoPass.outputOverride = "depth3"; break;
    default: saoPass.outputOverride = null; break;
  }

  saoPass.outputOverride = "normal"
//  saoPass.implicitNormals = false

  renderer.autoClear = true;
  renderer.setClearColor( 0xf0f0f0 );
  renderer.setClearAlpha( 0.0 );

  composer.render();
}

function writeToFileRGB() {
  return writeToFile( gl.RGB );
}
function writeToFileRGBA() {
  return writeToFile( gl.RGBA );
}

// function writeToFile( format) {
// 	// create a pixel buffer of the correct size
// 	pixels = new Uint8Array(4 * width * height);
//
// 	// read back in the pixel buffer
// 	gl.bindFramebuffer( gl.FRAMEBUFFER, null );
// 	gl.readPixels(0, 0, width, height, format, gl.UNSIGNED_BYTE, pixels);
// console.log(pixels)
// 	// lines are vertically flipped in the FBO / need to unflip them
// 	for (var j=0; j <= height; j++) {
// 		for (var i=0; i <= width; i++) {
// 			k = j * width + i;
// 			r = pixels[4*k];
// 			g = pixels[4*k + 1];
// 			b = pixels[4*k + 2];
//       if( format == gl.RGBA ) {
// 	     a = pixels[4*k + 3];
//      }
//      else {
//        a = 255;
//      }
//
// 			m = (height - j + 1) * width + i;
// 			img.data[4*m]     = r;
// 			img.data[4*m + 1] = g;
// 			img.data[4*m + 2] = b;
// 			img.data[4*m + 3] = a;
// 		}
// 	}
//
// 	// Now write the png to disk
// 	stream = fs.createWriteStream(path);
// 	img.pack().pipe(stream);
// }

function writeToFile() {
	// create a pixel buffer of the correct size
	pixels = new Uint8Array(4 * width * height);

	// read back in the pixel buffer
	gl.bindFramebuffer( gl.FRAMEBUFFER, null );


	gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  //console.log(pixels)

	// lines are vertically flipped in the FBO / need to unflip them
  for (var j=0; j <= height; j++) {
    for (var i=0; i <= width; i++) {
      k = j * width + i;
      r = pixels[4*k];
      g = pixels[4*k + 1];
      b = pixels[4*k + 2];
			a = pixels[4*k + 3];

      m = (height - j + 1) * width + i;
      img.data[4*m]     = r;
      img.data[4*m + 1] = g;
      img.data[4*m + 2] = b;
			img.data[4*m + 3] = a;
    }
}
	// Now write the png to disk
	stream = fs.createWriteStream(path);
	img.pack().pipe(stream);
}
