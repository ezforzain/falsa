import { IconGlobe, IconShield, IconTruck } from './icons';

export default function AnnouncementStrip() {
  return (
    <div className="bg-green-deep text-teal-mist text-[12.5px] tracking-[0.03em] flex flex-wrap justify-center items-center gap-x-7 gap-y-1.5 px-6 py-2.5 font-medium">
      <span className="flex items-center gap-1.5">
        <IconGlobe className="text-teal-soft" />
        Worldwide Free Shipping*
      </span>
      <span className="opacity-35 hidden sm:inline">|</span>
      <span className="hidden sm:flex items-center gap-1.5">
        <IconShield className="text-teal-soft" />
        100% Trusted B2B Marketplace
      </span>
      <span className="opacity-35 hidden md:inline">|</span>
      <span className="hidden md:flex items-center gap-1.5">
        <IconTruck className="text-teal-soft" width="14" height="14" />
        Free shipping on your first order
      </span>
    </div>
  );
}
