"""PDF and Markdown report generation."""
import io
from datetime import datetime

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors


def generate_resume_report_pdf(data: dict) -> bytes:
    """Generate PDF report for resume analysis."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.75*inch, bottomMargin=0.75*inch)
    styles = getSampleStyleSheet()
    story = []

    title_style = ParagraphStyle("Title", parent=styles["Title"], fontSize=20, spaceAfter=12)
    h2_style = ParagraphStyle("H2", parent=styles["Heading2"], fontSize=14, spaceBefore=16, spaceAfter=6)
    normal = styles["Normal"]

    story.append(Paragraph("CareerPilot AI — Resume Analysis Report", title_style))
    story.append(Paragraph(f"Generated: {datetime.now().strftime('%B %d, %Y')}", normal))
    story.append(Spacer(1, 0.2*inch))

    # Scores
    story.append(Paragraph("Score Summary", h2_style))
    score_data = [
        ["Metric", "Score"],
        ["Overall Resume Score", f"{data.get('overall_score', '—')}/100"],
        ["ATS Score", f"{data.get('ats_score', '—')}/100"],
    ]
    t = Table(score_data, colWidths=[3*inch, 2*inch])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1d4ed8")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
        ("PADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(t)

    # Strengths
    strengths = data.get("strengths") or []
    if strengths:
        story.append(Paragraph("Strengths", h2_style))
        for s in strengths:
            story.append(Paragraph(f"• {s}", normal))

    # Weaknesses
    weaknesses = data.get("weaknesses") or []
    if weaknesses:
        story.append(Paragraph("Areas to Improve", h2_style))
        for w in weaknesses:
            story.append(Paragraph(f"• {w}", normal))

    # Suggestions
    suggestions = data.get("suggestions") or []
    if suggestions:
        story.append(Paragraph("Priority Actions", h2_style))
        for sug in suggestions[:6]:
            priority = sug.get("priority", "medium").upper()
            story.append(Paragraph(f"[{priority}] {sug.get('message', '')}", normal))

    doc.build(story)
    return buffer.getvalue()


def generate_resume_report_markdown(data: dict) -> str:
    lines = ["# CareerPilot AI — Resume Analysis Report", f"\nGenerated: {datetime.now().strftime('%B %d, %Y')}", ""]
    lines.append(f"## Score Summary\n- **Overall Score:** {data.get('overall_score', '—')}/100\n- **ATS Score:** {data.get('ats_score', '—')}/100\n")

    if data.get("strengths"):
        lines.append("## Strengths")
        for s in data["strengths"]:
            lines.append(f"- {s}")
        lines.append("")

    if data.get("weaknesses"):
        lines.append("## Areas to Improve")
        for w in data["weaknesses"]:
            lines.append(f"- {w}")
        lines.append("")

    if data.get("suggestions"):
        lines.append("## Priority Actions")
        for sug in data["suggestions"][:6]:
            lines.append(f"- **[{sug.get('priority','').upper()}]** {sug.get('message','')}")
        lines.append("")

    return "\n".join(lines)
