#!/bin/bash
set -e

echo "Hostview Processing starting in '$NODE_ENV' environment"

if [[ $TEST && ${TEST-x} ]] ; then
    echo "Running all tests ..."
    exec npm test
elif [[ $DEBUG && ${DEBUG-x} ]] ; then
    echo "Starting the debugger ..."
    exec npm run-script debug
else
    exec npm start
fi