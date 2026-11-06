import Link from "next/link";
import { Tr } from "./preferences";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-8 text-xs leading-6 text-muted-foreground sm:px-8">
        <p>
          <Tr k="footer.p1" />
        </p>
        <p>
          <Tr k="footer.p2" />
          <Link className="ml-2 underline" href="/reports">
            <Tr k="footer.link" />
          </Link>
        </p>
      </div>
    </footer>
  );
}
