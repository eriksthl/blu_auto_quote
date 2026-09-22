/* Shared quotation changes in v10.3.2. Loaded after the existing engine. */
(() => {
  'use strict';
  const base = {newEquipment, normaliseFclEquipmentV940, calculateDetailGroup, createChargeMaps,
    remarksText, quoteText, applyVariableSellingV912, calculateLcl, lclCreateCharges,
    renderEquipment, updateAllPreviews, updateLclCalculation, exportFormData, exportLclData,
    applyImportedData, applyImportedLclData, restoreDirectionStateV912, resetForm, validateForm,
    generateAhk, generateLclAhk, previewRows, mergeEqualFclChargesV942, activateDirectionV910, selectedFclCurrencies,
    transformFclInputV940, setQuoteTextReady};
  const own = (obj,key) => Object.prototype.hasOwnProperty.call(obj || {},key);
  const plain = n => Number.isFinite(Number(n)) ? String(Number(Number(n).toFixed(6))) : '';
  const DROP_TEXT = 'Based on container dropoff, no waiting time will be charged.';
  const defaults = source => ({
    precarriageMode: upper(source?.precarriageMode) === 'SIMA' ? 'SIMA' : 'CHASSIS',
    containerDropOff: source?.containerDropOff === true,
    doubleSimaPrice: source?.doubleSimaPrice !== false,
    deliverySellingCurrency: normaliseCurrencyCode(source?.deliverySellingCurrency) || ''
  });
  const sima = eq => !eq?.includeStuff && upper(eq?.precarriageMode) === 'SIMA';
  const drop = eq => sima(eq) && eq?.containerDropOff === true;
  const factor = eq => drop(eq) && eq.doubleSimaPrice !== false ? 2 : 1;
  const versionData = data => ({...data,appVersion:'10.3.2'});
  let previousFclCurrency = $('targetCurrency')?.value || 'USD';
  let previousLclCurrency = state.lcl?.sellingCurrency || 'USD';
  let acknowledgedCurrency = '';

  newEquipment = function(source={}) { return Object.assign(base.newEquipment(source),defaults(source)); };
  normaliseFclEquipmentV940 = function(source,...args) {
    return Object.assign(base.normaliseFclEquipmentV940(source,...args),defaults(source));
  };
  selectedFclCurrencies = function() {
    const currencies=base.selectedFclCurrencies();
    if(!isImportMode())(state.routes || []).forEach(route=>{
      if(routePartsV961(route).delivery)route.equipment.forEach(eq=>{if(eq.deliverySellingCurrency)currencies.add(eq.deliverySellingCurrency);});
    });
    return currencies;
  };
  // Delivery stays at exact cost in export. Explicit selling overrides still apply.
  applyVariableSellingV912 = function(entries,remaining) {
    return base.applyVariableSellingV912(isImportMode() ? entries : entries.map(entry =>
      /^delivery(?::|$)/.test(entry.key) && !entry.manual
        ? {...entry,manual:true,manualValue:entry.unitCost,weight:0} : entry),remaining);
  };
  // The older generic merger only compares amounts/suppliers, not loading service.
  // Keep equipment-specific precarriage rows when SIMA is present in this detail.
  mergeEqualFclChargesV942 = function(charges,route) {
    const detail=state.v950DetailContext?.route===route ? state.v950DetailContext.detailRow : null;
    const protect=!isImportMode() && route.equipment.some(eq=>sima(eq) && (detail===null || detailRowNumber(eq,1)===detail));
    if(!protect)return base.mergeEqualFclChargesV942(charges,route);
    const units=new Map();
    const input=charges.map(charge=>{
      if(fclChargeCategoryV942(charge)!=='precarriage')return charge;
      const copy={...charge,quantityDescription:''};units.set(copy,charge.quantityDescription);return copy;
    });
    return base.mergeEqualFclChargesV942(input,route).map(charge=>units.has(charge)?{...charge,quantityDescription:units.get(charge)}:charge);
  };
  calculateDetailGroup = function(route,equipment) {
    const input = isImportMode() ? equipment : equipment.map(eq => factor(eq) === 1 ? eq :
      {...eq,precarriageAmount:plain(numberValue(eq.precarriageAmount)*factor(eq))});
    const calc=base.calculateDetailGroup(route,input);
    if(calc && !isImportMode()) {
      calc.v964GeneratedCharges=createChargeMaps(route,equipment,calc);
      calc.actualProfit=generatedChargeProfitV964(calc.v964GeneratedCharges,calc.target);
    }
    return calc;
  };
  createChargeMaps = function(route,equipment,calc) {
    const charges = base.createChargeMaps(route,equipment,calc);
    if (isImportMode()) return charges;
    let preIndex=0,deliveryIndex=0;
    return charges.map(charge => {
      if (charge.type === 'precarriage') {
        const eq=calc.rows[calc.commonPrecarriage ? 0 : preIndex++]?.equipment;
        if (!sima(eq)) return charge;
        let description=charge.description.replace(/\bCHASSIS\b/g,'SIMA');
        if (drop(eq)) description=description.split(/\n\s*\n/)[0]+'\n\n'+DROP_TEXT;
        else description=description.replace(/\bUSD 50\b/g,'USD 60');
        return {...charge,description};
      }
      if (charge.type === 'delivery') {
        const common=calc.commonDelivery && state.fclOptions?.mergeSameRates !== false;
        const row=calc.rows[common ? 0 : deliveryIndex++];
        const eq=row?.equipment;
        const currency=eq?.deliverySellingCurrency || charge.buyCurrency || calc.target;
        const key=calc.commonDelivery?'delivery:common':'delivery:'+eq?.id;
        const automatic=!own(calc.overrides,key);
        const amount=automatic && charge.buyRate!==''
          ? convert(Number(charge.buyRate)/Number(charge.quantity || 1),charge.buyCurrency,currency)
          : convert(row.deliverySelling,calc.target,currency);
        return {...charge,sellingCurrency:currency,
          sellingRate:plain(amount)};
      }
      return charge;
    });
  };
  remarksText = function(route=activeRoute(),...args) {
    const original=base.remarksText(route,...args);
    if (isImportMode() || !fclIncludesPrecarriage(route)) return original;
    const context=state.v950DetailContext;
    const detail=context?.route===route ? context.detailRow : null;
    const rows=(route.equipment || []).filter(eq => detail===null || detailRowNumber(eq,1)===detail);
    const kinds=[...new Set(rows.map(eq => drop(eq)?'drop':sima(eq)?'sima':'chassis'))];
    if (!kinds.some(k=>k!=='chassis')) return original;
    return original.split(/\n\s*\n/).map(paragraph => {
      if (!/Additional waiting time[\s\S]*USD 50/i.test(paragraph)) return paragraph;
      return kinds.map(kind => (kinds.length>1 ? (kind==='chassis'?'CHASSIS: ':'SIMA: ') : '') +
        (kind==='drop'?DROP_TEXT:kind==='sima'?paragraph.replace(/\bUSD 50\b/g,'USD 60'):paragraph)).join('\n\n');
    }).join('\n\n');
  };
  let lastValidWeight='25000', weightUsesDefault=true;
  const emptyWeight=value=>value==null || (typeof value==='string' && value.trim()==='');
  function normaliseWeight(value) {
    if (!['number','string'].includes(typeof value) || emptyWeight(value)) return null;
    const number=Number(String(value).replace(/\s+/g,'').replace(',','.'));
    return Number.isFinite(number) && number>0 ? String(number) : null;
  }
  function defaultWeight() {
    // QuoteTexts loads asynchronously and returns "" until it is ready.
    return normaliseWeight(base.quoteText('common.grossWeight')) || '25000';
  }
  function syncWeightField() {
    const field=$('fclGrossWeightV1020');
    if (field && field.value!==String(state.fclGrossWeight)) field.value=state.fclGrossWeight;
  }
  function currentWeight() {
    if (weightUsesDefault) state.fclGrossWeight=defaultWeight();
    else if (emptyWeight(state.fclGrossWeight)) state.fclGrossWeight=lastValidWeight || defaultWeight();
    const normal=normaliseWeight(state.fclGrossWeight);
    if (normal) state.fclGrossWeight=lastValidWeight=normal;
    syncWeightField();
    return String(state.fclGrossWeight);
  }
  function importedWeight(value) {
    if (emptyWeight(value)) return '';
    const normal=normaliseWeight(value);
    if (!normal) throw new Error('FCL gross weight must be a number greater than zero.');
    return normal;
  }
  quoteText = function(key,...args) {
    if (key==='common.grossWeight') return currentWeight();
    return base.quoteText(key,...args);
  };
  function setWeight(source) {
    const normal=importedWeight(source?.fclGrossWeight);
    weightUsesDefault=!normal;
    state.fclGrossWeight=lastValidWeight=normal || defaultWeight();
    syncWeightField();
  }
  setQuoteTextReady = function(...args) {
    const result=base.setQuoteTextReady(...args);
    // Refresh an automatic default, preserving any user-entered/imported value.
    currentWeight();
    return result;
  };
  transformFclInputV940 = function(input,context) {
    const result=base.transformFclInputV940(input,context);
    if (own(input,'fclGrossWeight')) {
      try { result.metadata.fclGrossWeight=importedWeight(input.fclGrossWeight); }
      catch (error) { addErrorV940(context,error.message); }
    }
    return result;
  };
  exportFormData = function() {
    const weight=currentWeight();
    return {...versionData(base.exportFormData()),fclGrossWeight:weight};
  };
  exportLclData = function() { return versionData(base.exportLclData()); };
  applyImportedData = function(data) {
    // Reject invalid explicit input before the existing importer mutates the form.
    importedWeight(data?.fclGrossWeight);
    acknowledgedCurrency='';
    const result=base.applyImportedData(data);
    setWeight(data);
    previousFclCurrency=$('targetCurrency').value;
    installEquipmentControls();updateTotals();return result;
  };
  applyImportedLclData = function(data) {
    acknowledgedCurrency='';const result=base.applyImportedLclData(data);
    previousLclCurrency=state.lcl?.sellingCurrency || 'USD';updateLclTotal();return result;
  };
  restoreDirectionStateV912 = function(direction,saved) {
    setWeight(saved?.fcl);const result=base.restoreDirectionStateV912(direction,saved);
    previousFclCurrency=$('targetCurrency').value;previousLclCurrency=state.lcl?.sellingCurrency || 'USD';
    installEquipmentControls();return result;
  };
  resetForm = function(...args) {
    const before=state.routes;const result=base.resetForm(...args);
    if(state.routes!==before){setWeight({});acknowledgedCurrency='';previousFclCurrency=$('targetCurrency').value;installEquipmentControls();}
    return result;
  };
  activateDirectionV910 = function(direction,...args) {
    const before=state.direction,hadSaved=Boolean(directionStatesV912[direction]);
    const result=base.activateDirectionV910(direction,...args);
    if(state.direction!==before){
      if(!hadSaved)setWeight({});
      acknowledgedCurrency='';previousFclCurrency=$('targetCurrency').value;previousLclCurrency=state.lcl?.sellingCurrency || 'USD';
    }
    return result;
  };
  validateForm = function() {
    currentWeight();
    const result=base.validateForm();
    if (!(numberValue(state.fclGrossWeight)>0)) result.errors.push('FCL gross weight must be greater than zero.');
    return result;
  };
  function versionScript(source) {
    source=source.replace(/^(; Generated by BLU Auto Quote[^\n]*?)v[\d.]+/m,'$1v10.3.2');
    // Format only the BLU input, keeping quote data and calculations numeric.
    const fieldHeader=/^TypeField\(name, value, pressEnter := false, clearFirst := false\) \{\n  global [^\n]+\n/m;
    if(!fieldHeader.test(source)) throw new Error('Could not locate the Citrix weight input helper.');
    source=source.replace(fieldHeader,header=>header+'  if StrLower(name) = "gross weight"\n    value := StrReplace(String(value), ".", ",")\n');
    return citrixInputTiming(source);
  }
  function citrixInputTiming(source) {
    // These helpers cover FCL/LCL, export/import, including buying-only rows.
    // Delay input, not navigation buttons or route-removal clicks.
    for (const name of ['TypeField','SelectField','SelectSupplierField','SelectSupplierAt','PasteField','PasteRemarksField','TypeDetailDescription','DoubleSelectField']) {
      const pattern=new RegExp('^'+name+'\\([^\\n]*\\) \\{[\\s\\S]*?^\\}', 'm');
      const match=source.match(pattern);
      if (!match) {
        if (['SelectSupplierField','SelectSupplierAt','TypeDetailDescription'].includes(name)) continue;
        throw new Error('Could not locate Citrix input helper: '+name);
      }
      let body=match[0];
      if (name==='DoubleSelectField') {
        body=body.replace('  SlowType(value)', '  WaitV974(200)\n  SlowType(value)');
      } else if (name==='PasteRemarksField') {
        body=body.replace('  PasteCurrent(value, true)', '  WaitV974(200)\n  PasteCurrent(value, true)');
      } else {
        body=body.replace(/^(  ClickField\([^\n]+\))$/m, '$1\n  WaitV974(200)');
      }
      if (body===match[0]) throw new Error('Could not add Citrix focus delay: '+name);
      if (name==='SelectField') {
        body=body.replace('  ClickField(name)', '  if IsRouteCodeV1023(name) {\n    TypeRouteCodeV1023(name, value)\n    return\n  }\n  ClickField(name)');
      }
      source=source.replace(pattern,()=>body);
    }
    // This legacy menu is entered inline rather than through SelectField.
    source=source.replace(/^(  ClickField\("Display costs"\))$/gm,'$1\n  WaitV974(200)');
    return source+'\n'+String.raw`IsRouteCodeV1023(name) {
  key := StrLower(name)
  return key = "plor loc code" || key = "polout loc code" || key = "podin loc code" || key = "plod loc code"
}

TypeRouteCodeV1023(name, value) {
  global MENU_AFTER_DELAY
  ; 500 ms after click, 2 seconds across five letters, then 1000 ms before Enter.
  ; Dedicated route timing replaces the ordinary select/menu waits.
  ClickField(name, 500)
  Send "^a"
  for index, character in StrSplit(String(value)) {
    if index > 1
      WaitV974(500)
    SendText character
  }
  WaitV974(1000)
  Send "{Enter}"
  WaitV974(MENU_AFTER_DELAY)
}
`;
  }
  generateAhk = function(){return versionScript(base.generateAhk());};
  generateLclAhk = function(){return versionScript(base.generateLclAhk());};

  // The LCL engine uses USD internally, and CHS redistributes profit again.
  // A temporary cost override keeps delivery out of both distributions.
  calculateLcl = function() {
    if(isImportMode() || !lclDeliverySelectedV963()) return base.calculateLcl();
    const overrides=state.lcl.sellingOverrides ||= {};
    const automatic=!own(overrides,'delivery');
    if(automatic) overrides.delivery=lclChargeCost(readLclCosts(),'delivery');
    let calc;
    try { calc=base.calculateLcl(); } finally { if(automatic) delete overrides.delivery; }
    if(!calc) return calc;
    if(calc.v974Charges) calc.v974Charges=calc.v974Charges.map(c => c.type==='delivery' ? {...c,
      sellingCurrency:c.buyCurrency,
      sellingRate:automatic ? c.buyRate : plain(lclConvert(c.sellingRate,c.sellingCurrency,c.buyCurrency))} : c);
    const charge=calc.v974Charges?.find(c=>c.type==='delivery');
    const row=calc.displayRows?.find(r=>r.key==='delivery');
    if(row){
      row.manual=!automatic;
      if(charge){
        const oldProfit=row.profit;
        row.charge={...charge};row.sellingRate=lclConvert(charge.sellingRate,charge.sellingCurrency,'USD');
        row.totalSelling=row.sellingRate*row.multiplier;row.profit=row.totalSelling-row.buying;
        calc.deliverySelling=row.sellingRate;calc.actualProfit+=row.profit-oldProfit;
      }
    }
    return calc;
  };
  lclCreateCharges = function(calc) {
    const charges=base.lclCreateCharges(calc);
    if(isImportMode())return charges;
    return charges.map(c=>c.type==='delivery' && c.buyCurrency ? {...c,
      sellingRate:plain(lclConvert(c.sellingRate,c.sellingCurrency || 'USD',c.buyCurrency)),sellingCurrency:c.buyCurrency}:c);
  };

  function installEquipmentControls() {
    const route=activeRoute();if(!route)return;
    document.querySelectorAll('#equipmentList .equipment-card').forEach(card=>{
      const eq=route.equipment[Number(card.dataset.index)];if(!eq)return;
      Object.assign(eq,defaults(eq));
      const block=card.querySelector('.precarriage-field');if(!block)return;
      let controls=block.querySelector('.v1020-precarriage');
      if(!controls){
        controls=document.createElement('div');controls.className='v1020-precarriage';
        controls.innerHTML='<label class="field">Transport<select data-v1020="precarriageMode"><option>CHASSIS</option><option>SIMA</option></select></label><label class="waiting-check" data-v1020-drop><input type="checkbox" data-v1020="containerDropOff"> Container drop off</label><label class="waiting-check v1020-advanced" data-v1020-double><input type="checkbox" data-v1020="doubleSimaPrice"> Multiply SIMA buying price × 2</label>';
        block.querySelector('.money-pair')?.after(controls);
        controls.addEventListener('change',e=>{
          const key=e.target.dataset.v1020;if(!key)return;
          eq[key]=e.target.type==='checkbox'?e.target.checked:e.target.value;
          updateAllPreviews();
        });
      }
      controls.hidden=isImportMode() || Boolean(eq.includeStuff);
      controls.querySelectorAll('[data-v1020]').forEach(el=>{if(el.type==='checkbox')el.checked=eq[el.dataset.v1020];else el.value=eq[el.dataset.v1020];});
      controls.querySelector('[data-v1020-drop]').hidden=!sima(eq);
      controls.querySelector('[data-v1020-double]').hidden=!drop(eq);
      const waiting=card.querySelector('.precarriage-waiting-host');
      if(waiting)waiting.classList.toggle('v1020-no-waiting',!isImportMode() && drop(eq));
      const delivery=card.querySelector('.v963-delivery-cost-block');
      if(delivery && !delivery.querySelector('[data-v1020-selling-currency]')){
        const label=document.createElement('label');label.className='field v1020-advanced';label.textContent='Selling currency';
        const select=document.createElement('select');select.dataset.v1020SellingCurrency='true';
        const auto=document.createElement('option');auto.value='';auto.textContent='Buying currency';select.append(auto);
        [...new Set(['SEK','USD','EUR','NOK','DKK',...(state.availableCurrencies || [])])].sort().forEach(c=>select.add(new Option(c,c)));
        select.value=eq.deliverySellingCurrency;
        select.addEventListener('change',()=>{eq.deliverySellingCurrency=select.value;renderRoeRateFields();updateAllPreviews();});
        label.append(select);delivery.append(label);
      }
    });
  }
  previewRows = function(route,group,calc) {
    const box=document.createElement('div');box.innerHTML=base.previewRows(route,group,calc);
    if(!isImportMode())box.querySelectorAll('[data-selling-key^="delivery:"]').forEach(input=>{
      if(input.tagName!=='INPUT')return;
      const key=input.dataset.sellingKey;
      const row=key==='delivery:common'?calc.rows[0]:calc.rows.find(r=>'delivery:'+r.equipment.id===key);
      if(!row)return;
      const currency=row.equipment.deliverySellingCurrency || row.equipment.deliveryCurrency;
      input.dataset.sellingScale=plain(convert(1,calc.target,currency));
      input.setAttribute('value',plain(convert(row.deliverySelling,calc.target,currency)));
      input.setAttribute('aria-label','Delivery selling rate '+currency);
      const unit=document.createElement('span');unit.className='editor-currency';unit.textContent=currency;input.after(unit);
    });
    const total=chargeTotal(createChargeMaps(route,group.equipment,calc),calc.target,false,calc);
    box.insertAdjacentHTML('beforeend',`<div class="profit-line v1020-detail-total"><span>Total sales for detail ${group.detailRow}</span><strong>${Number.isFinite(total)?formatMoney(total,calc.target,2):'—'}</strong></div>`);
    return box.innerHTML;
  };
  function chargeTotal(charges,currency,lcl,calc) {
    return charges.reduce((total,c)=>{
      const quantity=lcl ? (c.per==='v'?calc.volume:c.per==='w'?calc.weightTon:c.per==='weight_m'?Number(c.amount):1) : Number(c.quantity || 1);
      const rate=(lcl?lclConvert:convert)(c.sellingRate,c.sellingCurrency || currency,currency);
      return total+rate*quantity;
    },0);
  }
  function showTotal(id,host,total,currency) {
    if(!host)return;
    let line=$(id);if(!line){line=document.createElement('div');line.id=id;line.className='profit-line v1020-sales-total';host.append(line);}
    line.dataset.total=Number.isFinite(total)?plain(total):'';
    line.innerHTML='<span>Total sales</span><strong></strong>';
    line.querySelector('strong').textContent=Number.isFinite(total)?formatMoney(total,currency,2):'—';
  }
  function updateTotals() {
    if(!state.quoteTexts)return;
    let total=0;const currency=isImportMode()?'USD':$('targetCurrency').value;
    const context=state.v950DetailContext, calculationRoute=state.v912CalculationRoute;
    try{
      for(const route of state.routes || [])for(const group of groupRouteEquipment(route)){
        const calc=calculateDetailGroup(route,group.equipment);
        if(!calc){total=NaN;break;}
        total+=chargeTotal(createChargeMaps(route,group.equipment,calc),currency,false,calc);
      }
    }finally{state.v950DetailContext=context;state.v912CalculationRoute=calculationRoute;}
    showTotal('fclTotalSalesV1020',$('equipmentList')?.parentElement,total,currency);
  }
  function updateLclTotal() {
    if(!state.quoteTexts)return;
    const calc=calculateLcl();const currency=state.lcl?.sellingCurrency || 'USD';
    const total=calc?chargeTotal(lclCreateCharges(calc),currency,true,calc):NaN;
    showTotal('lclTotalSalesV1020',$('lclCalculation'),total,currency);
    const input=$('lclCalculation')?.querySelector('input[data-lcl-selling-key="delivery"]');
    const charge=calc?.v974Charges?.find(c=>c.type==='delivery');
    if(input && charge && !isImportMode()){
      input.dataset.sellingCurrency=charge.sellingCurrency;
      input.value=charge.sellingRate;
      input.setAttribute('aria-label','Delivery selling rate '+charge.sellingCurrency);
      const unit=document.createElement('span');unit.className='editor-currency';unit.textContent=charge.sellingCurrency;input.after(unit);
    }
  }
  renderEquipment = function(...args){const result=base.renderEquipment(...args);installEquipmentControls();return result;};
  updateAllPreviews = function(...args){const result=base.updateAllPreviews(...args);installEquipmentControls();updateTotals();return result;};
  updateLclCalculation = function(...args){const result=base.updateLclCalculation(...args);updateLclTotal();return result;};

  function mismatch(lcl,currency) {
    if(lcl){
      const calc=calculateLcl();if(!calc || calc.freightCollect || calc.includeOcean===false)return [];
      return [...new Set(lclCreateCharges(calc).filter(c=>c.type==='freight' && Number(c.buyRate)>0 && c.buyCurrency!==currency).map(c=>c.buyCurrency))];
    }
    return [...new Set((state.routes || []).filter(r=>fclRouteIncludesOceanV961(r)).flatMap(r=>r.equipment.filter(eq=>
      !fclDetailFreightCollectV960(r,detailRowNumber(eq,1)) && Number(eq.freightAmount)>0 && eq.freightCurrency!==currency).map(eq=>eq.freightCurrency)))];
  }
  function confirmCurrency(lcl,currency) {
    const buying=mismatch(lcl,currency).filter(Boolean);if(!buying.length)return true;
    const signature=JSON.stringify([lcl,state.direction,buying.sort(),currency]);
    if(acknowledgedCurrency===signature)return true;
    if(!window.confirm(`Ocean freight buying currency: ${buying.join(', ')}. Selling currency: ${currency}.\n\nAre you sure you want to continue?`))return false;
    acknowledgedCurrency=signature;return true;
  }
  document.addEventListener('change',event=>{
    const input=event.target;
    const lcl=input.id==='lclSellingCurrencyV973';
    if(!lcl && input.id!=='targetCurrency')return;
    const previous=lcl?previousLclCurrency:previousFclCurrency;
    if(input.value!==previous && !confirmCurrency(lcl,input.value)){
      input.value=previous;event.stopImmediatePropagation();event.preventDefault();return;
    }
    if(lcl)previousLclCurrency=input.value;else previousFclCurrency=input.value;
  },true);
  document.addEventListener('click',event=>{
    const button=event.target.closest?.('#generateScript,#lclGenerateScript');if(!button)return;
    const lcl=button.id==='lclGenerateScript';const currency=lcl?(state.lcl.sellingCurrency || 'USD'):(isImportMode()?'USD':$('targetCurrency').value);
    if(!confirmCurrency(lcl,currency)){event.preventDefault();event.stopImmediatePropagation();}
  },true);
  const style=document.createElement('style');
  style.textContent='body:not(.advanced-mode-enabled) .v1020-advanced{display:none!important}.v1020-precarriage{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-top:8px}.v1020-precarriage [hidden],.v1020-precarriage[hidden],.v1020-no-waiting{display:none!important}.v1020-precarriage select{width:130px}.v1020-sales-total{margin:16px 0;padding:14px;background:#edf5f3;border:1px solid #a1bab1;font-size:16px}.v1020-weight{max-width:240px;margin:8px 0}.v1020-detail-total{border-top:1px solid #aaa}';
  document.head.append(style);
  const weight=document.createElement('label');weight.className='field v1020-weight v1020-advanced';
  weight.innerHTML='FCL gross weight (kg)<input id="fclGrossWeightV1020" type="number" min="0.01" step="0.01" value="25000">';
  $('equipmentList')?.before(weight);
  $('fclGrossWeightV1020')?.addEventListener('input',event=>{
    weightUsesDefault=false;
    state.fclGrossWeight=event.target.value;
    const normal=normaliseWeight(state.fclGrossWeight);
    if (normal) lastValidWeight=normal;
  });
  $('fclGrossWeightV1020')?.addEventListener('blur',()=>currentWeight());
  setWeight({});installEquipmentControls();updateAllPreviews();updateLclCalculation();
})();
