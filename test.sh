#!/bin/bash

docker exec -it wriolocaldev_webgold_1 bash -c "export WRIO_CONFIG=config.json.tests && gulp test --grep $1"