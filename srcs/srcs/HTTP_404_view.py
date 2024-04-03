from django.http import HttpResponse
from django.views import View
from django.templatetags.static import static
import os

class HTTP_404View(View):
	def get(self, request, *args, **kwargs):
		return HttpResponse(status=404)
