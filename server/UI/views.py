from django.http.response import HttpResponse
from django.shortcuts import render,redirect
from django.contrib.auth import authenticate as djAuthenticate, login as djLogin,logout as djLogout
from django.contrib.auth.models import User
from django.urls import reverse
from urllib.parse import urlencode
from UI.models import *
from django.core.exceptions import ValidationError
import json,qrcode
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
    user = djAuthenticate(password=password,username=username)
    if user != None:
        djLogin(request,user)
        return redirect("/ui/home?&ajaxForm=1")
    #redirect
    
#login:logs user in
def login(request):
    languageDict = loadLanguageDict()
    return answer(request,"unloggedTemplates/login.html",languageDict)

#logout
def logout(request):
    djLogout(request)
    return redirect("/ui/login?&ajaxForm=1")

#home:displays created feedbacks
def home(request):
    languageDict = loadLanguageDict()
    languageDict["feedbacks"] = Feedback.objects.filter(user_id = request.user.id)
    #prepare row breakpoints
    feedbackCount =len(languageDict["feedbacks"])
    rowLen = 7
    rowCount =  feedbackCount//rowLen
    languageDict["rowStarts"] = []
    languageDict["rowEnds"] = [feedbackCount]
    for rc in range(rowCount+1):
        languageDict["rowStarts"].append(rc*rowLen+1)
        languageDict["rowEnds"].append(rc*rowLen+(rowLen-1)+1)
    #render page
    return answer(request,"loggedTemplates/home.html",languageDict)

#newFeedback:create a new fb and redirect to its page
def newFeedback(request):
    #create default form
    basicFormString = json.dumps({"Verbal":[],"Rating":[]})
    form = Form(user_id=request.user.id,jsonQuestions = basicFormString)
    form.save()
    #create default feedback
    fb = Feedback(user_id=request.user.id,form=form)
    fb.save()
    #create and save QR code
    languageDict = loadLanguageDict()
    qrObj = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4)
    qrObj.add_data(languageDict["domain"]+languageDict["fillAddressURL"]%(fb.id))
    qrImf = qrObj.make_image().convert('RGB')
    qrImf.save("static/QRcodes/"+str(fb.id)+".png")
    #redirect to feedback page
    url="{}?{}".format('/ui/feedback',urlencode({"ID":fb.id}))
    return redirect(url)

#getFeedbackObj
def getFeedbackObj(request):
    fbId= request.GET["ID"]
    try:
        fb = Feedback.objects.filter(id=fbId,user_id=request.user.id)[0]
    except (ValidationError,IndexError):
        return 0
    if fb==None:return 0
    else:return fb

#delete object
def deleteObject(request):
    #check connection
    if request.GET["type"]=="feedback":
        obj = getFeedbackObj(request)
        frm = Form.objects.filter(id=obj.form.id)[0]
        frm.delete()
    if not obj: return errorPage("NoSuchFBERR",request)
    #delete object
    obj.delete()
    #redirect
    return redirect(request.GET['redirect'])

#feedback:returns page, where feedback can be edited
def feedback(request):
    fb = getFeedbackObj(request)
    if not fb:return errorPage("NoSuchFBERR",request)
    languageDict = loadLanguageDict()
    languageDict["Feedback"] = fb
    languageDict["Answers"] = json.loads(fb.jsonAnswers)
    #Form data 
    frm = Form.objects.filter(id=fb.form.id)[0]
    languageDict["Questions"] = json.loads(frm.jsonQuestions)
    #QR url
    languageDict["QRurl"] = "QRcodes/%s.png"%(fb.id)
    #Load global forms
    languageDict["gForms"] = Form.objects.filter(user_id = request.user.id,globalForm= True)
    return answer(request,"loggedTemplates/feedback.html",languageDict)

#feedbackUpdate
def feedbackUpdate(request):
    fb = getFeedbackObj(request)
    if not fb:return errorPage("NoSuchFBERR",request)
    parameter = request.GET["parameter"]
    value = request.GET["value"]
    if parameter == "name":
        fb.name = value
    elif parameter[0:8]=="question":
        questions = json.loads(fb.form.jsonQuestions)
        queType = parameter[8:14]
        index = int(parameter[14:]) - 1
        if len(value):
            try:
                questions[queType][index] = value
            except IndexError:
                questions[queType].append(value)
        else:
            del questions[queType][index]
        fb.form.jsonQuestions = json.dumps(questions)
        fb.form.save()
    elif parameter=="form":
        frm = Form.objects.filter(id=fb.form.id)[0]
        gForm = Form.objects.filter(id=value,user_id=request.user.id)[0]
        frm.jsonQuestions = gForm.jsonQuestions
        frm.save()
        return redirectToObject('feedback',fb)
    fb.save()
    return HttpResponse('OK')

#new Form
def newForm(request):
    #load original
    fb = getFeedbackObj(request)
    frm = Form.objects.filter(id=fb.form.id)[0]
    #create copy
    gFrm=Form(globalForm=True,name=request.GET["name"],user_id=request.user.id,jsonQuestions=frm.jsonQuestions)
    #save and leave
    gFrm.save()
    return HttpResponse('OK')

#redirect to object
def redirectToObject(objType,obj):
    url="/ui/"+objType+"?ID="+str(obj.id)+"&ajaxForm=1"
    return redirect(url)

#loadLanguageDict
def loadLanguageDict():
    return json.load(open('language.json'))

#error page
def errorPage(message,request):
    langugageDict = loadLanguageDict()
    langugageDict["ErrMsg"] = langugageDict[message]
    return answer(request,"errorPage.html",langugageDict)
