#!/bin/sh
set -e

if grep -q '^APP_KEY=$' .env 2>/dev/null; then
  php artisan key:generate --force
fi

if grep -q '^JWT_SECRET=$' .env 2>/dev/null; then
  php artisan jwt:secret --force
fi

php artisan migrate --force

exec php artisan serve --host=0.0.0.0 --port=8000
