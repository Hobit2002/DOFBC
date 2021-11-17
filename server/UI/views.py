from django.shortcuts import render,redirect
import json
# Create your views here.

#welcome:welcomes ulogged users by page, where they can log in
def welcome(request):
    return redirect('ui/login')

#registration:return page for registration
def registration(request):
    languageDict = loadLanguageDict()
    if "ajaxForm" in dict(request.GET).keys():
        return render(request,"unloggedTemplates/registration.html",languageDict)
    else:
        languageDict["includePage"] = "unloggedTemplates/registration.html"
        return render(request,"universalTemplate.html",languageDict)
        

#register:create new user

#login:logs user in
def login(request):
    languageDict = loadLanguageDict()
    if "ajaxForm" in dict(request.GET).keys():
        return render(request,"unloggedTemplates/login.html",languageDict)
    else:
        languageDict["includePage"] = "unloggedTemplates/login.html"
        return render(request,"universalTemplate.html",languageDict)
#home:displays created feedbacks

#loadLanguageDict
def loadLanguageDict():
    return json.load(open('language.json'))