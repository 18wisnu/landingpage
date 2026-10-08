FROM nginx:alpine
# Copy file web ke direktori default Nginx
COPY . /usr/share/nginx/html
# Expose port 80
EXPOSE 80