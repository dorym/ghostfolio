# Build docker image

Build image for current version.
Add :latest tag.
Push both.

Example:

```shell
# Define the tag number
tag_number="2.142.0-med"

docker build -t "leoparm/ghostfolio:$tag_number" . --no-cache
docker tag "leoparm/ghostfolio:$tag_number" "leoparm/ghostfolio:latest"

docker push "leoparm/ghostfolio:$tag_number"
docker push "leoparm/ghostfolio:latest"
```

# Postgres backup and testing

```
pg_dump  -h 192.168.1.100 -Fc -U user -d ghostfolio-db > ~/ghostfolio-db.15052025.dump
createdb  -h 192.168.1.100 -U user ghostfolio-db-test
pg_restore -h 192.168.1.100 -U user -d ghostfolio-db-test ~/ghostfolio-db.15052025.dump

dropdb  -h 192.168.1.100 -U user ghostfolio-db-test
```
