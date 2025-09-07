import PyPDF2
from docx import Document

def extract_text_from_pdf(file_path):
	"""Extract text from a PDF file."""
	text = ""
	with open(file_path, "rb") as f:
		reader = PyPDF2.PdfReader(f)
		for page in reader.pages:
			text += page.extract_text() or ""
	return text

def extract_text_from_docx(file_path):
	"""Extract text from a DOCX file."""
	doc = Document(file_path)
	return "\n".join([para.text for para in doc.paragraphs])
