// This widget is based on the 'Video on Command' widget from Benno. Thank you!

// It was reworked in such a way that it uses two video pools from which a video is randomly picked.
// This approach was choosen to make a binary outcome look more dynamic.

// To guarantee a random distribution between those two video pools, the pools themselves are picked first.
// (So the number of videos in each pool don't affect the probability.)

// To work properly at least 1 video per outcome is required. (Otherwise an error message is shown.)


let userOptions = {};
let animationIn = 'none';
let animationOut = 'none';
let timeIn = 0;
let timeOut = 0;
let allowed = true;

let cooldown = 15;
let lastSuccessEpoch = 0;				// Logs the timestamp of the last successful execution.

let videoURLs_heads;
let videoURLs_tails;


window.addEventListener('onWidgetLoad', function (obj) {
    userOptions = obj['detail']['fieldData'];
    
    userOptions['channelName'] = obj['detail']['channel']['username'];
    userOptions['additionalUsers'] = (userOptions['additionalUsers'].toLowerCase()).replace(/\s/g, '').split(",");
    
    timeIn = userOptions['timeIn'];
    timeOut = userOptions['timeOut'];
    animationIn = userOptions['animationIn'];
    animationOut = userOptions['animationOut'];
  
    cooldown = userOptions['cooldown'];
    
    videoURLs_heads = userOptions['videos_heads'];
    videoURLs_tails = userOptions['videos_tails'];
    
    // If there is not a single video for a particular outcome, show an error message instead.
    if (!videoURLs_heads || videoURLs_heads.length == 0 || 
        !videoURLs_tails || videoURLs_tails.length == 0) {
        
        $('#video').replaceWith("<h1>In order to function properly, at least one video " + 
                                " must be assigned to each possible outcome.</h1>");
        allowed = false;
        return;
    };
    
    $("#video").hide();
    allowed = true;
});


window.addEventListener('onEventReceived', function (obj) {
    // Ignore any event that isn't a chat message.
    if (obj.detail.listener !== 'message') return;
    
    let data = obj.detail.event.data;
    let message = data['text'].toLowerCase();
    let command1 = userOptions['command1'].toLowerCase();
    
    if (message !== command1) return;
  
    console.log("Got it! '" + message + "'");
    
    // Blocks any request while ...
    // - a video is playing or
    // - an outcome has no associated videos or
    // - the command is still on cool down.
    if (!allowed || isOnCoolDown()) return;
    
    let user = data['nick'].toLowerCase();
    
    // Preparing userState object containing all user flags
    let userState = {
        'mod': parseInt(data.tags.mod),
        'sub': parseInt(data.tags.subscriber),
        'vip': (data.tags.badges.indexOf("vip") !== -1),
        'broadcaster': (user === userOptions['channelName'])
    };
    
    // Check if user has the correct permission level to trigger the command.
    if ((userOptions['permissionLvl'] === 'everyone') || 
        (userState.mod && userOptions['permissionLvl'] === 'mods') || 
        ((userState.vip || userState.mod) && (userOptions['permissionLvl'] == 'vips')) || 
        userState.broadcaster || 
        (userOptions['additionalUsers'].indexOf(user) !== -1)) {
        
        let video = $("#video");
        let source = $("#source");
        allowed = false;
        video[0].pause();
        
        // Flip a coin and pick a random videoURL that is associated with the result.
        let randomVideoURL = randomItemFromArray((Math.random() < 0.5) ? videoURLs_heads : videoURLs_tails);
        
        video[0].load();
        source.attr('src', randomVideoURL);
        video[0].volume = userOptions['videos_volume'] / 100;
        play();
        
        lastSuccessEpoch = Date.now();			// Sets the cool down.
    };
    
    // The command isn't executed as long as this returns true.
	function isOnCoolDown() {
        if (cooldown == 0) return false;
        
        let elapsedMillis = Date.now() - lastSuccessEpoch;
        let coolDownMillis = cooldown * 1000;
        
        if (elapsedMillis > coolDownMillis) {
            return false;
        } else {
            console.log("Command1 executed " + elapsedMillis + " ms ago and is therefore still on cool down. (Total: " + coolDownMillis + " ms.)");
            return true;
        };
    }
    
    // Returns a random element of the array.
    function randomItemFromArray(arr) {
    	return arr[Math.floor(Math.random() * arr.length)];
    }
    
    function play() {
        let video = $("#video");
        
        video.addClass(animationIn + ' animated', timeIn)
            .show(0, timeIn)
            .removeClass(animationIn)
            .get(0).play();
        
        video.on('ended', function () {
            video.addClass(animationOut, timeOut)
                .removeClass(animationOut + " animated", timeOut)
                .hide(0, timeOut);
            
            allowed = true;
        });
    }
});
