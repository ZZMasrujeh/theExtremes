const URL = "https://codecyprus.org/th/api/";
const LIST = "list";

var quizzes;
//get available quizzes
HTTP = new XMLHttpRequest();
HTTP.open("GET", URL + LIST,true);
HTTP.send();
HTTP.onload = function () {
    if (this.status == 200) {
        let json = this.responseText;
        let object = JSON.parse(json);
        console.log("JSON ");
        console.log(object);
        quizzes= object.treasureHunts;
        let htmlText = "";
        document.getElementById("head").innerHTML="<p>Available Quizzes</p>"       //change the "title"
        for (let i = 0; i <quizzes.length; i++) {
            //check which quizzes are available and add them to the list
            htmlText +=
                "<div class='availableQuiz' >" +
                "<p>"+quizzes[i].name+"<br>";      //quizz name
            if (quizzes[i].maxDuration/1000/60) {       //display duration which is not zero
                htmlText+=
                    "Duration: "+quizzes[i].maxDuration/1000/60+" minutes<br>";
            }
            if (quizzes[i].shuffled) {
                htmlText+="The questions will be shuffled.<br>";
            }
            htmlText+= "by "+quizzes[i].ownerEmail+"<br>"+  //owners email
                "<button class='button' /onclick='getQuiz(a)'>Start</button>"+   //start button
                "</p>"+
                "</div>";
        }
        document.getElementById("content").innerHTML = htmlText;     //display the available quizzes
        document.getElementById("footer").innerText = "";
    }
};
