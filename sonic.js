const osc = require('osc')
const log = require('electron-log')
const three = require('three')
const desktopCapturer = require('electron')

let audioContext; 
let scene; 
let audioElement; 
let audioElementSource; 
let source; 
let audioReady = false;
let matrix = new three.Matrix4();

let pos
let quat
let scale

let utils;

let w=0;
let x=0;
let y=0;
let z=0;

let sx=0;
let sy=1;
let sz=0;

let lx=0;
let ly=0;
let lz=0;

let angle = 0.0;
let order = 2;

let afile = "resources/out.mp3";
let adevice = "default"

let rscene
let camera
let renderer

let joy = false



function upd(){
  if(!audioReady) return;

  quat = new three.Quaternion(x,y,z,w)
  matrix.makeRotationFromQuaternion(quat.conjugate());
  matrix.setPosition(lx,ly,lz);
  scene.setListenerFromMatrix(matrix);
  source.setPosition(sx,sy,sz);
//  setInterval(upd, 33);
}

function initOSC() {
  udpPort.open()
}

async function getMedia(pc) {
  let stream = null;

  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    log.info("enumerateDevices() not supported.");
    return;
  }

  navigator.mediaDevices.enumerateDevices().then(function(devices) {
    devices.forEach(function(device) {
      log.info(device.kind + ": " + device.label + " id = " + device.deviceId);
    });
    log.info("end device list")
  }).catch(function(err) {

    log.info(err.name + ": " + err.message);
  });

  try {
    stream = await navigator.mediaDevices.getUserMedia({video: false, audio: {deviceId: {exact: "c0b30a189bbe02c724b088f8e96443efb09bdabf9d63c6d5d4c273b4fb255fcd"}} });
    log.info("trying to open audio device")
    stream = await navigator.mediaDevices.getUserMedia({video: false, audio: true});
//    stream = await navigator.mediaDevices.getUserMedia({video: false, audio: {deviceId : {exact: "22d0745bbfa45f7988aaa72cba793c5865ab5a85eb0b3a506296690affcfcd16"}}});
    handleStream(stream)
  }
  catch(err){
	log.info("failed to open device: ")
	log.info(err.name)
  }
}


function handleStream(stream){
  var mediaStreamTracks = stream.getTracks()
  log.info(stream)
}

function initAudio() {

  getMedia()
  audioContext = new AudioContext();
//  audioContext = new AudioContext(window.AudioContext || window.webkitAudioContext());
  scene = new ResonanceAudio(audioContext,{ambisonicOrder: order});
  scene.output.connect(audioContext.destination);

  let dimensions = {
    width: 10,
    height: 10,
    depth: 10,
  };
  let materials = {
    left: 'marble',
    right: 'marble',
    front: 'marble',
    back: 'marble',
    down: 'marbe',
    up: 'marble',
  };

  scene.setRoomProperties(dimensions, materials);
  audioElement = document.createElement('audio');
  audioElement.src = afile;
  audioElement.crossOrigin = 'anonymous';
  audioElement.load();
  audioElement.loop = true;
  audioElementSource = audioContext.createMediaElementSource(audioElement);
  source = scene.createSource();
  audioElementSource.connect(source.input);

  source.setPosition(sx,sy,sz);

  audioReady = true;
}

let onLoad = function() {

  rscene = new three.Scene()
  camera = new three.PerspectiveCamera( 75, 1, 0.1, 1000 );
  renderer = new three.WebGLRenderer(); 

  animate();

  initOSC();

  if (!audioReady) {
  	initAudio();
  }

  audioElement.play();
//  upd();
};

window.addEventListener('load', onLoad);

window.addEventListener("gamepadconnected", function(e) {
  console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.",
    e.gamepad.index, e.gamepad.id,
    e.gamepad.buttons.length, e.gamepad.axes.length);
    joy=true
});

var udpPort = new osc.UDPPort({
//    localAddress: "127.0.0.1",
//    localAddress: "192.168.43.230",
    localAddress: "192.168.137.172",
//    localAddress: "192.168.188.62",
//    localAddress: "192.168.43.59",
    localAddress: "192.168.188.62",
    localPort: 9000,
    metadata: true
});

udpPort.on("bundle", function (oscBundle, timeTag, info) {

  if (oscBundle.packets[0].address == "/w") {w=parseFloat(oscBundle.packets[0].args[0].value)}
  if (oscBundle.packets[1].address == "/x") {x=parseFloat(oscBundle.packets[1].args[0].value)}
  if (oscBundle.packets[2].address == "/y") {y=parseFloat(oscBundle.packets[2].args[0].value)}
  if (oscBundle.packets[3].address == "/z") {z=parseFloat(oscBundle.packets[3].args[0].value)}

  log.info(w + " " + x + " " + y + " " + z);

});

udpPort.on("message", function(oscMsg){

  if (oscMsg.address == "/oscControl/sx") {sx=parseFloat(oscMsg.args[0].value)}
  if (oscMsg.address == "/oscControl/sy") {sy=parseFloat(oscMsg.args[0].value)}
  if (oscMsg.address == "/oscControl/sz") {sz=parseFloat(oscMsg.args[0].value)}
  log.info(sx + " " + sy + " " + sz);

});

function animate() {
	requestAnimationFrame( animate );
	renderer.render( rscene, camera );

  if(joy){
    if(navigator.webkitGetGamepads) {
      var gp = navigator.webkitGetGamepads()[0];

      if(gp.buttons[0] == 1) {
        log.info("bt0")
      } else if(gp.buttons[1] == 1) {
        log.info("bt1")
      } else if(gp.buttons[2] == 1) {
        log.info("bt2")
      } else if(gp.buttons[3] == 1) {
        log.info("bt3")
      }

      if(Math.abs(gp.axes[0])>0.2){lx+=gp.axes[0]/10.0}
      if(Math.abs(gp.axes[1])>0.2){ly+=gp.axes[1]/10.0}


    } else {
      var gp = navigator.getGamepads()[0];

      if(gp.buttons[0].value > 0 || gp.buttons[0].pressed == true) {
        log.info("bt0")
      } else if(gp.buttons[1].value > 0 || gp.buttons[1].pressed == true) {
        log.info("bt1")
      } else if(gp.buttons[2].value > 0 || gp.buttons[2].pressed == true) {
        log.info("bt2")
      } else if(gp.buttons[3].value > 0 || gp.buttons[3].pressed == true) {
        log.info("bt3")
      }
      if(Math.abs(gp.axes[0])>0.2){lx+=gp.axes[0]/10.0}
      if(Math.abs(gp.axes[1])>0.2){ly+=gp.axes[1]/10.0}
    }
  }
	upd()
}
