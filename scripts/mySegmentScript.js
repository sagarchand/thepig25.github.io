analytics.initialize({
    'Google Analytics' : {
        trackingId              : 'UA-46075882-1',
        universalClient         : false,
        domain                  : 'http://thepig25.github.io/',
        enhancedLinkAttribution : true,
        siteSpeedSampleRate     : 5,
        anonymizeIp             : true
    },
     'Mixpanel' : {
        token   : '0071fe282ffd7a92ad4c18d15a379d4d9',
        nameTag : true,
        people  : false
    }
});

analytics.identify('019mr8mf4r', {
    email   : 'CiaranHale@gmail.com',
    name    : 'Ciaran'
});

analytics.page('index.html Docs');

var optusLink = document.getElementById('myOptusLink');

analytics.trackLink(optusLink, 'Clicked Optus Link', {
    plan : 'Iphone'
});
					 
var clickedForm = document.getElementById('submitButton');
var inputField = document.getElementById('textArea').value;

analytics.trackLink(clickedForm, 'Phone Color Selection', {
    chosenColor: inputField,
});

