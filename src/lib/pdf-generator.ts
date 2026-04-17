import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import { ResultData } from "@/types/result";
import { calculatePercentage, getResultStatus, isSubjectPass } from "./result-utils";

async function _loadImageAsDataUrl(src: string): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL("image/png"));
            return;
          }
        } catch (e) {
          // fallthrough
        }
        resolve(null);
      };
      img.onerror = () => resolve(null);
      img.src = src;
    } catch (e) {
      resolve(null);
    }
  });
}

export async function generatePDF(result: ResultData, options?: { download?: boolean }): Promise<Blob | void> {
  const { student, subjects } = result;
  const download = options?.download ?? true;
  const percentage = calculatePercentage(subjects);
  const status = getResultStatus(percentage, subjects);
  const totalObtained = subjects.reduce((s, sub) => s + sub.marksObtained, 0);
  const totalMax = subjects.reduce((s, sub) => s + sub.maxMarks, 0);

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Try to capture the rendered preview (#result-sheet) and embed as image into PDF
  try {
    const el = document.getElementById("result-sheet");
    if (el) {
      const canvas = await html2canvas(el as HTMLElement, { scale: 2, backgroundColor: null });
      const imgData = canvas.toDataURL("image/png");
      const imgProps = (doc as any).getImageProperties(imgData);
      const pdfWidth = pageWidth - 16; // margins
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      doc.addImage(imgData, "PNG", 8, 8, pdfWidth, pdfHeight);
      if (download) {
        doc.save(`${student.name.replace(/\s+/g, "_")}_Sem${student.semester}_Result.pdf`);
        return;
      }
      return doc.output("blob") as Blob;
    }
  } catch (e) {
    // fallback to programmatic PDF
  }

  // Header background
  doc.setFillColor(55, 65, 130);
  doc.rect(0, 0, pageWidth, 45, "F");
  // Try to load and embed logo (public/cimage-logo.webp)
  try {
    const logoData = await _loadImageAsDataUrl("/cimage-logo.webp");
    if (logoData) {
      // place logo on left side of header
      doc.addImage(logoData, "PNG", 12, 8, 28, 28);
    }
  } catch (e) {
    // ignore
  }

  // Header text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(student.universityName.toUpperCase(), pageWidth / 2, 18, { align: "center" });
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Statement of Marks — ${student.courseName}`, pageWidth / 2, 28, { align: "center" });
  doc.setFontSize(9);
  doc.text(`Semester ${student.semester} • Academic Year ${student.academicYear}`, pageWidth / 2, 36, { align: "center" });

  // Student info
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(10);
  let y = 55;
  doc.setFont("helvetica", "bold");
  doc.text("Name:", 14, y);
  doc.setFont("helvetica", "normal");
  doc.text(student.name, 45, y);

  if (student.rollNumber) {
    doc.setFont("helvetica", "bold");
    doc.text("Roll No:", 100, y);
    doc.setFont("helvetica", "normal");
    doc.text(student.rollNumber, 130, y);
  }

  if (student.registrationNumber) {
    y += 8;
    doc.setFont("helvetica", "bold");
    doc.text("Reg No:", 14, y);
    doc.setFont("helvetica", "normal");
    doc.text(student.registrationNumber, 45, y);
  }

  y += 12;

  // Table
  const tableData = subjects.map((sub, i) => [
    String(i + 1),
    sub.name,
    String(sub.maxMarks),
    String(sub.marksObtained),
    isSubjectPass(sub) ? "Pass" : "Fail",
  ]);

  tableData.push(["", "Total", String(totalMax), String(totalObtained), ""]);

  autoTable(doc, {
    startY: y,
    head: [["#", "Subject", "Max Marks", "Obtained", "Status"]],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [55, 65, 130], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: {
      0: { cellWidth: 12, halign: "center" },
      2: { halign: "center", cellWidth: 28 },
      3: { halign: "center", cellWidth: 28 },
      4: { halign: "center", cellWidth: 22 },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 4) {
        if (data.cell.raw === "Fail") {
          data.cell.styles.textColor = [220, 50, 50];
          data.cell.styles.fontStyle = "bold";
        } else if (data.cell.raw === "Pass") {
          data.cell.styles.textColor = [34, 139, 34];
          data.cell.styles.fontStyle = "bold";
        }
      }
      // Bold total row
      if (data.section === "body" && data.row.index === subjects.length) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = [240, 240, 250];
      }
    },
  });

  // Footer
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`Percentage: ${percentage.toFixed(2)}%`, 14, finalY);
  doc.text(`Result: ${status}`, pageWidth - 14, finalY, { align: "right" });

  // Line
  doc.setDrawColor(55, 65, 130);
  doc.setLineWidth(0.5);
  doc.line(14, finalY + 5, pageWidth - 14, finalY + 5);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(130, 130, 130);
  doc.text("Generated by UniResult", pageWidth / 2, finalY + 12, { align: "center" });

  if (download) {
    doc.save(`${student.name.replace(/\s+/g, "_")}_Sem${student.semester}_Result.pdf`);
    return;
  }
  return doc.output("blob") as Blob;
}
