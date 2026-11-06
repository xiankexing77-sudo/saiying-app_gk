import { RightsMark } from "./marks";
import { Tr } from "./preferences";

export function RightsPlaceholder({ label }: { label: string }) {
  return (
    <div className="glass glass-plum flex h-56 flex-col justify-between border-dashed p-4">
      <RightsMark />
      <div>
        <p className="text-xl leading-8 font-medium">{label}</p>
        <p className="mt-2 text-xs leading-6 text-muted-foreground">
          <Tr k="rights.body" />
        </p>
      </div>
    </div>
  );
}
