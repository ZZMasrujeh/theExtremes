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
const SCORE = URL + "score?";
const LOCATION = URL + "location?";
const LOCATION_INTERVAL = 60000;

/************************************************************************
 * Scenario 1: the page starts from the beggining                       *
 * ******************************************************************** *
 * Scenario 2: the page resumes from the latest icomplete question.     *
 ***********************************************************************/

var quizzes; //all quizzes after listAvailableQuizzes(),initialize there.
var quizSelected;   /*the quiz selected from all available, initialized in getQuiz()
 in both scenarios, however in the second scenario, the page will have to load the list again*/

var playersName=""; //when the player is about to start, he must specify a name
var session="";     //new or from cookie
var quizName = "";  //new or from cookie ?????name vs ID?????

var answerBox;  //temporarily storing the representation of the answer area

var header = document.getElementById("header");
var content = document.getElementById("content");
var footer = document.getElementById("footer");

var navigation = [];    //will be used to hold the navigation of the users
var buttonDiv = document.createElement("div");  //div of backButton, for naviagation
buttonDiv.innerHTML = "<button onclick='backButton()'>Back</button>";
let scoreNumber =0;

var quizHasFinished = false;

//continuing from previous session
if (document.cookie!=""){
    console.log(document.cookie);
    session = readFromCookie("session");
    quizName = readFromCookie("quizName");
    playersName = readFromCookie("playersName");
    getLocation();
    setInterval(getLocation,LOCATION_INTERVAL );

    if (session!="") {
        footer.innerHTML = "<p>Cookie with content session: " + session + "</p>"
    }
    nextQuestion();
    // will choose a new session
} else {
    listAvailableQuizzes();
    footer.innerHTML = "";
}

function nav() {    //places the backButton
    if (navigation.length > 0) {
        buttonDiv.innerHTML = "<button onclick='backButton()'>Back</button>";
        document.body.appendChild(buttonDiv);
    }
}

function backButton() {
    switch (navigation[navigation.length-1]) {
        case "list":
            listAvailableQuizzes();
            break;
        case "question":
            showMore(quizSelected);
            break;
    }
    navigation.pop();
    if (navigation.length <= 0) {
        buttonDiv.innerHTML = "";
    }
}

/**************************************************************
 * W3Schools  https://www.w3schools.com/js/js_cookies.asp     *
 *************************************************************/
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
/**************************************************************
 * W3Schools  https://www.w3schools.com/js/js_cookies.asp     *
 *************************************************************/

/***
 * listAvailableQuizzes()
 * Loads and shows all available quizz NAMES ONLY, once the page is visited,
 * or when the back button is pressed when viewing the details of a quiz
 */
function listAvailableQuizzes() {
    let HTTP = new XMLHttpRequest();
    HTTP.open("GET", LIST, true);
    HTTP.send();
    HTTP.onload = function () {
        if (this.status == 200) {
            let json = this.responseText;
            let object = JSON.parse(json);
            console.log("Response of /list: ");
            console.log(object);
            quizzes = object.treasureHunts;
            let htmlText = "";
            // htmlText= "<input id='nameInput' placeholder='Enter a name here'>";
            header.innerHTML = "<p>Available Quizzes</p>";                            //change the "title"
            for (let i = 0; i < quizzes.length; i++) {
                //check which quizzes are available and add them to the list
                htmlText +=
                    "<div onclick='showMore("+i+")' class='availableQuiz'>" +
                    "<p> <span class='quizzName'>" + quizzes[i].name + ".</span><br></p></div>";
            }
            content.innerHTML = htmlText;    //display the available quizzes in the content div
        }
        navigation.push("list");
        if (quizName != "") {
            footer.innerHTML = quizName + " is still active. You may start a new one, once there are no active hunts";

        }else footer.innerHTML = "";
    };
}

