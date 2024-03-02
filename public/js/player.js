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

    // Get player name from URL
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    var myName = urlParams.has('name') ? urlParams.get('name') : 'ANONYM';

    function showScore(players) {
        Object.entries(players).sort(function(a,b) {
            if (a[1].hasOwnProperty('score') && !b[1].hasOwnProperty('score'))
                return -1; // Player without score comes after any player that has a score
            else if (!a[1].hasOwnProperty('score') && b[1].hasOwnProperty('score'))
                return Number.MAX_VALUE; // Player with score comes before any player that has no score
            else if (!a[1].hasOwnProperty('score') && !b[1].hasOwnProperty('score'))
                return 0; // Players without score come in the order of registration

            return a[1].score - b[1].score;
        }).forEach(function(p, i) {
            if (p[0] == myName) {
                let d = Math.round(p[1].distance * 10) / 10;
                let s = Math.round(p[1].score * 10) / 10;                
                $('#message').html('Du var ' + d + ' km från rätt plats! <span class="blue">Total poäng: ' + s + '!</span><br> ' + 'Du ligger ' + (i+1) + ':a!').show();
            }
        });
    }

    // Get current state of web server
    $.get('/get_player_state?name=' + + encodeURIComponent(myName), function (state) {
        let msg = '';
        if (state.info == 'NOT_STARTED') {
            msg = 'Du spelar som "' + myName + '". Vänta lite!';
            $('#play_button').hide();
        }
        else if (state.info == 'ACTIVE_PLACE') {
            msg = "Var ligger " + state.place.name + "?";
            $('#play_button').text('SVARA').show();
        }
        else {
            // state.info == 'NO_ACTIVE_PLACE' (In between two places)
            msg = 'Vänta på nästa fråga!';
            showScore(state.players);
            $('#play_button').hide();
        }
        
        $('#message').text(msg).show();
    });

    function setMarker(latlng) {
        if (currentMarker != null)
            currentMarker.remove();

        if (latlng == null)
            latlng = {"lat": 57.781799, "lng": 14.158510};

        currentMarker = L.marker(latlng).addTo(map);
    }

    map.on('click', function(e) {
        // Only allow moving the marker while the play button is visible (no move after locked answer)
        if ($('#play_button').is(":visible"))
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
            status: "active",
            player: myName
        });
    });

    // Unused
    socket.on('new_player_name', function(playerName, callback) {
        myName = playerName;        
        $('#nameinput').attr('placeholder', playerName + ", vad heter du?");
        callback({
            status: "ok"
        });
    });

    socket.on('new_place', function(msg) {
        $('#message').text("Var ligger " + msg.name + "?").show();
        $('#play_button').text('SVARA').show();
        setMarker(null);
    });

    socket.on('score', function(players) {
        showScore(players);
    });

    socket.on('game_restart', () => {
        window.location.replace('/');
    });

});