import os
import re
from dateutil import parser as date_parser
from django.conf import settings

easyocr_reader = None

def get_reader():
    global easyocr_reader
    if easyocr_reader is None:
        import easyocr
        easyocr_reader = easyocr.Reader(['en'], gpu=False)
    return easyocr_reader

def extract_text(file_path):
    """
    Extract text from a file (PDF or Image).
    Returns the raw extracted text string.
    """
    ext = os.path.splitext(file_path)[1].lower()
    raw_text = ""
    
    if ext == '.pdf':
        try:
            import fitz # PyMuPDF
            doc = fitz.open(file_path)
            for page in doc:
                text = page.get_text()
                raw_text += text + "\n"
            
            # If no text found (scanned PDF), convert to image and run EasyOCR
            if not raw_text.strip():
                raw_text = ""
                reader = get_reader()
                for page in doc:
                    pix = page.get_pixmap()
                    img_bytes = pix.tobytes("png")
                    result = reader.readtext(img_bytes, detail=0)
                    raw_text += " ".join(result) + "\n"
        except Exception as e:
            print(f"PDF extraction error: {e}")
    else:
        # Image file (JPG/PNG/WEBP/etc)
        try:
            reader = get_reader()
            result = reader.readtext(file_path, detail=0)
            raw_text = " ".join(result)
        except Exception as e:
            print(f"Image extraction error: {e}")
            
    return raw_text.strip()

def parse_date(date_str):
    try:
        dt = date_parser.parse(date_str, fuzzy=True)
        return dt.date().isoformat()
    except Exception:
        return None

def parse_fields(raw_text, document_type):
    """
    Parse raw OCR text to extract structured fields based on document type.
    """
    extracted_data = {}
    if not raw_text:
        return extracted_data

    # Match common dates
    date_pattern = r'\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b|\b(\d{4}[/-]\d{1,2}[/-]\d{1,2})\b'
    dates_found = re.findall(date_pattern, raw_text)
    flat_dates = [item for d in dates_found for item in d if item]
    
    # 1. Extracted Name
    name_match = re.search(r'(?:Name|Student Name|Holder Name|Certify that)[:\-]?\s*([A-Za-z\s]{3,30})', raw_text, re.IGNORECASE)
    if name_match:
        extracted_data['extracted_name'] = name_match.group(1).strip()
        
    # 2. Extracted ID / Certificate Number
    id_match = re.search(r'\b([A-Z0-9]{8,16})\b', raw_text)
    if id_match:
        extracted_data['extracted_id_number'] = id_match.group(1)

    # 3. Extracted Date of Birth
    dob_match = re.search(r'(?:DOB|Date of Birth|Born)[:\-]?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', raw_text, re.IGNORECASE)
    if dob_match:
        extracted_data['extracted_dob'] = parse_date(dob_match.group(1))
    elif flat_dates:
        extracted_data['extracted_dob'] = parse_date(flat_dates[0])

    # 4. Extracted Income (for Income Certificate)
    income_match = re.search(r'(?:Income|Annual Income|Rupees|Rs\.?|₹)[:\-]?\s*([\d,]{4,10})', raw_text, re.IGNORECASE)
    if income_match:
        try:
            num_str = income_match.group(1).replace(',', '')
            extracted_data['extracted_income'] = float(num_str)
        except ValueError:
            pass

    # 5. Extracted Institution / College
    inst_match = re.search(r'(?:College|Institution|University|School)[:\-]?\s*([A-Za-z0-9\s]{5,50})', raw_text, re.IGNORECASE)
    if inst_match:
        extracted_data['extracted_institution'] = inst_match.group(1).strip()

    # 6. Extracted CGPA / Marks
    marks_match = re.search(r'(?:CGPA|Percentage|Marks|Grade)[:\-]?\s*([\d\.]{2,5}%?)', raw_text, re.IGNORECASE)
    if marks_match:
        extracted_data['extracted_marks'] = marks_match.group(1).strip()

    # 7. Extracted Category (General/OBC/SC/ST)
    cat_match = re.search(r'\b(General|OBC|SC|ST|EWS)\b', raw_text, re.IGNORECASE)
    if cat_match:
        extracted_data['extracted_category'] = cat_match.group(1).upper()

    return extracted_data
