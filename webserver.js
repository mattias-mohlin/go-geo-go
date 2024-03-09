const logger = require('./logger');
const port = 5050;

// Webserver 
module.exports = function() {   
    let module = {};    

    let io = null;

    let players = {}; // Player data

    let countDownTimer = null;

    let activePlace = false;

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
        app.get('/maincss', function(req, res) {
            res.contentType("text/css");
            res.sendFile(__dirname + '/public/css/main_styling.css');
        });
        app.get('/main', function(req, res) {
            res.contentType("text/javascript");
            res.sendFile(__dirname + '/public/js/main.js');
        });
        app.get('/jquery', function(req, res) {
            res.contentType("text/javascript");
            res.sendFile(__dirname + '/public/js/jquery/jquery.min.js');
        });
        app.get('/images/marker_correct', function(req, res) {
            res.contentType("img/png");
            res.sendFile(__dirname + '/public/images/marker-correct.png');
        });
        app.get('/images/marker_correct_2x', function(req, res) {
            res.contentType("img/png");
            res.sendFile(__dirname + '/public/images/marker-correct-2x.png');
        });
        app.get('/images/marker_shadow', function(req, res) {
            res.contentType("img/png");
            res.sendFile(__dirname + '/public/images/marker-shadow.png');
        });

        app.get('/adminPage', function(req, res) {
            res.contentType("text/html");
            res.sendFile(__dirname + '/public/html/admin.html');
        });
        app.get('/admin', function(req, res) {
            res.contentType("text/javascript");
            res.sendFile(__dirname + '/public/js/admin.js');
        });

        app.get('/playerPage', function(req, res) {
            res.contentType("text/html");
            res.sendFile(__dirname + '/public/html/player.html');
        });
        app.get('/player', function(req, res) {
            res.contentType("text/javascript");
            res.sendFile(__dirname + '/public/js/player.js');
        });
        app.get('/images/marcus50', function(req, res) {
            res.contentType("img/png");
            res.sendFile(__dirname + '/public/images/marcus50.png');
        });


        io.on('connection', (socket) => {
            if (socket.request.headers.referer.includes('admin')) {
                console.log('Admin page connection');             
            }
            else {
                console.log('Connection from: ' + socket.request.headers.referer);
            }

            socket.on('disconnect', () => { 
                // Player dropped
                console.log('Disconnection from: ' + socket.request.headers.referer);             
            });

            socket.on('player_results', (results) => {
                // The response contains player scores
                for (player in results) {
                    players[player].distance = results[player].distance;
                    if (!players[player].hasOwnProperty('score'))
                        players[player].score = 0;
                    players[player].score += Math.round(results[player].distance);  
                    if (!players[player].hasOwnProperty('answers'))
                        players[player].answers = 0;
                    players[player].answers += 1;
                }

                setTimeout( () => {
                    // Notify each player about his score (and leaderboard)
                    module.notifyClients('score', players);
                }, 1000);                

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

    // Unused
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

    module.registerPlayer = function(name, fromMainPage) {
        if (!fromMainPage) {
            // In most cases the player will already be registered here.
            // Don't overwrite his existing data
            if (players[name] == undefined) {
                players[name] = {};        
                logger.log('Player registered: ' + name + '!');
            }
        }
        else {
            let i = 1;
            while (players[name] != undefined) {
                // New name alread occupied
                name = name + i;
                i++;
            }

            players[name] = {};
            logger.log('Player registered: ' + name + '!');
        }

        this.onPlayerDataChanged();                

        return name;
    }

    module.getPlayerState = function(playerName) {
        let state = {};
        state.info = activePlace ? 'ACTIVE_PLACE' : 'NO_ACTIVE_PLACE';
        if (!activePlace) {
            state.players = players;
        }        
        return state;
    }

    // If there is an active count-down, stop it if there are no pending player answers
    module.checkActiveCountDown = function() {
        if (!countDownTimer)
            return; // No count-down running

        // Stop the count-down when all players have answered
        let everyoneHasAnswered = true;
        for (p in players) {
            if (! players[p].hasOwnProperty('answer')) {
                everyoneHasAnswered = false;
                break;
            }
        }

        if (everyoneHasAnswered) {
            clearInterval(countDownTimer);
            countDownTimer = null;
            activePlace = false;
            module.notifyClients('player_answers_collected', players);            
        }
    }

    module.onPlayerAnswered = function(player, lat, lng) {
        if (player in players) {
            players[player].answer = {"lat" : lat, "lng" : lng};
        }

        module.notifyClients('player_answered', player);

        this.checkActiveCountDown();
    }

    module.countDown = function() {
        module.checkActivePlayers();

        // Start count-down
        let remaining = 60;
        countDownTimer = setInterval(function() {
            remaining--;
            if (remaining == 0) {
                clearInterval(countDownTimer);
                activePlace = false;
                module.notifyClients('player_answers_collected', players);
            }
            else {
                module.notifyClients('count_down', {'remainingTime' : remaining});
            }
        }, 1000);
        
    }    

    // To be called whenever some player data is changed (the Admin UI then needs to be updated)
    module.onPlayerDataChanged = function() {
        this.notifyClients('player_data_changed', players);
    }

    async function pingActivePlayers() {
        let activePlayers = [];
        const sockets = await io.fetchSockets();
        for (socket of sockets) {
            socket.emit('is_player_active', (r) => {
                logger.log('Active player: ' + r.player);
                activePlayers.push(r.player);
            });
        };                    
        setTimeout(function() {
            let changed = false;
            for (p in players) {
                if (!activePlayers.includes(p)) {
                    logger.log('Deleting inactive player: ' + p);
                    delete players[p];
                    changed = true;
                }
            }
            if (changed)
                module.onPlayerDataChanged();
        }, 2000);
    }

    module.newPlace = function(place) {
        // Clear any previous answers
        for (p in players) {
            delete players[p].answer;
        }

        pingActivePlayers();

        activePlace = true;

        this.notifyClients('new_place', place);
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

    module.getPlayers = function() {
        return players;
    }

    module.checkActivePlayers = function() {
        pingActivePlayers();
    }

    module.restart = function() {
        players = {};
        if (countDownTimer)
            clearInterval(countDownTimer);
            
        countDownTimer = null;
        activePlace = false;
        this.notifyClients('game_restart', players);
    }

    return module;
}
