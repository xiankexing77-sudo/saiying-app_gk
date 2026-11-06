import Link from "next/link";
import { PageMain } from "@/components/page-header";
import { Tr } from "@/components/preferences";

export default function NotFound() {
  return (
    <PageMain>
      <h1 className="font-title">
        <Tr k="notFound.title" />
      </h1>
      <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
        <Tr k="notFound.body" />
      </p>
      <Link href="/" className="mt-8 inline-block text-sm underline">
        <Tr k="notFound.back" />
      </Link>
    </PageMain>
  );
}
