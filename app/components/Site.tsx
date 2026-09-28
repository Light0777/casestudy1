"use client";

import { useEffect, useRef, useState } from "react";
import {
  COMPANY, NAV, SERVICES, PROJECTS, CATEGORIES, STEPS, TECH, WHY, TESTIMONIALS, artBg,
  type Project,
} from "../data";
import TowerViewer from "./TowerViewer";

function useReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll(".rv"));
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }),
      { threshold: 0.12 }
    );
    els.forEach((el, i) => {
      (el as HTMLElement).style.transitionDelay = `${(i % 4) * 60}ms`;
      io.observe(el);
    });
    return () => io.disconnect();
  }, []);
}

function Counter({ to, decimals = 0, suffix = "" }: { to: number; decimals?: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState("0" + suffix);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const io = new IntersectionObserver(
      (es) => {
        if (!es[0].isIntersecting) return;
        io.disconnect();
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          setVal(to.toFixed(decimals) + suffix);
          return;
        }
        const t0 = performance.now();
        const step = (n: number) => {
          const k = Math.min((n - t0) / 1600, 1);
          const v = to * (1 - Math.pow(1 - k, 3));
          setVal(v.toFixed(decimals) + suffix);
          if (k < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
      },
      { threshold: 0.6 }
    );
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [to, decimals, suffix]);
  return <span ref={ref}>{val}</span>;
}

function TechGlyph({ i }: { i: number }) {
  const k = i % 4;
  return (
    <svg viewBox="0 0 120 110" className="tech-glyph" aria-hidden="true">
      {k === 0 && (
        <g fill="none" stroke="#181011">
          <rect x="30" y="20" width="60" height="70" />
          <path d="M30 55h60M60 20v70" stroke="#aaaaaa" />
        </g>
      )}
      {k === 1 && (
        <g fill="none">
          <circle cx="60" cy="55" r="32" stroke="#181011" />
          <ellipse cx="60" cy="55" rx="32" ry="11" stroke="#aaaaaa" />
          <ellipse cx="60" cy="55" rx="11" ry="32" stroke="#aaaaaa" />
        </g>
      )}
      {k === 2 && (
        <g fill="none">
          <path d="M10 90L45 25l30 45 35-55" stroke="#181011" strokeWidth="1.5" />
          <path d="M10 90h100M10 90V10" stroke="#aaaaaa" />
          <circle cx="45" cy="25" r="3" fill="#181011" stroke="none" />
        </g>
      )}
      {k === 3 && (
        <g fill="none">
          <circle cx="60" cy="55" r="36" stroke="#aaaaaa" strokeDasharray="2 5" />
          <circle cx="60" cy="55" r="19" stroke="#181011" />
          <circle cx="60" cy="55" r="4" fill="#181011" stroke="none" />
        </g>
      )}
    </svg>
  );
}

function Diamond() {
  return (
    <span className="diamond-grid" aria-hidden="true">
      <i /><i /><i /><i /><i /><i /><i /><i /><i />
    </span>
  );
}

export default function Site() {
  useReveal();
  const [menu, setMenu] = useState(false);
  const [activeSec, setActiveSec] = useState("home");
  const [filter, setFilter] = useState("ALL");
  const [open, setOpen] = useState<Project | null>(null);
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const barRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const secs = NAV.map((n) => document.querySelector(n.href)).filter(Boolean) as Element[];
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) setActiveSec(`#${e.target.id}`); }),
      { rootMargin: "-40% 0px -55% 0px" }
    );
    secs.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    document.body.style.overflow = menu || open ? "hidden" : "";
  }, [menu, open]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(null); setMenu(false); }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  // testimonial autoplay
  useEffect(() => {
    let raf = 0;
    let t0 = performance.now();
    const DUR = 6500;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (paused) { t0 = now; return; }
      const f = (now - t0) / DUR;
      if (barRef.current) barRef.current.style.width = `${Math.min(f, 1) * 100}%`;
      if (f >= 1) {
        setSlide((s) => (s + 1) % TESTIMONIALS.length);
        t0 = now;
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [paused, slide]);

  function validate(form: HTMLFormElement) {
    const errs: Record<string, string> = {};
    const get = (id: string) => (form.querySelector(`#${id}`) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)?.value.trim() ?? "";
    if (!get("cf-name")) errs.name = "This field is required.";
    const em = get("cf-email");
    if (!em) errs.email = "This field is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) errs.email = "Enter a valid email address.";
    const ph = get("cf-phone");
    if (!ph) errs.phone = "This field is required.";
    else if (ph.replace(/\D/g, "").length < 8) errs.phone = "Enter a valid phone number.";
    if (!get("cf-type")) errs.type = "This field is required.";
    if (!get("cf-loc")) errs.loc = "This field is required.";
    if (!get("cf-budget")) errs.budget = "This field is required.";
    const msg = get("cf-msg");
    if (!msg) errs.msg = "This field is required.";
    else if (msg.length < 10) errs.msg = "Please share a few more details.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  const visible = PROJECTS.filter((p) => filter === "ALL" || p.category.toUpperCase() === filter);

  return (
    <>
      <header className="site-hd">
        <div className="wrap navrow">
          <a href="#home" className="logo">{COMPANY}</a>
          <ul className={`navlinks${menu ? " open" : ""}`}>
            {NAV.map((n) => (
              <li key={n.href}>
                <a href={n.href} className={activeSec === n.href ? "active" : ""} onClick={() => setMenu(false)}>
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
          <a href="#contact" className="btn quote-btn">Get a Quote</a>
          <button className="burger" aria-label="Toggle menu" aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
            <i />
          </button>
        </div>
      </header>

      <main>
        <section id="home" className="hero" aria-label="Introduction">
          <div className="wrap hero-grid">
            <div>
              <p className="intro">Building &amp; Engineering Company</p>
              <h1>Building the future.<br />Engineering excellence.</h1>
              <p className="lead">We design and build exceptional residential, commercial and industrial spaces through precision engineering, advanced construction technology and uncompromising quality.</p>
              <div className="hero-cta">
                <a className="btn" href="#projects">Explore Projects</a>
                <a className="btn" href="#contact">Start Your Project</a>
              </div>
            </div>
            <a className="hero-art" href="#experience" aria-label="Open the interactive 3D building experience">
              <svg viewBox="0 0 400 320" role="img" aria-label="Schematic of a tower under construction">
                <g fill="none" stroke="#181011" strokeWidth="1">
                  <path d="M40 290h320" />
                  <rect x="90" y="220" width="220" height="70" />
                  <rect x="140" y="40" width="120" height="250" />
                  <path d="M140 80h120M140 120h120M140 160h120M140 200h120M140 240h120M180 40v250M220 40v250" strokeOpacity="0.45" />
                  <path d="M280 40V16h80M340 16v34" strokeWidth="1.5" />
                  <circle cx="200" cy="160" r="120" strokeOpacity="0.25" />
                  <path d="M100 240h200M100 262h200" stroke="#aaaaaa" />
                </g>
              </svg>
              <span className="status-card"><b>On schedule · QA passed</b><span>Live site monitoring across all active projects.</span></span>
            </a>
          </div>
        </section>

        <section id="about" className="block">
          <div className="wrap about-grid">
            <div className="rv">
              <div className="eyebrow">About Us</div>
              <h2 className="h2">We build more than structures. We build legacies.</h2>
              <p className="sub">For over fifteen years we have delivered landmark residential, commercial and industrial buildings across South India. Our integrated team of architects, structural engineers and site professionals turns complex briefs into safe, beautiful and enduring places, on schedule and with complete transparency.</p>
              <div className="stat-grid">
                <div><b><Counter to={15} suffix="+" /></b><small>Years Experience</small></div>
                <div><b><Counter to={250} suffix="+" /></b><small>Projects Completed</small></div>
                <div><b><Counter to={180} suffix="+" /></b><small>Satisfied Clients</small></div>
                <div><b><Counter to={50} suffix="+" /></b><small>Engineering Professionals</small></div>
              </div>
            </div>
            <div className="about-visual rv">
              <svg viewBox="0 0 400 300" role="img" aria-label="Schematic facade study">
                <g fill="none" stroke="#181011" strokeWidth="1">
                  <rect x="120" y="30" width="160" height="240" />
                  <path d="M120 70h160M120 110h160M120 150h160M120 190h160M120 230h160M170 30v240M230 30v240" strokeOpacity="0.45" />
                  <path d="M40 270h320" />
                  <path d="M60 270V140l40-30v160" strokeOpacity="0.6" />
                </g>
              </svg>
              <div className="iso-card"><b>ISO 9001</b><p style={{ fontSize: "12px", color: "#666666", margin: "4px 0 0" }}>Certified quality management across every site and every stage of delivery.</p></div>
            </div>
          </div>
        </section>

        <section id="services" className="block">
          <div className="wrap">
            <div className="eyebrow">What We Do</div>
            <h2 className="h2 rv">Complete construction capability</h2>
            <p className="sub rv">Eight integrated disciplines under one accountable team.</p>
            <div className="svc-grid">
              {SERVICES.map((s, i) => (
                <article key={s.title} className="svc rv" style={{ ["--art" as string]: artBg(s.hue) }}>
                  <span className="num">0{i + 1}</span>
                  <div className="ic" aria-hidden="true">{s.icon}</div>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                  <div className="arr" aria-hidden="true">→</div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="experience" className="block exp">
          <div className="wrap">
            <div className="eyebrow">3D Experience</div>
            <h2 className="h2 rv">Walk around a sail before it exists</h2>
            <p className="sub rv">Drag to rotate, scroll or pinch to zoom, and tap a hotspot to explore each zone of this sail-form island hotel — twin masts, tensioned membrane, sky helipad and private island.</p>
            <TowerViewer />
          </div>
        </section>

        <section id="projects" className="block">
          <div className="wrap">
            <div className="eyebrow">Portfolio</div>
            <h2 className="h2 rv">Selected projects</h2>
            <div className="filters" role="group" aria-label="Filter projects">
              {CATEGORIES.map((c) => (
                <button key={c} className={filter === c ? "on" : ""} onClick={() => setFilter(c)}>{c}</button>
              ))}
            </div>
            <div className="proj-grid">
              {visible.map((p) => (
                <button key={p.name} className="proj" onClick={() => setOpen(p)} aria-label={`Open ${p.name}`}>
                  <div className="im" style={{ ["--art" as string]: artBg(p.hue), background: artBg(p.hue) }} />
                  <div className="ov">
                    <h3>{p.name}</h3>
                    <p>{p.location}</p>
                    <div className="meta">{p.category} | {p.year}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section id="process" className="block">
          <div className="wrap">
            <div className="eyebrow">How We Work</div>
            <h2 className="h2 rv">From first conversation to final handover</h2>
            <div className="timeline">
              {STEPS.map((s, i) => (
                <div key={s[0]} className="step rv">
                  <div>
                    <b>0{i + 1}</b>
                    <h3>{s[0]}</h3>
                    <p>{s[1]}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="technology" className="block">
          <div className="wrap">
            <div className="eyebrow">Technology &amp; Innovation</div>
            <h2 className="h2 rv">Engineered with data, delivered with precision</h2>
            <div className="tech-grid">
              {TECH.map((t, i) => (
                <article key={t[0]} className="tech-card rv">
                  <TechGlyph i={i} />
                  <h3>{t[0]}</h3>
                  <small>{t[1]}</small>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="why" className="block dark">
          <div className="wrap">
            <div className="eyebrow">Why Choose Us</div>
            <h2 className="h2 rv">The standard we hold ourselves to</h2>
            <div className="why-list">
              {WHY.map((w, i) => (
                <div key={w[0]} className="why-item rv">
                  <span className="idx">0{i + 1}</span>
                  <h3><Diamond />{w[0]}</h3>
                  <p>{w[1]}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="band">
          <div className="wrap band-grid">
            <div><b><Counter to={2.4} decimals={1} suffix="M" /></b><small>Sq. Ft. Built</small></div>
            <div><b><Counter to={98} suffix="%" /></b><small>On-Time Delivery</small></div>
            <div><b><Counter to={12} suffix="+" /></b><small>Industry Awards</small></div>
            <div><b>0</b><small>Compromises on Safety</small></div>
          </div>
        </div>

        <section id="testimonials" className="block">
          <div className="wrap">
            <div className="eyebrow">Testimonials</div>
            <h2 className="h2 rv">Trusted by those who build with us</h2>
            <div className="car" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
              <div className="car-track" style={{ transform: `translateX(-${slide * 100}%)` }}>
                {TESTIMONIALS.map((t) => (
                  <div key={t.name} className="slide">
                    <article>
                      <div className="avatar" aria-hidden="true">{t.name.split(" ").map((x) => x[0]).join("")}</div>
                      <div>
                        <div className="stars" aria-label="5 out of 5 stars">★★★★★</div>
                        <blockquote style={{ fontSize: "clamp(1.02rem,2vw,1.35rem)", margin: "0 0 14px" }}>“{t.quote}”</blockquote>
                        <b>{t.name}</b>
                        <div><small style={{ color: "var(--dim)" }}>{t.role}</small></div>
                      </div>
                    </article>
                  </div>
                ))}
              </div>
            </div>
            <div className="car-ctrl">
              <button aria-label="Previous testimonial" onClick={() => setSlide((s) => (s + TESTIMONIALS.length - 1) % TESTIMONIALS.length)}>←</button>
              <div className="progress"><i ref={barRef} /></div>
              <button aria-label="Next testimonial" onClick={() => setSlide((s) => (s + 1) % TESTIMONIALS.length)}>→</button>
            </div>
          </div>
        </section>

        <section id="contact" className="block">
          <div className="wrap">
            <div className="eyebrow">Contact</div>
            <h2 className="h2 rv">Let&apos;s build something exceptional.</h2>
            <div className="contact-grid">
              <div>
                {!sent ? (
                  <form
                    className="quote"
                    noValidate
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (validate(e.currentTarget)) setSent(true);
                    }}
                  >
                    <div className="field"><label htmlFor="cf-name">Full Name</label><input id="cf-name" autoComplete="name" /><span className="f-err">{errors.name ?? ""}</span></div>
                    <div className="field"><label htmlFor="cf-email">Email</label><input id="cf-email" type="email" autoComplete="email" /><span className="f-err">{errors.email ?? ""}</span></div>
                    <div className="field"><label htmlFor="cf-phone">Phone Number</label><input id="cf-phone" type="tel" autoComplete="tel" /><span className="f-err">{errors.phone ?? ""}</span></div>
                    <div className="field"><label htmlFor="cf-type">Project Type</label>
                      <select id="cf-type" defaultValue="">
                        <option value="">Select type</option><option>Residential</option><option>Commercial</option><option>Industrial</option><option>Infrastructure</option><option>Renovation</option>
                      </select><span className="f-err">{errors.type ?? ""}</span></div>
                    <div className="field"><label htmlFor="cf-loc">Project Location</label><input id="cf-loc" /><span className="f-err">{errors.loc ?? ""}</span></div>
                    <div className="field"><label htmlFor="cf-budget">Estimated Budget</label>
                      <select id="cf-budget" defaultValue="">
                        <option value="">Select range</option><option>Under ₹1 Cr</option><option>₹1 – 5 Cr</option><option>₹5 – 25 Cr</option><option>₹25 Cr+</option>
                      </select><span className="f-err">{errors.budget ?? ""}</span></div>
                    <div className="field wide"><label htmlFor="cf-msg">Message</label><textarea id="cf-msg" rows={4} /><span className="f-err">{errors.msg ?? ""}</span></div>
                    <div className="field wide"><button className="btn fill" type="submit">Request Consultation</button></div>
                  </form>
                ) : (
                  <div className="success" role="status" tabIndex={-1}>
                    <h3>Thank you.</h3>
                    <p>Your consultation request has been received. A senior project engineer will contact you within one business day.</p>
                  </div>
                )}
              </div>
              <div>
                <div className="c-row"><small>Head Office</small><div>Coimbatore, Tamil Nadu, India</div></div>
                <div className="c-row"><small>Phone</small><div>+91 XXX XXX XXXX</div></div>
                <div className="c-row"><small>Email</small><div>info@company.com</div></div>
                <div className="c-row"><small>Working Hours</small><div>Monday – Saturday<br />9:00 AM – 6:00 PM</div></div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="site">
        <div className="wrap">
          <div className="foot-grid">
            <div>
              <a href="#home" className="logo">{COMPANY}</a>
              <p style={{ marginTop: 14, maxWidth: "26em" }}>Premium building construction and engineering, delivering residential, commercial and industrial projects with precision, safety and integrity.</p>
            </div>
            <nav aria-label="Footer"><h4>Navigate</h4><ul><li><a href="#about">About</a></li><li><a href="#projects">Projects</a></li><li><a href="#experience">3D Experience</a></li><li><a href="#process">Process</a></li></ul></nav>
            <div><h4>Services</h4><ul><li><a href="#services">Residential</a></li><li><a href="#services">Commercial</a></li><li><a href="#services">Industrial</a></li><li><a href="#services">Turnkey</a></li></ul></div>
            <div><h4>Contact</h4><ul><li><p>Coimbatore, Tamil Nadu</p></li><li><p>+91 XXX XXX XXXX</p></li><li><p>info@company.com</p></li></ul></div>
          </div>
          <div className="giant" aria-hidden="true">{COMPANY} — BUILD · ENGINEER · DELIVER</div>
          <div className="copy"><span>© {new Date().getFullYear()} {COMPANY}. All rights reserved.</span><span><a href="#">Privacy Policy</a> · <a href="#">Terms</a></span></div>
        </div>
      </footer>

      <div className={`modal${open ? " open" : ""}`} role="dialog" aria-modal="true">
        {open && (
          <>
            <button className="modal-x" aria-label="Close project" onClick={() => setOpen(null)}>×</button>
            <div className="modal-hero" style={{ background: artBg(open.hue) }} />
            <article className="modal-body">
              <div className="eyebrow">{open.category} · {open.year}</div>
              <h2 className="h2">{open.name}</h2>
              <p className="sub">{open.summary}</p>
              <div className="spec">
                {[["Location", open.location], ["Area", open.area], ["Scale", open.scale], ["Duration", open.duration], ["System", open.system]].map(([k, v]) => (
                  <div key={k}><small>{k}</small><b>{v}</b></div>
                ))}
              </div>
            </article>
          </>
        )}
      </div>
    </>
  );
}
