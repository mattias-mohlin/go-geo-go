/**
 * Client application entry point
 * @author Mattias Mohlin
 */

$(function () {
    
    function register(e) {
        if(e.type == "blur" || e.keyCode == 13) {
            let name = $(this).val();
            if (name.length > 0) {                
                let uri = '/register_player?name=' + encodeURIComponent(name);
                $.get(uri, function (playerName) {
                    window.location.replace('/playerPage?name=' + encodeURIComponent(playerName));
                });
            }
        }
    }

    $("#nameinput").on("keydown", register);

    $("#nameinput").blur(register);
    
    let images = ['/images/marcus50', '/images/marcus50_2', '/images/marcus50_3'];
    let i = 0;
    setInterval(function() {
        if (i == images.length)
            i = 0;

        $('div.img').css({'background-image': 'url("' + images[i] + '")'});
        i++;
    }, 2000);

});