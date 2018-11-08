const URL = "https://codecyprus.org/th/api/";
const LIST = URL+"list";
const START = URL + "start?";
const APP = "app=team3";
const PLAYER = "player=";
const TREASURE_HUNT_ID = "treasure-hunt-id=";
const AMP = "&";
const QUESTION = URL + "question?";
const SESSION = "session=";
const SKIP = URL + "skip?";
const ANSWER = URL+"answer?";
const ANSWER_P = "answer=";
const LEADERBOARD = URL + "leaderboard?";

var quizzes;
var quizSelected;
var playersName="123456";
var session;


if (document.cookie!=""){       //continuing from previous session
    console.log(document.cookie);
    session = readFromCookie("session");
    if (session!="") {
        document.getElementById("footer").innerHTML = "<p>Cookie with content session: " + session + "</p>"
    }
    // else listAvailableQuizzes();
    nextQuestion();
} else {    //will choose a new session
    listAvailableQuizzes();
    document.getElementById("footer").innerHTML = "<p>Empty cookie</p>"
}

function listAvailableQuizzes() {
    /***************************************
     get available quizzes. AT THE MOMENT quizzes load once the page opens,
     if there is no active session
     ********************* */
    HTTP = new XMLHttpRequest();
    HTTP.open("GET", LIST, true);
    HTTP.send();
    HTTP.onload = function () {
        if (this.status == 200) {
            let json = this.responseText;
            let object = JSON.parse(json);
            console.log("Response of /list: ");
            console.log(object);
            quizzes = object.treasureHunts;
            let htmlText = "<input id='nameInput' placeholder='Enter a name here'>";
            document.getElementById("head").innerHTML = "<p>Available Quizzes</p>"                            //change the "title"
            for (let i = 0; i < quizzes.length; i++) {
                //check which quizzes are available and add them to the list
                htmlText +=
                    "<div class='availableQuiz' id='quiz'>" +
                    "<p> <span class='quizzName'>" + quizzes[i].name + ".</span><br>" +                          //quizz name
                    "<span class='description'>" + quizzes[i].description + "</span><br>";                     //quizz description
                if (quizzes[i].maxDuration / 1000 / 60 > 0) {                                                    //display duration which is not zero
                    htmlText += "Maximum duration: " + quizzes[i].maxDuration / 1000 / 60 + " minutes.<br>";
                } else {
                    htmlText += "Maximum duration: Unlimited.<br>";                                         //"unlimited" for zero maxDuration
                }
                if (quizzes[i].shuffled) {                                                                  //display information about SHUFFLED only
                    htmlText += "The questions will be shuffled.<br>";
                }
                if (quizzes[i].hasPrize) {                                                                  //display if there's prize
                    htmlText += "With prize.<br>"
                } else {                                                                                     //or not
                    htmlText += "Without prize.<br>"
                }
                htmlText += "By " + quizzes[i].ownerEmail + "<br>" +                                               //owners email
                    "<button class='button' onclick='getQuiz(" + i + ")'>Start</button>" +                           //start button
                    "</p>";
                htmlText+="</div>";

            }
            document.getElementById("content").innerHTML = htmlText;                                         //display the available quizzes in the content div
            // document.getElementById("footer").innerText = "";
            // }else {
            // resetText("Something went wrong...","Try refreshing the page and choose another quiz.");
        }
    };
}


function saveInCookie(property,value,endsOn){
    let expiryTime = new Date(endsOn);
    let expString = "expires=" + expiryTime.toUTCString();
    document.cookie = property + "=" + value + ";" + expString;
}

function readFromCookie(property) {
    let kv = document.cookie.split(";");
    for (let i = 0; i < kv.length; i++) {
        let key = kv[i].split("=")[0].trim();
        let val = kv[i].split("=")[1];
        if (property==key) return val;
    }
}
function deleteCookie() {
    let expiryTime = new Date(Date.now() -10000);
    let expString = "expires=" + expiryTime.toUTCString()+";";
    let kv = document.cookie.split(";");
    for (let i = 0; i < kv.length; i++) {
        let key = kv[i].split("=")[0].trim();
        document.cookie = key + "=; " + expString;
    }
}
//start a newly selected quiz
function getQuiz(a) {
    playersName = document.getElementById("nameInput").value;
    quizSelected = quizzes[a];
    let questionaireRequest = new XMLHttpRequest();
    console.log("loading quiz " + a);
    questionaireRequest.open("GET", START+PLAYER+playersName+AMP+APP+AMP+TREASURE_HUNT_ID+quizSelected.uuid,true);
    questionaireRequest.send();
    questionaireRequest.onload = function (){
        if (this.status == 200) {
            let response = this.responseText;
            let preQuestions = JSON.parse(response);
            console.log("Response of /start: ");
            console.log(preQuestions);
            if (preQuestions.status != "ERROR"){
                // console.log(JSON.stringify(preQuestions));
                saveInCookie("session", preQuestions.session, quizSelected.endsOn);
                session = preQuestions.session;
                nextQuestion();
            }else {
                document.getElementById("footer").innerHTML = preQuestions.errorMessages;
            }
        }
    }
}

//display question
function nextQuestion() {
    console.log("Fetching question");
    let questionRequest = new XMLHttpRequest();
    questionRequest.open("GET", QUESTION + SESSION + session,true);
    questionRequest.send();
    questionRequest.onload = function () {
        if (this.status == 200) {
            let response = this.responseText;
            let question = JSON.parse(response);
            console.log("question fetched. displaying...");
            console.log(question);
            if (question.status == "OK") {
                if (question.completed) {
                    /*************************************
                     Quiz has finished
                     *************************************/
                    document.getElementById("content").innerHTML = "<span>The quiz has finished</span>";
                    deleteCookie();
                    document.getElementById("footer").innerHTML = "<span>Cookie deleted</span>";

                    //leaderboard()?
                } else {
                    document.getElementById("head").innerHTML = "<p>" + question.questionText + "</p>";
                    /*************************************
                     Do something for other types of questions
                     *************************************/

                    document.getElementById("content").innerHTML = "<p><input type='text' id='answerBox'><input type='button' value='done' onclick='answer()'></p>"
                    if (question.canBeSkipped) {
                        document.getElementById("footer").innerHTML = "<button onClick='skip()'>Skip</button>";
                    } else {
                        document.getElementById("footer").innerHTML = "<span>Cannot be skipped</span>";
                    }
                }
            }
        }
    }
}

function answer() {
    let usersAnswer;
    usersAnswer = document.getElementById("answerBox").value;
    let answerRequest = new XMLHttpRequest();
    answerRequest.open("GET", ANSWER+SESSION+session+AMP+ANSWER_P+usersAnswer,true);
    answerRequest.send();
    answerRequest.onload =function () {
        if (this.status == 200) {
            let response = this.responseText;
            let a_response = JSON.parse(response);
            console.log(a_response);
            if (!(document.getElementById("content").innerHTML.endsWith("<p><button onclick='nextQuestion()'>Proceed</button></p>")))
                document.getElementById("content").innerHTML +=
                    "<p><button onclick='nextQuestion()'>Proceed</button></p>"
        }
    }
}

function skip() {
    let skip = new XMLHttpRequest();
    skip. open("GET",SKIP+SESSION+session, true);
    skip.send();
    skip.onload =function () {
        console.log(JSON.parse(skip.responseText));
        nextQuestion();
    }
}
