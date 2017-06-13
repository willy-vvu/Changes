// Source = {}
// Chivo = {}
projectFont = "Chivo, Helvetica, sans-serif"

function setup() {
  // Chivo.Regular = loadFont("Chivo-Regular.ttf", loadRest)

  canvas = createCanvas(window.innerWidth, window.innerHeight);
  window.onresize = ()=>resizeCanvas(window.innerWidth, window.innerHeight);
  //ctx.imageSmoothingEnabled = false;
  marginLeft = 50;
  marginTop = 50;
  marginBottom = 100;
  marginRight = 50;
  newX=newY=0;
  isLoaded = false;
  // loaded();
  loadRest();
}

totalLoadItems = 5;
function loadRest(){
  json = [
    loadJSON("log-4-29.json",loadProgress),
    loadJSON("log-4-30.json",loadProgress),
    loadJSON("log-5-01.json",loadProgress),
    loadJSON("log-5-02.json",loadProgress),
    loadJSON("log-5-02-2.json",loadProgress)
  ];
  totalLoadItems = json.length;
}

loadedItems = 0;
function loadProgress(){
  loadedItems++;
  if(loadedItems >= totalLoadItems){
    loaded();
    // draw();
  }
}

loadComplete = false;

function loaded(){
  log=[].concat.apply([], json.map((j)=>j.log));
  json = undefined;
  snapshots = [];
  segment();
}

segmentProgress = 0;
segmentTotal = 26417;
function segment(){
  var target = Math.min(segmentProgress + 450, log.length);
  for(; segmentProgress < target; segmentProgress++){
    var l = log[segmentProgress];
    if(l.type=="snapshot"){
      snapshots.push(l);
      l.lines = l.value.split("\n").map((value)=>{
        var trimmedValue = value.trimLeft();
        var trimmedLength = trimmedValue.length;
        var indentation = value.length - trimmedLength;
        return {
          indentation,
          trimmedLength,
          value,
          trimmedValue
        }
      });
    }
  }
  if(segmentProgress >= log.length){
    segmentCompleted();
  }
  else{
    setTimeout(segment, 0);
  }
}
function segmentCompleted(){
  // commands=log.filter((l)=>l.type=="command")
  log = undefined;
  //Compute diff
  computeDiff();
}
diffProgress = 0;
diffTotal = 9748;
function computeDiff(){
  var target = Math.min(diffProgress + 80, snapshots.length);
  for(;diffProgress < target; diffProgress++){
    var index = diffProgress, snapshot = snapshots[index];
    var beforeCounter = 0, afterCounter = 0, changeCount = 0;
    var totalDiff = JsDiff.diffLines(index > 0?snapshots[index-1].value:"", snapshot.value);
    totalDiff.forEach((diff)=>{
      // console.log(diff);
      if(diff.added){
        var count = diff.count||(snapshot.lines.length);
        for(var line = afterCounter; line < afterCounter + count; line++){
          snapshot.lines[min(max(line,0),snapshot.lines.length)].added = true;
        }
        afterCounter +=  count;
        changeCount += count;
      }
      else if(diff.removed){
        var snapshotBefore = snapshots[index-1];
        for(var line = beforeCounter; line < beforeCounter + diff.count; line++){
          snapshot.lines[min(max(line+(snapshot.lines.length - snapshotBefore.lines.length),0),snapshot.lines.length-1)].removed = true;
        }
        beforeCounter +=  diff.count;
        changeCount += diff.count;
      }
      else{
        beforeCounter +=  diff.count;
        afterCounter +=  diff.count;
      }
    })
    snapshot.lines.changes = changeCount;
  }
  if(diffProgress >= snapshots.length){
    diffCompleted();
  }
  else{
    setTimeout(computeDiff, 0);
  }

}
function diffCompleted(){
  trimAndClean();
}

