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
let matrix

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

let angle = 0.0;
let order = 2;

let afile = "resources/out.mp3";

function upd(){
  if(!audioReady) return;

  matrix = new three.Matrix4();
  quat = new three.Quaternion(x,y,z,w)
  matrix.makeRotationFromQuaternion(quat.conjugate());

  scene.setListenerFromMatrix(matrix);
  source.setPosition(sx,sy,sz);
  setInterval(upd, 33);
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
    stream = await navigator.mediaDevices.getUserMedia({video: false, audio: {deviceId: {exact: default} } });
    handleStream(stream)
  } catch(err) {
    handleError(err)
  }
}

function handleError(e){
	log.error(e)
}

function handleStream(stream){
  var mediaStreamTracks = stream.getAudioTracks()
  log.info(mediaStreamTracks)
}

function initAudio() {

  log.info("starting to load stuff")
  
  getMedia()
  
  audioContext = new AudioContext();
  scene = new ResonanceAudio(audioContext,{ambisonicOrder: order});
  scene.output.connect(audioContext.destination);

  let dimensions = {
    width: 3,
    height: 3,
    depth: 3,
  };
  let materials = {
    left: 'wood-panel',
    right: 'wood-panel',
    front: 'wood-panel',
    back: 'wood-panel',
    down: 'wood-panel',
    up: 'wood-panel',
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
  log.info("this much works")
  initOSC();

  if (!audioReady) {
  	initAudio();
  }

  audioElement.play();
  upd();
};

window.addEventListener('load', onLoad);

var udpPort = new osc.UDPPort({
    localAddress: "192.168.137.172",
//    localAddress: "192.168.188.62",
//    localAddress: "192.168.43.59",
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

});
