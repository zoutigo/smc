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

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-smc-bg px-6 py-12">
      <div className="w-full max-w-xl">
        <Card className="border border-smc-border bg-white shadow-card">
          <CardHeader className="flex flex-col gap-3">
            <Badge variant="draft" className="w-fit">
              page manquante
            </Badge>
            <CardTitle className="heading-2">Page introuvable</CardTitle>
            <CardDescription className="body-text">
              Nous n&apos;avons pas trouvé la ressource demandée. Vérifiez l&apos;URL
              ou revenez au tableau de bord.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/">Retour au tableau de bord</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/settings">Aller aux paramètres</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
