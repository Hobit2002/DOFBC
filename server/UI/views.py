from django.shortcuts import render,redirect
from django.contrib.auth import authenticate as djAuthenticate
from django.contrib.auth.models import User
from django.urls import reverse
from urllib.parse import urlencode
from UI.models import *
import json
#answer:renders the answer according to universal rules
def answer(request,pDir,languageDict):
    if "ajaxForm" in dict(request.GET).keys():
        return render(request,pDir,languageDict)
    else:
        languageDict["includePage"] = pDir
        return render(request,"universalTemplate.html",languageDict)    

#welcome:welcomes ulogged users by page, where they can log in
def welcome(request):
    return redirect('/ui/login')

#registration:return page for registration
def registration(request):
    languageDict = loadLanguageDict()
    return answer(request,"unloggedTemplates/registration.html",languageDict)
        
#register:create new user
def register(request):
    password = request.POST["password"]
    username =request.POST["username"]
    #insert to database
    User.objects.create_user(username=username,password = password)
    djAuthenticate(password=password,username=username)
    #redirect
    return redirect("/ui/home")

#authenticate
def authenticate(request):
    password = request.POST["password"]
    username =request.POST["username"]
    djAuthenticate(password=password,username=username)
    #redirect
    return redirect("/ui/home")

#login:logs user in
def login(request):
    languageDict = loadLanguageDict()
    return answer(request,"unloggedTemplates/login.html",languageDict)

#home:displays created feedbacks
def home(request):
    languageDict = loadLanguageDict()
    languageDict["feedbacks"] = Feedback.objects.filter(user_id = request.user.id)
    return answer(request,"loggedTemplates/home.html",languageDict)

#newFeedback:create a new fb and redirect to its page
def newFeedback(request):
    fb = Feedback(user_id=request.user.id)
    fb.save()
    url="{}?{}".format('/ui/feedback',urlencode({"ID":fb.id}))
    return redirect(url)

#feedback:returns page, where feedback can be edited
def feedback(request):
    fbId= request.GET["ID"]
    fb = Feedback.objects.filter(id=fbId)[0]
    languageDict = loadLanguageDict()
    languageDict["Feedback"] = fb
    return answer(request,"loggedTemplates/feedback.html",languageDict)

#loadLanguageDict
def loadLanguageDict():
    return json.load(open('language.json'))