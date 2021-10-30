const DEBUG = false;

const WEBGL2 = false;
const WIDTH = 256;
const HEIGHT = 256;
const STEPLENGTH = DEBUG ? 1 : 25;
const FPS = DEBUG ? 0.5 : 60;
const D = 2.0;
const BORDER = false;

var mouseInfo = {
    x: 0,
    y: 0,
    down: false,
    rightDown: false,
    mouseUpTime: 0,
    mouseDownTime: 0,
    shift: false
};

var appState = {
    gravityDensity: -1.0,
    settings: {
        brushSize: 10,
        antiGravity: false
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

function drawBox(gl, program) {
    gl.useProgram(program);
    var primitiveType = gl.TRIANGLES;
    var count = 6;
    gl.drawArrays(primitiveType, 0, count);
}

function initFrameBuffer(gl, targetTexture) {
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

    const level = 0;
    // attach the texture as the first color attachment
    const attachmentPoint = gl.COLOR_ATTACHMENT0;
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, targetTexture, level);
    return fb;
}

function setTexAttribute(gl, program) {
    gl.useProgram(program);
    var textureLocation = gl.getUniformLocation(program, "tex");
    gl.uniform1i(textureLocation, 0);
    var textureLocation = gl.getUniformLocation(program, "obstacleTex");
    gl.uniform1i(textureLocation, 1);
}

function setDrippingAttribute(gl, program, value) {
    gl.useProgram(program);
    var drippingLocation = gl.getUniformLocation(program, "dripping");
    gl.uniform1i(drippingLocation, value);
}

function setDrawColorAttribute(gl, program, value) {
    gl.useProgram(program);
    var colorLocation = gl.getUniformLocation(program, "drawColor");
    gl.uniform1i(colorLocation, value);
}

function setSettingsAttributes(gl, program) {
    gl.useProgram(program);
    var gravityLocation = gl.getUniformLocation(program, "useGravity");
    gl.uniform1i(gravityLocation, !appState.settings.antiGravity);
    var brushLocation = gl.getUniformLocation(program, "brushSize");
    gl.uniform1f(brushLocation, appState.settings.brushSize);
}

function setDensityAttribute(gl, program) {
    gl.useProgram(program);
    var densityLocation = gl.getUniformLocation(program, "D");
    gl.uniform1f(densityLocation, D);
}

function setMouseAttribute(gl, program) {
    gl.useProgram(program);
    var mouseDownLocation = gl.getUniformLocation(program, "mouseDown");
    gl.uniform1i(mouseDownLocation, mouseInfo.down);
    var mouseRightDownLocation = gl.getUniformLocation(program, "mouseRightDown");
    gl.uniform1i(mouseRightDownLocation, mouseInfo.rightDown);
    var shiftDownLocation = gl.getUniformLocation(program, "shiftDown");
    gl.uniform1i(shiftDownLocation, mouseInfo.shift);
    var mousePosLocation = gl.getUniformLocation(program, "mousePos");
    gl.uniform2fv(mousePosLocation, [mouseInfo.x, mouseInfo.y]);
    var mouseDurationLocation = gl.getUniformLocation(program, "mouseDownDuration");
    gl.uniform1f(mouseDurationLocation, Date.now() - mouseInfo.mouseDownTime);
}

function setMouseAttribute(gl, program) {
    gl.useProgram(program);
    var mouseDownLocation = gl.getUniformLocation(program, "mouseDown");
    gl.uniform1i(mouseDownLocation, mouseInfo.down);
    var mouseRightDownLocation = gl.getUniformLocation(program, "mouseRightDown");
    gl.uniform1i(mouseRightDownLocation, mouseInfo.rightDown);
    var shiftDownLocation = gl.getUniformLocation(program, "shiftDown");
    gl.uniform1i(shiftDownLocation, mouseInfo.shift);
    var mousePosLocation = gl.getUniformLocation(program, "mousePos");
    gl.uniform2fv(mousePosLocation, [mouseInfo.x, mouseInfo.y]);
    var mouseDurationLocation = gl.getUniformLocation(program, "mouseDownDuration");
    gl.uniform1f(mouseDurationLocation, Date.now() - mouseInfo.mouseDownTime);
}

function initTexture(gl, data) {
    const targetTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, targetTexture);

    const mipLevel = 0;
    if (!WEBGL2) var internalFormat = gl.RGBA;
    if (WEBGL2) var internalFormat = gl.RGBA32F;
    const width = WIDTH;
    const height = HEIGHT;
    const border = 0;
    const format = gl.RGBA;
    const type = gl.FLOAT;
    
    const floatData = new Float32Array(data);
    gl.texImage2D(gl.TEXTURE_2D, mipLevel, internalFormat, width, height, border,
                  format, type, floatData);
    gl.getExtension("OES_texture_float");
    gl.getExtension('OES_texture_float_linear');
    // set the filtering so we don't need mips and it's not filtered
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    return targetTexture;
}

