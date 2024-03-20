from django.http import HttpResponse
from django.views import View
from django.templatetags.static import static
import os

class SPAView(View):
	def get(self, request, *args, **kwargs):
		base_path = static('pages/base.html').replace('/front/', 'front/')
		base_path = os.path.join(os.getcwd(), "srcs", base_path)
		with open(base_path, 'r') as file:
			return HttpResponse(file.read())
