/**
 * AvatarSVG — Premium Fashion Illustration Avatar
 * Each hair style (straight/wavy/curly/afro/ponytail/bun/braids/updo)
 * renders a distinct, recognisable silhouette.
 */
import type { UserProfile, HairStyle } from '@/types/profile';
import { SKIN_TONES, HAIR_COLORS } from '@/types/profile';

interface Props {
  profile: UserProfile;
  width?: number;
}

// ─── helpers ───────────────────────────────────────────
function lighten(hex: string, a: number) { return adj(hex, a); }
function darken (hex: string, a: number) { return adj(hex, -a); }
function adj(hex: string, a: number) {
  const n = parseInt(hex.replace('#',''), 16);
  const cl = (v: number) => Math.max(0, Math.min(255, v));
  const r = cl((n >> 16) + a), g = cl(((n >> 8) & 0xff) + a), b = cl((n & 0xff) + a);
  return `#${[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('')}`;
}

// ─── face shapes ───────────────────────────────────────
const FACE_SHAPE: Record<string,[number,number]> = {
  oval:[34,42], round:[38,38], square:[36,34],
  heart:[36,40], diamond:[30,44], oblong:[28,48],
};

// ─── body silhouettes ───────────────────────────────────
const BODY: Record<string,string> = {
  hourglass:'M 56 145 C 34 151 26 172 32 198 C 38 222 54 232 54 246 L 52 302 C 52 312 64 320 100 320 C 136 320 148 312 148 302 L 146 246 C 146 232 162 222 168 198 C 174 172 166 151 144 145 C 132 141 118 138 100 137 C 82 138 68 141 56 145 Z',
  pear:     'M 66 145 C 48 151 40 170 43 197 C 46 220 58 232 54 248 L 48 302 C 48 313 61 320 100 320 C 139 320 152 313 152 302 L 146 248 C 142 232 154 220 157 197 C 160 170 152 151 134 145 C 123 141 112 138 100 137 C 88 138 77 141 66 145 Z',
  apple:    'M 54 145 C 32 149 24 174 32 202 C 40 226 58 232 56 250 L 58 302 C 58 312 68 320 100 320 C 132 320 142 312 142 302 L 144 250 C 142 232 160 226 168 202 C 176 174 168 149 146 145 C 134 141 118 138 100 137 C 82 138 66 141 54 145 Z',
  rectangle:'M 64 145 C 46 151 38 170 40 197 C 42 222 54 234 54 250 L 54 302 C 54 312 64 320 100 320 C 136 320 146 312 146 302 L 146 250 C 146 234 158 222 160 197 C 162 170 154 151 136 145 C 125 141 113 138 100 137 C 87 138 75 141 64 145 Z',
  inverted: 'M 52 145 C 28 149 20 170 28 197 C 36 220 54 230 58 248 L 62 302 C 62 312 72 320 100 320 C 128 320 138 312 138 302 L 142 248 C 146 230 164 220 172 197 C 180 170 172 149 148 145 C 136 141 119 138 100 137 C 81 138 64 141 52 145 Z',
};

// hair drop per length
const HAIR_DROP: Record<string,number> = {
  bald:0, short:14, ear:30, shoulder:68, long:110, verylong:160,
};

