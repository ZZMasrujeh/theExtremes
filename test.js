const TH_API_URL = "https://codecyprus.org/th/test-api/";
const LIST = TH_API_URL + "list?number-of-ths=";
const START = TH_API_URL + "start?player=";
const QUESTION = TH_API_URL + "question?";
const ANSWER = TH_API_URL + "answer?";
const LEADERBOARD = TH_API_URL + "leaderboard?size=";

var header = document.getElementById("header");
var content = document.getElementById("content");
var footer = document.getElementById("footer");
var testControls = document.getElementById("testControls");

var quizzes;
var quizSelected;
var playersName="";
var quizName = "";
var answerBox;
var divInContent = document.createElement("div");
divInContent.id = "divInContent";



let loader = "<div id='loader'></div>";
let scoreDiv = document.createElement("div");
scoreDiv.id = "scoreDiv";
scoreDiv.innerHTML = "Score: 50";

function loadLoader() {
    content.innerHTML = loader;
}


function addBackButton(){
    let button = document.createElement("button");
    button.innerText="Other Tests";
    button.onclick = function () {
        header.innerHTML = buttons;
    };
    if (!testControls.innerHTML.includes("Other Tests")) {
        testControls.appendChild(button);
    }
}
let buttons =
    "<button onclick='testList()'>/list</button>&nbsp;" +
    "<button onclick='testStart()'>/start</button>&nbsp;"+
    "<button onclick='testQuestion()'>/question</button>&nbsp;"+
    "<button onclick='testAnswer()'>/answer</button>&nbsp;"+
    "<button onclick='testLeaderboard()'>/leaderboard</button>&nbsp;";

header.innerHTML = buttons;

function testList() {
    testControls.innerHTML=
        "<form action='javascript:testL()'>" +
        "<br><input id='input' type='number' placeholder='Number of THs' min='2'/><br><br>"+
        "<input type='submit' placeholder='Start Test'/><br><br>"+
        "</form>";
}
function testL(){
    let tListRequest = new XMLHttpRequest();
    let limit = document.getElementById("input").value;
    tListRequest.open("GET", LIST + limit, true);
    loadLoader();
    tListRequest.send();
    tListRequest.onload = function () {
        let listResponse = JSON.parse(this.responseText);
        quizzes = listResponse.treasureHunts;
        let htmlText = "";
        header.innerHTML = "Available Quizzes";
        for (let i = 0; i < quizzes.length; i++) {
            htmlText +=
                "<div onclick='testShowMore("+i+")' class='availableQuiz'>" +
                " <span class='quizzName'>" + quizzes[i].name + ".</span><br></div>";
        }
        content.innerHTML = htmlText;
    };
    addBackButton();

}
function testShowMore(quizNumber) {
    quizSelected = quizzes[quizNumber];
    header.innerHTML = quizzes[quizNumber].name;
    let htmlText;
    htmlText = "<div id='tHDetailsDiv'>" +
        ""+
        "Description: " + quizzes[quizNumber].description+"<br>";   //description
    if (quizzes[quizNumber].maxDuration/1000/60> 0){
        htmlText += "Duration: " + (quizzes[quizNumber].maxDuration / 60 / 1000) + " minutes<br>";
    } else {
        htmlText +="Duration: Unlimited<br>";
    }
    htmlText+=
        "Starts on: "+ (new Date(quizzes[quizNumber].startsOn).toUTCString())+"<br>"+
        "Ends on: "+(new Date(quizzes[quizNumber].endsOn).toUTCString())+"<br>";
    if (quizzes[quizNumber].hasPrize){
        htmlText+="With Prize<br>";
    } else {
        htmlText+="Without Prize<br>";
    }
    if (quizzes[quizNumber].shuffled){
        htmlText+="The questions appear in random order<br>";
    } else {
        htmlText+="The questions appear in the same order<br>";
    }
    htmlText += "by: " + quizzes[quizNumber].ownerEmail + "<br><br></div>" ;
    quizName = quizzes[quizNumber].name;
        htmlText+= "<input id='nameInput' placeholder='Enter a name here'> <br>" +
            "<button class='button' id='startButton' >Start</button><br>" ;
    htmlText+="<p id='leaderP'><button id='leaderButton'>Leaderboard</button>";
    content.innerHTML = htmlText;
}

function testStart() {
    testControls.innerHTML=
        "<form id='startForm' action='javascript:testS()'>" +
        "Error messages: <br>"+
        "<input class='radios' value='inactive' name='param' type='radio'/> Inactive "+
        "<input class='radios' value='empty' name='param'  type='radio'/> Empty "+
        "<input class='radios' value='player' name='param'  type='radio'/> Player <br>"+
        "<input class='radios' value='app' name='param'  type='radio'/> App "+
        "<input class='radios' value='unknown' name='param' type='radio'/> Unknown "+
        "<input class='radios' value='MISSING_PARAMETER' name='param' id='input' type='radio'/> Missing "+
        "<br><br>"+
        "Display in: "+
        "<input class='display' value='footer' name='display' type='radio'/> Bottom "+
        "<input class='display' value='content' name='display' type='radio'/> Middle "+
        "<br><br><input type='submit' placeholder='Start Test'/>"+
        "</form>";
}

