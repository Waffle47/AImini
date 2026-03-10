import { useState, useEffect, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PieChart, Pie, Cell } from "recharts";

/* ─── THEME ──────────────────────────────────────────────────────────────── */
const T = {
  bg:      "#010041",
  surface: "#0d1526",
  card:    "#111d35",
  border:  "#1e2f4d",
  accent:  "#e63946",
  teal:    "#06d6a0",
  gold:    "#f4a261",
  blue:    "#4895ef",
  muted:   "#4d6080",
  dim:     "#6b6b6b",
  text:    "#c8d8f0",
  white:   "#eef4ff",
};

const TABS = [
  { id:"detector",  icon:"🛡", label:"Detector" },
  { id:"eda",       icon:"📊", label:"EDA" },
  { id:"models",    icon:"🤖", label:"Models" },
];

/* ─── DATA ───────────────────────────────────────────────────────────────── */
const MODEL_DATA = [
  { model:"Naive Bayes",   accuracy:93.8, precision:91.2, recall:89.4, f1:90.3, roc:96.1, color:"#6478ff" },
  { model:"Logistic Reg.", accuracy:95.2, precision:93.8, recall:91.5, f1:92.6, roc:97.8, color:"#ff9500" },
  { model:"Rnd Forest",    accuracy:97.6, precision:96.9, recall:95.3, f1:96.1, roc:99.2, color:"#06d6a0" },
];

const CLASS_DATA = [{ name:"Legitimate", value:71, color:T.teal },{ name:"Spam", value:29, color:T.accent }];

const TOP_SPAM_WORDS = [
  { word:"lottery",  spam:142, legit:3  },
  { word:"free",     spam:198, legit:22 },
  { word:"click",    spam:176, legit:18 },
  { word:"winner",   spam:134, legit:2  },
  { word:"prize",    spam:118, legit:4  },
  { word:"money",    spam:156, legit:34 },
  { word:"offer",    spam:132, legit:28 },
  { word:"urgent",   spam:108, legit:6  },
];

const RADAR_DATA = [
  { metric:"Accuracy",  NB:93.8, LR:95.2, RF:97.6 },
  { metric:"Precision", NB:91.2, LR:93.8, RF:96.9 },
  { metric:"Recall",    NB:89.4, LR:91.5, RF:95.3 },
  { metric:"F1-Score",  NB:90.3, LR:92.6, RF:96.1 },
  { metric:"ROC-AUC",   NB:96.1, LR:97.8, RF:99.2 },
];

const FEAT_IMPORTANCE = [
  { name:"spam_word_score",      score:0.0842 },
  { name:"lottery",              score:0.0731 },
  { name:"free",                 score:0.0698 },
  { name:"word_diversity_ratio", score:0.0612 },
  { name:"click",                score:0.0589 },
  { name:"total_words",          score:0.0541 },
  { name:"winner",               score:0.0498 },
  { name:"unique_words",         score:0.0476 },
  { name:"prize",                score:0.0443 },
  { name:"money",                score:0.0412 },
];

const EXAMPLES = {
  spam:`Congratulations!! You have been SELECTED as the winner of our INTERNATIONAL LOTTERY! You have WON $2,500,000 USD. To CLAIM your prize IMMEDIATELY, send your bank details and a $150 processing fee to: claim@win-prize.net`,
  legit:`Hi Sarah, Just following up on the budget proposal I sent over last Thursday. Could you let me know if you had a chance to review it?`
};

/* ─── GLOBAL STYLES ──────────────────────────────────────────────────────── */
const G = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@400;600;700;800&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:${T.bg};font-family:'Syne',sans-serif;color:${T.text};}
  ::-webkit-scrollbar{width:4px;height:4px;}
  ::-webkit-scrollbar-track{background:${T.surface};}
  ::-webkit-scrollbar-thumb{background:${T.dim};border-radius:2px;}
