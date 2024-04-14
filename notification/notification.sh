#!/bin/bash

python3 manage.py makemigrations notification
python3 manage.py makemigrations && python3 manage.py migrate
if [ $DEBUG = 1 ]; then python3 manage.py runserver 0.0.0.0:8002; else gunicorn wsgi:application --bind 0.0.0.0:8002; fi
