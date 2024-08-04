# Grab the latest Node base image
FROM node:18.16.0-alpine as builder

# Set the current working directory inside the container
WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

ARG VITE_API_BASE_URL
ARG VITE_OAUTH_CALLBACK_URL
ENV VITE_API_BASE_URL $VITE_API_BASE_URL
ENV VITE_OAUTH_CALLBACK_URL $VITE_OAUTH_CALLBACK_URL

COPY . .

RUN yarn run build

FROM node:18.16.0-alpine as chaos-docs-builder

WORKDIR /chaos-docs

# Copy chaos-docs package.json and yarn.lock
COPY ../chaos-docs/package.json ../chaos-docs/yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy the rest of the chaos-docs files and build
COPY ../chaos-docs ./
RUN npm run generate-docs
RUN npm run build

# nginx state for serving content
FROM nginx:1.25.0-alpine
COPY ./.nginx/nginx.conf /etc/nginx/nginx.conf
# Set working directory to nginx asset directory
WORKDIR /usr/share/nginx/html
# Remove default nginx static assets
RUN rm -rf ./*
# Copy static assets from builder stage
COPY --from=builder /app/dist .

EXPOSE 80

# Containers run nginx with global directives and daemon off
ENTRYPOINT ["nginx", "-g", "daemon off;"]
