from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
import logging

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    logger.info(f"Received login request with data: {request.data}")
    
    username = request.data.get('username')
    if not username:
        return Response({'error': 'Username is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Authenticate with our custom backend
    user = authenticate(request, username=username)
    if user:
        refresh = RefreshToken.for_user(user)
        return Response({
            'token': str(refresh.access_token),
            'user': {
                'username': user.username,
                'email': user.email
            }
        })
    
    return Response({'error': 'Authentication failed'}, status=status.HTTP_401_UNAUTHORIZED)
