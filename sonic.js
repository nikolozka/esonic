let audioContext;
let scene;
let audioElement;
let audioElementSource;
let source;
let pannerNode;
let pannerGain;
let audioReady = false;

let x,y,z;

let angle = 0.0;
let order = 3;

let udpPort;
let osc;

let afile = "resources/out.mp3";

/**
 * @private
 */


function upd(){
  if(!audioReady) return;

//  x=2*Math.random()-1;
//  y=2*Math.random()-1;

x=Math.cos(angle);
//  x=angle/180.0-1.0;
  y=Math.sin(angle);
//  y=0.0;
  z=0.0;

//  console.log(x + "    " + y);

  angle+= 0.1;

  if(angle > 359.9) angle = 0.0;

  //z=2*Math.random()-1;


  pannerNode.setPosition(x,y,z);
  source.setPosition(x,y,z);

  setTimeout(upd,200);

}



function initAudio() {

  console.log("initializing audio");


/*  osc = new OSC()

  osc.on('/param/density', message => {
    console.log(message.args)
  })

  osc.open({ port: 9000 })

  const message = new OSC.Message('/test', 'hello');
//  osc.send(message) */

  audioContext = new AudioContext();

  console.log("audio context acquired");

  // Create a (3rd-order Ambisonic) ResonanceAudio scene.
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
  // Initialize play button functionality.
  console.log("window loaded");
  if (!audioReady) {
	console.log("audio is not initialized")
  	initAudio();
  }
  audioElement.play();
  upd();
};

window.addEventListener('load', onLoad);
