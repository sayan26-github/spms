#!/usr/bin/env bash
# Render build script for SPMS backend
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate

# Temporary data population for free tier deployment
python generate_new_university.py || true
python populate_all_data.py GTU || true
