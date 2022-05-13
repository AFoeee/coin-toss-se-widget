/**
 * This widget visualizes the outcome of a random distribution (e.g. coin toss). 
 * To achieve this, it uses multiple video pools (one per possible outcome) from 
 * which a random video is picked.
 * 
 * Special thanks to Benno and Reboot0.
 */


/* Prefixes defined in 'Fields' are only taken into account if they are also
 * specified in this list. */
const outcomePrefixes = [
  "outcome1", 
  "outcome2"
];

let allowed = false;                // Blocks the widget when busy.
const videoPools = [];              // Holds the diffent video pools.

let commandStr;
let cooldownMillis;
let cooldownEndEpoch = 0;

let isUsableByEveryone;             // If true, everyone can trigger the widget.
let isUsableByMods;
let otherUsers;                     // Those users can trigger the widget, too.


/* Triggers CSS animations by adding animate.css classes. Their effect is 
 * sustained as long as they're attached to the element. Therefore, they are 
 * only removed to immediately replace them with other animate.css classes. */
function animateCss(node, animationName, duration = 1, prefix = 'animate__') {
  // animate.css classes do have a prefix (since version 4.0).
  const envCls = `${prefix}animated`;
  const animationCls = `${prefix}${animationName}`;
  
  // Remove all applied animate.css classes.
  node.className = node.className
      .split(" ")
      .filter((cls) => !cls.startsWith(prefix))
      .join(" ");
  
  // Promise resolves when animation has ended.
  return new Promise((resolve, reject) => {
    node.addEventListener('animationend', (event) => {
      event.stopPropagation();
      resolve('Animation ended');
    }, {once: true});
    
    node.style.setProperty('--animate-duration', `${duration}s`);
    node.classList.add(envCls, animationCls);       // Starts CSS animation.
  });
}


// Returns a random element of the array.
function randomItemFromArray(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}


// Uses the input of a media field to test whether media was added to it.
function isMediaFieldPopulated(input) {
  return (input && (Array.isArray(input) ? (input.length > 0) : true));
}


/* Sets a (global) cooldown. To avoid unnecessary calculations, it is represented 
 * by an epoch time that marks the moment, when the cooldown has ended. Later code
 * then simply compares this to the current epoch time. */
function activateCooldown() {
  cooldownEndEpoch = Date.now() + cooldownMillis;
}


function isOnCooldown() {
  return (Date.now() < cooldownEndEpoch);
}


/* Abstract base class, which defines ...
 * ... general media attributes.
 * ... how the command is triggered.
 * ... how the cooldown mechanism works.
 * ... which url is used (if multiple are provided). */
 
/* Represents the video pool for a possible outcome. */
class VideoPool {
  static videoElmt = document.getElementById("video");
  
  #url;
  normalizedVolume;
  
  static {
    // Hide video element immediately (therefore, 0s duration).
    const hideVideoElmt = 
        () => animateCss(VideoPool.videoElmt, "{{animationOut}}", 0);
    
    // Ensures a defined initial state.
    hideVideoElmt();
    
    // When a video playback starts, trigger the in-animation.
    VideoPool.videoElmt.onplay = 
        () => animateCss(VideoPool.videoElmt, "{{animationIn}}", {{timeIn}});
    
    // When an error occurs, unblock the widget.
    VideoPool.videoElmt.onerror = () => {
      hideVideoElmt();      // Otherwise the next in-animation would be skipped.
      allowed = true;
      
      throw VideoPool.videoElmt.error;
    };
    
    // When a video ends, trigger the out-animation.
    VideoPool.videoElmt.onended = async () => {
      try {
        await animateCss(VideoPool.videoElmt, "{{animationOut}}", {{timeOut}});
      } finally {
        /* Unblock the widget only after the out-animation has finished. Otherwise
         * there would be a chance that it's interrupted. */
        allowed = true;
      }
    };
  }
  
  constructor(url, volumePct) {
    this.#url = url;
    this.normalizedVolume = volumePct / 100;
  }
  
  /* If an array of media is provided, a random element is picked. (That's the 
   * case when the field's "multiple" parameter is true.) */
  get url() {
    if (Array.isArray(this.#url)) {
      return randomItemFromArray(this.#url);
    }
    return this.#url;
  }
  
  set url(newUrl) {
    this.#url = newUrl;
  }
  
  async play() {
    VideoPool.videoElmt.pause();
    
    // Gets a random video and sets the specified volume for the respective pool.
    VideoPool.videoElmt.src = this.url;
    VideoPool.videoElmt.volume = this.normalizedVolume;
    
    // 'load() will reset the element and rescan the available sources ...'
    VideoPool.videoElmt.load();
    
    allowed = false;
    
    VideoPool.videoElmt.play();
    
    activateCooldown();
  }
}


function onWidgetLoad(obj) {
  const fieldData = obj.detail.fieldData;
  
  // Case-insensitivity is achieved by converting all strings to lowercase.
  commandStr = fieldData.command.toLowerCase();
  
  // If no trigger phrase was specified, the widget should remain blocked.
  if (commandStr !== "") {
    console.log(`Associated command: ${commandStr}`);
  } else {
    console.log("Deactivate widget: empty command");
    return;
  }
  
  isUsableByEveryone = (fieldData.permissionLvl === "everyone");
  isUsableByMods = (fieldData.permissionLvl === "mods");
  
  otherUsers = fieldData.otherUsers
      .toLowerCase()
      .replace(/\s/g, '')
      .split(",");
  
  cooldownMillis = fieldData.cooldown * 1000;
  
  // Initialize VideoPools.
  for (const prefix of outcomePrefixes) {
    //console.log(`Initialize prefix '${prefix}'`);
    
    let url = fieldData[`${prefix}_url`];
    
    if (!isMediaFieldPopulated(url)) {
      console.log(
          "Deactivate widget: at least one outcome has no associated videos.");
      return;
    }
    
    videoPools.push(
        new VideoPool(url, fieldData[`${prefix}_volume`]));
  }
  
  // Unblock the widget when successfully initialized.
  allowed = true;
}


function onMessage(msg) {
  if (!allowed) {
    //console.log("Widget is currently blocked.");
    return;
  }
  
  if (isOnCooldown()) {
    //console.log("Cooldown is still running.");
    return;
  }
  
  // Check if the user has enough permissions for the selected mode.
  if (isUsableByEveryone || 
      (isUsableByMods && msg.isModerator()) || 
      msg.isBroadcaster() || 
      msg.usernameOnList(otherUsers)) {
    
    if (commandStr !== msg.text.toLowerCase()) {
      return;
    }
    
    //console.log(`'${commandStr}' has been detected.`);
    
    /* Picks a random video pool. The pool object itself plays then a random video. 
     * This should guarantee that the number of videos in each pool doesn't affect 
     * the probability. */
    randomItemFromArray(videoPools).play();
    
  } /*else {
    console.log(`'${msg.username}' has insufficient permissions.`);
  }*/
}
