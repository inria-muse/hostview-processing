#!/bin/sh
set -e

UNAME=nodeuser

# make sure we can access the app & data directories even if mounted on host
chown -R $UNAME /app
chown -R $UNAME /data

# step-down from root and run the given command
exec gosu $UNAME "$@"