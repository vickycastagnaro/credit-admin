import { useState, useMemo, useRef } from "react";

const EMPLOYEES = Array.from({ length: 42 }, (_, i) => {
  const salaries  = [12000,15000,18000,22000,28000,35000,45000,55000,70000,90000];
  const areas     = ["Tecnología","Finanzas","Operaciones","Comercial","RRHH","Legal"];
  const seniors   = ["Junior","Mid","Senior","Lead","Director"];
  const companies = ["TechCorp","FinBank","RetailCo","HealthPlus"];
  const genders   = ["M","F","NB"];
  const ratings   = ["AA","A","B","C","D"];
  const salary    = salaries[i%salaries.length];
  return { id:i+1, name:`Empleado ${i+1}`, company:companies[i%4], gender:genders[i%3],
    tenure:(i%8)+1, salary, age:24+(i%30), area:areas[i%6], seniority:seniors[i%5],
    rating:ratings[i%5], repeat:i%3===0, activeCredit:i%4===1 };
});

const INIT_OFFERS = [
  {id:1,employeeId:1,employeeName:"Ana García",    company:"TechCorp",  rating:"AA",salary:45000,amount:150000,term:48,rate:0.018,status:"active",   createdAt:"2025-10-01"},
  {id:2,employeeId:2,employeeName:"Luis Martínez", company:"FinBank",   rating:"B", salary:22000,amount:40000, term:24,rate:0.028,status:"active",   createdAt:"2025-11-15"},
  {id:3,employeeId:3,employeeName:"Sara López",    company:"RetailCo",  rating:"A", salary:35000,amount:95000, term:36,rate:0.022,status:"active",   createdAt:"2025-12-03"},
  {id:4,employeeId:4,employeeName:"Pedro Ruiz",    company:"HealthPlus",rating:"C", salary:15000,amount:22000, term:18,rate:0.034,status:"cancelled",createdAt:"2025-09-20"},
  {id:5,employeeId:5,employeeName:"María Torres",  company:"TechCorp",  rating:"AA",salary:70000,amount:148000,term:48,rate:0.018,status:"active",   createdAt:"2026-01-10"},
  {id:6,employeeId:6,employeeName:"Carlos Vega",   company:"FinBank",   rating:"D", salary:12000,amount:8500,  term:12,rate:0.042,status:"active",   createdAt:"2026-01-22"},
];

const RATING_COLORS = {AA:"#16a34a",A:"#65a30d",B:"#ca8a04",C:"#ea580c",D:"#dc2626"};
const RATING_BG     = {AA:"#dcfce7",A:"#ecfccb",B:"#fef9c3",C:"#ffedd5",D:"#fee2e2"};
const RATING_LABELS = ["AA","A","B","C","D"];
const DEFAULT_POLICIES = {
  AA:{maxAmount:150000,rate:0.018,maxTerm:48,capitalCap:5000000},
  A: {maxAmount:100000,rate:0.022,maxTerm:36,capitalCap:3000000},
  B: {maxAmount: 60000,rate:0.028,maxTerm:24,capitalCap:2000000},
  C: {maxAmount: 30000,rate:0.034,maxTerm:18,capitalCap:1000000},
  D: {maxAmount: 10000,rate:0.042,maxTerm:12,capitalCap:500000},
};

const fmt  = n => new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN",maximumFractionDigits:0}).format(n);
const pct  = n => `${(n*100).toFixed(1)}%`;
const mPay = (a,r,t) => (!a||!r||!t)?0 : a*r/(1-Math.pow(1+r,-t));

const Input = ({style={},...p}) => <input {...p} style={{border:"1px solid #e5e7eb",borderRadius:8,padding:"8px 12px",fontSize:13,color:"#111827",outline:"none",width:"100%",boxSizing:"border-box",background:"#fff",...style}}/>;
const Sel   = ({children,style={},...p}) => <select {...p} style={{border:"1px solid #e5e7eb",borderRadius:8,padding:"8px 12px",fontSize:13,color:"#111827",background:"#fff",width:"100%",boxSizing:"border-box",outline:"none",...style}}>{children}</select>;
const Btn   = ({children,variant="primary",style={},...p}) => {
  const v={primary:{background:"#4f46e5",color:"#fff",border:"none"},outline:{background:"#fff",color:"#374151",border:"1px solid #e5e7eb"},danger:{background:"#dc2626",color:"#fff",border:"none"},success:{background:"#16a34a",color:"#fff",border:"none"},warning:{background:"#d97706",color:"#fff",border:"none"}};
  return <button {...p} style={{...v[variant],borderRadius:8,padding:"8px 16px",fontSize:13,fontWeight:600,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:6,...style}}>{children}</button>;
};
const Lbl   = ({children}) => <div style={{fontSize:12,fontWeight:600,color:"#374151",marginBottom:4}}>{children}</div>;
const Badge = ({children,color="#e5e7eb",textColor="#374151"}) => <span style={{background:color,color:textColor,borderRadius:20,padding:"2px 10px",fontSize:11,fontWeight:600,display:"inline-block"}}>{children}</span>;
const RBadge= ({r}) => <Badge color={RATING_BG[r]} textColor={RATING_COLORS[r]}>{r}</Badge>;
const Card  = ({children,style={}}) => <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:12,padding:20,...style}}>{children}</div>;
const Modal = ({children}) => (
  <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}}>
    <div style={{background:"#fff",borderRadius:16,padding:28,maxWidth:500,width:"90%",boxShadow:"0 20px 60px rgba(0,0,0,.2)"}}>{children}</div>
  </div>
);
const Toggle = ({value, onChange, label, sub}) => (
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:10,padding:"10px 14px",marginBottom:16}}>
    <div>
      <div style={{fontWeight:600,fontSize:13,color:"#111827"}}>✨ {label}</div>
      {sub && <div style={{fontSize:12,color:"#9ca3af",marginTop:2}}>{sub}</div>}
    </div>
    <div onClick={()=>onChange(!value)} style={{width:44,height:24,borderRadius:12,background:value?"#4f46e5":"#d1d5db",cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:0}}>
      <div style={{position:"absolute",top:3,left:value?22:3,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,.25)"}}/>
    </div>
  </div>
);
const ModeTab = ({options, value, onChange}) => (
  <div style={{display:"flex",gap:0,marginBottom:20,background:"#f3f4f6",borderRadius:10,padding:4,width:"fit-content"}}>
    {options.map(([id,label])=>(
      <button key={id} onClick={()=>onChange(id)} style={{padding:"7px 18px",borderRadius:8,border:"none",cursor:"pointer",fontSize:13,fontWeight:600,background:value===id?"#fff":"transparent",color:value===id?"#111827":"#6b7280",boxShadow:value===id?"0 1px 3px rgba(0,0,0,.08)":""}}>
        {label}
      </button>
    ))}
  </div>
);

const IcoBell   =()=><svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
const IcoDl     =()=><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const IcoSearch =()=><svg width="15" height="15" fill="none" stroke="#9ca3af" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>;
const IcoX      =()=><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>;
const IcoUsers  =()=><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IcoUpload =()=><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
const IcoCancel =()=><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>;
const IcoEdit   =()=><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IcoPolicy =()=><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;

