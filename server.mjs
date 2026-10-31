import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || '127.0.0.1';
const dataFile = path.join(root, 'content', 'site.json');
const uploadDir = path.join(root, 'public', 'uploads');
const sessionSecret = process.env.SESSION_SECRET || '';
const studioPassword = process.env.STUDIO_PASSWORD || '';
const sessions = new Map();
const mime = { '.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.avif':'image/avif','.mp4':'video/mp4','.webm':'video/webm','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf','.ico':'image/x-icon','.xml':'application/xml; charset=utf-8','.txt':'text/plain; charset=utf-8' };
const safeEqual = (a,b) => { const x=Buffer.from(a), y=Buffer.from(b); return x.length===y.length && crypto.timingSafeEqual(x,y); };
const readData = () => JSON.parse(fs.readFileSync(dataFile,'utf8'));
const send = (res,status,body,type='application/json; charset=utf-8',headers={}) => { res.writeHead(status,{ 'Content-Type':type,'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Cache-Control':'no-store',...headers }); res.end(body); };
const json = (res,status,obj,headers={}) => send(res,status,JSON.stringify(obj), 'application/json; charset=utf-8',headers);
const readBody = (req,limit=1_500_000) => new Promise((resolve,reject)=>{ let size=0, chunks=[]; req.on('data',c=>{ size+=c.length; if(size>limit){ reject(new Error('Request too large')); req.destroy(); } else chunks.push(c); }); req.on('end',()=>resolve(Buffer.concat(chunks))); req.on('error',reject); });
const sessionId = req => { const token=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('aj_session='))?.slice(11); if(!token||!sessionSecret)return null; const [id,sig]=token.split('.'); const expected=crypto.createHmac('sha256',sessionSecret).update(id||'').digest('hex'); return id&&sig&&safeEqual(sig,expected)&&sessions.has(id)?id:null; };
const authed = req => Boolean(sessionId(req));
const saveData = data => fs.writeFileSync(dataFile, JSON.stringify(data,null,2)+'\n','utf8');
const handle = async (req,res) => {
  const url=new URL(req.url,'http://localhost'); const route=decodeURIComponent(url.pathname);
  if(req.method==='GET' && route==='/api/content') { const data=readData(); data.articles=data.articles.filter(a=>a.status==='Published'); return json(res,200,data); }
  if(route.startsWith('/api/studio')) {
    if(route==='/api/studio/login' && req.method==='POST') {
      if(!studioPassword||!sessionSecret) return json(res,503,{error:'Studio is locked. Set STUDIO_PASSWORD and SESSION_SECRET, then restart the server.'});
      let body; try { body=JSON.parse((await readBody(req,10000)).toString()); } catch { return json(res,400,{error:'Invalid request.'}); }
      if(!safeEqual(String(body.password||''),studioPassword)) return json(res,401,{error:'That password did not match.'});
      const id=crypto.randomBytes(24).toString('hex'); sessions.set(id,Date.now());
      const sig=crypto.createHmac('sha256',sessionSecret).update(id).digest('hex');
      return json(res,200,{ok:true},{'Set-Cookie':`aj_session=${id}.${sig}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${process.env.COOKIE_SECURE==='1'?'; Secure':''}`});
    }
    if(route==='/api/studio/logout' && req.method==='POST') { const id=sessionId(req); if(id)sessions.delete(id); return json(res,200,{ok:true},{'Set-Cookie':'aj_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'}); }
    if(route==='/api/studio/session' && req.method==='GET') return json(res,200,{authenticated:authed(req),configured:Boolean(studioPassword&&sessionSecret)});
    if(!authed(req)) return json(res,401,{error:'Sign in to manage site content.'});
    if(route==='/api/studio/content' && req.method==='PUT') {
      let data; try { data=JSON.parse((await readBody(req)).toString()); } catch { return json(res,400,{error:'Invalid content JSON.'}); }
      if(!data || typeof data!=='object' || !data.identity || !Array.isArray(data.projects) || !Array.isArray(data.articles) || !data.pages) return json(res,422,{error:'Content is missing required sections.'});
      saveData(data); return json(res,200,{ok:true,savedAt:new Date().toISOString()});
    }
    if(route==='/api/studio/content' && req.method==='GET') return json(res,200,readData());
    if(route==='/api/studio/media' && req.method==='GET') {
      fs.mkdirSync(uploadDir,{recursive:true}); const files=fs.readdirSync(uploadDir,{withFileTypes:true}).filter(x=>x.isFile()).map(x=>({name:x.name,url:'/uploads/'+encodeURIComponent(x.name),size:fs.statSync(path.join(uploadDir,x.name)).size})); return json(res,200,files);
    }
    if(route==='/api/studio/upload' && req.method==='POST') {
      const type=String(req.headers['content-type']||''); if(!type.startsWith('multipart/form-data;')) return json(res,415,{error:'Use multipart form upload.'});
      const raw=await readBody(req,35_000_000); const boundary=type.split('boundary=')[1]?.replaceAll('"',''); if(!boundary) return json(res,400,{error:'Missing upload boundary.'});
      const parts=raw.toString('latin1').split('--'+boundary); const part=parts.find(p=>p.includes('name="file"')&&p.includes('\r\n\r\n')); if(!part)return json(res,400,{error:'Choose a file first.'});
      const headerEnd=part.indexOf('\r\n\r\n'); const headers=part.slice(0,headerEnd); const original=headers.match(/filename="([^"]*)"/)?.[1]||'upload'; const mimeType=headers.match(/Content-Type:\s*([^\r\n]+)/i)?.[1]?.trim()||'application/octet-stream';
      if(!/^(image\/(jpeg|png|webp|avif|gif)|video\/(mp4|webm))$/.test(mimeType)) return json(res,415,{error:'Allowed files: JPG, PNG, WebP, AVIF, GIF, MP4 and WebM.'});
      const ext=path.extname(original).toLowerCase().replace(/[^.a-z0-9]/g,'').slice(0,8)||'.bin'; const name=crypto.randomUUID()+ext; const start=headerEnd+4; let end=part.lastIndexOf('\r\n'); if(end<start)end=part.length;
      const bytes=Buffer.from(part.slice(start,end),'latin1'); if(!bytes.length)return json(res,400,{error:'The uploaded file is empty.'});
      fs.mkdirSync(uploadDir,{recursive:true}); fs.writeFileSync(path.join(uploadDir,name),bytes,{flag:'wx'}); return json(res,201,{url:'/uploads/'+name,name:original,type:mimeType,size:bytes.length});
    }
    return json(res,404,{error:'Studio endpoint not found.'});
  }
  if(req.method!=='GET' && req.method!=='HEAD') return send(res,405,'Method not allowed','text/plain; charset=utf-8');
  let file;
  if(route==='/'||route==='/studio'||route==='/studio/') file=path.join(root,'public','index.html');
  else if(route==='/sitemap.xml') {
    const data=readData(); const base=process.env.SITE_URL||'https://ajaysinh.com'; const urls=['/','/work','/thinking','/about','/experience','/experiments','/now','/uses','/contact','/search','/privacy',...data.projects.map(p=>'/work/'+p.slug),...data.articles.filter(a=>a.status==='Published').map(a=>'/thinking/'+a.slug)];
    return send(res,200,'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+urls.map(p=>'<url><loc>'+base+p+'</loc></url>').join('')+'</urlset>','application/xml; charset=utf-8');
  } else if(route==='/robots.txt') return send(res,200,'User-agent: *\nAllow: /\nDisallow: /studio\nSitemap: '+(process.env.SITE_URL||'https://ajaysinh.com')+'/sitemap.xml\n','text/plain; charset=utf-8');
  else if(route==='/rss.xml') { const data=readData(); const base=process.env.SITE_URL||'https://ajaysinh.com'; const entries=data.articles.filter(a=>a.status==='Published').map(a=>`<item><title>${xml(a.title)}</title><link>${base}/thinking/${xml(a.slug)}</link><description>${xml(a.summary)}</description></item>`).join(''); return send(res,200,`<?xml version="1.0"?><rss version="2.0"><channel><title>${xml(data.identity.name)} — Thinking</title><link>${base}/thinking</link><description>Notes on design, systems and technology.</description>${entries}</channel></rss>`,'application/xml; charset=utf-8'); }
  else { const clean=path.posix.normalize(route).replace(/^\/+/, ''); file=path.resolve(root,'public',clean); if(!file.startsWith(path.resolve(root,'public')+path.sep)) return send(res,403,'Forbidden','text/plain; charset=utf-8'); }
  if(!file) file=path.join(root,'public','index.html');
  try { const stat=fs.statSync(file); if(!stat.isFile()) throw new Error(); const type=mime[path.extname(file).toLowerCase()]||'application/octet-stream'; res.writeHead(200,{'Content-Type':type,'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Cache-Control':file.endsWith('index.html')?'no-cache':'public, max-age=3600'}); if(req.method==='HEAD')return res.end(); fs.createReadStream(file).pipe(res); }
  catch { const data=readData(); const appRoute=new Set(['/','/work','/thinking','/about','/experience','/experiments','/now','/uses','/contact','/search','/privacy','/studio']); const dynamicRoute=(route.startsWith('/work/')&&data.projects.some(p=>route==='/work/'+p.slug))||(route.startsWith('/thinking/')&&data.articles.some(a=>a.status==='Published'&&route==='/thinking/'+a.slug)); const appPath=appRoute.has(route)||dynamicRoute; try { const body=fs.readFileSync(path.join(root,'public','index.html')); res.writeHead(appPath?200:404,{'Content-Type':mime['.html'],'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Cache-Control':'no-cache'}); res.end(body); } catch { send(res,404,'Not found','text/plain; charset=utf-8'); } }
};
function xml(value=''){return String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;');}
http.createServer((req,res)=>handle(req,res).catch(err=>{console.error(err); if(!res.headersSent)json(res,500,{error:'The request could not be completed.'}); else res.destroy();})).listen(port,host,()=>console.log(`Ajaysinh site ready at http://${host}:${port}`));

