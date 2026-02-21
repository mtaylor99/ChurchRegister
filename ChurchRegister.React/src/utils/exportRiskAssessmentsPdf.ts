import { jsPDF } from 'jspdf';
import type { RiskAssessment } from '../types/riskAssessments';

/**
 * Export risk assessments grid to PDF in tabular format
 */
export const exportRiskAssessmentsPdf = async (
  assessments: RiskAssessment[]
): Promise<void> => {
  try {
    // Create PDF instance in landscape for better table fit
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    let yPosition = margin;

    // Format date helper
    const formatDate = (dateString: string | null) => {
      if (!dateString) return '';
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    };

    // Export date
    const exportDate = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    const exportDateTime = new Date().toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });

    // Header
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Risk Assessment Register', margin, yPosition);
    
    yPosition += 8;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Exported: ${exportDate} at ${exportDateTime}`, margin, yPosition);
    pdf.text(`Total Assessments: ${assessments.length}`, pageWidth - margin - 50, yPosition, { align: 'right' });
    
    yPosition += 10;

    // Table headers
    const headers = ['Title', 'Category', 'Last Review', 'Next Review', 'Status', 'Approvals', 'Alert'];
    const columnWidths = [70, 45, 30, 30, 30, 25, 20]; // Total = 250mm (within 297mm landscape)
    const rowHeight = 7;
    const headerHeight = 10;

    // Helper function to check if new page is needed
    const checkPageBreak = (requiredSpace: number): number => {
      if (yPosition + requiredSpace > pageHeight - margin) {
        pdf.addPage();
        return margin + 10; // Leave space for page number
      }
      return yPosition;
    };

    // Draw table header
    const drawTableHeader = () => {
      pdf.setFillColor(41, 128, 185); // Blue header
      pdf.rect(margin, yPosition, columnWidths.reduce((a, b) => a + b, 0), headerHeight, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      
      let xPosition = margin;
      headers.forEach((header, i) => {
        pdf.text(header, xPosition + 2, yPosition + 7);
        xPosition += columnWidths[i];
      });
      
      pdf.setTextColor(0, 0, 0);
      yPosition += headerHeight;
    };

    drawTableHeader();

    // Draw table rows
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');

    assessments.forEach((assessment, index) => {
      // Calculate row height based on whether description exists
      const hasDescription = assessment.description && assessment.description.trim().length > 0;
      const descriptionHeight = hasDescription ? 15 : 0;
      const totalRowHeight = rowHeight + descriptionHeight;
      
      // Check if we need a new page
      yPosition = checkPageBreak(totalRowHeight + 5);
      
      // If we just added a new page, redraw header
      if (yPosition === margin + 10) {
        drawTableHeader();
      }

      // Alternate row colors
      if (index % 2 === 0) {
        pdf.setFillColor(245, 245, 245);
        pdf.rect(margin, yPosition, columnWidths.reduce((a, b) => a + b, 0), totalRowHeight, 'F');
      }

      let xPosition = margin;

      // Title (truncate if too long)
      let title = assessment.title || '';
      if (title.length > 45) {
        title = title.substring(0, 42) + '...';
      }
      pdf.text(title, xPosition + 2, yPosition + 5);
      xPosition += columnWidths[0];

      // Category
      let category = assessment.categoryName || '';
      if (category.length > 25) {
        category = category.substring(0, 22) + '...';
      }
      pdf.text(category, xPosition + 2, yPosition + 5);
      xPosition += columnWidths[1];

      // Last Review
      pdf.text(formatDate(assessment.lastReviewDate), xPosition + 2, yPosition + 5);
      xPosition += columnWidths[2];

      // Next Review
      const nextReviewDate = formatDate(assessment.nextReviewDate);
      const isOverdue = assessment.isOverdue;
      const alertStatus = assessment.alertStatus;
      
      if (isOverdue || alertStatus === 'red') {
        pdf.setTextColor(244, 67, 54); // Red for overdue
      } else if (alertStatus === 'amber') {
        pdf.setTextColor(255, 152, 0); // Amber for due soon
      }
      pdf.text(nextReviewDate, xPosition + 2, yPosition + 5);
      pdf.setTextColor(0, 0, 0);
      xPosition += columnWidths[3];

      // Status
      const status = assessment.status || '';
      if (status === 'Approved') {
        pdf.setTextColor(76, 175, 80); // Green
      } else {
        pdf.setTextColor(158, 158, 158); // Grey
      }
      pdf.text(status, xPosition + 2, yPosition + 5);
      pdf.setTextColor(0, 0, 0);
      xPosition += columnWidths[4];

      // Approvals
      const approvalText = `${assessment.approvalCount}/${assessment.minimumApprovalsRequired}`;
      pdf.text(approvalText, xPosition + 2, yPosition + 5);
      xPosition += columnWidths[5];

      // Alert indicator
      if (isOverdue || alertStatus === 'red') {
        pdf.setFillColor(244, 67, 54);
        pdf.circle(xPosition + 7, yPosition + 3.5, 2, 'F');
      } else if (alertStatus === 'amber') {
        pdf.setFillColor(255, 152, 0);
        pdf.circle(xPosition + 7, yPosition + 3.5, 2, 'F');
      } else {
        pdf.setFillColor(76, 175, 80);
        pdf.circle(xPosition + 7, yPosition + 3.5, 2, 'F');
      }

      yPosition += rowHeight;

      // Add description row if present
      if (hasDescription) {
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(80, 80, 80);
        
        // Split description into lines to fit width
        const maxWidth = columnWidths.reduce((a, b) => a + b, 0) - 4;
        const descriptionLines = pdf.splitTextToSize(assessment.description || '', maxWidth);
        
        // Limit to 2 lines to keep table compact
        const displayLines = descriptionLines.slice(0, 2);
        let descY = yPosition + 3;
        
        displayLines.forEach((line: string) => {
          pdf.text(line, margin + 2, descY);
          descY += 4;
        });
        
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(8);
        
        yPosition += descriptionHeight;
      }
    });

    // Add footer to all pages
    const totalPages = pdf.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(128, 128, 128);
      pdf.text(
        `Page ${i} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 7,
        { align: 'center' }
      );
      pdf.text(
        `Generated: ${exportDate}`,
        pageWidth - margin,
        pageHeight - 7,
        { align: 'right' }
      );
    }

    // Generate filename
    const filename = `Risk-Assessments-${new Date().toISOString().split('T')[0]}.pdf`;

    // Save the PDF
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF. Please try again.');
  }
};
