const fetch = require('node-fetch');
const readline = require("readline-sync");

const STOP_ID = "490008660N";
const radius = 400;


//  1.1 Helper function: Asks the user for a postcode, returns the postcode as a string
function getUserInput(){
    console.log("Please enter a postcode: ")
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

// 1.3 Helper function:
function getBusInfo(body,stopName){
    let buses = [];
    for (let i = 1; i < body.length; i++) {

        let busNumber = body[i].lineId;
        let destinationName = body[i].destinationName;
        let minutesToStation = Math.round((body[i].timeToStation)/60);
        buses.push([busNumber, destinationName, minutesToStation])
    }
    buses.sort((a,b) => a[2] - b[2])
    if (buses.length > 5) {
        buses = buses.slice(0,4)
    }
    //console.log("buses: ", buses)

    console.log(`\nThe next busses due at ${stopName}:`)
    for (let i = 0; i< buses.length; i++) {
        console.log(`The ${buses[i][0]} heading towards ${buses[i][1]}: due in ${buses[i][2]} minutes`)
    }


return buses
}

// 1.4 Helper function: Makes an API request for bus stops within radius from specified coordinates
function getBusStops(coordinates) {
    const lat = coordinates[0];
    const lon = coordinates[1];
    const stopTypes = "NaptanPublicBusCoachTram"; //"NaptanOnstreetBusCoachStopPair"
    
    const url = `https://api.tfl.gov.uk/StopPoint/?lat=${lat}&lon=${lon}&stopTypes=${stopTypes}&radius=${radius}`;

    fetch (url)

    .then(function(response){
        return response.json()
    })

    .then(function(body){
        // This is where we manipulate the response object
        // console.log("body: ", body);

        let busStopsArray = body.stopPoints // Array of dictionaries, each containing info about a bus stop
        // console.log("Bus stops: ", busStopsArray);

        let myBusStopsObj = {};

        for (let i = 0; i < busStopsArray.length; i++) {
           let commonName = busStopsArray[i].commonName;
           let dist = busStopsArray[i].distance;
           let id = busStopsArray[i].id;
           myBusStopsObj[commonName] = {
                "id": id,
                "distance": dist
           }             
        }

        // console.log("myBusStopsObj: ", myBusStopsObj);
        
        let myBusStopsArr = [];

        for (const busStop in myBusStopsObj) {
            myBusStopsArr.push([myBusStopsObj[busStop].id,myBusStopsObj[busStop].distance,busStop]);
        }

        myBusStopsArr.sort((a,b) => a[1] - b[1]);
        // console.log("sorted bus stop array: ", myBusStopsArr);

        let closestStopId1 = myBusStopsArr[0][0];
        let closestStop1Name1 = myBusStopsArr[0][2];
        let closestStopId2 = myBusStopsArr[1][0];
        let closestStopName2 = myBusStopsArr[1][2]

        fetch(`https://api.tfl.gov.uk/StopPoint/${closestStopId1}/Arrivals`)
            .then(response => response.json())

            .then(body => getBusInfo(body,closestStop1Name1));

        fetch(`https://api.tfl.gov.uk/StopPoint/${closestStopId2}/Arrivals`)
            .then(response => response.json())

            .then(body => getBusInfo(body,closestStopName2));

    });
}

//2.1 function to read JSON response and check if "invalid postcode" returned 
function checkValidPostcode(body, userInputOK){
    if (body.error != "Invalid postcode") {
        userInputOK = true
    } 
    return userInputOK;
}

//2.2 

//  2. Makes a request for the user's postcode, retrieves the coordinates, requests the bus stops within radius of coordinates
async function getPostcodeLatLon(){

    let userInputOK = false;

    while (userInputOK == false) {
        let postcode = getUserInput();

        const res = await fetch(`https://api.postcodes.io/postcodes/${postcode}`);

        const jsonResponse = await res.json();

        let errMsg = jsonResponse.error;
        // console.log("jsonresponse:", jsonResponse)

        try {
            if (errMsg != "Invalid postcode") {

                userInputOK = true
            } 
    
            if (userInputOK == false) {
                throw 'Invalid Postcode'
            } 
        }
        catch(error) {
            console.log("You appear to have entered an invalid postcode. Please try again (you idiot)")
        }
        
        if(userInputOK == true){
            let coordinates = getLatLon(jsonResponse);
            getBusStops(coordinates)
        }
    }

    
}


getPostcodeLatLon();

