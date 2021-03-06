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
const createdBy = "Created by theExtremes";

//using HERE maps api, an image will be called showing a map with the points where the location was updated
const MAP_LINK ='https://image.maps.api.here.com/mia/1.6/' +
    'mapview?app_id=OxbDxE7r5OIxgAax63A2&app_code=iSQ7St5fwPVo6rhYjXVu-Q&z=15';

const answersInCookieTime = 180000;    /* the final section with all the previous answers will be stored for 3 minutes,
for calling leaderboard with session id, unless:
1)the user starts another quiz, 2) the users refreshes in a time that scenario 3 is forthcoming (if the app starts
from scenario 3, everything is deleted so it will not start from there every time) */

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
var quizNumber;
var playersName=""; //when the player is about to start, he must specify a name
var session="";     //new or from cookie
var quizName = "";  //new or from cookie ?????name vs ID?????

var answerBox;  // storing the representation of the answer area for easier reference between functions

//our document is split into 3 main sections: header, content, footer
var header = document.getElementById("header");
var content = document.getElementById("content");
var footer = document.getElementById("footer");
var navigation = [];    //will be used to hold the navigation of the users


var backButton = document.getElementById("backButton");
backButton.style.display = "none";

var divInContent = document.createElement("div");
divInContent.id = "divInContent";

let bigDivInContent = document.createElement("div");
bigDivInContent.id = "bigDivInContent";

var loader ="<div style='display:inline-block' id = 'loader'></div>";

var scoreNumber =0; //saving the score every time it is updated, no AJAX after the quiz is finished

var quizHasFinished = false;    /*will be used to prevent /score from calling, otherwise the footer will show
the score in the footer when the quiz will be finished*/

var qPlayed = [];    /*an array that will hold all previous questions and answers, so they can be displayed
when the quiz finishes*/
var qObject;    //will contain {q:"question, a[]:"answers"}
var currentQ;   //the questions before it is saved
var usersA=[];  //all the answers before and including the correct answer or skip
var endsOn;

var mapLink = MAP_LINK;
var poiCounter =0;

function loadLoader() {
    //attempting not to add another loader, because the spin will ne interrupted
    if ( document.getElementById("loader") != null ) {
        console.log("contains loader");
    }else {
        console.log("doesnt contain loader");
        addHtmlAndAppend(content, divInContent, loader);
    }
}

//continuing from previous session
if (document.cookie!==""){   //cookie is not empty
    // console.log(document.cookie);

    if (readFromCookie("session") === undefined || readFromCookie("session")==="undefined") {
        if (readFromCookie("finalContent" === undefined)) {
            console.log("from 2-3 to 1");
            listAvailableQuizzes();
        }else {
            /***********************
             * start of Scenario 3 *
             * ********************/
            // console.log("Scenario 3");
            navigation.push("list"); /*in case something goes wrong and the back button is clickable,
            this will provide something to go back to */
            nav();

            // console.log(document.cookie);
            mapLink = readFromCookie("mapLink");
            // console.log(mapLink);

            if (content.innerHTML === "undefined") {
                listAvailableQuizzes();     //in case everything was stored incorrectly, the app starts from the beginning
            }else {
                footer.innerHTML = readFromCookie("finalFooter");
                content.innerHTML = readFromCookie("finalContent");
                header.innerHTML = readFromCookie("finalHeader");
            }

            deleteCookie();
            /*once the previous questions are loaded, everything will be deleted, so the user doesnt always
            start from here*/
        }
    }else {
        /***********************
         * Start of scenario 2 *
         ***********************/
        // console.log("Scenario 2");
        // console.log("cookie contents");     //once I am done console.logs will be deleted

        session = readFromCookie("session");
        // console.log("Read session from cookie " + readFromCookie("session"));

        quizName = readFromCookie("quizName");
        playersName = readFromCookie("playersName");
        playersName = playersName.substring(1); //some values start with space, not enough time to find out why
        quizName = quizName.substring(1);
        endsOn = readFromCookie("endsOn");
        mapLink = readFromCookie("mapLink");
        mapLink = mapLink.substring(1).trim();
        poiCounter = readFromCookie("poiCounter");
        score();
        // console.log(quizName);
        // console.log(playersName);
        // console.log(endsOn);
        console.log("maplink "+mapLink);
        updateQuizSelectedNumber();
        if (readFromCookie("qPlayed") === undefined) {   /*in case something goes wrong and the previous questions
        are not saved, the array will be initialized empty, probably nobody will notice that there are missing
        questions. I wouldn't ! */

            // console.log("Previous q&a restarted");
            qPlayed = [];
        }else {
            // console.log("Previous q&a loaded");
            qPlayed = JSON.parse(readFromCookie("qPlayed"));
        }
        // console.log(qPlayed);
        getLocation(); //first location call for scenario 2
        setInterval(getLocation,LOCATION_INTERVAL );    //repeated location calls
        nextQuestion(); //will take the player to the last unanswered question, if there is one
    }
} else {
    /***********************
     * Start of scenario 1 *
     ***********************/
    console.log("Scenario 1");
    listAvailableQuizzes();
    footer.innerHTML = createdBy;
}

