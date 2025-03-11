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

# Upgrade

- You want to select a tag which we want to upgrade to.
- Use duplicated test db with .env
- Rebase own changes the new tag.
- First add the prisma migration commits, later we can add the logic commits
- npm install
- npm run database:migrate
- npm run database:generate-typings
- now check build