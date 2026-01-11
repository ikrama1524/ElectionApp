import { useRef, useState, useEffect } from 'react';
import Modal from './Modal';
import './VoterSlipModal.css';

// Helper to join name parts
const joinName = (...parts) => {
  return parts.filter(Boolean).join(' ').trim();
};

/**
 * Detect if running inside Android WebView / Mobile APK
 * 
 * WebView context detection is necessary because:
 * - Android WebView does NOT support <a download> attribute reliably
 * - Programmatic link.click() may be blocked
 * - Blob URLs need explicit native bridge handling
 * 
 * Detection methods:
 * 1. User agent string contains "wv" (WebView identifier)
 * 2. window.Android exists (custom Android bridge)
 * 3. window.ReactNativeWebView exists (React Native WebView bridge)
 * 4. window.Capacitor exists (Capacitor framework)
 */
const isWebViewContext = () => {
  const userAgent = navigator.userAgent || '';
  const isAndroidWebView = /Android.*wv|wv.*Android/i.test(userAgent);
  const hasAndroidBridge = typeof window.Android !== 'undefined';
  const hasReactNativeBridge = typeof window.ReactNativeWebView !== 'undefined';
  const hasCapacitor = typeof window.Capacitor !== 'undefined';
  
  return isAndroidWebView || hasAndroidBridge || hasReactNativeBridge || hasCapacitor;
};

