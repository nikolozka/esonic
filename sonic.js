const osc = require('osc')
const log = require('electron-log')
const three = require('three')

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

let angle = 0.0;
let order = 2;

let afile = "resources/out.mp3";

function upd(){
  if(!audioReady) return;

  matrix = new three.Matrix4();
  quat = new three.Quaternion(x,y,z,w)
  matrix.makeRotationFromQuaternion(quat.conjugate());

  scene.setListenerFromMatrix(matrix);

  setInterval(upd, 33);
}

function initOSC() {
  udpPort.open()
}

function initAudio() {

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

  source.setPosition(0,4,0);

  audioReady = true;
}

let onLoad = function() {

  initOSC();

  if (!audioReady) {
  	initAudio();
  }

  audioElement.play();
  upd();
};

window.addEventListener('load', onLoad);

var udpPort = new osc.UDPPort({
    localAddress: "192.168.188.62",
    localPort: 9000,
    metadata: true
});

udpPort.on("bundle", function (oscBundle, timeTag, info) {

  if (oscBundle.packets[0].address == "/w") {w=parseFloat(oscBundle.packets[0].args[0].value)}
  if (oscBundle.packets[1].address == "/x") {x=parseFloat(oscBundle.packets[1].args[0].value)}
  if (oscBundle.packets[2].address == "/y") {y=parseFloat(oscBundle.packets[2].args[0].value)}
  if (oscBundle.packets[3].address == "/z") {z=parseFloat(oscBundle.packets[3].args[0].value)}

//  log.info(w + " " + x + " " + y + " " + z);

});

