from django.contrib.auth.backends import BaseBackend
from django.contrib.auth import get_user_model
from django.db import transaction


class AnyCredentialsBackend(BaseBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        User = get_user_model()
        if not username:
            return None

        with transaction.atomic():
            # Get or create user with the given username
            user, created = User.objects.get_or_create(
                username=username,
                defaults={"email": username},  # Use username as email for simplicity
            )
            return user

    def get_user(self, user_id):
        User = get_user_model()
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
