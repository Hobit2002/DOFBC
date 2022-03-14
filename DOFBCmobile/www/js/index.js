/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

//const { prepare } = require("cordova");

// Wait for the deviceready event before using any of Cordova's device APIs.
// See https://cordova.apache.org/docs/en/latest/cordova/events/events.html#deviceready
document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    //set data backups
    var dataBackupStr = localStorage.getItem("dataBackup")
    if(dataBackupStr == undefined){
        dataBackup = {}
        updateDataBackup()
    }
    else{dataBackup = JSON.parse(dataBackupStr)}
    //load to-send List
    var toSendStr = localStorage.getItem("toSend")
    if(toSendStr == undefined){
        toSend = []
        updateToSend()
    }
    else{toSend=JSON.parse(toSendStr)}
}

//  ********************************************************************************* 
//  ****************          My functions               *********************** 
//  *********************************************************************************

//global variables
let CSRFToken
let server = "https://www.pochlebnik.eu"//"http://localhost:8001"
let staticUrl = server+ "/static/"
let fbResponse
let fbData
let response = ""
let view = "crossroad"
let fbStatus = 0
let fbStatusList = ['W','A','C']
let authToken
let JSDict = {
    "WFBStatus":"Připravovaná",
    "AFBStatus":"Otevřená",
    "CFBStatus":"Uzavřená",
    "RatingQuestionsHTML":"Bodovací otázky",
    "VerbalQuestionsHTML":"Otázky s otevřenou odpovědí",
    "1nextButton":"=>",
    "-1nextButton":"<=",
    "FormNameHTML":"Název formuláře",
    "OfflineMissingData":"V offline režimu bohužel nejsou dostupná potřebná data",
    "OfflineUnupdateable":"V offline režimu neaktualizovatelné",
    "ScanError":"Skenování bylo přerušeno, zkuste to znovu, nebo zadejte url adresy"
}
let answers
let dataBackup
let toSend

//react to user actions
fillBut.addEventListener('click',function(){render('chooseFeedback')},false);

editBut.addEventListener('click',login,false);

feedbackBut.addEventListener('click',fillFeedback,false)

feedbackScanQRCode.addEventListener('click',scanQRCode,false)

fillFeedbackButtonHome.addEventListener('click',function(){render('chooseFeedback')},false)

fillFeedbackButtonLogin.addEventListener('click',function(){render('chooseFeedback')},false)

homeButtonFeedback.addEventListener('click',home,false)

homeButtonchooseFeedback.addEventListener('click',login,false)

loginBut.addEventListener('click',function(){
    window.localStorage.setItem("loginname",loginnameLogin.value)
    window.localStorage.setItem("password",passwordLogin.value)
    login()
},false)

newFeedbackHomeBut.addEventListener('click',async function(){
    render("feedback")
    await activeRequest("newFeedback",{"MI":1})
    drawFeedback()
})

async function changeStatus(dir){
    await activeRequest('changeStatus',{'ID':feedbackObjId.value,'dir':dir})
    fbStatus = fbStatusList[fbStatusList.indexOf(fbStatus)+dir]
    renderFBStatus(fbStatus)
}

async function deleteObject(){
    await activeRequest('deleteObject',{'type':'feedback','ID':feedbackObjId.value})
    home()
}

async function openFeedback(fbid){
    render("feedback")
    try{
        await jsonRequest("feedback",{"ID":fbid})
        drawFeedback()
    }
    catch{return}
    
}

async function useForm(){
    await request('feedbackUpdate',{'ID':feedbackObjId.value,'value':gFormsFeedback.value,'parameter':'form'})
    drawFeedback()
}

//do the real staff 
function drawFeedback(){
    render('feedback')
    fbData = JSON.parse(response)
    answers = fbData["answerObj"]
    feedbackObjId.value = fbData.ID
    if(fbData.name=="" || fbData.name==undefined){
        fbData.name = JSDict["FormNameHTML"]
    }
    nameFeedback.innerHTML = JSON.parse("[\""+fbData.name+"\"]")[0]
    //options
    Array.from(fbData.gForms).forEach(function(gForm){
        gFormsFeedback.innerHTML+=loadTemplate("gFormOption",gForm.id,gForm.name)
    })
    //QR address
    document.getElementById("onlineQRCode").src = staticUrl + fbData.QRurl
    //FB status
    fbStatus = fbData.Status
    renderFBStatus(fbData.Status)
    //add row blocks
    Array.from(["Verbal","Rating"]).forEach(function(queType){
        questionsFeedback.innerHTML += loadTemplate("rowList",JSDict[queType+"QuestionsHTML"],queType)
        //add fbRows
        var rowList = document.getElementById(queType + "QueLiFeedback")
        var html = rowList.innerHTML
        var queIndx = 0
        Array.from(fbData.Questions[queType]).forEach(function(question){
            html += loadTemplate("fbRow",queIndx,question,queType)
            queIndx+=1
        })
        rowList.innerHTML = html
    })
    //draw answers
    if(fbData["alreadyFilled"]){
        drawAnswers()
    }
    else{
        answerList.hidden = true
    } 
}

