const fetch = require('node-fetch');
const readline = require("readline-sync");

const STOP_ID = "490008660N";
const radius = 400;

//  1.1 Helper function: Asks the user for a postcode, returns the postcode as a string
function getUserInput(){
    console.log("Please enter a postcode: ")
    // let userInput = "NW108GQ"
    let userInput = readline.prompt();
    
    return userInput
}

//  1.2 Helper function: Retrieves the coordinates from the body object in the response
function getLatLon(body){
    let lat = body.result.latitude;
    let lon = body.result.longitude;
    let coordinates = [lat, lon];
    return coordinates
}

// 1.3 Helper function: Makes an API request for bus stops within radius from specified coordinates
function getBusStops(coordinates) {
    const lat = coordinates[0];
    const lon = coordinates[1];
    const stopTypes = "NaptanOnstreetBusCoachStopPair"

    fetch (`https://api.tfl.gov.uk/StopPoint/?lat=${lat}&lon=${lon}&stopTypes=${stopTypes}&radius=${radius}`)

    .then(function(response){
        return response.json()
    })

    .then(function(body){
        // This is where we manipulate the response object
        console.log("body: ", body);

        let busStopsArray = body.stopPoints // Array of dictionaries, each containing info about a bus stop
        console.log("Bus stops: ", busStopsArray);

        let myBusStops = {};

        for (let i = 0; i < busStopsArray.length; i++) {
           let commonName = busStopsArray[i].commonName;
           let lat = busStopsArray[i].lat;
           let lon = busStopsArray[i].lon;
           let dist = busStopsArray[i].distance
           myBusStops[commonName] = {
                "lat": lat,
                "lon": lon,
                "distance": dist

           }             
        }

        console.log("myBusStops: ", myBusStops);
    });

}


//  2. Makes a request for the user's postcode, retrieves the coordinates, requests the bus stops within radius of coordinates
function getPostcodeLatLon(){
    let postcode = getUserInput();

    fetch(`https://api.postcodes.io/postcodes/${postcode}`)

    .then(function(response){
        return response.json()
    })

    .then(function(body){
        let coordinates = getLatLon(body);
        getBusStops(coordinates);
    });
}

getPostcodeLatLon();

// function getBusInfo(body){
//     let buses = [];
//     for (let i = 1; i < body.length; i++) {

//         let busNumber = body[i].lineId;
//         let destinationName = body[i].destinationName;
//         let minutesToStation = Math.round((body[i].timeToStation)/60);
//         buses.push([busNumber, destinationName, minutesToStation])
//     }
//     buses.sort((a,b) => a[2] - b[2])
//     if (buses.length > 5) {
//         buses = buses.slice(0,4)
//     }
//     console.log(buses)
// return buses
// }


// fetch(`https://api.tfl.gov.uk/StopPoint/${STOP_ID}/Arrivals`)
//     .then(response => response.json())

//     .then(body => getBusInfo(body));