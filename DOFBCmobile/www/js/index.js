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

// Wait for the deviceready event before using any of Cordova's device APIs.
// See https://cordova.apache.org/docs/en/latest/cordova/events/events.html#deviceready
document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    // Cordova is now initialized. Have fun!
    console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);
}

//  ********************************************************************************* 
//  ****************          My functions               *********************** 
//  *********************************************************************************

//global variables
let CSRFToken
let server = "https://www.pochlebnik.eu"
let urlBase = server+"/mi/"
let staticUrl = server+ "/static/"
let response = ""
let view = "crossroad"
let fbStatus = 0
let fbStatusList = ['W','A','C']
let JSDict = {
    "WFBStatus":"Připravovaná",
    "AFBStatus":"Otevřená",
    "CFBStatus":"Uzavřená",
    "RatingQuestionsHTML":"Bodovací otázky",
    "VerbalQuestionsHTML":"Otázky s otevřenou odpovědí",
    "1nextButton":"=>",
    "-1nextButton":"<=",
    "FormNameHTML":"<i>Název formuláře</i>"
}

//react to user actions
editBut.addEventListener('click',login,false);

loginBut.addEventListener('click',function(){
    window.localStorage.setItem("loginname",loginnameLogin.value)
    window.localStorage.setItem("password",passwordLogin.value)
    login()
},false)

newFeedbackHomeBut.addEventListener('click',async function(){
    render("feedback")
    await request("newFeedback",{"MI":1})
    drawFeedback()
})

async function changeStatus(dir){
    await request('changeStatus',{'ID':feedbackObjId.value,'dir':dir})
    fbStatus = fbStatusList[fbStatusList.indexOf(fbStatus)+dir]
    renderFBStatus(fbStatus)
}

async function deleteObject(){
    await request('deleteObject',{'type':'feedback','ID':feedbackObjId.value})
    home()
}

async function openFeedback(fbid){
    render("feedback")
    await request("feedback",{"ID":fbid})
    drawFeedback()
}

async function useForm(){
    await request('feedbackUpdate',{'ID':feedbackObjId.value,'value':gFormsFeedback.value,'parameter':'form'})
    drawFeedback()
}

//do the real staff 
function drawFeedback(){
    render('feedback')
    fbData = JSON.parse(response)
    feedbackObjId.value = fbData.ID
    if(fbData.name=="" || fbData.name==undefined){
        fbData.name = JSDict["FormNameHTML"]
    }
    nameFeedback.innerHTML = fbData.name
    //options
    Array.from(fbData.gForms).forEach(function(gForm){
        gFormsFeedback.innerHTML+=loadTemplate("gFormOption",gForm.id,gForm.name)
    })
    //QR address
    document.getElementById("1QRWindowFeedback").children[1].src = staticUrl + fbData.QRurl
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
            console.log(question)
            html += loadTemplate("fbRow",queIndx,question,queType)
            queIndx+=1
        })
        rowList.innerHTML = html
    })
}

async function home(){
    render("home")
    await request("home")
    feedbacks = JSON.parse(response)
    Array.from(feedbacks).forEach(function(fb){
        
        homeFBSpace.innerHTML += loadTemplate("fbBlock",fb["id"],fb["name"])
    })
    
}

async function login(){
    //load login data from storages
    var loginname = window.localStorage.getItem("loginname")
    var password = window.localStorage.getItem("password")
    if(loginname==undefined || password==undefined){
        render("login")
        return
    }
    //send request
    await request("checkAuth",{"loginname":loginname,"password":password},"POST")
    //render the screen accordingly
    if(response[0]==="T"){
        home()
    }
    else{
        render("login")
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
//support functions
async function commitChanges(site,object){
    address = site +"Update"
    parameter = object.id.slice(0,-1*(site.length))
    objId = document.getElementById(site+"ObjId").value
    await request(address,{"ID":objId,"parameter":parameter,"value":object.firstChild.nodeValue})
}

function loadTemplate(className,...values){
    html = document.getElementById(className+"Template").innerHTML
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

function request(url,paramObject={},method="GET"){
    //write url
    console.log("Sending request")
    let reqPromise = new Promise(async function(resolve){
        url = urlBase + url
        var request = new XMLHttpRequest()
        let name
        var urlEncodedDataPairsStr = ""
        for(name in paramObject) {
            urlEncodedDataPairsStr+=encodeURIComponent(name)+'='+encodeURIComponent(paramObject[name])+"&"
        }
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
    question.innerHTML=""
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