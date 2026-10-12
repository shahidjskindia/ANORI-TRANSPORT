
/* ANORI TRANSPORT — FINAL PDF ENGINE v3.0
   Root-cause fix: remove all dependency on jsPDF/html2pdf for invoice export.
   The Invoice Preview DOM is rendered with html2canvas, then a standards-based
   PDF is assembled directly from JPEG image objects. This prevents every
   recurring jsPDF.addImage coordinate error, including errors originating
   inside html2pdf's internal jsPDF calls.
*/
(function installFinalNativeInvoicePdf(){
  'use strict';
  if(!window.Invoices) return;

  const concatBytes=(parts)=>{
    const total=parts.reduce((n,p)=>n+p.length,0);
    const out=new Uint8Array(total); let offset=0;
    for(const p of parts){out.set(p,offset);offset+=p.length;}
    return out;
  };
  const enc=new TextEncoder();
  const ascii=(s)=>enc.encode(s);

  function buildPdfFromJpegs(pages){
    // Each page is a JPEG already sized/cropped for one A4 page.
    const objects=[];
    objects[1]=ascii('<< /Type /Catalog /Pages 2 0 R >>');
    const pageRefs=[];
    const pageObjects=[];
    const contentObjects=[];
    const imageObjects=[];
    let objNo=3;

    for(let i=0;i<pages.length;i++){
      const imageObjNo=objNo++;
      const contentObjNo=objNo++;
      const pageObjNo=objNo++;
      imageObjects.push({objNo:imageObjNo,jpeg:pages[i].jpeg,width:pages[i].width,height:pages[i].height});
      contentObjects.push({objNo:contentObjNo,imageObjNo,drawW:pages[i].drawW,drawH:pages[i].drawH});
      pageObjects.push({objNo:pageObjNo,contentObjNo,imageObjNo});
      pageRefs.push(`${pageObjNo} 0 R`);
    }

    objects[2]=ascii(`<< /Type /Pages /Kids [${pageRefs.join(' ')}] /Count ${pages.length} >>`);

    for(const img of imageObjects){
      const header=ascii(`<< /Type /XObject /Subtype /Image /Width ${img.width} /Height ${img.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${img.jpeg.length} >>\nstream\n`);
      const footer=ascii('\nendstream');
      objects[img.objNo]=concatBytes([header,img.jpeg,footer]);
    }

    for(const c of contentObjects){
      const stream=ascii(`q\n${c.drawW} 0 0 ${c.drawH} 5 ${5 + (287-c.drawH)} cm\n/Im${c.imageObjNo} Do\nQ`);
      objects[c.objNo]=concatBytes([ascii(`<< /Length ${stream.length} >>\nstream\n`),stream,ascii('\nendstream')]);
    }

    for(const p of pageObjects){
      objects[p.objNo]=ascii(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 210 297] /Resources << /XObject << /Im${p.imageObjNo} ${p.imageObjNo} 0 R >> >> /Contents ${p.contentObjNo} 0 R >>`);
    }

    const chunks=[ascii('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n')];
    const offsets=new Array(objects.length).fill(0);
    let position=chunks[0].length;
    for(let i=1;i<objects.length;i++){
      const body=objects[i]||ascii('');
      const head=ascii(`${i} 0 obj\n`);
      const tail=ascii('\nendobj\n');
      offsets[i]=position;
      chunks.push(head,body,tail);
      position+=head.length+body.length+tail.length;
    }
    const xrefPos=position;
    let xref=`xref\n0 ${objects.length}\n0000000000 65535 f \n`;
    for(let i=1;i<objects.length;i++)xref+=String(offsets[i]).padStart(10,'0')+' 00000 n \n';
    xref+=`trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;
    chunks.push(ascii(xref));
    return concatBytes(chunks);
  }

  async function renderInvoiceToPdf(invoice){
    const normalized=typeof Invoices.normalizeInvoice==='function' ? Invoices.normalizeInvoice(invoice) : invoice;
    if(!normalized) throw new Error('Invoice not found.');
    if(typeof window.html2canvas!=='function') throw new Error('PDF renderer is not loaded. Please reopen the application with internet access.');

    const host=document.getElementById('previewContent');
    if(!host) throw new Error('Invoice Preview area is not available.');

    let source=host.querySelector('.invoice-page');
    if(!source || host.dataset.invoiceId!==normalized.id){
      if(typeof Invoices.mountInvoiceDocument!=='function') throw new Error('Invoice Preview renderer is unavailable.');
      host.innerHTML='';
      source=Invoices.mountInvoiceDocument(normalized);
      host.dataset.invoiceId=normalized.id;
    }
    if(!source) throw new Error('Invoice Preview could not be prepared.');

    // Capture an isolated, fixed A4-width clone. Screen zoom, flex centering,
    // scroll containers and modal transforms cannot affect the capture.
    const capture=document.createElement('div');
    capture.style.cssText='position:fixed;left:-20000px;top:0;width:794px;background:#fff;margin:0;padding:0;overflow:visible;z-index:-2147483647;visibility:visible;';
    const clone=source.cloneNode(true);
    clone.style.cssText += ';display:block !important;position:relative !important;left:0 !important;top:0 !important;transform:none !important;zoom:1 !important;width:794px !important;min-width:794px !important;max-width:794px !important;height:auto !important;min-height:1123px !important;margin:0 !important;overflow:visible !important;box-sizing:border-box !important;';
    capture.appendChild(clone);
    document.body.appendChild(capture);

    try{
      if(document.fonts?.ready) await document.fonts.ready;
      await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));

      const rect=clone.getBoundingClientRect();
      const width=Math.max(794,Math.ceil(clone.scrollWidth||rect.width||794));
      const height=Math.max(1123,Math.ceil(clone.scrollHeight||rect.height||1123));
      if(!Number.isFinite(width)||!Number.isFinite(height)) throw new Error('Invoice Preview has invalid dimensions.');

      const canvas=await window.html2canvas(clone,{
        scale:2,
        width,
        height,
        windowWidth:width,
        windowHeight:height,
        backgroundColor:'#ffffff',
        useCORS:true,
        allowTaint:false,
        logging:false,
        scrollX:0,
        scrollY:0
      });
      if(!canvas?.width||!canvas?.height) throw new Error('Invoice Preview could not be rendered.');

      // A4 printable area: 200 x 287 mm (5 mm margins). At 794 px CSS width,
      // one PDF page corresponds to 1123 CSS px. The 2x canvas is sliced without
      // resizing the original image horizontally, preserving preview appearance.
      const targetCssPageHeight=Math.floor(width*(287/200));
      const scaleX=canvas.width/width;
      const sliceCanvasHeight=Math.max(1,Math.floor(targetCssPageHeight*scaleX));
      const pages=[];

      for(let y=0;y<canvas.height;y+=sliceCanvasHeight){
        const sliceH=Math.min(sliceCanvasHeight,canvas.height-y);
        const slice=document.createElement('canvas');
        slice.width=canvas.width;
        slice.height=Math.max(1,sliceH);
        const ctx=slice.getContext('2d');
        if(!ctx) throw new Error('Unable to prepare PDF page.');
        ctx.fillStyle='#ffffff';
        ctx.fillRect(0,0,slice.width,slice.height);
        ctx.drawImage(canvas,0,y,canvas.width,sliceH,0,0,canvas.width,sliceH);
        const dataUrl=slice.toDataURL('image/jpeg',0.96);
        const comma=dataUrl.indexOf(',');
        if(comma<0) throw new Error('Invoice image could not be created.');
        const raw=atob(dataUrl.slice(comma+1));
        const jpeg=new Uint8Array(raw.length);
        for(let i=0;i<raw.length;i++) jpeg[i]=raw.charCodeAt(i);
        const drawW=200; const drawH=Math.min(287,drawW*(slice.height/slice.width));
        pages.push({jpeg,width:slice.width,height:slice.height,drawW,drawH});
      }

      if(!pages.length) throw new Error('No invoice pages were generated.');
      const pdfBytes=buildPdfFromJpegs(pages);
      const blob=new Blob([pdfBytes],{type:'application/pdf'});
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a');
      a.href=url;
      a.download=`${normalized.invoice_no || normalized.id || 'Invoice'}.pdf`;
      a.style.display='none';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),15000);
      if(window.Utils?.toast) Utils.toast('PDF downloaded using the Invoice Preview layout.','success');
      return true;
    }finally{
      capture.remove();
    }
  }

  // One and only active invoice PDF route. These assignments are deliberately
  // placed at the end of app.js so all legacy PDF overrides are superseded.
  Invoices.downloadInvoice=function(invoice){
    return renderInvoiceToPdf(invoice).catch(async e=>{
      console.error('ANORI FINAL PDF ENGINE ERROR:',e);
      if(window.Swal) await Swal.fire({icon:'error',title:'PDF Generation Failed',text:e?.message||'Unable to generate the PDF.',confirmButtonText:'OK'});
      else if(window.Utils?.toast) Utils.toast(e?.message||'Unable to generate the PDF.','error');
      return false;
    });
  };

  Invoices.downloadExisting=function(id){
    const invoice=(DB.get('invoices',[])||[]).find(i=>String(i.id)===String(id));
    if(!invoice) return Utils.toast('Invoice not found.','error');
    return Invoices.downloadInvoice(invoice);
  };

  // FINAL ACTION-BAR PDF ROUTE: deliberately calls the exact same
  // Invoices.downloadInvoice() used by the Invoice Preview -> Download PDF button.
  // This bypasses every legacy jsPDF/html2pdf action handler.
  Invoices.downloadSelectedPDF=function(){
    const ids=typeof Invoices.getSelected==='function' ? Invoices.getSelected() : [];
    if(ids.length!==1) return Utils.toast(ids.length ? 'SELECT ONLY ONE INVOICE.' : 'SELECT ONE INVOICE.','warning');
    const invoice=(DB.get('invoices',[])||[]).find(i=>String(i.id)===String(ids[0]));
    if(!invoice) return Utils.toast('Invoice not found.','error');
    return Invoices.downloadInvoice(invoice);
  };
  Invoices.actionPDF=function(){ return Invoices.downloadSelectedPDF(); };

  // Keep a stable public route so all dynamically-rendered Action bars use
  // the same Preview PDF implementation.
  window.__ANORI_DOWNLOAD_SELECTED_INVOICE_PDF='native-preview-pdf';
  window.__ANORI_FINAL_PDF_ENGINE='native-jpeg-pdf-v3';
})();