function drawFeedbackForm(){
    fbResponse = JSON.parse(response)
    fbData = fbResponse["questions"]
    feedbackName.innerHTML = fbResponse["fb"]["name"]
    render('fillFeedback')
    moveQuestion()
}

async function fillFeedback(){
    try{
        //if url was given, call server
        var url = new URL(feedbackAddress.value+"&MI=1")
        await request(url.pathname.slice(4)+url.search,{},'GET')
    }
    catch(err){
        //if json was given, randomly choose your own answers
        var questionset = JSON.parse(feedbackAddress.value)
        var selection = {"questions":{},"fb":{}}
        selection["fb"]["name"] = questionset["name"]
        selection["fb"]["ID"] = questionset["id"]
        //get the number of verbal and rating feedbacks
        var questionCount = questionset["Verbal"].length + questionset["Rating"].length
        var selectionCount = questionCount >=5 ? 5 : questionCount
        var verbalCount = Math.floor((Math.random() * selectionCount) + 1)
        var counts = {"Verbal":verbalCount,"Rating":selectionCount-verbalCount}
        Array.from(["Verbal","Rating"]).forEach(function(type){
            var secondType = type == "Verbal" ? "Rating" :"Verbal"
            if(counts[type]>questionset[type].length){
                counts[secondType]+= counts[type]-questionset[type].length
                counts[type] = questionset[type].length
            }
        })
        //choose questions
        Array.from(["Verbal","Rating"]).forEach(function(type){
            var tSelected = 0
            var alreadySelected = []
            while(tSelected < counts[type]){
                var selectionIndex = Math.floor(Math.random() * questionset[type].length)
                while(alreadySelected.includes(selectionIndex)){
                    selectionIndex = Math.floor(Math.random() * questionset[type].length)
                }
                alreadySelected.push(selectionIndex)
                var name = questionset[type][selectionIndex]
                selection["questions"][name] = {"Type":type,"Answers":0}
                tSelected += 1
            }
        })
        response = JSON.stringify(selection)
    }
    drawFeedbackForm()
}

async function home(){
    render("home")
    await jsonRequest("home")
    feedbacks = JSON.parse(response)
    var tok = 0
    Array.from(feedbacks).forEach(function(fb){
        if(!(tok%3)){homeFBSpace.innerHTML+=loadTemplate("fbBlockRow")}
        homeFBSpace.children[homeFBSpace.children.length -1].innerHTML += loadTemplate("fbBlock",fb["id"],fb["name"])
        tok+=1
    })

}

async function login(){
    try{
        //load login data from storages
        var loginname = window.localStorage.getItem("loginname")
        var password = window.localStorage.getItem("password")
        if(loginname==undefined || password==undefined){
            render("login")
            return
        }
        //send request
        if(navigator.connection.type == Connection.NONE){
            response = " "
        }
        else{
            await request("checkAuth",{"loginname":loginname,"password":password},"POST")
        }
        //render the screen accordingly
        if(response.length){
            authToken = response
            //deal with toSend
            if(toSend.length && navigator.connection.type != Connection.NONE){
                toSend.forEach(async function(reqData){
                    await request(reqData["url"],reqData["paramObject"],reqData["method"],reqData["addBase"])
                })
                toSend = []
                updateToSend()
            }
            //move to home page
            home()
        }
        else{
            render("login")
        }
    }
    catch(err){
        errorDiv.innerHTML = err
    }
}

function renderFBStatus(status){
    var statusWord = JSDict[status + "FBStatus"]
    var statusHTML = loadTemplate("fbStatus",statusWord)
    if(status != "W"){
        statusHTML = loadTemplate("nextButton","-1",JSDict["-1nextButton"]) + statusHTML
    }
    if(status != "C"){
        statusHTML += loadTemplate("nextButton","1",JSDict["1nextButton"])
    }
    statusStateFeedback.innerHTML = statusHTML
}

