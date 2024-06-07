#!/bin/bash

# For some reason, the server needs a volume to work.
# I created an emptyDir because I don't really know better.
# Copying the server.cfg into the emptyDir in the Dockerfile with COPY
# doesn't work. So I'm copying it here.
mv /root/server.cfg /root/.xonotic/data/
/root/Xonotic/server_linux.sh