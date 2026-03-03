#!/usr/bin/env bash
# exit on error
set -o errexit

pip install -r requirements.txt

python manage.py collectstatic --no-input
python manage.py migrate

# Create test accounts (safe to re-run — uses get_or_create)
python manage.py create_demo_accounts
python manage.py create_jane_christ
python manage.py create_jack_christ
