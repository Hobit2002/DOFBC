from django.http import JsonResponse,HttpResponse
from django.contrib.auth import authenticate as djAuthenticate,login as djLogin
from UI.models import *

# Create your views here.

#Authentication:

#Check authentication
def checkAuth(request):
    password = request.POST["password"]
    username =request.POST["username"]
    user = djAuthenticate(password=password,username=username)
    if user != None:
        djLogin(request,user)
    return HttpResponse(str(user != None))

#return feedback rows
def home(request):
    objList = Feedback.objects.filter(user_id = request.user.id)
    respList = []
    for fb in objList:respList.append({"id":fb.id,"name":fb.name})
    return JsonResponse(respList,safe=False)

#