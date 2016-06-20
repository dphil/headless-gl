var createContext = require('./../index.js')
var THREE = require('./vendor/three.js')
var webglDebug = require('webgl-debug')
var png = require('pngjs').PNG;
var fs = require('fs');
var superagent = require('superagent');
var Canvas = require('canvas');
const { Image } = Canvas;


var width = 1500
var height = 1500

var path = 'out_None.png';
//img = new png({width: width, height: height});


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
var gl = debug_log_gl;




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
var rgbmUrls, ldrUrls, rgbmCubeMap, hdrCubeMap, torusTex, cube;




function init() {

  camera = new THREE.PerspectiveCamera( 40, width / height, 1, 2000 );
  camera.position.set( 0.0, 40, 40 * 3.5 );
  scene = new THREE.Scene();

  var canvas2 = {addEventListener: function (){}} // use dummy event listener to squelch warning

  renderer = new THREE.WebGLRenderer({
    antialias: false,
    width: width,
    height: height,
    canvas: canvas2,
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
  // map.wrapS = THREE.RepeatWrapping;
  // map.wrapT = THREE.RepeatWrapping;
  // map.anisotropy = 4;
  // map.repeat.set( 9, 2 );
  // standardMaterial.roughnessMap = map;
  // standardMaterial.bumpMap = map;
  // standardMaterial.needsUpdate = true;
  // } );

  torusTex = new THREE.DataTexture();

  function torusTexCB(pixels){

    torusTex.image.width = 256;
    torusTex.image.height = 256;
    torusTex.image.data = pixels.data;

    torusTex.wrapS = THREE.RepeatWrapping;
    torusTex.wrapT = THREE.RepeatWrapping;
    torusTex.anisotropy = 4;
    torusTex.repeat.set( 9, 2 );
    torusTex.needsUpdate = true;

    standardMaterial.roughnessMap = torusTex;
    standardMaterial.bumpMap = torusTex;
    standardMaterial.needsUpdate = true;

    init1a();
  }

  fetchNext("localhost:8000/test/files/roughness_map.jpg", torusTexCB);
}


function init1a() {

  var genCubeUrls = function( prefix, postfix ) {
    return [
      prefix + 'px' + postfix, prefix + 'nx' + postfix,
      prefix + 'py' + postfix, prefix + 'ny' + postfix,
      prefix + 'pz' + postfix, prefix + 'nz' + postfix
    ];
  };
  var hdrUrls = genCubeUrls( "localhost:8000/test/files/hdrPisa/", ".hdr" );
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


  // Load cube environment

  cube = new THREE.CubeTexture();
  cube.format = THREE.RGBAFormat;
  cube.type = THREE.UnsignedByteType;
  cube.encoding = THREE.RGBM16Encoding;
  cube.minFilter = THREE.NearestFilter;
  cube.magFilter = THREE.NearestFilter;
  cube.generateMipmaps = false;
  cube.anisotropy = 0;

for (var i = 0; i < 6; i++)
{
  cube.images.push(new THREE.DataTexture([200, 100, 100, 255], 1, 1))
}

//renderer.render(scene, camera);
 init2();
// render();
// writeToFile();

  // function successCB(pixels){
  //
  //   var rgbmCubeMap = new THREE.DataTexture(pixels.data, 256, 256);
  //
  //   //    console.log(rgbmCubeMap)
  //   rgbmCubeMap.format = THREE.RGBAFormat;
  //   rgbmCubeMap.type = THREE.UnsignedByteType;
  //   rgbmCubeMap.encoding = THREE.RGBEEncoding;
  //   rgbmCubeMap.minFilter = THREE.NearestFilter;
  //   rgbmCubeMap.magFilter = THREE.NearestFilter;
  //   rgbmCubeMap.generateMipmaps = false;
  //   rgbmCubeMap.needsUpdate = true;
  //
  //   cube.images.push(rgbmCubeMap);
  //
  //   console.log("# cube images parsed = " + cube.images.length)
  //   if (cube.images.length == 6)
  //   {
  //     init2();
  //     render();
  //     writeToFile();
  //     writeTextureToFile(pixels)
  //   }
  // }
  //
  // for (var i = 0; i < 6; i++)
  // {
  //   fetchNext(rgbmUrls[i], successCB);
  // }
}

function init2() {

//  cube = new THREE.CubeTexture();
  // ldrCubeMap.needsUpdate = true;
  //   ldrCubeMap.encoding = THREE.GammaEncoding;
  //   var pmremGenerator = new THREE.PMREMGenerator( ldrCubeMap );
  //   pmremGenerator.update( renderer );
  //   var pmremCubeUVPacker = new THREE.PMREMCubeUVPacker( pmremGenerator.cubeLods );
  //   pmremCubeUVPacker.update( renderer );
  //   ldrCubeRenderTarget = pmremCubeUVPacker.CubeUVRenderTarget;


  //  console.log(rgbmCubeMap.image[0])
  //var oldLog = console.log;
  //console.log = function (){}

//  cube.needsUpdate = true;
  cube.encoding = THREE.RGBM16Encoding;
  cube.needsUpdate = true;
  var pmremGenerator = new THREE.PMREMGenerator( cube );

  pmremGenerator.update( renderer );
return;
  var pmremCubeUVPacker = new THREE.PMREMCubeUVPacker( pmremGenerator.cubeLods );
  pmremCubeUVPacker.update( renderer );
  rgbmCubeRenderTarget = pmremCubeUVPacker.CubeUVRenderTarget;
  //cube.needsUpdate = true;



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
}



function render() {

  if ( standardMaterial !== undefined ) {
    standardMaterial.roughness = params.roughness;
    standardMaterial.reflectivity = params.reflectivity;
    standardMaterial.bumpScale = - 0.05 * params.bumpScale;
    var newEnvMap = standardMaterial.envMap;
    params.envMap = 'RGBM16';
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
  var pixels = new Uint8Array(4 * width * height);

  // read back in the pixel buffer
  gl.bindFramebuffer( gl.FRAMEBUFFER, null );


  gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

  var img = new png({width: width, height: height});

  // lines are vertically flipped in the FBO / need to unflip them
  for (var j=0; j < height; j++) {
    for (var i=0; i < width; i++) {
      var k = j * width + i;
      var r = pixels[4*k];
      var g = pixels[4*k + 1];
      var b = pixels[4*k + 2];
      var a = pixels[4*k + 3];
      //console.log("r = " + r)
      var m = (height - j - 1) * width + i;
      img.data[4*m]     = r;
      img.data[4*m + 1] = g;
      img.data[4*m + 2] = b;
      img.data[4*m + 3] = a;
    }
  }

  // Now write the png to disk
  //stream = fs.createWriteStream(path);
  //  img.pack().pipe(stream);
  //img.pack().pipe(fs.createWriteStream('out.png'));
  var buffer = png.sync.write(img);
  fs.writeFileSync(path, buffer)
}

function writeTextureToFile(pixels2) {
  // create a pixel buffer of the correct size
  //  pixels = new Uint8ClampedArray(4 * width * height);

  // read back in the pixel buffer
  //  gl.bindFramebuffer( gl.FRAMEBUFFER, null );


  //  gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  // console.log(Object.keys(pixels2 ))
  // console.log('pixels2.data.length', pixels2.data.length);
  // console.log('width', width);
  // console.log('height', height);
  // lines are vertically flipped in the FBO / need to unflip them
var width = 256;
var height = 256;
  var img2 = new png({width: width, height: height});

  for (var j=0; j < height; j++) {
    for (var i=0; i < width; i++) {
      var offset = ( j * width + i ) * 4;
      var r = pixels2.data[offset+ 0];

      //  console.log("r = " + r)

      var g = pixels2.data[offset + 1];
      var b = pixels2.data[offset + 2];
      var a = pixels2.data[offset + 3];

      var m = (height - j - 1) * width + i;
      img2.data[4*m]     = r;
      img2.data[4*m + 1] = g;
      img2.data[4*m + 2] = b;
      img2.data[4*m + 3] = 255;
      //      console.log("r,g,b,a = " + r,g,b,a)

    }
  }


  // for (var i = 0; i < width * height * 4; i += 4) {
  //   var r = pixels[i]
  //   var g = pixels[i + 1]
  //   var b = pixels[i + 2]
  //   var a = pixels[i + 3]
  //      t.equals(r, 255, 'red')
  //      t.equals(g, 255, 'green')
  //      t.equals(b, 255, 'blue')
  //      t.equals(a, 255, 'alpha')
  //  console.log(r, g, b, a)
  //  }

  // Now write the png to disk
  // stream = fs.createWriteStream(path);
  // img.pack().pipe(stream);

  var buffer = png.sync.write(img2);
  fs.writeFileSync('out_cube_texture.png', buffer)
}


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
    //console.log("binaryParser")
    var img = new Image();
    img.src = buf;
    var canvas = new Canvas(img.width, img.height);
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, img.width, img.height);
    var imgData = ctx.getImageData(0, 0, img.width, img.height);
    success(imgData);
    //    console.log(imgData)

  }));

  req.end(function(err, res) {
    if (err) console.log(err);
  })
}


// Run program
//console.log(THREE.)
init();
//for (var m = 0; m < 1000000000; m++){}
//render();
//writeToFile();
//for (var m = 0; m < 1000000000; m++){}
//console.log("Program ending")
