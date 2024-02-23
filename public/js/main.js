/**
 * Client application entry point
 * @author Mattias Mohlin
 */

$(function () {
    
    $('#play_button').click(function() {
        let name = $('#nameinput').val();
        window.location.replace('/playerPage');
    });    

    

});