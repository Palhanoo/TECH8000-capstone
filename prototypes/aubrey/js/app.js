const KEY='signalclub_demo_v1', LIMIT=30*60*1000;
const $=s=>document.querySelector(s);
const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let mem=null, mode='signal', rate=0, notice='', lastTouch=0;

/* Cache layer: localStorage with in-memory fallback */
function get(){try{const r=localStorage.getItem(KEY);return r?JSON.parse(r):null}catch(e){return mem}}
function set(s){mem=s;try{localStorage.setItem(KEY,JSON.stringify(s))}catch(e){}}
function wipe(){mem=null;try{localStorage.removeItem(KEY)}catch(e){}}

/* Inactivity: any interaction refreshes the clock; 30 min idle deletes everything */
function touch(){const n=Date.now();if(n-lastTouch<1500)return;lastTouch=n;const s=get();if(s&&n-s.last<LIMIT){s.last=n;set(s)}}
['click','keydown','touchstart','scroll','mousemove'].forEach(e=>addEventListener(e,touch,{passive:true}));
function tick(){
  const s=get();
  if(!s){if(!$('#app').classList.contains('hidden'))showLogin();return}
  const left=LIMIT-(Date.now()-s.last);
  if(left<=0){wipe();notice='Your session ended after 30 minutes of inactivity and the cached data was deleted.';showLogin();return}
  const m=Math.floor(left/60000),sec=String(Math.floor(left%60000/1000)).padStart(2,'0');
  const t=$('#timer');t.textContent=m+':'+sec;
  const low=left<120000;t.className='chip mr-2 '+(low?'bg-alert text-white':'bg-sage text-navy');
}
setInterval(tick,1000);
document.addEventListener('visibilitychange',tick);

function toast(m){const t=$('#toast');t.textContent=m;t.classList.remove('hidden');clearTimeout(toast.h);toast.h=setTimeout(()=>t.classList.add('hidden'),2600)}
const ago=t=>{const m=Math.max(0,Math.round((Date.now()-t)/60000));return m<1?'just now':m<60?m+' min ago':Math.floor(m/60)+' h ago'};
const col=r=>r<=1?'#bf0603':r<=2?'#bf0603':r===3?'#f4d58d':'#708d81';
const label=r=>['','No signal','Weak','Fair','Good','Excellent'][r];
const bars=r=>'<span class="inline-flex items-end gap-0.5 h-5" aria-label="'+label(r)+'">'+[1,2,3,4,5].map(i=>'<span class="bar" style="height:'+(i*20)+'%;'+(i<=r?'background:'+col(r):'')+'"></span>').join('')+'</span>';
const sevCls={Urgent:'bg-alert text-white',Caution:'bg-sand text-navy',Info:'bg-sage text-navy'};

function seed(){
  const n=Date.now(),m=60000;
  return [
    {id:1,type:'signal',carrier:'Telstra',net:'5G',rating:5,loc:'Melbourne CBD',note:'Full bars all morning.',t:n-8*m},
    {id:2,type:'signal',carrier:'Optus',net:'4G',rating:2,loc:'Footscray Station',note:'Drops on the platform.',t:n-25*m},
    {id:3,type:'signal',carrier:'Vodafone',net:'4G',rating:3,loc:'Docklands',note:'',t:n-47*m},
    {id:4,type:'signal',carrier:'Telstra',net:'4G',rating:1,loc:'Yarra Ranges trail',note:'No signal for 2 km.',t:n-90*m},
    {id:5,type:'signal',carrier:'Optus',net:'5G',rating:4,loc:'Southbank',note:'',t:n-130*m},
    {id:6,type:'alert',cat:'Stranded or no signal',sev:'Caution',loc:'Yarra Ranges trail',note:'Hikers report no coverage past the lookout. Go in pairs.',anon:true,t:n-75*m}
  ].map(r=>({...r,sample:true}));
}

