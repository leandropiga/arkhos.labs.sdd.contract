-- CreateEnum
CREATE TYPE "UF" AS ENUM ('AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO');

-- CreateTable
CREATE TABLE "Cliente" (
    "id" UUID NOT NULL,
    "nomeCompleto" VARCHAR(150) NOT NULL,
    "nomeBusca" VARCHAR(150) NOT NULL,
    "telefone" VARCHAR(11) NOT NULL,
    "cpf" VARCHAR(11) NOT NULL,
    "rg" VARCHAR(20) NOT NULL,
    "logradouro" VARCHAR(200) NOT NULL,
    "numero" VARCHAR(20) NOT NULL,
    "cep" VARCHAR(8) NOT NULL,
    "cidade" VARCHAR(100) NOT NULL,
    "uf" "UF" NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contrato" (
    "id" UUID NOT NULL,
    "titulo" VARCHAR(200) NOT NULL,
    "tituloBusca" VARCHAR(200) NOT NULL,
    "dataAssinatura" DATE NOT NULL,
    "clienteId" UUID NOT NULL,
    "arquivoNomeOriginal" TEXT NOT NULL,
    "arquivoTamanhoBytes" INTEGER NOT NULL,
    "analiseIniciadaEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contrato_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_cpf_key" ON "Cliente"("cpf");

-- CreateIndex
CREATE INDEX "Cliente_nomeBusca_idx" ON "Cliente"("nomeBusca");

-- CreateIndex
CREATE INDEX "Cliente_uf_idx" ON "Cliente"("uf");

-- CreateIndex
CREATE INDEX "Contrato_tituloBusca_idx" ON "Contrato"("tituloBusca");

-- CreateIndex
CREATE INDEX "Contrato_dataAssinatura_idx" ON "Contrato"("dataAssinatura");

-- CreateIndex
CREATE INDEX "Contrato_clienteId_idx" ON "Contrato"("clienteId");

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
