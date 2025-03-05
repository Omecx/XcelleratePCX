from django.urls import path
from . import views
from rest_framework import routers
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


router=routers.DefaultRouter()

# Product CRUD --Authtentication
router.register('product', views.ProductDetailViewSet)

# Product CRUD --Authtentication
router.register('productimg', views.ProductImageViewSet)

# Customer Address CRUD --Authtentication
router.register('address', views.CustomerAddressViewSet)

# Customer WishList CRUD --Authtentication
router.register('wishlistitem', views.WishlistItemViewSet, basename='customer-wishlist')

# Product Rating CRUD --No Authtentication
router.register('productrating', views.ProductRatingViewSet)

urlpatterns = [
    # Register --No Authtentication
    path('register/', views.register, name='register'),

    # Login  
    path('login/', views.login, name='login'),

    # Dashboard endpoints
    path('customer/dashboard/<int:pk>/', views.CustomerDashboardView.as_view(), name='customer_dashboard'),
    path('vendor/dashboard/<int:pk>/', views.VendorDashboardView.as_view(), name='vendor_dashboard'),

    # UserSpecific Addresses --Authtentication
    path('addresses/<int:pk>/', views.CustomerAddressList.as_view(), name='user_addresses'),

    # UserSpecific Addresses --Authtentication
    path('wishlist/<int:pk>/', views.WishlistItemList.as_view(), name='user_wishlist'),

    #Vendors --No Authtentication
    path('vendors/', views.VendorList.as_view()),
    path('vendor/<int:pk>/', views.VendorDetail.as_view()),
    path('vendor/products/', views.VendorProductsView.as_view(), name='vendor_products'),

    #Categories --No Authtentication
    path('categories/', views.CategoryList.as_view()),
    path('category/<int:pk>/', views.CategoryDetail.as_view()),
    
    #Products --No Authtentication
    path('products/', views.ProductList.as_view()),
    path('products/<int:pk>/', views.ProductList.as_view()),

    #Customers --No Authtentication
    path('customers/', views.CustomerList.as_view()),
    path('customer/<int:pk>/', views.CustomerDetail.as_view()),

    #Orders --Authtentication
    path('orders/', views.OrderList.as_view()),
    path('order/<int:pk>/', views.OrderDetail.as_view()),

    # Related Products endpoints
    path('related-products/', views.RelatedProductList.as_view()),
    path('related-products/<int:pk>/', views.RelatedProductDetail.as_view()),
    
    # Product Statistics endpoints
    path('product-statistics/<int:pk>/', views.ProductStatisticsView.as_view()),
    
    # Customer Interactions endpoints
    path('customer-interactions/', views.CustomerProductInteractionList.as_view()),
    path('customer-interactions/<int:pk>/', views.CustomerProductInteractionDetail.as_view()),
    
    # Recommendations endpoints
    path('recommendations/', views.RecommendedProductsView.as_view()),
    
    # Categories with stats endpoint
    path('categories-with-stats/', views.CategoryWithStatsView.as_view()),
    
    # Vendor Statistics endpoint
    path('vendor/statistics/', views.VendorStatisticsView.as_view()),
]

urlpatterns+=router.urls