/* Bulk liquids: independent form/state, shared BLU Web runtime and recorded Citrix coordinates. */
(() => {
  'use strict';
  const VERSION='10.3.2', MODE='BULK_LIQUIDS';
  const adapter=window.BLU_AUTO_QUOTE_V1030;
  const base={activateMode,setAdvancedModeV920,processBluQuoteInputDataV940,importAhkFile,initialiseLocationSelectors};
  const keys=['collection','pol','pod','delivery'];
  const labels={collection:'Collection',pol:'POL',pod:'POD',delivery:'Delivery'};
  const suppliers={DEN_HARTOGH:{name:'Den Hartogh',search:'den hart'},ITT:{name:'ITT',search:'itt'}};
  const SUBJECT_TO=`- Space/equipment and any charge imposed by the line VATOS.
- Any additional requirement not previously notified could derive into this quote being reviewed.
- GRI, CAF or BAF increases imposed by the shipping line
- Equipment availability
- Provision and acceptance of MSDS
- Space availability and IMO acceptance of the shipping company
- The guarantee that the product is fully compatible with stainless steel. Any repair of corrosion damage due to the nature of the product is for the account of the freight payer

All quotes & tenders are subject to our Middle East Conflict Disclaimer, available on our website.
Any Emergency Conflict/War Risk Surcharges, additional premiums, Route Changes and/or End of Voyage costs, whether existing, increased or newly imposed prior to or during the transport/voyage.`;
  const fieldNames=['direction','clientName','attentionTo','salesOperator','validTo','paymentDays','incoterm','quantity','descriptionOfGoods','grossWeight','volume','supplier','buyingRate','buyingCurrency','sellingRate','sellingCurrency','including','excluding','transitDays','fuelPercent','profitTarget'];
  const id=key=>'bulk'+key[0].toUpperCase()+key.slice(1);
  const text=v=>v==null?'':String(v);
  const clone=v=>JSON.parse(JSON.stringify(v));
  const numberText=(v,label,{optional=false,zero=false,integer=false}={})=>{
    if(v==null||typeof v==='string'&&!v.trim()) {if(optional)return '';throw new Error(label+' is required.');}
    if(!['string','number'].includes(typeof v))throw new Error(label+' must be a number.');
    const raw=String(v).trim().replace(/\s+/g,'').replace(',','.');
    if(!/^\d+(?:\.\d+)?$/.test(raw))throw new Error(label+' must be a valid non-negative number.');
    const n=Number(raw);
    if(!Number.isFinite(n)||(!zero&&n<=0)||(integer&&!Number.isInteger(n)))throw new Error(label+(integer?' must be a positive whole number.':zero?' must be zero or greater.':' must be greater than zero.'));
    return String(n);
  };
  const defaults=()=>({version:1,mode:MODE,appVersion:VERSION,direction:'export',
    clientName:'',attentionTo:'',salesOperator:'Erik Stahl',validTo:$('validTo')?.value||'',paymentDays:'30',incoterm:'',
    quantity:'1',equipment:"20' tank",descriptionOfGoods:'',grossWeight:'',volume:'',supplier:'DEN_HARTOGH',
    buyingRate:'',buyingCurrency:'EUR',sellingRate:'',sellingCurrency:'EUR',including:'',excluding:'',transitDays:'',
    fuelEnabled:false,fuelPercent:'',profitTarget:'',
    route:Object.fromEntries(keys.map(k=>[k,{enabled:k!=='delivery',name:'',code:''}]))});
  let bulk=defaults(), generated='', generatedTarget='', acknowledgedCurrency='';
  const combos={};
  let locationMap=null,locationCount=-1;

  function normalise(input) {
    if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Bulk liquids data must be an object.');
    if(input.version!=null&&Number(input.version)!==1)throw new Error('Unsupported Bulk liquids state version.');
    const d={...defaults(),...input};
    d.version=1;d.mode=MODE;d.appVersion=VERSION;
    if(!['export','import'].includes(d.direction))throw new Error('Direction must be export or import.');
    if(text(d.equipment).toLowerCase().replace(/[’\s]/g,m=>m==='’'?"'":'')!=="20'tank")throw new Error("Bulk liquids equipment must be 20' tank.");
    d.equipment="20' tank";
    const supplier=text(d.supplier).toUpperCase().replace(/[\s-]+/g,'_');
    d.supplier=['DEN_HARTOGH','DEN_HART'].includes(supplier)?'DEN_HARTOGH':supplier;
    if(!suppliers[d.supplier])throw new Error('Bulk liquids supplier must be Den Hartogh or ITT.');
    for(const key of ['grossWeight','volume'])d[key]=numberText(d[key],key==='grossWeight'?'Gross weight':'Volume',{optional:true});
    d.quantity=numberText(d.quantity,'Tank quantity',{integer:true});
    for(const key of ['buyingRate','sellingRate'])d[key]=numberText(d[key],key==='buyingRate'?'Buying rate':'Selling rate',{optional:true,zero:true});
    if(typeof d.fuelEnabled!=='boolean')throw new Error('Separate fuel surcharge must be true or false.');
    d.fuelPercent=numberText(d.fuelPercent,'Fuel surcharge percent',{optional:true,zero:true});
    d.profitTarget=numberText(d.profitTarget,'Target total profit',{optional:true,zero:true});
    d.paymentDays=numberText(d.paymentDays,'Payment days',{zero:true});
    if(!Number.isInteger(Number(d.paymentDays)))throw new Error('Payment days must be a whole number.');
    d.transitDays=numberText(d.transitDays,'Transit days',{optional:true,zero:true});
    d.incoterm=text(d.incoterm).trim().toUpperCase();
    if(d.incoterm&&!['EXW','FCA','FAS','FOB','CFR','CIF','CPT','CIP','DAP','DPU','DDP'].includes(d.incoterm))throw new Error('Unknown Incoterm.');
    for(const key of ['buyingCurrency','sellingCurrency']){
      d[key]=text(d[key]).trim().toUpperCase();if(!/^[A-Z]{3}$/.test(d[key]))throw new Error('Enter a three-letter currency code.');
    }
    d.route=Object.fromEntries(keys.map(k=>{
      const p=d.route?.[k]||{enabled:false};
      if(typeof p.enabled!=='boolean')throw new Error(labels[k]+' enabled must be true or false.');
      const code=text(p.code).trim().toUpperCase().replace(/\s+/g,'');
      if(code&&!/^[A-Z]{2}[A-Z0-9]{3}$/.test(code))throw new Error(labels[k]+' needs a five-character UN/LOCODE.');
      return [k,{enabled:p.enabled,code,name:text(p.name).trim()||state.locations.get(code)||''}];
    }));
    for(const key of ['clientName','attentionTo','salesOperator','validTo','descriptionOfGoods','including','excluding'])d[key]=text(d[key]);
    return d;
  }
  function readForm() {
    for(const key of fieldNames)bulk[key]=$(id(key)).value;
    bulk.fuelEnabled=$('bulkFuelEnabled').checked;
    for(const key of keys){bulk.route[key].enabled=$('bulk'+labels[key]+'Enabled').checked;bulk.route[key].code=$('bulk'+labels[key]+'Code').value;bulk.route[key].name=$('bulk'+labels[key]+'Name').value;}
    return bulk;
  }
  function exportData() {
    const d=normalise(readForm());
    if(d.profitTarget!=='')d.sellingRate=plain(pricing(d).sellingBase);
    return {...d,automationMode:adapter.mode(),automation:window.BLU_AUTO_QUOTE_V974.automation(),advancedMode:true};
  }
  function validate(d) {
    const errors=[];
    if(!d.clientName.trim())errors.push('Client name is required.');
    if(!d.salesOperator.trim())errors.push('Sales operator is required.');
    if(!/^\d{4}-\d{2}-\d{2}$/.test(d.validTo)||!Number.isFinite(Date.parse(d.validTo))||new Date(d.validTo).toISOString().slice(0,10)!==d.validTo)errors.push('Valid to date is required and must be a valid date.');
    if(d.buyingRate==='')errors.push('Buying rate per tank is required.');
    if(d.sellingRate==='')errors.push('Selling rate per tank is required.');
    if(d.fuelEnabled&&d.fuelPercent==='')errors.push('Fuel surcharge percent is required when separate fuel is enabled.');
    if(keys.filter(k=>d.route[k].enabled).length<2)errors.push('Select at least two route points.');
    keys.forEach(k=>{if(d.route[k].enabled&&!d.route[k].code)errors.push(labels[k]+': UN/LOCODE is required.');});
    return errors;
  }
  function service(d) {
    const enabled=keys.filter(k=>d.route[k].enabled);
    return `${enabled[0]==='collection'?'DOOR':'PORT'} TO ${enabled.at(-1)==='delivery'?'DOOR':'PORT'}`;
  }
  const roundMoney=value=>Math.round((value+Number.EPSILON)*100)/100;
  const plain=value=>String(Number(Number(value).toFixed(6)));
  function buyingInSelling(amount,d) {
    if(d.buyingCurrency===d.sellingCurrency)return amount;
    const result=convert(amount,d.buyingCurrency,d.sellingCurrency);
    return Number.isFinite(result)?result:null;
  }
  function pricing(d) {
    if(d.fuelEnabled&&d.fuelPercent==='')throw new Error('Enter the fuel surcharge percent.');
    const quantity=Number(d.quantity),percent=d.fuelEnabled?Number(d.fuelPercent):0,factor=percent/100;
    const buyingBase=d.buyingRate===''?null:Number(d.buyingRate);
    let sellingBase=d.sellingRate===''?null:Number(d.sellingRate);
    const buyingFuel=buyingBase===null?null:roundMoney(buyingBase*factor);
    const baseBuyingTotal=buyingBase===null?null:Number(plain(buyingBase*quantity));
    const fuelBuyingTotal=buyingFuel===null?null:roundMoney(buyingFuel*quantity);
    const buyingTotal=buyingBase===null?null:Number(plain(baseBuyingTotal+fuelBuyingTotal));
    const convertedBuying=buyingTotal===null?null:buyingInSelling(buyingTotal,d);
    if(d.profitTarget!=='') {
      if(buyingTotal===null)throw new Error('Enter buying base price to calculate the target profit.');
      if(convertedBuying===null)throw new Error(`Exchange rate ${d.buyingCurrency}/${d.sellingCurrency} is unavailable. Load exchange rates or clear the profit target and enter selling manually.`);
      const wanted=convertedBuying+Number(d.profitTarget);
      const ideal=wanted/quantity/(1+factor),start=Math.max(0,Math.floor(ideal*100));
      let best=null;
      // BLU rates are quoted to cents. Find the nearest achievable total;
      // on an exact tie prefer the rate above the target. Never change fuel %.
      for(let cents=Math.max(0,start-2);cents<=start+2;cents++) {
        const rate=cents/100,total=roundMoney((rate+roundMoney(rate*factor))*quantity);
        const error=Math.abs(total-wanted);
        if(!best||error<best.error-1e-8||(Math.abs(error-best.error)<1e-8&&total>best.total))best={rate,total,error};
      }
      sellingBase=best.rate;
    }
    const sellingFuel=sellingBase===null?null:roundMoney(sellingBase*factor);
    const sellingTotal=sellingBase===null?null:Number(plain((sellingBase+sellingFuel)*quantity));
    const profit=sellingTotal===null||convertedBuying===null?null:roundMoney(sellingTotal-convertedBuying);
    return {buyingBase,sellingBase,buyingFuel,sellingFuel,baseBuyingTotal,fuelBuyingTotal,buyingTotal,sellingTotal,profit,
      targetDifference:profit===null||d.profitTarget===''?null:roundMoney(profit-Number(d.profitTarget))};
  }
  function freightDescription(d) {return `FREIGHT, ${d.fuelEnabled?'BASE':'ALL-IN'} RATE (${service(d)})`;}
  function fuelDescription(d) {
    const month=new Date().toLocaleString('en-GB',{month:'long'}).toUpperCase();
    return `FUEL SURCHARGE ${month} - ${plain(d.fuelPercent)}%`;
  }
  function quotation(d=exportData()) {
    const route=d.route, path=keys.filter(k=>route[k].enabled).map(k=>(route[k].name||route[k].code).toUpperCase()).join(' - ');
    const subtitle=`${Number(d.quantity)>1?d.quantity+'X':''}20' ISOTANK - ${path}`;
    const calc=pricing(d);
    const charge={type:'freight',description:freightDescription(d),
      buyRate:calc.baseBuyingTotal===null?'':plain(calc.baseBuyingTotal),buyCurrency:d.buyingCurrency,
      sellingRate:calc.sellingBase===null?'':plain(calc.sellingBase),sellingCurrency:d.sellingCurrency,supplier:suppliers[d.supplier].search,supplierArrow:0,
      quantity:d.quantity,quantityDescription:"20' ISOTANK"};
    const charges=[charge];
    if(d.fuelEnabled)charges.push({...charge,type:'fuel',description:fuelDescription(d),
      buyRate:calc.fuelBuyingTotal===null?'':plain(calc.fuelBuyingTotal),sellingRate:calc.sellingFuel===null?'':plain(calc.sellingFuel)});
    const detail={subtitle,basisText:'',incoterm:d.incoterm.toLowerCase(),incotermLocation:'',transitTime:d.transitDays?`${d.transitDays} DAYS`:'',
      including:d.including,excluding:d.excluding,remarks:'',charges,deliveryMode:'t',
      hasCollection:route.collection.enabled,hasPol:route.pol.enabled,hasPod:route.pod.enabled,hasDelivery:route.delivery.enabled,
      routeCollectionCode:route.collection.code,routePolCode:route.pol.code,routePodCode:route.pod.code,routeDeliveryCode:route.delivery.code};
    if(d.incoterm){const place=['DAP','DPU','DDP','CFR','CIF','CPT','CIP'].includes(d.incoterm)?(route.delivery.enabled?route.delivery:route.pod):(route.collection.enabled?route.collection:route.pol);detail.incotermLocation=place.name||place.code;}
    const [year,month,day]=d.validTo.split('-');
    return {project:'784',internalComment:'',clientCode:'',clientName:d.clientName,attentionTo:d.attentionTo,
      salutation:quoteText('common.salutation',{ATTENTION:d.attentionTo})||`Dear ${d.attentionTo},`,coverLetter:quoteText('common.coverLetter')||'Many thanks for your inquiry. We are pleased to offer the following',
      grossWeight:d.grossWeight,volume:d.volume,cargoDescription:d.descriptionOfGoods,subjectTo:SUBJECT_TO,salesOperator:d.salesOperator,
      subject:subtitle,validTo:d.validTo?`${day}.${month}.${year.slice(-2)}`:'',targetCurrency:d.sellingCurrency.toLowerCase(),paymentDays:d.paymentDays,incoterm:d.incoterm.toLowerCase(),
      cargoEquipment:[{quantity:d.quantity,type:"20' TANK",equipmentSearch:"20' tank"}],details:[detail]};
  }
  function ahkLiteral(value) {
    if(Array.isArray(value))return '['+value.map(ahkLiteral).join(', ')+']';
    if(value&&typeof value==='object')return 'Map(\n'+Object.entries(value).map(([k,v])=>'  '+ahkString(k)+', '+ahkLiteral(v)).join(',\n')+'\n)';
    if(typeof value==='boolean')return value?'true':'false';
    if(typeof value==='number')return String(value);
    return ahkString(text(value));
  }
  function generate(target=adapter.mode()) {
    if(!['web','citrix'].includes(target))throw new Error('Unsupported automation target.');
    const data=exportData(),errors=validate(data);
    if(errors.length)throw new Error(errors.join('\n'));
    data.automationMode=target;
    const block='quote := '+ahkLiteral(quotation(data));
    if(target==='web')return adapter.buildWebScript(block,false,{bulk:true,data:{...data,targetCurrency:data.sellingCurrency}});
    return window.BLU_BULK_CITRIX_V1030(block,metadataBlock(data),window.BLU_AUTO_QUOTE_V974.speedPercent());
  }
  function invalidate() {generated='';generatedTarget='';$('bulkScriptOutput').value='';$('bulkCopyScript').disabled=true;}
  function message(value,error=false){$('bulkStatus').textContent=value;$('bulkStatus').classList.toggle('error',error);}
  function refreshPreview() {
    readForm();
    $('bulkChargeName').textContent=freightDescription(bulk);
    $('bulkFuelPercent').disabled=!bulk.fuelEnabled;
    $('bulkFuelBreakdown').hidden=!bulk.fuelEnabled;
    $('bulkSellingRate').readOnly=bulk.profitTarget.trim()!=='';
    $('bulkProfitCurrency').textContent=bulk.sellingCurrency.toUpperCase();
    for(const key of keys){const enabled=bulk.route[key].enabled;$('bulk'+labels[key]+'Code').disabled=!enabled;$('bulk'+labels[key]+'Name').disabled=!enabled;combos[key]?.setDisabled(!enabled);}
    let calc=null,error='';
    try {
      calc=pricing(normalise(bulk));
      if(bulk.profitTarget.trim()!==''&&calc.sellingBase!==null)bulk.sellingRate=$('bulkSellingRate').value=plain(calc.sellingBase);
    } catch(e) {error=e.message;}
    const money=(n,c)=>n==null?'—':new Intl.NumberFormat('en-GB',{minimumFractionDigits:2,maximumFractionDigits:2}).format(n)+' '+text(c).toUpperCase();
    $('bulkTotalSales').textContent=money(calc?.sellingTotal,bulk.sellingCurrency);
    $('bulkTotalBuying').textContent=money(calc?.buyingTotal,bulk.buyingCurrency);
    $('bulkProfit').textContent=money(calc?.profit,bulk.sellingCurrency);
    $('bulkFuelBuying').textContent=money(calc?.buyingFuel,bulk.buyingCurrency);
    $('bulkFuelSelling').textContent=money(calc?.sellingFuel,bulk.sellingCurrency);
    $('bulkPricingError').textContent=error;
    $('bulkProfitDifference').textContent=calc?.targetDifference?`Rounding difference from target: ${money(calc.targetDifference,bulk.sellingCurrency)}`:'';
  }
  function refreshLocations(force=false) {
    if(!force&&locationMap===state.locations&&locationCount===state.locations.size)return;
    locationMap=state.locations;locationCount=state.locations.size;
    const options=locationOptions([...state.locations.keys()],true);
    keys.forEach(k=>{combos[k]?.setOptions(options,bulk.route[k].code);if(combos[k]&&!combos[k].selectedOption())combos[k].input.value=bulk.route[k].name||bulk.route[k].code;});
  }
  function render() {
    for(const key of fieldNames)$(id(key)).value=bulk[key];
    $('bulkFuelEnabled').checked=bulk.fuelEnabled;
    keys.forEach(k=>{$('bulk'+labels[k]+'Enabled').checked=bulk.route[k].enabled;$('bulk'+labels[k]+'Code').value=bulk.route[k].code;$('bulk'+labels[k]+'Name').value=bulk.route[k].name;});
    refreshLocations(true);refreshPreview();invalidate();message('');
  }
  function importData(raw) {
    const next=normalise(raw); // Validate before replacing the existing form.
    bulk=next;acknowledgedCurrency='';
    if(['web','citrix'].includes(next.automationMode))adapter.setMode(next.automationMode);
    if(next.automation){
      $('slowModeV974').checked=!!next.automation.slowMode;$('slowModeV974').dispatchEvent(new Event('change'));
      $('speedPercentV974').value=next.automation.speedPercent||100;$('speedPercentV974').dispatchEvent(new Event('change'));
    }
    render();activateMode('bulk');
  }
  function fromFriendly(wrapper) {
    const {client={},settings={},cargo={},freight={},texts={},route}=wrapper;
    return {...defaults(),direction:wrapper.direction||'export',clientName:client.name||'',attentionTo:client.attentionTo||'',salesOperator:client.salesOperator||'Erik Stahl',
      ...settings,...cargo,...freight,...texts,route:route||defaults().route,automationMode:wrapper.automationMode||settings.automationMode};
  }
  processBluQuoteInputDataV940=async function(data,fileName) {
    const native=data?.appState||data?.state||data?.quoteState;
    if(text(data?.mode||native?.mode).toUpperCase()!==MODE)return base.processBluQuoteInputDataV940(data,fileName);
    if(data.format!=='BLU_AUTO_QUOTE_INPUT'||Number(data.formatVersion)!==2)throw new Error('Bulk liquids requires BLU_AUTO_QUOTE_INPUT formatVersion 2.');
    if(native?.mode&&native.mode!==MODE)throw new Error('The wrapper and appState modes must match.');
    importData(native?{...native,direction:data.direction||native.direction}:fromFriendly(data));
    state.pendingBluQuoteImport=null;
    setBluQuoteImportStatusV940(`Imported Bulk liquids · ${fileName}`,'ok');return true;
  };
  importAhkFile=async function(file) {
    const content=await file.text();
    const chunks=[...content.matchAll(/^;\s*BLUQUOTE_DATA:\s*([A-Za-z0-9+/=]+)\s*$/gm)].map(m=>m[1]);
    if(chunks.length){const data=JSON.parse(decodeBase64Utf8(chunks.join('')));if(data.mode===MODE){importData(data);return;}}
    return base.importAhkFile(file);
  };
  activateMode=function(mode) {
    if(mode==='bulk'){
      base.setAdvancedModeV920(true);state.activeMode='bulk';
      ['fclPane','lclPane','mergePane'].forEach(name=>$(name)?.classList.add('hidden'));
      $('bulkPane').classList.remove('hidden');$('directionTabs')?.classList.add('hidden');$('advancedModeControl')?.classList.remove('hidden');
      document.querySelectorAll('.mode-tab').forEach(b=>b.classList.toggle('active',b.dataset.mode==='bulk'));
      // The global FCL import button now uses the shared mode-aware AHK importer.
      $('importScript')?.classList.remove('hidden');$('lclImportScript')?.classList.add('hidden');
      refreshLocations();refreshPreview();
      return;
    }
    $('bulkPane')?.classList.add('hidden');return base.activateMode(mode);
  };
  setAdvancedModeV920=function(enabled){const r=base.setAdvancedModeV920(enabled);if(!enabled&&state.activeMode==='bulk')activateMode('fcl');return r;};
  initialiseLocationSelectors=function(...args){const r=base.initialiseLocationSelectors(...args);refreshLocations();return r;};

  function download(content,name,type) {
    const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function filename(ext,target='') {
    const client=text(bulk.clientName).trim().replace(/[^\p{L}\p{N}_-]+/gu,'_').replace(/^_+|_+$/g,'').slice(0,65)||'Quote';
    return `BLU_Bulk_Liquids_${client}_${bulk.direction}${target?'_'+(target==='web'?'Web':'Citrix'):''}_v${VERSION}.${ext}`;
  }
  function generateAndDownload() {
    try {
      const data=exportData(),errors=validate(data);if(errors.length)throw new Error(errors.join('\n'));
      const signature=[data.buyingCurrency,data.sellingCurrency].join('|');
      if(data.buyingCurrency!==data.sellingCurrency&&acknowledgedCurrency!==signature){
        if(!confirm(`Buying currency is ${data.buyingCurrency} and selling currency is ${data.sellingCurrency}. Are you sure?`))return;
        acknowledgedCurrency=signature;
      }
      generated=generate();generatedTarget=adapter.mode();$('bulkScriptOutput').value=generated;$('bulkCopyScript').disabled=false;
      download('\uFEFF'+generated,filename('ahk',generatedTarget),'text/plain;charset=utf-8');
      message('AHK downloaded. '+(generatedTarget==='web'?'F8 starts; after Create, press F6 to continue.':'Open a new quote in BLU Citrix, then press F8.'));
    }catch(e){message(e.message,true);}
  }
  function install() {
    const style=document.createElement('style');style.textContent=`
      body:not(.advanced-mode-enabled) [data-mode="bulk"]{display:none!important}
      #bulkPane{margin:12px 0}#bulkPane .bulk-section{border:1px solid #bbb;padding:14px;background:white;margin:0 0 12px}
      #bulkPane h2{font-size:16px;margin:0 0 12px}#bulkPane h3{font-size:13px;margin:0 0 10px}
      #bulkPane textarea{width:100%;resize:vertical;min-height:85px}#bulkPane .bulk-route-stop{border:1px solid #ddd;padding:10px}
      #bulkPane .bulk-route-stop label{margin-bottom:8px}#bulkPane .bulk-totals{display:flex;gap:30px;flex-wrap:wrap;padding:14px 0}
      #bulkPane .bulk-totals strong{display:block;font-size:18px;margin-top:4px}#bulkPane #bulkTotalSales{font-size:24px}
      #bulkStatus{white-space:pre-line;margin-top:12px}#bulkStatus.error{color:#a00}#bulkScriptOutput{min-height:240px;font-family:monospace}
      #bulkPane .bulk-fuel-controls{margin-top:14px;align-items:end}#bulkPane .bulk-fuel-breakdown{display:flex;gap:24px;flex-wrap:wrap;margin-top:12px}#bulkPane .bulk-fuel-breakdown[hidden]{display:none}#bulkPricingError{color:#a00;font-size:12px}#bulkPane input[readonly]{background:#f4f4f4}
      #bulkSubjectTo{min-height:250px}#bulkPane .actions{flex-wrap:wrap}
    `;document.head.append(style);
    const tab=document.createElement('button');tab.type='button';tab.className='mode-tab';tab.dataset.mode='bulk';tab.textContent='Bulk liquids';tab.addEventListener('click',()=>activateMode('bulk'));document.querySelector('.mode-tabs').append(tab);
    const field=(key,label,type='text',extra='')=>`<label class="field">${label}<input id="${id(key)}" type="${type}" ${extra}></label>`;
    const select=(key,label,options)=>`<label class="field">${label}<select id="${id(key)}">${options}</select></label>`;
    const textarea=(key,label)=>`<label class="field">${label}<textarea id="${id(key)}" rows="4"></textarea></label>`;
    const pane=document.createElement('section');pane.id='bulkPane';pane.className='hidden';pane.setAttribute('aria-label','Bulk liquids');
    pane.innerHTML=`<div class="bulk-section"><h2>Bulk liquids · Project 784</h2><div class="grid four">
      ${field('clientName','Client name')}${field('attentionTo','Attention to')}${field('salesOperator','Sales operator')}${select('direction','Direction','<option value="export">Export</option><option value="import">Import</option>')}
      ${field('validTo','Valid to','date')}${field('paymentDays','Payment days','number','min="0" step="1"')}${select('incoterm','Incoterm (optional)','<option value="">Blank</option>'+['EXW','FCA','FAS','FOB','CFR','CIF','CPT','CIP','DAP','DPU','DDP'].map(s=>`<option>${s}</option>`).join(''))}${field('transitDays','Transit days (optional)','text','inputmode="decimal"')}
      </div></div>
      <div class="bulk-section"><h3>Route</h3><div class="grid four">${keys.map(k=>`<div class="bulk-route-stop"><label class="waiting-check"><input type="checkbox" id="bulk${labels[k]}Enabled"> ${labels[k]}</label><label class="field">Location<div class="combo" id="bulkLocation${labels[k]}"><input autocomplete="off" aria-label="${labels[k]} location"><div class="combo-menu hidden"></div></div></label><label class="field">UN/LOCODE<input id="bulk${labels[k]}Code" maxlength="5"></label><label class="field">Display name<input id="bulk${labels[k]}Name"></label></div>`).join('')}</div></div>
      <div class="bulk-section"><h3>Cargo</h3><div class="grid four"><label class="field">Equipment<select id="bulkEquipment"><option>20' tank</option></select></label>${field('quantity','Number of tanks','number','min="1" step="1"')}${field('grossWeight','Gross weight kg (optional)','text','inputmode="decimal"')}${field('volume','Volume m³ (optional)','text','inputmode="decimal"')}</div><p class="small-note">Empty weight and volume are left blank in BLU. Values apply to the cargo row for the selected number of tanks.</p>${textarea('descriptionOfGoods','Description of goods')}</div>
      <div class="bulk-section"><h3 id="bulkChargeName"></h3><div class="grid three">${select('supplier','Supplier','<option value="DEN_HARTOGH">Den Hartogh</option><option value="ITT">ITT</option>')}${field('buyingRate','Buying base price per tank','text','inputmode="decimal"')}${field('buyingCurrency','Buying currency','text','list="bulkCurrencyOptions" maxlength="3"')}<div></div>${field('sellingRate','Selling base price per tank','text','inputmode="decimal"')}${field('sellingCurrency','Selling currency','text','list="bulkCurrencyOptions" maxlength="3"')}</div><div class="grid three bulk-fuel-controls"><label class="waiting-check"><input type="checkbox" id="bulkFuelEnabled"> Separate fuel surcharge</label>${field('fuelPercent','Fuel surcharge %','text','inputmode="decimal"')}<label class="field">Target total profit (<span id="bulkProfitCurrency">EUR</span>, optional)<input id="bulkProfitTarget" type="text" inputmode="decimal"></label></div><div id="bulkFuelBreakdown" class="bulk-fuel-breakdown" hidden><span>Fuel buying per tank: <strong id="bulkFuelBuying"></strong></span><span>Fuel selling per tank: <strong id="bulkFuelSelling"></strong></span></div><p id="bulkPricingError" class="error" role="status"></p><p id="bulkProfitDifference" class="small-note"></p><datalist id="bulkCurrencyOptions">${['EUR','USD','SEK','NOK','DKK','GBP'].map(c=>`<option value="${c}"></option>`).join('')}</datalist><div class="bulk-totals"><div>Total sales<strong id="bulkTotalSales"></strong></div><div>Total buying<strong id="bulkTotalBuying"></strong></div><div>Profit<strong id="bulkProfit"></strong></div></div></div>
      <div class="bulk-section"><h3>Quote texts</h3><div class="grid two">${textarea('including','Including')}${textarea('excluding','Excluding')}</div><details><summary>Subject to</summary><textarea id="bulkSubjectTo" readonly aria-label="Subject to"></textarea></details></div>
      <div class="actions"><button class="btn primary" id="bulkGenerateScript">Generate &amp; download AHK</button><button class="btn" id="bulkExportJson">Export JSON</button><button class="btn" id="bulkImportAhk">Import AHK</button><button class="btn" id="bulkReset">Reset Bulk liquids</button></div><p id="bulkStatus" role="status"></p><details id="bulkScriptSection"><summary>Generated AHK</summary><textarea id="bulkScriptOutput" readonly></textarea><button class="btn" id="bulkCopyScript" disabled>Copy script</button></details>`;
    $('fclPane').before(pane);$('bulkSubjectTo').value=SUBJECT_TO;
    keys.forEach(k=>{
      combos[k]=new SearchCombo($('bulkLocation'+labels[k]),()=>{
        const c=combos[k];bulk.route[k].code=c.value;bulk.route[k].name=state.locations.get(c.value)||c.input.value.trim();
        $('bulk'+labels[k]+'Code').value=bulk.route[k].code;$('bulk'+labels[k]+'Name').value=bulk.route[k].name;invalidate();refreshPreview();
      },{allowCustom:true});
      $('bulk'+labels[k]+'Code').addEventListener('change',e=>{
        const code=e.target.value.trim().toUpperCase();e.target.value=code;bulk.route[k].code=code;
        if(state.locations.has(code)){$('bulk'+labels[k]+'Name').value=state.locations.get(code);bulk.route[k].name=state.locations.get(code);}
        refreshLocations(true);
      });
    });
    const edited=e=>{if(e.target.closest('#bulkScriptSection')||e.target.id==='bulkSubjectTo')return;invalidate();refreshPreview();message('');};
    pane.addEventListener('input',edited);pane.addEventListener('change',edited);
    $('bluAutomationMode').addEventListener('change',()=>invalidate());
    $('bulkGenerateScript').addEventListener('click',generateAndDownload);
    $('bulkExportJson').addEventListener('click',()=>{try{download(JSON.stringify({format:'BLU_AUTO_QUOTE_INPUT',formatVersion:2,mode:MODE,direction:bulk.direction,appState:exportData()},null,2),filename('bluquote.json'),'application/json');message('JSON exported.');}catch(e){message(e.message,true);}});
    $('bulkImportAhk').addEventListener('click',()=>$('importScriptFile').click());
    $('bulkCopyScript').addEventListener('click',async()=>{try{if(!generated||generatedTarget!==adapter.mode())throw new Error('Generate the script again.');await navigator.clipboard.writeText(generated);message('Script copied.');}catch(e){message(e.message,true);}});
    $('bulkReset').addEventListener('click',()=>{if(confirm('Reset all Bulk liquids inputs?')){bulk=defaults();acknowledgedCurrency='';render();}});
    render();
  }
  install();
  window.BLU_BULK_V1032=window.BLU_BULK_V1030=Object.freeze({version:VERSION,exportData,importData,quote:quotation,generate,validate,pricing,subjectTo:SUBJECT_TO});
})();
