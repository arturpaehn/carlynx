import React from "react";

const cards = [
  {
    title: "NICB VINCheck®",
    href: "https://www.nicb.org/vincheck",
    desc: "Free VIN check for theft and salvage/total loss from the National Insurance Crime Bureau. Limit: up to 5 requests per day.",
    cta: "Open NICB VINCheck",
    icon: (
      <svg className="w-8 h-8 text-blue-500 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.5V6a2 2 0 012-2h14a2 2 0 012 2v7.5M3 13.5V18a2 2 0 002 2h14a2 2 0 002-2v-4.5M3 13.5l9 4 9-4" /></svg>
    )
  },
  {
    title: "Texas Title Check (TxDMV / NMVTIS)",
    href: "https://www.txdmv.gov/motorists/buying-or-selling-a-vehicle/title-check-look-before-you-buy",
    desc: "Title brand, total loss, and salvage check via official NMVTIS providers recommended by TxDMV.",
    cta: "Open TxDMV Title Check",
    icon: (
      <svg className="w-8 h-8 text-green-500 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" /><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" /></svg>
    )
  },
  {
    title: "iSeeCars VIN Lookup",
    href: "https://www.iseecars.com/vin",
    desc: "Quick free check: estimated market price, recommendations, reviews, and possible title alerts.",
    cta: "Open iSeeCars VIN Lookup",
    icon: (
      <svg className="w-8 h-8 text-purple-500 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l-4 4m0 0l-4-4m4 4V6" /></svg>
    )
  }
];

export default function UsefulInfoVinLinks() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10 mt-4">
  {cards.map((card) => (
        <div
          key={card.title}
          className="flex flex-col items-center border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition p-6 h-full"
        >
          {card.icon}
          <div className="font-bold text-lg text-gray-800 mb-2 text-center">{card.title}</div>
          <div className="text-gray-600 text-sm mb-4 text-center">{card.desc}</div>
          <a
            href={card.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={card.cta}
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition text-sm shadow"
          >
            {card.cta}
          </a>
        </div>
      ))}
    </div>
  );
}
