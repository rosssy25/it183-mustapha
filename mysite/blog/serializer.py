from rest_framework import serializers
from drf_writable_nested.serializers import WritableNestedModelSerializer
from . models import Post, PostLikes
from django.contrib.auth.models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'

class CreateUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'password']

class PostSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    class Meta:
        model = Post
        fields = '__all__'

class CreatePostSerializer(WritableNestedModelSerializer):
    author = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    class Meta:
        model = Post
        fields = '__all__'

class PostLikesSerializer(serializers.ModelSerializer):
    liked_by = UserSerializer(read_only=True)
    post_liked = PostSerializer(read_only=True)
    class Meta:
        model = PostLikes
        fields = '__all__'

class CreatePostLikesSerializer(WritableNestedModelSerializer):
    liked_by = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    post_liked = serializers.PrimaryKeyRelatedField(queryset=Post.objects.all())
    class Meta:
        model = PostLikes
        fields = '__all__'