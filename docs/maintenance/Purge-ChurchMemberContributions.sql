/*
 * Purge Old Church Member Contributions
 * 
 * Purpose: Delete church member contribution records older than a specified number of years
 *          to keep the table size manageable while meeting financial record retention requirements.
 * 
 * Strategy: Two-stage deletion process
 *   Stage 1: Soft delete (mark as Deleted = 1) for historical audit
 *   Stage 2: Hard delete (permanent removal) to reduce table size
 * 
 * IMPORTANT WARNINGS:
 *   - Gift Aid Requirements: HMRC requires Gift Aid records for 6 years from end of accounting period
 *   - HMRC Audit: Records may be inspected for up to 6 years after a claim
 *   - Historical Analysis: Consider if you need long-term giving history for reporting
 * 
 * RECOMMENDATION: Set @RetentionYears to at least 6 to meet UK Gift Aid requirements
 *                 Setting to 5 years risks non-compliance if records span accounting periods
 * 
 * Usage: Adjust @RetentionYears variable below, then execute in a maintenance window.
 *        Review counts carefully before proceeding with permanent deletion.
 */

-- =============================================================================
-- CONFIGURATION - Change this value as needed
-- =============================================================================
DECLARE @RetentionYears INT = 7;  -- HMRC Gift Aid requirement: 6 years minimum (7 provides buffer)

-- =============================================================================
-- Calculated cutoff date
-- =============================================================================
DECLARE @CutoffDate DATETIME2 = DATEADD(YEAR, -@RetentionYears, GETDATE());
DECLARE @SoftDeleteCount INT = 0;
DECLARE @HardDeleteCount INT = 0;

PRINT '========================================================================';
PRINT 'Church Member Contributions Purge Script';
PRINT '========================================================================';
PRINT 'Retention Period: ' + CAST(@RetentionYears AS NVARCHAR(10)) + ' years';
PRINT 'Cutoff Date: ' + CONVERT(NVARCHAR(30), @CutoffDate, 120);
PRINT 'Current Date: ' + CONVERT(NVARCHAR(30), GETDATE(), 120);
PRINT '========================================================================';
PRINT '';

-- =============================================================================
-- PRE-CHECK: Show what will be affected
-- =============================================================================
PRINT 'PRE-CHECK: Analyzing contributions to be purged...';
PRINT '------------------------------------------------------------------------';

DECLARE @TotalContributions INT;
DECLARE @OldContributions INT;
DECLARE @TotalAmount DECIMAL(18,2);

SELECT @TotalContributions = COUNT(*) FROM ChurchMemberContributions WHERE Deleted = 0;
SELECT @OldContributions = COUNT(*), @TotalAmount = ISNULL(SUM(Amount), 0)
FROM ChurchMemberContributions 
WHERE Date < @CutoffDate AND Deleted = 0;

PRINT 'Total active contributions: ' + CAST(@TotalContributions AS NVARCHAR(10));
PRINT 'Contributions older than ' + CAST(@RetentionYears AS NVARCHAR(10)) + ' years: ' + CAST(@OldContributions AS NVARCHAR(10));
PRINT 'Total amount in old contributions: £' + CONVERT(NVARCHAR(20), @TotalAmount, 1);
PRINT '';

-- Show breakdown by year
PRINT 'Breakdown by year:';
SELECT 
    YEAR(Date) AS [Year],
    COUNT(*) AS [Count],
    CAST(SUM(Amount) AS DECIMAL(18,2)) AS [TotalAmount]
FROM ChurchMemberContributions
WHERE Date < @CutoffDate AND Deleted = 0
GROUP BY YEAR(Date)
ORDER BY YEAR(Date);
PRINT '';

-- Show affected members
PRINT 'Unique members affected:';
SELECT COUNT(DISTINCT ChurchMemberId) AS [MemberCount]
FROM ChurchMemberContributions
WHERE Date < @CutoffDate AND Deleted = 0;
PRINT '';

