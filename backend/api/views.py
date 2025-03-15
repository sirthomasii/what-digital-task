from django.shortcuts import render
from rest_framework import status, viewsets, filters
from rest_framework.decorators import api_view, permission_classes, action
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
    ordering_fields = ['name', 'description', 'price', 'stock']
    ordering = ['name']  # default sorting

    def get_queryset(self):
        queryset = Product.objects.all()
        search = self.request.query_params.get('search', None)
        sort_by = self.request.query_params.get('sort_by', 'name')
        sort_order = self.request.query_params.get('sort_order', 'asc')

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search)
            )
        
        # Handle sorting
        if sort_by in self.ordering_fields:
            if sort_order == 'desc':
                sort_by = f'-{sort_by}'
            queryset = queryset.order_by(sort_by)

        return queryset

    @action(detail=True, methods=['post'])
    def select(self, request, pk=None):
        product = self.get_object()
        user = request.user
        
        # If product is already selected by someone else
        if product.selected_by and product.selected_by != user:
            return Response(
                {'error': 'Product already selected by another user'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Toggle selection
        if product.selected_by == user:
            product.selected_by = None
        else:
            product.selected_by = user
        
        product.save()
        return Response(self.get_serializer(product).data)

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
