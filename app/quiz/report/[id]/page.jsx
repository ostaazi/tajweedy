const handleExportPDF = async () => {
  try {
    const { jsPDF } = await import('jspdf');
    await import('jspdf-autotable');
    
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // ✅ تحميل الخطوط
    const amiriFont = await fetch('/fonts/amiri-regular.ttf').then(r => r.arrayBuffer());
    const amiriBase64 = btoa(String.fromCharCode(...new Uint8Array(amiriFont)));
    doc.addFileToVFS('amiri-regular.ttf', amiriBase64);
    doc.addFont('amiri-regular.ttf', 'amiri', 'normal');

    // ✅ تحميل خط Hafs
    const hafsFont = await fetch('/fonts/hafs.ttf').then(r => r.arrayBuffer());
    const hafsBase64 = btoa(String.fromCharCode(...new Uint8Array(hafsFont)));
    doc.addFileToVFS('hafs.ttf', hafsBase64);
    doc.addFont('hafs.ttf', 'hafs', 'normal');

    // ✅ دالة رسم العلامة المائية
    const drawWatermark = (doc) => {
      doc.saveGraphicsState();
      doc.setGState(new doc.GState({ opacity: 0.1 }));
      doc.setTextColor(30, 120, 80);
      doc.setFont('amiri', 'normal');
      doc.setFontSize(60);
      doc.text('Tajweedy', 105, 150, { angle: 45, align: 'center' });
      doc.restoreGraphicsState();
    };

    // ✅ دالة رسم الشعار
    const drawLogo = async (doc) => {
      try {
        const logo = await fetch('/logo.png').then(r => r.blob());
        const logoUrl = URL.createObjectURL(logo);
        const img = new Image();
        img.src = logoUrl;
        await new Promise((resolve) => { img.onload = resolve; });
        doc.addImage(img, 'PNG', 15, 10, 25, 25);
      } catch (err) {
        console.error('Logo error:', err);
      }
    };

    // ✅ صفحة الغلاف
    drawWatermark(doc);
    await drawLogo(doc);

    doc.setFont('amiri', 'normal');
    doc.setFontSize(24);
    doc.setTextColor(30, 120, 80);
    doc.text('تقرير أحكام التجويد - Tajweedy', 105, 60, { align: 'center' });

    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text(formatDate(new Date()), 105, 75, { align: 'center' });

    // ✅ اسم المتدرب (افتراضي: "متدرب" - سيُستبدل بنظام تسجيل الدخول)
    doc.setFontSize(16);
    doc.setTextColor(30, 120, 80);
    doc.text('المتدرب: متدرب', 105, 90, { align: 'center' });

    // ✅ النتيجة
    doc.setFontSize(20);
    doc.text(`النتيجة: ${percentage}% (${score}/${total})`, 105, 105, { align: 'center' });

    // ✅ QR Code
    if (qrSrc) {
      try {
        const qrImg = new Image();
        qrImg.src = qrSrc;
        await new Promise((resolve) => { qrImg.onload = resolve; });
        doc.addImage(qrImg, 'PNG', 80, 120, 50, 50);
      } catch (err) {
        console.error('QR error:', err);
      }
    }

    let yPos = 20;

    // ✅ صفحة الأسئلة
    doc.addPage();
    drawWatermark(doc);
    await drawLogo(doc);
    
    yPos = 50;
    doc.setFont('amiri', 'normal');
    doc.setFontSize(18);
    doc.setTextColor(30, 120, 80);
    doc.text('إحصاءات الأسئلة', 105, yPos, { align: 'center' });
    yPos += 10;

    // جدول الأسئلة (مع خط Hafs للنص القرآني)
    const questionsData = responses.map((r, idx) => {
      const isCorrect = r.correct ? '✓' : '✗';
      const percentage = r.correct ? '100%' : '0%';
      return [
        convertToArabicNumbers(String(idx + 1)),
        percentage,
        convertToArabicNumbers(String(r.correctAnswer)),
        convertToArabicNumbers(String(r.userAnswer || '-')),
        r.section || '-',
        r.question // ← سيُعرض بخط Hafs
      ];
    });

    doc.autoTable({
      startY: yPos,
      head: [['رقم', 'النسبة', 'الصحيح', 'إجابتك', 'القسم', 'السؤال']],
      body: questionsData,
      styles: {
        font: 'amiri',
        fontSize: 11,
        halign: 'right',
        cellPadding: 4
      },
      headStyles: {
        fillColor: [30, 120, 80],
        textColor: [255, 255, 255],
        fontSize: 12,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        5: { font: 'hafs', fontSize: 13 } // ← عمود السؤال بخط Hafs
      },
      didDrawPage: (data) => {
        drawWatermark(doc);
        drawLogo(doc);
      }
    });

    yPos = doc.lastAutoTable.finalY + 15;

    // ✅ إحصاءات الأقسام (باقي الجداول)
    if (yPos > 240) {
      doc.addPage();
      drawWatermark(doc);
      await drawLogo(doc);
      yPos = 50;
    }

    doc.setFontSize(16);
    doc.text('إحصاءات الأقسام', 105, yPos, { align: 'center' });
    yPos += 10;

    // رسم الجداول (كما هي الآن، لكن مع الخطوط المُحسّنة)
    for (const section of SECTIONS) {
      const sectionData = stats[section.key];
      if (!sectionData) continue;

      if (yPos > 220) {
        doc.addPage();
        drawWatermark(doc);
        await drawLogo(doc);
        yPos = 50;
      }

      doc.setFontSize(14);
      doc.setTextColor(30, 120, 80);
      doc.text(section.title, 105, yPos, { align: 'center' });
      yPos += 8;

      const tableData = [
        ['النسبة %', 'إجمالي', 'خاطئ', 'صحيح', 'القسم الفرعي'],
        ...Object.entries(sectionData).map(([key, val]) => [
          convertToArabicNumbers(val.percentage),
          convertToArabicNumbers(String(val.total)),
          convertToArabicNumbers(String(val.incorrect)),
          convertToArabicNumbers(String(val.correct)),
          val.title
        ])
      ];

      doc.autoTable({
        startY: yPos,
        head: [tableData[0]],
        body: tableData.slice(1),
        styles: {
          font: 'amiri',
          fontSize: 11,
          halign: 'right'
        },
        headStyles: {
          fillColor: [30, 120, 80],
          textColor: [255, 255, 255]
        },
        didDrawPage: () => {
          drawWatermark(doc);
          drawLogo(doc);
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
