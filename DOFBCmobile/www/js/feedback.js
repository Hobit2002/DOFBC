//initialize variables
var maxProgress = 4
var progress = -1
let parameter
let fStars

//display question
function drawQuestion(question){
    //load templates
    Questiontitle.hidden=false
    currentProgress.innerHTML =progress+1
    var htmlBase = document.getElementById(question["Type"]+"FeedbackTemplate").innerHTML
    //draws verbal question
    if(question["Type"]=="Verbal"){
        Questionblock.innerHTML = htmlBase.replace(/Replace/g,"Ready")
        //pastes previous answer
        if(question["Answers"]){
            DescriptionReady.value = question["Answers"]
        }
    }
    //draws rating question
    else{
        //pastes previous rating
        if(question["Answers"] == 0){htmlBase= htmlBase.replace(/Progress/g,7)}
        else{htmlBase= htmlBase.replaceAll(/Progress/g,question["Answers"])}
        Questionblock.innerHTML = htmlBase.replace(/TR/g,"")
    }
    //finally draw to the document
    Questiontitle.innerHTML = parameter
    //next and previous 
    if(progress){
        PreviousQuestionButton.hidden = false 
    }
}

//move question
function moveQuestion(direction = 1){
    progress += direction
    parameter =  Object.keys(fbData)[progress]
    question = fbData[parameter]
    drawQuestion(question)
}

//submit question
function submitQuestion(answer){
    //get answer value
    if(answer!=answer){
        answer = fbData[parameter]["Type"]=="Rating" ? fStars : DescriptionReady.value
    }
    // save the answer to dict
    fbData[parameter]["Answers"] = answer
    //if there are some questions left, draw the next one
    if(maxProgress-progress){
        moveQuestion()
    }
    //if all questions were submitted, send them to server
    else{
        activeRequest('submitFeedback',{"ID":fbResponse["fb"]["ID"],"Answers":JSON.stringify(fbData),"Unexpected":"1"},"POST")
        Questionblock.innerHTML = feedbackCompletedTemplate.innerHTML
        Questiontitle.hidden = true
        ProgressRow.hidden = true
        PreviousColumn.hidden = true
    }
}

//fill buttons
function fillButtons(index){
    AltStar.innerHTML=String(index)+"/10"
    fStars = index
     
}