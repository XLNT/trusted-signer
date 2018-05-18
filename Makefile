SHELL:?/bin/bash

build:
	docker build -t shrugs/trusted-signer:latest .

push:
	docker push shrugs/trusted-signer:latest

all: build push
