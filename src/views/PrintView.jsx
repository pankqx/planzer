import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useStore, monthStats, catOf, goalProgress } from '../store'
import { MONTHS, MONTHS_SHORT, WEEKDAYS, ROMAN, monthGrid, dateKey, monthKey, daysIn, toRoman } from '../lib/date'
import Mark from '../ui/Mark'
import { ease } from '../ui/bits'

const THEMES = {
  ivory: { bg: '#f7f1e3', paper2: '#efe6d1', ink: '#1c1a2c', soft: 'rgba(28,26,44,.55)', faint: 'rgba(28,26,44,.16)', gold: '#a7803c', gold2: '#c9a35e' },
  midnight: { bg: '#090c1d', paper2: '#0f1330', ink: '#f2eadb', soft: 'rgba(242,234,219,.6)', faint: 'rgba(230,201,138,.18)', gold: '#e6c98a', gold2: '#b8914a' },
}

export default function PrintView() {
  const year = useStore((s) => s.year)
  const goals = useStore((s) => s.goals)
  const tasks = useStore((s) => s.tasks)
  const habits = useStore((s) => s.habits)
  const notes = useStore((s) => s.notes)
  const setNote = useStore((s) => s.setNote)
  const [theme, setTheme] = useState('ivory')
  const [months, setMonths] = useState(() => new Set(MONTHS.map((_, i) => i)))
  const [zoom, setZoom] = useState(1)
  useEffect(() => {
    const r = () => setZoom(Math.min(1, (innerWidth - 32) / 794))
    r()
    addEventListener('resize', r)
    return () => removeEventListener('resize', r)
  }, [])
  const th = THEMES[theme]
  const yearGoals = useMemo(() => goals.filter((g) => g.year === year), [goals, year])
  const stats = useMemo(() => MONTHS.map((_, m) => monthStats({ year, goals, tasks, habits }, m)), [year, goals, tasks, habits])
  const owner = notes.owner?.name || ''
  const toggleMonth = (m) =>
    setMonths((s) => {
      const n = new Set(s)
      n.has(m) ? n.delete(m) : n.add(m)
      return n
    })

  return (
    <motion.div className="pv" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }} style={{ '--p-bg': th.bg, '--p-bg2': th.paper2, '--p-ink': th.ink, '--p-soft': th.soft, '--p-faint': th.faint, '--p-gold': th.gold, '--p-gold2': th.gold2 }}>
      <style>{PRINT_CSS}</style>
      <div className="pv-bar glass">
        <div>
          <div className="eyebrow">Print studio</div>
          <div style={{ fontFamily: 'var(--display)', fontSize: 22, letterSpacing: '.06em', marginTop: 2 }}>Your {year} planner, on paper</div>
        </div>
        <div className="pv-ctrls">
          <div className="pv-seg">
            {Object.keys(THEMES).map((k) => (
              <button key={k} className={theme === k ? 'on' : ''} onClick={() => setTheme(k)}>
                {k}
              </button>
            ))}
          </div>
          <div className="pv-months">
            {MONTHS_SHORT.map((m, i) => (
              <button key={m} className={months.has(i) ? 'on' : ''} onClick={() => toggleMonth(i)} title={`Include ${MONTHS[i]}`}>
                {m[0]}
              </button>
            ))}
          </div>
          <button className="btn solid small" onClick={() => print()}>
            ❏ Print / Save PDF
          </button>
        </div>
      </div>

      <div className="pv-scroll scroll">
        <div className="pv-stack" style={{ zoom }}>
          <Page i={0}>
            <Cover year={year} owner={owner} setOwner={(name) => setNote('owner', { name })} th={th} goals={yearGoals} />
          </Page>
          <Page i={1}>
            <YearGlance year={year} stats={stats} goals={yearGoals} th={th} />
          </Page>
          {yearGoals.length > 0 && (
            <Page i={2}>
              <GoalsPage year={year} goals={yearGoals} th={th} />
            </Page>
          )}
          {MONTHS.map((_, m) =>
            months.has(m) ? (
              <Page key={m} i={3 + m}>
                <MonthPage year={year} m={m} stats={stats[m]} habits={habits} focus={notes[monthKey(year, m)]?.focus} th={th} />
              </Page>
            ) : null,
          )}
        </div>
      </div>
    </motion.div>
  )
}

function Page({ children, i }) {
  return (
    <motion.section className="page" initial={{ opacity: 0, y: 60, rotateX: 18, scale: 0.94 }} animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }} transition={{ duration: 1.1, ease, delay: 0.2 + Math.min(i, 5) * 0.1 }}>
      {children}
    </motion.section>
  )
}