function scanQRCode(){
    try{
        cordova.plugins.barcodeScanner.scan(success,error,{
            showTorchButton: true,
            prompt: "Scan your code",
            formats: "QR_CODE",
            resultDisplayDuration: 0
        })
        function success(result){
            if(!result.cancelled){
                feedbackAddress.value = result.text
                fillFeedback()
            }
            else{
                alert(JSDict["ScanError"])
            }
        }
        function error(err){
            console.log(err)
        }
    }
    catch(err){
        console.log(err)
    }
}

//support functions
async function activeRequest(url,paramObject={},method="GET",addBase = true){
    //if not connected to internet save data to to-send list
    if(navigator.connection.type == Connection.NONE){
        //save to toSend
        toSend.push({"url":url,"paramObject":paramObject,"method":method,"addBase":addBase})
        updateToSend()
        //save appropriate data
        switch (url) {
            case 'changeStatus':
                var fbKey = "feedback" + generateEncDataPairs({"ID":paramObject["ID"]},true)
                var fb = JSON.parse(dataBackup[fbKey])
                //change status
                var statusList = ["W","A","C"]
                var newStatus = statusList[statusList.indexOf(fb.Status)+parseInt(paramObject["dir"])]
                fb.Status = newStatus
                if (newStatus=="A"){
                    activateFeedback(fb)
                }
                dataBackup[fbKey] = JSON.stringify(fb)
                break    
            case 'deleteObject':
                //delete feedback link from home json
                var feedbackList = JSON.parse(dataBackup["home"])
                dataBackup["home"] = JSON.stringify(feedbackList.filter(fb => fb.id != paramObject.ID))
                //delete feedback dataBackup
                var fbKey = "feedback" + generateEncDataPairs({"ID":paramObject["ID"]},true)
                delete dataBackup[fbKey] 
                break
            case 'feedbackUpdate':
                var fbKey = "feedback" + generateEncDataPairs({"ID":paramObject["ID"]},true)
                var fb = JSON.parse(dataBackup[fbKey])
                var newVal = paramObject["value"]
                var parameter = paramObject["parameter"]
                if(parameter=='name'){
                    var nameJSONEncoded = JSON.stringify([newVal])
                    fb.name = nameJSONEncoded.slice(2,nameJSONEncoded.length-2)
                    //update feedback list
                    var feedbackList = JSON.parse(dataBackup["home"])
                    for(i=0;i<feedbackList.length;i++){
                        var fbHomeRep = feedbackList[i]
                        if(fbHomeRep.id == paramObject["ID"]){
                            fbHomeRep.name = newVal
                        }
                    }
                    dataBackup["home"] = JSON.stringify(feedbackList)
                }
                else if(parameter.slice(0,8)=="question"){
                    var queType = parameter.slice(8,14)
                    var index = parseInt(parameter.slice(14))
                    if(newVal.length){
                        try{
                            fb.Questions[queType][index] = newVal
                        }
                        catch{
                            fb.Questions[queType].push(newVal)
                        }
                    }
                    else{
                        fb.Questions[queType].splice(index)
                    }
                }
                else{
                    window.alert(JSDict["OfflineUnupdateable"])
                    break
                }
                dataBackup[fbKey] = JSON.stringify(fb)
                break
            case 'newFeedback':
                //generate feedback id
                var uuid = uuidv4()
                paramObject["uuid"] = uuid
                //generate default fb data
                var newFb = {"ID":uuid,
                    "name":"",
                    "Answers":{},
                    "Questions":{"Verbal":[],"Rating":[]},
                    "Status":"W",
                    "gForms":[],
                    "alreadyFilled":false,
                    "answerObj":{}
                }
                fbKey = "feedback" + generateEncDataPairs({"ID":uuid})
                var fbData = JSON.stringify(newFb)
                dataBackup[fbKey] = fbData
                response = fbData
                //add to home
                var feedbackList = JSON.parse(dataBackup["home"])
                feedbackList.push({"name":"","id":uuid})
                dataBackup["home"] = JSON.stringify(feedbackList)
                break
            default:
                break  
        }
        updateDataBackup()
    }
    //else get data from server and update backups
    else{
        await request(url,paramObject,method,addBase)
    }
}

