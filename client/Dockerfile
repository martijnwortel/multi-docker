FROM node:16-alpine3.12 as builder

WORKDIR /app

COPY package.json ./
RUN npm install
COPY . .

RUN npm run build

FROM nginx:latest
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
COPY --from=builder /app/build /usr/share/nginx/html