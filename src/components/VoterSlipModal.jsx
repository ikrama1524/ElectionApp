import { useRef } from 'react';
import Modal from './Modal';
import './VoterSlipModal.css';

// Helper to join name parts
const joinName = (...parts) => {
  return parts.filter(Boolean).join(' ').trim();
};

const VoterSlipModal = ({ isOpen, onClose, voter }) => {
  const printRef = useRef(null);

  if (!voter) return null;

  const marathiName = joinName(voter.lFirstName, voter.lMiddleName, voter.lLastName) || voter.lVoterName || '-';
  const englishName = joinName(voter.eFirstName, voter.eMiddleName, voter.eLastName) || '-';

  const handlePrint = async () => {
    const slipContent = printRef.current;
    if (!slipContent) return;

    try {
      // Dynamically import html2canvas
      let html2canvas;
      try {
        html2canvas = (await import('html2canvas')).default;
      } catch (err) {
        console.error('html2canvas not available for printing');
        return;
      }

      // Generate image using same logic as download
      const canvas = await html2canvas(slipContent, {
        scale: 2, // Higher resolution for print quality
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        width: slipContent.offsetWidth,
        height: slipContent.offsetHeight,
      });

      // Convert canvas to data URL
      const imageDataUrl = canvas.toDataURL('image/png', 1.0);

      // Open print window with image
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        console.error('Failed to open print window');
        return;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Voter Slip - ${voter.vcardid || 'N/A'}</title>
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              
              html, body {
                width: 100%;
                height: 100%;
                margin: 0;
                padding: 0;
                overflow: hidden;
              }
              
              body {
                display: flex;
                justify-content: center;
                align-items: center;
                background: white;
              }
              
              img {
                max-width: 100%;
                max-height: 100%;
                width: auto;
                height: auto;
                object-fit: contain;
                display: block;
              }
              
              @media print {
                @page {
                  size: A4;
                  margin: 0;
                }
                
                html, body {
                  width: 100%;
                  height: 100%;
                  margin: 0;
                  padding: 0;
                }
                
                body {
                  display: flex;
                  justify-content: center;
                  align-items: center;
                }
                
                img {
                  max-width: 100%;
                  max-height: 100%;
                  width: auto;
                  height: auto;
                  object-fit: contain;
                  page-break-inside: avoid;
                }
              }
            </style>
          </head>
          <body>
            <img src="${imageDataUrl}" alt="Voter Slip" />
          </body>
        </html>
      `);
      
      printWindow.document.close();
      
      // Wait for window and image to be ready, then print
      const printImage = () => {
        const img = printWindow.document.querySelector('img');
        if (img) {
          if (img.complete) {
            // Image already loaded (data URL loads instantly)
            setTimeout(() => {
              printWindow.focus();
              printWindow.print();
            }, 100);
          } else {
            // Wait for image load
            img.onload = () => {
              setTimeout(() => {
                printWindow.focus();
                printWindow.print();
              }, 100);
            };
          }
        } else {
          // Fallback: wait a bit and try anyway
          setTimeout(() => {
            printWindow.focus();
            printWindow.print();
          }, 300);
        }
      };
      
      // Wait for document to be ready
      if (printWindow.document.readyState === 'complete') {
        printImage();
      } else {
        printWindow.onload = printImage;
      }
    } catch (error) {
      console.error('Error generating print image:', error);
    }
  };

  const handleDownloadImage = async (format = 'png') => {
    const slipContent = printRef.current;
    if (!slipContent) return;

    try {
      // Dynamically import html2canvas if available, otherwise fallback to print
      let html2canvas;
      try {
        html2canvas = (await import('html2canvas')).default;
      } catch (err) {
        console.warn('html2canvas not available, falling back to print');
        handlePrint();
        return;
      }

      // Capture the slip content as canvas
      const canvas = await html2canvas(slipContent, {
        scale: 2, // Higher resolution for print quality
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        width: slipContent.offsetWidth,
        height: slipContent.offsetHeight,
      });

      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (!blob) return;
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `voter-slip-${voter.vcardid || 'voter'}-${Date.now()}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, format === 'jpg' ? 'image/jpeg' : 'image/png', 0.95);
    } catch (error) {
      console.error('Error generating image:', error);
      // Fallback to print if image generation fails
      handlePrint();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="large" title={null}>
      <div className="voter-slip-container">
        <div ref={printRef} className="voter-slip-print" id="voter-slip-content">
          {/* Header */}
          <div className="voter-slip-header">
            <h1>पुणे महानगरपालिका</h1>
            <h2>Pune Municipal Corporation</h2>
          </div>

          {/* First Row: Ward / Prabhag and Booth / Yadibhag */}
          <div className="voter-slip-row">
            <div className="voter-slip-section">
              <div className="voter-slip-label">Ward / Prabhag</div>
              <div className="voter-slip-value">{voter.prabhag || '-'}</div>
            </div>
            <div className="voter-slip-section">
              <div className="voter-slip-label">Booth / Yadibhag</div>
              <div className="voter-slip-value">{voter.yadibhag || '-'}</div>
            </div>
          </div>

          {/* Second Row: Voter Number */}
          <div className="voter-slip-section">
            <div className="voter-slip-label">Voter Number (SR No)</div>
            <div className="voter-slip-value">{voter.srno || '-'}</div>
          </div>

          {/* Voter Name - Marathi */}
          <div className="voter-slip-name-section">
            <div className="voter-slip-label">Voter Name (Marathi)</div>
            <div className="voter-slip-name-marathi">{marathiName}</div>
          </div>

          {/* Voter Name - English */}
          <div className="voter-slip-name-section">
            <div className="voter-slip-label">Voter Name (English)</div>
            <div className="voter-slip-name-english">{englishName}</div>
          </div>

          {/* EPIC Number */}
          <div className="voter-slip-epic-section">
            <div className="voter-slip-label">EPIC Number</div>
            <div className="voter-slip-epic-value">{voter.vcardid || '-'}</div>
          </div>

          {/* Booth Address */}
          <div className="voter-slip-address-section">
            <div className="voter-slip-label">Polling Booth Address</div>
            <div className="voter-slip-address-value">{voter.lBoothaddress || '-'}</div>
          </div>

          {/* Booth Number */}
          {voter.boothNo && (
            <div className="voter-slip-section">
              <div className="voter-slip-label">Booth Number</div>
              <div className="voter-slip-value">{voter.boothNo}</div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="voter-slip-actions">
          <button onClick={handlePrint} className="btn btn-primary">
            🖨️ Print
          </button>
          <button onClick={() => handleDownloadImage('png')} className="btn btn-secondary">
            📥 Download PNG
          </button>
          <button onClick={() => handleDownloadImage('jpg')} className="btn btn-secondary">
            📥 Download JPG
          </button>
          <button onClick={onClose} className="btn btn-secondary">
            ✕ Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default VoterSlipModal;

