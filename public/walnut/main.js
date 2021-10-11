const WIDTH = 1024*2;
const HEIGHT = 1024*2;

const TEX_WIDTH = 4096;
const TEX_HEIGHT = 4096;

//const STEPLENGTH = 30;
const FPS = 1000;
const LOWER_FPS_LIMIT = 24;
const UPPER_FPS_LIMIT = 40;
const ADAPT_RESOLUTION = true;

const PACKED = true;

const ROTATION_TIME = 10000;

var mouseInfo = {
    x: 0,
    y: 0,
    lastFrameX: 0,
    lastFramY: 0,
    down: false,
    rightDown: false,
    mouseUpTime: 0,
    mouseDownTime: 0,
    shift: false
};

var appState = {

    width: 512,
    height: 512,

    currentRotation: rotationMatrix([0,0,0]),

    settings: {
        sliceWidth: 1.0,
        slicePosition: 0.5,
        opacity: 0.4,
        hideShell: false,
        hideNut: false,
        rotate: true,
        color: true,
        //angle: [0.0, 0.0, 0.0] // x y z
    }
};

function createShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
        return shader;
    }
    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}

function createProgram(gl, vertexShader, fragmentShader) {
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    var success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
        return program;
    }
    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
}

function initPositionBuffer(gl) {
    const positionBuffer = gl.createBuffer();
  
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  
    const positions = [
        -1, -1,
         1, -1,
        -1,  1,
        -1,  1,
         1, -1,
         1,  1,
    ];
  
    gl.bufferData(gl.ARRAY_BUFFER,
                  new Float32Array(positions),
                  gl.STATIC_DRAW);
  
    return positionBuffer;
}

function setPositionAttribute(gl, program) {
    gl.useProgram(program);
    var positionAttributeLocation = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(positionAttributeLocation);
    // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    var size = 2;          // 2 components per iteration
    var type = gl.FLOAT;   // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(
        positionAttributeLocation, size, type, normalize, stride, offset)
}

function setTexAttribute(gl, program) {
    gl.useProgram(program);
    var textureLocation = gl.getUniformLocation(program, "tex");
    gl.uniform1i(textureLocation, 0);
}

function setScreenSizeAttribute(gl, program) {
    gl.useProgram(program);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    var screenSizeLocation = gl.getUniformLocation(program, "screenSize");
    gl.uniform2fv(screenSizeLocation, [gl.canvas.width, gl.canvas.height]);
}

function setGuiAttributes(gl, program) {
    gl.useProgram(program);
    var location = gl.getUniformLocation(program, "sliceWidth");
    gl.uniform1f(location, appState.settings.sliceWidth);
    var location = gl.getUniformLocation(program, "slicePosition");
    gl.uniform1f(location, appState.settings.slicePosition);
    var location = gl.getUniformLocation(program, "isolateShell");
    gl.uniform1i(location, Number(!appState.settings.hideShell && appState.settings.hideNut));
    var location = gl.getUniformLocation(program, "isolateNut");
    gl.uniform1i(location, Number(appState.settings.hideShell && !appState.settings.hideNut));
    var location = gl.getUniformLocation(program, "opacity");
    gl.uniform1f(location, Number(appState.settings.opacity));
    var location = gl.getUniformLocation(program, "useColor");
    gl.uniform1i(location, Number(appState.settings.color));
}


// X, Y, Z
function setRotationAttribute(gl, program, angle) {
    gl.useProgram(program);

    /*[alpha, beta, gamma] = angle;

    var cos = Math.cos; var sin = Math.sin;
    console.log(angle);
    angle[1] = Math.PI/2.00001;
    angle[2] = Math.PI/2.00001;*/
    var boxRotation = appState.currentRotation;
    //matrixMultiply(rotationMatrix([Math.PI/1000.00001,0,0]), rotationMatrix([0,Math.PI/2.00001,0]));
    /*[
        // column 1
        [cos(alpha)*cos(beta), sin(alpha)*cos(beta), -sin(beta)],
        // column 2
        [cos(alpha)*sin(beta)*sin(gamma) - sin(alpha)*cos(gamma),
        sin(alpha)*sin(beta)*sin(gamma) + cos(alpha)*cos(gamma), cos(beta)*sin(gamma)],
        // column 3
        [cos(alpha)*sin(beta)*cos(gamma) + sin(alpha)*sin(gamma),
        sin(alpha)*sin(beta)*cos(gamma) - cos(alpha)*sin(gamma), cos(beta)*cos(gamma)]
    ];*/

    var rotationLocation = gl.getUniformLocation(program, "boxRotation");
    var projectionLocation = gl.getUniformLocation(program, "boxProjection");
    var boxProjection = inverse(boxRotation);

    boxRotation = transpose(boxRotation);
    boxProjection = transpose(boxProjection);

    gl.uniformMatrix3fv(rotationLocation, false, new Float32Array(boxRotation.flat()));
    gl.uniformMatrix3fv(projectionLocation, false, new Float32Array(boxProjection.flat()));
}

