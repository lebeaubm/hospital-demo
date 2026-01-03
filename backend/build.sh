#!/usr/bin/env bash
# exit on error
set -o errexit

pip install -r requirements.txt

python manage.py collectstatic --no-input
python manage.py migrate

# Create a default superuser if DJANGO_SUPERUSER_EMAIL is set
if [ -n "$DJANGO_SUPERUSER_EMAIL" ]; then
    python manage.py createsuperuser --noinput --email "$DJANGO_SUPERUSER_EMAIL" || echo "Superuser already exists"
fi
