"""
PDF Parser for Danish Ministry of Education Timetables
Handles parsing of ministry PDF documents with subject hour requirements
"""

import requests
import io
from typing import List, Dict, Optional, Tuple
import pandas as pd
import re
from datetime import datetime
import pdfplumber
import io


class MinistryPDFParser:
    def __init__(self):
        self.session = requests.Session()
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    
    def download_pdf(self, url: str) -> bytes:
        """Download PDF from URL"""
        try:
            response = self.session.get(url, headers=self.headers, timeout=30)
            response.raise_for_status()
            return response.content
        except Exception as e:
            print(f"Error downloading PDF: {e}")
            return None
    
    def extract_table_from_pdf(self, pdf_bytes: bytes) -> str:
        """Extraction using pdfplumber"""
        try:
            pdf_file = io.BytesIO(pdf_bytes)
            
            with pdfplumber.open(pdf_file) as pdf:
                page = pdf.pages[0]
                page_table = page.extract_table()
            return page_table
        except Exception as e:
            print(f"Error with pdfplumber: {e}")
            return ""
    
    
    def parse_grade_levels(self, table: list[list[str]]) -> Dict[str, Dict[str, int]]:
        """Parse requirements by grade levels"""
        
        #remove useless info
        table = [row for row in table if row[0] not in ['Klassetrin', 'Humanistiske fag', 'Naturfag', 'Praktiske/musiske fag', 'Valgfag', '(inkl. fagtimer, skolens timebank og pauser)']]

        requirements = {}

        for row in table:
            row[0] = row[0].replace(" (minimumstimetal)", "")
            requirements[row[0]] = {}
            for i, value in enumerate(row[1:]):
                requirements[row[0]][i] = (int(value.replace("*", "").replace(".", "")) * 4/3) / 40 if value not in ["-", None] else 0
        return requirements

    def extract_year_from_url(self, url: str) -> int:
        """Extract school year from URL"""
        year_match = re.search(r'(\d{4})-(\d{4})', url)
        if year_match:
            return int(year_match.group(1))
        return datetime.now().year
    
    def parse_ministry_pdf(self, url: str) -> Dict:
        """Main method to parse ministry PDF"""
        print(f"Downloading PDF from: {url}")
        
        # Download PDF
        pdf_bytes = self.download_pdf(url)
        if not pdf_bytes:
            return {'error': 'Failed to download PDF'}
        
        # Extract text
        table = self.extract_table_from_pdf(pdf_bytes)
        if not table:
            return {'error': 'Failed to extract text from PDF'}
        
        # Parse requirements
        grade_requirements = self.parse_grade_levels(table)
        
        # Extract year
        year = self.extract_year_from_url(url)
        
        return {
            'year': year,
            'url': url,
            'grade_requirements': grade_requirements,
            'total_subjects': len(grade_requirements) - 3, # Subtract the last 3 rows (total, timebank, total time)
            'extraction_date': datetime.now().isoformat(),
        }

def main():
    """Test the PDF parser"""
    parser = MinistryPDFParser()
    
    # Test with the provided URL
    url = "https://uvm.dk/media/dfnbhhem/241218-timetalsoversigt-for-skoleaaret-2026-2027-pdf.pdf"
    
    # Try to parse the PDF
    result = parser.parse_ministry_pdf(url)

    print(result)
    return result

if __name__ == "__main__":
    main()
