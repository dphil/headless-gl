'use strict'

var createContext = require('./../index.js')
var tape = require('tape')

tape('clear offscreen buffers', function (t) {

  var width = 2
  var height = 2

  var gl = createContext(width, height)

  t.test('clear buffer with attached RGB texture', function (t) {

    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, width, height, 0, gl.RGB, gl.UNSIGNED_BYTE, null);

    var framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)

    gl.clear()

    t.equals(gl.getError(), gl.NO_ERROR)

    t.end()
  })

  t.test('clear buffer with attached RGBA texture', function (t) {

    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    var framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)

    gl.clear()

    t.equals(gl.getError(), gl.NO_ERROR)

    t.end()
  })

  t.end()
})
