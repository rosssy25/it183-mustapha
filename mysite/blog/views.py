from django.shortcuts import render, redirect
from .models import Post, User, PostLikes
from .forms import UserForm
from .serializer import PostSerializer, CreatePostSerializer, UserSerializer, CreateUserSerializer, PostLikesSerializer, CreatePostLikesSerializer
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from rest_framework import viewsets
import os
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login as auth_login, logout
from rest_framework.decorators import api_view
from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework import status




def main_page(request):
    if request.user.is_authenticated:
        posts = Post.objects.all()  # Ensure you're getting all the latest posts
        return render(request, 'blog/homepage.html', {'posts': posts})

    else:
        return render(request, 'blog/login.html')


def upload_image(request):
    if request.method == 'POST' and request.FILES.get('image'):
        image = request.FILES['image']
        # Define the path to store the image
        image_path = os.path.join(settings.MEDIA_ROOT, 'post_images', image.name)
        
        # Ensure the directory exists
        os.makedirs(os.path.dirname(image_path), exist_ok=True)
        
        # Save the image to MEDIA_ROOT
        with open(image_path, 'wb+') as destination:
            for chunk in image.chunks():
                destination.write(chunk)
        
        # Get the URL of the saved image
        image_url = os.path.join(settings.MEDIA_URL, 'post_images', image.name)
        return JsonResponse({'image_url': image_url})
    
    return JsonResponse({'error': 'Invalid request'}, status=400)

def user_registration(request):
    form = UserForm()
    if request.method == 'POST':
        form = UserForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('login')

    context = {
        'form': form
    }
    return render(request, 'blog/registration.html', context)

def login(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        
        user = authenticate(request, username=username, password=password)
        if user is not None:
            auth_login(request, user) 
            return redirect('home')  
        else:
            error_message = "Invalid username or password."
            return render(request, 'blog/login.html', {'error': error_message})
    
    return render(request, 'blog/login.html')

def logout_view(request):
    logout(request)
    return redirect('login')

class PostSerializerViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all()

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return PostSerializer
        elif self.request.method == 'POST':
            return CreatePostSerializer
        elif self.request.method == 'PUT' or self.request.method == 'PATCH':
            return CreatePostSerializer
        return PostSerializer

    def update(self, request, *args, **kwargs):
        post = self.get_object()
        serializer = self.get_serializer(post, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

class UserSerializerViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return UserSerializer
        elif self.request.method == 'POST':
            return CreateUserSerializer

class PostLikesSerializerViewSet(viewsets.ModelViewSet):
    queryset = PostLikes.objects.all()
    serializer_class = PostLikesSerializer

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return PostLikesSerializer
        elif self.request.method == 'POST':
            return CreatePostLikesSerializer

@api_view(['DELETE'])
def delete_post(request, pk):
    """
    Handle DELETE requests to delete a specific post by ID.
    """
    post = get_object_or_404(Post, pk=pk)  # Retrieve the post or return a 404 if not found
    post.delete()  # Delete the post
    return JsonResponse({'detail': 'Post deleted successfully.'}, status=204)

def update_post(request, pk):
    post = get_object_or_404(Post, pk=pk)
    serializer = PostSerializer(post, data=request.data)

    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)  # Return the updated post data in the response

    return Response(serializer.errors, status=400)