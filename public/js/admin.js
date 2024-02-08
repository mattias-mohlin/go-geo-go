/**
 * Admin application entry point
 * @author Mattias Mohlin
 */

$(function () {
    var socket = io();    

    var map = L.map('map_admin').setView([51.505, -0.09], 13);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: 'Marcus 50 år av resor!'
    }).addTo(map);

    map.fitWorld();

    $('#start_button').click(function() {                
        $.get('/start', function (n) {
            $('#message').text("Var ligger Cochabamba?").show();
        });
        $('#start_button').hide();
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
    
    // Request player data
    $.get('/request_player_data');

});