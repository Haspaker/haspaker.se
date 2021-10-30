precision highp float;

#define weight(X, Y) weights[Y][X]
#define dir(X, Y) vec2(dirx[Y][X], diry[Y][X])

uniform highp float D;
uniform highp vec2 screenSize;
uniform highp sampler2D tex;
uniform highp sampler2D obstacleTex;
uniform bool mouseDown;
uniform bool mouseRightDown;
uniform bool shiftDown;
uniform highp vec2 mousePos;
uniform bool drawColor;
uniform bool useGravity;
uniform bool dripping;
uniform float mouseDownDuration;

uniform float brushSize;

//uniform vec2 directions[9]; // create array in js for backwards compatibility
//uniform float w[9]; // create array in js for backwards compatibility

const highp float sq2 = sqrt(2.0);
const highp mat3 bounceSolver = mat3(
    (sq2 - 2.0), 0.0, -(sq2 - 2.0),
    -sq2, 2.0*sq2, -sq2,
    sq2, -2.0, sq2
) * 1.0/(2.0*sq2 - 2.0);

const highp mat3 dirx = mat3(-1.0, -1.0, -1.0, // 1st column
                 0.0, 0.0, 0.0, // 2nd column
                 1.0, 1.0, 1.0); // 3rd column
const highp mat3 diry = mat3(1.0, 0.0, -1.0,
                 1.0, 0.0, -1.0,
                 1.0, 0.0, -1.0);
const highp mat3 weights = mat3(1.0/36.0, 1.0/9.0, 1.0/36.0, 
              1.0/9.0, 4.0/9.0, 1.0/9.0,
              1.0/36.0, 1.0/9.0, 1.0/36.0);


/*highp float get_rho(highp float x, highp float y) {
    highp vec2 uv = (gl_FragCoord.xy + vec2(x, y)) / (screenSize);
    return texture2D(tex, uv).z;
}

highp vec2 get_u(highp float x, highp float y) {
    highp vec2 uv = (gl_FragCoord.xy + vec2(x, y)) / (screenSize);
    return texture2D(tex, uv).xy;
}*/

highp vec4 get_cell(vec2 step) {
    highp vec2 uv = (gl_FragCoord.xy + step) / (screenSize);
    return texture2D(tex, uv);
}

/*highp float get_mixer(highp float x, highp float y) {
    highp vec2 uv = (gl_FragCoord.xy + vec2(x, y)) / (screenSize);
    return texture2D(tex, uv).w;
}

bool vertical_boundary(vec2 step) {
    int x = int(gl_FragCoord.x + step.x);
    return x == 0 || x == int(screenSize.x) - 1;
}

bool horizontal_boundary(vec2 step) {
    int y = int(gl_FragCoord.y + step.y);
    return y == 0 || y == int(screenSize.y) - 1;
}*/

/*bool is_boundary(vec4 cell) {
    ivec2 coords = ivec2(int(gl_FragCoord.x + step.x), int(gl_FragCoord.y + step.y));
    ivec2 origin = ivec2(0, 0);
    ivec2 bounds = ivec2(int(screenSize.x), int(screenSize.y)) - 1;
    return any(equal(coords, origin)) || any(equal(coords, bounds));
}*/

bool is_outside_domain(vec2 step) {
    /*ivec2 coords = ivec2(int(gl_FragCoord.x + step.x), int(gl_FragCoord.y + step.y));
    ivec2 lower = ivec2(3, 3);
    ivec2 upper = ivec2(int(screenSize.x), int(screenSize.y)) - 4;
    return any(lessThan(coords, lower)) || any(greaterThan(coords, upper));*/
    highp vec2 uv = (gl_FragCoord.xy + step) / (screenSize);
    return texture2D(obstacleTex, uv).r != 0.0;
}

bool is_bouncy(vec4 cell, vec2 step) {
    /*ivec2 coords = ivec2(int(gl_FragCoord.x + step.x), int(gl_FragCoord.y + step.y));
    ivec2 lower = ivec2(3, 3);
    ivec2 upper = ivec2(int(screenSize.x), int(screenSize.y)) - 4;
    return any(lessThan(coords, lower)) || any(greaterThan(coords, upper));*/
    bool inside_delete_radius = !shiftDown && mouseRightDown && length(gl_FragCoord.xy + step - mousePos) <= brushSize;
    return (!inside_delete_radius && cell.z < 0.55*D) || is_outside_domain(step);
}


/*vec4 boundary_info(vec2 step, vec2 vel) {
    ivec2 coords = ivec2(int(gl_FragCoord.x + step.x), int(gl_FragCoord.y + step.y));
    ivec2 origin = ivec2(0, 0);
    ivec2 bounds = ivec2(int(screenSize.x), int(screenSize.y)) - 1;
    float horizontal = float(coords.x == origin.x || coords.x == bounds.x);
    float vertical = float((coords.y == origin.y || coords.y == bounds.y) && horizontal == 0.0);
    vec4 qrob = vec4(0.0, 0.0, 0.0, 0.0);
    qrob += vec4(vel.x, vel.y, step.x, 1.0) * horizontal;
    qrob += vec4(vel.y, vel.x, step.y, 1.0) * vertical;
    return qrob;
}*/

