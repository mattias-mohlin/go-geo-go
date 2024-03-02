/*******************************************************************************
 * MIT License
 *******************************************************************************/

/**
 * Application entry point
 * @author Mattias Mohlin
 */
'use strict';

const webServer = require('./webserver')();
const logger = require('./logger');

const env = process.env.NODE_ENV || 'development';
/*
const places = [
    {'name' : 'Cochabamba', 'lat' : -17.413977, 'lng' : -66.165321},
    {'name' : 'Goa (Vagator Beach)', 'lat' : 15.597720, 'lng' : 73.746960},
    {'name' : 'Arusha', 'lat' : -3.386925, 'lng' : 36.682995},
    {'name' : 'Järvsö', 'lat' : 61.716011, 'lng' : 16.169710},
    {'name' : 'Warszawa', 'lat' : 52.229675, 'lng' : 21.012230},
    {'name' : 'Xian', 'lat' : 34.341576, 'lng' : 108.939774},
    {'name' : 'Las Vegas', 'lat' : 36.169941, 'lng' : -115.139832},
    {'name' : '', 'lat' : 0, 'lng' : 0} // End of game
];*/

function shuffle(array) {
    let currentIndex = array.length,  randomIndex;
  
    // While there remain elements to shuffle.
    while (currentIndex > 0) {
  
      // Pick a remaining element.
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
  
    return array;
}

var fs = require('fs');
const places = shuffle(JSON.parse(fs.readFileSync('cities-capitals.json', 'utf8')));

let currentPlace = -1;

webServer.start((app) => {
    // Routes 

    // Unused
    app.get('/rename_player', function(req, res) {
        let oldName = req.query.oldName;
        let newName = req.query.newName;                        

        newName = webServer.renamePlayer(oldName, newName);

        res.contentType("text/plain");
        res.send(newName);
    });

    app.get('/register_player', function(req, res) {
        let name = req.query.name;
        let playerName = webServer.registerPlayer(name);

        res.contentType("text/plain");
        res.send(playerName);
    });

    app.get('/request_player_data', function(req, res) {
        res.contentType("text/json");            

        //webServer.onPlayerDataChanged();
        let players = webServer.getPlayers();
        res.send(players);
    });

    // Return state information for admin page
    app.get('/get_current_place', function(req, res) {
        res.contentType("text/json");            

        let place = currentPlace == -1 ? {} : places[currentPlace];
        res.send(place);
    });

    // Return state information for player page
    app.get('/get_player_state', function(req, res) {
        let player = req.query.player;
        res.contentType("text/json");            

        let state;
        if (currentPlace == -1) {
            state = {'info' : 'NOT_STARTED'};
        }
        else {
            state = webServer.getPlayerState(player);
            state.place = places[currentPlace];
        }

        res.send(state);
    });

    app.get('/next_question', function(req, res) {
        currentPlace++;
        webServer.newPlace(places[currentPlace]);

        webServer.countDown();

        res.contentType("text/json");
        res.send(places[currentPlace]);
    });

    app.get('/answer', function(req, res) {
        let player = req.query.player;
        let lat = req.query.lat;
        let lng = req.query.lng;

        webServer.onPlayerAnswered(player, parseFloat(lat), parseFloat(lng));
        res.send('ok');
    });

    app.get('/check_active_players', function(req, res) {
        webServer.checkActivePlayers();
        res.send('ok');
    });

    app.get('/restart_game', function(req, res) {
        currentPlace == -1;
        webServer.restart();
        res.send('ok');
    });
});
