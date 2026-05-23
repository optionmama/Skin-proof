import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <div style={{fontFamily:"'Outfit',sans-serif",background:'#fdf9f6',color:'#3a2420',overflowX:'hidden'}}>

      {/* Mobile RWD styles */}
      <style>{`
        @media (max-width: 768px) {
          .nav-links { display: none !important; }
          .hero-section {
            grid-template-columns: 1fr !important;
            min-height: auto !important;
            padding-top: 64px !important;
          }
          .hero-photo {
            height: 420px !important;
            position: relative !important;
          }
          .hero-text {
            padding: 40px 24px 60px !important;
          }
          .hero-title {
            font-size: 40px !important;
          }
          .hero-buttons {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .hero-buttons a {
            text-align: center !important;
            justify-content: center !important;
          }
          .how-section {
            padding: 60px 24px !important;
          }
          .how-title {
            font-size: 34px !important;
          }
          .how-grid {
            grid-template-columns: 1fr !important;
          }
          .results-section {
            padding: 60px 24px !important;
          }
          .results-grid {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }
          .results-title {
            font-size: 34px !important;
          }
          .trust-section {
            padding: 60px 24px !important;
          }
          .trust-title {
            font-size: 34px !important;
          }
          .trust-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .cta-section {
            padding: 60px 24px 80px !important;
          }
          .cta-title {
            font-size: 38px !important;
          }
          .footer {
            padding: 24px !important;
            flex-direction: column !important;
            gap: 16px !important;
            text-align: center !important;
          }
          .footer-disclaimer {
            text-align: center !important;
            max-width: 100% !important;
          }
          .floating-card-left { left: 3% !important; }
          .floating-card-right { right: 3% !important; }
        }
        @media (max-width: 480px) {
          .trust-grid {
            grid-template-columns: 1fr !important;
          }
          .hero-title {
            font-size: 34px !important;
          }
        }
      `}</style>

      {/* NAV */}
      <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:100,padding:'16px 48px',display:'flex',alignItems:'center',justifyContent:'space-between',background:'rgba(253,249,246,0.92)',backdropFilter:'blur(20px)',borderBottom:'1px solid rgba(224,144,128,0.12)'}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:'22px',color:'#3a2420'}}>
          Skin<span style={{color:'#e09080',fontStyle:'italic'}}>Proof</span>
        </div>
        <div className="nav-links" style={{display:'flex',gap:'28px',alignItems:'center'}}>
          <a href="#how" style={{fontSize:'13px',color:'#7a4a40',textDecoration:'none',letterSpacing:'0.06em',textTransform:'uppercase'}}>How it works</a>
          <a href="#results" style={{fontSize:'13px',color:'#7a4a40',textDecoration:'none',letterSpacing:'0.06em',textTransform:'uppercase'}}>Results</a>
          <Link href="/auth" style={{background:'#3a2420',color:'#fdf9f6',padding:'10px 24px',borderRadius:'100px',fontSize:'13px',fontWeight:500,textDecoration:'none'}}>Start free</Link>
        </div>
        {/* Mobile nav CTA only */}
        <div style={{display:'none'}} className="mobile-nav-cta">
          <Link href="/auth" style={{background:'#3a2420',color:'#fdf9f6',padding:'8px 18px',borderRadius:'100px',fontSize:'13px',fontWeight:500,textDecoration:'none'}}>Start free</Link>
        </div>
        <style>{`@media(max-width:768px){.mobile-nav-cta{display:block !important}}`}</style>
      </nav>

      {/* HERO */}
      <section className="hero-section" style={{paddingTop:'64px',background:'linear-gradient(160deg,#fdf9f6 0%,#fdf0ec 55%,#fce8e8 100%)',minHeight:'100vh',display:'grid',gridTemplateColumns:'1fr 1fr'}}>

        {/* Photo side */}
        <div className="hero-photo" style={{position:'relative',overflow:'hidden',display:'flex',alignItems:'stretch'}}>
          <Image
            src="/landing page pic.webp"
            alt="Glass skin portrait"
            fill
            style={{objectFit:'cover',objectPosition:'center 10%',filter:'brightness(1.04) saturate(1.06)'}}
            priority
          />
          <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 50% 40% at 42% 28%,rgba(255,255,255,0.2) 0%,transparent 60%)',pointerEvents:'none'}}/>
          <div style={{position:'absolute',top:0,left:0,bottom:0,width:'80px',background:'linear-gradient(to right,#fdf0ec,transparent)',pointerEvents:'none'}}/>
          <div style={{position:'absolute',bottom:0,left:0,right:0,height:'160px',background:'linear-gradient(to top,#fce8e8 0%,transparent 100%)',pointerEvents:'none'}}/>

          {/* AI badge */}
          <div style={{position:'absolute',top:'7%',right:'5%',background:'#3a2420',color:'#fdf9f6',borderRadius:'100px',padding:'8px 16px',fontSize:'11px',fontWeight:500,display:'flex',alignItems:'center',gap:'6px',boxShadow:'0 6px 20px rgba(58,36,32,0.28)'}}>
            <div style={{width:'6px',height:'6px',borderRadius:'50%',background:'#90e090'}}/>
            AI Scanning...
          </div>

          {/* Floating cards */}
          <div className="floating-card-left" style={{position:'absolute',top:'12%',left:'5%',background:'rgba(255,255,255,0.9)',backdropFilter:'blur(16px)',border:'1px solid rgba(224,144,128,0.2)',borderRadius:'18px',padding:'13px 17px',boxShadow:'0 8px 28px rgba(58,36,32,0.1)'}}>
            <div style={{fontSize:'10px',fontWeight:500,letterSpacing:'0.1em',textTransform:'uppercase',color:'#7a4a40',marginBottom:'4px'}}>Hydration</div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:'24px',fontWeight:500,color:'#3a2420'}}>87 <span style={{fontSize:'11px',color:'#e09080'}}>/ 100</span></div>
            <div style={{height:'3px',background:'#fce8e0',borderRadius:'2px',marginTop:'7px',overflow:'hidden'}}>
              <div style={{width:'87%',height:'100%',borderRadius:'2px',background:'linear-gradient(90deg,#f0c4b4,#e09080)'}}/>
            </div>
            <div style={{fontSize:'11px',color:'#8fa888',fontWeight:600,marginTop:'5px'}}>↑ +12 this week</div>
          </div>

          <div className="floating-card-right" style={{position:'absolute',top:'42%',right:'5%',background:'rgba(255,255,255,0.9)',backdropFilter:'blur(16px)',border:'1px solid rgba(224,144,128,0.2)',borderRadius:'18px',padding:'13px 17px',boxShadow:'0 8px 28px rgba(58,36,32,0.1)'}}>
            <div style={{fontSize:'10px',fontWeight:500,letterSpacing:'0.1em',textTransform:'uppercase',color:'#7a4a40',marginBottom:'4px'}}>Texture</div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:'24px',fontWeight:500,color:'#3a2420'}}>92 <span style={{fontSize:'11px',color:'#e09080'}}>/ 100</span></div>
            <div style={{height:'3px',background:'#fce8e0',borderRadius:'2px',marginTop:'7px',overflow:'hidden'}}>
              <div style={{width:'92%',height:'100%',borderRadius:'2px',background:'linear-gradient(90deg,#f0c4b4,#e09080)'}}/>
            </div>
            <div style={{fontSize:'11px',color:'#8fa888',fontWeight:600,marginTop:'5px'}}>↑ +8 · 30 days</div>
          </div>

          <div className="floating-card-left" style={{position:'absolute',bottom:'22%',left:'5%',background:'rgba(255,255,255,0.9)',backdropFilter:'blur(16px)',border:'1px solid rgba(224,144,128,0.2)',borderRadius:'18px',padding:'13px 17px',boxShadow:'0 8px 28px rgba(58,36,32,0.1)'}}>
            <div style={{fontSize:'10px',fontWeight:500,letterSpacing:'0.1em',textTransform:'uppercase',color:'#7a4a40',marginBottom:'4px'}}>Radiance</div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:'24px',fontWeight:500,color:'#3a2420'}}>79 <span style={{fontSize:'11px',color:'#e09080'}}>/ 100</span></div>
            <div style={{height:'3px',background:'#fce8e0',borderRadius:'2px',marginTop:'7px',overflow:'hidden'}}>
              <div style={{width:'79%',height:'100%',borderRadius:'2px',background:'linear-gradient(90deg,#f0c4b4,#e09080)'}}/>
            </div>
            <div style={{fontSize:'11px',color:'#8fa888',fontWeight:600,marginTop:'5px'}}>↑ +21 · 60 days</div>
          </div>
        </div>

        {/* Text side */}
        <div className="hero-text" style={{display:'flex',flexDirection:'column',justifyContent:'center',padding:'60px 72px 60px 48px'}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:'10px',fontSize:'11px',fontWeight:500,letterSpacing:'0.14em',textTransform:'uppercase',color:'#e09080',marginBottom:'24px'}}>
            <span style={{width:'28px',height:'1px',background:'#e09080',display:'inline-block'}}/>
            AI-powered skin tracking
          </div>
          <h1 className="hero-title" style={{fontFamily:"'Playfair Display',serif",fontSize:'62px',lineHeight:1.1,color:'#3a2420',marginBottom:'20px'}}>
            Your skin story,<br/>
            <em style={{fontStyle:'italic',color:'#e09080'}}>clearly proven</em>
          </h1>
          <p style={{fontSize:'16px',fontWeight:300,lineHeight:1.75,color:'#7a4a40',maxWidth:'400px',marginBottom:'40px'}}>
            Track your skin every day, log your products, and discover what <em>actually</em> works for skin like yours — backed by real data, not marketing claims.
          </p>
          <div className="hero-buttons" style={{display:'flex',gap:'14px',alignItems:'center',marginBottom:'44px',flexWrap:'wrap'}}>
            <Link href="/auth" style={{background:'#3a2420',color:'#fdf9f6',padding:'15px 32px',borderRadius:'100px',fontSize:'14px',fontWeight:500,textDecoration:'none',display:'inline-flex',alignItems:'center',gap:'8px',boxShadow:'0 8px 24px rgba(58,36,32,0.2)'}}>
              Start tracking free →
            </Link>
            <a href="#how" style={{color:'#3a2420',fontSize:'14px',textDecoration:'none',display:'flex',alignItems:'center',gap:'8px'}}>
              See how it works →
            </a>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
            <div style={{display:'flex'}}>
              {['🌸','✨','🌿','💎'].map((e,i)=>(
                <div key={i} style={{width:'34px',height:'34px',borderRadius:'50%',border:'2px solid white',marginLeft:i===0?0:'-10px',background:'linear-gradient(135deg,#fce8e0,#f0c4b4)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px'}}>{e}</div>
              ))}
            </div>
            <div style={{fontSize:'13px',color:'#7a4a40'}}><strong style={{color:'#3a2420'}}>4,200+</strong> people tracking their skin journey</div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="how-section" style={{padding:'100px 72px',maxWidth:'1200px',margin:'0 auto'}}>
        <div style={{fontSize:'11px',fontWeight:500,letterSpacing:'0.14em',textTransform:'uppercase',color:'#e09080',marginBottom:'14px',display:'flex',alignItems:'center',gap:'10px'}}>
          <span style={{width:'20px',height:'1px',background:'#e09080',display:'inline-block'}}/>
          The process
        </div>
        <h2 className="how-title" style={{fontFamily:"'Playfair Display',serif",fontSize:'50px',lineHeight:1.15,color:'#3a2420',marginBottom:'14px'}}>
          Three steps to <em style={{fontStyle:'italic',color:'#e09080'}}>glass skin clarity</em>
        </h2>
        <p style={{fontSize:'15px',fontWeight:300,color:'#7a4a40',maxWidth:'440px',lineHeight:1.75,marginBottom:'60px'}}>
          No guesswork. No marketing noise. Just your skin, your products, and what the data actually shows.
        </p>
        <div className="how-grid" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'24px'}}>
          {[
            {num:'01',icon:'📸',title:'Daily skin check-in',desc:'Upload a photo each day. AI scores 7 metrics — hydration, texture, radiance, redness, acne, pores, and pigmentation. Photo quality is tracked so your data stays reliable.'},
            {num:'02',icon:'🧴',title:'Log your products',desc:'Record every product you use — when, how often, how your skin reacts. We cross-check ingredients and flag potential irritants before they cause trouble.'},
            {num:'03',icon:'📊',title:'See what works',desc:'After 30, 60, 90 days — your data tells the real story. Which products moved the needle. What people with similar skin are achieving. Honest numbers, not promises.'},
          ].map((s)=>(
            <div key={s.num} style={{padding:'38px 30px',background:'#f8f2eb',borderRadius:'22px',borderTop:'3px solid #f0c4b4'}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:'56px',color:'#f0c4b4',lineHeight:1,marginBottom:'18px'}}>{s.num}</div>
              <div style={{fontSize:'28px',marginBottom:'12px'}}>{s.icon}</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:'20px',color:'#3a2420',marginBottom:'10px'}}>{s.title}</div>
              <p style={{fontSize:'13px',fontWeight:300,color:'#7a4a40',lineHeight:1.7}}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* RESULTS */}
      <section id="results" className="results-section" style={{background:'linear-gradient(135deg,#2e1c18,#3a2420)',padding:'100px 72px'}}>
        <div style={{maxWidth:'1200px',margin:'0 auto'}}>
          <div className="results-grid" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'64px',alignItems:'center'}}>
            <div>
              <div style={{fontSize:'11px',fontWeight:500,letterSpacing:'0.14em',textTransform:'uppercase',color:'#f0c4b4',marginBottom:'14px',display:'flex',alignItems:'center',gap:'10px'}}>
                <span style={{width:'20px',height:'1px',background:'#f0c4b4',display:'inline-block'}}/>
                Real outcomes
              </div>
              <h2 className="results-title" style={{fontFamily:"'Playfair Display',serif",fontSize:'46px',lineHeight:1.15,color:'#fdf9f6',marginBottom:'16px'}}>
                What <em style={{fontStyle:'italic',color:'#f0c4b4'}}>skin like yours</em><br/>is achieving
              </h2>
              <p style={{fontSize:'15px',fontWeight:300,color:'rgba(253,249,246,0.55)',lineHeight:1.75,marginBottom:'32px'}}>
                Anonymous aggregated data from users with similar skin types. Not testimonials — actual outcome averages.
              </p>
              <Link href="/auth" style={{background:'#e09080',color:'#fdf9f6',padding:'14px 30px',borderRadius:'100px',fontSize:'14px',fontWeight:500,textDecoration:'none',display:'inline-flex',alignItems:'center',gap:'8px',boxShadow:'0 8px 24px rgba(224,144,128,0.3)'}}>
                See your potential →
              </Link>
            </div>
            <div>
              {[
                {emoji:'🌸',name:'Combination skin · 25–32',concern:'Acne + uneven tone · Seoul',delta:'+34',days:'60-day avg'},
                {emoji:'✨',name:'Dry sensitive · 28–35',concern:'Redness + dehydration · Taipei',delta:'+28',days:'30-day avg'},
                {emoji:'💎',name:'Oily skin · 20–28',concern:'Large pores + shine · HK',delta:'+41',days:'90-day avg'},
              ].map((r)=>(
                <div key={r.name} style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.09)',borderRadius:'16px',padding:'20px 24px',display:'flex',alignItems:'center',gap:'16px',marginBottom:'12px'}}>
                  <div style={{width:'46px',height:'46px',borderRadius:'50%',flexShrink:0,background:'linear-gradient(135deg,#fce8e0,#f0c4b4)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px'}}>{r.emoji}</div>
                  <div>
                    <div style={{fontSize:'13px',fontWeight:500,color:'#fdf9f6',marginBottom:'3px'}}>{r.name}</div>
                    <div style={{fontSize:'11px',color:'rgba(253,249,246,0.45)'}}>{r.concern}</div>
                  </div>
                  <div style={{marginLeft:'auto',textAlign:'right'}}>
                    <div style={{fontFamily:"'DM Mono',monospace",fontSize:'22px',fontWeight:500,color:'#f0c4b4'}}>{r.delta}</div>
                    <div style={{fontSize:'10px',color:'rgba(253,249,246,0.35)'}}>{r.days}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="trust-section" style={{padding:'100px 72px',maxWidth:'1200px',margin:'0 auto'}}>
        <div style={{fontSize:'11px',fontWeight:500,letterSpacing:'0.14em',textTransform:'uppercase',color:'#e09080',marginBottom:'14px',display:'flex',alignItems:'center',gap:'10px'}}>
          <span style={{width:'20px',height:'1px',background:'#e09080',display:'inline-block'}}/>
          Why trust us
        </div>
        <h2 className="trust-title" style={{fontFamily:"'Playfair Display',serif",fontSize:'46px',lineHeight:1.15,color:'#3a2420',marginBottom:'56px'}}>
          Built on <em style={{fontStyle:'italic',color:'#e09080'}}>transparency</em>
        </h2>
        <div className="trust-grid" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'20px'}}>
          {[
            {icon:'🛡️',title:'Commission-free rankings',desc:'Rankings based purely on your skin data. We never accept payment to influence recommendations.'},
            {icon:'📊',title:'Real outcome data',desc:'When evidence is limited, we say so. Every recommendation shows confidence level and sample size.'},
            {icon:'🔒',title:'Private by design',desc:'Your photos are encrypted. Your data is yours. Only anonymised data is used for statistics.'},
            {icon:'⚕️',title:'Not medical advice',desc:'SkinProof is a personal tracking tool. Always consult a dermatologist for medical concerns.'},
          ].map((t)=>(
            <div key={t.title} style={{padding:'32px 24px',background:'#f8f2eb',borderRadius:'20px'}}>
              <div style={{fontSize:'26px',marginBottom:'12px'}}>{t.icon}</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:'16px',color:'#3a2420',marginBottom:'8px'}}>{t.title}</div>
              <p style={{fontSize:'13px',fontWeight:300,color:'#7a4a40',lineHeight:1.7}}>{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section" style={{padding:'100px 72px 120px',textAlign:'center',background:'linear-gradient(to bottom,#fdf9f6,#fce8e0)'}}>
        <h2 className="cta-title" style={{fontFamily:"'Playfair Display',serif",fontSize:'58px',lineHeight:1.15,color:'#3a2420',marginBottom:'16px'}}>
          Your skin deserves<br/><em style={{fontStyle:'italic',color:'#e09080'}}>better evidence</em>
        </h2>
        <p style={{fontSize:'16px',fontWeight:300,color:'#7a4a40',marginBottom:'40px',maxWidth:'380px',marginLeft:'auto',marginRight:'auto',lineHeight:1.75}}>
          Start your free skin journal today. No credit card. No commitment. Just clarity.
        </p>
        <Link href="/auth" style={{background:'#3a2420',color:'#fdf9f6',padding:'16px 44px',borderRadius:'100px',fontSize:'15px',fontWeight:500,textDecoration:'none',display:'inline-flex',alignItems:'center',gap:'8px',boxShadow:'0 8px 24px rgba(58,36,32,0.2)'}}>
          Begin your skin story →
        </Link>
        <p style={{marginTop:'20px',fontSize:'12px',color:'rgba(122,74,64,0.45)'}}>
          ⓘ AI analysis is for personal tracking only — not medical diagnosis.
        </p>
      </section>

      {/* FOOTER */}
      <footer className="footer" style={{borderTop:'1px solid rgba(224,144,128,0.15)',padding:'32px 72px',display:'flex',alignItems:'center',justifyContent:'space-between',background:'#fdf9f6'}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:'17px',color:'#3a2420'}}>
          Skin<span style={{color:'#e09080',fontStyle:'italic'}}>Proof</span>
        </div>
        <div style={{display:'flex',gap:'22px'}}>
          <Link href="/privacy" style={{fontSize:'12px',color:'#7a4a40',textDecoration:'none',letterSpacing:'0.06em',textTransform:'uppercase'}}>Privacy</Link>
          <Link href="/terms" style={{fontSize:'12px',color:'#7a4a40',textDecoration:'none',letterSpacing:'0.06em',textTransform:'uppercase'}}>Terms</Link>
        </div>
        <p className="footer-disclaimer" style={{fontSize:'11px',color:'rgba(122,74,64,0.4)',maxWidth:'260px',textAlign:'right',lineHeight:1.5}}>
          Not a medical device. AI analysis for personal tracking only.
        </p>
      </footer>

    </div>
  )
}
