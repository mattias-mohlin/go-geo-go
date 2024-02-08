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

    app.get('/start', function(req, res) {
        res.send('ok');

        webServer.notifyClients('new_place', {'name' : 'Cochabamba'});
    });

});
