import {
  createContext,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import { DEMO_TODAY } from "@/mock/nems-data";

export type SessionActionResolution = {
  actionId: string;
  completedAt: string;
  outcome: string;
  note?: string;
};

type ActionResolutionContextValue = {
  resolvedActions: Record<string, SessionActionResolution>;
  resolveAction: (actionId: string, outcome: string, note?: string) => void;
};

const ActionResolutionContext =
  createContext<ActionResolutionContextValue | null>(null);

export function ActionResolutionProvider({ children }: PropsWithChildren) {
  const [resolvedActions, setResolvedActions] = useState<
    Record<string, SessionActionResolution>
  >({});

  const value = useMemo<ActionResolutionContextValue>(
    () => ({
      resolvedActions,
      resolveAction: (actionId, outcome, note) => {
        setResolvedActions((current) => {
          if (current[actionId]) return current;
          const sequence = Object.keys(current).length;
          return {
            ...current,
            [actionId]: {
              actionId,
              completedAt: `${DEMO_TODAY}T15:${String(40 + sequence).padStart(
                2,
                "0"
              )}:00`,
              outcome,
              note: note?.trim() || undefined,
            },
          };
        });
      },
    }),
    [resolvedActions]
  );

  return (
    <ActionResolutionContext.Provider value={value}>
      {children}
    </ActionResolutionContext.Provider>
  );
}

export function useActionResolutions() {
  const context = useContext(ActionResolutionContext);
  if (!context) {
    throw new Error(
      "useActionResolutions must be used within ActionResolutionProvider"
    );
  }
  return context;
}
