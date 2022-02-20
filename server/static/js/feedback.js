//initialize variables
var maxProgress = 4
var progress = -1
let parameter
let fStars
moveQuestion()

//display question
function drawQuestion(question){
    //load templates
    Questiontitle.hidden=false
    currentProgress.innerHTML =progress+1
    var headerTitleTemplate = document.getElementById("FeedbackTitleTemplate")
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
        Questionblock.innerHTML = htmlBase.replace(/TR/g,"")
        //pastes previous rating
        if(question["Answers"]){
            var filledStars = parseInt(question["Answers"])
            fillButtons(filledStars)
        }
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
        userRequest('submitFeedback',{"ID":fbID,"Answers":JSON.stringify(fbData)},"POST",false)
        Questionblock.innerHTML = FeedbackCompletedTemplate.innerHTML
        Questiontitle.hidden = true
        ProgressRow.hidden = true
        PreviousColumn.hidden = true
    }
}

//fill buttons
function fillButtons(index){
    fStars = index
    if(document.getElementById("Star"+String(index)).dataset.overed == "false"){
        var Starset = Array.from(document.getElementsByClassName("starblock"))
        Starset.forEach(star=>{
            star.dataset.overed = "false"
            if(parseInt(star.id.replace("Star",""))<=index){
                star.innerHTML = filledStarTemplate.innerHTML
            }else{
                star.innerHTML = blankStarTemplate.innerHTML
            }
        })
        document.getElementById("Star"+String(index)).dataset.overed = true
    }
     
}
