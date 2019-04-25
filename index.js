// module for data port socket
// https://nodejs.org/api/net.html
const net = require('net');

// module allows work with c++ dll
// https://github.com/node-ffi/node-ffi
const ffi = require('ffi');

// module provides c/c++ types
// https://tootallnate.github.io/ref/
const ref = require('ref');

// define types
const int = ref.types.int;
const str = ref.types.CString;
const ulong = ref.types.ulong;
const long = ref.types.long
const charPtr = ref.refType('char');

// import function from IP Serial Lib
// ./IPSerial is path to IPserial.dll
const CommandPort = ffi.Library('./IPSerial', {
  'nsio_init': [int, []],
  'nsio_end': [int, []],
  'nsio_open': [int, [str, int, ulong]],
  'nsio_close': [int, [int]],
  'nsio_ioctl': [int, [int, int, int]],
  'nsio_baud': [int, [int, long]],
  'nsio_break': [int, [int, int]]
});

// create data port socket
const socket = new net.Socket();

// this message will be printed out if there is an error
socket.on('error', error => {
  console.log('DATA PORT ERROR: ', error);
})

// this message will be printed out if port is closed
socket.on('close', () => {
  console.log('DATA PORT CLOSED');
})

// this message will be printed out if port is ready
socket.on('ready', () => {
  console.log('DATA PORT IS READY');
})

// this will be printed out when when response comes
socket.on('data', data => {
  console.log('DATA PORT RESPONSE: ', data.toString('utf8'));
  console.log('* v - value, e - error');
  console.log('* different baud rates lead to error');
})

// sleep function
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// main function; async allows to use sleep
const main = async () => {
  // establish connection with data port
  socket.connect(5000,'10.1.10.65', () => {
    console.log('DATA PORT CONNECTED');
  });

  // gives enough time to get data port ready
  await sleep(500);

  // send test message and wait for response
  socket.write('g r0x90\r', 'ascii');
  await sleep(500);

  // set baudrate for device I used with NPORT
  // by sending specific command
  // my device and NPORT communicate by default on 9600
  console.log('SETTING BAUDRATE FOR MY DEVICE...');
  socket.write('s r0x90 115200\r', 'ascii');
  await sleep(500);
  // we will receive nothing because my device sends on new baud rate


  // now I change baudrate for NPORT so devices can talk and
  // understand each other
  let ret;

  // init 
  ret = CommandPort.nsio_init();
  if (ret < 0) {
    console.log('NSIO_INIT ERROR: ', ret);
  } else {
    console.log('NSIO_INIT -> OK');
  }
  
  // open command port
  const portId = CommandPort.nsio_open('10.1.10.65', 1, 3000);
  if (portId < 0) {
    console.log('NSIO_OPEN ERROR: ', portId);
  } else {
    console.log('NSIO_OPEN -> OK');
    console.log('PORT ID: ', portId);
  }

  // change baud rate
  ret = CommandPort.nsio_baud(portId, 115200);
  if (ret < 0) {
    console.log('NSIO_BAUD ERROR: ', ret);
  } else {
    console.log('NSIO_BAUD -> OK');
  }
  
  // wait for port readiness
  await sleep(500);

  // send test message and wait for response
  // expect to get "v 31" or "v 21" if baudrates are the same
  // receive "e 3" or "e 33" if baudrates are different
  // when NPORT send message to my device on different baudrate
  // my device interprets such message as break signal and
  // reset baudrate back to 9600.
  socket.write('g r0x90\r', 'ascii');
  await sleep(500);

  socket.write('g r0x90\r', 'ascii');
  await sleep(500);

  // --- RESET
  // break signal
  console.log('BREAK SIGNAL...');
  ret = CommandPort.nsio_break(portId, 200);
  if (ret < 0) {
    console.log('NSIO_BREAK ERROR: ', ret);
  } else {
    console.log('NSIO_BREAK -> OK');
  }

  // change baud rate to default
  ret = CommandPort.nsio_baud(portId, 9600);
  if (ret < 0) {
    console.log('NSIO_BAUD ERROR: ', ret);
  } else {
    console.log('NSIO_BAUD -> OK');
  }
  // ---RESET

  // close command port
  ret = CommandPort.nsio_close(portId);
  if (ret < 0) {
    console.log('NSIO_CLOSE ERROR: ', ret);
  }
  console.log('NSIO_CLOSE -> OK');

  // end
  ret = CommandPort.nsio_end();
  if (ret < 0) {
    console.log('NSIO_END ERROR: ', ret);
  }
  console.log('NSIO_END -> OK');

  socket.write('g r0x90\r', 'ascii');
  await sleep(500);

  socket.end();
  await sleep(200);

  process.exit();
}

main();