function Frame({ children, folio, title }) {
  return (
    <div className="pg">
      <div className="pg-rule top" />
      <div className="pg-head">
        <span>Planzer</span>
        <span>{title}</span>
      </div>
      {children}
      <div className="pg-foot">
        <span>✦</span>
        <span>{folio}</span>
        <span>✦</span>
      </div>
    </div>
  )
}

function Cover({ year, owner, setOwner, th, goals }) {
  return (
    <div className="pg cover">
      <div className="cover-ring">
        <svg viewBox="-100 -100 200 200" width="100%" height="100%">
          {Array.from({ length: 365 }, (_, d) => {
            const a = Math.PI / 2 - (d / 365) * Math.PI * 2
            const l = d % 30 === 0 ? 6 : 2.4
            return <line key={d} x1={Math.cos(a) * 94} y1={-Math.sin(a) * 94} x2={Math.cos(a) * (94 - l)} y2={-Math.sin(a) * (94 - l)} stroke={th.gold} strokeWidth=".25" opacity=".7" />
          })}
          <circle r="96" fill="none" stroke={th.gold} strokeWidth=".35" />
          <circle r="84" fill="none" stroke={th.gold} strokeWidth=".2" opacity=".6" />
        </svg>
      </div>
      <div className="cover-mid">
        <Mark size={150} stroke={th.gold} glow={false} />
        <div className="cover-word">PLANZER</div>
        <div className="cover-rule" />
        <div className="cover-year">{toRoman(year)}</div>
        <div className="cover-sub">The Celestial Year Planner · {year}</div>
      </div>
      <div className="cover-owner">
        <div className="cap">Kept by</div>
        <input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Your name" maxLength={40} />
        <div className="cap" style={{ marginTop: 6 }}>
          {goals.length} intentions · 12 worlds · {new Date(year, 1, 29).getDate() === 29 ? 366 : 365} days
        </div>
      </div>
    </div>
  )
}

function MiniMonth({ year, m, stats }) {
  const cells = monthGrid(year, m)
  const busy = new Set(stats.tasks.map((x) => x.date))
  return (
    <div className="mini">
      <div className="mini-h">
        <span className="r">{ROMAN[m + 1]}</span>
        <span>{MONTHS[m]}</span>
      </div>
      <div className="mini-g">
        {WEEKDAYS.map((w) => (
          <b key={w}>{w[0]}</b>
        ))}
        {cells.map((d, i) => (
          <span key={i} className={d && busy.has(dateKey(year, m, d)) ? 'busy' : ''}>
            {d || ''}
          </span>
        ))}
      </div>
      <div className="mini-ms">
        {stats.milestones.slice(0, 2).map((x) => (
          <div key={x.id}>
            <i style={{ background: catOf(x.goal.category).color }} />
            {x.title}
          </div>
        ))}
      </div>
    </div>
  )
}

function YearGlance({ year, stats, goals }) {
  return (
    <Frame folio="ii" title={`The year at a glance · ${year}`}>
      <h1 className="pg-title">
        {year} <em>at a glance</em>
      </h1>
      <div className="glance">
        {MONTHS.map((_, m) => (
          <MiniMonth key={m} year={year} m={m} stats={stats[m]} />
        ))}
      </div>
      {goals.length > 0 && (
        <div className="spans">
          {goals.slice(0, 7).map((g) => (
            <div key={g.id} className="span-row">
              <span className="span-name">{g.title}</span>
              <span className="span-bar">
                {MONTHS.map((_, m) => (
                  <i key={m} style={{ background: m >= g.start && m <= g.end ? catOf(g.category).color : 'transparent', borderColor: m >= g.start && m <= g.end ? catOf(g.category).color : undefined }} />
                ))}
              </span>
            </div>
          ))}
        </div>
      )}
    </Frame>
  )
}

function GoalsPage({ year, goals }) {
  return (
    <Frame folio="iii" title="Intentions">
      <h1 className="pg-title">
        Intentions <em>for {year}</em>
      </h1>
      <div className="goals">
        {goals.slice(0, 8).map((g) => {
          const cat = catOf(g.category)
          return (
            <div key={g.id} className="goal">
              <div className="goal-h">
                <span className="glyph" style={{ color: cat.color }}>
                  {cat.glyph}
                </span>
                <span className="goal-t">{g.title}</span>
                <span className="goal-p">{Math.round(goalProgress(g) * 100)}%</span>
              </div>
              <div className="goal-meta">
                {cat.name} · {MONTHS[g.start]} — {MONTHS[g.end]}
                {g.why ? <em> · “{g.why}”</em> : null}
              </div>
              <div className="goal-ms">
                {g.milestones
                  .slice()
                  .sort((a, b) => a.month - b.month)
                  .slice(0, 6)
                  .map((x) => (
                    <div key={x.id}>
                      <span className={`box ${x.done ? 'on' : ''}`} />
                      <b>{MONTHS_SHORT[x.month]}</b> {x.title}
                    </div>
                  ))}
              </div>
            </div>
          )
        })}
      </div>
    </Frame>
  )
}

