run:
	@if [ ! -d "venv" ]; then echo "\033[93mPlease create a virtual environment first. Check the README.md for some help ;)\033[0m"; exit 1; fi
	@if [ ! -e ".env" ]; then echo "\033[93mPlease create a .env file first. Check the README.md for some help ;)\033[0m"; exit 1; fi
	@if [ ! -e "srcs/db.sqlite3" ]; then echo "\033[93mPlease run the migrate command first. Check the README.md for some help ;)\033[0m"; exit 1; fi
	venv/bin/python3 srcs/manage.py runserver

init:
	-make create_venv
	-make create_env
	-make migrate
	-make fill_db
	-cd srcs && npm install

create_venv:
	@if [ -d "venv" ]; then echo "\033[93mVirtual environment already exists. If you want to recreate it, please delete the venv folder first.\033[0m"; exit 1; fi
	@python3 -m venv venv
	@make update_venv

update_venv:
	@if [ ! -d "venv" ]; then echo "\033[93mPlease create a virtual environment first. Check the README.md for some help ;)\033[0m"; exit 1; fi
	@venv/bin/pip3 install --upgrade pip
	@venv/bin/pip3 install -r requirements.txt

create_env:
	@if [ -e ".env" ]; then echo "\033[93m.env file already exists. If you want to recreate it, please delete the .env file first.\033[0m"; exit 1; fi
	@echo > .env "DJANGO_SECRET_KEY=$(shell venv/bin/python3 srcs/manage.py shell -c 'from django.core.management import utils; print(utils.get_random_secret_key())')"

migrate:
	@if [ ! -d "venv" ]; then echo "\033[93mPlease create a virtual environment first. Check the README.md for some help ;)\033[0m"; exit 1; fi
	@if [ ! -e ".env" ]; then echo "\033[93mPlease create a .env file first. Check the README.md for some help ;)\033[0m"; exit 1; fi
	venv/bin/python3 srcs/manage.py makemigrations
	venv/bin/python3 srcs/manage.py migrate

create_key:
	@if [ ! -d "venv" ]; then echo "\033[93mPlease create a virtual environment first. Check the README.md for some help ;)\033[0m"; exit 1; fi
	@if [ ! -e ".env" ]; then echo "\033[93mPlease create a .env file first. Check the README.md for some help ;)\033[0m"; exit 1; fi
	@venv/bin/python3 srcs/manage.py shell -c "from django.core.management import utils; print('DJANGO_SECRET_KEY=', utils.get_random_secret_key(), sep='')"

fill_db: migrate
	@if [ ! -d "venv" ]; then echo "\033[93mPlease create a virtual environment first. Check the README.md for some help ;)\033[0m"; exit 1; fi
	@venv/bin/python3 srcs/tmp_db/fill_db_users.py srcs/tmp_db/db_users.csv