-- =============================================================================
-- WARNING PROMPT
-- =============================================================================
IF @OldContributions > 0
BEGIN
    PRINT '========================================================================';
    PRINT 'WARNING: You are about to purge ' + CAST(@OldContributions AS NVARCHAR(10)) + ' contribution records';
    PRINT 'totaling £' + CONVERT(NVARCHAR(20), @TotalAmount, 1);
    PRINT '';
    IF @RetentionYears < 6
    BEGIN
        PRINT '⚠️  CAUTION: Retention period is less than 6 years!';
        PRINT '   HMRC requires Gift Aid records for 6 years from end of accounting period.';
        PRINT '   Setting to 5 years risks non-compliance during HMRC audits.';
        PRINT '';
    END
    PRINT 'To proceed, uncomment the execution sections below.';
    PRINT '========================================================================';
    PRINT '';
END
ELSE
BEGIN
    PRINT 'No contributions found older than ' + CAST(@RetentionYears AS NVARCHAR(10)) + ' years.';
    PRINT 'Nothing to purge.';
    PRINT '';
    PRINT '========================================================================';
    PRINT 'Purge Complete - No actions required';
    PRINT '========================================================================';
    RETURN;
END

-- =============================================================================
-- STAGE 1: SOFT DELETE - Mark old contributions as deleted
-- =============================================================================
-- UNCOMMENT THE SECTION BELOW TO EXECUTE STAGE 1
/*
PRINT 'STAGE 1: Soft Delete (Deleted = 1) for contributions older than ' + CAST(@RetentionYears AS NVARCHAR(10)) + ' years';
PRINT '------------------------------------------------------------------------';

BEGIN TRANSACTION Stage1;

BEGIN TRY
    -- Soft delete old contributions that are not already deleted
    UPDATE ChurchMemberContributions 
    SET 
        Deleted = 1,
        ModifiedBy = 'System-Purge',
        ModifiedDateTime = GETUTCDATE()
    WHERE 
        Date < @CutoffDate
        AND Deleted = 0;
    
    SET @SoftDeleteCount = @@ROWCOUNT;
    
    COMMIT TRANSACTION Stage1;
    
    PRINT 'SUCCESS: ' + CAST(@SoftDeleteCount AS NVARCHAR(10)) + ' contributions marked as deleted.';
    PRINT '';
    
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION Stage1;
    PRINT 'ERROR in Stage 1: ' + ERROR_MESSAGE();
    PRINT 'Stage 1 rolled back. Exiting script.';
    RETURN;
END CATCH
*/

-- =============================================================================
-- STAGE 2: HARD DELETE - Permanently remove old soft-deleted records
-- =============================================================================
-- UNCOMMENT THE SECTION BELOW TO EXECUTE STAGE 2
-- WARNING: This is permanent and cannot be undone!
/*
PRINT 'STAGE 2: Hard Delete (permanent removal) for soft-deleted contributions';
PRINT '------------------------------------------------------------------------';

-- Count what will be permanently deleted
SELECT @HardDeleteCount = COUNT(*)
FROM ChurchMemberContributions
WHERE Date < @CutoffDate AND Deleted = 1;

PRINT 'Contributions to permanently delete: ' + CAST(@HardDeleteCount AS NVARCHAR(10));

IF @HardDeleteCount = 0
BEGIN
    PRINT 'No contributions to permanently delete.';
    PRINT '';
    PRINT '========================================================================';
    PRINT 'Purge Complete - No hard deletions required';
    PRINT '========================================================================';
    RETURN;
END

BEGIN TRANSACTION Stage2;

BEGIN TRY
    -- Permanently delete the old soft-deleted contributions
    DELETE FROM ChurchMemberContributions 
    WHERE Date < @CutoffDate AND Deleted = 1;
    
    SET @HardDeleteCount = @@ROWCOUNT;
    
    COMMIT TRANSACTION Stage2;
    
    PRINT 'SUCCESS: ' + CAST(@HardDeleteCount AS NVARCHAR(10)) + ' contributions permanently deleted.';
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
PRINT 'Contributions soft-deleted: ' + CAST(@SoftDeleteCount AS NVARCHAR(10));
PRINT 'Contributions permanently deleted: ' + CAST(@HardDeleteCount AS NVARCHAR(10));
PRINT '';
PRINT '⚠️  REMINDER: HMRC Gift Aid requirement is 6 years minimum';
PRINT '========================================================================';
*/
