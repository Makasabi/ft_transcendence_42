from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.auth.models import User
from rest_framework.decorators import api_view
from authentification.views import check_token

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
	response = check_token(request)
	if response.status_code != 200:
		return JsonResponse({"error": "You are not authenticated", "data" : response.data}, status=401)
	print("All good")
	if request.user.is_authenticated:
		user = User.objects.get(username=request.user)
		return JsonResponse({"username": user.username, "email": user.email})
	first_user = User.objects.first()
	return JsonResponse({
		"username": first_user.username,
		"email": first_user.email
	})

@api_view(['GET'])
def test(request):
    pass
