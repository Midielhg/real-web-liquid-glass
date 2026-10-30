// WebGL liquid glass renderer.
// One WebGL pass draws every glass shape: a bevel height field bends the picture under each control through a
// biconvex lens, with a colour fringe, fresnel, a lit inner stroke, an inner glow and a soft contact shadow.
// Shader adapted from @ybouane/liquidglass (MIT, github.com/ybouane/liquidglass). See NOTICE.

const MAX = 10;
const VERT = `attribute vec2 a_pos;varying vec2 v_uv;void main(){v_uv=vec2((a_pos.x+1.0)*0.5,(1.0-a_pos.y)*0.5);gl_Position=vec4(a_pos,0.0,1.0);}`;
const FRAG = `precision highp float;varying vec2 v_uv;uniform sampler2D u_bgTex;uniform vec2 u_css;uniform float u_dpr;uniform int u_count;
uniform vec4 u_rect[${MAX}];uniform float u_rad[${MAX}];uniform vec4 u_tints[${MAX}];
uniform float u_refract;uniform float u_chroma;uniform float u_edgeHL;uniform float u_spec;uniform float u_fresnel;uniform float u_sat;uniform float u_zRadius;uniform float u_brightness;uniform float u_shadowAlpha;uniform float u_shadowSpread;uniform float u_shadowOffY;
float rrSDF(vec2 p,vec2 b,float r){vec2 q=abs(p)-b+vec2(r);return min(max(q.x,q.y),0.0)+length(max(q,vec2(0.0)))-r;}
float bevelHeight(float d,float zR){if(d<=0.0)return 0.0;if(d>=zR)return zR;return sqrt(d*(2.0*zR-d));}
vec4 glass(vec2 local,vec2 half_,float r,vec2 screenUV,vec2 res,vec4 tint){
 float sdf=rrSDF(local,half_,r);
 if(sdf>0.0){float sdfShadow=rrSDF(local-vec2(0.0,u_shadowOffY),half_,r);float d=max(sdfShadow-1.0,0.0);float spread=max(u_shadowSpread,1.0);float falloff=1.0/(spread*spread);
  float outerShadow=exp(-d*d*falloff)*0.65;float contactShadow=exp(-d*0.08/max(spread*0.04,0.01))*0.35;return vec4(0.0,0.0,0.0,(outerShadow+contactShadow)*u_shadowAlpha);}
 float mask=1.0-smoothstep(-1.5,0.5,sdf);float maxD=min(half_.x,half_.y);float inside=-sdf;float edge=smoothstep(maxD*0.35,0.0,inside);
 float zR=u_zRadius;float e=2.0;float hC=bevelHeight(inside,zR);
 float hR=bevelHeight(-rrSDF(local+vec2(e,0.0),half_,r),zR);float hL=bevelHeight(-rrSDF(local-vec2(e,0.0),half_,r),zR);
 float hU=bevelHeight(-rrSDF(local+vec2(0.0,e),half_,r),zR);float hD=bevelHeight(-rrSDF(local-vec2(0.0,e),half_,r),zR);
 vec2 hGrad=vec2(hR-hL,hU-hD)/(2.0*e);vec3 N=normalize(vec3(-hGrad,1.0));float depth=smoothstep(0.0,zR,inside);
 vec2 pxToUV=vec2(1.0)/res;float refrPow=1.0-1.0/1.5;float thickNorm=(hC*2.0)/max(zR*2.0,1.0);
 vec2 exitRefr=hGrad*refrPow;vec2 entryRefr=hGrad*refrPow;vec2 refrPx=(exitRefr+entryRefr+entryRefr*thickNorm*0.5)*u_refract*30.0;
 refrPx+=(-local/max(half_,vec2(1.0)))*u_refract*4.0*depth;vec2 base=screenUV+refrPx*pxToUV;
 float caS=u_chroma*18.0*(edge*0.7+0.3)*2.0;vec2 caD=N.xy*caS*pxToUV;
 vec3 col=vec3(texture2D(u_bgTex,base+caD).r,texture2D(u_bgTex,base).g,texture2D(u_bgTex,base-caD).b);
 col*=1.0+u_brightness;float lum=dot(col,vec3(0.299,0.587,0.114));col=mix(vec3(lum),col,1.0+u_sat);col*=1.0+0.06*depth;
 float fres=pow(1.0-abs(N.z),4.0)*u_fresnel;vec3 V=vec3(0.0,0.0,1.0);float totalSpec=0.0;
 if(u_spec>0.0){vec3 H1=normalize(normalize(vec3(0.4,0.7,1.0))+V);vec3 H2=normalize(normalize(vec3(-0.3,-0.5,1.0))+V);vec3 L3=normalize(vec3(0.1,0.3,1.0));vec3 H4=normalize(normalize(vec3(0.0,0.9,0.4))+V);
  totalSpec=(pow(max(dot(N,H1),0.0),90.0)+pow(max(dot(N,H2),0.0),50.0)*0.3+pow(max(dot(N,L3),0.0),6.0)*0.1+pow(max(dot(N,H4),0.0),120.0)*0.6)*u_spec;}
 float borderWidth=1.5;float innerStroke=smoothstep(-borderWidth-1.0,-borderWidth,sdf)*(1.0-smoothstep(-1.0,0.0,sdf));innerStroke*=0.4+0.6*(0.5+0.5*(-local.y/half_.y));
 float rim=edge*u_edgeHL*0.22;float innerGlow=smoothstep(5.0,0.0,-sdf)*u_edgeHL*0.15;float envRefl=(N.y*0.5+0.5)*fres*0.08;
 vec3 fin=col+vec3(totalSpec)+vec3(rim+innerGlow)+vec3(innerStroke*u_edgeHL*0.55)+vec3(envRefl);fin=mix(fin,vec3(1.0),fres*0.2);fin=mix(fin,tint.rgb,tint.a);
 return vec4(fin,mask);}
void main(){vec2 res=u_css*u_dpr;vec2 p=v_uv*res;vec2 suv=p/res;vec4 acc=vec4(0.0);
 for(int i=0;i<${MAX};i++){if(i>=u_count)break;vec4 R=u_rect[i]*u_dpr;vec2 half_=R.zw*0.5;vec2 local=p-(R.xy+half_);
  if(abs(local.x)>half_.x+24.0*u_dpr||abs(local.y)>half_.y+24.0*u_dpr)continue;float r=min(u_rad[i]*u_dpr,min(half_.x,half_.y));
  vec4 g=glass(local,half_,r,suv,res,u_tints[i]);vec3 rgb=clamp(g.rgb,0.0,1.0);acc=vec4(rgb*g.a,g.a)+acc*(1.0-g.a);}
 gl_FragColor=acc;}`;

