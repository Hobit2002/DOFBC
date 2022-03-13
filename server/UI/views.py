from unittest import result
from django.http import JsonResponse
from django.http.response import HttpResponse
from django.shortcuts import render,redirect
from django.contrib.auth import authenticate as djAuthenticate, login as djLogin,logout as djLogout
from django.contrib.auth.models import User
from django.urls import reverse
from urllib.parse import urlencode
from UI.models import *
from django.core.exceptions import ValidationError
from django.views.decorators.csrf import csrf_exempt
from django.core.cache import cache
import json,qrcode,random
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
    languageDict.update(json.load(open("openingPage.json")))
    return answer(request,"unloggedTemplates/login.html",languageDict)

#logout
def logout(request):
    djLogout(request)
    return redirect("/ui/login?&ajaxForm=1")

#home:displays created feedbacks
def home(request):
    languageDict = loadLanguageDict()
    languageDict["feedbacks"] = Feedback.objects.filter(user_id = getUserID(request)).order_by('submissionDate')
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
    form = Form(user_id=getUserID(request),jsonQuestions = basicFormString)
    form.save()
    #create default feedback
    if "uuid" in dict(request.GET).keys():
        fb = Feedback(id=request.GET["uuid"],user_id=getUserID(request),form=form)
    else:fb = Feedback(user_id=getUserID(request),form=form)
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
    getParams = {"ID":fb.id}
    if "MI" in dict(request.GET).keys():
        prefix = "mi"
        getParams["authToken"] = request.GET["authToken"] 
    else:
        prefix = "ui"
    url="{}?{}".format('/%s/feedback'%prefix,urlencode(getParams))
    return redirect(url)

#generate json qr code
def generateOfflineQR(request):
    #load questions
    fb = getFeedbackObj(request)
    form = Form.objects.filter(id=fb.form_id)[0]
    questions = json.loads(form.jsonQuestions)
    questions["name"] = fb.name
    questions["id"] = str(fb.id)
    #save them as QR code
    qrObj = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4)
    qrString = json.dumps(questions).replace("  ","").replace("\n","")
    qrObj.add_data(qrString)
    qrImf = qrObj.make_image().convert('RGB')
    qrImf.save("static/QRcodes/"+str(fb.id)+"off"+".png")
    return HttpResponse('OK')

#getFeedbackObj
def getFeedbackObj(request,method="GET",trustMode=False):
    if method=="GET":fbId= request.GET["ID"]
    elif method=="POST":fbId= request.POST["ID"]
    try:
        if trustMode:
            fb = Feedback.objects.filter(id=fbId)[0]
        else:
            fb = Feedback.objects.filter(id=fbId,user_id=getUserID(request))[0]
    except (ValidationError,IndexError):
        return 0
    if fb==None:return 0
    else:return fb

#get user id
def getUserID(request):
    if request.user.id != None: return request.user.id
    else: return cache.get(request.GET["authToken"])

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
    if 'redirect' in dict(request.GET).keys():
        return redirect(request.GET['redirect'])
    else:
        return HttpResponse('OK')

#generate answers
def generateAnswers(languageDict):
    answers = {"Verbal":[],"Rating":[]}
    for fbType in ["Verbal","Rating"]:
        for question in languageDict["Questions"][fbType]:
            try:
                answers[fbType].append({"Name":question,"Answers":[]})
                for pans in languageDict["Answers"][question]["Answers"]:
                    if type(pans)==dict:answers[fbType][-1]["Answers"].append(pans["Answers"])
                    else:break
            except KeyError:
                pass
    return answers

#feedback:returns page, where feedback can be edited
def feedback(request):
    fb = getFeedbackObj(request)
    if not fb:return errorPage("NoSuchFBERR",request)
    languageDict = loadLanguageDict()
    languageDict["Feedback"] = fb
    languageDict["HasName"] = fb.name.replace(" ","") != ""
    languageDict["Answers"] = json.loads(fb.jsonAnswers)
    #Form data 
    frm = Form.objects.filter(id=fb.form.id)[0]
    languageDict["Questions"] = json.loads(frm.jsonQuestions)
    #QR url
    languageDict["QRurl"] = "QRcodes/%s.png"%(fb.id)
    languageDict["fillUrl"] = languageDict["domain"]+languageDict["fillAddressURL"]%(fb.id)
    #status
    languageDict["Status"] = fb.status
    languageDict["StatusWord"] = languageDict[fb.status+"FBStatus"]
    #already filled
    alreadyFilled = fb.status in "AC"
    languageDict["alreadyFilled"] = alreadyFilled
    if alreadyFilled:languageDict["answerObj"] = generateAnswers(languageDict)
    #Load global forms
    languageDict["gForms"] = Form.objects.filter(user_id = getUserID(request),globalForm= True)
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
        gForm = Form.objects.filter(id=value,user_id=getUserID(request))[0]
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
    gFrm=Form(globalForm=True,name=request.GET["name"],user_id=getUserID(request),jsonQuestions=frm.jsonQuestions)
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

