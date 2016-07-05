# Hostview Processing

Hostview Processing contains the data processing scripts that store the raw files (sqlite dbs and pcaps) from Hostview clients (received with hostview-upload) to the backend database. The basic workflow is as follows:

* a master process is watching new files in an incoming folder
* when a new file is received, a processing task is queued on the task queue
* a free worker process picks up the processing task from the queue and records the data to the db
* the worker notifies the master process of the success/failure of the task processing
* on failure, the master will requeue (up to number of times) the task
* on success, the file is moved to the permanent storage location
* on repeated failures, the file is moved to a separate failed files folder for manual inspection

This workflow is implemented with a node.js cluster and a Redis backed job queue.

The app can be run without the file watcher to batch process a set of files. In this case it will just process the files in the configured folder, parse and store all data to the database, and exit.

The app depends on Redis (job queue) and Postgresql database (to store the data).

TODO: how to deal with (pcap) files that fail when the corresponding session has not been processed yet (the retries + delay can fix most cases, but it can still happen ...)


## Deployment

The dev and prod deployments are managed as [Docker](https://www.docker.com/) containers.

Docker volume sharing makes storing the raw files on the host a bit tricky as the user ids of the container and the host do not match ... The current solution is to make sure the /data mount point on the host is writable by everyone. Check the configuration before running the containers.


### Development

To (re)build the app image, use Docker Compose:

    docker-compose -f dev.yml build

To run the app, use Docker Compose (will start required Redis + Postgresql + App containers):

    docker-compose -f dev.yml up
 
To get a shell access to the app container (will not start the app) with data mounted on the host, do:

    docker run --rm -it -e NODE_ENV=development hostview/processing /bin/bash


### Testing

To run all the unit tests (in ./app/test), first make sure a postgres is running somewhere (e.g. in a container from above):

    $ docker ps -a // list all containers
    $ docker network ls // list networks
    $ docker start <postgres:9.5 container id>

Then run the processing app container with the test flag (make sure to link to the postgres container or point to a valid hostview db):

    $ docker run --rm --net=<hostview_back-tier> --link <postgres:9.5 container name>:postgres -e NODE_ENV=development -e TEST=1 -e PROCESS_DB=postgres://hostview:h0stvi3w@postgres/hostview hostview/processing


### Production

To run the app, use Docker Compose (will start Redis + App containers, with on host Postgresql):

    PROCESS_DB=postgres://<user>:<password>@ucn.inria.fr/hostview docker-compose -f prod.yml -d up
