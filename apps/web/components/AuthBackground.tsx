export default function AuthBackground() {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      {/* Aurora ribbons */}
      <div style={{ position: "absolute", left: "-10%", right: "-10%", top: "5%", height: 200, background: "linear-gradient(180deg,rgba(126,154,134,0) 0%,rgba(126,154,134,.22) 45%,rgba(126,154,134,0) 100%)", filter: "blur(38px)" }} />
      <div style={{ position: "absolute", left: "-10%", right: "-10%", top: 0, height: 150, background: "linear-gradient(180deg,rgba(91,155,209,0) 0%,rgba(91,155,209,.18) 50%,rgba(91,155,209,0) 100%)", filter: "blur(44px)" }} />

      {/* Stars */}
      {([
        { l:"8%",  t:"12%", sz:2, glow:true  },
        { l:"17%", t:"8%",  sz:2, glow:false },
        { l:"26%", t:"20%", sz:2, glow:false },
        { l:"34%", t:"5%",  sz:3, glow:true  },
        { l:"42%", t:"14%", sz:2, glow:false },
        { l:"50%", t:"4%",  sz:2, glow:false },
        { l:"58%", t:"9%",  sz:2, glow:false },
        { l:"66%", t:"19%", sz:3, glow:true  },
        { l:"75%", t:"7%",  sz:2, glow:false },
        { l:"83%", t:"24%", sz:2, glow:false },
        { l:"91%", t:"11%", sz:2, glow:false },
        { l:"22%", t:"6%",  sz:2, glow:false },
        { l:"62%", t:"5%",  sz:2, glow:false },
        { l:"88%", t:"6%",  sz:2, glow:false },
      ] as const).map((s, i) => (
        <div key={i} style={{ position: "absolute", left: s.l, top: s.t, width: s.sz, height: s.sz, borderRadius: "50%", background: "#F3ECDF", opacity: .75, boxShadow: s.glow ? "0 0 5px rgba(243,236,223,.9)" : undefined }} />
      ))}

      {/* Shooting star */}
      <div style={{ position: "absolute", left: "71%", top: "6%", width: 80, height: 1, borderRadius: 2, background: "linear-gradient(90deg,rgba(243,236,223,.75),rgba(243,236,223,0))", opacity: .55 }} />

      {/* Moon */}
      <div style={{ position: "absolute", left: "67%", top: 42, width: 116, height: 116 }}>
        <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "radial-gradient(circle,#F0EAD8 0%,#C9C7B4 46%,rgba(201,199,180,0) 68%)" }} />
      </div>
      <div style={{ position: "absolute", left: "calc(67% - 14px)", top: 28, width: 144, height: 144, borderRadius: "50%", background: "radial-gradient(circle,rgba(240,234,216,.16) 0%,rgba(240,234,216,0) 65%)", filter: "blur(14px)" }} />

      {/* Far mountains */}
      <div style={{ position: "absolute", left: 0, bottom: 130, width: "100%", height: 180, opacity: .55, filter: "blur(1px)", background: "#1A2640", clipPath: "polygon(0 76%,6% 56%,12% 70%,19% 40%,26% 62%,33% 34%,41% 60%,48% 46%,56% 66%,63% 42%,71% 64%,79% 36%,87% 60%,94% 48%,100% 76%,100% 100%,0 100%)" }} />

      {/* Mid hills */}
      <div style={{ position: "absolute", left: 0, bottom: 54, width: "100%", height: 190, background: "#142030", clipPath: "polygon(0 70%,10% 52%,20% 64%,30% 44%,42% 62%,52% 48%,64% 66%,74% 50%,86% 64%,94% 54%,100% 70%,100% 100%,0 100%)" }} />

      {/* Near ridge */}
      <div style={{ position: "absolute", left: 0, bottom: 0, width: "100%", height: 160, background: "#0F1A28", clipPath: "polygon(0 58%,8% 44%,16% 56%,26% 34%,36% 52%,46% 30%,56% 50%,66% 32%,76% 52%,86% 36%,94% 50%,100% 58%,100% 100%,0 100%)" }} />

      {/* Trees layer */}
      <div style={{ position: "absolute", left: 0, bottom: 0, width: "100%", height: 130 }}>
        {/* Pine left */}
        <div style={{ position: "absolute", left: "5%", bottom: 0, width: 30, height: 100 }}>
          <div style={{ position: "absolute", inset: 0, background: "#0A1520", clipPath: "polygon(50% 0,100% 100%,0 100%)" }} />
        </div>
        {/* Round tree */}
        <div style={{ position: "absolute", left: "22%", bottom: 0, width: 44, height: 90 }}>
          <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: 0, width: 6, height: 36, background: "#0A1520" }} />
          <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: 26, width: 42, height: 42, borderRadius: "50%", background: "#0A1520" }} />
        </div>
        {/* Cherry blossom */}
        <div style={{ position: "absolute", left: "40%", bottom: 0, width: 72, height: 130 }}>
          <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: 0, width: 8, height: 64, background: "#0A1520", borderRadius: "3px 3px 0 0" }} />
          <div style={{ position: "absolute", left: 22, bottom: 50, width: 3, height: 32, background: "#0A1520", transform: "rotate(-30deg)", transformOrigin: "bottom center" }} />
          <div style={{ position: "absolute", left: 42, bottom: 50, width: 3, height: 26, background: "#0A1520", transform: "rotate(30deg)", transformOrigin: "bottom center" }} />
          <div style={{ position: "absolute", left: 2, top: 0, width: 68, height: 68, borderRadius: "50%", background: "rgba(255,182,193,.45)", filter: "blur(6px)" }} />
          <div style={{ position: "absolute", left: 10, top: 8, width: 52, height: 54, borderRadius: "50%", background: "rgba(245,160,178,.52)", filter: "blur(3px)" }} />
          <div style={{ position: "absolute", left: 18, top: 14, width: 36, height: 40, borderRadius: "50%", background: "rgba(255,190,200,.62)" }} />
        </div>
        {/* Pine right */}
        <div style={{ position: "absolute", left: "66%", bottom: 0, width: 28, height: 88 }}>
          <div style={{ position: "absolute", inset: 0, background: "#0A1520", clipPath: "polygon(50% 0,100% 100%,0 100%)" }} />
        </div>
        {/* Round tree right */}
        <div style={{ position: "absolute", left: "82%", bottom: 0, width: 38, height: 78 }}>
          <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: 0, width: 5, height: 30, background: "#0A1520" }} />
          <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: 22, width: 36, height: 36, borderRadius: "50%", background: "#0A1520" }} />
        </div>
        {/* Small pine far right */}
        <div style={{ position: "absolute", left: "93%", bottom: 0, width: 24, height: 72 }}>
          <div style={{ position: "absolute", inset: 0, background: "#0A1520", clipPath: "polygon(50% 0,100% 100%,0 100%)" }} />
        </div>
      </div>

      {/* Foreground pines */}
      <div style={{ position: "absolute", left: 0, bottom: 0, width: "100%", height: 110, background: "#060E18", clipPath: "polygon(0 100%,4% 62%,8% 100%,15% 50%,22% 100%,31% 68%,40% 100%,52% 56%,63% 100%,74% 64%,85% 100%,93% 72%,100% 100%)" }} />
    </div>
  );
}