async function commitChanges(site,object){
    address = site +"Update"
    parameter = object.id.slice(0,-1*(site.length))
    objId = document.getElementById(site+"ObjId").value
    await activeRequest(address,{"ID":objId,"parameter":parameter,"value":object.firstChild.nodeValue})
}

function generateEncDataPairs(paramObject,delAuthToken = false){
    let name
    var urlEncodedDataPairsStr = ""
    if(delAuthToken){
        console.log("Deleting token")
        delete paramObject["authToken"]
    }
    for(name in paramObject) {
        urlEncodedDataPairsStr+=encodeURIComponent(name)+'='+encodeURIComponent(paramObject[name])+"&"
    }
    return urlEncodedDataPairsStr
}

async function jsonRequest(url,paramObject={},method="GET",addBase = true){
    //if not connected to internet use dataBackup
    if(navigator.connection.type == Connection.NONE){
        var dbKey = url + generateEncDataPairs(paramObject,true)
        if(Object.keys(dataBackup).includes(dbKey)){
            response = dataBackup[dbKey]
        }
        else{
            window.alert(JSDict["OfflineMissingData"])
            throw "Insufficient data error"
        }
    }
    //else get data from server and update backups
    else{
        await request(url,paramObject,method,addBase)
        if(url=="feedback"){
            dataBackup[url+generateEncDataPairs(paramObject,true)] = response
        }
        else{
            dataBackup[url] = response
        }
        updateDataBackup()
    }
}

function loadTemplate(className,...values){
    var html = document.getElementById(className+"Template").innerHTML
    loopIndex = 0
    values.forEach(function(item){
        var regularExpr = new RegExp("TempRep"+loopIndex, 'g')
        html = html.replace(regularExpr,item)
        loopIndex+=1
    })
    return html
}

function render(newview){
    if(view=='feedback'){
        questionsFeedback.innerHTML = ""
    }
    else if(view == 'home'){
        homeFBSpace.innerHTML = ""
    }
    document.getElementById(view+"View").hidden = true
    document.getElementById(newview+"View").hidden = false
    view = newview
}

function request(url,paramObject={},method="GET",addBase = true){
    //write url
    let reqPromise = new Promise(async function(resolve){
        paramObject["authToken"] = authToken
        url = addBase ? urlBase() + url : url
        var request = new XMLHttpRequest()
        var urlEncodedDataPairsStr = generateEncDataPairs(paramObject)
        //prepare response recieving
        response = false
        request.onreadystatechange = function() {
            if(request.readyState == 4 && request.status == 200) {
                response = request.responseText
                resolve()
            }
        }
        //GET? or POST?
        //send XMLHttpRequest
        if(method=="GET"){
            displayUrl = url + urlEncodedDataPairsStr
            url += "?"+urlEncodedDataPairsStr
            request.open(method, url, true)
        }
        else if(method=="POST"){
            request.open(method, url, true)
            request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
        }
        request.send(urlEncodedDataPairsStr.slice(0,-1))
    })
    return reqPromise
}