`;

/* ─── SHARED COMPONENTS ──────────────────────────────────────────────────── */
function Card({ children, style={}, accent }) {
  return (
    <div style={{ background: T.card, border:`1px solid ${accent||T.border}`, borderRadius:14, padding:20, ...style }}>
      {children}
    </div>
  );
}

function Tag({ children, color=T.blue }) {
  return (
    <span style={{ background:`${color}18`, border:`1px solid ${color}40`, color, borderRadius:6, padding:"3px 10px", fontSize:11, fontFamily:"'DM Mono',monospace" }}>
      {children}
    </span>
  );
}

function SectionTitle({ label, sub }) {
  return (
    <div style={{ marginBottom:24 }}>
      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:T.muted, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:8 }}>{label}</div>
      {sub && <p style={{ fontSize:13, color:T.muted }}>{sub}</p>}
    </div>
  );
}

/* ─── TAB: DETECTOR ──────────────────────────────────────────────────────── */
function DetectorTab() {
  const [email, setEmail]   = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);
  const resRef = useRef(null);

  const analyse = async () => {
    if (!email.trim()) return;
    setLoading(true); setResult(null); setError(null);
    try {
      const API_URL = import.meta.env.VITE_API_URL || "https://aimini-1.onrender.com";

      const res = await fetch(`${API_URL}/api/analyse`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ email })
      });

      if (!res.ok) throw new Error("Server responded with error. Check backend terminal.");

      // backend cleans the data and parses the JSON.
      const data = await res.json();
      setResult(data);
      
      setTimeout(()=>resRef.current?.scrollIntoView({behavior:"smooth",block:"start"}), 100);
    } catch(e) { 
      setError(e.message || "Analysis failed — please try again."); 
    } finally { 
      setLoading(false); 
    }
  };

  const type = result ? (result.verdict==="FRAUD"?"fraud":result.verdict==="SAFE"?"safe":"uncertain") : "idle";
  const typeColor = { fraud:T.accent, safe:T.teal, uncertain:T.gold, idle:T.blue }[type];

  const [barW, setBarW] = useState(0);
  useEffect(()=>{ if(result) setTimeout(()=>setBarW(result.confidence),120); else setBarW(0); },[result]);

  return (
    <div style={{ animation:"fadeUp .5s ease both" }}>
      <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:28 }}>
        <div style={{ width:52, height:52, borderRadius:14, background:`${T.accent}18`, border:`1px solid ${T.accent}40`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>🛡</div>
        <div>
          <h2 style={{ fontSize:22, fontWeight:800, color:T.white }}>Live Email Fraud Detector</h2>
          <p style={{ fontSize:13, color:T.muted, marginTop:2 }}>Paste any email — AI analyses it instantly</p>
        </div>
      </div>

      <Card style={{ marginBottom:14 }}>
        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:T.muted, textTransform:"uppercase", marginBottom:10 }}>Email Content</div>
        <textarea value={email} onChange={e=>{setEmail(e.target.value);setResult(null);setError(null);}}
          placeholder="Paste email text here..."
          style={{ width:"100%", minHeight:200, background:"rgba(0,0,0,.35)", border:`1px solid ${T.dim}`, borderRadius:10, padding:16, color:T.text, fontFamily:"'DM Mono',monospace", fontSize:12.5, lineHeight:1.7, resize:"vertical", outline:"none" }}
        />
        <div style={{ display:"flex", gap:8, marginTop:12, flexWrap:"wrap" }}>
          <button onClick={()=>{setEmail(EXAMPLES.spam);setResult(null);}} style={{ cursor:"pointer", background:"none", border:`1px solid ${T.dim}`, color:T.muted, padding:"6px 12px", borderRadius:8, fontSize:11 }}>⚠ Spam example</button>
          <button onClick={()=>{setEmail(EXAMPLES.legit);setResult(null);}} style={{ cursor:"pointer", background:"none", border:`1px solid ${T.dim}`, color:T.muted, padding:"6px 12px", borderRadius:8, fontSize:11 }}>✓ Legit example</button>
          {email && <button onClick={()=>{setEmail("");setResult(null);}} style={{ cursor:"pointer", background:"none", border:`1px solid ${T.dim}`, color:T.muted, padding:"6px 12px", borderRadius:8, fontSize:11 }}>✕ Clear</button>}
        </div>
      </Card>

      <button onClick={analyse} disabled={loading||!email.trim()} style={{ width:"100%", padding:16, borderRadius:12, border:"none", background: loading ? T.card : `linear-gradient(135deg,${T.accent},#c1121f)`, color: T.white, fontWeight:700, cursor: loading ? "not-allowed" : "pointer" }}>
        {loading ? "Scanning…" : "Analyse Email"}
      </button>

      {error && <div style={{ marginTop:14, padding:16, background:`${T.accent}10`, border:`1px solid ${T.accent}30`, borderRadius:10, fontSize:12, color:T.accent }}>⚠ {error}</div>}

      {result && (
        <div ref={resRef} style={{ marginTop:18, background:T.card, border:`1px solid ${typeColor}35`, borderRadius:16, padding:24 }}>
          <div style={{ display:"flex", alignItems:"flex-start", gap:18, marginBottom:22 }}>
            <div style={{ width:54,height:54,borderRadius:14,background:`${typeColor}18`,border:`1px solid ${typeColor}40`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26 }}>
              {type==="safe"?"✓":type==="fraud"?"✕":"?"}
            </div>
            <div>
              <h3 style={{ fontSize:24, fontWeight:800, color:typeColor }}>{result.verdict} EMAIL</h3>
              <p style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:T.muted, marginTop:3 }}>{result.top_reason}</p>
            </div>
          </div>

          <div style={{ marginBottom:20 }}>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:T.muted, marginBottom:8 }}>
              <span>Confidence</span>
              <span style={{ color:typeColor }}>{result.confidence}%</span>
            </div>
            <div style={{ height:8, background:T.dim, borderRadius:100 }}>
              <div style={{ height:"100%", width:`${barW}%`, background:typeColor, borderRadius:100, transition:"width 1s ease" }}/>
            </div>
          </div>

          <div style={{ background:"rgba(135, 135, 135, 0.3)", borderRadius:10, padding:16, border:`1px solid ${T.dim}`, marginBottom:18 }}>
            <p style={{ fontSize:13.5, lineHeight:1.8, color:T.text }}>{result.summary}</p>
          </div>

          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {result.red_flags?.map((f,i)=><Tag key={i} color={T.accent}>⚑ {f}</Tag>)}
            {result.green_flags?.map((f,i)=><Tag key={i} color={T.teal}>✓ {f}</Tag>)}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── REMAINING TABS (EDA, MODELS,) ────────────────────── */
