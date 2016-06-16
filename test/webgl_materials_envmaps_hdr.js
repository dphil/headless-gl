var createContext = require('./../index.js')
var THREE = require('./vendor/three.js')
var webglDebug = require('webgl-debug')
var png = require('pngjs').PNG;
var fs = require('fs');
var superagent = require('superagent');
var Canvas = require('canvas');
const { Image } = Canvas;

var width = 1
var height = 1

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




var params = {
  envMap: "RGBM16",
  projection: 'normal',
  roughness: 1.0,
  reflectivity: 0.5,
  bumpScale: 0.3,
  background: false,
  exposure: 1.0,
};
var camera, scene, renderer, objects = [];
var hdrCubeMap;
var composer;
var standardMaterial, floorMaterial;
var ldrCubeRenderTarget, hdrCubeRenderTarget, rgbmCubeRenderTarget;
var rgbmUrls, ldrUrls, rgbmCubeMap;

init();
for (var m = 0; m < 1000000000; m++){}
render();
console.log(rgbmCubeMap.image[0])
render()
writeToFile();
console.log("Done writing to file")



function init() {

  camera = new THREE.PerspectiveCamera( 40, width / height, 1, 2000 );
  camera.position.set( 0.0, 40, 40 * 3.5 );
  scene = new THREE.Scene();

  var canvas = {addEventListener: function (){}} // use dummy event listener to squelch warning

  renderer = new THREE.WebGLRenderer({
    antialias: false,
    width: width,
    height: height,
    canvas: canvas,
    context: gl
  })

  renderer.setClearColor( new THREE.Color( 0xffffff ) );
  renderer.toneMapping = THREE.LinearToneMapping;
  standardMaterial = new THREE.MeshStandardMaterial( {
    map: null,
    bumpScale: - 0.05,
    color: 0xffffff,
    metalness: 1.0,
    roughness: 1.0,
    shading: THREE.SmoothShading
  } );
  var geometry = new THREE.TorusKnotGeometry( 18, 8, 150, 20 );;
  var torusMesh1 = new THREE.Mesh( geometry, standardMaterial );
  torusMesh1.position.x = 0.0;
  torusMesh1.castShadow = true;
  torusMesh1.receiveShadow = true;
  scene.add( torusMesh1 );
  objects.push( torusMesh1 );
  floorMaterial = new THREE.MeshStandardMaterial( {
    map: null,
    roughnessMap: null,
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.0,
    shading: THREE.SmoothShading
  } );
  var planeGeometry = new THREE.PlaneBufferGeometry( 200, 200 );
  var planeMesh1 = new THREE.Mesh( planeGeometry, floorMaterial );
  planeMesh1.position.y = - 50;
  planeMesh1.rotation.x = - Math.PI * 0.5;
  planeMesh1.receiveShadow = true;
  scene.add( planeMesh1 );
  var textureLoader = new THREE.TextureLoader();
  // textureLoader.load( "./textures/roughness_map.jpg", function( map ) {
  // 	map.wrapS = THREE.RepeatWrapping;
  // 	map.wrapT = THREE.RepeatWrapping;
  // 	map.anisotropy = 4;
  // 	map.repeat.set( 9, 2 );
  // 	standardMaterial.roughnessMap = map;
  // 	standardMaterial.bumpMap = map;
  // 	standardMaterial.needsUpdate = true;
  // } );
  var genCubeUrls = function( prefix, postfix ) {
    return [
      prefix + 'px' + postfix, prefix + 'nx' + postfix,
      prefix + 'py' + postfix, prefix + 'ny' + postfix,
      prefix + 'pz' + postfix, prefix + 'nz' + postfix
    ];
  };
  var hdrUrls = genCubeUrls( "./textures/cube/pisaHDR/", ".hdr" );
  // new THREE.HDRCubeTextureLoader().load( THREE.UnsignedByteType, hdrUrls, function ( hdrCubeMap ) {
  // 	var pmremGenerator = new THREE.PMREMGenerator( hdrCubeMap );
  // 	pmremGenerator.update( renderer );
  // 	var pmremCubeUVPacker = new THREE.PMREMCubeUVPacker( pmremGenerator.cubeLods );
  // 	pmremCubeUVPacker.update( renderer );
  // 	hdrCubeRenderTarget = pmremCubeUVPacker.CubeUVRenderTarget;
  // } );
  ldrUrls = genCubeUrls( "localhost:8000/test/files/pisa/", ".png" );
  // new THREE.CubeTextureLoader().load( ldrUrls, function ( ldrCubeMap ) {
  // 	ldrCubeMap.encoding = THREE.GammaEncoding;
  // 	var pmremGenerator = new THREE.PMREMGenerator( ldrCubeMap );
  // 	pmremGenerator.update( renderer );
  // 	var pmremCubeUVPacker = new THREE.PMREMCubeUVPacker( pmremGenerator.cubeLods );
  // 	pmremCubeUVPacker.update( renderer );
  // 	ldrCubeRenderTarget = pmremCubeUVPacker.CubeUVRenderTarget;
  // } );
  rgbmUrls = genCubeUrls( "localhost:8000/test/files/pisaRGBM16/", ".png" );
  //  http://localhost:8000/test/files/pisaRGBM16/

  // new THREE.CubeTextureLoader().load( rgbmUrls, function ( rgbmCubeMap ) {
  // 	rgbmCubeMap.encoding = THREE.RGBM16Encoding;
  // 	var pmremGenerator = new THREE.PMREMGenerator( rgbmCubeMap );
  // 	pmremGenerator.update( renderer );
  // 	var pmremCubeUVPacker = new THREE.PMREMCubeUVPacker( pmremGenerator.cubeLods );
  // 	pmremCubeUVPacker.update( renderer );
  // 	rgbmCubeRenderTarget = pmremCubeUVPacker.CubeUVRenderTarget;
  // } );




  rgbmCubeMap = new THREE.CubeTexture();
  rgbmCubeMap.images = []

  //  function successCB(pixels){console.log("successcb"); writeTextureToFile(pixels)}
  function successCB(pixels){
  //  console.log("successcb");
    rgbmCubeMap.images.push(pixels)
    console.log("pushing")
//    console.log(pixels)
  }
  function failCB(){}

  for (var i = 0; i < 6; i++)
  {
    fetchNext(rgbmUrls[i], successCB);
  }


  console.log(rgbmCubeMap.image[0])

  rgbmCubeMap.needsUpdate = true;
  rgbmCubeMap.encoding = THREE.RGBM16Encoding;
  console.log("test 1")
  var pmremGenerator = new THREE.PMREMGenerator( rgbmCubeMap );
  console.log("test 2")
  pmremGenerator.update( renderer );
  console.log("test 3")
  var pmremCubeUVPacker = new THREE.PMREMCubeUVPacker( pmremGenerator.cubeLods );
  console.log("test 4")
  pmremCubeUVPacker.update( renderer );
  console.log("test 5")
  rgbmCubeRenderTarget = pmremCubeUVPacker.CubeUVRenderTarget;


  // Lights
  scene.add( new THREE.AmbientLight( 0x222222 ) );
  var spotLight = new THREE.SpotLight( 0xffffff );
  spotLight.position.set( 50, 100, 50 );
  spotLight.angle = Math.PI / 7;
  spotLight.penumbra = 0.8
  spotLight.castShadow = true;
  scene.add( spotLight );
  //  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( width, height, false);
  renderer.shadowMap.enabled = true;


  renderer.gammaInput = true;
  renderer.gammaOutput = true;



  // var gui = new dat.GUI();
  // gui.add( params, 'envMap', [ 'None', 'LDR', 'HDR', 'RGBM16' ] );
  // gui.add( params, 'roughness', 0, 1 );
  // gui.add( params, 'reflectivity', 0, 1 );
  // gui.add( params, 'bumpScale', - 1, 1 );
  // gui.add( params, 'exposure', 0.1, 2 );
  // gui.open();
}

