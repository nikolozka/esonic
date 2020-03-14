const osc = require('osc')
const log = require('electron-log')
const three = require('three')
const {net} = require('electron').remote

axios = require('axios')


let audioContext; 
let scene; 
let audioElement; 
let audioElementSource; 
let elsource, ersource, brb1source, brb2source, brb3source; 
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

let lfile = "resources/out_l.wav";
let rfile = "resources/out_r.wav";
let birb1 = "resources/birb1.wav";
let birb2 = "resources/birb2.wav";
let birb3 = "resources/birb3.wav";

let ambi = "resources/rain.wav";
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
  //source.setPosition(sx,sy,sz);
//  setInterval(upd, 33);
}

async function geoFindMe() {

    let res = await axios.post('https://www.googleapis.com/');

    console.log(`Status code: ${res.status}`);
    console.log(`Status text: ${res.statusText}`);
    console.log(`Request method: ${res.request.method}`);
    console.log(`Path: ${res.request.path}`);

    console.log(`Date: ${res.headers.date}`);
    console.log(`Data: ${res.data}`);
}


function initOSC() {
  udpPort.open()
}

async function getMedia(pc) {
  let stream = null;

  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    //log.info("enumerateDevices() not supported.");
    return;
  }

  navigator.mediaDevices.enumerateDevices().then(function(devices) {
    devices.forEach(function(device) {
      //log.info(device.kind + ": " + device.label + " id = " + device.deviceId);
    });
    //log.info("end device list")
  }).catch(function(err) {

    log.info(err.name + ": " + err.message);
  });

  try {
    stream = await navigator.mediaDevices.getUserMedia({video: false, audio: {deviceId: {exact: "default"}} });
    //log.info("trying to open audio device")
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
    width: 15,
    height: 6,
    depth: 15,
  };
  let materials = {
    left: 'transparent',
    right: 'transparent',
    front: 'transparent',
    back: 'transparent',
    down: 'grass',
    up: 'transparent',
  };

  scene.setRoomProperties(dimensions, materials);

  erikal = document.createElement('audio');
  erikal.src = lfile;
  erikal.crossOrigin = 'anonymous';
  erikal.load();
  erikal.loop = true;
  erikalSource = audioContext.createMediaElementSource(erikal);
  elsource = scene.createSource();
  elsource.setPosition(-2,1,-2);
  erikalSource.connect(elsource.input);

  erikar = document.createElement('audio');
  erikar.src = rfile;
  erikar.crossOrigin = 'anonymous';
  erikar.load();
  erikar.loop = true;
  erikarSource = audioContext.createMediaElementSource(erikar);
  ersource = scene.createSource();
  ersource.setPosition(2,1,-2);
  erikarSource.connect(ersource.input);

  brb1 = document.createElement('audio');
  brb1.src = birb1;
  brb1.crossOrigin = 'anonymous';
  brb1.load();
  brb1.loop = true;
  brb1Source = audioContext.createMediaElementSource(brb1);
  b1source = scene.createSource();
  b1source.setPosition(0,5,3);
  brb1Source.connect(b1source.input);

  brb2 = document.createElement('audio');
  brb2.src = birb2;
  brb2.crossOrigin = 'anonymous';
  brb2.load();
  brb2.loop = true;
  brb2Source = audioContext.createMediaElementSource(brb2);
  b2source = scene.createSource();
  b2source.setPosition(-3,4,-2);
  brb2Source.connect(b2source.input);

  brb3 = document.createElement('audio');
  brb3.src = birb3;
  brb3.crossOrigin = 'anonymous';
  brb3.load();
  brb3.loop = true;
  brb3Source = audioContext.createMediaElementSource(brb3);
  b3source = scene.createSource();
  b3source.setPosition(5,3,0);
  brb3Source.connect(b3source.input);

  ambics = document.createElement('audio');
  ambics.src = ambi;
  ambics.crossOrigin = 'anonymous';
  ambics.load();
  ambics.loop = true;
  ambicsSource = audioContext.createMediaElementSource(ambics);
  ambicsSource.connect(scene.ambisonicInput)



  audioReady = true;
}

let onLoad = function() {
  rscene = new three.Scene()
  camera = new three.PerspectiveCamera( 75, 1, 0.1, 1000 );
  renderer = new three.WebGLRenderer(); 

  animate();

  initOSC();

  //geoFindMe()

  if (!audioReady) {
  	initAudio();
  }

  erikal.play();
  erikar.play();
  brb1.play();
  brb2.play();
  brb3.play();

  ambics.play();
//  upd();
};

window.addEventListener('load', onLoad);

window.addEventListener("gamepadconnected", function(e) {
  console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.", //uncomment to check joystick id
    e.gamepad.index, e.gamepad.id,
    e.gamepad.buttons.length, e.gamepad.axes.length);
  joy=true
});

var udpPort = new osc.UDPPort({
//    localAddress: "127.0.0.1",
//    localAddress: "192.168.43.230",
//    localAddress: "192.168.137.172",
    localAddress: "192.168.188.62",
//    localAddress: "192.168.43.59",
    localPort: 9000,
    metadata: true
});

udpPort.on("bundle", function (oscBundle, timeTag, info) {

  if (oscBundle.packets[0].address == "/w") {w=parseFloat(oscBundle.packets[0].args[0].value)}
  if (oscBundle.packets[1].address == "/x") {x=parseFloat(oscBundle.packets[1].args[0].value)}
  if (oscBundle.packets[2].address == "/y") {y=parseFloat(oscBundle.packets[2].args[0].value)}
  if (oscBundle.packets[3].address == "/z") {z=parseFloat(oscBundle.packets[3].args[0].value)}

  //log.info(w + " " + x + " " + y + " " + z);

});

udpPort.on("message", function(oscMsg){

  if (oscMsg.address == "/oscControl/sx") {sx=parseFloat(oscMsg.args[0].value)}
  if (oscMsg.address == "/oscControl/sy") {sy=parseFloat(oscMsg.args[0].value)}
  if (oscMsg.address == "/oscControl/sz") {sz=parseFloat(oscMsg.args[0].value)}
  //log.info(sx + " " + sy + " " + sz);

});

function animate() {
	requestAnimationFrame( animate );
	renderer.render( rscene, camera );

  if(joy){
    if(navigator.webkitGetGamepads) {
      var gp = navigator.webkitGetGamepads()[2]; //check log

      if(gp.buttons[0] == 1) {
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
      var gp = navigator.getGamepads()[2]; //check log for joystick id

      if(gp.buttons[0].value > 0 || gp.buttons[0].pressed == true) {
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
