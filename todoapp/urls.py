from django.contrib import admin
from django.urls import include, path

from . views import frontend

urlpatterns = [
    path("", frontend),
    path('admin/', admin.site.urls),
    path('api/', include('webapp.urls')),
]
