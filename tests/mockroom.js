// a stand-in for the claude.ai room capability: presence coalesced at ~30 Hz with lag, frozen peers, named rooms via join()
window.__mockOpts=window.__mockOpts||{lag:90,jitter:60,joinFails:false};
window.claude={use:async name=>{if(name!=='room')return null;await new Promise(r=>setTimeout(r,300));
  const me=Math.random().toString(36).slice(2,10);const mk=(rname)=>{const ch=new BroadcastChannel('mock-'+rname);const peers=new Map();let mine={},dirty=false;
    ch.onmessage=e=>{const m=e.data;if(m.peer===me)return;const O=window.__mockOpts;setTimeout(()=>{if(m.left)peers.delete(m.peer);else{const prev=peers.get(m.peer);peers.set(m.peer,Object.freeze({peer:m.peer,by:null,isMe:false,sameTab:false,kind:'viewer',guest:false,presence:Object.freeze(m.presence),updatedAt:Date.now()}));}},O.lag+Math.random()*O.jitter);};
    setInterval(()=>{if(dirty){dirty=false;ch.postMessage({peer:me,presence:mine});}},33);setInterval(()=>ch.postMessage({peer:me,presence:mine}),1000);
    const self=()=>Object.freeze({peer:me,by:null,isMe:true,sameTab:true,kind:'viewer',guest:false,presence:Object.freeze(mine),updatedAt:Date.now()});
    return{name:rname,presence:async patch=>{mine={...mine};for(const k in patch){if(patch[k]===null)delete mine[k];else mine[k]=JSON.parse(JSON.stringify(patch[k]));}if(JSON.stringify(mine).length>4096)throw{code:'invalid_argument'};dirty=true;},
      peers:()=>[self(),...peers.values()],connected:()=>true,leave:async()=>{ch.postMessage({peer:me,left:1});ch.close();},emit:async()=>{},on:()=>()=>{},onPeers:()=>()=>{}};};
  const lobby=mk('lobby');let big=0;
  return{...lobby,join:async n=>{if(window.__mockOpts.joinFails)throw{code:'not_permitted'};return mk(n);}};}};
