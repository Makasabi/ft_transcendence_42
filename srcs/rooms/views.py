from django.shortcuts import render
from django.http import JsonResponse
from user_management.models import Player
from game.models import Play
from rest_framework.decorators import api_view

# Create your views here.
@api_view(['POST'])
def create_normal(request):
	pass

@api_view(['POST'])
def create_tournament(request):
	pass