'use strict';
let LS;try{localStorage.setItem('_t','1');LS=localStorage}catch(e){const m={};LS={fake:1,getItem:k=>m[k]??null,setItem:(k,v)=>{m[k]=String(v)},removeItem:k=>{delete m[k]}}}
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const K='sanabil_db',TK='sanabil_tg_token';
let DB=JSON.parse(LS.getItem(K)||'null')||{families:[],dist:{},queue:[],settings:{sheetUrl:'',tgChat:'',theme:'light',lastSync:0}};
const save=()=>LS.setItem(K,JSON.stringify(DB));
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const norm=s=>String(s||'').replace(/[\u064B-\u0652\u0640]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/\s+/g,' ').trim().toLowerCase();
const n=x=>Number(x||0).toLocaleString('en-US');
const taf=k=>`${Math.floor(k/50)} كيس و ${k%50} كغم`;
const uid=()=>'id_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8);
const MON=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const LBL={full:'مستلم بالكامل',part:'مستلم جزئي',none:'غير مستلم'};
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('on'),2400)}
function modal(h){const m=$('#modal');m.innerHTML=`<div class="sheet">${h}</div>`;m.classList.add('on');m.onclick=e=>{if(e.target===m)closeM()}}
const closeM=()=>$('#modal').classList.remove('on');
function ask(msg,yes){modal(`<h3>${msg}</h3><div class="row"><button class="btn danger" id="y">نعم</button><button class="btn ghost" id="x">إلغاء</button></div>`);$('#y').onclick=()=>{closeM();yes()};$('#x').onclick=closeM}
async function dl(name,blob){
 const cap=window.Capacitor,plugin=cap?.Plugins?.SanabilDownloads;
 if(cap?.isNativePlatform?.()){
  if(!plugin?.saveFile)throw new Error('خدمة حفظ الملفات غير متاحة في نسخة Android');
  const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result).split(',')[1]);r.onerror=()=>reject(new Error('تعذرت قراءة الملف'));r.readAsDataURL(blob)});
  const saved=await plugin.saveFile({fileName:name,mimeType:blob.type||'application/octet-stream',data});
  if(!saved?.uri)throw new Error('لم يؤكد Android حفظ الملف');
  return {native:true,location:'Download/Sanabil'};
 }
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.style.display='none';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
 return {native:false};
}
const jsonBlob=o=>new Blob([JSON.stringify(o,null,2)],{type:'application/json'});
const readFile=(inp,cb)=>{const f=inp.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{cb(JSON.parse(r.result))}catch{toast('الملف غير صالح')}inp.value=''};r.readAsText(f)};
const loadJs=u=>new Promise((ok,no)=>{if(loadJs[u])return ok();const s=document.createElement('script');s.src=u;s.onload=()=>{loadJs[u]=1;ok()};s.onerror=no;document.head.appendChild(s)});

/* ---------- navigation ---------- */
function go(p){$$('.page').forEach(s=>s.classList.toggle('on',s.id==='p-'+p));$$('nav button').forEach(b=>b.classList.toggle('on',b.dataset.p===p));$('nav').style.setProperty('--i',['home','fam','dist','stats','set'].indexOf(p));scrollTo(0,0);({fam:renderFam,dist:renderDist,stats:renderStats,set:renderSet,home:prev})[p]();syncSel()}
$$('nav button').forEach(b=>b.onclick=()=>go(b.dataset.p));

/* ---------- home ---------- */
function prev(){const m=+$('#hMem').value||0;$('#hPrev').textContent=m?`الحصة: ${n(m*9)} كغم (${taf(m*9)}) — المبلغ: ${n(m*250)} د.ع`:'الحصة والمبلغ يظهران هنا'}
$('#hMem').oninput=prev;
$('#hSave').onclick=()=>{const name=$('#hName').value.trim(),m=+$('#hMem').value;if(!name||m<1)return toast('أدخل الاسم وعدد الأفراد');
 DB.families.push({id:uid(),name,members:m,page:$('#hPage').value.trim(),notes:$('#hNotes').value.trim(),flour:m*9,amount:m*250,linkedIds:[],created:Date.now()});save();
 ['#hName','#hMem','#hPage','#hNotes'].forEach(s=>$(s).value='');prev();toast('تمت إضافة العائلة ✓')};

