"use client";

import { useState, useEffect } from "react";

interface Ad {
  headline: string;
  body: string;
  disclaimer: string;
  borderColor: string;
  bgGradient: string;
  accentText: string;
}

const ADS: Ad[] = [
  {
    headline: "KLARNA: Split your suffering into 12 easy payments",
    body: "Why pay all at once when you can spread the misery? Interest rates starting at 29.9% APR. Your future self will understand.",
    disclaimer:
      "* Failure to pay installments may result in organ collateral evaluation. Klarna is a registered debt partner of OmniCorp Residential.",
    borderColor: "border-accent-klarna",
    bgGradient: "from-accent-klarna/5 to-transparent",
    accentText: "text-accent-klarna",
  },
  {
    headline: "UPGRADE TO PLATINUM \u2014 Breathe premium oxygen today",
    body: "Platinum residents enjoy 40% more breathable air, reduced surveillance hours, and a complimentary window view simulation.",
    disclaimer:
      "* Oxygen quality claims based on corporate-funded studies. Downgrade penalties apply. Tier reassignment is final.",
    borderColor: "border-purple-500",
    bgGradient: "from-purple-500/5 to-transparent",
    accentText: "text-purple-400",
  },
  {
    headline: "REPORT A NEIGHBOR \u2014 Earn 50 social credits instantly",
    body: "See something? Say something. Anonymous tips about lease violations, unauthorized guests, or suspicious happiness are rewarded generously.",
    disclaimer:
      "* Credits awarded after investigation confirms violation. False reports may result in counter-penalties. Anonymity not guaranteed.",
    borderColor: "border-green-500",
    bgGradient: "from-green-500/5 to-transparent",
    accentText: "text-green-400",
  },
  {
    headline:
      "SMART LOCK PREMIUM \u2014 Because you deserve to feel secure. Terms apply.",
    body: "Upgrade to Smart Lock Premium for facial recognition entry, guest pre-approval, and the illusion of personal autonomy.",
    disclaimer:
      "* Biometric data stored indefinitely. Management retains override access. 'Security' is a registered trademark of OmniCorp.",
    borderColor: "border-blue-500",
    bgGradient: "from-blue-500/5 to-transparent",
    accentText: "text-blue-400",
  },
];

export default function AdBanner() {
  const [currentAd, setCurrentAd] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentAd((prev) => (prev + 1) % ADS.length);
        setIsTransitioning(false);
      }, 300);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const ad = ADS[currentAd];

  return (
    <div
      className={`bg-surface-card border-l-4 ${ad.borderColor} border border-[#2b2839] rounded-lg overflow-hidden transition-all duration-300`}
    >
      <div
        className={`bg-gradient-to-r ${ad.bgGradient} p-5 transition-opacity duration-300 ${
          isTransitioning ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 bg-white/5 px-1.5 py-0.5 rounded">
                Sponsored
              </span>
              <span className="text-[9px] font-mono text-zinc-600">
                AD-{String(currentAd + 1).padStart(3, "0")}
              </span>
            </div>
            <h4 className={`text-sm font-bold ${ad.accentText} mb-1.5`}>
              {ad.headline}
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed mb-2">
              {ad.body}
            </p>
            <p className="text-[9px] text-zinc-600 italic leading-relaxed">
              {ad.disclaimer}
            </p>
          </div>
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            {ADS.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setIsTransitioning(true);
                  setTimeout(() => {
                    setCurrentAd(i);
                    setIsTransitioning(false);
                  }, 200);
                }}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i === currentAd
                    ? "bg-zinc-300 scale-125"
                    : "bg-zinc-700 hover:bg-zinc-500"
                }`}
                aria-label={`View ad ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
