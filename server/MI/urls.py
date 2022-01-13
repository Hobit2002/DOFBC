from django.urls import path
from MI import views as miViews

urlpatterns = [
    path('checkAuth',miViews.checkAuth),
    path('home',miViews.home),
]