import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import puppeteer from 'puppeteer';
import { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Table as DocxTable, TableRow as DocxTableRow, TableCell as DocxTableCell, Packer, ImageRun, ExternalHyperlink, WidthType } from 'docx';
import type { ExportOptions } from '~/types/domain';

interface TiptapNode {
  type: string;
  attrs?: Record<string, any>;
  content?: TiptapNode[];
  marks?: Array<{ type: string; attrs?: Record<string, any> }>;
  text?: string;
}

interface TiptapDocument {
  type: 'doc';
  content?: TiptapNode[];
}

/**
 * Fetch an image from a URL and return as Buffer
 */
async function fetchImageAsBuffer(url: string): Promise<Buffer | null> {
  try {
    // Handle relative URLs
    let fullUrl = url;
    if (url.startsWith('/')) {
      // For local development, use localhost
      fullUrl = `http://localhost:${process.env.PORT || 3000}${url}`;
    }

    const response = await fetch(fullUrl, {
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      console.error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('Error fetching image:', error);
    return null;
  }
}

/**
 * Convert Tiptap JSON to HTML string
 */
export function convertTiptapToHtml(json: TiptapDocument, options: ExportOptions = {}): string {
  const extensions = [
    StarterKit,
    TaskList,
    TaskItem.configure({
      nested: true,
    }),
    Link.configure({
      openOnClick: false,
    }),
    Image,
    Table.configure({
      resizable: true,
    }),
    TableRow,
    TableCell,
    TableHeader,
  ];

  const html = generateHTML(json, extensions);

  // Strip comment marks if not including comments
  if (options.includeComments === false) {
    // Remove any comment-related markup
    return html.replace(/<mark class="comment-mark"[^>]*>(.*?)<\/mark>/g, '$1');
  }

  return html;
}

/**
 * Get template-specific CSS styles
 */
function getTemplateStyles(template: string = 'default'): string {
  const templates: Record<string, string> = {
    default: `
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
        font-size: 14px;
        line-height: 1.6;
        color: #1a1a1a;
      }
      h1 { font-size: 32px; font-weight: 600; color: #1a1a1a; margin-top: 24px; margin-bottom: 16px; }
      h2 { font-size: 24px; font-weight: 600; color: #1a1a1a; margin-top: 20px; margin-bottom: 12px; }
      h3 { font-size: 18px; font-weight: 600; color: #1a1a1a; margin-top: 16px; margin-bottom: 8px; }
    `,
    minimal: `
      body {
        font-family: 'Georgia', 'Times New Roman', serif;
        font-size: 13px;
        line-height: 1.7;
        color: #2a2a2a;
      }
      h1 { font-size: 28px; font-weight: 400; color: #000; margin-top: 32px; margin-bottom: 16px; border-bottom: 1px solid #e0e0e0; padding-bottom: 8px; }
      h2 { font-size: 22px; font-weight: 400; color: #000; margin-top: 24px; margin-bottom: 12px; }
      h3 { font-size: 16px; font-weight: 600; color: #000; margin-top: 16px; margin-bottom: 8px; }
    `,
    professional: `
      body {
        font-family: 'Calibri', 'Helvetica', Arial, sans-serif;
        font-size: 11pt;
        line-height: 1.5;
        color: #1f2937;
      }
      h1 { font-size: 22pt; font-weight: 700; color: #1e3a8a; margin-top: 18px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
      h2 { font-size: 16pt; font-weight: 600; color: #1e3a8a; margin-top: 16px; margin-bottom: 10px; }
      h3 { font-size: 13pt; font-weight: 600; color: #374151; margin-top: 14px; margin-bottom: 8px; }
      table th { background-color: #1e3a8a; color: white; }
    `,
    modern: `
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 15px;
        line-height: 1.7;
        color: #18181b;
      }
      h1 { font-size: 36px; font-weight: 700; color: #18181b; margin-top: 32px; margin-bottom: 16px; letter-spacing: -0.5px; }
      h2 { font-size: 28px; font-weight: 600; color: #18181b; margin-top: 24px; margin-bottom: 12px; letter-spacing: -0.3px; }
      h3 { font-size: 20px; font-weight: 600; color: #27272a; margin-top: 20px; margin-bottom: 10px; }
      code { background-color: #f4f4f5; color: #3730a3; padding: 3px 6px; border-radius: 4px; font-size: 0.9em; }
      blockquote { border-left: 4px solid #3b82f6; background-color: #f0f9ff; padding: 12px 16px; }
    `,
  };

  return templates[template] || templates.default;
}

/**
 * Inject print-friendly CSS styles for export
 */
export function injectExportStyles(html: string, options: ExportOptions = {}): string {
  const templateStyles = getTemplateStyles(options.template || 'default');

  const styles = `
    <style>
      @page {
        size: ${options.paperSize || 'A4'};
        margin: ${options.margins?.top || 20}mm ${options.margins?.right || 20}mm ${options.margins?.bottom || 20}mm ${options.margins?.left || 20}mm;
      }

      ${templateStyles}

      body {
        max-width: 100%;
        padding: 0;
        margin: 0;
      }

      h1 {
        font-size: 32px;
        font-weight: 600;
        margin-top: 24px;
        margin-bottom: 16px;
        line-height: 1.25;
        page-break-after: avoid;
      }

      h2 {
        font-size: 24px;
        font-weight: 600;
        margin-top: 20px;
        margin-bottom: 12px;
        line-height: 1.25;
        page-break-after: avoid;
      }

      h3 {
        font-size: 18px;
        font-weight: 600;
        margin-top: 16px;
        margin-bottom: 8px;
        line-height: 1.25;
        page-break-after: avoid;
      }

      p {
        margin-top: 0;
        margin-bottom: 12px;
      }

      ul, ol {
        padding-left: 24px;
        margin-top: 0;
        margin-bottom: 12px;
      }

      ul[data-type="taskList"] {
        list-style: none;
        padding-left: 0;
      }

      ul[data-type="taskList"] li {
        display: flex;
        align-items: flex-start;
        margin-bottom: 4px;
      }

      ul[data-type="taskList"] li label {
        display: flex;
        align-items: center;
        margin-right: 8px;
      }

      ul[data-type="taskList"] li input[type="checkbox"] {
        margin: 0 8px 0 0;
      }

      ul[data-type="taskList"] li > div {
        flex: 1;
      }

      table {
        border-collapse: collapse;
        width: 100%;
        margin-top: 12px;
        margin-bottom: 12px;
        page-break-inside: avoid;
      }

      table th,
      table td {
        border: 1px solid #d0d0d0;
        padding: 8px 12px;
        text-align: left;
      }

      table th {
        background-color: #f5f5f5;
        font-weight: 600;
      }

      pre {
        background-color: #f5f5f5;
        border: 1px solid #d0d0d0;
        border-radius: 4px;
        padding: 12px;
        overflow-x: auto;
        page-break-inside: avoid;
      }

      code {
        font-family: 'Courier New', Courier, monospace;
        font-size: 13px;
        background-color: #f5f5f5;
        padding: 2px 4px;
        border-radius: 2px;
      }

      pre code {
        background-color: transparent;
        padding: 0;
      }

      blockquote {
        border-left: 4px solid #d0d0d0;
        padding-left: 16px;
        margin-left: 0;
        margin-right: 0;
        color: #666;
        font-style: italic;
      }

      hr {
        border: none;
        border-top: 2px solid #d0d0d0;
        margin: 24px 0;
      }

      a {
        color: #0066cc;
        text-decoration: none;
      }

      a:hover {
        text-decoration: underline;
      }

      img {
        max-width: 100%;
        height: auto;
        display: block;
        margin: 16px 0;
      }

      mark.comment-mark {
        background-color: #fff3cd;
        padding: 2px 0;
      }

      /* Print-specific styles */
      @media print {
        body {
          font-size: 12pt;
        }

        h1 { font-size: 24pt; }
        h2 { font-size: 18pt; }
        h3 { font-size: 14pt; }

        a {
          color: #000;
          text-decoration: underline;
        }

        a[href]:after {
          content: " (" attr(href) ")";
          font-size: 90%;
          color: #666;
        }
      }
    </style>
  `;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${styles}
</head>
<body>
  ${html}
</body>
</html>`;
}

/**
 * Generate PDF from HTML using Puppeteer
 */
export async function generatePdfFromHtml(html: string, options: ExportOptions = {}): Promise<Buffer> {
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    const page = await browser.newPage();

    // Set content and wait for images to load
    await page.setContent(html, {
      waitUntil: options.includeImages !== false ? 'networkidle0' : 'domcontentloaded',
      timeout: 60000,
    });

    // Generate PDF
    const pdf = await page.pdf({
      format: options.paperSize || 'A4',
      margin: options.margins || {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20,
      },
      printBackground: true,
      displayHeaderFooter: options.headerFooter || false,
      headerTemplate: options.headerFooter ? '<div style="font-size:10px;text-align:center;width:100%;"><span class="title"></span></div>' : '',
      footerTemplate: options.headerFooter ? '<div style="font-size:10px;text-align:center;width:100%;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>' : '',
    });

    return Buffer.from(pdf);
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error('Failed to generate PDF. Please try again.');
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Convert Tiptap JSON to DOCX
 */
export async function convertTiptapToDocx(json: TiptapDocument, options: ExportOptions = {}): Promise<Buffer> {
  const sections: any[] = [];

  if (json.content) {
    for (const node of json.content) {
      const elements = await convertNodeToDocx(node, options);
      sections.push(...elements);
    }
  }

  const doc = new Document({
    sections: [{
      properties: {},
      children: sections.length > 0 ? sections : [new Paragraph({ text: '' })],
    }],
  });

  return await Packer.toBuffer(doc);
}

/**
 * Convert a single Tiptap node to DOCX elements
 */
async function convertNodeToDocx(node: TiptapNode, options: ExportOptions, parentType?: string): Promise<any[]> {
  const elements: any[] = [];

  switch (node.type) {
    case 'heading': {
      const level = node.attrs?.level || 1;
      const runs = await convertInlineContent(node.content || [], options);
      elements.push(new Paragraph({
        heading: level === 1 ? HeadingLevel.HEADING_1 : level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3,
        children: runs,
      }));
      break;
    }

    case 'paragraph': {
      const runs = await convertInlineContent(node.content || [], options);
      elements.push(new Paragraph({
        children: runs.length > 0 ? runs : [new TextRun({ text: '' })],
      }));
      break;
    }

    case 'bulletList': {
      if (node.content) {
        for (const item of node.content) {
          if (item.type === 'listItem' && item.content) {
            for (const itemContent of item.content) {
              const runs = await convertInlineContent(itemContent.content || [], options);
              elements.push(new Paragraph({
                bullet: {
                  level: 0,
                },
                children: runs.length > 0 ? runs : [new TextRun({ text: '' })],
              }));
            }
          }
        }
      }
      break;
    }

    case 'orderedList': {
      if (node.content) {
        for (const item of node.content) {
          if (item.type === 'listItem' && item.content) {
            for (const itemContent of item.content) {
              const runs = await convertInlineContent(itemContent.content || [], options);
              elements.push(new Paragraph({
                numbering: {
                  reference: 'default-numbering',
                  level: 0,
                },
                children: runs.length > 0 ? runs : [new TextRun({ text: '' })],
              }));
            }
          }
        }
      }
      break;
    }

    case 'taskList': {
      if (node.content) {
        for (const item of node.content) {
          if (item.type === 'taskItem') {
            const checked = item.attrs?.checked || false;
            const checkbox = checked ? '☑' : '☐';
            const runs = await convertInlineContent(item.content || [], options);
            elements.push(new Paragraph({
              children: [
                new TextRun({ text: checkbox + ' ' }),
                ...runs,
              ],
            }));
          }
        }
      }
      break;
    }

    case 'codeBlock': {
      const code = node.content?.map(n => n.text || '').join('\n') || '';
      elements.push(new Paragraph({
        children: [new TextRun({
          text: code,
          font: 'Courier New',
          size: 20,
        })],
        shading: {
          fill: 'F5F5F5',
        },
      }));
      break;
    }

    case 'blockquote': {
      if (node.content) {
        for (const quoteNode of node.content) {
          const runs = await convertInlineContent(quoteNode.content || [], options);
          elements.push(new Paragraph({
            children: runs,
            indent: {
              left: 720, // 0.5 inch
            },
            border: {
              left: {
                color: 'D0D0D0',
                space: 1,
                style: 'single',
                size: 24,
              },
            },
          }));
        }
      }
      break;
    }

    case 'horizontalRule': {
      elements.push(new Paragraph({
        border: {
          top: {
            color: 'D0D0D0',
            space: 1,
            style: 'single',
            size: 12,
          },
        },
      }));
      break;
    }

    case 'table': {
      if (node.content) {
        const rows: DocxTableRow[] = [];
        for (const rowNode of node.content) {
          if (rowNode.type === 'tableRow' && rowNode.content) {
            const cells: DocxTableCell[] = [];
            for (const cellNode of rowNode.content) {
              if ((cellNode.type === 'tableCell' || cellNode.type === 'tableHeader') && cellNode.content) {
                const cellElements: any[] = [];
                for (const cellContent of cellNode.content) {
                  const runs = await convertInlineContent(cellContent.content || [], options);
                  cellElements.push(new Paragraph({
                    children: runs.length > 0 ? runs : [new TextRun({ text: '' })],
                  }));
                }
                cells.push(new DocxTableCell({
                  children: cellElements.length > 0 ? cellElements : [new Paragraph({ text: '' })],
                  shading: cellNode.type === 'tableHeader' ? { fill: 'F5F5F5' } : undefined,
                }));
              }
            }
            rows.push(new DocxTableRow({ children: cells }));
          }
        }
        elements.push(new DocxTable({
          rows,
          width: {
            size: 100,
            type: WidthType.PERCENTAGE,
          },
        }));
      }
      break;
    }

    case 'image': {
      if (options.includeImages !== false && node.attrs?.src) {
        try {
          const imageBuffer = await fetchImageAsBuffer(node.attrs.src);
          if (imageBuffer) {
            elements.push(new Paragraph({
              children: [new ImageRun({
                data: imageBuffer,
                transformation: {
                  width: 600,
                  height: 400,
                },
              })],
            }));
          } else {
            // Fallback to text placeholder if image fetch fails
            elements.push(new Paragraph({
              children: [new TextRun({
                text: `[Image unavailable: ${node.attrs.src}]`,
                italics: true,
                color: '999999',
              })],
            }));
          }
        } catch (error) {
          console.error('Image processing error:', error);
          // Fallback to text placeholder on error
          elements.push(new Paragraph({
            children: [new TextRun({
              text: `[Image error: ${node.attrs.src}]`,
              italics: true,
              color: '999999',
            })],
          }));
        }
      }
      break;
    }
  }

  return elements;
}

/**
 * Convert inline content (text, marks) to DOCX TextRuns
 */
async function convertInlineContent(content: TiptapNode[], options: ExportOptions): Promise<TextRun[]> {
  const runs: TextRun[] = [];

  for (const node of content) {
    if (node.type === 'text' && node.text) {
      const isBold = node.marks?.some(m => m.type === 'bold');
      const isItalic = node.marks?.some(m => m.type === 'italic');
      const isCode = node.marks?.some(m => m.type === 'code');
      const linkMark = node.marks?.find(m => m.type === 'link');

      const runOptions: any = {
        text: node.text,
        bold: isBold,
        italics: isItalic,
      };

      if (isCode) {
        runOptions.font = 'Courier New';
        runOptions.shading = { fill: 'F5F5F5' };
      }

      if (linkMark?.attrs?.href) {
        runs.push(new ExternalHyperlink({
          link: linkMark.attrs.href,
          children: [new TextRun({ ...runOptions, style: 'Hyperlink' })],
        }) as any);
      } else {
        runs.push(new TextRun(runOptions));
      }
    } else if (node.type === 'hardBreak') {
      runs.push(new TextRun({ text: '', break: 1 }));
    }
  }

  return runs;
}

/**
 * Convert Tiptap JSON to Markdown
 */
export function convertTiptapToMarkdown(json: TiptapDocument, options: ExportOptions = {}): string {
  const lines: string[] = [];

  if (json.content) {
    for (const node of json.content) {
      const markdown = convertNodeToMarkdown(node, options);
      if (markdown) {
        lines.push(markdown);
      }
    }
  }

  return lines.join('\n\n');
}

/**
 * Convert a single Tiptap node to Markdown
 */
function convertNodeToMarkdown(node: TiptapNode, options: ExportOptions, listLevel = 0): string {
  switch (node.type) {
    case 'heading': {
      const level = node.attrs?.level || 1;
      const text = convertInlineToMarkdown(node.content || [], options);
      return '#'.repeat(level) + ' ' + text;
    }

    case 'paragraph': {
      return convertInlineToMarkdown(node.content || [], options);
    }

    case 'bulletList': {
      const items: string[] = [];
      if (node.content) {
        for (const item of node.content) {
          if (item.type === 'listItem' && item.content) {
            for (const para of item.content) {
              const text = convertInlineToMarkdown(para.content || [], options);
              items.push('  '.repeat(listLevel) + '- ' + text);
            }
          }
        }
      }
      return items.join('\n');
    }

    case 'orderedList': {
      const items: string[] = [];
      if (node.content) {
        for (let i = 0; i < node.content.length; i++) {
          const item = node.content[i];
          if (item.type === 'listItem' && item.content) {
            for (const para of item.content) {
              const text = convertInlineToMarkdown(para.content || [], options);
              items.push('  '.repeat(listLevel) + `${i + 1}. ` + text);
            }
          }
        }
      }
      return items.join('\n');
    }

    case 'taskList': {
      const items: string[] = [];
      if (node.content) {
        for (const item of node.content) {
          if (item.type === 'taskItem') {
            const checked = item.attrs?.checked || false;
            const checkbox = checked ? '[x]' : '[ ]';
            const text = convertInlineToMarkdown(item.content || [], options);
            items.push('  '.repeat(listLevel) + `- ${checkbox} ` + text);
          }
        }
      }
      return items.join('\n');
    }

    case 'codeBlock': {
      const code = node.content?.map(n => n.text || '').join('\n') || '';
      const language = node.attrs?.language || '';
      return '```' + language + '\n' + code + '\n```';
    }

    case 'blockquote': {
      const lines: string[] = [];
      if (node.content) {
        for (const quoteNode of node.content) {
          const text = convertInlineToMarkdown(quoteNode.content || [], options);
          lines.push('> ' + text);
        }
      }
      return lines.join('\n');
    }

    case 'horizontalRule': {
      return '---';
    }

    case 'table': {
      if (!node.content || node.content.length === 0) return '';

      const rows: string[][] = [];
      let maxCols = 0;

      for (const rowNode of node.content) {
        if (rowNode.type === 'tableRow' && rowNode.content) {
          const row: string[] = [];
          for (const cellNode of rowNode.content) {
            if ((cellNode.type === 'tableCell' || cellNode.type === 'tableHeader') && cellNode.content) {
              const cellText = cellNode.content.map(c => convertInlineToMarkdown(c.content || [], options)).join(' ');
              row.push(cellText);
            }
          }
          rows.push(row);
          maxCols = Math.max(maxCols, row.length);
        }
      }

      if (rows.length === 0) return '';

      // Format as markdown table
      const tableLines: string[] = [];

      // Header row
      tableLines.push('| ' + rows[0].join(' | ') + ' |');

      // Separator
      tableLines.push('| ' + Array(rows[0].length).fill('---').join(' | ') + ' |');

      // Body rows
      for (let i = 1; i < rows.length; i++) {
        tableLines.push('| ' + rows[i].join(' | ') + ' |');
      }

      return tableLines.join('\n');
    }

    case 'image': {
      if (options.includeImages !== false && node.attrs?.src) {
        const alt = node.attrs.alt || '';
        return `![${alt}](${node.attrs.src})`;
      }
      return '';
    }
  }

  return '';
}

/**
 * Convert inline content to Markdown text with formatting
 */
function convertInlineToMarkdown(content: TiptapNode[], options: ExportOptions): string {
  let text = '';

  for (const node of content) {
    if (node.type === 'text' && node.text) {
      let formatted = node.text;

      // Apply marks
      if (node.marks) {
        const isBold = node.marks.some(m => m.type === 'bold');
        const isItalic = node.marks.some(m => m.type === 'italic');
        const isCode = node.marks.some(m => m.type === 'code');
        const linkMark = node.marks.find(m => m.type === 'link');

        if (isCode) {
          formatted = '`' + formatted + '`';
        }
        if (isBold) {
          formatted = '**' + formatted + '**';
        }
        if (isItalic) {
          formatted = '_' + formatted + '_';
        }
        if (linkMark?.attrs?.href) {
          formatted = `[${formatted}](${linkMark.attrs.href})`;
        }
      }

      text += formatted;
    } else if (node.type === 'hardBreak') {
      text += '  \n';
    }
  }

  return text;
}
