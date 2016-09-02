#!/bin/bash

# small helper script to drop all tables from a given db
DB=$1
if [ -n "${DB+1}" ]; then
while true; do
    read -p "Do you really want to drop all tables from ${DB} [yn] ? " yn
    case $yn in
        [Yy]* ) break;;
        [Nn]* ) echo "Exiting ..."; exit;;
        * ) echo "Please answer yes [Yy] or no [Nn].";;
    esac
done
else
  echo "Usage: ./dbdrop <db>"
  exit
fi

PGDB="-h localhost -W -U hostview ${DB}"
TABLES=`psql $PGDB -t --command "SELECT string_agg(table_name, ',') FROM information_schema.tables WHERE table_schema='public'"`

echo "Dropping tables:${TABLES}"

psql $PGDB --command "DROP TABLE IF EXISTS ${TABLES} CASCADE"