function setScreenSizeAttribute(gl, program) {
    gl.useProgram(program);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    var screenSizeLocation = gl.getUniformLocation(program, "screenSize");
    gl.uniform2fv(screenSizeLocation, [gl.canvas.width, gl.canvas.height]);
}

function initGui(gl) {
    var gui = new dat.GUI({
        name: "Walnut CT scan",
        closeOnTop: true,
        width: 400
    });
    //gui.name = "Walnut CT scan";
    //gui.closeOnTop = true;
    gui.add(appState.settings, 'antiGravity').name("Anti-gravity");
    gui.add(appState.settings, 'brushSize', 3.0, 20.0, 1.0).name("Brush size");
    gui.add({reset: () => initProgramState(gl)}, 'reset').name("Click here to reset");
    gui.open();

    const showHideInfo = () => {
        document.querySelector(".dg .info-button").classList.toggle("collapsed");
        document.querySelector(".dg .info").classList.toggle("collapsed");
    }

    const showHideControls = () => 
        document.querySelector(".dg .close-button").classList.toggle("collapsed");

    var infoDiv = document.querySelector("#info-template").content.cloneNode(true);
    document.querySelector(".dg.main.a").appendChild(infoDiv);
    document.querySelector(".dg .info-button").onclick = showHideInfo;
    document.querySelector(".dg .close-button").onclick = showHideControls;
}

function initProgramState(gl) {
    var data = [];
    var obstacleData = [];
    for (var x = 0; x < WIDTH; x++) {
        for (var y = 0; y < HEIGHT; y++) {
            //var r = Math.random();
            //var initial_rho = D*(1.0 + r/200);
            var initial_rho = 0.49 * D;
            if (BORDER && (x == 0 || x == WIDTH - 1 || y == 0 || y == HEIGHT - 1))
                initial_rho = 0.0;

            if (x > 110 && y > 72 && x < WIDTH - 1 - 110 && y < 90)
                initial_rho = 2.84 * D;
            data[y*HEIGHT*4+x*4] = 0.0;
            data[y*HEIGHT*4+x*4+1] =  0.0;
            data[y*HEIGHT*4+x*4+2] = initial_rho;
            data[y*HEIGHT*4+x*4+3] = 1.0;

            var obstacleFlag;
            if (x < 3 || y < 3 || x > WIDTH - 1 - 3 || y > HEIGHT - 1 - 3)
                obstacleFlag = 0.5;
            else obstacleFlag = 0;

            if (x > 50 && y > 60 && x < WIDTH - 1 - 50 && y < 70)
                obstacleFlag = 1;

            if ((x - WIDTH/2)*(x - WIDTH/2) + (y - HEIGHT/2 - 5)*(y - HEIGHT/2 - 5) < 25*25)
                obstacleFlag = 1;

            obstacleData[y*HEIGHT*4+x*4] = obstacleFlag;
            obstacleData[y*HEIGHT*4+x*4+1] = obstacleFlag;
            obstacleData[y*HEIGHT*4+x*4+2] = obstacleFlag;
            obstacleData[y*HEIGHT*4+x*4+3] = obstacleFlag;
        }
    }

    var obstacleTexture1 = initTexture(gl, obstacleData);
    var obstacleTexture2 = initTexture(gl, obstacleData);

    var ofb1 = initFrameBuffer(gl, obstacleTexture1);
    var ofb2 = initFrameBuffer(gl, obstacleTexture2);

    var obsTexInfo = {
        idx: 0,
        state: [
            {texture: obstacleTexture1, fb: ofb2},
            {texture: obstacleTexture2, fb: ofb1},
        ]
    }

    var stateTexture1 = initTexture(gl, data);
    var stateTexture2 = initTexture(gl, data);

    // render the cube with the texture we just rendered to
    var fb1 = initFrameBuffer(gl, stateTexture1);
    var fb2 = initFrameBuffer(gl, stateTexture2);

    var oldStateInfo = {
        texture: stateTexture1,
        fb: fb1
    };

    var newStateInfo = {
        texture: stateTexture2,
        fb: fb2
    };

    appState.firstStateInfo = oldStateInfo;
    appState.secondStateInfo = newStateInfo;
    appState.obsTexInfo = obsTexInfo;


}

