-- Add amount to Operation
ALTER TABLE "Operation" ADD COLUMN "amount" INTEGER NOT NULL DEFAULT 0;

-- Create User table
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- Create Evenement table
CREATE TABLE "Evenement" (
    "id" SERIAL NOT NULL,
    "titre" TEXT NOT NULL,
    "categorie" TEXT NOT NULL,
    "montant" INTEGER NOT NULL,
    "dateEcheance" TIMESTAMP(3) NOT NULL,
    "recurrence" TEXT NOT NULL,
    "statut" TEXT NOT NULL,
    "notes" TEXT,
    CONSTRAINT "Evenement_pkey" PRIMARY KEY ("id")
);

-- Create Objectif table
CREATE TABLE "Objectif" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "categorie" TEXT NOT NULL,
    "montantCible" INTEGER NOT NULL,
    "montantActuel" INTEGER NOT NULL DEFAULT 0,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateEcheance" TIMESTAMP(3) NOT NULL,
    "couleur" TEXT NOT NULL,
    "icone" TEXT NOT NULL,
    "statut" TEXT NOT NULL,
    CONSTRAINT "Objectif_pkey" PRIMARY KEY ("id")
);

-- Create Budget table
CREATE TABLE "Budget" (
    "id" SERIAL NOT NULL,
    "exercice" INTEGER NOT NULL,
    "mois" INTEGER NOT NULL,
    CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

-- Create BudgetLigne table
CREATE TABLE "BudgetLigne" (
    "id" SERIAL NOT NULL,
    "categorie" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "montantPrevu" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "budgetId" INTEGER NOT NULL,
    CONSTRAINT "BudgetLigne_pkey" PRIMARY KEY ("id")
);

-- Add foreign key for BudgetLigne -> Budget
ALTER TABLE "BudgetLigne" ADD CONSTRAINT "BudgetLigne_budgetId_fkey"
    FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
