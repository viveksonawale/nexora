import { z } from "zod";
import { CertificateType } from "@prisma/client";

export const IssueCertificatesSchema = z.object({
  types: z.array(z.nativeEnum(CertificateType)).min(1),
});
