import os
import sys
from ctypes import *
import socket

lib = windll.LoadLibrary('IPSerial.dll')

sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.connect(('10.1.10.65', 5000))

sock.send(bytes('g r0x90\r', encoding="utf-8"))
data = sock.recv(1024)
print("DATA PORT RESPONSE: ", data.decode('ascii'))

sock.send(bytes('s r0x90 115200\r', encoding="utf-8"))
print("SET BAUD RATE TO 115200")
sock.close()

ret = lib.nsio_init()
if ret < 0:
  print("INIT ERROR: ", ret)
else:
  print("INIT OK", ret)

port_id = lib.nsio_open(b'10.1.10.65', 1, 3000)
if port_id < 0:
  print("OPEN ERROR: ", port_id)
else:
  print("OPEN OK", port_id)

ret = lib.nsio_baud(port_id, 115200)
if ret < 0:
  print("BREAK ERROR: ", ret)
else:
  print("BREAK OK", ret)

sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.connect(('10.1.10.65', 5000))

sock.send(bytes('g r0x90\r', encoding="utf-8"))
data = sock.recv(1024)
print("DATA PORT RESPONSE: ", data.decode('ascii'))
sock.send(bytes('g r0x90\r', encoding="utf-8"))
data = sock.recv(1024)
print("DATA PORT RESPONSE: ", data.decode('ascii'))
sock.close()

ret = lib.nsio_break(port_id, 200)
if ret < 0:
  print("BREAK ERROR: ", ret)
else:
  print("BREAK OK", ret)

ret = lib.nsio_baud(port_id, 19200)
if ret < 0:
  print("BREAK ERROR: ", ret)
else:
  print("BREAK OK", ret)

ret = lib.nsio_close(port_id)
if ret < 0:
  print("CLOSE ERROR: ", ret)
else:
  print("CLOSE OK", ret)

ret = lib.nsio_end()
if ret < 0:
  print("CLOSE ERROR: ", ret)
else:
  print("CLOSE OK", ret)