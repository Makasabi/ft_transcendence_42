# users_db_creation.py

import os
import sys
import csv
import django

from pathlib import Path
sys.path.append(Path(__file__).resolve().parent.parent.__str__())

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'srcs.settings')

django.setup()

# from django.contrib.auth.models import User
from django.contrib.auth import get_user_model
from rooms.models import Rooms, Occupy

def import_rooms(csv_file):
	try:
		with open(csv_file, 'r') as file:
			reader = csv.reader(file)
			for row in reader:
				if len(row) != 5:
					print("Invalid CSV format. Each row should have five columns: room_id, date, mode, visibility and code")
					return
				room_id, date, mode, visibility, code = row
				# Player = get_user_model()
				if Rooms.objects.filter(room_id=room_id).exists():
					print(f'Room "{room_id}" already exists')
				else:
					Rooms.objects.create(room_id=room_id, date=date, roomMode=mode, visibility=visibility, code=code)
					print(f'Room "{room_id}" created successfully')

	
	except FileNotFoundError:
		print("File not found. Please provide a valid CSV file path.")

if __name__ == "__main__":
	if len(sys.argv) < 2:
		print("Usage: python users_db_creation.py <csv_file>")
		sys.exit(1)
	csv_file = sys.argv[1]
	import_rooms(csv_file)
