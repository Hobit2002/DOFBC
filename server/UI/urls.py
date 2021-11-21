from django.urls import path
from UI import views as uiViews

urlpatterns = [
    path('registration',uiViews.registration),
    path('login',uiViews.login),
    path('register',uiViews.register),
    path('authenticate',uiViews.authenticate),
    path('home',uiViews.home),
    path('newFeedback',uiViews.newFeedback),
    path('feedback',uiViews.feedback)
]