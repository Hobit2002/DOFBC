const historyList = []

function userRequest(url,paramObject={},method="GET",visible=true,altHtmlDestination=false){
    //send request
    var request = new XMLHttpRequest()
    //write url
    //prepare get/post data
    let name
    var urlEncodedDataPairsStr = ""
    for(name in paramObject) {
        urlEncodedDataPairsStr+=encodeURIComponent(name)+'='+encodeURIComponent(paramObject[name])+"&"
    }

    request.onreadystatechange = function() {
        if(request.readyState == 4 && request.status == 200 && visible) {
            //redraw content block
            var destination = altHtmlDestination ? altHtmlDestination : utContent;
            destination.innerHTML = request.responseText
            if(!altHtmlDestination){
                window.history.pushState({},"",request.responseURL.replace("&ajaxForm=1",""))
                historyList.push(request.responseURL)
            } 
        }
    }
    //send XMLHttpRequest
    if(method=="GET"){
        displayUrl = url + urlEncodedDataPairsStr
        urlEncodedDataPairsStr+="&ajaxForm=1"
        url += "?"+urlEncodedDataPairsStr
        request.open(method, url, true)
    }
    else if(method=="POST"){
        request.open(method, url, true)
        request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
        request.setRequestHeader("X-CSRFToken", csrfToken)
    }
    request.send(urlEncodedDataPairsStr.slice(0,-1)+"&ajaxForm=1")
}

function commitChanges(site,object){
    address = site +"Update"
    parameter = object.id.slice(0,-1*(site.length))
    objId = document.getElementById(site+"ObjId").value
    userRequest(address,{"ID":objId,"parameter":parameter,"value":object.firstChild.nodeValue},method="GET",visible=false)
}

function edittextContent(object,site){
    object.contentEditable = true
    object.addEventListener("focusout",function (event){
        commitChanges(site,object)
        object.contentEditable = false
    })
    object.focus()
}

function insertElement(what,where,replaceObj){
    newElemHTML = document.getElementById(what+"Template").innerHTML
    for(const [replaceIt,replaceBy] of Object.entries(replaceObj)){
        newElemHTML = newElemHTML.replaceAll(replaceIt,replaceBy)
    }
    document.getElementById(where).innerHTML+=newElemHTML
}

function addQuestion(type){
    var listElem = document.getElementById(type+"QueLiFeedback")
    var inpElem = document.getElementById("new"+type+"QueTextFeedback")
    var childCount = listElem.children.length;
    insertElement('questionFeedback',type+'QueLiFeedback',{'Quetype':type,'Loocounter':childCount+1,'Quecontent':inpElem.value});
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

function handleButtonClick(url,paramObject,conditions,method="GET",visible=true,effects={'clearIt':[]}){
    //check conditions
    for(errorMessage in conditions){
        if(!(conditions[errorMessage])){
            //raise alert
            alert(errorMessage)
            return
        }
    }
    //if conditions are valid send requests
    userRequest(url,paramObject,method,visible)
    //if request does not redraw the page, execute the effects
    if(!visible){
        for(clear in effects["clearIt"]){
            clear.value=""
        }
    }
}

function switchToplineWindowBlock(element){
    //hide all topline content elements
    var toplineConts = Array.from(document.getElementsByClassName("toplineWindow"))
    for(el in toplineConts){
        toplineConts[el].children[0].hidden = false 
        toplineConts[el].children[1].hidden = true}
    //show the appropriate one
    var newPrefix = String(1 - parseInt(element.id[0]))
    var newId = newPrefix+element.id.slice(1)
    element.hidden = true
    document.getElementById(newId).hidden=false
}