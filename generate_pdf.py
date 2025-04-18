import os
from weasyprint import HTML

# Create the output directory if it doesn't exist
os.makedirs('static/downloads', exist_ok=True)

# Convert the HTML file to PDF
HTML('temp_files/privacy_guide.html').write_pdf('static/downloads/privacy.pdf')

print("✅ PDF guide successfully generated!")