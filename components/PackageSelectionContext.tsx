"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface PackageSelectionValue {
  selectedPackage: string | null;
  selectPackage: (name: string) => void;
}

const PackageSelectionContext = createContext<PackageSelectionValue | null>(null);

export function PackageSelectionProvider({ children }: { children: ReactNode }) {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  function selectPackage(name: string) {
    setSelectedPackage(name);
    document.getElementById("contacto")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <PackageSelectionContext.Provider value={{ selectedPackage, selectPackage }}>
      {children}
    </PackageSelectionContext.Provider>
  );
}

export function usePackageSelection() {
  const context = useContext(PackageSelectionContext);
  if (!context) {
    throw new Error("usePackageSelection debe usarse dentro de PackageSelectionProvider");
  }
  return context;
}
