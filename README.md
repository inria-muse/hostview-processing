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

The app can be also run without file watcher to batch process a set of files. In this case it will just process the files in the configured folder, parse and store all data to the database, and exit.

The app depends on Redis (job queue) and Postgresql database (to store the data). 


## Deployment

The dev and prod deployments are managed as [Docker](https://www.docker.com/) containers. To build the app Docker image, do:

    docker build -t hostview/processing .

You should prepare a new build everytime you update node dependencies in 
the application's package.json, and when you modify the code (unless you have
mounted the application folder on the host).

### Development

To run the app, use Docker Compose (will setup required Redis + Postgresql + App containers):

    docker-compose -f dev.yml up
 
To get a shell access to the app container (will not start the app) with data mounted on the host, do:

    docker run --rm -it -v $PWD/data:/data -e NODE_ENV=development hostview/processing /bin/bash


### Testing

To run all the unit tests (in ./app/test), do:

    docker run --rm -e NODE_ENV=development -e TEST=1 hostview/processing


### Production

To run the app, use Docker Compose:

    docker-compose -f prod.yml up
