from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views, auth_views

urlpatterns = [
    path('tasks/', views.get_tasks),
    path('tasks/create/', views.create_task),
    path('tasks/<int:pk>/update/', views.update_task),
    path('tasks/<int:pk>/delete/', views.delete_task),

    # Auth
    path('auth/register/', auth_views.register),
    path('auth/login/', auth_views.login),
    path("token/refresh/", TokenRefreshView.as_view()),
]