//shows details from the selected quize
function showMore(quizNumber) {  //more details about the selected quiz
    nav();
    header.innerHTML = quizzes[quizNumber].name;
    let htmlText;
    htmlText = "<div>" +
        "<p>"+
        "Description: " + quizzes[quizNumber].description+"<br>";   //description
    if (quizzes[quizNumber].maxDuration/1000/60> 0){
        htmlText += "Duration: " + (quizzes[quizNumber].maxDuration / 60 / 1000) + " minutes<br>";  //duration
    } else {
        htmlText +="Duration: Unlimited<br>";
    }
    htmlText+=
        "Starts on: "+ (new Date(quizzes[quizNumber].startsOn).toUTCString())+"<br>"+ //start
        "Ends on: "+(new Date(quizzes[quizNumber].endsOn).toUTCString())+"<br>";        //end
    if (quizzes[quizNumber].hasPrize){
        htmlText+="With Prize<br>";                                                     //prize
    } else {
        htmlText+="Without Prize<br>";                                                  //or not
    }
    if (quizzes[quizNumber].shuffled){                                                  //shuffling
        htmlText+="The questions appear in random order<br>";
    } else {
        htmlText+="The questions appear in the same order<br>";
    }
    htmlText += "by: " + quizzes[quizNumber].ownerEmail + "<br><br>" ;
    console.log(session);

    quizName = quizzes[quizNumber].name;
    /****************************************************************************************
        this is necessary, otherwise this if(quizName != quizzes[quizNumber].name) wont work
     ***************************************************************************************/
    // In case the page is closed and reopened: checks if there is a stored session *
    if (session != "") { // already running a quiz
        if (quizName != quizzes[quizNumber].name) {  //if a different quiz from the one that is running, is selected
            htmlText += "<p>You have another running quiz. Finish that one first !</p>";//its warning
            htmlText+= "<button onclick='nextQuestion()'>Resume other quiz</button> ";
        }else {    //if the same, running, quiz is selected from the list
            htmlText+= "<button onclick='nextQuestion()'>Resume quiz</button> ";
        }
    }else { //no running quiz
        htmlText+= "<input id='nameInput' placeholder='Enter a name here'> <br>" +
            "<button class='button' onclick='getQuiz(" + quizNumber + ")'>Start</button><br>" ;
    }
    htmlText+="<p id='leaderP'><button onclick='leaderboard(" +quizNumber+
        ")' id='leaderButton'>Leaderboard</button></p></p></div>";
    content.innerHTML = htmlText;
    // navigation.push("showMore");
}

//start a newly selected quiz
function getQuiz(quizNumber) {
    playersName = document.getElementById("nameInput").value;
    console.log("NAME: "+playersName);
    if (playersName == "") {    //check if the users has entered something as name
        footer.innerHTML = "You must enter a name first";
    } else {
        quizSelected = quizzes[quizNumber];
        let questionaireRequest = new XMLHttpRequest();
        console.log("loading quiz " + quizNumber);
        questionaireRequest.open("GET", START + PLAYER + playersName + AMP + APP + AMP +
            TREASURE_HUNT_ID + quizSelected.uuid, true);
        questionaireRequest.send();
        questionaireRequest.onload = function () {
            if (this.status == 200) {
                let response = this.responseText;
                let preQuestions = JSON.parse(response);
                console.log("Response of /start: ");
                console.log(preQuestions);
                if (preQuestions.status != "ERROR") {
                    console.log(JSON.stringify(preQuestions));
                    /*************************
                     * QUIZ HAS STARTED
                     ************************/
                    saveInCookie("session", preQuestions.session, quizSelected.endsOn);
                    session = preQuestions.session;
                    saveInCookie("quizName", quizSelected.name, quizSelected.endsOn);
                    quizName = quizSelected.name;
                    saveInCookie("playersName", playersName, quizSelected.endsOn);
                    getLocation();
                    setInterval(getLocation,LOCATION_INTERVAL );
                    nextQuestion();

                } else {
                    footer.innerHTML = preQuestions.errorMessages;
                }
            }
        }
    }
}

