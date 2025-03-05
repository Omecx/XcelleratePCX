from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.urls import reverse
from .models import CustomUser, Customer, Product, WishlistItem

class WishlistItemTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def get_tokens_for_user(self, user):
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        return access_token

    def test_wishlist_item_viewset(self):
        # Create a CustomUser
        user = CustomUser.objects.create_user(username='testuser', password='testpassword')

        # Create a Customer associated with the CustomUser
        customer = Customer.objects.create(mobile=1234567890, user=user)

        # Generate token for the user using SimpleJWT
        token = self.get_tokens_for_user(user)

        # Set the token in the authorization header for the test client
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + token)

        url = reverse('customer-wishlist-list')  # Replace 'customer-wishlist-list' with your endpoint name

        # Check the initial number of items in the user's wishlist
        initial_response = self.client.get(url)
        initial_items_count = len(initial_response.data)

        # Add an item to the wishlist for the authenticated customer
        product = Product.objects.create(title='New Item', price=25.0)
        WishlistItem.objects.create(customer=customer, product=product)

        # Check the updated number of items in the user's wishlist
        updated_response = self.client.get(url)
        updated_items_count = len(updated_response.data)

        print("Initial Items Count:", initial_items_count)
        print("Updated Items Count:", updated_items_count)


        # # Assertions
        # self.assertEqual(initial_items_count + 1, updated_items_count, "Expected one more item in the wishlist")
