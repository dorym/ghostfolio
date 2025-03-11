# Build docker image

Build image for current version.
Add :latest tag.
Push both.

Example:

``` shell
# Define the tag number
tag_number="2.142.0-med"

docker build -t "leoparm/ghostfolio:$tag_number" . --no-cache
docker tag "leoparm/ghostfolio:$tag_number" "leoparm/ghostfolio:latest"

docker push "leoparm/ghostfolio:$tag_number"
docker push "leoparm/ghostfolio:latest"
```
