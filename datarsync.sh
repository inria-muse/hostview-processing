#!/bin/sh

# Rsync script to copy raw hostview data from the upload server to processing server.
#
# run this script peridically with cron at ucn.paris.inria.fr, e.g. sudo -u ucndata crontab -l/-e:
#
# 0 * * * * /home/ucndata/hostview-processing/datarsync.sh > /home/ucndata/hostviewupload.log 2>&1
#

# config
RUSER=apietila
RHOST=muse2.paris.inria.fr

# rsync opts
OPTS='-av -e /usr/bin/ssh --remove-source-files'

# root data directory on muse2.paris.inria.fr
DATASRC=/home/nodeapp/hostviewdata/

# root data directory on ucn.paris.inria.fr
DATADST=/home/ucndata/hostview2016/incoming/

/usr/bin/rsync $OPTS $RUSER@$RHOST:$DATASRC $DATADST