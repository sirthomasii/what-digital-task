from django.core.management.base import BaseCommand
from faker import Faker
from api.models import Product
import random

fake = Faker()

PRODUCT_CATEGORIES = [
    "Electronics",
    "Books",
    "Clothing",
    "Home & Kitchen",
    "Sports",
    "Toys",
    "Beauty",
    "Automotive",
    "Health",
    "Garden",
]


class Command(BaseCommand):
    help = "Seed product data"

    def add_arguments(self, parser):
        parser.add_argument(
            "--count", type=int, default=10, help="Number of products to create"
        )

    def handle(self, *args, **options):
        count = options["count"]
        self.stdout.write("Seeding product data...")

        for _ in range(count):
            category = random.choice(PRODUCT_CATEGORIES)
            name = f"{fake.unique.word()} {category}"
            Product.objects.create(
                name=name,
                description=fake.paragraph(nb_sentences=1),
                price=round(random.uniform(9.99, 999.99), 2),
                stock=random.randint(0, 100),
            )

        self.stdout.write(self.style.SUCCESS(f"Successfully created {count} products"))