/* ---------- families ---------- */
let lim=40;
const famName=id=>DB.families.find(f=>f.id===id)?.name;
function renderFam(){const q=norm($('#famQ').value);const l=DB.families.filter(f=>!q||norm(f.name).includes(q)||String(f.page)===q);
 $('#famCount').textContent=`${n(l.length)} عائلة`;$('#famList').innerHTML=l.slice(0,lim).map(famRow).join('')||'<p class="muted">لا توجد نتائج. يمكنك الاستعادة من ملف نسخة احتياطية.</p>';$('#famMore').hidden=l.length<=lim}
function famRow(f){const lk=(f.linkedIds||[]).map(famName).filter(Boolean);
 return `<article class="card" data-id="${f.id}"><div class="top"><h3>${esc(f.name)}</h3><span class="pg">صفحة ${esc(f.page)}</span></div>
 <div class="grid"><div><i>عدد الأفراد</i><b>${f.members}</b></div><div><i>الحصة الشهرية</i><b>${n(f.flour)} كغم</b></div><div><i>التفصيل</i><b>${taf(f.flour)}</b></div><div><i>المبلغ المستحق</i><b>${n(f.amount)} د.ع</b></div></div>
 ${lk.length?`<p class="lk">العوائل المرتبطة: ${lk.map(esc).join('، ')}</p>`:''}${f.notes?`<p class="nt">${esc(f.notes)}</p>`:''}
 <div class="acts"><button data-a="edit">تعديل التفاصيل</button><button data-a="var">المتغيرات</button><button data-a="link">ربط العوائل</button><button data-a="del" class="d">حذف</button></div></article>`}
$('#famQ').oninput=()=>{lim=40;renderFam()};$('#famMore').onclick=()=>{lim+=60;renderFam()};
$('#famList').onclick=e=>{const b=e.target.closest('[data-a]');if(!b)return;const f=DB.families.find(x=>x.id===b.closest('.card').dataset.id);({edit:()=>editF(f),var:()=>varF(f),link:()=>linkF(f),del:()=>ask(`هل تود بالفعل حذف عائلة «${esc(f.name)}» بالكامل؟`,()=>{DB.families=DB.families.filter(x=>x!==f);DB.families.forEach(x=>x.linkedIds=(x.linkedIds||[]).filter(i=>i!==f.id));save();renderFam();toast('تم الحذف')})})[b.dataset.a]()};
function editF(f){modal(`<h3>تعديل التفاصيل</h3><label>الاسم<input id="eN" value="${esc(f.name)}"></label><div class="two"><label>عدد الأفراد<input id="eM" type="number" value="${f.members}"></label><label>رقم الصفحة<input id="eP" value="${esc(f.page)}"></label></div><label>الملاحظات<textarea id="eT" rows="2">${esc(f.notes)}</textarea></label><p class="muted">الحصة والمبلغ لا يتغيران من هنا (استخدم «المتغيرات»).</p><button class="btn" id="eS">حفظ</button>`);
 $('#eS').onclick=()=>{f.name=$('#eN').value.trim()||f.name;f.members=+$('#eM').value||f.members;f.page=$('#eP').value.trim();f.notes=$('#eT').value.trim();save();closeM();renderFam();toast('تم الحفظ ✓')}}