export default function AvatarSVG({ profile, width = 140 }: Props) {
  const skin = SKIN_TONES[profile.skinTone];
  const hair = HAIR_COLORS[profile.hairColor];
  const h    = Math.round(width * 1.65);
  const uid  = `av_${profile.id.slice(-6)}`;

  const drop   = HAIR_DROP[profile.hairLength] ?? 40;
  const [fx,fy]= FACE_SHAPE[profile.faceShape] ?? [34,42];
  const body   = BODY[profile.bodyType] ?? BODY.rectangle;

  const skinH = lighten(skin.hex, 18);
  const skinL = skin.shadow;
  const hairH = lighten(hair.hex, 26);
  const hairD = darken(hair.hex, 14);

  const cx = 100, cy = 80;
  const hStyle = profile.hairStyle as HairStyle;
  const hLen   = profile.hairLength;

  return (
    <svg width={width} height={h} viewBox="0 0 200 330"
         fill="none" xmlns="http://www.w3.org/2000/svg"
         style={{ display:'block' }}>
      <defs>
        <radialGradient id={`${uid}sk`} cx="45%" cy="35%" r="65%">
          <stop offset="0%"   stopColor={skinH}/>
          <stop offset="55%"  stopColor={skin.hex}/>
          <stop offset="100%" stopColor={skinL}/>
        </radialGradient>
        <linearGradient id={`${uid}hr`} x1="0.3" y1="0" x2="0.7" y2="1">
          <stop offset="0%"   stopColor={hairH}/>
          <stop offset="60%"  stopColor={hair.hex}/>
          <stop offset="100%" stopColor={hairD}/>
        </linearGradient>
        <linearGradient id={`${uid}bd`} x1=".5" y1="0" x2=".5" y2="1">
          <stop offset="0%"   stopColor="rgba(220,215,255,0.18)"/>
          <stop offset="100%" stopColor="rgba(160,140,220,0.08)"/>
        </linearGradient>
        <filter id={`${uid}sh`}>
          <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="rgba(0,0,0,0.28)"/>
        </filter>
      </defs>

      {/* Body */}
      <g filter={`url(#${uid}sh)`}>
        <path d={body} fill={`url(#${uid}bd)`}
          stroke={skinL} strokeWidth="1.5" strokeOpacity="0.5"/>
      </g>

      {/* Hair BACK layer (behind head) */}
      <HairBack cx={cx} cy={cy} fx={fx} fy={fy} drop={drop}
        style={hStyle} len={hLen} gradId={`${uid}hr`} hairHex={hair.hex}/>

      {/* Ear */}
      <ellipse cx={cx-fx+2} cy={cy+4} rx={5} ry={8} fill={`url(#${uid}sk)`} opacity=".85"/>
      <ellipse cx={cx+fx-2} cy={cy+4} rx={5} ry={8} fill={`url(#${uid}sk)`} opacity=".85"/>

      {/* Neck */}
      <rect x={cx-9} y={cy+fy-3} width={18} height={24} rx={7}
        fill={`url(#${uid}sk)`}/>

      {/* Head */}
      <ellipse cx={cx} cy={cy} rx={fx} ry={fy}
        fill={`url(#${uid}sk)`} filter={`url(#${uid}sh)`}/>

      {/* Cheek blush */}
      <ellipse cx={cx-fx*.55} cy={cy+8} rx={9} ry={6}
        fill="rgba(255,130,130,0.11)"/>
      <ellipse cx={cx+fx*.55} cy={cy+8} rx={9} ry={6}
        fill="rgba(255,130,130,0.11)"/>

      {/* Nose */}
      <path d={`M ${cx-3} ${cy+10} Q ${cx+1} ${cy+17} ${cx+3} ${cy+10}`}
        stroke={skinL} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity=".4"/>

      {/* Lips */}
      <path d={`M ${cx-9} ${cy+22} Q ${cx-4} ${cy+26} ${cx} ${cy+24} Q ${cx+4} ${cy+26} ${cx+9} ${cy+22}`}
        stroke={darken(skin.hex,30)} strokeWidth="1.8" strokeLinecap="round" fill="none" opacity=".65"/>
      <path d={`M ${cx-7} ${cy+22} Q ${cx} ${cy+20} ${cx+7} ${cy+22}`}
        stroke={darken(skin.hex,18)} strokeWidth="1.2" strokeLinecap="round" fill="none" opacity=".35"/>

      {/* Eyes */}
      <FashionEye cx={cx-14} cy={cy-4} dir={-1} skinL={skinL} hairHex={hair.hex}/>
      <FashionEye cx={cx+14} cy={cy-4} dir={1}  skinL={skinL} hairHex={hair.hex}/>

      {/* Eyebrows */}
      <path d={`M ${cx-22} ${cy-18} Q ${cx-14} ${cy-23} ${cx-6} ${cy-19}`}
        stroke={darken(hair.hex,5)} strokeWidth="2.2" strokeLinecap="round" fill="none" opacity=".85"/>
      <path d={`M ${cx+6}  ${cy-19} Q ${cx+14} ${cy-23} ${cx+22} ${cy-18}`}
        stroke={darken(hair.hex,5)} strokeWidth="2.2" strokeLinecap="round" fill="none" opacity=".85"/>

      {/* Hair FRONT layer (on top of head) */}
      <HairFront cx={cx} cy={cy} fx={fx} fy={fy} drop={drop}
        style={hStyle} len={hLen} gradId={`${uid}hr`} hairH={hairH} hairHex={hair.hex}/>

      {/* Collarbone */}
      <path d={`M ${cx-20} ${cy+fy+20} Q ${cx} ${cy+fy+24} ${cx+20} ${cy+fy+20}`}
        stroke={skinL} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity=".2"/>
    </svg>
  );
}

