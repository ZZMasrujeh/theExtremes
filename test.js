const TH_API_URL = "http://www.codecyprus.org/th/testing.";
const LEADERBOARD = TH_API_URL + "leaderboard?";
let params = "sorted&size=";
let firstRow = document.getElementById("leaderboardTable").innerHTML;

function test() {
    let limit = document.getElementById("limitInput").value;
    testLeaderB = new XMLHttpRequest();
    testLeaderB.open("GET", LEADERBOARD + params + limit);
    testLeaderB.send();
    testLeaderB.onload = function () {
        if (this.status === 200) {
            let obj = JSON.parse(testLeaderB.responseText);
            let lb = obj.leaderboard;
            let table = document.getElementById("leaderboardTable");
            table.innerHTML = firstRow;
            for (let i = 0; i < lb.length; i++) {
                table.innerHTML +=
                    "<tr class='removeItAfter'>" +
                    "<td>" + (i + 1) + "</td>" +
                    "<td>" + lb[i].player + "</td>" +
                    "<td>" + lb[i].score + "</td>" +
                    "<td>" + lb[i].completionTime + "</td>" +
                    "</tr>";
            }
        }
    }
}
