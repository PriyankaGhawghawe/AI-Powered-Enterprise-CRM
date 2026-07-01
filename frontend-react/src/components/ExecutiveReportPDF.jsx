import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  // --- LAYOUT & BASE ---
  pageLight: { padding: 40, fontFamily: 'Helvetica', backgroundColor: '#ffffff' },
  pageDark: { padding: 40, fontFamily: 'Helvetica', backgroundColor: '#0f172a' },

  // --- COVER PAGE ---
  coverPageLight: { padding: 40, paddingTop: 200, fontFamily: 'Helvetica', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center' },
  coverPageDark: { padding: 40, paddingTop: 200, fontFamily: 'Helvetica', backgroundColor: '#020617', display: 'flex', alignItems: 'center' },
  
  coverTitleLight: { fontSize: 36, fontWeight: 'bold', marginBottom: 15, textAlign: 'center', color: '#2563eb' },
  coverTitleDark: { fontSize: 36, fontWeight: 'bold', marginBottom: 15, textAlign: 'center', color: '#60a5fa' },
  
  coverSubtitleLight: { fontSize: 16, color: '#475569', textAlign: 'center', marginBottom: 40 },
  coverSubtitleDark: { fontSize: 16, color: '#94a3b8', textAlign: 'center', marginBottom: 40 },
  
  coverDetailsLight: { fontSize: 12, color: '#64748b', textAlign: 'center', marginTop: 100, borderTop: '1px solid #cbd5e1', paddingTop: 20, width: '100%' },
  coverDetailsDark: { fontSize: 12, color: '#cbd5e1', textAlign: 'center', marginTop: 100, borderTop: '1px solid #334155', paddingTop: 20, width: '100%' },
  
  // --- HEADER ---
  headerLight: { marginBottom: 30, borderBottom: '2px solid #3b82f6', paddingBottom: 10 },
  headerDark: { marginBottom: 30, borderBottom: '2px solid #60a5fa', paddingBottom: 10 },
  
  titleLight: { fontSize: 22, fontWeight: 'bold', color: '#0f172a', marginBottom: 5 },
  titleDark: { fontSize: 22, fontWeight: 'bold', color: '#f8fafc', marginBottom: 5 },
  
  subtitleLight: { fontSize: 10, color: '#64748b' },
  subtitleDark: { fontSize: 10, color: '#94a3b8' },
  
  // --- SECTIONS & CARDS ---
  section: { marginBottom: 30 },
  
  sectionTitleLight: { fontSize: 14, fontWeight: 'bold', color: '#1e293b', marginBottom: 15, textTransform: 'uppercase' },
  sectionTitleDark: { fontSize: 14, fontWeight: 'bold', color: '#f1f5f9', marginBottom: 15, textTransform: 'uppercase' },
  
  cardLight: { backgroundColor: '#f8fafc', borderRadius: 6, padding: 12, marginBottom: 10, border: '1px solid #e2e8f0' },
  cardDark: { backgroundColor: '#1e293b', borderRadius: 6, padding: 12, marginBottom: 10, border: '1px solid #334155' },
  
  // --- KEY VALUE ROWS ---
  rowLight: { flexDirection: 'row', borderBottom: '1px solid #e2e8f0', paddingVertical: 8 },
  rowDark: { flexDirection: 'row', borderBottom: '1px solid #334155', paddingVertical: 8 },
  
  colLabelLight: { width: '40%', fontSize: 11, color: '#475569', fontWeight: 'bold' },
  colLabelDark: { width: '40%', fontSize: 11, color: '#94a3b8', fontWeight: 'bold' },
  
  colValueLight: { width: '60%', fontSize: 11, color: '#0f172a', fontWeight: 'bold' },
  colValueDark: { width: '60%', fontSize: 11, color: '#f8fafc', fontWeight: 'bold' },
  
  // --- TABLES ---
  tableHeaderLight: { flexDirection: 'row', backgroundColor: '#f1f5f9', padding: 8, borderBottom: '2px solid #cbd5e1' },
  tableHeaderDark: { flexDirection: 'row', backgroundColor: '#334155', padding: 8, borderBottom: '2px solid #475569' },
  
  tableRowLight: { flexDirection: 'row', borderBottom: '1px solid #e2e8f0', padding: 8 },
  tableRowDark: { flexDirection: 'row', borderBottom: '1px solid #334155', padding: 8 },
  
  tableColIdLight: { width: '15%', fontSize: 9, color: '#64748b' },
  tableColIdDark: { width: '15%', fontSize: 9, color: '#94a3b8' },
  
  tableColNameLight: { width: '40%', fontSize: 10, color: '#0f172a', fontWeight: 'bold' },
  tableColNameDark: { width: '40%', fontSize: 10, color: '#f8fafc', fontWeight: 'bold' },
  
  tableColStageLight: { width: '25%', fontSize: 10, color: '#334155' },
  tableColStageDark: { width: '25%', fontSize: 10, color: '#cbd5e1' },
  
  tableColValueLight: { width: '20%', fontSize: 10, color: '#10b981', textAlign: 'right', fontWeight: 'bold' },
  tableColValueDark: { width: '20%', fontSize: 10, color: '#34d399', textAlign: 'right', fontWeight: 'bold' },
  
  // --- LISTS ---
  listTitleLight: { fontSize: 12, fontWeight: 'bold', color: '#1e293b', marginBottom: 6 },
  listTitleDark: { fontSize: 12, fontWeight: 'bold', color: '#f8fafc', marginBottom: 6 },
  
  listDescLight: { fontSize: 10, color: '#475569' },
  listDescDark: { fontSize: 10, color: '#94a3b8' },
  
  // --- BADGES ---
  badgeGreen: { backgroundColor: '#dcfce7', color: '#166534', padding: '3 6', borderRadius: 4, fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase', alignSelf: 'flex-start', marginBottom: 4 },
  badgeRed: { backgroundColor: '#fee2e2', color: '#991b1b', padding: '3 6', borderRadius: 4, fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase', alignSelf: 'flex-start', marginBottom: 4 },
  badgeYellow: { backgroundColor: '#fef3c7', color: '#92400e', padding: '3 6', borderRadius: 4, fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase', alignSelf: 'flex-start', marginBottom: 4 },
  
  // --- FOOTER ---
  footerLight: { position: 'absolute', bottom: 20, left: 40, right: 40, fontSize: 9, color: '#94a3b8', borderTop: '1px solid #e2e8f0', paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between' },
  footerDark: { position: 'absolute', bottom: 20, left: 40, right: 40, fontSize: 9, color: '#64748b', borderTop: '1px solid #334155', paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between' }
});

const ExecutiveReportPDF = ({ businessData, activeRole, theme }) => {
  if (!businessData) return <Document><Page><Text>No data</Text></Page></Document>;

  const isOwner = activeRole === 'Owner';
  const isManagerOrOwner = activeRole === 'Owner' || activeRole === 'Manager';
  const isDark = theme === 'dark';

  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const activeDeals = businessData.sales_pipeline?.deals?.filter(d => !d.stage?.includes('Closed')) || [];
  const totalPipeline = activeDeals.reduce((sum, d) => sum + (d.value || 0), 0);

  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={isDark ? styles.coverPageDark : styles.coverPageLight}>
        <Text style={isDark ? styles.coverTitleDark : styles.coverTitleLight}>BusinessOS Master Report</Text>
        <Text style={isDark ? styles.coverSubtitleDark : styles.coverSubtitleLight}>Comprehensive Executive Briefing</Text>
        <View style={isDark ? styles.coverDetailsDark : styles.coverDetailsLight}>
          <Text style={{ marginBottom: 5 }}>Generated on: {dateStr}</Text>
          <Text style={{ marginBottom: 5 }}>Access Level: {activeRole.toUpperCase()}</Text>
          <Text>Confidential & Proprietary</Text>
        </View>
      </Page>

      {/* Content Pages */}
      <Page size="A4" style={isDark ? styles.pageDark : styles.pageLight}>
        <View style={isDark ? styles.headerDark : styles.headerLight} fixed>
          <Text style={isDark ? styles.titleDark : styles.titleLight}>BusinessOS Master Report</Text>
          <Text style={isDark ? styles.subtitleDark : styles.subtitleLight}>Generated on {dateStr} | Access Level: {activeRole}</Text>
        </View>

        {isOwner && (
          <View style={styles.section} wrap={false}>
            <Text style={isDark ? styles.sectionTitleDark : styles.sectionTitleLight}>1. Financial Summary</Text>
            <View style={isDark ? styles.cardDark : styles.cardLight}>
              <View style={isDark ? styles.rowDark : styles.rowLight}>
                <Text style={isDark ? styles.colLabelDark : styles.colLabelLight}>Cash Balance</Text>
                <Text style={isDark ? styles.colValueDark : styles.colValueLight}>${(businessData.financials?.cash_balance || 0).toLocaleString()}</Text>
              </View>
              <View style={isDark ? styles.rowDark : styles.rowLight}>
                <Text style={isDark ? styles.colLabelDark : styles.colLabelLight}>Monthly MRR</Text>
                <Text style={isDark ? styles.colValueDark : styles.colValueLight}>${(businessData.financials?.monthly_mrr || 0).toLocaleString()}</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={isDark ? styles.sectionTitleDark : styles.sectionTitleLight}>{isOwner ? '2' : '1'}. Sales Pipeline</Text>
          <View style={{ marginBottom: 10 }}>
            <Text style={{ fontSize: 10, color: isDark ? '#94a3b8' : '#64748b' }}>Total Active Pipeline: <Text style={{ color: isDark ? '#34d399' : '#10b981', fontWeight: 'bold' }}>${totalPipeline.toLocaleString()}</Text></Text>
          </View>
          <View style={isDark ? styles.tableHeaderDark : styles.tableHeaderLight}>
            <Text style={isDark ? styles.tableColIdDark : styles.tableColIdLight}>ID</Text>
            <Text style={isDark ? styles.tableColNameDark : styles.tableColNameLight}>Client</Text>
            <Text style={isDark ? styles.tableColStageDark : styles.tableColStageLight}>Stage</Text>
            <Text style={isDark ? styles.tableColValueDark : styles.tableColValueLight}>Value</Text>
          </View>
          {businessData.sales_pipeline?.deals?.map((deal, index) => (
            <View key={index} style={isDark ? styles.tableRowDark : styles.tableRowLight} wrap={false}>
              <Text style={isDark ? styles.tableColIdDark : styles.tableColIdLight}>{deal.id}</Text>
              <Text style={isDark ? styles.tableColNameDark : styles.tableColNameLight}>{deal.client || deal.name}</Text>
              <Text style={isDark ? styles.tableColStageDark : styles.tableColStageLight}>{deal.stage}</Text>
              <Text style={isDark ? styles.tableColValueDark : styles.tableColValueLight}>${deal.value.toLocaleString()}</Text>
            </View>
          ))}
        </View>

        {isManagerOrOwner && (
          <View style={styles.section}>
            <Text style={isDark ? styles.sectionTitleDark : styles.sectionTitleLight}>{isOwner ? '3' : '2'}. Market Intelligence</Text>
            {businessData.market_intelligence?.competitors?.map((comp, i) => (
              <View key={i} style={isDark ? styles.cardDark : styles.cardLight} wrap={false}>
                <Text style={styles.badgeYellow}>Moderate Threat</Text>
                <Text style={isDark ? styles.listTitleDark : styles.listTitleLight}>{comp.name}</Text>
                <Text style={isDark ? styles.listDescDark : styles.listDescLight}>Market Share: {comp.market_share}</Text>
                <Text style={isDark ? styles.listDescDark : styles.listDescLight}>Strengths: {comp.strengths}</Text>
                <Text style={isDark ? styles.listDescDark : styles.listDescLight}>Weaknesses: {comp.weaknesses}</Text>
              </View>
            ))}
          </View>
        )}

        {isManagerOrOwner && (
          <View style={styles.section}>
            <Text style={isDark ? styles.sectionTitleDark : styles.sectionTitleLight}>{isOwner ? '4' : '3'}. Compliance & Regulatory Risks</Text>
            {businessData.compliance?.regulatory_risks?.map((risk, i) => (
              <View key={i} style={{...(isDark ? styles.cardDark : styles.cardLight), borderLeft: risk.severity === 'High' ? '4px solid #ef4444' : '4px solid #f59e0b'}} wrap={false}>
                <Text style={risk.severity === 'High' ? styles.badgeRed : styles.badgeYellow}>{risk.severity} Risk</Text>
                <Text style={isDark ? styles.listTitleDark : styles.listTitleLight}>{risk.risk_area}</Text>
                <Text style={isDark ? styles.listDescDark : styles.listDescLight}>{risk.description}</Text>
                <Text style={isDark ? styles.listDescDark : styles.listDescLight}>Mitigation: {risk.mitigation}</Text>
              </View>
            ))}
          </View>
        )}

        {isManagerOrOwner && (
          <View style={styles.section}>
            <Text style={isDark ? styles.sectionTitleDark : styles.sectionTitleLight}>{isOwner ? '5' : '4'}. Integrations Hub</Text>
            {[
              { status: 'Healthy', name: 'Stripe', last_sync: '2 mins ago' },
              { status: 'Healthy', name: 'Salesforce', last_sync: '5 mins ago' },
              { status: 'Disconnected', name: 'Jira', last_sync: '2 days ago' }
            ].map((svc, i) => (
              <View key={i} style={isDark ? styles.cardDark : styles.cardLight} wrap={false}>
                <Text style={svc.status === 'Healthy' ? styles.badgeGreen : styles.badgeRed}>{svc.status}</Text>
                <Text style={isDark ? styles.listTitleDark : styles.listTitleLight}>{svc.name}</Text>
                <Text style={isDark ? styles.listDescDark : styles.listDescLight}>Last Sync: {svc.last_sync}</Text>
              </View>
            ))}
          </View>
        )}

        {isOwner && (
          <View style={styles.section}>
            <Text style={isDark ? styles.sectionTitleDark : styles.sectionTitleLight}>6. System Audit Logs</Text>
            <View style={isDark ? styles.tableHeaderDark : styles.tableHeaderLight}>
              <Text style={{ width: '25%', fontSize: 9, color: isDark ? '#94a3b8' : '#64748b' }}>Timestamp</Text>
              <Text style={{ width: '20%', fontSize: 9, color: isDark ? '#94a3b8' : '#64748b' }}>User</Text>
              <Text style={{ width: '55%', fontSize: 9, color: isDark ? '#94a3b8' : '#64748b' }}>Action</Text>
            </View>
            {[
              { timestamp: '2026-06-24 14:02', user: 'Sarah Jenkins', action: 'Exported Executive Report' },
              { timestamp: '2026-06-24 13:45', user: 'Mike Ross', action: 'Updated Pipeline Deal' },
              { timestamp: '2026-06-24 09:12', user: 'System', action: 'Daily Backup Completed' }
            ].map((log, index) => (
              <View key={index} style={isDark ? styles.tableRowDark : styles.tableRowLight} wrap={false}>
                <Text style={{ width: '25%', fontSize: 9, color: isDark ? '#cbd5e1' : '#475569' }}>{log.timestamp}</Text>
                <Text style={{ width: '20%', fontSize: 9, color: isDark ? '#f8fafc' : '#0f172a', fontWeight: 'bold' }}>{log.user}</Text>
                <Text style={{ width: '55%', fontSize: 9, color: isDark ? '#94a3b8' : '#334155' }}>{log.action}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={isDark ? styles.footerDark : styles.footerLight} fixed>
          <Text>BusinessOS Internal Document • Confidential</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
};

export default ExecutiveReportPDF;
