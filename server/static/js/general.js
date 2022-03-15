const historyList = []
const contedRegister = {}
let answers

function userRequest(url,paramObject={},method="GET",visible=true,altHtmlDestination=false){
    let reqPromise = new Promise(async function(resolve){
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
            if(request.readyState == 4 && request.status == 200) {
                //redraw content block
                if(visible){
                    var destination = altHtmlDestination ? altHtmlDestination : utContent;
                    destination.innerHTML = request.responseText
                    if(!altHtmlDestination){
                        window.history.pushState({},"",request.responseURL.replace("&ajaxForm=1",""))
                        historyList.push(request.responseURL)
                    }
                }
                resolve() 
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
    })
    return reqPromise
}

function commitChanges(site,object){
        var address = site +"Update"
        var parameter = object.id.slice(0,-1*(site.length))
        var objId = document.getElementById(site+"ObjId").value
        var value = object.firstChild.nodeValue
        value = value.replaceAll("\n","")
        var spaceFinder = RegExp("[ \t]{2,}",'g')
        value = value.replace(spaceFinder," ")
        userRequest(address,{"ID":objId,"parameter":parameter,"value":value},method="GET",visible=false)
}

function edittextContent(object,site){
    object.contentEditable = true
    contedRegister[object.id] = 1
    object.addEventListener("focusout",function (event){
        if(contedRegister[object.id]){
            contedRegister[object.id] = 0
            commitChanges(site,object)
            object.contentEditable = false
        }
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

//special functions
async function switchQRNetworkState(newstate){
    //send request
    if(newstate=="offline"){
        await userRequest("generateOfflineQR",{"ID":feedbackObjId.value},"GET",false)
    //set src
        offlineQRCode.src = onlineQRCode.src.replace(".png","off.png")
    }
    //handle hiding and disabling
    var oldstate = newstate == "offline" ? "online" : "offline"
    document.getElementById(newstate+"SwitchQRButtonFeedback").disabled = true
    document.getElementById(oldstate+"SwitchQRButtonFeedback").disabled = false
    document.getElementById(newstate+"QRFeedback").hidden = false
    document.getElementById(oldstate+"QRFeedback").hidden = true
}

//Functions for showing feedback
async function drawAnswers(){
    answers = JSON.parse(answerObj.value.replace(/'/g,"\""))
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
    await userRequest("graphData",{"ID":feedbackObjId.value},'GET',true,graphJsonSpace)
    var graphData = JSON.parse(graphJsonSpace.value)
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
    }
    else{
        graphPlaceFeedback.hidden = true
    }
}