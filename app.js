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

const places = [
    {'name' : 'Cochabamba', 'pos' : {'lat' : -17.413977, 'lng' : -66.165321}},
    {'name' : 'Goa (Vagator Beach)', 'pos' : {'lat' : 15.597720, 'lng' : 73.746960}},
    {'name' : '', 'pos' : null} // End of game
];

let currentPlace = -1;

webServer.start((app) => {
    // Routes 
    app.get('/rename_player', function(req, res) {
        let oldName = req.query.oldName;
        let newName = req.query.newName;                        

        newName = webServer.renamePlayer(oldName, newName);

        res.contentType("text/plain");
        res.send(newName);
    });
    
    app.get('/request_player_data', function(req, res) {
        res.send('ok');              

        webServer.onPlayerDataChanged();
    });

    app.get('/next_question', function(req, res) {
        currentPlace++;
        webServer.notifyClients('new_place', places[currentPlace]);

        webServer.countDown();

        res.contentType("text/json");
        res.send(places[currentPlace]);
    });

    app.get('/answer', function(req, res) {
        let player = req.query.player;
        let lat = req.query.lat;
        let lng = req.query.lng;

        webServer.onPlayerAnswered(player, lat, lng);
        res.send('ok');
    });

});
