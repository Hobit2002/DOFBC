function userRequest(url,paramObject={},method="GET"){
    //send request
    var request = new XMLHttpRequest()
    //write url
    //prepare get/post data
    let urlEncodedDataPairs = [], name
    for(name in paramObject) {
     urlEncodedDataPairs.push(encodeURIComponent(name)+'='+encodeURIComponent(paramObject[name]))
    }

    request.onreadystatechange = function() {
        if (request.status < 400 && request.status >= 300){
            displayUrl = request.getResponseHeader("Location")
        }
        else if(request.readyState == 4 && request.status == 200) {  
            //rewrite displayed url
            if(method=="POST"){
                urlEncodedDataPairs.push("ajaxForm=1")
            }
            window.history.pushState({},"",displayUrl) 
            //redraw content block
            utContent.innerHTML = request.responseText
        }
    }
    //send XMLHttpRequest
    if(method=="GET"){
        displayUrl = url + urlEncodedDataPairs
        urlEncodedDataPairs.push("ajaxForm=1")
        console.log("enc pairrs:",urlEncodedDataPairs)
        url += "?"+urlEncodedDataPairs
    }
    else if(method=="POST"){
        request.setRequestHeader('Content-type', 'multipart/form-data')
        request.setRequestHeader("x-csrf-token", csrfToken)
    }
    request.open(method, url, true);
    request.send(urlEncodedDataPairs)


    
}