function varF(f){modal(`<h3>المتغيرات — ${esc(f.name)}</h3><p id="vI" class="prev"></p><label>عدد الأفراد<select id="vN">${Array.from({length:20},(_,i)=>`<option>${i+1}</option>`).join('')}</select></label><div class="row"><button class="btn" id="vA">إضافة فرد</button><button class="btn ghost" id="vD">حذف فرد</button></div>`);
 const info=()=>$('#vI').textContent=`الأفراد: ${f.members} · الحصة: ${n(f.flour)} كغم · المبلغ: ${n(f.amount)} د.ع`;info();
 const ch=s=>{f.members=Math.max(1,f.members+s*(+$('#vN').value));f.flour=f.members*9;f.amount=f.members*250;save();info();renderFam()};syncSel();$('#vA').onclick=()=>ch(1);$('#vD').onclick=()=>ch(-1)}
function linkF(f){const sel=new Set(f.linkedIds||[]);modal(`<h3>ربط عوائل بـ «${esc(f.name)}»</h3><input id="lQ" class="search" placeholder="ابحث عن العائلة…"><div id="lL"></div><button class="btn" id="lS">حفظ المعلومات</button>`);
 const draw=()=>{const q=norm($('#lQ').value);const l=DB.families.filter(x=>x!==f&&(sel.has(x.id)||(q&&norm(x.name).includes(q)))).slice(0,30);$('#lL').innerHTML=l.map(x=>`<label class="ck"><input type="checkbox" value="${x.id}" ${sel.has(x.id)?'checked':''}>${esc(x.name)} <small class="muted">ص${esc(x.page)}</small></label>`).join('')||'<p class="muted">اكتب للبحث</p>'};draw();
 $('#lQ').oninput=draw;$('#lL').onchange=e=>{e.target.checked?sel.add(e.target.value):sel.delete(e.target.value)};
 $('#lS').onclick=()=>{f.linkedIds=[...sel];save();closeM();renderFam();toast('تم الربط ✓')}}
$('#famBk').onclick=async()=>{try{await dl(`families-backup-${new Date().toISOString().slice(0,10)}.json`,jsonBlob({type:'flour-families-backup',version:2,createdAt:new Date().toISOString(),data:{families:DB.families}}));toast(window.Capacitor?.isNativePlatform?.()?'تم حفظ النسخة في التنزيلات / Sanabil ✓':'بدأ تنزيل النسخة الاحتياطية')}catch(e){toast('فشل حفظ النسخة: '+e.message)}};
$('#famRs').onclick=()=>$('#famFile').click();
$('#famFile').onchange=e=>readFile(e.target,j=>{const l=(j.data||j).families;if(!Array.isArray(l))return toast('لا توجد بيانات عوائل');ask(`استبدال العوائل الحالية بـ ${n(l.length)} عائلة من الملف؟`,()=>{DB.families=l;save();renderFam();toast('تمت الاستعادة ✓')})});

/* ---------- distribution ---------- */
function fillYM(y,m){if(y.options.length)return;const Y=Math.min(2040,Math.max(2026,new Date().getFullYear()));for(let i=2026;i<=2040;i++)y.add(new Option(i,i,0,i===Y));MON.forEach((t,i)=>m.add(new Option(t,String(i+1).padStart(2,'0'),0,i===new Date().getMonth())))}
const key=(y='#dY',m='#dM')=>$(y).value+'-'+$(m).value;
function recOf(f,k){return DB.dist[k]?.recs?.[f.id]||{}}
function calc(f,k){const r=recOf(f,k),b=Math.floor(f.flour/50),x=f.flour%50,kg=(r.bag?b*50:0)+(r.extra?x:0);
 const s=!r.bag&&!r.extra?'none':((!b||r.bag)&&(!x||r.extra))?'full':'part';return{r,b,x,kg,s,money:f.flour?Math.round(f.amount*kg/f.flour):0}}
