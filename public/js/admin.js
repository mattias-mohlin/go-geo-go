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

    socket.on('main_new_player', function(msg) {
        $('.players_table tbody').append('<tr class="new_player_row"><td>' + msg.name + '</td><td>0</td></tr>');
        setTimeout(function() {
            $('.new_player_row').removeClass('new_player_row');
        }, 3000);
    });

});