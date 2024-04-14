#!/bin/bash

python3 manage.py makemigrations game
python3 manage.py makemigrations && python3 manage.py migrate
if [ $DEBUG = 1 ]; then python3 manage.py runserver 0.0.0.0:8004; else gunicorn wsgi:application --bind 0.0.0.0:8004; fi