function renderDist(){fillYM($('#dY'),$('#dM'));$('#dBy').value=DB.dist[key()]?.distributor||'';tick();renderRes()}
const tick=()=>$('#dTime').textContent='التاريخ والوقت: '+new Date().toLocaleString('ar-IQ',{dateStyle:'medium',timeStyle:'short'});setInterval(tick,30000);
$('#dY').onchange=$('#dM').onchange=renderDist;$('#dQ').oninput=renderRes;
$('#dBy').oninput=()=>{const k=key(),D=DB.dist[k]||(DB.dist[k]={distributor:'',datetime:Date.now(),recs:{}});D.distributor=$('#dBy').value.trim();save()};
function dCard(f,k){const c=calc(f,k);return `<div class="dc" data-id="${f.id}"><div class="top"><h3>${esc(f.name)}</h3><span class="chip s-${c.s}">${LBL[c.s]}</span></div>
 <div class="row2"><span>رقم الصفحة</span><b>${esc(f.page)}</b></div>${f.notes?`<div class="row2"><span>الملاحظات</span><b>${esc(f.notes)}</b></div>`:''}
 <div class="row2"><span>عدد أفراد الأسرة</span><b>${f.members}</b></div><div class="row2"><span>الحصة الشهرية</span><b>${n(f.flour)} كغم = ${taf(f.flour)}</b></div><div class="row2"><span>المبلغ المستحق</span><b>${n(f.amount)} د.ع</b></div>
 <label class="ck"><input type="checkbox" class="cb-bag" ${c.r.bag?'checked disabled':''} ${c.b?'':'disabled'}>استلام الأكياس (${c.b} كيس)</label>
 <label class="ck"><input type="checkbox" class="cb-ex" ${c.r.extra?'checked disabled':''} ${c.x?'':'disabled'}>استلام الكيلوات فوق الكيس (${c.x} كغم)</label>
 <div class="row2"><span>المبلغ المستلم فعلياً</span><b>${n(c.money)} د.ع</b></div><div class="row2"><span>الكمية المستلمة</span><b>${n(c.kg)} كغم</b></div><div class="row2"><span>الكمية المتبقية عند الموزع</span><b>${n(f.flour-c.kg)} كغم</b></div>
 ${c.s==='full'?'':'<button class="btn" data-a="one">تسليم وتسجيل الاستلام</button>'}</div>`}
function renderRes(){const q=norm($('#dQ').value),k=key();if(!q)return $('#dRes').innerHTML='<p class="muted">ابحث عن عائلة لبدء التوزيع.</p>';
 const l=DB.families.filter(f=>norm(f.name).includes(q)||String(f.page)===q).slice(0,8);
 $('#dRes').innerHTML=l.map(f=>{const g=[f,...(f.linkedIds||[]).map(i=>DB.families.find(x=>x.id===i)).filter(Boolean)];if(g.length<2)return dCard(f,k);
  const S=a=>g.reduce((t,x)=>t+x[a],0);return `<div class="grp"><h4>عوائل مرتبطة — المجموع: ${S('members')} فرد · ${n(S('flour'))} كغم · ${n(S('amount'))} د.ع</h4>${g.map(x=>dCard(x,k)).join('')}<button class="btn" data-a="joint" data-ids="${g.map(x=>x.id).join(',')}">تسليم وتسجيل الاستلام بشكل مشترك</button></div>`}).join('')||'<p class="muted">لا توجد نتائج.</p>'}