highp float stream_magnitude(highp vec2 e, highp float w, vec4 frag_cell) {
    highp vec2 step = -1.0 * e;
    vec4 cell = get_cell(step);
    float outside = float(is_bouncy(cell, step));

    step *= (1.0 - outside);
    cell = cell * (1.0 - outside) + frag_cell * outside;
    e *= 1.0 - 2.0*outside;

    highp float rho = cell.z;
    highp vec2 vel = cell.xy;
    //highp float mixr = get_mixer(step.x, step.y);
    //mixr = mixr * float(rho > 0.41*D) + -1.0 * float(rho <= 0.41*D);

    highp vec2 normvel = vel / rho;
    highp float edotu = dot(e, normvel);
    highp float udotu = dot(normvel, normvel);
    float mag = w * rho * (1.0 + 3.0*edotu + 4.5*edotu*edotu - 1.5*udotu);

    /*vec4 qrob = boundary_info(step, vel);
    vec3 bounce = bounceSolver * vec3(qrob[0], qrob[1], rho);
    int offset = int(-qrob[2] + 1.0);
    float bounce_m = bounce[0] * float(offset == 0) 
     + bounce[1] * float(offset == 1)
     + bounce[2] * float(offset == 2);
    float result = m * (1.0 - qrob[3]) + bounce_m * qrob[3];*/

    return mag; //vec2(mag, mixr);
}


void main() {
    highp float rho = 0.0;
    highp vec2 vel = vec2(0.0, 0.0);
    //highp float prev_mixr = get_mixer(0.0, 0.0);
    //highp float mixr = 0.0;

    vec4 frag_cell = get_cell(vec2(0.0, 0.0));

    bool at_boundary = is_outside_domain(vec2(0.0, 0.0));
    for (int x = 0; x < 3; x++) {
        for (int y = 0; y < 3; y++) {
            highp vec2 e = dir(x, y);
            highp float mag = stream_magnitude(e, weight(x, y), frag_cell);
            //float mag = res[0];
            //float stream_mixr = res[1];
            rho += mag;
            //mixr += mag * stream_mixr;
            vel += mag * e;
        }
    }

    //mixr /= rho;
    //mixr = mixr * float(rho > 0.0*D) + 1.0 * float(rho <= 0.0*D);

    float bf = float(at_boundary);
    float brush_radius = brushSize * clamp(mouseDownDuration/200.0, 0.0, 1.0);
    //brush_radius *= 1.0 + 0.1 * sin(3.14*(mouseDownDuration/200.0-1.0)) * float(mouseDownDuration > 200.0);
    float add = float(!at_boundary && !shiftDown && mouseDown && length(gl_FragCoord.xy - mousePos) <= brush_radius);
    float remove = float(!shiftDown && mouseRightDown && length(gl_FragCoord.xy - mousePos) <= brush_radius);
    float dc = float(drawColor && rho > 2.0*D && length(gl_FragCoord.xy - mousePos) <= brush_radius);

    float innerBrush = float(length(gl_FragCoord.xy - mousePos) <= brush_radius-1.0);
    float notInnerBrush = 1.0 - innerBrush;


    /*float new_rho = rho*float(rho > 0.6*D) + rho*0.99*float(rho <= 0.6*D);
    vel = vel/rho*new_rho;
    rho = new_rho;*/

    vel.x = clamp(vel.x, -0.99, 0.99);
    vel.y = clamp(vel.y, -0.99, 0.99);
    rho = clamp(rho, 0.53*D, 100.0*D);

    // max(2.87*D, rho)
    gl_FragColor.xyz = vec3(vel[0], vel[1], rho) * (1.0-add-remove) 
        + vec3(0.0, -0.15*max(2.0*D, rho)*float(useGravity), max(2.0*D, rho)) * add
        + vec3(vel[0], vel[1], max(0.549*D, rho*0.9)) * remove;// + vec3(vel.xy / rho * 0.41*D, 0.41*D)*bf;
    //gl_FragColor.w = 1.0;
    gl_FragColor.w = 1.0; //mixr * (1.0-dc) + 0.0 * dc;

    /*ivec2 coord = ivec2(gl_FragCoord.x, gl_FragCoord.y);

    bool is_boundary = 
        any(equal(coord,ivec2(0,0))) || any(equal(coord,ivec2(screenSize.x,screenSize.y)-1))
        || any(equal(coord,ivec2(1,1))) || any(equal(coord,ivec2(screenSize.x,screenSize.y)-2));
    float s = float(is_boundary);
    
    if (rho < 0.0) {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    } else {
        gl_FragColor.xy = vel;// * (1.0 - s);
        gl_FragColor.z = rho; // * (1.0 - s);
        gl_FragColor.w = 1.0;
    }*/
}