var createContext = require('./../index.js')
var png = require('pngjs').PNG;
var fs = require('fs');
var makeShader = require('./util/make-program')
var drawTriangle = require('./util/draw-triangle')
var webglDebug = require('webgl-debug')

var width = 3
var height = 3
var path = 'out.png';
img = new png({width: width, height: height});

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
gl = webglDebug.makeDebugContext(original_gl);

var vertex_src = [
  'attribute vec4 a_position;',
  'varying vec2 v_texcoord;',
  'void main() {',
  'gl_Position = a_position;',
  'v_texcoord = a_position.xy * 0.5 + 0.5;',
  '}'
].join('\n')
//
var fragment_src = [
  'precision mediump float;',
  'varying vec2 v_texcoord;',
  'uniform sampler2D u_sampler;',
  'void main() {',
//  'gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);',
  'gl_FragColor = texture2D(u_sampler, v_texcoord);',
  '}'
].join('\n')


var verts = [
      0.5,  0.5,
     -0.5,  0.5,
     -0.5, -0.5,
      0.5,  0.5,
     -0.5, -0.5,
      0.5, -0.5,
];

var vertBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(0);

//console.log(gl.getError())
var program = makeShader(gl, vertex_src, fragment_src)
console.log(gl.getError())
gl.useProgram(program);
console.log(gl.getError())

var uSampler_Uniform = gl.getUniformLocation(program, "u_sampler");

// create an empty texture
var tex = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, tex);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
gl.bindTexture(gl.TEXTURE_2D, null);

// Create a framebuffer and attach the texture.
var fb = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);

// Render to the texture (using clear because it's simple)
gl.clearColor(0, 1, 0, 1); // green;
gl.clear(gl.COLOR_BUFFER_BIT);
//
gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, tex);
gl.uniform1i(uSampler_Uniform, 0);

// Now draw with the texture to the canvas
// NOTE: We clear the canvas to red so we'll know
// we're drawing the texture and not seeing the clear
// from above.
gl.bindFramebuffer(gl.FRAMEBUFFER, null);
gl.clearColor(1, 0, 0, 1); // red
gl.clear(gl.COLOR_BUFFER_BIT);
gl.drawArrays(gl.TRIANGLES, 0, 6);



// create a pixel buffer of the correct size
pixels = new Uint8Array(4 * width * height);

// read back in the pixel buffer
gl.bindFramebuffer( gl.FRAMEBUFFER, null );


gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

// # lines are vertically flipped in the FBO / need to unflip them
// for (var j=0; j <= height; j++) {
//   for (var i=0; i <= width; i++) {
//     k = j * width + i;
//     r = pixels[4*k];
//     g = pixels[4*k + 1];
//     b = pixels[4*k + 2];
//     a = pixels[4*k + 3];
//
//     m = (height - j + 1) * width + i;
//     img.data[4*m]     = r;
//     img.data[4*m + 1] = g;
//     img.data[4*m + 2] = b;
//     img.data[4*m + 3] = a;
//   }
// }

for (var i = 0; i < width * height * 4; i += 4) {
  var r = pixels[i];
  var g = pixels[i+1];
  var b = pixels[i+2];
  var a = pixels[i+3];
  console.log(r,g,b,a)
  // t.ok(Math.abs(pixels[i] - test.expectedColor[0] * 255) < 3, 'red')
  // t.ok(Math.abs(pixels[i] - test.expectedColor[0] * 255) < 3, 'green')
  // t.ok(Math.abs(pixels[i] - test.expectedColor[0] * 255) < 3, 'blue')
  // t.ok(Math.abs(pixels[i] - test.expectedColor[0] * 255) < 3, 'alpha')
}

// # Now write the png to disk
 // stream = fs.createWriteStream(path);
 // img.pack().pipe(stream);