function initCanvas(vertexShaderSource, firstPassFragSource, secondPassFragSource, renderFragSource, obstacleFragSource) {
    console.log('init');

    var canvas = document.querySelector("#main-canvas");
    if (WEBGL2) var gl = canvas.getContext("webgl2");
    else var gl = canvas.getContext("webgl");

    canvas.setAttribute('width', WIDTH);
    canvas.setAttribute('height', HEIGHT);

    //console.log(gl.getSupportedExtensions());
    if (!WEBGL2) var extFloat = gl.getExtension("OES_texture_float");
    //var extFloatLinear = gl.getExtension("OES_texture_float_linear ");
    if (!WEBGL2) var extFloatRender = gl.getExtension("WEBGL_color_buffer_float");
    if (WEBGL2) gl.getExtension("EXT_color_buffer_float");

    var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    var firstPassFragShader = createShader(gl, gl.FRAGMENT_SHADER, firstPassFragSource);
    var secondPassFragShader = createShader(gl, gl.FRAGMENT_SHADER, secondPassFragSource);
    var renderFragShader = createShader(gl, gl.FRAGMENT_SHADER, renderFragSource);
    var obstacleFragShader = createShader(gl, gl.FRAGMENT_SHADER, obstacleFragSource);

    var firstPassProgram = createProgram(gl, vertexShader, firstPassFragShader);
    var secondPassProgram = createProgram(gl, vertexShader, secondPassFragShader);
    var renderProgram = createProgram(gl, vertexShader, renderFragShader);
    var obstacleProgram = createProgram(gl, vertexShader, obstacleFragShader);
    
    /*if ( window.innerWidth >  window.innerHeight) 
        canvas.style.height = '100%';
    else canvas.style.width = '100%';*/

    
    canvas.addEventListener('mousemove', function(evt) {
        var rect = canvas.getBoundingClientRect(), // abs. size of element
            scaleX = canvas.width / rect.width,    // relationship bitmap vs. element for X
            scaleY = canvas.height / rect.height;  // relationship bitmap vs. element for Y

          mouseInfo.x = (evt.clientX - rect.left) * scaleX;  // scale mouse coordinates after they have
          mouseInfo.y = HEIGHT - (evt.clientY - rect.top) * scaleY;
    });
    
    canvas.addEventListener('touchmove', function(evt) {
        var rect = canvas.getBoundingClientRect(), // abs. size of element
            scaleX = canvas.width / rect.width,    // relationship bitmap vs. element for X
            scaleY = canvas.height / rect.height;  // relationship bitmap vs. element for Y

        var touches = evt.changedTouches;

        mouseInfo.x = (touches[0].clientX - rect.left) * scaleX;  // scale mouse coordinates after they have
        mouseInfo.y = HEIGHT - (touches[0].clientY - rect.top) * scaleY;
    });

    window.addEventListener('contextmenu', function (e) { e.preventDefault(); }, false);

    canvas.addEventListener('mousedown', function(e) {
        e.preventDefault();
        mouseInfo.down = e.button == 0;
        mouseInfo.rightDown = e.button == 2;
        mouseInfo.mouseDownTime = Date.now();
        //mouseInfo.shift = e.shiftKey;
    })

    document.querySelector('body').addEventListener('mouseup', function(e) {
        if (mouseInfo.down) mouseInfo.mouseUpTime = Date.now();
        //if (mouseInfo.rightDown) mouseInfo.shift = false;
        mouseInfo.down = false;
        mouseInfo.rightDown = false;
    })

    document.querySelector('body').addEventListener('keydown', function(e) {
        mouseInfo.shift = e.shiftKey;
    });

    document.querySelector('body').addEventListener('keyup', function(e) {
        mouseInfo.shift = e.shiftKey;
    });

    canvas.addEventListener('touchstart', function(e) {
        mouseInfo.down = true;
    })

    canvas.addEventListener('touchend', function(e) {
        mouseInfo.down = false;
    })
    positionBuffer = initPositionBuffer(gl);

    appState.firstPassProgram = firstPassProgram;
    appState.secondPassProgram = secondPassProgram;
    appState.renderProgram = renderProgram;
    appState.obstacleProgram = obstacleProgram;
    appState.positionBuffer = positionBuffer;

    initProgramState(gl);

    initGui(gl);

    tick(gl);
}

