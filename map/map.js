function readFromCookie(property) {
    let kv = document.cookie.split(";");
    for (let i = 0; i < kv.length; i++) {
        if (kv[i].includes(property+"=")) {
            return kv[i].replace(""+property + "=","");
        }
    }
}


if (readFromCookie("positions") !== undefined) {

    console.log("positions");

    let positions = JSON.parse(readFromCookie("positions"));
    console.log(positions);
    let lat = positions[0].lat;
    let longi = positions[0].lon;


    let mapContainer = document.getElementById("mapContainer");

// Initialize the platform object:
    var platform = new H.service.Platform({
        'app_id': 'OxbDxE7r5OIxgAax63A2',
        'app_code': 'iSQ7St5fwPVo6rhYjXVu-Q'
    });

// Obtain the default map types from the platform object
    var defaultLayers = platform.createDefaultLayers();

// Instantiate (and display) a map object:
    var map = new H.Map(
        mapContainer,
        defaultLayers.normal.map,
        {
            zoom: 16,
            center: { lng: longi, lat: lat}
        });

    for (let i = 0; i < positions.length; i++) {
        var svgMarkup = '<svg width="24" height="24" ' +
            'xmlns="http://www.w3.org/2000/svg">' +
            '<rect stroke="white" fill="black" x="1" y="1" width="22" ' +
            'height="22" /><text x="12" y="18" font-size="12pt" ' +
            'font-family="Arial" font-weight="bold" text-anchor="middle" ' +
            'fill="white">P</text></svg>';

// Create an icon, an object holding the latitude and longitude, and a marker:
        let icon = new H.map. Icon(svgMarkup),coords = {lat: positions[i].lat, lng: positions[i].lon}, marker = new H.map.Marker(coords, {icon: icon});

        // Add the marker to the map and center the map at the location of the marker:
        map.addObject(marker);
        map.setCenter(coords);
    }

// Create the default UI:
// var ui = H.ui.UI.createDefault(map, defaultLayers,'en-US');
// ui.getControl('zoom').setEnabled(false);

// // Create an info bubble object at a specific geographic location:
// var bubble = new H.ui.InfoBubble({ lng: lon, lat: lat }, {
//     content: '<b>Question 1</b>'
// });
//
// // Add info bubble to the UI:
// ui.addBubble(bubble);

// Define a variable holding SVG mark-up that defines an icon image:





}else {
    console.log("no positions");
    document.getElementById("mapContainer").innerHTML = "Nothing to show";
}


