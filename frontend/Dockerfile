# Grab the latest Node base image
FROM node:16.15-alpine as builder

# Set the current working directory inside the container
WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

ARG REACT_APP_API_BASE_URL
ARG REACT_APP_OAUTH_CALLBACK_URL
ENV REACT_APP_API_BASE_URL $REACT_APP_API_BASE_URL
ENV REACT_APP_OAUTH_CALLBACK_URL $REACT_APP_OAUTH_CALLBACK_URL

COPY . .

RUN yarn run build

# nginx state for serving content
FROM nginx:1.23.1-alpine
COPY ./.nginx/nginx.conf /etc/nginx/nginx.conf
# Set working directory to nginx asset directory
WORKDIR /usr/share/nginx/html
# Remove default nginx static assets
RUN rm -rf ./*
# Copy static assets from builder stage
COPY --from=builder /app/build .

EXPOSE 80

# Containers run nginx with global directives and daemon off
ENTRYPOINT ["nginx", "-g", "daemon off;"]