// ─── Hair BACK (rendered behind head) ───────────────────────────────────────
function HairBack({ cx,cy,fx,fy,drop,style,len,gradId,hairHex }:{
  cx:number;cy:number;fx:number;fy:number;drop:number;
  style:HairStyle;len:string;gradId:string;hairHex:string;
}) {
  if (len === 'bald') return null;

  const g = `url(#${gradId})`;
  const hairColor = hairHex;
  const d = darken(hairHex, 12);

  switch(style) {
    case 'afro':
      return (
        <ellipse cx={cx} cy={cy-8} rx={fx+26} ry={fy+22}
          fill={g} opacity=".92"/>
      );

    case 'ponytail':
      // Hair gathered tight, ponytail behind
      return (<g>
        <ellipse cx={cx} cy={cy} rx={fx+4} ry={fy*0.55}
          fill={g} opacity=".9"/>
        {/* Ponytail strand */}
        <path d={`M ${cx+fx+2} ${cy-8} Q ${cx+fx+18} ${cy+drop*0.4} ${cx+fx+8} ${cy+drop}`}
          stroke={d} strokeWidth={14} strokeLinecap="round" fill="none" opacity=".85"/>
        <path d={`M ${cx+fx+4} ${cy-4} Q ${cx+fx+14} ${cy+drop*0.35} ${cx+fx+6} ${cy+drop-10}`}
          stroke={g} strokeWidth={8} strokeLinecap="round" fill="none" opacity=".6"/>
      </g>);

    case 'bun':
      return (<g>
        {/* Back puff */}
        <ellipse cx={cx} cy={cy-fy-8} rx={fx*0.7} ry={14}
          fill={g} opacity=".9"/>
      </g>);

    case 'braids':
      return (<g>
        {/* Left braid */}
        {drop > 20 && (<path
          d={`M ${cx-fx+2} ${cy} Q ${cx-fx-6} ${cy+drop*0.3} ${cx-fx-2} ${cy+drop*0.6} Q ${cx-fx-8} ${cy+drop*0.8} ${cx-fx-4} ${cy+drop}`}
          stroke={d} strokeWidth={10} strokeLinecap="round" fill="none" opacity=".9"
          strokeDasharray="16 2"/>)}
        {/* Right braid */}
        {drop > 20 && (<path
          d={`M ${cx+fx-2} ${cy} Q ${cx+fx+6} ${cy+drop*0.3} ${cx+fx+2} ${cy+drop*0.6} Q ${cx+fx+8} ${cy+drop*0.8} ${cx+fx+4} ${cy+drop}`}
          stroke={d} strokeWidth={10} strokeLinecap="round" fill="none" opacity=".9"
          strokeDasharray="16 2"/>)}
      </g>);

    case 'updo':
      // Most hair gathered up, minimal back
      return (
        <ellipse cx={cx} cy={cy-fy+4} rx={fx+4} ry={fy*0.45}
          fill={g} opacity=".88"/>
      );

    case 'curly':
      return (<g>
        {/* Curly cloud sides */}
        {[-1,1].map(s=>(
          <g key={s}>
            {[0,.35,.65,1].map((t,i)=>{
              const yy = cy - fy*0.3 + drop*t;
              const xx = cx + s*(fx+10+Math.sin(i)*4);
              return <circle key={i} cx={xx} cy={yy} r={10+Math.cos(i*0.9)*3}
                fill={g} opacity=".75"/>;
            })}
          </g>
        ))}
      </g>);

    case 'wavy':
      return (<g>
        {/* Wavy side panels */}
        {[-1,1].map(s=>(
          <path key={s}
            d={`M ${cx+s*(fx+2)} ${cy-8} 
                Q ${cx+s*(fx+14)} ${cy+drop*.18} ${cx+s*(fx+4)} ${cy+drop*.35}
                Q ${cx+s*(fx+16)} ${cy+drop*.53} ${cx+s*(fx+4)} ${cy+drop*.7}
                Q ${cx+s*(fx+16)} ${cy+drop*.85} ${cx+s*(fx+6)} ${cy+drop}`}
            stroke={g} strokeWidth={14} strokeLinecap="round" fill="none" opacity=".82"/>
        ))}
      </g>);

    default: // straight
      return (<g>
        {/* Straight side panels */}
        {[-1,1].map(s=>(
          <path key={s}
            d={`M ${cx+s*(fx+2)} ${cy-6} Q ${cx+s*(fx+6)} ${cy+drop*.5} ${cx+s*(fx+4)} ${cy+drop}`}
            stroke={g} strokeWidth={13} strokeLinecap="round" fill="none" opacity=".82"/>
        ))}
      </g>);
  }
}

