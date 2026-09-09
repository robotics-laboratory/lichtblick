# Build stage
FROM node:22 AS build
WORKDIR /src
COPY --exclude=entrypoint.sh . ./

# FIXME: Split install and build into separate layers to improve caching
RUN corepack enable
RUN yarn install --immutable

RUN yarn run web:build:prod

# Release stage
FROM caddy:2.5.2-alpine
WORKDIR /src
COPY --from=build /src/web/.webpack ./
COPY entrypoint.sh /entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["/bin/sh", "/entrypoint.sh"]
CMD ["caddy", "file-server", "--listen", ":8080"]
