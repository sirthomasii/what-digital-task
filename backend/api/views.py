from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.token_blacklist.models import (
    OutstandingToken,
    BlacklistedToken,
)
from django.db.models import Q
from .models import Product, CustomUser
from .serializers import ProductSerializer, CustomUserSerializer
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Product.objects.all()
        search = self.request.query_params.get("search", None)

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(description__icontains=search)
            )

        return queryset

    @action(detail=True, methods=["post"])
    def select(self, request, pk=None):
        product = self.get_object()
        user = request.user

        # Toggle selection
        if user in product.selected_by.all():
            product.selected_by.remove(user)
        else:
            product.selected_by.add(user)

        return Response(self.get_serializer(product).data)


@api_view(["POST"])
@permission_classes([AllowAny])
def login_user(request):
    logger.info(f"Received login request with data: {request.data}")

    username = request.data.get("username")
    if not username:
        return Response(
            {"error": "Username is required"}, status=status.HTTP_400_BAD_REQUEST
        )

    # Create or get user
    user, created = CustomUser.objects.get_or_create(
        username=username, defaults={"email": request.data.get("email", "")}
    )

    # Unselect any products previously selected by this user
    user.selected_products.clear()

    refresh = RefreshToken.for_user(user)
    serializer = CustomUserSerializer(user)
    return Response({"token": str(refresh.access_token), **serializer.data})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_user(request):
    try:
        # Get the token from the authorization header
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return Response(
                {"error": "No valid token found"}, status=status.HTTP_400_BAD_REQUEST
            )

        token = auth_header.split(" ")[1]

        # Unselect any products selected by the user
        request.user.selected_products.clear()

        try:
            # Blacklist the token
            token_obj = AccessToken(token)
            # Convert timestamp to datetime
            expires_at = datetime.fromtimestamp(token_obj["exp"], tz=timezone.utc)

            outstanding_token = OutstandingToken.objects.create(
                token=token,
                user_id=request.user.id,
                jti=token_obj["jti"],
                expires_at=expires_at,
            )
            BlacklistedToken.objects.create(token=outstanding_token)
        except Exception as token_error:
            logger.error(f"Error blacklisting token: {str(token_error)}")
            # Even if token blacklisting fails, we've already unselected products
            # Just log the error and return success

        return Response({"message": "Successfully logged out"})
    except Exception as e:
        logger.error(f"Error during logout: {str(e)}")
        return Response(
            {"error": "Failed to logout"}, status=status.HTTP_400_BAD_REQUEST
        )
