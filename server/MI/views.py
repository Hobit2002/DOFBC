from django.shortcuts import render
from django.http import JsonResponse,HttpResponse
from django.contrib.auth import authenticate as djAuthenticate,login as djLogin
from django.views.decorators.csrf import csrf_exempt
from UI.models import *
from UI.views import getFeedbackObj
import json

# Create your views here.

#Authentication:

#Check authentication

@csrf_exempt
def checkAuth(request):
    print(request.POST)
    password = request.POST["password"]
    username =request.POST["loginname"]
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

#describe feedback object
def feedback(request):
    fb = getFeedbackObj(request)
    responseDict = {}
    responseDict["ID"] = fb.id
    responseDict["name"] = fb.name
    responseDict["Answers"] = json.loads(fb.jsonAnswers)
    #Form data 
    frm = Form.objects.filter(id=fb.form.id)[0]
    responseDict["Questions"] = json.loads(frm.jsonQuestions)
    #QR url
    responseDict["QRurl"] = "QRcodes/%s.png"%(fb.id)
    #status
    responseDict["Status"] = fb.status
    #Load global forms
    responseDict["gForms"] = []
    gForms = Form.objects.filter(user_id = request.user.id,globalForm= True)
    for gf in gForms:
        responseDict["gForms"].append({"id":gf.id,"name":gf.name})
    return JsonResponse(responseDict)
