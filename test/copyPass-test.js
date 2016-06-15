var loud = console.log
var quiet = function (){}

// Import modules
var tape = require('tape')
var createContext = require('./../index.js')
var THREE = require('./vendor/three.js')
var webglDebug = require('webgl-debug')


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

var width = 4
var height = 4

var original_gl = createContext(width, height)
var debug_log_gl = webglDebug.makeDebugContext(original_gl, undefined, logAndValidate);
var debug_errors_gl = webglDebug.makeDebugContext(original_gl);
var gl = debug_errors_gl // specify which gl program will use



// Set up scene

var scene = new THREE.Scene()
var camera = new THREE.PerspectiveCamera(75, width / height, 1, 10000)
camera.position.z = 5

var geometry = new THREE.BoxGeometry(10, 10, 1)
var material = new THREE.MeshBasicMaterial({ color: 0x00ff00 })

var cube = new THREE.Mesh(geometry, material)
scene.add(cube)

console.log("\n\n\n\n\n\n\n\n\n\n ******************************* SETTING UP WEBGLRENDER ***********************************")
//console.log = quiet
// Set up Renderer

var canvas = {addEventListener: function (){}} // use dummy event listener to squelch warning

var renderer = new THREE.WebGLRenderer({
  antialias: true,
  width: 4,
  height: 4,
  canvas: canvas,
  context: gl
})

renderer.setSize( 4, 4, false);

renderer.setClearColor(0x000000)
renderer.clear()

console.log("\n\n\n\n\n\n\n\n\n\n ******************************* SETTING UP EFFECTCOMPOSER ***********************************")
// Set up effects

var target = new THREE.WebGLRenderTarget(
    width, height, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBFormat
})

var composer = new THREE.EffectComposer(renderer, target)
composer.setSize(width, height)

console.log("\n\n\n\n\n\n\n\n\n\n ******************************* SETTING UP RENDERPASS ***********************************")
var renderPass = new THREE.RenderPass(scene, camera)
renderPass.renderToScreen = false
composer.addPass(renderPass)

console.log("\n\n\n\n\n\n\n\n\n\n ******************************* SETTING UP COPYPASS ***********************************")
var copyPass = new THREE.ShaderPass(THREE.CopyShader)
copyPass.renderToScreen = true
composer.addPass(copyPass)


// Render Effects

console.log("\n\n\n\n\n\n\n\n\n\n ******************************* RENDERING COMPOSER ***********************************")
composer.render()


// Check output pixels

function checkPixels () {
  var pixels = new Uint8Array(4 * width * height)

  gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels)

  for (var i = 0; i < width * height * 4; i += 4) {
    var r = pixels[i]
    var g = pixels[i + 1]
    var b = pixels[i + 2]
    var a = pixels[i + 3]
    //      t.equals(r, 255, 'red')
    //      t.equals(g, 255, 'green')
    //      t.equals(b, 255, 'blue')
    //      t.equals(a, 255, 'alpha')
    console.log(r, g, b, a)
  }
}

checkPixels()
