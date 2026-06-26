import React from 'react';
import { renderToFile } from '@react-pdf/renderer';
import ExecutiveReportPDF from './src/components/ExecutiveReportPDF.jsx';

const mockData = {
  financials: { cash_balance: 1000, monthly_mrr: 100 },
  sales_pipeline: { deals: [] },
  market_intelligence: { competitors: [] },
  compliance: { regulatory_risks: [] }
};

renderToFile(
  React.createElement(ExecutiveReportPDF, { businessData: mockData, activeRole: 'Owner', theme: 'light' }),
  'test_output.pdf'
).then(() => console.log('PDF generated successfully!'))
.catch(err => console.error('Error generating PDF:', err));
