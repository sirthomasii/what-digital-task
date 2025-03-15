from rest_framework import serializers
from .models import CustomUser, Product

class CustomUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'password')
        extra_kwargs = {
            'password': {'write_only': True},
            'username': {'required': True},
            'email': {'required': True}
        }

    def create(self, validated_data):
        user = CustomUser.objects.create(
            username=validated_data['username'],
            email=validated_data['email'],
            is_active=True
        )
        user.set_password(validated_data['password'])
        user.save()
        return user

class ProductSerializer(serializers.ModelSerializer):
    is_selected = serializers.SerializerMethodField()
    selected_by_usernames = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ('id', 'name', 'description', 'price', 'stock', 'is_selected', 'selected_by_usernames')

    def get_is_selected(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return request.user in obj.selected_by.all()
        return False

    def get_selected_by_usernames(self, obj):
        return [user.username for user in obj.selected_by.all()]
