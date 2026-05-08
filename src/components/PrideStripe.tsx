/**
 * 5px Progress-Pride rainbow stripe at the top of the sticky banner.
 * Decorative — fully driven by the `bg-pride-stripe` utility defined
 * in tailwind.config.ts.
 */
export function PrideStripe() {
  return <div aria-hidden className="h-[5px] w-full bg-pride-stripe" />
}
