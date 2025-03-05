import datetime
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.models import Group, Permission
from django.utils import timezone

# /User-Models/
# Main User
class CustomUser(AbstractUser):
    isCustomer = models.BooleanField(default=False)
    isVendor = models.BooleanField(default=False)
    profile_picture = models.ImageField(upload_to='profile_pics/', null=True, blank=True)
    groups = models.ManyToManyField(Group, blank=True, related_name='custom_users')
    user_permissions = models.ManyToManyField(Permission, blank=True, related_name='custom_users')

#Vendor MOdels
class Vendor(models.Model):
    user=models.OneToOneField(CustomUser, on_delete=models.CASCADE)
    address=models.TextField(null=True)

    def __str__(self):
        return self.user.username

#Customer Model
class Customer(models.Model):
    user=models.OneToOneField(CustomUser, on_delete=models.CASCADE)
    mobile=models.PositiveBigIntegerField(null=True)

    def __str__(self):
        return self.user.username

# /Customer-Models/    
#Customer Address Model
class CustomerAddress(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='customer_addresses')
    address = models.TextField()
    default_address=models.BooleanField(default=False)

    def __str__(self):
        return self.address
    
# /Product-Models/
#Product Category Model
class ProductCategory(models.Model):
    title=models.CharField(max_length=250)
    detail=models.TextField(null=True)
    image=models.ImageField(upload_to='uploads/categories/thumbnail', null=True, blank=True) 

    def __str__(self):                                  
        return self.title

#Product Model
class Product(models.Model):
    category=models.ForeignKey(ProductCategory, on_delete=models.SET_NULL,null=True, related_name='category_products')
    vendor=models.ForeignKey(Vendor, on_delete=models.SET_NULL,null=True)
    title=models.CharField(max_length=250)
    detail=models.TextField(null=True)
    price=models.FloatField()
    thumbnail=models.ImageField(upload_to='uploads/products/thumbnail')

    def __str__(self):
        return self.title

    def get_related_products(self, limit=5):
        """Get related products based on explicit relationships, same category, or user behavior"""
        # First check for explicitly defined related products
        explicit_related = RelatedProduct.objects.filter(source_product=self).values_list('target_product', flat=True)
        if explicit_related.exists():
            return Product.objects.filter(id__in=explicit_related)[:limit]
        
        # Then try products from the same category
        if self.category:
            return Product.objects.filter(category=self.category).exclude(id=self.id)[:limit]
            
        # If no related products found, return empty queryset
        return Product.objects.none()

class ProductImage(models.Model):
    product=models.ForeignKey(Product, on_delete=models.CASCADE, related_name='product_images')
    image=models.ImageField(upload_to='uploads/products/display_images')
    
    def __str__(self):
        return self.image.url

# Related Products Model - For explicit product relationships
class RelatedProduct(models.Model):
    source_product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='source_relations')
    target_product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='target_relations')
    relation_type = models.CharField(max_length=50, choices=[
        ('manual', 'Manually Related'),
        ('category', 'Same Category'),
        ('purchased_together', 'Frequently Purchased Together'),
        ('viewed_together', 'Frequently Viewed Together'),
        ('recommended', 'System Recommended')
    ])
    relevance_score = models.FloatField(default=1.0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('source_product', 'target_product')
        
    def __str__(self):
        return f"{self.source_product.title} → {self.target_product.title} ({self.relation_type})"

# Product Statistics Model - For tracking product performance and generating recommendations
class ProductStatistics(models.Model):
    product = models.OneToOneField(Product, on_delete=models.CASCADE, related_name='statistics')
    view_count = models.PositiveIntegerField(default=0)
    purchase_count = models.PositiveIntegerField(default=0)
    cart_add_count = models.PositiveIntegerField(default=0)
    wishlist_add_count = models.PositiveIntegerField(default=0)
    last_updated = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Stats for {self.product.title}"

# Customer Product Interaction - For personalized recommendations
class CustomerProductInteraction(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='product_interactions')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='customer_interactions')
    viewed = models.BooleanField(default=False)
    added_to_cart = models.BooleanField(default=False)
    added_to_wishlist = models.BooleanField(default=False)
    purchased = models.BooleanField(default=False)
    view_count = models.PositiveIntegerField(default=0)
    interaction_score = models.FloatField(default=0.0)
    last_interaction = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('customer', 'product')
        
    def __str__(self):
        return f"{self.customer} - {self.product.title} interaction"

#Product Ratings Model 
class ProductRating(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='evaluation')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='product_ratings')
    rating = models.IntegerField()
    reviews = models.TextField()
    add_time = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.rating}-{self.reviews}'


# /Checkout-Models/
#Order Model
class Order(models.Model):
    customer=models.ForeignKey(Customer, on_delete=models.CASCADE)
    order_time=models.DateTimeField(auto_now_add=True)

    def __unicode__(self):
        return '%s' % (self.order_time)

#Order Items Model
class OrderItems(models.Model):
    order=models.ForeignKey(Order, on_delete=models.CASCADE, related_name='order_items')
    product=models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity=models.IntegerField(default=1)
    status=models.BooleanField(default=False)

    def __str__(self):
        return self.product.title
    
# Customer WishLIst   
class WishlistItem(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='wishlist')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('customer', 'product')  # To ensure a user can't add the same product multiple times

    def __str__(self):
        return f"{self.customer.user.username}'s wishlist - {self.product.title}"
    
    