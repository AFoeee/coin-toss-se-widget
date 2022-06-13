# Coin Toss
This StreamElements custom widget visualizes the outcome of a random distribution (e.g. a coin toss).

Special thanks to Benno and Reboot0.

## Description of operation:
The widget comes with multiple video pools (one per possible outcome).  
When the associated command has been detected in chat, a random pool is picked and from that a random video is played.

The number of videos in a pool do not affect the probability.

See also this [demonstration video](https://streamable.com/cqz1h0).

## Adding additional outcomes:
Let's say we need 6 outcomes for the visualization of a dice.

Here are the steps needed:
 - Enter the *Overlay Editor* on the StreamElements website
 - Select the widget
 - Open the *"Settings"* segment in the navigation (on the left)
 - Click on *"Open Editor"*
 - Add UI segments to the structure in the *"Fields"* tab / JSON file (see below)
 - Add the new prefixes to the list in the *"JS"* tab / JavaScript file (see below)
 - Populate the new video pools via the UI

#### JSON
By default, there are two outcome segments, which you can use as a template.

An outcome segment consists of
- a *video-input field* ending with the suffix `_url`.
- a *number selection field* ending with the suffix `_volume`.

```
  ...
  
  "outcome2_url": {
    "type": "video-input", 
    "label": "Videos:", 
    "multiple": true, 
    "group": "Outcome #2"
  }, 
  "outcome2_volume": {
    "type": "slider", 
    "label": "Volume:", 
    "min": 0, 
    "max": 100, 
    "value": 55, 
    "group": "Outcome #2"
  }, 
  
  "outcome3_url": {
    "type": "video-input", 
    "label": "Videos:", 
    "multiple": true, 
    "group": "Outcome #3"
  }, 
  "outcome3_volume": {
    "type": "slider", 
    "label": "Volume:", 
    "min": 0, 
    "max": 100, 
    "value": 55, 
    "group": "Outcome #3"
  }, 
  
  ...
  
  "outcome6_url": {
    "type": "video-input", 
    "label": "Videos:", 
    "multiple": true, 
    "group": "Outcome #6"
  }, 
  "outcome6_volume": {
    "type": "slider", 
    "label": "Volume:", 
    "min": 0, 
    "max": 100, 
    "value": 55, 
    "group": "Outcome #6"
  }, 
  
  ...
```

#### JavaScript (JS)
```
...

const outcomePrefixes = [
  "outcome1", 
  "outcome2",
  "outcome3",
  "outcome4",
  "outcome5",
  "outcome6"
];

...
```
