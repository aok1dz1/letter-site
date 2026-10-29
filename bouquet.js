(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const FLOWERS = {
    rose:       {name:'Роза', sprite:0, colors:['#e8a4ae','#f6d0ca','#c87382'], center:'#9f4358', leaf:'#6b8b68'},
    peony:      {name:'Пион', sprite:1, colors:['#e8a0b5','#f8d5dc','#c96f91'], center:'#d88da3', leaf:'#718e6d'},
    ranunculus: {name:'Ранункулюс', sprite:2, colors:['#eaa5a8','#f8d7cf','#cc7180'], center:'#d98a82', leaf:'#718b69'},
    tulip:      {name:'Тюльпан', sprite:3, colors:['#e99aa7','#f7c6cd','#c76a7a'], center:'#e99aa7', leaf:'#66865e'},
    daisy:      {name:'Ромашка', sprite:4, colors:['#fff8e9','#fffdf5','#eadfcf'], center:'#dcae58', leaf:'#708e69'},
    lily:       {name:'Лилия', sprite:5, colors:['#f4d8d0','#fff2e9','#d88e9e'], center:'#c88c4e', leaf:'#6d8761'},
    hydrangea:  {name:'Гортензия', sprite:6, colors:['#d8b6d9','#f0d9eb','#b69bcf'], center:'#d3a45f', leaf:'#68845e'},
    carnation:  {name:'Гвоздика', sprite:7, colors:['#e9a4b3','#f7d1d7','#cb768d'], center:'#d6879c', leaf:'#688663'},
    anemone:    {name:'Анемон', sprite:8, colors:['#f0d6d7','#fff0e9','#c7a1ba'], center:'#39354b', leaf:'#6d896a'},
    lavender:   {name:'Лаванда', sprite:9, colors:['#aa9bcf','#d5c7e9','#8573ad'], center:'#b8a4d8', leaf:'#748c6e'},
    gypsophila: {name:'Гипсофила', sprite:10, colors:['#fffaf1','#fffef8','#ecdde0'], center:'#e8c3bf', leaf:'#81977a'},
    eucalyptus: {name:'Эвкалипт', sprite:11, colors:['#b4c8b2','#dce5d7','#7f9b84'], center:'#81977a', leaf:'#81977a'},
    sunflower:  {name:'Подсолнух', sprite:null, colors:['#e9c56b','#f7dda0','#cfa64a'], center:'#655046', leaf:'#66825b'}
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
  let letterBouquetDrag = null;
  let attachedRecipientDrag = null;
  let attachedRecipientFlowers = [];
  let attachedRecipientId = '';
  const recipientView = $('bouquetRecipientView');
  let recipientId = new URLSearchParams(window.location.search).get('l') || '';

  function svgFlower(type) {
    const spec = FLOWERS[type] || FLOWERS.rose;
    const colors = spec.colors;
    const esc = (v) => String(v).replace(/&/g,'&amp;').replace(/"/g,'&quot;');
    let head = '';
    const ellipse = (x,y,rx,ry,rotation,fill,opacity,stroke) =>
      '<ellipse cx="'+x+'" cy="'+y+'" rx="'+rx+'" ry="'+ry+'" transform="rotate('+rotation+' '+x+' '+y+')"' +
      ' fill="'+fill+'" opacity="'+(opacity===undefined?1:opacity)+'" stroke="'+(stroke||'rgba(112,67,77,.16)')+'" stroke-width=".65"/>';
    const path = (d,fill,stroke,sw,opacity) =>
      '<path d="'+d+'" fill="'+fill+'"'+(stroke?' stroke="'+stroke+'"':'')+
      (sw?' stroke-width="'+sw+'"':'')+(opacity!==undefined?' opacity="'+opacity+'"':'')+'/>';
    const dot = (x,y,r,fill,opacity) =>
      '<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+fill+'"'+(opacity!==undefined?' opacity="'+opacity+'"':'')+'/>';
    const ring = (count,rx,ry,radius,palette,offset,opacity) => {
      let out='';
      const r=Math.abs(radius);
      for(let i=0;i<count;i++){
        const a=(360/count)*i+(offset||0);
        const rad=a*Math.PI/180;
        const x=Math.cos(rad)*r;
        const y=Math.sin(rad)*r*.72;
        out+=ellipse(x,y,rx,ry,a+90,palette[i%palette.length],opacity===undefined?1:opacity,'rgba(133,76,91,.19)');
      }
      return out;
    };
    const leaf = (y,side,scale,angle) => {
      const mirror=side==='right'?-1:1;
      return '<g transform="translate(50 '+y+') scale('+mirror+' 1) rotate('+angle+') scale('+scale+')">'+
        path('M0 0 C-10 -5 -20 -24 -34 -22 C-30 -8 -16 5 0 0Z',spec.leaf,'rgba(47,83,55,.28)',.7)+
        path('M-1 0 Q-17 -10 -32 -21','none','#c7d6b5',.9,.72)+
        path('M-14 -9 L-22 -7 M-20 -14 L-27 -14','none','#dbe3c9',.65,.65)+
      '</g>';
    };
    const petalsRadial = (count,rx,ry,radius,palette,angleOffset=0,opacity=1) => {
      let out='';
      for(let i=0;i<count;i++){
        const a=360/count*i+angleOffset;
        const rad=a*Math.PI/180;
        const x=Math.cos(rad)*radius;
        const y=Math.sin(rad)*radius;
        out+=ellipse(x,y,rx,ry,a+90,palette[i%palette.length],opacity);
      }
      return out;
    };
    const stem =
      path('M50 40 C44 70 56 103 49 176','none','#547b5c',3.2,1)+
      path('M50 43 C46 76 54 111 49 172','none','#93aa7e',1.1,.95)+
      leaf(91,'left',.82,-14)+leaf(111,'right',.9,12)+
      leaf(132,'left',.72,-7)+leaf(150,'right',.68,10)+
      path('M48 174 Q48 177 47 179','none','#527650',1.5,1);

    if(type==='rose'){
      head += ring(9,10.5,16,-7,colors,10,.96);
      head += ring(8,8.5,12,-5,colors,32,.98);
      head += ring(6,6.5,8,-3,colors,18,1);
      head += path('M-7 -2 C-9 -10 -1 -14 5 -10 C12 -6 8 1 2 2 C-3 4 -5 0 -2 -3 C1 -6 5 -2 3 1','none','#a74e66',1.6,.98);
      head += path('M-2 -7 C3 -11 8 -7 6 -3 C4 0 1 -2 3 -4','none','#f8dfd5',1.4,.9);
      head += dot(-9,-15,2.2,'#fff4eb',.85)+dot(11,-7,1.4,'#fff7ee',.9);
    } else if(type==='peony'){
      // Layered, rounded petals with visible folded edges and a soft shaded centre.
      head += ring(13,7.2,12,8,colors,4,.88);
      head += ring(11,6.8,10,6,colors,21,.94);
      head += ring(9,5.6,8,4,colors,2,.98);
      head += ring(7,4.3,6,2,colors,26,1);
      head += path('M-7 -1 C-9 -7 -4 -12 0 -8 C4 -13 10 -8 7 -2 C5 3 -1 5 -5 2Z',colors[1],'rgba(164,83,112,.3)',.7,1);
      head += path('M-4 -2 Q-1 -8 2 -4 Q6 -1 1 2 Q-3 3 -2 -1 Q0 -3 2 -1','none','#b76180',1.05,.95);
      head += path('M-12 -7 Q-9 -15 -4 -16 M9 -12 Q13 -7 12 -2 M-4 -17 Q0 -20 3 -17','none','rgba(255,246,239,.8)',.85,.9);
    } else if(type==='ranunculus'){
      // Many small overlapping petals, gradually tightening into a spiral center.
      for(let layer=0;layer<5;layer++){
        const count=14-layer;
        const radius=12-layer*2.1;
        for(let i=0;i<count;i++){
          const a=360/count*i+layer*11;
          const rad=a*Math.PI/180;
          const x=Math.cos(rad)*radius;
          const y=-5+Math.sin(rad)*radius*.74;
          const rx=4.1-layer*.38, ry=7.8-layer*.85;
          head+=ellipse(x,y,rx,ry,a+90,colors[(i+layer)%colors.length],.96,'rgba(160,82,91,.22)');
          head+=path('M'+x.toFixed(1)+' '+(y-ry+1).toFixed(1)+' Q'+(x+1).toFixed(1)+' '+(y-1).toFixed(1)+' '+(x+.2).toFixed(1)+' '+(y+ry-1).toFixed(1),'none','rgba(255,247,235,.58)',.65,.8);
        }
      }
      head+=path('M-4 -5 Q-2 -12 3 -10 Q8 -8 4 -3 Q1 0 -2 -3 Q-4 -5 0 -7','none','#c16c74',1.25,1);
      head+=dot(0,-6,1.7,'#f8e0cb',1);
    } else if(type==='tulip'){
      head += path('M-20 6 C-28 -5 -23 -21 -12 -28 C-6 -22 -2 -15 0 -12 C3 -23 9 -31 14 -29 C26 -18 27 -2 17 7 C8 15 -10 15 -20 6Z',colors[0],'rgba(151,67,91,.28)',.9);
      head += path('M-20 4 C-14 -1 -10 -15 -12 -27 C-3 -18 -1 -5 0 8 C0 -4 7 -18 14 -29 C12 -12 16 -1 18 5 C8 15 -10 15 -20 4Z',colors[1],'rgba(255,239,228,.55)',.7,.95);
      head += path('M-7 -17 Q-6 -4 -2 7 M7 -19 Q5 -4 3 8','none','#c97083',.8,.7);
      head += path('M-15 1 Q0 12 15 1','none','rgba(255,245,235,.7)',.8,.75);
    } else if(type==='daisy' || type==='sunflower'){
      const n=type==='sunflower'?18:16;
      const palette=type==='sunflower'?colors:['#fffdf5','#f8edda','#fffaf1'];
      head += petalsRadial(n,type==='sunflower'?4.7:3.7,type==='sunflower'?14:13,9,palette,type==='sunflower'?0:3,1);
      head += petalsRadial(n,type==='sunflower'?3.4:2.6,type==='sunflower'?11:10,7,palette,10,.95);
      head += dot(0,0,type==='sunflower'?12:8,spec.center,1);
      if(type==='sunflower'){
        head += dot(0,0,9,'#795b42',1);
        for(let i=0;i<44;i++){
          const a=i*137.5*Math.PI/180;
          const rad=2+Math.sqrt(i)*1.15;
          head+=dot((Math.cos(a)*rad).toFixed(1),(Math.sin(a)*rad*.86).toFixed(1),.65,i%3?'#b08a5d':'#352c2b',.95);
        }
      }else{
        for(let i=0;i<12;i++){
          const a=i*30*Math.PI/180;
          head+=dot((Math.cos(a)*4.5).toFixed(2),(Math.sin(a)*4.5).toFixed(2),.6,'#f4d889',.9);
        }
      }
    } else if(type==='lily'){
      for(let i=0;i<6;i++){
        const a=i*60;
        head += '<g transform="rotate('+a+')">'+
          path('M0 8 C-8 -1 -13 -17 -4 -31 C-1 -26 1 -20 0 -15 C3 -23 7 -29 8 -30 C15 -12 8 1 0 8Z',colors[i%colors.length],'rgba(163,98,116,.3)',.8)+
          path('M0 4 Q0 -14 3 -27','none','rgba(255,250,236,.82)',.8,.85)+
          path('M1 -3 L-2 -14 M2 -2 L5 -12','none','#c7898e',.6,.75)+
        '</g>';
      }
      head += path('M0 1 Q-2 -7 -4 -15 M0 1 Q3 -9 5 -15 M0 1 Q0 -10 0 -18','none','#9a6c54',1.2,1);
      head += dot(-4,-15,1.7,'#c69a51',1)+dot(5,-15,1.7,'#c69a51',1)+dot(0,-18,1.7,'#c69a51',1);
    } else if(type==='hydrangea'){
      // Rounded cluster of small four-petal florets.
      const centers=[];
      for(let row=-2;row<=2;row++){
        for(let col=-2;col<=2;col++){
          if(Math.abs(row*1.05)+Math.abs(col*.95)<=3.1){
            centers.push([col*7,row*6.2-3]);
          }
        }
      }
      centers.forEach((p,i)=>{
        const x=p[0],y=p[1],pal=colors;
        for(let k=0;k<4;k++){
          const an=k*90+i*11;
          const rad=4.1;
          const dx=x+Math.cos(an*Math.PI/180)*rad,dy=y+Math.sin(an*Math.PI/180)*rad;
          head+=ellipse(dx,dy,3.5,4.2,an,pal[(i+k)%pal.length],.93,'rgba(128,91,144,.18)');
        }
        head+=dot(x,y,1.15,'#e8d4a7',.95);
      });
    } else if(type==='gypsophila'){
      // Several branching stems with tiny clusters of white buds.
      head='';
      const branches=[
        [0,5,-17,-8], [0,5,16,-14], [0,3,-22,-28], [0,4,22,-32],
        [0,8,-8,-39], [0,9,12,-48], [0,8,-29,-48], [0,10,30,-44],
        [0,10,-3,-57], [0,12,18,-61]
      ];
      branches.forEach((p,i)=>{
        head+=path('M'+p[0]+' '+p[1]+' Q'+(p[2]*.45).toFixed(1)+' '+(p[3]*.42).toFixed(1)+' '+p[2]+' '+p[3],'none','#7f9a79',1.15,.95);
        const x=p[2],y=p[3];
        for(let k=0;k<5;k++){
          const ang=k*72+i*19, rad=2.1+(k%2)*.6;
          const px=x+Math.cos(ang*Math.PI/180)*rad,py=y+Math.sin(ang*Math.PI/180)*rad;
          head+=ellipse(px,py,1.9,2.25,ang,colors[(k+i)%colors.length],1,'rgba(190,166,167,.32)');
        }
        head+=dot(x,y,1.05,spec.center,.95);
      });
    } else if(type==='lavender'){
      // Slender lavender spike with small buds along the stem.
      head='';
      head+=path('M0 16 C-2 -2 1 -29 0 -62','none','#6c8a65',1.8,1);
      for(let row=0;row<8;row++){
        const y=10-row*8;
        const width=7-row*.55;
        head+=path('M0 '+y+' Q-'+(width+5)+' '+(y-2)+' -'+width+' '+(y-8)+' Q-1 '+(y-5)+' 0 '+y+'Z',colors[row%colors.length],'rgba(116,91,148,.2)',.55,1);
        head+=path('M0 '+(y-2)+' Q'+(width+4)+' '+(y-5)+' '+width+' '+(y-10)+' Q2 '+(y-6)+' 0 '+(y-2)+'Z',colors[(row+1)%colors.length],'rgba(116,91,148,.2)',.55,1);
      }
      head+=path('M0 -57 Q-6 -67 0 -72 Q6 -67 0 -57Z',colors[1],'rgba(116,91,148,.2)',.55,1);
    } else if(type==='carnation'){
      // Soft scalloped, layered petals with tiny ruffles.
      for(let layer=0;layer<3;layer++){
        const n=13-layer*2;
        for(let i=0;i<n;i++){
          const a=360/n*i+layer*8;
          const r=12-layer*4;
          const x=Math.cos(a*Math.PI/180)*r,y=Math.sin(a*Math.PI/180)*r-5;
          head+=path('M'+x.toFixed(1)+' '+y.toFixed(1)+' c-6 -7 -4 -13 0 -13 c2 3 2 5 4 3 c1 -5 7 -5 7 0 c0 5 -3 9 -7 12Z',colors[(i+layer)%colors.length],'rgba(157,79,98,.19)',.55,.98);
        }
      }
      head+=ring(6,4,6,-4,colors,15,1);
    } else if(type==='anemone'){
      head+=ring(9,8.8,14,-5,colors,0,.96);
      head+=ring(8,7.2,11,-6,colors,23,.98);
      head+=dot(0,-4,9,'#f7f0e9',.98);
      head+=dot(0,-4,6.5,spec.center,1);
      for(let i=0;i<22;i++){
        const a=i*360/22*Math.PI/180;
        const x=Math.cos(a)*7.4,y=-4+Math.sin(a)*7.4;
        head+=dot(x.toFixed(2),y.toFixed(2),.7,i%2?'#e1bb76':'#292638',1);
      }
    }

    let stemMarkup =
      path('M50 40 C46 72 55 105 49 176','none','#5e805e',3.1,1)+
      path('M50 42 C47 73 53 105 49 173','none','#a4b58a',.95,.94)+
      leaf(92,'left',.84,-14)+leaf(109,'right',.91,13)+
      leaf(132,'left',.72,-8)+leaf(151,'right',.7,10)+
      path('M49 171 Q48 176 47 179','none','#496f52',1.4,1);

    if(type==='lily'){
      stemMarkup=path('M50 40 C46 72 54 104 49 176','none','#5e805e',3.1,1)+
        path('M50 42 C47 73 52 105 49 173','none','#a4b58a',.95,.94)+
        leaf(103,'left',.82,-16)+leaf(129,'right',.76,12)+leaf(154,'left',.56,-7);
    } else if(type==='lavender'){
      stemMarkup=path('M50 39 C48 74 53 111 49 176','none','#5e805e',2.8,1)+
        path('M50 41 C48 72 51 110 49 173','none','#a4b58a',.9,.94)+
        leaf(105,'left',.62,-25)+leaf(128,'right',.62,22)+leaf(151,'left',.48,-11);
    } else if(type==='gypsophila'){
      stemMarkup=path('M50 45 C46 81 54 120 49 176','none','#718c6b',2.5,1)+
        path('M50 58 Q42 35 32 28 M49 79 Q65 56 76 43 M49 99 Q31 80 23 68 M49 116 Q67 95 80 79 M49 136 Q40 121 31 112','none','#718c6b',1.4,.95)+
        leaf(128,'left',.45,-16);
    } else if(type==='hydrangea'){
      stemMarkup=path('M50 42 C46 72 54 110 49 176','none','#5e805e',3.1,1)+
        path('M50 72 Q32 61 26 51 M51 84 Q68 70 76 57','none','#5e805e',1.7,1)+
        leaf(108,'left',.82,-14)+leaf(137,'right',.73,13)+leaf(159,'left',.5,-7);
    } else if(type==='carnation'){
      stemMarkup=path('M50 40 C46 72 54 108 49 176','none','#5e805e',3.1,1)+
        path('M50 63 Q37 57 30 44','none','#5e805e',1.5,1)+
        leaf(97,'left',.72,-14)+leaf(119,'right',.78,15)+leaf(145,'left',.55,-9);
    } else if(type==='tulip'){
      stemMarkup=path('M50 43 C51 85 49 122 50 176','none','#5e805e',3.2,1)+
        path('M50 122 Q30 102 30 79 Q45 87 50 110Z','#77966b','rgba(76,112,77,.3)',.7)+
        path('M50 147 Q69 121 71 95 Q54 105 50 132Z','#6d8c63','rgba(76,112,77,.3)',.7)+
        path('M50 121 Q39 101 32 83','none','#c7d8af',.8,.8)+path('M50 145 Q62 123 68 101','none','#c7d8af',.8,.8);
    } else if(type==='sunflower'){
      stemMarkup=path('M50 48 C46 80 58 110 50 176','none','#5e805e',4,1)+
        leaf(81,'left',1,-16)+leaf(103,'right',.96,13)+leaf(131,'left',.86,-8)+leaf(153,'right',.72,10);
    }
    if(type==='gypsophila'||type==='lavender') {
      // The flower spike sits directly on its own fine stem, with a few buds flowing into the stem line.
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 180" aria-hidden="true"><defs>'+
        '<linearGradient id="stem-'+type+'" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#567654"/><stop offset=".55" stop-color="'+spec.leaf+'"/><stop offset="1" stop-color="#4b6c50"/></linearGradient>'+
        '</defs>'+stemMarkup+'<g transform="translate(50 100)">'+head+'</g></svg>';
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 180" aria-hidden="true"><defs>'+
      '<linearGradient id="stem-'+type+'" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#4f724f"/><stop offset=".48" stop-color="'+spec.leaf+'"/><stop offset="1" stop-color="#456b4b"/></linearGradient>'+
      '<radialGradient id="petal-'+type+'" cx="35%" cy="25%" r="80%"><stop stop-color="'+colors[1]+'"/><stop offset=".65" stop-color="'+colors[0]+'"/><stop offset="1" stop-color="'+colors[2]+'"/></radialGradient>'+
      '</defs>'+stemMarkup+
      '<g transform="translate(50 43)">'+
      '<g fill="url(#petal-'+type+')">'+head+'</g>'+
      '</g></svg>';
  }

  function defaultSlot(index) {
    return FLOWER_SLOTS[index] || {x:22+(index%7)*9,y:48+(index%3)*5};
  }
  const LETTER_FLOWER_SLOTS = [
    {x:20,y:62},{x:27,y:56},{x:35,y:51},{x:43,y:47},{x:50,y:46},
    {x:57,y:47},{x:65,y:51},{x:73,y:56},{x:80,y:62},{x:15,y:57},
    {x:85,y:57},{x:22,y:68},{x:38,y:64},{x:62,y:64},{x:78,y:68}
  ];
  let letterBouquetState = {
    enabled:false,
    /* Balanced default arch: stems tuck behind the envelope, flowers frame its upper corners. */
    flowers:[
      {id:'letter-bloom-1',type:'rose',x:20,y:62,rotation:-8,scale:.84,z:4},
      {id:'letter-bloom-2',type:'peony',x:27,y:56,rotation:5,scale:.94,z:6},
      {id:'letter-bloom-3',type:'ranunculus',x:35,y:51,rotation:-4,scale:.92,z:8},
      {id:'letter-bloom-4',type:'tulip',x:43,y:47,rotation:6,scale:.82,z:9},
      {id:'letter-bloom-5',type:'peony',x:50,y:46,rotation:-3,scale:1.02,z:10},
      {id:'letter-bloom-6',type:'lily',x:57,y:47,rotation:-6,scale:.86,z:9},
      {id:'letter-bloom-7',type:'rose',x:65,y:51,rotation:7,scale:.92,z:8},
      {id:'letter-bloom-8',type:'ranunculus',x:73,y:56,rotation:-5,scale:.9,z:6},
      {id:'letter-bloom-9',type:'gypsophila',x:80,y:62,rotation:5,scale:.78,z:4}
    ],
    greenery:'eucalyptus',
    theme:'rose',
    decorations:['eucalyptus','gypsophila'],
    selectedId:'letter-bloom-5'
  };
  function normalizeBloom(raw,index=0) {
    const slot=defaultSlot(index);
    return {
      id:typeof raw?.id==='string' ? raw.id : 'bloom-'+(index+1),
      type:FLOWERS[raw?.type] ? raw.type : 'rose',
      x:clamp(raw?.x,8,92,slot.x),
      y:clamp(raw?.y,20,86,slot.y),
      rotation:clamp(raw?.rotation,-35,35,0),
      scale:clamp(raw?.scale,.7,1.3,1),
      flip:Boolean(raw?.flip),
      z:clamp(raw?.z,0,100,Math.round(slot.y))
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
    node.style.setProperty('--flower-flip',bloom.flip ? '-1' : '1');
    node.style.zIndex=String(Number.isFinite(Number(bloom.z)) ? Number(bloom.z) : Math.round(bloom.y));
    node.setAttribute('role','button');
    node.setAttribute('tabindex','0');
    node.setAttribute('aria-label',(FLOWERS[bloom.type]?.name||'Цветок')+'. Можно переместить');
    if (FLOWERS[bloom.type]?.sprite !== null && window.BOTANICAL_SPRITE_URL) {
      node.innerHTML='<span class="botanical-sprite-art"></span>';
      applyFlowerSprite(node.querySelector('.botanical-sprite-art'),bloom.type);
    } else {
      node.innerHTML=svgFlower(bloom.type);
    }
    if(!interactive) {
      node.style.cursor='default';
      node.removeAttribute('role');
      node.setAttribute('tabindex','-1');
      node.setAttribute('aria-hidden','true');
      node.style.pointerEvents='none';
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
      willow:['#80a783','#5e8d67','#9cbd9a'],
      ruscus:['#739466','#557b50','#9bb487'],
      gypsophila:['#879d7f','#aec3a3','#e5d9c9'],
      salal:['#63845c','#4e7247','#8da67a']
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
    const isBouquet = mode === 'bouquet';
    const isAttached = mode === 'attached';
    $('letterPreviewPaper').hidden = isBouquet;
    $('bouquetPreviewPanel').hidden = !isBouquet;
    $('letterForm').hidden = isBouquet;
    $('letterFootnote').hidden = isBouquet;
    $('bouquetBuilderFields').hidden = !isBouquet;
    if ($('editorIntro')) $('editorIntro').hidden = isAttached;
    if ($('letterCoreFields')) $('letterCoreFields').hidden = isAttached;
    if ($('nonBouquetVisualSettings')) $('nonBouquetVisualSettings').hidden = false;
    const settings = $('letterVisualSettings');
    if (settings) {
      settings.open = isAttached || settings.open;
      const summary = settings.querySelector('summary');
      if (summary) summary.hidden = isAttached;
    }
    if (isAttached) {
      $('enableLetterBouquet').checked = true;
      renderLetterBouquetEditor();
    }
    document.querySelectorAll('[data-builder-mode]').forEach(button => {
      const active = button.dataset.builderMode === mode;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    $('editorEyebrow').textContent = isBouquet ? 'A DIGITAL BOUQUET' : 'A NOTE TO SOMEONE';
    $('editorHeading').textContent = isBouquet ? 'Создай свой букет' : 'Скажи это по-особенному.';
    $('editorLead').textContent = isBouquet
      ? 'Выбери цветы, расставь их как тебе нравится, добавь открытку и отправь короткую ссылку.'
      : 'Напиши личное письмо, посмотри, как оно открывается, и создай ссылку для одного человека.';
    if (isBouquet) { renderStep(); renderPreview(); }
  }

  function renderLetterBouquetEditor() {
    const checkbox=$('enableLetterBouquet');
    const editor=$('letterBouquetEditor');
    const enabled=Boolean(checkbox?.checked);
    letterBouquetState.enabled=enabled;
    if(editor)editor.hidden=!enabled;
    const previewLayer=$('letterPreviewBouquetLayer');
    if(previewLayer)previewLayer.hidden=!enabled;
    if(!enabled) {
      renderLetterPreviewBouquet();
      return;
    }
    const stage=$('letterBouquetEditorStage');
    setTheme(stage,letterBouquetState.theme);
    renderGreenery('letterBouquetEditorGreenery',letterBouquetState.greenery);
    renderFlowers('letterBouquetEditorFlowers',letterBouquetState.flowers,letterBouquetState.selectedId,true);
    $('letterBouquetGreenery').value=letterBouquetState.greenery;
    $('letterBouquetTheme').value=letterBouquetState.theme;
    document.querySelectorAll('[data-letter-bouquet-palette]').forEach(button=>{
      button.classList.toggle('is-selected',button.dataset.letterBouquetPalette===letterBouquetState.theme);
    });
    document.querySelectorAll('[data-letter-decor]').forEach(button=>{
      button.classList.toggle('is-selected',letterBouquetState.decorations.includes(button.dataset.letterDecor));
    });
    const selectedBloom=letterBouquetState.flowers.find(b=>b.id===letterBouquetState.selectedId);
    document.querySelectorAll('[data-add-letter-flower]').forEach(button=>{
      button.classList.toggle('is-selected',Boolean(selectedBloom)&&button.dataset.addLetterFlower===selectedBloom.type);
    });
    const n=letterBouquetState.flowers.length;
    $('letterBouquetStatus').textContent='Добавлено '+n+' из 15 цветов. Перетаскивай цветы мышью или пальцем.';
    updateLetterBouquetSelectedControls();
    renderLetterPreviewBouquet();
  }

  function updateLetterBouquetSelectedControls() {
    const selected=letterBouquetState.flowers.find(b=>b.id===letterBouquetState.selectedId);
    const controls=$('letterBouquetSelectedControls');
    if(!controls)return;
    controls.hidden=!selected;
    if(!selected)return;
    const name=FLOWERS[selected.type]?.name||'Цветок';
    $('letterBouquetSelectedName').textContent=name;
    $('letterBouquetSelectedType').textContent=selected.type==='ranunculus'?'Нежно-розовый':selected.type==='peony'?'Пастельно-розовый':'Ботанический оттенок';
    $('letterBouquetFlowerScale').value=String(Math.round(selected.scale*100));
    $('letterBouquetScaleOut').textContent=Math.round(selected.scale*100)+'%';
    $('letterBouquetFlowerRotation').value=String(selected.rotation);
    $('letterBouquetRotationOut').textContent=selected.rotation+'°';
    const thumb=$('letterBouquetSelectedThumb');
    if(thumb) {
      thumb.replaceChildren();
      const art=document.createElement('span');
      art.className='bouquet-mini-botanical';
      art.innerHTML=svgFlower(selected.type);
      thumb.append(art);
    }
  }

  function mapFlowersToEnvelope(flowers, layerId, envelopeId) {
    const layer=$(layerId), envelope=$(envelopeId);
    if(!layer||!envelope)return flowers.map(b=>({...b}));
    const lr=layer.getBoundingClientRect(), er=envelope.getBoundingClientRect();
    if(!lr.width||!lr.height||!er.width||!er.height)return flowers.map(b=>({...b}));
    const cx=er.left+er.width/2-lr.left;
    const cy=er.top+er.height/2-lr.top;
    return flowers.map(b=>{
      /* Editor coordinates are compressed into an envelope-sized scene so the bouquet
         stays balanced on wide desktops, portrait phones and tablets alike. */
      const isRecipient = layerId === 'letterBouquetLayer';
      const nodeWidth = isRecipient
        ? Math.max(52,Math.min(100,window.innerWidth*.11))
        : Math.max(78,Math.min(132,lr.width*.17));
      const nodeHeight=nodeWidth*1.8;
      const x=cx+((b.x-50)/50)*er.width*.72;
      const y=er.top+nodeHeight*.26-8+((b.y-54)/18)*nodeHeight*.12;
      return {...b,x:Math.max(2,Math.min(98,x/lr.width*100)),y:Math.max(2,Math.min(98,y/lr.height*100))};
    });
  }

  function renderGreeneryAroundEnvelope(layerId, kind, envelopeId) {
    const layer=$(layerId), envelope=$(envelopeId);
    renderGreenery(layerId,kind);
    if(!layer||!envelope)return;
    const lr=layer.getBoundingClientRect(), er=envelope.getBoundingClientRect();
    if(!lr.width||!lr.height||!er.width||!er.height)return;
    const cx=er.left+er.width/2-lr.left, top=er.top-lr.top;
    layer.querySelectorAll('.bouquet-leaf').forEach((leaf,index)=>{
      const p=GREENERY_LEAVES[index%GREENERY_LEAVES.length];
      const x=cx+((p[0]-50)/40)*er.width*.52;
      const y=top-er.height*.18+((p[1]-24)/50)*er.height*.72;
      leaf.style.left=Math.max(1,Math.min(99,x/lr.width*100))+'%';
      leaf.style.top=Math.max(1,Math.min(99,y/lr.height*100))+'%';
    });
  }

  function renderAttachedDecor(layerId, decorations, envelopeId) {
    const layer=$(layerId), envelope=$(envelopeId);
    if(!layer)return;
    layer.replaceChildren();
    if(!envelope)return;
    const lr=layer.getBoundingClientRect(),er=envelope.getBoundingClientRect();
    if(!lr.width||!lr.height||!er.width||!er.height)return;
    const cx=er.left+er.width/2-lr.left, top=er.top-lr.top;
    const decorPositions={
      petals:[[-.58,.10],[.58,.15],[-.54,.72],[.55,.80]],
      ribbon:[[.58,-.06]],
      postcard:[[-.60,.28],[.60,.31]],
      eucalyptus:[[-.57,.28],[.57,.30]],
      ruscus:[[-.59,.42],[.59,.44]],
      gypsophila:[[-.56,.20],[.56,.22]],
      olive:[[-.59,.66],[.59,.65]],
      salal:[[-.56,.52],[.56,.55]]
    };
    const used={};
    (Array.isArray(decorations)?decorations:[]).filter(k=>decorPositions[k]).forEach(kind=>{
      const number=used[kind]||0;used[kind]=number+1;
      const pos=decorPositions[kind][Math.min(number,decorPositions[kind].length-1)];
      const item=document.createElement('span');
      item.className='letter-preview-decor decor-'+kind;
      item.style.left=(cx+pos[0]*er.width)/lr.width*100+'%';
      item.style.top=(top+pos[1]*er.height)/lr.height*100+'%';
      layer.append(item);
    });
  }

  function renderLetterPreviewBouquet() {
    const layer=$('letterPreviewBouquetLayer');
    if(!layer)return;
    const enabled=Boolean($('enableLetterBouquet')?.checked);
    layer.hidden=!enabled;
    if(!enabled)return;
    setTheme(layer,letterBouquetState.theme);
    renderGreeneryAroundEnvelope('letterPreviewBouquetGreenery',letterBouquetState.greenery,'envelope');
    const previewFlowers=mapFlowersToEnvelope(letterBouquetState.flowers,'letterPreviewBouquetLayer','envelope');
    renderFlowers('letterPreviewBouquetFlowers',previewFlowers,null,false);
    renderAttachedDecor('letterPreviewBouquetDecor',letterBouquetState.decorations,'envelope');
  }

  function setAttachedFlowerSelected(id) {
    letterBouquetState.selectedId=id;
    $('letterBouquetEditorFlowers')?.querySelectorAll('.bouquet-flower-node').forEach(node=>{
      node.classList.toggle('is-selected',node.dataset.flowerId===id);
    });
    updateLetterBouquetSelectedControls();
  }

    function getAttachedBouquetData() {
    if(!$('enableLetterBouquet')?.checked)return null;
    return {
      flowers:letterBouquetState.flowers.slice(0,15).map((b,i)=>normalizeBloom(b,i)),
      greenery:letterBouquetState.greenery,
      theme:letterBouquetState.theme,
      decorations:letterBouquetState.decorations.slice(0,8),
      cardStyle:'cream'
    };
  }

  function addLetterFlower(type) {
    if(!FLOWERS[type])return;
    $('enableLetterBouquet').checked=true;
    letterBouquetState.enabled=true;
    if(letterBouquetState.flowers.length>=15) {
      $('letterBouquetStatus').textContent='Максимум 15 цветов в букете.';
      renderLetterBouquetEditor();
      return;
    }
    const index=letterBouquetState.flowers.length;
    const slot=LETTER_FLOWER_SLOTS[index]||{x:18+(index%7)*10,y:70+Math.floor(index/7)*5};
    const bloom={id:'letter-bloom-'+Date.now().toString(36)+'-'+index,type,x:slot.x,y:slot.y,rotation:index%2?5:-5,scale:index>9?.72:.86};
    letterBouquetState.flowers.push(bloom);
    letterBouquetState.selectedId=bloom.id;
    renderLetterBouquetEditor();
  }

  function setupLetterBouquetEditorDrag() {
    const stage=$('letterBouquetEditorStage');
    if(!stage||stage.dataset.dragReady==='1')return;
    stage.dataset.dragReady='1';
    stage.addEventListener('pointerdown',event=>{
      const node=event.target.closest('.bouquet-flower-node');
      if(!node)return;
      const bloom=letterBouquetState.flowers.find(x=>x.id===node.dataset.flowerId);
      if(!bloom)return;
      event.preventDefault();
      node.setPointerCapture?.(event.pointerId);
      setAttachedFlowerSelected(bloom.id);
      letterBouquetDrag={pointerId:event.pointerId,id:bloom.id,startX:event.clientX,startY:event.clientY,originX:bloom.x,originY:bloom.y,moved:false};
    });
    stage.addEventListener('pointermove',event=>{
      const current=letterBouquetDrag;
      if(!current||current.pointerId!==event.pointerId)return;
      const rect=stage.getBoundingClientRect();
      const dx=event.clientX-current.startX,dy=event.clientY-current.startY;
      if(Math.hypot(dx,dy)>2)current.moved=true;
      const bloom=letterBouquetState.flowers.find(x=>x.id===current.id);
      if(!bloom)return;
      bloom.x=clamp(current.originX+dx/rect.width*100,8,92,bloom.x);
      bloom.y=clamp(current.originY+dy/rect.height*100,20,86,bloom.y);
      const node=stage.querySelector('[data-flower-id="'+current.id+'"]');
      if(node){node.style.left=bloom.x+'%';node.style.top=bloom.y+'%';}
      const previewNode=$('letterPreviewBouquetFlowers')?.querySelector('[data-flower-id="'+current.id+'"]');
      if(previewNode) {
        const mapped=mapFlowersToEnvelope([bloom],'letterPreviewBouquetLayer','envelope')[0];
        previewNode.style.left=mapped.x+'%';previewNode.style.top=mapped.y+'%';
      }
    });
    const end=event=>{
      if(!letterBouquetDrag||(event&&letterBouquetDrag.pointerId!==event.pointerId))return;
      letterBouquetDrag=null;
      renderLetterBouquetEditor();
    };
    stage.addEventListener('pointerup',end);
    stage.addEventListener('pointercancel',end);
  }

  function renderAttachedDecor(layerId, decorations) {
    const layer=$(layerId);
    if(!layer)return;
    layer.replaceChildren();
    (Array.isArray(decorations)?decorations:[]).filter(kind=>['eucalyptus','ruscus','gypsophila','olive','salal','petals','ribbon','postcard'].includes(kind)).forEach((kind,index)=>{
      const item=document.createElement('span');
      item.className='letter-preview-decor decor-'+kind;
      item.style.left=([10,85,18,82][index%4])+'%';
      item.style.top=([74,78,88,90][index%4])+'%';
      layer.append(item);
    });
  }

  function renderLetterBouquet(data) {
    const layer=$('letterBouquetLayer');
    if(!layer)return;
    const bouquet=data&&Array.isArray(data.flowers)&&data.flowers.length?data:null;
    layer.hidden=!bouquet;
    recipientView?.classList.toggle('has-letter-bouquet',Boolean(bouquet));
    if(!bouquet)return;
    attachedRecipientId=recipientId || new URLSearchParams(window.location.search).get('l') || '';
    const savedPalette=THEMES[bouquet.theme]?bouquet.theme:'rose';
    /* Never restore recipient-side drag positions: the author controls composition,
       while the recipient may move only the personal photographs. */
    attachedRecipientFlowers=mapFlowersToEnvelope(
      bouquet.flowers.slice(0,15).map((b,i)=>normalizeBloom(b,i)),
      'letterBouquetLayer','recipientEnvelope'
    );
    setTheme(layer,savedPalette);
    renderGreeneryAroundEnvelope('letterBouquetLiveGreenery',
      ['eucalyptus','fern','olive','willow','ruscus','gypsophila','salal'].includes(bouquet.greenery)?bouquet.greenery:'eucalyptus',
      'recipientEnvelope');
    renderFlowers('letterBouquetLiveFlowers',attachedRecipientFlowers,null,false);
    renderAttachedDecor('letterBouquetLiveDecor',Array.isArray(bouquet.decorations)?bouquet.decorations:[],'recipientEnvelope');
  }

  function setupAttachedRecipientDrag() {
    const stage=$('letterBouquetLayer');
    if(!stage||stage.dataset.dragReady==='1')return;
    stage.dataset.dragReady='1';
    stage.addEventListener('pointerdown',event=>{
      const node=event.target.closest('.bouquet-flower-node');
      if(!node)return;
      const bloom=attachedRecipientFlowers.find(x=>x.id===node.dataset.flowerId);
      if(!bloom)return;
      event.preventDefault();
      node.setPointerCapture?.(event.pointerId);
      attachedRecipientDrag={pointerId:event.pointerId,id:bloom.id,startX:event.clientX,startY:event.clientY,originX:bloom.x,originY:bloom.y,moved:false};
    });
    stage.addEventListener('pointermove',event=>{
      const current=attachedRecipientDrag;
      if(!current||current.pointerId!==event.pointerId)return;
      const rect=stage.getBoundingClientRect();
      const dx=event.clientX-current.startX,dy=event.clientY-current.startY;
      if(Math.hypot(dx,dy)>2)current.moved=true;
      const bloom=attachedRecipientFlowers.find(x=>x.id===current.id);
      if(!bloom)return;
      bloom.x=clamp(current.originX+dx/rect.width*100,8,92,bloom.x);
      bloom.y=clamp(current.originY+dy/rect.height*100,20,86,bloom.y);
      const node=stage.querySelector('[data-flower-id="'+current.id+'"]');
      if(node){node.style.left=bloom.x+'%';node.style.top=bloom.y+'%';}
    });
    const end=event=>{
      if(!attachedRecipientDrag||(event&&attachedRecipientDrag.pointerId!==event.pointerId))return;
      const moved=attachedRecipientDrag.moved;
      attachedRecipientDrag=null;
      if(moved&&attachedRecipientId) {
        try {
          localStorage.setItem('letter-bouquet-layout:'+attachedRecipientId,
            JSON.stringify(attachedRecipientFlowers.map(b=>({x:b.x,y:b.y}))));
        } catch(_){}
      }
    };
    stage.addEventListener('pointerup',end);
    stage.addEventListener('pointercancel',end);
    stage.addEventListener('keydown',event=>{
      const node=event.target.closest('.bouquet-flower-node');
      if(!node||!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key))return;
      const bloom=attachedRecipientFlowers.find(x=>x.id===node.dataset.flowerId);
      if(!bloom)return;
      event.preventDefault();
      if(event.key==='ArrowLeft')bloom.x=clamp(bloom.x-2,8,92,bloom.x);
      if(event.key==='ArrowRight')bloom.x=clamp(bloom.x+2,8,92,bloom.x);
      if(event.key==='ArrowUp')bloom.y=clamp(bloom.y-2,20,86,bloom.y);
      if(event.key==='ArrowDown')bloom.y=clamp(bloom.y+2,20,86,bloom.y);
      node.style.left=bloom.x+'%';node.style.top=bloom.y+'%';
    });
  }

  $('enableLetterBouquet')?.addEventListener('change',renderLetterBouquetEditor);
  document.querySelectorAll('[data-letter-bouquet-palette]').forEach(button=>button.addEventListener('click',()=>{
    letterBouquetState.theme=button.dataset.letterBouquetPalette;
    $('letterBouquetTheme').value=letterBouquetState.theme;
    renderLetterBouquetEditor();
  }));
  document.querySelectorAll('[data-letter-decor]').forEach(button=>button.addEventListener('click',()=>{
    const kind=button.dataset.letterDecor;
    if(['eucalyptus','ruscus','gypsophila','olive','salal'].includes(kind)) {
      letterBouquetState.greenery=kind;
      $('letterBouquetGreenery').value=kind;
    }
    if(['petals','ribbon','postcard'].includes(kind)) {
      const current=letterBouquetState.decorations.includes(kind);
      letterBouquetState.decorations=letterBouquetState.decorations.filter(x=>x!==kind);
      if(!current)letterBouquetState.decorations.push(kind);
    } else {
      letterBouquetState.decorations=letterBouquetState.decorations.filter(x=>!['eucalyptus','ruscus','gypsophila','olive','salal'].includes(x));
      letterBouquetState.decorations.push(kind);
    }
    renderLetterBouquetEditor();
  }));
  document.querySelectorAll('[data-add-letter-flower]').forEach(button=>button.addEventListener('click',()=>addLetterFlower(button.dataset.addLetterFlower)));
  $('letterBouquetGreenery')?.addEventListener('change',event=>{letterBouquetState.greenery=event.target.value;renderLetterBouquetEditor();});
  $('letterBouquetTheme')?.addEventListener('change',event=>{letterBouquetState.theme=event.target.value;renderLetterBouquetEditor();});
  function syncAttachedFlowerNode(bloom) {
    if(!bloom)return;
    const stageNode=$('letterBouquetEditorFlowers')?.querySelector('[data-flower-id="'+bloom.id+'"]');
    if(stageNode) {
      stageNode.style.setProperty('--flower-scale',String(bloom.scale));
      stageNode.style.setProperty('--flower-rotation',bloom.rotation+'deg');
      stageNode.style.setProperty('--flower-flip',bloom.flip?-1:1);
      stageNode.style.zIndex=String(Number.isFinite(Number(bloom.z))?Number(bloom.z):bloom.y);
    }
    const previewNode=$('letterPreviewBouquetFlowers')?.querySelector('[data-flower-id="'+bloom.id+'"]');
    if(previewNode) {
      const mapped=mapFlowersToEnvelope([bloom],'letterPreviewBouquetLayer','envelope')[0];
      previewNode.style.left=mapped.x+'%';previewNode.style.top=mapped.y+'%';
      previewNode.style.setProperty('--flower-scale',String(bloom.scale));
      previewNode.style.setProperty('--flower-rotation',bloom.rotation+'deg');
      previewNode.style.setProperty('--flower-flip',bloom.flip?-1:1);
      previewNode.style.zIndex=String(Number.isFinite(Number(bloom.z))?Number(bloom.z):bloom.y);
    }
  }

  $('letterBouquetFlowerScale')?.addEventListener('input',event=>{
    const bloom=letterBouquetState.flowers.find(b=>b.id===letterBouquetState.selectedId);if(!bloom)return;
    bloom.scale=Number(event.target.value)/100;
    $('letterBouquetScaleOut').textContent=event.target.value+'%';
    syncAttachedFlowerNode(bloom);
  });
  $('letterBouquetFlowerRotation')?.addEventListener('input',event=>{
    const bloom=letterBouquetState.flowers.find(b=>b.id===letterBouquetState.selectedId);if(!bloom)return;
    bloom.rotation=Number(event.target.value);
    $('letterBouquetRotationOut').textContent=event.target.value+'°';
    syncAttachedFlowerNode(bloom);
  });
  $('letterBouquetFlip')?.addEventListener('click',()=>{
    const bloom=letterBouquetState.flowers.find(b=>b.id===letterBouquetState.selectedId);if(!bloom)return;
    bloom.flip=!bloom.flip;syncAttachedFlowerNode(bloom);
  });
  $('letterBouquetLayerUp')?.addEventListener('click',()=>{
    const bloom=letterBouquetState.flowers.find(b=>b.id===letterBouquetState.selectedId);if(!bloom)return;
    bloom.z=Math.min(100,Number(bloom.z??bloom.y)+5);syncAttachedFlowerNode(bloom);
  });
  $('letterBouquetLayerDown')?.addEventListener('click',()=>{
    const bloom=letterBouquetState.flowers.find(b=>b.id===letterBouquetState.selectedId);if(!bloom)return;
    bloom.z=Math.max(0,Number(bloom.z??bloom.y)-5);syncAttachedFlowerNode(bloom);
  });
  $('removeLetterBouquetFlower')?.addEventListener('click',()=>{
    const id=letterBouquetState.selectedId;
    if(!id)return;
    letterBouquetState.flowers=letterBouquetState.flowers.filter(b=>b.id!==id);
    letterBouquetState.selectedId=letterBouquetState.flowers.at(-1)?.id||null;
    renderLetterBouquetEditor();
  });
  setupLetterBouquetEditorDrag();
  renderLetterBouquetEditor();
  window.getAttachedBouquetData=getAttachedBouquetData;
  window.renderLetterBouquet=renderLetterBouquet;
  if(window.letterData?.bouquet)renderLetterBouquet(window.letterData.bouquet);
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
      node.setPointerCapture?.(event.pointerId);
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
  document.querySelectorAll('[data-flower-art],[data-letter-flower-art]').forEach(el=>{
    const type=el.dataset.flowerArt || el.dataset.letterFlowerArt;
    el.replaceChildren();
    const art=document.createElement('span');
    art.className='bouquet-mini-botanical';
    art.innerHTML=svgFlower(type);
    el.append(art);
  });
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
  if(window.pendingBouquetData?.kind==='bouquet')renderRecipient(window.pendingBouquetData);
  if(window.letterData?.kind!=='bouquet' && window.letterData?.bouquet)renderLetterBouquet(window.letterData.bouquet);
  let bouquetResizeFrame=0;
  window.addEventListener('resize',()=>{
    if(bouquetResizeFrame)cancelAnimationFrame(bouquetResizeFrame);
    bouquetResizeFrame=requestAnimationFrame(()=>{
      bouquetResizeFrame=0;
      renderLetterPreviewBouquet();
      if(window.letterData?.kind!=='bouquet' && window.letterData?.bouquet && !$('recipientView')?.hidden) {
        renderLetterBouquet(window.letterData.bouquet);
      }
    });
  },{passive:true});
})();