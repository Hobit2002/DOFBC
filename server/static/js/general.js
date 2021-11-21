function userRequest(url,paramObject={},method="GET"){
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
            window.history.pushState({},"",request.responseURL.replace("&ajaxForm=1","")) 
            //redraw content block
            utContent.innerHTML = request.responseText
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