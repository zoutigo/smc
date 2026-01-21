import React from "react";
import Link from "next/link";
import { type VariantProps } from "class-variance-authority";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BaseProps = VariantProps<typeof buttonVariants> & {
  text: string;
  className?: string;
};

type CustomButtonLinkProps = BaseProps & {
  href: string;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "children">;

type CustomButtonButtonProps = BaseProps & {
  href?: undefined;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children">;

type CustomButtonProps = CustomButtonLinkProps | CustomButtonButtonProps;

export function CustomButton({ href, text, variant = "secondary", size = "sm", className, ...rest }: CustomButtonProps) {
  const baseClass = cn("cursor-pointer min-w-[120px] rounded-md text-sm", className);

  if (href) {
    const { href: _omitHref, ...linkProps } = rest as CustomButtonLinkProps;
    return (
      <Button asChild variant={variant} size={size} className={baseClass}>
        <Link href={href} {...linkProps}>
          {text}
        </Link>
      </Button>
    );
  }

  const buttonProps = rest as CustomButtonButtonProps;
  const { type: buttonType = "button", ...buttonRest } = buttonProps;

  return (
    <Button variant={variant} size={size} className={baseClass} type={buttonType} {...buttonRest}>
      {text}
    </Button>
  );
}
