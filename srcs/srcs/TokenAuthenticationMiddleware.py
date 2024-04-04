from channels.auth import AuthMiddlewareStack
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import AnonymousUser
from django.db import close_old_connections
from channels.db import database_sync_to_async

class TokenAuthMiddleware:
	"""
	Token authorization middleware for Django Channels 2
	"""

	def __init__(self, app):
		self.app = app

	async def __call__(self, scope, receive, send):
		headers = scope.get('headers', [])
		cookies = [items for items in headers if items[0] == b'cookie']
		scope['user'] = AnonymousUser()
		if len(cookies) == 0:
			return await self.app(scope, receive, send)
		cookies = [cookie.strip() for cookie in cookies[0][1].decode().split(';')]
		token_key = list(filter(lambda x: x.startswith('token='), cookies))[0].split('=')[1]
		if token_key:
			user = await database_sync_to_async(get_user)(token_key)
			if not user:
				return await self.app(scope, receive, send)
			scope['user'] = user
			close_old_connections()
		return await self.app(scope, receive, send)

def get_user(token_key):
	try:
		token = Token.objects.get(key=token_key)
		return token.user
	except Token.DoesNotExist:
		return None

def TokenAuthMiddlewareStack(app):
	return TokenAuthMiddleware(AuthMiddlewareStack(app))