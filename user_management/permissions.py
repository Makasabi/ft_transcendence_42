from rest_framework import permissions
from rest_framework import authentication
from decouple import config

class IsAuthenticatedOrApp(permissions.BasePermission):
	"""
	Allows access only to authenticated users.
	"""
	keyword = 'App'
	key = config('APP_KEY')

	def has_permission(self, request, view):
		return bool(request.user and request.user.is_authenticated) or self.is_app(request)

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
