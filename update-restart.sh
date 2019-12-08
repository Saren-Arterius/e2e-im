#!/bin/bash
# Update the project and rebuild, then restart server
SCRIPT=$(readlink -f "$0")
SCRIPTPATH=$(dirname "$SCRIPT")
cd $SCRIPTPATH

git pull
docker-compose build
sudo mkdir -p redis/data && sudo chown -R 100:101 redis/data
docker-compose up -d
