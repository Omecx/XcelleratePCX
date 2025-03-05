from rest_framework import generics,permissions,pagination,viewsets
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import authenticate
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view
from . import serializers
from . import models
from django.http.response import JsonResponse
from django.contrib.auth import authenticate
import json
from .models import CustomUser, Customer, Vendor

@csrf_exempt
def register(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            username = data.get('username')
            password = data.get('password')
            registration_type = data.get('registration_type')  # 'customer' or 'vendor'

            if not username or not password:
                return JsonResponse({'error': 'Username and password are required.'}, status=400)

            if CustomUser.objects.filter(username=username).exists():
                return JsonResponse({'error': 'Username is already taken.'}, status=400)

            user = CustomUser(username=username)
            user.set_password(password)

            if registration_type == 'customer':
                user.isCustomer = True
                user.save()  # Save the user
                customer = Customer(user=user)
                customer.save()
            elif registration_type == 'vendor':
                user.isVendor = True
                user.save()  # Save the user
                vendor = Vendor(user=user)
                vendor.save()

            return JsonResponse({'message': 'Registration successful.'}, status=201)
        except Exception as e:
            return JsonResponse({'error': 'Registration failed. Please try again.'}, status=400)
    else:
        return JsonResponse({'error': 'Invalid request method.'}, status=405)
    

@csrf_exempt
def login(request):
    if request.method == 'POST':
        try:
            # Handle both form data and JSON data
            if request.content_type == 'application/json':
                data = json.loads(request.body)
                username = data.get('username')
                password = data.get('password')
            else:
                username = request.POST.get('username')
                password = request.POST.get('password')
            
            print(f"Received username: {username}, password: {password}")

            if not username or not password:
                return JsonResponse({
                    'bool': False,
                    'msg': 'Missing username or password',
                })

            user = authenticate(request, username=username, password=password)
            if user is not None:
                response_data = {
                    'bool': True,
                    'user': user.username,
                    'uid': user.id,
                }
                refresh = RefreshToken.for_user(user)
                response_data['refresh'] = str(refresh)  # Remove the trailing comma and parenthesis
                response_data['access'] = str(refresh.access_token)
                if user.isVendor:
                    response_data['user_type'] = 'vendor'
                    # Fetch the vendor_id if the user is a vendor
                    try:
                        vendor = Vendor.objects.get(user=user)
                        response_data['vendor_id'] = vendor.id
                    except Vendor.DoesNotExist:
                        response_data['vendor_id'] = None
                elif user.isCustomer:
                    response_data['user_type'] = 'customer'
                    # Fetch the customer_id if the user is a customer
                    try:
                        customer = Customer.objects.get(user=user)
                        response_data['customer_id'] = customer.id
                    except Customer.DoesNotExist:
                        response_data['customer_id'] = None
            else:
                response_data = {
                    'bool': False,
                    'msg': 'Invalid Username/Password!!'
                }
            return JsonResponse(response_data)
        except Exception as e:
            return JsonResponse({
                'bool': False,
                'msg': f'Login error: {str(e)}'
            })
    else:
        return JsonResponse({
            'bool': False,
            'msg': 'Only POST method is allowed'
        })


#Vendor Views
class VendorList(generics.ListCreateAPIView):
    queryset = models.Vendor.objects.all()
    serializer_class = serializers.VendorSerializer
    permission_classes=[]
    
class VendorDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = models.Vendor.objects.all()
    serializer_class = serializers.VendorDetailSerializer
    permission_classes=[permissions.IsAuthenticated]  
    #--this is View level authentication

#Category Views
class CategoryList(generics.ListCreateAPIView):
    queryset = models.ProductCategory.objects.all()
    serializer_class = serializers.CategorySerializer
    permission_classes=[]

class CategoryDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = models.ProductCategory.objects.all()
    serializer_class = serializers.CategoryDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

#Product Views
class ProductList(generics.ListCreateAPIView):
    queryset = models.Product.objects.all()
    serializer_class = serializers.ProductListSerializer
    permission_classes = []

    def get_queryset(self):
        qs = super().get_queryset()
        vendor_id = self.kwargs.get('pk')
        
        if vendor_id:
            qs = qs.filter(vendor_id=vendor_id)
        
        # Get category from query params
        category = self.request.GET.get('category')
        featured = self.request.GET.get('featured')
        
        # Filter by category if provided
        if category:
            try:
                category_id = int(category)
                qs = qs.filter(category_id=category_id)
            except (ValueError, TypeError):
                # If category is not a valid integer, try to find by title
                try:
                    category_obj = models.ProductCategory.objects.filter(title__icontains=category).first()
                    if category_obj:
                        qs = qs.filter(category=category_obj)
                except Exception as e:
                    print(f"Error filtering by category: {str(e)}")
        
        # Filter featured products if requested
        if featured and featured.lower() == 'true':
            # Implement featured product logic (e.g., products with highest ratings or sales)
            # For now, just return the first 5 products as featured
            qs = qs.order_by('-id')[:5]
        
        return qs
        # pagination_class = pagination.PageNumberPagination --this is View level pagination

class ProductDetailViewSet(viewsets.ModelViewSet):
    queryset = models.Product.objects.all()
    serializer_class = serializers.ProductDetailSerializer
    # permission_classes = [permissions.IsAuthenticated]
    permission_classes = []

class ProductImageViewSet(viewsets.ModelViewSet):
    queryset = models.ProductImage.objects.all()
    serializer_class = serializers.ProductImageListSerializer
    permission_classes = []

#Customer Views
class CustomerList(generics.ListCreateAPIView):
    queryset = models.Customer.objects.all()
    serializer_class = serializers.CustomerSerializer
    permission_classes=[]

class CustomerDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = models.Customer.objects.all()
    serializer_class = serializers.CustomerDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

#Order Views
class OrderList(generics.ListCreateAPIView):
    queryset = models.Order.objects.all()
    serializer_class = serializers.OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

class OrderDetail(generics.ListAPIView):
    # queryset = models.OrderItems.objects.all()
    serializer_class = serializers.OrderDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        order_id=self.kwargs['pk']
        order=models.Order.objects.get(id=order_id)
        order_items=models.OrderItems.objects.filter(order=order)
        return order_items

# Customer Address List 
class CustomerAddressList(generics.ListAPIView):
    queryset = models.CustomerAddress.objects.all()
    serializer_class = serializers.CustomerAddressSerializer
    permission_classes = []

    def get_queryset(self):
        qs=super().get_queryset()
        customer_id=self.kwargs['pk']
        qs=qs.filter(customer_id=customer_id)
        return qs
    
# Customer Address List 
class CustomerAddressViewSet(viewsets.ModelViewSet):
    queryset = models.CustomerAddress.objects.all()
    serializer_class = serializers.CustomerAddressSerializer
    permission_classes = [permissions.IsAuthenticated]

# Customer Address List 
class ProductRatingViewSet(viewsets.ModelViewSet):
    queryset = models.ProductRating.objects.all()
    serializer_class = serializers.ProductRatingSerializer
    permission_classes = [permissions.IsAuthenticated]

# Customer Address List 
class WishlistItemList(generics.ListAPIView):
    queryset = models.WishlistItem.objects.all()
    serializer_class = serializers.WishlistDetailSerializer
    permission_classes = []
    # permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs=super().get_queryset()
        customer_id=self.kwargs['pk']
        qs=qs.filter(customer_id=customer_id)
        return qs
    
# Wishlist ViewSet ---Authentication
class WishlistItemViewSet(viewsets.ModelViewSet):
    queryset = models.WishlistItem.objects.all()
    serializer_class = serializers.WishlistItemSerializer
    # permission_classes = [permissions.IsAuthenticated]
    permission_classes = []

# Dashboard Views
class CustomerDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, pk=None):
        try:
            # Verify the customer exists and belongs to the authenticated user
            customer = models.Customer.objects.get(id=pk)
            if customer.user != request.user and not request.user.is_staff:
                return Response(
                    {"error": "You do not have permission to view this dashboard"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Get customer statistics
            total_orders = models.Order.objects.filter(customer=customer).count()
            total_wishlist_items = models.WishlistItem.objects.filter(customer=customer).count()
            total_addresses = models.CustomerAddress.objects.filter(customer=customer).count()
            
            # Get recent orders (last 5)
            recent_orders_data = []
            recent_orders = models.Order.objects.filter(customer=customer).order_by('-order_time')[:5]
            for order in recent_orders:
                order_items = models.OrderItems.objects.filter(order=order)
                total_amount = sum(item.product.price * item.quantity for item in order_items)
                recent_orders_data.append({
                    'id': order.id,
                    'date': order.order_time.strftime('%Y-%m-%d %H:%M'),
                    'total_items': order_items.count(),
                    'total_amount': total_amount
                })
            
            # Get recent wishlist items (last 5)
            recent_wishlist_data = []
            recent_wishlist = models.WishlistItem.objects.filter(customer=customer).order_by('-added_at')[:5]
            for item in recent_wishlist:
                recent_wishlist_data.append({
                    'id': item.id,
                    'product_id': item.product.id,
                    'product_title': item.product.title,
                    'product_price': item.product.price,
                    'added_at': item.added_at.strftime('%Y-%m-%d %H:%M')
                })
            
            # Prepare response data
            dashboard_data = {
                'total_orders': total_orders,
                'total_wishlist_items': total_wishlist_items,
                'total_addresses': total_addresses,
                'recent_orders': recent_orders_data,
                'recent_wishlist': recent_wishlist_data
            }
            
            serializer = serializers.CustomerDashboardSerializer(dashboard_data)
            return Response(serializer.data)
            
        except models.Customer.DoesNotExist:
            return Response(
                {"error": "Customer not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class VendorDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, pk=None):
        try:
            # Verify the vendor exists and belongs to the authenticated user
            vendor = models.Vendor.objects.get(id=pk)
            if vendor.user != request.user and not request.user.is_staff:
                return Response(
                    {"error": "You do not have permission to view this dashboard"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Get vendor statistics
            vendor_products = models.Product.objects.filter(vendor=vendor)
            total_products = vendor_products.count()
            
            # Calculate orders and revenue
            total_orders = 0
            total_revenue = 0
            order_items = models.OrderItems.objects.filter(product__vendor=vendor)
            
            # Get unique orders
            unique_orders = set()
            for item in order_items:
                unique_orders.add(item.order.id)
                total_revenue += item.product.price * item.quantity
            
            total_orders = len(unique_orders)
            
            # Get recent orders (last 5)
            recent_orders_data = []
            recent_order_items = order_items.order_by('-order__order_time')[:5]
            for item in recent_order_items:
                recent_orders_data.append({
                    'order_id': item.order.id,
                    'date': item.order.order_time.strftime('%Y-%m-%d %H:%M'),
                    'product': item.product.title,
                    'quantity': item.quantity,
                    'amount': item.product.price * item.quantity
                })
            
            # Get top products (by order quantity)
            top_products_data = []
            from django.db.models import Count, Sum
            top_products = vendor_products.annotate(
                order_count=Count('orderitems'),
                total_quantity=Sum('orderitems__quantity')
            ).order_by('-order_count')[:5]
            
            for product in top_products:
                top_products_data.append({
                    'id': product.id,
                    'title': product.title,
                    'price': product.price,
                    'orders': getattr(product, 'order_count', 0),
                    'quantity_sold': getattr(product, 'total_quantity', 0) or 0
                })
            
            # Prepare response data
            dashboard_data = {
                'total_products': total_products,
                'total_orders': total_orders,
                'total_revenue': total_revenue,
                'recent_orders': recent_orders_data,
                'top_products': top_products_data
            }
            
            serializer = serializers.VendorDashboardSerializer(dashboard_data)
            return Response(serializer.data)
            
        except models.Vendor.DoesNotExist:
            return Response(
                {"error": "Vendor not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# Vendor Products View
class VendorProductsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        try:
            # Get the vendor associated with the authenticated user
            vendor = models.Vendor.objects.get(user=request.user)
            
            # Get all products for this vendor
            products = models.Product.objects.filter(vendor=vendor)
            
            # Serialize the products
            serializer = serializers.ProductListSerializer(products, many=True)
            
            return Response(serializer.data)
            
        except models.Vendor.DoesNotExist:
            return Response(
                {"error": "Vendor not found for this user"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def post(self, request):
        try:
            # Get the vendor associated with the authenticated user
            vendor = models.Vendor.objects.get(user=request.user)
            
            # Add the vendor to the product data
            product_data = request.data.copy()
            product_data['vendor'] = vendor.id
            
            # Create the product
            serializer = serializers.ProductListSerializer(data=product_data)
            if serializer.is_valid():
                product = serializer.save()
                
                # Handle product images if provided
                if 'images' in request.data and request.data['images']:
                    for image_data in request.data['images']:
                        image_serializer = serializers.ProductImageListSerializer(data={
                            'product': product.id,
                            'image': image_data
                        })
                        if image_serializer.is_valid():
                            image_serializer.save()
                
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except models.Vendor.DoesNotExist:
            return Response(
                {"error": "Vendor not found for this user"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# Related Products API views
class RelatedProductList(generics.ListCreateAPIView):
    queryset = models.RelatedProduct.objects.all()
    serializer_class = serializers.RelatedProductSerializer
    
    def get_queryset(self):
        queryset = models.RelatedProduct.objects.all()
        product_id = self.request.query_params.get('product_id')
        if product_id:
            queryset = queryset.filter(source_product_id=product_id)
        return queryset


class RelatedProductDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = models.RelatedProduct.objects.all()
    serializer_class = serializers.RelatedProductSerializer


# Product Statistics API views
class ProductStatisticsView(generics.RetrieveUpdateAPIView):
    queryset = models.ProductStatistics.objects.all()
    serializer_class = serializers.ProductStatisticsSerializer
    
    def get_object(self):
        product_id = self.kwargs['pk']
        stats, created = models.ProductStatistics.objects.get_or_create(product_id=product_id)
        return stats


# Customer Interactions API views
class CustomerProductInteractionList(generics.ListCreateAPIView):
    serializer_class = serializers.CustomerProductInteractionSerializer
    
    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return models.CustomerProductInteraction.objects.none()
            
        customer = models.Customer.objects.filter(user=user).first()
        if not customer:
            return models.CustomerProductInteraction.objects.none()
            
        return models.CustomerProductInteraction.objects.filter(customer=customer)


class CustomerProductInteractionDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = models.CustomerProductInteraction.objects.all()
    serializer_class = serializers.CustomerProductInteractionSerializer


# New view for product recommendations
class RecommendedProductsView(generics.ListAPIView):
    serializer_class = serializers.ProductListSerializer
    
    def get_queryset(self):
        user = self.request.user
        limit = int(self.request.query_params.get('limit', 5))
        
        # If user is authenticated, try to get personalized recommendations
        if user.is_authenticated:
            customer = models.Customer.objects.filter(user=user).first()
            if customer:
                # Get recently viewed or interacted products
                interactions = models.CustomerProductInteraction.objects.filter(customer=customer)
                if interactions.exists():
                    # Get products from the same categories as recently interacted products
                    interacted_categories = models.Product.objects.filter(
                        customer_interactions__customer=customer
                    ).values_list('category_id', flat=True).distinct()
                    
                    return models.Product.objects.filter(
                        category_id__in=interacted_categories
                    ).exclude(
                        customer_interactions__customer=customer
                    ).order_by('?')[:limit]
        
        # Fallback to popular products or featured products
        return models.Product.objects.all().order_by('?')[:limit]


# New view for category statistics
class CategoryWithStatsView(generics.ListAPIView):
    queryset = models.ProductCategory.objects.all()
    serializer_class = serializers.ProductCategoryWithStatsSerializer


# New view for vendor statistics
class VendorStatisticsView(generics.RetrieveAPIView):
    serializer_class = serializers.VendorDashboardSerializer
    
    def get_object(self):
        vendor = get_vendor(self.request.user)
        if not vendor:
            raise NotFound("Vendor not found")
            
        # Get products for this vendor
        products = models.Product.objects.filter(vendor=vendor)
        
        # Calculate statistics
        stats = {
            'total_products': products.count(),
            'product_stats': []
        }
        
        for product in products:
            product_stats, _ = models.ProductStatistics.objects.get_or_create(product=product)
            stats['product_stats'].append({
                'id': product.id,
                'title': product.title,
                'views': product_stats.view_count,
                'purchases': product_stats.purchase_count,
                'cart_adds': product_stats.cart_add_count,
                'wishlist_adds': product_stats.wishlist_add_count
            })
            
        return stats

