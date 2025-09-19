import PyPDF2
from docx import Document
import io
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, ListFlowable, ListItem
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.units import mm
from reportlab.lib import colors

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

def render_resume_pdf_bytes(resume: dict) -> bytes:
    """
    Render a RenderCV-like resume dict to PDF bytes.
    """
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
        title="Resume",
    )

    styles = getSampleStyleSheet()
    h1 = ParagraphStyle("Title", parent=styles["Heading1"], fontSize=18, leading=22, spaceAfter=6)
    h2 = ParagraphStyle("Section", parent=styles["Heading2"], fontSize=13, spaceBefore=12, spaceAfter=6)
    normal = styles["BodyText"]
    small = ParagraphStyle("Small", parent=styles["BodyText"], fontSize=9, textColor=colors.grey, spaceAfter=6)
    bullet_style = ParagraphStyle("Bullet", parent=styles["BodyText"], bulletIndent=10, leftIndent=12)

    def add_section(title: str):
        story.append(Paragraph(title, h2))

    def fmt(val):
        return val if val is not None else ""

    basics = resume.get("basics", {}) or {}
    summary = resume.get("summary", "") or ""
    work = resume.get("work", []) or []
    education = resume.get("education", []) or []
    skills = resume.get("skills", []) or []
    projects = resume.get("projects", []) or []

    story = []
    # Header
    name = fmt(basics.get("name", ""))
    story.append(Paragraph(name or "Unnamed Candidate", h1))

    contacts = " | ".join(
        [v for v in [fmt(basics.get("email")), fmt(basics.get("phone")), fmt(basics.get("location")), fmt(basics.get("website"))] if v]
    )
    if contacts:
        story.append(Paragraph(contacts, small))
    story.append(Spacer(1, 6))

    # Summary
    if summary:
        add_section("Summary")
        story.append(Paragraph(summary, normal))

    # Skills
    if skills:
        add_section("Skills")
        story.append(Paragraph(", ".join(skills), normal))

    # Work Experience
    if work:
        add_section("Work Experience")
        for w in work:
            company = fmt(w.get("name"))
            position = fmt(w.get("position"))
            location = fmt(w.get("location"))
            start_d = fmt(w.get("startDate"))
            end_d = fmt(w.get("endDate"))
            emp_type = fmt(w.get("employmentType"))
            header = " — ".join([p for p in [position, company] if p])
            sub = " | ".join([p for p in [location, f"{start_d} - {end_d}" if start_d or end_d else "", emp_type] if p])

            if header:
                story.append(Paragraph(header, styles["Heading3"]))
            if sub:
                story.append(Paragraph(sub, small))

            highlights = w.get("highlights") or []
            if highlights:
                bullets = [ListItem(Paragraph(h, normal)) for h in highlights if str(h).strip()]
                story.append(ListFlowable(bullets, bulletType="bullet", leftIndent=12))
            story.append(Spacer(1, 4))

    # Projects
    if projects:
        add_section("Projects")
        for p in projects:
            title = fmt(p.get("name"))
            url = fmt(p.get("url")) or fmt(p.get("github"))
            header = " — ".join([v for v in [title, url] if v])
            if header:
                story.append(Paragraph(header, styles["Heading3"]))
            desc = fmt(p.get("description"))
            if desc:
                story.append(Paragraph(desc, normal))
            ph = p.get("highlights") or []
            if ph:
                bullets = [ListItem(Paragraph(h, normal)) for h in ph if str(h).strip()]
                story.append(ListFlowable(bullets, bulletType="bullet", leftIndent=12))
            story.append(Spacer(1, 4))

    # Education
    if education:
        add_section("Education")
        for e in education:
            inst = fmt(e.get("institution"))
            degree = fmt(e.get("studyType"))
            area = fmt(e.get("area"))
            start_d = fmt(e.get("startDate"))
            end_d = fmt(e.get("endDate"))
            score = fmt(e.get("score"))
            header = " — ".join([v for v in [degree, area] if v]) or area or degree
            top = " | ".join([v for v in [inst, f"{start_d} - {end_d}" if start_d or end_d else ""] if v])
            if top:
                story.append(Paragraph(top, styles["Heading3"]))
            if header:
                story.append(Paragraph(header, small))
            if score:
                story.append(Paragraph(f"Grade: {score}", small))
            story.append(Spacer(1, 4))

    doc.build(story)
    return buf.getvalue()
