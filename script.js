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
const LOCATION_INTERVAL = 60000; //location will be updated every minute

/*********************************************************************************
 * Scenario 1: the page starts from the beggining, with no active Treasure Hunts *
 * *******************************************************************************
 * Scenario 2: the page resumes from the latest incomplete question.             *
 *********************************************************************************
 * Scenario 3: the page is restarted but the quiz has been completed.            *
 ********************************************************************************/

var quizzes; //all quizzes after listAvailableQuizzes(),initialize there.
var quizSelected;   /*the quiz selected from all available, initialized in getQuiz()
 in both scenarios, however in the second scenario, the page will have to load the list again*/

var playersName=""; //when the player is about to start, he must specify a name
var session="";     //new or from cookie
var quizName = "";  //new or from cookie ?????name vs ID?????

var answerBox;  // storing the representation of the answer area for easier reference between functions

//our document is split into 3 main sections: header, content, footer
var header = document.getElementById("header");
var content = document.getElementById("content");
var footer = document.getElementById("footer");
var navigation = [];    //will be used to hold the navigation of the users
var buttonDiv = document.createElement("div");  //div of backButton, for navigation
buttonDiv.id = "buttonDiv";
buttonDivHTML = "<button id='backButton' onclick='backAction()'>Back</button>";

var scoreNumber =0; //saving the score everytime it is updated, calling it when the hunt finishes

var quizHasFinished = false;    /*will be used to prevent /score from calling, otherwise the footer will show
the score in the footer when the quiz will be finished*/

var qPlayed = [];    /*an array that will hold all previous questions and answers, so they can be displayed
when the quiz finishes*/
var qObject;    //will contain {q:"question, a[]:"answers"}
var currentQ;   //the questions before it is saved
var usersA=[];  //all the answers before the correct or skip
var answersInCookieTime;    /* the final section with all the previous answers will be stored for 3 minutes,unless:
1)the user starts another quiz, 2) the users refreshes in a time that scenario 3 will be forced*/

var loader ="<div id = 'loader'></div>";

function loadLoader() {
    content.innerHTML = loader;
}

//continuing from previous session
if (document.cookie!=""){   //cookie is not empty
    /***********************
     * Start of scenario 2 *
     ***********************/
    console.log("cookie contents");     //once I am done console.logs will be deleted
    console.log(document.cookie);
    session = readFromCookie("session");
    quizName = readFromCookie("quizName");
    playersName = readFromCookie("playersName");
    if (readFromCookie("qPlayed") == undefined) {   /*in case something goes wrong and the previous questions
    are not saved, the array will be initialized empty, probably nobody will notice that there are missing
    questions. I wouldn't ! */
        console.log("Previous q&a restarted");
        qPlayed = [];
    }else {
        console.log("Previous q&a loaded");
        qPlayed = JSON.parse(readFromCookie("qPlayed"));
    }
    console.log(qPlayed);
    getLocation(); //first location call for scen 2
    setInterval(getLocation,LOCATION_INTERVAL );    //repeated location calls
    nextQuestion(); //will take the player to the last unanswered question, if there is one

    if (session == undefined && qPlayed != undefined && qPlayed.length > 0) {
        /***********************
         * start of Scenario 3 *
         * ********************/
        header.innerHTML = "Treasure Hunt Completed";
        footer.innerHTML = "";
        displayPreviousAnswers();
        deleteCookie(); /*once the previous questions are loaded, everything will be deleted. Otherwise, if the user
        refreshes more than once after the quiz has finished, he will end up here*/
    }
} else {
    /***********************
     * Start of scenario 1 *
     ***********************/
    listAvailableQuizzes();
    footer.innerHTML = "";
}

/************************************************************
 * places the backButton in setions that call it. so far:   *
 * showMore(), nextQuestion()                               *
 * ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓  *
 ***********************************************************/
function nav() {
    if (navigation.length > 0) {
        buttonDiv.innerHTML=buttonDivHTML;
        document.body.appendChild(buttonDiv);
    }
}

/***********************************************************
 * Determnines what to show when the backButton is pressed *
 *  ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓  *
 ***********************************************************/
function backAction() {
    switch (navigation[navigation.length-1]) {
        case "list":
            listAvailableQuizzes();
            break;
        case "question":
            showMore(quizSelected);
            break;
        case "leaderboard":
            showMore(quizzes.indexOf(quizSelected));
            break;

    }
    navigation.pop();
    if (navigation.length <= 0) {
        buttonDiv.innerHTML = "";
    }
}

