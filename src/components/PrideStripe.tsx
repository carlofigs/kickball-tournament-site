/**
 * 5px Progress-Pride rainbow stripe. Sits at the very top of the
 * sticky banner, echoing the rainbow on the bottom half of the ECKB
 * shield. Decorative — fully driven by the `bg-pride-stripe` utility
 * defined in tailwind.config.ts.
 */
export function PrideStripe() {
  return <div aria-hidden className="h-[5px] w-full bg-pride-stripe" />
}
