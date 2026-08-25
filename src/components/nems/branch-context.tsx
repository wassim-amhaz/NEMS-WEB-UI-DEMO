import {
  createContext,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import { branches, type Branch } from "@/mock/nems-data";

type BranchContextValue = {
  selectedBranch: Branch;
  selectedBranchId: string;
  setSelectedBranchId: (branchId: string) => void;
};

const BranchContext = createContext<BranchContextValue | null>(null);

export function BranchProvider({ children }: PropsWithChildren) {
  const [selectedBranchId, setSelectedBranchId] = useState(branches[0].id);
  const selectedBranch =
    branches.find((branch) => branch.id === selectedBranchId) ?? branches[0];

  const value = useMemo(
    () => ({ selectedBranch, selectedBranchId, setSelectedBranchId }),
    [selectedBranch, selectedBranchId]
  );

  return (
    <BranchContext.Provider value={value}>{children}</BranchContext.Provider>
  );
}

export function useBranch() {
  const context = useContext(BranchContext);

  if (!context) {
    throw new Error("useBranch must be used within BranchProvider");
  }

  return context;
}
