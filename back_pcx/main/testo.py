from rest_framework.test import APIClient, APITestCase
from rest_framework import status
from django.urls import reverse
from .models import CustomerAddress, CustomUser
from .serializers import CustomerAddressSerializer

class CustomerAddressViewSetTestCase(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = CustomUser.objects.create(username='testuser', password='testpassword')
        self.client.force_authenticate(user=self.user)

    def test_customer_address_creation(self):
        # Create a customer address for the authenticated user
        data = {
            "customer": self.user.id,  # Set the user for whom the address is being added
            "address_line1": "123 Main St",
            "city": "New York",
            # Add other required fields as per your serializer
        }

        url = reverse('customeraddress-list')  # Replace 'customeraddress-list' with your endpoint name
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(CustomerAddress.objects.count(), 1)
        # Add more assertions to test the created address attributes, if needed

    def test_customer_address_retrieval(self):
        # Assuming there's an existing address in the database for the authenticated user
        existing_address = CustomerAddress.objects.create(
            customer=self.user, address_line1="456 Elm St", city="Los Angeles"
            # Add other required fields as per your model
        )

        url = reverse('customeraddress-list')  # Replace 'customeraddress-list' with your endpoint name
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        # Add more assertions to test the retrieved address attributes, if needed