trimProgress = 0;
trimTotal = 9748;
function trimAndClean(){
  var target = Math.min(trimProgress + 50, snapshots.length);
  for(; trimProgress < target; trimProgress++){
    var snapshot = snapshots[trimProgress];
    snapshot.lines.forEach((line)=>{
        line.trimmedValue = line.value.trimLeft();
        line.trimmedLength = line.trimmedValue.length;
        line.indentation = line.value.length - line.trimmedLength;
        line.value = "";
    });
    snapshot.value = "";
  }
  if(trimProgress >= snapshots.length){
    trimCompleted();
  }
  else{
    setTimeout(trimAndClean, 0);
  }
}
function trimCompleted(){
  // histogram={};
  // commands.forEach((c)=>histogram[c.value]=(histogram[c.value]||0)+1)
  // usage = Object.entries(histogram).sort((a,b)=>b[1]-a[1])
  // console.log(usage.map((a)=>a.join(": ")).join("\n"))
  referenceTime = +(new Date("2017 4/26 00:00:00"))//snapshots[0].time
  startTime = minTime = +(new Date("2017 4/26 12:00:00"))//snapshots[0].time
  endTime = maxTime = +(new Date("2017 5/3 12:00:00"))//snapshots[snapshots.length-1].time
  startLine = minLine = 0//snapshots[0].lines.length
  endLine = maxLine = snapshots.reduce((p,n)=>max(p,n.lines.length),0)//[snapshots.length-1].lines.length
  // pixelDensity(2);


  // noStroke();
  // fill(255,20);
  // computedSizePixels = (height-marginY*2)/endSize;
  // computedSize = 0.8*computedSizePixels;
  document.body.addEventListener("mousewheel", function(e){
    e.preventDefault();
    if(!showing){return};
    var xzoom = 0, yzoom = 0, xmove = 0, ymove = 0;
    xzoom = -e.deltaX/width;
    yzoom = -e.deltaY/height;
    if(e.shiftKey || e.ctrlKey){
      yzoom = -e.deltaX/width;
      xzoom = -e.deltaY/height;
    }
    // if(e.pageY > height-marginBottom && e.pageX < marginLeft || e.ctrlKey || e.shiftKey){
    // }
    // else if(e.pageX < marginLeft){
    //   yzoom = -e.deltaX/width;
    //   ymove = -e.deltaY;
    // }
    // else if(e.pageY > height-marginBottom){
    //   xzoom = -e.deltaY/height;
    //   xmove = -e.deltaX;
    // }
    // else{
    //   xmove = -e.deltaX;
    //   ymove = -e.deltaY;
    // }
    zoom(xmove, ymove, pow(2,xzoom), pow(2,yzoom), e.pageX, e.pageY);
  });
  document.body.addEventListener("mousedown", function(e){
    e.preventDefault();
    if(!showing){showme = true; return};
    pressedMouseX = e.pageX
    pressedMouseY = e.pageY
    lastMouseX = e.pageX
    lastMouseY = e.pageY
  });
  document.body.addEventListener("mousemove", function(e){
    if(pressedMouseX !== null){
      var xzoom = 0, yzoom = 0, xmove = 0, ymove = 0;
      var deltaX = e.pageX - lastMouseX, deltaY = e.pageY - lastMouseY;
      if(e.ctrlKey || e.shiftKey || e.button == 1 || e.button == 2){
        xzoom = deltaX/100;
        yzoom = -deltaY/100;
      }
      else if(pressedMouseY > height-marginBottom){
        xzoom = deltaX/100
      }
      else if(pressedMouseX < marginLeft){
        yzoom = -deltaY/100
      }
      else{
        xmove = deltaX;
        ymove = deltaY;
      }
      zoom(xmove, ymove, pow(2,xzoom), pow(2,yzoom), pressedMouseX, pressedMouseY);
    }
    lastMouseX = e.pageX;
    lastMouseY = e.pageY;
  });
  window.onmouseup = function(e){
    pressedMouseX = null
    pressedMouseY = null
  }
  document.body.addEventListener("mouseleave", function(e){
    pressedMouseX = null
    pressedMouseY = null
  });
  document.body.addEventListener("mouseenter", function(e){
    pressedMouseX = null
    pressedMouseY = null
  });

  document.body.addEventListener("touchstart", function(e){
    if(!showing){showme = true; return};
    touchCenterX = calcTouchCenterX(e);
    touchCenterY = calcTouchCenterY(e);
    touchDiffX = calcTouchDiffX(e);
    touchDiffY = calcTouchDiffY(e);
  });
  document.body.addEventListener("touchmove", function(e){
    var xzoom = 1, yzoom = 1, xmove = 0, ymove = 0;
    e.preventDefault();
    if(touchCenterX!==null){
      var newTouchCenterX = calcTouchCenterX(e);
      var newTouchCenterY = calcTouchCenterY(e);
      var newTouchDiffX = calcTouchDiffX(e);
      var newTouchDiffY = calcTouchDiffY(e);
      if(touchDiffX!==null){
        if(newTouchDiffX > 40 && touchDiffX > 40){xzoom = newTouchDiffX/touchDiffX};
        if(newTouchDiffY > 40 && touchDiffY > 40){yzoom = newTouchDiffY/touchDiffY};
        // console.log(newTouchDiffX, touchDiffX)
      }
      xmove = newTouchCenterX - touchCenterX;
      ymove = newTouchCenterY - touchCenterY;
      touchCenterX = newTouchCenterX;
      touchCenterY = newTouchCenterY;
      touchDiffX = newTouchDiffX;
      touchDiffY = newTouchDiffY;
      zoom(xmove, ymove, xzoom, yzoom, newTouchCenterX, newTouchCenterY);
    }
  }, {passive:false});
  document.body.addEventListener("touchend", function(e){
    touchCenterX = calcTouchCenterX(e);
    touchCenterY = calcTouchCenterY(e);
    touchDiffX = calcTouchDiffX(e);
    touchDiffY = calcTouchDiffY(e);
  });
  loadComplete = true;
  // noLoop();
}
function calcTouchCenterX(e){
  return e.touches.length>=2?(e.touches[0].pageX+e.touches[1].pageX)/2:
         e.touches.length==1?e.touches[0].pageX:null
}
function calcTouchCenterY(e){
  return e.touches.length>=2?(e.touches[0].pageY+e.touches[1].pageY)/2:
         e.touches.length==1?e.touches[0].pageY:null
}
function calcTouchDiffX(e){
  return e.touches.length>=2?abs(e.touches[0].pageX-e.touches[1].pageX):null
}
function calcTouchDiffY(e){
  return e.touches.length>=2?abs(e.touches[0].pageY-e.touches[1].pageY):null
}