/****************************************************************
 * places the backButton in the sections that call it. so far:  *
 * showMore(), nextQuestion()                                   *
 ***************************************************************/
function nav() {
    if (navigation.length > 0) {
        backButton.style.display = "block";
    }
}

/***********************************************************
 * Determnines what to show when the backButton is pressed *
 ***********************************************************/
function backAction() {
    switch (navigation[navigation.length-1]) {
        case "list":
            listAvailableQuizzes();
            break;
        case "question":
            showMore(quizNumber);
            break;
        case "leaderboard":
            showMore(quizNumber);
            break;

    }
    navigation.pop();
    if (navigation.length <= 0) {
        backButton.style.display = "none";
    }
}

/******************************************************************
 * W3Schools  https://www.w3schools.com/js/js_cookies.asp         *
 * I have thought of how to handle the cookie after reading from  *
 * the link above                                                 *
 ******************************************************************/
function saveInCookie(property,value,endsOn){
    let expiryTime = new Date(endsOn);
    let expString = "expires=" + expiryTime.toUTCString();
    document.cookie = property + "=" + value + ";" + expString;
}

function readFromCookie(property) {
    let kv = document.cookie.split(";");
    for (let i = 0; i < kv.length; i++) {
        if (kv[i].includes(property+"=")) {
            return kv[i].replace(""+property + "=","");
        }
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
        if (key===property)        {
            document.cookie = key + "=;" + expString;
            break;
        }
    }
}
/**************************************************************
 * W3Schools  https://www.w3schools.com/js/js_cookies.asp     *
 *************************************************************/

/*****************************************************************************
 * listAvailableQuizzes()                                                    *
 * Loads and shows all available quizz NAMES ONLY, once the page is visited, *
 * or when the back button is pressed when viewing the details of a quiz     *
 ****************************************************************************/
function listAvailableQuizzes() {
    let listRequest = new XMLHttpRequest();
    loadLoader();
    listRequest.open("GET", LIST, true);
    listRequest.send();
    listRequest.onload = function () {
        if (this.status === 200) {
            let listResponse = JSON.parse(this.responseText);
            console.log("Response of /list: ");
            console.log(listResponse);
            quizzes = listResponse.treasureHunts;
            let htmlText = "";
            // htmlText= "<input id='nameInput' placeholder='Enter a name here'>";
            header.innerHTML = "Available Quizzes";                            //change the "title"
            for (let i = 0; i < quizzes.length; i++) {
                //check which quizzes are available and add them to the list
                htmlText +=
                    "<div onclick='showMore("+i+")' class='availableQuiz'>" +
                    "<span class='quizzName'>" + quizzes[i].name + ".</span></div>";
            }
            //display the available quizzes in the content div
            addHtmlAndAppend(content, divInContent, htmlText);
        }
        navigation.push("list");
        if (quizName !== undefined && session !=="") {
            footer.innerHTML = quizName + " is still active.";
        }else {
            footer.innerHTML = "Select treasure hunt by touching/clicking";
        }
    };
}

