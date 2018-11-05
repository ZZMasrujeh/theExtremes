const URL = "https://codecyprus.org/th/api/";
const LIST = "list";

//get available quizzes
HTTP = new XMLHttpRequest();
HTTP.open("GET", URL + LIST,true);
HTTP.send();
HTTP.onload = function () {
    if (this.status == 200) {
        let json = this.responseText;
        let object = JSON.parse(json);
        // console.log("JSON ");
        // console.log(object);
        quizzes= object.treasureHunts;
        let existingText = document.getElementById("list").innerHTML;
        for (let i = 0; i <quizzes.length; i++) {
            //check if quiz is available
            // existingText += "<li><button onclick='getQuiz(" + i + ")' type='button' style='width: 60%'>" + quizzes[i].name + "</button></li> ";
        }
        document.getElementById("list").innerHTML = existingText;     //display the available quizzes
    }
};
