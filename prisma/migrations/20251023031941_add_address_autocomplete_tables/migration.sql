-- CreateTable
CREATE TABLE "AddressLookup" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "customerId" TEXT,
    "sessionId" TEXT,
    "query" TEXT NOT NULL,
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "charged" BOOLEAN NOT NULL DEFAULT false,
    "chargeAmount" REAL NOT NULL DEFAULT 0.03,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SwiftcompleteSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "enabledCheckout" BOOLEAN NOT NULL DEFAULT true,
    "enabledProfile" BOOLEAN NOT NULL DEFAULT true,
    "chargePerLookup" REAL NOT NULL DEFAULT 0.03,
    "maxMonthlyCharge" REAL NOT NULL DEFAULT 100.00,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "AddressLookup_shop_createdAt_idx" ON "AddressLookup"("shop", "createdAt");

-- CreateIndex
CREATE INDEX "AddressLookup_charged_idx" ON "AddressLookup"("charged");

-- CreateIndex
CREATE UNIQUE INDEX "SwiftcompleteSettings_shop_key" ON "SwiftcompleteSettings"("shop");