function testS() {
    addBackButton();
    content.innerHTML = "";
    let param;
    let selections = document.getElementsByClassName("radios");
    let displays = document.getElementsByClassName("display");
    let display=content;
    if (displays[0].checked) display = footer;
    for (let i = 0; i < selections.length; i++) {
        if (selections[i].checked) {
            param = selections[i].value;
            break;
        }
    }
    let testStartRequest = new XMLHttpRequest();
    testStartRequest.open("GET", START + param, true);
    testStartRequest.send();
    testStartRequest.onload = function () {
        if (this.status === 200) {
            let tsrResponse = JSON.parse(testStartRequest.responseText);
            display.innerHTML = tsrResponse.errorMessages;
        }
    };
}

function testQuestion() {
    testControls.innerHTML =
        "<form id='questionForm' action='javascript:testQ()'>" +
        "<strong>Completed:</strong> " +
        " <input type='radio' class='completed' name='completed' value='true'>True" +
        "<input type='radio' class='completed' name='completed' value='False'> False<br><br>" +
        "<strong> Question type: </strong>" +
        " <input type='radio' class='qType' name='qType' value='boolean'>Boolean " +
        " <input type='radio' class='qType' name='qType' value='mcq'> Multiple choice <br>" +
        " <input type='radio' class='qType' name='qType' value='integer'> Integer " +
        " <input type='radio' class='qType' name='qType' value='numeric'> Numeric " +
        " <input type='radio' class='qType' name='qType' value='text'> Text<br><br>" +
        "<strong>Can be skipped:</strong>" +
        "<input type='radio' class='skip' name='skip' value='true'>True" +
        "<input type='radio' class='skip' name='skip' value='false'> False<br><br>" +
        "<strong>Requires Location:</strong>" +
        "<input type='radio' class='location' name='location' value='true'>True" +
        "<input type='radio' class='location' name='location' value='false'>False<br><br>" +
        "<input type='submit' placeholder='Submit'><br><br>"+
        "</form>";
}

function testQ() {
    addBackButton();
    let completed="";
    let arr = document.getElementsByClassName("completed");
    for (let i = 0; i < arr.length; i++) {
        if (arr[i].checked) {
            if (arr[i].value=="true") {
                completed = "completed&";
                break;
            }
        }
    }
    let skip="";
    arr = document.getElementsByClassName("skip");
    for (let i = 0; i < arr.length; i++) {
        if (arr[i].checked) {
            if (arr[i].value=="true") {
                skip = "can-be-skipped&";
                break;
            }
        }
    }
    let location="";
    arr = document.getElementsByClassName("location");
    for (let i = 0; i < arr.length; i++) {
        if (arr[i].checked) {
            if (arr[i].value=="true") {
                location = "location&";
                break;
            }
        }
    }
    let type = "text";
    arr = document.getElementsByClassName("qType");
    for (let i = 0; i < arr.length; i++) {
        if (arr[i].checked) {
            type = arr[i].value;
            break;
        }
    }
    // console.log(QUESTION + completed + skip + location + "question-type=" + type);

    let qRequest = new XMLHttpRequest();
    loadLoader();
    qRequest.open("GET",QUESTION + completed + skip + location+"question-type=" + type  ,true);
    qRequest.send();
    qRequest.onload = function () {
        if (this.status == 200) {
            let questionResponse = JSON.parse(this.responseText);
            console.log(questionResponse);
            let totalQuestions = questionResponse.numOfQuestions;
            let currentQuestion = questionResponse.currentQuestionIndex + 1;
            // if (questionRequest.requiresLocation) {
            //     getLocation();
            // }
            if (questionResponse.status == "OK") {
                if (questionResponse.completed) {
                    // quizHasFinished = true;
                    /**************************************
                     *        Quiz has finished           *
                     *************************************/
                    //clear all
                    //and show previous answers
                    header.innerHTML = "Treasure hunt completed. Congratulations " + playersName+" <br>" +
                        "Your final score is 5 points.";
                    content.innerHTML = "Previous answers";
                } else {
                    header.innerHTML = "Question "+currentQuestion+"/"+totalQuestions+":<br>"
                        // + questionResponse.questionText
                        +"";   //eg. Question 1/5:
                    answerBox = questionResponse.questionText;
                    answers(questionResponse.questionType);
                    content.innerHTML = "";
                    divInContent.innerHTML = answerBox;
                    content.appendChild(divInContent);
                    if (questionResponse.canBeSkipped) {
                        let skip = document.createElement("button");
                        skip.id = "skipButton";
                        skip.innerText = "Skip";
                        divInContent.appendChild(skip);
                        divInContent.appendChild(scoreDiv);
                        // footer.innerHTML = "<button onClick='skip()'>Skip</button>";
                    } else {
                        footer.innerHTML = "<span>This question cannot be skipped</span>";
                    }
                }
            }
        }
    };
}

