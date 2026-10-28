(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const FLOWERS = {
    rose:      {name:'Роза', petals:9, colors:['#d85f87','#f4a0ba','#b84670'], center:'#f7d4b1', leaf:'#61846a'},
    peony:     {name:'Пион', petals:14, colors:['#ef9eb9','#ffd0de','#ce6d91'], center:'#e8a25c', leaf:'#68876a'},
    tulip:     {name:'Тюльпан', petals:6, colors:['#e46d8e','#ffb2c7','#c64d75'], center:'#f5c66e', leaf:'#557d60'},
    daisy:     {name:'Ромашка', petals:12, colors:['#fffaf0','#fffdf8','#ebd9c6'], center:'#e9b84e', leaf:'#648a68'},
    lily:      {name:'Лилия', petals:6, colors:['#fff1e8','#f8c0ca','#d990a7'], center:'#e2a94e', leaf:'#628267'},
    sunflower: {name:'Подсолнух', petals:14, colors:['#f4c85c','#ffdf85','#dba53f'], center:'#68483c', leaf:'#557d60'},
    anemone:   {name:'Анемон', petals:8, colors:['#8f91ce','#b8b5e9','#6c70ad'], center:'#3f374f', leaf:'#63806c'},
    lavender:  {name:'Лаванда', petals:7, colors:['#a99ad5','#d2c7ee','#8070b7'], center:'#d7b7e8', leaf:'#68866e'}
  };
  const THEMES = {
    rose:      ['#fff8fb','#fce7ef','#492938','#c85e85'],
    lavender:  ['#faf7ff','#e9e0fa','#3f345d','#8872bb'],
    sage:      ['#f7fbf5','#e1eee0','#314c3d','#668e74'],
    peach:     ['#fff8f2','#fde4d5','#704536','#cc795c'],
    sky:       ['#f4faff','#dfeffa','#29445a','#548fb9'],
    champagne: ['#fffdf6','#f5ebd0','#5b4a2e','#a98950'],
    midnight:  ['#29253f','#5e5a85','#fff7fb','#f1bfd0'],
    berry:     ['#fff6f8','#f0c9d8','#572538','#ad426b']
  };
  const FLOWER_SLOTS = [
    {x:34,y:49},{x:50,y:40},{x:66,y:48},{x:25,y:53},{x:42,y:55},
    {x:58,y:55},{x:75,y:53},{x:31,y:39},{x:69,y:39},{x:39,y:45},
    {x:61,y:44},{x:26,y:45},{x:74,y:45},{x:45,y:51},{x:55,y:50}
  ];
  const GREENERY_LEAVES = [
    [13,30,-35],[21,43,25],[18,56,-20],[29,65,34],[25,33,44],
    [82,30,35],[77,41,-30],[84,52,22],[72,63,-40],[79,69,38],
    [36,24,-25],[64,25,30],[41,67,-18],[59,67,22],[50,74,-10],
    [10,67,15],[90,65,-30],[33,52,20],[67,52,-20],[50,31,8]
  ];
  let state = {
    flowers: [
      {id:'bloom-1',type:'rose',x:34,y:49,rotation:-7,scale:1},
      {id:'bloom-2',type:'peony',x:50,y:40,rotation:3,scale:1.05},
      {id:'bloom-3',type:'tulip',x:66,y:48,rotation:8,scale:.96},
      {id:'bloom-4',type:'daisy',x:42,y:53,rotation:-8,scale:.82},
      {id:'bloom-5',type:'lily',x:60,y:52,rotation:6,scale:.87}
    ],
    greenery:'eucalyptus',
    cardStyle:'cream',
    theme:'rose',
    recipient:'',
    message:'Пусть в твоих днях всегда остаётся место для чего-то прекрасного.',
    signature:'С теплом',
    step:1,
    selectedId:'bloom-2'
  };
  let drag = null;
  const recipientView = $('bouquetRecipientView');
  let recipientId = new URLSearchParams(window.location.search).get('l') || '';

  function svgFlower(type) {
    const spec = FLOWERS[type] || FLOWERS.rose;
    const n = spec.petals;
    let petals = '';
    for (let i=0;i<n;i++) {
      const angle=(360/n)*i;
      const rx = type==='sunflower' ? 6.2 : type==='daisy' ? 5.5 : type==='lily' ? 5.8 : type==='lavender' ? 5.2 : 7.4;
      const ry = type==='tulip' ? 14 : type==='sunflower' ? 15 : type==='daisy' ? 14 : type==='lavender' ? 10 : 16;
      const color = spec.colors[i%spec.colors.length];
      petals += '<ellipse cx="0" cy="-13" rx="'+rx+'" ry="'+ry+'" transform="rotate('+angle+')" fill="'+color+'" stroke="'+(type==='daisy'?'#ebdfd1':'rgba(120,55,78,.13)')+'" stroke-width=".7"/>';
    }
    if (type==='rose') {
      petals += '<g fill="#c54f78"><circle cx="0" cy="0" r="12"/><path d="M-8 0 Q-4 -10 2 -6 Q8 -3 5 4 Q1 9 -4 4 Q-7 2 -3 -1 Q0 -3 1 0" fill="#f3a0ba" stroke="#b84670" stroke-width="1.4"/></g>';
    } else {
      petals += '<circle cx="0" cy="0" r="'+(type==='sunflower'?13:type==='daisy'?8:type==='anemone'?10:7)+'" fill="'+spec.center+'"/>';
      if(type==='sunflower') {
        for(let i=0;i<12;i++) {
          const angle=i*30*Math.PI/180, x=Math.cos(angle)*6, y=Math.sin(angle)*6;
          petals += '<circle cx="'+x.toFixed(2)+'" cy="'+y.toFixed(2)+'" r="1.6" fill="#3e2a29"/>';
        }
      }
      if(type==='anemone') petals += '<circle cx="0" cy="0" r="5.5" fill="#2f2c41"/>';
    }
    const tulip = type==='tulip' ? '<path d="M-15 -6 Q-22 -28 -10 -35 Q-4 -22 0 -18 Q5 -32 12 -35 Q23 -23 14 -6 Q8 2 0 3 Q-10 1 -15 -6Z" fill="'+spec.colors[0]+'" stroke="#bd5578" stroke-width="1"/>' : '';
    const flowerHead = type==='tulip' ? tulip : '<g transform="translate(0 0)">'+petals+'</g>';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 180" aria-hidden="true"><defs><linearGradient id="stem-'+type+'" x1="0" y1="0" x2="1" y2="0"><stop stop-color="'+spec.leaf+'"/><stop offset="1" stop-color="#4d7356"/></linearGradient></defs><path d="M50 46 C45 80 59 111 50 176" fill="none" stroke="url(#stem-'+type+')" stroke-width="3.4" stroke-linecap="round"/><path d="M49 101 C31 79 19 86 28 99 C35 108 42 106 49 101Z" fill="'+spec.leaf+'"/><path d="M52 127 C70 103 82 111 73 124 C66 132 59 131 52 127Z" fill="'+spec.leaf+'"/><path d="M49 101 L29 91 M52 127 L74 116" stroke="#c9dfc1" stroke-width="1" opacity=".7"/><g transform="translate(50 43)">'+flowerHead+'</g><path d="M49 170 L50 176" stroke="#3e6549" stroke-width="2" stroke-linecap="round"/></svg>';
  }

  function defaultSlot(index) {
    return FLOWER_SLOTS[index] || {x:22+(index%7)*9,y:48+(index%3)*5};
  }
  function normalizeBloom(raw,index=0) {
    const slot=defaultSlot(index);
    return {
      id:typeof raw?.id==='string' ? raw.id : 'bloom-'+(index+1),
      type:FLOWERS[raw?.type] ? raw.type : 'rose',
      x:clamp(raw?.x,8,92,slot.x),
      y:clamp(raw?.y,22,74,slot.y),
      rotation:clamp(raw?.rotation,-35,35,0),
      scale:clamp(raw?.scale,.7,1.3,1)
    };
  }
  function clamp(v,min,max,fallback) {
    const n=Number(v);
    return Number.isFinite(n) ? Math.max(min,Math.min(max,n)) : fallback;
  }
  function readInputs() {
    state.recipient=$('bouquetRecipient')?.value.trim() || '';
    state.message=$('bouquetMessage')?.value.trim() || '';
    state.signature=$('bouquetSignature')?.value.trim() || '';
  }
  function buildData() {
    readInputs();
    return {
      kind:'bouquet',
      recipient:state.recipient,
      headerText:'БУКЕТ ДЛЯ ТЕБЯ',
      title:'Небольшой букет для тебя',
      message:state.message,
      signature:state.signature,
      theme:state.theme,
      bouquet:{
        flowers:state.flowers.map((b,i)=>normalizeBloom(b,i)),
        greenery:state.greenery,
        cardStyle:state.cardStyle,
        theme:state.theme
      },
      floatingPhotos:[]
    };
  }
  function setTheme(el,theme) {
    if(!el) return;
    const palette=THEMES[theme]||THEMES.rose;
    el.dataset.theme=theme;
    el.style.setProperty('--bouquet-bg-1',palette[0]);
    el.style.setProperty('--bouquet-bg-2',palette[1]);
    el.style.setProperty('--bouquet-ink',palette[2]);
    el.style.setProperty('--bouquet-accent',palette[3]);
  }
  function makeFlowerNode(raw,index,selectedId,interactive) {
    const bloom=normalizeBloom(raw,index);
    const node=document.createElement('div');
    node.className='bouquet-flower-node'+(bloom.id===selectedId?' is-selected':'');
    node.dataset.flowerId=bloom.id;
    node.style.left=bloom.x+'%';
    node.style.top=bloom.y+'%';
    node.style.setProperty('--flower-rotation',bloom.rotation+'deg');
    node.style.setProperty('--flower-scale',String(bloom.scale));
    node.style.zIndex=String(Math.round(bloom.y));
    node.setAttribute('role','button');
    node.setAttribute('tabindex','0');
    node.setAttribute('aria-label',(FLOWERS[bloom.type]?.name||'Цветок')+'. Можно переместить');
    node.innerHTML=svgFlower(bloom.type);
    if(!interactive) {
      node.style.cursor='default';
      node.setAttribute('tabindex','-1');
    }
    return node;
  }
  function renderGreenery(layerId,kind) {
    const layer=$(layerId);
    if(!layer) return;
    layer.replaceChildren();
    layer.dataset.greenery=kind;
    const colors={
      eucalyptus:['#8db29b','#719c83','#b2c9af'],
      fern:['#6e9871','#507f5c','#92b48c'],
      olive:['#829b6c','#6e885b','#a8b98b'],
      willow:['#80a783','#5e8d67','#9cbd9a']
    }[kind]||['#8db29b','#719c83','#b2c9af'];
    GREENERY_LEAVES.forEach((p,i)=>{
      const leaf=document.createElement('span');
      leaf.className='bouquet-leaf';
      leaf.style.left=p[0]+'%';leaf.style.top=p[1]+'%';
      leaf.style.setProperty('--leaf-rotation',p[2]+'deg');
      leaf.style.setProperty('--leaf-color',colors[i%colors.length]);
      layer.append(leaf);
    });
  }
  function renderFlowers(layerId,flowers,selectedId,interactive) {
    const layer=$(layerId);
    if(!layer) return;
    layer.replaceChildren();
    flowers.forEach((b,i)=>layer.append(makeFlowerNode(b,i,selectedId,interactive)));
  }
  function renderArrangement(stageId,flowers,greenery,selectedId,interactive) {
    renderGreenery(stageId==='bouquetRecipientStage'?'bouquetRecipientGreenery':'bouquetPreviewGreenery',greenery);
    renderFlowers(stageId==='bouquetRecipientStage'?'bouquetRecipientFlowers':'bouquetPreviewFlowers',flowers,selectedId,interactive);
  }
  function renderPreview() {
    const sheet=$('bouquetPreviewSheet');
    if(!sheet) return;
    setTheme(sheet,state.theme);
    setTheme($('bouquetPreviewCard'),state.theme);
    $('bouquetPreviewCard').className='bouquet-card-preview card-'+state.cardStyle;
    $('bouquetPreviewHeader').textContent='A LITTLE BOUQUET FOR YOU';
    $('bouquetPreviewTitle').textContent=state.recipient ? 'Букет для '+state.recipient : 'Небольшой букет для тебя';
    $('bouquetPreviewTo').textContent=state.recipient ? 'Для '+state.recipient : 'Для тебя';
    $('bouquetPreviewMessage').textContent=state.message || 'Самые тёплые слова — для тебя.';
    $('bouquetPreviewFrom').textContent=state.signature || 'С теплом';
    renderArrangement('bouquetPreviewStage',state.flowers,state.greenery,state.selectedId,true);
    $('bouquetFlowerCount').textContent='Добавлено '+state.flowers.length+' из 15 цветов.'+(state.flowers.length<3?' Для готового букета нужно ещё '+(3-state.flowers.length)+'.':'');
    const selected=state.flowers.find(x=>x.id===state.selectedId);
    $('bouquetFlowerControls').hidden=!selected;
    if(selected) {
      $('bouquetSelectedLabel').textContent=(FLOWERS[selected.type]?.name||'Цветок')+' — настройки';
      $('bouquetFlowerRotation').value=String(selected.rotation);
      $('bouquetFlowerScale').value=String(Math.round(selected.scale*100));
    }
  }
  function renderStep() {
    document.querySelectorAll('[data-bouquet-step-panel]').forEach(p=>p.hidden=Number(p.dataset.bouquetStepPanel)!==state.step);
    document.querySelectorAll('[data-bouquet-step]').forEach(b=>b.classList.toggle('is-active',Number(b.dataset.bouquetStep)===state.step));
    $('bouquetStepBack').disabled=state.step===1;
    $('bouquetStepNext').hidden=state.step===5;
    document.querySelectorAll('[data-bouquet-theme]').forEach(b=>b.classList.toggle('is-selected',b.dataset.bouquetTheme===state.theme));
    document.querySelectorAll('[data-greenery]').forEach(b=>b.classList.toggle('is-selected',b.dataset.greenery===state.greenery));
    document.querySelectorAll('[data-card-style]').forEach(b=>b.classList.toggle('is-selected',b.dataset.cardStyle===state.cardStyle));
  }
  function setMode(mode) {
    const isBouquet=mode==='bouquet';
    $('letterPreviewPaper').hidden=isBouquet;
    $('bouquetPreviewPanel').hidden=!isBouquet;
    $('letterForm').hidden=isBouquet;
    $('letterFootnote').hidden=isBouquet;
    $('bouquetBuilderFields').hidden=!isBouquet;
    document.querySelectorAll('[data-builder-mode]').forEach(b=>{
      const active=b.dataset.builderMode===mode;
      b.classList.toggle('is-active',active);
      b.setAttribute('aria-pressed',String(active));
    });
    $('editorEyebrow').textContent=isBouquet?'A DIGITAL BOUQUET':'A NOTE TO SOMEONE';
    $('editorHeading').textContent=isBouquet?'Создай свой букет':'Скажи это по-особенному.';
    $('editorLead').textContent=isBouquet?'Выбери цветы, расставь их как тебе нравится, добавь открытку и отправь короткую ссылку.':'Напиши личное письмо, посмотри, как оно открывается, и создай ссылку для одного человека.';
    if(isBouquet){renderStep();renderPreview();}
  }
  function addFlower(type) {
    if(!FLOWERS[type]) return;
    if(state.flowers.length>=15) {
      $('bouquetStatus').textContent='Максимум — 15 цветов. Удали один из букета, чтобы добавить другой.';
      return;
    }
    const index=state.flowers.length,slot=defaultSlot(index);
    const bloom={id:'bloom-'+Date.now().toString(36)+'-'+index,type,x:slot.x,y:slot.y,rotation:(index%2?-6:6),scale:index>7?.86:1};
    state.flowers.push(bloom);
    state.selectedId=bloom.id;
    $('bouquetStatus').textContent='';
    renderPreview();
  }
  function updateSelectedBloom() {
    const flower=state.flowers.find(x=>x.id===state.selectedId);
    if(!flower) return;
    flower.rotation=Number($('bouquetFlowerRotation').value);
    flower.scale=Number($('bouquetFlowerScale').value)/100;
    renderPreview();
  }
  function removeSelectedFlower() {
    if(!state.selectedId) return;
    state.flowers=state.flowers.filter(x=>x.id!==state.selectedId);
    state.selectedId=state.flowers[state.flowers.length-1]?.id||null;
    renderPreview();
  }
  function moveSelectedFlower(event) {
    const node=event.target.closest('.bouquet-flower-node');
    if(!node) return;
    const bloom=state.flowers.find(x=>x.id===node.dataset.flowerId);
    if(!bloom) return;
    state.selectedId=bloom.id;
    const stage=$('bouquetPreviewStage');
    stage.querySelectorAll('.bouquet-flower-node').forEach(item=>item.classList.toggle('is-selected',item.dataset.flowerId===bloom.id));
    $('bouquetFlowerControls').hidden=false;
    $('bouquetSelectedLabel').textContent=(FLOWERS[bloom.type]?.name||'Цветок')+' — настройки';
    $('bouquetFlowerRotation').value=String(bloom.rotation);
    $('bouquetFlowerScale').value=String(Math.round(bloom.scale*100));
    drag={pointerId:event.pointerId,id:bloom.id,startX:event.clientX,startY:event.clientY,originX:bloom.x,originY:bloom.y,moved:false};
    node.setPointerCapture?.(event.pointerId);
  }
  function handleFlowerMove(event) {
    if(!drag||drag.pointerId!==event.pointerId) return;
    const stage=$('bouquetPreviewStage'),rect=stage.getBoundingClientRect();
    const dx=event.clientX-drag.startX,dy=event.clientY-drag.startY;
    if(Math.hypot(dx,dy)>2) drag.moved=true;
    const bloom=state.flowers.find(x=>x.id===drag.id);
    if(!bloom)return;
    bloom.x=clamp(drag.originX+dx/rect.width*100,8,92,drag.originX);
    bloom.y=clamp(drag.originY+dy/rect.height*100,22,74,drag.originY);
    const node=$('bouquetPreviewFlowers').querySelector('[data-flower-id="'+drag.id+'"]');
    if(node){node.style.left=bloom.x+'%';node.style.top=bloom.y+'%';}
  }
  function endFlowerMove(event) {
    if(!drag|| (event && drag.pointerId!==event.pointerId))return;
    const didMove=drag.moved;
    drag=null;
    renderPreview();
    if(didMove) $('bouquetStatus').textContent='Положение цветка сохранено в макете.';
  }
  function validateStep(nextStep) {
    readInputs();
    if(state.step===1 && state.flowers.length<3) {
      $('bouquetStatus').textContent='Добавь минимум 3 цветка, чтобы создать букет.';
      return false;
    }
    if(state.step===4 && !state.message) {
      $('bouquetStatus').textContent='Добавь несколько слов на открытку.';
      $('bouquetMessage').focus();
      return false;
    }
    if(nextStep) $('bouquetStatus').textContent='';
    return true;
  }
  async function createBouquet() {
    readInputs();
    if(state.flowers.length<3) {
      state.step=1;renderStep();
      $('bouquetStatus').textContent='Добавь минимум 3 цветка, чтобы создать букет.';
      return;
    }
    if(!state.message) {
      state.step=4;renderStep();
      $('bouquetStatus').textContent='Добавь несколько слов на открытку.';
      $('bouquetMessage').focus();
      return;
    }
    if(window.location.protocol==='file:') {
      $('bouquetStatus').textContent='Сначала открой опубликованный сайт через HTTPS.';
      return;
    }
    const data=buildData();
    $('createBouquetLink').disabled=true;
    $('createBouquetLink').textContent='Собираю букет…';
    $('bouquetShareResult').hidden=false;
    $('bouquetShareUrl').value='Сохраняю букет…';
    try {
      const response=await fetch('https://ennhfbjuyifzughuahhw.supabase.co/functions/v1/letter-api',{
        method:'POST',
        headers:{'Content-Type':'application/json','apikey':'sb_publishable_CfMmv9VCEfYO_MHFP1Vp-w_Jm0jAgbG'},
        body:JSON.stringify({data})
      });
      const result=await response.json().catch(()=>({}));
      if(!response.ok||!result.id) throw new Error(result.error||'Не удалось сохранить букет.');
      const url=new URL('https://letter-site-sand.vercel.app/');
      url.searchParams.set('l',result.id);
      $('bouquetShareUrl').value=url.toString();
      $('bouquetStatus').textContent='Букет готов. Ссылка короткая, а расположение цветов сохранено.';
      $('copyBouquetLink').textContent='Копировать';
    } catch(error) {
      $('bouquetShareUrl').value='';
      $('bouquetStatus').textContent=error?.message||'Не удалось создать ссылку. Попробуй ещё раз.';
    } finally {
      $('createBouquetLink').disabled=false;
      $('createBouquetLink').textContent='Создать букет ↗';
    }
  }
  function copyBouquetLink() {
    const value=$('bouquetShareUrl').value;
    if(!/^https:\/\//.test(value)) return;
    const done=()=>{$('copyBouquetLink').textContent='Скопировано ✓';};
    if(navigator.clipboard?.writeText) navigator.clipboard.writeText(value).then(done).catch(()=>{
      $('bouquetShareUrl').select();document.execCommand('copy');done();
    });
    else {$('bouquetShareUrl').select();document.execCommand('copy');done();}
  }
  function renderRecipient(data) {
    const view=$('bouquetRecipientView');
    if(!view)return;
    const bouquet=data.bouquet||{};
    state={
      ...state,
      recipient:String(data.recipient||''),
      message:String(data.message||''),
      signature:String(data.signature||''),
      theme:THEMES[bouquet.theme||data.theme]? (bouquet.theme||data.theme):'rose',
      greenery:['eucalyptus','fern','olive','willow'].includes(bouquet.greenery)?bouquet.greenery:'eucalyptus',
      cardStyle:['cream','vintage','rose-gold','midnight','kraft','garden'].includes(bouquet.cardStyle)?bouquet.cardStyle:'cream',
      flowers:Array.isArray(bouquet.flowers)?bouquet.flowers.slice(0,15).map(normalizeBloom):[]
    };
    const savedId=recipientId;
    if(savedId) {
      try {
        const saved=JSON.parse(localStorage.getItem('bouquet-layout:'+savedId)||'null');
        if(Array.isArray(saved)) state.flowers=state.flowers.map((b,i)=>saved[i]?({...b,x:clamp(saved[i].x,8,92,b.x),y:clamp(saved[i].y,22,74,b.y)}):b);
      } catch(_){}
    }
    setTheme(view,state.theme);
    $('bouquetRecipientHeader').textContent='БУКЕТ ДЛЯ '+(state.recipient||'ТЕБЯ').toLocaleUpperCase('ru-RU');
    $('bouquetRecipientTitle').textContent=state.recipient?'Букет для '+state.recipient:'Небольшой букет для тебя';
    $('bouquetRecipientCard').className='bouquet-recipient-card card-'+state.cardStyle;
    $('bouquetRecipientTo').textContent=state.recipient?'Для '+state.recipient:'Для тебя';
    $('bouquetRecipientMessage').textContent=state.message;
    $('bouquetRecipientFrom').textContent=state.signature;
    renderGreenery('bouquetRecipientGreenery',state.greenery);
    renderFlowers('bouquetRecipientFlowers',state.flowers,null,true);
    setupRecipientDrag();
  }
  function setupRecipientDrag() {
    const stage=$('bouquetRecipientStage');
    if(!stage||stage.dataset.dragReady==='1')return;
    stage.dataset.dragReady='1';
    stage.addEventListener('pointerdown',event=>{
      const node=event.target.closest('.bouquet-flower-node');
      if(!node)return;
      const bloom=state.flowers.find(x=>x.id===node.dataset.flowerId);if(!bloom)return;
      event.preventDefault();
      drag={pointerId:event.pointerId,id:bloom.id,startX:event.clientX,startY:event.clientY,originX:bloom.x,originY:bloom.y,moved:false,recipient:true};
      node.setPointerCapture?.(event.pointerId);
    });
    stage.addEventListener('pointermove',event=>{
      if(!drag||!drag.recipient||drag.pointerId!==event.pointerId)return;
      const rect=stage.getBoundingClientRect(),dx=event.clientX-drag.startX,dy=event.clientY-drag.startY;
      if(Math.hypot(dx,dy)>2)drag.moved=true;
      const bloom=state.flowers.find(x=>x.id===drag.id);if(!bloom)return;
      bloom.x=clamp(drag.originX+dx/rect.width*100,8,92,bloom.x);
      bloom.y=clamp(drag.originY+dy/rect.height*100,22,74,bloom.y);
      const node=stage.querySelector('[data-flower-id="'+drag.id+'"]');
      if(node){node.style.left=bloom.x+'%';node.style.top=bloom.y+'%';}
    });
    const end=event=>{
      if(!drag||!drag.recipient||(event&&drag.pointerId!==event.pointerId))return;
      const moved=drag.moved;drag=null;
      if(moved&&recipientId)try{localStorage.setItem('bouquet-layout:'+recipientId,JSON.stringify(state.flowers.map(b=>({x:b.x,y:b.y}))));}catch(_){}
    };
    stage.addEventListener('pointerup',end);
    stage.addEventListener('pointercancel',end);
    stage.addEventListener('keydown',event=>{
      const node=event.target.closest('.bouquet-flower-node');
      if(!node||!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key))return;
      event.preventDefault();
      const bloom=state.flowers.find(x=>x.id===node.dataset.flowerId);if(!bloom)return;
      if(event.key==='ArrowLeft')bloom.x=clamp(bloom.x-2,8,92,bloom.x);
      if(event.key==='ArrowRight')bloom.x=clamp(bloom.x+2,8,92,bloom.x);
      if(event.key==='ArrowUp')bloom.y=clamp(bloom.y-2,22,74,bloom.y);
      if(event.key==='ArrowDown')bloom.y=clamp(bloom.y+2,22,74,bloom.y);
      node.style.left=bloom.x+'%';node.style.top=bloom.y+'%';
    });
  }

  document.querySelectorAll('[data-builder-mode]').forEach(button=>button.addEventListener('click',()=>setMode(button.dataset.builderMode)));
  document.querySelectorAll('[data-add-flower]').forEach(button=>button.addEventListener('click',()=>addFlower(button.dataset.addFlower)));
  document.querySelectorAll('[data-flower-art]').forEach(el=>el.innerHTML=svgFlower(el.dataset.flowerArt));
  document.querySelectorAll('[data-greenery]').forEach(button=>button.addEventListener('click',()=>{
    state.greenery=button.dataset.greenery;renderStep();renderPreview();
  }));
  document.querySelectorAll('[data-card-style]').forEach(button=>button.addEventListener('click',()=>{
    state.cardStyle=button.dataset.cardStyle;renderStep();renderPreview();
  }));
  document.querySelectorAll('[data-bouquet-theme]').forEach(button=>button.addEventListener('click',()=>{
    state.theme=button.dataset.bouquetTheme;renderStep();renderPreview();
  }));
  document.querySelectorAll('[data-bouquet-step]').forEach(button=>button.addEventListener('click',()=>{
    const next=Number(button.dataset.bouquetStep);
    if(next>state.step&&!validateStep(true))return;
    state.step=next;renderStep();
  }));
  $('bouquetStepNext')?.addEventListener('click',()=>{
    if(!validateStep(true))return;
    state.step=Math.min(5,state.step+1);renderStep();
  });
  $('bouquetStepBack')?.addEventListener('click',()=>{
    state.step=Math.max(1,state.step-1);renderStep();
  });
  ['bouquetRecipient','bouquetMessage','bouquetSignature'].forEach(id=>$(id)?.addEventListener('input',()=>{
    readInputs();renderPreview();
  }));
  $('bouquetFlowerRotation')?.addEventListener('input',updateSelectedBloom);
  $('bouquetFlowerScale')?.addEventListener('input',updateSelectedBloom);
  $('removeBouquetFlower')?.addEventListener('click',removeSelectedFlower);
  $('bouquetPreviewStage')?.addEventListener('pointerdown',event=>{
    const node=event.target.closest('.bouquet-flower-node');
    if(!node)return;
    event.preventDefault();
    moveSelectedFlower(event);
  });
  $('bouquetPreviewStage')?.addEventListener('pointermove',handleFlowerMove);
  $('bouquetPreviewStage')?.addEventListener('pointerup',endFlowerMove);
  $('bouquetPreviewStage')?.addEventListener('pointercancel',endFlowerMove);
  $('createBouquetLink')?.addEventListener('click',createBouquet);
  $('copyBouquetLink')?.addEventListener('click',copyBouquetLink);
  renderPreview();
  renderStep();
  window.renderBouquetRecipient=renderRecipient;
})();