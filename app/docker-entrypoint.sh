#!/bin/sh
set -e

UNAME=nodeuser

# make sure we can access the data directory when mounted on host
chown -R $UNAME /data

# step-down from root and run the given command
exec gosu $UNAME "$@"