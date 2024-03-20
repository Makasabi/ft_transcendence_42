from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.auth.models import User

# Create your views here.
def me(request):
	"""
	Return the first user in the database

	json response format:
	{
		username: "name",
		email: "email@email.fr",
	}
	"""
	if request.user.is_authenticated:
		user = User.objects.get(username=request.user)
		return JsonResponse({"username": user.username, "email": user.email})
	first_user = User.objects.first()
	return JsonResponse({
		"username": first_user.username,
		"email": first_user.email
	})

