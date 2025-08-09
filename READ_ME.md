# Google Pay Receipt Generator

A customizable Google Pay receipt generator that allows you to create realistic-looking payment receipts with editable content.

## Features

- **Editable Content**: Click on any text field to edit recipient name, amount, payment description, transaction IDs, and more
- **Status Toggle**: Click on the status section to toggle between "Completed" and "Payment processing" states
- **Screenshot Functionality**: Generate high-quality screenshots that can be copied to clipboard or downloaded
- **Responsive Design**: Works on both desktop and mobile devices
- **Realistic Styling**: Matches Google Pay's actual receipt design

## To run this project

```bash
python3 -m http.server 8000
```

Then open your browser and navigate to `http://localhost:8000`

## How to Use

1. **Edit Details**: Click on any editable field (highlighted when focused) to customize:
   - Recipient name and phone number
   - Payment amount and description
   - Transaction date
   - Bank details and transaction IDs
   - Sender information

2. **Toggle Status**: Click on the status section (green checkmark area) to switch between:
   - ✓ Completed (green)
   - ! Payment processing (orange)

3. **Generate Screenshot**: Click the "Pay again" button to:
   - Copy the receipt image to your clipboard (if supported)
   - Download as PNG file (fallback option)
   - Button can be clicked multiple times

## Technical Details

- Pure HTML, CSS, and JavaScript
- Uses html2canvas library for screenshot generation
- Responsive design with mobile support
- No backend required - runs entirely in the browser

## Browser Compatibility

- Modern browsers with Clipboard API support for copy-to-clipboard functionality
- Falls back to download if clipboard is not supported
- Mobile-responsive design