function answers(type) {
    if (type == "INTEGER" || type == "NUMERIC" ) {
        //dials and textfield answerButton
        answerBox+= "<div id='dials'>" +
            "<br><input type='number' id='answerBox'><br><br>"+
            "<button id='answerButton' type='button' onclick='answer()'>Answer</button>";
        //2 radio buttons and answerButton
    }else if(type=="BOOLEAN") {
        answerBox+="<div id='radios'>"+
            "<br><input class='radio' type='radio' name='boolean' value='true'>True"+
            "<input class='radio' type='radio' name='boolean' value='false'>False<br><br>"+
            "<button id='answerButton' type='button' onclick='answer("+'"BOOLEAN"'+")'>Answer</button></div>";
        //textfield and answerButton
    }else if(type=="TEXT"){
        answerBox+="<br><br><input type='text' placeholder=' Your answer goes here' id='answerBox'><br><br>"+
            "<button id='answerButton' type='button' onclick='answer()'>Answer</button>";
        //4 radio buttons and answerButton
    }else if (type == "MCQ") {
        answerBox+="<div id='radios'><p style='display: inline'><br> " +
            "<input class='radio' type='radio' name='boolean' value='a'>A"+
            "<input class='radio' type='radio' name='boolean' value='b'>B" +
            "<input class='radio' type='radio' name='boolean' value='c'>C" +
            "<input class='radio' type='radio' name='boolean' value='d'>D<br><br>" +
            "</div>"+
            "<button id='answerButton' type='button' onclick='answer(" + '"MCQ"' + ")'>Answer</button>";
    }
}
function testAnswer() {
    testControls.innerHTML=
        "<form id='questionForm' action='javascript:testA()'>" +
        "<strong>Correct:</strong> " +
        " <input type='radio' class='correct' name='correct' value='true'>True" +
        "<input type='radio' class='correct' name='correct' value='False'> False<br><br>" +
        "<strong>Completed:</strong>" +
        "<input type='radio' class='completed' name='completed' value='true'>True" +
        "<input type='radio' class='completed' name='completed' value='false'> False<br><br>" +
        "<input type='submit' placeholder='Submit'><br><br>"+
        "</form>";
}
function testA() {
    addBackButton();
    let correct = "";
    let arr = document.getElementsByClassName("correct");
    for (let i = 0; i <arr.length ; i++) {
        if (arr[i].checked){
            if (arr[i].value === "true") {
                correct = "correct&";
                break;
            }
        }
    }
    let completed = "";
    arr = document.getElementsByClassName("completed");
    for (let i = 0; i <arr.length ; i++) {
        if (arr[i].checked){
            if (arr[i].value === "true") {
                completed = "completed";
                break;
            }
        }
    }
    if (completed === "" && correct !== "") {
        correct = correct.substr(0, correct.length - 1);
    }

    console.log("Correct: " + correct);
    console.log("Completed: " + completed);
    console.log(ANSWER + correct + completed);

    let aRequest = new XMLHttpRequest();
    aRequest.open("GET", ANSWER + correct + completed, true);
    loadLoader();
    aRequest.send();
    aRequest.onload = function () {
        if (this.status === 200) {
            // content.innerHTML = "";
            let answerResponse = JSON.parse(this.responseText);
            if (answerResponse.correct) {
                /*****************************************
                 *              Correct                  *
                 ****************************************/
                answerBox = "";
                content.innerHTML = "Correct !";
                footer.innerHTML = "<button onclick='nextQuestion()'>Proceed</button>";
            } else {
                /*****************************************
                 *              Inorrect                 *
                 ****************************************/
                content.innerHTML = "Incorrect.";
                answerBox = "";
                footer.innerHTML = "<button onclick='nextQuestion()'>Try Again !</button>";
            }
        }
    };
}

function testLeaderboard(){
    testControls.innerHTML =
        "<form action='javascript:testLb()'>"+
        "<br><input id='size' type='number' min='5' max='20' placeholder='size'/><br><br>"+
        "<input type='submit' placeholder='Submit'><br><br>"+
        "</form>";
}

function testLb() {
    addBackButton();
    let size = document.getElementById("size").value;
    let lbRequest = new XMLHttpRequest();
    lbRequest.open("GET", LEADERBOARD + size, true);
    loadLoader();
    lbRequest.send();
    lbRequest.onload = function () {
        if (this.status === 200) {
            let lbResponse = JSON.parse(lbRequest.responseText);
            console.log(lbResponse);
            let arr = lbResponse.leaderboard;
            let html = "<div class='scrollable'><table><tr>" +
                "<th>Name</th>" +
                "<th>Score</th>" +
                "<th>Completion Time</th>" +
                "</tr>";
            for (let i = 0; i < arr.length; i++) {
                html+="<tr>"+
                    "<td>"+arr[i].player+"</td>"+
                    "<td>"+arr[i].score+"</td>"+
                    "<td>"+arr[i].completionTime+"</td>"+
                    "</tr>";
            }
            html += "</table></div>";
            content.innerHTML = html;
        }
    };
}