// ─── Hair FRONT (rendered on top of head) ────────────────────────────────────
function HairFront({ cx,cy,fx,fy,drop,style,len,gradId,hairH,hairHex }:{
  cx:number;cy:number;fx:number;fy:number;drop:number;
  style:HairStyle;len:string;gradId:string;hairH:string;hairHex:string;
}) {
  if (len === 'bald') return null;

  const g = `url(#${gradId})`;

  const CrownBase = () => (
    <ellipse cx={cx} cy={cy-fy*.62} rx={fx+3} ry={fy*.52}
      fill={g} opacity=".95"/>
  );

  switch(style) {
    case 'afro':
      return (<g>
        <ellipse cx={cx} cy={cy-fy*.5} rx={fx+24} ry={fy*.7+16}
          fill={g} opacity=".9"/>
        {/* Afro texture dots */}
        {[...Array(8)].map((_,i)=>{
          const a = (i/8)*Math.PI*2;
          return <circle key={i}
            cx={cx+(fx+12)*Math.cos(a)*0.9}
            cy={(cy-fy*.3)+(fy*.5+10)*Math.sin(a)*0.85}
            r={8} fill={hairH} opacity=".35"/>;
        })}
        {/* Shine */}
        <ellipse cx={cx-8} cy={cy-fy-8} rx={14} ry={8} fill={hairH} opacity=".2"/>
      </g>);

    case 'ponytail':
      return (<g>
        <CrownBase/>
        {/* Smooth crown, no side flow */}
        <ellipse cx={cx} cy={cy-fy*.7} rx={fx-2} ry={fy*.4}
          fill={g} opacity=".92"/>
        {/* Hair tie */}
        <ellipse cx={cx+fx+6} cy={cy-6} rx={5} ry={4}
          fill={darken(hairHex,18)} opacity=".9"/>
        <ellipse cx={cx+fx+6} cy={cy-6} rx={3} ry={2.5}
          fill={hairH} opacity=".4"/>
      </g>);

    case 'bun':
      return (<g>
        <CrownBase/>
        {/* Bun circle on top */}
        <circle cx={cx} cy={cy-fy-16} r={18}
          fill={g} opacity=".95"/>
        <circle cx={cx} cy={cy-fy-16} r={12}
          fill={darken(hairHex,8)} opacity=".4"/>
        {/* Bun spiral */}
        <circle cx={cx} cy={cy-fy-16} r={7} fill={hairH} opacity=".3"/>
        <circle cx={cx} cy={cy-fy-16} r={3} fill={hairH} opacity=".25"/>
        {/* Bobby pin hint */}
        <path d={`M ${cx-10} ${cy-fy-10} L ${cx-4} ${cy-fy-14}`}
          stroke={darken(hairHex,20)} strokeWidth="1.5" opacity=".6"/>
      </g>);

    case 'braids':
      return (<g>
        <CrownBase/>
        {/* Centre part */}
        <path d={`M ${cx} ${cy-fy*.9} L ${cx} ${cy-fy*.3}`}
          stroke={darken(hairHex,5)} strokeWidth="2" opacity=".35"/>
        {/* Textured crown */}
        <ellipse cx={cx} cy={cy-fy*.6} rx={fx-2} ry={fy*.38}
          fill={g} opacity=".9"/>
      </g>);

    case 'updo':
      return (<g>
        {/* Swept-up gathered knot */}
        <ellipse cx={cx} cy={cy-fy-.5} rx={fx+2} ry={fy*.55}
          fill={g} opacity=".93"/>
        {/* Top knot */}
        <ellipse cx={cx} cy={cy-fy-14} rx={fx*.65} ry={16}
          fill={g} opacity=".9"/>
        <ellipse cx={cx} cy={cy-fy-14} rx={fx*.38} ry={9}
          fill={darken(hairHex,8)} opacity=".35"/>
        <ellipse cx={cx-6} cy={cy-fy-18} rx={7} ry={5} fill={hairH} opacity=".22"/>
      </g>);

    case 'curly':
      return (<g>
        {/* Wide curly crown */}
        <ellipse cx={cx} cy={cy-fy*.5} rx={fx+16} ry={fy*.68+12}
          fill={g} opacity=".88"/>
        {/* Curl cluster on crown */}
        {[[-14,-8],[0,-14],[14,-8],[-8,2],[8,2]].map(([dx,dy],i)=>(
          <circle key={i} cx={cx+dx} cy={cy-fy*.6+dy} r={9+i%2*3}
            fill={darken(hairHex,4)} opacity=".45"/>
        ))}
        <ellipse cx={cx-8} cy={cy-fy-.8} rx={10} ry={6} fill={hairH} opacity=".2"/>
      </g>);

    case 'wavy':
      return (<g>
        <CrownBase/>
        {/* Wave fringe */}
        <path d={`M ${cx-fx+4} ${cy-fy*.55} 
            Q ${cx-fx*.5} ${cy-fy*.85} ${cx} ${cy-fy*.7}
            Q ${cx+fx*.5} ${cy-fy*.55} ${cx+fx-4} ${cy-fy*.7}`}
          fill={g} opacity=".9"/>
        <ellipse cx={cx-8} cy={cy-fy*.85} rx={10} ry={6} fill={hairH} opacity=".2"/>
      </g>);

    default: // straight
      return (<g>
        <CrownBase/>
        {/* Straight blunt fringe */}
        {['short','ear'].includes(len) ? null : (
          <path d={`M ${cx-fx+6} ${cy-fy*.48} L ${cx+fx-6} ${cy-fy*.48}`}
            stroke={g} strokeWidth={8} strokeLinecap="round" opacity=".7"/>
        )}
        <ellipse cx={cx-8} cy={cy-fy*.82} rx={10} ry={6} fill={hairH} opacity=".22"/>
      </g>);
  }
}

