import Link from 'next/link'
import Image from 'next/image'
import StartButton from '@/components/StartButton'

export default function Home() {
  return (
    <div style={{fontFamily:"'Outfit',sans-serif",background:'#FAF7F5',color:'#2C1810',overflowX:'hidden'}}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Mono:wght@400;500&family=Outfit:wght@300;400;500&display=swap');

        .nav-links { display: flex !important; }
        .mobile-nav-cta { display: none !important; }

        .landing-label {
          font-size: 11px;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: #C4836A;
          margin-bottom: 12px;
          display: block;
        }
        .landing-headline {
          font-family: 'Playfair Display', serif;
          font-size: 36px;
          font-weight: 600;
          color: #2C1810;
          line-height: 1.2;
          margin-bottom: 16px;
          margin-top: 0;
        }
        .landing-body {
          font-size: 16px;
          color: #8B6355;
          line-height: 1.6;
          max-width: 320px;
          margin: 0;
        }

        /* Steps section — desktop */
        .steps-header { padding: 80px 72px 48px; max-width: 700px; margin: 0 auto; text-align: center; }

        .step-block { display: flex; align-items: flex-start; }
        .step-block-reversed { flex-direction: row-reverse; }

        /* Portrait ratio (3:4) so 9:16 images show ~74% from top — faces always visible */
        .step-block-image {
          flex: 0 0 58%;
          position: relative;
          overflow: hidden;
          aspect-ratio: 3 / 4;
        }
        .step-block-text {
          flex: 0 0 42%;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 60px 64px;
          position: relative;
          background: #FAF7F5;
          align-self: center;
        }
        .step-block-text-blush { background: #F5EDE8 !important; }

        .step-divider { display: none; }

        .steps-cta { text-align: center; padding: 60px 72px 80px; }

        /* Stats / results section */
        .stat-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 24px; margin-bottom: 56px; }
        .stats-section { padding: 100px 72px; background: #FAF7F5; }
        .stats-title { font-family: 'Playfair Display', serif; font-size: 46px; line-height: 1.15; color: #2C1810; margin-bottom: 56px; text-align: center; margin-top: 0; }

        @media (max-width: 768px) {
          .nav-links { display: none !important; }
          .mobile-nav-cta { display: block !important; }

          /* Hero */
          .hero-grid { grid-template-columns: 1fr !important; min-height: auto !important; }
          .hero-image-side { height: 420px !important; }
          .hero-text-side { padding: 40px 24px 60px !important; }
          .hero-title { font-size: 40px !important; }
          .hero-buttons { flex-direction: column !important; align-items: stretch !important; }
          .hero-buttons a { text-align: center !important; justify-content: center !important; }
          .floating-card-left { left: 3% !important; }
          .floating-card-right { right: 3% !important; }

          /* Steps */
          .steps-header { padding: 56px 24px 32px !important; }
          .steps-header h2 { font-size: 34px !important; }

          .step-block { display: block !important; }

          /* Portrait ratio on mobile — no more face crop */
          .step-block-image {
            flex: none !important;
            width: calc(100% - 32px) !important;
            height: auto !important;
            max-height: none !important;
            aspect-ratio: 3 / 4 !important;
            border-radius: 20px !important;
            margin: 0 16px 28px !important;
          }
          .step-block-text {
            flex: none !important;
            padding: 0 28px 52px !important;
          }
          .landing-headline { font-size: 30px !important; }
          .landing-body { max-width: 100% !important; }

          .step-divider {
            display: block !important;
            height: 1px !important;
            background: #E8DDD8 !important;
            margin: 0 28px !important;
          }

          .steps-cta { padding: 40px 24px 56px !important; }
          .steps-cta a { display: block !important; text-align: center !important; }

          /* Stats */
          .stat-grid { grid-template-columns: 1fr !important; }
          .stats-section { padding: 60px 24px !important; }
          .stats-title { font-size: 32px !important; }
          .pout-banner { height: 320px !important; }
          .pout-text { font-size: 22px !important; padding: 32px 24px !important; }

          /* Trust + CTA + Footer */
          .trust-strip { gap: 16px !important; padding: 32px 24px !important; }
          .trust-dot { display: none !important; }
          .cta-section { padding: 60px 24px 80px !important; }
          .cta-title { font-size: 36px !important; }
          .cta-button { width: 100% !important; justify-content: center !important; display: flex !important; }
          .footer { padding: 24px !important; flex-direction: column !important; gap: 16px !important; text-align: center !important; }
        }
      `}</style>

      {/* NAV */}
      <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:100,padding:'calc(16px + env(safe-area-inset-top)) 48px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',background:'rgba(250,247,245,0.92)',backdropFilter:'blur(20px)',borderBottom:'1px solid rgba(196,131,106,0.12)'}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:'22px',color:'#2C1810'}}>
          Skin<span style={{color:'#C4836A',fontStyle:'italic'}}>Proof</span>
        </div>
        <div className="nav-links" style={{display:'flex',gap:'28px',alignItems:'center'}}>
          <a href="#how" style={{fontSize:'13px',color:'#8B6355',textDecoration:'none',letterSpacing:'0.06em',textTransform:'uppercase'}}>How it works</a>
          <a href="#results" style={{fontSize:'13px',color:'#8B6355',textDecoration:'none',letterSpacing:'0.06em',textTransform:'uppercase'}}>Results</a>
          <StartButton style={{background:'#C4836A',color:'#FAF7F5',padding:'10px 24px',borderRadius:'100px',fontSize:'13px',fontWeight:500,textDecoration:'none'}}>Start free →</StartButton>
        </div>
        <div className="mobile-nav-cta" style={{display:'none'}}>
          <StartButton style={{background:'#C4836A',color:'#FAF7F5',padding:'8px 18px',borderRadius:'100px',fontSize:'13px',fontWeight:500,textDecoration:'none'}}>Start free</StartButton>
        </div>
      </nav>

      {/* HERO — original design restored */}
      <section style={{paddingTop:'calc(64px + env(safe-area-inset-top))'}}>
        <div className="hero-grid" style={{display:'grid',gridTemplateColumns:'1fr 1fr',minHeight:'100vh'}}>

          {/* Photo side with floating cards */}
          <div className="hero-image-side" style={{position:'relative',overflow:'hidden',display:'flex',alignItems:'stretch',background:'linear-gradient(160deg,#fdf9f6 0%,#fdf0ec 55%,#fce8e8 100%)'}}>
            <Image
              src="/landing page pic.webp"
              alt="Glass skin portrait"
              fill
              style={{objectFit:'cover',objectPosition:'center 10%',filter:'brightness(1.04) saturate(1.05)'}}
              priority
            />
            {/* Subtle vignette overlays */}
            <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 50% 40% at 42% 28%,rgba(255,255,255,0.18) 0%,transparent 60%)',pointerEvents:'none'}}/>
            <div style={{position:'absolute',top:0,left:0,bottom:0,width:'80px',background:'linear-gradient(to right,rgba(253,240,236,0.45),transparent)',pointerEvents:'none'}}/>
            <div style={{position:'absolute',bottom:0,left:0,right:0,height:'160px',background:'linear-gradient(to top,rgba(252,232,232,0.45) 0%,transparent 100%)',pointerEvents:'none'}}/>

            {/* AI Scanning pill */}
            <div style={{position:'absolute',top:'7%',right:'5%',background:'rgba(0,0,0,0.72)',color:'white',borderRadius:'999px',padding:'8px 16px',fontSize:'13px',fontWeight:500,display:'flex',alignItems:'center',gap:'7px',boxShadow:'0 4px 16px rgba(0,0,0,0.25)',zIndex:10}}>
              <div style={{width:'7px',height:'7px',borderRadius:'50%',background:'#4CAF50',boxShadow:'0 0 0 2px rgba(76,175,80,0.35)'}}/>
              Scanning...
            </div>

            {/* Score card: HYDRATION — top left */}
            <div className="floating-card-left" style={{position:'absolute',top:'12%',left:'5%',background:'rgba(255,255,255,0.92)',backdropFilter:'blur(16px)',border:'1px solid rgba(196,131,106,0.18)',borderRadius:'18px',padding:'13px 17px',boxShadow:'0 6px 24px rgba(44,24,16,0.1)',zIndex:10}}>
              <div style={{fontSize:'10px',fontWeight:500,letterSpacing:'0.1em',textTransform:'uppercase',color:'#8B6355',marginBottom:'4px'}}>Hydration</div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:'24px',fontWeight:500,color:'#2C1810'}}>87 <span style={{fontSize:'11px',color:'#C4836A'}}>/ 100</span></div>
              <div style={{height:'3px',background:'rgba(196,131,106,0.18)',borderRadius:'2px',marginTop:'7px',overflow:'hidden'}}>
                <div style={{width:'87%',height:'100%',borderRadius:'2px',background:'linear-gradient(90deg,#f0c4b4,#C4836A)'}}/>
              </div>
              <div style={{fontSize:'11px',color:'#4CAF50',fontWeight:600,marginTop:'5px'}}>↑ +12 this week</div>
            </div>

            {/* Score card: TEXTURE — right middle */}
            <div className="floating-card-right" style={{position:'absolute',top:'42%',right:'5%',background:'rgba(255,255,255,0.92)',backdropFilter:'blur(16px)',border:'1px solid rgba(196,131,106,0.18)',borderRadius:'18px',padding:'13px 17px',boxShadow:'0 6px 24px rgba(44,24,16,0.1)',zIndex:10}}>
              <div style={{fontSize:'10px',fontWeight:500,letterSpacing:'0.1em',textTransform:'uppercase',color:'#8B6355',marginBottom:'4px'}}>Texture</div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:'24px',fontWeight:500,color:'#2C1810'}}>92 <span style={{fontSize:'11px',color:'#C4836A'}}>/ 100</span></div>
              <div style={{height:'3px',background:'rgba(196,131,106,0.18)',borderRadius:'2px',marginTop:'7px',overflow:'hidden'}}>
                <div style={{width:'92%',height:'100%',borderRadius:'2px',background:'linear-gradient(90deg,#f0c4b4,#C4836A)'}}/>
              </div>
              <div style={{fontSize:'11px',color:'#4CAF50',fontWeight:600,marginTop:'5px'}}>↑ +8 · 30 days</div>
            </div>

            {/* Score card: RADIANCE — bottom left */}
            <div className="floating-card-left" style={{position:'absolute',bottom:'22%',left:'5%',background:'rgba(255,255,255,0.92)',backdropFilter:'blur(16px)',border:'1px solid rgba(196,131,106,0.18)',borderRadius:'18px',padding:'13px 17px',boxShadow:'0 6px 24px rgba(44,24,16,0.1)',zIndex:10}}>
              <div style={{fontSize:'10px',fontWeight:500,letterSpacing:'0.1em',textTransform:'uppercase',color:'#8B6355',marginBottom:'4px'}}>Radiance</div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:'24px',fontWeight:500,color:'#2C1810'}}>79 <span style={{fontSize:'11px',color:'#C4836A'}}>/ 100</span></div>
              <div style={{height:'3px',background:'rgba(196,131,106,0.18)',borderRadius:'2px',marginTop:'7px',overflow:'hidden'}}>
                <div style={{width:'79%',height:'100%',borderRadius:'2px',background:'linear-gradient(90deg,#f0c4b4,#C4836A)'}}/>
              </div>
              <div style={{fontSize:'11px',color:'#4CAF50',fontWeight:600,marginTop:'5px'}}>↑ +21 · 60 days</div>
            </div>
          </div>

          {/* Text side */}
          <div className="hero-text-side" style={{display:'flex',flexDirection:'column',justifyContent:'center',padding:'60px 72px 60px 48px',background:'#FAF7F5'}}>
            <div style={{display:'inline-flex',alignItems:'center',gap:'10px',fontSize:'11px',fontWeight:500,letterSpacing:'0.14em',textTransform:'uppercase',color:'#C4836A',marginBottom:'24px'}}>
              <span style={{width:'28px',height:'1px',background:'#C4836A',display:'inline-block'}}/>
              Daily skin tracking
            </div>
            <h1 className="hero-title" style={{fontFamily:"'Playfair Display',serif",fontSize:'62px',lineHeight:1.1,color:'#2C1810',marginBottom:'20px',marginTop:0}}>
              Your skin story,<br/>
              <em style={{fontStyle:'italic',color:'#C4836A'}}>clearly proven</em>
            </h1>
            <p style={{fontSize:'16px',fontWeight:300,lineHeight:1.75,color:'#8B6355',maxWidth:'400px',marginBottom:'40px'}}>
              Track your skin every day, log your products, and discover what <em>actually</em> works for skin like yours — backed by real data, not marketing claims.
            </p>
            <div className="hero-buttons" style={{display:'flex',gap:'14px',alignItems:'center',marginBottom:'44px',flexWrap:'wrap'}}>
              <StartButton style={{background:'#C4836A',color:'#FAF7F5',padding:'15px 32px',borderRadius:'100px',fontSize:'14px',fontWeight:500,textDecoration:'none',display:'inline-flex',alignItems:'center',gap:'8px',boxShadow:'0 8px 24px rgba(196,131,106,0.3)'}}>
                Start tracking free →
              </StartButton>
              <a href="#how" style={{color:'#8B6355',fontSize:'14px',textDecoration:'none',display:'flex',alignItems:'center',gap:'8px'}}>
                See how it works →
              </a>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
              <div style={{display:'flex'}}>
                {['🌸','✨','🌿','💎'].map((e,i)=>(
                  <div key={i} style={{width:'34px',height:'34px',borderRadius:'50%',border:'2px solid white',marginLeft:i===0?0:'-10px',background:'linear-gradient(135deg,#fce8e0,#f0c4b4)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px'}}>{e}</div>
                ))}
              </div>
              <div style={{fontSize:'13px',color:'#8B6355'}}><strong style={{color:'#2C1810'}}>4,200+</strong> people tracking their skin journey</div>
            </div>
          </div>
        </div>
      </section>

      {/* THREE STEPS */}
      <section id="how" style={{background:'#FAF7F5'}}>

        <div className="steps-header">
          <span className="landing-label" style={{display:'block',textAlign:'center',marginBottom:'14px'}}>THE PROCESS</span>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:'46px',lineHeight:1.15,color:'#2C1810',marginTop:0,marginBottom:0}}>
            Three steps to <em style={{fontStyle:'italic',color:'#C4836A'}}>glass skin</em>
          </h2>
        </div>

        {/* Step 01 — Image LEFT */}
        <div className="step-block">
          <div className="step-block-image">
            <Image
              src="/landing/steps/step1-selfie.jpg"
              alt="Daily skin scan"
              fill
              quality={90}
              style={{objectFit:'cover',objectPosition:'center 10%'}}
            />
          </div>
          <div className="step-block-text">
            <span className="landing-label">01 · DAILY SCAN</span>
            <h3 className="landing-headline">Snap.<br/>Score.<br/>Track.</h3>
            <p className="landing-body">30 seconds a day. We score 6 skin dimensions — no guesswork.</p>
          </div>
        </div>

        <div className="step-divider"/>

        {/* Step 02 — Image RIGHT */}
        <div className="step-block step-block-reversed">
          <div className="step-block-image">
            <Image
              src="/landing/steps/step2-lookscreen.jpg"
              alt="Check your routine"
              fill
              quality={90}
              style={{objectFit:'cover',objectPosition:'center 12%'}}
            />
          </div>
          <div className="step-block-text step-block-text-blush">
            <span className="landing-label">02 · ROUTINE CHECK</span>
            <h3 className="landing-headline">Know what&apos;s<br/>actually<br/>working.</h3>
            <p className="landing-body">Log your products. We check if they suit today&apos;s skin — not guesswork.</p>
          </div>
        </div>

        <div className="step-divider"/>

        {/* Step 03 — Image LEFT */}
        <div className="step-block">
          <div className="step-block-image">
            <Image
              src="/landing/steps/step3-result.jpg"
              alt="Real skin results"
              fill
              quality={90}
              style={{objectFit:'cover',objectPosition:'center 8%'}}
            />
          </div>
          <div className="step-block-text">
            <span className="landing-label">03 · GLASS SKIN</span>
            <h3 className="landing-headline">Real results.<br/>Real people.<br/>Like you.</h3>
            <p className="landing-body">See what worked for people with your skin type, age, and concerns.</p>
          </div>
        </div>

        <div className="steps-cta">
          <StartButton style={{background:'#C4836A',color:'#FAF7F5',padding:'16px 40px',borderRadius:'100px',fontSize:'14px',fontWeight:500,textDecoration:'none',display:'inline-flex',alignItems:'center',gap:'8px',boxShadow:'0 8px 24px rgba(196,131,106,0.25)'}}>
            Start tracking free →
          </StartButton>
        </div>

      </section>

      {/* RESULTS STATS */}
      <section id="results" className="stats-section">
        <div style={{maxWidth:'1100px',margin:'0 auto'}}>
          <h2 className="stats-title">
            What <em style={{fontStyle:'italic',color:'#C4836A'}}>30 days of tracking</em> looks like
          </h2>

          <div className="stat-grid">
            {[
              {stat:'+12pts',label:'avg score',sub:'improvement'},
              {stat:'89%',label:'found their',sub:'hero product'},
              {stat:'14 days',label:'to first',sub:'real trend'},
            ].map((s)=>(
              <div key={s.stat} style={{padding:'44px 32px',background:'#F5EDE8',borderRadius:'20px',textAlign:'center'}}>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:'52px',fontWeight:700,color:'#C4836A',lineHeight:1,marginBottom:'12px'}}>{s.stat}</div>
                <div style={{fontSize:'13px',color:'#8B6355',lineHeight:1.5}}>{s.label}<br/>{s.sub}</div>
              </div>
            ))}
          </div>

          <div className="pout-banner" style={{position:'relative',borderRadius:'20px',overflow:'hidden',height:'420px'}}>
            <Image
              src="/landing/steps/step3-result.jpg"
              alt="Glass skin results"
              fill
              style={{objectFit:'cover',objectPosition:'center 20%'}}
            />
            <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(44,24,16,0.65) 0%,transparent 55%)',pointerEvents:'none'}}/>
            <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'48px'}}>
              <p className="pout-text" style={{fontFamily:"'Playfair Display',serif",fontSize:'28px',color:'#FAF7F5',lineHeight:1.35,maxWidth:'480px',margin:0}}>
                Glass skin starts with<br/><em style={{color:'#F5EDE8'}}>knowing your skin.</em>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* TRANSPARENCY STRIP */}
      <div style={{borderTop:'1px solid rgba(196,131,106,0.2)',borderBottom:'1px solid rgba(196,131,106,0.2)',background:'#F5EDE8'}}>
        <div className="trust-strip" style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'20px',padding:'28px 72px',flexWrap:'wrap'}}>
          <span style={{fontSize:'11px',letterSpacing:'0.18em',textTransform:'uppercase',color:'#C4836A',fontWeight:500}}>No paid rankings</span>
          <span className="trust-dot" style={{color:'#C4836A',opacity:0.5,fontSize:'16px'}}>·</span>
          <span style={{fontSize:'11px',letterSpacing:'0.18em',textTransform:'uppercase',color:'#C4836A',fontWeight:500}}>Real data only</span>
          <span className="trust-dot" style={{color:'#C4836A',opacity:0.5,fontSize:'16px'}}>·</span>
          <span style={{fontSize:'11px',letterSpacing:'0.18em',textTransform:'uppercase',color:'#C4836A',fontWeight:500}}>Your photos stay private</span>
        </div>
      </div>

      {/* CTA */}
      <section className="cta-section" style={{padding:'100px 72px 120px',textAlign:'center',background:'linear-gradient(to bottom,#FAF7F5,#F5EDE8)'}}>
        <h2 className="cta-title" style={{fontFamily:"'Playfair Display',serif",fontSize:'58px',lineHeight:1.15,color:'#2C1810',marginBottom:'16px',marginTop:0}}>
          Your skin deserves<br/><em style={{fontStyle:'italic',color:'#C4836A'}}>better evidence</em>
        </h2>
        <p style={{fontSize:'16px',fontWeight:300,color:'#8B6355',marginBottom:'40px',maxWidth:'380px',marginLeft:'auto',marginRight:'auto',lineHeight:1.75}}>
          Start your free skin journal today. No credit card. No commitment. Just clarity.
        </p>
        <StartButton className="cta-button" style={{background:'#C4836A',color:'#FAF7F5',padding:'16px 44px',borderRadius:'100px',fontSize:'15px',fontWeight:500,textDecoration:'none',display:'inline-flex',alignItems:'center',gap:'8px',boxShadow:'0 8px 24px rgba(196,131,106,0.3)'}}>
          Start tracking free →
        </StartButton>
      </section>

      {/* FOOTER */}
      <footer className="footer" style={{borderTop:'1px solid rgba(196,131,106,0.15)',padding:'32px 72px',display:'flex',alignItems:'center',justifyContent:'space-between',background:'#FAF7F5'}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:'17px',color:'#2C1810'}}>
          Skin<span style={{color:'#C4836A',fontStyle:'italic'}}>Proof</span>
        </div>
        <div style={{display:'flex',gap:'22px'}}>
          <Link href="/privacy" style={{fontSize:'12px',color:'#8B6355',textDecoration:'none',letterSpacing:'0.06em',textTransform:'uppercase'}}>Privacy</Link>
          <Link href="/terms" style={{fontSize:'12px',color:'#8B6355',textDecoration:'none',letterSpacing:'0.06em',textTransform:'uppercase'}}>Terms</Link>
        </div>
      </footer>

    </div>
  )
}
