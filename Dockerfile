# current stable LTS on top of debian image
FROM node:4.4.4-wheezy

# hostview uses special archiver
RUN apt-get update && apt-get -y install dtrx

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

ENV NODE_ENV production

WORKDIR /app

USER nodeuser

CMD ["/app/run.sh"]