function EDATab() {
  return (
    <div style={{ animation:"fadeUp .5s ease both" }}>
      <SectionTitle label="03 · Exploratory Data Analysis" sub="Understanding patterns in the dataset" />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:22 }}>
        {[["5,172","Total Emails",T.teal],["3,000","Word Features",T.blue],["29%","Spam Rate",T.accent],["0","Missing Values",T.gold]].map(([v,l,c])=>(
          <Card key={l} accent={c} style={{ textAlign:"center", padding:16 }}>
            <div style={{ fontSize:26, fontWeight:800, color:c }}>{v}</div>
            <div style={{ fontSize:11, color:T.muted, marginTop:4 }}>{l}</div>
          </Card>
        ))}
      </div>
      <Card>
          <div style={{ fontSize:11, color:T.muted, marginBottom:14 }}>CLASS DISTRIBUTION</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={CLASS_DATA} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                {CLASS_DATA.map((d,i)=><Cell key={i} fill={d.color}/>)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
    </div>
  );
}
function ModelsTab() {
  return (
    <div style={{ animation:"fadeUp .5s ease both" }}>
      <SectionTitle label="05–06 · Model Evaluation" sub="Comparative analysis of ML algorithms" />
      <Card>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={MODEL_DATA}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.dim}/>
            <XAxis dataKey="model" tick={{fill:T.text}} />
            <YAxis domain={[85,100]} tick={{fill:T.muted}} />
            <Tooltip />
            <Legend />
            <Bar dataKey="accuracy" fill={T.blue} name="Accuracy" />
            <Bar dataKey="f1" fill={T.teal} name="F1-Score" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}





/* ─── ROOT APP ───────────────────────────────────────────────────────────── */
export default function App() {
  const [tab, setTab] = useState("detector");

  return (
    <>
      <style>{G}</style>
      <div style={{ minHeight:"100vh", background:T.bg }}>
        <nav style={{ background:T.surface, borderBottom:`1px solid ${T.border}`, position:"sticky", top:0, zIndex:100 }}>
          <div style={{ maxWidth:960, margin:"0 auto", padding:"0 20px", display:"flex", alignItems:"center" }}>
            <div style={{ paddingRight:24, borderRight:`1px solid ${T.border}`, marginRight:16, display:"flex", gap:10, alignItems:"center" }}>
              <div style={{ width:32,height:32,borderRadius:8,background:`${T.accent}20`,display:"flex",alignItems:"center",justifyContent:"center" }}>🛡</div>
              <span style={{ fontWeight:800, fontSize:14 }}>FraudGuard</span>
            </div>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{ padding:"16px 18px", background:"none", border:"none", borderBottom:`2px solid ${tab===t.id?T.accent:"transparent"}`, color: tab===t.id?T.white:T.muted, cursor:"pointer", fontSize:13 }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </nav>

        <main style={{ maxWidth:960, margin:"0 auto", padding:"32px 20px" }}>
          {tab==="detector" && <DetectorTab/>}
          {tab==="eda"      && <EDATab/>}
          {tab==="models"   && <ModelsTab/>}
        </main>
      </div>
    </>
  );
}