/* Views */
function showLogin(){$('#app').classList.add('hidden');const l=$('#login');l.classList.remove('hidden');l.classList.add('flex');const x=$('#notice');if(notice){x.textContent=notice;x.classList.remove('hidden')}else x.classList.add('hidden');notice=''}
function showApp(){const l=$('#login');l.classList.add('hidden');l.classList.remove('flex');$('#app').classList.remove('hidden');route();tick()}

function route(){
  const v=(location.hash||'#dashboard').slice(1);
  const view=['dashboard','report','stats'].includes(v)?v:'dashboard';
  document.querySelectorAll('[data-nav]').forEach(a=>{const on=a.dataset.nav===view;a.style.color=on?'#bf0603':'';a.style.boxShadow=on?'inset 0 3px 0 #bf0603':'none'});
  $('#main').innerHTML={dashboard,report,stats}[view]();
  scrollTo(0,0);
}
addEventListener('hashchange',()=>{if(get())route()});

function sigCard(r){return '<li class="bg-card border border-line rounded-2xl p-4 flex gap-3 items-start">'+bars(r.rating)+'<div class="min-w-0 flex-1"><p class="font-semibold">'+esc(r.loc)+' <span class="text-mute font-normal">· '+esc(r.carrier)+' '+esc(r.net)+'</span></p><p class="text-sm text-mute">'+label(r.rating)+(r.note?'. '+esc(r.note):'')+'</p></div><span class="text-xs text-mute whitespace-nowrap">'+ago(r.t)+'</span></li>'}
function alCard(r){return '<li class="bg-card border-l-4 border-alert rounded-2xl p-4" style="border-top:1px solid var(--line);border-right:1px solid var(--line);border-bottom:1px solid var(--line)"><div class="flex items-center gap-2 flex-wrap"><span class="chip '+sevCls[r.sev]+'">'+r.sev+'</span><span class="font-semibold">'+esc(r.cat)+'</span><span class="text-xs text-mute ml-auto">'+ago(r.t)+'</span></div><p class="mt-1 text-sm">'+esc(r.loc)+(r.note?'. '+esc(r.note):'')+'</p><p class="text-xs text-mute mt-1">Posted by '+(r.anon?'an anonymous member':esc(r.by||'a member'))+'</p></li>'}

function dashboard(){
  const s=get(),R=s.reports.slice().sort((a,b)=>b.t-a.t),sig=R.filter(r=>r.type==='signal'),al=R.filter(r=>r.type==='alert');
  const avg=sig.length?(sig.reduce((a,r)=>a+r.rating,0)/sig.length).toFixed(1):'–';
  const tile=(n,l,c)=>'<div class="bg-card border border-line rounded-2xl p-4"><p class="text-3xl font-extrabold" style="color:'+(c||'inherit')+'">'+n+'</p><p class="text-sm text-mute">'+l+'</p></div>';
  return '<h2 class="text-2xl font-extrabold">Hi, '+esc(s.user.name)+'</h2><p class="text-mute">Here’s how the network looks right now.</p>'+
  '<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">'+tile(sig.length,'Signal reports')+tile(avg,'Average rating (of 5)')+tile(sig.filter(r=>r.rating===1).length,'No-signal reports','#bf0603')+tile(al.length,'Safety alerts','#bf0603')+'</div>'+
  '<h3 class="text-lg font-extrabold mt-7 mb-2">Safety alerts</h3>'+(al.length?'<ul class="space-y-3">'+al.map(alCard).join('')+'</ul>':'<p class="text-mute">No alerts. Use Report to post one if someone needs help.</p>')+
  '<p class="text-xs text-mute mt-3">Alerts are community posts. In an emergency, call 000.</p>'+
  '<h3 class="text-lg font-extrabold mt-7 mb-2">Latest signal reports</h3>'+(sig.length?'<ul class="space-y-3">'+sig.map(sigCard).join('')+'</ul>':'<p class="text-mute">No reports yet. Add the first one from Report.</p>');
}

