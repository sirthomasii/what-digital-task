from django.shortcuts import render
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import Product, CustomUser
from .serializers import ProductSerializer, CustomUserSerializer
import logging

logger = logging.getLogger(__name__)

class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    logger.info(f"Received login request with data: {request.data}")
    
    username = request.data.get('username')
    if not username:
        return Response({'error': 'Username is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Create or get user
    user, created = CustomUser.objects.get_or_create(
        username=username,
        defaults={'email': request.data.get('email', '')}
    )
    
    refresh = RefreshToken.for_user(user)
    serializer = CustomUserSerializer(user)
    return Response({
        'token': str(refresh.access_token),
        **serializer.data
    })
