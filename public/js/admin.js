/**
 * Admin application entry point
 * @author Mattias Mohlin
 */

$(function () {
    var socket = io();    

    var map = L.map('map').setView([51.505, -0.09], 13);

    let currentPlace = null;
    let placedMarkers = [];

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        noWrap: true,
        maxZoom: 19,
        minZoom: 2,
        attribution: 'Marcus 50 år av resor!'
    }).addTo(map);

    map.fitWorld();

    $('#start_button').click(function() {  
        if ($('#start_button').text() == 'POÄNG') {     
            // Clear answers from map
            for (m in placedMarkers) {
                placedMarkers[m].remove();
            }
            placedMarkers = [];

            $('#map').hide();
            $('.players_table').show();

            // Request player data
            $.get('/request_player_data', function (players) {                
                updatePlayerTable(players);
            });

            $('#start_button').text('FORTSÄTT');
        }
        else {
            $.get('/next_question', function (place) {
                currentPlace = place;
                $('#message').text('Var ligger ' + currentPlace.name + '?').show();
            });
        }        
    });

    $('#reset_button').click(function() {  
        // Restart game
        $.get('/restart_game');
    });

    function updatePlayerTable(players) {
        // If any player contains a score, empty the table to make sure it appears sorted according to score
        let hasScore = false;
        for (p in players) {
            if (players[p].hasOwnProperty('score')) {
                hasScore = true;
                break;
            }
        }
        if (hasScore) {
            $('.players_table tbody').empty();
        }

        Object.entries(players).sort(function(a,b) {
            if (a[1].hasOwnProperty('score') && !b[1].hasOwnProperty('score'))
                return -1; // Player without score comes after any player that has a score
            else if (!a[1].hasOwnProperty('score') && b[1].hasOwnProperty('score'))
                return Number.MAX_VALUE; // Player with score comes before any player that has no score
            else if (!a[1].hasOwnProperty('score') && !b[1].hasOwnProperty('score'))
                return 0; // Players without score come in the order of registration

            // If two players have different number of answers, the one with more answers comes first
            if (a[1].hasOwnProperty('answers') && b[1].hasOwnProperty('answers') && a[1].answers != b[1].answers) {
                return b[1].answers - a[1].answers;
            }

            return a[1].score - b[1].score;
        }).forEach(function(p, i) {
            let playerName = p[0];
            let playerData = p[1];
            let score = playerData.hasOwnProperty('score') ? playerData.score : '';
            let answers = playerData.hasOwnProperty('answers') ? playerData.answers : 0;
            let player_row = $('.players_table tbody').find('tr[data-player="' + playerName + '"]');
            if (player_row.length > 0) {
                player_row.addClass('player_change');
                let cells = player_row.children('td');
                cells.eq(0).text(playerName);
                cells.eq(1).text(score);
                cells.eq(2).text(answers);
                return;
            }
            
            // New player      
            let style = 'player_change new_player';
            if (playerName == "marcus50")
                style = style + ' marcus50';
            $('.players_table tbody').append('<tr data-player="' + playerName + '" class="' + style + '"><td>' + playerName + '</td><td>' + score +'</td><td>' + answers + '</td></tr>');
        });

        // Remove all unchanged rows
        $('.players_table tbody').find('tr').not('.player_change').remove();

        setTimeout(function() {
            $('.player_change').removeClass('player_change');
            $('.new_player').removeClass('new_player');
        }, 3000);

        $('.players_table tr').dblclick(function(e) {
            let player = $(e.target).parent().text();
            $.get('/check_active_players');
        });
    }

    socket.on('player_data_changed', updatePlayerTable);

    socket.on('game_restart', () => {
        window.location.replace('/adminPage');
    });
    
    socket.on('count_down', function(data) {
        $('#start_button').text(data.remainingTime);
    });  

    socket.on('player_answered', function(playerName) {
        $('.players_table tbody').find('tr[data-player="' + playerName + '"]').addClass('player_answered');
    });

    socket.on('player_answers_collected', function(players) {
        $('.players_table tbody').find('tr').removeClass('player_answered');
        $('.players_table').hide();
        $('#map').show();
        map.invalidateSize(); // To force a refresh of the map when it becomes visible

        // Show all player answers on map
        let minDist = -1;
        let bestPlayer = '';
        for (player in players) {
            let pos = {"lat": 57.781799, "lng": 14.158510};

            if (players[player].hasOwnProperty('answer'))
                pos = players[player].answer;

            let marker = L.marker(pos).addTo(map);
            let popupText = $('<div/>').text(player).html()
            marker.bindTooltip(popupText).openTooltip();
            placedMarkers.push(marker);

            let currentPos = L.latLng(currentPlace.lat, currentPlace.lng);
            let dist = map.distance(currentPos, pos) / 1000; // kilometers
            players[player].distance = dist;

            if (minDist == -1 || dist < minDist) {
                minDist = dist;
                bestPlayer = player;
            }
        }

        // Show correct place on map

        const correctIcon = L.icon({
            iconUrl: '/images/marker_correct',  
            iconRetinaUrl: '/images/marker_correct_2x',
            shadowUrl: '/images/marker_shadow',
            iconSize:    [25, 41],
  		    iconAnchor:  [12, 41],
  		    popupAnchor: [1, -34],
  		    tooltipAnchor: [16, -28],
  		    shadowSize:  [41, 41]
        });

        let currentPos = L.latLng(currentPlace.lat, currentPlace.lng);
        let correctMarker = L.marker(currentPos, {'icon' : correctIcon}).addTo(map);        
        placedMarkers.push(correctMarker);

        let popupText = $('<div/>').text('***' + currentPlace.name + '***').html()
        correctMarker.bindTooltip(popupText).openTooltip();

        $('#message').text('Närmast var ' + bestPlayer + ' (' + Math.round(minDist * 10) / 10 + ' km ifrån ' + currentPlace.name + ')!');

        // Send results back to server
        socket.emit('player_results', players);

        $('#start_button').text('POÄNG');
    });

    // Request player data
    $.get('/request_player_data', function (players) {        
        updatePlayerTable(players);
    });

    // Get current place (to know current state of web server)
    $.get('/get_current_place', function (place) {
        if (Object.keys(place).length > 0) {
            // Game started
            currentPlace = place;
            $('#start_button').text('FORTSÄTT');
        }
    });
});