//get and display question
function nextQuestion() {
    if (navigation.length == 0) {   //In the scenario 2 the navigation starts empty. pushing the 'list' will provide
        navigation.push("list");    //the user with something to navigate out of the question.
    }
    nav();//places the back button, no matter the scenario
    console.log("Fetching question");
    let questionRequest = new XMLHttpRequest();
    questionRequest.open("GET", QUESTION + SESSION + session,true);
    questionRequest.send();
    questionRequest.onload = function () {
        if (this.status == 200) {
            let response = this.responseText;
            let question = JSON.parse(response);
            let totalQuestions = question.numOfQuestions;
            let currentQuestion = question.currentQuestionIndex + 1;
            console.log("question fetched. displaying...");
            console.log(question);
            if (questionRequest.requiresLocation) {
                getLocation();
            }
            if (question.status == "OK") {
                if (question.completed) {
                    //leaderboard() with session ?
                    quizHasFinished = true;
                    /*************************************
                     Quiz has finished
                     *************************************/
                    //clear all
                    header.innerHTML = "Congratulations " + playersName + " for completing the quiz<br>" +
                        "Your final score is "+scoreNumber+" points.";

                    deleteCookie();
                    session = "";
                    playersName = "";
                    quizName = "";
                    answerBox = "";
                    content.innerHTML = "";
                    footer.innerHTML = "";


                } else {
                    header.innerHTML = "<p>Question "+currentQuestion+"/"+totalQuestions+":<br>"
                        + question.questionText + "</p>";
                    /*************************************
                     Do something for other types of questions
                     *************************************/
                    if (question.questionType == "INTEGER" || question.questionType == "NUMERIC" ) {
                        answerBox= "<div id='dials'><p>" +
                            "<input type='button' onclick='addToAnswerBox("+1+")' value='1'>" +
                            "<input type='button' onclick='addToAnswerBox("+2+")' value='2'>" +
                            "<input type='button' onclick='addToAnswerBox("+3+")' value='3'><br>"+
                            "<input type='button' onclick='addToAnswerBox("+4+")' value='4'>" +
                            "<input type='button' onclick='addToAnswerBox("+5+")'value='5'>" +
                            "<input type='button' onclick='addToAnswerBox("+6+")' value='6'><br>"+
                            "<input type='button' onclick='addToAnswerBox("+7+")' value='7'>" +
                            "<input type='button' onclick='addToAnswerBox("+8+")' value='8'>" +
                            "<input type='button' onclick='addToAnswerBox("+9+")' value='9'><br>"+
                            "<input type='button' onclick='addToAnswerBox(" +'"."'+ ")' value='.'>" +
                            "<input type='button' onclick='addToAnswerBox("+0+")' value='0'></p></div>" +
                            "<p><input type='text' id='answerBox'></p>"+
                            "<p><button type='button' onclick='answer()'>Answer</button></p>";
                    }else if(question.questionType=="BOOLEAN") {
                        answerBox="<div id='radios'><p>"+
                            "<input class='radio' type='radio' name='boolean' value='true'>True<br>"+
                            "<input class='radio' type='radio' name='boolean' value='false'>False</p>"+
                            "<p><button type='button' onclick='answer("+'"BOOLEAN"'+")'>Answer</button></p></div>";
                    }else if(question.questionType=="TEXT"){
                        answerBox="<p><input type='text' id='answerBox'></p>"+
                            "<p><button type='button' onclick='answer()'>Answer</button></p>";
                    }else if (question.questionType == "MCQ") {
                        answerBox="<div id='radios'><p>" +
                            "<input class='radio' type='radio' name='boolean' value='a'>A<br>"+
                            "<input class='radio' type='radio' name='boolean' value='b'>B<br>" +
                            "<input class='radio' type='radio' name='boolean' value='c'>C<br>" +
                            "<input class='radio' type='radio' name='boolean' value='d'>D<br>" +
                            "</p></div>"+
                            "<p><button type='button' onclick='answer("+'"MCQ"'+")'>Answer</button></p>";
                    }
                    content.innerHTML = answerBox;
                    if (question.canBeSkipped) {    //adding the skip button
                        footer.innerHTML = "<button onClick='skip()'>Skip</button>";
                    } else {    //or letting the user know that this question cannot be skipped
                        footer.innerHTML = "<span>This question cannot be skipped</span>";
                    }
                }
            }
        }
        score();
    }
}

