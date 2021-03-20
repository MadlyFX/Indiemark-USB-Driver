const path = require('path');
const HID = require('node-hid');
const io = require("socket.io-client");

console.log("Args0:" + process.argv[0]);
console.log("Args1:" + process.argv[1]);
console.log("Args2:" + process.argv[2]);

var device = new HID.HID(1204,32849,process.argv[2]);

const URL = "http://localhost:3000";
const socket = io(URL, { autoConnect: true });


var status = 0;
var camera = "0";
var number = 0;
var position = 0;

var USBData = [];

var bISBlackedOut = false;

// client-side
socket.on("connect", () => {
  console.log(socket.id); 
  console.log("connected");
  socket.emit('connectReport', {'cam': camera, 'num': number.toString(), 'type': 'E', 'fw': 'latest'})
});


socket.on("change_assignment", (data) => {
  camera = data.assnLetter.replace(/['"]+/g, '');
  number = data.assnNumber.replace(/['"]+/g, '');

  var rList = [0x00, 0xff, 0x00, 0xff, 0xff];
  if(camera != '0'){
    rList[1] = (camera.charCodeAt(0) - 64) << 4 | parseInt(number);
  } else{
    rList[1] = 0 << 4 | parseInt(number);
  }
  
    if (bISBlackedOut == 1){
      rList[2] = (1 << 5) | rList[2];
}
  else if(bISBlackedOut == 0) {
      rList[2] = rList[2] & ~(1 << 5);
}


  device.write(rList);
  socket.emit('connectReport', {'cam': camera, 'num': number.toString(), 'type': 'E', 'fw': 'latest'})
  console.log("New Assn");

});


socket.on("blackout", (data) => {
  console.log("Blackout");
  var rList = [0x00, 0xff, 0x00, 0xff, 0xff];

  if (data == 1){
      rList[2] = (1 << 5) | rList[2];
}
  else {
      rList[2] = rList[2] & ~(1 << 5);
}

if(data == 1){
	bISBlackedOut = 1;
} else {
	bISBlackedOut = 0;
}


console.log(rList);
device.write(rList);
});


socket.on("flashLED", (data) => {

  console.log("flash")
  rList = [0x00, 0xff, 0x00, 0xff, 0xff]

  if (data == 1){
      rList[2] = (1 << 7) | 0x00
  }
  else {
      rList[2] = 0x00 & ~(1 << 7)
  }
  
  if (bISBlackedOut == 1){
      rList[2] = (1 << 5) | rList[2];
}
  else if(bISBlackedOut == 0) {
      rList[2] = rList[2] & ~(1 << 5);
}

  device.write(rList)

});


socket.on("disconnect", () => {
  console.log(socket.id); // undefined
});


device.on("data", function(data) {
  var oldCam = camera;
  var oldNum = number;
  var oldPos = position;

  USBData = data;
  UnpackCamLetter(data[0]);
  status = data[1];
  position = UnpackRotation(data[2], data[3])
  
  if(camera != oldCam || number != oldNum){
    console.log(oldCam);
    console.log(oldNum);
    console.log(camera);
    console.log(number);
  }

  if(position != oldPos){
    socket.emit('encoderReport', position);
    console.log(camera, number, position);
  }

	
});


function UnpackCamLetter(byte){
  camera = (byte & 0xf0) >> 4;
  if (camera != 0){
      camera = String.fromCharCode(camera + 64);
  }
  number = byte & 0x0f;
}


function UnpackRotation(byte1, byte2){
	var newPositon = 0;
  newPositon = byte1 << 8 | byte2;
	return newPositon;
}

