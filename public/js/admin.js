/**
 * Admin application entry point
 * @author Mattias Mohlin
 */

$(function () {
    var socket = io();    

    var map = L.map('map').setView([51.505, -0.09], 13);

    let currentPlace = null;

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: 'Marcus 50 år av resor!'
    }).addTo(map);

    map.fitWorld();

    $('#start_button').click(function() {                
        $.get('/next_question', function (place) {
            currentPlace = place;
            $('#message').text('Var ligger ' + currentPlace.name + '?').show();
        });
        //$('#start_button').hide();
    });

    socket.on('player_data_changed', function(players) {
        for (player in players) {
            let player_row = $('.players_table tbody').find('tr[data-player="' + player + '"]');
            if (player_row.length > 0) {
                player_row.addClass('player_change');
                let cells = player_row.children('td');
                cells.eq(0).text(player);
                cells.eq(1).text(players[player].score);
                continue;
            }

            // New player
            $('.players_table tbody').append('<tr data-player="' + player + '" class="player_change"><td>' + player + '</td><td>' + players[player].score +'</td></tr>');
        }

        // Remove all unchanged rows
        $('.players_table tbody').find('tr').not('.player_change').remove();

        setTimeout(function() {
            $('.player_change').removeClass('player_change');
        }, 3000);
    });  
    
    socket.on('count_down', function(data) {
        $('#start_button').text(data.remainingTime);
    });  

    socket.on('player_answers_collected', function(players) {
        //$('#start_button').hide();        
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

            let dist = map.distance(currentPlace.pos, pos) / 1000; // kilometers
            players[player].distance = dist;

            if (minDist == -1 || dist < minDist) {
                minDist = dist;
                bestPlayer = player;
            }
        }

        $('#message').text('Närmast var ' + bestPlayer + ' (' + Math.round(minDist * 10) / 10 + ' km ifrån ' + currentPlace.name + ')!');

        // Send results back to server
        socket.emit('player_results', players);

        $('#start_button').text('FORTSÄTT');
    });

    // Request player data
    $.get('/request_player_data');

});