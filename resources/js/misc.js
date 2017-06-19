//scroll to a specific element on the page
function scrollToEl(element) {
    theElement = document.getElementById(element);
    //will smooth scroll in modern browsers
    theElement.scrollIntoView({behavior: 'smooth'});
};

function copyright() {
    var text = "&copy Nicholas J D Dean ";
    var end = ". All Rights Reserved.";
    
    var date = new Date();
    var d = date.getFullYear();
    
    document.getElementById('copyright').innerHTML = text + d + end;
}