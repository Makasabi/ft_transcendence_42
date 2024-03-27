from colorama import *
from django.test import TestCase
from rest_framework.test import APIRequestFactory
from django.contrib.auth.models import User
from .views import *

print(Fore.GREEN + "Starting test")
print(Fore.WHITE)

factory = APIRequestFactory()
user = User.objects.get(username='tito')
fake_token = 'erg89w7n58fg345f5fh438'
token = Token.objects.get(user=user)

token_request = factory.get('api/auth', {'token': token.key}, format='json', HTTP_AUTHORIZATION="Token " + token.key)
login_request = factory.post('api/auth/login', {'username' : 'tito', 'password' : 'titi'}, format='json')
print(token_request.headers)
response = test_token(token_request)

print(response.data)

print(Fore.GREEN + "\nEnd of test")
print(Style.RESET_ALL)
