const fetch = require('node-fetch');
const readline = require("readline-sync");

//  1.1 Helper function: Asks the user for a postcode, returns the postcode as a string
function getUserInput(){
    console.log("Please enter a postcode: ")
    let userLocation = readline.prompt();

    console.log("Please enter a radius (m):")
    let userRadius = readline.prompt();

    return [userLocation, Math.round(+userRadius)];
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

    console.log(`\nThe next buses due at ${stopName}:`)
    for (let i = 0; i< buses.length; i++) {
        console.log(`The ${buses[i][0]} heading towards ${buses[i][1]}: due in ${buses[i][2]} minutes`)
    }


return buses
}

// 1.4 Function to check length of BusStopsArr and return true if length > 0
function checkBusStops(busStopsArray) {
    console.log(busStopsArray)
    if (busStopsArray.length > 0) {
        userRadiusOk = true
        console.log("the user radius is OK")
        return true
    }
    return false
}

// 1.5 Helper function: Makes an API request for bus stops within radius from specified coordinates
function getBusStops(coordinates, radius) {
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
function checkValidPostcode(body, userPostcodeOK){
    if (body.error != "Invalid postcode") {
        userPostcodeOK = true
    } 
    return userPostcodeOK;
}

//  2. Makes a request for the user's postcode, retrieves the coordinates, requests the bus stops within radius of coordinates
async function getPostcodeLatLon(){

    let userPostcodeOK = false;
    let userRadiusOK = false;
    while (!userPostcodeOK || !userRadiusOK) {
        let userInput = getUserInput();
        let postcode = userInput[0];
        let radius = userInput[1];

        const res = await fetch(`https://api.postcodes.io/postcodes/${postcode}`);
        const jsonResponse = await res.json();
        let errMsg = jsonResponse.error;
        try {
            if (errMsg != "Invalid postcode") {
                userPostcodeOK = true;
                console.log("this is the first if statement in the try block")  //successfully xecuting
                try {
                    console.log("The tryblock is successfully executing")  // successfully executing
                    // userRadiusOK = checkBusStops(busStopsArray)
                    console.log("userradius OK: ", userRadiusOK)
                    if (userRadiusOK == false) {
                        console.log("this is the if statement")   // not executing
                        console.log("Sorry there are no bus stops nearby. Try increasing the radius!");
                        throw 'No Bus Stops Within Radius';
                    } else {
                        console.log("this is the else statement")   
                        userRadiusOK = true;
                        let coordinates = getLatLon(jsonResponse);
                        getBusStops(coordinates, radius)
                    }
                }
        
                finally {
                    console.log("finally executed");
                }
                
            } 
            if (userPostcodeOK == false) {
                throw 'Invalid Postcode'
            } 
        }
        catch(error) {
            console.log("You appear to have entered an invalid postcode. Please try again")
        }
    }
};

getPostcodeLatLon();

