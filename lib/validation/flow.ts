import { z } from "zod";
import { FlowStation } from "@prisma/client";

export const flowQuickSchema = z.object({
  from: z.nativeEnum(FlowStation, { message: "Invalid from station" }),
  to: z.nativeEnum(FlowStation, { message: "Invalid to station" }),
});

export type FlowQuickInput = z.infer<typeof flowQuickSchema>;
