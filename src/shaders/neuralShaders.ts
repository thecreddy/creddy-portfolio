export const neuralVertexShader = `
precision highp float;

attribute vec3 aSeed;
attribute float aIndex;
attribute float aGroup;
attribute float aPhase;
attribute float aSpeed;

uniform float uTime;
uniform vec3 uMousePos;
uniform vec2 uPointer;
uniform float uDevicePixelRatio;

varying vec3 vPosition;
varying float vDepth;
varying float vGroup;
varying float vIndex;
varying float vPulse;

// Simplex 3D noise
vec4 permute(vec4 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;

  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z.xxxx);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

// Divergence-free 3D Curl Noise for organic fluid velocity
vec3 curlNoise(vec3 p) {
  const float e = 0.05;
  float n1 = snoise(p + vec3(0.0, e, 0.0));
  float n2 = snoise(p - vec3(0.0, e, 0.0));
  float n3 = snoise(p + vec3(0.0, 0.0, e));
  float n4 = snoise(p - vec3(0.0, 0.0, e));
  float n5 = snoise(p + vec3(e, 0.0, 0.0));
  float n6 = snoise(p - vec3(e, 0.0, 0.0));
  return vec3(
    (n1 - n2) - (n3 - n4),
    (n3 - n4) - (n5 - n6),
    (n5 - n6) - (n1 - n2)
  ) / (2.0 * e);
}

void main() {
  vIndex = aIndex;
  vGroup = aGroup;

  // Quasi-periodic continuous time variables (never repeats identically, completely seamless)
  float t1 = uTime * 0.224; // ~28s base cycle
  float t2 = uTime * 0.149; // ~42s secondary harmonic
  float t3 = uTime * 0.331; // ~19s fine flow

  // Organic expansion-contraction factor (asymmetric breathing)
  float expand = 0.5 - 0.45 * cos(t1) + 0.15 * sin(t2);

  // Vortex torque & bending factor
  float vortexFlow = clamp(sin(t1 - 1.2) * 1.25 + 0.2 * cos(t2), 0.0, 1.0);

  // Lattice reorganization factor
  float latticeReorg = clamp(sin(t1 - 2.8) * 1.35 + 0.25 * sin(t2 * 1.5), 0.0, 1.0);

  // Base parametric angles from seeds (NOT a sphere - multi-lobed manifold)
  float u = aSeed.x * 6.2831853;
  float v = (aSeed.y - 0.5) * 4.0;
  float seedZ = aSeed.z;

  // 1. ASYMMETRIC DENSE AI CORE
  // Multi-lobed folding manifold with filament grooves
  float lobe = 1.0 + 0.35 * sin(3.0 * u + seedZ * 4.0) * cos(2.0 * v);
  float rCoreBase = (0.55 + 0.45 * aSeed.y) * lobe;
  vec3 pCore = vec3(
    rCoreBase * cos(u) * (1.0 + 0.2 * sin(v * 2.0)),
    v * 0.45 + 0.25 * sin(u * 2.0),
    rCoreBase * sin(u) * (1.0 + 0.2 * cos(v * 2.0))
  );

  // 2. OUTWARD FLUID EXPANSION & BRANCHING DENDRITES
  // Asymmetric plume billowing out along fluid streamlines
  float rPlume = 2.2 + 1.2 * aSeed.y + 0.4 * sin(u * 2.0 + t1);
  float plumeAngle = u + 0.8 * log(1.0 + rPlume) + t3 * 0.2;
  vec3 pExpanded = vec3(
    rPlume * cos(plumeAngle) + 0.4 * sin(v * 1.5),
    v * 1.2 + 0.5 * sin(plumeAngle * 2.0),
    rPlume * sin(plumeAngle) * 0.85
  );

  // 3. CONTINUOUS TWISTED MÖBIUS / VORTEX CONDUIT
  // Particles travel along an asymmetric twisting 3D figure-8 vortex
  float travelU = fract(aPhase + uTime * (0.08 + 0.12 * aSpeed));
  float tau = travelU * 6.2831853;
  float R_vortex = 1.95;
  // Trefoil-Möbius twisted guide
  vec3 pVortexGuide = vec3(
    (R_vortex + 0.45 * cos(3.0 * tau)) * cos(2.0 * tau),
    0.65 * sin(3.0 * tau) + 0.25 * cos(tau),
    (R_vortex + 0.45 * cos(3.0 * tau)) * sin(2.0 * tau) * 0.9
  );
  float swirlRad = 0.55 + 0.2 * sin(aSeed.x * 6.2831853 + t3);
  float swirlPhi = aSeed.y * 6.2831853 + uTime * 0.75;
  vec3 pVortex = pVortexGuide + vec3(
    swirlRad * cos(swirlPhi) * cos(2.0 * tau),
    swirlRad * sin(swirlPhi),
    swirlRad * cos(swirlPhi) * sin(2.0 * tau)
  );

  // 4. STRATIFIED REORGANIZING LATTICE
  float strandId = floor(aIndex * 16.0);
  float strandPhase = strandId * (6.2831853 / 16.0);
  float twistH = v * 1.1;
  float twistAngle = twistH * 1.3 + strandPhase + t2;
  float rLattice = 1.65 + 0.35 * sin(strandPhase * 2.0 + t1 * 0.5);
  vec3 pLattice = vec3(
    rLattice * cos(twistAngle),
    twistH,
    rLattice * sin(twistAngle)
  );

  // Smooth continuous morphing blend across the continuum
  vec3 pos = mix(pCore, pExpanded, expand);
  pos = mix(pos, pVortex, vortexFlow * 0.88);
  pos = mix(pos, pLattice, latticeReorg * 0.65);

  // Independent 3D Curl Noise fluid deformation (ensures zero rigid appearance)
  vec3 fluidDisplace = curlNoise(pos * 0.42 + vec3(sin(t2) * 0.2, t3 * 0.1, cos(t1) * 0.2)) * (0.22 + 0.3 * expand);
  pos += fluidDisplace;

  // Active travelling computational signal pulse
  float pulse = sin(length(pos) * 3.8 - uTime * 4.2 + aPhase);
  vPulse = clamp(pulse * 0.5 + 0.5, 0.0, 1.0);

  // Interactive mouse influence in 3D (restrained, fluid displacement)
  vec3 toMouse = pos - uMousePos;
  float distToMouse = length(toMouse);
  float mouseRadius = 2.4;
  if (distToMouse < mouseRadius) {
    float influence = smoothstep(mouseRadius, 0.0, distToMouse);
    vec3 push = normalize(toMouse + vec3(0.001)) * influence * 0.32;
    vec3 swirlWake = cross(normalize(toMouse + vec3(0.001)), vec3(0.0, 1.0, 0.25)) * influence * 0.24;
    pos += push + swirlWake;
  }

  vPosition = pos;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  vDepth = -mvPosition.z;

  gl_Position = projectionMatrix * mvPosition;

  // Adaptive particle size with subtle depth scaling
  float baseSize = 4.0 + 2.4 * sin(aIndex * 50.0);
  if (aGroup < 0.25) {
    baseSize *= 1.3;
  }
  baseSize *= (1.0 + 0.35 * vPulse);

  gl_PointSize = (baseSize / -mvPosition.z) * uDevicePixelRatio * 1.35;
  gl_PointSize = clamp(gl_PointSize, 1.2, 16.0);
}
`;

