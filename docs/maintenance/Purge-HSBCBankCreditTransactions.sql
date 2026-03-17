/*
 * Purge Old HSBC Bank Credit Transactions
 * 
 * Purpose: Delete HSBC bank credit transactions older than a specified number of years
 *          to keep the table size manageable while preserving contribution history.
 * 
 * Strategy: Two-stage deletion process
 *   Stage 1: Soft delete (mark as Deleted = 1) for historical audit
 *   Stage 2: Hard delete (permanent removal) to reduce table size
 * 
 * Safety: All contribution records remain intact in ChurchMemberContributions table.
 *         The foreign key reference HSBCBankCreditTransactionId is set to NULL before deletion.
 * 
 * HMRC Compliance: Ensure retention period meets financial record requirements (typically 7 years)
 * 
 * Usage: Adjust @RetentionYears variable below, then execute in a maintenance window.
 */

-- =============================================================================
-- CONFIGURATION - Change this value as needed
-- =============================================================================
DECLARE @RetentionYears INT = 7;  -- Aligns with HMRC financial record requirements

-- =============================================================================
-- Calculated cutoff date
-- =============================================================================
DECLARE @CutoffDate DATETIME2 = DATEADD(YEAR, -@RetentionYears, GETDATE());
DECLARE @SoftDeleteCount INT = 0;
DECLARE @HardDeleteCount INT = 0;
DECLARE @ContributionUpdateCount INT = 0;

PRINT '========================================================================';
PRINT 'HSBC Bank Credit Transaction Purge Script';
PRINT '========================================================================';
PRINT 'Retention Period: ' + CAST(@RetentionYears AS NVARCHAR(10)) + ' years';
PRINT 'Cutoff Date: ' + CONVERT(NVARCHAR(30), @CutoffDate, 120);
PRINT 'Current Date: ' + CONVERT(NVARCHAR(30), GETDATE(), 120);
PRINT '========================================================================';
PRINT '';

-- =============================================================================
-- STAGE 1: SOFT DELETE - Mark old transactions as deleted
-- =============================================================================
PRINT 'STAGE 1: Soft Delete (Deleted = 1) for transactions older than ' + CAST(@RetentionYears AS NVARCHAR(10)) + ' years';
PRINT '------------------------------------------------------------------------';

BEGIN TRANSACTION Stage1;

BEGIN TRY
    -- Soft delete old transactions that are not already deleted
    UPDATE HSBCBankCreditTransactions 
    SET 
        Deleted = 1,
        ModifiedBy = 'System-Purge',
        ModifiedDateTime = GETUTCNOW()
    WHERE 
        Date < @CutoffDate
        AND Deleted = 0;
    
    SET @SoftDeleteCount = @@ROWCOUNT;
    
    COMMIT TRANSACTION Stage1;
    
    PRINT 'SUCCESS: ' + CAST(@SoftDeleteCount AS NVARCHAR(10)) + ' transactions marked as deleted.';
    PRINT '';
    
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION Stage1;
    PRINT 'ERROR in Stage 1: ' + ERROR_MESSAGE();
    PRINT 'Stage 1 rolled back. Exiting script.';
    RETURN;
END CATCH

-- =============================================================================
-- STAGE 2: HARD DELETE - Permanently remove old soft-deleted records
-- =============================================================================
PRINT 'STAGE 2: Hard Delete (permanent removal) for soft-deleted transactions';
PRINT '------------------------------------------------------------------------';

-- Show what will be affected
SELECT @HardDeleteCount = COUNT(*)
FROM HSBCBankCreditTransactions
WHERE Date < @CutoffDate AND Deleted = 1;

PRINT 'Transactions to permanently delete: ' + CAST(@HardDeleteCount AS NVARCHAR(10));

IF @HardDeleteCount = 0
BEGIN
    PRINT 'No transactions to permanently delete.';
    PRINT '';
    PRINT '========================================================================';
    PRINT 'Purge Complete - No hard deletions required';
    PRINT '========================================================================';
    RETURN;
END

BEGIN TRANSACTION Stage2;

BEGIN TRY
    -- Step 1: NULL the foreign key references in contributions
    UPDATE ChurchMemberContributions 
    SET HSBCBankCreditTransactionId = NULL
    WHERE HSBCBankCreditTransactionId IN (
        SELECT Id 
        FROM HSBCBankCreditTransactions 
        WHERE Date < @CutoffDate AND Deleted = 1
    );
    
    SET @ContributionUpdateCount = @@ROWCOUNT;
    
    PRINT 'Updated ' + CAST(@ContributionUpdateCount AS NVARCHAR(10)) + ' contribution records (set HSBCBankCreditTransactionId to NULL).';
    
    -- Step 2: Permanently delete the old soft-deleted transactions
    DELETE FROM HSBCBankCreditTransactions 
    WHERE Date < @CutoffDate AND Deleted = 1;
    
    SET @HardDeleteCount = @@ROWCOUNT;
    
    COMMIT TRANSACTION Stage2;
    
    PRINT 'SUCCESS: ' + CAST(@HardDeleteCount AS NVARCHAR(10)) + ' transactions permanently deleted.';
    PRINT '';
    
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION Stage2;
    PRINT 'ERROR in Stage 2: ' + ERROR_MESSAGE();
    PRINT 'Stage 2 rolled back. Soft-deleted records remain in database.';
    RETURN;
END CATCH

-- =============================================================================
-- SUMMARY
-- =============================================================================
PRINT '========================================================================';
PRINT 'Purge Complete - Summary';
PRINT '========================================================================';
PRINT 'Transactions soft-deleted: ' + CAST(@SoftDeleteCount AS NVARCHAR(10));
PRINT 'Contributions updated: ' + CAST(@ContributionUpdateCount AS NVARCHAR(10));
PRINT 'Transactions permanently deleted: ' + CAST(@HardDeleteCount AS NVARCHAR(10));
PRINT '';
PRINT 'All contribution records remain intact in ChurchMemberContributions table.';
PRINT '========================================================================';
