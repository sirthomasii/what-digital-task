from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth import get_user_model

CustomUser = get_user_model()

# Register your models here.
admin.site.register(CustomUser, UserAdmin)
