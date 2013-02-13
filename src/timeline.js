function _t(timecode) {
    if (typeof timecode === "string") {
        var m = timecode.match(/^(\d+):(\d+(?:\.\d+)?)$/);
        if (m) {
            return parseInt(m[1]) * 60 + parseFloat(m[2]);
        }
    }
    return parseFloat(timecode);
}

function run(animation) {
    if (typeof animation === "function") {
        animation(Talkie.fast_forward);
    }
    else {
        animation.run();
    }
}

function order_timeline(timeline_object) {
    var timecode_strings = Object.keys(timeline_object);
    var timecodes = timecode_strings.map(_t);
    var a = {};
    for (var i=0; i<timecodes.length; i++) {
        a[timecodes[i]] = timeline_object[timecode_strings[i]];
    }
    timecodes.sort(function(a,b) { return a-b; });
    
    var track_animations = [];
    for (var i=0; i<timecodes.length; i++) {
        var t = timecodes[i];
        track_animations.push([ t, a[t] ]);
    }
    return track_animations;
}

var animation_undo_stack = [],
    animation_current_index = -1; // index of last animation performed
var timecode;
Talkie.timeline = function(soundtrack_element, timeline_object, options) {
    var track_animations = order_timeline(timeline_object);
    if (typeof soundtrack_element === "string") {
        soundtrack_element = document.querySelector(soundtrack_element);
    }
    soundtrack_element.addEventListener("timeupdate", function() {
        while (animation_undo_stack.length > 0
            && animation_undo_stack[animation_undo_stack.length-1][0] > this.currentTime)
        {
            var stack_top = animation_undo_stack.pop();
            stack_top[1]();
            animation_current_index = stack_top[2];
        }
        
        for (var i = animation_current_index + 1;
             i < track_animations.length && track_animations[i][0] <= this.currentTime;
             i++
        ) {
            Talkie.fast_forward = (i+1 < track_animations.length && track_animations[i+1][0] <= this.currentTime);
            timecode = track_animations[i][0];
            run(track_animations[i][1]);
            animation_current_index = i;
        }
    }, false);
    if (options && options.onplay) {
        soundtrack_element.addEventListener("play", options.onplay, false);
    }
    
    return {
        rewind: function() {
            if (soundtrack_element.readyState >= 1) {
                animation_undo_stack = [];
                animation_current_index = -1;
                soundtrack_element.pause();
                soundtrack_element.currentTime = 0;
            }
        }
    };
}
Talkie.setAnimationUndo = function(undo_function) {
    animation_undo_stack.push([timecode, undo_function, animation_current_index]);
}
