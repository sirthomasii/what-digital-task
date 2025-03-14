from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import login_user, ProductViewSet

router = DefaultRouter()
router.register(r'products', ProductViewSet)

urlpatterns = [
    path('login/', login_user, name='login'),
    path('', include(router.urls)),
]
