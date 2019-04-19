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

// import function from IP Serial Lib
// ./IPSerial is path to IPserial.dll
const CommandPort = ffi.Library('./IPSerial', {
  'nsio_init': [int, []],
  'nsio_end': [int, []],
  'nsio_open': [int, [str, int, ulong]],
  'nsio_close': [int, [int]],
  'nsio_ioctl': [int, [int, int, int]],
  'nsio_baud': [int, [int, long]],
  'nsio_break': [int, [int, int]],
});

// create data port socket
const socket = new net.Socket();

// this message will be printed out if there is an error
socket.on('error', () => {
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

  // gives enough time to open data port
  await sleep(2000);

  // send test message and wait for response
  socket.write('g r0x24\r', 'ascii');
  await sleep(500);

  // set baudrate for divice I used with NPORT
  // by sending specific command
  // my device and NPORT communicate by default on 9600
  console.log('SETTING BAUDRATE FOR MY DEVICE...');
  socket.write('s r0x90 57600\r', 'ascii');
  await sleep(1000);
  // we will receive nothing because my device sends on new baud rate

  // close socket
  socket.end();

  // gives enough time to close port.
  // if data port is still open command cannot be opened. 
  await sleep(2000);

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
  ret = CommandPort.nsio_baud(portId, 19200);
  if (ret < 0) {
    console.log('NSIO_BAUD ERROR: ', ret);
  } else {
    console.log('NSIO_BAUD -> OK');
  }

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

  // I assume that I have changed baudrate. I closed command port
  // to open data port again and send test message
  socket.connect(5000,'10.1.10.65', () => {
    console.log('DATA PORT CONNECTED');
  });

  // wait for port readiness
  await sleep(2000);

  // send test message and wait for response
  // expect to get "v 31" or "v 21" if baudrates are the same
  // receive "e 3" or "e 33" if baudrates are different
  // when NPORT send message to my device on different baudrate
  // my device interprets such message as break signal and
  // reset baudrate back to 9600.
  socket.write('g r0x24\r', 'ascii');
  await sleep(500);

  socket.write('g r0x24\r', 'ascii');
  await sleep(500);

  socket.end();
  await sleep(200);

  process.exit();
}

main();


