const $ = (id) => document.getElementById(id);
const STORAGE = { chats: "nexa_chat_history" };
let chats = JSON.parse(localStorage.getItem(STORAGE.chats) || "[]");
let activeChatId = null;
let busy = false;

function persistChats(){ localStorage.setItem(STORAGE.chats, JSON.stringify(chats)); }
function currentChat(){
  let chat = chats.find(c => c.id === activeChatId);
  if(!chat){ chat = {id: crypto.randomUUID(), title:"Percakapan Baru", messages:[]}; chats.unshift(chat); activeChatId=chat.id; }
  return chat;
}
function escapeHtml(s){ return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function formatText(text){
  // Small safe formatter: escapes HTML before applying basic Markdown-like formatting.
  let s=escapeHtml(text);
  s=s.replace(/```([\s\S]*?)```/g,(_,c)=>`<pre><code>${c.trim()}</code></pre>`);
  s=s.replace(/`([^`]+)`/g,"<code>$1</code>");
  s=s.replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>");
  s=s.replace(/\*([^*]+)\*/g,"<em>$1</em>");
  s=s.replace(/^\s*[-*]\s+(.+)$/gm,"• $1");
  return s.split(/\n{2,}/).map(p=>p.startsWith("<pre>")?p:`<p>${p.replace(/\n/g,"<br>")}</p>`).join("");
}
function renderMessages(){
  const chat = chats.find(c=>c.id===activeChatId);
  $("welcome").style.display = chat && chat.messages.length ? "none" : "block";
  $("messages").innerHTML = chat ? chat.messages.map(m=>`
    <article class="message ${m.role==='user'?'user':'assistant'}">
      <div class="message-avatar">${m.role==='user'?'U':'✦'}</div>
      <div class="message-content">${m.role==='user'?escapeHtml(m.content).replace(/\n/g,"<br>"):formatText(m.content)}</div>
    </article>`).join("") : "";
  $("conversation").scrollTop = $("conversation").scrollHeight;
}
function newChat(){ activeChatId=null; $("messages").innerHTML=""; $("welcome").style.display="block"; $("promptInput").focus(); }
async function sendMessage(prefill){
  if(busy) return;
  const input=$("promptInput"), content=(prefill ?? input.value).trim();
  if(!content) return;
  const chat=currentChat();
  if(!chat.messages.length) chat.title=content.length>32?content.slice(0,32)+"…":content;
  chat.messages.push({role:"user",content}); input.value=""; input.style.height="auto";
  busy=true; $("sendBtn").disabled=true; renderMessages();
  const typing=document.createElement("div"); typing.className="typing"; typing.id="typing"; typing.textContent="AI sedang berpikir…"; $("messages").appendChild(typing);
  $("conversation").scrollTop=$("conversation").scrollHeight;
  try{
    const response=await fetch("/api/chat",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({messages:chat.messages.map(m=>({role:m.role,content:m.content}))})
    });
    const data=await response.json().catch(()=>({}));
    if(!response.ok) throw new Error(data.error?.message || `HTTP ${response.status}: permintaan API gagal.`);
    const answer=data.choices?.[0]?.message?.content;
    if(!answer) throw new Error("API tidak mengembalikan jawaban. Periksa model dan konfigurasi API.");
    chat.messages.push({role:"assistant",content:typeof answer==="string"?answer:JSON.stringify(answer)});
  }catch(err){
    chat.messages.push({role:"assistant",content:`Terjadi kesalahan: ${err.message}\n\nPeriksa koneksi internet, konfigurasi server, dan saldo/limit provider.`});
  }finally{
    busy=false; $("sendBtn").disabled=false; persistChats(); renderMessages(); $("promptInput").focus();
  }
}
$("newChat").addEventListener("click",newChat);
$("sendBtn").addEventListener("click",()=>sendMessage());
$("promptInput").addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();}});
$("promptInput").addEventListener("input",e=>{e.target.style.height="auto";e.target.style.height=Math.min(e.target.scrollHeight,160)+"px";});
document.querySelectorAll(".suggestion").forEach(b=>b.addEventListener("click",()=>sendMessage(b.dataset.prompt)));