function drawBox(gl, program) {
    gl.useProgram(program);
    var primitiveType = gl.TRIANGLES;
    var count = 6;
    gl.drawArrays(primitiveType, 0, count);
}

function initImageTexture(gl, image) {
    const targetTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, targetTexture);

    const mipLevel = 0;
    const internalFormat = gl.RGBA;
    const width = TEX_WIDTH;
    const height = TEX_HEIGHT;
    const border = 0;
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;
    
    gl.texImage2D(gl.TEXTURE_2D, mipLevel, internalFormat, /* width, height, border, */
                  format, type, image);
    // set the filtering so we don't need mips and it's not filtered
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    return targetTexture;
}


function initGui() {
    var gui = new dat.GUI({
        name: "Walnut CT scan",
        closeOnTop: true,
        width: 400
    });
    //gui.name = "Walnut CT scan";
    //gui.closeOnTop = true;
    gui.add(appState.settings, 'sliceWidth', 0.0, 1.0, 0.01).name("Slice width");
    gui.add(appState.settings, 'slicePosition', 0.0, 1.0, 0.01).name("Slice position");
    gui.add(appState.settings, 'opacity', 0.0, 1.0, 0.01).name("Opacity");
    gui.add(appState.settings, 'rotate').name("Rotate");
    gui.add(appState.settings, 'color').name("Add color");
    gui.add(appState.settings, 'hideShell').name("Hide shell");
    gui.add(appState.settings, 'hideNut').name("Hide nut");
    gui.open();
}

function updateCanvasSize(gl) {
    gl.canvas.setAttribute('width', appState.width);
    gl.canvas.setAttribute('height', appState.height);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}

function initCanvas(vertexShaderSource, fragmentShaderSource, dataImage) {

    document.querySelector("#loading-message").remove();

    var canvas = document.querySelector("#main-canvas");
    var gl = canvas.getContext("webgl");

    updateCanvasSize(gl);

    canvas.addEventListener('mousedown', function(e) {
        e.preventDefault();
        mouseInfo.down = e.button == 0;
        mouseInfo.lastFrameX = mouseInfo.x;
        mouseInfo.lastFrameY = mouseInfo.y;
    })

    document.querySelector('body').addEventListener('mouseup', function(e) {
        mouseInfo.down = false;
    })

    canvas.addEventListener('mousemove', function(evt) {
        var rect = canvas.getBoundingClientRect();
        mouseInfo.x = (evt.clientX - rect.left);
        mouseInfo.y = (evt.clientY - rect.top);
    });


    //var extFloat = gl.getExtension("OES_texture_float");
    //var extFloatLinear = gl.getExtension("OES_texture_float_linear ");
    //var extFloatRender = gl.getExtension("WEBGL_color_buffer_float");
    //gl.getExtension("EXT_color_buffer_float");

    var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    var renderProgram = createProgram(gl, vertexShader, fragmentShader);
    
    /*if ( window.innerWidth >  window.innerHeight) 
        canvas.style.height = '100%';
    else canvas.style.width = '100%';*/

    var positionBuffer = initPositionBuffer(gl);
    
    var dataTexture = initImageTexture(gl, dataImage);

    appState.renderProgram = renderProgram;
    appState.dataTexture = dataTexture;
    appState.positionBuffer = positionBuffer;

    console.log("TICK");

    initGui();

    tick(gl);
}

