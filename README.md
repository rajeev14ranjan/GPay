
# Google Pay Receipt Generator

A sophisticated web application that generates authentic-looking Google Pay receipts with advanced security features and rate limiting.

## ⚠️ IMPORTANT DISCLAIMER

**READ BEFORE USE - BY USING THIS PROJECT YOU AGREE TO THE FOLLOWING:**

1. **Educational Purpose Only**: This project is created solely for educational and demonstration purposes to showcase web development techniques, security implementations, and rate limiting systems.

2. **Anti-Scam Protection**: The intended use is to help potential victims of scammers who fraudulently request payment receipts. Users can share these generated images instead of real receipts to protect themselves from fraud.

3. **Zero Liability**: The repository owner, contributors, and hosting platforms assume NO responsibility, liability, or accountability for ANY misuse, consequences, damages, or legal issues arising from the use of this tool.

4. **User Responsibility**: By accessing, downloading, or using this project, you explicitly agree that you are solely and entirely responsible for your actions and any consequences thereof.

5. **No Endorsement**: This project does not endorse or encourage any illegal, fraudulent, or unethical activities.

6. **Legal Compliance**: Users must ensure their use complies with all applicable local, state, federal, and international laws.

**IF YOU DO NOT AGREE WITH THESE TERMS, DO NOT USE THIS PROJECT.**

---

## 🚀 Features

### Core Functionality
- **📝 Fully Editable Interface**: Click any field to customize recipient name, amount, payment details, transaction IDs
- **🔄 Dynamic Status Toggle**: Switch between "Completed", "Payment Processing", and "Payment Failed" states
- **📱 Avatar Toggle**: Switch between profile image and letter avatar
- **📅 Auto Date/Time**: Automatically updates to current timestamp
- **🎨 Authentic Design**: Pixel-perfect replica of Google Pay interface


## 🔧 Technical Implementation

### File Structure
```
GPay/
├── index.html          # Main interface and UI logic
├── styles.css          # Mobile-responsive styling with vendor prefixes
├── limit.js            # Rate limiting, security, and screenshot protection
├── img/
│   ├── profile.jpg     # Default avatar image
│   └── footer.png      # UPI/Google Pay branding
└── README.md           # Project documentation
```

### Security Architecture
- **Client-Side Rate Limiting**: Multi-storage approach using localStorage, sessionStorage, and cookies
- **Browser Fingerprinting**: Canvas rendering, hardware specs, screen metrics, navigator properties
- **Screenshot Prevention**: Keyboard shortcut blocking, focus detection, visibility API, print media queries
- **Anti-Tampering**: Data integrity checks and manipulation detection

## 🎮 How to Use

### Basic Usage
1. **📝 Edit Fields**: Click any highlighted text to customize:
   - Recipient name and phone number
   - Payment amount (auto-formatted with commas)
   - Payment description and status
   - Transaction date and IDs
   - Bank and sender details

2. **🎨 Customize Appearance**: 
   - Click avatar to toggle between image/letter
   - Click status to cycle through states
   - All changes are real-time

3. **📸 Generate Receipt**: 
   - Click "Capture" button
   - Receipt automatically copies to clipboard
   - Shows remaining daily uses

## 🚦 Rate Limiting Details

### Daily Limits
- **Standard Users**: 5 captures per 24 hours
- **Authorized Access**: Enhanced privileges for authorized users
- **Reset Schedule**: 24 hours from first use
- **Cross-Session**: Persistent across browser restarts


## ⚙️ Setup & Installation

### Local Development
```bash
# Clone repository
git clone https://github.com/rajeev14ranjan/GPay.git
cd GPay

# Start local server
python3 -m http.server 8000
# OR
npx http-server .
# OR
php -S localhost:8000

# Open browser
open http://localhost:8000
```

### Requirements
- Modern web browser with JavaScript enabled
- Clipboard API support (for copy functionality)
- Local/HTTPS server (for security features)

## 🎯 Live Demo

**Try it now:** [https://rajeev14ranjan.github.io/GPay/](https://rajeev14ranjan.github.io/GPay/)


**Remember**: This tool is for educational and protective purposes only. Always use technology ethically and responsibly.