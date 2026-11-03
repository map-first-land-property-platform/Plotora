import Image from "next/image";
import { Map, MapPin, ShieldCheck } from "lucide-react";
import { ReactNode } from "react";

type Props = {
  image?: string;
  maxWidth?: string;
  promoHeading?: string;
  promoCopy?: string;
  compact?: boolean;
  children: ReactNode;
};

export default function AuthShell({
  image = "/auth/coast.png",
  maxWidth = "max-w-[530px]",
  promoHeading = "Map First. Own Smarter.",
  promoCopy = "See the land. Know the location. Find the right place for your next chapter.",
  compact = false,
  children,
}: Props) {
  return (
    <main className="flex min-h-screen bg-white">
      <section
        aria-label="Discover property with Plotora"
        className="relative hidden min-h-screen w-1/2 flex-col justify-between overflow-hidden px-[7.4%] py-8 text-white lg:flex"
        style={{
          backgroundColor: "#0b3d36",
          backgroundImage: `linear-gradient(to bottom, rgba(6,40,35,0.36) 0%, rgba(6,40,35,0.28) 32%, rgba(3,30,27,0.91) 100%), url(${image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="flex items-center gap-2.5">
          <MapPin size={30} strokeWidth={2.5} />
          <div className="leading-none">
            <span className="block text-[25px] font-bold tracking-tight">Plotora</span>
            <span className="mt-1 block text-[8px] font-semibold tracking-[0.12em]">MAP FIRST. OWN SMARTER.</span>
          </div>
        </div>

        <div className="max-w-[630px] pb-1">
          <h2 className="max-w-[600px] text-5xl font-semibold leading-[1.08] tracking-[-0.045em] xl:text-[72px]">
            {promoHeading}
          </h2>
          <p className="mt-5 max-w-[650px] text-lg leading-8 text-white/95 xl:text-[21px]">
            {promoCopy}
          </p>
          <div className="mt-7 grid max-w-[680px] grid-cols-2 gap-7 text-sm leading-6 xl:text-base">
            <div className="flex gap-3">
              <Map size={21} className="mt-0.5 shrink-0 text-teal-300" />
              <p><strong className="font-semibold">Map-first search</strong> — draw an area, compare price per perch.</p>
            </div>
            <div className="flex gap-3">
              <ShieldCheck size={21} className="mt-0.5 shrink-0 text-teal-300" />
              <p><strong className="font-semibold">Verified listings</strong> — deed, ID and organisation checks.</p>
            </div>
          </div>
        </div>
      </section>

      <section className={`flex min-h-screen w-full px-6 sm:px-10 lg:w-1/2 lg:px-12 ${compact ? "items-start justify-center py-7" : "items-center justify-center py-10"}`}>
        <div className={`w-full ${maxWidth}`}>
          <Image
            src="/auth/logo.jpeg"
            alt="Plotora — Map first. Own smarter."
            width={1600}
            height={533}
            priority
            className={`mx-auto h-auto max-w-[78%] ${compact ? "mb-5 w-[180px]" : "mb-14 w-[290px]"}`}
          />
          {children}
        </div>
      </section>
    </main>
  );
}
