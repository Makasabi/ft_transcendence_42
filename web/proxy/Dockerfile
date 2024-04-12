FROM nginx

RUN apt update -y && apt upgrade -y
RUN apt-get install vim -y

RUN rm /etc/nginx/conf.d/default.conf
COPY default.conf /etc/nginx/conf.d 
