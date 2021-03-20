const path = require('path');
const { fork } = require('child_process');
var usbDetect = require('usb-detection');
const HID = require('node-hid');

  usbDetect.startMonitoring();

function spawnIndie(device){
	fork(path.join(__dirname, 'subprocess.js'), [device.serialNumber]);
}

usbDetect.on('add:1204:32849', function(device) {
	console.log(device);
//	usbDetect.stopMonitoring()
  setTimeout(spawnIndie, 1000, device);
 console.log(device);
});

usbDetect.on('remove:vid:pid', function(device) {
	console.log(device);

});

