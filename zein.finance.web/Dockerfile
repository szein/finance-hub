#Build
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

ARG API_URL
ENV VITE_FINANCE_API_URL=$API_URL

RUN echo "API URL=$VITE_FINANCE_API_URL"

RUN npm run build

RUN echo "Done"

#Deploy
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]