function resetDensity(gl, texture, fb) {
    console.log("RESET");
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.activeTexture(gl.TEXTURE0);
    var pixels = new Float32Array(WIDTH*HEIGHT*4);
    gl.readPixels( 0, 0, WIDTH, HEIGHT, gl.RGBA, gl.FLOAT, pixels);
    var densitySum = 0;
    var densityCount = 0;
    var zeroGeeDensity = 2.84*D; 
    for (var i = 0; i < WIDTH*HEIGHT*4; i+=4) {
        var density = pixels[i+2];
        if (density >= zeroGeeDensity) {
            pixels[i] = pixels[i] * zeroGeeDensity / density;
            pixels[i+1] = pixels[i+1] * zeroGeeDensity / density;
            pixels[i+2] = zeroGeeDensity;
            densitySum += density;
            densityCount += 1;
        }
    }
    console.log(densitySum, densityCount);
    appState.gravityDensity = densitySum/densityCount;
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, WIDTH, HEIGHT, 0, gl.RGBA, gl.FLOAT, pixels);

    //const attachmentPoint = gl.COLOR_ATTACHMENT0;
    //gl.framebufferTexture2D(
    //    gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, targetTexture, level);
}


function restoreDensity(gl, texture, fb) {
    console.log("RESTORE");
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.activeTexture(gl.TEXTURE0);
    var pixels = new Float32Array(WIDTH*HEIGHT*4);
    gl.readPixels(0, 0, WIDTH, HEIGHT, gl.RGBA, gl.FLOAT, pixels);
    var zeroGeeDensity = 1.4*D;
    var meanDensity = appState.gravityDensity * 0.85; 
    for (var i = 0; i < WIDTH*HEIGHT*4; i+=4) {
        var density = pixels[i+2];
        if (density >= zeroGeeDensity) {
            pixels[i] = pixels[i] * meanDensity / density;
            pixels[i+1] = pixels[i+1] * meanDensity / density;
            pixels[i+2] = meanDensity;
        }
    }
    appState.gravityDensity = -1.0;
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, WIDTH, HEIGHT, 0, gl.RGBA, gl.FLOAT, pixels);
}