function MonthPage({ year, m, stats, habits, focus }) {
  const cells = monthGrid(year, m)
  const n = daysIn(year, m)
  const byDay = {}
  for (const x of stats.tasks.slice().sort((a, b) => (a.time || '').localeCompare(b.time || ''))) (byDay[x.date] ||= []).push(x)
  return (
    <Frame folio={toRoman(m + 4).toLowerCase()} title={`${MONTHS[m]} ${year}`}>
      <div className="mp-head">
        <div>
          <div className="cap">
            Month {ROMAN[m + 1]} · {n} days
          </div>
          <h1 className="mp-title">{MONTHS[m]}</h1>
        </div>
        <div className="mp-focus">
          <div className="cap">Intention</div>
          <div className="mp-line">{focus || ''}</div>
        </div>
      </div>
      <div className="mp-cal">
        {WEEKDAYS.map((w) => (
          <b key={w}>{w}</b>
        ))}
        {cells.map((d, i) => (
          <div key={i} className={`mp-cell ${d ? '' : 'empty'}`}>
            {d && (
              <>
                <span className="n">{d}</span>
                {(byDay[dateKey(year, m, d)] || []).slice(0, 3).map((x) => (
                  <span key={x.id} className="t">
                    {x.time && <em>{x.time} </em>}
                    {x.title}
                  </span>
                ))}
              </>
            )}
          </div>
        ))}
      </div>
      <div className="mp-cols">
        <div>
          <div className="cap">Milestones</div>
          {stats.milestones.slice(0, 6).map((x) => (
            <div key={x.id} className="mp-ms">
              <span className={`box ${x.done ? 'on' : ''}`} />
              {x.title}
              <small> — {x.goal.title}</small>
            </div>
          ))}
          {stats.milestones.length === 0 && <div className="mp-lines" />}
          <div className="cap" style={{ marginTop: '5mm' }}>
            Notes
          </div>
          <div className="mp-lines" />
        </div>
        <div>
          <div className="cap">Habit tracker</div>
          <div className="mp-hab" style={{ gridTemplateColumns: `24mm repeat(${n}, 1fr)` }}>
            {habits.slice(0, 6).map((h) => (
              <Fragment key={h.id} h={h} year={year} m={m} n={n} />
            ))}
            {Array.from({ length: Math.max(0, 4 - habits.length) }, (_, k) => (
              <Fragment key={`e${k}`} h={{ name: '', log: {} }} year={year} m={m} n={n} />
            ))}
          </div>
        </div>
      </div>
    </Frame>
  )
}

function Fragment({ h, year, m, n }) {
  return (
    <>
      <span className="hn">{h.name}</span>
      {Array.from({ length: n }, (_, k) => (
        <span key={k} className={`hd ${h.log[dateKey(year, m, k + 1)] ? 'on' : ''}`} />
      ))}
    </>
  )
}

const PRINT_CSS = `
.pv { position: fixed; inset: 0; z-index: 25; display: flex; flex-direction: column; background: radial-gradient(120% 90% at 50% 0%, rgba(3,4,10,.2), rgba(3,4,10,.75)); }
.pv-bar { margin: 88px auto 0; width: min(1100px, calc(100% - 24px)); padding: 14px 20px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; border-radius: 22px; }
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
  .cosmos, canvas, .hdr, .dock, .grain, .vignette, .cur-dot, .cur-ring, .pv-bar { display: none !important; }
  .pv, .pv * { opacity: 1 !important; }
  .pv { position: static !important; background: none !important; }
  .pv-scroll { overflow: visible !important; padding: 0 !important; perspective: none; }
  .pv-stack { gap: 0 !important; zoom: 1 !important; }
  .page { box-shadow: none !important; transform: none !important; contain: strict; break-after: page; page-break-after: always; }
  .cover-ring circle, .cover-ring line { opacity: .7 !important; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  .cover-owner input:placeholder-shown { visibility: hidden; }
}
`