function render(gl, elapsed) {

    const app = appState;

    if (app.settings.hideNut && app.settings.hideShell) {
        gl.clear(gl.COLOR_BUFFER_BIT);
        return;
    }

    var angle = [0,0,0];

    if (app.settings.rotate && !mouseInfo.down)
        angle[1] += (elapsed % ROTATION_TIME)/ROTATION_TIME * 2 * Math.PI;

        
    /*console.log(appState.currentRotation);
    console.log(rotationMatrix([0,2*Math.PI/60,0]));
    console.log(matrixMultiply(rotationMatrix([0,2*Math.PI/4,0]), appState.currentRotation))
    console.log("============");
    appState.currentRotation = matrixMultiply(rotationMatrix([0,2*Math.PI/60,0]), appState.currentRotation);*/

        
    if (mouseInfo.down) {
        var distX = (mouseInfo.x - mouseInfo.lastFrameX) / window.innerHeight;
        var distY = (mouseInfo.y - mouseInfo.lastFrameY) / window.innerHeight;
        
        angle[2] -= 1.25 * distY * 2 * Math.PI;
        angle[1] -= 1.25 * distX * 2 * Math.PI;


        mouseInfo.lastFrameX = mouseInfo.x;
        mouseInfo.lastFrameY = mouseInfo.y;
    }

    app.currentRotation = matrixMultiply(rotationMatrix(angle), app.currentRotation);
        
    
    setPositionAttribute(gl, app.renderProgram);
    setTexAttribute(gl, app.renderProgram);
    setScreenSizeAttribute(gl, app.renderProgram);
    setRotationAttribute(gl, app.renderProgram, null/*app.settings.angle*/);
    setGuiAttributes(gl, app.renderProgram)
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, app.dataTexture);
    gl.bindBuffer(gl.ARRAY_BUFFER, app.positionBuffer);
    drawBox(gl, app.renderProgram);

}

