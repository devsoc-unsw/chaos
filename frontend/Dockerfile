# Grab the latest Node base image
FROM node:18.16.0-alpine as builder

# Set the current working directory inside the container
WORKDIR /app

COPY frontend/package.json frontend/yarn.lock ./
RUN yarn install --frozen-lockfile

ARG VITE_API_BASE_URL
ARG VITE_OAUTH_CALLBACK_URL
ENV VITE_API_BASE_URL $VITE_API_BASE_URL
ENV VITE_OAUTH_CALLBACK_URL $VITE_OAUTH_CALLBACK_URL

COPY frontend ./

RUN yarn run build

FROM node:18.16.0-alpine as chaos-docs-builder

WORKDIR /docs

# Copy chaos-docs files and install dependencies
COPY docs/package.json docs/yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy the rest of the chaos-docs files and build
COPY docs ./
RUN yarn run generate-docs
RUN yarn run build


# nginx state for serving content
FROM nginx:1.25.0-alpine
COPY ./frontend/.nginx/nginx.conf /etc/nginx/nginx.conf
# Set working directory to nginx asset directory
WORKDIR /usr/share/nginx/html
# Remove default nginx static assets
RUN rm -rf ./*
# Copy static assets from builder stage
COPY --from=builder /app/dist .
COPY --from=chaos-docs-builder /docs/build ./docs

EXPOSE 80

# Containers run nginx with global directives and daemon off
ENTRYPOINT ["nginx", "-g", "daemon off;"]
