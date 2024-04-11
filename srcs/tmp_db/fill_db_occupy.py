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

def import_occupants(csv_file):
    try:
        with open(csv_file, 'r') as file:
            reader = csv.reader(file)
            for row in reader:
                if len(row) != 3:
                    print("Invalid CSV format. Each row should have three columns: room_id, player_id, is_master")
                    return
                room_id, player_id, is_master = row
                room = Rooms.objects.filter(room_id=room_id).first()
                if room is None:
                    print(f'Room "{room_id}" does not exist. Skipping...')
                    continue
                Occupy.objects.create(room_id=room, player_id=player_id, is_master=is_master)
                print(f'Occupant "{player_id}" added to room "{room_id}"')

    except FileNotFoundError:
        print("File not found. Please provide a valid CSV file path.")

if __name__ == "__main__":
	if len(sys.argv) < 2:
		print("Usage: python users_db_creation.py <csv_file>")
		sys.exit(1)
	csv_file = sys.argv[1]
	import_occupants(csv_file)
