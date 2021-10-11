precision highp float;

#define RESOLUTION 256.0
#define GRIDSIZE 16.0
#define PI 3.14159265359
#define PHI 1.61803398874989484820459 // Golden Ratio 
#define IF(COND, THEN, ELSE) (THEN * float(COND) + ELSE * (1.0 - float(COND)))

uniform vec2 screenSize;

uniform mat3 boxRotation;
uniform mat3 boxProjection;

uniform float sliceWidth;
uniform float slicePosition;
uniform float opacity;
uniform bool useColor;
uniform bool isolateShell;
uniform bool isolateNut;

uniform sampler2D tex;

const vec3 viewOrigin = vec3(0.0, 0.0, 0.0); 
const vec3 boxOrigin = vec3(0.0, 0.0, 1.5); 
const float boxSize = 1.0;
const vec3 screenOrigin = vec3(0.0, 0.0, 1.0);

const float stepSize = 0.4 * boxSize / RESOLUTION;

vec3 pixToNaturalUnits(vec3 p) {
    return p / (screenSize.x / 2.0);
}

vec3 getPixelPos() {
    vec3 pixViewOrigin = vec3(screenSize.xy/2.0, -screenSize.x/2.0);
    vec3 pixelPos = vec3(gl_FragCoord.xy, 0.0) - pixViewOrigin;
    return pixelPos;
}

/*vec3 getRayDirection(float x, float y) {
    return normalize(getPixelPos(x, y));
}*/

bool insideBox(vec3 pos) {
    //vec3 delta = boxProjection * (pos - boxOrigin);
    vec3 delta = boxProjection * (pos - boxOrigin);
    return all(lessThan(abs(delta), vec3(boxSize)/2.0));
}

vec3 rotateBoxPoint(vec3 point) {
    return boxRotation * (point - boxOrigin) + boxOrigin;
}

vec4 sample3D(sampler2D tex, vec3 uvw) {
    vec2 uv;
    float numSlices = GRIDSIZE * GRIDSIZE;
    float sliceWidth = 1.0/GRIDSIZE;
    float z_idx = floor(uvw.z * numSlices);
    z_idx = min(z_idx, numSlices - 1.0);
    float x_offset_idx = mod(z_idx, GRIDSIZE);
    float y_offset_idx = (z_idx - x_offset_idx) / GRIDSIZE;
    uv.x = (x_offset_idx + uvw.x) * sliceWidth;
    uv.y = (y_offset_idx + uvw.y) * sliceWidth;
    vec4 color = texture2D(tex, uv);
    return color;
}

vec4 samplePoint(vec3 point) {
    const vec3 lowerBoxCorner = boxOrigin - boxSize/2.0;
    vec3 uvw = boxProjection * (point - rotateBoxPoint(lowerBoxCorner)) / boxSize;
    vec4 packed_color = sample3D(tex, uvw);

    highp float grey =  packed_color.g * (1.0 / 257.0);
    grey += packed_color.r * (256.0 / 257.0);

    vec4 color = vec4(grey, grey, grey, 1.0);

    if (isolateNut) color *= float(packed_color.b <= 0.5);
    if (isolateShell) color *= float(packed_color.b > 0.5);

    color.a = 1.0;

    color *= float(color.r > 0.1/20.0);


    // Slice empty top and bottom to remove noise on edges
    float marginTop = 0.06;
    float marginBottom = 0.1;
    color *= float(uvw.z > marginBottom);
    color *= float(uvw.z < 1.0 - marginTop);
    return color; // * float(!insideSphere) + vec4(1.0, 0.0, 0.0, 1.0) * float(insideSphere);
}

vec4 slice(vec4 color, vec3 point) {
    const vec3 lowerBoxCorner = boxOrigin - boxSize/2.0;
    vec3 uvw = boxProjection * (point - rotateBoxPoint(lowerBoxCorner)) / boxSize;

    float sliceBottom = slicePosition - sliceWidth/2.0;
    float sliceTop = slicePosition + sliceWidth/2.0;
    color *= float(uvw.z > sliceBottom);
    color *= float(uvw.z < sliceTop);
    return color;
}

vec3 colorize(float grey) {
    vec3 shellColor = vec3(0.45, 0.27, 0.15);
    vec3 insideColor = vec3(0.89, 0.72, 0.59);
    vec3 darkColor = vec3(0.0); //vec3(0.0); //vec3(0.27, 0.16, 0.09);

    if (useColor) {
        float shellLimit = 0.85/20.0;
        float darkLimit = 0.4/20.0;

        return darkColor* float(grey <= darkLimit)
                + insideColor * float(grey <= shellLimit && grey > darkLimit)
                + shellColor * float(grey > shellLimit);

    } else {
        float darkLimit;
        if (isolateShell) 
            darkLimit = 0.93/20.0;
        else {
            darkLimit = 0.4/20.0;
        }

        return vec3(1.0) * float(grey > darkLimit) + vec3(0.0) * float(grey <= darkLimit);

    }
}

vec4 composite(vec4 inputColor, vec3 currentPoint, vec4 currentColor) {
    
    currentColor = slice(currentColor, currentPoint);

    float insideFlag = float(insideBox(currentPoint));

    float grey = currentColor.r;
    float magnitude = currentColor.r;
    magnitude *= 5.0 * opacity;

    float alpha_now = clamp(magnitude*1.0*opacity, 0.0, 1.0) * insideFlag;
    float alpha_in = inputColor.a;
    float alpha_out = alpha_in + (1.0-alpha_in)*alpha_now;

    vec3 C_now = colorize(grey);
    vec3 C_in = inputColor.rgb;
    vec3 C_out = C_in + (1.0-alpha_in) * alpha_now * C_now;

    return vec4(C_out, alpha_out);
}

vec4 march() {
    const vec3 upperBoxCorner = boxOrigin + boxSize/2.0;
    const float screenToUpperBoxCorner = length(upperBoxCorner - screenOrigin);
    const float numSteps = 1.5*screenToUpperBoxCorner/stepSize;

    vec3 startPoint = pixToNaturalUnits(getPixelPos());
    vec3 ray = normalize(startPoint);

    float angle = acos(dot(ray, vec3(0.0, 0.0, 1.0)));

    if (angle > PI/10.0) discard; 

    vec3 currentPoint = startPoint;

    vec4 ca = vec4(0.0);

    for (int i = 0; i < int(numSteps); i++) {

        vec4 currentColor = samplePoint(currentPoint);
        
        ca = composite(ca, currentPoint, currentColor);

        currentPoint += ray * stepSize;
    }

    return ca;
}

void main() {

    vec4 colorValue = march();

    gl_FragColor = colorValue;
}