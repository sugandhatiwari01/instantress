import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';

export const handleDownloadAndOpenPDF = async (document) => {
  try {
    // Generate the PDF blob
    const blob = await pdf(document).toBlob();
    
    // Save the blob as a file
    saveAs(blob, 'resume.pdf');

    // Create a URL for the blob
    const url = URL.createObjectURL(blob);
    
    // Open the PDF in a new tab
    window.open(url, '_blank');
    
    // Clean up the URL object after a delay
    setTimeout(() => URL.revokeObjectURL(url), 100);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};