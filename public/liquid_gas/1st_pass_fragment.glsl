precision highp float;

#define weight(X, Y) weights[Y][X]
#define dir(X, Y) vec2(dirx[Y][X], diry[Y][X])
#define G (-9.4/D)

uniform highp float D;
uniform highp vec2 screenSize;
uniform highp sampler2D tex;
uniform highp sampler2D obstacleTex;
uniform bool mouseDown;
uniform bool mouseRightDown;
uniform bool shiftDown;
uniform bool dripping;
uniform bool useGravity;
uniform highp vec2 mousePos;

uniform float brushSize;

//uniform vec2 directions[9]; // create array in js for backwards compatibility
//uniform float w[9]; // create array in js for backwards compatibility

const highp mat3 dirx = mat3(-1.0, -1.0, -1.0, // 1st column
                 0.0, 0.0, 0.0, // 2nd column
                 1.0, 1.0, 1.0); // 3rd column
const highp mat3 diry = mat3(1.0, 0.0, -1.0,
                 1.0, 0.0, -1.0,
                 1.0, 0.0, -1.0);
const highp mat3 weights = mat3(1.0/36.0, 1.0/9.0, 1.0/36.0, 
              1.0/9.0, 4.0/9.0, 1.0/9.0,
              1.0/36.0, 1.0/9.0, 1.0/36.0);

/*bool vertical_boundary(vec2 step) {
    int x = int(gl_FragCoord.x + step.x);
    return x == 0 || x == int(screenSize.x) - 1;
}

bool horizontal_boundary(vec2 step) {
    int y = int(gl_FragCoord.y + step.y);
    return y == 0 || y == int(screenSize.y) - 1;
}

bool is_boundary(vec2 step) {
    ivec2 coords = ivec2(int(gl_FragCoord.x + step.x), int(gl_FragCoord.y + step.y));
    ivec2 origin = ivec2(0, 0);
    ivec2 bounds = ivec2(int(screenSize.x), int(screenSize.y)) - 1;
    return any(equal(coords, origin)) || any(equal(coords, bounds));
}*/

//bool is_outside_domain(vec2 step) {
//    //return false;
//    /*ivec2 coords = ivec2(int(gl_FragCoord.x + step.x), int(gl_FragCoord.y + step.y));
//    ivec2 lower = ivec2(-1, -1);
//    ivec2 upper = ivec2(int(screenSize.x), int(screenSize.y));
//    return any(equal(coords, lower)) || any(equal(coords, upper));*/
//    return texture2D(obstacleTex, (gl_FragCoord.xy + step) / screenSize).r != 0.0;
//}

highp vec4 get_cell(vec2 step) {
    highp vec2 uv = (gl_FragCoord.xy + step) / (screenSize);
    return texture2D(tex, uv);
}

/*highp float get_rho(highp float x, highp float y) {
    highp vec2 uv = (gl_FragCoord.xy + vec2(x, y)) / (screenSize);
    return texture2D(tex, uv).z;
}*/

highp float psi(highp float x, highp float y, float frag_cell_rho) {
    vec4 cell = get_cell(vec2(x, y));
    highp float rho = cell.z;
    //bool attract = false; //!mouseDown && rho < 1.0*D && length(gl_FragCoord.xy + vec2(x, y) - mousePos) < 10.0;
    bool repel = !mouseDown && !mouseRightDown && length(gl_FragCoord.xy + vec2(x, y) - mousePos) < 8.0
        && length(gl_FragCoord.xy + vec2(x, y) - mousePos) < length(gl_FragCoord.xy - mousePos)
        && frag_cell_rho > 1.1*D;
    bool attract = false && !shiftDown && mouseRightDown && length(gl_FragCoord.xy + vec2(x, y) - mousePos) < brushSize*1.4;
    float repel_force = 4.0 * clamp((frag_cell_rho - 1.1)/1.1, 0.0, 1.0);
    //float interaction = 1.0*D*float(atMouse);
    //rho = max(rho, interaction);
    return D*exp(-D/rho) * (1.0 + 0.2*float(attract) - repel_force*D/rho*float(repel)*float(!dripping));
}