function report(){
  const opt=a=>a.map(x=>'<option>'+x+'</option>').join('');
  const tab=(m,t)=>'<button data-mode="'+m+'" class="btn flex-1 '+(mode===m?(m==='alert'?'bg-alert text-white':'bg-sand text-navy'):'bg-card border border-line')+'">'+t+'</button>';
  let f;
  if(mode==='signal'){
    f='<form id="signalForm" class="space-y-4"><div><p class="text-sm font-semibold mb-1">How is your signal?</p><div class="grid grid-cols-5 gap-2">'+[1,2,3,4,5].map(i=>'<button type="button" data-r="'+i+'" class="btn !px-0 flex flex-col items-center gap-1 border border-line bg-card" style="'+(rate===i?'outline:2px solid '+col(i):'')+'">'+bars(i)+'<span class="text-xs">'+i+'</span></button>').join('')+'</div><p class="text-xs text-mute mt-1">1 means no signal, 5 means excellent.</p></div>'+
    '<div class="grid grid-cols-2 gap-3"><label class="text-sm font-semibold">Carrier<select name="carrier" class="in mt-1">'+opt(['Telstra','Optus','Vodafone','TPG','Other'])+'</select></label><label class="text-sm font-semibold">Network<select name="net" class="in mt-1">'+opt(['5G','4G','3G','Wi-Fi'])+'</select></label></div>'+
    '<label class="block text-sm font-semibold">Location<div class="flex gap-2 mt-1"><input name="loc" required class="in" placeholder="Suburb or landmark"><button type="button" data-act="geo" class="btn bg-sage text-navy whitespace-nowrap">Use GPS</button></div></label>'+
    '<label class="block text-sm font-semibold">Notes (optional)<textarea name="note" rows="2" class="in mt-1"></textarea></label><button class="btn w-full bg-sand text-navy">Submit signal report</button></form>';
  }else{
    f='<form id="alertForm" class="space-y-4"><p class="text-sm rounded-xl p-3 bg-sand text-navy font-semibold">Not a replacement for emergency services. If someone is in danger, call 000 first.</p>'+
    '<div class="grid grid-cols-2 gap-3"><label class="text-sm font-semibold">What’s happening?<select name="cat" class="in mt-1">'+opt(['Need help','Suspicious activity','Hazard','Stranded or no signal'])+'</select></label><label class="text-sm font-semibold">Severity<select name="sev" class="in mt-1">'+opt(['Info','Caution','Urgent'])+'</select></label></div>'+
    '<label class="block text-sm font-semibold">Location<input name="loc" required class="in mt-1" placeholder="Where is this?"></label>'+
    '<label class="block text-sm font-semibold">Details<textarea name="note" rows="3" required class="in mt-1" placeholder="What should members know?"></textarea></label>'+
    '<label class="flex items-center gap-2 text-sm"><input type="checkbox" name="anon" class="w-5 h-5 accent-red-700"> Post anonymously</label><button class="btn w-full bg-alert text-white">Send safety alert</button></form>';
  }
  return '<h2 class="text-2xl font-extrabold mb-3">New report</h2><div class="flex gap-2 mb-5">'+tab('signal','Signal report')+tab('alert','Safety alert')+'</div>'+f;
}