$('#dRes').onclick=e=>{const b=e.target.closest('[data-a]');if(!b)return;deliver(b.dataset.a==='one'?[b.closest('.dc').dataset.id]:b.dataset.ids.split(','),b.closest('.grp,.dc'))};
function deliver(ids,scope){const k=key(),by=$('#dBy').value.trim(),D=DB.dist[k]||(DB.dist[k]={distributor:by,datetime:Date.now(),recs:{}});if(!D.distributor)D.distributor=by;let done=0;
 for(const id of ids){const f=DB.families.find(x=>x.id===id),el=scope.dataset?.id===id?scope:scope.querySelector(`.dc[data-id="${id}"]`);if(!f||!el)continue;
  const c=calc(f,k),cb=el.querySelector('.cb-bag'),ce=el.querySelector('.cb-ex'),aB=cb&&!cb.disabled&&cb.checked,aE=ce&&!ce.disabled&&ce.checked;if(!aB&&!aE)continue;
  const r=D.recs[id]=D.recs[id]||{};if(aB)r.bag=1;if(aE)r.extra=1;r.t=Date.now();const kg=(aB?c.b*50:0)+(aE?c.x:0);done++;notify(f,kg,Math.round(f.amount*kg/f.flour),k)}
 if(!done)return toast('حدّد الكيس أو الكيلوات أولاً');save();renderRes();toast('تم تسجيل الاستلام ✓')}
