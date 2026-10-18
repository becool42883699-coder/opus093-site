/* 恐竜の WebGL 描画(シェーダー + テクスチャ設定)。window.TrexDino.makeRenderer を公開する。
   中身はチャット版(reference/trex-home-single-file.html)のものをそのまま切り出した。仕組みは ../../CLAUDE.md を参照。 */
(()=>{
const IW=1672, IH=941;
const GEO=window.TrexDino.GEO;
const VS=`attribute vec2 p;varying vec2 vUV;void main(){vUV=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0.,1.);}`;
const FS=`precision highp float;
varying vec2 vUV;
uniform sampler2D tBase,tEye,tMask,tCol;
uniform vec2 uImg,uHead,uEyeA,uMaskA,uColA;
uniform vec2 uCL,uCR,uOffL,uOffR,uIrisOL,uIrisOR,uHlOL,uHlOR,uMaskOL,uMaskOR;
uniform vec4 uBoxL,uBoxR;
uniform float uRL,uRR,uBlink;
uniform vec3 uLidL,uLidR;
float ell(vec2 p,vec2 c,vec2 r){vec2 q=(p-c)/r;return sqrt(max(0.,1.-dot(q,q)));}
vec2 disp(vec2 P){
  float w=smoothstep(712.,775.,P.x)*(1.-smoothstep(1520.,1660.,P.x))*smoothstep(0.,45.,P.y)*(1.-smoothstep(650.,815.,P.y));
  float z=.6*ell(P,vec2(1100.,460.),vec2(380.,430.))+.4*ell(P,vec2(1090.,640.),vec2(240.,180.));
  return w*(uHead*4.+uHead*16.*(z-.25));
}
bool inr(vec2 u){return u.x>=0.&&u.y>=0.&&u.x<=1.&&u.y<=1.;}
vec2 mk(vec2 bp,vec2 mo){ return texture2D(tMask,(mo+bp)/uMaskA).rg; }   // r = opening, g = eyelid shading
vec3 eye(vec3 col,vec2 Q,vec2 C,float R,vec4 box,vec2 off,vec2 io,vec2 ho,vec2 mo,float row,vec3 lid){
  vec2 bs=box.zw-box.xy; vec2 bp=Q-box.xy;
  if(bp.x<0.||bp.y<0.||bp.x>bs.x||bp.y>bs.y) return col;
  vec2 mm=mk(bp,mo); float m=mm.r;
  if(m<=0.) return col;
  float S=2.*R+1.;
  vec2 q=Q-(C+off); float d=length(off);
  if(d>.01){vec2 u=off/d;float ct=sqrt(max(.3,1.-(d/88.)*(d/88.)));float par=dot(q,u);q+=u*(par/ct-par);}
  vec2 ip=q+R+.5;
  vec4 ir=(ip.x>=0.&&ip.y>=0.&&ip.x<=S&&ip.y<=S)?texture2D(tEye,(io+ip)/uEyeA):vec4(0.);
  vec2 bp0=bp-off; float ao0=(bp0.x>=0.&&bp0.y>=0.&&bp0.x<=bs.x&&bp0.y<=bs.y)?mk(bp0,mo).g:.45;
  ir.rgb*=clamp(mm.g/max(ao0,.05),.35,1.25);
  vec3 e=col*(1.-ir.a)+ir.rgb;
  vec2 hp=Q-(C+off*.9)+R+.5, gp=Q-C+R+.5;
  float hlv=(hp.x>=0.&&hp.y>=0.&&hp.x<=S&&hp.y<=S)?texture2D(tEye,(ho+hp)/uEyeA).r:0.;
  float glv=(gp.x>=0.&&gp.y>=0.&&gp.x<=S&&gp.y<=S)?texture2D(tEye,(ho+gp)/uEyeA).g:0.;
  e+=vec3(hlv*.97+glv)*ir.a;
  // blink: upper lid comes down most of the way, lower lid rises to meet it
  if(uBlink>0.){
    vec2 tb=texture2D(tCol,vec2((bp.x+.5)/uColA.x,(row+.5)/uColA.y)).rg;
    float top=tb.r*bs.y, bot=tb.g*bs.y, by=bp.y, h=max(bot-top,1.);
    float up=top+uBlink*(h*.8+1.5), lo=bot-uBlink*(h*.2+1.5);
    if(by<up){
      float gg=clamp((up-by)/max(up-top,1.),0.,1.);
      float shd=.62+.5*sin(3.1416*clamp(gg*.85+.08,0.,1.));
      shd*=1.-.45*smoothstep(.72,1.,gg);
      vec3 l=lid*shd+vec3(.16)*exp(-pow((gg-.32)/.13,2.));
      e=mix(l*.22,l,smoothstep(0.,2.6,up-by));
    } else if(by>lo){
      float gg=clamp((by-lo)/max(bot-lo,1.),0.,1.);
      vec3 l=lid*(.7+.25*sin(3.1416*clamp(gg*.8+.1,0.,1.)))*(1.-.4*smoothstep(.6,1.,gg));
      e=mix(l*.3,l,smoothstep(0.,2.,by-lo));
    }
  }
  return mix(col,e,m);
}
void main(){
  vec2 P=vUV*uImg; vec2 Q=P-disp(P);
  vec3 col=texture2D(tBase,Q/uImg).rgb;
  col=eye(col,Q,uCL,uRL,uBoxL,uOffL,uIrisOL,uHlOL,uMaskOL,0.,uLidL);
  col=eye(col,Q,uCR,uRR,uBoxR,uOffR,uIrisOR,uHlOR,uMaskOR,1.,uLidR);
  gl_FragColor=vec4(col,1.);
}`;

function makeRenderer(gl,I){
  function sh(t,s){const o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);if(!gl.getShaderParameter(o,gl.COMPILE_STATUS))throw gl.getShaderInfoLog(o);return o;}
  const pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,VS));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,FS));gl.linkProgram(pr);gl.useProgram(pr);
  const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  const loc=gl.getAttribLocation(pr,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
  const U=n=>gl.getUniformLocation(pr,n);
  gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL,gl.NONE);
  let unit=0;
  function tex(name,src,premul){
    const t=gl.createTexture(),u=unit++;gl.activeTexture(gl.TEXTURE0+u);gl.bindTexture(gl.TEXTURE_2D,t);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!!premul);
    for(const [p,v] of [[gl.TEXTURE_MIN_FILTER,gl.LINEAR],[gl.TEXTURE_MAG_FILTER,gl.LINEAR],[gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE]])gl.texParameteri(gl.TEXTURE_2D,p,v);
    if(src.data) gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,src.w,src.h,0,gl.RGBA,gl.UNSIGNED_BYTE,src.data);
    else gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,src);
    gl.uniform1i(U(name),u);
  }
  const cw=Math.max(GEO.L.top.length,GEO.R.top.length), cd=new Uint8Array(cw*2*4);
  ['L','R'].forEach((k,row)=>{const g=GEO[k],h=g.box[3]-g.box[1];for(let i=0;i<g.top.length;i++){const o=(row*cw+i)*4;cd[o]=Math.round(g.top[i]/h*255);cd[o+1]=Math.round(g.bot[i]/h*255);cd[o+3]=255;}});
  tex('tBase',I.base,false); tex('tEye',I.eye,true); tex('tMask',I.mask,false); tex('tCol',{w:cw,h:2,data:cd},false);
  gl.uniform2f(U('uImg'),IW,IH); gl.uniform2f(U('uEyeA'),...GEO.atlas.eye); gl.uniform2f(U('uMaskA'),...GEO.atlas.mask); gl.uniform2f(U('uColA'),cw,2);
  for(const k of ['L','R']){const g=GEO[k];gl.uniform2f(U('uC'+k),g.cx+.5,g.cy+.5);gl.uniform1f(U('uR'+k),g.r);gl.uniform4f(U('uBox'+k),...g.box);
    gl.uniform2f(U('uIrisO'+k),...g.atlas.iris);gl.uniform2f(U('uHlO'+k),...g.atlas.hl);gl.uniform2f(U('uMaskO'+k),...g.atlas.mask);gl.uniform3f(U('uLid'+k),...g.lid);}
  const uHead=U('uHead'),uOffL=U('uOffL'),uOffR=U('uOffR'),uBlink=U('uBlink');
  function rangeAt(tab,a){const n=tab.length;const f=((a/(2*Math.PI))%1+1)%1*n;const i=Math.floor(f)%n,j=(i+1)%n,t=f-Math.floor(f);return tab[i]*(1-t)+tab[j]*t;}
  return function draw(hx,hy,ex,ey,blink,gain){
    gl.uniform2f(uHead,hx,hy);
    const em=Math.min(1,Math.hypot(ex,ey)),ea=Math.atan2(ey,ex);
    for(const [k,u] of [['L',uOffL],['R',uOffR]]){const lim=rangeAt(GEO[k].range,ea)*(gain||.85)*em;gl.uniform2f(u,Math.cos(ea)*lim,Math.sin(ea)*lim);}
    gl.uniform1f(uBlink,blink||0); gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
  };
}

window.TrexDino.makeRenderer=makeRenderer;
window.TrexDino.IMG={w:IW,h:IH};
})();
