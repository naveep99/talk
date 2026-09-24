import type { AnchorHTMLAttributes, MouseEvent } from "react";
import { useRouter } from "next/navigation";

export default function Link({ href, onClick, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const router = useRouter();
  return (
    <a
      {...rest}
      href="#"
      onClick={(e: MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        onClick?.(e);
        router.push(href);
      }}
    />
  );
}