/*highp float old_psi(highp float x, highp float y) {
    highp vec2 uv = (gl_FragCoord.xy + vec2(x, y)) / (screenSize);
    highp vec2 this_uv = (gl_FragCoord.xy) / (screenSize);
    float outside = float(is_outside_domain(vec2(x, y)));
    highp float rho = texture2D(tex, uv).z * (1.0 - outside) + 0.0*texture2D(tex, this_uv).z*outside;
    bool attract = false; //!mouseDown && rho < 1.0*D && length(gl_FragCoord.xy + vec2(x, y) - mousePos) < 10.0;
    bool repel = !mouseDown && length(gl_FragCoord.xy + vec2(x, y) - mousePos) > 0.0 && length(gl_FragCoord.xy + vec2(x, y) - mousePos) < 8.0
        && length(gl_FragCoord.xy + vec2(x, y) - mousePos) < length(gl_FragCoord.xy - mousePos)
        && get_rho(0.0, 0.0) > 1.1*D;
    float repel_force = 4.0 * clamp((get_rho(0.0, 0.0) - 1.1)/1.1, 0.0, 1.0);
    //float interaction = 1.0*D*float(atMouse);
    //rho = max(rho, interaction);
    return D*exp(-D/rho) * (1.0 + 0.2*float(attract)*float(dripping) - repel_force*D/rho*float(repel)*float(!dripping));
}*/

/*highp float anti_psi(highp float x, highp float y) {
    highp vec2 uv = (gl_FragCoord.xy + vec2(x, y)) / (screenSize);
    highp float rho = 2.84*D - texture2D(tex, uv).z;
    rho = max(0.0, rho);
    //float interaction = 1.0*D*float(atMouse);
    //rho = max(rho, interaction);
    return D*exp(-D/rho);
}*/



void main() {
    //gl_FragColor = vec4(0, 0, 0, 1);
    //gl_FragColor.xy = gl_FragCoord.xy / screenSize; //vec4(gl_FragCoord.xy / screenSize, 0.0, one());
    highp vec4 cell = get_cell(vec2(0.0, 0.0));
    highp float rho = cell.z;
    highp vec2 vel = cell.xy;

    //bool at_boundary = is_boundary(vec2(0.0, 0.0));

    /*if (cell.z < 0.55*D) {
        gl_FragColor = vec4(0.0, 0.0, cell.z, cell.w);
    } else {*/

    float psi0 = psi(0.0, 0.0, rho); // outside of loop for performance
    for (int x = 0; x < 3; x++) {
        for (int y = 0; y < 3; y++) {
            highp vec2 d = dir(x, y);
            vel += G * weight(x, y) * psi0 * psi(-d.x, -d.y, rho) * d;
            //vel += -G * weight(x, y) * psi(0.0, 0.0) * anti_psi(-d.x, -d.y) * d;
        }
    }


    bool atMouse = !mouseDown && length(gl_FragCoord.xy - mousePos) < 10.0 && !dripping;

    vel.y += -0.006 * rho * float(rho > 1.0*D) * float(useGravity);// * float(!atMouse);

    vel.x = clamp(vel.x, -0.99, 0.99);
    vel.y = clamp(vel.y, -0.99, 0.99);
    //rho = clamp(rho, 0.5*D, 100.0*D);

    bool isObstacle = texture2D(obstacleTex, gl_FragCoord.xy / screenSize).x != 0.0;
    rho = rho * float(!isObstacle) + 0.5*D*float(isObstacle);

    ///// ADD BACK THIS TO PREVENT WIND IN BOX
    /////vel *= 1.0 - 0.02 * float(rho < 1.0*D);

    //vel *= float(!at_boundary);

    //vel.y *= float(!horizontal_boundary(vec2(0.0, 0.0)));
    //vel.x *= float(!vertical_boundary(vec2(0.0, 0.0)));

    //vel *= 1e-6;//float(!is_outside_domain(vec2(0.0, 0.0))); // BREAKS MACBOOK AIR??
    //rho *= 1e-6;//float(!is_outside_domain(vec2(0.0, 0.0)));

    gl_FragColor.xy = vel;
    gl_FragColor.z = rho;
    gl_FragColor.w = cell.w;
    //}
    //gl_FragColor.w = 1.0;

}