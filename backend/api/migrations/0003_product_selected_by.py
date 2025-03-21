# Generated by Django 5.1.7 on 2025-03-15 14:26

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0002_product"),
    ]

    operations = [
        migrations.AddField(
            model_name="product",
            name="selected_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="selected_products",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
