if (readFromCookie("positions") !== undefined) {
    navigator.geolocation.getCurrentPosition(drawMap);
}else {
    console.log("no positions");
    document.getElementById("mapContainer").innerHTML = "The map has nothing to show";
}


function drawMap(currentPosition) {
    console.log("positions");

    let positions = JSON.parse(readFromCookie("positions"));
    console.log(positions);

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
            center: {lng: currentPosition.coords.longitude, lat: currentPosition.coords.latitude}
        });
    for (let i = 0; i < positions.length; i++) {
        let marker = new H.map.Marker({
            lat: positions[i].lat,
            lng: positions[i].lon
        });
        map.addObject(marker);
    }
}

function readFromCookie(property) {
    let kv = document.cookie.split(";");
    for (let i = 0; i < kv.length; i++) {
        if (kv[i].includes(property+"=")) {
            return kv[i].replace(""+property + "=","");
        }
    }
}
