FROM nginx

RUN apt update -y && apt upgrade -y
RUN apt-get install vim -y

COPY ./html /usr/share/nginx/html
COPY nginx_server.key /etc/nginx/ssl/nginx_server.key
COPY nginx_server.crt /etc/nginx/ssl/nginx_server.crt
RUN rm /etc/nginx/conf.d/default.conf
COPY default.conf /etc/nginx/conf.d 
