#!/bin/bash
# Spin up dev server
SCRIPT=$(readlink -f "$0")
SCRIPTPATH=$(dirname "$SCRIPT")
cd $SCRIPTPATH

sudo mkdir -p redis/data && sudo chown -R 100:101 redis/data
sudo docker-compose up -d
docker-compose logs --tail=1000 -f app
