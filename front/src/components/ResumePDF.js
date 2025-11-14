import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// ── ATS-Safe, Minimal & Sleek Styles ─────────────────────────────────────
const styles = StyleSheet.create({
  page: {
    paddingTop: 55,
    paddingBottom: 55,
    paddingHorizontal: 60,
    fontFamily: 'Helvetica',
    fontSize: 11,
    lineHeight: 1.5,
    color: '#000000',
  },

  // ── Header ──
  name: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 28,
    marginBottom: 6,
    textAlign: 'center',
    color: '#000000',
  },
  contact: {
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 16,
    color: '#333333',
  },

  // ── Section Titles ──
  sectionTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
    marginTop: 12,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    paddingBottom: 2,
  },

  // ── Body Text ──
  text: {
    fontSize: 11,
    marginBottom: 2,
  },
  bold: {
    fontFamily: 'Helvetica-Bold',
  },

  // ── Lists (Skills, Certifications) ──
  listItem: {
    fontSize: 11,
    marginLeft: 12,
    marginBottom: 1,
  },

  // ── Project / Experience Entry ──
  entry: {
    marginBottom: 10,
  },
  entryTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    marginBottom: 1,
  },
  entryMeta: {
    fontSize: 10,
    color: '#444444',
    marginBottom: 2,
  },
  bullet: {
    marginLeft: 12,
    fontSize: 11,
    marginBottom: 2,
  },
});

// ── Helper: Join array or fallback ───────────────────────────────────────
const format = (val) => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return val.join(' • ');
  return val.content || '';
};

const ResumePDF = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* ── Header ── */}
      <View>
        <Text style={styles.name}>{data.name || 'Your Name'}</Text>
        <Text style={styles.contact}>
          {[
            data.contactInfo?.email,
            data.contactInfo?.phone,
            data.contactInfo?.location,
            data.contactInfo?.linkedin,
            data.contactInfo?.github,
          ]
            .filter(Boolean)
            .join('  |  ')}
        </Text>
      </View>

      {/* ── Professional Summary ── */}
      {data.summary && (
        <View>
          <Text style={styles.sectionTitle}>Summary</Text>
          <Text style={styles.text}>{format(data.summary)}</Text>
        </View>
      )}

      {/* ── Skills ── */}
      {data.skills?.items?.length > 0 && (
        <View>
          <Text style={styles.sectionTitle}>Skills</Text>
          <Text style={styles.text}>{data.skills.items.join(' • ')}</Text>
        </View>
      )}

      {/* ── Projects ── */}
      {data.projects?.items?.length > 0 && (
        <View>
          <Text style={styles.sectionTitle}>Projects</Text>
          {data.projects.items.map((p, i) => (
            <View key={i} style={styles.entry}>
              <Text style={styles.entryTitle}>
                {p.name}
                {p.stars ? ` (${p.stars}★)` : ''}
              </Text>
              {p.technologies?.length > 0 && (
                <Text style={styles.entryMeta}>
                  {p.technologies.join(' • ')}
                </Text>
              )}
              {p.description?.split('\n').map((line, idx) => (
                <Text key={idx} style={styles.bullet}>• {line.trim()}</Text>
              ))}
            </View>
          ))}
        </View>
      )}

      {/* ── Experience ── */}
      {data.experience?.items?.length > 0 && (
        <View>
          <Text style={styles.sectionTitle}>Experience</Text>
          {data.experience.items.map((e, i) => (
            <View key={i} style={styles.entry}>
              <Text style={styles.entryTitle}>{e.title}</Text>
              {e.company && <Text style={styles.entryMeta}>{e.company} | {e.duration}</Text>}
              {e.description?.split('\n').map((line, idx) => (
                <Text key={idx} style={styles.bullet}>• {line.trim()}</Text>
              ))}
            </View>
          ))}
        </View>
      )}

      {/* ── Education ── */}
      {data.education && (
        <View>
          <Text style={styles.sectionTitle}>Education</Text>
          <Text style={styles.text}>{format(data.education)}</Text>
        </View>
      )}

      {/* ── Certifications ── */}
      {data.certifications?.items?.length > 0 && (
        <View>
          <Text style={styles.sectionTitle}>Certifications</Text>
          <Text style={styles.text}>{data.certifications.items.join(' • ')}</Text>
        </View>
      )}
    </Page>
  </Document>
);

export default ResumePDF;