from rest_framework import permissions
from rest_framework.exceptions import NotAuthenticated, AuthenticationFailed
import requests

class NotifPermission(permissions.BasePermission):
    def has_permission(self, request, view):
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
