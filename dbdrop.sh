#!/bin/bash

# small helper to drop all tables from a give db
DB=$1

echo dropping tables from ${DB}

PGDB="-h localhost -W -U hostview ${DB}"

TABLES=`psql $PGDB -t --command "SELECT string_agg(table_name, ',') FROM information_schema.tables WHERE table_schema='public'"`

echo dropping tables:${TABLES}

#psql $PGDB --command "DROP TABLE IF EXISTS ${TABLES} CASCADE"