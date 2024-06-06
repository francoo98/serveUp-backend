#!/bin/bash

# This is needed to workaround a bug in the Xonotic server
# The server needs to create the keys and then be restarted
# to be able to read them. It doesn't read them in the first start.
# A volume is needed to persist the keys. I created an emptyDir 
# because I don't really know better.
# Copying the server.cfg into the emptyDir in the Dockerfile with COPY
# doesn't work. So I'm copying it here.
mv /root/server.cfg /root/.xonotic/data/
/root/Xonotic/server_linux.sh