touchCenterX = null;
touchCenterY = null;
touchDiffX = null;
touchDiffY = null;

pressedMouseX = null;
pressedMouseY = null;
lastMouseX = null;
lastMouseY = null;

zooming = false;
function zoom(xmove=0, ymove=0, xzoom=1, yzoom=1, xzoomcenter = width/2, yzoomcenter = height/2){
  var newStartTime = (startTime-Pixels.x(xzoomcenter)) / xzoom + Pixels.x(xzoomcenter - xmove)
  var newEndTime = (endTime-Pixels.x(xzoomcenter)) / xzoom + Pixels.x(xzoomcenter - xmove)
  startTime = newStartTime;
  endTime = newEndTime;
  var newStartLine = (startLine-Pixels.y(yzoomcenter)) / yzoom + Pixels.y(yzoomcenter - ymove)
  var newEndLine = (endLine-Pixels.y(yzoomcenter)) / yzoom + Pixels.y(yzoomcenter - ymove)
  startLine = newStartLine;
  endLine = newEndLine;
  if(!zooming){
    zoomResolution();
  }
}
function zoomResolution(){
  var xcorrectionDelta = max(minTime - startTime, 0) + min(maxTime - endTime, 0);
  var xzoomCorrectionDelta = max((minTime - maxTime) - (startTime - endTime), 0)
  startTime = max(startTime + (xcorrectionDelta + xzoomCorrectionDelta)*0.2, minTime - (maxTime - minTime));
  endTime = min(endTime + (xcorrectionDelta - xzoomCorrectionDelta)*0.2, maxTime + (maxTime-minTime));
  if(endTime < startTime + SECOND/50){
    startTime = (startTime + endTime)/2 - SECOND/50/2
    endTime = startTime+SECOND/50
  }

  var ycorrectionDelta = max(minLine - startLine, 0) + min(maxLine - endLine, 0);
  var yzoomCorrectionDelta = max((minLine - maxLine) - (startLine - endLine), 0)
  startLine = max(startLine + (ycorrectionDelta + yzoomCorrectionDelta)*0.2, minLine - (maxLine - minLine));
  endLine = min(endLine + (ycorrectionDelta - yzoomCorrectionDelta)*0.2, maxLine + (maxLine-minLine));
  if(endLine < startLine + 10){
    startLine = (startLine + endLine)/2 - 5
    endLine = startLine + 10
  }

  if(
    abs(xcorrectionDelta) < 0.01 &&
    abs(xzoomCorrectionDelta) < 0.01 &&
    abs(ycorrectionDelta) < 0.01 &&
    abs(yzoomCorrectionDelta) < 0.01
  ){
    zooming = false;
  }
  else{
    zooming = true;
    requestAnimationFrame(zoomResolution);
  }
  draw();
}

