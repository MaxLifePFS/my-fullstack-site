import { LeadForm } from "@/components/LeadForm";

/* ─── DATA ─────────────────────────────────────────────── */

const proofItems = [
  { num: "9.3%",  lbl: "Avg savings return" },
  { num: "4.6%",  lbl: "Policy loan rate" },
  { num: "$160K", lbl: "College saved — 1 client" },
  { num: "100%",  lbl: "Tax-free income possible" },
  { num: "30+",   lbl: "Expert team members" },
  { num: "20%",   lbl: "Profits to charity" },
  { num: "337",   lbl: "Pages of strategy" },
  { num: "$0",    lbl: "Tax — legally possible" },
];

const solutions = [
  { icon: "🏦", title: "Become your own bank",           body: "A properly structured FIUL policy lets you borrow from your own savings tax-free — while it keeps growing. Stop enriching banks with your money.", result: "Earn 9.3% avg · borrow at 4.6% · keep the spread forever" },
  { icon: "🏖️", title: "A pension that never runs out",  body: "The MaxRetire Plan converts your savings into guaranteed, tax-advantaged lifetime income — with zero stock market exposure. Sleep better. Retire earlier.", result: "Guaranteed income stream you cannot outlive" },
  { icon: "📉", title: "Slash your tax bill — legally",  body: "Through Buy-Borrow-Die, smart leveraging, and insurance-based structures, clients have cut tax bills from hundreds of thousands to tens of thousands.", result: "One CEO client: $100K+ tax reduction — legally" },
  { icon: "🎓", title: "Fund college without touching savings", body: "Tax-free policy loans fund your child's education. No savings drained. No debt to repay. One family saved $160,000 in total tuition.", result: "$58K/yr tuition → $18K/yr. $160K total saved." },
  { icon: "🏛️", title: "Your own private foundation",    body: "Launch a family charity. Reduce taxes by tens of thousands per year. Support causes you love. Build a legacy that outlives you — for everyone.", result: "Tens of thousands in annual tax savings" },
  { icon: "♾️", title: "Infinite finance & estate magnification", body: "Advanced wealth transfer and estate magnification strategies that multiply what you leave behind. Every variable of the UWE optimized simultaneously.", result: "More wealth, less risk, zero guesswork" },
];

const testimonials = [
  { quote: "Saving all income while spending or investing other people's money is exactly what I've been doing for over three years. My MaxLife Bank earns 9.3% while my loan is only 4.6%. There is no better, safer, or easier way for maximum asset accumulation.", name: "Robin Y.", role: "Uber Driver, Texas", result: "↑ 4.7% spread · earning while spending", avatar: "🚗" },
  { quote: "As a physician, I trust scientific proof. Tim can mathematically prove why MaxLife outperforms mutual funds or real estate, leaving me no excuse to refuse. Absolutely transformative.", name: "Vincent L., M.D.", role: "Hematologist & Oncologist, California", result: "↑ Scientifically convinced — zero doubt", avatar: "🩺" },
  { quote: "Dr. Bao helped slash college tuition for my son from $58K to $18K a year — $160K more into my future freedom. We paid with tax-free loans from my MaxLife Bank without draining a single dollar of savings.", name: "John H.", role: "Business Owner, Florida", result: "↑ $160,000 in college savings", avatar: "💼" },
  { quote: "A Zoom meeting with Dr. Bao blew my mind! I never thought about running my own charity so easily. Now I'm making direct social impacts while saving tens of thousands in taxes every year.", name: "Jim Z.", role: "IT Manager, Silicon Valley", result: "↑ Tens of thousands in tax savings", avatar: "💻" },
  { quote: "Convert our retirement savings into a guaranteed lifelong pension income stream we never outlive. This is the peace of mind Tim instilled in my husband and me. We finally sleep well at night.", name: "Lucy Z.", role: "University Professor, North Dakota", result: "↑ Guaranteed lifetime income secured", avatar: "🎓" },
  { quote: "By applying the MaxLife Strategy with Dr. Bao's coaching, I reduced my tax bill from hundreds of thousands to just tens of thousands. The math doesn't lie. Incredible, life-changing results.", name: "Jackie J.", role: "CEO, Financial Firm — Texas", result: "↑ 6-figure annual tax reduction", avatar: "📊" },
];

