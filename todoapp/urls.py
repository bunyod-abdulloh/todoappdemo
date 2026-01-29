from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from . views import frontend

urlpatterns = [
    path("", frontend),
    path('admin/', admin.site.urls),
    path('api/', include('webapp.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)