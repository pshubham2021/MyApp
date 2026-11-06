package com.personal.website.resume;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public record ResumeData(
        @NotBlank @Size(max = 120) String name,
        @NotBlank @Size(max = 160) String headline,
        @Size(max = 254) @Email String email,
        @Size(max = 60) String phone,
        @Size(max = 200) String address,
        @Size(max = 120) String location,
        @Size(max = 2000) @SafeUrl String website,
        @Size(max = 2000) @SafeUrl String linkedin,
        @Size(max = 2000) @SafeUrl String github,
        @Size(max = 3000) String summary,
        @Size(max = 300) @Pattern(regexp = "^$|^/uploads/[A-Za-z0-9-]+\\.(?i:png|jpe?g|webp)$")
        String photoUrl,
        @NotNull @Size(max = 60) List<@NotBlank @Size(max = 80) String> skills,
        @NotNull @Size(max = 30) List<@NotNull @Valid Experience> experience,
        @NotNull @Size(max = 30) List<@NotNull @Valid Education> education,
        @NotNull @Size(max = 30) List<@NotNull @Valid Project> projects,
        @NotNull @Size(max = 30) List<@NotNull @Valid Certification> certifications,
        @NotNull @Size(max = 30) List<@NotNull @Valid Language> languages) {

    public static ResumeData initial() {
        return new ResumeData(
                "Shubham Prajapati",
                "Project Engineer @Wipro | Full Stack Engineer | Java & Spring Boot | "
                        + "Cloud-Native & DevOps (K8s, Docker, Jenkins, Ansible) | ReactJS / AngularJS",
                "shubhampjpt87@gmail.com",
                "+917081659903",
                "Salempur, Deoria, Uttar Pradesh",
                "Noida, Uttar Pradesh, India",
                "",
                "https://www.linkedin.com/in/shubhamprajapati-abc2020",
                "",
                "Accomplished developer with a B.Tech in Information Technology and experience resolving "
                        + "complex application and architectural challenges. Builds full-stack applications "
                        + "with modern technologies and applies DevOps practices to deployment and maintenance. "
                        + "Core competencies include Java, Python, C, JavaScript, React, Angular, Node.js, "
                        + "Express, EJS, MySQL, MongoDB, PAM, Active Directory, CyberArk, SailPoint, Jira, "
                        + "ServiceNow (SNOW), and Agile delivery. Currently strengthening expertise in "
                        + "Spring Boot, Spring MVC, and AWS to build scalable, cloud-native solutions.",
                "",
                List.of(
                        "CI/CD and deployment activities",
                        "Application support, defect/enhancement, and production issue resolution",
                        "Core Java, Spring Boot, and Spring MVC",
                        "Java, Python, C, and JavaScript",
                        "React, Angular, Node.js, Express, and EJS",
                        "MySQL and MongoDB",
                        "PAM, Active Directory, CyberArk, and SailPoint",
                        "Jira, ServiceNow (SNOW), and Agile"
                ),
                List.of(
                        new Experience(
                                "Project Engineer - Developer Full Stack Java - ReactJS",
                                "Wipro", "Noida, Uttar Pradesh, India", "November 2024", "Present",
                                "Develop and support full-stack applications using Java, Spring technologies, "
                                        + "and ReactJS.\nContribute to application support, enhancements, defect resolution, "
                                        + "and production issue troubleshooting.\nSupport CI/CD and deployment activities "
                                        + "across cloud-native and DevOps workflows."),
                        new Experience(
                                "Project Engineer - Cyber Security - IDAM",
                                "Wipro", "India", "June 2024", "October 2024",
                                "Worked on identity and access management (IDAM) and cybersecurity activities."),
                        new Experience(
                                "Python Intern",
                                "National Institute of Electronics & Information Technology (NIELIT)",
                                "Gorakhpur, Uttar Pradesh", "June 2019", "July 2019",
                                "Developed Python skills and created a Student Management System mini-project "
                                        + "with add, view, search, and remove student functions.")
                ),
                List.of(new Education(
                        "B.Tech, Information Technology",
                        "Greater Noida Institute of Technology (GNIOT)",
                        "Greater Noida, Uttar Pradesh",
                        "2018", "2022", "")),
                List.of(new Project(
                        "Student Management System",
                        "Python mini-project with add, view, search, and remove student functions.",
                        "Python",
                        "https://github.com/pshubham2021/StudentManagementSyatem-PythonEducation")),
                List.of(
                        new Certification("Learning Java", "", ""),
                        new Certification("Programming Foundations: Fundamentals", "", ""),
                        new Certification("CSS Essential Training", "", ""),
                        new Certification("Programming Foundations: Databases", "", ""),
                        new Certification("HTML Essential Training", "", "")
                ),
                List.of()
        );
    }

    public record Experience(
            @NotBlank @Size(max = 160) String role,
            @Size(max = 160) String company,
            @Size(max = 120) String location,
            @Size(max = 80) String startDate,
            @Size(max = 80) String endDate,
            @Size(max = 3000) String description) {
    }

    public record Education(
            @NotBlank @Size(max = 200) String degree,
            @Size(max = 200) String institution,
            @Size(max = 120) String location,
            @Size(max = 80) String startDate,
            @Size(max = 80) String endDate,
            @Size(max = 2000) String details) {
    }

    public record Project(
            @NotBlank @Size(max = 160) String name,
            @Size(max = 2000) String description,
            @Size(max = 200) String technologies,
            @Size(max = 2000) @SafeUrl String url) {
    }

    public record Certification(
            @NotBlank @Size(max = 200) String name,
            @Size(max = 200) String issuer,
            @Size(max = 80) String date) {
    }

    public record Language(
            @NotBlank @Size(max = 100) String name,
            @Size(max = 100) String proficiency) {
    }
}
