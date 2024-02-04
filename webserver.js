const logger = require('./logger');
const port = 5050;

// Webserver 
module.exports = function() {   
    let module = {};    

    let io = null;

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
            console.log('a user connected');
        });

        // Register other routes in the caller context
        registerRoutes(app);
            
        http.listen(port, () => {
            logger.logSeparator();
            logger.log(`Web server started at http://localhost:${port}`)
            logger.logSeparator();
        });        
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