function CapBar({used, cap, color}) {
  const pctUsed = cap > 0 ? Math.min(used / cap, 1) : 0;
  const pctNum  = Math.round(pctUsed * 100);
  const barColor = pctUsed >= 1 ? "#dc2626" : pctUsed >= 0.8 ? "#d97706" : color;
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
        <span style={{fontSize:11,color:"#6b7280"}}>Capital utilizado</span>
        <span style={{fontSize:11,fontWeight:700,color:barColor}}>{pctNum}%</span>
      </div>
      <div style={{background:"#f3f4f6",borderRadius:99,height:7,overflow:"hidden"}}>
        <div style={{width:`${pctNum}%`,height:"100%",background:barColor,borderRadius:99,transition:"width .4s"}}/>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
        <span style={{fontSize:10,color:"#9ca3af"}}>Usado: <b style={{color:"#374151"}}>{fmt(used)}</b></span>
        <span style={{fontSize:10,color:"#9ca3af"}}>CAP: <b style={{color:"#374151"}}>{fmt(cap)}</b></span>
      </div>
      {pctUsed >= 1 && <div style={{marginTop:4,fontSize:11,color:"#dc2626",fontWeight:600}}>⛔ CAP alcanzado — sin capital disponible</div>}
      {pctUsed >= 0.8 && pctUsed < 1 && <div style={{marginTop:4,fontSize:11,color:"#d97706",fontWeight:600}}>⚠ Capital casi agotado</div>}
    </div>
  );
}

