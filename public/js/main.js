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
/*
    var mapIcons = {
        guess: L.AwesomeMarkers.icon({
            icon: 'question-circle',
            markerColor: 'orange'
        }),
        city: L.AwesomeMarkers.icon({
            icon: 'check',
            markerColor: 'green'
        })
    };*/
    /*var mapIcon = L.icon({
        iconUrl: 'my-icon.png',
        iconSize: [38, 95],
        iconAnchor: [22, 94],
        popupAnchor: [-3, -76],
        shadowUrl: 'my-icon-shadow.png',
        shadowSize: [68, 95],
        shadowAnchor: [22, 94]
    });*/
    var mapIcon = L.Icon.Default;

    var currentMarker = null;
    var myName = "anonym";

    map.on('click', function(e) {
        //$('#play_button').text(e.latlng);

        if (currentMarker != null)
            currentMarker.remove();

        currentMarker = L.marker(e.latlng).addTo(map);
        //currentMarker.bindPopup("<b>Hello world!</b><br>I am a popup.").openPopup();
    });

    $('#play_button').click(function() {        
        let name = $('#nameinput').val();
        if (name.length > 0) {
            $('#nameinput_area').remove();
            $('#play_button').hide();
            let uri = '/rename_player?oldName=' + encodeURIComponent(myName) + '&newName=' + encodeURIComponent(name);
            $.get(uri, function (n) {
                myName = n;
                $('#message').text('Du spelar som "' + n + '". Vänta tills spelet börjar!').show();
            });
        }
    });    

    socket.on('new_player_name', function(playerName, callback) {
        myName = playerName;        
        $('#nameinput').attr('placeholder', playerName + " (Skriv ditt namn här)");
        callback({
            status: "ok"
        });
    });

    socket.on('new_place', function(msg) {
        $('#nameinput_area').remove();
        $('#message').text("Var ligger " + msg.name + "?").show();
        $('#play_button').text('SVARA').show();
    });

});