//

function render() {
  console.log("Render start")
  if ( standardMaterial !== undefined ) {
    standardMaterial.roughness = params.roughness;
    standardMaterial.reflectivity = params.reflectivity;
    standardMaterial.bumpScale = - 0.05 * params.bumpScale;
    var newEnvMap = standardMaterial.envMap;
    switch( params.envMap ) {
      case 'None': newEnvMap = null; break;
      case 'LDR': newEnvMap = ldrCubeRenderTarget ? ldrCubeRenderTarget.texture : null; break;
      case 'HDR': newEnvMap = hdrCubeRenderTarget ? hdrCubeRenderTarget.texture : null; break;
      case 'RGBM16': newEnvMap = rgbmCubeRenderTarget ? rgbmCubeRenderTarget.texture : null; break;
    }
    if( newEnvMap !== standardMaterial.envMap ) {
      standardMaterial.envMap = newEnvMap;
      standardMaterial.needsUpdate = true;
      floorMaterial.emissive = new THREE.Color( 1, 1, 1 );
      floorMaterial.emissiveMap = newEnvMap;
      floorMaterial.needsUpdate = true;
    }
  }
  renderer.toneMappingExposure = Math.pow( params.exposure, 4.0 );
  //				var timer = Date.now() * 0.00025;
  camera.lookAt( scene.position );
  //				for ( var i = 0, l = objects.length; i < l; i ++ ) {
  //					var object = objects[ i ];
  //					object.rotation.y += 0.005;
  //				}
  renderer.render( scene, camera );
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

function writeTextureToFile(pixels) {
  // create a pixel buffer of the correct size
  //  pixels = new Uint8ClampedArray(4 * width * height);

  // read back in the pixel buffer
  //  gl.bindFramebuffer( gl.FRAMEBUFFER, null );


  //  gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

  // lines are vertically flipped in the FBO / need to unflip them
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
  //     console.log("r,g,b,a = " + r,g,b,a)
  //   }
  // }


  for (var i = 0; i < width * height * 4; i += 4) {
    var r = pixels[i]
    var g = pixels[i + 1]
    var b = pixels[i + 2]
    var a = pixels[i + 3]
    //      t.equals(r, 255, 'red')
    //      t.equals(g, 255, 'green')
    //      t.equals(b, 255, 'blue')
    //      t.equals(a, 255, 'alpha')
    //  console.log(r, g, b, a)
  }

  // Now write the png to disk
  // stream = fs.createWriteStream(path);
  // img.pack().pipe(stream);
}





// console.log(rgbmUrls[0]);
// console.log(rgbmUrls.slice(1));
//fetchNext(ldrUrls[0], ldrUrls.slice(1), successCB, failCB, {contentType : 'img'});






function fetchNext(url, success) {

  function binaryParser(callback) {
    return function(res) {
      var data = '';
      res.setEncoding('binary');
      res.on('data', function(chunk) {
        data += chunk;
      });
      res.on('end', function() {
        callback(new Buffer(data, 'binary'));
      });
    }
  };

  var req = superagent.get(url);

  req.parse(binaryParser(function(buf) {
console.log("parse 1")
    var img = new Image();
    img.src = buf;
    var canvas = new Canvas(img.width, img.height);
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, img.width, img.height);
    var imgData = ctx.getImageData(0, 0, img.width, img.height);
    success(imgData);
//    console.log(imgData)

    //      console.log(imgData)
  }));
  req.end(function(err, res) {
    if (err) console.log(err);
  })

}
