from rest_framework import serializers
from rest_framework.fields import empty
from . import models

#Vendor Serializers
class VendorSerializer(serializers.ModelSerializer):
    class Meta:
        model=models.Vendor
        fields=['id','user','address']

    def __init__(self, *args, **kwargs):
        super(VendorSerializer, self).__init__(*args, **kwargs)
        # self.Meta.depth = 1 

class VendorDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model=models.Vendor
        fields=['id','user','address']

    def __init__(self, *args, **kwargs):
        super(VendorDetailSerializer, self).__init__(*args, **kwargs)
        # self.Meta.depth = 1

#Category Serializers
class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model=models.ProductCategory
        fields=['id','title','detail','image']
    def __init__(self, *args, **kwargs):
        super(CategorySerializer, self).__init__(*args, **kwargs)
        self.Meta.depth = 1

class CategoryDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model=models.ProductCategory
        fields=['id','title','detail','image'] 
    def __init__(self, *args, **kwargs):
        super(CategoryDetailSerializer, self).__init__(*args, **kwargs)
        self.Meta.depth = 1

#Product Serializers
class ProductImageListSerializer(serializers.ModelSerializer):
    class Meta:
        model=models.ProductImage
        fields=['id','product','image']

    def __init__(self, *args, **kwargs):
        super(ProductImageListSerializer, self).__init__(*args, **kwargs)
        # self.Meta.depth = 1

class ProductListSerializer(serializers.ModelSerializer):
    class Meta:
        model=models.Product
        fields=['id','category','vendor','title','detail','price','thumbnail']

    def __init__(self, *args, **kwargs):
        super(ProductListSerializer, self).__init__(*args, **kwargs)
        # self.Meta.depth = 1

class ProductDetailSerializer(serializers.ModelSerializer):
    product_images=ProductImageListSerializer(many=True, read_only=True)
    product_ratings=serializers.StringRelatedField(many=True, read_only=True)
    related_products = serializers.SerializerMethodField()
    
    class Meta:
        model=models.Product
        fields=['id','category','vendor','title','detail','price','thumbnail','product_images','product_ratings','related_products']

    def __init__(self, *args, **kwargs):
        super(ProductDetailSerializer, self).__init__(*args,**kwargs)
        # self.Meta.depth = 1
        
    def get_related_products(self, obj):
        """Get related products for this product"""
        related_products = obj.get_related_products(limit=5)
        return ProductListSerializer(related_products, many=True, context=self.context).data

#Customer Serializers
class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model=models.Customer
        fields=['id','user','mobile']

    def __init__(self, *args, **kwargs):
        super(CustomerSerializer, self).__init__(*args, **kwargs)
        # self.Meta.depth = 1 

class CustomerDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model=models.Customer
        fields=['id','user','mobile']

    def __init__(self, *args, **kwargs):
        super(CustomerDetailSerializer, self).__init__(*args, **kwargs)
        self.Meta.depth = 1 

#Order Serializers
class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model=models.Order
        fields=['id','customer']
    
    def __init__(self, *args, **kwargs):
        super(OrderSerializer, self).__init__(*args, **kwargs)
        self.Meta.depth = 1

class OrderDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model=models.OrderItems
        fields=['id','order','product','quantity','status']

    def __init__(self, *args, **kwargs):
        super(OrderDetailSerializer, self).__init__(*args, **kwargs)
        self.Meta.depth = 1

class CustomerAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model=models.CustomerAddress
        fields=['id','customer','address','default_address']

    def __init__(self, *args, **kwargs):
        super(CustomerAddressSerializer, self).__init__(*args, **kwargs)
        # self.Meta.depth = 1

class ProductRatingSerializer(serializers.ModelSerializer):
    class Meta:
        model=models.ProductRating
        fields=['id','customer','product','rating','reviews','add_time']

    def __init__(self, *args, **kwargs):
        super(ProductRatingSerializer, self).__init__(*args, **kwargs)
        self.Meta.depth = 1

class WishlistItemSerializer(serializers.ModelSerializer):
    class Meta:
        model=models.WishlistItem
        fields=['id','customer','product','added_at']

    def __init__(self, *args, **kwargs):
        super(WishlistItemSerializer, self).__init__(*args, **kwargs)
        # self.Meta.depth = 1

class WishlistDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model=models.WishlistItem
        fields=['id','customer','product','added_at']

    def __init__(self, *args, **kwargs):
        super(WishlistDetailSerializer, self).__init__(*args, **kwargs)
        self.Meta.depth = 1  

# Dashboard Statistics Serializers
class CustomerDashboardSerializer(serializers.Serializer):
    total_orders = serializers.IntegerField()
    total_wishlist_items = serializers.IntegerField()
    total_addresses = serializers.IntegerField()
    recent_orders = serializers.ListField(child=serializers.DictField(), required=False)
    recent_wishlist = serializers.ListField(child=serializers.DictField(), required=False)

class VendorDashboardSerializer(serializers.Serializer):
    total_products = serializers.IntegerField()
    total_orders = serializers.IntegerField()
    total_revenue = serializers.FloatField()
    recent_orders = serializers.ListField(child=serializers.DictField(), required=False)
    top_products = serializers.ListField(child=serializers.DictField(), required=False)  

# New serializers for statistics and analytics
class ProductStatisticsSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.ProductStatistics
        fields = ['view_count', 'purchase_count', 'cart_add_count', 'wishlist_add_count', 'last_updated']


class RelatedProductSerializer(serializers.ModelSerializer):
    target_product_details = ProductListSerializer(source='target_product', read_only=True)
    
    class Meta:
        model = models.RelatedProduct
        fields = ['id', 'target_product', 'target_product_details', 'relation_type', 'relevance_score', 'created_at']


class CustomerProductInteractionSerializer(serializers.ModelSerializer):
    product_details = ProductListSerializer(source='product', read_only=True)
    
    class Meta:
        model = models.CustomerProductInteraction
        fields = ['id', 'product', 'product_details', 'viewed', 'added_to_cart', 
                 'added_to_wishlist', 'purchased', 'view_count', 
                 'interaction_score', 'last_interaction']


# Add Category Serializer with product count
class ProductCategoryWithStatsSerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()
    
    class Meta:
        model = models.ProductCategory
        fields = ['id', 'title', 'detail', 'image', 'product_count']
        
    def get_product_count(self, obj):
        return obj.category_products.count()  