const handleExportPDF = async () => {
  if (!attempt) {
    alert('⚠️ لا توجد بيانات للتصدير');
    return;
  }

  try {
    // ✅ استخدم import بدلاً من require
    const { jsPDF } = await import('jspdf');
    await import('jspdf-autotable');

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    let yPos = 60;

    // Header
    doc.setFontSize(22);
    doc.setTextColor(30, 120, 80);
    doc.text('Tajweedy - تقرير أحكام التجويد', pageWidth / 2, yPos, { align: 'center' });
    yPos += 40;

    // التاريخ
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(formatDateEnRtl(attempt.date || Date.now()), pageWidth / 2, yPos, { align: 'center' });
    yPos += 40;

    // الدرجة
    const score = attempt.score ?? 0;
    const total = attempt.total ?? 0;
    const percentage = total ? Math.round((score / total) * 100) : 0;

    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(`النتيجة: ${toEnglishDigits(score)} / ${toEnglishDigits(total)} (${toEnglishDigits(percentage)}%)`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 60;

    // إحصاءات الأسئلة
    if (aggregates.qArr && aggregates.qArr.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(30, 120, 80);
      doc.text('إحصاءات الأسئلة', pageWidth / 2, yPos, { align: 'center' });
      yPos += 20;

      const qTableData = aggregates.qArr.map(q => [
        q.question || '-',
        q.section || '-',
        toEnglishDigits(q.right),
        toEnglishDigits(q.wrong),
        toEnglishDigits(q.total),
        `${toEnglishDigits(q.pct)}%`
      ]);

      doc.autoTable({
        startY: yPos,
        head: [['السؤال', 'القسم', 'صحيح', 'خاطئ', 'إجمالي', 'النسبة']],
        body: qTableData,
        styles: { 
          fontSize: 10, 
          halign: 'right',
          cellPadding: 5
        },
        headStyles: { 
          fillColor: [30, 120, 80], 
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        theme: 'grid',
        margin: { left: 40, right: 40 }
      });

      yPos = doc.lastAutoTable.finalY + 30;
    }

    // إحصاءات الأقسام
    if (aggregates.sArr && aggregates.sArr.length > 0) {
      if (yPos > pageHeight - 100) {
        doc.addPage();
        yPos = 60;
      }

      doc.setFontSize(14);
      doc.setTextColor(30, 120, 80);
      doc.text('إحصاءات الأقسام', pageWidth / 2, yPos, { align: 'center' });
      yPos += 20;

      aggregates.sArr.forEach((s) => {
        if (yPos > pageHeight - 100) {
          doc.addPage();
          yPos = 60;
        }

        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(s.section || 'غير محدد', pageWidth / 2, yPos, { align: 'center' });
        yPos += 15;

        const sTableData = s.subs && s.subs.length > 0 
          ? s.subs.map(sub => [
              sub.subsection || '-',
              toEnglishDigits(sub.right),
              toEnglishDigits(sub.wrong),
              toEnglishDigits(sub.total),
              `${toEnglishDigits(sub.pct)}%`
            ])
          : [['لا توجد بيانات', '-', '-', '-', '-']];

        sTableData.push([
          'إجمالي القسم',
          toEnglishDigits(s.right),
          toEnglishDigits(s.wrong),
          toEnglishDigits(s.total),
          `${toEnglishDigits(s.pct)}%`
        ]);

        doc.autoTable({
          startY: yPos,
          head: [['القسم الفرعي', 'صحيح', 'خاطئ', 'إجمالي', 'النسبة']],
          body: sTableData,
          styles: { 
            fontSize: 10, 
            halign: 'right',
            cellPadding: 5
          },
          headStyles: { 
            fillColor: [30, 120, 80], 
            textColor: [255, 255, 255] 
          },
          bodyStyles: {
            fillColor: (rowIndex) => rowIndex === sTableData.length - 1 ? [240, 240, 240] : null,
            fontStyle: (rowIndex) => rowIndex === sTableData.length - 1 ? 'bold' : 'normal'
          },
          theme: 'grid',
          margin: { left: 40, right: 40 }
        });

        yPos = doc.lastAutoTable.finalY + 20;
      });
    }

    // QR Code
    doc.addPage();
    yPos = 100;

    doc.setFontSize(14);
    doc.setTextColor(30, 120, 80);
    doc.text('رمز الاستجابة السريع', pageWidth / 2, yPos, { align: 'center' });
    yPos += 30;

    if (qrSrc) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = qrSrc;
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          setTimeout(reject, 3000);
        });

        doc.addImage(img, 'PNG', pageWidth / 2 - 75, yPos, 150, 150);
      } catch (err) {
        console.warn('⚠️ QR not added:', err);
      }
    }

    doc.save(`tajweedy-report-${attemptId}.pdf`);
    console.log('✅ PDF exported');
  } catch (error) {
    console.error('❌ PDF error:', error);
    alert('❌ حدث خطأ أثناء التصدير');
  }
};
