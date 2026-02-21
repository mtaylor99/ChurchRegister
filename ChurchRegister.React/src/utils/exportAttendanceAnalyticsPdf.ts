/**
 * Generate attendance analytics PDF with charts
 * This requires the charts to be rendered in the DOM
 */
export const generateAttendanceAnalyticsPdfFromCharts = async (
  chartsContainerElement: HTMLElement,
  eventsCount: number
): Promise<Blob> => {
  const { default: html2canvas } = await import('html2canvas');
  const { jsPDF } = await import('jspdf');

  // Create PDF instance
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // Get all chart elements
  const chartElements = chartsContainerElement.querySelectorAll(
    '[data-chart-container]'
  );
  const chartsPerPage = 6; // 3 across x 2 down per page
  const chartWidth = 90; // mm
  const chartHeight = 60; // mm
  const marginX = 10;
  const marginY = 20;
  const spacingX = 5;
  const spacingY = 10;

  // Add title page
  pdf.setFontSize(20);
  pdf.text('Attendance Analytics Report', 148, 30, { align: 'center' });
  pdf.setFontSize(12);
  pdf.text(`Generated on ${new Date().toLocaleDateString()}`, 148, 40, {
    align: 'center',
  });
  pdf.text(`${eventsCount} Events Included`, 148, 50, {
    align: 'center',
  });

  // Process charts in batches
  for (let i = 0; i < chartElements.length; i++) {
    const chartElement = chartElements[i] as HTMLElement;
    const chartIndex = i % chartsPerPage;

    // Add new page if needed (skip first page as it already exists)
    if (i > 0 && chartIndex === 0) {
      pdf.addPage();
    }

    // Calculate position (3 across, 2 down)
    const col = chartIndex % 3;
    const row = Math.floor(chartIndex / 3);
    const x = marginX + col * (chartWidth + spacingX);
    const y = marginY + row * (chartHeight + spacingY);

    // Small delay before capturing each chart to ensure it's fully rendered
    await new Promise(resolve => setTimeout(resolve, 100));

    // Capture chart as canvas with higher quality and wait for it
    const canvas = await html2canvas(chartElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: chartElement.scrollWidth,
      windowHeight: chartElement.scrollHeight,
    });

    // Convert to image and add to PDF
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', x, y, chartWidth, chartHeight);
    
    // Small delay after capture to allow browser to process
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  // Return PDF as blob
  return pdf.output('blob');
};

/**
 * Download attendance analytics PDF with charts
 */
export const downloadAttendanceAnalyticsPdf = async (
  chartsContainerElement: HTMLElement,
  eventsCount: number
): Promise<void> => {
  const blob = await generateAttendanceAnalyticsPdfFromCharts(
    chartsContainerElement,
    eventsCount
  );

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `attendance-analytics-${new Date().toISOString().split('T')[0]}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
