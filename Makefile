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