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

webServer.start((app) => {
    // Routes 
    app.get('/new_player', function(req, res) {
        let playerName = req.query.name;
        
        res.contentType("text/plain");
        res.send(playerName);

        webServer.notifyClients('main_new_player', {'name' : playerName});
    });
    
});
