precision highp float;

uniform highp vec2 screenSize;
uniform highp sampler2D tex;
uniform highp sampler2D obstacleTex;

uniform bool mouseDown;
uniform bool mouseRightDown;
uniform bool shiftDown;
uniform highp vec2 mousePos;

uniform float brushSize;

void main() {
    //gl_FragColor = vec4(0, 0, 0, 1);
    //gl_FragColor.xy = gl_FragCoord.xy / screenSize; //vec4(gl_FragCoord.xy / screenSize, 0.0, one());
    vec4 data = texture2D(obstacleTex, gl_FragCoord.xy / screenSize);
    vec4 obstacle = vec4(1.0, 1.0, 1.0, 1.0);
    vec4 empty = vec4(0.0, 0.0, 0.0, 1.0);
    
    bool drawing = shiftDown && mouseDown && length(gl_FragCoord.xy - mousePos) < brushSize && data.x < 0.5;
    bool deleting = shiftDown && mouseRightDown && length(gl_FragCoord.xy - mousePos) < brushSize && data.x > 0.5;

    gl_FragColor = data * float(!drawing && !deleting) + 
        obstacle * float(drawing) +
        empty * float(deleting);
}