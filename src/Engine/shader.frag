precision highp float;
uniform float aa_width;
uniform float time;

varying vec2  vUv;
varying float vIndex;
varying vec4  vColour;
varying vec3  vMiscA;
varying vec4  vMiscB;
varying vec4  vMiscC;

// sea
const int ITER_FRAGMENT = 3;
const float SEA_HEIGHT = 0.7;
const float SEA_CHOPPY = 4.0;
const float SEA_SPEED = 0.8;
const float SEA_FREQ = 0.16;
#define SEA_TIME (1.0 + time * SEA_SPEED)
const mat2 OCTAVE_MAT = mat2(1.6,1.2,-1.2,1.6);
const vec3 LIGHT_DIR = normalize(vec3(1, 1.4, 1)); 


float hash( vec2 p ) {
	float h = dot(p,vec2(127.1,311.7));	
    return fract(sin(h)*43758.5453123);
}
float noise( vec2 p ) {
    vec2 i = floor( p );
    vec2 f = fract( p );	
	vec2 u = f*f*(3.0-2.0*f);
    return -1.0+2.0*mix( mix( hash( i + vec2(0.0,0.0) ), 
                     hash( i + vec2(1.0,0.0) ), u.x),
                mix( hash( i + vec2(0.0,1.0) ), 
                     hash( i + vec2(1.0,1.0) ), u.x), u.y);
}

// sea
float sea_octave(vec2 uv, float choppy) {
    uv += noise(uv);        
    vec2 wv = 1.0-abs(sin(uv));
    vec2 swv = abs(cos(uv));    
    wv = mix(wv,swv,wv);
    return pow(1.0-pow(wv.x * wv.y,0.65),choppy);
}

float map_detailed(vec2 p, float seaHeight, float seaChoppy) {
    float freq = SEA_FREQ;
    float amp = seaHeight;
    float choppy = seaChoppy;
    vec2 uv = p.xy;
    
    float d, h = 0.0;    
    for(int i = 0; i < ITER_FRAGMENT; i++) {        
    	d = sea_octave((uv+SEA_TIME)*freq,choppy);
    	d += sea_octave((uv-SEA_TIME)*freq,choppy);
        h += d * amp;        
    	uv *= OCTAVE_MAT; freq *= 1.9; amp *= 0.22;
        choppy = mix(choppy,1.0,0.2);
    }
    return h;
}

// tracing
vec3 seaNormal(vec2 p, float eps, float seaHeight, float seaChoppy) {
    vec3 n;
    n.y = map_detailed(p, seaHeight, seaChoppy);    
    n.x = map_detailed(vec2(p.x+eps,p.y), seaHeight, seaChoppy) - n.y;
    n.z = map_detailed(vec2(p.x,p.y+eps), seaHeight, seaChoppy) - n.y;
    n.y = -eps;
    return normalize(n);
}

vec4 premultiply(vec4 col)
{
    col.rgb *= col.a;
    return col;
}

vec4 outlined(vec4 col, vec4 outline_col, float val, float border_thickness)
{
    outline_col.a = col.a;

    float aa = aa_width * 0.5;
    vec4 line_col = mix (outline_col, col, smoothstep(border_thickness - aa, border_thickness + aa, val));
    line_col.a *= smoothstep(-aa, aa, val);
    return line_col;
}

float triangleSDF( vec2 p, vec2 p0, vec2 p1, vec2 p2 )
{
    vec2 e0 = p1-p0, e1 = p2-p1, e2 = p0-p2;
    vec2 v0 = p -p0, v1 = p -p1, v2 = p -p2;
    vec2 pq0 = v0 - e0*clamp( dot(v0,e0)/dot(e0,e0), 0.0, 1.0 );
    vec2 pq1 = v1 - e1*clamp( dot(v1,e1)/dot(e1,e1), 0.0, 1.0 );
    vec2 pq2 = v2 - e2*clamp( dot(v2,e2)/dot(e2,e2), 0.0, 1.0 );
    float s = sign( e0.x*e2.y - e0.y*e2.x );
    vec2 d = min(min(vec2(dot(pq0,pq0), s*(v0.x*e0.y-v0.y*e0.x)),
                     vec2(dot(pq1,pq1), s*(v1.x*e1.y-v1.y*e1.x))),
                     vec2(dot(pq2,pq2), s*(v2.x*e2.y-v2.y*e2.x)));
    return -sqrt(d.x)*sign(d.y);
}

float capsuleSDF (vec2 px_pos, vec2 p1, vec2 p2, float radius)
{
    vec2 p1px = px_pos - p1,
         p1p2 = p2 - p1;
    float h = clamp( dot(p1px, p1p2) / dot(p1p2, p1p2), 0.0, 1.0 );
    return length( p1px - p1p2*h ) - radius;
}

float thickLineSDF(vec2 px_pos, vec2 p1, vec2 p2, float width)
{
    vec2 centre = (p2 + p1) * 0.5;

    vec2 rel_pos = px_pos - centre;
    float rel_pos_length = length(rel_pos);

    vec2 half_line = p2 - centre;
    float half_length = length(half_line);

    float long_side = dot(rel_pos, half_line) / half_length;
    float long_dist = abs(long_side) - half_length;

    float short_side = sqrt(rel_pos_length * rel_pos_length - long_side * long_side);
    float short_dist = short_side - width;

    return max(long_dist, short_dist);
}

float circleArcSDF (vec2 p, float a0, float a1, float r )
{
    float a = mod(atan(p.y, p.x), radians(360.));

    float ap = a - a0;
    if (ap < 0.)
        ap += radians(360.);
    float a1p = a1 - a0;
    if (a1p < 0.)
        a1p += radians(360.);

    // is a outside [a0, a1]?
    // https://math.stackexchange.com/questions/1044905/simple-angle-between-two-angles-of-circle
    if (ap >= a1p) {
        // snap to the closest of the two endpoints
        vec2 q0 = vec2(r * cos(a0), r * sin(a0));
        vec2 q1 = vec2(r * cos(a1), r * sin(a1));
        return min(length(p - q0), length(p - q1));
    }

    return abs(length(p) - r);
}



