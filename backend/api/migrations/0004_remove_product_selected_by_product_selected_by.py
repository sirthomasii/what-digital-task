# Generated by Django 5.1.7 on 2025-03-15 14:53

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0003_product_selected_by"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="product",
            name="selected_by",
        ),
        migrations.AddField(
            model_name="product",
            name="selected_by",
            field=models.ManyToManyField(
                blank=True,
                related_name="selected_products",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
