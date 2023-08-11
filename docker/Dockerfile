FROM 113.108.106.175:444/cmp/nginx:latest

RUN rm -rf /etc/nginx/conf.d/default.conf

RUN rm -rf /etc/nginx/conf.d/nginx.conf

ADD nginx.conf /etc/nginx/conf.d/nginx.conf

ADD /dist /app/html

CMD ["/bin/bash", "-c", "sed -i \"s@<html@<html env=\"$API_URL\" env_ws=\"$API_WEBSOCKET\"@\" /app/html/index.html; nginx -g \"daemon off;\""]
