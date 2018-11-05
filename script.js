const URL = "https://codecyprus.org/th/api/";
const LIST = "list";

var quizzes;

//get available quizzes. AT THE MOMENT quizzes load once the page opens
HTTP = new XMLHttpRequest();
HTTP.open("GET", URL + LIST,true);
HTTP.send();
HTTP.onload = function () {
    if (this.status == 200) {
        let json = this.responseText;
        let object = JSON.parse(json);
        console.log("Response of /list: ");
        console.log(object);
        quizzes= object.treasureHunts;
        let htmlText = "";
        document.getElementById("head").innerHTML="<p>Available Quizzes</p>"                            //change the "title"
        for (let i = 0; i <quizzes.length; i++) {
            //check which quizzes are available and add them to the list
            htmlText +=
                "<div class='availableQuiz' >" +
                "<p> <span class='quizzName'>"+quizzes[i].name+".</span><br>"+                          //quizz name
                "<span class='description'>"+quizzes[i].description+"</span><br>";                     //quizz description
            if (quizzes[i].maxDuration/1000/60 >0) {                                                    //display duration which is not zero
                htmlText += "Maximum duration: "+quizzes[i].maxDuration/1000/60+" minutes.<br>";
            }else {
                htmlText += "Maximum duration: Unlimited.<br>";                                         //unlimited for zero maxDuration
            }
            if (quizzes[i].shuffled) {                                                                  //display information about SHUFFLED olny
                htmlText += "The questions will be shuffled.<br>";
            }
            if (quizzes[i].hasPrize) {                                                                  //display if there's prize
                htmlText+="With prize.<br>"
            }else {                                                                                     //or not
                htmlText += "Without prize.<br>"
            }
            htmlText+= "By "+quizzes[i].ownerEmail+"<br>"+                                               //owners email
                "<button class='button' /onclick='getQuiz(a)'>Start</button>"+                           //start button
                "</p>"+
                "</div>";
        }
        document.getElementById("content").innerHTML = htmlText;                                         //display the available quizzes in the content div
        document.getElementById("footer").innerText = "";
        // }else {
        // resetText("Something went wrong...","Try refreshing the page and choose another quiz.");
    }
};

// if we keep everything in the same page, this might be useful for clearing what is displayed
// and also for showing error messages
function resetText(headMessage="",contentMessage="",footerMessage=""){
    document.getElementById("head").innerHTML="<p>"+headMessage+"</p>";
    document.getElementById("content").innerHTML = "<p>"+contentMessage+"</p>";
    document.getElementById("footer").innerText = "<p>"+footerMessage+"</p>";
}

