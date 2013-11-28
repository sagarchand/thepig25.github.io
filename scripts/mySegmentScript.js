analytics.initialize({
    'Google Analytics' : {
        trackingId              : 'UA-46075882-1',
        universalClient         : false,
        domain                  : 'http://thepig25.github.io/',
        enhancedLinkAttribution : true,
        siteSpeedSampleRate     : 5,
        anonymizeIp             : true
    }
});
analytics.identify('019mr8mf4r', {
    email   : 'CiaranHale@gmail.com',
    name    : 'Ciaran'
});

analytics.page('index.html Docs');

var optusLink = $('.myOptusLink'); // with jQuery

analytics.trackLink(optusLink, 'Clicked Optus Link', {
    plan : 'Iphone'
});