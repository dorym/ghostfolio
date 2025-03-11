#!/bin/bash
# build_and_push.sh
# Usage: ./build_and_push.sh <docker_user>

set -e

USERNAME="$1"
IMAGE_NAME="$USERNAME/ghostfolio"
TAG="2.200.0-med"

if [ -z "$USERNAME" ]; then
	echo "Usage: $0 <docker_user>"
	exit 1
fi

# Prompt for password securely
read -s -p "Docker Password: " PASSWORD
echo

echo "Building Docker image: $IMAGE_NAME"
docker build -t "$IMAGE_NAME:$TAG" . --no-cache

docker tag "$IMAGE_NAME:$TAG" "$IMAGE_NAME:latest"

echo "Logging in to Docker registry"
echo "$PASSWORD" | docker login --username "$USERNAME" --password-stdin

echo "Pushing image to $IMAGE_NAME"
docker push "$IMAGE_NAME:$TAG"
docker push "$IMAGE_NAME:latest"

echo "Docker image pushed successfully."
