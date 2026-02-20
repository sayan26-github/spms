"""
Management command to create a new College and its Admin user.

Usage:
    python manage.py create_college_admin \
        --name "Delhi Technical University" \
        --code DTU \
        --email admin@dtu.ac.in \
        --phone 011-2345-6789 \
        --admin-reg ADMIN001 \
        --password securepass123 \
        --admin-first Admin \
        --admin-last DTU \
        --admin-email admin@dtu.ac.in
"""

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.academics.models import College
from apps.common.constants import UserRole
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Creates a new College and an Admin user for that college.'

    def add_arguments(self, parser):
        """Define CLI arguments for college and admin creation."""
        # --- College fields ---
        parser.add_argument(
            '--name', type=str, required=True,
            help='Full name of the college (e.g. "Delhi Technical University")'
        )
        parser.add_argument(
            '--code', type=str, required=True,
            help='Unique short code for the college (e.g. "DTU")'
        )
        parser.add_argument(
            '--email', type=str, default='',
            help='College contact email'
        )
        parser.add_argument(
            '--phone', type=str, default='',
            help='College contact phone'
        )
        parser.add_argument(
            '--address', type=str, default='',
            help='College address'
        )

        # --- Admin user fields ---
        parser.add_argument(
            '--admin-reg', type=str, default='ADMIN001',
            help='Registration number for the admin (default: ADMIN001)'
        )
        parser.add_argument(
            '--password', type=str, default='password123',
            help='Password for the admin user (default: password123)'
        )
        parser.add_argument(
            '--admin-first', type=str, default='Admin',
            help='Admin first name (default: Admin)'
        )
        parser.add_argument(
            '--admin-last', type=str, default='User',
            help='Admin last name (default: User)'
        )
        parser.add_argument(
            '--admin-email', type=str, default='',
            help='Admin user email'
        )

    def handle(self, *args, **options):
        """Create a college and its admin atomically."""
        college_code = options['code'].upper().strip()
        college_name = options['name'].strip()
        admin_reg = options['admin_reg'].strip()

        # --- Validate inputs ---
        if not college_name:
            raise CommandError('College name cannot be empty.')
        if not college_code:
            raise CommandError('College code cannot be empty.')

        # --- Check for duplicates ---
        if College.objects.filter(code=college_code).exists():
            raise CommandError(
                f'College with code "{college_code}" already exists. '
                f'Use a different code.'
            )

        try:
            with transaction.atomic():
                # 1. Create College
                college = College.objects.create(
                    name=college_name,
                    code=college_code,
                    contact_email=options['email'],
                    contact_phone=options['phone'],
                    address=options['address'],
                )
                self.stdout.write(self.style.SUCCESS(
                    f'✅ College created: {college.name} ({college.code})'
                ))

                # 2. Create Admin user
                admin_user = User.objects.create_superuser(
                    registration_number=admin_reg,
                    password=options['password'],
                    college=college,
                    email=options['admin_email'],
                    first_name=options['admin_first'],
                    last_name=options['admin_last'],
                    role=UserRole.ADMIN,
                )
                self.stdout.write(self.style.SUCCESS(
                    f'✅ Admin created: {admin_user.username}'
                ))

                # 3. Print login summary
                self.stdout.write('')
                self.stdout.write(self.style.NOTICE('--- Login Credentials ---'))
                self.stdout.write(f'  College Code : {college_code}')
                self.stdout.write(f'  Reg Number   : {admin_reg}')
                self.stdout.write(f'  Username     : {admin_user.username}')
                self.stdout.write(f'  Password     : {options["password"]}')
                self.stdout.write(self.style.WARNING(
                    '⚠️  Change the default password after first login!'
                ))

        except Exception as exc:
            raise CommandError(f'Failed to create college/admin: {exc}')
