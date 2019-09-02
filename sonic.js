const osc = require('osc')
const log = require('electron-log')

let audioContext; 
let scene; 
let audioElement; 
let audioElementSource; 
let source; 
let audioReady = false;

let x=0;
let y=1;
let z=0;

let angle = 0.0;
let order = 2;

let afile = "resources/out.mp3";

function upd(){
  if(!audioReady) return;
  source.setPosition(x,y,z);
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
  source.setPosition(x,y,z);
  audioReady = true;
}

let onLoad = function() {

  log.info("log initialised")
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

udpPort.on("message", function (oscMsg) {
  if (oscMsg.address == "/az") {x=parseFloat(oscMsg.args[0].value)}
  if (oscMsg.address == "/el") {y=parseFloat(oscMsg.args[0].value)}
});

