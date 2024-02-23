/**
 * Client application entry point
 * @author Mattias Mohlin
 */

$(function () {
    var socket = io();    

    var map = L.map('map').setView([51.505, -0.09], 13);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        center: [57.363, 14.06],
        maxZoom: 4,
        minZoom: 2,
        attribution: 'Marcus 50 år av resor!'
    }).addTo(map);

    map.fitWorld();

    var mapIcon = L.Icon.Default;

    var currentMarker = null;
    var myName = "anonym";

    function setMarker(latlng) {
        if (currentMarker != null)
            currentMarker.remove();

        if (latlng == null)
            latlng = {"lat": 57.781799, "lng": 14.158510};

        currentMarker = L.marker(latlng).addTo(map);
    }

    map.on('click', function(e) {
        setMarker(e.latlng);        
    });

    $('#play_button').click(function() {
        if (currentMarker == null) {
            // Set name
            let name = $('#nameinput').val();
            if (name.length > 0) {
                $('#nameinput_area').remove();
                $('#play_button').hide();
                let uri = '/rename_player?oldName=' + encodeURIComponent(myName) + '&newName=' + encodeURIComponent(name);
                $.get(uri, function (n) {
                    myName = n;
                    $('#message').text('Du spelar som "' + n + '". Vänta lite!').show();
                });
            }
        }
        else {
            // Answer question
            let pos = currentMarker.getLatLng();
            let uri = '/answer?player=' + encodeURIComponent(myName) + '&lat=' + pos.lat + '&lng=' + pos.lng;
            $.get(uri, function (n) {                
                $('#message').text('Ditt svar är registrerat. Vänta på din poäng!').show();
                $('#play_button').hide();
            });
        }
    });    

    socket.on('is_player_active', function(callback) {        
        callback({
            status: "active"
        });
    });

    socket.on('new_player_name', function(playerName, callback) {
        myName = playerName;        
        $('#nameinput').attr('placeholder', playerName + ", vad heter du?");
        callback({
            status: "ok"
        });
    });

    socket.on('new_place', function(msg) {
        $('#nameinput_area').remove();
        $('#message').text("Var ligger " + msg.name + "?").show();
        $('#play_button').text('SVARA').show();
        setMarker(null);
    });

    socket.on('score', function(players) {
        players.sort(function(a,b) {
            return a.score - b.score;
        }).forEach(function(p, i) {
            if (p.name == myName) {
                let d = Math.round(players[player].distance * 10) / 10;
                let s = Math.round(players[player].score * 10) / 10;                
                $('#message').text('Du var ' + d + ' från rätt plats! Total poäng: ' + s + '! ' + 'Du ligger ' + i + ':a!');
            }
        });
    });

});