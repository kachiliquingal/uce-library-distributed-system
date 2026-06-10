FROM nginx:alpine

# Copy the template file
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Nginx Alpine image automatically processes files in /etc/nginx/templates
# ending in .template using envsubst before starting.

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