void main()
{
    vec4 col = vColour;
    float aa = aa_width * 0.5;
    if (vIndex == 0.0) //circle
    {
        vec2 pos = vMiscB.xy;
        float radius = vMiscB.z;

        float dist = length(vUv.xy - pos) - radius;
        float val = smoothstep(-aa, aa, -dist);

        col.a *= val;
    }
    else if (vIndex == 1.0) //square
    {
        vec2 pos = vMiscB.xy;
        float side = vMiscB.z;

        float dist = max(abs(vUv.x - pos.x) - 0.5 * side, abs(vUv.y - pos.y) - 0.5 * side);
        float val = smoothstep(-aa, aa, -dist);
        col *= val;
    }
    else if (vIndex == 2.0) //boat
    {
        vec2 pos = vMiscB.xy;
        float len = vMiscB.z;
        float width = vMiscB.w;

        float x = vUv.x - pos.x;
        float y = abs(vUv.y - pos.y);

        float dist = max(y - 0.5 * width, -(x + 0.5 * len));
        if (x>0.0)
            dist = max(dist, y - width * (0.5 - 2.0 * x * x / (len * len)));

        col = outlined(col, vec4(0.2, 0.2, 0.2, 1.0), -dist, 3.0);
    }
    else if (vIndex == 3.0) //star
    {
        float x = abs(2.0 * (vUv.x - 0.5));
        float y = abs(2.0 * (vUv.y - 0.5));
        // rotate by -45, abs y
        float x1 = 0.707 * (x + y);
        float y1 = abs(0.707 * (y - x));
        // rotate back by 45
        x = 0.707 * (x1 - y1);
        y = 0.707 * (y1 + x1);
    
        if (x < 0.05)
            col.a *= 0.5 * (1.0 + cos(y * 3.142));
        else {
            float dist = min(sqrt(x*x + y*y), 0.4);
            col.a *= 0.5 * (1.0 + cos(2.5 * dist * 3.142));
        }
    }
    else if (vIndex == 4.0) // the sea
    {	
        //https://www.shadertoy.com/view/Ms2SD1
        vec2 offset = vMiscB.zw;
        vec2 windVec = normalize(vMiscB.xy);
        float windStrength = length(vMiscB.xy);

        vec2 uv = (vUv + offset) / 80.0;

        float seaHeight = SEA_HEIGHT * 0.5 * (1.0 + windStrength / 384.);
        float seaChoppy = SEA_CHOPPY;
        vec3 normal = seaNormal(uv, 0.01, seaHeight, seaChoppy);

        float thing = 0.4;
        float peakAmount = smoothstep(thing, thing*1.01, dot(normal.xz, windVec));
        vec3 colour = mix(vec3(0.0, 0.18, 0.36), vec3(1.0), peakAmount);

        float lightIntensity = 0.5 * (1.0-dot(LIGHT_DIR, normal));
        lightIntensity =  (1.0 + floor(lightIntensity * 8.0)) / 8.0;
        colour *= lightIntensity;
        // post
        col = vec4(pow(colour,vec3(0.65)), 1.0);
    }
    else if (vIndex == 5.0) // capsule
    {
        vec2 start = vMiscB.xy;
        vec2 end = vMiscB.zw;
        float radius = vMiscC.x;
        float fade = vMiscC.y;
        float dist = capsuleSDF(vUv, start, end, radius);
        float fadeAmount = 1.0;
        if (fade == 1.0)
            fadeAmount = smoothstep(0.0, 1.0, dot(vUv - start, end - start) / dot(end - start, end - start));
        float val = fadeAmount * smoothstep(-aa, aa, -dist);

        col.a *= val;
    }
    else if (vIndex == 6.0) // triangle
    {
        vec2 point = vMiscB.xy;
        vec2 base  = vMiscB.zw;

        vec2 arrow = point - base;
        vec2 wing = 0.414 * arrow.yx;
        wing.y = -wing.y;

        float dist = triangleSDF(vUv, point, base+wing, base-wing);
        float rounding = length(arrow) * 0.35;
        col = outlined(col, vec4(0.2, 0.2, 0.2, 1.0), rounding - dist, 3.0);
    }
    else if (vIndex == 7.0) // circle arc
    {
        vec2 centre = vMiscB.xy;
        float theta1 = vMiscB.z;
        float theta2 = vMiscB.w;
        float radius = vMiscC.x;
        float thickness = vMiscC.y;
        vec2 pos = vUv - centre;
        float dist = circleArcSDF(pos, theta1, theta2, radius) - 0.5 * thickness;
        col.a *= smoothstep(-aa, aa, -dist);
    }
    else if (vIndex == 8.0) // buoy
    {
        vec2 pos = vUv.xy - vMiscB.xy;
        float radius = vMiscB.z;

        float dist = length(pos) - radius;

        vec3 normal = normalize(vec3(pos, sqrt(2.0 * radius * radius - dot(pos, pos))));
        
        float lightIntensity = 0.5 * (1.0-dot(LIGHT_DIR, normal));
        lightIntensity =  (4.0 + floor(lightIntensity * 5.0)) / 8.0;
        vec3 colour = col.rgb * lightIntensity;
        // post
        col = vec4(pow(colour,vec3(0.65)), 1.0);
        col = outlined(col, vec4(0.2, 0.2, 0.2, 1.0), -dist, 3.0);
    }

    gl_FragColor = premultiply(col);
}