function tick(gl) {
    var prevTime = Date.now();

    var i = 0;

    var frameDurations = [];
    var frameWindowSize = 30;

    var downSizedToCount = {};

    var adaptToFramerate = (elapsed) => {
        if (frameDurations.length < 5) return;
        var sum = frameDurations.reduce((a, b) => a + b, 0);
        var avg = (sum / frameDurations.length) || 0;
        var lowestLast5 = Math.min.apply(null, frameDurations.slice(-5));
        var totalLowest = Math.min.apply(null, frameDurations);
        var last = frameDurations[frameDurations.length - 1];
        if ((frameDurations.length == frameWindowSize && avg > 1000/LOWER_FPS_LIMIT) || lowestLast5 > 1000/10 || last > 1000/1) {
            if (appState.width > 256) {
                appState.width /= 2.0;
                appState.height /= 2.0;
                console.log("DECREASING TO " + appState.width);
                frameDurations = [];
                downSizedToCount[appState.width] = downSizedToCount[appState.width] + 1 || 1.0;
                updateCanvasSize(gl);
            }
        } else if (avg < 1000/UPPER_FPS_LIMIT && totalLowest < 1000/20) {
            if (appState.width < 2048 && (!downSizedToCount[appState.width] || downSizedToCount[appState.width] < 2)) {
                console.log("INCREASING");
                appState.width *= 2.0;
                appState.height *= 2.0;
                frameDurations = [];
                updateCanvasSize(gl);
            }
        }
    }

    var update = () => {
        var now = Date.now();
        var frameRate = 1000/FPS;
        var elapsed = now - prevTime;
        if (elapsed > frameRate) {
            if (frameDurations.length >= frameWindowSize) frameDurations.shift();
            frameDurations.push(elapsed);
            if (ADAPT_RESOLUTION) adaptToFramerate(elapsed);
            //console.log(elapsed);
            render(gl, elapsed);
            //console.log(elapsed);
            prevTime = now;
        }
        requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

function loadFile(path, callback) {
    var xhttp = new XMLHttpRequest();
    xhttp.onload = function() {
        console.log(path);
        callback(this.responseText);
    }
    xhttp.open("GET", path, true);
    xhttp.send();
}

function addDot() {
    dots = document.getElementById("loading-dots");
    dots.innerHTML = dots.innerHTML + ".";
}

var dotInterval = setInterval(addDot, 1000);
var vertexSource = null;
var fragmentSource = null;
var dataImage = null;
var dataImageUrl = "walnut_texture.png";

function onResourceLoaded() {
    if (vertexSource && fragmentSource && dataImage) {
        clearInterval(dotInterval);
        initCanvas(vertexSource, fragmentSource, dataImage);
    }
}

var imageElement = new Image();
imageElement.onload = () => {
    console.log("IMAGE LOADED");
    dataImage = imageElement;
    onResourceLoaded();
}
imageElement.src = dataImageUrl;

loadFile("vertex.glsl", (responseText) => {
    console.log("VERTEX SOURCE LOADED");
    vertexSource = responseText;
    onResourceLoaded();
});

loadFile("fragment.glsl", (responseText) => {
    console.log("FRAGMENT SOURCE LOADED");
    fragmentSource = responseText;
    onResourceLoaded();
});


function cloneMatrix(A) {
    var Ac = [[0,0,0], [0,0,0], [0,0,0]];
    for (var i = 0; i < 3; i++)
        for (var j = 0; j < 3; j++)
            Ac[j][i] = A[j][i];
    return Ac;
}

// transpose 3x3 matrix
function transpose(A) {
    var At = [[0,0,0], [0,0,0], [0,0,0]];
    for (var i = 0; i < 3; i++)
        for (var j = 0; j < 3; j++)
            At[j][i] = A[i][j];
    return At;
}

// source: https://gist.github.com/husa/5652439
function inverse(A) {
    var _A = cloneMatrix(A);
    var temp,
    N = _A.length,
    E = [];
   
    for (var i = 0; i < N; i++)
      E[i] = [];
   
    for (i = 0; i < N; i++)
      for (var j = 0; j < N; j++) {
        E[i][j] = 0;
        if (i == j)
          E[i][j] = 1;
      }
   
    for (var k = 0; k < N; k++) {
      temp = _A[k][k];
   
      for (var j = 0; j < N; j++)
      {
        _A[k][j] /= temp;
        E[k][j] /= temp;
      }
   
      for (var i = k + 1; i < N; i++)
      {
        temp = _A[i][k];
   
        for (var j = 0; j < N; j++)
        {
          _A[i][j] -= _A[k][j] * temp;
          E[i][j] -= E[k][j] * temp;
        }
      }
    }
   
    for (var k = N - 1; k > 0; k--)
    {
      for (var i = k - 1; i >= 0; i--)
      {
        temp = _A[i][k];
   
        for (var j = 0; j < N; j++)
        {
          _A[i][j] -= _A[k][j] * temp;
          E[i][j] -= E[k][j] * temp;
        }
      }
    }
   
    for (var i = 0; i < N; i++)
      for (var j = 0; j < N; j++)
        _A[i][j] = E[i][j];
    return _A;
  }

/*function matrixMultiply(a, b) {
  const transpose = (a) => a[0].map((x, i) => a.map((y) => y[i]));
  const dotproduct = (a, b) => a.map((x, i) => a[i] * b[i]).reduce((m, n) => m + n);
  const result = (a, b) => a.map((x) => transpose(b).map((y) => dotproduct(x, y)));
  return result(a, b);
}*/

function matrixMultiply(a, b) {
    var c = [[0,0,0], [0,0,0], [0,0,0]];
    for (var i = 0; i < 3; i++)
      for (var j = 0; j < 3; j++)
        for (var p = 0; p < 3; p++)
          c[i][j] += a[i][p] * b[p][j];
    return c;
}

function rotationMatrix(angle) {

    [alpha, beta, gamma] = angle;

    var cos = Math.cos; var sin = Math.sin;

    return [
        [
            cos(alpha)*cos(beta),
            cos(alpha)*sin(beta)*sin(gamma) - sin(alpha)*cos(gamma),
            cos(alpha)*sin(beta)*cos(gamma) + sin(alpha)*sin(gamma)
        ],
        [
            sin(alpha)*cos(beta),
            sin(alpha)*sin(beta)*sin(gamma) + cos(alpha)*cos(gamma),
            sin(alpha)*sin(beta)*cos(gamma) - cos(alpha)*sin(gamma)
        ],
        [
            -sin(beta),
            cos(beta)*sin(gamma),
            cos(beta)*cos(gamma)
        ]
    ];
}