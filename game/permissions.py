from rest_framework import permissions, authentication
from rest_framework.exceptions import NotAuthenticated, AuthenticationFailed
import requests
from decouple import config

class GamePermission(permissions.BasePermission):
	keyword = 'App'
	key = config('APP_KEY')

	def has_permission(self, request, view):
		if self.is_app(request):
			return True
		token = request.META.get('HTTP_AUTHORIZATION')
		try:
			test = token.split('Token ')[1]
		except Exception as e:
			raise NotAuthenticated('Do not have token in request header')
		response = requests.get(
			'http://proxy/api/auth',
			headers = {'Authorization': token}
		)
		if response.status_code != 200:
			print(response)
			raise AuthenticationFailed('Could not found token in database')
		return True

	def is_app(self, request):
		auth = authentication.get_authorization_header(request).split()

		if not auth or auth[0].lower() != self.keyword.lower().encode():
			return False

		if len(auth) == 1 or len(auth) > 2:
			return False

		try:
			key = auth[1].decode()
		except UnicodeError:
			return False
		return key == self.key
