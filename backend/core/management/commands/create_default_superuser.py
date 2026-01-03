from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
import os


class Command(BaseCommand):
    help = 'Creates a default superuser if it does not exist'

    def handle(self, *args, **options):
        User = get_user_model()
        
        email = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'admin@example.com')
        password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'Admin123!Secure')
        first_name = os.environ.get('DJANGO_SUPERUSER_FIRST_NAME', 'Admin')
        last_name = os.environ.get('DJANGO_SUPERUSER_LAST_NAME', 'User')
        
        if not User.objects.filter(email=email).exists():
            User.objects.create_superuser(
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                role='STAFF'
            )
            self.stdout.write(self.style.SUCCESS(f'✅ Superuser created: {email}'))
        else:
            self.stdout.write(self.style.WARNING(f'⚠️  Superuser already exists: {email}'))