/****************************************************************************
 * Shows more details for the treasure hunt selected, after /list is done   *
 * @param quizN: the index of the array returned by /list                   *
 ***************************************************************************/
function showMore(quizN) {  //more details about the selected quiz
    quizNumber = quizN;
    quizSelected = quizzes[quizN];
    nav();
    header.innerHTML = quizSelected.name;
    let htmlText = "<div id='buttonsInDetails'>";

    quizName = quizzes[quizN].name;/*this is necessary, otherwise ->  if(quizName != quizzes[quizNumber].name)
    wont work, the same is assigned again in later, but it will be necessary for scenario 2*/

    if (session !== "") { // already running a quiz.

        htmlText+= "<button id='resumeButton' onclick='nextQuestion()'>Resume previous hunt</button><br> ";

        footer.innerHTML = "You have another running treasure hunt !";
    }else { //no running quiz
        footer.innerHTML = "Enter a name and <br><strong>START YOUR HUNT</strong> !";
        htmlText+= "<input id='nameInput' placeholder='Enter a name here'> <br>" +      //textfield for name
            "<button class='button' id='startButton' onclick='getQuiz(" + quizN + ")'>Start</button><br>" ;
        //button to start
    }
    htmlText+="<button onclick='leaderboard(" +quizN+
        ")' id='leaderButton'>Leaderboard</button><br><br></div>";
    htmlText += "<div id='tHDetailsDiv'>" +
        "<u>Description:</u> " + quizzes[quizN].description+"<br>";   //description
    if (quizzes[quizN].maxDuration/1000/60> 0){
        htmlText += "<u>Duration:</u>" + (quizzes[quizN].maxDuration / 60 / 1000) + " minutes<br>";  //duration
    } else {
        htmlText +="<u>Duration:</u> Unlimited<br>";
    }
    htmlText+=
        "<u>Starts on:</u> "+ (new Date(quizzes[quizN].startsOn).toUTCString())+"<br>"+ //start
        "<u>Ends on:</u> "+(new Date(quizzes[quizN].endsOn).toUTCString())+"<br><br>";        //end
    if (quizzes[quizN].hasPrize){
        htmlText+="With Prize<br>";                                                     //prize
    } else {
        htmlText+="Without Prize<br>";                                                  //or not
    }
    if (quizzes[quizN].shuffled){                                                  //shuffling
        htmlText+="<br>The questions appear in random order<br>";
    } else {
        htmlText+="<br>The questions appear in the same order<br>";
    }
    htmlText += "<br>by: " + quizzes[quizN].ownerEmail + "</div><br>" ;
    console.log(session);

    addHtmlAndAppend(content, bigDivInContent, htmlText);
}

/*********************************************************************
 *  ONLY in Scenario 1:                                              *
 *  saves everything in cookie and makes the first call of /question *
 * @param quizNumber the index of the array returned by /list        *
 ********************************************************************/
