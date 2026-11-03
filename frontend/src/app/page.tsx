import HomePage from "@/components/HomePage";
import PublicHeader from "@/layout/PublicHeader";
import PublicFooter from "@/layout/PublicFooter";
import { homeData } from "@/data/home-data";

export default function Page() {
  return <>
    <PublicHeader />
    <main id="page" tabIndex={-1} className="pl-main"><HomePage data={homeData} /></main>
    <PublicFooter />
  </>;
}
