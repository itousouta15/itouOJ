import { z } from "zod";
import { problemSchema } from "./problemSchema";

export const problemProposalSchema = problemSchema.omit({ isPublic: true });

export type ProblemProposalInput = z.infer<typeof problemProposalSchema>;
