import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Register fonts if needed
// Font.register({
//   family: 'Open Sans',
//   src: 'path-to-font-file'
// });

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF'
  },
  section: {
    marginBottom: 15,
    borderBottom: '1pt solid #EEEEEE',
    paddingBottom: 10
  },
  heading: {
    fontSize: 24,
    marginBottom: 15,
    fontWeight: 'bold',
    color: '#2C3E50',
    textTransform: 'uppercase',
    textAlign: 'center'
  },
  subheading: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: 'bold',
    color: '#34495E',
    textTransform: 'uppercase'
  },
  text: {
    fontSize: 11,
    lineHeight: 1.6,
    color: '#2C3E50',
    marginBottom: 3
  },
  link: {
    color: '#3498DB',
    textDecoration: 'underline'
  },
  contactInfo: {
    fontSize: 11,
    color: '#7F8C8D',
    marginBottom: 20,
    textAlign: 'center'
  },
  projectTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
    color: '#2980B9'
  }
});

const ResumePDF = ({ data }) => {
  // Helper function to format content
  const formatContent = (content) => {
    if (!content) return '';
    if (typeof content === 'string') return content;
    if (content.items && Array.isArray(content.items)) {
      return content.items.join(', ');
    }
    return content.content || '';
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.section}>
          <Text style={styles.heading}>{data.name || 'Resume'}</Text>
          {data.contactInfo && (
            <Text style={styles.text}>
              {data.contactInfo.email && `Email: ${data.contactInfo.email}\n`}
              {data.contactInfo.phone && `Phone: ${data.contactInfo.phone}\n`}
              {data.contactInfo.location && `Location: ${data.contactInfo.location}`}
            </Text>
          )}
        </View>

        {/* Summary */}
        {data.summary && (
          <View style={styles.section}>
            <Text style={styles.subheading}>Professional Summary</Text>
            <Text style={styles.text}>{formatContent(data.summary)}</Text>
          </View>
        )}

        {/* Skills */}
        {data.skills && data.skills.items && data.skills.items.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.subheading}>Skills</Text>
            <Text style={styles.text}>{data.skills.items.join(', ')}</Text>
          </View>
        )}

        {/* Projects */}
        {data.projects && data.projects.items && data.projects.items.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.subheading}>Projects</Text>
            {data.projects.items.map((project, index) => (
              <View key={index} style={{ marginBottom: 5 }}>
                <Text style={[styles.text, { fontWeight: 'bold' }]}>
                  {project.name}
                  {project.stars ? ` (${project.stars} ★)` : ''}
                </Text>
                <Text style={styles.text}>{project.description || ''}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Experience */}
        {data.experience && data.experience.items && data.experience.items.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.subheading}>Experience</Text>
            {data.experience.items.map((exp, index) => (
              <View key={index} style={{ marginBottom: 5 }}>
                <Text style={[styles.text, { fontWeight: 'bold' }]}>{exp.title}</Text>
                <Text style={styles.text}>{exp.description}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {data.education && (
          <View style={styles.section}>
            <Text style={styles.subheading}>Education</Text>
            <Text style={styles.text}>{formatContent(data.education)}</Text>
          </View>
        )}

        {/* Certifications */}
        {data.certifications && data.certifications.items && data.certifications.items.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.subheading}>Certifications</Text>
            <Text style={styles.text}>{data.certifications.items.join(', ')}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
};

export default ResumePDF;