// Helper to convert blob to base64
const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result.split(',')[1]; // Remove data:image/jpeg;base64, prefix
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const VoterSlipModal = ({ isOpen, onClose, voter }) => {
  const printRef = useRef(null);
  const [showFullAddress, setShowFullAddress] = useState(false);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setShowFullAddress(false);
    }
  }, [isOpen]);

  if (!voter) return null;

  const marathiName = joinName(voter.lFirstName, voter.lMiddleName, voter.lLastName) || voter.lVoterName || '-';
  const englishName = joinName(voter.eFirstName, voter.eMiddleName, voter.eLastName) || '-';

  // Truncate address (2 lines max, ~80 chars)
  const truncateAddress = (address, maxLength = 80) => {
    if (!address || address === '-') return '-';
    if (address.length <= maxLength) return address;
    return address.substring(0, maxLength) + '...';
  };

  const addressText = showFullAddress ? (voter.lBoothaddress || '-') : truncateAddress(voter.lBoothaddress);
  const shouldShowExpandBtn = voter.lBoothaddress && voter.lBoothaddress.length > 80;

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

      // Check if running in WebView/APK context
      if (isWebViewContext()) {
        // WebView: MUST use native Android print - NEVER use window.open() or window.print()
        if (typeof window.Android !== 'undefined' && window.Android.printSlip) {
          const base64 = canvas.toDataURL('image/png', 1.0).split(',')[1]; // Remove data:image/png;base64, prefix
          const filename = `voter-slip-${voter.vcardid || 'voter'}-${Date.now()}.png`;
          window.Android.printSlip(base64, filename);
          return;
        } else {
          // Native bridge not available - show error instead of opening window
          console.error('Print not available: Android bridge not found');
          alert('Print is not available in this app. Please use the download option.');
          return;
        }
      }

      // Desktop browser: Use standard print window approach
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

      const filename = `voter-slip-${voter.vcardid || 'voter'}-${Date.now()}.${format}`;
      const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';

      // Check if running in WebView / APK context
      if (isWebViewContext()) {
        // WebView/APK: Use native bridge or fallback
        await downloadSlipInWebView(canvas, filename, mimeType);
      } else {
        // Desktop browser: Use standard download approach
        canvas.toBlob((blob) => {
          if (!blob) return;
          
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, mimeType, 0.95);
      }
    } catch (error) {
      console.error('Error generating image:', error);
      // Fallback to print if image generation fails
      handlePrint();
    }
  };

  /**
   * Download helper for WebView/APK context
   * 
   * Android WebView limitations:
   * - <a download> attribute is not supported
   * - Programmatic link.click() may be blocked
   * - Blob URLs require native bridge for file saving
   * 
   * Strategy:
   * 1. Try Android native bridge (window.Android.saveImage)
   * 2. Try React Native WebView bridge (postMessage)
   * 3. Try Capacitor Filesystem API
   * 4. Fallback: Open image in new tab for manual long-press save
   */
  const downloadSlipInWebView = async (canvas, filename, mimeType) => {
    try {
      // Convert canvas to blob first
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        }, mimeType, 0.95);
      });

      // Try Android native bridge first
      if (typeof window.Android !== 'undefined' && window.Android.saveImage) {
        const base64 = await blobToBase64(blob);
        window.Android.saveImage(base64, filename);
        return;
      }

      // Try React Native WebView bridge
      if (typeof window.ReactNativeWebView !== 'undefined') {
        const base64 = await blobToBase64(blob);
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'DOWNLOAD_IMAGE',
          data: base64,
          filename: filename,
          mimeType: mimeType
        }));
        return;
      }

      // Try Capacitor Filesystem API
      if (typeof window.Capacitor !== 'undefined' && window.Capacitor.Plugins?.Filesystem) {
        const base64 = await blobToBase64(blob);
        const { Filesystem } = window.Capacitor.Plugins;
        await Filesystem.writeFile({
          path: filename,
          data: base64,
          directory: Filesystem.Directory.Documents
        });
        // Show success message if Capacitor.Dialog is available
        if (window.Capacitor.Plugins?.Dialog) {
          window.Capacitor.Plugins.Dialog.alert({
            title: 'Download Complete',
            message: `File saved: ${filename}`
          });
        }
        return;
      }

      // Fallback: Show error message instead of opening window
      // DO NOT use window.open() in WebView - it causes navigation issues
      console.error('Download failed: Native bridge not available');
      alert('Download is not available. Please check app permissions.');
    } catch (error) {
      console.error('Error downloading in WebView:', error);
      // DO NOT open window - show error instead
      alert('Download failed: ' + error.message);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="large" title={null}>
      <div className="voter-slip-container">
        {/* Unified Layout - Same for Web and Mobile, CSS handles responsive differences */}
        <div ref={printRef} className="voter-slip-print" id="voter-slip-content">
          {/* Header: Bilingual title */}
          <div className="voter-slip-header">
            <h1>पुणे महानगरपालिका</h1>
            <h2>Pune Municipal Corporation</h2>
          </div>

          {/* Divider */}
          <div className="voter-slip-divider"></div>

          {/* Voter Name: Combined Marathi + English in single compact section */}
          <div className="voter-slip-name-compact">
            <div className="voter-slip-name-marathi-compact">{marathiName}</div>
            {englishName !== '-' && (
              <div className="voter-slip-name-english-compact">{englishName}</div>
            )}
          </div>

          {/* Divider */}
          <div className="voter-slip-divider"></div>

          {/* EPIC Number: Label and value in ONE ROW */}
          <div className="voter-slip-epic-row">
            <span className="voter-slip-epic-label-row">EPIC No:</span>
            <span className="voter-slip-epic-value-row">{voter.vcardid || '-'}</span>
          </div>

          {/* Divider */}
          <div className="voter-slip-divider"></div>

          {/* All Booth/Prabhag/Yadibhag/SR No in SINGLE ROW (grid, wraps on small screens) */}
          <div className="voter-slip-info-grid">
            {voter.boothNo && (
              <div className="voter-slip-info-item">
                <span className="voter-slip-info-label">Booth:</span>
                <span className="voter-slip-info-value">{voter.boothNo}</span>
              </div>
            )}
            {voter.prabhag && (
              <div className="voter-slip-info-item">
                <span className="voter-slip-info-label">Prabhag:</span>
                <span className="voter-slip-info-value">{voter.prabhag}</span>
              </div>
            )}
            {voter.yadibhag && (
              <div className="voter-slip-info-item">
                <span className="voter-slip-info-label">Yadibhag:</span>
                <span className="voter-slip-info-value">{voter.yadibhag}</span>
              </div>
            )}
            {voter.srno && (
              <div className="voter-slip-info-item">
                <span className="voter-slip-info-label">SR No:</span>
                <span className="voter-slip-info-value">{voter.srno}</span>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="voter-slip-divider"></div>

          {/* Polling Booth Address: Label + value with expand/collapse */}
          <div className="voter-slip-address-compact">
            <div className="voter-slip-address-label-compact">Polling Booth Address</div>
            <div className="voter-slip-address-value-compact">{addressText}</div>
            {shouldShowExpandBtn && (
              <button
                onClick={() => setShowFullAddress(!showFullAddress)}
                className="voter-slip-expand-btn-compact"
                type="button"
              >
                {showFullAddress ? 'Show less' : 'Show full address'}
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons: Icon-only horizontal bar, minimal height */}
        <div className="voter-slip-actions">
          <button 
            onClick={handlePrint} 
            className="voter-slip-action-icon"
            title="Print"
            aria-label="Print voter slip"
          >
            🖨
          </button>
          <button 
            onClick={() => handleDownloadImage('png')} 
            className="voter-slip-action-icon"
            title="Download PNG"
            aria-label="Download as PNG"
          >
            🖼
          </button>
          <button 
            onClick={() => handleDownloadImage('jpg')} 
            className="voter-slip-action-icon voter-slip-download-jpg"
            title="Download JPG"
            aria-label="Download as JPG"
          >
            📷
          </button>
          <button 
            onClick={onClose} 
            className="voter-slip-action-icon"
            title="Close"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default VoterSlipModal;
