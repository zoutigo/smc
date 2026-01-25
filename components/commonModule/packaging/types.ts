import type { ComponentType, ReactNode } from "react";

export type CommonModuleForm = {
  component: ComponentType<Record<string, unknown>>;
  description?: string;
};

export type CommonModulePage = {
  path: string;
  description?: string;
};

export type PackagingModuleConfig = {
  name: string;
  registryPath: string;
  forms: CommonModuleForm[];
  pages: CommonModulePage[];
  actions: {
    create: string;
    update: string;
  };
  notes?: ReactNode;
};

