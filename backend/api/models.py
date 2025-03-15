from django.db import models
from django.contrib.auth.models import AbstractUser

class CustomUser(AbstractUser):
    username = models.CharField(max_length=150, unique=False)
    email = models.EmailField(blank=True)
    
    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']
    
    class Meta:
        db_table = 'api_user'
        swappable = 'AUTH_USER_MODEL'
        verbose_name = 'user'
        verbose_name_plural = 'users'
        app_label = 'api'
        
    def __str__(self):
        return self.username

class Product(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=200)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.IntegerField(default=0)
    selected_by = models.ForeignKey(
        'CustomUser',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='selected_products'
    )

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'api_product'
