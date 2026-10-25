import { cn } from "@/lib/utils";
import { creditsSansRemise, formatCredits } from "@/lib/reservations";

/**
 * Prix en crédits, précédé du prix sans remise barré (« ~~40 crédits~~ 28 crédits »).
 * Jamais d'euros côté élève. Un lecteur d'écran lit « 28 crédits, au lieu de 40 crédits ».
 */
export function PrixCredits({
  credits,
  prixPublic,
  className,
  barreClassName = "text-muted-foreground",
}: {
  credits: number;
  prixPublic?: number | string | null | undefined;
  className?: string | undefined;
  barreClassName?: string | undefined;
}) {
  const avant = creditsSansRemise(prixPublic, credits);
  return (
    <span className={className}>
      {avant != null && (
        <s aria-hidden="true" className={cn("mr-1 font-normal", barreClassName)}>
          {formatCredits(avant)}
        </s>
      )}
      {formatCredits(credits)}
      {avant != null && <span className="sr-only">, au lieu de {formatCredits(avant)}</span>}
    </span>
  );
}
