"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: ErrorProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-smc-bg px-6 py-12">
      <div className="max-w-xl w-full">
        <Card className="shadow-card border border-smc-border bg-white">
          <CardHeader className="flex flex-col gap-3">
            <Badge variant="warning" className="w-fit">
              incident
            </Badge>
            <CardTitle className="heading-2">Un problème est survenu</CardTitle>
            <CardDescription className="body-text">
              Nous n&apos;avons pas pu charger cette page. Vous pouvez réessayer
              ou revenir au tableau de bord.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="rounded-[var(--smc-radius)] bg-smc-bg px-4 py-3 text-sm text-muted-foreground">
              <div className="font-semibold text-smc-primary">Détails</div>
              <p className="text-small mt-1 break-words">
                {error?.message || "Erreur inattendue"}
              </p>
              {error?.digest ? (
                <p className="text-caption mt-1 text-muted-foreground">
                  Code : {error.digest}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={reset}>Réessayer</Button>
              <Button asChild variant="secondary">
                <Link href="/">Retour au tableau de bord</Link>
              </Button>
              <Button variant="ghost" onClick={() => window?.location?.reload()}>
                Recharger la page
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
