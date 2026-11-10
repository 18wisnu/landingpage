FROM nginx:1.27-alpine
# Landing page statis. Transaksi & pembayaran ada di https://gayatricorp.mixradius.com
COPY public/ /usr/share/nginx/html/
RUN printf 'server_tokens off;\nadd_header X-Content-Type-Options nosniff always;\nadd_header Referrer-Policy strict-origin-when-cross-origin always;\n' > /etc/nginx/conf.d/security.conf
EXPOSE 80