Pixels = {
  time(time){
    return map(time, startTime, endTime, marginLeft, width - marginRight)
  },
  timeRelative(time){
    return map(time, 0, endTime-startTime, 0, width - marginRight - marginLeft)
  },
  x(x){
    return map(x, marginLeft, width - marginRight, startTime, endTime)
  },
  xRelative(x){
    return map(x, 0, width - marginRight - marginLeft, 0, endTime - startTime)
  },
  line(line){
    return map(line, startLine, endLine, height - marginBottom, marginTop)
  },
  lineRelative(line){
    return map(line, 0, endLine-startLine, 0, height - marginBottom - marginTop)
  },
  y(y){
    return map(y, height - marginBottom, marginTop, startLine, endLine)
  },
  yRelative(y){
    return map(y, 0, marginTop - (height - marginBottom), 0, endLine - startLine)
  }
}

MILLISECOND = MILLISECONDS = 1
SECOND = SECONDS = 1000 * MILLISECONDS
MINUTE = MINUTES = 60 * SECONDS
HOUR = HOURS = 60 * MINUTES
DAY = DAYS = 24 * HOURS
WEEK = WEEKS = 7 * DAYS

Weekdays = ["Wednesday", "Thursday", "Friday", "Saturday", "Sunday", "Monday", "Tuesday", "Wednesday"]
MMDD =     ["4/26",      "4/27",     "4/28",   "4/29",     "4/30",   "5/1",    "5/2",     "5/3"]
Time = {
  nday(time){
    var index = (floor((time-referenceTime)/DAY))
    return (Weekdays[index]||"").slice(0,3).toUpperCase() + " " + (MMDD[index]||"")
  },
  hms(time, granularity){
    time -= referenceTime;
    return granularity >= HOURS*12 ? (floor(time/HOURS)%24 == 0 ? "🌙" : "☀️")
         //: granularity >= HOURS ? ((floor(time/HOURS)%12||12)+((floor(time/HOURS)%24>=12)?"p":"a"))
         : granularity >= HOURS ? ((floor(time/HOURS)%24))
         : granularity >= MINUTES ? ((floor(time/HOURS)%24) + ":" + nf(floor(time/MINUTES)%60, 2, 0))
         : granularity >= SECONDS ? ((floor(time/HOURS)%24) + ":" + nf(floor(time/MINUTES)%60, 2, 0) + ":" + nf(floor(time/SECONDS)%60, 2, 0))
         : ((floor(time/HOURS)%24) + ":" + nf(floor(time/MINUTES)%60, 2, 0) + ":" + nf(floor(time/SECONDS)%60, 2, 0) + "." + nf(floor(time/10)%100, 2, 0))

  }
}

textlight = 150;
textdim = 100;
bglight = 50;
bg = 30;