function shuffle(array) {
    let currentIndex = array.length,  randomIndex;
  
    // While there remain elements to shuffle...
    while (currentIndex != 0) {
  
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
  
    return array;
}

async function switchQRNetworkState(newstate){
    //send request
    if(newstate=="offline"){
        if(navigator.connection.type == Connection.NONE){
            offlineQRDiv.innerHTML = ""
            var fb = JSON.parse(dataBackup["feedback" +generateEncDataPairs({"ID":feedbackObjId.value})])
            var qrQuestions = fb["Questions"]
            qrQuestions["id"] = feedbackObjId.value
            qrQuestions["name"] = fb.name
            new QRCode(offlineQRDiv,JSON.stringify(qrQuestions))
        }
        else{
            await request("generateOfflineQR",{"ID":feedbackObjId.value},"GET")
            //set src
            offlineQRCode.src = onlineQRCode.src.replace(".png","off.png")
        }
        
    }
    //handle hiding and disabling
    var oldstate = newstate == "offline" ? "online" : "offline"
    console.log(oldstate+"SwitchQRButtonFeedback")
    document.getElementById(newstate+"SwitchQRButtonFeedback").disabled = true
    document.getElementById(oldstate+"SwitchQRButtonFeedback").disabled = false
    document.getElementById(newstate+"QRFeedback").hidden = false
    document.getElementById(oldstate+"QRFeedback").hidden = true
}

function updateDataBackup(){
    localStorage.setItem("dataBackup",JSON.stringify(dataBackup))
}

function updateToSend(){
    localStorage.setItem("toSend",JSON.stringify(toSend)) 
}

function urlBase(){
    return server +"/mi/"
}

function uuidv4() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

//from server
function activateFeedback(fb){
    var questions = JSON.parse(fb.Questions)
    var answers = JSON.parse(fb.Answers)
    //delete deleted questions from form
    var refAns = JSON.parse(JSON.stringify(answers))
    Object.entries(refAns).forEach(([qName,qDict]) => {
        var qType = qDict["Type"]
        if(questions[qType].includes(qName)){
            delete questions[qType][questions[qType].indexOf(qName)]
        }
        else{
            delete answers[qName]
        }
    })
    //copy new questions to answers
    Object.entries(questions).forEach(([qType,typeList]) => {
        typeList.forEach(q=>{
            answers[q] = {"Type":qType,"Answers":[]}
        })

    })
    //shuffle
    var keys = shuffle(Object.keys(answers))
    var newObj = {}
    keys.forEach(key=>{
        newObj[key] = answers[key]
    })
    //save
    fb.Answers = JSON.stringify(newObj) 
}

function prepareQuestions(fbId){
    //load feedback data and get feedback state
    var fbKey = "feedback" + generateEncDataPairs({"ID":fbId},true)
    var fb = JSON.parse(dataBackup[fbKey])
    if(fb.Status!="A"){
        return "BadFeedbackState"
    }
    //find five with least rating count
    var sortable = []
    for(var answer in fb.Answers){
        sortable.push([answer,fb.Answers[answer]])
    }
    sortable.sort(function(a,b){
        return  a[1]["Answers"] - b[1]["Answers"] 
    })
    var ansLen = sortable.length
    var qCount = ansLen >= 5 ? 5 :ansLen
    var selected = sortable.concat(0,qCount)
    var selection = {}
    selected.forEach(kv =>{
        var fk = kv[0]
        selection[fk] = Object.assign({}, kv[1])
        kv[1]["Answers"].push(null)
        selection[fk]["Answers"] = 0
    })
    //save feedback state
    dataBackup[fbKey] = JSON.stringify(fb)
    updateDataBackup()
    //respond
    return JSON.stringify({"questions":selection,"fb":{"name":fb.name,"ID":fb.id}})
}


//from webapp
function edittextContent(object,site){
    object.contentEditable = true
    object.addEventListener("focusout",function (event){
        commitChanges(site,object)
        object.contentEditable = false
    })
    object.focus()
}

function addQuestion(type){
    var listElem = document.getElementById(type+"QueLiFeedback")
    var inpElem = document.getElementById("new"+type+"QueTextFeedback")
    var childCount = listElem.children.length
    document.getElementById(type+'QueLiFeedback').innerHTML+=loadTemplate('fbRow',childCount+1,inpElem.value,type)
    commitChanges('feedback',listElem.children[childCount].children[0]);
    inpElem.value=''
}

function deleteQuestion(parElem,type){
    //send message
    var question = parElem.children[0]
    question.innerHTML="\n"
    commitChanges('feedback',question)
    //delete elem
    parElem.remove()
    //renumerate other questions
    elements = Array.from(document.getElementsByClassName(type+"Question"))
    loopCounter = 1
    for(que of elements){
        que.id= "question"+type+String(loopCounter)+"Feedback"
        loopCounter+=1
    }

}

function switchToplineWindowBlock(element){
    //hide all topline content elements
    var toplineConts = Array.from(document.getElementsByClassName("toplineWindow"))
    for(el in toplineConts){
        toplineConts[el].children[0].hidden = false 
        toplineConts[el].children[1].hidden = true
        if(element.id[0]=="0"){
            toplineConts[el].children[0].className+=" dispNoneMobile"
        }
        else{
            toplineConts[el].children[0].className=toplineConts[el].children[0].className.replace("dispNoneMobile","")
        }
    }
    //show the appropriate one
    var newPrefix = String(1 - parseInt(element.id[0]))
    var newId = newPrefix+element.id.slice(1)
    element.hidden = true
    document.getElementById(newId).hidden=false
}

async function drawAnswers(){
    ratingPlaceFeedback.innerHTML = ""
    //rating questions
    answers["Rating"].forEach(question => {
        //calculate average
        var count = 0
        var average = 0
        question["Answers"].forEach(rating =>{
            count+=1
            average+=parseInt(rating)
        })
        average = Math.round(100*average/count)/100
        //insert new fedback line
        ratingPlaceFeedback.innerHTML+= FeedbackRatingAnswerTemplate.innerHTML.replace(/ToReplace/g, question["Name"]).replace(/NumRep/g, String(average)).replace(/undefined/g, " ??? )-:").replace(/NaN/g, " ??? )-:").replace(/AnswerCount/g, count)    
    });
    //verbal questions
    var cmid = 0
    answers["Verbal"].forEach(question => {
        ratingPlaceFeedback.innerHTML+= FeedbackVerbalAnswerTemplate.innerHTML.replace(/cmid/g,cmid).replace(/QuestionName/g,question["Name"]).replace(/Content/g,question["Answers"][0])
        cmid+=1
    })
    //create graph
    await request("graphData",{"ID":feedbackObjId.value})
    var graphData = JSON.parse(response)
    createGraph(graphData)
}

function nearComment(textbox,questionIndex,direction){
    var questionAns = answers["Verbal"][questionIndex]["Answers"]
    var curState = parseInt(textbox.dataset.shownid)
    var nextState = curState + direction
    var qaLen = questionAns.length
    nextState = nextState >= 0 ? nextState < qaLen ? nextState : 0 : qaLen + direction
    textbox.innerHTML = questionAns[nextState]
    textbox.dataset.shownid = nextState
}

//chart drawing
var RankingGraph = 0
var Backshift = 0
var tooltipdata=[]
var labels=[]
var configuration={}
var canv =""
var datasets = []
var datasettemp = { 
    label:")-:",
    backgroundColor:"green",
    borderColor:"green",
    fill:false,
    data:[]}

var colourarr = ["green","mediumseagreen","seagreen","olive","darkgoldenrod","olivedrab","yellowgreen","springgreen","palegreen","mediumaquamarine"]

function createGraph(graphData){
    //Initialize graph variables
    RankingGraph = 0
    Backshift = 0
    data = []
    tooltipdata=[]
    labels=[]
    configuration={}
    datasets = []
    canv = FeedbackHistoryGraph.getContext("2d")
    var greatest = new Date(1989,1,1)
    var smallest = new Date(3000,1,1)
    //loop ranked parameters
    var d = 0
    Object.entries(graphData).forEach(feedbackData=>{
        if(feedbackData[1].length -1){
            var feedbackName = feedbackData[0]
            datasets.push({
                label : feedbackName,
                borderColor : colourarr[d],
                data:[]
            })
            d += 1
            //loop answers
            feedbackData[1].forEach(answer=>{
                //get rating
                var rating = answer["Rating"]
                //get dates 
                var releaseTime = new Date(answer["Date"])
                if(releaseTime>greatest){greatest=releaseTime}
                if(releaseTime<smallest){smallest=releaseTime}
                var pushRelease = String(releaseTime.getDate())+". "+String(releaseTime.getMonth()+1)+". "+String(releaseTime.getFullYear())
                //push answer data to appropriate structures
                datasets[datasets.length-1]["data"].push({x:pushRelease,y:rating})
                tooltipdata.push({"Name":answer["Name"],"Label":feedbackName})
            })
        }
    })
    //prepare labels
    if(datasets.length){
        var base = smallest
        while(base<greatest){
            base.setDate(base.getDate() + 1)
            labels.push(String(base.getDate())+". "+String(base.getMonth()+1)+". "+String(base.getFullYear()))
        }
        //prepare configuration 
        configuration = {
            type:'line',
            data:{
                labels:labels,
                datasets:datasets
            },
            options:{
                scales: {
                    yAxes: [{
                        ticks: {
                            max: 10,
                            min: 0,
                            stepSize: 1
                        }
                    }]
                },
                responsive: true,
                maintainAspectRatio: false,
                tooltips:{
                    mode: 'index',
                    callbacks: {
                        title: (tooltipItems) => {
                            return tooltipdata[tooltipItems[0].index]["Name"]
                        },
                        label:(tooltipItem)=>{
                            return configuration.data.datasets[tooltipItem.datasetIndex].label
                        }
                    }
                },
            }
        }
        //draw graph
        RankingGraph = new Chart(canv,configuration)
        FeedbackHistoryGraph.style.height = "30vh"
    }
    else{
        graphPlaceFeedback.hidden = true
    }
}