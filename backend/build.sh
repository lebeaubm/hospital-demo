#!/usr/bin/env bash
# exit on error
set -o errexit

pip install -r requirements.txt

python manage.py collectstatic --no-input
python manage.py migrate

# Optional demo data seeding
# Set SEED_DEMO_DATA=true in environment when you intentionally want demo/test accounts.
if [ "${SEED_DEMO_DATA:-false}" = "true" ]; then
	python manage.py create_demo_accounts
	python manage.py create_jane_christ
	python manage.py create_jack_christ
fi
