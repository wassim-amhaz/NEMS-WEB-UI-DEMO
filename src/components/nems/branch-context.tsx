import {
  createContext,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import { branches, type Branch } from "@/mock/nems-data";

export const ALL_BRANCHES_ID = "all";

type BranchContextValue = {
  selectedBranch: Branch;
  selectedBranchId: string;
  isAllBranches: boolean;
  setSelectedBranchId: (branchId: string) => void;
};

const BranchContext = createContext<BranchContextValue | null>(null);

export function BranchProvider({ children }: PropsWithChildren) {
  const [selectedBranchId, setSelectedBranchId] = useState(ALL_BRANCHES_ID);
  const isAllBranches = selectedBranchId === ALL_BRANCHES_ID;
  const selectedBranch =
    branches.find((branch) => branch.id === selectedBranchId) ?? branches[0];

  const value = useMemo(
    () => ({
      selectedBranch,
      selectedBranchId,
      isAllBranches,
      setSelectedBranchId,
    }),
    [isAllBranches, selectedBranch, selectedBranchId]
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
