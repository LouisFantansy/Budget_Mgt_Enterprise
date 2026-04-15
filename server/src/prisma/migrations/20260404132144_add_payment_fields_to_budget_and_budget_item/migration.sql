-- AlterTable
ALTER TABLE "Budget" ADD COLUMN     "accountCode" TEXT,
ADD COLUMN     "group" TEXT,
ADD COLUMN     "paymentEntity" TEXT;

-- AlterTable
ALTER TABLE "BudgetItem" ADD COLUMN     "accountCode" TEXT,
ADD COLUMN     "group" TEXT,
ADD COLUMN     "paymentEntity" TEXT;
