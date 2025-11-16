// src/components/ResumePDF.jsx
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
  Link,
  pdf,
} from "@react-pdf/renderer";

// Register Google Fonts (optional but beautiful)
Font.register({
  family: "Roboto",
  fonts: [
    { src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf" },
    { src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf", fontWeight: "bold" },
  ],
});

const createStyles = (template) => {
  const base = {
    page: { padding: 40, fontFamily: "Roboto", fontSize: 11, color: "#1a1a1a" },
    header: { marginBottom: 20, borderBottom: 2, borderColor: "#9333ea", paddingBottom: 10 },
    name: { fontSize: 28, fontWeight: "bold", color: "#9333ea" },
    contact: { fontSize: 10, color: "#555", marginTop: 4 },
    section: { marginTop: 16 },
    sectionTitle: { fontSize: 14, fontWeight: "bold", color: "#9333ea", marginBottom: 6 },
    text: { fontSize: 11, marginBottom: 4, lineHeight: 1.4 },
    bold: { fontWeight: "bold" },
    link: { color: "#9333ea", textDecoration: "none" },
    skillCategory: { marginBottom: 8 },
  };

  const templates = {
    ats: {
      ...base,
      page: { ...base.page, backgroundColor: "#fff" },
      name: { ...base.name, color: "#000" },
      sectionTitle: { ...base.sectionTitle, color: "#000", borderBottom: 1, borderColor: "#ccc" },
    },
    creative: {
      ...base,
      page: { ...base.page, backgroundColor: "#f8f9fa" },
      header: { ...base.header, backgroundColor: "#9333ea", color: "#fff", padding: 15, borderRadius: 8 },
      name: { ...base.name, color: "#fff" },
      contact: { ...base.contact, color: "#eee" },
      sectionTitle: { ...base.sectionTitle, color: "#9333ea" },
    },
    modern: {
      ...base,
      page: { ...base.page, backgroundColor: "#fff" },
      header: { ...base.header, flexDirection: "row", justifyContent: "space-between", borderBottom: 0 },
      name: { ...base.name, fontSize: 32, color: "#1a1a1a" },
      sectionTitle: { ...base.sectionTitle, backgroundColor: "#f1f3f5", padding: 6, borderRadius: 4 },
    },
    minimal: {
      ...base,
      page: { ...base.page, padding: 30 },
      name: { ...base.name, fontSize: 24, color: "#000" },
      sectionTitle: { ...base.sectionTitle, fontSize: 12, color: "#555", textTransform: "uppercase" },
    },
    sidebar: {
      ...base,
      page: { ...base.page, flexDirection: "row" },
      sidebar: { width: "35%", backgroundColor: "#2c3e50", color: "#fff", padding: 20 },
      main: { width: "65%", padding: 20 },
      name: { ...base.name, color: "#fff" },
      sectionTitle: { ...base.sectionTitle, color: "#fff", fontSize: 12 },
    },
  };

  return StyleSheet.create(templates[template] || templates.ats);
};

const ResumePDF = ({ data, template = "ats" }) => {
  const styles = createStyles(template);
  const isSidebar = template === "sidebar";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {isSidebar ? (
          <View style={{ flexDirection: "row" }}>
            {/* Sidebar */}
            <View style={styles.sidebar}>
              {data.profilePictureUrl && (
                <Image src={data.profilePictureUrl} style={{ width: 80, height: 80, borderRadius: 40, marginBottom: 16 }} />
              )}
              <Text style={styles.name}>{data.githubUsername}</Text>
              <Text style={styles.contact}>
                {data.contactInfo.email} • {data.contactInfo.mobile}
              </Text>
              {data.contactInfo.linkedin && (
                <Link src={data.contactInfo.linkedin} style={styles.link}>
                  LinkedIn
                </Link>
              )}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Skills</Text>
                {Object.entries(data.categorizedSkills || {}).map(([cat, skills]) => (
                  <View key={cat} style={{ marginBottom: 8 }}>
                    <Text style={{ fontWeight: "bold", color: "#fff" }}>{cat}</Text>
                    <Text style={{ fontSize: 9, color: "#ddd" }}>{skills.join(", ")}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Main */}
            <View style={styles.main}>
              <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 16 }}>{data.headline}</Text>
              {data.summary && <Text style={styles.text}>{data.summary}</Text>}

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Experience</Text>
                {data.experience?.items?.map((exp, i) => (
                  <View key={i} style={{ marginBottom: 12 }}>
                    <Text style={styles.bold}>{exp.title} - {exp.company}</Text>
                    <Text style={{ fontSize: 10, color: "#555" }}>{exp.dates}</Text>
                    <Text style={styles.text}>{exp.description}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Projects</Text>
                {data.projects?.items?.map((p, i) => (
                  <View key={i} style={{ marginBottom: 8 }}>
                    <Text style={styles.bold}>{p.name}</Text>
                    {p.html_url && <Link src={p.html_url} style={styles.link}>{p.html_url}</Link>}
                    <Text style={styles.text}>{p.description}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Education</Text>
                <Text style={styles.text}>{data.education}</Text>
              </View>
            </View>
          </View>
        ) : (
          <>
            {/* Normal Layout */}
            <View style={styles.header}>
              <Text style={styles.name}>{data.githubUsername}</Text>
              <Text style={styles.contact}>
                {data.contactInfo.email} • {data.contactInfo.mobile} • {data.contactInfo.linkedin}
              </Text>
            </View>

            {data.summary && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Summary</Text>
                <Text style={styles.text}>{data.summary}</Text>
              </View>
            )}

            {Object.keys(data.categorizedSkills || {}).length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Skills</Text>
                {Object.entries(data.categorizedSkills).map(([cat, skills]) => (
                  <View key={cat} style={styles.skillCategory}>
                    <Text style={styles.bold}>{cat}:</Text>
                    <Text style={styles.text}>{skills.join(", ")}</Text>
                  </View>
                ))}
              </View>
            )}

            {data.projects?.items?.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Projects</Text>
                {data.projects.items.map((p, i) => (
                  <View key={i} style={{ marginBottom: 12 }}>
                    <Text style={styles.bold}>{p.name}</Text>
                    {p.html_url && <Link src={p.html_url} style={styles.link}>{p.html_url}</Link>}
                    <Text style={styles.text}>{p.description}</Text>
                  </View>
                ))}
              </View>
            )}

            {data.experience?.items?.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Experience</Text>
                {data.experience.items.map((exp, i) => (
                  <View key={i} style={{ marginBottom: 12 }}>
                    <Text style={styles.bold}>{exp.title} - {exp.company}</Text>
                    <Text style={{ fontSize: 10, color: "#555" }}>{exp.dates}</Text>
                    <Text style={styles.text}>{exp.description}</Text>
                  </View>
                ))}
              </View>
            )}

            {data.education && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Education</Text>
                <Text style={styles.text}>{data.education}</Text>
              </View>
            )}
          </>
        )}
      </Page>
    </Document>
  );
};

export const generateRealPDF = async (data, template = "ats") => {
  const blob = await pdf(<ResumePDF data={data} template={template} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${data.githubUsername.replace(/\s+/g, "_")}_Resume.pdf`;
  a.click();
  window.open(url, "_blank");
  URL.revokeObjectURL(url);
};

export default ResumePDF;