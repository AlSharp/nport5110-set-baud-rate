import os
import sys
from ctypes import *
import socket

sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.connect(('10.1.10.65', 5000))

sock.send(bytes('g r0x24\r', encoding="utf-8"))
data = sock.recv(1024)
print("DATA PORT RESPONSE: ", data.decode('ascii'))
sock.send(bytes('s r0x90 19200\r', encoding="utf-8"))
sock.close()

lib = windll.LoadLibrary('IPSerial.dll')

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

ret = lib.nsio_baud(port_id, 19200)
if ret < 0:
  print("BAUD ERROR: ", ret)
else:
  print("BAUD OK", ret)

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

sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.connect(('10.1.10.65', 5000))

sock.send(bytes('g r0x24\r', encoding="utf-8"))
data = sock.recv(1024)
print("DATA PORT RESPONSE: ", data.decode('ascii'))
sock.send(bytes('g r0x24\r', encoding="utf-8"))
data = sock.recv(1024)
print("DATA PORT RESPONSE: ", data.decode('ascii'))
sock.close()