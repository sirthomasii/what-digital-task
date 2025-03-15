from django.shortcuts import render
from rest_framework import status, viewsets, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.contrib.auth import authenticate
from django.db.models import Q
from .models import Product, CustomUser
from .serializers import ProductSerializer, CustomUserSerializer
import logging

logger = logging.getLogger(__name__)

class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Product.objects.all()
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search)
            )
        return queryset

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