export default function App() {
  const [view, setView]         = useState("employees");
  const [policies, setPolicies] = useState(DEFAULT_POLICIES);
  const [offers, setOffers]     = useState(INIT_OFFERS);

  const usedCapital = useMemo(() => {
    const used = {AA:0,A:0,B:0,C:0,D:0};
    offers.filter(o=>o.status==="active"||o.status==="modified").forEach(o => {
      if(used[o.rating] !== undefined) used[o.rating] += o.amount;
    });
    return used;
  }, [offers]);

  const nav = [
    {id:"employees", icon:<IcoUsers/>,  label:"Empleados"},
    {id:"load",      icon:<IcoUpload/>, label:"Cargar Ofertas"},
    {id:"cancel",    icon:<IcoCancel/>, label:"Cancelar Ofertas"},
    {id:"modify",    icon:<IcoEdit/>,   label:"Modificar Ofertas"},
    {id:"policies",  icon:<IcoPolicy/>, label:"Políticas"},
  ];
  const titles = {employees:"Empleados",load:"Cargar Ofertas",cancel:"Cancelación de Ofertas",modify:"Modificación de Ofertas",policies:"Políticas por Rating"};

  return (
    <div style={{display:"flex",height:"100vh",background:"#f9fafb",fontFamily:"-apple-system,BlinkMacSystemFont,'Inter',sans-serif",fontSize:14,overflow:"hidden"}}>
      <div style={{width:56,background:"#fff",borderRight:"1px solid #e5e7eb",display:"flex",flexDirection:"column",alignItems:"center",paddingTop:12,gap:4,flexShrink:0}}>
        <div style={{width:36,height:36,borderRadius:8,background:"#4f46e5",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:12}}>
          <span style={{color:"#fff",fontWeight:900,fontSize:13}}>C</span>
        </div>
        {nav.map(n=>(
          <button key={n.id} title={n.label} onClick={()=>setView(n.id)} style={{width:40,height:40,borderRadius:8,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",background:view===n.id?"#eef2ff":"transparent",color:view===n.id?"#4f46e5":"#9ca3af"}}>
            {n.icon}
          </button>
        ))}
      </div>
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{height:52,background:"#fff",borderBottom:"1px solid #e5e7eb",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 24px",flexShrink:0}}>
          <div style={{fontWeight:700,fontSize:15,color:"#111827"}}>{titles[view]}</div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <button style={{background:"transparent",border:"1px solid #e5e7eb",borderRadius:8,padding:"6px 12px",fontSize:12,color:"#374151",cursor:"pointer",display:"flex",alignItems:"center",gap:6,fontWeight:600}}><IcoBell/> Nuevos lanzamientos</button>
            <div style={{width:32,height:32,borderRadius:"50%",background:"#4f46e5",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:13}}>VC</div>
          </div>
        </div>
        <div style={{flex:1,overflow:"auto",padding:24}}>
          {view==="employees" && <EmployeesView policies={policies}/>}
          {view==="load"      && <LoadView policies={policies} setOffers={setOffers} usedCapital={usedCapital}/>}
          {view==="cancel"    && <CancelView offers={offers} setOffers={setOffers}/>}
          {view==="modify"    && <ModifyView offers={offers} setOffers={setOffers} policies={policies}/>}
          {view==="policies"  && <PoliciesView policies={policies} setPolicies={setPolicies} usedCapital={usedCapital}/>}
        </div>
      </div>
    </div>
  );
}

function EmployeesView({policies}) {
  const EMPTY = {company:"",gender:"",tenureMin:"",tenureMax:"",salaryMin:"",salaryMax:"",ageMin:"",ageMax:"",area:"",seniority:"",repeat:"",activeCredit:"",rating:""};
  const [search,  setSearch]  = useState("");
  const [filters, setFilters] = useState(EMPTY);
  const [page,    setPage]    = useState(1);
  const PER = 8;
  const set = (k,v)=>{ setFilters(f=>({...f,[k]:v})); setPage(1); };
  const activeCount = Object.values(filters).filter(Boolean).length;

  const filtered = useMemo(()=>EMPLOYEES.filter(e=>{
    if(search && !e.name.toLowerCase().includes(search.toLowerCase()) && !e.company.toLowerCase().includes(search.toLowerCase())) return false;
    if(filters.company && e.company!==filters.company) return false;
    if(filters.gender  && e.gender!==filters.gender)   return false;
    if(filters.tenureMin && e.tenure<+filters.tenureMin) return false;
    if(filters.tenureMax && e.tenure>+filters.tenureMax) return false;
    if(filters.salaryMin && e.salary<+filters.salaryMin) return false;
    if(filters.salaryMax && e.salary>+filters.salaryMax) return false;
    if(filters.ageMin  && e.age<+filters.ageMin) return false;
    if(filters.ageMax  && e.age>+filters.ageMax) return false;
    if(filters.area      && e.area!==filters.area) return false;
    if(filters.seniority && e.seniority!==filters.seniority) return false;
    if(filters.repeat==="yes" && !e.repeat) return false;
    if(filters.repeat==="no"  && e.repeat)  return false;
    if(filters.activeCredit==="yes" && !e.activeCredit) return false;
    if(filters.activeCredit==="no"  && e.activeCredit)  return false;
    if(filters.rating && e.rating!==filters.rating) return false;
    return true;
  }),[filters,search]);

  const pages = Math.ceil(filtered.length/PER);
  const rows  = filtered.slice((page-1)*PER, page*PER);

  const exportCSV = ()=>{
    const h = "ID,Nombre,Empresa,Área,Seniority,Edad,Antigüedad,Salario,Rating,Repeat,Crédito Activo";
    const b = filtered.map(e=>`${e.id},${e.name},${e.company},${e.area},${e.seniority},${e.age},${e.tenure},${e.salary},${e.rating},${e.repeat?"Sí":"No"},${e.activeCredit?"Sí":"No"}`);
    const blob=new Blob([[h,...b].join("\n")],{type:"text/csv"});
    const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="reporte_empleados.csv"; a.click();
  };

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div><h2 style={{margin:0,fontSize:22,fontWeight:700,color:"#111827"}}>Empleados</h2><div style={{color:"#6b7280",fontSize:13,marginTop:2}}>{filtered.length} resultados</div></div>
        <Btn variant="outline" onClick={exportCSV}><IcoDl/> Descargar reporte</Btn>
      </div>
      <div style={{position:"relative",marginBottom:16}}>
        <div style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)"}}><IcoSearch/></div>
        <Input placeholder="Buscar empleado o empresa..." value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} style={{paddingLeft:38,borderRadius:10}}/>
      </div>
      <Card style={{marginBottom:16,padding:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <span style={{fontWeight:600,fontSize:13}}>Filtros {activeCount>0&&<span style={{background:"#eef2ff",color:"#4f46e5",borderRadius:20,padding:"1px 8px",fontSize:11,marginLeft:4}}>{activeCount}</span>}</span>
          {activeCount>0&&<button onClick={()=>setFilters(EMPTY)} style={{background:"none",border:"none",color:"#6b7280",fontSize:12,cursor:"pointer"}}>Limpiar</button>}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:10}}>
          <div><Lbl>Empresa</Lbl><Sel value={filters.company} onChange={e=>set("company",e.target.value)}><option value="">Todas</option>{["TechCorp","FinBank","RetailCo","HealthPlus"].map(c=><option key={c}>{c}</option>)}</Sel></div>
          <div><Lbl>Sexo</Lbl><Sel value={filters.gender} onChange={e=>set("gender",e.target.value)}><option value="">Todos</option><option value="M">M</option><option value="F">F</option><option value="NB">NB</option></Sel></div>
          <div><Lbl>Área</Lbl><Sel value={filters.area} onChange={e=>set("area",e.target.value)}><option value="">Todas</option>{["Tecnología","Finanzas","Operaciones","Comercial","RRHH","Legal"].map(a=><option key={a}>{a}</option>)}</Sel></div>
          <div><Lbl>Seniority</Lbl><Sel value={filters.seniority} onChange={e=>set("seniority",e.target.value)}><option value="">Todos</option>{["Junior","Mid","Senior","Lead","Director"].map(s=><option key={s}>{s}</option>)}</Sel></div>
          <div><Lbl>Rating</Lbl><Sel value={filters.rating} onChange={e=>set("rating",e.target.value)}><option value="">Todos</option>{RATING_LABELS.map(r=><option key={r}>{r}</option>)}</Sel></div>
          <div><Lbl>Créd. previo</Lbl><Sel value={filters.repeat} onChange={e=>set("repeat",e.target.value)}><option value="">Todos</option><option value="yes">Repeat</option><option value="no">Nuevo</option></Sel></div>
          <div><Lbl>Créd. activo</Lbl><Sel value={filters.activeCredit} onChange={e=>set("activeCredit",e.target.value)}><option value="">Todos</option><option value="yes">Activo</option><option value="no">Sin crédito</option></Sel></div>
          <div><Lbl>Antigüedad</Lbl><div style={{display:"flex",gap:4}}><Input placeholder="Min" value={filters.tenureMin} onChange={e=>set("tenureMin",e.target.value)} type="number"/><Input placeholder="Max" value={filters.tenureMax} onChange={e=>set("tenureMax",e.target.value)} type="number"/></div></div>
          <div><Lbl>Salario</Lbl><div style={{display:"flex",gap:4}}><Input placeholder="Min" value={filters.salaryMin} onChange={e=>set("salaryMin",e.target.value)} type="number"/><Input placeholder="Max" value={filters.salaryMax} onChange={e=>set("salaryMax",e.target.value)} type="number"/></div></div>
          <div><Lbl>Edad</Lbl><div style={{display:"flex",gap:4}}><Input placeholder="Min" value={filters.ageMin} onChange={e=>set("ageMin",e.target.value)} type="number"/><Input placeholder="Max" value={filters.ageMax} onChange={e=>set("ageMax",e.target.value)} type="number"/></div></div>
        </div>
      </Card>
      <Card style={{padding:0,overflow:"hidden"}}>
        {rows.length===0 ? (
          <div style={{textAlign:"center",padding:"60px 0"}}><div style={{fontSize:15,fontWeight:600,color:"#111827",marginBottom:4}}>No hay empleados aquí</div><div style={{fontSize:13,color:"#9ca3af"}}>Ajustá los filtros.</div></div>
        ) : (
          <>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead><tr style={{borderBottom:"1px solid #f3f4f6",background:"#f9fafb"}}>
                {["Empleado","Empresa","Área","Seniority","Edad","Antigüedad","Salario","Rating","Créd. previo","Créd. activo","Oferta estimada"].map(h=>(
                  <th key={h} style={{padding:"10px 14px",textAlign:"left",color:"#6b7280",fontWeight:600,whiteSpace:"nowrap",fontSize:12}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>{rows.map(e=>{
                const pol=policies[e.rating];
                const maxA=Math.min(e.salary*0.2*pol.maxTerm,pol.maxAmount);
                const mp=mPay(maxA,pol.rate,pol.maxTerm);
                return (
                  <tr key={e.id} style={{borderBottom:"1px solid #f3f4f6"}}>
                    <td style={{padding:"11px 14px"}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:30,height:30,borderRadius:"50%",background:"#eef2ff",color:"#4f46e5",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:11,flexShrink:0}}>E{e.id}</div><div><div style={{fontWeight:600,color:"#111827"}}>{e.name}</div><div style={{fontSize:11,color:"#9ca3af"}}>#{e.id}</div></div></div></td>
                    <td style={{padding:"11px 14px",color:"#374151"}}>{e.company}</td>
                    <td style={{padding:"11px 14px",color:"#374151"}}>{e.area}</td>
                    <td style={{padding:"11px 14px"}}><Badge color="#f3f4f6" textColor="#374151">{e.seniority}</Badge></td>
                    <td style={{padding:"11px 14px",color:"#374151"}}>{e.age}</td>
                    <td style={{padding:"11px 14px",color:"#374151"}}>{e.tenure}a</td>
                    <td style={{padding:"11px 14px",fontWeight:600,color:"#111827"}}>{fmt(e.salary)}</td>
                    <td style={{padding:"11px 14px"}}><RBadge r={e.rating}/></td>
                    <td style={{padding:"11px 14px"}}>{e.repeat?<Badge color="#ede9fe" textColor="#7c3aed">Repeat</Badge>:<Badge color="#f0fdf4" textColor="#15803d">Nuevo</Badge>}</td>
                    <td style={{padding:"11px 14px"}}>{e.activeCredit?<Badge color="#fef9c3" textColor="#854d0e">Activo</Badge>:<Badge color="#f3f4f6" textColor="#9ca3af">—</Badge>}</td>
                    <td style={{padding:"11px 14px"}}><div style={{fontWeight:700,color:"#4f46e5"}}>{fmt(maxA)}</div><div style={{fontSize:11,color:"#9ca3af"}}>{fmt(mp)}/mes · {pol.maxTerm}m</div></td>
                  </tr>
                );
              })}</tbody>
            </table>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px",borderTop:"1px solid #f3f4f6"}}>
              <span style={{fontSize:12,color:"#6b7280"}}>Mostrando {(page-1)*PER+1}–{Math.min(page*PER,filtered.length)} de {filtered.length}</span>
              <div style={{display:"flex",gap:4}}>{Array.from({length:pages},(_,i)=>i+1).map(p=>(
                <button key={p} onClick={()=>setPage(p)} style={{width:30,height:30,borderRadius:6,border:p===page?"none":"1px solid #e5e7eb",background:p===page?"#4f46e5":"#fff",color:p===page?"#fff":"#374151",fontSize:12,cursor:"pointer",fontWeight:p===page?700:400}}>{p}</button>
              ))}</div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

function LoadView({policies, setOffers, usedCapital}) {
  const [mode,     setMode]     = useState("single");
  const [bulkMode, setBulkMode] = useState("manual");
  const [autoMode, setAutoMode] = useState(false);
  const [single,   setSingle]   = useState({employeeId:"",amount:"",term:"",rate:"",salary:"",rating:""});
  const [csvRows,  setCsvRows]  = useState([]);
  const [csvError, setCsvError] = useState("");
  const [saved,    setSaved]    = useState([]);
  const fileRef = useRef();
  const setF = (k,v)=>setSingle(f=>({...f,[k]:v}));
  const emp = EMPLOYEES.find(e=>e.id===+single.employeeId);
  const activeSalary = autoMode?(emp?emp.salary:+single.salary||0):(emp?emp.salary:0);
  const activeRating = autoMode?(emp?emp.rating:single.rating||null):(emp?emp.rating:null);
  const activePol    = activeRating?policies[activeRating]:null;
  const capAvail     = activeRating ? Math.max(0, (activePol?.capitalCap||0) - (usedCapital[activeRating]||0)) : null;
  const exceedsCap   = activeRating && capAvail !== null && +single.amount > capAvail;

  const calcAuto=(salary,rating)=>{
    if(!salary||!rating) return;
    const pol=policies[rating];
    const amount=Math.min(Math.floor(salary*0.2*pol.maxTerm),pol.maxAmount);
    setSingle(f=>({...f,amount:String(amount),term:String(pol.maxTerm),rate:String((pol.rate*100).toFixed(3))}));
  };
  const handleEmp=id=>{ const e=EMPLOYEES.find(e=>e.id===+id); setSingle(f=>({...f,employeeId:id})); if(autoMode&&e) calcAuto(e.salary,e.rating); };
  const handleSal=v=>{ setSingle(f=>({...f,salary:v})); if(autoMode&&single.rating) calcAuto(+v,single.rating); };
  const handleRat=v=>{ setSingle(f=>({...f,rating:v})); if(autoMode&&single.salary) calcAuto(+single.salary,v); };
  const toggleAuto=val=>{ setAutoMode(val); if(val){const s=emp?emp.salary:+single.salary||0;const r=emp?emp.rating:single.rating||null;if(s&&r)calcAuto(s,r);} };

  const mp=mPay(+single.amount,+single.rate/100,+single.term);
  const fits=activeSalary&&mp>0&&mp<=activeSalary*0.2;
  const capped=activePol&&+single.amount>activePol.maxAmount;

  const saveSingle=()=>{
    if(!single.employeeId||!single.amount||!single.term||!single.rate) return;
    setOffers(o=>[...o,{id:Date.now(),employeeId:+single.employeeId,employeeName:emp?.name||"—",company:emp?.company||"—",rating:activeRating||"—",salary:activeSalary,amount:+single.amount,term:+single.term,rate:+single.rate/100,status:"active",createdAt:new Date().toISOString().slice(0,10)}]);
    setSaved(s=>[...s,{...single,id:Date.now()}]);
    setSingle({employeeId:"",amount:"",term:"",rate:"",salary:"",rating:""});
  };

  const parseCSV=(text,bMode)=>{
    const lines=text.trim().split("\n"); const header=lines[0].toLowerCase().split(",").map(h=>h.trim());
    const req=bMode==="auto"?["empleado_id","sueldo","rating"]:["empleado_id","monto","plazo","tasa"];
    const miss=req.filter(r=>!header.includes(r));
    if(miss.length){setCsvError(`Faltan: ${miss.join(", ")}`);return;}
    const rows=lines.slice(1).map((line,i)=>{
      const vals=line.split(",").map(v=>v.trim()); const obj={}; header.forEach((h,j)=>obj[h]=vals[j]);
      const err=[]; let warn=null,calcAmount=null,calcTerm=null,calcRate=null;
      if(!obj.empleado_id) err.push("ID vacío");
      if(bMode==="auto"){
        if(isNaN(+obj.sueldo)||+obj.sueldo<=0) err.push("sueldo inválido");
        const rUp=obj.rating?.toUpperCase();
        if(!RATING_LABELS.includes(rUp)) err.push("rating inválido");
        if(err.length===0){const pol=policies[rUp];const byInc=Math.floor(+obj.sueldo*0.2*pol.maxTerm);calcAmount=Math.min(byInc,pol.maxAmount);calcTerm=pol.maxTerm;calcRate=(pol.rate*100).toFixed(3);if(byInc>pol.maxAmount)warn=`Ajustado al tope (${fmt(pol.maxAmount)})`;}
      } else {
        if(isNaN(+obj.monto)||+obj.monto<=0) err.push("monto inválido");
        if(isNaN(+obj.plazo)||+obj.plazo<=0) err.push("plazo inválido");
        if(isNaN(+obj.tasa)||+obj.tasa<=0)  err.push("tasa inválida");
      }
      return {...obj,_row:i+2,_errors:err,_ok:err.length===0&&!warn,_warn:warn,_calcAmount:calcAmount,_calcTerm:calcTerm,_calcRate:calcRate};
    });
    setCsvError(""); setCsvRows(rows);
  };

  return (
    <div>
      <div style={{marginBottom:20}}><h2 style={{margin:0,fontSize:22,fontWeight:700,color:"#111827"}}>Cargar Ofertas</h2><div style={{color:"#6b7280",fontSize:13,marginTop:2}}>Carga ofertas individuales o masivas vía CSV</div></div>
      <ModeTab options={[["single","Una a una"],["bulk","Carga masiva CSV"]]} value={mode} onChange={setMode}/>
      {mode==="single" && (
        <Card style={{maxWidth:480}}>
          <div style={{fontWeight:700,fontSize:15,color:"#111827",marginBottom:16}}>Nueva oferta</div>
          <Toggle value={autoMode} onChange={toggleAuto} label="Calcular automático" sub="Completa monto, plazo y tasa según la política del rating"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div style={{gridColumn:"1/-1"}}><Lbl>Empleado (opcional)</Lbl><Sel value={single.employeeId} onChange={e=>handleEmp(e.target.value)}><option value="">Seleccionar...</option>{EMPLOYEES.map(e=><option key={e.id} value={e.id}>{e.name} — {e.company} · {e.rating}</option>)}</Sel></div>
            {autoMode&&(<>
              <div><Lbl>Sueldo mensual</Lbl><Input placeholder="30000" value={emp?emp.salary:single.salary} onChange={e=>handleSal(e.target.value)} type="number" disabled={!!emp} style={{background:emp?"#f9fafb":""}}/>{emp&&<div style={{fontSize:11,color:"#9ca3af",marginTop:3}}>Del empleado</div>}</div>
              <div><Lbl>Rating</Lbl><Sel value={emp?emp.rating:single.rating} onChange={e=>handleRat(e.target.value)} disabled={!!emp} style={{background:emp?"#f9fafb":""}}><option value="">Seleccionar...</option>{RATING_LABELS.map(r=><option key={r}>{r}</option>)}</Sel>{emp&&<div style={{fontSize:11,color:"#9ca3af",marginTop:3}}>Del empleado</div>}</div>
              {activeRating&&<div style={{gridColumn:"1/-1",background:"#eef2ff",border:"1px solid #c7d2fe",borderRadius:8,padding:"8px 12px",fontSize:12,color:"#4338ca"}}>✨ <b>Rating {activeRating}</b> — tasa {pct(activePol.rate)}, plazo {activePol.maxTerm}m, tope {fmt(activePol.maxAmount)} · CAP disponible: <b>{fmt(capAvail)}</b></div>}
            </>)}
            <div><Lbl>Monto (MXN)</Lbl><Input placeholder="50000" value={single.amount} onChange={e=>setF("amount",e.target.value)} type="number" style={{borderColor:(capped||exceedsCap)?"#fca5a5":""}}/>{capped&&<div style={{fontSize:11,color:"#dc2626",marginTop:3}}>⚠ Supera el tope ({fmt(activePol.maxAmount)})</div>}{!capped&&exceedsCap&&<div style={{fontSize:11,color:"#dc2626",marginTop:3}}>⛔ Supera el capital disponible ({fmt(capAvail)})</div>}</div>
            <div><Lbl>Plazo (meses)</Lbl><Input placeholder="24" value={single.term} onChange={e=>setF("term",e.target.value)} type="number"/></div>
            <div style={{gridColumn:"1/-1"}}><Lbl>Tasa mensual (%)</Lbl><Input placeholder="2.2" value={single.rate} onChange={e=>setF("rate",e.target.value)} type="number" step="0.001"/></div>
          </div>
          {mp>0&&<div style={{marginTop:14,background:fits?"#f0fdf4":"#fef2f2",border:`1px solid ${fits?"#bbf7d0":"#fecaca"}`,borderRadius:8,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontSize:11,color:fits?"#15803d":"#dc2626",fontWeight:600}}>{fits?"✓ Dentro del 20%":"⚠ Supera el 20%"}</div><div style={{fontSize:18,fontWeight:700,color:fits?"#15803d":"#dc2626"}}>{fmt(mp)}/mes</div></div>{activeSalary>0&&<div style={{fontSize:12,color:"#6b7280"}}>Límite: <b>{fmt(activeSalary*0.2)}/mes</b></div>}</div>}
          <Btn variant="primary" style={{marginTop:16,width:"100%",justifyContent:"center"}} onClick={saveSingle}>Guardar oferta</Btn>
        </Card>
      )}
      {mode==="bulk" && (
        <div style={{maxWidth:720}}>
          <div style={{display:"flex",gap:0,marginBottom:16,background:"#f3f4f6",borderRadius:8,padding:3,width:"fit-content"}}>
            {[["manual","Manual"],["auto","Auto (sueldo + rating)"]].map(([id,label])=>(
              <button key={id} onClick={()=>{setBulkMode(id);setCsvRows([]);setCsvError("");}} style={{padding:"6px 14px",borderRadius:6,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,background:bulkMode===id?"#fff":"transparent",color:bulkMode===id?"#111827":"#6b7280",boxShadow:bulkMode===id?"0 1px 2px rgba(0,0,0,.08)":""}}>{label}</button>
            ))}
          </div>
          <Card style={{marginBottom:16}}>
            <div style={{fontWeight:700,fontSize:15,marginBottom:8}}>Subir CSV</div>
            <div style={{fontSize:13,color:"#6b7280",marginBottom:14}}>{bulkMode==="manual"?<>Columnas: <code style={{background:"#f3f4f6",padding:"1px 6px",borderRadius:4,fontSize:12}}>empleado_id, monto, plazo, tasa</code></>:<>Columnas: <code style={{background:"#eef2ff",color:"#4338ca",padding:"1px 6px",borderRadius:4,fontSize:12}}>empleado_id, sueldo, rating</code></>}</div>
            <div style={{border:"2px dashed #e5e7eb",borderRadius:10,padding:28,textAlign:"center",cursor:"pointer",background:"#fafafa"}} onClick={()=>fileRef.current.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>parseCSV(ev.target.result,bulkMode);r.readAsText(f);}}>
              <div style={{fontSize:28,marginBottom:8}}>📎</div>
              <div style={{fontWeight:600,color:"#374151",fontSize:13}}>Haz clic o arrastrá el archivo CSV</div>
              <input ref={fileRef} type="file" accept=".csv" onChange={e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>parseCSV(ev.target.result,bulkMode);r.readAsText(f);e.target.value="";}} style={{display:"none"}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:10}}>
              {csvError&&<div style={{color:"#dc2626",fontSize:12}}>⚠ {csvError}</div>}
              <a href={bulkMode==="manual"?"data:text/csv;charset=utf-8,empleado_id%2Cmonto%2Cplazo%2Ctasa%0A1%2C50000%2C24%2C2.2":"data:text/csv;charset=utf-8,empleado_id%2Csueldo%2Crating%0A1%2C30000%2CA"} download={bulkMode==="manual"?"plantilla_manual.csv":"plantilla_auto.csv"} style={{fontSize:12,color:"#4f46e5",display:"flex",alignItems:"center",gap:4,textDecoration:"none",marginLeft:"auto"}}><IcoDl/> Descargar plantilla</a>
            </div>
          </Card>
          {csvRows.length>0&&(
            <Card style={{padding:0,overflow:"hidden"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px",borderBottom:"1px solid #f3f4f6"}}>
                <div style={{fontSize:13,fontWeight:600,display:"flex",gap:12}}><span style={{color:"#15803d"}}>{csvRows.filter(r=>r._ok||r._warn).length} a importar</span>{csvRows.filter(r=>r._warn).length>0&&<span style={{color:"#b45309"}}>⚠ {csvRows.filter(r=>r._warn).length} advertencia</span>}{csvRows.filter(r=>!r._ok&&!r._warn).length>0&&<span style={{color:"#dc2626"}}>✗ {csvRows.filter(r=>!r._ok&&!r._warn).length} error</span>}</div>
                <Btn variant="success" onClick={()=>setCsvRows([])}>Importar válidas</Btn>
              </div>
              <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead><tr style={{background:"#f9fafb",borderBottom:"1px solid #f3f4f6"}}>{(bulkMode==="auto"?["Fila","ID","Sueldo","Rating","Monto calc.","Plazo","Tasa","Estado"]:["Fila","ID","Monto","Plazo","Tasa","Estado"]).map(h=><th key={h} style={{padding:"8px 14px",textAlign:"left",color:"#6b7280",fontWeight:600,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
                <tbody>{csvRows.map(r=>(
                  <tr key={r._row} style={{borderBottom:"1px solid #f3f4f6",background:(!r._ok&&!r._warn)?"#fef2f2":r._warn?"#fffbeb":""}}>
                    <td style={{padding:"9px 14px",color:"#9ca3af"}}>{r._row}</td>
                    <td style={{padding:"9px 14px",fontWeight:600}}>{r.empleado_id}</td>
                    {bulkMode==="auto"?<><td style={{padding:"9px 14px"}}>{r.sueldo?fmt(+r.sueldo):"—"}</td><td style={{padding:"9px 14px"}}>{r.rating?<RBadge r={r.rating.toUpperCase()}/>:"—"}</td><td style={{padding:"9px 14px",fontWeight:700,color:"#4f46e5"}}>{r._calcAmount?fmt(r._calcAmount):"—"}</td><td style={{padding:"9px 14px"}}>{r._calcTerm?`${r._calcTerm}m`:"—"}</td><td style={{padding:"9px 14px"}}>{r._calcRate?`${r._calcRate}%`:"—"}</td></>:<><td style={{padding:"9px 14px"}}>{r.monto?fmt(+r.monto):"—"}</td><td style={{padding:"9px 14px"}}>{r.plazo}m</td><td style={{padding:"9px 14px"}}>{r.tasa}%</td></>}
                    <td style={{padding:"9px 14px"}}>{r._ok&&<Badge color="#dcfce7" textColor="#15803d">✓ OK</Badge>}{r._warn&&<Badge color="#fef9c3" textColor="#854d0e">⚠ {r._warn}</Badge>}{!r._ok&&!r._warn&&<Badge color="#fee2e2" textColor="#dc2626">✗ {r._errors[0]}</Badge>}</td>
                  </tr>
                ))}</tbody>
              </table></div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function CancelView({offers, setOffers}) {
  const [mode,    setMode]    = useState("single");
  const [search,  setSearch]  = useState("");
  const [reasons, setReasons] = useState({});
  const [modal,   setModal]   = useState(null);

  const active = offers.filter(o=>o.status==="active");
  const shown  = search ? active.filter(o=>o.employeeName.toLowerCase().includes(search.toLowerCase())||String(o.employeeId).includes(search)||String(o.id).includes(search)) : active;

  const doCancel = (offer)=>{
    setOffers(os=>os.map(o=>o.id===offer.id?{...o,status:"cancelled",cancelReason:reasons[offer.id]||""}:o));
    setModal(null);
  };

  return (
    <div>
      <div style={{marginBottom:20}}><h2 style={{margin:0,fontSize:22,fontWeight:700,color:"#111827"}}>Cancelación de Ofertas</h2><div style={{color:"#6b7280",fontSize:13,marginTop:2}}>Cancelá ofertas activas de forma individual o masiva</div></div>
      <ModeTab options={[["single","Una a una"],["bulk","Masiva CSV"]]} value={mode} onChange={setMode}/>
      {mode==="single" && (
        <div>
          <div style={{marginBottom:16,maxWidth:420}}>
            <Lbl>Buscar por nombre, ID empleado o ID oferta</Lbl>
            <div style={{position:"relative"}}><div style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)"}}><IcoSearch/></div><Input placeholder="Ej: Ana García · 1 · 001" value={search} onChange={e=>setSearch(e.target.value)} style={{paddingLeft:38}}/></div>
          </div>
          <Card style={{padding:0,overflow:"hidden"}}>
            {shown.length===0?(
              <div style={{textAlign:"center",padding:"48px 0",color:"#9ca3af",fontSize:13}}><div style={{fontSize:22,marginBottom:6}}>🔍</div>No hay ofertas activas que coincidan</div>
            ):(
              <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                <thead><tr style={{background:"#f9fafb",borderBottom:"1px solid #f3f4f6"}}>{["ID Oferta","ID Empleado","Empleado","Empresa","Rating","Monto","Plazo","Tasa","Cuota/mes","Motivo","Acción"].map(h=><th key={h} style={{padding:"10px 14px",textAlign:"left",color:"#6b7280",fontWeight:600,fontSize:12,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
                <tbody>{shown.map(o=>(
                  <tr key={o.id} style={{borderBottom:"1px solid #f3f4f6"}}>
                    <td style={{padding:"11px 14px",color:"#6b7280",fontWeight:600}}>#{o.id}</td>
                    <td style={{padding:"11px 14px",color:"#6b7280"}}>#{o.employeeId}</td>
                    <td style={{padding:"11px 14px",fontWeight:600,color:"#111827",whiteSpace:"nowrap"}}>{o.employeeName}</td>
                    <td style={{padding:"11px 14px",color:"#374151"}}>{o.company}</td>
                    <td style={{padding:"11px 14px"}}><RBadge r={o.rating}/></td>
                    <td style={{padding:"11px 14px",fontWeight:600}}>{fmt(o.amount)}</td>
                    <td style={{padding:"11px 14px",color:"#374151"}}>{o.term}m</td>
                    <td style={{padding:"11px 14px",color:"#374151"}}>{pct(o.rate)}</td>
                    <td style={{padding:"11px 14px",color:"#4f46e5",fontWeight:600}}>{fmt(mPay(o.amount,o.rate,o.term))}</td>
                    <td style={{padding:"11px 14px",minWidth:180}}><Input placeholder="Motivo (opcional)" value={reasons[o.id]||""} onChange={e=>setReasons(r=>({...r,[o.id]:e.target.value}))} style={{fontSize:12,padding:"6px 10px"}}/></td>
                    <td style={{padding:"11px 14px"}}><Btn variant="danger" style={{padding:"6px 12px",fontSize:12,whiteSpace:"nowrap"}} onClick={()=>setModal(o)}><IcoX/> Cancelar</Btn></td>
                  </tr>
                ))}</tbody>
              </table></div>
            )}
          </Card>
        </div>
      )}
      {mode==="bulk" && <Card><div style={{fontSize:13,color:"#6b7280"}}>Modo masivo — subí un CSV con oferta_id y motivo opcional.</div></Card>}
      {modal && (
        <Modal>
          <div style={{textAlign:"center",marginBottom:20}}>
            <div style={{width:52,height:52,borderRadius:"50%",background:"#fee2e2",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px",color:"#dc2626"}}><IcoX/></div>
            <div style={{fontWeight:700,fontSize:17,color:"#111827",marginBottom:4}}>¿Cancelar esta oferta?</div>
            <div style={{fontSize:13,color:"#6b7280"}}>Esta acción no se puede deshacer.</div>
          </div>
          <div style={{background:"#f9fafb",borderRadius:10,padding:14,marginBottom:20,fontSize:13}}>
            <div style={{fontWeight:600,marginBottom:6}}>{modal.employeeName} <span style={{color:"#6b7280",fontWeight:400}}>· Oferta #{modal.id}</span></div>
            <div style={{display:"flex",gap:16,color:"#374151"}}><span>Monto: <b>{fmt(modal.amount)}</b></span><span>Plazo: <b>{modal.term}m</b></span><span>Tasa: <b>{pct(modal.rate)}</b></span></div>
          </div>
          <div style={{display:"flex",gap:8}}><Btn variant="outline" style={{flex:1,justifyContent:"center"}} onClick={()=>setModal(null)}>Volver</Btn><Btn variant="danger" style={{flex:1,justifyContent:"center"}} onClick={()=>doCancel(modal)}>Confirmar cancelación</Btn></div>
        </Modal>
      )}
    </div>
  );
}

function ModifyView({offers, setOffers, policies}) {
  const [mode,     setMode]     = useState("single");
  const [autoMode, setAutoMode] = useState(false);
  const [selId,    setSelId]    = useState("");
  const [form,     setForm]     = useState({amount:"",term:"",rate:""});
  const [modal,    setModal]    = useState(false);
  const setF = (k,v)=>setForm(f=>({...f,[k]:v}));

  const active = offers.filter(o=>o.status==="active");
  const sel    = active.find(o=>o.id===+selId);
  const pol    = sel?policies[sel.rating]:null;

  const handleSel = id=>{
    setSelId(id);
    const o=active.find(o=>o.id===+id);
    if(o) setForm({amount:String(o.amount),term:String(o.term),rate:String((o.rate*100).toFixed(3))});
    else  setForm({amount:"",term:"",rate:""});
    setAutoMode(false);
  };

  const toggleAuto=val=>{
    setAutoMode(val);
    if(val&&sel){const p=policies[sel.rating];const a=Math.min(Math.floor(sel.salary*0.2*p.maxTerm),p.maxAmount);setForm({amount:String(a),term:String(p.maxTerm),rate:String((p.rate*100).toFixed(3))});}
    else if(!val&&sel) setForm({amount:String(sel.amount),term:String(sel.term),rate:String((sel.rate*100).toFixed(3))});
  };

  const newMp = mPay(+form.amount,+form.rate/100,+form.term);
  const oldMp = sel?mPay(sel.amount,sel.rate,sel.term):0;
  const fits  = sel&&newMp>0&&newMp<=sel.salary*0.2;
  const capped= pol&&+form.amount>pol.maxAmount;

  const doModify=()=>{
    setOffers(os=>os.map(o=>o.id===sel.id?{...o,amount:+form.amount,term:+form.term,rate:+form.rate/100,status:"modified",modifiedAt:new Date().toISOString()}:o));
    setModal(false); setSelId(""); setForm({amount:"",term:"",rate:""});
  };

  const Diff=({old:o,nv,fmtFn})=>{const up=nv>o,same=Math.abs(nv-o)<0.001;return <span style={{color:same?"#374151":up?"#dc2626":"#15803d",fontWeight:700}}>{fmtFn(nv)}{!same&&<span style={{fontSize:11}}>{up?" ↑":" ↓"}</span>}</span>;};

  return (
    <div>
      <div style={{marginBottom:20}}><h2 style={{margin:0,fontSize:22,fontWeight:700,color:"#111827"}}>Modificación de Ofertas</h2><div style={{color:"#6b7280",fontSize:13,marginTop:2}}>Actualizá montos, plazos y tasas con las políticas vigentes</div></div>
      <ModeTab options={[["single","Una a una"],["bulk","Masiva CSV"]]} value={mode} onChange={setMode}/>
      {mode==="single" && (
        <Card style={{maxWidth:500}}>
          <div style={{fontWeight:700,fontSize:15,color:"#111827",marginBottom:16}}>Modificar oferta</div>
          <Toggle value={autoMode} onChange={toggleAuto} label="Recalcular automático" sub="Aplica la política vigente del rating del empleado"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div style={{gridColumn:"1/-1"}}>
              <Lbl>Oferta activa</Lbl>
              <Sel value={selId} onChange={e=>handleSel(e.target.value)}>
                <option value="">Seleccionar oferta...</option>
                {active.map(o=><option key={o.id} value={o.id}>#{o.id} · {o.employeeName} · {fmt(o.amount)} · {o.rating}</option>)}
              </Sel>
            </div>
            {sel&&(
              <div style={{gridColumn:"1/-1",background:"#f9fafb",borderRadius:8,padding:"10px 12px",fontSize:12,display:"flex",gap:16,flexWrap:"wrap"}}>
                <span><span style={{color:"#6b7280"}}>Salario: </span><b>{fmt(sel.salary)}</b></span>
                <span><span style={{color:"#6b7280"}}>Rating: </span><RBadge r={sel.rating}/></span>
                <span><span style={{color:"#6b7280"}}>20%: </span><b style={{color:"#4f46e5"}}>{fmt(sel.salary*0.2)}/mes</b></span>
                {pol&&<span><span style={{color:"#6b7280"}}>Tope: </span><b>{fmt(pol.maxAmount)}</b></span>}
              </div>
            )}
            {autoMode&&sel&&<div style={{gridColumn:"1/-1",background:"#eef2ff",border:"1px solid #c7d2fe",borderRadius:8,padding:"8px 12px",fontSize:12,color:"#4338ca"}}>✨ Recalculado con política vigente <b>Rating {sel.rating}</b></div>}
            <div><Lbl>Monto nuevo (MXN)</Lbl><Input value={form.amount} onChange={e=>setF("amount",e.target.value)} type="number" style={{borderColor:capped?"#fca5a5":""}}/>{capped&&<div style={{fontSize:11,color:"#dc2626",marginTop:3}}>⚠ Supera el tope ({fmt(pol.maxAmount)})</div>}</div>
            <div><Lbl>Plazo nuevo (meses)</Lbl><Input value={form.term} onChange={e=>setF("term",e.target.value)} type="number"/></div>
            <div style={{gridColumn:"1/-1"}}><Lbl>Tasa mensual nueva (%)</Lbl><Input value={form.rate} onChange={e=>setF("rate",e.target.value)} type="number" step="0.001"/></div>
          </div>
          {sel&&form.amount&&form.term&&form.rate&&(
            <div style={{marginTop:16,border:"1px solid #e5e7eb",borderRadius:10,overflow:"hidden"}}>
              <div style={{background:"#f9fafb",padding:"8px 14px",fontSize:11,fontWeight:700,color:"#6b7280",letterSpacing:.5,textTransform:"uppercase",borderBottom:"1px solid #f3f4f6"}}>Comparativo</div>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                <thead><tr style={{borderBottom:"1px solid #f3f4f6"}}>{["","Antes","→","Después"].map(h=><th key={h} style={{padding:"8px 14px",textAlign:h==="Antes"?"right":"left",color:"#9ca3af",fontWeight:600,fontSize:11}}>{h}</th>)}</tr></thead>
                <tbody>
                  {[[" Monto",sel.amount,+form.amount,fmt],[" Plazo",sel.term,+form.term,v=>v+"m"],[" Tasa",sel.rate*100,+form.rate,v=>v.toFixed(1)+"%"],[" Cuota",oldMp,newMp,v=>fmt(v)+"/mes"]].map(([label,old,nv,fmtFn])=>(
                    <tr key={label} style={{borderBottom:"1px solid #f3f4f6"}}>
                      <td style={{padding:"9px 14px",color:"#6b7280",fontWeight:600,fontSize:12}}>{label}</td>
                      <td style={{padding:"9px 14px",textAlign:"right",color:"#9ca3af",textDecoration:"line-through",fontSize:12}}>{fmtFn(old)}</td>
                      <td style={{padding:"9px 14px",textAlign:"center",color:"#d1d5db"}}>→</td>
                      <td style={{padding:"9px 14px"}}><Diff old={old} nv={nv} fmtFn={fmtFn}/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{padding:"10px 14px",background:fits?"#f0fdf4":"#fef2f2",borderTop:"1px solid #f3f4f6",fontSize:12,display:"flex",justifyContent:"space-between"}}>
                <span style={{color:fits?"#15803d":"#dc2626",fontWeight:600}}>{fits?"✓ Nueva cuota dentro del 20%":"⚠ Nueva cuota supera el 20%"}</span>
                <span style={{color:"#6b7280"}}>Límite: <b>{fmt(sel.salary*0.2)}/mes</b></span>
              </div>
            </div>
          )}
          <Btn variant="primary" style={{marginTop:16,width:"100%",justifyContent:"center"}} onClick={()=>sel&&setModal(true)}>Guardar cambios</Btn>
        </Card>
      )}
      {mode==="bulk" && <Card><div style={{fontSize:13,color:"#6b7280"}}>Modo masivo — demo visual.</div></Card>}
      {modal&&sel&&(
        <Modal>
          <div style={{fontWeight:700,fontSize:17,color:"#111827",marginBottom:4}}>Confirmar modificación</div>
          <div style={{fontSize:13,color:"#6b7280",marginBottom:16}}>Revisá los cambios antes de guardar.</div>
          <div style={{border:"1px solid #e5e7eb",borderRadius:10,overflow:"hidden",marginBottom:20}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead><tr style={{background:"#f9fafb",borderBottom:"1px solid #f3f4f6"}}>{["","Antes","→","Después"].map(h=><th key={h} style={{padding:"8px 14px",textAlign:h==="Antes"?"right":"left",color:"#9ca3af",fontWeight:600,fontSize:11}}>{h}</th>)}</tr></thead>
              <tbody>{[[" Monto",sel.amount,+form.amount,fmt],[" Plazo",sel.term,+form.term,v=>v+"m"],[" Tasa",sel.rate*100,+form.rate,v=>v.toFixed(1)+"%"],[" Cuota",oldMp,newMp,v=>fmt(v)+"/mes"]].map(([label,old,nv,fmtFn])=>(
                <tr key={label} style={{borderBottom:"1px solid #f3f4f6"}}>
                  <td style={{padding:"9px 14px",color:"#6b7280",fontWeight:600,fontSize:12}}>{label}</td>
                  <td style={{padding:"9px 14px",textAlign:"right",color:"#9ca3af",textDecoration:"line-through",fontSize:12}}>{fmtFn(old)}</td>
                  <td style={{padding:"9px 14px",textAlign:"center",color:"#d1d5db"}}>→</td>
                  <td style={{padding:"9px 14px",fontWeight:700,color:nv>old?"#dc2626":nv<old?"#15803d":"#374151"}}>{fmtFn(nv)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div style={{display:"flex",gap:8}}><Btn variant="outline" style={{flex:1,justifyContent:"center"}} onClick={()=>setModal(false)}>Cancelar</Btn><Btn variant="primary" style={{flex:1,justifyContent:"center"}} onClick={doModify}>Guardar cambios</Btn></div>
        </Modal>
      )}
    </div>
  );
}

function PoliciesView({policies, setPolicies, usedCapital}) {
  const [editing, setEditing] = useState(null);
  const [form,    setForm]    = useState({});
  const [preview, setPreview] = useState(30000);
  const setF=(k,v)=>setForm(f=>({...f,[k]:+v}));

  return (
    <div>
      <div style={{marginBottom:20}}><h2 style={{margin:0,fontSize:22,fontWeight:700,color:"#111827"}}>Políticas por Rating</h2><div style={{color:"#6b7280",fontSize:13,marginTop:2}}>Parámetros de crédito y capital disponible por nivel de riesgo</div></div>
      <Card style={{marginBottom:20,maxWidth:380,padding:16}}>
        <Lbl>Salario de referencia (simulación)</Lbl>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <Input type="number" value={preview} onChange={e=>setPreview(+e.target.value)} style={{maxWidth:160}}/>
          <div style={{fontSize:13}}>20% = <b style={{color:"#4f46e5"}}>{fmt(preview*0.2)}/mes</b></div>
        </div>
      </Card>
      <Card style={{marginBottom:20,padding:16}}>
        <div style={{fontWeight:700,fontSize:13,color:"#111827",marginBottom:12}}>🏦 Resumen de Capital por Rating</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:12}}>
          {RATING_LABELS.map(r=>{
            const pol=policies[r];
            const used=usedCapital[r]||0;
            const avail=Math.max(0,pol.capitalCap-used);
            const pctUsed=pol.capitalCap>0?Math.min(used/pol.capitalCap,1):0;
            const barColor=pctUsed>=1?"#dc2626":pctUsed>=0.8?"#d97706":RATING_COLORS[r];
            return (
              <div key={r} style={{background:"#f9fafb",border:"1px solid #f3f4f6",borderRadius:10,padding:12,borderTop:`3px solid ${RATING_COLORS[r]}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <RBadge r={r}/>
                  <span style={{fontSize:11,fontWeight:700,color:barColor}}>{Math.round(pctUsed*100)}%</span>
                </div>
                <div style={{background:"#e5e7eb",borderRadius:99,height:5,overflow:"hidden",marginBottom:6}}>
                  <div style={{width:`${Math.round(pctUsed*100)}%`,height:"100%",background:barColor,borderRadius:99}}/>
                </div>
                <div style={{fontSize:10,color:"#6b7280"}}>Disponible: <b style={{color:"#111827"}}>{fmt(avail)}</b></div>
                <div style={{fontSize:10,color:"#9ca3af"}}>CAP: {fmt(pol.capitalCap)}</div>
              </div>
            );
          })}
        </div>
      </Card>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16,marginBottom:32}}>
        {RATING_LABELS.map(r=>{
          const pol=policies[r];
          const maxA=Math.min(preview*0.2*pol.maxTerm,pol.maxAmount);
          const mp=mPay(maxA,pol.rate,pol.maxTerm);
          const fits=mp<=preview*0.2;
          const isEdit=editing===r;
          const used=usedCapital[r]||0;
          return (
            <Card key={r} style={{borderTop:`3px solid ${RATING_COLORS[r]}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:10,height:10,borderRadius:"50%",background:RATING_COLORS[r]}}/><span style={{fontWeight:800,fontSize:17,color:"#111827"}}>Rating {r}</span></div>
                {!isEdit&&<Btn variant="outline" style={{padding:"4px 10px",fontSize:11}} onClick={()=>{setEditing(r);setForm({...pol});}}>✏ Editar</Btn>}
              </div>
              {isEdit?(
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  <div><Lbl>Tope por crédito (MXN)</Lbl><Input type="number" value={form.maxAmount} onChange={e=>setF("maxAmount",e.target.value)}/></div>
                  <div><Lbl>Tasa mensual (ej: 0.022)</Lbl><Input type="number" step="0.001" value={form.rate} onChange={e=>setF("rate",e.target.value)}/></div>
                  <div><Lbl>Plazo máximo (meses)</Lbl><Input type="number" value={form.maxTerm} onChange={e=>setF("maxTerm",e.target.value)}/></div>
                  <div>
                    <Lbl>CAP de capital total (MXN)</Lbl>
                    <Input type="number" value={form.capitalCap} onChange={e=>setF("capitalCap",e.target.value)} style={{borderColor:"#818cf8"}}/>
                    <div style={{fontSize:11,color:"#6b7280",marginTop:3}}>Límite máximo de capital colocado simultáneamente para este rating</div>
                  </div>
                  <div style={{display:"flex",gap:8,marginTop:4}}>
                    <Btn variant="success" style={{flex:1,justifyContent:"center"}} onClick={()=>{setPolicies(p=>({...p,[r]:form}));setEditing(null);}}>Guardar</Btn>
                    <Btn variant="outline" style={{flex:1,justifyContent:"center"}} onClick={()=>setEditing(null)}>Cancelar</Btn>
                  </div>
                </div>
              ):(
                <>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
                    {[["Tope/crédito",fmt(pol.maxAmount)],["Tasa",pct(pol.rate)],["Plazo",pol.maxTerm+"m"]].map(([label,val])=>(
                      <div key={label} style={{background:"#f9fafb",borderRadius:8,padding:8,textAlign:"center",border:"1px solid #f3f4f6"}}>
                        <div style={{fontSize:10,color:"#9ca3af",marginBottom:2}}>{label}</div>
                        <div style={{fontWeight:700,fontSize:13,color:"#111827"}}>{val}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{background:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:10,padding:12,marginBottom:14}}>
                    <div style={{fontSize:11,fontWeight:700,color:"#374151",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span>🏦 Capital CAP</span>
                      <span style={{fontWeight:800,fontSize:13,color:RATING_COLORS[r]}}>{fmt(pol.capitalCap)}</span>
                    </div>
                    <CapBar used={used} cap={pol.capitalCap} color={RATING_COLORS[r]}/>
                    <div style={{marginTop:8,padding:"6px 10px",background:"#fff",border:"1px solid #e5e7eb",borderRadius:7,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{fontSize:11,color:"#6b7280"}}>Disponible</span>
                      <span style={{fontSize:13,fontWeight:800,color:Math.max(0,pol.capitalCap-used)===0?"#dc2626":RATING_COLORS[r]}}>{fmt(Math.max(0,pol.capitalCap-used))}</span>
                    </div>
                  </div>
                  <div style={{background:fits?"#f0fdf4":"#fef2f2",border:`1px solid ${fits?"#bbf7d0":"#fecaca"}`,borderRadius:8,padding:"10px 12px"}}>
                    <div style={{fontSize:11,color:"#6b7280",marginBottom:4}}>Con {fmt(preview)} de salario:</div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div><div style={{fontWeight:700,color:"#111827"}}>{fmt(maxA)}</div><div style={{fontSize:11,color:"#9ca3af"}}>monto ofrecido</div></div>
                      <div style={{textAlign:"right"}}><div style={{fontWeight:700,color:fits?"#15803d":"#dc2626",fontSize:15}}>{fmt(mp)}/mes</div><div style={{fontSize:11,color:fits?"#15803d":"#dc2626"}}>{fits?"✓ Dentro del 20%":"⚠ Supera el 20%"}</div></div>
                    </div>
                  </div>
                </>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
