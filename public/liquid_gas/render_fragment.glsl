#define PI 3.14159265359

precision highp float;

uniform vec2 screenSize;
uniform sampler2D tex;
uniform sampler2D obstacleTex;
uniform highp float D;

uniform bool mouseDown;
uniform bool mouseRightDown;
uniform bool shiftDown;
uniform float mouseDownDuration;
uniform bool dripping;
uniform highp vec2 mousePos;

uniform float brushSize;

bool isObstacleBorder() {
    bool isBorder = false;
    for (float x = -3.0; x <= 3.0; x++) {
        for (float y = -3.0; y <= 3.0; y++) {
            vec2 uv = (gl_FragCoord.xy + vec2(x, y)) / screenSize;
            isBorder = isBorder || texture2D(obstacleTex, uv).r != 1.0;
        }
    }
    return isBorder;
}

float getObstacleShadeBorder() {
    bool isBorder = false;
    const float maxDist = 20.0;
    float limit = maxDist*maxDist*2.0+1.0;
    float distance = limit;
    for (float x = 1.0; x <= maxDist; x++) {
        for (float y = -maxDist; y <= -1.0; y++) {
            vec2 uv = (gl_FragCoord.xy + vec2(x, y)) / screenSize;
            bool foundBorder = texture2D(obstacleTex, uv).r != 1.0;
            isBorder = isBorder || foundBorder;
            distance = min((x*x+y*y)+1000.0*float(!foundBorder), distance);
        }
    }
    return 0.0;// - distance/limit;
}

bool inTile(vec2 p, float tileSize) {
  //vec2 ptile = step(0.5, fract(0.5 * p / tileSize));
  //return ptile.x == ptile.y;
  //float deg45 = radians(45);
  float deg45 = 3.14159265359/2.0;
  p += 1000.0*vec2(-sin(deg45), cos(deg45));
  float d = length(p - dot(p, vec2(cos(deg45), sin(deg45))));
  float tile = step(0.5, fract(0.5 * d / tileSize));
  return tile == 1.0;
}

bool inOppTile(vec2 p, float tileSize) {
  //vec2 ptile = step(0.5, fract(0.5 * p / tileSize));
  //return ptile.x == ptile.y;
  //float deg45 = radians(45);
  float deg135 = 3.0*3.14159265359/2.0;
  float d = length(p - dot(p, vec2(-cos(deg135), sin(deg135))));
  float tile = step(0.5, fract(0.5 * d / tileSize));
  return tile == 1.0;
}

void main() {
    vec2 uv = gl_FragCoord.xy / screenSize;
    vec4 val = texture2D(tex, uv);
    val.z = (val.z - 0.41*D) * step(1.2*D, val.z) + 0.41*D; // lowpass filter
    //gl_FragColor = val; //vec4(val.xy/3.0, val.z/3.0, 1.0);

    vec4 mouseColor = vec4(1.0, 1.0, 1.0, 1.0) * float(!mouseRightDown) 
                    + vec4(0.81, 0.33, 0.25, 1.0) * float(mouseRightDown);
    vec4 liquidColor1 = vec4(0.0*val.z / (2.0 * D), 0.0, 0.0*val.z / (2.0 * D)*0.5, 1.0);
    vec4 liquidColor2 = vec4(0.0, val.z / (2.84 * D)*0.5, val.z / (2.84 * D), 1.0);
    vec4 liquidColor = mix(liquidColor1, liquidColor2, val.w);
    //vec4 obstacleColor = vec4(vec3(0.59, 0.62, 0.65)*1.0, 1.0);
    //vec4 obstacleBorderColor = vec4(0.86, 0.87, 0.88, 1.0);
    vec4 obstacleColor = vec4(vec3(0.48, 0.40, 0.33)*1.0, 1.0);
    vec4 obstacleBorderColor = vec4(0.87, 0.53, 0.33, 1.0);

    vec2 mouseDirection = gl_FragCoord.xy - mousePos;
    float mouseDistance = length(mouseDirection);
    float mouseAngle = atan(mouseDirection.y, mouseDirection.x);

    float borderWidth = 2.0;
    float brushBorderRadius = brushSize + 3.0;

    float k1 = 0.5 + 0.5 * clamp(mouseDownDuration/200.0, 0.0, 1.0);
    float k2 = 1.0 + 0.1 + 0.1 * sin(3.14*(mouseDownDuration/400.0-0.5)) * float(mouseDownDuration > 200.0);

    bool anyMouseDown = mouseDown || mouseRightDown;

    bool mousePixel =
        ((mouseRightDown || (mouseDown && shiftDown))
            && mouseDistance < (brushBorderRadius+borderWidth)
            && mouseDistance > brushBorderRadius)
        || (mouseDown && !shiftDown 
            && mouseDistance < (brushBorderRadius+borderWidth)*k1*k2 
            && mouseDistance > brushBorderRadius*k1*k2)
        || (!anyMouseDown && mouseDistance < 4.0); // && (mouseDistance > 5.0 || !dripping));

    mousePixel = (mousePixel && (!shiftDown || !anyMouseDown))
               || (mousePixel && shiftDown && mod(mouseAngle, PI/10.0) > PI/20.0);

    //bool waterPixel = !mousePixel && !mouseDown && mouseDistance < 8.0 && mouseDistance >= 7.0;
    
    bool obstacleBorderPixel = !mousePixel && texture2D(obstacleTex, uv).r == 1.0 && isObstacleBorder();
    bool obstaclePixel = !mousePixel && !obstacleBorderPixel &&
        texture2D(obstacleTex, uv).r == 1.0 && inTile(gl_FragCoord.xy, 2.0);

    float mp = float(mousePixel);
    //float wp = float(waterPixel);
    float opb = float(obstacleBorderPixel);
    float op = float(obstaclePixel);
    float shade = 1.0 - 0.7*getObstacleShadeBorder();

    gl_FragColor = liquidColor * (1.0 - mp - op - opb) + mouseColor * mp + vec4(0.9) * op * shade + vec4(0.9) * opb * shade;

    //+ vec4(0.25, 0.6, 0.97, 1.0) * wp;
}