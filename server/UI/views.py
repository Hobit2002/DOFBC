from django.shortcuts import render,redirect
from django.contrib.auth import authenticate as djAuthenticate
from django.contrib.auth.models import User
from UI.models import *
import json
# Create your views here.

#welcome:welcomes ulogged users by page, where they can log in
def welcome(request):
    return redirect('/ui/login')

#registration:return page for registration
def registration(request):
    languageDict = loadLanguageDict()
    if "ajaxForm" in dict(request.GET).keys():
        return render(request,"unloggedTemplates/registration.html",languageDict)
    else:
        languageDict["includePage"] = "unloggedTemplates/registration.html"
        return render(request,"universalTemplate.html",languageDict)
        
#register:create new user
def register(request):
    password = request.POST["password"]
    username =request.POST["username"]
    #insert to database
    User.objects.create_user(username=username,password = password)
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
    if "ajaxForm" in dict(request.GET).keys():
        return render(request,"unloggedTemplates/login.html",languageDict)
    else:
        languageDict["includePage"] = "unloggedTemplates/login.html"
        return render(request,"universalTemplate.html",languageDict)

#home:displays created feedbacks
def home(request):
    languageDict = loadLanguageDict()
    if "ajaxForm" in dict(request.GET).keys():
        return render(request,"loggedTemplates/home.html",languageDict)
    else:
        languageDict["includePage"] = "loggedTemplates/home.html"
        return render(request,"universalTemplate.html",languageDict)

#loadLanguageDict
def loadLanguageDict():
    return json.load(open('language.json'))