Zoom = {
  getHighestZoomMultiple(zoomLevels, value){
    for(var i = 0; i < zoomLevels.length; i++){
      if(value%zoomLevels[i] == 0){
        return zoomLevels[i];
      }
    }
    return zoomLevels[zoomLevels.length-1];
  },
  getHighestZoomLevel(zoomLevels, increment){
    for(var i = 0; i < zoomLevels.length; i++){
      if(zoomLevels[i] < increment){
        return zoomLevels[i];
      }
    }
    return zoomLevels[zoomLevels.length-1];
  },
}


AssignedText = "Project Assigned".toUpperCase();
DueText = "Project Due".toUpperCase();

adj = 0//-3

Color = {
  Changed:"cyan",
  Added:"yellow",
  Removed:"magenta",
  Same:bglight
}

zoomableRanges = [
  { // Code
    render(){
      push();
      var lastCacheRange = this.lastCacheEnd - this.lastCacheStart;
      if(abs(startTime - this.lastCacheStart) > lastCacheRange/4 || abs(endTime - this.lastCacheEnd) > lastCacheRange/4){
        this.lastCacheStart = startTime;
        this.lastCacheEnd = endTime;
        this.recomputeCache();
        // console.log("cache recompute")
      }
      this.renderRows();
      pop();
    },
    renderCache: [],
    lastCacheStart: 0,
    lastCacheEnd: 0,
    recomputeCache(){
      this.renderCache = [];
      var startIndex = max(0, binarySearch(snapshots, Pixels.x(-width/4)) - 1),
          endIndex = min(snapshots.length - 1, binarySearch(snapshots, Pixels.x(5*width/4)) + 1);
      var nextPerceptibleTime = Infinity, imperceptibleTime = Pixels.xRelative(1.5);
      for(var i = endIndex; i >= startIndex; i--){
        var snapshot = snapshots[i];
        if(nextPerceptibleTime > snapshot.time || snapshot.lines.changes > 8){
          this.renderCache.push(snapshot);
          nextPerceptibleTime = snapshot.time - imperceptibleTime;
        }
      }
    },
    renderRows(){
      // console.log(this.renderCache.length);
      noStroke();
      textAlign(LEFT, CENTER);
      var lastX = width;
      var increment = max(1, round(Pixels.yRelative(-2)));
      var textIncrement = max(1, round(Pixels.yRelative(-4)));
      var indicatorWidth = max(2, map(Math.log(endTime - startTime), 20, 4, 1, 4));
      var lastFill = null;
      var blockBottom = min(height, Pixels.line(0));
      var indicatorHeight = Pixels.lineRelative(1);
      var letterHeight = indicatorHeight/2;
      textFont(projectFont,letterHeight);
      for(var i = 0; i < this.renderCache.length; i++){
        var blockLeft = max(-indicatorWidth, Pixels.time(this.renderCache[i].time));

        var snapshot = this.renderCache[i];

        var blockTop = max(0, Pixels.line(snapshot.lines.length));

        fill(bglight);
        rect(blockLeft, blockTop, lastX - blockLeft+0.5, blockBottom-blockTop+0.5);

        fill(lastFill = textdim);
        rect(blockLeft, blockTop, indicatorWidth/2, blockBottom-blockTop+0.5);

        var lastY = Pixels.y(0)
        for(var line = floor(max(Pixels.y(height),0)/increment)*increment; line < min(snapshot.lines.length, Pixels.y(0)); line += increment){
          var lineobject = snapshot.lines[snapshot.lines.length-1-line];
          var indicatorBottom = Pixels.line(line);
          var indicatorColor = lineobject.added&&lineobject.removed?Color.Changed:
                               lineobject.added?Color.Added:
                               lineobject.removed?Color.Removed:textlight;
          if(indicatorColor != textlight){
            if(lastFill != indicatorColor) {
              fill(lastFill = indicatorColor);
            }
            rect(blockLeft, indicatorBottom - indicatorHeight, indicatorWidth, indicatorHeight*increment);
          }
          if(line % textIncrement == 0){
            var approximateIndent = letterHeight*lineobject.indentation*0.55;
            var approximateWidth = letterHeight*lineobject.trimmedLength*0.55;
            var proxyWidth = min(approximateIndent + approximateWidth, lastX - blockLeft - letterHeight) - approximateIndent;
            if(proxyWidth > 3){
              if(letterHeight > 7){
                if(lastFill != indicatorColor) {
                  fill(lastFill = indicatorColor);
                }
                var sliceTo = round(lineobject.trimmedLength * proxyWidth / approximateWidth);
                text(sliceTo>=lineobject.trimmedLength?lineobject.trimmedValue:lineobject.trimmedValue.slice(0, sliceTo), blockLeft+letterHeight+approximateIndent, indicatorBottom - indicatorHeight/2);
              }
              else{
                var proxyColor = indicatorColor == textlight? textdim: indicatorColor;
                if(lastFill != proxyColor){
                  fill(lastFill = proxyColor);
                }
                rect(blockLeft+letterHeight+approximateIndent, indicatorBottom - indicatorHeight/2 - letterHeight/2, proxyWidth, letterHeight + indicatorHeight* (textIncrement-1));
              }
            }
          }
        }

        lastX = blockLeft;
      }
    }
  },
  { // Codeline
    render(){
      push();
      this.renderLines();

      translate(10, height/2);
      rotate(-Math.PI/2);

      noStroke();
      fill(255, textlight);
      textFont(projectFont);
      textSize(12);
      textAlign(CENTER, CENTER);
      text("Lines of Code".toUpperCase(), 0, 0);
      pop();
    },
    zoomLevels:[100, 10, 1],
    renderLines(){
      var zoomLevel = endLine - startLine;
      var increment = Zoom.getHighestZoomLevel(this.zoomLevels, zoomLevel / lodMultiplierY);
      var textIncrement = Zoom.getHighestZoomLevel(this.zoomLevels, 3 * zoomLevel / lodMultiplierY);
      for(var line = floor(max(Pixels.y(height),0)/increment)*increment; line < Pixels.y(0); line += increment){
        var multiple = Zoom.getHighestZoomMultiple(this.zoomLevels, line);
        var tickThickness = min(max(5*(multiple/zoomLevel), 0.2), 2.5);
        noStroke();
        fill(255, textdim);
        rect(0, Pixels.line(line)-tickThickness/2, width, tickThickness);
        if(line%textIncrement == 0){
          fill(255, textlight);
          textFont(projectFont, 18);
          textAlign(LEFT, BOTTOM);
          text(line, 20, Pixels.line(line));
        }
      }
    }
  },
  { // Timeline
    render(){
      push();
      translate(0, height - marginTop);

      this.renderDays();
      this.renderHours();

      translate(0, -40);

      fill(textlight);
      noStroke();
      textFont(projectFont, 20);
      rect(Pixels.time(minTime)-1, 0, 2, 53);
      rect(Pixels.time(minTime), 0, textWidth(AssignedText)+20, 30);
      rect(Pixels.time(maxTime)+1, 0, -2, 53);
      rect(Pixels.time(maxTime), 0, -textWidth(DueText)-20, 30);

      fill(bg)
      textAlign(LEFT, CENTER);
      text(AssignedText, Pixels.time(minTime)+10, 15+adj)
      textAlign(RIGHT, CENTER);
      text(DueText, Pixels.time(maxTime)-10, 15+adj)

      pop();
      // noFill();
      // stroke(bglite);
    },
    renderDays(){
      for(var time = floor((Pixels.x(0)-referenceTime)/DAY)*DAY+referenceTime; time < Pixels.x(width); time += DAY){
        var day = floor(time/DAY);

        noStroke();
        var visualX1=min(max(Pixels.time(time),0),width),
            visualX2=min(max(Pixels.time(time+HOURS*6),0),width),
            visualX3=min(max(Pixels.time(time+DAY-HOURS*6),0),width),
            visualX4=min(max(Pixels.time(time+DAY),0),width);
        fill(1.2*bglight, 200)
        rect(visualX1, 0, visualX2 - visualX1, 50);
        fill(1.2*bglight+10, 200)
        rect(visualX2, 0, visualX3 - visualX2, 50);
        fill(1.2*bglight, 200)
        rect(visualX3, 0, visualX4 - visualX3, 50);

        fill(textlight);
        textFont(projectFont, 12);
        textAlign(CENTER, CENTER);
        text(Time.nday(time), (visualX4+visualX1)/2, 40+adj);
      }
    },
    zoomLevels:[HOUR*12, HOUR*3, HOUR, MINUTE*15, MINUTE*5, MINUTE, SECOND*15, SECOND*5, SECOND, SECOND/5, SECOND/25, SECOND/100, SECOND/1000],
    renderHours(){
      var zoomLevel = endTime - startTime;
      var increment = Zoom.getHighestZoomLevel(this.zoomLevels, zoomLevel / lodMultiplierX);
      var textIncrement = max(SECOND/100,Zoom.getHighestZoomLevel(this.zoomLevels, 3*zoomLevel / lodMultiplierX));
      fill(textlight);
      for(var time = floor((Pixels.x(0)-referenceTime)/increment)*increment+referenceTime; time < Pixels.x(width); time += increment){
        var multiple = Zoom.getHighestZoomMultiple(this.zoomLevels, time-referenceTime);
        var tickWidth = min(max(15*(multiple/zoomLevel), 0.2), 2.5);
        var tickHeight = map(Math.log(multiple), -2, 18, 3, 13);
        noStroke();
        rect(Pixels.time(time)-tickWidth/2, 0, tickWidth, tickHeight);
        if((time-referenceTime)%textIncrement == 0){
          // fill(textlight);
          textFont(textIncrement==12*HOURS?"initial":projectFont, 18);
          textAlign(CENTER, CENTER);
          text(Time.hms(time,textIncrement), Pixels.time(time), 20+(textIncrement==12*HOURS?2:adj));
        }
      }
    }
  }
]