function getQuiz(quizNumber) {
    playersName = document.getElementById("nameInput").value;
    console.log("NAME: "+playersName);
    if (playersName === "") {    //check if the users has entered something as name
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
            if (this.status === 200) {
                let thResponse = JSON.parse(this.responseText);
                console.log("Response of /start: ");
                console.log(thResponse);
                if (thResponse.status !== "ERROR") {
                    console.log(JSON.stringify(thResponse));
                    /*************************
                     * QUIZ HAS STARTED
                     ************************/
                    endsOn = quizSelected.endsOn; //mainly need to update every question and answer in qPlayed in scen 2
                    saveInCookie("endsOn", endsOn, endsOn);
                    saveInCookie("session", thResponse.session,endsOn);
                    session = thResponse.session;
                    saveInCookie("quizName", quizSelected.name,endsOn);
                    quizName = quizSelected.name;
                    saveInCookie("playersName", playersName, endsOn);
                    saveInCookie("mapLink", mapLink, answersInCookieTime + endsOn);
                    saveInCookie("poiCounter", 0, answersInCookieTime + endsOn);
                    getLocation(); //first location call for scen 1
                    setInterval(getLocation,LOCATION_INTERVAL ); //repeated location calls
                    nextQuestion();
                } else {
                    addHtmlAndAppend(content, divInContent, thResponse.errorMessages);
                    let button = document.createElement("button");
                    button.onclick = "showMore(" + quizNumber + ")";
                    divInContent.innerHTML += "<br><br><button onclick='showMore(" + quizNumber + ")'>Ok</button>";
                }
            }
        };
    }
}

/******************************************************************************************
 * Displays the question, and forms an area for the answer with the appropriate controls. *
 * Also where the TH IS COMPLETED                                                         *
 *****************************************************************************************/
