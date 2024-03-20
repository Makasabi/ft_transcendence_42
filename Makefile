run:
	@if [ ! -d "venv" ]; then echo "\033[93mPlease create a virtual environment first. Check the README.md for some help ;)\033[0m"; exit 1; fi
	@if [ ! -e ".env" ]; then echo "\033[93mPlease create a .env file first. Check the README.md for some help ;)\033[0m"; exit 1; fi
	@if [ ! -e "srcs/db.sqlite3" ]; then echo "\033[93mPlease run the migrate command first. Check the README.md for some help ;)\033[0m"; exit 1; fi
	venv/bin/python3 srcs/manage.py runserver

migrate:
	@if [ ! -d "venv" ]; then echo "\033[93mPlease create a virtual environment first. Check the README.md for some help ;)\033[0m"; exit 1; fi
	@if [ ! -e ".env" ]; then echo "\033[93mPlease create a .env file first. Check the README.md for some help ;)\033[0m"; exit 1; fi
	venv/bin/python3 srcs/manage.py makemigrations
	venv/bin/python3 srcs/manage.py migrate

update_venv:
	@if [ ! -d "venv" ]; then echo "\033[93mPlease create a virtual environment first. Check the README.md for some help ;)\033[0m"; exit 1; fi
	@venv/bin/pip3 install --upgrade pip
	@venv/bin/pip3 install -r requirements.txt

create_key:
	@if [ ! -d "venv" ]; then echo "\033[93mPlease create a virtual environment first. Check the README.md for some help ;)\033[0m"; exit 1; fi
	@if [ ! -e ".env" ]; then echo "\033[93mPlease create a .env file first. Check the README.md for some help ;)\033[0m"; exit 1; fi
	@venv/bin/python3 srcs/manage.py shell -c "from django.core.management import utils; print('DJANGO_SECRET_KEY=', utils.get_random_secret_key(), sep='')"

fill_db: migrate
	@if [ ! -d "venv" ]; then echo "\033[93mPlease create a virtual environment first. Check the README.md for some help ;)\033[0m"; exit 1; fi
	@venv/bin/python3 srcs/tmp_db/fill_db_users.py srcs/tmp_db/db_users.csv