function render(gl) {

    console.log("FRAME");

    const app = appState;

    var obstacleTexture = app.obsTexInfo.state[app.obsTexInfo.idx].texture;
    var obstacleTextureFb = app.obsTexInfo.state[app.obsTexInfo.idx].fb;

    if (mouseInfo.shift) {
        setPositionAttribute(gl, app.obstacleProgram);
        setScreenSizeAttribute(gl, app.obstacleProgram);
        setTexAttribute(gl, app.obstacleProgram);
        setMouseAttribute(gl, app.obstacleProgram);
        setSettingsAttributes(gl, app.obstacleProgram);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, app.firstStateInfo.texture);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, obstacleTexture);
        gl.bindFramebuffer(gl.FRAMEBUFFER, obstacleTextureFb);
        gl.bindBuffer(gl.ARRAY_BUFFER, app.positionBuffer);
        drawBox(gl, app.obstacleProgram);
        app.obsTexInfo.idx = app.obsTexInfo.idx == 1 ? 0 : 1;
        obstacleTexture = app.obsTexInfo.state[app.obsTexInfo.idx].texture;
    }

    setPositionAttribute(gl, app.renderProgram);
    setScreenSizeAttribute(gl, app.renderProgram);
    setTexAttribute(gl, app.renderProgram);
    setDensityAttribute(gl, app.renderProgram);
    setMouseAttribute(gl, app.renderProgram);
    setSettingsAttributes(gl, app.renderProgram);
    setDrippingAttribute(gl, app.renderProgram, Date.now() - mouseInfo.mouseUpTime < 1000 ? 1 : 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, app.firstStateInfo.texture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, obstacleTexture);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindBuffer(gl.ARRAY_BUFFER, app.positionBuffer);
    drawBox(gl, app.renderProgram);

    for (var j = 0; j < STEPLENGTH; j++) {

        if (app.settings.antiGravity && app.gravityDensity == -1.0) {
            resetDensity(gl, app.firstStateInfo.texture, app.firstStateInfo.fb);
        }

        if (!app.settings.antiGravity && app.gravityDensity != -1.0) {
            app.gravityDensity = -1.0;
            //restoreDensity(gl, app.firstStateInfo.texturem, app.firstStateInfo.fb);
        }

        setPositionAttribute(gl, app.firstPassProgram);
        setScreenSizeAttribute(gl, app.firstPassProgram);
        setTexAttribute(gl, app.firstPassProgram);
        setDensityAttribute(gl, app.firstPassProgram);
        setMouseAttribute(gl, app.firstPassProgram);
        setDrippingAttribute(gl, app.firstPassProgram, Date.now() - mouseInfo.mouseUpTime < 100 ? 1 : 0);
        setSettingsAttributes(gl, app.firstPassProgram)
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, app.firstStateInfo.texture);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, obstacleTexture);
        gl.bindFramebuffer(gl.FRAMEBUFFER, app.secondStateInfo.fb);
        //gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindBuffer(gl.ARRAY_BUFFER, app.positionBuffer);
        gl.clear(gl.COLOR_BUFFER_BIT);
        drawBox(gl, app.firstPassProgram);

        setPositionAttribute(gl, app.secondPassProgram);
        setScreenSizeAttribute(gl, app.secondPassProgram);
        setTexAttribute(gl, app.secondPassProgram);
        setDensityAttribute(gl, app.secondPassProgram);
        setMouseAttribute(gl, app.secondPassProgram);
        setDrawColorAttribute(gl, app.secondPassProgram, mouseInfo.shift ? 0 : 0);
        setDrippingAttribute(gl, app.secondPassProgram, Date.now() - mouseInfo.mouseUpTime < 1000 ? 1 : 0);
        setSettingsAttributes(gl, app.secondPassProgram)
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, app.secondStateInfo.texture);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, obstacleTexture);
        gl.bindFramebuffer(gl.FRAMEBUFFER, app.firstStateInfo.fb);
        gl.bindBuffer(gl.ARRAY_BUFFER, app.positionBuffer);
        gl.clear(gl.COLOR_BUFFER_BIT);
        drawBox(gl, app.secondPassProgram);
    }

    if (mouseInfo.down) {
        console.log(mouseInfo.x, mouseInfo.y);
    }

    //return [oldStateInfo, newStateInfo];
    //return [secondStateInfo, firstStateInfo];
}

function tick(gl) {
    var prevTime = Date.now();

    var i = 0;
    var update = () => {
        var now = Date.now();
        var frameRate = 1000/FPS;
        var elapsed = now - prevTime;
        if (elapsed > frameRate) {
            //console.log(elapsed);
            render(gl);
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

var vertexShaderSource = null;
var firstPassFragSource = null;
var secondPassFragSource = null;
var renderFragSource = null;
var obstacleFragSource = null;

loadFile("vertex.glsl", (responseText) => {
    vertexShaderSource = responseText;
    if (vertexShaderSource && firstPassFragSource && secondPassFragSource && renderFragSource && obstacleFragSource) 
        initCanvas(vertexShaderSource, firstPassFragSource, secondPassFragSource, renderFragSource, obstacleFragSource);
});

loadFile("render_fragment.glsl", (responseText) => {
    renderFragSource = responseText;
    if (vertexShaderSource && firstPassFragSource && secondPassFragSource && renderFragSource && obstacleFragSource) 
        initCanvas(vertexShaderSource, firstPassFragSource, secondPassFragSource, renderFragSource, obstacleFragSource);
});

loadFile("1st_pass_fragment.glsl", (responseText) => {
    firstPassFragSource = responseText;
    if (vertexShaderSource && firstPassFragSource && secondPassFragSource && renderFragSource && obstacleFragSource) 
        initCanvas(vertexShaderSource, firstPassFragSource, secondPassFragSource, renderFragSource, obstacleFragSource);
});

loadFile("2nd_pass_fragment.glsl", (responseText) => {
    secondPassFragSource = responseText;
    if (vertexShaderSource && firstPassFragSource && secondPassFragSource && renderFragSource && obstacleFragSource) 
        initCanvas(vertexShaderSource, firstPassFragSource, secondPassFragSource, renderFragSource, obstacleFragSource);
});


loadFile("obstacle_fragment.glsl", (responseText) => {
    obstacleFragSource = responseText;
    if (vertexShaderSource && firstPassFragSource && secondPassFragSource && renderFragSource && obstacleFragSource) 
        initCanvas(vertexShaderSource, firstPassFragSource, secondPassFragSource, renderFragSource, obstacleFragSource);
});