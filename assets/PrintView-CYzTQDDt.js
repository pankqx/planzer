import{A as e,D as t,E as n,G as r,H as i,L as a,M as o,N as s,P as c,V as l,a as u,i as d,j as f,k as p,r as m,s as h}from"./store-DuCjqhYe.js";import{o as g,u as _}from"./index-7v53PB-Z.js";var v=r(i(),1),y=l(),b=[.22,1,.36,1],x={ivory:{bg:`#f7f1e3`,paper2:`#efe6d1`,ink:`#1c1a2c`,soft:`rgba(28,26,44,.55)`,faint:`rgba(28,26,44,.16)`,gold:`#a7803c`,gold2:`#c9a35e`},midnight:{bg:`#090c1d`,paper2:`#0f1330`,ink:`#f2eadb`,soft:`rgba(242,234,219,.6)`,faint:`rgba(230,201,138,.18)`,gold:`#e6c98a`,gold2:`#b8914a`}};function S(){let e=h(e=>e.year),r=h(e=>e.goals),i=h(e=>e.tasks),a=h(e=>e.habits),o=h(e=>e.notes),s=h(e=>e.setNote),l=h(e=>e.setSheet),[d,f]=(0,v.useState)(`ivory`),[p,m]=(0,v.useState)(()=>new Set(n.map((e,t)=>t))),[g,b]=(0,v.useState)(1);(0,v.useEffect)(()=>{let e=()=>b(Math.min(1,(innerWidth-32)/794));return e(),addEventListener(`resize`,e),()=>removeEventListener(`resize`,e)},[]);let S=x[d],w=(0,v.useMemo)(()=>r.filter(t=>t.year===e),[r,e]),E=(0,v.useMemo)(()=>n.map((t,n)=>u({year:e,goals:r,tasks:i,habits:a},n)),[e,r,i,a]),A=o.owner?.name||``,M=e=>m(t=>{let n=new Set(t);return n.has(e)?n.delete(e):n.add(e),n});return(0,y.jsxs)(_.div,{className:`pv`,initial:{opacity:0},animate:{opacity:1},exit:{opacity:0},transition:{duration:.8},style:{"--p-bg":S.bg,"--p-bg2":S.paper2,"--p-ink":S.ink,"--p-soft":S.soft,"--p-faint":S.faint,"--p-gold":S.gold,"--p-gold2":S.gold2},children:[(0,y.jsx)(`style`,{children:j}),(0,y.jsxs)(`div`,{className:`pv-bar`,children:[(0,y.jsxs)(`div`,{children:[(0,y.jsx)(`div`,{className:`eyebrow`,children:`Print studio`}),(0,y.jsxs)(`div`,{style:{fontFamily:`var(--display)`,fontSize:22,letterSpacing:`.06em`,marginTop:2},children:[`Your `,e,` planner, on paper`]})]}),(0,y.jsxs)(`div`,{className:`pv-ctrls`,children:[(0,y.jsx)(`div`,{className:`pv-seg`,children:Object.keys(x).map(e=>(0,y.jsx)(`button`,{className:d===e?`on`:``,onClick:()=>f(e),children:e},e))}),(0,y.jsx)(`div`,{className:`pv-months`,children:t.map((e,t)=>(0,y.jsx)(`button`,{className:p.has(t)?`on`:``,onClick:()=>M(t),title:`Include ${n[t]}`,children:e[0]},e))}),(0,y.jsx)(`button`,{className:`btn primary small`,onClick:()=>print(),children:`⎙ Print / Save PDF`}),(0,y.jsx)(`button`,{className:`btn small`,onClick:()=>l(null),children:`Close`})]})]}),(0,y.jsx)(`div`,{className:`pv-scroll scroll`,children:(0,y.jsxs)(`div`,{className:`pv-stack`,style:{zoom:g},children:[(0,y.jsx)(C,{i:0,children:(0,y.jsx)(T,{year:e,owner:A,setOwner:e=>s(`owner`,{name:e}),th:S,goals:w})}),(0,y.jsx)(C,{i:1,children:(0,y.jsx)(D,{year:e,stats:E,goals:w,th:S})}),w.length>0&&(0,y.jsx)(C,{i:2,children:(0,y.jsx)(O,{year:e,goals:w,th:S})}),n.map((t,n)=>p.has(n)?(0,y.jsx)(C,{i:3+n,children:(0,y.jsx)(k,{year:e,m:n,stats:E[n],habits:a,focus:o[c(e,n)]?.focus,th:S})},n):null)]})})]})}function C({children:e,i:t}){return(0,y.jsx)(_.section,{className:`page`,initial:{opacity:0,y:60,rotateX:18,scale:.94},animate:{opacity:1,y:0,rotateX:0,scale:1},transition:{duration:1.1,ease:b,delay:.2+Math.min(t,5)*.1},children:e})}function w({children:e,folio:t,title:n}){return(0,y.jsxs)(`div`,{className:`pg`,children:[(0,y.jsx)(`div`,{className:`pg-rule top`}),(0,y.jsxs)(`div`,{className:`pg-head`,children:[(0,y.jsx)(`span`,{children:`Planzer`}),(0,y.jsx)(`span`,{children:n})]}),e,(0,y.jsxs)(`div`,{className:`pg-foot`,children:[(0,y.jsx)(`span`,{children:`✦`}),(0,y.jsx)(`span`,{children:t}),(0,y.jsx)(`span`,{children:`✦`})]})]})}function T({year:e,owner:t,setOwner:n,th:r,goals:i}){return(0,y.jsxs)(`div`,{className:`pg cover`,children:[(0,y.jsx)(`div`,{className:`cover-ring`,children:(0,y.jsxs)(`svg`,{viewBox:`-100 -100 200 200`,width:`100%`,height:`100%`,children:[Array.from({length:365},(e,t)=>{let n=Math.PI/2-t/365*Math.PI*2,i=t%30==0?6:2.4;return(0,y.jsx)(`line`,{x1:Math.cos(n)*94,y1:-Math.sin(n)*94,x2:Math.cos(n)*(94-i),y2:-Math.sin(n)*(94-i),stroke:r.gold,strokeWidth:`.25`,opacity:`.7`},t)}),(0,y.jsx)(`circle`,{r:`96`,fill:`none`,stroke:r.gold,strokeWidth:`.35`}),(0,y.jsx)(`circle`,{r:`84`,fill:`none`,stroke:r.gold,strokeWidth:`.2`,opacity:`.6`})]})}),(0,y.jsxs)(`div`,{className:`cover-mid`,children:[(0,y.jsxs)(`svg`,{viewBox:`0 0 100 60`,width:`180`,height:`108`,"aria-hidden":!0,children:[(0,y.jsx)(`path`,{d:g,fill:`none`,stroke:r.gold,strokeWidth:`3.2`,strokeLinejoin:`round`}),(0,y.jsx)(`circle`,{cx:`88`,cy:`30`,r:`4`,fill:r.gold})]}),(0,y.jsx)(`div`,{className:`cover-word`,children:`PLANZER`}),(0,y.jsx)(`div`,{className:`cover-rule`}),(0,y.jsx)(`div`,{className:`cover-year`,children:a(e)}),(0,y.jsxs)(`div`,{className:`cover-sub`,children:[`The Endless Year Planner · `,e]})]}),(0,y.jsxs)(`div`,{className:`cover-owner`,children:[(0,y.jsx)(`div`,{className:`cap`,children:`Kept by`}),(0,y.jsx)(`input`,{value:t,onChange:e=>n(e.target.value),placeholder:`Your name`,maxLength:40}),(0,y.jsxs)(`div`,{className:`cap`,style:{marginTop:6},children:[i.length,` intentions · 12 worlds · `,new Date(e,1,29).getDate()===29?366:365,` days`]})]})]})}function E({year:t,m:r,stats:i}){let a=s(t,r),o=new Set(i.tasks.map(e=>e.date));return(0,y.jsxs)(`div`,{className:`mini`,children:[(0,y.jsxs)(`div`,{className:`mini-h`,children:[(0,y.jsx)(`span`,{className:`r`,children:p[r+1]}),(0,y.jsx)(`span`,{children:n[r]})]}),(0,y.jsxs)(`div`,{className:`mini-g`,children:[e.map(e=>(0,y.jsx)(`b`,{children:e[0]},e)),a.map((e,n)=>(0,y.jsx)(`span`,{className:e&&o.has(f(t,r,e))?`busy`:``,children:e||``},n))]}),(0,y.jsx)(`div`,{className:`mini-ms`,children:i.milestones.slice(0,2).map(e=>(0,y.jsxs)(`div`,{children:[(0,y.jsx)(`i`,{style:{background:m(e.goal.category).color}}),e.title]},e.id))})]})}function D({year:e,stats:t,goals:r}){return(0,y.jsxs)(w,{folio:`ii`,title:`The year at a glance · ${e}`,children:[(0,y.jsxs)(`h1`,{className:`pg-title`,children:[e,` `,(0,y.jsx)(`em`,{children:`at a glance`})]}),(0,y.jsx)(`div`,{className:`glance`,children:n.map((n,r)=>(0,y.jsx)(E,{year:e,m:r,stats:t[r]},r))}),r.length>0&&(0,y.jsx)(`div`,{className:`spans`,children:r.slice(0,7).map(e=>(0,y.jsxs)(`div`,{className:`span-row`,children:[(0,y.jsx)(`span`,{className:`span-name`,children:e.title}),(0,y.jsx)(`span`,{className:`span-bar`,children:n.map((t,n)=>(0,y.jsx)(`i`,{style:{background:n>=e.start&&n<=e.end?m(e.category).color:`transparent`,borderColor:n>=e.start&&n<=e.end?m(e.category).color:void 0}},n))})]},e.id))})]})}function O({year:e,goals:r}){return(0,y.jsxs)(w,{folio:`iii`,title:`Intentions`,children:[(0,y.jsxs)(`h1`,{className:`pg-title`,children:[`Intentions `,(0,y.jsxs)(`em`,{children:[`for `,e]})]}),(0,y.jsx)(`div`,{className:`goals`,children:r.slice(0,8).map(e=>{let r=m(e.category);return(0,y.jsxs)(`div`,{className:`goal`,children:[(0,y.jsxs)(`div`,{className:`goal-h`,children:[(0,y.jsx)(`span`,{className:`glyph`,style:{color:r.color},children:r.glyph}),(0,y.jsx)(`span`,{className:`goal-t`,children:e.title}),(0,y.jsxs)(`span`,{className:`goal-p`,children:[Math.round(d(e)*100),`%`]})]}),(0,y.jsxs)(`div`,{className:`goal-meta`,children:[r.name,` · `,n[e.start],` — `,n[e.end],e.why?(0,y.jsxs)(`em`,{children:[` · “`,e.why,`”`]}):null]}),(0,y.jsx)(`div`,{className:`goal-ms`,children:e.milestones.slice().sort((e,t)=>e.month-t.month).slice(0,6).map(e=>(0,y.jsxs)(`div`,{children:[(0,y.jsx)(`span`,{className:`box ${e.done?`on`:``}`}),(0,y.jsx)(`b`,{children:t[e.month]}),` `,e.title]},e.id))})]},e.id)})})]})}function k({year:t,m:r,stats:i,habits:c,focus:l}){let u=s(t,r),d=o(t,r),m={};for(let e of i.tasks.slice().sort((e,t)=>(e.time||``).localeCompare(t.time||``)))(m[e.date]||=[]).push(e);return(0,y.jsxs)(w,{folio:a(r+4).toLowerCase(),title:`${n[r]} ${t}`,children:[(0,y.jsxs)(`div`,{className:`mp-head`,children:[(0,y.jsxs)(`div`,{children:[(0,y.jsxs)(`div`,{className:`cap`,children:[`Month `,p[r+1],` · `,d,` days`]}),(0,y.jsx)(`h1`,{className:`mp-title`,children:n[r]})]}),(0,y.jsxs)(`div`,{className:`mp-focus`,children:[(0,y.jsx)(`div`,{className:`cap`,children:`Intention`}),(0,y.jsx)(`div`,{className:`mp-line`,children:l||``})]})]}),(0,y.jsxs)(`div`,{className:`mp-cal`,children:[e.map(e=>(0,y.jsx)(`b`,{children:e},e)),u.map((e,n)=>(0,y.jsx)(`div`,{className:`mp-cell ${e?``:`empty`}`,children:e&&(0,y.jsxs)(y.Fragment,{children:[(0,y.jsx)(`span`,{className:`n`,children:e}),(m[f(t,r,e)]||[]).slice(0,3).map(e=>(0,y.jsxs)(`span`,{className:`t`,children:[e.time&&(0,y.jsxs)(`em`,{children:[e.time,` `]}),e.title]},e.id))]})},n))]}),(0,y.jsxs)(`div`,{className:`mp-cols`,children:[(0,y.jsxs)(`div`,{children:[(0,y.jsx)(`div`,{className:`cap`,children:`Milestones`}),i.milestones.slice(0,6).map(e=>(0,y.jsxs)(`div`,{className:`mp-ms`,children:[(0,y.jsx)(`span`,{className:`box ${e.done?`on`:``}`}),e.title,(0,y.jsxs)(`small`,{children:[` — `,e.goal.title]})]},e.id)),i.milestones.length===0&&(0,y.jsx)(`div`,{className:`mp-lines`}),(0,y.jsx)(`div`,{className:`cap`,style:{marginTop:`5mm`},children:`Notes`}),(0,y.jsx)(`div`,{className:`mp-lines`})]}),(0,y.jsxs)(`div`,{children:[(0,y.jsx)(`div`,{className:`cap`,children:`Habit tracker`}),(0,y.jsxs)(`div`,{className:`mp-hab`,style:{gridTemplateColumns:`24mm repeat(${d}, 1fr)`},children:[c.slice(0,6).map(e=>(0,y.jsx)(A,{h:e,year:t,m:r,n:d},e.id)),Array.from({length:Math.max(0,4-c.length)},(e,n)=>(0,y.jsx)(A,{h:{name:``,log:{}},year:t,m:r,n:d},`e${n}`))]})]})]})]})}function A({h:e,year:t,m:n,n:r}){return(0,y.jsxs)(y.Fragment,{children:[(0,y.jsx)(`span`,{className:`hn`,children:e.name}),Array.from({length:r},(r,i)=>(0,y.jsx)(`span`,{className:`hd ${e.log[f(t,n,i+1)]?`on`:``}`},i))]})}var j=`
.pv { position: fixed; inset: 0; z-index: 80; display: flex; flex-direction: column; background: radial-gradient(120% 90% at 50% 0%, rgba(3,4,10,.2), rgba(3,4,10,.75)); }
.pv-bar { margin: 18px auto 0; width: min(1100px, calc(100% - 24px)); padding: 14px 20px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; border-radius: 22px; }
.pv-ctrls { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.pv-seg { display: flex; padding: 3px; border-radius: 999px; border: 1px solid var(--line); }
.pv-seg button { padding: 7px 14px; border-radius: 999px; font-size: 10.5px; letter-spacing: .2em; text-transform: uppercase; color: var(--mute); transition: all .4s; }
.pv-seg button.on { background: rgba(230,201,138,.16); color: var(--gold-hi); }
.pv-months { display: flex; gap: 3px; }
.pv-months button { width: 24px; height: 24px; border-radius: 50%; font-size: 10px; color: var(--faint); border: 1px solid var(--line); transition: all .3s; }
.pv-months button.on { color: #140e04; background: var(--gold); border-color: var(--gold); }
.pv-scroll { flex: 1; padding: 28px 16px 120px; perspective: 1400px; }
.pv-stack { display: flex; flex-direction: column; align-items: center; gap: 30px; }
.page { width: 210mm; height: 297mm; flex: none; background: var(--p-bg); color: var(--p-ink); box-shadow: 0 50px 90px -30px rgba(0,0,0,.85), 0 0 0 1px rgba(230,201,138,.12); position: relative; overflow: hidden; transform-origin: 50% 0; }
.page::after { content: ''; position: absolute; inset: 0; pointer-events: none; background: radial-gradient(120% 80% at 30% 0%, rgba(255,255,255,.05), transparent 60%); }
.pg { position: absolute; inset: 0; padding: 16mm 15mm 14mm; display: flex; flex-direction: column; font-family: var(--sans); }
.pg-head { display: flex; justify-content: space-between; font-size: 7pt; letter-spacing: .32em; text-transform: uppercase; color: var(--p-gold); margin-bottom: 7mm; }
.pg-rule.top { position: absolute; left: 15mm; right: 15mm; top: 12.5mm; height: .3mm; background: linear-gradient(90deg, transparent, var(--p-gold), transparent); opacity: .6; }
.pg-foot { margin-top: auto; display: flex; justify-content: center; gap: 6mm; font-family: var(--serif); font-style: italic; font-size: 10pt; color: var(--p-gold); padding-top: 4mm; }
.pg-title { font-family: var(--display); font-weight: 400; font-size: 34pt; letter-spacing: .03em; line-height: 1; margin-bottom: 7mm; }
.pg-title em { font-family: var(--serif); font-weight: 300; font-size: 22pt; color: var(--p-gold); }
.cap { font-size: 6.6pt; letter-spacing: .3em; text-transform: uppercase; color: var(--p-gold); margin-bottom: 2.5mm; }
.box { display: inline-block; width: 3mm; height: 3mm; border: .25mm solid var(--p-gold); border-radius: 50%; margin-right: 2.2mm; vertical-align: -.4mm; flex: none; }
.box.on { background: var(--p-gold); }

.cover { align-items: center; justify-content: center; text-align: center; background: radial-gradient(70% 50% at 50% 45%, var(--p-bg2), var(--p-bg)); }
.cover-ring { position: absolute; left: 50%; top: 45%; width: 175mm; height: 175mm; transform: translate(-50%, -50%); }
.cover-mid { position: relative; display: flex; flex-direction: column; align-items: center; margin-top: -14mm; }
.cover-word { font-family: var(--display); font-size: 42pt; letter-spacing: .42em; margin: 8mm -0.42em 0 0; }
.cover-rule { width: 50mm; height: .3mm; background: linear-gradient(90deg, transparent, var(--p-gold), transparent); margin: 5mm 0; }
.cover-year { font-family: var(--display); font-size: 26pt; letter-spacing: .3em; color: var(--p-gold); margin-right: -.3em; }
.cover-sub { font-family: var(--serif); font-style: italic; font-size: 13pt; color: var(--p-soft); margin-top: 3mm; }
.cover-owner { position: absolute; bottom: 22mm; left: 0; right: 0; display: flex; flex-direction: column; align-items: center; }
.cover-owner input { background: none; border: 0; border-bottom: .3mm solid var(--p-faint); text-align: center; font-family: var(--serif); font-size: 18pt; color: var(--p-ink); width: 90mm; outline: none; padding: 1mm; }
.cover-owner input::placeholder { color: var(--p-faint); font-style: italic; }

.glance { display: grid; grid-template-columns: repeat(4, 1fr); gap: 5mm 6mm; }
.mini-h { display: flex; gap: 2mm; align-items: baseline; font-family: var(--serif); font-size: 11.5pt; border-bottom: .25mm solid var(--p-faint); padding-bottom: 1mm; margin-bottom: 1.5mm; }
.mini-h .r { font-size: 7pt; letter-spacing: .1em; color: var(--p-gold); width: 6mm; }
.mini-g { display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; font-size: 6pt; row-gap: .6mm; }
.mini-g b { font-weight: 600; color: var(--p-gold); font-size: 5.2pt; }
.mini-g span { color: var(--p-soft); border-radius: 50%; line-height: 3.4mm; }
.mini-g span.busy { color: var(--p-ink); background: color-mix(in srgb, var(--p-gold) 22%, transparent); font-weight: 600; }
.mini-ms { margin-top: 1.4mm; font-size: 6pt; color: var(--p-soft); min-height: 7mm; }
.mini-ms div { display: flex; gap: 1.4mm; align-items: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.5; }
.mini-ms i { width: 1.6mm; height: 1.6mm; border-radius: 50%; flex: none; }
.spans { margin-top: 6mm; border-top: .25mm solid var(--p-faint); padding-top: 4mm; }
.span-row { display: flex; align-items: center; gap: 4mm; padding: 1.1mm 0; font-size: 7.5pt; }
.span-name { width: 58mm; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: var(--serif); font-size: 10pt; }
.span-bar { flex: 1; display: grid; grid-template-columns: repeat(12, 1fr); gap: .8mm; }
.span-bar i { height: 2mm; border-radius: 1mm; border: .2mm solid var(--p-faint); }

.goals { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm 8mm; }
.goal { border-top: .3mm solid var(--p-faint); padding-top: 3mm; }
.goal-h { display: flex; align-items: baseline; gap: 2.5mm; }
.goal-h .glyph { font-size: 11pt; }
.goal-t { flex: 1; font-family: var(--serif); font-size: 13.5pt; line-height: 1.15; }
.goal-p { font-family: var(--display); font-size: 13pt; color: var(--p-gold); }
.goal-meta { font-size: 6.8pt; letter-spacing: .12em; text-transform: uppercase; color: var(--p-soft); margin: 1.4mm 0 2.4mm; }
.goal-meta em { text-transform: none; letter-spacing: 0; font-family: var(--serif); font-size: 9pt; }
.goal-ms div { display: flex; align-items: center; font-size: 7.6pt; padding: .8mm 0; color: var(--p-ink); }
.goal-ms b { font-weight: 600; font-size: 6.2pt; letter-spacing: .14em; color: var(--p-gold); width: 8mm; flex: none; text-transform: uppercase; }

.mp-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 10mm; margin-bottom: 5mm; }
.mp-title { font-family: var(--display); font-weight: 400; font-size: 44pt; line-height: .9; }
.mp-focus { flex: 1; max-width: 85mm; }
.mp-line { font-family: var(--serif); font-style: italic; font-size: 12pt; border-bottom: .25mm solid var(--p-faint); min-height: 8mm; padding-bottom: 1mm; }
.mp-cal { display: grid; grid-template-columns: repeat(7, 1fr); border-top: .3mm solid var(--p-gold); }
.mp-cal > b { font-size: 6.2pt; letter-spacing: .24em; text-transform: uppercase; color: var(--p-gold); padding: 1.6mm 1.5mm; font-weight: 500; }
.mp-cell { height: 21mm; border-top: .2mm solid var(--p-faint); border-left: .2mm solid var(--p-faint); padding: 1.3mm 1.5mm; display: flex; flex-direction: column; gap: .5mm; overflow: hidden; }
.mp-cell:nth-child(7n+1) { border-left: 0; }
.mp-cell.empty { background: color-mix(in srgb, var(--p-ink) 3%, transparent); }
.mp-cell .n { font-family: var(--serif); font-size: 12pt; line-height: 1; margin-bottom: .6mm; }
.mp-cell .t { font-size: 5.6pt; line-height: 1.3; color: var(--p-ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mp-cell .t em { font-style: normal; color: var(--p-gold); }
.mp-cols { display: grid; grid-template-columns: 1fr 1.25fr; gap: 8mm; margin-top: 6mm; }
.mp-ms { display: flex; align-items: center; font-size: 7.8pt; padding: .9mm 0; }
.mp-ms small { color: var(--p-soft); font-size: 6.5pt; margin-left: 1mm; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mp-lines { height: 24mm; background: repeating-linear-gradient(transparent 0 5.7mm, var(--p-faint) 5.7mm calc(5.7mm + .25mm)); }
.mp-hab { display: grid; gap: .7mm; align-items: center; }
.mp-hab .hn { font-size: 6.4pt; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-right: 1mm; font-family: var(--serif); font-size: 8.5pt; min-height: 3mm; border-bottom: .2mm solid var(--p-faint); }
.mp-hab .hd { aspect-ratio: 1; border-radius: 50%; border: .2mm solid var(--p-faint); }
.mp-hab .hd.on { background: var(--p-gold); border-color: var(--p-gold); }

@media print {
  @page { size: A4; margin: 0; }
  html, body, #root { height: auto !important; overflow: visible !important; background: none !important; }
  body { cursor: auto; }
  #root > *:not(.pv), .pv-bar { display: none !important; }
  .pv, .pv * { opacity: 1 !important; }
  .pv { position: static !important; background: none !important; }
  .pv-scroll { overflow: visible !important; padding: 0 !important; perspective: none; }
  .pv-stack { gap: 0 !important; zoom: 1 !important; }
  .page { box-shadow: none !important; transform: none !important; contain: strict; break-after: page; page-break-after: always; }
  .cover-ring circle, .cover-ring line { opacity: .7 !important; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  .cover-owner input:placeholder-shown { visibility: hidden; }
}
`;export{S as default};