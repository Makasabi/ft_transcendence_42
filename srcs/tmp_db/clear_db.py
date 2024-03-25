# clear_db_users.py

import os
import sys
import django

from pathlib import Path

# Add the path to your Django project to sys.path
sys.path.append(Path(__file__).resolve().parent.parent.__str__())

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'srcs.settings')
django.setup()

from user_management.models import CustomUser
from game_management.models import Game, Play

# Now you can use Django models safely
def clear_database():
    CustomUser.objects.all().delete()
    Game.objects.all().delete()
    Play.objects.all().delete()
    print("All user and game records have been deleted successfully")

if __name__ == "__main__":
    clear_database()

