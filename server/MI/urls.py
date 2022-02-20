from django.urls import path
from MI import views as miViews
from UI import views as uiViews

urlpatterns = [
    path('checkAuth',miViews.checkAuth),
    path('home',miViews.home),
    path('newFeedback',uiViews.newFeedback),
    path('feedback',miViews.feedback),
    path('feedbackUpdate',uiViews.feedbackUpdate),
    path('deleteObject',uiViews.deleteObject),
    path('changeStatus',uiViews.changeStatus),
    path('fillFeedback',uiViews.fillFeedback),
    path('submitFeedback',uiViews.submitFeedback),
    path('graphData',uiViews.graphData)
]