const logger = require('./logger');
const port = 5050;

// Webserver 
module.exports = function() {   
    let module = {};    

    let io = null;

    let players = {}; // Player data

    // Start the web server and add routes for serving static files. 
    // Then the registerRoutes function is called to allow additional routes to be added in the caller context.
    module.start = function(registerRoutes) {
        let express = require('express');
        let app = express();
        let http = require('http').Server(app);
        io = require('socket.io')(http);
    
        // Static middleware for serving static files 
        app.get('/', function(req, res) {
            res.contentType("text/html");
            res.sendFile(__dirname + '/public/html/main.html');
        });
        app.get('/css', function(req, res) {
            res.contentType("text/css");
            res.sendFile(__dirname + '/public/css/styling.css');
        });
        app.get('/main', function(req, res) {
            res.contentType("text/javascript");
            res.sendFile(__dirname + '/public/js/main.js');
        });
        app.get('/jquery', function(req, res) {
            res.contentType("text/javascript");
            res.sendFile(__dirname + '/public/js/jquery/jquery.min.js');
        });

        app.get('/adminPage', function(req, res) {
            res.contentType("text/html");
            res.sendFile(__dirname + '/public/html/admin.html');
        });
        app.get('/admin', function(req, res) {
            res.contentType("text/javascript");
            res.sendFile(__dirname + '/public/js/admin.js');
        });

        io.on('connection', (socket) => {
            console.log('a user connected: ' + socket.request.headers.referer);  
            //if (!socket.request.headers.referer.includes('admin')) {
                // Player connection

                let playerName = 'Spelare ' + Object.keys(players).length;                
            
                socket.emit('new_player_name', playerName, (response) => {
                    // Player received the event
                    players[playerName] = {'score' : 0};
                    this.onPlayerDataChanged();
                });
            //}


            socket.on('disconnect', () => { 
                // Player dropped
                console.log('a user disconnected: ' + socket.request.headers.referer);  
            });
        });

        // Register other routes in the caller context
        registerRoutes(app);
            
        http.listen(port, () => {
            logger.logSeparator();
            logger.log(`Web server started at http://localhost:${port}`)
            logger.logSeparator();
        });        
    }

    module.renamePlayer = function(oldName, newName) {
        let i = 1;
        while (players[newName] != undefined) {
            // New name alread occupied
            newName = newName + i;
            i++;
        }

        if (oldName in players) {
            let playerData = players[oldName];
            delete players[oldName];
            players[newName] = playerData;

            this.onPlayerDataChanged();
        }
        else {
            logger.log('No player called ' + oldName + ' found!');
        }

        return newName;
    }

    // To be called whenever some player data is changed (the Admin UI then needs to be updated)
    module.onPlayerDataChanged = function() {
        this.notifyClients('player_data_changed', players);
    }

    // Determines if the web server was started
    module.isStarted = function() {
        return io != null;
    }

    // Notify all clients currently connected to the web server
    module.notifyClients = function(msg, data) {
        if (this.isStarted())
            io.emit(msg, data);
    }

    return module;
}
