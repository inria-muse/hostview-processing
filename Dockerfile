# current stable LTS node on top of debian image
FROM node:4.4.7-wheezy

# install data processing tools
RUN apt-get update && apt-get -y install libpcap-dev gzip dtrx libtrace-tools python python-dev python-pip && pip install --index-url=https://pypi.python.org/simple/ psycopg2 sqlalchemy

# install tcptrace from source
COPY tcptrace-src /tmp/tcptrace
RUN cd /tmp/tcptrace && ./configure && make && cp tcptrace /usr/bin/

# create non-root user account
RUN groupadd -r nodeuser && useradd -r -g nodeuser nodeuser

# create and expose the volume for the data
RUN mkdir /data && chown nodeuser:nodeuser /data
VOLUME /data

# install node modules to tmp to create a layer with dependencies installed
ADD app/package.json /tmp/package.json
RUN cd /tmp && npm install

# create and populate the main app folder
RUN mkdir /app && cp -a /tmp/node_modules /app && chown -R nodeuser:nodeuser /app
COPY app /app

# create and populate the python code folder
RUN mkdir /python && chown -R nodeuser:nodeuser /python
COPY python-src /python

ENV NODE_ENV production

WORKDIR /app

USER nodeuser

CMD ["/app/run.sh"]