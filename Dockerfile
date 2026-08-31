# Tahap 1: Build Frontend (Inertia + React via Vite)
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

# Tahap 2: Runtime Laravel
FROM php:8.3-fpm

# Install dependencies sistem & ekstensi PHP yang sering dipakai Laravel
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    libzip-dev

# Clear cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install ekstensi PHP
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www

# Copy seluruh file project
COPY . .

# Copy hasil build asset React dari tahap 1 ke public/build
COPY --from=frontend-builder /app/public/build ./public/build

# Install dependency PHP (production/development)
RUN composer install --no-interaction --prefer-dist --optimize-autoloader

# Berikan hak akses untuk storage dan bootstrap/cache
RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache

EXPOSE 9000
CMD ["php-fpm"]