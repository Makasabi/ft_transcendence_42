from channels.middleware import BaseMiddleware

class WebSocketAuthMiddleware(BaseMiddleware):
	def __init__(self, inner):
		self.inner = inner

	async def __call__(self, scope, receive, send):
		print('WebSocketAuthMiddleware')
		# Extract user information from the scope (if available)
		if scope['user'].is_authenticated:
			scope['user'] = scope['user']
		return await super().__call__(scope, receive, send)