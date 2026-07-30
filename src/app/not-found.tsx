import type { Metadata } from "next";
import Link from "next/link";
import NotFoundCode from "@/components/NotFoundCode";

const description = "這個頁面不知道飛去哪裡了 (´；ω；`)";

export const metadata: Metadata = {
  title: "404",
  description,
};

export default function NotFound() {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <NotFoundCode />
      <p className="mt-6 text-lg text-tx">{description}</p>
      <p className="mt-1.5 text-sm text-dim">
        你要找的頁面不存在，或是已經搬家了
      </p>
      <div className="mt-8">
        <Link href="/" className="btn-primary">
          回首頁 <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  );
}