#change status
def changeStatus(request):
    fb = getFeedbackObj(request)
    if not fb:return errorPage("NoSuchFBERR",request)
    languageDict = loadLanguageDict()
    #change status
    statusList = ["W","A","C"]
    newStatus = statusList[statusList.index(fb.status)+int(request.GET["dir"])]
    fb.status = newStatus
    if newStatus == "A":
        activateFeedback(fb)
    fb.save()
    languageDict["Status"] = newStatus
    languageDict["StatusWord"] = languageDict[fb.status+"FBStatus"]
    #return new status block
    return answer(request,"loggedTemplates/feedback/status.html",languageDict)

#activate form
def activateFeedback(fb):
    #load form
    form = Form.objects.filter(id=fb.form_id)[0]
    questions = json.loads(form.jsonQuestions)
    #load answers json
    answers = json.loads(fb.jsonAnswers)
    #delete deleted questions from form
    refAns = answers.copy()
    for qName, qDict in refAns.items():
        qType = qDict["Type"]
        if qName in questions[qType]:
            del questions[qType][questions[qType].index(qName)]
        else:
            del answers[qName]
    #copy new questions to answers
    for qType,typeList in questions.items():
        for q in typeList:answers[q] = {"Type":qType,"Answers":[]}
    #shuffle
    keys = list(answers.keys())
    random.shuffle(keys)
    newDict = {}
    for key in keys:newDict[key] = answers[key]
    #save
    fb.jsonAnswers = json.dumps(newDict)
    
#fill feedback 
def fillFeedback(request):
    #load feedback
    fb  = getFeedbackObj(request,trustMode = True)
    if not fb:return errorPage("UnfillableERR",request)
    elif fb.status != "A":return errorPage("UnfillableERR",request)
    #find at most five with least rating count
    answers = json.loads(fb.jsonAnswers)
    answers = {k: v for k, v in sorted(answers.items(), key=lambda item: len(item[1]["Answers"]))}
    ansLen = len(answers.keys())
    qCount = 5 if ansLen >=5 else ansLen
    firstKeys = list(answers.keys())[0:qCount]
    selection = {}
    for fk in firstKeys:
        selection[fk] = answers[fk].copy()
        answers[fk]["Answers"].append(None)
        selection[fk]["Answers"] = 0
    #save feedback state
    fb.jsonAnswers = json.dumps(answers)
    fb.save()
    #return those five in appropriate format
    if "MI" in dict(request.GET).keys():return JsonResponse({"questions":selection,"fb":{"name":fb.name,"ID":fb.id}})
    else:
        languageDict = loadLanguageDict()
        languageDict["questions"] = selection
        languageDict["fb"] = fb
        return answer(request,"unloggedTemplates/fillFeedback.html",languageDict)

#submit feedback
@csrf_exempt
def submitFeedback(request):
    #load feedback
    fb = getFeedbackObj(request,method="POST",trustMode=True)
    fbAnswers = json.loads(fb.jsonAnswers)
    #parse response
    answers= json.loads(request.POST["Answers"])
    #copy answers
    for param,answerData in answers.items():
        ansList = fbAnswers[param]["Answers"]
        del ansList[-1]
        ansList.insert(0,answerData)
    #save
    fb.jsonAnswers = json.dumps(fbAnswers)
    fb.save()
    return HttpResponse('OK')

#loads all appropriate ratings from older feedbacks
def graphData(request):
    fb = getFeedbackObj(request)
    #get displaylable questions
    paramList = []
    responseDict = {}
    answers = json.loads(fb.jsonAnswers)
    for qName, answerData in answers.items():
        if answerData["Type"]=="Rating":
            paramList.append(qName.replace(" ",""))
            responseDict[qName] = []
    #loop through other feedbacks and save their answers to rating questions as well as their submissionDate 
    fbList = Feedback.objects.filter(user_id = getUserID(request)).order_by('submissionDate')
    for pfb in fbList:
        #check answer occurences
        pfbAnswers = json.loads(pfb.jsonAnswers)
        pfbQuestions = pfbAnswers.keys()
        for question in pfbQuestions:
            if pfbAnswers[question]["Type"]=="Rating":
                if question.replace(" ","") in paramList:
                    #calculate average
                    sum = 0
                    count = 0
                    for answer in pfbAnswers[question]["Answers"]:
                        if answer == None:break
                        count += 1
                        sum += int(answer["Answers"])
                    if count:
                        responseDict[question].append({"Rating":sum/count,"Name":pfb.name,"Date":pfb.submissionDate})
    return JsonResponse(responseDict)