function answer(type = "") {
    let usersAnswer;
    let userHasAnswered;
    if (type == "BOOLEAN" || type =="MCQ") {
        let radios = document.getElementsByClassName("radio");
        for (let i = 0; i < radios.length; i++) {
            if (radios[i].checked) {
                usersAnswer = radios[i].value;
                userHasAnswered = true;
                break;
            }
        }
    }else {
        usersAnswer = document.getElementById("answerBox").value;
        userHasAnswered = usersAnswer != "";
    }

    if (!userHasAnswered) {
        content.innerHTML = "<p>An empty response is not an answer !</p>";
        footer.innerHTML = "<button onclick='nextQuestion()'>Try Again !</button>";
    } else {
        let answerRequest = new XMLHttpRequest();
        answerRequest.open("GET", ANSWER + SESSION + session + AMP + ANSWER_P + usersAnswer, true);
        answerRequest.send();
        answerRequest.onload = function () {
            if (this.status == 200) {
                let response = this.responseText;
                let a_response = JSON.parse(response);
                console.log(a_response);
                /**********************************
                 * update the score here ?????????
                 ***********************************/
                if (a_response.correct) {    //correct answer + adding the proceed button
                    answerBox = "";
                    content.innerHTML = "<p>Correct !</p>";
                    footer.innerHTML = "<button onclick='nextQuestion()'>Proceed</button>";
                } else {
                    if (a_response.message.includes("location")) {
                        //location sensitive answer
                        content.innerHTML = "<p>You must be near the location mentioned in the question</p>";
                    } else {
                        //incorrect answer
                        content.innerHTML = "<p>Incorrect.</p>";
                    }
                    answerBox = "";
                    footer.innerHTML = "<button onclick='nextQuestion()'>Try Again !</button>";
                }
            }
        }
    }
}

//skips skippable questions and calls for the next
function skip() {
    let skip = new XMLHttpRequest();
    skip. open("GET",SKIP+SESSION+session, true);
    skip.send();
    skip.onload =function () {
        console.log(JSON.parse(skip.responseText));
        nextQuestion();
    }
}

function score() {
    let scoreRequest = new XMLHttpRequest();
    scoreRequest.open("GET", SCORE + SESSION + session, true);
    scoreRequest.send();
    scoreRequest.onload = function () {
        if (this.status == 200){
            let object = JSON.parse(scoreRequest.responseText);
            console.log("Response of Score");
            console.log(object);
            if (!quizHasFinished) footer.innerHTML += "<div><p>Score: " + object.score + "</p></div>  ";
            scoreNumber = object.score;
        }
    }
}

function leaderboard(quizNumber) {
    let leaderRequest = new XMLHttpRequest();
    leaderRequest.open("GET", LEADERBOARD + "treasure-hunt-id=" + quizzes[quizNumber].uuid + "&sorted&limit=5", true);
    leaderRequest.send();
    leaderRequest.onload = function () {
        if (this.status == 200) {
            let obj = JSON.parse(leaderRequest.responseText);
            console.log("Response of leaderBoard");
            console.log(obj);
            let arr = obj.leaderboard;
            let leaderboard = "<div id='leaderDiv'>";
            for (let i = 0; i <arr.length; i++) {
                let compDate = new Date(arr[i].completionTime);
                leaderboard += arr[i].player + ", " + arr[i].score+" "+ compDate.toUTCString()+"<br>";
            }
            leaderboard += "</div>";
            document.getElementById("leaderP").innerHTML += leaderboard;
            // content.innerHTML += leaderboard;
            document.getElementById("leaderButton").removeAttribute("onclick");
        }
    }
}

//code to be executed every x amount of milliseconds

function getLocation() {
    navigator.geolocation.getCurrentPosition(locationCallback);
}
function locationCallback(position) {
    let latitude = position.coords.latitude;
    let longitute = position.coords.longitude;

    let locationRequest = new XMLHttpRequest();
    locationRequest.open("GET", LOCATION + SESSION + session + AMP + "latitude=" + latitude + AMP +
        "longitude=" + longitute, true);
    locationRequest.send();
    locationRequest.onload = function () {
        let object = JSON.parse(locationRequest.responseText);
        console.log("Location Response");
        console.log(object);
    }
}

function addToAnswerBox(number){
    document.getElementById("answerBox").value += number;
}