function nextQuestion() {
    console.log("players name " + playersName);
    loadLoader();
    if (navigation.length === 0) {   //In the scenario 2 the navigation starts empty. pushing the 'list' will provide
        navigation.push("list");    //the user with something to navigate out of the question.
    }
    nav();//places the back button, no matter the scenario
    let questionRequest = new XMLHttpRequest();
    questionRequest.open("GET", QUESTION + SESSION + session,true);
    questionRequest.send();
    questionRequest.onload = function () {
        if (this.status === 200) {
            let questionResponse = JSON.parse(this.responseText);
            let totalQuestions = questionResponse.numOfQuestions;
            let currentQuestion = questionResponse.currentQuestionIndex + 1;
            console.log("question response");
            console.log(questionResponse);
            if (questionRequest.requiresLocation) {
                getLocation();
            }
            if (questionResponse.status === "OK") {
                if (questionResponse.completed) {
                    quizHasFinished = true;
                    /**************************************
                     *        Quiz has finished           *
                     *************************************/
                    header.innerHTML = "Treasure hunt over.";
                    quizName = "";
                    answerBox = "";
                    footer.innerHTML = createdBy;
                    let message =  "Congratulations " + playersName+" <br>Your final score is "+scoreNumber+" points.<br>"+
                        '<button onclick="leaderboard('+ '\'' +session+'\''+')" id="leaderButton">Leaderboard</button>'+
                        '<br><button onclick="map()"><i class="material-icons">place</i></button> ';
                    // console.log("message before final display ");
                    // console.log(message);
                    deleteCookie();
                    displayPreviousAnswers(message);
                    navigation = ["list"];
                    qPlayed = [];
                    session = "";
                    playersName = "";
                } else {
                    /********************
                     *  Quiz goes on    *
                     *******************/
                    header.innerHTML = "Question "+currentQuestion+"/"+totalQuestions+":<br>";   //eg. Question 1/5:
                    currentQ = questionResponse.questionText;   //to be saved in object and array
                    answerBox= currentQ;
                    createAnswerBox(questionResponse.questionType,questionResponse.canBeSkipped);
                    if (questionResponse.questionType==="MCQ"){
                        addHtmlAndAppend(content, bigDivInContent, answerBox);
                    } else {
                        addHtmlAndAppend(content, divInContent, answerBox);
                    }
                    if (questionResponse.requiresLocation) {
                        footer.innerHTML = "You must be near the location to answer";
                    }
                }
            }else {
                addHtmlAndAppend(content,divInContent,questionResponse.errorMessages[0]);
            }
        }
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
    let userHasAnswered =false;    //will be used to prevent calling with empty answers
    if (type === "BOOLEAN" || type ==="MCQ") {    //getting the value of the radio buttons
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
        userHasAnswered = usersAnswer !== "";
    }
    if (!userHasAnswered) { //in case there is nothing selected or typed
        // divInContent.innerHTML += "<button onclick='nextQuestion()'>Try Again !</button>";
        footer.innerHTML = "An empty response is not an answer !";
    } else {
        usersA.push(usersAnswer); //the answer to be stored in object and array
        let answerRequest = new XMLHttpRequest();
        answerRequest.open("GET", ANSWER + SESSION + session + AMP + ANSWER_P + usersAnswer, true);
        loadLoader();
        answerRequest.send();
        answerRequest.onload = function () {
            if (this.status === 200) {
                score();
                let answerResponse = JSON.parse(this.responseText);
                console.log(answerResponse);
                if (answerResponse.correct) {
                    /*****************************************
                     *              Correct                  *
                     ****************************************/
                    answerBox = "";
                    addHtmlAndAppend(content, divInContent, "Correct<br>");
                    divInContent.innerHTML += "<button id='proceedButton' onclick='nextQuestion()'>Proceed</button>";
                    /* if the answer is correct, everything is saved and a proceed button will appear*/
                    qObject = {"q": currentQ, "a": usersA};
                    qPlayed.push(qObject);
                    usersA = []; //array is emptied to accommodate the answers of another question
                    saveInCookie("qPlayed", JSON.stringify(qPlayed), answersInCookieTime + endsOn);
                    console.log("previous Q and A ");
                    console.log(qPlayed);
                } else {
                    if (answerResponse.message.includes("location")) {
                        // for location sensitive answers
                        addHtmlAndAppend(content, divInContent, "You must be near the location mentioned in the question.<br>");
                    } else {
                        /*****************************************
                         *              Inorrect                 *
                         ****************************************/
                        addHtmlAndAppend(content, divInContent, "Incorrect.<br>");
                    }
                    answerBox = "";
                    divInContent.innerHTML += "<button onclick='nextQuestion()'>Try Again !</button>";
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
    saveInCookie("qPlayed", JSON.stringify(qPlayed), answersInCookieTime+endsOn);
    usersA = [];
    console.log("previous Q and A ");
    console.log(qPlayed);

    let skipRequest = new XMLHttpRequest();
    skipRequest. open("GET",SKIP+SESSION+session, true);
    loadLoader();
    skipRequest.send();
    skipRequest.onload =function () {
        score();
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
        if (this.status === 200){
            let scoreResponse = JSON.parse(scoreRequest.responseText);
            console.log("Response of Score");
            console.log(scoreResponse);
            scoreNumber = scoreResponse.score;
        }
    };
}

/***************************************************************
 * Calls /leaderboard if the corresponding button is pressed   *
 * @param quizNumber: the index of the array returned by /list *
 *  ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ *
 **************************************************************/
function leaderboard(quizNumber) {
    navigation.push("leaderboard");
    if(!quizHasFinished) {
        nav();
    }
    let leaderRequest = new XMLHttpRequest();
    if (isNaN(quizNumber)) {
        console.log("isNaN(quizNumber) true");
        leaderRequest.open("GET", LEADERBOARD + "session=" + quizNumber + "&sorted", true);
    }else {
        console.log("isNaN(quizNumber) false");
        leaderRequest.open("GET", LEADERBOARD + "treasure-hunt-id=" + quizzes[quizNumber].uuid + "&sorted&limit=100", true);
    }
    leaderRequest.send();
    leaderRequest.onload = function () {
        if (this.status === 200) {
            let obj = JSON.parse(leaderRequest.responseText);
            console.log("Response of leaderBoard");
            console.log(obj);
            let arr = obj.leaderboard;
            let leaderboard = "<div id='leaderDiv'>";
            leaderboard+="<ul>";
            for (let i = 0; i <arr.length ; i++) {
                leaderboard += leaderBoardEntry(i+1,arr[i]);
            }
            leaderboard += "</ul></div>";
            addHtmlAndAppend(content, bigDivInContent, leaderboard);
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
 * and update the link for the map in the end *
 * @param position: given by  getLocation()   *
 *  ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓  *
 *********************************************/
function locationCallback(position) {
    let latitude = position.coords.latitude;
    let longitute = position.coords.longitude;

    if (poiCounter.length > 1) {
        poiCounter = poiCounter.substring(1);
    }
    //HERE maps point of interest
    mapLink= mapLink.concat("&poix" + poiCounter + "=" + latitude + "," + longitute);
    saveInCookie("mapLink", mapLink,endsOn);
    poiCounter++;
    saveInCookie("poiCounter", poiCounter,endsOn);
    console.log(mapLink);

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
/***************************************************************************************
 * Goes through the array that contains all previous Q and A and adds the to content   *
 *  ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓  *
 **************************************************************************************/
function displayPreviousAnswers(message="") {
    backButton.style.display = "none";
    let finalContent = "<div id='finished'>"+message+"<br>";
    for (let i = 0; i <qPlayed.length; i++) {
        let object = qPlayed[i];
        if (object.a.length>1) {
            finalContent+="<p><u>Question "+(i+1)+":</u><br> "+object.q+"<br><br>"+"Your answers:<ul>";
        }
        else {
            finalContent+="<p><u>Question "+(i+1)+":</u> <br>"+object.q+"<br><br>"+"Your answer:<ul>";
        }
        for (let j = 0; j <object.a.length ; j++) {
            let answers = object.a;
            finalContent += "<li>" + answers[j] + "</li>";
        }
        finalContent += "</ul></p>";
    }
    finalContent += "</div>";
    addHtmlAndAppend(content, bigDivInContent, finalContent);
    //the cookie was deleted just before this call so I don't have to delete, what I don't need any longer, manually
    console.log("final Content");
    saveInCookie("finalHeader", header.innerHTML, Date.now() + answersInCookieTime);
    saveInCookie("finalContent", content.innerHTML, Date.now() + answersInCookieTime);
    saveInCookie("finalFooter", footer.innerHTML, Date.now() + answersInCookieTime);
    saveInCookie("mapLink", mapLink, Date.now()+ answersInCookieTime);
    // console.log(content.innerHTML);
}
let options = { day: 'numeric', month: 'short', hour: '2-digit',minute: '2-digit', second: '2-digit' };

/********************************************************************
 * Creates a leaderboard entry                                      *
 * @param i the number of the entry in the sorted leaderboard list  *
 * @param object the leaderboard object                             *
 * @returns {string} the entry to be embedded in an HTML element    *
 *******************************************************************/
function leaderBoardEntry(i,object) {
    let date = new Date(object.completionTime);
    let formattedDate = date.toLocaleDateString("en-UK", options);
    let entry ="<li>"+
        "<strong>"+i+"</strong> "+
        "<i>"+object.player+"</i> "+
        "<strong>Score: "+object.score+",</strong> "+
        "<small> ended on: "+formattedDate+",</small>"+
        "</li>";
    return entry;
}

/************************************************************************
 * Depending on the question type, the appropriate controls are given   *
 * @param type the question type                                        *
 * @param canBeSkipped wheter the question can be skipped or not        *
 ***********************************************************************/
function createAnswerBox(type,canBeSkipped) {
    if (type === "INTEGER" || type === "NUMERIC" ) {
        //dials and textfield answerButton
        answerBox+= "<div id='dials'><p>" +
            "<p><input type='number' id='answerBox'></p>"+
            "<p><button id='answerButton' type='button' onclick='answer()'>Answer</button></p>";
        //2 radio buttons and answerButton
    }else if(type==="BOOLEAN") {
        answerBox+="<div id='radios'><p>"+
            "<input class='radio' type='radio' name='boolean' value='true'>True<br>"+
            "<input class='radio' type='radio' name='boolean' value='false'>False</p>"+
            "<p><button id='answerButton' type='button' onclick='answer("+'"BOOLEAN"'+")'>Answer</button></p></div>";
        //textfield and answerButton
    }else if(type ==="TEXT"){
        answerBox+="<p><input type='text' placeholder=' Your answer goes here' id='answerBox'></p>"+
            "<p><button id='answerButton' type='button' onclick='answer()'>Answer</button></p>";
        //4 radio buttons and answerButton
    }else if (type === "MCQ") {
        answerBox+="<div id='radios'><p style='display: inline'><br> " +
            "<input class='radio' type='radio' name='boolean' value='a'>A"+
            "<input class='radio' type='radio' name='boolean' value='b'>B" +
            "<input class='radio' type='radio' name='boolean' value='c'>C" +
            "<input class='radio' type='radio' name='boolean' value='d'>D" +
            "</p></div>"+
            "<p><button id='answerButton' type='button' onclick='answer(" + '"MCQ"' + ")'>Answer</button></p>";
    }
    //adding the skip button or letting the user know that this question cannot be skipped
    if (canBeSkipped) {
        answerBox += "<button id='skipButton' onClick='skip()'>Skip</button>";
        footer.innerHTML = createdBy;
    } else {
        footer.innerHTML = "<span>This question cannot be skipped</span>";
    }
    answerBox += "<div id='scoreDiv'><br>Score: " + scoreNumber + "</div>";
}

/************************************************************
 * Adds content to an HTML element and appends that element *
 * to another.                                              *
 * @param parent the parent element                         *
 * @param child the child element                           *
 * @param html the inner HTML                               *
 ************************************************************/
function addHtmlAndAppend(parent, child, html){
    parent.innerHTML = "";
    child.innerHTML = html;
    parent.appendChild(child);
}

/********************************************************
 * Resets necessary variables to start another TH.      *
 * If the button was pressed accidentally everything    *
 * will be restored from the cookie                     *
 *******************************************************/
function startOver() {
    let alertMessage = "";
    if (session !== "") {
        alertMessage = "Are you sure you want start another treasure hunt ?" +
            "\n" +
            "\nIf you change your mind before starting a new hunt and want to return this one JUST REFRESH THE PAGE !";
    }else {
        alertMessage = "You are about to be directed to the beginning of the game";
    }
    if (confirm(alertMessage)){
        session = "";
        quizName = "";
        answerBox = "";
        qPlayed = [];
        playersName = "";
        scoreNumber = 0;
        mapLink = MAP_LINK;
        poiCounter = 0;
        endsOn = 0;
        listAvailableQuizzes();
    }
}

/************************************************************************************
 * If the app is restarted, there is no way to know if the quiz selected is in the  *
 * same position in the quiz list. This function will provide that number from the  *
 * possibly new list.                                                               *
 ***********************************************************************************/
function updateQuizSelectedNumber() {
    let listRequest = new XMLHttpRequest();
    listRequest.open("GET", LIST, true);
    listRequest.send();
    listRequest.onload = function () {
        if (this.status === 200) {
            let listResponse = JSON.parse(this.responseText);
            console.log("Updating quiz selected ");
            quizzes = listResponse.treasureHunts;
            for (let i = 0; i <quizzes.length ; i++) {
                if (quizName === quizzes[i].name) {
                    quizNumber = i;
                    navigation.push("question");
                    break;
                }
            }
        }
    }
}

/************************************************************
 * Change the css file from the original to 'night' mode,   *
 * and vice versa.                                          *
 ***********************************************************/
function switchCSS() {
    let head = document.getElementsByTagName('head')[0];
    let link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.media = 'all';
    if (document.getElementById("day") === null) {
        link.id = "day";
        link.href = "Design2.css";
        var oldLink = document.getElementById("night");
    }else{
        link.id = "night";
        link.href = 'DesignNight.css';
        oldLink = document.getElementById("day");
    }
    head.appendChild(link);
    head.removeChild(oldLink);
}

function map() {
    window.location.href = mapLink;
}