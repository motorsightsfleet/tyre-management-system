FROM php:8.3-cli

RUN apt-get update && apt-get install -y \
    libpq-dev libzip-dev libicu-dev libonig-dev git unzip \
    && docker-php-ext-install pdo pdo_pgsql pgsql zip bcmath intl mbstring \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY composer.json composer.lock ./
RUN composer install --no-scripts --no-autoloader --no-interaction

COPY . .
RUN composer dump-autoload --optimize

EXPOSE 8000

CMD ["sh", "-c", "php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=8000"]
