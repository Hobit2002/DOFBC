from django.urls import path
from UI import views as uiViews

urlpatterns = [
    path('registration',uiViews.registration),
    path('login',uiViews.login)
]