const audience = [
  { icon: "👔", title: "Business owners",           body: "Looking for liquidity, tax-efficient planning, income protection, and wealth transfer strategies that go far beyond ordinary retirement accounts." },
  { icon: "💰", title: "High-income professionals", body: "Tired of watching a big chunk of income disappear to taxes. Ready to build a retirement income system that's sustainable, guaranteed, and optimized." },
  { icon: "👨‍👩‍👧‍👦", title: "Families building legacy",  body: "Seeking college planning, protection, estate magnification, charitable giving, and multigenerational wealth — in one integrated strategy." },
];

const services = [
  { icon: "🏦", title: "MaxLife Plan — Self-Owned Bank",           body: "Use a specially structured FIUL policy as your personal bank. Borrow tax-free while savings keep earning. Earn while you spend." },
  { icon: "🏖️", title: "MaxRetire Plan — Self-Funded Pension",     body: "Convert savings into guaranteed, tax-advantaged lifetime income via Fixed Indexed Annuities. Never outlive your money." },
  { icon: "📉", title: "Tax optimization strategy",                 body: "Buy-Borrow-Die, smart leveraging, and insurance-based tools. Legally slash your tax bill — sometimes by six figures." },
  { icon: "🎓", title: "College funding strategy",                  body: "Fund education using tax-free policy loans without draining savings. One client saved $160K in tuition — zero repayment needed." },
  { icon: "🏛️", title: "Family foundation — Self-Directed Charity", body: "Start your own private foundation. Reduce taxes tens of thousands annually. Build a multigenerational legacy." },
  { icon: "♾️", title: "Infinite finance & estate magnification",   body: "Advanced wealth transfer and estate strategies that multiply what you leave behind — grounded in the UWE." },
  { icon: "📚", title: "Financial education & workshops",           body: "Group and individual training on disruptive personal finance science. The strategies the wealthy use — now for everyone." },
  { icon: "🤝", title: "Franchise opportunity",                     body: "Build your own MaxLife Academy business. Proven brand, 30+ expert team, and a system that changes lives." },
];

/* ─── COMPONENTS ────────────────────────────────────────── */

function NavBar() {
  return (
    <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 500, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.85rem 2.5rem", background: "rgba(7,9,15,0.92)", backdropFilter: "blur(20px)", borderBottom: "1px solid var(--border)" }}>
      <div style={{ fontWeight: 900, fontSize: "1.05rem", color: "var(--gold)", letterSpacing: "-0.3px" }}>
        MaxLife Academy
      </div>
      <ul style={{ display: "flex", gap: "0.1rem", listStyle: "none", margin: 0, padding: 0 }}>
        {[["#strategy","The Method"],["#proof","Results"],["#about","About Tim"],["#services","Services"]].map(([href,label]) => (
          <li key={href}><a href={href} style={{ color: "var(--muted)", fontSize: "0.87rem", fontWeight: 500, padding: "0.4rem 0.85rem", borderRadius: 8 }}>{label}</a></li>
        ))}
        <li>
          <a href="#contact" style={{ background: "var(--gold)", color: "#07090e", fontWeight: 800, borderRadius: 9, padding: "0.45rem 1.1rem", fontSize: "0.87rem" }}>
            Free Consultation
          </a>
        </li>
      </ul>
    </nav>
  );
}

