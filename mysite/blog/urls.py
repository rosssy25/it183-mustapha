from django.urls import include, path
from . import views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('', views.main_page, name='home'),
    path('upload-image/', views.upload_image, name='upload_image'),
    path('register/', views.user_registration, name='signup'),
    path('login/', views.login, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('<int:pk>/delete', views.delete_post, name='delete_post'),


    # Include the API routes separately
    path('api/', include('blog.api_urls')),
]  + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)