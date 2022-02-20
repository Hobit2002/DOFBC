from django.shortcuts import render
from django.http import JsonResponse,HttpResponse
from django.contrib.auth import authenticate as djAuthenticate,login as djLogin
from django.views.decorators.csrf import csrf_exempt
from UI.models import *
from UI.views import getFeedbackObj,getUserID,generateAnswers
from django.core.cache import cache
import json,random,string

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
        #return authentization token
        token = ""
        symbLine = string.ascii_letters + string.digits
        for i in range(10):token+=symbLine[random.randint(0,61)]
        cache.set(token,user.id,7200)
    else:token=""
    return HttpResponse(token)

#return feedback rows
def home(request):
    objList = Feedback.objects.filter(user_id = getUserID(request))
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
    gForms = Form.objects.filter(user_id = getUserID(request),globalForm= True)
    for gf in gForms:
        responseDict["gForms"].append({"id":gf.id,"name":gf.name})
    #already filled
    alreadyFilled = fb.status in "AC"
    responseDict["alreadyFilled"] = alreadyFilled
    responseDict["answerObj"] = generateAnswers(responseDict) if alreadyFilled else {}
    return JsonResponse(responseDict)