function stats(){
  const s=get(),sig=s.reports.filter(r=>r.type==='signal'),al=s.reports.filter(r=>r.type==='alert');
  if(!sig.length)return '<h2 class="text-2xl font-extrabold">Statistics</h2><p class="text-mute mt-2">Statistics appear once there are signal reports.</p>';
  const row=(l,v,max,txt,c)=>'<div class="flex items-center gap-3 text-sm py-1"><span class="w-24 shrink-0 truncate">'+esc(l)+'</span><div class="flex-1 h-3 rounded-full" style="background:var(--line)"><div class="h-3 rounded-full" style="width:'+(v/max*100)+'%;background:'+c+'"></div></div><span class="w-14 text-right text-mute">'+txt+'</span></div>';
  const grp=k=>{const g={};sig.forEach(r=>(g[r[k]]=g[r[k]]||[]).push(r));return g};
  const byC=Object.entries(grp('carrier')).map(([k,v])=>[k,v.reduce((a,r)=>a+r.rating,0)/v.length,v.length]).sort((a,b)=>b[1]-a[1]);
  const byN=Object.entries(grp('net')).map(([k,v])=>[k,v.length]).sort((a,b)=>b[1]-a[1]);
  const dist=[1,2,3,4,5].map(i=>[i,sig.filter(r=>r.rating===i).length]);
  const card=(t,b)=>'<section class="bg-card border border-line rounded-2xl p-4 mt-4"><h3 class="font-extrabold mb-2">'+t+'</h3>'+b+'</section>';
  const cats={};al.forEach(a=>cats[a.cat]=(cats[a.cat]||0)+1);
  return '<h2 class="text-2xl font-extrabold">Statistics</h2><p class="text-mute">Based on '+sig.length+' signal reports and '+al.length+' alerts in this session.</p>'+
  card('Average rating by carrier',byC.map(c=>row(c[0],c[1],5,c[1].toFixed(1)+' ('+c[2]+')','#708d81')).join(''))+
  card('How members rate their signal',dist.map(d=>row(label(d[0]),d[1],Math.max(...dist.map(x=>x[1]))||1,d[1],col(d[0]))).join(''))+
  card('Reports by network type',byN.map(n=>row(n[0],n[1],byN[0][1],n[1],'#f4d58d')).join(''))+
  card('Safety alerts by type',Object.keys(cats).length?Object.entries(cats).map(c=>row(c[0],c[1],al.length,c[1],'#8d0801')).join(''):'<p class="text-sm text-mute">No alerts yet.</p>');
}

/* Events */
$('#loginForm').addEventListener('submit',e=>{
  e.preventDefault();
  const email=$('#email').value.trim();
  set({user:{email,name:email.split('@')[0]||'member'},last:Date.now(),reports:seed()});
  location.hash='#dashboard';showApp();
});
$('#logout').addEventListener('click',()=>{wipe();notice='You logged out and the cached data was cleared.';showLogin()});
$('#main').addEventListener('click',e=>{
  const m=e.target.closest('[data-mode]'),r=e.target.closest('[data-r]'),g=e.target.closest('[data-act="geo"]');
  if(m){mode=m.dataset.mode;rate=0;route()}
  else if(r){const keep=document.querySelector('#signalForm');const v=Object.fromEntries(new FormData(keep));rate=+r.dataset.r;route();const f=document.querySelector('#signalForm');Object.entries(v).forEach(([k,x])=>{if(f.elements[k])f.elements[k].value=x})}
  else if(g){navigator.geolocation?navigator.geolocation.getCurrentPosition(p=>{document.querySelector('[name=loc]').value=p.coords.latitude.toFixed(4)+', '+p.coords.longitude.toFixed(4)},()=>toast('Location unavailable. Type it in instead.')):toast('GPS is not supported here.')}
});
$('#main').addEventListener('submit',e=>{
  e.preventDefault();
  const s=get();if(!s)return;
  const d=Object.fromEntries(new FormData(e.target)),base={id:Date.now(),t:Date.now(),loc:d.loc.trim(),note:(d.note||'').trim()};
  if(e.target.id==='signalForm'){
    if(!rate){toast('Pick a signal rating first.');return}
    s.reports.push({...base,type:'signal',carrier:d.carrier,net:d.net,rating:rate});rate=0;
  }else{
    s.reports.push({...base,type:'alert',cat:d.cat,sev:d.sev,anon:!!d.anon,by:s.user.name});
  }
  s.last=Date.now();set(s);toast('Report saved');location.hash='#dashboard';route();
});

/* Start: resume a cached session if it is still within 30 minutes */
(function(){
  const s=get();
  if(s&&Date.now()-s.last>LIMIT){wipe();notice='Your session ended after 30 minutes of inactivity and the cached data was deleted.'}
  get()?showApp():showLogin();
})();