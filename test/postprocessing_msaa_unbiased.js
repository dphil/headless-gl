var createContext = require('./../index.js')
var THREE = require('./vendor/three.js')
var webglDebug = require('webgl-debug')
var png = require('pngjs').PNG;
var fs = require('fs');

var width = 1000
var height = 1000

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
gl = original_gl


var scene, renderer;
var cameraP, composerP, copyPassP, msaaRenderPassP;
var cameraO, composerO, copyPassO, msaaRenderPassO;
var texture;

var param = {
	sampleLevel: 4,
	unbiased: true,
	camera: 'perspective'
};

init();
console.log(gl.getError())
animate();
console.log(gl.getError())
writeToFile();
console.log(gl.getError())


function init() {

	var aspect = width / height;

	var canvas = {addEventListener: function (){}} // use dummy event listener to squelch warning

	var renderer = new THREE.WebGLRenderer({
		antialias: false,
		width: width,
		height: height,
		canvas: canvas,
		context: gl
	})

	renderer.setSize( width, height, false );

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
}


function animate() {

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

function writeToFile() {
	// create a pixel buffer of the correct size
	pixels = new Uint8Array(4 * width * height);

	// read back in the pixel buffer
	gl.bindFramebuffer( gl.FRAMEBUFFER, null );


	gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

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