/******************************************************************
 * W3Schools  https://www.w3schools.com/js/js_cookies.asp         *
 * I have thought of how to handle the cookie after reading from  *
 * the link above                                                 *
 *  ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓  *
 ******************************************************************/
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
function deleteFromCookie(property) {
    let expiryTime = new Date(Date.now() -10000);
    let expString = "expires=" + expiryTime.toUTCString()+";";
    let kv = document.cookie.split(";");
    for (let i = 0; i < kv.length; i++) {
        let key = kv[i].split("=")[0].trim();
        if (key==property)        {
            document.cookie = key + "=;" + expString;
            break;
        }
    }
}
/**************************************************************
 * ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ *
 * W3Schools  https://www.w3schools.com/js/js_cookies.asp     *
 *************************************************************/

/*****************************************************************************
 * listAvailableQuizzes()                                                    *
 * Loads and shows all available quizz NAMES ONLY, once the page is visited, *
 * or when the back button is pressed when viewing the details of a quiz     *
 *  ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓  *
 ****************************************************************************/
function listAvailableQuizzes() {
    let listRequest = new XMLHttpRequest();
    loadLoader();
    listRequest.open("GET", LIST, true);
    listRequest.send();
    listRequest.onload = function () {
        if (this.status == 200) {
            let listResponse = JSON.parse(this.responseText);
            console.log("Response of /list: ");
            console.log(listResponse);
            quizzes = listResponse.treasureHunts;
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
        if (quizName != "" && session !="") {
            footer.innerHTML = quizName + " is still active. You may start a new one, once there are no active hunts";
        }else {
            footer.innerHTML = "";
        }
    };
}

/**************************************************************************
 * Shows more details for the treasure hunt selected, after /list is done *
 * @param quizNumber: the index of the array returned by /list            *
 *  ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓  *
 *************************************************************************/
function showMore(quizNumber) {  //more details about the selected quiz
    quizSelected = quizzes[quizNumber];
    nav();
    header.innerHTML = quizzes[quizNumber].name;
    let htmlText;
    htmlText = "<div id='tHDetailsDiv'>" +
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
    htmlText += "by: " + quizzes[quizNumber].ownerEmail + "<br><br></div>" ;
    console.log(session);

    quizName = quizzes[quizNumber].name;/*this is necessary, otherwise ->  if(quizName != quizzes[quizNumber].name)
    wont work, the same is assigned again in later, but it will be necessary for scenario 2*/

    if (session != "") { // already running a quiz.
        // In case the page is closed and reopened: checks if there is a stored session
        if (quizName != quizzes[quizNumber].name) {  /*if a different quiz from the one that is active, is selected
        from the list*/
            htmlText += "<p>You have another running quiz. Finish that one first !</p>";/*warning for
            the bad selection */
            htmlText+= "<button id='resumeButton' onclick='nextQuestion()'>Resume other quiz</button> ";
        }else {    //if the same, running, quiz is selected from the list
            htmlText+= "<button id='resumeButton' onclick='nextQuestion()'>Resume quiz</button> ";
        }
    }else { //no running quiz
        htmlText+= "<input id='nameInput' placeholder='Enter a name here'> <br>" +      //textfield for name
            "<button class='button' id='startButton' onclick='getQuiz(" + quizNumber + ")'>Start</button><br>" ;
        //button to start
    }
    htmlText+="<p id='leaderP'><button onclick='leaderboard(" +quizNumber+
        ")' id='leaderButton'>Leaderboard</button></p></p>";
    content.innerHTML = htmlText;
    /****
     * I should do something else to show the leaderboard
     */
}

/*********************************************************************
 *  ONLY in Scenario 1:                                              *
 *  saves everything in cookie and makes the first call of /question *
 * @param quizNumber: the index of the array returned by /list       *
 * ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓  *
 ********************************************************************/
function getQuiz(quizNumber) {
    playersName = document.getElementById("nameInput").value;
    console.log("NAME: "+playersName);
    if (playersName == "") {    //check if the users has entered something as name
        footer.innerHTML = "You must enter a name first";
    } else {
        quizSelected = quizzes[quizNumber];
        let thRequest = new XMLHttpRequest();
        loadLoader();
        console.log("loading quiz " + quizNumber);
        thRequest.open("GET", START + PLAYER + playersName + AMP + APP + AMP +
            TREASURE_HUNT_ID + quizSelected.uuid, true);
        thRequest.send();
        thRequest.onload = function () {
            if (this.status == 200) {
                let thResponse = JSON.parse(this.responseText);
                console.log("Response of /start: ");
                console.log(thResponse);
                if (thResponse.status != "ERROR") {
                    console.log(JSON.stringify(thResponse));
                    /*************************
                     * QUIZ HAS STARTED
                     ************************/
                    answersInCookieTime = quizSelected.endsOn + 180000;  //time for the user's answers array
                    /*session, quizname and players name will be saved as long as the th lasts, in terms of
                    time and completion
                     */
                    saveInCookie("session", thResponse.session, quizSelected.endsOn);
                    session = thResponse.session;
                    saveInCookie("quizName", quizSelected.name, quizSelected.endsOn);
                    quizName = quizSelected.name;
                    saveInCookie("playersName", playersName, quizSelected.endsOn);
                    getLocation(); //first location call for scen 1
                    setInterval(getLocation,LOCATION_INTERVAL ); //repeated location calls
                    nextQuestion();

                } else {
                    footer.innerHTML = thResponse.errorMessages;
                }
            }
        };
    }
}

/******************************************************************************************
 * Displays the question, and forms an area for the answer with the appropriate controls. *
 * Also where the TH IS COMPLETED                                                         *
 *  ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ *
 ******************************************************************************************/
function nextQuestion() {
    if (navigation.length == 0) {   //In the scenario 2 the navigation starts empty. pushing the 'list' will provide
        navigation.push("list");    //the user with something to navigate out of the question.
    }
    nav();//places the back button, no matter the scenario
    console.log("Fetching question");
    let questionRequest = new XMLHttpRequest();
    loadLoader();
    questionRequest.open("GET", QUESTION + SESSION + session,true);
    questionRequest.send();
    questionRequest.onload = function () {
        content.innerHTML="";
        if (this.status == 200) {
            let questionResponse = JSON.parse(this.responseText);
            let totalQuestions = questionResponse.numOfQuestions;
            let currentQuestion = questionResponse.currentQuestionIndex + 1;
            console.log("question fetched. displaying...");
            console.log(questionResponse);
            if (questionRequest.requiresLocation) {
                getLocation();
            }
            if (questionResponse.status == "OK") {
                if (questionResponse.completed) {
                    //leaderboard() with session ?
                    quizHasFinished = true;
                    /**************************************
                     *        Quiz has finished           *
                     *************************************/
                    //clear all
                    header.innerHTML = "Congratulations " + playersName + " for completing the quiz<br>" +
                        "Your final score is "+scoreNumber+" points.";
                    session = "";
                    playersName = "";
                    quizName = "";
                    deleteFromCookie("session");
                    deleteFromCookie("quizName");
                    deleteFromCookie("playersName");
                    answerBox = "";
                    footer.innerHTML = "";
                    displayPreviousAnswers();
                    qPlayed = [];
                } else {
                    header.innerHTML = "<p>Question "+currentQuestion+"/"+totalQuestions+":<br>"
                        + questionResponse.questionText + "</p>";   //eg. Question 1/5:
                    currentQ = questionResponse.questionText;   //to be saved in object and array
                    if (questionResponse.questionType == "INTEGER" || questionResponse.questionType == "NUMERIC" ) {
                        //dials and textfield answerButton
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
                            "<input type='button' onclick='addToAnswerBox("+0+")' value='0'>" +
                            "<input type='button' onclick='addToAnswerBox("+'"-"'+")' value='-'>" +
                            "<input type='button' onclick='addToAnswerBox("+'"backspace"'+")' value='&#9003;' ></p></div>" +
                            "<p><input type='text' id='answerBox'></p>"+
                            "<p><button type='button' onclick='answer()'>Answer</button></p>";
                        //2 radio buttons and answerButton
                    }else if(questionResponse.questionType=="BOOLEAN") {
                        answerBox="<div id='radios'><p>"+
                            "<input class='radio' type='radio' name='boolean' value='true'>True<br>"+
                            "<input class='radio' type='radio' name='boolean' value='false'>False</p>"+
                            "<p><button type='button' onclick='answer("+'"BOOLEAN"'+")'>Answer</button></p></div>";
                        //textfield and answerButton
                    }else if(questionResponse.questionType=="TEXT"){
                        answerBox="<p><input type='text' id='answerBox'></p>"+
                            "<p><button type='button' onclick='answer()'>Answer</button></p>";
                        //4 radio buttons and answerButton
                    }else if (questionResponse.questionType == "MCQ") {
                        answerBox="<div id='radios'><p>" +
                            "<input class='radio' type='radio' name='boolean' value='a'>A<br>"+
                            "<input class='radio' type='radio' name='boolean' value='b'>B<br>" +
                            "<input class='radio' type='radio' name='boolean' value='c'>C<br>" +
                            "<input class='radio' type='radio' name='boolean' value='d'>D<br>" +
                            "</p></div>"+
                            "<p><button type='button' onclick='answer("+'"MCQ"'+")'>Answer</button></p>";
                    }
                    content.innerHTML = answerBox;
                    //adding the skip button or letting the user know that this question cannot be skipped
                    if (questionResponse.canBeSkipped) {
                        footer.innerHTML = "<button onClick='skip()'>Skip</button>";
                    } else {
                        footer.innerHTML = "<span>This question cannot be skipped</span>";
                    }
                }
            }
        }
        score();
    }
}

/******************************************************************************************************
 *checks if the user has answered, if the answer is correct, stores all answers given by the user and *
 * calls /answer                                                                                      *
 * @param type: the type of the question. at the moment only MCQ and BOOLEAN are important            *
 *  ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓  *
 *****************************************************************************************************/
function answer(type = "") {
    let usersAnswer;
    let userHasAnswered;    //will be used to prevent calling with empty answers
    if (type == "BOOLEAN" || type =="MCQ") {    //getting the value of the radio buttons
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

    if (!userHasAnswered) { //in case there is nothing selected or typed
        content.innerHTML = "<p>An empty response is not an answer !</p>";
        footer.innerHTML = "<button onclick='nextQuestion()'>Try Again !</button>";
    } else {
        usersA.push(usersAnswer); //the answer to be stored in object and array
        let answerRequest = new XMLHttpRequest();
        loadLoader();
        answerRequest.open("GET", ANSWER + SESSION + session + AMP + ANSWER_P + usersAnswer, true);
        answerRequest.send();
        answerRequest.onload = function () {
            if (this.status == 200) {
                content.innerHTML = "";
                let answerResponse = JSON.parse(this.responseText);
                console.log(answerResponse);
                if (answerResponse.correct) {
                    /*****************************************
                     *              Correct                  *
                     ****************************************/
                    answerBox = "";
                    content.innerHTML = "<p>Correct !</p>";
                    footer.innerHTML = "<button onclick='nextQuestion()'>Proceed</button>";
                    /* if the answer is correct, everything is saved and a proceed button will appear*/
                    qObject = {"q": currentQ, "a": usersA};
                    qPlayed.push(qObject);
                    usersA = []; //array is emptied to accommodate the answers of another question
                    saveInCookie("qPlayed", JSON.stringify(qPlayed), answersInCookieTime);
                    console.log("previous Q and A ");
                    console.log(qPlayed);
                } else {
                    if (answerResponse.message.includes("location")) {
                        // for location sensitive answers
                        content.innerHTML = "<p>You must be near the location mentioned in the question</p>";
                    } else {
                        /*****************************************
                         *              Inorrect                 *
                         ****************************************/
                        content.innerHTML = "<p>Incorrect.</p>";
                    }
                    answerBox = "";
                    footer.innerHTML = "<button onclick='nextQuestion()'>Try Again !</button>";
                }
            }
        };
    }
}

/****************************************************************************************
 * skips skipable questions, saves "SKIPPED in answers and  calls for the next question *
 *  ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓  *
 ***************************************************************************************/
function skip() {
    usersA.push("SKIPPED");
    qObject = {"q": currentQ, "a": usersA};
    console.log("qObject before pushed in array");
    console.log(qObject);
    qPlayed.push(qObject);
    saveInCookie("qPlayed", JSON.stringify(qPlayed), answersInCookieTime);
    usersA = [];
    console.log("previous Q and A ");
    console.log(qPlayed);

    let skipRequest = new XMLHttpRequest();
    loadLoader();
    skipRequest. open("GET",SKIP+SESSION+session, true);
    skipRequest.send();
    skipRequest.onload =function () {
        let skipResponse =JSON.parse(skipRequest.responseText);
        console.log(skipResponse);
        nextQuestion();
    }
}

/**********************************************************************
 * calls /score if the th is ACTIVE and adds the score to the footer  *
 *  ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓  *
 *********************************************************************/
function score() {
    let scoreRequest = new XMLHttpRequest();
    scoreRequest.open("GET", SCORE + SESSION + session, true);
    scoreRequest.send();
    scoreRequest.onload = function () {
        if (this.status == 200){
            let scoreResponse = JSON.parse(scoreRequest.responseText);
            console.log("Response of Score");
            console.log(scoreResponse);
            if (!quizHasFinished && scoreResponse.score != undefined) {
                footer.innerHTML += "<div><p>Score: " + scoreResponse.score + "</p></div>  ";
            }
            scoreNumber = scoreResponse.score;
        }
    }
}

/***************************************************************
 * Calls /leaderboard if the corresponding button is pressed   *
 * @param quizNumber: the index of the array returned by /list *
 *  ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ *
 **************************************************************/
function leaderboard(quizNumber) {
    navigation.push("leaderboard");
    nav();
    // document.getElementById("leaderButton").removeAttribute("onclick");
    let leaderRequest = new XMLHttpRequest();
    leaderRequest.open("GET", LEADERBOARD + "treasure-hunt-id=" + quizzes[quizNumber].uuid + "&sorted&limit=15", true);
    leaderRequest.send();
    leaderRequest.onload = function () {
        if (this.status == 200) {
            let obj = JSON.parse(leaderRequest.responseText);
            console.log("Response of leaderBoard");
            console.log(obj);
            let arr = obj.leaderboard;
            let leaderboard = "<div id='leaderDiv'>";
            leaderboard+="<table><th>Rank</th><th>Player</th><th>Score</th><th>Completion Time</th>";
            for (let i = 0; i <arr.length ; i++) {
                leaderboard += leaderBoardEntry(i+1,arr[i]);
            }
            leaderboard += "</div";
            // document.getElementById("leaderP").innerHTML = leaderboard;
            content.innerHTML = leaderboard;
        }
    };
}

/**************************
 * It gets the location ! *
 *  ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓   *
 *************************/
function getLocation() {
    navigator.geolocation.getCurrentPosition(locationCallback);
}

/**********************************************
 * Called once geolocation has been completed *
 * @param position: given by  getLocation()   *
 *  ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓  *
 *********************************************/
function locationCallback(position) {
    let latitude = position.coords.latitude;
    let longitute = position.coords.longitude;

    let locationRequest = new XMLHttpRequest();
    locationRequest.open("GET", LOCATION + SESSION + session + AMP + "latitude=" + latitude + AMP +
        "longitude=" + longitute, true);
    locationRequest.send();
    locationRequest.onload = function () {
        let locationResponse = JSON.parse(locationRequest.responseText);
        console.log("Location Response");
        console.log(locationResponse);
    }
}
/***************************************************************************
 * called by every dial button, for the users to see what has been entered *
 *  ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ *
 **************************************************************************/
function addToAnswerBox(number){
    if (number==="backspace") {
        let string = "";
        string  =document.getElementById("answerBox").value;
        string = string.substr(0,string.length - 1);
        document.getElementById("answerBox").value = string;
    }else
        document.getElementById("answerBox").value += number;
}

/***************************************************************************************
 * Goes through the array that contains all previous Q and A and adds the to content   *
 *  ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓  *
 **************************************************************************************/
function displayPreviousAnswers() {
    let finalContent = "<div id='finished'>";
    for (let i = 0; i <qPlayed.length; i++) {
        let object = qPlayed[i];
        finalContent+="<p>Question "+(i+1)+": "+object.q+"<br>"+"<ul>Your answers:";
        for (let j = 0; j <object.a.length ; j++) {
            let answers = object.a;
            finalContent += "<li>" + answers[j] + "</li>";
        }
        finalContent += "</ul></p>";
    }
    finalContent += "</div>";
    content.innerHTML = finalContent;
}

function leaderBoardEntry(i,object) {
    let compDate = new Date(object.completionTime);
    let entry ="<tr>"+
        "<td>"+i+"</td>"+
        "<td>"+object.player+"</td>"+
        "<td>"+object.score+"</td>"+
        "<td>"+formDate(compDate.getDate(),+compDate.getDay(),+compDate.getMonth(),+compDate.getFullYear(),
            compDate.getHours(),compDate.getMinutes(),compDate.getSeconds())+"</td>"+
        "</tr>";
    return entry;
}
function formDate(date,day, month,year,hours, minutes,seconds) {
    let dateStr="";
    switch (day) {
        case 0:
            dateStr+="Sunday ";
            break;
        case 1:
            dateStr+="Monday ";
            break;
        case 2:
            dateStr+="Tuesday ";
            break;
        case 3:
            dateStr+="Wednesday ";
            break;
        case 4:
            dateStr+="Thursday ";
            break;
        case 5:
            dateStr+="Friday ";
            break ;
        case 6:
            dateStr+="Saturday ";
            break
    }
    dateStr += date + "/" + (month + 1)+"/" + year+", "+hours+":";
    if (minutes<10) dateStr += ":0"+ minutes +":"+ seconds;
    else  dateStr+=minutes+":"+seconds;

    return dateStr;
}