export function createGlassRenderer(canvas) {
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false });
  if (!gl) return null; // fall back to frosted CSS
  const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o);
    if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog); gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, "a_pos"); gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
  for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
  const u = (n) => gl.getUniformLocation(prog, n); gl.uniform1i(u("u_bgTex"), 0);
  const rects = new Float32Array(MAX * 4), radii = new Float32Array(MAX), tints = new Float32Array(MAX * 4);
  let lost = false; canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); lost = true; });
  return {
    get lost() { return lost; },
    draw(scene, lenses, dpr, o) {
      if (lost) return;
      const w = scene.width, h = scene.height;
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, w, h);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, scene);
      gl.uniform1f(u("u_refract"), o.refraction); gl.uniform1f(u("u_chroma"), o.chromAberration);
      gl.uniform1f(u("u_edgeHL"), o.edgeHighlight); gl.uniform1f(u("u_spec"), o.specular);
      gl.uniform1f(u("u_fresnel"), o.fresnel); gl.uniform1f(u("u_sat"), o.saturation); gl.uniform1f(u("u_brightness"), o.brightness);
      gl.uniform1f(u("u_shadowAlpha"), o.shadowOpacity); gl.uniform1f(u("u_zRadius"), o.zRadius * dpr);
      gl.uniform1f(u("u_shadowSpread"), o.shadowSpread * dpr); gl.uniform1f(u("u_shadowOffY"), o.shadowOffsetY * dpr);
      const n = Math.min(MAX, lenses.length); rects.fill(0); tints.fill(0);
      for (let i = 0; i < n; i++) { const l = lenses[i]; rects.set([l.x, l.y, l.width, l.height], i * 4); radii[i] = l.radius; tints.set(l.tint || [0, 0, 0, 0], i * 4); }
      gl.uniform2f(u("u_css"), w / dpr, h / dpr); gl.uniform1f(u("u_dpr"), dpr); gl.uniform1i(u("u_count"), n);
      gl.uniform4fv(u("u_rect"), rects); gl.uniform1fv(u("u_rad"), radii); gl.uniform4fv(u("u_tints"), tints);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
  };
}

export const WEBGL = { refraction: 0.6, chromAberration: 0.04, edgeHighlight: 0.2, fresnel: 0.35, specular: 0,
  saturation: 0.12, brightness: 0, zRadius: 14 / 3, shadowOpacity: 0.12, shadowSpread: 10, shadowOffsetY: 2 };
export const CLEAR_TINT = [0, 0, 0, 0.14];
export const MENU_LOOK = { blur: 26, saturation: 110, tint: [0.42, 0.42, 0.45, 0.3] };
