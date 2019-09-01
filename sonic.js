const osc = require('osc')

let audioContext; 
let scene; 
let audioElement; 
let audioElementSource; 
let source; 
let pannerNode; 
let pannerGain; 
let audioReady = false;

let x=0;
let y=0;
let z=0;

let angle = 0.0;
let order = 3;

let afile = "resources/out.mp3";

/**
 * @private
 */

function upd(){
  if(!audioReady) return;
  
  pannerNode.setPosition(x,y,z);
  source.setPosition(x,y,z);
}

function initOSC() {
  udpPort.open()
}

function initAudio() {

  audioContext = new AudioContext();

  scene = new ResonanceAudio(audioContext,{ambisonicOrder: order});

  // Send scene's rendered binaural output to stereo out.
  scene.output.connect(audioContext.destination);

  // Set room acoustics properties.
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

  // Create an audio element. Feed into audio graph.
  audioElement = document.createElement('audio');
  audioElement.src = afile;
  audioElement.crossOrigin = 'anonymous';
  audioElement.load();
  audioElement.loop = true;
  audioElementSource = audioContext.createMediaElementSource(audioElement);

  pannerGain = audioContext.createGain();

  pannerNode = audioContext.createPanner();
  pannerNode.panningMode1='HRTF';
  pannerNode.distanceModel='inverse';
  pannerNode.refDistance = ResonanceAudio.Utils.DEFAULT_MIN_DISTANCE;
  pannerNode.maxDistance = ResonanceAudio.Utils.DEFAULT_MAX_DISTANCE;

  // Create a Source, connect desired audio input to it.

  source = scene.createSource();

  audioElementSource.connect(pannerNode);
  audioElementSource.connect(source.input);
  pannerNode.connect(pannerGain);

  pannerGain.connect(audioContext.destination);


  // The source position is relative to the origin
  // (center of the room).
  source.setPosition(x,y,z);

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
    localAddress: "127.0.0.1",
    localPort: 9000,
    metadata: true
});

udpPort.on("message", function (oscMsg) {
  if (oscMsg.address == "/az") {x=parseFloat(oscMsg.args[0].value)}
  if (oscMsg.address == "/el") {y=parseFloat(oscMsg.args[0].value)}

  upd();
  console.log(x);
  console.log(y);
});

