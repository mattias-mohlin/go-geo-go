/**
 * Client application entry point
 * @author Mattias Mohlin
 */

$(function () {
    
    $("#nameinput").on("keydown",function (e) {
        if(e.keyCode == 13) {
            let name = $(this).val();
            if (name.length > 0) {                
                let uri = '/register_player?name=' + encodeURIComponent(name);
                $.get(uri, function (playerName) {
                    window.location.replace('/playerPage?name=' + encodeURIComponent(playerName));
                });
            }
        }
    });
    

});