"use client";

import { useState, useEffect } from "react";

interface Ad {
  title: string;
  subtitle: string;
  cta: string;
  disclaimer: string;
  illustration: string;
}

const ADS: Ad[] = [
  {
    title: "Flexible Payments with Klarna",
    subtitle: "Because life happens.",
    cta: "Learn More",
    disclaimer: "Subject to credit approval. See terms.",
    illustration: "/illustrations/sitting-1.svg",
  },
  {
    title: "Your Community Score Matters",
    subtitle: "Learn how to improve your standing.",
    cta: "View Tips",
    disclaimer: "Community Score affects available units and rates.",
    illustration: "/illustrations/standing-7.svg",
  },
  {
    title: "Refer a Friend to Landly",
    subtitle: "Earn $50 in LDLY credits.",
    cta: "Refer Now",
    disclaimer: "Credits applied after referral's first payment.",
    illustration: "/illustrations/standing-12.svg",
  },
  {
    title: "Smart Home Features Included",
    subtitle: "Peace of mind, built in.",
    cta: "Explore Features",
    disclaimer: "Smart Home monitoring active 24/7 for your safety.",
    illustration: "/illustrations/sitting-5.svg",
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
      className="bg-gradient-to-r from-blue-50 to-white border border-gray-200 rounded-xl overflow-hidden transition-all duration-300"
    >
      <div
        className={`p-5 transition-opacity duration-300 ${
          isTransitioning ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                Sponsored
              </span>
            </div>
            <h4 className="text-sm font-bold text-gray-900 mb-1">
              {ad.title}
            </h4>
            <p className="text-xs text-gray-500 leading-relaxed mb-3">
              {ad.subtitle}
            </p>
            <button className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
              {ad.cta} &rarr;
            </button>
            <p className="text-[9px] text-gray-400 mt-2 leading-relaxed">
              {ad.disclaimer}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <img
              src={ad.illustration}
              alt=""
              className="w-24 opacity-60"
            />
            <div className="flex flex-col items-center gap-1">
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
                      ? "bg-blue-500 scale-125"
                      : "bg-gray-300 hover:bg-gray-400"
                  }`}
                  aria-label={`View ad ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
