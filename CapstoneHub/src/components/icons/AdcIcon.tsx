import type { ImgHTMLAttributes } from "react";

/** ADC (Analog-to-Digital Converter) icon for Digitization stage */
export function AdcIcon({ className, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      src="/icon-adc.png"
      alt="ADC"
      className={`object-contain ${className ?? ""}`}
      {...props}
    />
  );
}
