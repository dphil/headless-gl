var createContext = require('./../index.js')
var makeShader = require('./util/make-program')
var webglDebug = require('webgl-debug')

var width = 8
var height = 8


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

console.log("Main -1")

var original_gl = createContext(width, height)
gl = webglDebug.makeDebugContext(original_gl, undefined, logAndValidate);

//var data = new Uint8Array( 3 );
var data = new Uint8Array(3);
console.log(data)

console.log("Main 0")
var tex = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, tex)
//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
console.log("Main 1")
console.log(gl.getError())
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, data)
console.log(gl.getError())
console.log("Main 2")
