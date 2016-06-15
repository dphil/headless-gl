var createContext = require('./../index.js');

var width = 2;
var height = 2;

var gl = createContext(width, height);

var texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, texture);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

var framebuffer = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

gl.clear();

var err;

switch (gl.getError()) {

  case gl.INVALID_ENUM:
    err = "INVALID_ENUM"
    break;

  case gl.INVALID_VALUE:
    err = "INVALID_VALUE"
    break;

  case gl.INVALID_OPERATION:
    err = "INVALID_OPERATION"
    break;

  case gl.INVALID_FRAMEBUFFER_OPERATION:
    err = "INVALID_FRAMEBUFFER_OPERATION"
    break;

  case gl.OUT_OF_MEMORY:
    err = "OUT_OF_MEMORY"
    break;

  case gl.CONTEXT_LOST_WEBGL:
    err = "CONTEXT_LOST_WEBGL"
    break;

  case gl.NO_ERROR:
    err = "NO_ERROR"
}

console.log(err)
