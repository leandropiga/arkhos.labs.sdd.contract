-- CreateTable
CREATE TABLE "AnaliseContrato" (
    "id" UUID NOT NULL,
    "contratoId" UUID NOT NULL,
    "resumo" TEXT NOT NULL,
    "riscos" JSONB NOT NULL,
    "clausulasCriticas" JSONB NOT NULL,
    "geradaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnaliseContrato_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AnaliseContrato_contratoId_key" ON "AnaliseContrato"("contratoId");

-- AddForeignKey
ALTER TABLE "AnaliseContrato" ADD CONSTRAINT "AnaliseContrato_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE CASCADE ON UPDATE CASCADE;