function Hero() {
  return (
    <section id="home" style={{ minHeight: "100vh", display: "flex", alignItems: "center", padding: "9rem 0 5rem", position: "relative", overflow: "hidden", background: "radial-gradient(ellipse at 72% 22%, rgba(240,180,41,0.14) 0%, transparent 52%), radial-gradient(ellipse at 12% 88%, rgba(59,130,246,0.1) 0%, transparent 48%), var(--bg)" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 2rem", width: "100%" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "4rem", alignItems: "center" }}>

          {/* Left copy */}
          <div>
            <div className="fu" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(240,180,41,0.1)", border: "1px solid rgba(240,180,41,0.35)", color: "var(--gold)", fontSize: "0.72rem", fontWeight: 800, letterSpacing: "2.5px", textTransform: "uppercase", padding: "0.45rem 1.1rem", borderRadius: 999, marginBottom: "1.75rem" }}>
              ★ Science-Based Wealth Strategy
            </div>
            <h1 className="fu d1" style={{ fontSize: "clamp(3rem, 6vw, 5rem)", fontWeight: 900, letterSpacing: "-3px", lineHeight: 0.97, marginBottom: "1.75rem" }}>
              Stop Losing<br />
              <span style={{ background: "linear-gradient(135deg, var(--gold), var(--gold2))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Wealth</span> to a<br />
              <span style={{ color: "rgba(255,255,255,0.28)", fontWeight: 300 }}>Broken System.</span>
            </h1>
            <p className="fu d2" style={{ fontSize: "1.18rem", color: "var(--muted)", lineHeight: 1.82, marginBottom: "2.5rem", maxWidth: 510 }}>
              Most Americans work harder than ever — yet barely keep up. The system isn&apos;t broken by accident.{" "}
              <strong style={{ color: "rgba(255,255,255,0.8)" }}>It&apos;s designed for your mediocrity, not your freedom.</strong>{" "}
              Dr. Tim Bao&apos;s MaxLife Strategy rewrites the rules — scientifically, mathematically, permanently.
            </p>
            <div className="fu d3" style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "3.5rem" }}>
              <a href="https://calendly.com/timbao" target="_blank" rel="noreferrer" className="pulse" style={{ display: "inline-flex", alignItems: "center", padding: "1.1rem 2.4rem", borderRadius: 12, background: "var(--gold)", color: "#07090e", fontWeight: 800, fontSize: "1.05rem" }}>
                📅 Book My Free Consultation →
              </a>
              <a href="#strategy" style={{ display: "inline-flex", alignItems: "center", padding: "1.1rem 2.4rem", borderRadius: 12, border: "1.5px solid rgba(255,255,255,0.2)", color: "var(--text)", fontSize: "1.05rem", fontWeight: 700 }}>
                See How It Works
              </a>
            </div>
            <div className="fu d4" style={{ fontSize: "0.8rem", color: "var(--muted)", marginBottom: "2rem" }}>
              🔒 100% free · No pressure · No sales pitch · Just clarity
            </div>
            <div className="fu d5" style={{ display: "flex", gap: 0, paddingTop: "2.5rem", borderTop: "1px solid var(--border)", flexWrap: "wrap" }}>
              {[["Ph.D.","Scientist & Author"],["30+","Expert Team"],["$160K","College Saved — 1 Client"],["$0","Tax — It's Possible"]].map(([num, lbl]) => (
                <div key={lbl} style={{ flex: 1, minWidth: 90, paddingRight: "2rem", borderRight: "1px solid var(--border)", marginRight: "2rem" }}>
                  <div style={{ fontSize: "2rem", fontWeight: 900, color: "var(--gold)", letterSpacing: "-1px", lineHeight: 1 }}>{num}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1.5px", marginTop: "0.3rem" }}>{lbl}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: pain card */}
          <div className="fu d3" style={{ background: "var(--card)", border: "1px solid rgba(240,180,41,0.15)", borderRadius: 22, padding: "2.25rem", position: "relative", overflow: "hidden" }}>
            <div style={{ fontWeight: 800, fontSize: "1.05rem", marginBottom: "1.5rem" }}>😔 Does any of this sound familiar?</div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.8rem", marginBottom: "1.5rem" }}>
              {["Working hard but savings keep shrinking","Paying too much in taxes — every single year","Terrified you'll outlive your retirement money","College costs threatening your family's future","Stocks and real estate feel like gambling","No real plan to leave generational wealth behind","Financial advisors giving you generic advice"].map(item => (
                <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", fontSize: "0.93rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>
                  <span style={{ color: "#ef4444", fontWeight: 900, flexShrink: 0, marginTop: "0.15rem" }}>✗</span>{item}
                </li>
              ))}
            </ul>
            <div style={{ padding: "1rem 1.25rem", borderRadius: 10, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", fontSize: "0.88rem", color: "var(--green)", fontWeight: 700, lineHeight: 1.5 }}>
              ✓ MaxLife solves every one of these —{" "}
              <span style={{ color: "rgba(255,255,255,0.55)", fontWeight: 400 }}>without stocks, real estate, or guessing your financial future.</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

function ProofTicker() {
  const items = [...proofItems, ...proofItems];
  return (
    <div style={{ background: "var(--surf)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", overflow: "hidden", position: "relative" }}>
      <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: 80, background: "linear-gradient(90deg, var(--surf), transparent)", zIndex: 2, pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: 80, background: "linear-gradient(-90deg, var(--surf), transparent)", zIndex: 2, pointerEvents: "none" }} />
      <div style={{ display: "flex", animation: "ticker 28s linear infinite", width: "max-content" }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "1.3rem 2.5rem", borderRight: "1px solid var(--border)", whiteSpace: "nowrap", flexShrink: 0 }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--gold)", letterSpacing: "-0.5px" }}>{item.num}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1px" }}>{item.lbl}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EquationSection() {
  return (
    <section id="strategy" style={{ padding: "6rem 0", background: "var(--surf)" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 2rem" }}>
        <div className="reveal" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "3.5px", textTransform: "uppercase", color: "var(--gold)", marginBottom: "0.75rem" }}>The MaxLife Framework</div>
          <h2 style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)", fontWeight: 900, letterSpacing: "-1.5px", lineHeight: 1.05, marginBottom: "1rem" }}>
            Your wealth has 8 variables.<br />Most people only manage 2.
          </h2>
          <p style={{ fontSize: "1.1rem", color: "var(--muted)", lineHeight: 1.8, maxWidth: 620, margin: "0 auto" }}>
            Traditional advisors focus on income and returns. The Universal Wealth Equation — Tim Bao&apos;s original framework — optimizes all 8 simultaneously.
          </p>
        </div>
        <div className="reveal" style={{ background: "var(--card)", border: "1px solid rgba(240,180,41,0.18)", borderRadius: 20, padding: "2.5rem", textAlign: "center", fontSize: "clamp(0.95rem, 2.2vw, 1.45rem)", fontWeight: 900, lineHeight: 1.6, margin: "2.5rem 0", boxShadow: "0 0 80px rgba(240,180,41,0.06)" }}>
          <span style={{ color: "var(--gold)" }}>Wealth</span> = Income + Investment + <span style={{ color: "var(--gold)" }}>Leverage</span><br />
          − Spending − <span style={{ color: "var(--gold)" }}>Taxes</span> − Risk − Inflation − <span style={{ color: "#f87171" }}>Labor</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "1.2rem" }}>
          {[["1","Grow","Market-linked accumulation with a 0% floor — upside without the downside."],["2","Borrow","Access your capital tax-free without interrupting compounding. Earn while you spend."],["3","Protect","Combine wealth building with family protection and guaranteed estate value."],["4","Legacy","Coordinate retirement income, charitable giving, and multigenerational wealth transfer."]].map(([num, title, desc], i) => (
            <div key={num} className={`reveal reveal-delay-${i + 1}`} style={{ background: "var(--card2)", border: "1px solid var(--border)", borderRadius: 14, padding: "1.5rem", display: "flex", gap: "1rem", alignItems: "flex-start" }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", flexShrink: 0, background: "rgba(240,180,41,0.14)", color: "var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>{num}</div>
              <div>
                <strong style={{ display: "block", fontSize: "1rem", marginBottom: "0.25rem" }}>{title}</strong>
                <small style={{ color: "var(--muted)", fontSize: "0.84rem", lineHeight: 1.6 }}>{desc}</small>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SolutionsSection() {
  return (
    <section style={{ padding: "7rem 0" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 2rem" }}>
        <div className="reveal" style={{ textAlign: "center", marginBottom: "3rem" }}>
          <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "3.5px", textTransform: "uppercase", color: "var(--gold)", marginBottom: "0.75rem" }}>What MaxLife does for you</div>
          <h2 style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)", fontWeight: 900, letterSpacing: "-1.5px", lineHeight: 1.05, marginBottom: "1rem" }}>Six problems.<br />One unified strategy.</h2>
          <p style={{ fontSize: "1.1rem", color: "var(--muted)", maxWidth: 580, margin: "0 auto" }}>Every piece of the MaxLife Strategy is mathematically validated — not just hoped for.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
          {solutions.map((s, i) => (
            <div key={s.title} className={`reveal reveal-delay-${(i % 3) + 1}`} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 18, padding: "2rem", position: "relative", overflow: "hidden", transition: "border-color 0.2s, transform 0.2s" }}>
              <span style={{ fontSize: "2.2rem", display: "block", marginBottom: "1rem" }}>{s.icon}</span>
              <h4 style={{ fontSize: "1.05rem", fontWeight: 800, marginBottom: "0.6rem", textTransform: "capitalize" }}>{s.title}</h4>
              <p style={{ fontSize: "0.9rem", color: "var(--muted)", lineHeight: 1.75, marginBottom: "1rem" }}>{s.body}</p>
              <div style={{ padding: "0.6rem 0.9rem", borderRadius: 8, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", fontSize: "0.8rem", color: "var(--green)", fontWeight: 700 }}>✓ {s.result}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section id="proof" style={{ padding: "7rem 0", background: "var(--surf)" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 2rem" }}>
        <div className="reveal" style={{ textAlign: "center", marginBottom: "3rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem", marginBottom: "0.75rem" }}>
            <span style={{ color: "var(--gold)", letterSpacing: 2, fontSize: "1.1rem" }}>★★★★★</span>
            <span style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "3.5px", textTransform: "uppercase", color: "var(--gold)" }}>Real Clients. Verified Results.</span>
          </div>
          <h2 style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)", fontWeight: 900, letterSpacing: "-1.5px", lineHeight: 1.05 }}>What happens when you<br />stop guessing and start engineering</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
          {testimonials.map((t, i) => (
            <div key={t.name} className={`reveal reveal-delay-${(i % 3) + 1}`} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 18, padding: "2rem", position: "relative" }}>
              <div style={{ position: "absolute", top: "0.75rem", right: "1.5rem", fontSize: "5rem", color: "rgba(240,180,41,0.1)", fontFamily: "Georgia, serif", lineHeight: 1, pointerEvents: "none" }}>&quot;</div>
              <div style={{ color: "var(--gold)", fontSize: "0.85rem", marginBottom: "1rem", letterSpacing: 2 }}>★★★★★</div>
              <p style={{ fontSize: "0.93rem", color: "rgba(255,255,255,0.68)", lineHeight: 1.8, marginBottom: "1.5rem", fontStyle: "italic" }}>&ldquo;{t.quote}&rdquo;</p>
              <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                <div style={{ width: 42, height: 42, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg, rgba(240,180,41,0.3), rgba(59,130,246,0.2))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>{t.avatar}</div>
                <div>
                  <div style={{ fontSize: "0.88rem", fontWeight: 700 }}>{t.name}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--muted)" }}>{t.role}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--green)", fontWeight: 700, marginTop: "0.15rem" }}>{t.result}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AboutSection() {
  return (
    <section id="about" style={{ padding: "7rem 0" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 2rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: "5rem", alignItems: "start" }}>

          {/* Left: authority card */}
          <div className="reveal" style={{ background: "var(--card)", border: "1px solid rgba(240,180,41,0.2)", borderRadius: 24, padding: "2.5rem", textAlign: "center", position: "sticky", top: 100 }}>
            <div style={{ width: 160, height: 160, borderRadius: 22, margin: "0 auto 1.5rem", background: "linear-gradient(135deg, rgba(240,180,41,0.22), rgba(59,130,246,0.18))", border: "1px solid rgba(240,180,41,0.2)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontSize: "4rem", gap: "0.4rem", boxShadow: "0 24px 48px rgba(0,0,0,0.5)" }}>
              <span>👨‍🔬</span>
              <small style={{ fontSize: "0.72rem", color: "var(--gold)", fontWeight: 700, letterSpacing: 1 }}>Tim Bao, Ph.D.</small>
            </div>
            <div style={{ fontSize: "1.2rem", fontWeight: 900, marginBottom: "0.3rem" }}>Tim Bao, Ph.D.</div>
            <div style={{ fontSize: "0.83rem", color: "var(--muted)", marginBottom: "1.5rem", lineHeight: 1.6 }}>Scientist · Strategist · Author<br />Creator of the MaxLife Strategy</div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.6rem", textAlign: "left" }}>
              {["Ph.D. scientist with 25 years of R&D experience","Author of Personal Finance Reinvented","Creator of the Universal Wealth Equation","30+ advisors, CPAs, attorneys & specialists","Clients in TX, CA, FL, ND, and beyond"].map(item => (
                <li key={item} style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.7)", display: "flex", gap: "0.6rem" }}>
                  <span style={{ color: "var(--gold)", fontWeight: 900, flexShrink: 0 }}>✓</span>{item}
                </li>
              ))}
            </ul>
            <div style={{ marginTop: "1.5rem", background: "var(--bg)", border: "1px solid rgba(240,180,41,0.2)", borderRadius: 12, padding: "1rem 1.2rem", textAlign: "center" }}>
              <strong style={{ display: "block", color: "var(--gold)", fontSize: "0.85rem", marginBottom: "0.3rem" }}>📘 Personal Finance Reinvented</strong>
              <span style={{ fontSize: "0.78rem", color: "var(--muted)", lineHeight: 1.5 }}>Multimillion-Dollar Mindshift for Maximum Lifetime Wealth · 337 pages · 20+ real client cases</span>
            </div>
          </div>

          {/* Right: text */}
          <div>
            <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "3.5px", textTransform: "uppercase", color: "var(--gold)", marginBottom: "0.75rem" }}>About Tim</div>
            <h2 className="reveal" style={{ fontSize: "clamp(2rem, 3.5vw, 3rem)", fontWeight: 900, letterSpacing: "-1px", lineHeight: 1.05, marginBottom: "1rem" }}>A scientist who stopped accepting<br />bad financial advice</h2>
            <p className="reveal" style={{ color: "var(--muted)", fontSize: "1.02rem", lineHeight: 1.85, marginBottom: "1rem" }}>
              Tim Bao, Ph.D. isn&apos;t a typical financial advisor. He&apos;s a research scientist who spent 25 years applying first-principles thinking to complex problems — and turned that same rigor on personal finance.
            </p>
            <p className="reveal" style={{ color: "var(--muted)", fontSize: "1.02rem", lineHeight: 1.85, marginBottom: "1rem" }}>
              What he found shocked him: <strong style={{ color: "var(--text)" }}>most financial advice is built on assumptions, not math.</strong> He set out to fix that. The result is the <strong style={{ color: "var(--text)" }}>Universal Wealth Equation (UWE)</strong> — the first comprehensive framework that maps your entire financial life in a single, unified equation.
            </p>
            <div className="reveal" style={{ background: "var(--card)", borderLeft: "3px solid var(--gold)", borderRadius: "0 12px 12px 0", padding: "1.5rem 1.75rem", margin: "2rem 0", fontSize: "1rem", color: "rgba(255,255,255,0.72)", fontStyle: "italic", lineHeight: 1.75 }}>
              &ldquo;Tim has such novel and unique approaches. He researched beyond the obvious solutions you hear everywhere. His views will make you rethink everything you are doing for years. I place him among the top minds in modern personal finance.&rdquo;
              <cite style={{ display: "block", marginTop: "0.75rem", fontStyle: "normal", fontSize: "0.8rem", color: "var(--muted)" }}>— Wei H., Program Manager, California</cite>
            </div>
            <p className="reveal" style={{ color: "var(--muted)", fontSize: "1.02rem", lineHeight: 1.85, marginBottom: "1rem" }}>
              The <strong style={{ color: "var(--text)" }}>MaxLife Strategy</strong> integrates the Self-Owned Bank, Self-Funded Pension, Self-Directed Charity, Buy-Borrow-Die, and Infinite Finance — tools previously only available to the ultra-wealthy. Tim and his team of 30+ experts make them accessible to everyday Americans.
            </p>
            <p className="reveal" style={{ color: "var(--muted)", fontSize: "1.02rem", lineHeight: 1.85 }}>
              Tim lives with his wife Sharon and their five children — Maxwell, Mason, Mary, Manna, and Maria — the daily motivation behind his mission to change how America thinks about money.
            </p>
            <div className="reveal" style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "1.5rem" }}>
              {["Universal Wealth Equation","Self-Owned Bank","Buy-Borrow-Die","Tax-Free Wealth","Self-Funded Pension","Family Foundation"].map(chip => (
                <span key={chip} style={{ background: "rgba(240,180,41,0.1)", color: "var(--gold)", border: "1px solid rgba(240,180,41,0.2)", borderRadius: 6, padding: "0.3rem 0.85rem", fontSize: "0.78rem", fontWeight: 600 }}>{chip}</span>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

function AudienceSection() {
  return (
    <section style={{ padding: "6rem 0", background: "var(--surf)" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 2rem" }}>
        <div className="reveal" style={{ textAlign: "center", marginBottom: "3rem" }}>
          <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "3.5px", textTransform: "uppercase", color: "var(--gold)", marginBottom: "0.75rem" }}>Is this for you?</div>
          <h2 style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)", fontWeight: 900, letterSpacing: "-1.5px", lineHeight: 1.05 }}>MaxLife is designed for people<br />who are done settling</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))", gap: "1.5rem" }}>
          {audience.map((a, i) => (
            <div key={a.title} className={`reveal reveal-delay-${i + 1}`} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 18, padding: "2rem" }}>
              <span style={{ fontSize: "2.5rem", display: "block", marginBottom: "1rem" }}>{a.icon}</span>
              <h4 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--gold)", marginBottom: "0.6rem", textTransform: "capitalize" }}>{a.title}</h4>
              <p style={{ fontSize: "0.9rem", color: "var(--muted)", lineHeight: 1.75 }}>{a.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ServicesSection() {
  return (
    <section id="services" style={{ padding: "7rem 0" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 2rem" }}>
        <div className="reveal" style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "3.5px", textTransform: "uppercase", color: "var(--gold)", marginBottom: "0.75rem" }}>MaxLife Academy services</div>
          <h2 style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)", fontWeight: 900, letterSpacing: "-1.5px", lineHeight: 1.05 }}>Everything you need for a<br />complete financial transformation</h2>
          <p style={{ fontSize: "1.1rem", color: "var(--muted)", maxWidth: 580, margin: "0 auto", marginTop: "1rem" }}>Eight integrated services. One unified strategy. All grounded in the Universal Wealth Equation.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
          {services.map((s, i) => (
            <div key={s.title} className={`reveal reveal-delay-${(i % 3) + 1}`} style={{ background: "var(--card2)", border: "1px solid var(--border)", borderRadius: 18, padding: "2rem" }}>
              <span style={{ fontSize: "2.2rem", display: "block", marginBottom: "1rem" }}>{s.icon}</span>
              <h4 style={{ fontSize: "1.05rem", fontWeight: 800, marginBottom: "0.5rem", textTransform: "capitalize" }}>{s.title}</h4>
              <p style={{ fontSize: "0.88rem", color: "var(--muted)", lineHeight: 1.75 }}>{s.body}</p>
            </div>
          ))}
        </div>
        <div className="reveal" style={{ marginTop: "4rem", borderRadius: 22, overflow: "hidden", background: "linear-gradient(135deg, rgba(59,130,246,0.12), rgba(240,180,41,0.09))", border: "1px solid rgba(255,255,255,0.07)", padding: "3.5rem", textAlign: "center" }}>
          <h3 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 900, marginBottom: "1rem" }}>Our mission</h3>
          <p style={{ color: "var(--muted)", maxWidth: 640, margin: "0 auto", fontSize: "1.05rem", lineHeight: 1.8 }}>
            Elite financial strategies should never be a privilege of the wealthy few. MaxLife Academy exists to make financial freedom accessible to every American family — through science, math, and relentless innovation. We donate 20% of profits to foundations supporting education and the elderly, because true wealth always includes giving back.
          </p>
        </div>
      </div>
    </section>
  );
}

function ContactSection() {
  return (
    <section id="contact" style={{ padding: "7rem 0", background: "var(--surf)" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 2rem" }}>
        <div className="reveal">
          <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "3.5px", textTransform: "uppercase", color: "var(--gold)", marginBottom: "0.75rem" }}>Get in touch</div>
          <h2 style={{ fontSize: "clamp(2rem, 3.5vw, 3rem)", fontWeight: 900, letterSpacing: "-1px", lineHeight: 1.05, marginBottom: "3.5rem" }}>Ready to reinvent<br />your financial life?</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "4rem", alignItems: "start" }}>

          {/* Left */}
          <div className="reveal">
            <p style={{ color: "var(--muted)", lineHeight: 1.82, marginBottom: "1.5rem", fontSize: "1.02rem" }}>
              Whether you want to explore the MaxLife Strategy, have a question about the book, or are ready for a full strategy review — reach out and Dr. Bao will get back to you personally.
            </p>
            <p style={{ color: "var(--gold)", fontWeight: 700, fontSize: "0.95rem", marginBottom: "2rem" }}>The conversation is free. The results are not.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {[
                ["mailto:pfs.bao@gmail.com","✉️","Email","pfs.bao@gmail.com"],
                ["tel:+14699759368","📞","Phone","+1 (469) 975-9368"],
                ["https://calendly.com/timbao","📅","Schedule","Book a Free Zoom Call"],
                ["https://sites.google.com/view/maxfund","🌐","Website","MaxLife Academy"],
              ].map(([href, icon, lbl, val]) => (
                <a key={href} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: "1rem", color: "var(--muted)", fontSize: "0.9rem", padding: "1rem 1.3rem", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 11, transition: "all 0.22s" }}>
                  <span style={{ fontSize: "1.4rem", flexShrink: 0 }}>{icon}</span>
                  <div>
                    <div style={{ fontSize: "0.68rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1 }}>{lbl}</div>
                    <div style={{ fontSize: "0.9rem", color: "var(--text)", fontWeight: 600, marginTop: "0.15rem" }}>{val}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Right: form */}
          <div className="reveal reveal-delay-2" style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 22, padding: "2.75rem" }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "var(--green)", marginBottom: "0.5rem" }}>100% FREE · NO OBLIGATION</div>
            <div style={{ fontSize: "1.4rem", fontWeight: 900, marginBottom: "1.75rem", letterSpacing: "-0.5px" }}>Request your strategy session</div>
            <LeadForm />
          </div>

        </div>
        <p style={{ fontSize: "0.8rem", color: "var(--muted)", maxWidth: 860, margin: "3rem auto 0", textAlign: "center", lineHeight: 1.75 }}>
          Educational information only. Not tax, legal, investment, or individualized financial advice. Life insurance and annuity strategies must be properly designed, funded, monitored, and evaluated for suitability. Policy loans and withdrawals may reduce cash value and death benefit and may cause tax consequences if a policy lapses or is surrendered. Results shown are from real clients; individual results vary. Consult licensed tax, legal, and financial professionals before implementation.
        </p>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section style={{ padding: "8rem 0", background: "radial-gradient(ellipse at 50% 0%, rgba(240,180,41,0.15) 0%, transparent 60%), var(--bg)" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 2rem" }}>
        <div className="reveal" style={{ background: "var(--card)", border: "1px solid rgba(240,180,41,0.22)", borderRadius: 28, padding: "5rem 4rem", textAlign: "center", boxShadow: "0 0 120px rgba(240,180,41,0.08)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -2, left: "10%", right: "10%", height: 2, background: "linear-gradient(90deg, transparent, var(--gold), transparent)" }} />
          <h2 style={{ fontSize: "clamp(2rem, 4.5vw, 3.5rem)", fontWeight: 900, letterSpacing: "-2px", marginBottom: "1rem", lineHeight: 1.05 }}>
            Your breakthrough starts with{" "}
            <span style={{ background: "linear-gradient(135deg, var(--gold), var(--gold2))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>one decision.</span>
          </h2>
          <p style={{ fontSize: "1.15rem", color: "var(--muted)", maxWidth: 560, margin: "0 auto 3rem", lineHeight: 1.8 }}>
            Every day you wait, the system takes more from you. One free conversation with Dr. Tim Bao can change everything — for your family, your retirement, and your legacy.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
            <a href="https://calendly.com/timbao" target="_blank" rel="noreferrer" className="pulse" style={{ display: "inline-flex", alignItems: "center", padding: "1.1rem 2.4rem", borderRadius: 12, background: "var(--gold)", color: "#07090e", fontWeight: 800, fontSize: "1.05rem" }}>
              📅 Book My Free Zoom Call →
            </a>
            <a href="tel:+14699759368" style={{ display: "inline-flex", alignItems: "center", padding: "1.1rem 2.4rem", borderRadius: 12, border: "1.5px solid rgba(255,255,255,0.2)", color: "var(--text)", fontSize: "1.05rem", fontWeight: 700 }}>
              Call +1 (469) 975-9368
            </a>
          </div>
          <div style={{ marginTop: "1.75rem", fontSize: "0.82rem", color: "var(--muted)" }}>
            🔒 Free · No pressure · No sales pitch · Just math, science, and clarity
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{ textAlign: "center", padding: "2.5rem 2rem", color: "var(--muted)", fontSize: "0.83rem", borderTop: "1px solid var(--border)" }}>
      © 2026 Tim Bao, Ph.D. &nbsp;·&nbsp;{" "}
      <a href="https://sites.google.com/view/maxfund" target="_blank" rel="noreferrer" style={{ color: "var(--gold)" }}>MaxLife Academy of Personal Finance Science</a>
      &nbsp;·&nbsp; +1 (469) 975-9368 &nbsp;·&nbsp; pfs.bao@gmail.com
    </footer>
  );
}

/* ─── PAGE ──────────────────────────────────────────────── */

export default function Home() {
  return (
    <>
      <NavBar />
      <Hero />
      <ProofTicker />
      <EquationSection />
      <SolutionsSection />
      <TestimonialsSection />
      <AboutSection />
      <AudienceSection />
      <ServicesSection />
      <ContactSection />
      <FinalCTA />
      <Footer />
      <script
        dangerouslySetInnerHTML={{
          __html: `
            const obs = new IntersectionObserver(entries => {
              entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
            }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
            document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
          `,
        }}
      />
    </>
  );
}