async function tg(text){const t=LS.getItem(TK),c=DB.settings.tgChat||'-1003999892523';if(!t||!c)return;try{await fetch(`https://api.telegram.org/bot${t}/sendMessage`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:c,text})})}catch{}}
async function sheet(p){const u=DB.settings.sheetUrl;if(!u)return true;try{await fetch(u,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain'},body:JSON.stringify(p)});return true}catch{return false}}
async function flush(){const q=DB.queue;DB.queue=[];for(const p of q)if(!await sheet(p))DB.queue.push(p);save()}addEventListener('online',flush);
async function notify(f,kg,money,k){const [y,m]=k.split('-');
 tg(`📦 تم تسجيل تسليم حصة طحين\n\n👤 اسم رب الأسرة: ${f.name}\n👨‍👩‍👧‍👦 عدد أفراد الأسرة: ${f.members} فرد\n🌾 حصة الطحين المستلمة: ${n(kg)} كغم\n💰 المبلغ المستحصل: ${n(money)} د.ع\n📅 الشهر والسنة: ${MON[m-1]} ${y}\n🕒 تاريخ ووقت التسليم: ${new Date().toLocaleString('ar-IQ',{dateStyle:'short',timeStyle:'short'})}`);
 const p={action:'delivery',month:k,family:f.name,id:f.id,members:f.members,kg,amount:money,distributor:DB.dist[k].distributor,time:new Date().toISOString()};if(!await sheet(p)){DB.queue.push(p);save()}}

/* ---------- stats ---------- */
let LISTS={};const pn=f=>{const m=String(f.page).match(/\d+/);return m?+m[0]:1e9};
function renderStats(){fillYM($('#sY'),$('#sM'));const k=key('#sY','#sM');LISTS={all:[],full:[],part:[],none:[]};let money=0,bg=0,kx=0,mem=0;
 [...DB.families].sort((a,b)=>pn(a)-pn(b)).forEach(f=>{const c=calc(f,k);LISTS.all.push(f);LISTS[c.s].push(f);mem+=+f.members||0;money+=c.money;if(c.r.bag)bg+=c.b;if(c.r.extra)kx+=c.x});
 $('#sGrid').innerHTML=[['إجمالي الأسر',n(DB.families.length)],['إجمالي أفراد الأسر',n(mem)],['إجمالي المبلغ المستحصل',n(money)+' د.ع'],['الأكياس الموزعة',`${n(bg)} كيس${kx?` + ${n(kx)} كغم`:''}`]].map(([a,b])=>`<div><b>${b}</b><span>${a}</span></div>`).join('');
 const T={all:'أسماء الأسر بالكامل',full:'المستلمة بالكامل',part:'المستلمة جزئياً',none:'غير المستلمة إطلاقاً'};
 $('#sLists').innerHTML=Object.keys(T).map(i=>`<details><summary>${T[i]} (${n(LISTS[i].length)})</summary><input data-l="${i}" placeholder="بحث سريع…"><ol id="ls-${i}"></ol></details>`).join('');Object.keys(T).forEach(i=>drawL(i))}
function drawL(i,q=''){q=norm(q);$('#ls-'+i).innerHTML=LISTS[i].filter(f=>!q||norm(f.name).includes(q)).map(f=>`<li>${esc(f.name)}</li>`).join('')}
$('#sLists').oninput=e=>e.target.dataset.l&&drawL(e.target.dataset.l,e.target.value);$('#sY').onchange=$('#sM').onchange=renderStats;
function exInfo(){const k=key('#sY','#sM'),li=$('#xL').value,items=LISTS[li]||[],title=`${$('#xL').selectedOptions[0].text} — ${MON[+k.slice(5)-1]} ${k.slice(0,4)}`,
 css='table{width:100%;border-collapse:collapse}td,th{border:1px solid #bbb;padding:6px 10px;text-align:right}th{background:#eee}',
 body=`<h2>${title}</h2><table><tr><th>#</th><th>اسم رب الأسرة</th><th>عدد الأفراد</th></tr>${items.map((f,i)=>`<tr><td>${i+1}</td><td>${esc(f.name)}</td><td>${f.members}</td></tr>`).join('')}</table>`;
 return{items,title,css,body,name:`${li}-${k}`,html:`<html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:Tahoma,Arial;padding:24px}${css}</style></head><body>${body}</body></html>`}}
async function make(f){const X=exInfo(),{items,title}=X;let blob;
 if(f==='txt')blob=new Blob(['\ufeff'+title+'\n\n'+items.map((x,i)=>`${i+1}. ${x.name} — ${x.members}`).join('\n')],{type:'text/plain'});
 else if(f==='html')blob=new Blob([X.html],{type:'text/html'});
 else if(f==='xlsx'){await loadJs('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js');const ws=XLSX.utils.aoa_to_sheet([['#','اسم رب الأسرة','عدد الأفراد'],...items.map((x,i)=>[i+1,x.name,+x.members])]),wb=XLSX.utils.book_new();ws['!cols']=[{wch:6},{wch:34},{wch:14}];wb.Workbook={Views:[{RTL:true}]};XLSX.utils.book_append_sheet(wb,ws,'القائمة');blob=new Blob([XLSX.write(wb,{type:'array',bookType:'xlsx'})],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'})}
 else if(f==='docx'){await loadJs('https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.umd.js');const {Document,Packer,Paragraph,TextRun,Table,TableRow,TableCell,WidthType}=docx,P=(t,b,z=26)=>new Paragraph({bidirectional:true,children:[new TextRun({text:String(t),rightToLeft:true,bold:!!b,size:z})]}),R=(a,b,c,h)=>new TableRow({children:[a,b,c].map((t,i)=>new TableCell({width:{size:[10,70,20][i],type:WidthType.PERCENTAGE},children:[P(t,h)]}))});
  blob=await Packer.toBlob(new Document({sections:[{children:[P(title,1,32),new Table({visuallyRightToLeft:true,width:{size:100,type:WidthType.PERCENTAGE},rows:[R('#','اسم رب الأسرة','عدد الأفراد',1),...items.map((x,i)=>R(i+1,x.name,x.members))]})]}]}))}
 else{await loadJs('https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js');const d=document.createElement('div');d.innerHTML=`<style>${X.css}</style>`+X.body;d.dir='rtl';d.style.cssText='font-family:Tahoma,Arial;color:#000;background:#fff;padding:10px;width:700px';blob=await html2pdf().set({margin:12,html2canvas:{scale:2},pagebreak:{mode:['css','legacy']}}).from(d).outputPdf('blob')}
 return{blob,name:`${X.name}.${f}`}}
const run=async fn=>{toast('جارٍ تجهيز الملف…');try{await fn(await make($('#xF').value))}catch(e){if(e.name!=='AbortError')toast('تعذّر إنشاء الملف (تحقق من الاتصال)')}};
$('#xDl').onclick=()=>run(async o=>{const r=await dl(o.name,o.blob);toast(r.native?'تم حفظ الملف في التنزيلات / Sanabil ✓':'بدأ تنزيل الملف')});
$('#xSh').onclick=()=>run(async o=>{const file=new File([o.blob],o.name,{type:o.blob.type});if(navigator.canShare?.({files:[file]}))await navigator.share({files:[file]});else{const r=await dl(o.name,o.blob);toast(r.native?'تم حفظ الملف في التنزيلات / Sanabil ✓':'بدأ تنزيل الملف')}});
$('#xPr').onclick=()=>{const w=open('','_blank');if(!w)return toast('اسمح بالنوافذ المنبثقة');w.document.write(exInfo().html);w.document.close();setTimeout(()=>w.print(),500)};

/* ---------- settings ---------- */
function renderSet(){$('#shUrl').value=DB.settings.sheetUrl||'';$('#tgTok').placeholder=LS.getItem(TK)?'••••• محفوظ على الجهاز':'';ping()}
async function ping(){const s=$('#shSt'),u=DB.settings.sheetUrl;if(!u){s.textContent='غير جاهز';s.className='chip bad';return}
 try{const r=await fetch(u+(u.includes('?')?'&':'?')+'action=ping');s.textContent=r.ok?'جاهز':'غير جاهز';s.className='chip '+(r.ok?'ready':'bad')}catch{s.textContent='غير جاهز';s.className='chip bad'}}
$('#shSave').onclick=()=>{DB.settings.sheetUrl=$('#shUrl').value.trim();save();ping();toast('تم حفظ الرابط')};
$('#shSync').onclick=async()=>{toast('جارٍ المزامنة…');await sheet({action:'syncAll',families:DB.families,dist:DB.dist});DB.settings.lastSync=Date.now();save();toast('تمت المزامنة ✓')};
$('#shRest').onclick=()=>ask('استبدال البيانات الحالية بالمحفوظة في Google Sheets؟',async()=>{try{const u=DB.settings.sheetUrl,j=await(await fetch(u+(u.includes('?')?'&':'?')+'action=restore')).json(),d=j.data||j;if(!Array.isArray(d.families))throw 0;DB.families=d.families;if(d.dist)DB.dist=d.dist;save();toast('تمت الاستعادة ✓')}catch{toast('تعذّرت الاستعادة')}});
$('#tgSave').onclick=()=>{const t=$('#tgTok').value.trim();if(t)LS.setItem(TK,t);if(!DB.settings.tgChat)DB.settings.tgChat='-1003999892523';save();$('#tgTok').value='';renderSet();toast('تم الحفظ ✓')};
$('#bkFull').onclick=async()=>{try{const r=await dl(`flour-full-backup-${new Date().toISOString().slice(0,10)}.json`,jsonBlob({type:'flour-distribution-full-backup',version:2,createdAt:new Date().toISOString(),data:DB}));toast(r.native?'تم حفظ النسخة في التنزيلات / Sanabil ✓':'بدأ تنزيل النسخة الاحتياطية')}catch(e){toast('فشل حفظ النسخة: '+e.message)}};
$('#rsFull').onclick=()=>$('#fullFile').click();
$('#fullFile').onchange=e=>readFile(e.target,j=>{const d=j.data;if(!d||!Array.isArray(d.families))return toast('ملف غير صالح');ask('استبدال كل بيانات التطبيق بالنسخة؟',()=>{DB={families:d.families,dist:d.dist||{},queue:d.queue||[],settings:{...DB.settings,...(d.settings||{}),tgChat:d.settings?.tgChat||DB.settings.tgChat,sheetUrl:d.settings?.sheetUrl||DB.settings.sheetUrl}};save();renderSet();toast('تمت الاستعادة ✓')})});

/* ---------- custom pickers ---------- */
const IC={doc:'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h6',table:'M3 5h18v14H3zM3 10h18M9 5v14',pdf:'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 17v-5h1.5a1.5 1.5 0 0 1 0 3H9',txt:'M4 6h16M4 12h10M4 18h14',code:'M8 8l-5 4 5 4M16 8l5 4-5 4M14 5l-4 14',users:'M16 11a3 3 0 1 0-6 0 3 3 0 0 0 6 0zM5 20c0-3 3-5 7-5s7 2 7 5',check:'M20 6 9 17l-5-5',half:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 3v18',x:'M18 6 6 18M6 6l12 12',cal:'M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM4 10h16M8 3v4M16 3v4',hash:'M5 9h14M5 15h14M10 4 8 20M16 4l-2 16',cv:'M6 9l6 6 6-6'};
const OI={docx:['doc','#2f80ff'],xlsx:['table','#12b76a'],pdf:['pdf','#ff6b57'],txt:['txt','#8a5cff'],html:['code','#f59e0b'],all:['users','#5b4bff'],full:['check','#12b76a'],part:['half','#f59e0b'],none:['x','#ff6b57']};
const TT={dY:'اختر السنة',sY:'اختر السنة',dM:'اختر الشهر',sM:'اختر الشهر',xF:'صيغة الملف',xL:'القائمة المطلوبة',vN:'عدد الأفراد'};
const svg=(d,c='currentColor')=>`<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
const ico=(s,o)=>{const [i,c]=OI[o.value]||[s.id==='vN'?'hash':'cal','#5b4bff'];return `<i class="tl" style="--c:${c}">${svg(IC[i])}</i>`};
function sync1(s){const o=s.selectedOptions[0];s._b.innerHTML=o?`${ico(s,o)}<span>${o.text}</span>${svg(IC.cv).replace('<svg','<svg class="cv"')}`:''}
function syncSel(){$$('select').forEach(s=>{if(!s._b){s.classList.add('hid');s._b=document.createElement('button');s._b.type='button';s._b.className='pk';s.after(s._b);s._b.onclick=()=>openPick(s)}sync1(s)})}
function openPick(s){const id=s.id,yr=id==='dY'||id==='sY',mo=id==='dM'||id==='sM',nm=id==='vN',ov=document.createElement('div');ov.id='pick';
 const item=(o,i)=>{let h;if(yr)h=`<i class="tl">${svg(IC.cal)}</i><b>${o.text}</b>`;else if(mo)h=`<i class="bd">${+o.value}</i><span>${o.text}</span>`;else if(nm)h=`<b>${o.text}</b>`;else h=`${ico(s,o)}<span>${o.text}</span><em>${svg(IC.check)}</em>`;
  return `<button type="button" class="po${yr||mo?' tile':''}${nm?' num':''}${o.selected?' on':''}" style="--k:${i}" data-i="${i}">${h}</button>`};
 ov.innerHTML=`<div class="sheet"><div class="ph"><i class="tl">${svg(IC[yr||mo?'cal':nm?'hash':'doc'])}</i><h3>${TT[id]||''}</h3></div><div class="${yr||mo?'g3':nm?'g5':'pl'}">${[...s.options].map(item).join('')}</div></div>`;
 document.body.appendChild(ov);ov.onclick=e=>{const b=e.target.closest('.po');if(b){s.selectedIndex=+b.dataset.i;s.dispatchEvent(new Event('change'));sync1(s)}if(b||e.target===ov)ov.remove()}}
const applyTheme=()=>document.documentElement.dataset.theme=DB.settings.theme||'light';
$('#theme').onclick=()=>{DB.settings.theme=DB.settings.theme==='light'?'dark':'light';save();applyTheme()};
applyTheme();go('home');flush();if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});

if(LS.fake)setTimeout(()=>toast('تنبيه: الحفظ غير متاح خارج الاستضافة — ارفع التطبيق على GitHub Pages'),800);
