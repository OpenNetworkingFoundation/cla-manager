# opennetworking/clam-ci
# Docker image used to run CI jobs
FROM node:10

RUN apt-get update && apt-get install -y --no-install-recommends \
    software-properties-common \
    && rm -rf /var/lib/apt/lists/*

# Firestore emulator requires Java
RUN apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys 0xB1998361219BD9C9 \
    && apt-add-repository 'deb http://repos.azulsystems.com/debian stable main'

RUN apt-get update && apt-get install -y --no-install-recommends \
    zulu-11 \
    && rm -rf /var/lib/apt/lists/*