// ─── Eye ─────────────────────────────────────────────────────────────────────
function FashionEye({ cx,cy,dir,skinL,hairHex }:{
  cx:number;cy:number;dir:number;skinL:string;hairHex:string;
}) {
  return (<g>
    <path d={`M ${cx-8} ${cy} Q ${cx} ${cy-7} ${cx+8} ${cy}`}
      fill="white" stroke={skinL} strokeWidth="0.5"/>
    <path d={`M ${cx-8} ${cy} Q ${cx} ${cy+4} ${cx+8} ${cy}`} fill="white"/>
    <ellipse cx={cx} cy={cy} rx={5} ry={5.5} fill="#1e1008"/>
    <ellipse cx={cx} cy={cy} rx={3.5} ry={4} fill="#3a2818"/>
    <circle cx={cx+dir*1.5} cy={cy-1.5} r={1.5} fill="white" opacity=".92"/>
    <circle cx={cx-dir*1}   cy={cy+1}   r={.8}  fill="white" opacity=".5"/>
    <path d={`M ${cx-8} ${cy} Q ${cx} ${cy-7} ${cx+8} ${cy}`}
      stroke="#100800" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    {/* Lashes */}
    {[-5,-1,3,7].map((dx,i)=>(
      <line key={i}
        x1={cx+dx} y1={cy-(i%2===0?6.5:5.5)}
        x2={cx+dx} y2={cy-(i%2===0?9:8)}
        stroke="#100800" strokeWidth="1" strokeLinecap="round" opacity=".8"/>
    ))}
  </g>);
}
