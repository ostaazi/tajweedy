const handleExportPDF = async () => {
  try {
    const { jsPDF } = await import('jspdf');
    await import('jspdf-autotable');
    
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    let yPos = 20;

    // ✅ 1. تحميل خط Amiri فقط
    try {
      const amiriFont = await fetch('/fonts/amiri-regular.ttf').then(r => r.arrayBuffer());
      const amiriBase64 = btoa(String.fromCharCode(...new Uint8Array(amiriFont)));
      doc.addFileToVFS('amiri-regular.ttf', amiriBase64);
      doc.addFont('amiri-regular.ttf', 'amiri', 'normal');
    } catch (err) {
      console.warn('Amiri font not loaded, using default');
    }

    // ✅ 2. صفحة الغلاف
    doc.setFont('amiri', 'normal');
    doc.setFontSize(24);
    doc.setTextColor(30, 120, 80);
    doc.text('تقرير أحكام التجويد - Tajweedy', 105, 40, { align: 'center' });

    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text(formatDate(new Date()), 105, 55, { align: 'center' });

    doc.setFontSize(18);
    doc.setTextColor(30, 120, 80);
    doc.text(`النتيجة: ${percentage}% (${score}/${total})`, 105, 75, { align: 'center' });

    // ✅ 3. QR Code
    if (qrSrc) {
      try {
        const qrImg = new Image();
        qrImg.crossOrigin = 'anonymous';
        qrImg.src = qrSrc;
        await new Promise((resolve, reject) => {
          qrImg.onload = resolve;
          qrImg.onerror = reject;
          setTimeout(reject, 3000);
        });
        doc.addImage(qrImg, 'PNG', 80, 90, 50, 50);
      } catch (err) {
        console.warn('QR Code not loaded');
      }
    }

    // ✅ 4. صفحة الأسئلة
    doc.addPage();
    yPos = 30;

    doc.setFontSize(18);
    doc.setTextColor(30, 120, 80);
    doc.text('إحصاءات الأسئلة', 105, yPos, { align: 'center' });
    yPos += 15;

    // جدول الأسئلة
    const questionsData = responses.map((r, idx) => {
      const percentage = r.correct ? '100%' : '0%';
      return [
        convertToArabicNumbers(String(idx + 1)),
        percentage,
        convertToArabicNumbers(String(r.correctAnswer)),
        convertToArabicNumbers(String(r.userAnswer || '-')),
        r.section || '-',
        r.question
      ];
    });

    doc.autoTable({
      startY: yPos,
      head: [['#', 'النسبة', 'الصحيح', 'إجابتك', 'القسم', 'السؤال']],
      body: questionsData,
      styles: {
        font: 'amiri',
        fontSize: 10,
        halign: 'right',
        cellPadding: 3
      },
      headStyles: {
        fillColor: [30, 120, 80],
        textColor: [255, 255, 255],
        fontSize: 11,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        0: { cellWidth: 12 },
        1: { cellWidth: 20 },
        2: { cellWidth: 18 },
        3: { cellWidth: 18 },
        4: { cellWidth: 35 },
        5: { cellWidth: 70 }
      }
    });

    yPos = doc.lastAutoTable.finalY + 20;

    // ✅ 5. إحصاءات الأقسام
    if (yPos > 240) {
      doc.addPage();
      yPos = 30;
    }

    doc.setFontSize(16);
    doc.text('إحصاءات الأقسام', 105, yPos, { align: 'center' });
    yPos += 10;

    for (const section of SECTIONS) {
      const sectionData = stats[section.key];
      if (!sectionData) continue;

      if (yPos > 220) {
        doc.addPage();
        yPos = 30;
      }

      doc.setFontSize(14);
      doc.setTextColor(30, 120, 80);
      doc.text(section.title, 105, yPos, { align: 'center' });
      yPos += 8;

      const tableData = Object.entries(sectionData).map(([key, val]) => [
        convertToArabicNumbers(val.percentage),
        convertToArabicNumbers(String(val.total)),
        convertToArabicNumbers(String(val.incorrect)),
        convertToArabicNumbers(String(val.correct)),
        val.title
      ]);

      doc.autoTable({
        startY: yPos,
        head: [['النسبة %', 'إجمالي', 'خاطئ', 'صحيح', 'القسم الفرعي']],
        body: tableData,
        styles: {
          font: 'amiri',
          fontSize: 11,
          halign: 'right',
          cellPadding: 3
        },
        headStyles: {
          fillColor: [30, 120, 80],
          textColor: [255, 255, 255]
        }
      });

      yPos = doc.lastAutoTable.finalY + 12;
    }

    // ✅ حفظ PDF
    doc.save(`Tajweedy-Report-${attemptId}.pdf`);
  } catch (error) {
    console.error('PDF Export Error:', error);
    alert('حدث خطأ أثناء تصدير PDF');
  }
};