var totalprogresssmooth = 0;
var loadtransition = 0;
var buttonlike = 0;
var lastRender = Date.now();
var beginningFadeIn = -2;
var showme = false;
var showing = false;
var initialrender = false;

function introFigure(x, y, type, anim){
  var localanim = 1-pow(0.5, max(0, 8*min((max(anim, 0) % 5), 1)-1));
  push();
  translate(x-65/2,y);
  noStroke();
  fill(bglight);
  rect(0, 15, 65, -65 + (type=="before"?0:type=="added"?localanim:type=="deleted"?1-localanim:1)*-10)
  fill(textdim);
  rect(10, 0, 30, 5);
  translate(0, -10);
  rect(15, 0, 35, 5);
  if(type=="deleted"){fill(Color.Removed);}
  rect(0, -10, 2, (type=="deleted"?localanim:0)*5);
  translate(0, (type=="deleted"?1-localanim:1)*-10);
  rect(15, 0, (type=="deleted"?1-localanim:1)*40, (type=="deleted"?1-localanim:1)*5);
  if(type=="deleted"){fill(textdim);}
  translate(0, -10);
  if(type=="changed"){fill(Color.Changed);}
  rect(15, 0, (type=="deleted"?20:type=="changed"?40-20*localanim:40), 5);
  rect(0, 0, 2, (type=="changed"?localanim:0)*5);
  if(type=="changed"){fill(textdim);}
  if(type!="before"){
    if(type=="added"){fill(Color.Added);}
    translate(0, (type=="added"?localanim:1)*-10);
    rect(15, 0, (type=="added"?localanim:1)*40, (type=="added"?localanim:1)*5);
    rect(0, 0, 2, (type=="added"?localanim:0)*5);
    if(type=="added"){fill(textdim);}
  }
  translate(0, -10);
  rect(10, 0, 30, 5);
  pop();
}
function draw(){

  var timeElasped, now;
  if(loadtransition < 2.5){
    now = Date.now();
    timeElasped = now - lastRender;
    lastRender += timeElasped;
    if(loadComplete && showme){
      loadtransition=min(2.5,loadtransition+timeElasped/1000);
    }
  };
  if(loadtransition < 1.5){
    background(bg);
    // if(!Chivo.Regular.font)return;
    beginningFadeIn = beginningFadeIn + timeElasped/1000
    push();
    textFont(projectFont, 20);
    textAlign(CENTER, CENTER);

    push();
      translate(width/2, height/2);

      fill(Color.Removed)
      text("deleted.", 100, 10);
      fill(textlight)
      text("and", 40, 10);
      introFigure(105, 100, "deleted", beginningFadeIn-6.5);
      background(bg, 255-255*min(max(2*(beginningFadeIn-6),0),1))


      fill(Color.Changed)
      text("changed,", -30, 10);
      introFigure(35, 100, "changed", beginningFadeIn-5.25);
      background(bg, 255-255*min(max(2*(beginningFadeIn-4.75),0),1))

      fill(Color.Added)
      text("added,", -115, 10);
      introFigure(-35, 100, "added", beginningFadeIn-4);
      background(bg, 255-255*min(max(2*(beginningFadeIn-3.5),0),1))

      fill(textlight)
      text("I tracked every line of code that was", 0, -20);
      introFigure(-105, 100, "before", beginningFadeIn-2.5);
      background(bg, 255-255*min(max(beginningFadeIn-2.0,0),1))

      text("As I worked on a programming project,", 0, -50);
      background(bg, 255-255*min(max(beginningFadeIn-0.7,0),1))

    pop();

    fill(bglight)
    textSize(60);
    textAlign(CENTER,CENTER);
    text("CHANGES", width/2, 2*marginTop);


    var totalprogress = 0.3*(loadedItems/totalLoadItems)
                      + 0.2*(segmentProgress/segmentTotal)
                      + 0.3*(diffProgress/diffTotal)
                      + 0.2*(trimProgress/trimTotal)
                      // + 0.1*(segmentProgress/segmentTotal)
    if(loadComplete && beginningFadeIn > 7.5){
      totalprogress = 1;
      buttonlike = lerp(buttonlike, 1, 0.2);
    }
    totalprogresssmooth = lerp(totalprogresssmooth, totalprogress, 0.2);
    noStroke();
    fill(bglight);
    var barWidth = map(buttonlike,0,1,200,140);
    var barHeight = map(buttonlike,0,1,5,20);
    rect(width/2-barWidth, (height-marginBottom)-barHeight, 2*barWidth, barHeight*2);
    fill(showme?bglight:lerp(textdim,textlight,buttonlike));
    rect(width/2-barWidth, (height-marginBottom)-barHeight, 2*barWidth*totalprogresssmooth, barHeight*2);
    if(buttonlike > 0.9){
      var animfactor = Math.pow(beginningFadeIn / 2 % 1,0.5);
      fill(lerp(textdim,textlight,buttonlike), round(255*max(0, 1-2*animfactor)*max(0, 1-2*loadtransition)));
      rect(width/2-barWidth - animfactor*20, (height-marginBottom)-barHeight - animfactor*20, 2*barWidth*totalprogresssmooth + animfactor*40, barHeight*2 + animfactor*40);
    }
    fill(bg, 255*buttonlike);
    textFont(projectFont);
    textAlign(CENTER, CENTER);
    textSize(20);
    text("Show me the changes".toUpperCase(),width/2, (height-marginBottom)+adj);
    background(bg, 255*min(max(0, loadtransition-0.5)+min(max(0, -1-beginningFadeIn),1),1))
    pop();
    return;
  }
  lodMultiplierX = max(1,round(width/120));
  lodMultiplierY = max(1,round(height/120));
  if(loadtransition<2.5){
    if(loadtransition>=1.5){
      canvas.elt.style.opacity=loadtransition-1.5;
      if(initialrender){
        return;
      }
      else{
        initialrender = true;
      }
    }
  }
  else if(!showing){
    canvas.elt.style.opacity=1
    noLoop();
    showing = true;
    return;
  }
  background(bg);
  zoomableRanges.forEach((range)=>range.render.call(range))
}

function binarySearch(array, time, start=0, end=array.length-1){
  if(start >= end){
    return start;
  }
  else{
    var index = round((start + end)/2), value = array[index];
    if(time < value.time){
      return binarySearch(array, time, start, index-1);
    }
    else if(time > value.time){
      return binarySearch(array, time, index+1, end);
    }
    else {
      return index;
    }
  }
}