export const neuralFragmentShader = `
precision highp float;

uniform vec3 uLightPosition;
uniform vec3 uFillLightPosition;

varying vec3 vPosition;
varying float vDepth;
varying float vGroup;
varying float vIndex;
varying float vPulse;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  if (dist > 0.5) {
    discard;
  }

  // Soft spherical normal reconstruction for studio lighting
  float z = sqrt(max(0.0, 0.25 - dist * dist)) * 2.0;
  vec3 normal = normalize(vec3(coord.x * 2.0, -coord.y * 2.0, z));

  vec3 lightDir = normalize(uLightPosition - vPosition);
  vec3 fillDir = normalize(uFillLightPosition - vPosition);
  vec3 viewDir = vec3(0.0, 0.0, 1.0);

  float diff = max(dot(normal, lightDir), 0.0) * 0.65;
  float fill = max(dot(normal, fillDir), 0.0) * 0.25;
  float ambient = 0.35;

  vec3 halfVec = normalize(lightDir + viewDir);
  float spec = pow(max(dot(normal, halfVec), 0.0), 18.0) * 0.35;
  float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.2) * 0.4;

  // Premium Light-Mode Studio Palette (Warm Grayscale & Platinum Pearl)
  vec3 colDeepCharcoal = vec3(0.12, 0.12, 0.13); // #1E1E21 - crisp structural anchors
  vec3 colGraphite     = vec3(0.25, 0.24, 0.23); // #403E3B - warm dark
  vec3 colTitanium     = vec3(0.48, 0.46, 0.44); // #7A7570 - midtone metallic
  vec3 colPearl        = vec3(0.72, 0.70, 0.67); // #B8B3AB - soft platinum pearl
  vec3 colHighlight    = vec3(0.92, 0.90, 0.86); // #EBE6DC - ivory specular highlight

  vec3 baseColor;
  if (vGroup < 0.25) {
    baseColor = mix(colDeepCharcoal, colGraphite, vIndex);
  } else if (vGroup < 0.7) {
    baseColor = mix(colGraphite, colTitanium, sin(vIndex * 6.28) * 0.5 + 0.5);
  } else {
    baseColor = mix(colTitanium, colPearl, cos(vIndex * 6.28) * 0.5 + 0.5);
  }

  // Active neural signals brighten subtly as they travel through
  baseColor = mix(baseColor, colHighlight, vPulse * 0.35);

  vec3 finalColor = baseColor * (diff + fill + ambient) + colHighlight * spec + colPearl * fresnel;
  
  float edgeAlpha = smoothstep(0.5, 0.38, dist);
  float depthFade = clamp(1.0 - (vDepth - 3.0) * 0.12, 0.4, 1.0);

  float alpha = edgeAlpha * depthFade;
  if (vGroup < 0.25) {
    alpha *= 0.92;
  } else {
    alpha *= 0.78;
  }

  gl_FragColor = vec4(finalColor, alpha);
}
`;
